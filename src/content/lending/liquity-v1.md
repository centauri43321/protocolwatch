---
name: "Liquity V1"
baseName: "Liquity"
category: "lending"
stage: 2
website: "https://www.liquity.org/liquity-v1"
chains: ["ethereum"]
tvl: "$175M"
lastUpdated: "2026-05-10"
risks:
  upgradeability: "immutable"
  adminControl: "none"
  fundAccess: "impossible"
  audits: "multiple"
  externalDependencies: "decentralized"
  trackRecord: "5+ years"
---

# Liquity V1 Risk Assessment

## Overview

Liquity V1 is an immutable, governance-free CDP protocol on Ethereum mainnet that issues the LUSD stablecoin against ETH-only collateral at a 110% minimum collateral ratio.

Launched April 5, 2021, Liquity V1 was designed as a maximally trustless alternative to MakerDAO: no admin keys, no governance, hardcoded parameters, and a permissionless redemption mechanism that arbitrages LUSD back to its $1 peg. Borrowing is interest-free; the protocol charges a one-time issuance fee (algorithmically managed via a decaying `baseRate`). LUSD remains live and borrowing is still open following the Liquity V2 launch — the V1 contracts cannot be turned off because they have no admin.

## Smart Contract Risk

**Contract Architecture:**
- All core contracts are immutable — no proxies, no upgrade paths, no migration hooks
- Core contracts: TroveManager (`0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2`), BorrowerOperations (`0x24179CD81c9e782A4096035f7eC97fB8B783e007`), StabilityPool (`0x66017D22b0f8556afDd19FC67041899Eb65a21bb`), ActivePool, DefaultPool, CollSurplusPool, CommunityIssuance, LUSD token, LQTY token
- Contracts wired together once via `setAddresses` at deploy; no owner roles persist
- Recovery Mode (auto-triggered when system collateral ratio falls below 150%) is enforced in code, not by an admin

**Code Quality:**
- Audited by Trail of Bits (March 2021, full protocol + separate proxy review) and Coinspect (March 2021)
- Coinspect identified a high-severity issue in `closeTrove` allowing forced Recovery Mode liquidations; fixed pre-launch
- Pre-launch agent-based simulation campaign by the Liquity team
- No formal verification on V1 (Certora work was performed for V2 only)
- Open source (GitHub: `liquity/dev`)
- Bug bounty program details unverified at time of writing — V1 program was retired in mid-2025 in favor of the V2 Cantina bounty

**Attack Surface:**
- Standard CDP attack vectors: oracle manipulation, liquidation gaming, redemption front-running
- 110% MCR makes the protocol capital-efficient but more sensitive to ETH price swings than higher-MCR systems
- Stability Pool depositors absorb liquidated debt and receive collateral at a discount — a profitable but volatile position
- Tellor fallback path had a vulnerability disclosed September 2022 (no dispute window on submitted prices); mainnet never failed over to Tellor so no user funds were affected, but the Liquity instance auto-deployed on the ETHW fork was exploited via Tellor for a large LUSD mint on that fork only. Tellor360 fixed the underlying issue with a 15-minute price lag

## Admin/Governance Risk

**Governance Structure:**
- No governance, no admin, no multisig, no EOA
- LQTY is explicitly a non-governance utility token; it captures protocol fees via staking but has no voting rights over parameters or contracts
- All parameters (110% MCR, 150% TCR Recovery threshold, fee decay constants, gas compensation) are hardcoded constants

**Key Controls:**
- No pause function, no upgrade function, no parameter setters, no emergency mechanism
- Frontend Operators register permissionlessly via `registerFrontEnd` and set their own kickback rate (immutable per registration); they cannot alter protocol logic

**Trust Assumptions:**
- Users do not need to trust any party with their funds; the only trust assumptions are in the code itself and the two oracle providers
- There is no governance compromise scenario because there is no governance

## External Dependencies

**Oracle System:**
- Primary: Chainlink ETH/USD push feed
- Fallback: Tellor (decentralized optimistic oracle)
- Failover logic in `PriceFeed.sol`: switches to Tellor on Chainlink staleness (>4h), broken response, or >50% deviation between updates that Tellor disagrees with; falls back further to "last good price" if Tellor is also stale; switches back to Chainlink when it recovers
- Both oracle addresses are hardcoded — they cannot be changed because there is no admin

