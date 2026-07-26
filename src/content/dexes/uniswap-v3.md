---
name: "Uniswap V3"
baseName: "Uniswap"
category: "dexes"
stage: 2
website: "https://uniswap.org"
chains: ["ethereum", "arbitrum", "polygon", "optimism", "base", "avalanche"]
tvl: "$1.6B"
lastUpdated: "2026-03-13"
risks:
  upgradeability: "immutable"
  adminControl: "governance"
  fundAccess: "impossible"
  audits: "extensive"
  externalDependencies: "none"
  trackRecord: "4+ years"
---

# Uniswap V3 Risk Assessment

## Overview

Uniswap V3 is a decentralized exchange using concentrated liquidity AMM, allowing liquidity providers to allocate capital within specific price ranges for up to 4000x capital efficiency over V2. Core contracts are immutable and governed by UNI token holders.

Launched May 5, 2021, V3 introduced concentrated liquidity positions represented as NFTs, an improved TWAP oracle, and multiple fee tiers (0.01%, 0.05%, 0.30%, 1%). It is deployed across 41+ chains, maintains ~$1.6B TVL, and has processed $2.75T+ in cumulative volume with zero exploits of core contracts.

## Smart Contract Risk

**Contract Architecture:**
- Core/periphery split: security-critical contracts (Factory, Pool) are immutable; periphery (Router, NonfungiblePositionManager) is replaceable
- UniswapV3Factory (`0x1F98431c8aD98523631AE4a59f267346ea31F984`): deploys Pool contracts, manages fee tier configuration
- UniswapV3Pool: one per token pair per fee tier, immutable after deployment
- NonfungiblePositionManager (`0xC36442b4a4522E871399CD717aBDD847Ab11FE88`): periphery contract handling NFT-based LP positions
- SwapRouter (`0xE592427A0AEce92De3Edee1F18E0157C05861564`): stateless periphery for swap execution
- No proxy patterns or delegatecall in core contracts

**Code Quality:**
- Trail of Bits audit (January – March 2021, 3 engineers): found 10 issues (2 high severity, resolved). Included Echidna fuzzing and Manticore symbolic execution
- ABDK Consulting audit (April 2021): periphery contracts review, 159 minor issues identified
- Formal verification by multiple parties: Certora (Prover tool on core invariants), MetaTrust Labs (Isabelle/HOL theorem prover on financial model), Runtime Verification (symbolic execution of bytecode)
- Open source on GitHub (`Uniswap/v3-core`, `Uniswap/v3-periphery`)
- 214 protocol forks providing extensive community code review

**Attack Surface:**
- Minimal due to immutability of core contracts
- No admin functions that can access user funds
- TWAP oracle manipulation requires sustained capital across multiple blocks; flash loan resistant
- Reentrancy protections built into core logic
- Universal Router reentrancy vulnerability discovered by Dedaub via bug bounty — periphery only, no funds lost, patched via redeployment

## Admin/Governance Risk

**Governance Structure:**
- UNI token holders control governance with 40M UNI quorum
- Minimum 2-day timelock (hard-coded minimum, 30-day maximum, 14-day grace period)
- Governance scope limited to: enabling new fee tiers (`enableFeeAmount()`), setting protocol fee on pools, changing Factory owner

**Key Controls:**
- Factory owner can enable fee tiers (new pool types)
- Protocol fee capped at a fraction of LP fees per pool
- Cannot modify pool logic, upgrade contracts, pause trading, or freeze funds
- No emergency withdrawal mechanisms
- Fee switch activated December 25, 2025, via UNIfication governance proposal (~99.9% approval, 125.3M UNI in favor). Protocol fees set on curated high-volume V3 pools on Ethereum, initially at 1/4 of LP fees for 0.01% and 0.05% fee tier pools. 100M UNI burned

**Trust Assumptions:**
- Governance cannot drain user funds or modify pool logic
- Fee changes only affect future swap fees, not existing positions or principal
- 2-day timelock provides exit window for any governance action
- No single points of failure in governance execution

## External Dependencies

**Oracle System:**
- Built-in TWAP oracle with configurable observation cardinality per pool
- Self-contained: price observations stored directly in pool contracts
- No external data feeds (no Chainlink, no off-chain oracles)
- Improved over V2 TWAP with geometric mean pricing and configurable observation depth
- Manipulation cost scales with pool liquidity and observation window; flash loan resistant
- Widely used as price source by other DeFi protocols

**Off-Chain Actors:**
- None for core protocol. All swaps, concentrated liquidity operations, fee collection, and TWAP observations execute entirely on-chain
- Auto Router and front-end SDK perform off-chain route optimization for convenience but are not required
- Position management (minting, adjusting ranges, collecting fees) is fully on-chain via NonfungiblePositionManager

**Overall Rating Justification:**
None. Uniswap V3 has no external dependencies for core functionality. The TWAP oracle is on-chain and self-updating. No keepers, relayers, or off-chain computation required. Users can interact directly with pool contracts without any intermediary.

## Economic Risk

**Liquidity Risk:**
- ~$1.6B TVL across 41+ chains
- Deep liquidity in major pairs (ETH/USDC, ETH/USDT, WBTC/ETH)
- Concentrated liquidity can create price impact in thin ranges if LPs withdraw
- Most liquid DEX by trading volume

**Operational History:**
- Launched May 5, 2021
- $2.75T+ cumulative volume processed
- Zero exploits of core contracts in 4+ years
- Universal Router reentrancy vulnerability (periphery, no funds lost, patched)
- Consistently highest DEX volume across markets
- Survived May 2022 crash and FTX collapse with no issues
- 214 forks across DeFi ecosystem

## Stage Assessment

**Stage 2 Criteria Met:**
- ✓ Immutable core contracts — no proxy patterns, no upgrade capability
- ✓ Governance with 2-day timelock, scope limited to fee parameters and fee tier configuration
- ✓ No admin fund access — governance cannot drain, freeze, or redirect user funds
- ✓ Extensive audits — Trail of Bits + ABDK audits, formal verification by Certora, MetaTrust, and Runtime Verification
- ✓ Self-contained TWAP oracle with no external dependencies
- ✓ 4+ years of production with $2.75T+ volume and zero core exploits

**Justification:**
Uniswap V3 achieves Stage 2 (Trustless). Core contracts are immutable with no upgrade path. Governance scope is narrowly limited to fee parameters with a 2-day enforced timelock. The protocol is fully self-contained with no external dependencies. Multiple independent audits from top-tier firms combined with formal verification and 4+ years of zero-exploit production history across 41+ chains provide the highest level of security assurance in DeFi.

## Links

- [Official Website](https://uniswap.org)
- [V3 Documentation](https://docs.uniswap.org/contracts/v3/overview)
- [GitHub](https://github.com/Uniswap/v3-core)
- [Factory Contract](https://etherscan.io/address/0x1f98431c8ad98523631ae4a59f267346ea31f984)
- [Trail of Bits Audit](https://github.com/Uniswap/v3-core/tree/main/audits)
- [Deployment Addresses](https://docs.uniswap.org/contracts/v3/reference/deployments/)
- [Governance](https://app.uniswap.org/governance)
