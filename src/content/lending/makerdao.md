---
name: "MakerDAO"
category: "lending"
stage: 1
website: "https://makerdao.com"
chains: ["ethereum"]
tvl: "$7.2B"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "8+ years"
---

# MakerDAO (Sky) Risk Assessment

## Overview

MakerDAO is one of the oldest and largest DeFi protocols, originally launched as Single-Collateral DAI (SCD) in December 2017 and upgraded to Multi-Collateral DAI (MCD) in November 2019. The protocol enables users to deposit collateral into Vaults and mint DAI, a decentralized stablecoin soft-pegged to the US dollar. In 2024, MakerDAO rebranded to Sky, introducing the SKY governance token and USDS stablecoin alongside the existing MKR and DAI.

With approximately $7.2B in TVL, MakerDAO/Sky remains one of the largest DeFi protocols by total value locked. The protocol's Vault-based CDP (Collateralized Debt Position) model has been the foundation for decentralized stablecoin issuance since its inception.

## Smart Contract Risk

**Contract Architecture:**
- Core Module: Vat (central accounting engine — immutable logic, but uses `rely`/`deny` authorization system for module access), Cat/Dog (liquidation), Spot (oracle interface)
- Rate Module: Jug (stability fees), Pot (DAI Savings Rate)
- Collateral adapters (Join contracts) for each collateral type
- Modular spell system — governance changes executed via "spells" (one-time-use contracts)
- Peg Stability Module (PSM) for USDC/DAI peg arbitrage
- RWA (Real World Asset) vaults for off-chain collateral
- DAI is an immutable contract; USDS is proxy-upgradeable (ERC1967Proxy) with freeze function capability

**Code Quality:**
- Audited by Trail of Bits, Quantstamp, ChainSecurity, and PeckShield
- Formal verification of the Vat by Runtime Verification (K framework)
- Open source with comprehensive documentation
- Active bug bounty (HackerOne historically; 3 high-severity and 1 critical-severity bugs found, $90K+ in bounty payments)
- Continuous security reviews for each new spell and collateral onboarding

**Attack Surface:**
- Spell system means each governance action is custom code (each spell is audited)
- Vat is the single point of accounting — a Vat bug would be catastrophic
- Collateral adapter bugs could affect specific vault types
- RWA exposure introduces off-chain counterparty risk
- PSM creates USDC dependency for peg stability
- Liquidation 2.0 (Dog module) is more complex than original Cat

## Admin/Governance Risk

**Governance Structure:**
- Governed by SKY (formerly MKR) token holders via continuous approval voting (MKR retired May 2025, 1 MKR = 24,000 SKY)
- Executive votes install "spells" — one-time contracts with governance changes
- Governance Security Module (GSM): enforces delay between spell approval and execution (currently 48 hours; has fluctuated historically — was 16h in July 2024, 30h in April 2024, increased to 48h by May 2025)
- Hat system — the spell with the most voting weight becomes the "hat" and can be executed after GSM delay
- Emergency Shutdown Module (ESM) can bypass GSM — MKR/SKY holders deposit tokens (burned permanently) to trigger instant global settlement

**Key Controls:**
- GSM enforces 48-hour delay on all governance actions
- Governance can authorize new modules against the Vat (any authorized module has full system access)
- Governance can add new collateral types and their adapters
- Governance can modify stability fees, liquidation ratios, debt ceilings
- Governance can change oracle sources per collateral type
- USDS has a freeze function controlled by governance
- Emergency Shutdown settles the entire system — all vaults closed, DAI holders claim collateral

**Trust Assumptions:**
- Any module authorized against the Vat has root access — Maker docs explicitly state: authorized modules can use `slip` (steal collateral) or `suck` (mint unbacked DAI)
- The GSM delay (currently 48h) provides exit time, but users must be actively monitoring; GSM delay has historically fluctuated
- MKR governance concentration risk — large MKR holders have outsized influence
- Emergency Shutdown Module provides a last-resort protection mechanism
- RWA collateral depends on off-chain legal structures and custodians
- USDS freeze function is a centralization vector added post-rebrand

## External Dependencies