**Off-Chain Actors:**
- None required — liquidations and redemptions are fully permissionless and economically incentivized (liquidators receive a gas refund + 0.5% of liquidated collateral; redeemers pay a redemption fee that scales with redemption volume)
- No keepers, sequencers, relayers, or bonded operators
- No bridge or wrapped-asset exposure — native ETH only on Ethereum mainnet

**Overall Rating Justification:**
Liquity V1's external dependency surface is decentralized. Both oracle providers (Chainlink and Tellor) are decentralized networks; the failover between them is hardcoded with no admin override. Liquidation and redemption mechanics are permissionless, and the protocol has no off-chain actor requirements. The Tellor 2022 incident is a meaningful caveat — the fallback path was vulnerable for ~17 months — but mainnet never activated the fallback and no user funds were lost.

## Economic Risk

**Liquidity Risk:**
- ~$175M TVL (May 2026, DeFiLlama); LUSD circulating supply has shrunk significantly post-V2 launch
- Stability Pool is the primary liquidation buffer; secondary mechanism is debt redistribution to other Troves
- Redemption arbitrage maintains the LUSD peg by allowing any holder to redeem 1 LUSD for $1 worth of ETH from the riskiest Troves
- Permissionless deposits/withdrawals with no exit queue

**Operational History:**
- Mainnet launch: April 5, 2021 (5+ years)
- No mainnet exploits of core contracts
- September 2022: Tellor fallback vulnerability disclosed and resolved upstream via Tellor360; no mainnet user impact
- August 2022: ETHW fork instance exploited via Tellor (mainnet untouched)
- Survived May 2021 crash, May 2022 (UST/Luna), FTX collapse, March 2023 banking crisis, and multiple ETH drawdowns of 30%+ without protocol-level failure
- LUSD held its peg within typical bounds throughout these events

## Stage Assessment

**Stage 2 Criteria Met:**
- ✓ Immutable core contracts — no proxies, no upgrade path, no migration hooks
- ✓ No admin control — no owner, no governance, no multisig, no EOA, no pauser
- ✓ No fund access — no privileged actor exists; all interactions are permissionless
- ✓ Decentralized external dependencies — Chainlink primary + Tellor fallback, both decentralized; no off-chain actors required
- ✓ Multiple independent audits — Trail of Bits (full protocol) + Coinspect, both reputable firms with public reports
- ✓ 5+ years of production operation with no mainnet exploits

⚠ Audit scope falls short of "extensive" — no formal verification was performed on V1 specifically (V2 received Certora coverage). The protocol still meets the Stage 2 audit threshold via two independent reputable-firm reviews.

**Justification:**
Liquity V1 is a textbook Stage 2 (Trustless) protocol. The contracts are immutable with no admin role of any kind, parameters are hardcoded, and all user-facing actions (borrow, repay, redeem, liquidate) are permissionless. External dependencies are limited to two decentralized oracles with hardcoded addresses, and the protocol has operated for over five years on mainnet without a core-contract exploit. The 2022 Tellor fallback vulnerability is the most material historical risk event, but the mainnet failover never triggered and the issue was patched at the oracle layer. The lack of formal verification is the primary qualitative gap relative to the most security-hardened Stage 2 protocols.

## Links

- [Official Website](https://www.liquity.org/liquity-v1)
- [V1 Documentation](https://docs.liquity.org/liquity-v1)
- [GitHub](https://github.com/liquity/dev)
- [Trail of Bits Audit](https://github.com/trailofbits/publications/blob/master/reviews/Liquity.pdf)
- [Coinspect Audit](https://www.coinspect.com/blog/liquity-audit/)
- [Tellor Incident Disclosure](https://www.liquity.org/blog/tellor-issue-and-fix)
- [TroveManager Contract](https://etherscan.io/address/0xa39739ef8b0231dbfa0dcda07d7e29faabcf4bb2)
- [BorrowerOperations Contract](https://etherscan.io/address/0x24179CD81c9e782A4096035f7eC97fB8B783e007)
- [StabilityPool Contract](https://etherscan.io/address/0x66017d22b0f8556afdd19fc67041899eb65a21bb)
- [DeFiLlama](https://defillama.com/protocol/liquity-v1)
