---
name: "Sky"
category: "lending"
stage: 0
website: "https://sky.money"
chains: ["ethereum"]
tvl: "$7.5B"
lastUpdated: "2026-03-17"
risks:
  upgradeability: "instant"
  adminControl: "governance"
  fundAccess: "possible"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "8+ years, March 2020 Black Thursday event ($8.32M collateral deficit)"
---

# Sky Risk Assessment

## Overview

Sky (formerly MakerDAO) is one of the oldest DeFi protocols, originally launched as Single-Collateral DAI in December 2017. It enables users to deposit collateral into Vaults and mint stablecoins — originally DAI, now also USDS — soft-pegged to the US dollar. In September 2024, MakerDAO rebranded to Sky as part of the "Endgame" restructuring, introducing the SKY governance token and USDS stablecoin alongside the existing MKR and DAI.

With approximately $7.5B in TVL, Sky remains one of the largest DeFi protocols. However, the Endgame transition has introduced meaningful centralization risks compared to the original MakerDAO design: USDS includes a governance-executable freeze function, the Governance Security Module (GSM) delay has fluctuated significantly — reaching as low as 18 hours in February 2025 and appearing to settle around 24 hours by late 2025 — and governance remains practically concentrated around the founder despite nominal decentralization. These changes represent a material regression in trust assumptions relative to the protocol's prior Stage 1 profile.

## Smart Contract Risk

**Contract Architecture:**
- **Vat**: The central accounting engine. Immutable — no proxy, no upgrade mechanism. All collateral accounting runs through it. The Vat's `rely`/`deny` authorization system governs which modules have system-level access; authorized modules can call `slip` (steal collateral) or `suck` (mint unbacked DAI)
- **New Sky components (USDS, sUSDS, SKY token)**: Deployed using ERC1967 UUPS proxy patterns — upgradeable via DAO-controlled governance votes
- **USDS freeze function**: Present in the USDS contract code. Allows governance to halt USDS transfers from specific wallets. Not currently activated, but executable through a governance vote + GSM delay
- **Spell system**: Governance changes are deployed as one-time-use "spell" contracts that execute after the GSM delay elapses. Each spell is audited before execution
- **Protego**: Added May 2025. Allows governance to cancel queued spells before the GSM delay expires — a new safety mechanism that also introduces an additional governance control layer
- **PSM (Peg Stability Module)**: Holds USDC reserves for DAI/USDS peg maintenance; creates direct USDC exposure
- **RWA vaults**: Off-chain collateral managed through external trustees and legal structures
- **Spark**: SparkDAO (a Sky SubDAO) operates a lending market and manages capital deployment via the Spark Liquidity Layer (~$3.5B in assets)

