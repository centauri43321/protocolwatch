---
name: "Stader (ETHx)"
category: "liquid-staking"
stage: 0
website: "https://www.staderlabs.com"
chains: ["ethereum"]
tvl: "$297M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "multisig-diverse"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "2+ years, no ETHx exploits; 2022 NearX (~$830K) on a separate product"
---

# Stader (ETHx) Risk Assessment

## Overview

Stader Labs is a multi-chain liquid staking provider. This assessment covers **ETHx**, Stader's Ethereum LST, which launched on mainnet on July 10, 2023. ETHx is a non-rebasing, reward-bearing ERC-20 whose internal ETH exchange rate increases as staking rewards accrue.

ETHx uses a multi-pool architecture with two node-operator sets: a **permissionless pool** where anyone can run a validator by posting a 4 ETH bond plus an SD-denominated additional collateral (minimum 0.4 ETH worth of SD, up to 8 ETH worth), and a **permissioned pool** of curated operators approved by Stader DAO with no ETH bond at launch. A `StakePoolManager` routes user deposits between the two pools per DAO-set allocations. Execution-layer rewards are distributed via a `SocializingPool` using oracle-published Merkle roots. As of May 2026, Stader's Ethereum TVL is approximately $297M out of a $341M multi-chain total (which also includes MaticX, BNBx, HBARx, and the wound-down NearX).

## Smart Contract Risk

**Contract Architecture:**
- All core ETHx contracts are upgradeable behind **EIP-1967 Transparent Proxies**. A central `StaderConfig` registry holds key contract addresses and parameters; changes propagate via `updateStaderConfig()`.
- Mainnet contract addresses:
  - `StaderConfig`: `0x4ABEF2263d5A5ED582FC9A9789a41D85b68d69DB`
  - `StaderOracle`: `0xF64bAe65f6f2a5277571143A24FaaFDFC0C2a737`
  - `StaderStakePoolManager`: `0xcf5EA1b38380f6aF39068375516Daf40Ed70D299`
  - `PermissionlessPool`: `0xd1a72Bd052e0d65B7c26D3dd97A98B74AcbBb6c5`
  - `PermissionedPool`: `0x09134C643A6B95D342BdAf081Fa473338F066572`
  - `PermissionlessNodeRegistry`: `0x4f4Bfa0861F62309934a5551E0B2541Ee82fdcF1`
  - `PermissionedNodeRegistry`: `0xaf42d795A6D279e9DCc19DC0eE1cE3ecd4ecf5dD`
  - `ETHx` token: `0xA35b1B31Ce002FBF2058D22F30f95D405200A15b`
  - `StaderInsuranceFund`: `0xbe3781CE437Cc3fC8c8167913B4d462347D11F20`
  - Timelock (upgrade owner): `0x1112D5C55670Cb5144BF36114C20a122908068B9`
- Role-based access via OpenZeppelin AccessControl: `ADMIN`, `MANAGER`, `OPERATOR`. ADMIN can change StaderConfig values; MANAGER handles operational parameters; OPERATOR runs limited operational calls.

**Code Quality:**
- Sigma Prime — ETHx smart contracts (Phase 1 and Phase 2), plus Permissioned Stader Node scope.
- Halborn — multiple reports covering ETHx smart contracts, Permissionless Stader Node, Oracle code, and off-chain components.
- Code4rena — public audit contest in June 2023 (`2023-06-stader`).
- No formal verification has been publicly disclosed.
- Open source at github.com/stader-labs/ethx.
- Bug bounty active on Immunefi with maximum payout **$1,000,000 USDC** for critical smart contract vulnerabilities (Critical capped at 10% of funds directly affected, max $1M). Stader holds the Immunefi Standard Badge.

**Attack Surface:**
- Transparent-proxy upgradeability on every core contract: a Timelock-gated upgrade can alter pool routing, token logic, or oracle handling. The timelock provides a user exit window only if its delay is materially long.
- `StaderOracle` drives the exchange rate (via beacon-balance reports), reward Merkle roots, and validator status. A compromised oracle quorum could mis-report rewards or accept malicious validator data.
- Two-tier operator model: the permissionless pool is bond-secured (4 ETH + SD), but the permissioned pool's bond requirements and curation introduce centralization at the operator layer.
- No direct ETHx core-contract exploit has been reported in 2+ years of operation.

