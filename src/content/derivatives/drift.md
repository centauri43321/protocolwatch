---
name: "Drift"
category: "derivatives"
stage: 0
website: "https://drift.trade"
chains: ["solana"]
tvl: "$241M"
lastUpdated: "2026-05-23"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "V2 launched late 2022; April 2026 Security Council multisig compromise drained ~$285M (durable-nonce phishing of 2-of-5 zero-timelock signers); V1 (2021) halted May 2022 in Terra/LUNA collapse — users made whole via emergency financing"
---

# Drift Risk Assessment

## Overview

Drift is a Solana-native perpetuals DEX offering cross-margined spot and perpetual trading, an off-chain order book matched on-chain by permissionless keepers, a vAMM backstop, and a Just-in-Time (JIT) auction layer for taker-flow improvement. The protocol is the largest perp DEX on Solana by cumulative volume (~$148.5B) and added prediction markets (BET) in August 2024 and a vault layer (Drift Earn) that drove peak TVL to ~$1.13B in mid-2025.

Drift V1 launched in late 2021 with a pure vAMM design and was halted on **May 11, 2022** during the Terra/LUNA collapse after three accounting flaws allowed ~$8.72M of collateral to drain over 12 hours, leaving a $14.5M shortfall. The team raised emergency financing and made all V1 traders whole, then sunset V1 and shipped **V2** (late 2022) — the version assessed here. V2's smart-contract code held up for ~3.5 years without an exploit; however, on **April 1, 2026**, attackers compromised the protocol's 2-of-5 Security Council multisig through a durable-nonce phishing attack and drained **~$285.3M** in USDC, JLP, SOL, cbBTC, USDT, and wETH. This is the second-largest exploit in Solana history and was a governance-layer failure, not a contract-logic failure — but in the framework's terms, admin keys demonstrably accessed user funds.

## Smart Contract Risk

**Contract Architecture:**

V2's mainnet program ID is `dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH` (same on devnet). The protocol routes orders through three liquidity sources:

- **DLOB** — decentralized off-chain limit order book, matched on-chain by permissionless keepers
- **vAMM** — backstop liquidity that fills when no maker quote improves on the auction price
- **JIT auction** — ~5-slot auction window allowing market makers to improve on incoming taker orders

Cross-margined accounts combine weighted spot deposits, perp PnL, and asset valuations. Margin checks use `min(oracle_price, oracle_twap)` for initial checks and current oracle for maintenance. Per-market **Insurance Funds** backstop bankruptcies, funded by liquidation penalties and a share of fees; IF stakers earn yield but face socialized losses.

**Upgrade Mechanism:**

The Drift program is deployed via `BPFLoaderUpgradeable` — Solana's standard upgradeable loader. Upgrade authority is a **Squads multisig** controlled by the Security Council. As of late March 2026, this council was reconfigured to a **2-of-5 threshold with zero on-chain timelock** — any 2 signers can push an immediate program upgrade or admin authority change. This was the exact configuration exploited on April 1, 2026.

**Code Quality:**

- **Trail of Bits** — V2 core audit, Nov 7 – Dec 2, 2022; follow-up Jan 23–25, 2023. No high-severity findings.
- **Neodyme** — `protocol-v2` audit, report dated May 10, 2024 (updated June 27, 2024). Public PDF on Drift CDN.
- **OtterSec** — limited to the "Connect by Drift" MetaMask Snap, not the core Solana program. Marketing that lists OtterSec alongside TOB and Neodyme for "the core program" overstates scope.
- No formal verification.
- Open source: `drift-labs/protocol-v2` on GitHub.
- **Immunefi bug bounty** — up to **$500,000** for smart-contract bugs (UI bugs excluded). Critical findings require PoC on a private mainnet deployment. Paid in USDC.

**Attack Surface:**

- Upgradeable program with no on-chain timelock — any compromise of 2 multisig signers can push arbitrary logic, as demonstrated April 2026
- Cross-margin engine + oracle-priced collateral creates the standard perp-DEX surface: oracle manipulation, JIT-auction manipulation, liquidation cascades
- Wormhole-bridged Pyth attestations are a dependency for price feeds
- Solana **durable nonces** (used in the April 2026 attack) allow pre-signed transactions to remain valid indefinitely; combined with phished signatures and zero timelock, this is the exploit vector that succeeded

