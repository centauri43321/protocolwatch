---
name: "Coinbase Wrapped Staked ETH"
category: "liquid-staking"
stage: 0
website: "https://www.coinbase.com/cbeth"
chains: ["ethereum", "base", "optimism", "polygon"]
tvl: "$308M"
lastUpdated: "2026-05-18"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "single"
  externalDependencies: "centralized"
  trackRecord: "3+ years, no contract exploits"
---

# Coinbase Wrapped Staked ETH Risk Assessment

## Overview

Coinbase Wrapped Staked ETH (cbETH) is a custodial liquid staking token issued by Coinbase, representing ETH staked through Coinbase's centralized staking service.

cbETH is an ERC-20 wrapper minted and burned by Coinbase as customers stake or unstake ETH through the exchange. The underlying validators are operated by Coinbase, and the underlying ETH is held in Coinbase custody — the token contract itself does not custody ETH or interact with the beacon chain. The exchange rate between cbETH and ETH is posted on-chain by Coinbase once every 24 hours and grows over time as staking rewards accrue. Redemption from cbETH back to ETH is only available through the Coinbase exchange and requires KYC. At ~$308M TVL, cbETH sits well behind Lido and Binance staked ETH in the liquid staking category.

## Smart Contract Risk

**Contract Architecture:**
- Canonical Ethereum contract: `0xBe9895146f7AF43049ca1c1AE358B0541Ea49704` (proxy) with implementation `0x31724cA0C982A31fbb5C57f4217AB585271fc9a5` (`StakedTokenV1`).
- Uses Circle's `FiatTokenProxy` — the same upgradeable proxy pattern that backs USDC. Implementations can be swapped instantly via `upgradeTo()` with no on-chain timelock.
- Inherits from the Centre `FiatToken` base, including `Pausable` and `Blacklistable` modules.
- Auxiliary contracts: `MintForwarder`, `RateLimit`, `ExchangeRateUpdater`, each owned by Coinbase-controlled keys.
- Deployed on Ethereum, Base, Optimism, and Polygon (the latter via Polygon's PoS bridge as fxcbETH).

**Code Quality:**
- Single audit by OpenZeppelin in August 2022 covering `MintForwarder`, `MintUtil`, `RateLimit`, `ExchangeRateUpdater`, `ExchangeRateUtil`, and `StakedTokenV1`. Findings: 0 critical, 0 high, 1 medium, 5 low, 2 notes. The medium concerned rate-limit caller allotment depletion.
- The underlying Centre `FiatToken` base inherits additional review history through USDC, but no audit has been published for the post-2022 cbETH-specific code path.
- Source is verified on Etherscan but is not released under an open-source license alongside a public repository.
- No public bug bounty program specific to cbETH has been confirmed; Coinbase runs a general HackerOne program.

**Attack Surface:**
- Token surface is small (mint, burn, transfer with blacklist/pause hooks, exchange-rate read). Most material risk sits in the proxy admin and the off-chain custody of staked ETH.
- Instant proxy upgradeability means a compromised admin key could introduce a drain or arbitrary-mint function in a single transaction.
- No known on-chain exploits since launch.

## Admin/Governance Risk

**Governance Structure:**
- No token-holder governance. All privileged roles are held by Coinbase corporate keys.
- Distinct owner roles exist for the proxy admin, `RateLimit`, `MintForwarder`, `ExchangeRateUpdater`, and `StakedTokenV1`, plus a `Caller` role authorised to mint cbETH and post exchange rate updates.
- Signer composition and threshold of the controlling addresses are not publicly disclosed; they should be treated as a centralized Coinbase-managed multisig at best.

**Key Controls:**
- Proxy upgrades: instant, no timelock.
- Mint/burn: gated to the `Caller` role, subject to a configurable `RateLimit` cap that can be raised by its owner.
- `pause()`: halts all transfers protocol-wide.
- `blacklist(address)`: freezes the cbETH balance of any specified address indefinitely (same mechanism as USDC).
- `ExchangeRateUpdater` owner can replace the caller authorised to post the cbETH/ETH rate.

**Trust Assumptions:**
- Coinbase can upgrade the contract at any time and could in principle introduce a function that mints to itself or transfers user balances.
- Coinbase can freeze individual addresses or pause the entire token.
- The underlying staked ETH is custodial — even with a flawless contract, holders ultimately rely on Coinbase's solvency, security, and regulatory standing to receive ETH on redemption.

## External Dependencies

**Oracle System:**
- The cbETH/ETH exchange rate is posted on-chain by Coinbase via `ExchangeRateUpdater`, on a schedule of roughly once every 24 hours at 4pm UTC.
- No fallback oracle. If Coinbase stops posting, the rate stalls and downstream protocols using cbETH as collateral consume a stale price.
- No on-chain derivation from validator balances; the contract has no view into the beacon chain.

**Off-Chain Actors:**
- Coinbase itself runs all validators backing cbETH and is the sole minter/burner. There is no bonded operator set, no slashing exposure visible on-chain, and no decentralized removal process.
- Bridges: the Base, Optimism, and Polygon deployments rely on their respective canonical bridges; cbETH on Polygon is bridged via Polygon PoS.
- No keeper or relayer network — minting and rate updates are driven by Coinbase's internal infrastructure.

**Overall Rating Justification:**
External dependencies rate `centralized`. The exchange rate, the underlying staked ETH, and the mint/burn path all flow through a single corporate counterparty with no on-chain constraint, fallback, or decentralized override.

## Economic Risk

**Liquidity Risk:**
- On-chain liquidity is concentrated in Curve and Uniswap V3 cbETH/ETH pools; depth is materially smaller than for stETH or wstETH.
- Exit to ETH on-chain depends on secondary AMM liquidity and is exposed to discounts during stress. Native redemption requires off-ramping through Coinbase, subject to KYC and any account-level restrictions.
- TVL has declined from 2023 peaks, reflecting a reduction in cbETH minting in the wake of regulatory pressure on US staking products.

**Operational History:**
- Mainnet launch: August 2022.
- No smart contract exploits or known on-chain incidents over 3+ years of operation.
- 2023: SEC scrutiny of US staking-as-a-service products affected Coinbase's staking business broadly; cbETH continued to operate.
- Survived market stress including the FTX collapse (November 2022) and Shapella enabling withdrawals (April 2023) without operational incident.

## Stage Assessment

**Stage 0 Criteria — protocol falls short of Stage 1 on multiple dimensions:**

- ⚠ Upgradeability: instant — `FiatTokenProxy` upgrades have no on-chain timelock
- ⚠ Admin control: multisig-weak — privileged roles held by undisclosed Coinbase-controlled keys, no public threshold or signer diversity
- ⚠ Fund access: possible — Coinbase custodies the underlying ETH, can blacklist individual balances, and can pause all transfers
- ⚠ Audits: single — one OpenZeppelin audit (August 2022) covering the core cbETH contracts
- ⚠ External dependencies: centralized — exchange rate is posted by Coinbase alone with no fallback, and underlying staking is fully Coinbase-operated
- ✓ Track record: 3+ years in production with no smart contract exploits

**Why Not Stage 1:**
- Instant proxy upgradeability with no timelock would need to move to a >=48h timelock at minimum.
- Admin control would need to be a transparent, diverse multisig or decentralized governance — currently the controlling keys are not publicly documented.
- Fund access would need to be at most `restricted`; the custodial design and blacklist/pause powers make this structurally unattainable.
- External dependencies would need to be at least `decentralized`; cbETH's design relies on Coinbase as the sole oracle and custodian.
- A second independent audit of the current code would be needed to meet the `multiple` threshold (the battle-tested override does not apply because the contracts are upgradeable and fund access is possible).

**Justification:**
cbETH is a custodial liquid staking token whose security model is dominated by trust in Coinbase as a corporate entity. The on-chain contract is upgradeable without delay, transfers can be paused or blacklisted, the exchange rate is set by a single off-chain party, and the underlying ETH is held off-chain. Even though no smart contract incident has occurred over 3+ years, none of the Stage 1 criteria on upgradeability, admin control, fund access, or external dependencies are met. cbETH is firmly Stage 0.

## Links

- [Official cbETH Page](https://www.coinbase.com/cbeth)
- [cbETH Whitepaper](https://www.coinbase.com/cbeth/whitepaper)
- [cbETH on Etherscan](https://etherscan.io/token/0xbe9895146f7af43049ca1c1ae358b0541ea49704)
- [OpenZeppelin cbETH Audit (Aug 2022)](https://www.openzeppelin.com/news/coinbase-liquid-staking-token-audit)
- [DeFiLlama — cbETH](https://defillama.com/protocol/coinbase-wrapped-staked-eth)
- [Coinbase Help — cbETH Introduction](https://help.coinbase.com/en/coinbase/coinbase-staking/staking/cbeth-intro)
