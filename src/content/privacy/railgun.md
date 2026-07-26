---
name: "Railgun"
category: "privacy"
stage: 1
website: "https://railgun.org"
chains: ["ethereum", "polygon", "bsc", "arbitrum"]
tvl: "$20M"
lastUpdated: "2026-05-15"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "4+ years, no core exploit"
---

# Railgun Risk Assessment

## Overview

Railgun is a privacy system for EVM chains using Groth16 zk-SNARKs. It supports private balances ("0zk addresses") held inside a single per-chain vault contract and operates on a UTXO-style commitment/nullifier model similar to Zcash Sapling, with arbitrary amounts rather than the fixed denominations used by Tornado Cash. Through the Cookbook SDK and the on-chain Relay Adapt contract, users can perform private DeFi — shield into the vault, atomically interact with external protocols (Uniswap, Aave, 0x, etc.), and re-shield in a single transaction.

Railgun is upgradeable: the core RailgunSmartWallet vault sits behind a proxy whose admin is a Delegator (timelock) contract controlled by RAIL-token on-chain governance. This places Railgun's headline trust assumption on governance plus a timelock window in which users could exit before a malicious upgrade takes effect. In January 2024 Railgun shipped Private Proofs of Innocence (PPOI), an opt-in client-side mechanism that lets users cryptographically prove their notes do not descend from a published blocklist of illicit addresses — a response to Tornado Cash sanctions and a practical implementation of the privacy-pool design discussed in the Buterin et al. 2023 paper.

## Smart Contract Risk

**Contract Architecture:**
- **RailgunSmartWallet** (`0xFA7093CDD9EE6932B4EB2c9e1cDE7CE00B1FA4b9` on Ethereum): main vault holding all shielded balances; deployed behind an OpenZeppelin-style transparent proxy
- **Relay Adapt** (`0x4025ee6512DbbdA97049Bcf5AA5D38C54aF6bE8a` on Ethereum): composability adapter for private DeFi; tokens pass through atomically, non-custodial
- **Verifier**: separate zk-SNARK verifier contract checks Groth16 proofs against the commitment Merkle tree
- **Governance + Delegator**: separate contracts. Governance is a Compound-Bravo-style Governor over RAIL token holders; Delegator is the execution timelock that holds the proxy admin role for the core contracts
- Same architecture deployed on Polygon, BSC, and Arbitrum; each chain has its own proxy and Delegator

**Code Quality:**
- Audited by **Trail of Bits** (2022, core contracts and circuits), **ABDK Consulting** (Groth16 circuits), **Zellic** (later contract audits and the POI system), and **Least Authority** (cryptographic components)
- Powers of Tau / Phase 2 trusted setup ceremony with ~24+ participants; soundness holds if at least one participant honestly discarded their toxic waste
- Active bug bounty
- Open source

**Attack Surface:**
- Smart contracts: the core vault is upgradeable, so the worst-case attack surface includes a malicious upgrade pushed through governance. The timelock provides a warning window
- Cryptographic: depends on the integrity of the trusted setup and the correctness of the Groth16 implementation. The circuits have received dedicated audits (ABDK, Least Authority) and have not had soundness issues disclosed
- Cookbook composability: private DeFi interactions inherit the full risk of whatever external protocol they call. This is user-elected risk per-transaction rather than protocol-level custody risk
- No exploit of core contracts has been disclosed in four-plus years

## Admin/Governance Risk

**Governance Structure:**
- **RAIL token** (ERC-20, ~50M max supply) holders vote via a Compound-Bravo-style Governor
- **Delegator (timelock)**: holds proxy admin authority on the core contracts; executes queued proposals only after the configured delay
- Governance scope includes contract upgrades, parameter changes, fee policy, and treasury actions
- Treasury is funded by the 0.25% shield/unshield fee; controlled by RAIL governance vote
- Contributor entities: Railgun Project and Privacy Labs

**Key Controls:**
- Governance can upgrade the core contracts via the Delegator, change protocol fees, and direct treasury spending
- The timelock window — voting period plus post-queue execution delay — provides users with notice before any upgrade takes effect. Reported as multi-day end-to-end; treated here as `timelock-48h+` (conservative) without on-chain verification of the exact `delay()` value
- A guardian/emergency role with limited pause-style powers exists historically; it cannot unilaterally upgrade contracts

**Trust Assumptions:**
- Users trust that governance plus timelock will not push a malicious upgrade, or that they will have time to unshield and exit if one is queued
- Governance cannot directly seize shielded funds — the worst-case path runs through an upgrade that adds a backdoor, which is bounded by the timelock
- POI participation is a per-shield client-side choice. POI does not affect the program's custody guarantees; it adds an opt-in compliance attestation layer

## External Dependencies

**Oracle System:**
- None for core shielded transfers. Balances and transfers are pure zk math against the commitment Merkle tree; no external pricing is required

