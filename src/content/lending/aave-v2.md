---
name: "Aave V2"
baseName: "Aave"
category: "lending"
stage: 1
website: "https://aave.com"
chains: ["ethereum", "polygon", "avalanche"]
tvl: "$106M"
lastUpdated: "2026-06-09"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "5+ years (wind-down)"
---

# Aave V2 Risk Assessment

## Overview

Aave V2 is the second major version of the Aave lending protocol, launched on Ethereum mainnet in December 2020. It introduced significant improvements over V1, including tokenized debt positions (debt tokens), credit delegation, gas optimizations, and improved flash loan mechanics.

V2 has been largely superseded by Aave V3 (March 2022) and now V4 (March 2026). It retains approximately $106M in TVL across Ethereum (~$86M), Polygon (~$13M), and Avalanche (~$7M). Governance has been progressively winding down V2 — freezing reserves, reducing supply/borrow caps, and incentivizing migration. The protocol has not been the target of any of the 2026 incidents affecting newer Aave deployments (the April 2026 rsETH bridge incident did not touch V2 because V2 does not list rsETH).

## Smart Contract Risk

**Contract Architecture:**
- LendingPool at the core, accessed via LendingPoolAddressesProvider
- Upgradeable proxy pattern — implementations can be swapped by pool admin
- aTokens (interest-bearing), variableDebtTokens, and stableDebtTokens represent positions
- LendingPoolConfigurator manages protocol parameters
- Interest rate strategy contracts are modular

**Code Quality:**
- Audited by Trail of Bits, OpenZeppelin, SigmaPrime, ABDK, PeckShield, and Certora
- Formal verification by Certora — caught 6 high-severity issues pre-deployment including a solvency vulnerability
- Open source with comprehensive test coverage
- Active bug bounty via Immunefi (V2 on Ethereum: Critical + High severity in scope)
- Multiple security reviews covering upgrades and new features

**Attack Surface:**
- Upgradeable proxies allow instant implementation replacement
- Flash loan attack surface (V2 improved protections over V1)
- Stable rate rebalancing can create edge cases
- Credit delegation introduces counterparty risk for delegators
- No critical exploits of V2 core contracts

## Admin/Governance Risk

**Governance Structure:**
- Controlled by AAVE token governance (Aave Governance V2)
- Short Executor handles standard proposals (voting period + execution delay)
- Long Executor for critical changes with higher quorum
- Guardian multisig (5-of-9) can cancel malicious proposals and pause protocol
- Governance V2 introduced delegated voting power

