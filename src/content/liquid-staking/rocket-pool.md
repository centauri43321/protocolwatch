---
name: "Rocket Pool"
category: "liquid-staking"
stage: 1
website: "https://rocketpool.net"
chains: ["ethereum"]
tvl: "$1.2B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "4+ years"
---

# Rocket Pool Risk Assessment

## Overview

Rocket Pool is a decentralized Ethereum liquid staking protocol that issues rETH, a liquid staking token backed by a permissionless network of node operators. Users deposit any amount of ETH and receive rETH, which accrues staking rewards over time via an exchange rate mechanism.

The protocol's architecture is distinctive among liquid staking providers: any node operator can join by posting a minimum 4 ETH bond (reduced from 8 ETH in Saturn 1) plus optional RPL collateral per validator, with the remaining 28 ETH sourced from the liquid staking deposit pool. This permissionless design distributes validator operations across 4,000+ independent operators (by far largest out of any liquid staking protocol). 
Rocket Pool is also the third-largest Ethereum liquid staking protocol by TVL (~$1.1-1.2B), behind Lido and Coinbase.

## Smart Contract Risk

**Contract Architecture:**
- Hub-and-spoke design centered on `RocketStorage`, an eternal storage registry contract. All protocol contracts register by name and are resolved at runtime
- No traditional proxy/upgrade pattern for core logic — contracts use a `onlyLatestNetworkContract` modifier that checks RocketStorage to verify callers are the currently registered version
- Post-Saturn 1 (February 2026): Megapools replace minipools as the per-operator contract. Each megapool uses a delegatecall proxy to `RocketMinipoolDelegate`, and node operators can opt in/out of delegate upgrades with a multi-month grace period
- `RocketStorage` itself is immutable and cannot be replaced — it is the only contract that cannot be upgraded

**Code Quality:**
- Audited across all major versions by five firms: Sigma Prime (initial, Atlas, Saturn 1), ConsenSys Diligence (initial, April 2021), Trail of Bits (initial), Cantina (Saturn 1), and Bailsec (Saturn 1)
- Open source with comprehensive documentation
- Bug bounty on Immunefi with max payout of $150,000 for critical smart contract vulnerabilities (previously $500,000, reduced)
- No formal verification publicly confirmed

**Attack Surface:**
- Node operators cannot directly access liquid staker deposits — minipool/megapool contracts enforce withdrawal credential separation
- Oracle DAO (oDAO) submits rETH exchange rate updates; a malicious supermajority could manipulate the rate. Saturn 1 added oracle balance submission constraints to bound rate changes
- Slashing penalties from a misbehaving validator are socialized across all rETH holders, not isolated per depositor
- Critical frontrunning vulnerability discovered via Immunefi in October 2022 that could have allowed node operators to steal user deposits — patched before exploitation ($100K bounty paid)

## Admin/Governance Risk

