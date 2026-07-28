---
name: "Extra Finance"
category: "yield"
stage: 0
website: "https://extrafi.io"
chains: ["base", "optimism"]
tvl: "$27M"
lastUpdated: "2026-07-28"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "3+ years, no known core exploit"
---

# Extra Finance Risk Assessment

## Overview

Extra Finance (ExtraFi) is a lending and leveraged yield farming protocol on Optimism and Base that lets users borrow against a shared lending pool to open leveraged liquidity-provision positions on Velodrome (Optimism) and Aerodrome (Base).

The protocol runs a pool-share LendingPool model — lenders deposit single assets and receive eTokens representing their share — and a FarmingVault system where leveraged farmers borrow that liquidity to build LP positions of up to ~5x. Leverage introduces liquidation risk: positions are monitored against Chainlink price feeds and unwound when their debt ratio breaches configured thresholds. TVL is roughly $27M, concentrated on Base (~$25M) with the remainder on Optimism.

## Smart Contract Risk

**Contract Architecture:**
- **LendingPool** — pool-share model; each asset has its own liquidity pool and issues eTokens. Liquidity is accessible only to whitelisted vault contracts.
- **FarmingVault** — manages leveraged farming positions tied to specific Velodrome/Aerodrome pairs, created through a **VaultFactory**. Enforces per-vault leverage caps and borrow limits.
- Only whitelisted vaults created by the VaultFactory can call the LendingPool's borrow/repay functions.
- Documentation does not disclose whether the core contracts sit behind upgradeable proxies or a timelock. "Upgrades on contract configurations are subject to a governance process," but no on-chain timelock is documented. Absent confirmation, upgradeability is rated conservatively as `instant`.

**Code Quality:**
- Audited by **BlockSec**, **PeckShield**, and **Sherlock** (Sherlock report dated 2024-12-01). All three report confirmed fixes for identified issues.
- No formal verification documented.
- Open source (GitHub: ExtraFi/extra-contracts).
- Bug bounty active on **Immunefi**.

**Attack Surface:**
- Leverage and liquidation logic is the primary attack surface — mispriced or manipulated inputs can trigger unfair liquidations.
- LP composability: positions are built on external Velodrome/Aerodrome pools, inheriting those AMMs' risk.
- Whitelist gating on borrow/repay limits which contracts can pull lending-pool liquidity.

## Admin/Governance Risk

**Governance Structure:**
- Contract configuration is controlled by a **multisig**. Threshold and signer identities are not publicly disclosed.
- EXTRA is the governance/utility token; the `owner` role of the EXTRA token contract has been invalidated, so no further EXTRA can be minted.
- Configuration changes follow a stated internal governance process ("multiple levels of review and approval"), but this is policy, not an on-chain enforced timelock.

**Key Controls:**
- The multisig can change **protocol fee, liquidation threshold, and reserve rate**, among other parameters.
- No admin function is designed to withdraw user funds from the contracts.
- No on-chain timelock on parameter changes is documented — changes to liquidation thresholds could take effect without a user exit window.

**Trust Assumptions:**
- The multisig cannot directly drain deposits, but can adjust liquidation thresholds and reserve rates — parameters that indirectly determine when and how leveraged positions are unwound, i.e. they can affect user outcomes.
- With signer composition undisclosed and no confirmed timelock, a compromised or malicious multisig could alter fund-relevant risk parameters with no enforced delay.

## External Dependencies

**Oracle System:**
- **Chainlink Price Feeds** secure position valuation and liquidations (initial Optimism integration covered ETH, USDC, OP, SNX, wstETH).
- Chainlink is decentralized, but the multisig can configure oracle-related parameters; no independent fallback oracle is documented.

**Off-Chain Actors:**
- Leveraged positions require liquidation to be triggered when debt ratios breach thresholds; the liquidation/keeper actors' bonding and permissioning are not documented.
- Core farming positions are built on Velodrome (Optimism) and Aerodrome (Base) LP pools — external DEX dependencies whose liquidity and pricing directly affect position value.

**Overall Rating Justification:**
Rated `mixed`. The price oracle (Chainlink) is decentralized, but the protocol depends on external DEX pools (Velodrome/Aerodrome) for the farming positions themselves and on liquidation infrastructure whose economic bonding and permissioning are undisclosed. This combination of a decentralized oracle with unconstrained/undocumented off-chain liquidation actors places it in `mixed` rather than `decentralized`.

## Economic Risk

**Liquidity Risk:**
- ~$27M TVL, concentrated on Base (~$25M) with ~$2M on Optimism.
- Leverage amplifies both returns and losses; a sharp move in an underlying LP pair can cascade liquidations and stress lending-pool utilization, affecting lender withdrawals during volatility.

**Operational History:**
- Testnet on Optimism (March 2023); Optimism mainnet launch (May 2023). Later expanded to Base.
- Roughly 3+ years in production with no publicly known exploit of the core lending/vault contracts.
- Has operated through multiple market cycles without a documented core-contract incident.

## Stage Assessment

**Stage 0 Criteria (why it does not clear Stage 1):**

- ✓ Fund access restricted, not direct — no admin function withdraws user deposits; multisig control is limited to parameters (fees, liquidation threshold, reserve rate)
- ✓ Multiple audits from reputable firms — BlockSec, PeckShield, Sherlock (2024-12), plus an Immunefi bug bounty
- ✓ Track record — 3+ years live since May 2023 with no known core exploit
- ✗ No confirmed timelock — configuration/upgrade changes, including liquidation thresholds, are not documented as being behind an on-chain timelock; conservatively rated `instant`, which blocks Stage 1
- ✗ Multisig composition undisclosed and controls fund-relevant parameters — threshold and signer independence are unknown, so the multisig cannot be credited as diverse; rated `multisig-weak`
- ⚠ External dependency on Velodrome/Aerodrome pools and undocumented liquidation keepers (`mixed`) — a Stage 1 protocol needs decentralized deps or documented fallbacks

**Why Not Stage 1:**

- ✗ **Timelock** — Stage 1 requires a ≥48h timelock with no bypass on changes to fund-holding contracts and their risk parameters. Extra Finance documents only a policy-level governance process, not an enforced on-chain delay. If a ≥48h timelock covering parameter and upgrade changes were confirmed on-chain, this would advance to Stage 1.
- ✗ **Admin decentralization** — Stage 1 requires decentralized governance or a disclosed 3-of-5+ diverse multisig. The multisig threshold and signers are undisclosed.

**Justification:**
Extra Finance takes a defensible security posture for a leveraged-farming protocol: no admin fund-withdrawal function, three reputable audits, an active bug bounty, a disabled EXTRA mint role, and a 3+ year record with no known core exploit. But the framework asks a narrower question — can user funds be affected without their consent? Here a multisig of undisclosed composition can change liquidation thresholds and reserve rates, parameters that directly govern how leveraged positions are unwound, and there is no confirmed on-chain timelock giving users a window to exit before such changes take effect. Because unverified timelock protection defaults to the conservative rating and the fund-relevant admin controls are not demonstrably decentralized, Extra Finance is assessed at **Stage 0 (Fully Assisted)**. Confirming an on-chain timelock and disclosing a diverse multisig would be the clearest path to Stage 1.

## Links

- [Official Website](https://extrafi.io)
- [App](https://app.extrafi.io)
- [Documentation](https://docs.extrafi.io)
- [Audits & Security](https://docs.extrafi.io/extra_finance/audits-and-security)
- [GitHub](https://github.com/ExtraFi/extra-contracts)
