---
name: "Curve Finance"
category: "dexes"
stage: 1
website: "https://curve.finance"
chains: ["ethereum", "arbitrum", "optimism", "polygon", "base", "avalanche"]
tvl: "$1.8B"
lastUpdated: "2026-03-13"
risks:
  upgradeability: "immutable"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "6+ years, July 2023 Vyper exploit ($69M, 73% recovered)"
---

# Curve Finance Risk Assessment

## Overview

Curve Finance is a decentralized exchange optimized for efficient swaps between pegged and correlated assets using specialized bonding curves that minimize slippage. The protocol pioneered the StableSwap invariant and has expanded to include CryptoSwap pools for volatile pairs, crvUSD (a native stablecoin using the LLAMMA soft-liquidation mechanism), and Curve Lending (LlamaLend).

Launched in January 2020, Curve introduced the vote-escrowed tokenomics model (veCRV) that has been widely adopted across DeFi. The protocol processes billions in quarterly volume and is deployed across 10+ chains. Its core AMM pools have never been directly exploited — the July 2023 incident was caused by a Vyper compiler bug, not a flaw in Curve's contract logic.

## Smart Contract Risk

**Contract Architecture:**
- All contracts written in Vyper. Core pool types include StableSwap (pegged assets), CryptoSwap/twocrypto-ng (volatile pairs), and Tricrypto (three volatile assets)
- Pools deployed via Factory contracts using Vyper's `create_minimal_proxy_to` or EIP-5202 blueprint contracts
- **Deployed pool instances are immutable** — pool logic cannot be changed after deployment. Factory implementations can be updated to create new pools with different logic, but existing pools are unaffected
- crvUSD uses a separate architecture: Controller (user-facing), LLAMMA (soft-liquidation AMM), and ERC-4626 Vault
- Key addresses: Address Provider (`0x0000000022D53366457F9d5E68Ec105046FC4383`), CRV Token (`0xD533a949740bb3306d119CC777fa900bA034cd52`)

**Code Quality:**
- 15+ audits by ChainSecurity, Trail of Bits, MixBytes, and Quantstamp spanning 2020-2025
- ChainSecurity has conducted the most recent audits covering tricrypto-ng, crvUSD, scrvUSD, and the Fast Bridge (2023-2025)
- Formal verification in progress with Certora and HEVM for Vyper tooling
- Bug bounty program on HackerOne

**Attack Surface:**
- Permissionless pool deployment means malicious pools can exist — users must verify pool legitimacy
- crvUSD LLAMMA introduces soft-liquidation complexity with band-based collateral management
- DNS hijack incidents (August 2022, May 2025) compromised the frontend but not smart contracts; Curve migrated from curve.fi to curve.finance

## Admin/Governance Risk

**Governance Structure:**
- veCRV (Vote-Escrowed CRV): Lock CRV for 1 week to 4 years; longer lock = more voting power. Non-transferable, linearly decaying
- Built on Aragon governance contracts. Minimum 2,500 veCRV to create proposals
- Ownership votes require 30% quorum and 51% support; parameter votes require 15% quorum
- 7-day voting period plus execution delay — total governance lifecycle is approximately 10 days

**Key Controls:**
- **Ownership Admin**: DAO → Aragon Agent → Ownership Proxy → Contracts. Controls fee receivers, new pool types, gauge management
- **Parameter Admin**: Can adjust pool fees and amplification parameters
- **Emergency DAO**: 5-of-9 multisig (`0x467947EE34aF926cF1DCac093870f613C96B1E0c`) with mix of Curve team and DeFi community members. Can kill gauges (stop CRV emissions) and pause pools into withdrawal-only mode. Pools can only be killed within first 30 days. All Emergency DAO actions are reversible by the main DAO
- crvUSD debt ceilings are admin-controlled via DAO votes

**Trust Assumptions:**
- Governance cannot drain user funds from pools or modify deployed pool logic
- New pool types require voluntary user migration — no forced upgrades
- Emergency DAO provides rapid response capability but with scoped, reversible powers
- The ~10-day governance lifecycle acts as an effective timelock on all ownership changes

## External Dependencies

