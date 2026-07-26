---
name: "StakeWise V2"
baseName: "StakeWise"
category: "liquid-staking"
stage: 0
website: "https://stakewise.io"
chains: ["ethereum"]
tvl: "$1M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "4+ years, deprecated June 2025, no direct contract exploit"
---

# StakeWise V2 Risk Assessment

## Overview

StakeWise V2 is the second-generation Ethereum liquid staking pool from StakeWise. It uses a dual-token model: `sETH2` (StakedEthToken, principal, 1:1 with deposited ETH) and `rETH2` (RewardEthToken, accruing staking rewards). Node operators in V2 are permissioned and selected by the StakeWise DAO.

V2 launched on Ethereum mainnet in November 2020 and has been formally deprecated in favor of V3. Per the StakeWise team, rewards stopped accruing on V2 on June 1, 2025, validators are being exited, and V2 fees were raised to 10% to push remaining users to migrate to V3. Combined StakeWise TVL is ~$794M as of May 2026, but essentially all of that now sits in V3; the V2 product is in wind-down with only residual balances remaining on Ethereum mainnet.

## Smart Contract Risk

**Contract Architecture:**
- Core V2 contracts are `Pool`, `StakedEthToken` (sETH2), `RewardEthToken` (rETH2), `Oracles`, and `MerkleDistributor`.
- Etherscan shows the rETH2 contract is deployed behind an OpenZeppelin **AdminUpgradeabilityProxy** (transparent-proxy pattern) exposing `upgradeTo` and `upgradeToAndCall` to the proxy admin.
- The Pool and sETH2 contracts use the same upgradeable transparent-proxy pattern. All core logic is upgradeable.
- Contract addresses:
  - sETH2: `0xFe2e637202056d30016725477c5da089Ab0A043A`
  - rETH2: `0x20BC832ca081b91433ff6c17f85701B6e92486c5`
  - Pool: `0xC874b064f465bdD6411D45734b56fac750Cda29A`

**Code Quality:**
- Pre-launch audits by **Runtime Verification** and **Sigma Prime** (per StakeWise public communications and the `stakewise/contracts` repo).
- No formal verification has been publicly documented for V2.
- Open source at github.com/stakewise/contracts.
- Bug bounty active on Immunefi covering V2 and V3; maximum payout $200,000 for critical smart contract vulnerabilities, payable in SWISE or USDC.

**Attack Surface:**
- Transparent-proxy upgradeability on every core contract: a DAO upgrade can alter token logic, transfer behavior, or reward accounting.
- Permissioned oracle set posts validator activations and reward updates; a compromised oracle quorum could mis-report rewards.
- No direct smart contract exploit against V2 has been reported in 4+ years of operation. Indirect exposure exists through external liquidity venues (e.g., the November 2025 Balancer V2 exploit affected sETH2/rETH2/osETH pool LPs, not the StakeWise core contracts themselves).

## Admin/Governance Risk

**Governance Structure:**
- Upgrade authority is held by the **StakeWise DAO**, implemented as a **7-member Gnosis Safe multisig** with a SafeSnap module enabling SWISE-weighted Snapshot votes to push transactions on-chain.
- A 4-of-7 reject threshold lets the committee veto malicious transactions, providing a check on the otherwise SWISE-weighted Snapshot path.
- SWISE token holders vote off-chain on Snapshot; the Safe executes approved proposals.

**Key Controls:**
- The DAO Safe is the proxy admin for sETH2, rETH2, Pool, Oracles, and MerkleDistributor — meaning the multisig can upgrade any of these contracts.
- No on-chain `TimelockController` is documented between the DAO Safe and proxy upgrades. The practical upgrade delay appears to be zero pending only the Snapshot vote duration, which is off-chain and DAO-policy-controlled rather than contract-enforced.
- DAO can manage the oracle membership set, node operator allow-list, fee parameters, and (now in wind-down) the deprecation/exit schedule.

**Trust Assumptions:**
- A compromised or colluding DAO Safe quorum could upgrade sETH2/rETH2 to logic that freezes transfers or alters balances. Direct withdrawal of validator ETH would require a Pool upgrade plus an oracle-coordinated validator exit, which is feasible end-to-end via the upgrade path.
- The 7-member Safe with SafeSnap is a meaningfully decentralized execution layer for a multisig, but with no on-chain timelock the upgrade is effectively instant once signed.
- DAO has demonstrated willingness to exercise privileged token-level powers — see the 2025 Balancer exploit recovery noted under Economic Risk.

## External Dependencies

