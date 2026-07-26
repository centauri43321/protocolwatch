---
name: "ether.fi"
category: "liquid-staking"
stage: 0
website: "https://ether.fi"
chains: ["ethereum"]
tvl: "$7.8B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "multisig-weak"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "2+ years, no smart contract exploits"
---

# ether.fi Risk Assessment

## Overview

ether.fi is a non-custodial liquid staking and restaking protocol. Users deposit ETH and receive eETH (or its wrapped form weETH), which accrues staking rewards and can be automatically restaked on EigenLayer for additional yield.

ether.fi's core design differentiator is that stakers retain non-custodial ownership of validator withdrawal credentials — each validator is managed by a node operator but withdrawal keys are held in smart contracts owned by the depositor, not the operator. The protocol has grown to approximately $7.8B TVL as of March 2026, making it the second-largest liquid staking protocol. It also operates the "Liquid" vault product, which deploys ETH across DeFi strategies including EigenLayer AVSs.

## Smart Contract Risk

**Contract Architecture:**
- Core contracts (LiquidityPool, StakingManager, eETH, weETH, EtherFiNodesManager) use the UUPS (ERC-1822) upgradeable proxy pattern, where upgrade logic is embedded in the implementation rather than the proxy.
- A `RoleRegistry` contract manages access control across all modules.
- The `EtherFiTimelock` contract (`0x9f26d4C958fD811A1F59B01B86Be7dFFc9d20761`, deployed mid-2024) gates upgrades. The exact `minDelay` parameter is not publicly disclosed in documentation — the practical user-exit window is tied to this unverified value.
- EigenPod-equivalent contracts hold withdrawal credentials for each validator node; these are upgradeable by the protocol admin.
- The Liquid vault uses Merkle-proof-constrained Strategist roles to limit approved actions, reducing the attack surface for that product line.

**Code Quality:**
- 20+ independent audit reports from: CertiK (Feb 2023), Omniscia (May 2023), Nethermind (Jul 2023, NM-0217), Solidified (Oct 2023), Hats Finance (Dec 2023), Zellic (Jan 2024, Mar 2024), Decurity (Apr 2024), Halborn (Jun 2024, Aug 2024), Paladin (Sep 2024), and Certora (formal verification: Oct 2024, Jan 2025 ×3, multiple through 2025, Jan 2026 ×2).
- Certora has performed extensive formal verification on critical contract invariants on an ongoing basis from 2024 through January 2026.
- Open source at github.com/etherfi-protocol/smart-contracts.
- Bug bounty active on Immunefi since March 2024 (updated December 2025); maximum payout $300,000 for critical smart contract vulnerabilities. Scope covers Ethereum, Scroll, Optimism, Arbitrum, and Polygon.

**Attack Surface:**
- UUPS pattern on all core contracts means a compromised multisig can upgrade all protocol logic in a single transaction (after timelock, if enforced). This is the dominant risk vector.
- EigenLayer integration extends ether.fi's attack surface to EigenLayer contracts and AVS slashing conditions.
- eETH's exchange rate is managed by the EtherFiOracle; a manipulated or corrupted oracle report would affect all depositors' balances.
- A Hats Finance audit found a medium-severity reentrancy bug in the LiquidityPool `requestWithdraw` function (Dec 2023) — since remediated.

## Admin/Governance Risk

**Governance Structure:**
- Core contract admin is held by a 2-of-6 multisig. Per documented signer addresses, 5 of 6 signers are ether.fi team members; 1 is an external investor. Signer identities are not publicly disclosed.
- The ETHFI governance token launched March 2024. A governance forum exists at governance.ether.fi and the ETHFI Foundation oversees protocol direction. On-chain proposals exist (e.g., staking contract configurations).
- As of March 2026, no evidence has been found that ETHFI token voting directly controls contract upgrades on-chain. The multisig remains the execution layer for upgrades.

**Key Controls:**
- All UUPS upgrades are gated by `EtherFiTimelock`. The configured `minDelay` is unverified in public documentation; this parameter determines the practical user-exit window.
- Pauser role held by Hypernative and other trusted entities; can halt deposits and withdrawals. Pausing does not drain funds.
- Strategist role (Liquid product) is constrained by Merkle proof to pre-approved action sets, preventing misuse for arbitrary fund movement.

**Trust Assumptions:**
- A 2-of-6 multisig dominated by team members means two team insiders can collude to queue an upgrade. Combined with UUPS upgradeability on all core contracts, this represents a significant trust assumption.
- If the timelock `minDelay` is short (e.g., 24–48 hours), the practical exit window is limited. The exact delay is unverified.
- Governance can change oracle committee membership, node operator sets, fee parameters, and — via upgrade — any contract logic. Direct fund access requires an upgrade (indirect), not a single admin call.

## External Dependencies

**Oracle System:**
- The `EtherFiOracle` is an on-chain committee oracle. Members submit periodic reports from the beacon chain and EigenLayer containing total staked ETH, accumulated rewards, and validator statuses. Reports become canonical after reaching a quorum threshold.
- Oracle committee member identities are not publicly disclosed. The process is permissioned by the protocol team.
- Without new oracle reports, the LiquidityPool cannot update total pooled ETH or process reward accounting. A stalled oracle would pause reward accrual but would not drain funds — users could still exit at the last published exchange rate.
- Internal exchange rate accounting (not a market price oracle) reduces flash-loan manipulation risk but does not eliminate the trusted-committee concern.

