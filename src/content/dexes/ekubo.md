---
name: "Ekubo"
category: "dexes"
stage: 1
website: "https://ekubo.org"
chains: ["ethereum", "arbitrum", "starknet"]
tvl: "$26M"
lastUpdated: "2026-05-23"
risks:
  upgradeability: "timelock-7d+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "none"
  trackRecord: "~2.75 years on Starknet, ~1+ year on Ethereum; May 2026 EVM router exploit (~$1.4M, peripheral router only, LP funds and Core unaffected; post-mortem and patched router still pending as of late May 2026)"
---

# Ekubo Risk Assessment

## Overview

Ekubo is a concentrated-liquidity AMM founded by Moody Salem, a former Uniswap Labs engineer who was a core contributor to Uniswap V3 and a lead architect on Uniswap V4. The protocol pioneered a **singleton "Core" contract** holding all pool state — the same architectural pattern Uniswap V4 later adopted — shipped in production before Uniswap V4's release. Pool behavior can be extended via **Extensions** (the hooks equivalent), including a native TWAMM/DCA extension and a TWAP oracle extension.

Ekubo launched on Starknet (Cairo implementation) on August 26, 2023 and became the dominant DEX on Starknet. The Ethereum mainnet deployment (Solidity, heavily optimized with Yul) shipped in 2025; the V3 release with Arbitrum support was published on May 3, 2026. As of late May 2026, Ekubo's combined TVL is approximately $26M (Starknet ~$20M, Ethereum ~$6M) — the Ethereum-side TVL dropped sharply from ~$14M earlier in May, reflecting users withdrawing and revoking router approvals following the May 6, 2026 EVM router exploit. Despite the modest absolute TVL, daily volumes have repeatedly topped $700M, ranking Ekubo among the top AMMs on Ethereum by volume. The EKUBO governance token routes 100% of protocol fees to open-market buybacks via the `revenue-buybacks` contract, with approximately 60%+ of supply staked for governance participation.

## Smart Contract Risk

**Contract Architecture:**
- **Singleton Core contract** holds all pool state across pairs and fee tiers. Extensions plug into Core to customize swap and liquidity behavior.
- **Asymmetric upgradeability:**
  - **Ethereum (and Arbitrum) Core: immutable.** Explicitly confirmed by Ekubo during the May 2026 router incident: "Ekubo's EVM contracts are immutable, meaning they cannot be patched in place."
  - **Starknet Core: upgradeable in place** (address-stable), gated by a successful on-chain DAO vote — effectively ~9 days from proposal to execution (1-day voting-start delay + 7-day voting period + 1-day execution delay).
- Key addresses (V3 release, May 3, 2026; same addresses on Ethereum and Arbitrum):
  - Core: `0x00000000000014aA86C5d3c41765bb24e11bd701`
  - MEVCaptureRouter: `0xd26f20001a72a18C002b00e6710000d68700ce00`
  - Positions: `0x02D9876A21AF7545f8632C3af76eC90b5ad4b66D`
  - Oracle extension: `0x517E506700271AEa091b02f42756F5E174Af5230`
  - TWAMM extension: `0xd47f1B1eDCfEaBb08F6eBd8FC337c27E636C75BA`
  - Starknet Core (mainnet, upgradeable): `0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b`

**Code Quality:**
- **Cairo (Starknet):**
  - Nethermind Security — 15 engineer-weeks on core contracts (partially redacted)
  - Plainshift — February 14, 2025, comprehensive Cairo audit
  - Cairo Security Clan — Starknet L1 Proxy (governance)
  - Additional audits on the TWAMM extension and Revenue Buybacks contract
- **Solidity (Ethereum/Arbitrum):**
  - ABDK — V2 Core, plus TWAMM audit and TWAMM invariant analysis
  - Plainshift — V2 EVM contracts
  - V3 audits published in the `audits/` directory of the EVM repos
- **Code4rena public audit competition** — November 19 to December 10, 2025, $183,500 USDC pool.
- No Trail of Bits engagement and no public Certora formal verification have been confirmed.
- No public Immunefi bug bounty has been confirmed; a comparable self-hosted program could not be verified.

