---
name: "Sushi"
category: "dexes"
stage: 2
website: "https://www.sushi.com"
chains: ["ethereum", "arbitrum", "polygon", "optimism", "base", "avalanche", "bsc"]
tvl: "$100M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "immutable"
  adminControl: "multisig-diverse"
  fundAccess: "impossible"
  audits: "multiple"
  externalDependencies: "none"
  trackRecord: "5+ years; core AMM never exploited; April 2023 RouteProcessor2 exploit ($3.3M) was in peripheral aggregator"
---

# Sushi Risk Assessment

## Overview

Sushi is one of the longest-running decentralized exchanges. It launched on August 28, 2020 as a near-direct fork of Uniswap V2, deployed by the pseudonymous "Chef Nomi," and grew via a vampire-attack incentive program that migrated more than a billion dollars of liquidity away from Uniswap in its first week. SushiSwap V3 — a fork of Uniswap V3 — launched on May 4, 2023 after the expiry of Uniswap V3's Business Source License, initially across 13 chains and later extending to 30+ chains via the SushiXSwap cross-chain stack.

This assessment covers Sushi's **core AMM product** (V2 and V3) on Ethereum mainnet. Peripheral products — the RouteProcessor aggregator family, MasterChef farms, BentoBox, Kashi lending, and Trident — are out of scope; they carry separate trust assumptions and have separately exploitable surfaces (notably the April 2023 RouteProcessor2 incident discussed under Track Record). Combined V2 + V3 TVL on Ethereum is approximately $100M as of May 2026 (DeFiLlama: ~$45M V2, ~$59M V3), down materially from peaks above $5B in 2021 as Uniswap V3/V4 captured share.

## Smart Contract Risk

**Contract Architecture:**
- **V2 (constant-product AMM, Uniswap V2 fork):**
  - `SushiV2Factory`: `0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac` — immutable bytecode, verified on Etherscan.
  - `SushiV2Router02`: `0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f`.
  - Pair contracts are deployed via CREATE2 from the factory; pair bytecode is fixed and immutable. No proxy, no upgrade path.
- **V3 (concentrated liquidity, Uniswap V3 fork):**
  - `SushiV3Factory`: `0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F`.
  - Pool contracts are deployed deterministically by the factory; pool logic is immutable.
- Source: `sushiswap/v2-core`, `sushiswap/v3-core`, `sushiswap/v3-periphery`.
- **Out of scope (peripheral):** `RouteProcessor` / `RedSnwapper` aggregator routers are deployed fresh per version rather than upgraded; they hold user approvals and route swaps but do not custody LP funds. Successive versions replaced exploited ones — see Track Record.

**Code Quality:**
- V2 inherits the Uniswap V2 audit lineage (Trail of Bits, Consensys Diligence, 2020) and was additionally reviewed by **PeckShield** and **Quantstamp** at Sushi's launch.
- V3 audits in `sushiswap/v3-core/audits/` include reports from **ABDK Consulting** and **Trail of Bits**. V3 also inherits Uniswap V3's extensive prior audit and formal verification work, although that lineage transfers only by code equivalence and is not a Sushi-commissioned engagement.
- No public Certora formal verification engagement is listed.
- Open source at github.com/sushiswap.
- Bug bounty active on Immunefi; maximum payout **$200,000** for critical smart contract vulnerabilities (capped at 10% of economic damage). Scope covers V2 cpAMM, V3 concentrated-liquidity AMM, and the RedSnwapper aggregator. Last updated October 2025.

**Attack Surface:**
- V2 and V3 core pools have no admin functions over user funds — once deployed, factory and pair/pool contracts behave like their Uniswap counterparts: no pause, no upgrade, no fund-access role.
- Standard AMM risks apply: sandwich attacks, MEV extraction by searchers, and price-manipulation risk for protocols that use V2/V3 pool prices as oracles. These are user/integrator-side, not protocol-side.
- The only privileged AMM-level lever is the factory fee switch (V2 `feeToSetter`, V3 `owner`/`feeAmountEnabled`), which can redirect a portion of swap fees but cannot drain LP principal.
- The April 2023 RouteProcessor2 exploit was a peripheral-aggregator bug (missing pool validation in `processRoute`) and did **not** affect V2 or V3 core pools.

## Admin/Governance Risk

**Governance Structure:**
- **V2 and V3 core pools are not governable** — there is no upgrade path, no pause, and no fund-recovery role. Governance applies only to the fee switch and to treasury/peripheral matters.
- The factory fee setters point to the **Sushi Ops multisig** (Gnosis Safe at `0x19B3Eb3Af5D93b77a5619b047De0EED7115A19e7`), reported as a 3-of-6 signer set composed of core contributors. The signer composition is sourced from community documentation that may be stale; signer identities and current threshold should be verified against the on-chain Safe configuration.
- A separate Treasury multisig controls DAO treasury funds.
- DAO governance is conducted **off-chain via Snapshot** using SUSHIPOWAH (xSUSHI + SUSHI-ETH LP weighting). Only Core-team-posted Snapshot proposals are binding by convention. There is no on-chain timelock or executor enforcing Snapshot outcomes on V2/V3 contracts.

**Key Controls:**
- Toggling the V2/V3 protocol fee switch is the only AMM-level admin action available; it cannot touch LP principal.
- Treasury and grants flow through the Treasury multisig and SUSHI emissions, which are independent of AMM contract security.

**Trust Assumptions:**
- LP funds in V2 and V3 pools are not subject to admin trust assumptions — the Ops multisig can change where protocol fees flow but cannot upgrade, pause, or drain pools.
- Governance trust applies to treasury management, peripheral contract deployment decisions, and any future fee-switch parameter changes — not to LP principal safety.

