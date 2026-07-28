---
name: "LayerZero"
category: "bridges"
stage: 0
website: "https://layerzero.network"
chains: ["ethereum", "arbitrum", "optimism", "base", "polygon", "bnb-chain", "avalanche", "solana", "starknet", "linea", "scroll", "zksync", "blast", "mode", "mantle", "fantom"]
tvl: "$6.72B"
lastUpdated: "2026-05-23"
risks:
  upgradeability: "immutable"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "extensive"
  externalDependencies: "centralized"
  trackRecord: "4+ years, April 2026 KelpDAO incident ($292M, DVN compromise via LayerZero Labs RPC infrastructure)"
---

# LayerZero Risk Assessment

## Overview

LayerZero is a generic cross-chain messaging protocol that powers the OFT (Omnichain Fungible Token) standard, Stargate Finance, and 700+ other tokens including USDT0 and PYUSD. While LayerZero is technically a messaging layer rather than a token bridge, end users move value through it via OApp/OFT contracts, and the protocol's verification model is what secures those transfers.

The protocol launched V1 in 2022 and re-architected as **V2** in January 2024, introducing the modular **Endpoint + MessageLib + DVNs + Executor** design. LayerZero markets itself as "trust-configurable" — each application (OApp) chooses its own Decentralized Verifier Network (DVN) set, required-DVN threshold, message library, and executor. This is the core marketing claim and also the locus of LayerZero's largest real-world failure: the **April 2026 KelpDAO incident**, in which Lazarus Group compromised LayerZero Labs' internal RPC infrastructure, caused LayerZero's default DVN to sign forged messages, and stole **~$292M** from rsETH holders who had configured a 1-of-1 LayerZero Labs DVN. Roughly **47% of active OApps** were running 1-of-1 DVN configurations at the time of the incident.

## Smart Contract Risk

**Contract Architecture:**

LayerZero V2's on-chain surface consists of:

- **EndpointV2** — immutable per-chain contract; routes packets to the configured MessageLib for each OApp. Defines the OApp interface (`send`, `lzReceive`, `verify`). The V1 Ethereum Endpoint at `0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675` is also immutable. Live address tables are served dynamically at `metadata.layerzero-api.com/v1/metadata/deployments`.
- **SendUln302 / ReceiveUln302** — the V2 "Ultra Light Node 302" message libraries that handle verification logic. These are registered as the *default* lib but can be replaced per-OApp by the OApp owner. LayerZero Labs can also register new default libraries.
- **ExecutorV2** — off-chain worker that calls `lzReceive` on the destination after DVN verification.
- **DVN contracts** — one per provider per chain (LayerZero Labs DVN, Google Cloud DVN, Polyhedra zkLightClient, Nethermind, Animoca-Blockdaemon, Horizen Labs, Nocturnal Labs, and 50+ others).

**Upgrade Mechanism:**

The Endpoint contracts are **immutable**. There is no proxy pattern and no upgrade path on the core Endpoint. However, the *security configuration* an OApp uses — which MessageLib, which DVNs, what thresholds — is mutable and is controlled by the OApp owner. Crucially, the **defaults** applied to OApps that have never set their own configuration are controlled by the **LayerZero Labs Multisig** and can be updated at will. There is no public on-chain timelock on these default-config changes.

**Code Quality:**

- **Zellic** — V2 core, OApp/OFT, Stargate, Solana Examples, Starknet Endpoint V2 (May 2024, Sept 2025)
- **Dedaub** — LayerZero DVN AVS (May 2025)
- **ChainSecurity** — V2 audit
- **Code4rena** — Stellar Endpoint public competition (April 2026)
- **Sherlock** — engaged H2 2025
- Marketing claims "30+ audits" including Trail of Bits, OpenZeppelin, Halborn, and Spearbit — though specific public reports for several of these are harder to enumerate than Zellic's
- Open source: `github.com/LayerZero-Labs/LayerZero-v2`
- **Immunefi bug bounty: $15,000,000 max payout** — historically the largest in crypto. Critical V1 findings receive $250,000 minimum or 10% of value-at-risk

**Attack Surface:**

- The Endpoint is immutable but is not the trust surface — verification correctness lives in the DVN set chosen by each OApp.
- A 1-of-1 LayerZero Labs DVN configuration reduces security to trusting LayerZero Labs' off-chain key management and RPC infrastructure. This was the direct cause of the April 2026 KelpDAO loss.
- DVNs in the canonical V2 design are **not bonded with slashing**. An EigenLayer-secured DVN AVS exists as a separate add-on (audited by Dedaub May 2025) but is opt-in per OApp.
- LayerZero operates an off-chain "pre-crime" simulation that re-executes destination transactions before broadcast, but this is operated by LayerZero Labs and is not a substitute for on-chain verification.

