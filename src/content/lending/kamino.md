---
name: "Kamino"
category: "lending"
stage: 0
website: "https://kamino.finance"
chains: ["solana"]
tvl: "$2B"
lastUpdated: "2026-05-15"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "possible"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "2+ years (Kamino Lend); 3+ years (Kvaults); no exploit"
---

# Kamino Risk Assessment

## Overview

Kamino is the largest DeFi protocol on Solana, anchored by Kamino Lend (KLend) — a permissionless pool-based lending market in the Aave/Compound pattern — alongside several products built on top of it: Kvaults (concentrated-liquidity vault manager for Orca Whirlpools and Raydium CLMM), Multiply (one-click leveraged LST loops), and Long/Short (leveraged spot trading).

This assessment focuses on Kamino Lend, which holds the bulk of TVL and defines the protocol's trust surface. Kamino Lend supports a Main Market plus isolated markets (JLP, Altcoins, Ethena, JitoSOL) with elevation groups for correlated assets. Its trust model is dominated by Solana's program-upgrade semantics: programs are upgradeable by a team-controlled Squads multisig with no runtime-enforced timelock, which means a malicious upgrade could in principle alter market accounting and access user collateral.

## Smart Contract Risk

**Contract Architecture:**
- **KLend program**: `KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD` — pool-based lending markets, isolated by reserve, with elevation groups for correlated assets
- **Kvaults / strategy programs**: separate programs that wrap Orca Whirlpool and Raydium CLMM positions, auto-rebalanced by Kamino-operated keepers
- **Farms program** (`FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7KBfgYbT`): reward distribution
- **Scope oracle program** (`HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ`): Kamino's in-house oracle aggregator that wraps Pyth and Switchboard feeds with staleness and confidence checks
- All programs deployed via Solana's BPF Loader Upgradeable; upgrade authority has **not** been renounced on any of them

**Code Quality:**
- Audited by **OtterSec** (multiple engagements across KLend, Kvaults, Farms), **Offside Labs** (KLend), and **Sec3** (Kvaults). **Certora** has an ongoing engagement for formal verification of KLend accounting and solvency invariants
- Audit reports published via `docs.kamino.finance`
- Active Immunefi bug bounty (historically up to ~$1M for KLend critical)
- Open source

**Attack Surface:**
- Standard lending-market surface: oracle manipulation, liquidation race conditions, bad-debt accumulation, interest-curve edge cases
- Solana liveness: chain congestion or outage delays liquidations and can produce bad debt; Solana has had multi-hour outages historically (last major: February 2024)
- No major exploit or loss of user funds to date

## Admin/Governance Risk

**Governance Structure:**
- **KMNO token** launched April 2024 (Genesis Drop); multi-season points distribution through 2024–2025
- Kamino DAO uses Realms (SPL Governance) for signaling and parameter governance; binding control of program-upgrade authority sits with a team-controlled Squads multisig
- **Risk Council**: a multisig-gated parameter-setter role with bounded authority over LTV, supply/borrow caps, and interest curves — analogous to Aave's Risk Stewards. Faster than full DAO process; constrained by published bounds

**Key Controls:**
- Squads multisig holds program-upgrade authority on KLend, Kvaults, Farms, and Scope. No on-chain timelock — Solana's BPF Loader Upgradeable has no native timelock primitive, and Kamino has not publicly disclosed a configured Squads time-locked execution path for these vaults
- Risk Council can adjust per-market parameters within published bounds without a DAO vote
- Signer identities and exact threshold are partially disclosed; treat as `multisig-diverse` pending fuller verification

**Trust Assumptions:**
- Users trust the Squads multisig signers not to push a malicious upgrade. Because there is no enforced timelock and Solana program upgrades take effect on transaction confirmation, users would have no exit window if the multisig were compromised
- Risk Council can shift parameters within bounds; large parameter swings (e.g., dropping LTV to zero) could pressure positions, though published bounds limit this
- Kvaults users additionally trust the Kamino-operated keepers; failure of keepers would degrade strategy performance but does not by itself give Kamino fund-drain authority

## External Dependencies

**Oracle System:**
- **Scope**: Kamino's in-house oracle aggregator program. Wraps **Pyth** (primary), **Switchboard** (fallback for some assets), and pool TWAPs / LST exchange-rate adapters for specific markets. Adds staleness and confidence-interval checks
- Scope itself is upgradeable by the same Squads multisig — a malicious Scope upgrade could feed wrong prices to KLend
- Pyth is a pull-based decentralized oracle; Switchboard is a permissionless oracle network

