---
name: "GMX"
category: "derivatives"
stage: 0
website: "https://gmx.io"
chains: ["arbitrum", "avalanche"]
tvl: "$259M"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "instant"
  adminControl: "eoa"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "4+ years, $42M V1 exploit (July 2025, recovered)"
---

# GMX Risk Assessment

## Overview

GMX is a decentralized perpetual exchange that enables trading with up to 100x leverage directly from user wallets. The protocol operates on Arbitrum and Avalanche, using a unique liquidity model where liquidity providers serve as the counterparty for all trades, earning fees and trader losses while bearing trader profits.

GMX pioneered the "real yield" DEX perpetuals model and has processed billions in cumulative trading volume. V1 uses a single GLP pool as counterparty for all trades, while V2 introduced isolated GM pools per market with improved risk management. GMX expanded to Solana in March 2025 but rebranded that deployment as "GMTrade" in November 2025; this assessment covers GMX on Arbitrum and Avalanche only.

## Smart Contract Risk

**Contract Architecture:**
- V1: Core Vault contract is immutable. Peripheral contracts (OrderBook, PositionRouter, etc.) are updatable via timelock. GLP pool acts as counterparty for all trades.
- V2: Modular, upgradeable architecture with a 24-hour timelock on contract upgrades. Uses a two-step asynchronous execution model where users submit order requests on-chain, and keepers execute them with signed price data.
- Both V1 and V2 coexist; V1 is in wind-down mode following the July 2025 exploit.

**Code Quality:**
- Guardian Audits: 7 separate security reviews across V1 and V2
- Dedaub: Smart contract audit
- ABDK: Smart contract audit
- Certora: Formal verification of core invariants
- $5M maximum bug bounty via Immunefi
- $1M bounty paid to Collider for a critical vulnerability disclosure
- Fully open-source contracts

**Attack Surface:**
- Complex derivatives logic with liquidation mechanics
- Oracle-dependent for mark prices and execution prices
- V2 keeper dependency for order execution (see External Dependencies)
- Cross-contract interactions between vault, position, and order modules
- GLP/GM pools absorb trader PnL, creating economic attack vectors

## Admin/Governance Risk

**Governance Structure:**
- Primary admin is a team-controlled account (not a multisig), which holds upgrade and configuration authority over the protocol
- A separate multisig composed of advisors exists but can only cancel pending timelock actions — it serves as a safety backstop, not an administrative body
- Snapshot voting for community governance proposals
- GMX Security Committee (Season 4: May-October 2026) oversees security-related decisions

**Key Controls:**
- 24-hour timelock on contract upgrades and parameter changes (below the 48-hour threshold, classified as `instant` per framework)
- 28-day timelock on GMX token minting only
- Admin can pause trading and order execution
- Admin can update fee parameters, market configurations, and keeper addresses
- Emergency pause capability via admin account

**Trust Assumptions:**
- Users must trust a team-controlled account that holds full admin authority over the protocol
- The advisory multisig provides a limited check (cancel-only) but cannot propose or execute changes
- A compromised admin account could upgrade contracts, change parameters, or pause the protocol. While the 24-hour timelock provides a window for detection, it falls short of meaningful protection given the single-entity control.
- Admin cannot directly drain user funds from vaults, but can pause trading, preventing users from closing positions or withdrawing

## External Dependencies

**Oracle System:**
- V2 uses Chainlink Data Streams (pull-based, off-chain signed price reports) rather than traditional on-chain price feeds
- Keepers bundle signed Chainlink price reports into every execution transaction
- V1 uses Chainlink on-chain price feeds with a fast price feed layer
- Price deviation protections and staleness checks are implemented

**Off-Chain Actors:**
- GMX V2 fundamentally depends on off-chain keepers to execute every user action. Users submit order requests on-chain, but keepers must monitor those requests, fetch Chainlink Data Streams signed price reports, and submit execution transactions.
- If keepers disappear, all pending orders (opens, closes, deposits, withdrawals) would remain stuck. A 3-minute self-execution fallback exists, allowing users to execute their own orders after the timeout — mitigating complete keeper dependency.
- Liquidations also depend on keeper infrastructure.
- Keepers are not bonded or slashable; they are operated by the team and authorized partners.