**Governance Structure:**
- Three governance layers: Protocol DAO (pDAO), Oracle DAO (oDAO), and Guardian
- The pDAO is the primary governance body post-Houston (June 17, 2024), using an optimistic fraud-proof system (RPIP-33) where any node operator can propose, vote, and challenge on-chain
- pDAO quorum: 30% of voting power (reduced from 51% via RPIP-63; guardrail minimum is 15%)
- Voting options: Abstain, For, Against, and Veto (defeats proposal and burns proposer's bond)
- pDAO controls protocol parameter settings, treasury spending, and security council appointments

**Key Controls:**
- **Guardian**: An address controlled by Rocket Pool Pty Ltd (the core team). Can modify pDAO settings (inflation rate, deposit fees, etc.) with no delay. Can disable protocol features in emergencies. Many initial bootstrapping powers have been irrevocably disabled, but the guardian retains instant parameter change capability
- **oDAO** (~14 invited members, 51% quorum / ~8-of-14): Controls contract upgrades via RocketStorage registry replacement. Can modify non-protected parameters, control RocketVault/SmoothingPool withdrawals, and approve rewards merkle trees. The oDAO maintains authority over its own membership independently of the pDAO
- **Security Council** (introduced with Houston): Elected by pDAO. Can propose immediate parameter changes and pause the protocol in emergencies. Subject to pDAO oversight — the pDAO can remove members or disband the council

**Trust Assumptions:**
- The guardian's ability to change pDAO settings with no delay is a centralization risk, though its powers are narrower than full upgrade authority
- The oDAO is invite-only with known members (Nimbus, Prysm/ConsenSys, EthStaker, Blockchain Capital, Bankless, CryptoManufaktur, Coinbase Ventures, Rocket Pool team nodes). Members post a 1,750 RPL bond that can be slashed by consensus
- Contract upgrades require oDAO consensus (51%). Saturn 1 introduced a mandatory delay before upgrades activate, with security council veto authority
- The pDAO cannot directly override the oDAO on contract upgrades, creating a separation of powers but also a dependency on the oDAO's integrity

## External Dependencies

**Oracle System:**
- The oDAO serves as the protocol's oracle, reporting the rETH/ETH exchange rate approximately every 24 hours
- Rate calculation: total ETH held by protocol (execution layer + consensus layer balances) divided by total rETH supply
- Requires >50% of oDAO members (~8 of 14) to agree on the reported ratio for submission
- Saturn 1 added constraints on oracle balance submissions to bound rate changes per update, limiting the impact of a compromised report
- No external oracle (Chainlink, etc.) is used — the oDAO is both the governance body and the oracle

**Off-Chain Actors:**
- **Node operators** (permissionless, 4,000+): Run validators on the Beacon Chain. Post 4 ETH + optional RPL bond per validator. If operators disappear, their validators eventually get ejected and ETH is returned (with inactivity penalties)
- **oDAO watchtower daemons** (~14 members, invite-only): Shuttle consensus layer data to execution layer contracts. If the oDAO stops submitting, rETH exchange rate freezes, RPL/ETH price reporting stops, and protocol entry/exit processing halts. Users can still trade rETH on secondary markets. A recovery mode exists: if membership drops below a threshold, registered nodes can join the oDAO without approval
- oDAO members are bonded with 1,750 RPL each and can be slashed/kicked by consensus for malicious behavior (bad balance reporting, downtime)

**Overall Rating Justification:**
Rated `mixed` because the protocol relies on a small, invite-only oDAO (~14 members) for both oracle data and contract upgrade authority. While members are economically bonded (1,750 RPL each, slashable) and include reputable entities, this is not a fully decentralized oracle system. The node operator network is permissionless and decentralized, but the oDAO — which controls the most critical functions — is a curated trusted set. The oDAO is more constrained than a centralized oracle (bonding, consensus requirement, balance submission caps) but less decentralized than Chainlink or a permissionless system.

## Economic Risk

**Liquidity Risk:**
- ~$1.1-1.2B TVL across the protocol (DeFiLlama, March 2026)
- 4,000+ independent node operators running validators
- rETH/ETH liquidity available on major DEXs (Uniswap, Balancer, Curve)
- Withdrawal mechanism: rETH can be burned for ETH from the deposit pool, or via minipool/megapool exits. No instant withdrawal guarantee — queue-based system

**Operational History:**
- Mainnet launched November 9, 2021
- Redstone/Merge upgrade (2022), Atlas upgrade (2023), Houston upgrade (June 17, 2024), Saturn 1 (February 18, 2026)
- No smart contract exploits resulting in user fund loss in 4+ years of operation
- May 2022: Two oDAO nodes operated by the Rocket Pool team were compromised — ETH and RPL stolen from node operator accounts (operational security failure, not a smart contract exploit)
- October 2022: Critical frontrunning vulnerability disclosed via Immunefi, patched before any exploitation
- Survived Terra/Luna collapse, FTX collapse, and multiple market stress events without protocol-level failures

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Contract upgrades require oDAO consensus (51% of ~14 members) with mandatory delay introduced in Saturn 1, plus security council veto — satisfies >=48h timelock requirement
- ✓ On-chain pDAO governance with 30% quorum for protocol parameters; oDAO (invite-only, bonded, diverse members) for contract upgrades — satisfies governance/multisig-diverse requirement
- ✓ No direct admin fund access — oDAO controls RocketVault withdrawals via consensus, but cannot unilaterally drain user staking deposits. Fund access is `restricted` (indirect risk via upgrades)
- ✓ Extensive audits from 5 firms across all versions (Sigma Prime, ConsenSys, Trail of Bits, Cantina, Bailsec) plus Immunefi bug bounty
- ✓ 4+ years of mainnet operation with no smart contract exploit causing fund loss
- ✓ External dependencies are mixed: oDAO is bonded and diverse but invite-only and small

**Why Not Stage 2:**
- Contracts are upgradeable via oDAO consensus — not immutable and no 7-day+ timelock confirmed
- The guardian (team-controlled) can change pDAO parameters with no delay, bypassing governance for certain settings
- The oDAO (~14 invited members) is a trusted set that controls both the oracle and contract upgrades — not a fully decentralized system
- rETH exchange rate depends on oDAO oracle submissions; a liveness failure would freeze the rate

**Justification:**
Rocket Pool achieves Stage 1 (Limited Trust) through its permissionless node operator network, on-chain pDAO governance, bonded oDAO members, and extensive audit history across five firms. The Saturn 1 upgrade (February 2026) strengthened the protocol with mandatory upgrade delays, security council veto authority, and oracle submission constraints. However, Stage 2 is precluded by the oDAO's role as both oracle and upgrade authority — a small, invite-only trusted set of ~14 members — and the guardian's ability to instantly change certain protocol parameters. The protocol's 4+ year track record with no smart contract exploits is a strong positive signal.

## Links

- [Official Website](https://rocketpool.net)
- [Documentation](https://docs.rocketpool.net)
- [GitHub](https://github.com/rocket-pool)
- [Governance Forum](https://dao.rocketpool.net)
- [Audit Reports](https://rocketpool.net/protocol/security)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/rocketpool/)
- [Saturn 1 Upgrade](https://saturn.rocketpool.net/)
