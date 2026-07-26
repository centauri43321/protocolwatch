---
name: "Aerodrome"
category: "dexes"
stage: 2
website: "https://aerodrome.finance"
chains: ["base"]
tvl: "$363M"
lastUpdated: "2026-05-23"
risks:
  upgradeability: "immutable"
  adminControl: "governance"
  fundAccess: "impossible"
  audits: "multiple"
  externalDependencies: "none"
  trackRecord: "2+ years, November 21 2025 NameSilo DNS hijack (combined Aerodrome+Velodrome user losses ~$700K-$1M via phishing approvals; smart contracts unaffected)"
---

# Aerodrome Risk Assessment

## Overview

Aerodrome Finance is the dominant decentralized exchange and liquidity hub on Base (Coinbase's L2), built by Dromos Labs — the same pseudonymous team behind Velodrome Finance on Optimism. It is a direct fork of Velodrome V2, a ve(3,3) AMM that combines elements of Curve, Convex, and Uniswap. In April 2024, Aerodrome added **Slipstream**, a concentrated liquidity module forked from Uniswap V3 core (under BUSL-1.1).

Launched August 28, 2023, Aerodrome rapidly grew to dominate Base's DeFi ecosystem and has processed over **$185B in cumulative trading volume** with cumulative fees exceeding **$270M**. TVL currently sits at roughly **$363M**, down from a peak above $1.5B in late 2024. The ve(3,3) model routes 100% of protocol trading fees to veAERO holders who vote on gauge emissions each epoch. In November 2025, Dromos Labs announced a merger with Velodrome into a unified "Aero" platform on the METADEX03 stack — Q2 2026 launch targeted for Base and the Optimism Superchain, with planned expansion to Ethereum mainnet and Circle's Arc. As of the assessment date, the unified Aero has not yet launched (audits underway since April 2026), and Aerodrome remains Base-only with its existing contracts in use.

## Smart Contract Risk

**Contract Architecture:**
- Core AMM pool contracts are **immutable** — deployed pools have no proxy and cannot be upgraded or modified.
- Slipstream concentrated liquidity pools are deployed per-pair as immutable contracts via the CLFactory (same pattern as Uniswap V3).
- Factory contracts (PoolFactory, GaugeFactory, VotingRewardsFactory) sit behind a FactoryRegistry that can approve new factory combinations — **existing pools and user funds remain in their original immutable contracts**; any factory upgrade affects only newly created pools, never existing deposits. Migration is always opt-in.
- veNFT art proxy handles cosmetic rendering only — no financial logic.
- `PERMISSIONS.md` explicitly states: *"Code is immutable so timelock is not required"* and codifies that contract-to-contract permissions (Minter ↔ Voter ↔ VotingEscrow) cannot change.
- Key contracts on Base (verified via BaseScan):
  - AERO Token: `0x940181a94A35A4569E4529A3CDfB74e38FD98631`
  - Router: `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43`
  - Voter: `0x16613524e02ad97eDfeF371bC883F2F5d6C480A5`
  - Minter: `0xeB018363F0a9Af8f91F06FEe6613a751b2A33FE5`
  - PoolFactory (xy=k + stable): `0x420DD381b31aEf6683db6B902084cB0FFECe40Da`
  - FactoryRegistry: `0x5C3F18F06CC09CA1910767A34a20F771039E37C0`
  - Protocol Team multisig: `0xE6A41fE61E7a1996B59d508661e3f524d6A32075`
  - Emergency Council multisig: `0x99249b10593fCa1Ae9DAE6D4819F1A6dae5C013D`

**Code Quality:**
- Velodrome V2 codebase (from which Aerodrome is directly forked) audited by **Spearbit** and **ChainSecurity**.
- **EtherAuthority** audit of the Aerodrome-specific AERO token deltas (2023): 0 critical/high/medium findings, 1 low, 2 informational.
- **ChainSecurity** audit of the Velodrome Superchain Slipstream variant — this covers the same Slipstream code path used on Aerodrome.
- No tier-1 firm has published an Aerodrome-branded report specifically on Slipstream; reliance is on the Velodrome Superchain Slipstream audit which shares the codebase.
- Open source on GitHub (`aerodrome-finance/contracts`, `aerodrome-finance/slipstream`).
- No active Immunefi-listed bug bounty program could be located for Aerodrome.
- No formal verification disclosed.

**Attack Surface:**
- Core pool contracts are immutable — no admin upgrade vector exists for existing deposits.
- No flash-loan vulnerability in the core AMM (standard xy=k and concentrated liquidity designs).
- Factory upgradeability means future pools could run different code, but existing liquidity is unaffected.
- Two front-end / DNS hijacking incidents (November 2023, November 21 2025) — smart contracts not involved in either.

## Admin/Governance Risk

**Governance Structure:**
- AERO is the governance/reward token with epoch-based inflationary emissions.
- Holders lock AERO for up to 4 years to receive **veAERO** (ERC-721 NFT, non-transferable voting power): 1-year lock = 25% voting power, 4-year lock = 100%.
- **ProtocolGovernor** (modified OpenZeppelin Governor): handles token whitelisting, emission parameter updates, managed veNFT creation. Includes a Vetoer role as a backstop against 51% governance attacks.
- **EpochGovernor**: minimal contract used exclusively to adjust tail emissions by ±1 basis point per epoch once the tail threshold is reached.
- **Emergency Council**: multisig at `0x99249b1...013D` with narrowly scoped emergency powers; threshold and signer identities are not publicly documented.
- **Vetoer** role is still held by the Protocol Team multisig; `PERMISSIONS.md` notes it is "to be renounced later" but renouncement has not occurred as of the assessment date.

**Key Controls — mapped to fund impact:**

| Role | Powers | Can it touch existing user funds? |
|------|--------|-----------------------------------|
| Protocol Team multisig | Fee parameter, factory approval via FactoryRegistry, AllowedManager, holds Vetoer | **No** — cannot withdraw or block withdrawals from existing pools |
| Emergency Council | Kill / revive gauges, deactivate managed NFTs, set pool name/symbol | **No** — kill gauge halts new emissions; pool swaps and LP withdrawals continue unaffected |
| ProtocolGovernor | Token whitelist, minting parameter updates, managed veNFT creation | **No** — no path to existing pool liquidity |
| FactoryRegistry owner | Approve new pool/gauge/reward factory combinations | **No** — affects future pools only; existing pool contracts cannot be replaced |
| Vetoer | Veto governance proposals as a 51%-attack backstop | **No** — no fund access |

- No on-chain timelock exists between governance execution and effect; `PERMISSIONS.md` argues immutability of pools makes a timelock unnecessary, which is consistent with the framework's "impossible fund access" allowance.
- No admin function exists to withdraw user liquidity from any pool.
- No emergency pause mechanism on core swap or withdrawal functionality. Pause on v2-style pools (held by Protocol Team) halts swaps only; LP burns and transfers remain permissionless.

**Trust Assumptions:**
- Governance cannot drain user funds from AMM pools regardless of proposal outcome — the contracts are immutable.
- Factory upgrades affect only newly created pools — existing pool liquidity sits in immutable contracts and is not migratable by any privileged action.
- If the Emergency Council is compromised, gauges could be killed (halting emissions) but user principal is not at risk.
- The undisclosed Emergency Council composition and the still-held Vetoer role are caveats: users implicitly trust the Dromos team's operational security against governance griefing, but the team cannot seize funds in either case.
- veAERO voting power is concentrated among large lockers; short-term governance capture is a theoretical risk to emissions and gauge weights, not to deposited liquidity.

## External Dependencies

**Oracle System:**
- No external price oracles (no Chainlink, no off-chain feeds).
- Slipstream (concentrated liquidity) pools use an **internal TWAP oracle** — identical in design to Uniswap V3's on-chain oracle mechanism.
- Classic AMM pools use the standard xy=k or stable curve price discovery — no oracle dependency.
- Aerodrome's TWAP oracles are used by other Base ecosystem lending protocols as price sources, but this is downstream consumption, not an Aerodrome dependency.

**Off-Chain Actors:**
- No keepers or relayers are required for core swap, liquidity, or withdrawal operations.
- Epoch transitions, gauge weight votes, veAERO locking, voting, and fee claiming are all permissionless on-chain transactions — anyone can call.
- Managed veNFT autocompounding (opt-in via the AllowedManager role) uses off-chain operators, but this is a peripheral feature and does not affect user-deposited LP funds.
- Base's sequencer is operated by Coinbase — a Base-level (not Aerodrome-level) trust assumption that applies equally to every protocol on the chain.

**Overall Rating Justification:**
**Self-contained.** Aerodrome has no external dependencies for core protocol functionality: price discovery is handled entirely on-chain through the AMM invariant and Slipstream's internal TWAP oracle. No oracle feeds, keepers, relayers, or off-chain sequencers are required for swaps, liquidity provision, or withdrawals. The dominant centralization vector visible to users is the web front-end (DNS / domain registrar), not the contracts — users who interact directly with the immutable pool contracts face no external-dependency risk.

## Economic Risk

**Liquidity Risk:**
- ~$363M TVL as of 2026-05-23; peaked above $1.5B in late 2024.
- Roughly half of all DEX volume on Base routes through Aerodrome.
- Liquidity is incentivized through epoch-based gauge emissions voted on by veAERO holders.
- 30-day DEX volume: $13.3B. Annualized fees: $96.8M; annualized revenue: $48.6M (100% to veAERO).
- The ve(3,3) flywheel can create mercenary liquidity dynamics if incentive alignment breaks.

**Operational History:**
- Launched August 28, 2023 — **2+ years in production**.
- Over $185B cumulative trading volume; over $270M cumulative swap fees.
- **Zero on-chain smart-contract exploits.**
- November 2023: DNS / front-end phishing (~$195K user losses; contracts unaffected).
- **November 21, 2025**: NameSilo registrar insider compromise hijacked `aerodrome.finance` and `velodrome.finance` DNS records, bypassing the 3DNS multisig and stripping DNSSEC. The phishing UI requested "1"-message signatures and unlimited token approvals. Combined Aerodrome + Velodrome user losses estimated at ~$700K–$1M (some sources cite over $1M across both). Smart contracts unaffected; joint post-mortem published with NameSilo and 3DNS.
- No new incidents November 2025 → May 2026.
- Successfully weathered multiple crypto market volatility events.

## Stage Assessment

**Stage 2 Criteria Met:**

- ✓ **Immutable fund-holding contracts** — Core AMM pools (xy=k, stable curve, and Slipstream concentrated liquidity) deployed without proxies; `PERMISSIONS.md` codifies immutability and the absence of any upgrade path on existing pools.
- ✓ **No admin path to user funds** — Every privileged role mapped: no role (Protocol Team multisig, Emergency Council, ProtocolGovernor, EpochGovernor, FactoryRegistry owner, Vetoer) can withdraw, freeze, or block withdrawal of liquidity from existing pools. Emergency Council "kill gauge" stops emissions but leaves swap and withdrawal functions open.
- ✓ **No critical external dependency** — Self-contained: no external oracles, no keepers required for core functions, no off-chain actors involved in swap/LP/withdraw paths.
- ✓ **12+ months in production with no core exploit** — 2+ years live since August 2023; zero on-chain smart contract exploits; over $185B cumulative volume processed.
- ✓ **Credible independent audits** — Multiple audits on the Velodrome V2 base (Spearbit, ChainSecurity), EtherAuthority audit of Aerodrome AERO token deltas, ChainSecurity audit of the Velodrome Superchain Slipstream variant (same Slipstream codebase).

**Caveats (noted, do NOT disqualify Stage 2):**

- ⚠ No tier-1 firm has published an *Aerodrome-branded* report specifically on Slipstream — coverage relies on the Velodrome Superchain Slipstream audit of the same code.
- ⚠ No formal verification disclosed.
- ⚠ No active Immunefi-listed bug bounty could be located.
- ⚠ Emergency Council multisig threshold and signer identities are not publicly documented (powers cannot touch user funds — caveat only).
- ⚠ Vetoer role is still held by the Protocol Team multisig and has not been renounced despite the `PERMISSIONS.md` "to be renounced" language (no fund-access powers — caveat only).
- ⚠ Factory upgradeability allows governance to approve new pool factories for future deployments (existing pool deposits remain in immutable contracts and are not affected).
- ⚠ Two web2 front-end / DNS security incidents (November 2023, November 2025) indicate operational security gaps at the registrar/UI layer — smart contracts were unaffected in both cases. Users who interact with the contracts directly bypass this surface.

**Justification:**
Aerodrome earns **Stage 2 (Trustless)**. The user's question — *can my deposited funds be taken, frozen, or made unrecoverable without my consent?* — has a clean answer: **no**. Core AMM and Slipstream pool contracts are immutable, no privileged role on the system can touch user liquidity in existing pools, and there is no external oracle or off-chain actor in the fund-custody path. The protocol has operated for over two years on Base with no smart-contract exploit while processing over $185B in volume. The undisclosed Emergency Council composition, the unrenounced Vetoer role, the absence of formal verification or a public Immunefi bounty, and the factory upgradeability for future pools are quality caveats — they belong in the assessment and should be tracked — but none of them grant any party the ability to take user funds in existing pools. The November 2025 DNS hijack is a web2/registrar incident, not a protocol-level one, and similarly does not change the on-chain custody guarantee.

## Links

- [Official Website](https://aerodrome.finance)
- [Documentation](https://aerodrome.finance/docs)
- [GitHub: contracts](https://github.com/aerodrome-finance/contracts)
- [GitHub: slipstream](https://github.com/aerodrome-finance/slipstream)
- [PERMISSIONS.md](https://github.com/aerodrome-finance/contracts/blob/main/PERMISSIONS.md)
- [SPECIFICATION.md](https://github.com/aerodrome-finance/contracts/blob/main/SPECIFICATION.md)
- [AERO Token (BaseScan)](https://basescan.org/token/0x940181a94a35a4569e4529a3cdfb74e38fd98631)
- [Router (BaseScan)](https://basescan.org/address/0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43)
- [FactoryRegistry (BaseScan)](https://basescan.org/address/0x5c3f18f06cc09ca1910767a34a20f771039e37c0)
- [PoolFactory (BaseScan)](https://basescan.org/address/0x420dd381b31aef6683db6b902084cb0ffece40da)
- [DefiLlama](https://defillama.com/protocol/aerodrome)
- [DefiLlama: Slipstream](https://defillama.com/protocol/aerodrome-slipstream)
- [ChainSecurity — Velodrome Superchain Slipstream audit](https://www.chainsecurity.com/security-audit/velodrome-superchain-slipstream)
- [EtherAuthority — AERO token audit](https://etherauthority.io/aerodrome-aero-token-smart-contract-audit/)
- [Halborn post-mortem — November 2025 front-end hack](https://www.halborn.com/blog/post/explained-the-aerodrome-finance-hack-november-2025)