**Overall Rating Justification:**
Rated `mixed` because GMX relies on Chainlink Data Streams, which is a decentralized oracle network, but also depends on a centralized keeper infrastructure for order execution. The 3-minute self-execution fallback partially mitigates the keeper dependency, preventing a complete liveness failure, but normal protocol operation still requires functioning keepers. The combination of decentralized price data with centralized execution infrastructure justifies the mixed rating.

## Economic Risk

**Liquidity Risk:**
- TVL distributed across GLP (V1) and GM (V2) pools
- GLP holders bear aggregate trader PnL risk across all V1 markets
- GM pools isolate risk per market in V2
- Deep liquidity in major pairs (ETH, BTC)

**Operational History:**
- Launched September 2021 on Arbitrum, later expanded to Avalanche
- V2 launched August 2023 with isolated pool architecture
- September 2022: $565K AVAX/USD price manipulation exploit on V1. An attacker exploited a design flaw (not a smart contract bug) by manipulating AVAX prices on low-liquidity CEXs to profit against the GLP pool. GMX responded by capping open interest on volatile assets.
- July 9, 2025: $42M cross-contract reentrancy exploit on V1. Root cause was a vulnerability introduced by an unaudited fix to a previously identified vulnerability. The attacker manipulated GLP token price from approximately $1.45 to over $27, draining value from the pool. The attacker kept approximately $5M as a bounty and returned the remainder. GMX established a $44M compensation plan for affected GLP holders. V2 pools were unaffected.
- Generally strong operational record outside of the two incidents, with consistent uptime and fee generation over 4+ years

## Stage Assessment

**Stage 0 Criteria Met:**
- ✓ Upgradeability: 24-hour timelock on upgrades falls below the 48-hour minimum threshold for Stage 1 (`instant`)
- ✓ Admin control: Primary admin is a team-controlled account, not a multisig or governance system (`eoa`)
- ✓ Fund access: Admin cannot directly drain funds but can pause trading, restricting user ability to close positions or withdraw (`restricted`)
- ✓ Audits: Extensive audit coverage with formal verification and active bug bounty (`extensive`)
- ✓ External dependencies: Mixed decentralized/centralized infrastructure (`mixed`)

**Why Not Stage 1:**
- Admin authority is held by a single team-controlled account rather than a multisig or governance system
- 24-hour timelock is below the 48-hour threshold required for Stage 1
- Advisory multisig has cancel-only authority, insufficient to qualify as meaningful governance oversight
- Recent $42M exploit (July 2025) raises concerns about security processes, particularly the practice of deploying unaudited fixes

**Justification:**
GMX is classified as Stage 0 (Fully Assisted) primarily because protocol admin authority is concentrated in a single team-controlled account with only a 24-hour timelock on upgrades. While the protocol benefits from extensive audit coverage (Guardian Audits, Dedaub, ABDK, Certora formal verification), a large Immunefi bounty program, and 4+ years of operational history, the governance structure does not meet Stage 1 requirements. The advisory multisig can only cancel timelock actions, not govern the protocol. The July 2025 V1 exploit — caused by deploying an unaudited fix — further underscores the risk of centralized control over upgrades. To advance to Stage 1, GMX would need to transition admin authority to a multisig or governance system and extend the upgrade timelock to at least 48 hours.

## Links

- [Official Website](https://gmx.io)
- [Documentation](https://docs.gmx.io)
- [GitHub](https://github.com/gmx-io)
- [Governance Forum](https://gov.gmx.io)
- [Stats](https://stats.gmx.io)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/gmx/)
- [Guardian Audits](https://github.com/gmx-io/gmx-synthetics/tree/main/audits)
