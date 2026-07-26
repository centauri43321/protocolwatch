---
name: "Liquity V2"
baseName: "Liquity"
category: "lending"
stage: 1
website: "https://www.liquity.org/bold"
chains: ["ethereum"]
tvl: "$110M"
lastUpdated: "2026-05-10"
risks:
  upgradeability: "immutable"
  adminControl: "none"
  fundAccess: "impossible"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "~12 months on redeployed contracts (since May 2025); original January 2025 deployment retired pre-exploit after audit found a Stability Pool bug, no user loss"
---

# Liquity V2 Risk Assessment

## Overview

Liquity V2 is an immutable, governance-free CDP protocol on Ethereum mainnet that issues the BOLD stablecoin against multiple LST collateral types (WETH, wstETH, rETH) with user-set interest rates.

V2 keeps V1's core thesis — immutable contracts, no admin, permissionless mechanics — while adding multi-collateral support and per-Trove user-chosen interest rates. The original deployment went live in January 2025 but was deprecated in mid-February 2025 after a Stability Pool interest-accrual bug was found in a Cantina audit competition. Users were instructed to withdraw, no funds were lost, and the canonical redeployment went live May 19, 2025. Each collateral lives in its own "branch" with isolated risk parameters and an automatic shutdown trigger if its oracle goes stale or the branch's collateral ratio falls below a hardcoded threshold.

## Smart Contract Risk

**Contract Architecture:**
- All core contracts are immutable — no proxies, no upgrade paths, no pause functions
- Single BoldToken (`0x6440f144b7e50D6a8439336510312d2F54beB01D`) and CollateralRegistry (`0xf949982B91C8c61e952B3bA942cbbfaef5386684`) sit above per-collateral branches
- Each branch has its own TroveManager, BorrowerOperations, StabilityPool, ActivePool, DefaultPool, SortedTroves, PriceFeed, and CollSurplusPool
- Initial branches: WETH, wstETH, rETH
- BOLD is an immutable ERC20: minting is restricted to BorrowerOperations/TroveManager of registered branches; no admin mint, no blacklist, no pause, no upgrade
- Branch shutdown is hardcoded and automatic (not an admin pause): triggered by oracle staleness or by Total Collateral Ratio falling below the per-branch Shutdown Threshold (110% ETH, 120% wstETH/rETH); after shutdown, redemptions use the last recorded price and only Trove closures and SP withdrawals work
- New collateral branches require a fresh deployment — they cannot be added to existing canonical contracts

**Code Quality:**
- Extensive audit portfolio: ChainSecurity (multiple iterations Aug 2024 → May 2025, plus separate Voting/Governance audits), Coinspect (Bold Core Oct–Dec 2024 + Governance Jan 2025), Dedaub (Aug 2024, Nov 2024, May 2025 post-fix review)
- Certora formal verification (December 2024) covering batch interest rate delegation logic
- Recon invariant testing
- Cantina audit competition March 21 → April 27 2025 with $350K prize pool and 800+ researchers — this is what surfaced the Stability Pool bug that triggered the redeployment
- Open source (`liquity/bold`, `liquity/V2-gov`)
- Bug bounty on Cantina (not Immunefi), max payout $125,000 BOLD for critical findings

**Attack Surface:**
- Per-collateral isolation limits cross-branch contagion, but a Coinspect finding (BOLD-05) noted that a single oracle failure could halt redemptions across all branches via the shared CollateralRegistry redemption path
- LST collateral inherits underlying issuer risk (Lido and Rocket Pool slashing, depeg, governance)
- Composite oracle pricing for wstETH/rETH (combining Chainlink market feeds with on-chain canonical exchange rates) introduces additional logic surface
- The original January 2025 deployment had a Stability Pool interest-accrual bug discovered in audit; users were withdrawn safely and contracts were redeployed — concerning that the bug shipped to mainnet, reassuring that it was caught by review before exploitation

## Admin/Governance Risk

**Governance Structure:**
- Core protocol has no admin, no multisig, no EOA, no timelock, no pause
- Parameters (collateral ratios, fees, oracle addresses, staleness thresholds) were set at deployment and are immutable
- A separate peripheral system, "Liquity Governance" (`V2-gov`), allocates 25% of V2 borrowing revenue to Protocol Incentivized Liquidity initiatives chosen by LQTY stakers
- The other 75% of revenue is hardcoded to Stability Pool depositors
- LQTY voting power = staked amount × staking age; weekly epochs; 0.01% voting power + 100 BOLD fee to register a new initiative

**Key Controls:**
- No admin can add collateral types, change oracles, change collateral ratios, change interest mechanics, or pause anything
- Liquity Governance can only direct revenue allocation among approved initiatives — it cannot touch user funds, change protocol parameters, or upgrade contracts

**Trust Assumptions:**
- Users do not need to trust any party with their funds; the contracts have no admin path to user collateral or BOLD
- The peripheral governance system represents trust in LQTY stakers' allocation choices for incentive spending only
- "Friendly forks" (Felix, Hyperliquid, Quill, Nerite, AsymmetryFi, Beraborrow, etc.) are separate BUSL-licensed deployments with their own contracts and stablecoins; they are not part of the canonical Liquity V2 trust surface

## External Dependencies

