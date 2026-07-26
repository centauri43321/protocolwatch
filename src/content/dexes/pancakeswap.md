---
name: "PancakeSwap"
category: "dexes"
stage: 2
website: "https://pancakeswap.finance"
chains: ["bsc", "ethereum", "arbitrum", "base", "polygon", "linea", "opbnb", "aptos"]
tvl: "$1.6B"
lastUpdated: "2026-05-15"
risks:
  upgradeability: "immutable"
  adminControl: "multisig-weak"
  fundAccess: "impossible"
  audits: "multiple"
  externalDependencies: "none"
  trackRecord: "4+ years, no core AMM exploit"
---

# PancakeSwap Risk Assessment

## Overview

PancakeSwap launched on BNB Chain in September 2020 as a Uniswap V2 fork and has since grown into a multi-product DEX suite spanning BNB Chain, Ethereum, Arbitrum, Base, Polygon zkEVM, zkSync Era, Linea, opBNB, and Aptos. The current product surface includes the V2 constant-product AMM, V3 concentrated liquidity (April 2023), V4 (September 2024, adopting the Uniswap V4 Singleton + hooks model), plus adjacent products such as Perpetuals, Prediction Markets, Lottery, IFOs, and veCAKE-gauge incentives.

This assessment focuses on the core AMM pools, which hold the bulk of TVL and define the protocol's trust surface. PancakeSwap inherits Uniswap's pool architecture: V2 Pair contracts and V3 Pool contracts are immutable, and the V4 Vault Singleton is also immutable. The Factory contracts retain narrow admin functions (fee-tier additions in V3, protocol-fee recipient toggle) but cannot upgrade existing pools or access LP funds. Compared with Uniswap V2 / V3 (Stage 2 with on-chain governance and extensive formal verification), PancakeSwap's operational layer is weaker: admin is a core-team multisig behind a 6-hour timelock rather than a token-governance Governor, and audit coverage, while broad, lacks formal verification.

## Smart Contract Risk

