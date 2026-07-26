---
name: "Compound V1"
baseName: "Compound"
category: "lending"
stage: 0
website: "https://compound.finance"
chains: ["ethereum"]
tvl: "$0"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "instant"
  adminControl: "eoa"
  fundAccess: "possible"
  audits: "single"
  externalDependencies: "centralized"
  trackRecord: "7+ years (deprecated)"
---

# Compound V1 (MoneyMarket) Risk Assessment

## Overview

Compound V1, known as the MoneyMarket contract, launched on Ethereum mainnet on September 27, 2018. It was one of the earliest algorithmic money market protocols, allowing users to supply and borrow assets with interest rates determined programmatically based on supply and demand.

V1 was deprecated in May 2019 when Compound V2 launched. The protocol operated for approximately 9 months with no critical exploits. TVL is effectively $0, with all users having migrated to V2. The contracts remain on-chain but serve no active economic function.

## Smart Contract Risk

**Contract Architecture:**
- Monolithic MoneyMarket.sol contract (~1,500 lines of Solidity)
- No proxy pattern — directly deployed, but admin can change critical parameters
- Interest rate models embedded within the contract
- Simple architecture compared to later versions
- Contract address: 0x3FDA67f7583380E67ef93072294a7fAc882FD7E7

**Code Quality:**
- Pre-launch audit by Trail of Bits (limited scope, 2018)
- No formal verification
- Open source on GitHub (compound-finance/compound-money-market)
- No active bug bounty
- Codebase served as foundation for the more robust V2

**Attack Surface:**
- Admin key compromise would give full control
- Centralized oracle could be manipulated
- No reentrancy guards (pre-standard in 2018)
- Interest rate model manipulation via admin
- No flash loan functionality

## Admin/Governance Risk

**Governance Structure:**
- No decentralized governance — predates the COMP token
- Controlled by Compound Labs admin EOA (or small team multisig)
- No community voting mechanism
- No proposal or quorum process
- Fully centralized decision-making

**Key Controls:**
- Admin can modify interest rate models instantly
- Admin can change the oracle address
- Admin can adjust collateral factors for all assets
- Admin can add or remove supported markets
- Admin can pause and unpause markets
- No timelock protection on any admin action
- Admin can set parameters that effectively confiscate funds (e.g., extreme collateral factors triggering mass liquidations)

**Trust Assumptions:**
- Complete trust required in Compound Labs team
- Admin key compromise would be catastrophic
- No recourse mechanism for users against admin actions
- Protocol security entirely dependent on operational security of admin keys

## External Dependencies

**Oracle System:**
- Centralized price oracle operated by Compound Labs
- No Chainlink integration (predates widespread Chainlink adoption)
- Admin could update oracle address at any time
- Single point of failure for all price-dependent operations
- Oracle manipulation would break liquidation mechanics

**Off-Chain Actors:**
- Liquidations required external liquidator bots (permissionless to call)
- Oracle price updates were off-chain and centralized
- No keeper infrastructure beyond the Compound Labs-operated oracle

**Overall Rating Justification:**
Compound V1 relied on a fully centralized oracle operated by Compound Labs. There was no Chainlink, no decentralized oracle network, and no fallback mechanism. This single point of failure, combined with admin's ability to change the oracle address, makes the external dependency profile centralized.

## Economic Risk

**Liquidity Risk:**
- Protocol fully deprecated since May 2019
- TVL effectively $0
- All users migrated to V2
- No active markets

**Operational History:**
- Launched September 27, 2018
- Operated for ~9 months before deprecation
- Supported ETH, USDC, DAI, REP, BAT, ZRX, WBTC
- No critical exploits during active operation
- Smooth migration to V2 — borrowing disabled over 4-8 weeks, supply/withdraw remained functional
- Proved the viability of algorithmic money markets

## Stage Assessment

**Stage 0 Criteria Met:**
- Admin controlled by EOA (not governance or multisig)
- Instant parameter and oracle changes with no timelock
- Admin can access user funds through parameter manipulation
- Only a single limited audit
- Centralized oracle with no fallback
- No decentralized governance

**Why Not Stage 1:**
- No decentralized governance mechanism (no COMP token)
- No timelock on any admin action
- Centralized oracle
- Single audit
- Admin has effective fund access through parameter manipulation

**Justification:**
Compound V1 (MoneyMarket) is Stage 0 (Fully Assisted) due to complete centralization of control. An admin EOA controlled all critical functions — oracle updates, parameter changes, market management — with no timelock, no governance, and no multisig protection. The centralized oracle was a single point of failure. This was appropriate for 2018, when DeFi governance was nascent, and V1 served as a proof-of-concept that validated the algorithmic money market model. The graceful migration to V2 demonstrated good faith from the team.

## Links

- [Official Website](https://compound.finance)
- [V1 GitHub (MoneyMarket)](https://github.com/compound-finance/compound-money-market)
- [V1 Contract on Etherscan](https://etherscan.io/address/0x3FDA67f7583380E67ef93072294a7fAc882FD7E7)
- [V2 Migration Announcement](https://medium.com/compound-finance/compound-v2-is-live-157db0b7cfc8)
