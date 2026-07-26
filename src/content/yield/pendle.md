---
name: "Pendle Finance"
category: "yield"
stage: 0
website: "https://pendle.finance"
chains: ["ethereum", "arbitrum", "base", "optimism", "bsc"]
tvl: "$2.3B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "4+ years"
---

# Pendle Finance Risk Assessment

## Overview

Pendle Finance is a yield tokenization protocol that splits yield-bearing assets into Principal Tokens (PT) and Yield Tokens (YT). PT represents the principal component, redeemable at maturity, while YT entitles the holder to all yield generated until maturity. This separation enables users to trade future yield, lock in fixed rates via PT purchases, or speculate on yield movements via YT.

The protocol features a custom AMM specifically designed for PT/YT trading, with a curve that self-adjusts as maturity approaches. V1 launched in June 2021, V2 launched in November 2022 with a redesigned architecture. Pendle currently holds approximately $2.2B TVL across 11 chains. Market creation is permissionless — anyone can deploy a Standardized Yield (SY) wrapper and create a market on-chain, though the UI listing is curated by the team.

## Smart Contract Risk

**Contract Architecture:**
- **Market contracts**: Immutable once deployed. Fundamental parameters (maturity, fee structure, AMM curve) cannot be changed post-deployment.
- **PT/YT contracts**: Created via factory pattern, immutable once deployed. PT and YT are always minted and burned in equal amounts.
- **Router**: Uses the **Diamond Proxy pattern (EIP-2535)** — upgradeable. This is the single user-facing entry point that routes all function calls to different implementation facets. Facets can be upgraded, added, or removed by the multisig. This is the critical upgradeability vector: all user interactions flow through the Router.
- **SY (Standardized Yield) wrappers**: Newer deployments use upgradeable proxy contracts. These wrap underlying yield-bearing assets (stETH, aUSDC, etc.) into a standardized interface.
- **PendleMarketFactoryV3**: Factory pattern for deploying new markets. Allows treasury fee configuration.
- **Permissionless SY/market creation**: Anyone can deploy an SY wrapper and create a market on-chain. This was the attack vector exploited in the Penpie incident — a malicious SY token was deployed through Pendle's permissionless system.

