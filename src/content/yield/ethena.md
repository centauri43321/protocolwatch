---
name: "Ethena"
category: "yield"
stage: 0
website: "https://ethena.fi"
chains: ["ethereum", "arbitrum", "base", "optimism", "bsc", "blast", "scroll", "mantle", "linea"]
tvl: "$11.89B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "multisig-weak"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "centralized"
  trackRecord: "2+ years"
---

# Ethena Risk Assessment

## Overview

Ethena is a synthetic dollar protocol that creates USDe, a crypto-native stablecoin backed by delta-hedged positions. Users deposit collateral (ETH, stETH, BTC, SOL, or stablecoins), and the protocol opens short perpetual futures positions on centralized exchanges to neutralize price exposure, creating a dollar-pegged asset. Yield is generated primarily from perpetual futures funding rates and staking rewards, distributed to sUSDe holders.

USDe has grown to become the 3rd largest stablecoin by market cap, exceeding $11B. The protocol introduced USDtb in late 2024, a stablecoin backed by BlackRock's BUIDL tokenized treasury fund, serving as a reserve asset during negative funding rate periods. Ethena operates across 23+ chains for USDe bridging and usage. The core minting/redeeming infrastructure remains on Ethereum, with Off-Exchange Settlement (OES) custody on Copper ClearLoop, Ceffu MirrorX, and Anchorage Digital.

## Smart Contract Risk

**Contract Architecture:**
- USDe is an ERC-20 with a minter role — the admin can change the minter address, and the minter can mint unlimited USDe
- sUSDe is an ERC-4626 yield-bearing vault where users stake USDe to earn yield from funding rates
- EthenaMinting contract handles mint/redeem operations with whitelisting, collateral limits, and per-block mint/redeem caps
- Off-Exchange Settlement (OES) via MPC custody wallets — assets never sit on exchange hot wallets
- Admin holds `DEFAULT_ADMIN_ROLE` with ability to: change minter, add/remove collateral assets, set custodian addresses, adjust per-block limits, and delegate signing authority

**Code Quality:**
- Audited by: Zellic (USDe core, 2024), Quantstamp (USDe/sUSDe, 2024), Spearbit/Cantina (sUSDe staking, 2024), Pashov Audit Group (EthenaMinting, 2024), Code4rena competition (2024), Cyfrin (USDtb, 2024) — 6 audit firms total
- $3M maximum bug bounty via Immunefi ($3M for critical smart contract, $100K for critical website)
- Open source contracts on GitHub
- No formal verification

**Attack Surface:**
- Minter role can mint unlimited USDe — if compromised, infinite minting would break the peg
- sUSDe has FULL_RESTRICTED_STAKER_ROLE: admin can freeze/seize sUSDe from any address (designed for regulatory compliance, but represents a centralized seizure capability)
- GATEKEEPER role can pause minting/redeeming via SOFT_RESTRICTED_STAKER_ROLE
- Cooldown period on sUSDe unstaking (configurable, currently 7 days) — users cannot exit instantly
- Admin can add new collateral types, potentially introducing riskier assets
- Cross-chain bridging introduces additional attack surface via LayerZero OFT standard

## Admin/Governance Risk

**Governance Structure:**
- ENA token for governance proposals and voting
- Ethena Risk Committee (ERC): elected by governance, oversees risk parameters
- 2-of-3 multisig controls protocol admin functions — falls below the 3-of-5 diverse threshold for `multisig-diverse`
- 48-hour timelock on admin operations

**Custody Model:**
- Assets held by regulated custodians via Off-Exchange Settlement (OES): Copper ClearLoop, Ceffu MirrorX, Anchorage Digital
- Anchorage is a federally chartered digital asset bank (OCC-regulated)
- Segregated, bankruptcy-remote custody arrangements
- Assets are mirrored to exchange trading accounts without leaving custodian control
- Monthly attestations and periodic Proof of Reserves published

**Key Controls:**
- Admin can change the USDe minter address (with 48h timelock)
- Admin can freeze/seize sUSDe via FULL_RESTRICTED_STAKER_ROLE
- GATEKEEPER can pause minting and redeeming operations
- Per-block mint/redeem caps limit exposure from compromised minter
- Cooldown period on sUSDe unstaking is configurable by admin

**Trust Assumptions:**
- Users trust the 2-of-3 multisig and 48-hour timelock to prevent malicious admin actions
- Heavy reliance on centralized custodians (Copper, Ceffu, Anchorage) for collateral safety
- Exchange counterparty risk — derivatives positions on Binance, Bybit, OKX, Deribit, and others
- Funding rate assumptions: if negative funding persists, the reserve fund and USDtb backing absorb losses
- Admin seizure capability on sUSDe requires trusting governance not to abuse FULL_RESTRICTED_STAKER_ROLE

## External Dependencies

**Oracle System:**
- No decentralized oracle for core minting/redeeming — price data sourced from centralized exchanges
- Funding rate calculations from derivatives venues
- Exchange API reliability is critical for hedging operations
- Mark price and settlement determined by exchange infrastructure