**Oracle System:**
- ETH branch: Chainlink ETH/USD market feed
- wstETH branch: composite — Chainlink stETH/USD × wstETH/stETH canonical rate from Lido
- rETH branch: composite — Chainlink ETH/USD × Chainlink rETH/ETH market feed, plus rETH/ETH canonical rate from Rocket Pool's RETHToken contract; for redemption pricing, the protocol uses the worst of market vs. canonical when divergence is within deviation bands (1% wstETH, 2% rETH)
- No fallback oracle — staleness beyond the per-collateral threshold (e.g., ~48h for rETH) triggers permanent branch shutdown rather than a swap to a backup provider
- Oracle addresses are hardcoded; there is no admin path to change them

**Off-Chain Actors:**
- None required — liquidations, redemptions, and `kickFromBatch` are all permissionless and economically incentivized
- No keepers, sequencers, relayers, or bonded operators
- No bridge exposure — Ethereum mainnet only

**Overall Rating Justification:**
Liquity V2's external dependency surface is mixed. Chainlink is treated as decentralized, but the absence of a fallback oracle means a single feed failure triggers permanent branch shutdown — a sharp downgrade from V1's Chainlink+Tellor failover. wstETH and rETH branches inherit dependencies on Lido and Rocket Pool canonical exchange rates, which are themselves subject to those protocols' validator and governance risk. There are no off-chain actors required for liquidations or redemptions. The combination of single-source primary oracles and LST issuer dependencies pushes this from "decentralized" to "mixed."

## Economic Risk

**Liquidity Risk:**
- ~$110M TVL (May 2026, DeFiLlama), Ethereum-only
- Stability Pools per branch absorb liquidations and pay yield in BOLD
- Per-branch isolation prevents one collateral's distress from directly liquidating positions in another branch, though redemption demand is shared
- Permissionless redemptions maintain the BOLD peg by routing redeemers to the highest-interest-rate Troves first

**Operational History:**
- Original deployment: January 2025
- Mid-February 2025: Stability Pool interest-accrual bug discovered during Cantina audit competition; users instructed to withdraw; ~$30M in outflows reported by The Defiant; no user funds lost
- Canonical redeployment: May 19, 2025, after Dedaub fixes review — this is the live production version
- ~12 months on redeployed contracts as of May 2026
- No exploits, oracle failures, or BOLD depeg events on the redeployed contracts to date
- Annualized fees ~$1.63M per DeFiLlama

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Immutable core contracts — exceeds the Stage 1 timelock requirement; no upgrades possible
- ✓ No admin control — no multisig, EOA, or governance with power over core parameters; peripheral revenue-routing governance does not affect user funds or protocol logic
- ✓ No fund access — no privileged actor can move user collateral or BOLD
- ✓ Extensive audits — ChainSecurity, Coinspect, Dedaub (multiple rounds), Certora formal verification, Recon invariant testing, plus 800+ researcher Cantina contest
- ✓ 6+ months of production on the redeployed contracts (since May 2025) with no incidents

⚠ Track record: ~12 months on the redeployed contracts is at the borderline of the Stage 2 threshold; the original January 2025 deployment was retired after a material bug was found in audit
⚠ External dependencies: rated `mixed` due to single-source Chainlink oracles (no fallback — staleness shuts down a branch) and LST issuer dependencies on Lido and Rocket Pool

**Why Not Stage 2:**
- Track record on the canonical (redeployed) contracts is right at the 12-month threshold and the original deployment shipped a material Stability Pool bug to mainnet, even though it was caught pre-exploit
- External dependencies are `mixed` rather than `decentralized` — Chainlink without a fallback creates a single point of failure that triggers permanent branch shutdown, and LST exchange rate dependencies pass through Lido and Rocket Pool risk
- Stage 2 would require either a longer clean track record on the current contracts or adding a fallback oracle path

**Justification:**
Liquity V2 is architecturally Stage-2-grade — fully immutable, no admin, permissionless mechanics, and one of the most thoroughly audited launches in DeFi (six firms plus an 800-researcher contest plus formal verification). The reasons it lands at Stage 1 are operational, not architectural: the original January 2025 deployment shipped a Stability Pool bug that forced a redeploy, the canonical contracts are right at twelve months of clean production, and the single-source Chainlink oracle design (with shutdown rather than failover) plus LST issuer exposure together qualify as `mixed` external dependencies rather than `decentralized`. As track record accumulates on the current contracts without incident, this protocol is a credible candidate to advance to Stage 2.

## Links

- [Official Website](https://www.liquity.org/bold)
- [V2 Documentation](https://docs.liquity.org/v2-documentation/)
- [Risk Disclosure](https://docs.liquity.org/v2-documentation/risk-disclosure)
- [Audits Index](https://docs.liquity.org/v2-documentation/technical-docs-and-audits)
- [GitHub — Bold](https://github.com/liquity/bold)
- [GitHub — V2-gov](https://github.com/liquity/V2-gov)
- [Auditing Liquity V2 (Liquity Blog)](https://www.liquity.org/blog/auditing-liquity-v2)
- [V2 Redeployment Post-Mortem](https://www.liquity.org/blog/liquity-v2-redeployment)
- [Cantina Bug Bounty](https://cantina.xyz/bounties/7aa23a2b-7e8b-4b88-a9bb-713dc102a11a)
- [BoldToken Contract](https://etherscan.io/address/0x6440f144b7e50D6a8439336510312d2F54beB01D)
- [CollateralRegistry Contract](https://etherscan.io/address/0xf949982B91C8c61e952B3bA942cbbfaef5386684)
- [DeFiLlama](https://defillama.com/protocol/liquity-v2)
