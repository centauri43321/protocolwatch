---
name: "Lighter"
category: "derivatives"
stage: 0
website: "https://lighter.xyz"
chains: ["ethereum"]
tvl: "$487M"
lastUpdated: "2026-06-02"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "~1.5 years (launched Jan 2025), no exploits, one prover-migration data-reconstruction incident resolved"
---

# Lighter Risk Assessment

## Overview

Lighter is an application-specific ZK-rollup on Ethereum L1, purpose-built as a perpetual futures DEX with a central limit order book (CLOB) matched off-chain by a centralized Sequencer and validity-proven on-chain by SNARK circuits.

State transitions — order matching, risk checks, funding payments, and liquidations — are executed off-chain and proven correct by a Plonky2/Plonk-based prover that posts proofs and compressed state-diffs to Ethereum (currently via EIP-4844 blobs). User collateral (USDC and supported assets) is custodied in a single escrow contract on Ethereum L1. The protocol launched mainnet in January 2025, briefly flipped Hyperliquid in 30-day perp volume around its December 2025 TGE (~$232B), and currently sits at ~$487M TVL and ~$1.6T cumulative volume. It is classified as a Stage 0 rollup by L2BEAT due to the upgrade-bypass mechanism described below.

## Smart Contract Risk

**Contract Architecture:**
- Core escrow contract `ZkLighter` at `0x3B4D794a66304F130a4Db8F2551B0070dfCf5ca7` — a custom upgradeable proxy (non-EIP-1967) exposing `getMaster()`, `getTarget()`, `upgradeTarget()`, and `transferMastership()`.
- Validity-proof verifier `ZkLighterVerifier` at `0xac3Ce44B6ff4E402858C99D5699ff63131572BaA`.
- Desert-exit (escape hatch) verifier `DesertVerifier` at `0x2aDBd91742B64105a097bC37D20Ebbca9a496085`.
- `UpgradeGatekeeper` at `0x94da8A995D0D82Ef0fE7E509C6D76c22603B6f67` — controls the 21-day upgrade timelock and the security-council bypass.
- Off-chain components: a single Sequencer (CLOB matching), a Prover (SNARK generation), an Indexer, and API servers. Circuits are open-sourced in `elliottech/lighter-prover`.

**Code Quality:**
- zkLighter circuits audited by zkSecurity (engagement completed Jan 22, 2024; report published Apr 24, 2024). Findings classified as low/informational; verdict: "code was found to be solid and well-organized." Scope included the main operation circuit and the desert-exit circuit.
- Lighter's security page lists seven audit reports total; firm names beyond zkSecurity were not independently verified.
- Open source: SNARK circuits and prover released December 2025 alongside the LIT TGE.
- No public bug bounty program confirmed at the time of writing.
- Formal verification of the Solidity contracts not confirmed. SNARK soundness provides cryptographic guarantees on the proven state transitions only — it does not constrain what an upgraded escrow contract could do to deposits.

**Attack Surface:**
- Upgrade path on the escrow contract is the dominant smart-contract risk (see Admin/Governance Risk).
- Sequencer can frontrun matched trades for MEV (L2BEAT-flagged); does not affect custody but affects execution.
- Single-prover liveness risk: if the prover halts, no new state roots are committed, blocking standard withdrawals (escape hatch unblocks after a 14-day censorship window).
- Oracle signature verification: Stork price signatures are not currently verified on-chain (L2BEAT-flagged); a compromised Stork could feed malicious marks that trigger unfair liquidations.

## Admin/Governance Risk

**Governance Structure:**
- **Lighter Multisig (security council): 4-of-7.** Can reduce the upgrade timelock to zero via the `UpgradeGatekeeper` — i.e., can execute an arbitrary contract upgrade instantly.
- **Lighter Multisig 2 (governance): 3-of-5.** Manages validators and standard 21-day-delayed upgrades.
- **LIT governance token** launched December 2025. 1B supply (50% ecosystem/airdrop, 50% team+investors with a 1-year cliff and 3-year linear vest). Documentation describes LIT holders voting on fees, listings, and upgrades, with 100% of protocol revenue used to buy back and burn LIT. On-chain governance does not yet appear to hold any privileged role over the escrow — the two multisigs above remain in control.

**Key Controls:**
- The 4-of-7 security council can replace the escrow implementation with arbitrary code at any time, with no enforced delay.
- The 3-of-5 governance multisig can execute upgrades on the 21-day delayed path.
- Both multisigs can adjust system parameters and validator/operator roles.
- A user-side **escape hatch ("desert mode")** allows anyone to prove their balance against the on-chain state root and withdraw directly from the escrow after the Sequencer censors a priority L1 transaction for 14 days. The circuit is open-sourced and verified on-chain by `DesertVerifier`.

**Trust Assumptions:**
- The 14-day escape-hatch window is meaningfully longer than the zero-delay upgrade bypass. A malicious or compromised 4-of-7 council could deploy a drain implementation and empty the escrow before users can finish a desert exit. This is why L2BEAT explicitly states: "Funds can be stolen if a contract receives a malicious code upgrade. There is no delay on code upgrades."
- LIT token-holder governance does not currently constrain the multisigs, so the value of the governance layer for custody purposes is presently zero.

## External Dependencies

**Oracle System:**
- Mark and index prices are computed from a multi-source median: **Stork** (primary, low-latency, signed off-chain), **Chainlink**, and **Pyth**, combined with CEX medians (Binance/OKX) and Lighter's own impact price.
- Stork signature verification on-chain is currently absent per L2BEAT — the system trusts the Sequencer to feed correctly attested Stork data. Chainlink and Pyth provide redundancy in the median but do not eliminate this surface.
- Governance retains the ability to modify oracle sources.