## Admin/Governance Risk

**Governance Structure:**

- **Endpoint contracts**: immutable, no admin keys for upgrades.
- **Default Send/Receive library and default DVN/executor configuration**: owned by the **LayerZero Labs Multisig** per LayerZero documentation. Exact signer set, threshold, and on-chain address of this multisig are **not publicly pinned** in the manner of Aave Governance or comparable DAOs.
- **No on-chain timelock** on default-config changes per public documentation. LayerZero Labs can rotate the default security stack at any time, silently changing the verification model for every OApp that has not explicitly pinned its config.
- **ZRO token** (launched June 20, 2024) has **no on-chain governance role** over Endpoint contracts. ZRO is a fee/payment asset and an ecosystem-incentives token.
- **LayerZero Foundation** controls ecosystem grants and ZRO airdrop distribution; it does not function as a token-holder governance body controlling protocol contracts.

**Key Controls:**

The LayerZero Labs Multisig can — without any on-chain timelock:

- Change the default MessageLib applied to every OApp that has not pinned its config
- Change the default DVN set, required-DVN list, and optional-DVN threshold for those OApps
- Change the default Executor
- Register and deprecate libraries

Because most OApps inherit defaults rather than pinning their own configuration, this multisig effectively controls the verification logic for a large fraction of LayerZero traffic.

**Trust Assumptions:**

- A security concern raised in community write-ups around the rsETH incident is that **production LayerZero Labs multisig signers were observed using the same keys for personal activity** (memecoin trading, bridging from those addresses) — i.e., operational-security exposure of the keys controlling default config.
- LayerZero (the company) has unilateral ability to change defaults inherited by hundreds of OApps with no warning window.
- Post-incident, LayerZero **banned signing messages for any 1-of-1 OApp**, demonstrating the operational power LayerZero Labs holds over OApps' liveness.

## External Dependencies

**Verification (DVNs):**

DVNs are the verification surface. Major providers include LayerZero Labs, Google Cloud, Polyhedra (zkLightClient), Nethermind, Animoca-Blockdaemon, Horizen Labs, and Nocturnal Labs. In the canonical V2 design:

- DVN operation is **permissionless to register** but DVNs are **not bonded with slashing**
- A malicious or compromised DVN that an OApp relies on can authorize fraudulent messages with no economic penalty
- The DVN AVS variant (EigenLayer-secured) is opt-in and not the default

**Executors:**

Permissionless to register, but OApps default to LayerZero Labs' executor. Executors affect *liveness* but not *correctness* (they cannot forge a message that DVNs have not signed). The December 2024 Stargate outage was caused by an executor error, halting transfers for ~6 hours.

**RPC Infrastructure:**

Per the KelpDAO post-mortem, DVN nodes' truthfulness depends on the RPC endpoints they query for source-chain state. Lazarus Group exploited exactly this: they compromised LayerZero Labs' internal RPC nodes while DDoSing external nodes, causing the DVN to sign forged messages based on poisoned chain state.

**Overall Rating Justification:**

The default verification stack reduces to trusting LayerZero Labs' off-chain key management, RPC infrastructure, and operational security — all of which have been compromised in production within the assessment window. DVNs are not bonded. The multisig controlling defaults has no public on-chain timelock and (per public reports) has had key-hygiene incidents. This is the definition of a `centralized` external dependency rating. OApps that explicitly configure a diverse, multi-DVN required set escape this rating individually, but the *protocol-level* assessment must reflect the default trust assumptions actually inherited by ~47% of active OApps as of April 2026.

## Economic Risk

**Liquidity Risk:**

LayerZero itself does not custody user funds — token transfers happen through OApp/OFT contracts (Stargate, USDT0, PYUSD, etc.), each of which holds liquidity on its own contracts. LayerZero's marketing cites **$166.9B in cumulative OFT volume** and **150M+ messages routed** across 150+ chains. DefiLlama bridge tracker reports cumulative volume in the same order of magnitude. Risk concentration therefore exists at the OApp level, not the LayerZero Endpoint level — but every OApp inherits LayerZero's verification trust assumptions.

**Operational History:**

