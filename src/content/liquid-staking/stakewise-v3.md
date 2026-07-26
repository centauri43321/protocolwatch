---
name: "StakeWise V3"
baseName: "StakeWise"
category: "liquid-staking"
stage: 0
website: "https://stakewise.io"
chains: ["ethereum", "gnosis"]
tvl: "$794M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "2+ years, no direct V3 contract exploit, indirect Balancer-2025 exposure recovered"
---

# StakeWise V3 Risk Assessment

## Overview

StakeWise V3 is a permissionless liquid staking marketplace for Ethereum and Gnosis Chain. It replaces V2's dual-token pool with isolated, non-custodial "Vaults" — staking pools that any operator can deploy and configure — plus a single, overcollateralized liquid token, `osETH` (or `osGNO` on Gnosis), that depositors can optionally mint against their Vault shares.

V3 launched on Ethereum mainnet on November 28, 2023 and on Gnosis Chain in July 2024. Combined StakeWise TVL is approximately $794M as of May 2026 (~$793M Ethereum, ~$1.3M Gnosis), essentially all of it in V3 following the V2 deprecation. V3's core design innovation is separating the **staking layer** (permissionless Vaults run by independent operators) from the **liquid token layer** (a single DAO-governed osETH minted against approved Vault collateral with LTV and liquidation parameters).

## Smart Contract Risk

**Contract Architecture:**
- Core V3 contracts in `stakewise/v3-core`:
  - `VaultsRegistry` — registry of approved Vault implementations and instances.
  - `EthVault` / `GnoVault` and variants (private, ERC-20, restricted, fox/blocklist) — staking pools deployed per operator.
  - `OsTokenVaultController` — mints and burns osETH against Vault collateral.
  - `OsToken` — the osETH ERC-20.
  - `OsTokenConfig` — LTV and liquidation parameters.
  - `Keeper` — oracle aggregation contract accepting signed reward updates and validator approvals.
  - `SharedMevEscrow` / `OwnMevEscrow` — capture MEV-Boost rewards.
- Vaults are deployed as **BeaconProxies** pointing to implementations registered in `VaultsRegistry`. Upgrading the Vault Beacon implementation upgrades every Vault instance simultaneously.
- Singleton contracts (Keeper, OsTokenVaultController, OsToken, OsTokenConfig, VaultsRegistry) follow upgradeable proxy patterns. Per-proxy admin assignments at the on-chain level are not exhaustively documented publicly — treat as DAO-controlled.

**Code Quality:**
- Eight audit reports across five firms in `v3-core/audits/`:
  - Halborn — May 2023
  - Halborn — August 2023
  - Sigma Prime — August 2023
  - ConsenSys Diligence — March 2024 (EthFoxVault scope)
  - Sigma Prime — June 2024
  - Sigma Prime — September 2024
  - ABDK — September 2025
  - Statemind — April 2026
- No public formal verification engagement (e.g., Certora) has been documented.
- Open source at github.com/stakewise/v3-core, github.com/stakewise/v3-operator, and github.com/stakewise/oracle.
- Bug bounty active on Immunefi covering V2 and V3; maximum payout $200,000 for critical smart contract vulnerabilities.

**Attack Surface:**
- Beacon-pattern Vaults: a Beacon upgrade by the DAO propagates instantly to every Vault. This is a single-point upgrade risk across all operators.
- osETH minting framework concentrates risk: incorrect LTV or fee parameters set by the DAO can force osETH borrowers into liquidation; oracle-reported rewards drive the osETH exchange rate.
- Keeper oracle quorum is required for rewards and validator approvals. A compromised quorum could approve malicious validator registrations (Vault-level theft via withdrawal credentials) or stale reward data.
- The 2025 Balancer V2 exploit indirectly exposed osETH held in LP positions; StakeWise recovered ~73.5% via emergency multisig action, indicating token-level privileged capability exists on osETH.

## Admin/Governance Risk

**Governance Structure:**
- Same execution layer as V2: a **7-member StakeWise DAO Gnosis Safe** multisig with SafeSnap module enabling SWISE-weighted Snapshot votes to push transactions on-chain.
- A 4-of-7 reject threshold lets the committee veto malicious transactions.
- SWISE token holders vote off-chain on Snapshot; the Safe executes approved proposals.

**Key Controls:**
- DAO controls the **Vault Beacon** implementation (upgrades reach every Vault simultaneously).
- DAO controls the **OsToken**, **OsTokenVaultController**, and **OsTokenConfig** — including fee percentage, LTV, and liquidation threshold parameters.
- DAO controls the **Keeper** oracle set membership.
- DAO controls the **VaultsRegistry** — only DAO-approved Vault implementations can register.
- Vault **operators are permissionless** at the user-facing level: anyone can deploy a Vault from an approved implementation and set their own commission, but the OsToken minting framework is fully DAO-controlled.
- No on-chain `TimelockController` is documented between the DAO Safe and upgrades to the Vault Beacon or singleton contracts. The practical upgrade delay is policy-enforced via the Snapshot vote duration, not contract-enforced.

**Trust Assumptions:**
- A compromised DAO Safe could upgrade the Vault Beacon to logic that diverts validator deposits, alter osETH parameters to force mass liquidations, or modify the OsToken contract directly.
- Direct drain of validator ETH already on the Beacon Chain is not feasible without coordinating malicious Keeper signatures plus Vault Beacon upgrade — possible end-to-end, but a multi-step compromise.
- The 2025 Balancer recovery demonstrates the DAO will exercise privileged token-level powers operationally when it judges this warranted.

## External Dependencies