**Oracle System:**
- Core AMM pools (StableSwap, CryptoSwap) use **no external oracles** — pricing is derived entirely from internal reserve ratios. Pools provide their own on-chain EMA/TWAP oracles for integrators
- crvUSD uses **Curve's own pool EMA oracles** as primary price sources, chaining multiple pool prices together. **Chainlink** is used as safety bounds/price limits, not as the primary feed
- Curve Lending uses EMA oracles from Curve pools, with some markets incorporating Chainlink as an external oracle

**Off-Chain Actors:**
- No off-chain keepers required for core AMM operations
- crvUSD Peg Keepers are permissioned contracts (only designated contracts can mint/burn crvUSD), but the `update()` function is publicly callable — anyone can trigger profit distribution
- Cross-chain deployments use permissioned Verifiers to relay veCRV data from L1, introducing a small centralization vector. Fast Bridge (audited by ChainSecurity, September 2025) aims to improve this

**Overall Rating Justification:**
Rated `mixed` because the core AMM pools are fully self-contained with no external dependencies, but the broader Curve ecosystem (crvUSD, Lending) introduces Chainlink oracle dependencies for safety bounds and price feeds. Cross-chain governance relay uses a permissioned Verifier set. These elements prevent a `none` rating while the decentralized nature of the primary oracle system (Curve's own pools) keeps it from being `centralized`.

## Economic Risk

**Liquidity Risk:**
- ~$1.8B TVL across all deployments (peak of ~$24B in January 2022)
- Deep liquidity in major stablecoin pairs (3pool, FRAX, crvUSD)
- crvUSD and scrvUSD (savings vault, launched October 2024) add protocol revenue streams
- Gauge system incentivizes targeted liquidity provision

**Operational History:**
- Launched January 2020 on Ethereum mainnet
- Q3 2025 trading volume hit $29B with revenue more than doubling over prior periods
- **July 30, 2023**: $69M exploit due to Vyper compiler reentrancy bug (versions 0.2.15-0.3.0) — affected alETH/ETH ($22.6M), CRV/ETH ($24.7M), pETH/ETH ($11M), msETH/ETH ($3.4M). 73% ($52.3M) recovered via white hat returns and protocol recoveries. Net loss ~$20M. Core Curve contract logic was not at fault
- **June 2024**: Founder Michael Egorov liquidated for ~$140M in CRV across multiple lending protocols, resulting in ~$10M bad debt on Curve Lend's CRV market
- Survived UST/Luna collapse, FTX collapse, and SVB/USDC depeg without protocol-level incidents

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Core pool contracts are immutable — no proxy upgrades possible on deployed pools
- ✓ Decentralized governance via veCRV with ~10-day lifecycle (exceeds 48-hour timelock requirement)
- ✓ No direct admin fund access — Emergency DAO can only pause pools into withdrawal-only mode, and actions are reversible by the main DAO
- ✓ Extensive audits — 15+ audits by ChainSecurity, Trail of Bits, MixBytes, Quantstamp; formal verification in progress
- ✓ 6+ years of production operation since January 2020

**Why Not Stage 2:**
- External dependencies are `mixed` — crvUSD relies on Chainlink as safety bounds, and cross-chain governance uses permissioned Verifiers
- Emergency DAO (5-of-9 multisig) can pause pools, introducing a trust assumption beyond pure governance
- crvUSD debt ceilings are admin-controlled parameters that affect protocol risk exposure
- July 2023 Vyper exploit, while a compiler bug and not Curve's fault, demonstrated that the Vyper ecosystem carries supply-chain risk

**Justification:**
Curve achieves Stage 1 due to its immutable core pool contracts, decentralized veCRV governance with effective timelock, inability of admins to access user funds, and 6+ years of operational history. The protocol's core AMM is self-contained, but the broader ecosystem (crvUSD, Lending, cross-chain) introduces mixed external dependencies that prevent Stage 2. The Emergency DAO adds a useful safety mechanism with appropriately scoped and reversible powers.

## Links

- [Official Website](https://curve.finance)
- [Documentation](https://docs.curve.finance)
- [GitHub](https://github.com/curvefi)
- [Governance](https://dao.curve.fi)
- [Security Audits](https://docs.curve.finance/references/audits/)
- [Bug Bounty (HackerOne)](https://hackerone.com/curve)
- [DeFiLlama](https://defillama.com/protocol/curve-finance)