**Off-Chain Actors:**
Ethena's entire mechanism fundamentally depends on off-chain infrastructure. The delta-neutral strategy requires continuously maintaining short perpetual futures positions on centralized exchanges (Binance, Bybit, OKX, Deribit), managed by off-chain hedging engines. When users mint USDe, an off-chain system opens corresponding short positions. Collateral is held via OES providers in MPC custody wallets. Funding rate management, margin maintenance, position rebalancing, and redemption processing all require active off-chain coordination. If the Ethena team disappeared, short positions would go unmanaged, margin calls would go unanswered, and the delta-neutral hedge would degrade — likely breaking USDe's peg. This is the most off-chain-dependent protocol assessed.

**Overall Rating Justification:**
Rated `centralized` because every critical function — hedging, custody, price discovery, and yield generation — depends on centralized infrastructure. The custodians are regulated and reputable, and OES architecture prevents assets from sitting on exchange hot wallets, but these are risk mitigations, not decentralization. The protocol cannot function without active team management of derivatives positions on centralized exchanges.

## Economic Risk

**Reserve Fund:**
- Reserve fund of approximately $46.6M as of early 2026
- LlamaRisk and other analysts have raised concerns about potential undercapitalization relative to protocol size
- Reserve absorbs negative funding rate periods — extended negative funding could deplete it
- USDtb (BlackRock BUIDL-backed) introduced as secondary reserve mechanism for negative funding environments

**Liquidity Risk:**
- $11B+ USDe market cap with deep DEX and CEX liquidity
- Redemption depends on unwinding derivatives positions and custodian withdrawal processing
- Market stress may impact exit liquidity and position unwinding speed
- sUSDe cooldown period (7 days) prevents bank-run scenarios but limits user exit speed

**Operational History:**
- Launched February 2024 on Ethereum mainnet
- Rapid growth to 3rd largest stablecoin by market cap
- No smart contract exploits to date
- **February 2025 — Bybit Hack Exposure:** Approximately $30M in USDe collateral was held via Ceffu on Bybit when Bybit suffered a ~$1.4B hack. Ethena's exposure represented unrealized PnL, not principal collateral (which remained in OES custody). No user funds were lost. The incident validated the OES model — custodied assets were safe despite exchange compromise.
- **April 2025 — BaFin Regulatory Action:** Germany's financial regulator BaFin found Ethena GmbH in violation of MiCAR (Markets in Crypto-Assets Regulation), imposing a EUR 600K fine. Ethena was ordered to cease operations in Germany and given a timeline to wind down German activities. This highlighted regulatory risk for the protocol's European operations.
- Protocol survived multiple market stress events including October 2025 flash crash and prolonged negative funding periods

## Stage Assessment

**Stage 0 Criteria Met:**
- **External dependencies: `centralized`** — Core protocol function requires centralized exchanges, custodians, and off-chain hedging infrastructure. This is architectural, not a governance immaturity issue.
- **Admin control: `multisig-weak`** — 2-of-3 multisig falls below the 3-of-5 diverse threshold for Stage 1
- **Fund access: `restricted`** — Admin can freeze/seize sUSDe via FULL_RESTRICTED_STAKER_ROLE, minter role can mint unlimited USDe

**Mitigating Factors (insufficient for Stage 1):**
- 48-hour timelock on admin operations provides a detection window
- Extensive audit coverage from 6 independent firms
- $3M Immunefi bug bounty program
- Regulated, reputable custodians (Anchorage is OCC-chartered)
- OES model validated during Bybit hack — custodied assets remained safe
- No smart contract exploits in 2+ years of operation
- USDtb provides BUIDL-backed reserve for negative funding periods

**Why Not Stage 1:**
- Centralized external dependencies cannot be resolved without a fundamental architectural redesign — the delta-neutral strategy inherently requires centralized exchanges
- 2-of-3 multisig is below the 3-of-5 diverse threshold
- Admin seizure capability on sUSDe (FULL_RESTRICTED_STAKER_ROLE) represents centralized fund access
- Unlimited USDe minting via minter role, despite per-block caps
- Protocol cannot function autonomously without active team management

**Justification:**
Ethena is classified as Stage 0 (Fully Assisted) due to its fundamental architectural reliance on centralized infrastructure. The delta-neutral strategy requires continuous management of short perpetual futures on centralized exchanges, custody via centralized OES providers, and off-chain hedging coordination. While the protocol has demonstrated strong operational practices — surviving the Bybit hack without losses, accumulating extensive audits, and maintaining a $3M bug bounty — users must trust the team, custodians, and exchange counterparties. The 2-of-3 multisig with 48h timelock provides some protection, but admin capabilities including sUSDe seizure and unlimited USDe minting represent meaningful centralized control. This Stage 0 classification reflects the protocol's design rather than governance immaturity — advancing beyond Stage 0 would require a fundamental architectural shift away from centralized exchange dependencies.

## Links

- [Official Website](https://ethena.fi)
- [Documentation](https://docs.ethena.fi)
- [GitHub](https://github.com/ethena-labs)
- [Governance Forum](https://gov.ethenafoundation.com)
- [Reserve Transparency](https://ethena.fi/transparency)
- [Risk Framework](https://docs.ethena.fi/solution-overview/risks)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/ethena/)
