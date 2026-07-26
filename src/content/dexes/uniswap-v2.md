---
name: "Uniswap V2"
baseName: "Uniswap"
category: "dexes"
stage: 2
website: "https://uniswap.org"
chains: ["ethereum", "base", "arbitrum", "polygon", "optimism", "avalanche"]
tvl: "$847M"
lastUpdated: "2026-03-13"
risks:
  upgradeability: "immutable"
  adminControl: "governance"
  fundAccess: "impossible"
  audits: "extensive"
  externalDependencies: "none"
  trackRecord: "5+ years"
---

# Uniswap V2 Risk Assessment

## Overview

Uniswap V2 launched on May 18, 2020, as the second iteration of the Uniswap protocol. It introduced direct ERC20-to-ERC20 swaps, flash swaps, and on-chain TWAP (time-weighted average price) oracles that became foundational infrastructure for DeFi price feeds.

V2 uses a core/periphery architecture where security-critical Pair contracts are immutable and a stateless Router handles user-facing operations. The protocol maintains ~$847M in TVL across multiple chains and has processed over $1T in cumulative volume with zero exploits of core contracts in 5+ years.

## Smart Contract Risk

**Contract Architecture:**
- Core/periphery split: minimal core (Pair, Factory) holds funds; replaceable periphery (Router) is stateless
- Factory (`0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`): singleton deploying one Pair per token pair via `create2` deterministic addressing
- Pair (`UniswapV2Pair`): each pool is its own immutable contract and ERC20 LP token. No proxy patterns
- Router (`0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`): stateless periphery, holds no funds, can be replaced without affecting pools
- Only mutable state on Factory: `feeTo` and `feeToSetter` addresses (protocol fee destination)

**Code Quality:**
- Audited by dapp.org (6 engineers, January – April 2020)
- Formal verification of `UniswapV2Pair` and `UniswapV2Factory` using the act specification language and K framework prover, verified against compiled bytecode
- Property-based fuzzing tests using the dapp testing framework
- Novel manual proof of Babylonian square root algorithm correctness
- No critical or high-severity issues found in core contracts
- Open source, forked and reviewed by hundreds of projects

**Attack Surface:**
- Minimal due to immutability of core contracts
- No admin functions that can access user funds
- Reentrancy protections via lock modifier on Pair contracts (addressed V1's ERC777 vulnerability)
- Flash swap functionality well-secured
- TWAP oracle manipulation requires sustained capital commitment across multiple blocks

## Admin/Governance Risk

**Governance Structure:**
- UNI token holders control governance (UNI launched September 2020)
- Governor contract with 40M UNI quorum requirement
- Minimum 2-day timelock (`0x1a9C8182C09F50C8318d769245beA52c32BE35BC`) on all governance actions
- Governance scope strictly limited to protocol fee activation

**Key Controls:**
- Can set `feeTo` (protocol fee recipient) and `feeToSetter` (who can change `feeTo`)
- Cannot modify pool logic, upgrade contracts, pause trading, or freeze funds
- No emergency withdrawal mechanisms
- Fee switch activated December 2025 via UNIfication governance proposal (125M+ UNI votes, ~99.9% approval): V2 fee changed from 0.30% all to LPs → 0.25% to LPs + 0.05% protocol fee. 100M UNI burned. Fees fund buyback-and-burn via immutable TokenJar contract

**Trust Assumptions:**
- Governance cannot drain user funds
- Fee changes only affect future swap fees, not existing LP positions or principal
- 2-day timelock provides warning for any governance action
- No single points of failure in governance execution

## External Dependencies

**Oracle System:**
- Built-in TWAP oracle: each Pair accumulates `price0CumulativeLast` and `price1CumulativeLast` every block, weighted by time elapsed
- Entirely on-chain, self-contained within each pool contract
- No external oracle feeds (no Chainlink, no off-chain data)
- Manipulation requires sustained capital commitment across multiple blocks; flash loans cannot manipulate TWAP
- Became the de facto standard for DeFi price feeds (2020–2021) before V3 TWAP superseded it

**Off-Chain Actors:**
- None. All swaps, flash swaps, liquidity operations, and TWAP accumulation happen atomically on-chain
- Front-end interfaces and routing SDKs exist for convenience but are not required
- Users can interact directly with pool contracts without any intermediary

**Overall Rating Justification:**
None. Uniswap V2 operates entirely on-chain with no external dependencies. TWAP oracle updates automatically with every trade — no keeper needed. No relayers, no off-chain computation, no bridge dependencies. The protocol would continue functioning identically without any team involvement.

## Economic Risk

**Liquidity Risk:**
- ~$847M TVL across multiple chains (majority on Ethereum at ~$762M)
- Deep liquidity in major stablecoin and ETH pairs
- Uniform liquidity distribution across all price ranges (less capital efficient than V3 concentrated liquidity)
- Sufficient depth for most trading needs in established pairs

**Operational History:**
- Launched May 18, 2020
- $1T+ cumulative volume processed
- Zero exploits of core contracts in 5+ years
- Dominated DEX volume from 2020–2021
- Survived March 2020 crash (pre-launch but V1), May 2022 crash, FTX collapse
- Remains actively used despite V3/V4 availability
- Deployed to additional chains via governance vote (Base, Arbitrum, Polygon, Optimism, Avalanche, BNB Chain)

## Stage Assessment

**Stage 2 Criteria Met:**
- ✓ Immutable core contracts — no proxy patterns, no upgrade capability
- ✓ Governance with 2-day timelock, scope limited to fee parameters only
- ✓ No admin fund access — governance cannot drain, freeze, or redirect user funds
- ✓ Extensive security review — dapp.org audit with K framework formal verification of compiled bytecode, property-based fuzzing, and mathematical proofs
- ✓ Self-contained TWAP oracle with no external dependencies
- ✓ 5+ years of production with $1T+ volume and zero core exploits

**Justification:**
Uniswap V2 achieves Stage 2 (Trustless). Core contracts are immutable with no upgrade path. Governance scope is narrowly limited to fee parameters with a 2-day enforced timelock, and cannot access user funds. The protocol is fully self-contained with no external dependencies. Formal verification using the K framework against compiled bytecode, combined with 5+ years of zero-exploit production history, provides strong security assurance.

## Links

- [Official Website](https://uniswap.org)
- [V2 Documentation](https://docs.uniswap.org/contracts/v2/overview)
- [GitHub](https://github.com/Uniswap/v2-core)
- [Factory Contract](https://etherscan.io/address/0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f)
- [Timelock Contract](https://etherscan.io/address/0x1a9c8182c09f50c8318d769245bea52c32be35bc)
- [dapp.org Audit Report](https://dapp.org.uk/reports/uniswapv2.html)
- [Governance](https://app.uniswap.org/governance)