- V1 mainnet: 2022
- V2 mainnet: January 2024
- ZRO token launch: June 20, 2024 (with the controversial "Proof-of-Donation" claim mechanism that required a $0.10/ZRO donation to Protocol Guild; 803,273 wallets / 59% removed as Sybils)
- **Stargate DVN outage: December 2024** — ~6 hours of halted transfers, ~25,600 stuck transactions, no funds lost
- **KelpDAO / rsETH exploit: April 2026 — ~$292M stolen.** Lazarus Group compromised LayerZero Labs' internal RPC nodes and DDoSed external nodes, causing the default LayerZero Labs DVN to sign forged messages. Worked because Kelp configured a 1-of-1 LayerZero Labs DVN. Triggered ~$13.4B in DeFi TVL outflows over 48 hours and $8.45B in Aave outflows. LayerZero attributed fault to Kelp's configuration; Kelp claimed LayerZero personnel had approved the setup and that LayerZero documentation presented 1-of-1 as a normal default.

## Stage Assessment

**Stage 0 Criteria:**

- ✓ Immutable Endpoint contracts — no proxy, no upgrade path on the V1 or V2 Endpoint
- ✓ Extensive audits — Zellic (multiple), Dedaub, ChainSecurity, Code4rena, Sherlock, plus marketing-claimed coverage from Trail of Bits, OpenZeppelin, Halborn, Spearbit. $15M Immunefi bug bounty (largest in crypto).
- ✓ 4+ years in production with very high cumulative volume
- ✗ Fund access **possible** — the default LayerZero Labs DVN can authorize fraudulent messages, as demonstrated in the April 2026 KelpDAO incident; ~47% of OApps inherit this default
- ✗ External dependencies **centralized** — DVNs are not bonded; defaults reduce to trusting LayerZero Labs' off-chain RPC and key management
- ✗ Admin control is a **weak/undocumented multisig** — LayerZero Labs Multisig controls all default config with no public on-chain timelock; signer set and threshold are not publicly pinned; reported key-hygiene exposure (signers using production keys for personal activity)
- ✗ Recent unresolved core exploit pattern — April 2026 $292M loss was a direct consequence of the default verification model, not a single isolated bug

**Why Not Stage 1:**

Stage 1 requires fund access to be `restricted` (no direct drain) and admin powers to be scoped through a 3-of-5+ diverse multisig with ≥48h timelock on critical changes. LayerZero's default verification stack allowed direct forging of messages that drained $292M in April 2026 — `fundAccess: possible` is empirically demonstrated, not theoretical. The LayerZero Labs Multisig also has no on-chain timelock on default-config changes and its composition is not publicly documented in a comparable manner to Stage 1 protocols. Both of these are independent Stage 1 blockers.

**Why Not Stage 2:**

Default DVN trust model collapses to trusting LayerZero Labs' off-chain infrastructure; no decentralized governance over default config; recent core fund-loss event tied to the default verification path.

**Justification:**

LayerZero earns Stage 0 because the verification model that secures the majority of OApps reduces, in practice, to trusting LayerZero Labs' off-chain RPC nodes and multisig key custody — and that trust was broken in April 2026 to the tune of $292M. The immutable Endpoint and $15M bug bounty are real positives, but they do not address the gating question: *can user funds be taken without consent?* The answer is **yes, demonstrably, within the assessment window**, for any OApp that inherits the LayerZero Labs default DVN. The risk varies meaningfully per integrating OApp — an OApp with a diverse N-of-M required-DVN set (LayerZero Labs + Google Cloud + Polyhedra, threshold 3) is in a materially different security position than a 1-of-1 OApp. This assessment evaluates the protocol's *default trust assumptions* as inherited by users.

## Links

- [Official Website](https://layerzero.network)
- [Documentation](https://docs.layerzero.network/v2)
- [Deployed Contracts](https://docs.layerzero.network/v2/deployments/deployed-contracts)
- [Security Stack & DVNs](https://docs.layerzero.network/v2/concepts/modular-security/security-stack-dvns)
- [V1 Endpoint (Ethereum)](https://etherscan.io/address/0x66a71dcef29a0ffbdbe3c6a460a3b5bc225cd675)
- [GitHub (LayerZero V2)](https://github.com/LayerZero-Labs/LayerZero-v2)
- [Bug Bounty (Immunefi)](https://immunefi.com/bug-bounty/layerzero/)
- [DefiLlama Bridge Tracker](https://defillama.com/bridge/layerzero)
- [Zellic Audit Reports](https://github.com/Zellic/publications)
- [LayerZero Post-Incident Statement](https://layerzero.network/blog/an-overdue-apology)
- [Chainalysis KelpDAO Report (April 2026)](https://www.chainalysis.com/blog/kelpdao-bridge-exploit-april-2026/)
- [Security Alliance: Initial Takeaways on LayerZero DVN Incident](https://radar.securityalliance.org/initial-takeaways-layerzero-dvn-incident/)
