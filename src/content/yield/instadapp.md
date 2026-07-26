---
name: "Instadapp"
category: "yield"
stage: 1
website: "https://instadapp.io"
chains: ["ethereum", "arbitrum", "base", "polygon"]
tvl: "$1.1B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "6+ years"
---

# Instadapp Risk Assessment

## Overview

Instadapp is a DeFi middleware protocol built around DeFi Smart Accounts (DSAs) — upgradeable contract wallets that enable complex multi-protocol transactions in a single call. Users interact through individually-owned DSAs, which compose connector calls ("spells") for atomic operations across lending, DEX, and yield protocols.

Instadapp rebranded to Fluid in December 2024, with a 1:1 INST to FLUID token migration. Fluid is a unified lending and DEX protocol with approximately $1.8B TVL, representing a fundamentally different architecture from the legacy DSA middleware. This assessment covers the Instadapp/DSA product specifically; Fluid lending/DEX has different risk characteristics and warrants separate evaluation.

## Smart Contract Risk

**Contract Architecture:**
- DSA v2 uses a proxy pattern with a fallback function that delegates calls to implementation modules fetched from an Implementations registry using msg.sig
- Architecture is described as "infinitely extendable and upgradable" — new modules are added by governance
- Connectors: Standard proxy logic for DeFi protocol interactions; connectors explicitly prohibit delegatecall() in their own code
- Spells: Composed sequences of connector calls enabling atomic multi-protocol transactions
- PeckShield medium-risk finding: governance-approved connectors have significant power over user accounts via delegateCall()

**Code Quality:**
- Audited by PeckShield (DSA v1 March 2020, DSA v2 March 2021), samczsun (Letter of Attestation), MixBytes (Fluid Vault June 2024, Fluid Liquidity December 2025), and Cantina (Competition September–October 2024, Fluid DEX January 2025)
- No formal verification
- Bug bounty: Immunefi program active (Instadapp program + Fluid invite-only up to $80K)

**Attack Surface:**
- DSAs are non-custodial — individual user accounts, not pooled liquidity
- Inherits risks from connected protocols (Aave, Compound, Maker)
- Upgradeable proxy pattern means governance can deploy new implementation modules executing via delegatecall in user DSA context
- Complex multi-protocol interactions increase surface area

## Admin/Governance Risk

**Governance Structure:**
- Compound Bravo governance model
- Proposal threshold: 1% of INST/FLUID supply
- Quorum: 4% of supply
- Voting period: approximately 3 days
- Timelock delay: approximately 2 days (48 hours)

**Key Controls:**
- Connector additions and removals
- Implementation module upgrades
- Protocol parameter changes
- Governance can add new implementation modules that execute via delegatecall in DSA context — theoretical attack vector if governance is compromised, with only 48h delay before execution

**Trust Assumptions:**
- DSAs are non-custodial (user-owned)
- Fund access rated "restricted" — governance can upgrade DSA modules via delegatecall with 48h timelock delay
- Users cannot opt out of module upgrades applied to the DSA framework
- Connected protocol risks pass through to DSA users

## External Dependencies

**Oracle System:**
- DSA core has no native oracle dependency — inherits oracle requirements from connected protocols (Aave, Compound, Maker)
- Fluid protocol uses a dual-oracle system: Chainlink AggregatorV3 combined with Uniswap TWAP cross-verification
- Risk varies by strategy and connected protocol

**Off-Chain Actors:**
- Instadapp Lite / Fluid Lite vaults rely on an off-chain automation server for rebalancing leveraged positions and liquidation protection
- The Rebalancer role can deposit/withdraw to protocols, move funds between protocols, and leverage/deleverage positions, but cannot withdraw funds from the vault to external addresses
- If the automation server goes down, Lite vault positions face liquidation risk during volatile markets
- Core DSA connector architecture and transaction composition work on-chain without off-chain dependencies

**Overall Rating Justification:**
Rated `mixed`. The DSA core product operates fully on-chain as non-custodial smart contract wallets. However, Instadapp Lite / Fluid Lite vaults rely on an off-chain automation server for rebalancing and liquidation protection. Fluid's lending protocol introduces direct Chainlink oracle dependencies. The DSA core is on-chain and self-sufficient, while Lite vaults carry centralized automation risk.

## Economic Risk

**Operational History:**
- Founded at ETHIndia hackathon (August 2018)
- Mainnet launch (December 2018)
- DSA launch (March 2020)
- DeFi Smart Layer + INST token (April 2021)
- Fluid DEX launch (October 2024)
- Rebrand to Fluid (December 2024)
- No known exploits or security incidents in 6+ years

**Liquidity Risk:**
- ~$1.1B TVL across Ethereum, Arbitrum, Base, and Polygon
- DSA architecture is inherently safer than pooled designs — individual user accounts isolate risk
- Liquidity depends on connected protocols rather than native liquidity pools

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Governance-controlled upgrades with 48h timelock
- ✓ Non-custodial DSA design — users own their accounts
- ✓ 6+ year operational track record with no exploits
- ✓ Multiple audits from reputable firms
- ✓ Active bug bounty program

**Why Not Stage 2:**
- 2-day timelock is relatively short for governance-controlled upgrades
- Upgradeable proxy pattern means governance can add implementation modules executing via delegatecall in user DSA context
- Off-chain automation dependency for Lite vaults creates centralized failure risk
- Fluid introduces new oracle dependencies (Chainlink)
- Users cannot opt out of module upgrades applied to DSA framework

**Justification:**
Instadapp achieves Stage 1 (Limited Trust) status due to its non-custodial DSA design, governance-controlled upgrades with timelock, and a 6+ year track record with no security incidents. Users maintain ownership of their smart accounts and can interact with DeFi protocols directly. However, governance can add new modules that execute via delegatecall with only a 48h delay, and Lite vault users depend on off-chain automation infrastructure. These factors, combined with the relatively short timelock and new Fluid oracle dependencies, prevent advancement to Stage 2.

## Links

- [Official Website](https://instadapp.io)
- [Documentation](https://docs.instadapp.io)
- [GitHub](https://github.com/Instadapp)
- [Governance](https://gov.instadapp.io)
- [Fluid](https://fluid.instadapp.io)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/instadapp/)