**Attack Surface:**
- EVM Core is immutable: LP funds cannot be touched by admin or governance. This is the dominant structural safeguard.
- Starknet Core is governance-upgradeable: a malicious upgrade approved by EKUBO token-holders could in principle reach Starknet LP funds, but only after the ~9-day voting/execution window.
- Peripheral routers carry separate trust assumptions and have separately exploitable surfaces (see Track Record — May 2026 EVM router incident).
- Extensions are external contracts plugging into Core; bugs in third-party Extensions affect users of those Extensions but not Core-level LP funds.

## Admin/Governance Risk

**Governance Structure:**
- An on-chain **DAO** controls the protocol. The DAO holds total ownership of Ekubo Protocol smart contracts; it can upgrade contracts on Starknet and direct revenue on both EVM and Starknet.
- Governor parameters: 1-day voting-start delay, 7-day voting period, 3.5M-token quorum, 1-day execution delay. Approximately 31 proposals have been voted to date; ~62% of supply is staked for governance.
- On EVM, the only privileged role on Core is an `owner` capable of **withdrawing protocol fees** (not LP funds). This role is assigned to the L1 `StarknetOwnerProxy`, which is itself controlled by the Starknet governor.

**Key Controls:**
- EVM Core: owner can only withdraw protocol fees; cannot upgrade, pause, or seize LP funds.
- Starknet Core: DAO can upgrade implementation via the ~9-day timelocked governance path.
- Revenue direction (buybacks vs treasury allocations) is set by DAO proposals.

**Trust Assumptions:**
- EVM: LP funds are not subject to admin trust assumptions — the contracts are immutable.
- Starknet: LP funds depend on DAO governance behaving honestly. Token-weighted governance with ~62% staking participation is a meaningful but non-trivial trust assumption — a coordinated token-holder majority could approve a malicious upgrade.
- Cross-chain dependency: the L1 `StarknetOwnerProxy` flow depends on the Starknet L1↔L2 messaging bridge for governance-controlled actions reaching EVM contracts.

## External Dependencies

**Oracle System:**
- None at the AMM level. Pricing is endogenous (constant-product on concentrated-liquidity ticks).
- Ekubo offers a **native TWAP oracle extension** that other protocols can consume; this is an output from Ekubo, not an input dependency.

**Off-Chain Actors:**
- None required for core AMM operation. Anyone can call public AMM functions; there are no keepers, relayers, or sequencers in the Core path.
- The Starknet sequencer is the underlying L2 dependency for Starknet operation but is a chain-level rather than protocol-level dependency.

**Overall Rating Justification:**
Rated `none`. Core AMM operation requires no oracles, keepers, or off-chain services on either deployment. This is the same posture as Uniswap V3/V4 by construction.

## Economic Risk

**Liquidity Risk:**
- ~$26M combined TVL as of late May 2026 (Starknet ~$20M, Ethereum ~$6M). Ethereum-side TVL contracted sharply from ~$14M earlier in the month as users withdrew and revoked router approvals after the May 6 incident. Modest absolute TVL is offset by deep concentrated-liquidity efficiency and high daily volumes (>$700M reported).
- Starknet remains Ekubo's dominant venue by share within that chain; Ethereum is competitive on volume but small on TVL.
- Pool composition determines per-pool risk; ETH and stablecoin pairs dominate the TVL footprint.

**Operational History:**
- Starknet mainnet: ~2 years 9 months live (August 2023 → May 2026). No Starknet exploit publicly reported.
- Ethereum mainnet: ~1 year 2 months live (March 2025 → May 2026).
- **May 6, 2026 — EVM swap router exploit (peripheral):** An attacker drained approximately $1.4M (mostly WBTC) by exploiting the EVM swap router, not Core. The `IPayer.pay` callback failed to verify that the payer matched the legitimate lock initiator, allowing the attacker to pull tokens from users who had previously approved the router. The attack looped ~85 times for ~0.2 WBTC per iteration; one victim lost 17 WBTC. Only the Ethereum V2/V3 and Arbitrum V3 routers were affected. **Core, LP funds, and the Starknet deployment were unaffected.** Because EVM contracts are immutable, remediation requires redeployment and user migration; users were told to revoke approvals at revoke.cash. A refund portal was launched within hours.
- **Incident response status (as of 2026-05-23, ~17 days post-exploit):** No full public post-mortem has been published, no patched router redeployment is visible in the `evm-contracts` repo (latest release remains v3.1.1 dated May 3, pre-exploit), and full victim reimbursement has not been confirmed. The slow remediation cadence is a Stage 1 quality signal worth flagging even though the core fund-custody surface was never at risk.
- No other publicly reported incidents.

