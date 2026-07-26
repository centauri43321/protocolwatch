---
name: "Jupiter"
category: "dexes"
stage: 0
website: "https://jup.ag"
chains: ["solana"]
tvl: "$1.5B"
lastUpdated: "2026-05-15"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "4+ years, no major core exploit"
---

# Jupiter Risk Assessment

## Overview

Jupiter is Solana's dominant DEX aggregator and the largest DeFi protocol on the chain by volume. The core product routes swaps across Solana AMMs and orderbook venues for best execution; surrounding it are several distinct products — Jupiter Perpetuals (an oracle-priced, LP-backed perps venue), Limit Orders, DCA, the JupSOL liquid staking token, and the LFG launchpad — each implemented as its own Solana program.

This assessment focuses on the canonical aggregator/swap router and notes risk surfaces specific to Perpetuals and JLP where they affect the overall trust model. Jupiter's programs are upgradeable through a Squads multisig with no on-chain timelock standard in the Solana ecosystem, which is the dominant factor in its stage classification despite a clean exploit record and broad audit coverage.

## Smart Contract Risk

**Contract Architecture:**
- Aggregator V6 program: `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`
- Perpetuals program (Jupiter Perps): separate program, oracle-priced model collateralized by the JLP pool (SOL, ETH, BTC, USDC, USDT)
- Limit Order v2, DCA, Vote (governance), and JupSOL each live in their own programs
- Programs are deployed via Solana's BPF Loader Upgradeable. To the best of public information, **upgrade authority has not been renounced** on the core programs — they remain upgradeable by the upgrade authority key
- Swap routing executes atomically within a single Solana transaction; the aggregator does not custody funds between hops. JLP is a custodial pool: depositors hold JLP tokens representing pro-rata claims on the underlying basket

**Code Quality:**
- Audited by multiple Solana-focused firms across products: OtterSec, Offside Labs, Halborn, and Sec3
- Audit reports are published via Jupiter's documentation and GitHub
- No public formal verification
- Active bug bounty (Immunefi) covering the core programs
- Open source

**Attack Surface:**
- Aggregator: atomic swap construction limits direct fund-loss surface; routing bugs could in principle result in suboptimal execution but not custody loss given atomic revert semantics
- Perpetuals/JLP: holds material balances and is exposed to oracle manipulation, liquidation logic bugs, and adversarial fee/funding dynamics
- Solana liveness: the chain has had multi-hour outages historically (2021–2022); during outages users cannot adjust positions, which is a material risk for perps LPs
- No known exploit of Jupiter's own programs to date

## Admin/Governance Risk

**Governance Structure:**
- JUP token launched January 31, 2024 ("Jupuary" airdrop); ~10B total supply, ~30% of unallocated supply burned in 2024 following a community vote
- Jupiter DAO operates via the Vote program: stakers lock JUP for voting power and vote on proposals in the Jupiter Vote UI (Active Staking Rewards distribute fee share to stakers)
- DAO governance authority over program upgrades is exercised in practice through a Squads multisig held by the core team; the precise signer set, threshold, and any configured time-lock are not fully public

**Key Controls:**
- The upgrade authority (Squads multisig) can deploy new program bytecode in a single transaction. Solana's BPF Loader Upgradeable has no native timelock; any delay must be implemented at the Squads layer
- No public on-chain timelock configuration verified for Jupiter's Squads vault — treat as `instant` until proven otherwise
- For the aggregator program, upgrades cannot directly drain swap funds (no custody), but a malicious upgrade could redirect routing, take excess fees, or backdoor token approvals
- For Perpetuals/JLP, an upgrade could materially alter the trust assumptions (fee logic, liquidation logic, withdrawal logic)

**Trust Assumptions:**
- Users trust the Squads multisig signer set not to push a malicious upgrade
- LPs in JLP additionally trust the keeper infrastructure and oracle pipeline
- Governance compromise (key compromise of the Squads signers, or a malicious upgrade passing under-resisted) would put JLP balances at material risk

## External Dependencies

**Oracle System:**
- Aggregator: no oracle dependency for the core swap routing itself (prices come from on-chain pools that the route hits)
- Perpetuals: **Pyth Network** is the primary oracle for SOL/ETH/BTC pricing; some components additionally reference Switchboard. Oracle outages or staleness directly affect liquidations and PnL on perps
- Pyth is a pull-based oracle with permissionless publishers; it is not centralized, but its accuracy depends on its publisher set and is governance-mutable

