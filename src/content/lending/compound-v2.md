---
name: "Compound V2"
baseName: "Compound"
category: "lending"
stage: 1
website: "https://compound.finance"
chains: ["ethereum"]
tvl: "$138M"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "7+ years (winding down)"
---

# Compound V2 Risk Assessment

## Overview

Compound V2 launched on Ethereum mainnet in May 2019 and pioneered the cToken model where suppliers receive interest-bearing ERC-20 tokens representing their deposits. It introduced the COMP governance token in June 2020, catalyzing "DeFi Summer" and establishing the template for decentralized protocol governance.

Compound V2 retains approximately $138M in TVL on Ethereum. V3 (Comet) has superseded it as the primary Compound product, and V2 is actively being wound down — governance has paused borrows and mints, and set reserve factors to 100%. Users can still withdraw (redeem and repay remain active).

## Smart Contract Risk

**Contract Architecture:**
- Comptroller (upgradeable via proxy) manages market logic, collateral factors, and protocol-wide parameters
- cToken contracts for each market — CErc20 tokens use CErc20Delegator/Delegate proxy pattern (upgradeable); CEther does NOT use a proxy (not upgradeable)
- Unitroller (proxy) delegates calls to the Comptroller implementation
- Interest rate models are separate, replaceable contracts
- COMP distribution logic integrated into the Comptroller

**Code Quality:**
- Audited by Trail of Bits and OpenZeppelin prior to launch
- Formal verification performed by Certora on core Comptroller and cToken logic
- Open source with extensive documentation
- Active bug bounty via Immunefi
- Multiple additional security reviews for COMP distribution and governance upgrades

**Attack Surface:**
- Upgradeable Comptroller via Unitroller proxy
- COMP distribution bug (September 2021) — $80M+ in COMP tokens were erroneously distributed due to a governance-approved upgrade with a bug in the distribution logic
- Reentrancy protections present but pre-EIP standards
- Flash loan exposure through external protocols (V2 doesn't natively support flash loans)

## Admin/Governance Risk

**Governance Structure:**
- Governed by COMP token holders via Governor Bravo
- Proposal lifecycle: 2-day voting delay + 3-day voting period + 2-day timelock
- Quorum: 400,000 COMP votes required
- Proposal threshold: 25,000 COMP to propose
- Guardian (initially team multisig, now governance-controlled) can cancel proposals

**Key Controls:**
- 2-day Timelock contract enforces delay between proposal passage and execution
- Timelock is the admin of the Unitroller (Comptroller proxy) and all cToken contracts
- Governance can upgrade the Comptroller to any new implementation
- Governance can add/remove markets, change collateral factors, modify interest rate models
- Governance can change the COMP distribution rate
- Pause Guardian can pause specific market actions (mint, borrow, transfer, liquidate) — critically, cannot pause Redeem or Repay Borrow, so users can always withdraw

**Trust Assumptions:**
- Users must trust governance will not pass malicious upgrades (2-day exit window)
- The Comptroller upgrade path theoretically allows fund access — a malicious implementation could alter accounting logic
- Pause Guardian can halt market operations but cannot access funds
- COMP token concentration among large holders creates governance centralization risk
- 400K COMP quorum (~1% of supply) is relatively low for a critical protocol

## External Dependencies

**Oracle System:**
- UniswapAnchoredView serves as the oracle system
- Primary price data from Chainlink feeds
- Uniswap V2 TWAP used as an anchor/sanity check
- Reporter (Coinbase-derived) submits prices that are validated against the anchor
- Governance can update the oracle implementation

**Off-Chain Actors:**
- Liquidations are fully permissionless
- Price reporter submits off-chain prices but is validated against on-chain anchor
- No keeper dependencies for core protocol operations
- Ethereum-only deployment — no bridge dependencies

**Overall Rating Justification:**
Compound V2's oracle system combines Chainlink data with Uniswap TWAP anchoring, providing decentralized price infrastructure with built-in sanity checks. Liquidations are permissionless. The reporter mechanism adds a layer but is constrained by the anchor validation. Overall, external dependencies are decentralized.

## Economic Risk

**Liquidity Risk:**
- TVL has declined from peak of ~$12B to ~$138M
- Some markets may have thin liquidity
- COMP distribution has been reduced/eliminated for most markets
- Protocol remains fully functional but with declining activity

**Operational History:**
- Launched May 2019
- COMP token launched June 2020
- Peak TVL ~$12B in 2021
- September 2021: COMP distribution bug — ~$80M in COMP tokens erroneously distributed over multiple transactions. Root cause was a buggy Comptroller upgrade. Funds were protocol reserves (COMP), not user deposits
- Weathered March 2020 crash, DeFi Summer volatility, 2022 bear market, FTX collapse
- No loss of user-deposited funds in protocol history
- V2 actively being wound down — borrows/mints paused via governance, reserve factors set to 100%
- Multiple Compound V2 forks (Hundred Finance, Onyx Protocol, Sonne Finance) exploited via empty pool/precision attacks — Compound V2 mainnet was not directly affected

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Timelock >=48 hours on critical upgrades (2-day Timelock contract)
- ✓ Admin control via decentralized governance (COMP token holders)
- ✓ Admin powers clearly scoped — no direct fund access function
- ✓ Multiple independent audits from reputable firms (Trail of Bits, OpenZeppelin) + formal verification (Certora)
- ✓ 7+ years of production operation
- ✓ External dependencies decentralized (Chainlink + Uniswap TWAP oracle, permissionless liquidations)

**Why Not Stage 2:**
- Comptroller is upgradeable via proxy (not immutable)
- 2-day timelock is less than 7 days
- Governance can upgrade to arbitrary implementations
- COMP distribution bug demonstrated that governance-approved upgrades can introduce unexpected behavior
- Oracle source can be changed by governance

**Justification:**
Compound V2 achieves Stage 1 (Limited Trust) based on its enforced 2-day timelock (~7-day total governance cycle including voting), decentralized COMP governance, extensive audits with formal verification, and 7+ year track record. The timelock provides users with a meaningful exit window before harmful changes take effect. The COMP distribution bug was a significant incident but affected protocol reserves (COMP tokens), not user deposits, and demonstrated that the governance + timelock system worked as designed — the bug was introduced via a governance-approved upgrade, not an exploit. Users must trust governance but have time-based protections.

## Links

- [Official Website](https://compound.finance)
- [V2 Documentation](https://docs.compound.finance/v2/)
- [GitHub](https://github.com/compound-finance/compound-protocol)
- [Governance](https://compound.finance/governance)
- [Audit Reports](https://docs.compound.finance/v2/security)
- [Bug Bounty](https://immunefi.com/bounty/compound/)
