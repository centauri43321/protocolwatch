---
name: "Across"
category: "bridges"
stage: 0
website: "https://across.to"
chains: ["ethereum", "arbitrum", "optimism", "base", "polygon", "bnb-chain", "solana", "linea", "scroll", "zksync", "blast", "mode", "world-chain", "aleph-zero", "hyperliquid"]
tvl: "$32M"
lastUpdated: "2026-03-18"
risks:
  upgradeability: "instant"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "4+ years, no exploits"
---

# Across Risk Assessment

## Overview

Across is an intent-based cross-chain bridge that combines UMA's Optimistic Oracle with bonded relayers and single-sided liquidity pools to provide fast token transfers across EVM chains and Solana. The protocol is built and maintained by Risk Labs — the same organization behind UMA Protocol.

Across launched on Ethereum mainnet in November 2021 and has gone through four major versions. V2 (June 2022) introduced the hub-and-spoke architecture. V3 (early 2024) shifted from a traditional bridge model to an intents-based design. V4 (July 2025) replaced chain-specific SpokePool contracts with a Universal SpokePool backed by ZK proofs (Succinct's SP1 zkVM), allowing new chains to be added in hours rather than weeks.

The protocol's core security claim is that only one honest participant needs to monitor and dispute fraudulent relay settlements to keep the system secure — a 1-of-n security model inherited from UMA's optimistic oracle design. Across has processed $30B+ in cumulative bridge volume since launch with zero exploits to date, and raised $41M in March 2025 from Paradigm, Bain Capital Crypto, Coinbase Ventures, and Multicoin Capital.

## Smart Contract Risk

**Contract Architecture:**

The hub-and-spoke model (V2/V3) consists of two core contract types:

- **HubPool** (`0xc186fA914353c44b2E33eBE05f21846F1048bEda` on Ethereum) — central liquidity backstop and cross-chain administrator. All LP funds are held here. This is the canonical administrator of all SpokePool contracts across every supported chain.
- **SpokePool** — deployed on each supported chain. Users deposit on the source SpokePool; relayers fulfill the intent on the destination chain; funds eventually settle back to the HubPool via canonical bridges. SpokePools are implemented as **UUPS upgradeable proxies** — addresses are stable but implementations can be swapped.

In V4, a **Universal SpokePool** replaces chain-specific implementations. ZK proofs (via Succinct's SP1 zkVM) allow any chain running the `Sp1Helios` verifier to validate Ethereum state and process relayer repayments without a bespoke SpokePool adapter per chain.

**Upgrade Mechanism:**

SpokePools use UUPS proxy patterns. The admin for each SpokePool is the HubPool itself. The HubPool owner can call `relaySpokePoolAdminFunction()` to send a cross-chain message upgrading any SpokePool's implementation. The HubPool itself does not use a proxy pattern in V2 — it is a regular contract whose address is fixed.

Critically, **there is no timelock on HubPool admin functions**. The 3/5 multisig owner can call admin functions and upgrade SpokePools immediately. The only delay mechanism is oSnap's 5-day liveness period, which applies to DAO governance proposals — but the multisig retains the ability to act without going through governance.

**Code Quality:**

- OpenZeppelin has been the dedicated long-term security partner since 2022, conducting **18 audits** covering every major release and incremental upgrade
- 232 issues found across all audits, including 9 critical/high severity — all addressed before deployment
- Audits span: HubPool V2, SpokePool V2, V3 intents redesign, V3 incremental (CCTP integration), V3 OFT integration, token distributor, Solana SVM SpokePool (first Solana program audited by OpenZeppelin at production scale), V4 Universal SpokePool
- UMA's Optimistic Oracle, which Across depends on, has its own separate continuous audit coverage from OpenZeppelin
- Open source contracts on GitHub (`across-protocol/contracts`)
- Active bug bounty via Immunefi (up to $1,000,000 for critical issues)
- No Certora formal verification identified

**Attack Surface:**

- UUPS proxies create upgrade risk; mitigated only by multisig governance, not a timelock
- HubPool admin functions (no timelock) could be abused if the 3/5 multisig is compromised
- Cross-chain upgrade path (HubPool → SpokePool via canonical bridge) introduces latency and potential cross-chain message relay failure
- UMA optimistic oracle liveness is a dependency — a 1-hour dispute window exists for the dataworker's root bundle submissions
- V4 ZK proof infrastructure (Succinct SP1) is newer technology with a shorter track record than the V2/V3 contracts

## Admin/Governance Risk

**Governance Structure:**

Across uses a layered governance model combining the ACX DAO and an operational multisig:

1. **ACX DAO via oSnap**: ACX token holders vote on Snapshot. Approved proposals are proposed for on-chain execution through oSnap — UMA's optimistic governance tool. A **5-day liveness window** allows anyone to dispute incorrect proposals before execution. If undisputed, any person can execute the transaction from the DAO's Gnosis Safe. This is the primary governance path.

2. **Across Council (3/5 multisig)**: An operational council executes routine actions and handles emergencies without going through the full DAO process. The council Safe is deployed identically across Ethereum, Optimism, Arbitrum, and Polygon. The Hub Pool Owner MultiSig is at `0xb524735356985d2f267fa010d681f061dff03715` on Ethereum.
   - Threshold: **3 of 5** signatures required
   - Signers: `0x1d933Fd71FF07E69f066d50B39a7C34EB3b69F05`, `0x868CF19464e17F76D6419ACC802B122c22D2FD34`, `0x837219D7a9C666F5542c4559Bf17D7B804E5c5fe`, `0x996267d7d1B7f5046543feDe2c2Db473Ed4f65e9`, `0xcc400c09ecBAC3e0033e4587BdFAABB26223e37d`

**Key Controls:**

The HubPool owner (the 3/5 multisig) can — **without any timelock delay**:

- Pause/unpause the bundle proposal process (freeze fills and deposits)
- Delete active proposals (emergency safeguard)
- Modify liveness period, bond amount, and bond token
- Enable/disable tokens and pool rebalance routes
- Call `haircutReserves()` to reduce LP `utilizedReserves` (effectively reducing LP value)
- Relay admin messages to all SpokePools — including upgrading their implementations

The multisig **cannot** directly drain user deposits or LP funds in a single transaction. Fund access is restricted: the admin can degrade LP positions via `haircutReserves()` and can pause the system, but cannot call a function to send all funds to an arbitrary address. This justifies `restricted` rather than `possible` for fund access.

**Trust Assumptions:**

- Users and LPs must trust that the 3/5 multisig will not act maliciously. With no timelock, there is no exit window if the multisig is compromised.
- The oSnap 5-day liveness provides a window for community dispute of DAO-submitted proposals, but does not constrain the council's emergency powers.
- Signer identities are not publicly documented (addresses only, no named individuals verified in public sources). This limits assessments of diversity and independence.

## External Dependencies

**UMA Optimistic Oracle:**

Across's settlement layer is UMA's Optimistic Oracle. After relayers fulfill user intents on destination chains, a designated **dataworker** aggregates fulfilled intents into a root bundle and submits it to the UMA OO. The OO assumes submissions are correct for 1–2 hours unless someone disputes. Disputes escalate to UMA token holder voting — a permissionless process. The system is secure as long as at least one honest participant monitors and disputes fraudulent root bundle submissions.

UMA's OO is itself mature infrastructure, with continuous OpenZeppelin audit coverage. However, Across has a direct economic dependency on UMA's oracle liveness and dispute mechanism — if UMA's voting system fails or is captured, fraudulent root bundles could be settled.

**Relayer Network:**

Relayers are the critical off-chain actors who make Across fast. They front capital on the destination chain when a user deposits on the source chain. Key facts:

- Relayers are **permissionless** — anyone can run a relayer; there is no whitelist or DAO approval required
- Relayers are **economically bonded** through the UMA OO dispute mechanism: fraudulent relayer claims would be disputed and the relayer would lose their bond
- Relayers compete on speed, creating a market for fast execution
- If no relayer fulfills an intent, the deposit is not immediately lost, but the user must wait for the slow path (canonical bridge settlement), which can take hours to days

**V4 ZK Infrastructure:**

V4 introduces Succinct's SP1 zkVM for generating ZK proofs of Ethereum state. Each destination chain runs `Sp1Helios` verifier contracts. This is production-grade but newer technology (2025 launch) with a shorter battle-tested track record than the V2/V3 components.

**Overall Rating Justification:**

Relayers are permissionless and bonded — a positive. UMA's OO is decentralized but introduces a specific liveness dependency. V4's ZK proof infrastructure is newer and less battle-tested. The combination of permissionless-but-economically-bonded relayers (positive), a decentralized dispute mechanism (positive), and meaningful dependency on UMA's oracle health and ZK proof infrastructure (novel technology risk) results in a `mixed` rating. The permissioned element is not the relayer set itself but the interaction with UMA governance and ZK verifier deployment.

## Economic Risk

**Liquidity Risk:**

- Current TVL: approximately $32M as of March 2026 — relatively modest for a bridge that has processed $30B+ in cumulative volume
- LP funds sit on the Ethereum HubPool; bridge security does not depend on TVL scale since relayers front capital from their own liquidity
- Relayer profitability directly affects bridge liveness — if fee margins compress or capital requirements grow, relayer participation could decline

**Relayer Economic Design:**

- Relayers earn fees for fronting liquidity; fee rates are set by the protocol
- Relayers bear short-term capital risk (they front ETH or tokens on the destination chain and wait to be repaid from the HubPool via UMA settlement)
- Capital efficiency for relayers has improved with V3/V4's repayment mechanisms

**Operational History:**

- Mainnet launch: November 8, 2021
- V2 launched: June 2022
- V3 (intents-based): January 2024
- ACX token launch and governance activation: November 2022
- V4 (Universal SpokePool + ZK proofs): July 2025
- Solana integration: August 2025
- $41M raise from Paradigm et al.: March 2025
- Zero exploits across 4+ years and $30B+ in bridge volume
- No hacks, no frozen funds, no lost user deposits to date

## Stage Assessment

**Stage 0 Criteria:**

- ✓ Extensive audits — 18 OpenZeppelin audits since 2022, Immunefi bug bounty up to $1M
- ✓ Decentralized governance exists — ACX DAO with oSnap (5-day liveness window) for DAO-path proposals
- ✓ Restricted fund access — no single admin call can drain LP funds to an arbitrary address
- ✓ 4+ years of production operation with no exploits
- ⚠ Upgradeability is **instant** — 3/5 council multisig can upgrade SpokePools and HubPool without delay; signer identities are not publicly verified
- ⚠ External dependencies are **mixed** — UMA OO is decentralized; V4 ZK infrastructure (Succinct SP1) is newer and less battle-tested

**Why Not Stage 1:**

The single hard blocker is upgradeability: SpokePools are UUSS proxies with no on-chain upgrade timelock. The 3/5 council multisig (with emergency override powers) can push a new implementation to any SpokePool instantly. Stage 1 requires a minimum 48-hour timelock on critical upgrades — this criterion is not met. All other Stage 1 criteria (governance structure, fund access, audit depth, track record) would individually qualify, but upgradeability alone disqualifies.

**Why Not Stage 2:**

Instant upgradeability, restricted (not impossible) fund access, mixed external dependencies, and council multisig with non-public signer identities all prevent Stage 2.

**Justification:**

Across is classified Stage 0 because its SpokePools are upgradeable with no on-chain timelock — the 3/5 council multisig can execute contract upgrades immediately. This is the single criterion that prevents Stage 1. The protocol otherwise demonstrates strong risk controls: extensive audit coverage, 4+ years exploit-free, restricted fund access by design, permissionless bonded relayers, and oSnap-based DAO governance. Adding a 48h+ enforced upgrade timelock would be the concrete change needed to reach Stage 1.

## Links

- [Official Website](https://across.to)
- [Documentation](https://docs.across.to)
- [GitHub](https://github.com/across-protocol/contracts)
- [HubPool Contract (Etherscan)](https://etherscan.io/address/0xc186fa914353c44b2e33ebe05f21846f1048beda)
- [HubPool Owner MultiSig (Etherscan)](https://etherscan.io/address/0xb524735356985d2f267fa010d681f061dff03715)
- [Governance Forum](https://forum.across.to)
- [Governance Snapshot](https://snapshot.org/#/acrossprotocol.eth)
- [Audit Reports (Docs)](https://docs.across.to/resources/audits)
- [OpenZeppelin Customer Story](https://www.openzeppelin.com/customer-stories/across)
- [Bug Bounty (Immunefi)](https://immunefi.com/bounty/across/)
- [DeFiLlama TVL](https://defillama.com/protocol/across)
- [UMA Optimistic Oracle Case Study](https://blog.uma.xyz/articles/case-study-how-uma-secures-across-protocol)
