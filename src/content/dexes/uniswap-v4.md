---
name: "Uniswap V4"
baseName: "Uniswap"
category: "dexes"
stage: 1
website: "https://uniswap.org"
chains: ["ethereum", "arbitrum", "polygon", "optimism", "base", "avalanche"]
tvl: "$647M"
lastUpdated: "2026-03-13"
risks:
  upgradeability: "immutable"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "none"
  trackRecord: "1 year"
---

# Uniswap V4 Risk Assessment

## Overview

Uniswap V4 launched January 30, 2025, introducing a hooks system that allows developers to customize pool behavior through external smart contracts attached at defined lifecycle points. The core PoolManager singleton is immutable, but hooks introduce variable trust assumptions per pool.

V4 uses a singleton contract pattern where all pool state lives in a single PoolManager, reducing gas costs by up to 99.99% for pool creation. Flash accounting via EIP-1153 transient storage tracks internal balance deltas and settles net transfers at transaction end. The protocol supports native ETH and has achieved $100B+ in cumulative volume and ~$647M TVL within its first year across 10+ chains.

## Smart Contract Risk

**Contract Architecture:**
- Singleton PoolManager: all pools managed in one immutable contract. No proxy patterns, no upgrade mechanisms
- Flash accounting: leverages EIP-1153 transient storage to track balance deltas, settling only net transfers. Unsettled deltas revert the transaction (safety invariant)
- Hooks: external smart contracts that customize pool behavior at lifecycle points (beforeSwap, afterSwap, beforeAddLiquidity, afterAddLiquidity, etc.). Hook permissions are set at pool creation and are immutable per pool
- PoolManager inherits from `ProtocolFees` → `Owned`. The `owner` can set a `protocolFeeController` address. This is the one administrative function on the core contract
- Hooks themselves may be upgradeable, admin-controlled, or contain privileged roles — this is outside the core protocol's control

**Code Quality:**
- 5 audit firms on core contracts: OpenZeppelin (11 comprehensive audits since June 2024, found the only critical design flaw), Trail of Bits, Spearbit, ABDK, Certora
- Certora formal verification: proved solvency properties (contract always has sufficient funds) and verified protections against malicious hooks using SMT solvers
- $2.35M security competition on Cantina (September 2024, 500+ researchers, no critical vulnerabilities found)
- $15.5M bug bounty on Cantina (largest in DeFi): up to $15.5M critical, $1M high, $100K medium
- $1.2M Uniswap Foundation Security Fund for hook audit grants (16 whitelisted audit providers)
- Open source on GitHub (`Uniswap/v4-core`)

**Attack Surface:**
- Core PoolManager has minimal attack surface (immutable, formally verified)
- Hooks introduce variable risk per pool — each hook is a separate trust surface
- Hook-specific risks: reentrancy through callbacks, fee manipulation (up to 100%), admin access, upgradeability, custom accounting bugs
- Custom accounting hooks take control of underlying liquidity; bugs are potentially catastrophic for those pools
- No hook audit requirement or registry gate — users must evaluate each pool's hook independently

## Admin/Governance Risk

**Governance Structure:**
- UNI token holders control governance via DUNA framework (legal recognition for DAO)
- PoolManager `owner` can call `setProtocolFeeController()` to designate a fee controller address
- Fee controller can call `setProtocolFee()` on individual pools
- Governance cannot modify, pause, or upgrade the core singleton contract

**Key Controls:**
- Core protocol: no pause, no emergency withdrawal, no upgrade
- Protocol fee range: 0% to a capped percentage of LP fees per pool
- UNIfication proposal (December 2025) activated protocol fees on V2/V3 pools with a burn mechanism via immutable TokenJar/Firepit contracts
- Individual hooks may have independent pause, upgrade, or admin functions outside governance control
- Hook permissions (which lifecycle points a hook can access) are set at pool creation and cannot be changed

**Trust Assumptions:**
- Core protocol requires minimal trust: only the `owner` setting fee controller represents admin surface
- Each pool's risk depends on its hook implementation — hooks are opt-in
- Hook admin keys could be EOA, multisig, or governance-controlled
- Hooks could be upgradeable with instant or timelocked delays
- Hooks with custom accounting operate outside the formal verification guarantees