**Off-Chain Actors:**
- **Broadcaster network** (formerly "Railgun Relayers"): optional permissionless relayers that submit user transactions to chain so the user does not need to spend gas from a deanonymizing address. Recipients are bound into the zk proof, so Broadcasters cannot steal funds; they can only censor or take their advertised fee. Users can self-relay
- **POI aggregator infrastructure**: off-chain components serve the public blocklist and aggregate POI proofs. Nodes can run independently; POI is opt-in per shield and does not affect custody
- **Cookbook integrations**: private DeFi flows pass through Relay Adapt to external protocols (Uniswap, Aave, 0x, etc.). Those integrations inherit the full risk of whatever protocol they call. This is per-transaction user-elected risk, not protocol-level custody

**Overall Rating Justification:**
Mixed. Core shielded transfers require no external systems — no oracle, no keeper, no bridge. Broadcasters cannot steal funds and Broadcaster failure only degrades convenience. The Cookbook composability layer is the main external surface: every private DeFi recipe inherits the full trust assumptions of the protocol it routes through. Because Cookbook usage is opt-in per transaction (and core transfers stay self-contained), this is `mixed` rather than `centralized`.

## Economic Risk

**Liquidity Risk:**
- TVL on the order of $15–30M shielded across all supported chains; the protocol has consistently traded in this range since launch, well below Tornado Cash's pre-sanction peak
- "Anonymity set" matters more than dollar TVL for privacy quality; small TVL combined with arbitrary amounts can produce thin per-amount anonymity sets

**Operational History:**
- Launched January 2022 on Ethereum; expanded to BSC, Polygon, and Arbitrum through 2022–2023
- POI deployed January 2024 in response to the Tornado Cash sanctions environment and the Buterin et al. "Blockchain Privacy and Regulatory Compliance" paper (September 2023), which discussed Railgun-style privacy pools as a practical equilibrium between privacy and compliance
- **No protocol exploits and no loss of user funds** in the core contracts over four-plus years
- **Not sanctioned by OFAC**. Has nonetheless seen illicit use — funds linked to the 2020 KuCoin hack and to DPRK-linked addresses reportedly moved through Railgun, and the Inferno Drainer group has been associated with usage. POI was designed in part to provide an answer to that use pattern

## Stage Assessment

**Stage 1 Criteria Met:**

- ✓ Upgradeability: `timelock-48h+` — core contracts are upgradeable via a Delegator timelock under RAIL on-chain governance; end-to-end window (voting period plus execution delay) provides multi-day notice
- ✓ Admin control: `governance` — RAIL token holders vote via a Compound-Bravo-style Governor; no team-controlled multisig holds direct upgrade authority
- ✓ Fund access: `restricted` — governance cannot directly seize shielded funds; worst-case path runs through a malicious upgrade gated by the timelock
- ✓ Audits: `extensive` — Trail of Bits, ABDK Consulting (circuits), Zellic, and Least Authority; trusted setup ceremony with ~24+ participants
- ⚠ External dependencies: `mixed` — core transfers self-contained, Broadcasters are non-custodial and replaceable, but Cookbook private-DeFi flows inherit the full risk of the external protocols they call (opt-in per transaction)
- ✓ Track record: 4+ years across multiple EVM chains with no core exploit

**Why Not Stage 2:**
- Upgradeability is `timelock-48h+`, not `immutable` or `timelock-7d+` (the exact `delay()` value on the Delegator has not been verified on-chain for this assessment; conservatively rated)
- Battle-tested override does not apply because the core contracts are upgradeable
- A reliable Stage 2 case would require either renouncing proxy admin authority on the core vault or verifiably configuring the Delegator at ≥7 days, combined with reducing the external-dependency rating

**Justification:**
Railgun clears Stage 1 cleanly: governance-controlled upgrades with a meaningful timelock, extensive audit coverage from four reputable firms (Trail of Bits, ABDK, Zellic, Least Authority) across both contracts and circuits, four years of operation without a core exploit, and admin powers structurally bounded so that shielded funds cannot be seized directly. Stage 2 would require either making the core vault immutable or verifying a ≥7-day timelock on-chain, and ideally narrowing the Cookbook-related external-dependency surface.

## Links

- [Official Website](https://railgun.org)
- [Documentation](https://docs.railgun.org/)
- [GitHub](https://github.com/Railgun-Privacy)
- [RailgunSmartWallet](https://etherscan.io/address/0xFA7093CDD9EE6932B4EB2c9e1cDE7CE00B1FA4b9)
- [Relay Adapt](https://etherscan.io/address/0x4025ee6512DbbdA97049Bcf5AA5D38C54aF6bE8a)
- [Audit Reports](https://docs.railgun.org/wiki/learn/security/audits)
- [Privacy Pools paper (Buterin et al.)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364)