**Oracle System:**
- Custom oracle module: Medianizer takes the median of ~20 whitelisted price feeds
- Oracle Security Module (OSM) adds a 1-hour delay on price updates for major collateral types
- Whitelisted feeds are governance-approved independent operators
- Feeds are off-chain actors submitting signed price data
- No Chainlink integration for core collateral — MakerDAO operates its own oracle network (Chronicle)
- Chronicle Protocol spun out as an independent oracle provider

**Off-Chain Actors:**
- Oracle feed operators (whitelisted, ~20 independent feeds) — not bonded, reputationally constrained
- Keepers for liquidation auctions — permissionless participation
- RWA vault trustees and custodians — centralized, legally bound
- D3M (Direct Deposit Module) integrations with other protocols (Spark, Aave)
- Centralized stablecoins (USDC via PSM) are a critical peg mechanism

**Overall Rating Justification:**
MakerDAO's external dependency profile is mixed. The custom oracle network (Chronicle/Medianizer) uses ~20 independent feeds with OSM delay, which is semi-decentralized but relies on governance-whitelisted operators without economic bonding. RWA collateral introduces centralized off-chain dependencies (trustees, custodians, legal structures). The PSM's USDC exposure adds centralized stablecoin risk. While the oracle system is more decentralized than a single centralized API, the lack of bonding on feed operators and the significant RWA/USDC exposure push this to "mixed."

## Economic Risk

**Liquidity Risk:**
- $7.2B TVL across crypto and RWA vaults
- DAI is the largest decentralized stablecoin by market cap
- PSM provides deep USDC-DAI liquidity for peg stability
- RWA vaults may have limited exit liquidity under stress
- Crypto vault collateral (ETH, WBTC, stETH) has deep DeFi liquidity

**Operational History:**
- SCD launched December 2017, MCD launched November 2019
- March 2020 "Black Thursday": 43% ETH crash overwhelmed the network; 1,462 of 3,994 liquidation auctions (36.6%) won with zero-value bids; $8.32M in collateral lost. MKR minted and auctioned to recapitalize. Maker settled related lawsuit for $1.16M
- March 2023: Emergency spell passed to fix governance vulnerability related to Emergency Shutdown Module — fixed before exploitation
- Survived multiple market stress events (May 2021, 2022 bear market, FTX collapse)
- No smart contract exploit of core DSS system in protocol history
- Rebrand to Sky in August 2024; USDS and SKY tokens launched September 2024; MKR retired May 2025 (Endgame transition)
- 8+ years of continuous operation (from SCD launch)

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Timelock >=48 hours on critical changes (GSM currently enforces 48h delay; has fluctuated historically but is at 48h as of May 2025)
- ✓ Admin control via decentralized governance (MKR/SKY token holders)
- ✓ Admin powers clearly scoped — no direct fund access function (though governance can authorize modules with Vat access)
- ✓ Multiple independent audits from reputable firms (Trail of Bits, Quantstamp, ChainSecurity, PeckShield) + formal verification (Runtime Verification)
- ✓ 8+ years of production operation
- ✓ External dependencies have decentralized elements with fallbacks

**Why Not Stage 2:**
- Contracts are upgradeable via the spell system (not immutable)
- 48-hour timelock, not 7+ days
- Governance can authorize modules with full Vat access (effectively: governance can drain all collateral if the GSM delay is insufficient for users to exit)
- Oracle network is governance-managed with no economic bonding
- USDS freeze function is a centralization vector
- Significant RWA exposure introduces centralized counterparty risk

**Justification:**
MakerDAO achieves Stage 1 (Limited Trust) based on its enforced 48-hour GSM delay, decentralized MKR/SKY governance, extensive audit portfolio with formal verification, and 8+ year track record — the longest of any major DeFi lending protocol. The protocol has survived multiple market crises, including Black Thursday, without smart contract failure. However, governance's ability to authorize modules with full Vat access, the mixed oracle dependency profile (governance-whitelisted feeds without bonding), and significant RWA/USDC exposure prevent a higher rating. The USDS freeze function added in the Sky rebrand introduces an additional centralization concern.

## Links

- [Official Website](https://makerdao.com)
- [Sky Protocol](https://sky.money)
- [Technical Documentation](https://docs.makerdao.com)
- [GitHub](https://github.com/makerdao)
- [Governance Portal](https://vote.makerdao.com)
- [Security Audits](https://security.makerdao.com/audit-reports)
- [Bug Bounty](https://immunefi.com/bounty/makerdao/)