**Oracle System:**
- **Keepers:** Eleven DAO-approved oracles. Validator registration requires **8-of-11** signatures; reward Merkle-root updates require **6-of-11**.
- Keepers are permissioned and not on-chain bonded. Misbehavior is addressed by DAO removal (social/governance slashing), not by an automatic on-chain slashing mechanism.
- External price feeds for osETH used by DeFi integrators are provided by **RedStone** (push feeds ingesting Balancer, Curve, Maverick) and **Chainlink** osETH/ETH exchange rate feeds on Ethereum mainnet, Arbitrum, and Linea. These feeds are not used inside the StakeWise core path itself; they serve external consumers like Aave and Morpho.

**Off-Chain Actors:**
- **Permissionless node operators per Vault:** Anyone can deploy a Vault and run validators, setting their own commission. Vault depositors choose which operator to trust.
- **MEV-Boost / relays:** Operators must run MEV-Boost; rewards flow to `SharedMevEscrow` or `OwnMevEscrow` contracts. The relay set is enforced via operator agreement, not on-chain.
- **No on-chain operator bond is documented** at the protocol level — Vaults compete on commission and reputation rather than collateral.
- **Beacon Chain deposit contract** and the Gnosis Chain equivalent are the underlying staking dependencies.

**Overall Rating Justification:**
Rated `mixed`. The 11-Keeper quorum (8-of-11 / 6-of-11) is a meaningful improvement over single-keeper designs and the permissionless Vault layer reduces operator concentration at the staking layer. However, Keepers and Vault-implementation approvals are DAO-curated with no on-chain bonding, the OsToken parameter set is fully DAO-controlled, and the Vault Beacon is a single upgrade lever across all operators. This combination prevents a `decentralized` rating but stops short of `centralized` because the staking layer itself is permissionless.

## Economic Risk

**Liquidity Risk:**
- ~$794M combined TVL as of May 2026, predominantly on Ethereum.
- osETH secondary liquidity is concentrated on Balancer, Curve, and Maverick; integrations with Aave and Morpho provide additional collateral utility.
- Per-Vault withdrawal queues mean exit liquidity depends on the specific Vault's validator composition and exit pacing; osETH minters must additionally manage their LTV to avoid liquidation.

**Operational History:**
- Ethereum V3 launch: November 28, 2023. Gnosis Chain V3 launch: July 2024.
- **No direct V3 core contract exploit** publicly known as of May 2026.
- **November 3, 2025 Balancer V2 exploit (indirect):** osETH held in Balancer V2 pools was caught up in the broader Balancer LP exploit. The StakeWise DAO executed an emergency multisig action that recovered approximately 73.5% of stolen osETH (~$19M) and 100% of osGNO, then pro-rata reimbursed users. This was an indirect incident — Balancer was the exploited venue, not StakeWise core contracts — but it confirmed that the DAO retains token-level privileged powers over osETH.
- Survived the 2024 LST market drawdown and the Gnosis Chain launch without protocol-level incident.

## Stage Assessment

**Stage 0 Criteria Met:**

- ✓ Extensive audits — eight reports across Halborn, Sigma Prime, ConsenSys Diligence, ABDK, and Statemind over 2.5+ years
- ✓ 2+ years of mainnet operation with no direct V3 contract exploit
- ✓ Diverse multisig — 7-member DAO Safe with SafeSnap and SWISE Snapshot voting
- ✓ Permissionless Vault layer — operator set is not curated at the staking layer
- ⚠ Upgradeability: `instant` — Vault Beacon and singleton contracts are upgradeable by the DAO Safe with no documented on-chain timelock
- ⚠ Fund access: `restricted` — direct drain of Beacon Chain ETH not possible without coordinated Keeper + Beacon upgrade; token-level privileged powers over osETH are operationally exercised (Balancer recovery)
- ⚠ External dependencies: `mixed` — 11 DAO-approved Keepers with no on-chain bond; OsToken parameter set fully DAO-controlled

**Why Not Stage 1:**
- **Upgradeability:** Stage 1 requires a verified ≥48-hour timelock on critical upgrades. No on-chain `TimelockController` is documented between the DAO Safe and the Vault Beacon or singleton implementations. The only delay is the off-chain Snapshot vote period.
- **External dependencies:** While the 8-of-11 / 6-of-11 Keeper thresholds are reasonable, Keepers remain DAO-curated with no on-chain slashable bond, preventing a `decentralized` rating.

**Justification:**
StakeWise V3 is classified as Stage 0 (Fully Assisted), but it is among the stronger Stage 0 designs in the LST sector. Audit coverage is `extensive`, the 7-member DAO Safe with SafeSnap is a meaningfully decentralized execution layer, the Keeper oracle set requires substantial supermajorities for both reward updates and validator registrations, and the staking layer itself is permissionless. The disqualifying factors for Stage 1 are the absence of an on-chain timelock in front of the Vault Beacon and singleton upgrades, and the lack of on-chain bonding for Keepers. Adding a verified ≥48-hour `TimelockController` in front of upgrades — and either bonding Keepers or moving Keeper membership to a decentralized removal process — would place V3 cleanly in Stage 1 territory.

## Links

- [Official Website](https://stakewise.io)
- [V3 Documentation](https://docs.stakewise.io)
- [v3-core GitHub](https://github.com/stakewise/v3-core)
- [v3-operator GitHub](https://github.com/stakewise/v3-operator)
- [Oracle GitHub](https://github.com/stakewise/oracle)
- [Audit Reports](https://github.com/stakewise/v3-core/tree/main/audits)
- [Bug Bounty](https://immunefi.com/bug-bounty/stakewise/)
- [Governance Forum](https://forum.stakewise.io)
- [DAO Treasury Docs](https://docs.stakewise.io/governance/dao-treasury)
- [DeFiLlama](https://defillama.com/protocol/stakewise)