## External Dependencies

**Oracle System:**
- Core protocol has no built-in oracle (unlike V2/V3 TWAP)
- Hooks can implement oracle functionality (TWAP, Chainlink integration, etc.)
- No oracle dependency for core swap execution

**Off-Chain Actors:**
- Core protocol has no off-chain dependencies. Singleton contract, pool management, swap execution, and flash accounting all operate entirely on-chain
- Hooks are on-chain smart contracts executing within the transaction lifecycle
- Individual hooks may introduce their own off-chain dependencies (oracle feeds, off-chain computation) — evaluated per pool
- Off-chain SDKs exist for route optimization and hook discovery but are convenience tools, not critical infrastructure

**Overall Rating Justification:**
None at the core protocol level. The PoolManager, flash accounting, and pool execution have no external dependencies. Hooks are on-chain contracts. While individual hooks may introduce external dependencies, the core protocol operates autonomously.

## Economic Risk

**Liquidity Risk:**
- ~$647M TVL across 10+ chains
- Rapid growth since January 2025 launch
- 5,000+ hooks initialized, 150+ community-developed hooks deployed
- Liquidity fragmented across different hook implementations
- Gas efficiency improvements driving adoption from V3

**Operational History:**
- Launched January 30, 2025
- $100B+ cumulative volume in first year
- Zero exploits of core singleton contract
- No reported fund losses from hook vulnerabilities in core protocol (hook-specific incidents are possible and should be monitored)
- Cork Protocol hack demonstrated real-world hook security risks (missing access control on hook functions)

**Hook Ecosystem Risks:**
- Hook quality varies significantly — some experimental or unaudited
- Malicious or buggy hooks could steal funds, manipulate prices, or censor users within their pools
- Custom accounting hooks operate outside formal verification guarantees
- No permissioning gate for hook deployment
- Uniswap Foundation Security Fund ($1.2M) helps but does not ensure all hooks are audited

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Immutable core contract — singleton cannot be upgraded, paused, or modified
- ✓ Governance via UNI token holders with DUNA framework
- ✓ Admin powers clearly scoped — `owner` can only set fee controller, no direct fund access
- ✓ Extensive audits — 5 firms, formal verification, $2.35M competition, $15.5M bounty
- ✓ Self-contained core protocol with no external dependencies
- ✓ 12+ months of production (launched January 2025)

**Why Not Stage 2:**
- Hooks can be upgradeable with instant upgrades (varies by implementation)
- Hooks may have centralized admin control (EOA or weak multisig)
- Hooks with custom accounting can access user funds in their pools
- Hook security depends on individual developers, not the core protocol's guarantees
- The `owner` role on PoolManager (setting fee controller) represents residual admin surface

**Justification:**
Uniswap V4 achieves Stage 1 (Limited Trust). The core singleton contract is immutable, formally verified, and has the most extensive security review of any Uniswap version — 5 audit firms, formal verification, a $2.35M competition, and a $15.5M bug bounty. Hook risks are opt-in and governance scope over the core protocol is narrow (fee controller only), keeping the core at Stage 2 quality. However, the protocol's defining feature — customizable hooks — introduces variable trust assumptions that prevent Stage 2 classification. Hooks may be upgradeable, admin-controlled, or capable of accessing funds in their pools through custom accounting. Users must evaluate each pool independently, treating each hook as a separate trust surface. Fund access is rated `restricted` rather than `impossible` because the protocol fee controller represents indirect admin influence, and rather than `possible` because the core protocol cannot directly drain user funds.

## Links

- [Official Website](https://uniswap.org)
- [V4 Documentation](https://docs.uniswap.org/contracts/v4/overview)
- [GitHub](https://github.com/Uniswap/v4-core)
- [Audit Reports](https://github.com/Uniswap/v4-core/tree/main/docs/security/audits)
- [OpenZeppelin Security Story](https://www.openzeppelin.com/customer-stories/uniswap)
- [Hooks Documentation](https://docs.uniswap.org/contracts/v4/concepts/hooks)
- [Bug Bounty ($15.5M)](https://blog.uniswap.org/v4-bug-bounty)
- [Governance](https://app.uniswap.org/governance)
