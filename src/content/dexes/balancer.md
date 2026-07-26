---
name: "Balancer"
category: "dexes"
stage: 1
website: "https://balancer.fi"
chains: ["ethereum", "arbitrum", "polygon", "optimism", "base", "avalanche"]
tvl: "$150M"
lastUpdated: "2026-03-16"
risks:
  upgradeability: "immutable"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "5+ years, November 2025 exploit ($128M)"
---

# Balancer Risk Assessment

## Overview

Balancer is a decentralized exchange protocol that generalizes the AMM concept to support pools with arbitrary token compositions and weights. Unlike standard 50/50 pools, Balancer enables weighted pools with any ratio (e.g., 80/20) and supports up to 8 tokens per pool, along with stable pools for correlated assets and boosted pools for capital efficiency.

The protocol operates across two major versions: V2 (launched April 2021) uses a single Vault contract holding all pool liquidity, while V3 (launched December 2024) introduces a redesigned Vault with transient storage, hooks for extensibility, and native yield-bearing token support. The November 2025 exploit of V2's ComposableStablePool drained ~$128M across 6 chains, making it one of the largest DeFi exploits in history.

## Smart Contract Risk

**Contract Architecture:**
- **V2**: Single Vault contract (`0xBA12222222228d8Ba445958a75a0704d566BF2C8`, same address on all chains) holds all tokens for all pools. Pool math logic is separated from token accounting. Pool types (WeightedPool, ComposableStablePool, LinearPool) are deployed via immutable factory contracts
- **V3**: Redesigned Vault using EIP-1153 transient storage for flash accounting. Hooks system for custom pool behavior. Confirmed NOT affected by the November 2025 exploit — its architecture inherently prevents that class of vulnerability
- Both V2 Vault and V3 Vault are non-upgradeable (no proxy pattern). The V2 Vault's emergency pause window expired July 18, 2021. Individual pool contracts are immutable once deployed
- The V2 Vault references an external TimelockAuthorizer for permissions, which can be changed by governance

**Code Quality:**
- V2: 11 audits by OpenZeppelin, Trail of Bits, Certora, and ABDK. Formal verification by Certora on Stable Pools (2022)
- V3: Audited by Certora (formal verification, Aug-Sep 2024), Spearbit (Oct 2024), and Trail of Bits. Code review competitions held pre-launch
- Bug bounty on Immunefi: up to $1M for critical smart contract bugs
- Despite 11 V2 audits including formal verification, none caught the rounding vulnerability exploited in November 2025. Trail of Bits flagged rounding concerns in 2021 (finding TOB-BALANCER-004) but could not determine exploitability

**Attack Surface:**
- V2 ComposableStablePool rounding error was exploitable via chained micro-swaps in `batchSwap`
- Single Vault design concentrates all pool liquidity — a Vault-level bug would affect every pool
- Rate providers (external contracts supplying exchange rates for yield-bearing tokens) are trust dependencies per pool
- Custom pool types and the V3 hooks system expand the audit surface

## Admin/Governance Risk

**Governance Structure:**
- veBAL (80/20 BAL/ETH BPT locked for voting power) holders vote via Snapshot (off-chain)
- Community-run multisigs execute on-chain what veBAL holders decide — multisigs do not have independent decision-making authority
- DAO Multisig (Ethereum): `0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f`
- Balancer Maxis operate lower-threshold operational multisigs (2-of-7 or 3-of-7) for routine operations

**Key Controls:**
- **TimelockAuthorizer**: Configurable per-action delays (not a single global value). More sensitive actions get longer delays
- **Emergency SubDAO**: 4-of-7 multisig that can pause individual pools and kill gauges. Hypernative automated monitoring modules authorized (BIP-794) to pause ComposableStablePool V6 pools automatically in exploit scenarios
- Governance can authorize new pool factories, change the Authorizer contract, and set protocol fee parameters
- Governance cannot modify deployed pool logic or V2 Vault core logic (both immutable)

**Trust Assumptions:**
- Off-chain Snapshot voting with multisig execution means trust is placed in the multisig to faithfully execute governance decisions
- Emergency SubDAO can pause pools, which temporarily freezes liquidity but is scoped to individual pool types
- The Authorizer contract referenced by the Vault can be swapped by governance, which could in theory change the permission model

## External Dependencies

**Oracle System:**
- Core weighted pools use no external oracles — pricing is purely from internal reserve ratios and weighted math
- **Rate providers** are external contracts (from token issuers like Lido, Rocket Pool) that supply exchange rates for yield-bearing tokens in ComposableStablePools and MetaStablePools. A malicious or buggy rate provider could affect pool pricing. These are decentralized dependencies, not centralized ones
- V2 had built-in TWAP oracle functionality (deprecated in some newer pool types)