**Off-Chain Actors:**
- **Liquidators**: permissionless. Anyone can liquidate undercollateralized positions; incentivized by liquidation bonus
- **Kvaults keepers**: Kamino-operated keepers handle CLMM position rebalancing. They are not bonded and not on-chain-governance-removable. Failure degrades Kvaults strategies but does not give them custody of user funds
- **Solana L1**: hard liveness dependency — outages halt all activity

**Overall Rating Justification:**
Mixed. Scope as an in-house oracle aggregator is a thin centralizing layer over otherwise decentralized feeds (Pyth/Switchboard), but it is upgradeable by the same multisig that controls KLend, so it does not meaningfully partition trust. Kvaults keepers are operated by the team without bonding. Solana L1 itself is a hard liveness dependency. Liquidators on KLend are permissionless, which is a point in favor. The combination clears `centralized` but does not reach `decentralized`.

## Economic Risk

**Liquidity Risk:**
- TVL peaked above $2.5B in early 2025 during Solana strength; ~$2B as of mid-2026
- Main Market is the deepest pool; isolated markets (JLP, Altcoins) carry asset-specific risk concentrated within their reserves and bounded by per-reserve caps
- Withdrawal under stress depends on borrow utilization in each reserve; high-utilization reserves can temporarily gate exits

**Operational History:**
- Originally launched as the Kamino product within Hubble Protocol in late 2022 (Kvaults / CLMM strategies)
- Kamino Lend launched August 2023; spun out as standalone Kamino Finance
- KMNO Genesis Drop April 2024; Season 2 and Season 3 points programs ran through 2024–2025
- **No major exploit or loss of user funds** to date on KLend or Kvaults
- Survived March 2023 USDC depeg, FTX aftermath, and the February 2024 Solana outage without notable bad debt events

## Stage Assessment

**Criteria evaluation:**

- ⚠ Upgradeability: `instant` — programs are upgradeable via Squads multisig with no runtime-enforced timelock; Solana's BPF Loader Upgradeable does not support native timelock, and no on-chain Squads time-lock configuration has been publicly verified
- ✓ Admin control: `multisig-diverse` — team-controlled Squads multisig; exact threshold and signer set partially disclosed
- ⚠ Fund access: `possible` — a malicious program upgrade could rewrite KLend accounting and drain reserves; this is the structural consequence of upgradeable lending programs without timelock
- ✓ Audits: `extensive` — OtterSec, Offside Labs, Sec3, and ongoing Certora formal-verification engagement covering solvency invariants
- ⚠ External dependencies: `mixed` — Scope oracle is in-house (wraps Pyth/Switchboard) and shares the same upgrade authority as KLend; Kvaults keepers are team-operated; Solana L1 is a hard liveness dependency. Liquidators are permissionless
- ✓ Track record: 2+ years on KLend, 3+ years on Kvaults, no core exploit

**Why Not Stage 1:**
- Upgradeability does not meet `timelock-48h+`. The Solana program model permits instant upgrades unless the upgrade authority is renounced or a timelock is wired in at the multisig layer; neither applies here
- Fund access is `possible`, not `restricted`, because upgrades are instant: a malicious upgrade can directly drain reserves without an exit window
- Battle-tested override does not apply (upgradeability is not immutable, fund access is not impossible)

**Justification:**
Kamino is gated to Stage 0 by Solana program semantics: KLend and Scope are upgradeable by a team multisig with no enforced timelock, which gives the multisig effective custody of user collateral via the upgrade path. Audit coverage is genuinely extensive (multiple firms plus ongoing formal verification), the track record is clean, and the Risk Council is bounded — none of which changes the structural trust dependency on the upgrade authority. A meaningful upgrade-authority timelock at the Squads layer, or renunciation of upgrade authority on the core program, would be the cleanest path to Stage 1.

## Links

- [Official Website](https://kamino.finance)
- [Documentation](https://docs.kamino.finance/)
- [GitHub](https://github.com/Kamino-Finance)
- [KLend Program](https://solscan.io/account/KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD)
- [Scope Oracle Program](https://solscan.io/account/HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ)
- [Audit Reports](https://docs.kamino.finance/security/audits)
- [Bug Bounty (Immunefi)](https://immunefi.com/bounty/kaminofinance/)