## Admin/Governance Risk

**Governance Structure:**

Three branches, formalized alongside the DRIFT token launch in May 2024:

1. **Realms DAO** (solana.com/realms) — DRIFT-token-weighted voting on tokenomics and Security Council elections
2. **Security Council** — Squads multisig with authority over program upgrades, risk parameters, and market listings/delistings
3. **Futarchy DAO** — MetaDAO-style conditional-market voting for grants

**DRIFT token:** launched May 16, 2024. 1B total supply, 100M (10%) airdropped over 5 years. Current market cap ~$17M per DeFiLlama (May 2026).

**Key Controls:**

The Security Council Squads multisig — at a **2-of-5 threshold with zero on-chain timelock** as of the April 2026 incident — can:

- Push immediate program upgrades (arbitrary logic, including drain functions)
- Change admin authority to any address
- Modify risk parameters, margin ratios, oracle sources
- List and delist markets
- Pause and unpause trading

The April 1, 2026 incident proved that this authority can drain user funds. Attackers compromised 2 of 5 signers through phishing that tricked them into signing transactions using **durable nonces** (signatures that remain valid indefinitely). The pre-signed proposal was submitted at 16:05:18 UTC, transferring admin authority to `H7PiGqqUaanBovwKgEtreJbKmQe6dbq6VTrw6guy7ZgL`, after which ~$285.3M was drained.

**Trust Assumptions:**