**Code Quality:**
- Original DSS contracts audited by Trail of Bits, Quantstamp, ChainSecurity, and PeckShield
- Formal verification of the Vat by Runtime Verification (K framework)
- Sky Endgame components (USDS, sUSDS, SKY, LockStake, Vote Delegate, Dss Flappers, Protego, Spark Vaults) audited by ChainSecurity and Cantina (2024–2025)
- April 2025: OpenZeppelin discovered a critical vulnerability in the legacy DSChief governance contract (could lock $100M+ in MKR tokens and remove votes) — disclosed April 26, publicly announced May 6, mitigated before exploitation
- Active bug bounty on Immunefi: $10M maximum payout covering sUSDS contract
- Full audit list: [developers.sky.money/security/security-measures/overview](https://developers.sky.money/security/security-measures/overview/)

**Attack Surface:**
- Vat authorization is the primary attack surface — any governance-authorized module can drain all collateral
- USDS UUPS proxy means the USDS contract logic can be replaced entirely by governance
- Spell system means each governance action is custom code — spell audits are the primary defense
- RWA exposure introduces off-chain legal and custodian counterparty risk (~23–35% of collateral as of 2025)
- PSM creates structural USDC dependency for peg stability
- Spark Liquidity Layer deploys capital across Morpho, Aave, Ethena, and tokenized RWAs — each with its own risk surface

## Admin/Governance Risk

**Governance Structure:**
- Governed by SKY token holders. MKR was the governance token until May 2025 when the Endgame transition formally retired it (1 MKR = 24,000 SKY). As of late 2025, ~81% of MKR had converted to SKY; a Delayed Upgrade Penalty (starting 1%, increasing 1% every three months from September 18, 2025) incentivizes remaining holdouts
- Governance portal migrated from [vote.makerdao.com](https://vote.makerdao.com) to [vote.sky.money](https://vote.sky.money)
- **Governance Security Module (GSM)**: Enforces a delay between spell approval and execution. The delay is a governance-adjustable parameter and has been highly volatile: 30h → 18h (February 2025 emergency proposal, citing a potential governance attack) → 48h (April 2025 restoration) → approximately 24h (by late 2025 per governance documentation). As of early 2026, the delay is most likely around 24 hours
- **Hat system**: The spell with the most accumulated voting weight becomes the "hat" and can be executed after the GSM delay
- **Emergency Shutdown Module (ESM)**: SKY holders can deposit tokens (burned permanently) to trigger instant global settlement — all vaults close, DAI/USDS holders claim collateral pro-rata
- **Protego**: Governance can cancel queued spells before the GSM expires

**Key Controls:**
- Governance can authorize new modules against the Vat — any authorized module has root access to all collateral
- Governance can replace USDS contract logic (UUPS upgrade)
- Governance can activate the USDS freeze function (targeted wallet blacklisting)
- Governance can modify stability fees, liquidation ratios, debt ceilings per collateral type
- Governance can change oracle sources per collateral type via whitelist management
- Governance can add, modify, or remove collateral types and their adapters
- Emergency Shutdown instantly settles the entire system

**Trust Assumptions:**
- The GSM delay (currently ~24h) is the primary exit protection. With a 24-hour window, most users cannot realistically monitor and exit before a malicious governance action executes — particularly for users in complex positions (RWA vaults, Spark positions)
- The GSM delay is itself a governance-adjustable parameter, demonstrating that the delay cannot be relied upon as a stable constraint. It was reduced from 30h to 18h without broad notice in February 2025
- S&P's August 2025 B- credit rating explicitly cited effective governance concentration around founder Rune Christensen (~9% token holding, but outsized influence due to chronic low voter turnout) as a primary risk
- In February 2025, community delegates who voted against the emergency GSM reduction were muted or banned from official governance channels during the vote — a serious governance transparency incident
- USDS freeze function represents a novel centralization vector absent from the original MakerDAO design; DAI lacks this function, which is why some users are deliberately avoiding the USDS upgrade
- RWA collateral (~23–35% of total) depends on off-chain legal structures, trustees, and custodians outside blockchain enforcement

## External Dependencies

**Oracle System:**
- Chronicle Protocol (spun out from MakerDAO) serves as the primary oracle network — no Chainlink integration for core collateral
- As of Q1 2025, Chronicle uses 25 independent validators including Sky, Infura, Gitcoin, dYdX, Etherscan, Gnosis, Steakhouse Financial, Bitcoin Suisse, and Block Analitica
- Oracle Security Module (OSM): 1-hour delay on price updates for major collateral types, providing liquidation attack mitigation
- Validators are governance-whitelisted, submit signed off-chain data, and carry no economic bond — constrained by reputation only
- Chronicle raised a $12M seed round (March 2025) and now secures $12.6B+ TVS across multiple chains

**Off-Chain Actors:**
- Oracle feed validators (~25 operators): whitelisted by governance, not bonded, reputationally constrained
- Liquidation auction keepers: permissionless participation
- RWA vault trustees and custodians (BlackRock BUIDL, Superstate, Centrifuge, others): centralized, legally bound, not blockchain-enforceable. The Spark Liquidity Layer manages ~$500M in BlackRock BUIDL alone
- USDC reserves (PSM): Circle is a centralized counterparty for peg stability
- Spark SubDAO manages capital deployment into external protocols (Morpho, Aave, Ethena) — each dependency carries its own trust surface

**Overall Rating Justification:**
Sky's external dependency profile is mixed. The Chronicle oracle network is meaningfully decentralized (25 independent validators, OSM delay), but oracle operators carry no economic bond and are governance-whitelisted — a step below fully constrained. More significantly, RWA exposure (~23–35% of total collateral) introduces centralized off-chain counterparties (custodians, trustees, legal structures) that cannot be enforced on-chain. The PSM's USDC reserves add further centralized stablecoin exposure. The decentralized oracle design is insufficient to offset the structural centralization from RWA and stablecoin dependencies, placing this firmly in "mixed."

## Economic Risk

**Liquidity Risk:**
- $7.5B TVL, primarily in the sUSDS savings pool (~$6.5B in deposits) driven by a Sky Savings Rate of ~3.75%
- DAI remains in circulation alongside USDS; combined stablecoin liabilities were ~$7.8B in 2025
- Crypto vault collateral (ETH, WBTC, stETH) has deep DeFi liquidity for orderly liquidation
- RWA vaults (~$500M+ in tokenized T-bills and repo) have limited on-chain exit liquidity under stress — redemption depends on off-chain legal processes
- PSM provides USDC-DAI/USDS peg stability but creates dependency on Circle

**Operational History:**
- SCD launched December 2017; MCD launched November 2019 — 8+ years of continuous operation
- March 2020 "Black Thursday": 43% ETH crash overwhelmed the Ethereum network; 36.6% of liquidation auctions won with zero-value bids; $8.32M in collateral deficit. MKR minted and auctioned to recapitalize. Maker settled related lawsuit for $1.16M
- March 2023: Emergency spell passed to fix a governance vulnerability related to the Emergency Shutdown Module — fixed before exploitation
- June 2024: A MakerDAO governance delegate lost $11M in aEthMKR and Pendle USDe tokens to a phishing scam — user-level attack, not a protocol exploit
- September 2024: Rebranded to Sky; USDS and SKY tokens launched
- February 2025: Emergency governance proposal shortened GSM delay from 30h to 18h with minimal notice; delegates who dissented were muted or banned from official channels during the vote
- April 2025: DSChief critical vulnerability discovered by OpenZeppelin — could have locked $100M+ in MKR tokens; mitigated before any exploitation
- May 2025: Endgame transition completed, MKR formally retired; Delayed Upgrade Penalty introduced for unconverted MKR
- August 2025: S&P assigned first-ever DeFi credit rating — B- — citing centralization and capital risks
- No direct exploit of Sky/MakerDAO core smart contracts (DSS or new Endgame contracts) to date

## Stage Assessment

**Stage 0 — Fully Assisted**

- ✓ Extensive audits — Trail of Bits, Quantstamp, ChainSecurity, PeckShield on original DSS; ChainSecurity and Cantina on all Endgame components (2024–2025); Runtime Verification formal verification of Vat; $10M Immunefi bounty
- ✓ 8+ years of production operation with significant TVL — qualifies for track record criterion
- ✓ Decentralized governance — SKY token holder voting (nominal), not a single EOA or weak multisig

**Why Not Stage 1:**
- ⚠ **GSM delay below 48h threshold**: The Governance Security Module delay appears to be approximately 24 hours as of early 2026, below the 48-hour minimum required for Stage 1. Critically, the delay is a governance-adjustable parameter — it was reduced from 30h to 18h via an emergency proposal in February 2025 with minimal notice, demonstrating it cannot be treated as a stable constraint
- ⚠ **USDS freeze function**: USDS includes a governance-executable function to freeze specific wallet transfers. This is not present in DAI and represents a direct fund control mechanism absent from Stage 1-qualifying protocols
- ⚠ **Governance concentration**: S&P's August 2025 analysis found effective governance control concentrated around founder Rune Christensen due to structurally low voter participation, despite nominal token-holder governance
- ⚠ **Vat authorization scope**: Governance can authorize modules with full Vat access (`slip`/`suck`), allowing collateral drainage. With a ~24h GSM delay, the effective exit window is insufficient for most users

**Justification:**
Sky's Governance Security Module delay has been demonstrated to be below the 48-hour threshold needed for Stage 1 — reduced to 18 hours in February 2025 and appearing to settle around 24 hours by late 2025. This instability means the timelock cannot be treated as a reliable protection mechanism, and the current delay does not provide adequate user exit time before governance can authorize malicious changes. The USDS freeze function adds a direct fund control vector absent from the original MakerDAO design. Governance, while nominally decentralized, is effectively concentrated per S&P's analysis. Despite Sky's exceptional audit portfolio, extensive track record, and the immutability of the core Vat contract, the GSM delay instability and governance concentration push the protocol to Stage 0. The original DSS (DAI vault system) retains many Stage 1 properties, but the post-rebrand architecture as a whole does not meet the minimum threshold.

## Links

- [Official Website](https://sky.money)
- [Developer Documentation](https://developers.sky.money)
- [Legacy MakerDAO Docs](https://docs.makerdao.com)
- [GitHub](https://github.com/makerdao)
- [Governance Portal](https://vote.sky.money)
- [Security Audits](https://developers.sky.money/security/security-measures/overview/)
- [Bug Bounty](https://immunefi.com/bounty/makerdao/)
- [Chronicle Protocol (Oracles)](https://chroniclelabs.org/)
- [DeFiLlama](https://defillama.com/protocol/sky)