## External Dependencies

**Oracle System:**
- None at the AMM level. V2 and V3 pools have no oracle dependency; integrators may use the pools as price sources (TWAPs) but the pools themselves do not consume external prices.

**Off-Chain Actors:**
- None at the AMM level. V2 and V3 pool operation requires no keepers, relayers, sequencers, or off-chain services. Anyone can call public AMM functions.
- The peripheral aggregator computes routes off-chain via Sushi's routing API and submits them on-chain, but this is outside the V2/V3 contract scope and only affects users who approve the router.

**Overall Rating Justification:**
Rated `none`. The V2 and V3 AMM contracts have no external dependencies — no oracles, no keepers, no off-chain governance executor, no bridges. This is the same posture as Uniswap V2/V3 by construction.

## Economic Risk

**Liquidity Risk:**
- ~$100M combined V2 + V3 TVL on Ethereum as of May 2026, with deeper liquidity distributed across 30+ EVM chains via SushiXSwap.
- Liquidity has thinned materially from the 2021 peak (>$5B) as Uniswap V3/V4 captured share, which affects swap slippage and LP profitability but not contract security.
- Pool composition determines per-pool risk: stablecoin and ETH-pair pools dominate TVL; long-tail token pools carry standard AMM risks (rug pulls in the token contract, not in the AMM).

**Operational History:**
- ~5 years 9 months live since August 28, 2020.
- **September 2020 — Chef Nomi episode:** Founder liquidated the dev fund (~$14M) and subsequently returned it; protocol survived a near-death governance crisis when Sam Bankman-Fried organized a 9-of-multisig handover to community contributors. No user funds were lost.
- **April 8–9, 2023 — RouteProcessor2 exploit (peripheral):** Approximately $3.3M (~1,800 WETH) drained from users who had approved the just-deployed RouteProcessor2 aggregator. Root cause: `processRoute` did not validate that the supplied `pool` address was an actual Uniswap V3 pool; the attacker passed a malicious contract that abused the `uniswapV3SwapCallback` to pull approved tokens. An initial whitehat rescue by HYDN was front-run by MEV bots; approximately 885 ETH was ultimately recovered, and Sushi committed to making users whole. **The bug was in the peripheral aggregator router, not in V2 or V3 core pools.**
- **March 2023 — SEC subpoena** served on Sushi DAO and Head Chef Jared Grey over the SUSHI token; Grey eventually departed amid treasury and governance controversy.
- **V2 and V3 core AMM contracts have never been exploited.**

## Stage Assessment

**Stage 2 Criteria Met:**

- ✓ Immutable core contracts — V2 and V3 factories and pair/pool contracts have no upgrade mechanism
- ✓ No admin fund access — no pause, no drain, no recover; worst case from the fee switch is redirecting a portion of swap fees
- ✓ No external dependencies — no oracles, keepers, or off-chain actors required for pool operation
- ✓ 5+ years of production operation with no exploit of the core AMM contracts
- ⚠ Audits: `multiple` — V2 inherits Uniswap V2 audits plus PeckShield and Quantstamp at launch; V3 has ABDK and Trail of Bits in-repo, plus inherited Uniswap V3 audit lineage. Does not meet the `extensive` threshold (multiple firms plus formal verification) on Sushi-commissioned reports alone — **qualifies for the battle-tested override**
- ✓ Battle-tested override applies: `immutable` core, `fundAccess: impossible`, `externalDependencies: none`, ≥5 years of operation with peak TVL well above $100M sustained for multiple years, no exploit of the core contracts, and at least one audit from a reputable firm (Trail of Bits on V3)

**Why Not Stage 1 or Stage 0:**
- Sushi's V2 and V3 core AMM contracts are structurally immutable Uniswap forks. There is no admin path that can compromise LP funds. Stage 0 and Stage 1 criteria around upgrade gating, admin controls, and fund access do not apply because the contracts in question have no upgrade or admin mechanism over user funds.

**Justification:**
Sushi is classified as **Stage 2 (Trustless)** at the core AMM level via the battle-tested override. V2 and V3 pools are immutable forks of Uniswap V2 and V3, have no admin path that can touch LP funds, and have operated for 5+ years (V2) and 2+ years (V3) without a core-contract exploit. Audit coverage on Sushi-commissioned engagements is `multiple` rather than `extensive`, but the battle-tested override applies cleanly: immutable contracts, no fund access, no external dependencies, multi-year operation with high peak TVL, and no core-contract incidents. **Important caveat:** this classification covers V2 and V3 core pools only. Peripheral products — RouteProcessor/RedSnwapper aggregators, MasterChef farms, BentoBox, and Kashi — carry separate, materially higher trust assumptions and have separately exploitable surfaces, as demonstrated by the April 2023 RouteProcessor2 incident. Users approving the aggregator router are not protected by the core AMM's immutability.

## Links

- [Official Website](https://www.sushi.com)
- [Documentation](https://docs.sushi.com)
- [GitHub](https://github.com/sushiswap)
- [V3-core Audits](https://github.com/sushiswap/v3-core/tree/master/audits)
- [Governance Forum](https://forum.sushi.com)
- [Snapshot](https://snapshot.org/#/sushigov.eth)
- [Bug Bounty](https://immunefi.com/bug-bounty/sushiswap/)
- [RouteProcessor2 Post-Mortem](https://www.sushi.com/blog/routeprocessor2-post-mortem)
- [DeFiLlama](https://defillama.com/protocol/sushiswap)