## Admin/Governance Risk

**Governance Structure:**
- Ownership of deployed ETHx contracts is held by the on-chain **Timelock at `0x1112D5C55670Cb5144BF36114C20a122908068B9`**. The exact `minDelay` is not publicly documented and could not be confirmed from authoritative sources — this is the primary uncertainty in the assessment.
- The Timelock's proposer and executor roles are held by a Stader-team Gnosis Safe multisig. Public documentation references a "3-of-5 multisig operated by reputed ETH ecosystem members" in the oracle-collateral context; whether this same multisig holds the Timelock proposer role is unverified.
- SD token governance drives policy decisions (pool allocations, fee parameters, slashing penalties, safe-mode toggling) through off-chain Snapshot voting and DAO process. On-chain execution flows through the admin multisig and Timelock — there is no Compound-Bravo-style on-chain executor.

**Key Controls:**
- ADMIN/MANAGER can pause individual modules and toggle a DAO-controlled "Safe Mode" emergency state.
- Timelock-gated upgrades cover all core contracts: a malicious upgrade could in principle replace logic and drain funds, but only after the timelock delay (user exit window).
- `StaderInsuranceFund` accumulates protocol fees and DAO contributions, intended to cover slashing or operator-misbehavior shortfalls. Exact funding level and payout policy are not extensively documented.

**Trust Assumptions:**
- Direct withdrawal of user funds requires either coordinated validator malice (constrained by the 4 ETH + SD bonds in the permissionless pool) or a malicious upgrade plus matching oracle reports — a multi-step compromise.
- If the Timelock delay is shorter than 48 hours, the practical user exit window is materially weaker than the configuration implies. This uncertainty is the principal reason the assessment defaults to a conservative stage.
- The 3-of-5 multisig structure referenced in oracle context is a small quorum; individual signer identities and independence are not publicly attested.

## External Dependencies

**Oracle System:**
- `StaderOracle` is a committee of trusted oracle operators submitting exchange rate, SD price, validator status, withdrawn-validator data, missed-attestation penalties, and SocializingPool reward Merkle roots.
- Consensus is a strict majority (>50%) for most feeds and a 2/3 threshold for feeds where exact-value agreement is difficult.
- Each oracle operator posts collateral. Committee membership changes are rate-limited (one add/remove per week).
- The exact current committee size is not surfaced in public documentation.
- There is no external market price oracle (Chainlink, RedStone) in the core staking or redemption path — the ETHx exchange rate is computed internally from beacon balances reported by `StaderOracle`.

**Off-Chain Actors:**
- **Permissionless node operators:** Open to anyone willing to post a 4 ETH bond and an SD-denominated additional collateral. This is on-chain bonding with slashable exposure.
- **Permissioned node operators:** A DAO-curated set with KYC and track-record requirements; no ETH bond at launch. This is a centralization vector.
- **MEV-Boost / execution-layer rewards:** Routed via the `SocializingPool` and distributed using oracle-published Merkle roots.

**Overall Rating Justification:**
Rated `mixed`. The permissionless pool's on-chain bond is a meaningful constraint on operator misbehavior and is rare among LST designs at this depth. Offsetting factors: the permissioned operator pool has no public on-chain bond, the StaderOracle committee is permissioned (size not fully transparent), and there is no external price oracle fallback for the internal exchange-rate path. This stops short of `decentralized` because of the permissioned operator subset and oracle committee, and stops short of `centralized` because no single off-chain party can unilaterally drain funds.

## Economic Risk

**Liquidity Risk:**
- ~$297M Ethereum TVL as of May 2026 (Stader multi-chain total ~$341M). ETHx is the dominant Ethereum product.
- ETHx secondary liquidity exists on Uniswap, Balancer, and Curve, providing exit options that bypass the validator exit queue at depth-dependent slippage.
- Native withdrawals flow through a `UserWithdrawalManager` queue that finalizes via oracle reports and validator exits.