**Contract Architecture:**
- **V2 Factory** on BSC: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73` — has `feeToSetter` (timelock/multisig) for protocol-fee toggle; cannot upgrade Pair contracts
- **V2 Router**: `0x10ED43C718714eb63d5aA57B78B54704E256024E` — stateless periphery, replaceable, holds no funds
- **V2 Pairs**: immutable per-pair contracts, Uniswap V2 fork pattern, no proxy, no admin
- **V3 Factory** on BSC: `0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865` — `owner()` can call `enableFeeAmount` to add fee tiers, set LM pool deployer, transfer ownership; cannot upgrade existing pools or seize funds
- **V3 SwapRouter**: `0x1b81D678ffb9C0263b24A97847620C99d213eB14` — stateless periphery
- **V3 Pools**: immutable post-deployment
- **V4 Vault (Singleton)** on BSC: `0x238a358808379702088667322f80aC48bAd5e6c4` — immutable core; hooks are per-pool and arbitrary, so LP risk in V4 is pool-specific to the hook contract LPs opt into

**Code Quality:**
- V1/V2 audited by **CertiK**, **Slowmist**, **Peckshield**
- V3 audited by **ChainSecurity** (full report published April 2023) and **Hacken**
- V4 covered by ChainSecurity plus additional reviews; hook-specific audits ongoing
- **No formal verification** of compiled bytecode (the K-framework / Certora-style coverage Uniswap V3 received)
- Active Immunefi bug bounty (max payout historically $1M)
- Open source

**Attack Surface:**
- Pool-layer surface is small and equivalent to the Uniswap V2 / V3 / V4 surface they fork from
- Periphery contracts (Routers) are stateless and replaceable without affecting pools
- V4 hooks introduce per-pool customization risk — LPs in hook-using pools inherit that hook's trust assumptions
- No core AMM exploit has been disclosed across 4.5 years of operation, including through major market stress events

## Admin/Governance Risk

**Governance Structure:**
- **CAKE token**: primary role is emission/incentive distribution; on-chain governance is limited to **veCAKE-gauge** voting over farming emission allocation, not over core AMM contract administration
- **Snapshot voting**: used for off-chain signaling on broader strategy
- **Multisig**: a Gnosis Safe on BSC (~`0x73feaa1eE314F8c655E354234017bE2193C9E24E` for the operations multisig); historically 4-of-6 or 3-of-5. **Signers are largely PancakeSwap core team and pseudonymous** rather than a diverse external set
- **Timelock contract**: `0xA1f482Dc58145Ba2210bC21878Ca34000E2e8fE4` on BSC, **delay = 6 hours** (21,600 s). This is significantly shorter than Uniswap's 2-day governor delay or Aave's longer timelocks

**Key Controls:**
- Timelock + multisig can: enable protocol fees on V2 pairs, add new V3 fee tiers, manage MasterChef emissions, transfer factory ownership, direct treasury spending
- Cannot: upgrade V2 Pair / V3 Pool / V4 Vault logic, drain LP funds, pause swaps on existing pools (V2/V3 forks have no pause function)
- Fee changes affect future swap fees only; existing LP positions and principal are untouchable by admin

**Trust Assumptions:**
- Admin trust is bounded to fee parameter governance. Users do not need to trust the multisig or timelock with custody of LP funds — pool contracts are immutable and have no admin-callable function that can move user assets
- The 6-hour timelock is short and the multisig signer set is not diverse; this is a meaningful weakness on the dimensions that admin can affect (fee policy), but does not extend to fund-custody risk
- Cross-chain deployments: PancakeSwap operates no bridge. Tokens arrive via external bridges (LayerZero OFT, Stargate, native Wormhole wrappers); bridge risk is pushed to whoever issued the wrapped token

## External Dependencies

**Oracle System:**
- None for AMM operation. V2 (constant product) and V3 (tick math) compute prices from pool state without consulting any external oracle. V4 inherits this property
- Adjacent products: Prediction Markets use Chainlink price feeds; Lottery uses Chainlink VRF — these are isolated from the AMM and do not affect LP custody

**Off-Chain Actors:**
- None required for swap execution. Trades execute atomically on-chain
- veCAKE-gauge voting and emission distribution run on-chain via MasterChef and gauge contracts; no off-chain attestation is required

**Overall Rating Justification:**
None. The core AMM is fully self-contained on-chain. Adjacent products that do use Chainlink (Prediction, Lottery) operate in separate contract suites that LP funds do not flow through.

## Economic Risk

**Liquidity Risk:**
- TVL ~$1.6B as of mid-2026; BSC is the dominant chain at roughly 70%+ of TVL
- Consistently ranks in the top two or three DEXes globally by volume; periodically #1 by volume during BNB Chain memecoin cycles
- Deep liquidity across BNB-pair markets, with longer-tail coverage than most DEXes outside Uniswap

**Operational History:**
- Launched September 2020 on BNB Chain (4.5+ years)
- **No exploit of core AMM (V2/V3/V4) pools** at any point
- Peripheral incidents: a lottery issue in August 2021 was resolved with no user loss; ongoing phishing attacks target users at the wallet/frontend layer rather than the protocol
- Survived the May 2022 UST collapse, FTX collapse (November 2022), the 2023 bear market, and multiple subsequent volatility cycles intact
- Multi-chain expansion accelerated through 2023–2024 (Ethereum, Arbitrum, Base, Linea, zkSync, opBNB) and into Aptos with a separate Move codebase

## Stage Assessment

**Stage 2 Criteria Met (via battle-tested override):**

- ✓ Upgradeability: `immutable` — V2 Pair, V3 Pool, and V4 Vault contracts are all immutable; Factory admin functions are narrowly scoped to fee parameters
- ⚠ Admin control: `multisig-weak` — 6-hour timelock + core-team multisig with pseudonymous, non-diverse signers. This rating is descriptive of the admin layer but does not gate stage classification because the admin has no fund-access path; the Stage 2 governance criterion is contingent on the protocol being upgradeable (per framework: "Admin control is via decentralized governance *if upgradeable*"), which PancakeSwap's pools are not
- ✓ Fund access: `impossible` — no admin function can move, freeze, or redirect LP funds. Protocol-fee toggle only affects future swap fees and does not touch existing positions or principal
- ✓ External dependencies: `none` — AMM swaps require no oracle, no keeper, no off-chain actor
- ⚠ Audits: `multiple` — CertiK, Slowmist, Peckshield, ChainSecurity, and Hacken across V2/V3/V4. ChainSecurity is top-tier; the other firms are mid-tier; no formal verification. Does not meet the "extensive" threshold required for Stage 2 directly. Qualifies for the battle-tested override: immutable core, no fund access, no external dependencies, 4.5+ years live with $1B+ TVL sustained and no core exploit
- ✓ Track record: 4.5+ years across multiple chains, no core AMM exploit, survived UST/Luna, FTX, and subsequent stress

**Justification:**
PancakeSwap's pool-layer trust model is structurally equivalent to the Uniswap V2 / V3 / V4 forks it derives from: immutable contracts, no admin fund-access path, no external dependencies. The operational layer is weaker than Uniswap's — admin is a 6-hour-timelocked core-team multisig rather than an on-chain governance Governor, and audit coverage is broad but lacks formal verification of compiled bytecode. Strict Stage 2 audit criteria are not met, but the protocol qualifies via the battle-tested override: it has operated for 4.5+ years with $1B+ TVL sustained across multiple chains and no core-pool exploit, on an immutable architecture where the admin has no path to user funds. The override is appropriate here for the same reason it applies to Tornado Cash's mixer pools — the market has adversarially tested the contracts far longer and at far higher scale than any single audit firm could reproduce, and the architecture is bounded such that admin compromise cannot translate to LP losses.

The principal residual risks are weaknesses on dimensions the admin *can* affect (fee policy under a short 6-hour timelock with a non-diverse signer set) and the per-pool hook risk in V4. Neither alters the LP custody guarantees of existing V2 / V3 pools.

## Links

- [Official Website](https://pancakeswap.finance)
- [Documentation](https://docs.pancakeswap.finance/)
- [GitHub](https://github.com/pancakeswap)
- [V2 Factory (BSC)](https://bscscan.com/address/0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73)
- [V3 Factory (BSC)](https://bscscan.com/address/0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865)
- [Timelock (BSC)](https://bscscan.com/address/0xA1f482Dc58145Ba2210bC21878Ca34000E2e8fE4)
- [Audit Reports](https://docs.pancakeswap.finance/code/security-and-audits)
- [Bug Bounty (Immunefi)](https://immunefi.com/bounty/pancakeswap/)