**Off-Chain Actors:**
- Smart Order Router (SOR) is fully off-chain for trade routing optimization. Not required for protocol operation — users can swap directly against individual pools. All settlement happens on-chain
- Relayers must be authorized by both the DAO and individual users (explicit opt-in). Used for complex multi-step operations

**Overall Rating Justification:**
Rated `decentralized` because core pool operations require no external oracles or off-chain actors. Rate providers are external dependencies but come from decentralized protocols (Lido, Rocket Pool) with their own security models. The SOR is optional and non-critical. All settlement, pricing math, and fund custody are fully on-chain.

## Economic Risk

**Liquidity Risk:**
- Pre-exploit TVL was ~$770M. Current TVL ~$150M — an 80% decline reflecting both stolen funds and ongoing user confidence erosion
- V3 TVL growing as migration from V2 continues
- Protocol-owned liquidity is common in Balancer pools

**Operational History:**
- V1 launched March 2020, V2 launched April 2021, V3 launched December 2024
- **November 3, 2025**: $128M exploit across 6 chains (Ethereum, Arbitrum, Base, Polygon, Gnosis, and others). Root cause was a rounding error in ComposableStablePool's `_upscaleArray` function — upscaling rounded down while downscaling could round in either direction, violating the invariant that rounding should favor the pool. Attacker chained 65+ micro-swaps via `batchSwap` in a single transaction to compound precision loss. Attack completed in under 30 minutes. White hat actors recovered ~$28M (~22%). DAO allocated $8M for user reimbursements. ~27 forked protocols also affected
- **August 2023**: Critical vulnerability in boosted/linear pools disclosed responsibly. ~$2.1M lost from $11.7M at risk. 97% of vulnerable liquidity secured through coordinated LP withdrawals
- V3 was confirmed safe by Certora — its architecture inherently prevents the V2 rounding class of vulnerability

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Immutable core contracts — V2 Vault and V3 Vault are non-upgradeable; deployed pool contracts are immutable (exceeds the timelock-48h+ minimum)
- ✓ Decentralized governance — veBAL token holders vote; community multisigs execute with configurable per-action timelocks via TimelockAuthorizer
- ✓ Admin powers clearly scoped — fund access is `restricted`; Emergency SubDAO can pause individual pools but cannot drain or redirect user funds
- ✓ Extensive audits — 11 V2 audits (OpenZeppelin, Trail of Bits, Certora, ABDK) + V3 audits (Certora formal verification, Spearbit, Trail of Bits); $1M Immunefi bug bounty
- ✓ Decentralized external dependencies — no centralized oracles; rate providers from established decentralized protocols; SOR is optional off-chain convenience, not critical infrastructure
- ⚠ Track record: 5+ years overall operation, but numerous exploits (latest occurred on **November 3, 2025**) is worth noting

**Why Not Stage 2:**
- Emergency SubDAO (4-of-7) can pause individual pools with no timelock — fund freezing capability exists at the pool level
- Governance can replace the Authorizer contract referenced by the V2 Vault, which could alter the entire permission model
- TimelockAuthorizer delays are configurable per action rather than a globally enforced minimum — governance could reduce them
- Off-chain Snapshot voting with multisig execution means trust rests partly on multisig signers faithfully executing governance decisions
- Rate providers are external contracts per pool — a malicious or buggy rate provider could distort pricing in affected pools

**Justification:**
Balancer achieves Stage 1 (Limited Trust). The core contracts are immutable across both V2 and V3, governance is decentralized via veBAL, admin powers cannot directly drain user funds, audits are extensive including formal verification, and external dependencies are fully decentralized. The November 2025 exploit ($128M) is a significant event and affects the track record dimension — but per the framework, it does not disqualify the protocol from the stage its structural characteristics warrant. The exploit was specific to V2's ComposableStablePool rounding logic; V3 is architecturally immune and was confirmed safe by Certora. Stage 2 is not achieved because the Emergency SubDAO can freeze pool liquidity without a timelock, governance retains the ability to replace the Authorizer and reconfigure action delays, and Snapshot-plus-multisig execution introduces a layer of execution trust not present in fully on-chain governance.

## Links

- [Official Website](https://balancer.fi)
- [Documentation](https://docs.balancer.fi)
- [GitHub](https://github.com/balancer)
- [Governance](https://vote.balancer.fi)
- [V2 Security](https://docs-v2.balancer.fi/reference/contracts/security.html)
- [Bug Bounty (Immunefi)](https://immunefi.com/bug-bounty/balancer/)
- [DeFiLlama](https://defillama.com/protocol/balancer)