**Off-Chain Actors:**
- **Permissioned node operators:** Institutional partners (Finoa, Kiln, DSRV, Chainnodes, Obol, Allnodes, Cosmostation, and others) run validators. No slashable bond required; trust is reputational. Selected by ether.fi team.
- **DVT integration:** ~1,960+ validators run on SSV Network DVT clusters; ~258,784 ETH staked on Obol Distributed Validators. DVT reduces individual operator single-point-of-failure risk but does not eliminate the permissioned-selection trust assumption.
- **EigenLayer dependency:** ether.fi restakes deposited ETH through EigenLayer, inheriting EigenLayer's smart contract risks, operator network dependencies, and AVS slashing conditions for the restaking portion of TVL.
- **IPFS:** Used for off-chain storage of validator key metadata. Not a critical path for fund safety.

**Overall Rating Justification:**
Rated `mixed`. The core staking mechanism requires the EtherFiOracle committee (permissioned, anonymous) and permissioned node operators (reputational trust, no bond) to function correctly. DVT adoption partially mitigates operator single-point-of-failure risk but the operator set remains ether.fi-curated with no on-chain bonding. EigenLayer integration adds further off-chain dependencies. Partially offsetting factors: no external price oracle, internal exchange-rate accounting, and DVT mitigations.

## Economic Risk

**Liquidity Risk:**
- ~$7.8B TVL as of March 2026. weETH is widely integrated across DeFi as collateral, providing secondary market liquidity for those who prefer not to wait for validator exits.
- Validator exit queue introduces withdrawal delays when unstaking from Ethereum itself. eETH withdrawal requests are processed as validators exit, which can take days to weeks during high demand.
- EigenLayer restaking adds an additional exit delay layer — unstaking from AVSs has its own 14-day escrow period.

**Operational History:**
- Permissioned delegated staking: May 3, 2023. eETH liquid staking token: November 15, 2023. ETHFI governance token: March 2024.
- No smart contract exploits to date.
- September 2024: Attempted domain registrar (Gandi.net) account takeover detected and blocked before any access was gained. No funds at risk.
- Discord account compromised (2025): No protocol funds affected.
- One user lost ~501 ETH (~$2M) to a phishing attack (not a protocol vulnerability).
- Protocol survived the April 2025 restaking repricing event and maintained its position as the second-largest liquid staking protocol.

## Stage Assessment

**Stage 0 Criteria Met:**
- **Multisig-weak admin control:** 2-of-6 multisig with 5-of-6 team-controlled signers fails the Stage 1 requirement of a diverse, independent multisig (3-of-5+ with diverse signers) or decentralized governance. Two team insiders can collude to queue any upgrade.
- **Timelock delay unverified:** While the `EtherFiTimelock` contract exists, its configured `minDelay` cannot be confirmed from public documentation. If it is below 48 hours, it fails Stage 1 upgradeability criteria. This uncertainty defaults to the conservative rating.
- **No on-chain DAO:** ETHFI governance exists as forum governance and token distribution, but does not execute on-chain upgrades. The multisig remains the execution layer.

**Why Not Stage 1:**
- **Admin control:** 2-of-6 with team-dominated signers is `multisig-weak` by framework definition. Stage 1 requires a diverse 3-of-5+ or decentralized governance.
- **Timelock unconfirmed:** Stage 1 requires a verified ≥48h timelock on all critical upgrades. The `EtherFiTimelock` delay parameter is not publicly documented.
- **External dependencies:** Oracle committee members are anonymous and permissioned; node operators are trust-based with no slashable bond. This prevents a `decentralized` rating.

**Positive factors noted:**
- Audit coverage is exceptional: 20+ reports including extensive Certora formal verification through January 2026 — this meets `extensive` standard.
- No smart contract exploits in 2+ years of operation.
- Non-custodial validator design gives depositors ownership of withdrawal credentials.

**Justification:**
ether.fi is classified as Stage 0 (Fully Assisted) primarily due to its 2-of-6 team-dominated multisig as the sole on-chain upgrade authority. Despite impressive audit coverage (including ongoing Certora formal verification), an existing timelock contract, and 2+ years without a smart contract exploit, the governance centralization is disqualifying. Any two team members can collude to upgrade all core protocol contracts. Until the multisig is replaced with either a genuinely diverse multisig (3-of-5+ with independent signers) or on-chain ETHFI governance controlling the upgrade path — and the timelock delay is publicly confirmed — Stage 0 is the appropriate classification.

## Links

- [Official Website](https://ether.fi)
- [Documentation](https://etherfi.gitbook.io/etherfi)
- [GitHub](https://github.com/etherfi-protocol/smart-contracts)
- [Audit Reports](https://github.com/etherfi-protocol/smart-contracts/tree/master/audits)
- [Bug Bounty](https://immunefi.com/bug-bounty/etherfi/)
- [Governance Forum](https://governance.ether.fi)
- [Deployed Contracts](https://etherfi.gitbook.io/etherfi/contracts-and-integrations/deployed-contracts)
- [Security Incidents](https://etherfi.gitbook.io/etherfi/security)
