---
name: "Aave V1"
baseName: "Aave"
category: "lending"
stage: 0
website: "https://aave.com"
chains: ["ethereum"]
tvl: "<$5M"
lastUpdated: "2026-06-09"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "6+ years (deprecated, frozen)"
---

# Aave V1 Risk Assessment

## Overview

Aave V1 is the original version of the Aave lending protocol, launched on Ethereum mainnet in January 2020. It introduced flash loans to DeFi and allowed users to lend and borrow a variety of assets through liquidity pools with algorithmically determined interest rates.

Aave V1 has been superseded by V2 (December 2020), V3 (March 2022), and now V4 (March 2026). Following AIP-132 (December 2022), all V1 reserves are frozen — users can repay debt and withdraw collateral, but new supply and borrow operations are disabled. The remaining TVL is negligible and the protocol is effectively in terminal wind-down. Governance attention to V1 is minimal.

## Smart Contract Risk

**Contract Architecture:**
- LendingPool and LendingPoolCore as primary contracts
- Upgradeable proxy pattern (LendingPoolAddressesProvider)
- LendingPoolAddressesProvider acts as proxy admin, can update implementations
- V1 falls under Aave Governance V2 Executor 1 (Short Executor): 3-day voting + 1-day timelock = 4+ day effective on-chain delay
- Interest rate strategy contracts are modular but admin-replaceable
- Flash loan functionality integrated into LendingPool

**Code Quality:**
- Audited by OpenZeppelin (pre-launch) and Trail of Bits (2020)
- Formal verification performed on core lending logic, though Trail of Bits noted the verified properties were narrow
- Open source on GitHub
- V1 is no longer in scope for Aave's Immunefi bug bounty (deprecated/out-of-support)
- December 2020: Trail of Bits found a critical upgradeability bug in V1/V2 live contracts, mitigated within 1 hour

**Attack Surface:**
- Upgradeable proxies allow implementation replacement without timelock
- Flash loan attack vectors (addressed in later versions)
- Interest rate manipulation through large deposits/withdrawals
- No critical exploits during V1's operational lifetime

## Admin/Governance Risk

**Governance Structure:**
- Controlled by AAVE token governance since governance launch (late 2020)
- Prior to governance, controlled by Aave team multisig
- Governance proposals follow standard Aave governance process
- V1 receives minimal governance attention due to deprecation status

**Key Controls:**
- Short Executor enforces 3-day voting + 1-day timelock = 4+ day effective delay on upgrades
- Effective on-chain delay exceeds 48h, but governance demonstrated willingness to alter fund mechanics
- LendingPoolConfigurator allows parameter changes (reserve factors, interest rates, collateral factors)
- Emergency admin can pause protocol functions
- Governance can freeze reserves and disable borrowing

**Trust Assumptions:**
- Governance can upgrade contracts with 4+ day effective delay (3-day voting + 1-day timelock)
- 5/9 Guardian multisig can cancel malicious proposals but cannot unilaterally execute changes
- Fund access is possible via upgrade capability — governance demonstrated this during V1 deprecation by upgrading pool logic to allow forced liquidations of healthy positions with a 1% bonus
- LendingPoolCore holds all deposited assets, making it a single point of fund custody

## External Dependencies

**Oracle System:**
- Uses Chainlink price feeds as primary oracle source
- Originally launched with a custom price oracle, later migrated to Chainlink
- Fallback oracle (Uniswap price aggregator) is now deprecated and no longer maintained
- Governance can change oracle sources for individual assets
- If Chainlink feeds for V1 assets were deprecated, the protocol could malfunction

**Off-Chain Actors:**
- Liquidations are performed by external liquidator bots (permissionless)
- No keeper dependencies for core protocol operation
- Users can always withdraw supplied assets (if available liquidity exists)
- No bridge dependencies — Ethereum-only deployment

**Overall Rating Justification:**
Aave V1 uses Chainlink as its primary oracle, which is decentralized. However, the fallback oracle is deprecated and no longer maintained, creating a single-source dependency. If Chainlink feeds for V1 assets were discontinued, there would be no fallback. Liquidations are permissionless. The combination of decentralized primary oracle with deprecated fallbacks and the protocol's out-of-support status results in a "mixed" rating.

## Economic Risk

**Liquidity Risk:**
- TVL has declined to well under $5M as users migrated to V2/V3 and reserves were frozen in December 2022
- Reserves are frozen — only repay and withdraw are permitted; no new supply or borrow
- Limited liquidity makes large positions impractical
- Some markets may have low exit liquidity for unusual collateral types

**Operational History:**
- Launched January 2020
- Peak TVL exceeded $1B during DeFi Summer 2020
- No critical smart contract exploits of V1 core
- Successfully weathered March 2020 market crash, DeFi Summer volatility, and subsequent market stress events
- AIP-132 (December 2022) froze all V1 reserves
- 2026 rsETH incident on V3/V4 had no V1 exposure (V1 does not list rsETH)

## Stage Assessment

**Stage 0 Criteria Met:**
- ✗ Fund access is possible — governance demonstrated the ability to alter fund-handling rules during V1 deprecation (upgraded pool logic to force liquidations of healthy positions with a 1% bonus); reserves have since been frozen by AIP-132
- ✗ Protocol is deprecated and out-of-support — no active Immunefi coverage, deprecated fallback oracle, minimal governance monitoring

**Why Not Stage 1:**
- ✗ Fund access is `possible` rather than `restricted` — governance has exercised the capability to alter fund mechanics, going beyond theoretical upgrade risk
- ✗ Out-of-support quality profile — deprecated fallback oracle, no active bug bounty, V1 no longer monitored under the Aave Risk Stewards framework
- ⚠ External dependency profile is `mixed` due to deprecated fallback oracle

**Why Not Stage 2:**
- ✗ Contracts are upgradeable (not immutable)
- ✗ No 7-day+ timelock on V1's executor
- ✗ Governance has demonstrated it can modify fund-access semantics

**Justification:**
Aave V1 is classified as Stage 0 (Fully Assisted) primarily because governance has demonstrated the ability to alter fund-access rules — during V1 deprecation, governance upgraded pool logic to enable forced liquidations of otherwise-healthy positions with a 1% bonus. This moves fund access from `restricted` (theoretical upgrade risk) to `possible` (exercised capability). While the governance lifecycle provides 4+ days of effective on-chain delay (meeting the 48h threshold), the demonstrated fund access combined with the protocol's deprecated, frozen, and out-of-support status places it firmly at Stage 0. Existing depositors can still withdraw, but the protocol is not a candidate for any higher trust rating.

## Links

- [Official Website](https://aave.com)
- [V1 Documentation](https://docs.aave.com/developers/v/1.0/)
- [GitHub](https://github.com/aave/aave-protocol)
- [Governance](https://governance.aave.com)
- [Audit Reports](https://docs.aave.com/developers/v/1.0/security-and-audits)
