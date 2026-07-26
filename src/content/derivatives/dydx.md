---
name: "dYdX"
category: "derivatives"
stage: 1
website: "https://dydx.exchange"
chains: ["dydx-chain"]
tvl: "$133M"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-7d+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "decentralized"
  trackRecord: "5+ years (V1-V4), $9M insurance fund loss (Nov 2023)"
---

# dYdX Risk Assessment

## Overview

dYdX is a decentralized perpetual exchange operating as a sovereign Cosmos SDK appchain (dYdX Chain) secured by CometBFT consensus with 60 active validators. The protocol features an in-memory order book and matching engine ("memclob") embedded directly in the validator node software, enabling ~2,000 TPS with ~1-second block times. Orders are held in validator memory, and matched trades are proposed in blocks and committed through standard CometBFT consensus.

The protocol evolved through four major versions: V1 and V2 on Ethereum L1, V3 on StarkEx (Ethereum L2), and V4 as the current sovereign appchain launched in October 2023. V3 on StarkEx was fully sunset on October 28, 2024, with $70M+ in user funds remaining unwithdrawn. L2BEAT built a StarkEx Explorer to enable escape hatch withdrawals for remaining users. There are no admin keys or multisig — all protocol changes flow through on-chain governance. Over 126 governance proposals have been submitted, including 95+ new market listings.

## Smart Contract Risk

**Contract Architecture:**
- Sovereign L1 blockchain built on Cosmos SDK with CometBFT consensus
- Modular design: Markets, Margin, Orderbook, Liquidation, and other custom modules
- Validators run in-memory order book ("memclob") and matching engine as part of node software
- Orders stored in validator memory, matched trades go through CometBFT consensus
- ~2,000 TPS capacity, ~1-second block times
- No reliance on Ethereum for execution or security

**Code Quality:**
- Audited by Informal Systems (3-phase audit of V4 core, 1 critical finding identified and resolved)
- Open source since V4 launch (October 2023)
- $5M bug bounty program
- Cosmos SDK battle-tested foundation
- Only one primary audit firm for V4 core limits the `audits` rating to `multiple` rather than `extensive`

**Attack Surface:**
- Validator set security (60 active validators)
- Off-chain order matching in validator memory (deterministic, consensus-verified)
- Cross-chain bridging for USDC deposits via Noble/IBC/CCTP
- Novel appchain architecture may have undiscovered issues
- MegaVault operator role (centralized but opt-in)

## Admin/Governance Risk

**Governance Structure:**
- No admin keys, no multisig — all changes via on-chain governance
- DYDX token staking required to vote
- Cosmos x/gov module for proposal lifecycle
- Validators inherit delegated voting power unless stakers vote directly
- Standard proposals: 33.4% quorum, 67% approval threshold
- Expedited proposals: 75% approval threshold, 1-day voting period for urgent matters

**Key Controls:**
- Market listings and parameter updates (95+ markets added via governance)
- Software upgrades and module configurations
- Network parameters and fee adjustments
- Insurance fund and community treasury management
- 126+ governance proposals submitted to date

**Trust Assumptions:**
- Validator set must remain honest (60 active validators)
- 30-day unbonding period for staked DYDX
- No single entity controls governance — fully token-holder driven
- Cosmos governance voting period serves as effective timelock (standard multi-day voting window maps to `timelock-7d+`)

## External Dependencies

**Oracle System:**
- Validators run Slinky sidecar process for price data
- Per-block price updates committed through consensus
- Validator-operated — no external oracle provider dependency
- Multiple data sources aggregated by each validator
- Economic incentives aligned via staking/slashing

**USDC Deposit Path — Noble/IBC/CCTP:**
- USDC arrives via Circle's Cross-Chain Transfer Protocol (CCTP) through Noble (a Cosmos appchain purpose-built for native asset issuance)
- Deposits traverse: source chain → CCTP → Noble → IBC transfer → dYdX Chain
- Dependencies on IBC relayers (permissionless, multiple operators), Noble chain liveness, and Circle CCTP availability
- Withdrawal path follows the reverse route

**Indexer:**
- Off-chain read-optimized data layer that frontends rely on for order book display and historical data
- Open source and can be self-hosted by anyone
- Not required for protocol function — users can interact directly with the chain via CLI or RPC
- Does not affect protocol security or fund safety