**Oracle System:**
- Permissioned oracle set (DAO-approved addresses) submits validator activations and reward updates to the `Oracles` contract.
- No external price oracle (Chainlink, RedStone) is required by the V2 core contracts themselves; price feeds were added later for V3 osETH integration.
- A stalled oracle quorum would pause reward updates and validator activations but would not drain funds.

**Off-Chain Actors:**
- **Permissioned node operators:** Operator set is curated by the StakeWise DAO; no on-chain slashable bond is documented.
- **Beacon Chain deposit contract:** Only external Ethereum dependency at the contract level.
- No MEV relay constraints or DVT integration documented for V2 (those are V3-era features).

**Overall Rating Justification:**
Rated `mixed`. The core path avoids external price oracles and relies on Ethereum's own consensus for the staked asset, but the oracle committee and node operator set are both permissioned and curated by the DAO with no on-chain bonding. There is no critical reliance on a single centralized off-chain service that could unilaterally drain funds, which keeps this short of `centralized`, but the lack of bonding or decentralized removal prevents a `decentralized` rating.

## Economic Risk

**Liquidity Risk:**
- V2 is in wind-down: rewards stopped accruing June 1, 2025; validators are being exited.
- Residual TVL only as of May 2026, with the combined StakeWise ~$794M sitting overwhelmingly in V3.
- sETH2/rETH2 secondary liquidity on Uniswap V3, Balancer, and Curve has thinned materially since deprecation; users are expected to migrate to V3.

**Operational History:**
- V2 launched November 2020.
- No direct smart contract exploit against V2 core contracts in 4+ years.
- **November 3, 2025 Balancer V2 exploit:** StakeWise assets (including osETH and sETH2-related pool tokens) were caught in the Balancer V2 LP exploit. The DAO used an emergency multisig action to recover ~73.5% of stolen osETH (~$19M) and 100% of osGNO, then pro-rata reimbursed users. The recovery itself demonstrates that token-level privileged powers exist over the StakeWise tokens.
- Deprecation announced and executed on schedule through 2024–2025.

## Stage Assessment

**Stage 0 Criteria Met:**

- ✓ Multiple audits — Runtime Verification and Sigma Prime
- ✓ 4+ years of mainnet operation with no direct contract exploit
- ✓ Diverse multisig — 7-member DAO Safe with SafeSnap is meaningfully decentralized at the execution layer
- ⚠ Upgradeability: `instant` — Transparent Proxy with no documented on-chain timelock between DAO Safe action and `upgradeTo` execution
- ⚠ Fund access: `possible` — admin can upgrade implementations with no user exit window; 2025 Balancer recovery demonstrates token-level privileged powers are operationally exercised
- ⚠ External dependencies: `mixed` — permissioned oracles and operators with no on-chain bond
- ⚠ Deprecated product — rewards halted June 1, 2025; users should migrate to V3

**Why Not Stage 1:**
- **Upgradeability:** Stage 1 requires a verified ≥48-hour timelock on critical upgrades. No on-chain timelock is documented in front of the DAO Safe; the only delay is the off-chain Snapshot vote period, which is policy-enforced, not contract-enforced.
- **Fund access:** Without a timelock the upgrade path provides effective access to user funds, which exceeds the `restricted` threshold Stage 1 allows.
- **External dependencies:** Oracle and operator sets are permissioned with no on-chain bond or decentralized removal, preventing a `decentralized` rating.

**Justification:**
StakeWise V2 is classified as Stage 0 (Fully Assisted). The 7-of-N DAO Safe with SafeSnap is among the better-structured execution layers in the LST sector, audit coverage is solid, and four-plus years of operation produced no direct contract exploit. However, the absence of an on-chain timelock in front of upgrades, combined with the demonstrated willingness to exercise token-level privileged powers (the 2025 Balancer recovery), keeps V2 below the Stage 1 threshold. The product is also being deprecated — users should refer to the V3 assessment for the supported version.

## Links

- [Official Website](https://stakewise.io)
- [Documentation](https://docs.stakewise.io)
- [GitHub](https://github.com/stakewise/contracts)
- [Deprecation Announcement](https://stakewise.medium.com/announcing-deprecation-of-stakewise-v2-and-stakewise-solo-8d245d73696e)
- [Migration Plan](https://stakewise.medium.com/transitioning-to-stakewise-v3-the-migration-plan-f44d7602e955)
- [Bug Bounty](https://immunefi.com/bug-bounty/stakewise/)
- [Governance Forum](https://forum.stakewise.io)
- [DAO Treasury Docs](https://docs.stakewise.io/governance/dao-treasury)