**Key Controls:**
- Pool admin (governance) can upgrade all contract implementations
- Short Executor: 3-day voting period + 1-day timelock = 4+ day effective delay (2% quorum, 0.5% differential)
- Long Executor: 10-day voting period + 7-day timelock for governance-level changes (20% quorum, 15% differential)
- Guardian (5-of-9 multisig) can pause entire V2 pool and cancel proposals — cannot upgrade or access funds
- V2 pause is all-or-nothing (unlike V3's per-reserve pausing)
- LendingPoolConfigurator controls reserve parameters (LTV, liquidation thresholds, interest rates)
- Risk admin role can adjust certain risk parameters

**Trust Assumptions:**
- Governance can upgrade contracts with an effective 4+ day delay (voting + timelock), giving users an exit window
- The Guardian multisig (5-of-9) adds a defensive safety layer — can only veto/pause, not take offensive action
- Fund access is restricted — possible via malicious upgrade, not via direct admin withdrawal
- V2's wind-down status means fewer eyes monitoring governance actions
- V2 fallback oracle is deprecated and no longer maintained

## External Dependencies

**Oracle System:**
- Chainlink price feeds as the primary oracle source
- AaveOracle contract aggregates and manages price sources
- Governance can update oracle sources per asset
- Fallback oracle mechanism exists but is now deprecated and no longer maintained

**Off-Chain Actors:**
- Liquidations are permissionless — anyone can call the liquidation function
- No keeper dependencies for core protocol operations
- Flash loan liquidations improve capital efficiency for liquidators
- No bridge or cross-chain dependencies (Ethereum-only)

**Overall Rating Justification:**
Aave V2 relies on Chainlink for price feeds, which is the industry standard for decentralized oracle infrastructure. Liquidations are fully permissionless. Governance's ability to swap oracle sources is the primary concern but is standard for governed protocols. No critical centralized dependencies exist.

## Economic Risk

**Liquidity Risk:**
- TVL has declined from peak of ~$20B to ~$106M as users migrate to V3 and V4
- Some markets may have thin exit liquidity, particularly on Polygon and Avalanche
- Stable rate positions create interest rate risk during high utilization
- Protocol remains fully functional but with declining activity

**Operational History:**
- Launched December 2020
- Peak TVL exceeded $20B in 2021
- Weathered May 2021 crash, November 2022 FTX collapse, March 2023 USDC depeg, and the April 2026 rsETH-driven liquidity crunch
- No critical smart contract exploits of V2 core contracts
- November 2023: Critical vulnerability reported via bug bounty affecting V2 and V3 — stable rate borrowing temporarily disabled, no funds lost, all markets unpaused after fix
- CRV bad debt incident (November 2022) — ~$1.6M in bad debt from a Curve founder's large position, handled through Safety Module
- April 2026 rsETH incident on V3 did NOT affect V2 (rsETH was never listed on V2)
- Governance has been systematically winding down V2 since 2023, interface moved to legacy

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Timelock ≥48 hours — Short Executor enforces a 3-day voting period + 1-day on-chain timelock = 4+ day effective delay
- ✓ Admin control via decentralized governance (AAVE token holders with meaningful quorum)
- ✓ Admin powers clearly scoped — no direct fund access; Guardian can only veto/pause
- ✓ Multiple independent audits from reputable firms (Trail of Bits, OpenZeppelin, SigmaPrime, ABDK, PeckShield) + formal verification (Certora)
- ✓ 5+ years of production operation with no core contract exploit
- ✓ External dependencies decentralized (Chainlink oracles, permissionless liquidations)
- ⚠ Wind-down status reduces active monitoring (acceptable caveat — does not change custody guarantees)
- ⚠ V2 pause is all-or-nothing (blocks withdrawals too) — Guardian could pause withdrawals; this is a `restricted` capability and is consistent with Stage 1

**Why Not Stage 2:**
- ✗ Contracts are upgradeable via transparent proxy (not immutable)
- ✗ Short Executor timelock is 1 day (effective 4+ days with voting, but raw on-chain timelock < 7 days)
- ✗ Governance has full parameter and upgrade control
- ✗ V2 pause blocks all operations including withdrawals — more blunt than V3's per-reserve pause
- ✗ Fallback oracle deprecated

**Justification:**
Aave V2 achieves Stage 1 (Limited Trust) based on its enforced on-chain governance lifecycle providing 4+ days of effective delay (3-day voting period + 1-day timelock), decentralized AAVE governance with meaningful quorum requirements, extensive audit portfolio (6 firms + formal verification by Certora), and 5+ year track record with no direct exploits. The Guardian multisig (5-of-9) provides an additional defensive layer. The protocol is being wound down in favor of V3 and V4, but smart contracts remain functional and governed. V2 was unaffected by the April 2026 rsETH bridge incident because it does not list rsETH. The primary risks are the wind-down status reducing monitoring attention, the all-or-nothing pause capability, and the deprecated fallback oracle.

## Links

- [Official Website](https://aave.com)
- [V2 Documentation](https://docs.aave.com/developers/v/2.0/)
- [GitHub](https://github.com/aave/protocol-v2)
- [Governance](https://governance.aave.com)
- [Audit Reports](https://docs.aave.com/developers/v/2.0/security-and-audits)
- [Bug Bounty](https://immunefi.com/bounty/aave/)