- Users must trust that any 2 of 5 Security Council signers will not be compromised — empirically broken
- No timelock means there is **no exit window** between a malicious proposal and execution
- Squads multisig composition was not subject to a publicly disclosed key-hygiene standard sufficient to resist DPRK-grade phishing (per Elliptic's attribution)
- Pre-May 2024 governance was effectively core-team controlled; the formal DAO + multisig structure is recent and proved insufficient

## External Dependencies

**Oracle System:**

- **Pyth Network** is the primary price oracle. Pyth is decentralized at the publisher layer but is pull-based on Solana and uses Wormhole for cross-chain price attestations.
- **Switchboard** is a fallback on certain markets.
- Initial margin checks use `min(oracle_price, oracle_twap)` — a conservative pattern that mitigates short-term price manipulation.

**Off-Chain Actors:**

- **Keepers/fillers** — permissionless. Anyone can run a keeper to match orders, trigger liquidations, and settle funding. Drift Labs runs reference keepers but is not exclusive.
- **JIT market makers** — permissionless in design but dominated in practice by a small number of professional MM firms.
- **Swift** — off-chain signed-order system; keepers/MMs bundle and execute on-chain.

**Bridge / Wrapped Assets:**

- Wormhole is an indirect dependency via Pyth's cross-chain attestations.
- Some markets reference bridged collateral (e.g., wETH, cbBTC, USDT).

**Overall Rating Justification:**

Pyth is decentralized-leaning but Wormhole-bridged on Solana, which constitutes a real trust surface. Keepers and JIT makers are permissionless. The Squads multisig sits inside this dependency picture as the governance trust anchor — and its compromise was the exploit vector. The combination of decentralized oracles, permissionless keepers, but bridged price attestations and a centralized multisig governance layer yields a `mixed` rating. It is not `centralized` (Pyth and keepers are meaningfully decentralized) but it is clearly not `decentralized` either.

## Economic Risk

**Liquidity Risk:**

- Current TVL: ~$241M (May 2026), down from a mid-2025 peak of ~$1.13B and ~$550M just before the April 2026 incident
- Cumulative perp volume: **~$148.5B**; cumulative spot volume ~$3.46B
- Annualized fees: ~$14.16M; protocol revenue only ~$348K (most fees route to LPs and keepers)
- Insurance Fund backstops bankruptcies but absorbed losses in the V1 collapse and was insufficient for the April 2026 governance compromise (which bypassed the IF entirely by draining via admin authority)

**Operational History:**

- **Nov 2021** — V1 mainnet launch
- **May 11, 2022** — V1 halted in Terra/LUNA collapse; ~$8.72M drained, $14.5M shortfall; team raised emergency financing and made all V1 users whole ($19.5M total)
- **Late 2022** — V2 mainnet launch
- **Feb 2022** — Immunefi bug bounty launched (later raised to $500K)
- **May 16, 2024** — DRIFT token launch and formal governance structure
- **Aug 2024** — BET prediction markets launched (US election contracts among initial offerings)
- **Mid-2025** — TVL peak ~$1.13B driven by Drift Earn vaults
- **March 26, 2026** — Security Council reconfigured to 2-of-5 with zero timelock
- **April 1, 2026** — **~$285.3M drained** via durable-nonce phishing of multisig signers (Elliptic suggests DPRK-linked). Second-largest exploit in Solana history. Funds not recovered as of public reporting.

## Stage Assessment

**Stage 0 Criteria:**

- ✓ Multiple reputable audits — Trail of Bits (V2 core, 2022–2023), Neodyme (May 2024). $500K Immunefi bug bounty.
- ✓ Decentralized oracle architecture (Pyth + Switchboard) with conservative min(price, TWAP) margin checks
- ✓ Permissionless keepers and JIT auctions
- ✓ 3+ years of V2 contract operation with no smart-contract exploit
- ✗ Fund access **possible** — April 2026 incident proved admin keys can drain user funds (~$285M)
- ✗ Upgradeability **instant** — Solana BPFLoaderUpgradeable controlled by a Squads multisig with no on-chain timelock
- ✗ Admin control is a **2-of-5 multisig** — below the 3-of-5+ diverse threshold required for Stage 1, with key-hygiene proven inadequate against phishing
- ✗ Recent unresolved core fund-loss event (~$285M, April 2026)

**Why Not Stage 1:**

Stage 1 requires (a) ≥48-hour timelock on critical upgrades with no bypass, (b) admin powers scoped so they cannot directly drain user funds, and (c) a 3-of-5+ diverse multisig or decentralized governance. Drift fails all three: there is no timelock at all, the upgrade authority can deploy arbitrary program logic (including drain functions), and the multisig is 2-of-5. The April 2026 incident is direct evidence — not theoretical concern — that the governance layer can and did access user funds without consent.

**Why Not Stage 2:**

Upgradeable program with no timelock; admin keys can drain funds; recent $285M loss via the governance path; bridged oracle dependency (Wormhole/Pyth).

**Justification:**

Drift V2 is a well-engineered perp DEX whose smart-contract code passed reputable audits and operated for 3+ years without an exploit. The framework's gating question, however, is *can user funds be taken without consent?* — and the answer is empirically yes: on April 1, 2026, attackers compromised 2 of 5 Security Council signers, used Solana durable nonces to bypass any subsequent multisig hygiene, and — with **zero on-chain timelock** — immediately transferred admin authority and drained ~$285M. The configuration that enabled this (2-of-5 threshold, no timelock) is the worst-case Stage 0 admin setup for a fund-custodying protocol. Restoring Stage 1 eligibility would require, at minimum, a ≥48h on-chain timelock on the upgrade authority, a 3-of-5+ diverse multisig with documented signer key-hygiene, and a demonstrably restored security posture post-incident.

## Links

- [Official Website](https://drift.trade)
- [Documentation](https://docs.drift.trade)
- [GitHub (protocol-v2)](https://github.com/drift-labs/protocol-v2)
- [Drift Program (Solscan)](https://solscan.io/account/dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH)
- [Audits](https://docs.drift.trade/security/audits)
- [Bug Bounty (Immunefi)](https://docs.drift.trade/security/bug-bounty)
- [Governance Token Announcement](https://www.drift.trade/governance/introducing-the-drift-governance-token)
- [Drift Foundation Docs](https://drift.foundation/docs)
- [DeFiLlama TVL](https://defillama.com/protocol/drift)
- [V1 2022 Technical Incident Report](https://driftprotocol.medium.com/drift-protocol-technical-incident-report-2022-05-11-eedea078b6d4)
- [Chainalysis: Lessons from the Drift Hack (April 2026)](https://www.chainalysis.com/blog/lessons-from-the-drift-hack/)
- [BlockSec: Multisig Governance Compromise via Durable Nonce](https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation)
- [Elliptic: Drift Protocol Exploited for $286M in Suspected DPRK-Linked Attack](https://www.elliptic.co/blog/drift-protocol-exploited-for-286-million-in-suspected-dprk-linked-attack)