**Operational History:**
- ETHx mainnet launch: July 10, 2023. Approximately 2.8 years of operation as of May 2026 with no known ETHx core-contract exploit.
- **August 16, 2022 — NearX reentrancy exploit (separate product):** A reentrancy bug in NearX's `batch_transaction` function was exploited for approximately 165,000 NEAR (~$830K) on the DEX-LP side of the product. The NearX staking contract itself was unaffected and staked NEAR was safe. Stader paused NearX, reimbursed affected users, and offered a $150K white-hat bounty. This was on a Near-Chain product distinct from ETHx, but is the most material protocol-level security event in Stader's history.
- No publicly reported exploits on MaticX, BNBx, or HBARx.
- ETHx survived the 2024–2025 LST market drawdown and remained operationally stable.

## Stage Assessment

**Stage 0 Criteria Met:**

- ✓ Extensive audits — Sigma Prime (×2), Halborn (×4 across contracts, oracle, off-chain), Code4rena June 2023 contest, $1M Immunefi bug bounty
- ✓ 2+ years of ETHx mainnet operation with no core-contract exploit
- ✓ Restricted fund access — Timelock-gated upgrades and bond-secured permissionless operators prevent direct drain
- ✓ Permissionless pool with on-chain operator bonding (4 ETH + SD collateral)
- ⚠ Upgradeability: a Timelock contract is confirmed at `0x1112…68B9`, but its `minDelay` is not publicly documented. Frontmatter records `timelock-48h+` on the assumption the delay meets Stage 1's 48-hour threshold; if the actual delay is shorter, the rating should drop to `instant` and the stage classification is unaffected
- ⚠ Admin control: a 3-of-5 multisig is referenced in oracle-collateral context but signer identities and independence are not publicly attested; Stage 1's "diverse, independent signers" requirement cannot be verified
- ⚠ External dependencies: `mixed` — permissioned operator pool and permissioned oracle committee remain DAO-curated without full transparency on size and bonding for all operators

**Why Not Stage 1:**
- **Timelock delay unverified:** Stage 1 requires a verified ≥48-hour timelock on critical upgrades. The Stader Timelock's `minDelay` is not publicly disclosed; the conservative default applies.
- **Multisig diversity unverified:** Stage 1 requires a diverse 3-of-5+ multisig with independent signers or decentralized governance. The referenced 3-of-5 set's composition is not publicly attested.
- **External dependencies:** Permissioned operator pool plus a permissioned, opaque-sized oracle committee prevents the `decentralized` rating that Stage 1 prefers; `mixed` is acceptable only at the Stage 1 edge.

**Justification:**
ETHx is classified as Stage 0 (Fully Assisted). The protocol's audit coverage is `extensive`, the permissionless pool's on-chain bonding is a structural strength rare in the LST sector, and 2+ years of operation produced no core-contract incident. The classification is held at Stage 0 by two transparency gaps — the undocumented Timelock delay and the unverified multisig composition — combined with a permissioned operator sub-pool and permissioned oracle committee. Publishing the Timelock `minDelay` (assuming it meets 48 hours), attesting the multisig signer set, and either bonding or decentralizing the permissioned operator pool would place ETHx cleanly in Stage 1 territory.

## Links

- [Official Website](https://www.staderlabs.com)
- [ETHx Documentation](https://staderlabs.gitbook.io/ethereum)
- [GitHub — ETHx](https://github.com/stader-labs/ethx)
- [Audit Reports](https://staderlabs.gitbook.io/ethereum/ethx-security/audit-reports)
- [Code4rena Report (June 2023)](https://code4rena.com/reports/2023-06-stader)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/staderforeth/)
- [DeFiLlama](https://defillama.com/protocol/stader)
- [NearX Incident Report (Aug 2022)](https://blog.staderlabs.com/stader-near-incident-report-08-16-2022-afe077ffd549)
