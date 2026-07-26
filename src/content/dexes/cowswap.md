---
name: "CoW Swap"
category: "dexes"
stage: 0
website: "https://cow.fi"
chains: ["ethereum", "gnosis", "arbitrum", "base", "polygon", "avalanche"]
tvl: "$0"
lastUpdated: "2026-03-16"
risks:
  upgradeability: "instant"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "4+ years, February 2023 solver exploit ($166K, no user funds lost)"
---

# CoW Swap Risk Assessment

## Overview

CoW Swap is an intent-based, meta-DEX aggregation protocol where users sign off-chain trade intents and third-party solvers compete in batch auctions to find optimal execution, including peer-to-peer matching (Coincidence of Wants), on-chain liquidity routing, and MEV protection.

Launched April 28, 2021 as Gnosis Protocol V2, CoW Swap processes approximately $2B/week in volume on Ethereum and ranks consistently among the top 3 DEX aggregators. The protocol does not custody liquidity in pools — it routes trades through external liquidity sources. CoW DAO governs the protocol via the COW token (1B initial supply). The protocol is deployed on Ethereum, Gnosis Chain, Arbitrum, Base, Polygon, and Avalanche.

## Smart Contract Risk

**Contract Architecture:**
- Core/periphery split with three main contracts:
  - GPv2Settlement (`0x9008D19f58AAbD9eD0D60971565AA8510560ab41`): main entry point where solvers call `settle()`. Deployed via CREATE2, immutable
  - GPv2VaultRelayer (`0xC92E8bdf79f0507f65a392b0ab4667716BFE0110`): handles token transfers from users during settlement. Immutable
  - GPv2AllowListAuthentication (`0x2c4c28DDBdAc9C5E7055b4C863b72eA0149D8aFE`): solver allow-list. Uses EIP-1967 Transparent Proxy — upgradeable
- Settlement contract has immutable references to the authenticator, Balancer V2 Vault, and VaultRelayer set at deployment
- VaultRelayer supports three transfer modes: direct ERC-20, external Balancer Vault balances, and internal Balancer Vault balances
- Periphery includes Eth Flow contract (`0x40a50cf069e992aa4536211b23f286ef88752187`) for native ETH trading and ComposableCoW for programmatic/conditional orders

**Code Quality:**
- Gnosis Protocol V2 audit (May 2021): core contracts reviewed pre-launch
- Ackee Blockchain audit (July 2023): ComposableCoW & ExtensibleFallbackHandler — 14 findings, 1 Critical (StopLoss arithmetic mismatch, fixed)
- Ackee Blockchain audit (March 2025): CoW Flash Loan Router — no critical issues
- Open source on GitHub (`cowprotocol/contracts`)
- Bug bounty on Immunefi since June 2021: up to $1M for critical vulnerabilities, 19 smart contract assets in scope
- No formal verification found

**Attack Surface:**
- Solver-submitted settlements are validated against user-signed order parameters (price limits, expiry, amounts)
- February 2023 exploit: malicious solver drained ~$166K in protocol fees from the settlement contract via an intermediary SwapGuard contract. No user funds affected — only accumulated protocol fees (~7 days worth). Solver bond covered losses
- VaultRelayer approval model means users grant a single token approval that covers all future trades — standard ERC-20 approval risk applies
- Upgradeable allow-list proxy is the primary smart contract attack surface

## Admin/Governance Risk

**Governance Structure:**
- CoW DAO governance via COW token holders
- Proposals discussed on forum, voted on via Snapshot
- Execution through a Safe multisig controlled by CoW DAO
- 44.4% of COW supply allocated to DAO treasury

**Key Controls:**
- GPv2AllowListAuthentication proxy has two admin roles: **manager** (adds/removes solvers) and **proxy owner** (can upgrade implementation and change manager)
- Proxy owner is controlled by CoW DAO governance via multisig
- No confirmed on-chain timelock on proxy upgrades — upgrades can be executed as soon as multisig threshold is met
- No pause mechanism on Settlement or VaultRelayer contracts
- Settlement and VaultRelayer are immutable — no admin functions

**Trust Assumptions:**
- Governance can upgrade the allow-list authenticator without an enforced delay. A malicious upgrade could allow unauthorized addresses to call `settle()`, though the settlement contract still enforces signed order parameters
- Governance controls which solvers can participate via the allow-list
- Settlement contract cryptographically enforces user-signed order parameters regardless of governance actions
- Protocol fees accumulate temporarily in the settlement contract and are controlled by governance

## External Dependencies