**Off-Chain Actors:**
- Aggregator: no off-chain dependency; routing and execution are on-chain and atomic
- Limit Orders / DCA: permissionless keepers fill orders and execute scheduled swaps — incentivized, not bonded
- Perpetuals: keepers handle order execution, funding, and liquidations. Liquidation keepers are operationally more reliant on Jupiter-team infrastructure; if they fail, JLP can absorb losses that should have been liquidated earlier
- Solana L1 itself is a hard liveness dependency: during chain halts, no user actions of any kind are possible

**Overall Rating Justification:**
Mixed. The aggregator in isolation has minimal external dependencies, but Jupiter as a whole relies on Pyth for perps pricing, on permissioned/team-operated keeper infrastructure for liquidations, and on Solana L1 liveness. Pyth is decentralized but governance-mutable; perps keepers are not bonded and not removable by on-chain governance; aggregator routing inherits the risk of every venue it routes through (Orca, Raydium, Meteora, Phoenix, etc.). This combination fits `mixed` — decentralized oracle paired with material unbonded off-chain actors and L1 liveness assumptions.

## Economic Risk

**Liquidity Risk:**
- Aggregator: no balance-sheet TVL — atomic swaps route through external venues
- JLP pool (the Perpetuals collateral pool): ranged $700M–$1.5B+ through 2024–2025; estimated ~$1.5B as of 2026
- JLP depositors bear adverse-trader PnL risk (LPs are counterparty to perps traders) and oracle/liquidation risk
- Withdrawal from JLP is subject to pool composition and any fees configured by governance

**Operational History:**
- Operating as an aggregator since late 2021 (4+ years)
- Processed cumulative volume in the hundreds of billions USD
- No major exploit of Jupiter's own programs to date — a strong record given scale
- Notable governance events: Jupuary airdrop January 31, 2024; 2024 supply burn vote (~3B JUP unallocated supply burned); LFG launchpad controversies around individual token launches; ongoing debate over frontend-level token filtering and decentralization
- Survived Solana outages, FTX collapse aftermath, and the 2024–2025 memecoin volatility cycles without protocol-level incident

## Stage Assessment

**Criteria evaluation:**

- ⚠ Upgradeability: `instant` — programs are upgradeable via Squads multisig with no public on-chain timelock; Solana's BPF Loader Upgradeable does not provide native timelock support
- ✓ Admin control: Squads multisig with the core team as signers; treated as `multisig-diverse` though exact signer identities and threshold are not fully public
- ⚠ Fund access: `restricted` — aggregator is non-custodial and atomic (no direct drain surface), but JLP is custodial and a malicious upgrade could materially alter its trust assumptions
- ✓ Audits: `multiple` — OtterSec, Offside Labs, Halborn, and Sec3 have covered various programs; reports public
- ⚠ External dependencies: `mixed` — Pyth oracle for perps (decentralized but governance-mutable), unbonded keepers for liquidations and limit orders, Solana L1 liveness, and inherited risk from every venue the aggregator routes through
- ✓ Track record: 4+ years with no major protocol-level exploit

**Why Not Stage 1:**
- Upgradeability does not meet the `timelock-48h+` threshold required for Stage 1. Until Jupiter either renounces upgrade authority on the core programs or publishes a verified on-chain timelock at the Squads layer, upgrades remain effectively instant
- External dependencies (`mixed`) rather than `decentralized` — unbonded perps keepers and team-operated liquidation infrastructure are not governance-removable

**Justification:**
Jupiter is gated to Stage 0 primarily by the absence of a meaningful timelock on program upgrades, which is a structural feature of Solana's program model unless explicitly worked around. Audit coverage, multisig governance, and a 4+ year clean exploit record would otherwise support a higher rating, and the aggregator in isolation has a much weaker custody surface than the headline rating suggests. The classification reflects the full Jupiter surface (aggregator + Perpetuals/JLP + keepers), where LPs and perps users bear non-trivial trust in the upgrade authority and off-chain infrastructure.

## Links

- [Official Website](https://jup.ag)
- [Documentation](https://station.jup.ag/)
- [GitHub](https://github.com/jup-ag)
- [Aggregator V6 Program](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
- [Jupiter Vote (Governance)](https://vote.jup.ag/)
- [Audit Reports](https://station.jup.ag/docs/security/audits)
- [Bug Bounty (Immunefi)](https://immunefi.com/bounty/jupiter/)
