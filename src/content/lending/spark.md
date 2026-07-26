---
name: "Spark"
category: "lending"
stage: 1
website: "https://spark.fi"
chains: ["ethereum", "base", "arbitrum"]
tvl: "$4.75B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "3+ years"
---

# Spark Protocol Risk Assessment

## Overview

Spark Protocol (formerly SparkLend) is a lending protocol built as a fork of Aave V3, launched in May 2023. It operates as a SubDAO within the MakerDAO/Sky ecosystem, primarily designed to support DAI/USDS borrowing and lending. Spark offers competitive rates by leveraging its integration with MakerDAO's DAI supply through the Direct Deposit Module (D3M).

With approximately $4.75B in TVL across Ethereum, Base, and Arbitrum, Spark has grown rapidly to become one of the top 3 DeFi lending protocols. Its tight integration with MakerDAO provides unique advantages (direct DAI/USDS supply at the DSR rate) but also introduces governance coupling with the Maker/Sky ecosystem.

## Smart Contract Risk

**Contract Architecture:**
- Fork of Aave V3 — Pool, PoolConfigurator, and supporting contracts
- Upgradeable proxy pattern (same as Aave V3)
- PoolAddressesProvider manages contract registry
- SparkLend-specific modifications for DAI/USDS integration
- D3M (Direct Deposit Module) connects directly to MakerDAO Vat for DAI supply

**Code Quality:**
- Base code (Aave V3) extensively audited by Trail of Bits, OpenZeppelin, SigmaPrime, and Certora
- Spark-specific modifications audited primarily by ChainSecurity (deployment verification, advanced oracles, vaults, PSM, cross-chain components, governance relay)
- Formal verification inherited from Aave V3 (Certora)
- Open source on GitHub
- Active bug bounty ($5M max payout via Immunefi — one of the largest in DeFi)

**Attack Surface:**
- Upgradeable proxies — mitigated by governance timelock
- D3M integration creates a dependency path to MakerDAO
- Fork risk — Spark inherits any unfixed Aave V3 vulnerabilities
- Parameter misconfiguration could affect DAI/USDS supply rate
- Cross-protocol risk from MakerDAO integration

## Admin/Governance Risk

**Governance Structure:**
- Governed by Spark SubDAO within the MakerDAO/Sky governance framework
- Maker Governance (MKR/SKY holders) has ultimate authority over Spark
- SubDAO governance manages day-to-day parameter changes
- Governance Security Module (GSM) delay applies to Spark changes
- Guardian multisig for emergency actions

**Key Controls:**
- 48-hour GSM delay on all governance-initiated changes
- Pool admin (governance) can upgrade contract implementations
- PoolConfigurator manages asset parameters (LTV, liquidation thresholds, interest rates)
- Emergency admin can pause pool operations
- D3M parameters (debt ceiling, target rate) controlled by Maker governance
- Spark can freeze individual reserves

**Trust Assumptions:**
- Users must trust both Spark SubDAO and Maker governance
- Dual governance layer — Maker governance supersedes Spark SubDAO decisions
- 48-hour delay provides exit window for monitoring participants
- D3M coupling means MakerDAO governance decisions directly affect Spark DAI supply
- Fund access is restricted — possible only via malicious contract upgrade (subject to timelock)

## External Dependencies

**Oracle System:**
- Triple-oracle redundancy via Aggor aggregator combining three providers:
  - Chronicle (native to Sky/Maker ecosystem)
  - Chainlink price feeds
  - RedStone (integrated February 2025 for additional redundancy)
- In a black swan event where one or two oracles fail, the system falls back to remaining operational feed(s)
- sDAI/sUSDS uses internal rate oracle (no external dependency)
- Oracle sources set by governance, subject to timelock

**Off-Chain Actors:**
- Liquidations are fully permissionless (same as Aave V3)
- No keeper requirements for core protocol operation
- D3M operation is automated via on-chain logic
- Cross-chain deployments (Base, Arbitrum) rely on cross-chain messaging infrastructure

**Overall Rating Justification:**
Spark's external dependency profile is decentralized. The triple-oracle redundancy (Chronicle + Chainlink + RedStone via Aggor aggregator) provides robust, decentralized price infrastructure with built-in fallbacks. Liquidations are permissionless. The D3M is fully on-chain. Interest rates persist at last-set values if governance stops. The primary concern is governance's ability to change oracle sources, but this is subject to the 48h timelock.

## Economic Risk

**Liquidity Risk:**
- $4.75B TVL (peak ~$8.1B in July 2025) with strong growth trajectory
- DAI/USDS supply via D3M provides deep base asset liquidity
- Competitive rates drive organic demand
- Cross-protocol liquidity through MakerDAO integration
- Supply and borrow caps limit concentration risk

**Operational History:**
- Deployed to Ethereum March 2023, officially launched May 2023 with D3M onboarding
- Expanded to Base and Arbitrum; Spark Savings launched August 2023
- Rapid growth through 2023-2026 ($0 to $4.75B TVL)
- No smart contract exploits — zero security incidents in protocol history
- Benefits from Aave V3 codebase maturity (4+ years of the base code in production)
- Successfully handled market volatility since launch

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Timelock >=48 hours on critical upgrades (GSM delay)
- ✓ Admin control via decentralized governance (Maker/SKY governance)
- ✓ Admin powers clearly scoped — no direct fund access
- ✓ Multiple independent audits from reputable firms (Aave V3 audits + Spark-specific audits by ChainSecurity across multiple components)
- ✓ 3+ years of production operation
- ✓ External dependencies decentralized (triple-oracle via Chronicle/Chainlink/RedStone, permissionless liquidations)

**Why Not Stage 2:**
- Contracts are upgradeable (not immutable)
- 48-hour timelock, not 7+ days
- Dual governance dependency (Spark SubDAO + Maker governance)
- Governance can upgrade to arbitrary implementations
- 3+ years is still younger than established protocols (vs. 4+ for Aave V3 codebase)

**Justification:**
Spark Protocol achieves Stage 1 (Limited Trust) based on its enforced 48-hour governance delay, governance through the established Maker/Sky ecosystem, extensive ChainSecurity audit coverage (both inherited from Aave V3 and Spark-specific reviews across multiple components), and clean 3+ year operational record with zero security incidents. The triple-oracle redundancy (Chronicle + Chainlink + RedStone) provides robust price infrastructure. The Aave V3 codebase provides significant Lindy effect, having been battle-tested for 4+ years. The primary risk factors are the dual governance dependency (users must trust both Spark SubDAO and Maker governance) and the protocol being younger than the most established lending protocols. The $5M bug bounty demonstrates commitment to security.

## Links

- [Official Website](https://spark.fi)
- [Documentation](https://docs.spark.fi)
- [GitHub](https://github.com/sparkdotfi)
- [Governance](https://vote.makerdao.com)
- [Bug Bounty](https://immunefi.com/bounty/spark/)
- [Audit Reports](https://docs.spark.fi/security)