**Oracle System:**
- No price oracle in the traditional sense. Pricing is determined competitively by solvers in batch auctions
- Solvers use their own off-chain pricing infrastructure to compute solutions
- No Chainlink, TWAP, or other on-chain oracle dependency

**Off-Chain Actors:**
- **Orderbook**: centralized off-chain service run by the CoW Protocol team that collects user intents
- **Autopilot**: centralized off-chain service that triggers batch auctions and selects winning solutions
- **Solvers**: third-party actors who compete to settle batches. Permissioned via on-chain allow-list. Must post bonds (~$500K in stables + 1.5M COW). Bonds can be slashed by CoW DAO for malicious behavior (bad execution, unsafe buffer trading, surplus manipulation)
- If all solvers go offline, orders simply expire unfilled — users never lose funds. Eth-flow orders have automatic refund mechanisms
- Balancer V2 Vault integration for one of the three transfer modes (optional, not required)

**Overall Rating Justification:**
Mixed. The off-chain orderbook and autopilot are centralized infrastructure operated by the CoW Protocol team — if these services go down, no new batches are created. Solver participation is permissioned but bonded with slashable collateral governed by the DAO. The protocol has no oracle dependency. The combination of centralized off-chain infrastructure with economically bonded solvers places this in the mixed category.

## Economic Risk

**Liquidity Risk:**
- CoW Swap is an aggregator, not a liquidity venue — it routes through external DEX liquidity
- No protocol-owned liquidity at risk of withdrawal runs
- Execution quality depends on availability of on-chain liquidity sources and solver competitiveness
- Protocol fees temporarily held in settlement contract (~7 days accumulation)

**Operational History:**
- Launched April 28, 2021 (Gnosis Protocol V2)
- COW token launched February 2022
- ~$2B weekly volume on Ethereum as of recent data
- February 7, 2023: solver exploit drained ~$166K in protocol fees ($123K DAI, $50K BNB, $7.4K ETH). No user funds affected. Solver bond covered losses. Funds sent to Tornado Cash. Post-mortem published
- Survived May 2022 crash and FTX collapse with no issues
- Consistently top 3 DEX aggregator by volume throughout 2024-2025

## Stage Assessment

**Stage 0 Criteria:**

- ✓ Core settlement and vault relayer contracts are immutable — no proxy patterns, no upgrade capability
- ⚠ AllowListAuthentication uses EIP-1967 proxy with no confirmed on-chain timelock — proxy owner can upgrade implementation upon multisig approval
- ✓ Governance via CoW DAO with COW token holders and Safe multisig execution
- ✓ No direct admin fund access — settlement contract enforces signed order parameters cryptographically. Indirect risk via allow-list upgrade (could authorize malicious solvers)
- ✓ Multiple audits from reputable firms (2021, 2023, 2025) plus $1M Immunefi bug bounty. No formal verification
- ✓ Off-chain orderbook and autopilot are centralized but bonded solver mechanism provides economic constraints. No on-chain oracle dependency
- ✓ 4+ years of production operation with one minor incident (no user funds lost)

**Why Not Stage 1:**
- GPv2AllowListAuthentication proxy has no confirmed on-chain timelock — upgrades can be executed immediately upon multisig approval, failing the >=48-hour timelock requirement for critical upgrades
- Off-chain orderbook and autopilot are centralized infrastructure without decentralized fallbacks

**Justification:**
CoW Swap is classified as Stage 0 (Fully Assisted). While the core settlement and vault relayer contracts are immutable and user funds are protected by cryptographic order validation, the upgradeable AllowListAuthentication proxy lacks a confirmed on-chain timelock, meaning the solver allow-list can be changed immediately. The centralized off-chain orderbook and autopilot infrastructure represent additional trust assumptions. The protocol has strong mitigating factors — 4+ years of operation, bonded solvers with slashing, multiple audits, and a $1M bug bounty — but the instant upgradeability of a critical component and centralized off-chain dependencies prevent advancement to Stage 1.

## Links

- [Official Website](https://cow.fi)
- [Documentation](https://docs.cow.fi)
- [GitHub](https://github.com/cowprotocol)
- [Settlement Contract](https://etherscan.io/address/0x9008d19f58aabd9ed0d60971565aa8510560ab41)
- [VaultRelayer Contract](https://etherscan.io/address/0xc92e8bdf79f0507f65a392b0ab4667716bfe0110)
- [AllowListAuthentication Proxy](https://etherscan.io/address/0x2c4c28DDBdAc9C5E7055b4C863b72eA0149D8aFE)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/cowprotocol/)
- [Solver Exploit Post-Mortem](https://cow.fi/learn/cow-swap-solver-exploit-post-mortem)