**Overall Rating Justification:**
Rated `decentralized` because all critical external dependencies are operated by decentralized or permissionless infrastructure. The oracle system (Slinky) is run by the same validator set that secures the chain. IBC relaying is permissionless with multiple independent operators. Noble is a separate Cosmos chain but operates as decentralized infrastructure for native USDC issuance. Circle's CCTP is the most centralized element in the deposit path, but it only affects the ability to bridge new USDC in — it cannot compromise funds already on the dYdX Chain. The Indexer is off-chain but non-critical and open source.

## Economic Risk

**MegaVault:**
- Opt-in USDC deposit product offering yield from market-making activity
- Operator (Greave, via dYdX Grants) manages market-making strategies across dYdX markets
- Centralized operator role, but participation is entirely voluntary — users choose to deposit
- Operator cannot access deposits beyond strategy execution parameters

**Liquidity Risk:**
- Off-chain order book provides CEX-like performance (~1s blocks, ~2,000 TPS)
- Institutional market makers active on the platform
- Cross-margining improves capital efficiency

**Operational History:**
- V1 launched 2019 on Ethereum L1
- V3 operated on StarkEx (2021-2024), fully sunset October 28, 2024
- V4 launched October 2023 on Cosmos as sovereign appchain
- $1T+ cumulative trading volume across all versions

**Incident History:**
- **November 2023 — YFI/SUSHI Market Manipulation:** An attacker manipulated the YFI market by pumping the price approximately 170%, then crashing it 43%, triggering $38M in liquidations across the platform. The insurance fund absorbed approximately $9M in losses. The attacker was identified and law enforcement was involved. This exposed risks around thin-liquidity market listings and led to governance tightening of open interest caps and margin requirements.
- **July 2024 — DNS Hijacking:** The dydx.exchange domain nameservers were hijacked via a Squarespace OAuth vulnerability, redirecting users to a phishing site. The issue was identified and recovered within hours. The dYdX Chain itself was never compromised — this was purely a frontend/DNS attack vector. Highlighted the gap between protocol-level decentralization and frontend infrastructure.

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ On-chain governance with no admin keys or multisig — all changes require token-holder vote
- ✓ Decentralized validator network (60 active validators) running consensus, order matching, and oracle updates
-  ✓ Governance voting period provides effective timelock (`timelock-7d+`)
- ✓ Fund access is restricted — governance can transfer insurance fund but cannot directly access user trading accounts
- ✓ Multiple security audits and $5M bug bounty program
- ✓  5+ years operational history across V1-V4
- ✓ External dependencies are decentralized (validator-run oracles, permissionless IBC)

**Why Not Stage 2:**
- V4 appchain architecture is relatively new (launched October 2023) — needs more time to prove robustness
- Only one primary audit firm (Informal Systems) for V4 core; `extensive` would require multiple independent audit firms
- Governance retains broad upgrade authority over all chain modules — no immutability guarantees
- Insurance fund loss event (Nov 2023) demonstrates economic risk in the current design
- USDC deposit path depends on Noble/CCTP infrastructure that is outside dYdX governance control
- MegaVault introduces a centralized operator role, albeit opt-in

**Justification:**
dYdX achieves Stage 1 (Limited Trust) through its fully on-chain governance model with no admin keys, multisig, or privileged roles. The 60-validator set runs consensus, order matching, and oracle price feeds, eliminating centralized infrastructure from the critical path. However, the V4 architecture is still maturing, governance retains unconstrained upgrade authority, and the $9M insurance fund loss in November 2023 demonstrates that economic risks remain meaningful. The reliance on a single audit firm for V4 core and the broad scope of governance powers prevent advancement to Stage 2.

## Links

- [Official Website](https://dydx.exchange)
- [Documentation](https://docs.dydx.exchange)
- [GitHub](https://github.com/dydxprotocol)
- [Governance Forum](https://dydx.forum)
- [dYdX Foundation](https://dydx.foundation)
- [Informal Systems V4 Audit](https://github.com/dydxprotocol/v4-chain/tree/main/audits)
- [Bug Bounty (Immunefi)](https://immunefi.com/bounty/dydx/)