## Stage Assessment

**Stage 1 Criteria Met:**

- ✓ Timelock ≥48h — Starknet upgrade path has an effective ~9-day delay (1-day voting-start delay + 7-day voting period + 1-day execution delay); EVM Core is fully immutable
- ✓ Admin control via decentralized governance — on-chain DAO with ~62% supply staking participation, ~31 proposals voted to date
- ✓ Admin powers clearly scoped — EVM `owner` can only withdraw protocol fees, not LP funds; Starknet upgrades require timelocked governance
- ✓ Multiple independent audits — Nethermind (15 engineer-weeks), ABDK (multiple engagements), Plainshift (Cairo + EVM), Cairo Security Clan, plus a Code4rena public audit competition concluded December 2025
- ✓ 6+ months in production — Starknet ~2.5 years, Ethereum ~1.2 years
- ✓ External dependencies — none at the AMM level
- ⚠ Fund access: `restricted` — EVM Core impossible (immutable); Starknet Core reachable only via timelocked DAO upgrade. Aggregate rating is `restricted`, not `impossible`, because of the Starknet upgrade path

**Why Not Stage 2:**
- **Audits:** Stage 2 requires `extensive` audits (multiple top-tier firms plus formal verification). Ekubo's audit set is `multiple` rather than `extensive` — no confirmed Trail of Bits or Certora engagement, and no public formal-verification report.
- **Upgradeability (Starknet):** Stage 2 requires `immutable` or `timelock-7d+`. The Starknet ~9-day path qualifies on duration, but the EVM-vs-Starknet asymmetry means the protocol as a whole is not uniformly immutable.
- **Track record:** Starknet ~2.5 years is approaching but does not yet meet the 12+ months at significant TVL bar with the same weight as 4+ year incumbents, and the Ethereum deployment is only ~1.2 years old. The May 2026 router incident, while peripheral, is a fresh data point.
- **Battle-tested override does not apply:** the override requires `immutable` core uniformly — Starknet Core is upgradeable.

**Justification:**
Ekubo is classified as Stage 1 (Limited Trust). The architectural posture is structurally strong — EVM Core is immutable, the protocol has no external dependencies, and on-chain governance enforces a meaningful timelock on the Starknet upgrade path. The Stage 1 (rather than Stage 2) classification reflects the asymmetric upgradeability between EVM and Starknet, an audit footprint that is broad but not yet "extensive" by Stage 2's standard (no confirmed top-tier formal verification), shorter overall track record than Uniswap V3, and the recent peripheral router incident — where the slow public remediation cadence (no post-mortem and no patched router redeployed ~17 days after the exploit) is itself a Stage 1 quality signal even though Core was untouched. Adding Trail of Bits / Certora formal verification, surviving another 12+ months without core-contract incidents, publishing a full post-mortem, and (optionally) making Starknet Core immutable would close the gap to Stage 2.

## Links

- [Official Website](https://ekubo.org)
- [Documentation](https://docs.ekubo.org)
- [GitHub](https://github.com/EkuboProtocol)
- [Audits Index](https://docs.ekubo.org/integration-guides/reference/audits)
- [Code4rena November 2025 Audit](https://code4rena.com/audits/2025-11-ekubo)
- [Governance App](https://app.ekubo.org/governance)
- [DeFiLlama](https://defillama.com/protocol/ekubo)
- [May 2026 Router Incident — The Block](https://www.theblock.co/post/400189/attackers-drain-1-4m-in-wrapped-bitcoin-from-defi-protocol-ekubo-in-approval-based-exploit)