**Off-Chain Actors:**
- **Sequencer**: single centralized operator. No public bonding or decentralized failover. Censorship is bounded only by the 14-day escape-hatch window.
- **Prover**: operated by Lighter. SNARK soundness ensures the prover cannot publish invalid state roots, but a prover halt blocks normal withdrawals.
- **Keepers / liquidations**: handled inside the matching/risk circuit rather than by external keeper bots. This reduces external-actor surface relative to GMX-style designs.

**Bridges:**
- Native Ethereum L1 deposit and withdrawal via the rollup contract. The protocol also operates a `FastCCTP` contract (`0x57e9e78a627baa30b71793885b952a9006298af6`) integrating Circle's CCTP for fast cross-chain USDC routing — this is a deposit-path convenience and does not introduce bridge custody beyond Circle.

**Overall Rating Justification:**
Rated `mixed`. Oracle redundancy across Stork/Chainlink/Pyth is non-trivial, but Stork signatures are not verified on-chain and the Sequencer remains a single centralized operator. The prover is centralized but bounded by SNARK soundness. There is no critical centralized custodian (collateral lives in the L1 escrow), so this does not rise to `centralized`, but the combination of an unverified primary oracle path and a single-operator Sequencer prevents a `decentralized` rating.

## Economic Risk

**Liquidity Risk:**
- ~$487M TVL (DeFiLlama); escrow contract holds ~$780M across 87 tokens on Etherscan, with the difference largely attributable to LIT token balances rather than trading collateral.
- Perp order books are deep on majors (BTC, ETH, SOL) with active institutional market makers; long-tail listings have thinner books and correspondingly higher liquidation cascade risk.
- Withdrawals are bounded by Sequencer/prover liveness in the normal path; under failure, the 14-day escape hatch is the binding constraint.

**Operational History:**
- Mainnet launched January 2025; full public/permissionless launch reported around October 2025.
- Cumulative volume ~$1.6T as of early 2026; peaked at ~$232B in 30-day perp volume around the December 2025 LIT TGE, briefly surpassing Hyperliquid.
- **Incidents:** L2BEAT notes a prover migration that rendered a window of historical state-diff blobs unreadable; resolved by publishing a full state snapshot. No known loss-of-funds events, no known custody exploits.

## Stage Assessment

**Stage 0 Classification:**

- ✗ Instant upgrade bypass — the 4-of-7 security council can collapse the 21-day timelock to zero via `UpgradeGatekeeper`, so the upgrade path on the fund-holding escrow is effectively `instant`. This alone forces Stage 0.
- ✗ Fund access possible — an instant upgrade can install drain logic before users can complete the 14-day desert-exit window. Per the framework's upgrade/fund-access interaction rule, instant upgrade on an escrow with no direct admin drain still maps to `fundAccess: possible`.
- ⚠ Admin control is a 4-of-7 multisig (security council) plus a separate 3-of-5 governance multisig. The 4-of-7 council is nominally diverse but its bypass authority is the load-bearing concern, not its threshold.
- ⚠ Stork oracle signatures are not currently verified on-chain — flagged by L2BEAT as a separate trust assumption, independent of the upgrade-bypass issue.
- ⚠ Single Sequencer and single Prover. Bounded by SNARK soundness (no invalid state) and the 14-day escape hatch (censorship resistance), but not bonded or governed.
- ⚠ LIT token-holder governance is live in name but does not currently hold any privileged role over the escrow.
- ✓ zkSecurity audit of the zk circuits is public and substantive; six additional audits are listed by the project but not independently enumerated here.
- ✓ Open-source SNARK circuits and prover (`elliottech/lighter-prover`).
- ✓ Escape hatch (`desert mode`) exists and is verified on-chain by `DesertVerifier` — material mitigation against Sequencer censorship, though not against malicious upgrades.
- ✓ ~1.5 years live with significant TVL and no custody exploit.

**Why Not Stage 1:**

- ✗ The security council's ability to bypass the upgrade timelock to zero means the protocol does not satisfy the Stage 1 requirement of a ≥48-hour timelock with no bypass on critical upgrades of fund-holding contracts. Removing or constraining the bypass (or transferring upgrade authority to on-chain governance with an enforced delay) would be the single change required to lift to Stage 1.

**Justification:**

Lighter's smart-contract execution layer is technically strong: a SNARK-proven CLOB with a real on-chain escape hatch is a credible trust-minimization design, and the zkSecurity audit of the circuits is high-quality. However, the central question — *can the user's funds be taken, frozen, or made unrecoverable without their consent?* — has an unambiguous answer today: a 4-of-7 multisig can deploy a malicious implementation to the escrow contract with no delay, and the 14-day escape hatch is not fast enough to outrun such an upgrade. L2BEAT classifies Lighter as Stage 0 for exactly this reason, and this framework concurs. The protocol can advance to Stage 1 by enforcing the 21-day timelock without a council bypass, and to Stage 2 by transferring upgrade authority to a sufficiently decentralized governance process (or removing it entirely).

## Links

- [Official Website](https://lighter.xyz)
- [Documentation](https://docs.lighter.xyz)
- [Whitepaper](https://assets.lighter.xyz/whitepaper.pdf)
- [Security Audits Index](https://docs.lighter.xyz/security/security-audits)
- [zkSecurity Audit Report (Apr 2024)](https://blog.zksecurity.xyz/2024-lighter-zklighter-report.pdf)
- [GitHub — Prover / Circuits](https://github.com/elliottech/lighter-prover)
- [L2BEAT — Lighter](https://l2beat.com/scaling/projects/lighter)
- [DeFiLlama — Lighter](https://defillama.com/protocol/lighter)
- [Escrow Contract (Etherscan)](https://etherscan.io/address/0x3b4d794a66304f130a4db8f2551b0070dfcf5ca7)