**Code Quality:**
- Audited by: Ackee Blockchain (V2, April-May 2022), Dedaub (V2), Dingbats (V2), ChainSecurity (V2 Core, Boros Markets), Spearbit, Least Authority (V1) — 5 audit firms total
- 3 top Code4rena wardens engaged: cmichel (#1 ranked 2021), WatchPug (#1 ranked 2022), leastwood
- Bug bounty on Cantina: $2M max (Very Critical), $1M (Critical), $100K (High)
- Open source codebase
- No formal verification

**Attack Surface:**
- Router upgradeability: diamond proxy facets can be swapped to redirect user interactions
- SY wrapper upgradeability: proxy admin can change implementation
- Permissionless market creation allows malicious SY tokens (demonstrated by Penpie exploit)
- Underlying yield source risk passes through SY wrappers
- AMM pricing near maturity requires careful curve management

## Admin/Governance Risk

**Governance Structure:**
- **2-of-4 multisig** controls the protocol's critical functions, including Router upgrades and SY proxy administration. This falls below the 3-of-5 diverse threshold for `multisig-diverse`.
- **vePENDLE governance**: Vote-escrowed PENDLE token used for incentive allocation to pools. 80% of swap fees directed to vePENDLE holders. Lock duration determines voting power (up to 2 years). This governance mechanism controls incentive distribution, not contract upgrades.

**Key Controls:**
- **Router diamond proxy upgrades**: The 2-of-4 multisig can upgrade Router facets with no documented timelock. Since all user interactions flow through the Router, this represents an instant upgradeability risk — 2 signers could theoretically redirect all user interactions to malicious facets.
- **SY proxy admin**: Controls upgradeable SY wrapper implementations.
- **Pause controller**: The team can pause protocol operations. This was demonstrated during the Penpie hack, when contracts were paused to protect approximately $70M in user funds.
- **Fee structure**: 5% fee on all YT yield accrued. Swap fees are scaled with time to maturity.
- **PendleMarketFactoryV3**: Treasury fee updates and overridden fee settings.

**Trust Assumptions:**
- Market and PT/YT contracts are immutable — governance cannot change them post-deployment.
- Router upgradeability means governance could theoretically redirect fund flows. No timelock protection documented.
- SY wrapper upgradeability introduces additional trust in the proxy admin.
- Pause capability is a double-edged sword: protective in emergencies, but centralizes control.

## External Dependencies

**Oracle System:**
- AMM uses native TWAP oracles embedded directly in the AMM contract — no external oracle dependency for core PT/YT pricing.
- Chainlink Price Feeds integrated on Arbitrum and Optimism for liquid staking token conversions (wstETH/stETH, rETH/ETH).
- SY wrappers depend on underlying protocol exchange rates (e.g., Lido's stETH rate, Aave's aToken rate).

**Off-Chain Actors:**
- Off-chain limit order book: Orders are signed off-chain, stored on Pendle's backend API, and settled on-chain. This is supplementary — the AMM functions independently without it.
- Arbitrage bot: Equalizes prices between the AMM and the limit order book. Not critical for protocol operation.
- If the team disappeared, the limit order book would go offline but core protocol operations — yield tokenization, AMM trading, and maturity redemption — would continue functioning autonomously.

**Overall Rating Justification:**
Pendle's core AMM pricing is fully internal via embedded TWAP oracles, requiring no external price feeds for its primary operations. Chainlink is used supplementally for liquid staking conversions on L2 deployments. Off-chain components (limit order book, arbitrage bot) are supplementary and non-critical — the protocol functions autonomously without them. This meets the `decentralized` criteria: all external dependencies are decentralized or constrained, with no critical reliance on centralized systems.

## Economic Risk

**Liquidity Risk:**
- ~$2.2B TVL across 11 chain deployments
- Deep liquidity in major PT/YT markets (stETH, eETH, USDe)
- AMM designed for capital efficiency with maturity-aware curve
- Liquidity concentrates as markets approach maturity dates

**Operational History:**
- V1 launched June 2021, V2 launched November 2022
- Consistent growth through 2023-2026
- No exploits of Pendle core protocol contracts
- September 3, 2024: Penpie exploit (~$27M lost) — this was NOT a Pendle vulnerability. A reentrancy bug in Penpie's staking contract was exploited via a fake Pendle market with a malicious SY token. Pendle proactively paused contracts to protect ~$70M in user funds. The attacker laundered proceeds via Tornado Cash.
- Protocol demonstrated responsible incident response during the Penpie hack

## Stage Assessment

**Stage 0 Criteria Met:**
- **Upgradeability: `instant`** — Router uses Diamond Proxy (EIP-2535), upgradeable by 2/4 multisig with no documented timelock. All user interactions flow through the Router, making this a critical upgradeability vector.
- **Admin control: `multisig-weak`** — 2-of-4 multisig falls below the 3-of-5 diverse threshold required for Stage 1.

**Mitigating Factors (insufficient for Stage 1):**
- Market contracts, PT, and YT contracts are immutable once deployed
- Extensive audit coverage: 5 firms, 3 top wardens, $2M bug bounty
- No core protocol exploits in 4+ years of operation
- Decentralized external dependencies

**Why Not Stage 1:**
Stage 1 requires a timelock of at least 48 hours on critical upgradeable contracts AND a multisig of at least 3-of-5 diverse signers. Pendle meets neither criterion: the Router diamond proxy has no documented timelock, and the multisig is 2-of-4.

**Path to Stage 1:**
- Add a timelock (minimum 48h) to Router proxy upgrades
- Increase multisig threshold to at least 3-of-5 with diverse signers
- Make SY wrappers immutable or add timelocked upgrade paths

**Justification:**
Pendle is assigned Stage 0 (Fully Assisted) despite strong fundamentals — extensive audits, immutable market/token contracts, decentralized dependencies, and a clean 4+ year track record. The decisive factors are the Router's diamond proxy upgradeability with no timelock and the 2-of-4 multisig controlling it. Since all user interactions flow through the Router, two signers could theoretically deploy malicious facets that redirect fund flows. Until a meaningful timelock is added to Router upgrades and the multisig threshold is increased, users must trust the current signers not to act maliciously.

## Links

- [Official Website](https://pendle.finance)
- [Documentation](https://docs.pendle.finance)
- [GitHub](https://github.com/pendle-finance)
- [Security](https://docs.pendle.finance/Security/)
- [Cantina Bug Bounty](https://cantina.xyz/bounties/fb1f1c54-0cb9-4201-8791-fb1e78e6e600)
