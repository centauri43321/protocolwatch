---
name: "Compound V3"
baseName: "Compound"
category: "lending"
stage: 1
website: "https://compound.finance"
chains: ["ethereum", "arbitrum", "optimism", "polygon", "base", "scroll"]
tvl: "$1.4B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "3+ years"
---

# Compound V3 (Comet) Risk Assessment

## Overview

Compound V3, codenamed "Comet," launched on Ethereum mainnet in August 2022 with a fundamentally different architecture from V2. Instead of a multi-asset pool where any supplied asset can be borrowed, Comet uses a single-borrowable-asset model — each deployment has one base asset (e.g., USDC) that can be borrowed against multiple collateral types. This design simplifies risk management and reduces attack surface.

Compound V3 has approximately $1.3B in TVL across multiple chains and represents Compound's current flagship product. The protocol is deployed on Ethereum, Arbitrum, Optimism, Polygon, and Base with separate Comet instances for each base asset on each chain.

## Smart Contract Risk

**Contract Architecture:**
- Comet is the core contract — a single monolithic contract per market (base asset + collateral set)
- Uses TransparentUpgradeableProxy pattern (OpenZeppelin)
- Configurator contract manages parameters, deployed separately
- CometProxyAdmin inherits OpenZeppelin ProxyAdmin with custom `deployAndUpgradeTo` function
- CometFactory deploys new Comet implementations via Configurator
- Standard `upgrade` function can also point proxy to any arbitrary implementation (not just Configurator-produced ones)
- Each chain deployment has its own governance bridge receiver

**Code Quality:**
- Audited by OpenZeppelin and ChainSecurity
- Formal verification by Certora on core Comet logic
- Open source with extensive fuzzing and test coverage
- Active bug bounty ($500 to $150,000 for eligible discoveries)
- ChainSecurity audit flagged: Chainlink oracle price data not validated for staleness
- Simpler codebase than V2 — single-borrowable-asset design reduces complexity

**Attack Surface:**
- Upgradeable via proxy — governance can swap implementations
- Single-borrowable-asset model limits systemic contagion between markets
- Collateral assets are held separately from the borrowable base asset
- Absorb mechanism for socializing bad debt is trustless and permissionless
- No flash loan support in core Comet (reduces attack surface)

## Admin/Governance Risk

**Governance Structure:**
- Governed by COMP token holders via Governor Bravo (same governance as V2)
- On Ethereum: 2-day Timelock applies to all Comet upgrades and parameter changes
- On L2s: OpenZeppelin Timelock with 2-day delay, receiving cross-chain governance messages
- Cross-chain governance: proposals on Ethereum, execution bridged to L2s
- Same quorum and proposal requirements as V2 (400K COMP quorum)

**Key Controls:**
- 2-day Timelock (hard-coded minimum 48h delay) enforced on all chains for upgrades and configuration changes
- Configurator sets parameters (supply/borrow caps, collateral factors, interest rate curves)
- Governor/Timelock is the ProxyAdmin — can swap Comet implementations to arbitrary code
- `approveThis` function allows governance to set ERC-20 allowances on behalf of Comet for any asset to any address — a direct fund access vector (timelock-protected)
- Pause Guardian (4-of-8 community multisig) can pause deposits, withdrawals, and transfers — cannot unpause (only governance can)
- Parameters include per-asset supply caps, borrow caps, liquidation factors, and penalty rates

**Trust Assumptions:**
- Users must trust governance won't deploy a malicious Comet implementation or use `approveThis` to drain funds
- 2-day timelock provides an exit window — users must actively monitor governance proposals
- Cross-chain governance relies on bridge message delivery (but timelock still applies on the receiving end)
- Governance can change Chainlink oracle feeds (subject to timelock)
- July 2024 governance attack attempt: a whale tried to pass a proposal transferring ~$25M in COMP from treasury — detected and resolved, but demonstrates real governance manipulation risk with 400K COMP quorum (~1% of supply)

## External Dependencies

**Oracle System:**
- Chainlink price feeds exclusively for all collateral pricing
- No fallback oracle mechanism
- Each Comet instance has per-asset Chainlink feed configurations
- Governance can update oracle feeds (subject to 2-day timelock)
- ChainSecurity audit noted Comet does not validate Chainlink round data for staleness — only checks for zero values

**Off-Chain Actors:**
- Liquidations ("absorb" mechanism) are fully permissionless
- No keeper requirements for core protocol operation
- Cross-chain governance relies on bridge infrastructure
- Bridge risk is limited to governance message delivery, not fund transfers

**Overall Rating Justification:**
Compound V3 relies exclusively on Chainlink for price feeds — a decentralized oracle network. The lack of a fallback oracle and insufficient staleness validation (per ChainSecurity audit) are concerns, but Chainlink's overall reliability and decentralized infrastructure make the dependency fundamentally decentralized. Liquidations are permissionless. Cross-chain governance uses standard bridges protected by receiving-end timelocks.

## Economic Risk

**Liquidity Risk:**
- $1.4B TVL across multiple chains and base assets
- Single-borrowable-asset model simplifies risk analysis per market
- Collateral isolation — collateral cannot be borrowed, reducing utilization-based exit liquidity concerns
- Supply and borrow caps limit concentration risk
- Multiple independent markets (USDC, USDT, ETH base) on each chain

**Operational History:**
- Launched August 2022 on Ethereum (USDC market)
- Expanded to multiple chains and base assets through 2023-2025
- No critical smart contract exploits of V3 core contracts
- July 2024: Governance manipulation attempt — whale tried to pass proposal transferring ~$25M COMP from treasury; detected and resolved via community response
- Clean operational record across 3+ years
- Weathered 2022-2023 market volatility without incident
- Simpler architecture has resulted in fewer edge cases than V2

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Timelock >=48 hours on critical upgrades (2-day Timelock on all chains)
- ✓ Admin control via decentralized governance (COMP token holders)
- ✓ Admin powers scoped — fund access restricted (possible via `approveThis` or proxy upgrade, but timelock-protected)
- ✓ Multiple independent audits (OpenZeppelin, ChainSecurity) + formal verification (Certora)
- ✓ 3+ years of production operation (well over 6 months)
- ✓ External dependencies decentralized (Chainlink oracles, permissionless liquidations)

**Why Not Stage 2:**
- Comet contracts are upgradeable via TransparentUpgradeableProxy
- 2-day timelock is less than the 7-day requirement for Stage 2
- Governance retains full upgrade capability
- No fallback oracle (Chainlink-only)
- Governance can change all parameters including oracle feeds

**Justification:**
Compound V3 achieves Stage 1 (Limited Trust). A previous assessment rated it Stage 2, which was incorrect — Comet uses TransparentUpgradeableProxy with a 2-day timelock, not the 7+ days or immutable contracts required for Stage 2. Additionally, the `approveThis` function provides governance with a direct fund access vector (timelock-protected), and Chainlink oracle data lacks staleness validation. However, V3 is a solid Stage 1: the 48h timelock provides a meaningful exit window, the single-borrowable-asset design reduces systemic risk, governance is decentralized via COMP, and the audit/verification portfolio is extensive. The July 2024 governance attack attempt was detected and resolved, demonstrating community vigilance but also the low quorum risk.

## Links

- [Official Website](https://compound.finance)
- [V3 Documentation](https://docs.compound.finance/)
- [GitHub](https://github.com/compound-finance/comet)
- [Governance](https://compound.finance/governance)
- [Audit Reports](https://docs.compound.finance/#security)
- [Bug Bounty](https://immunefi.com/bounty/compound/)
