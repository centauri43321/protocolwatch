---
name: "Yearn Finance"
category: "yield"
stage: 0
website: "https://yearn.fi"
chains: ["ethereum", "arbitrum", "optimism"]
tvl: "$284M"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "instant"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "5+ years"
---

# Yearn Finance Risk Assessment

## Overview

Yearn Finance is a yield aggregator protocol that automatically compounds user deposits across DeFi strategies. Users deposit assets into Vaults, which allocate capital to strategies designed and managed by experienced strategists to maximize risk-adjusted returns.

Yearn V1 launched in February 2020, V2 in January 2021, and V3 in late 2023. V3 introduced a modular ERC-4626 vault architecture with two core primitives: Allocator Vaults (multi-strategy vaults written in Vyper) and Tokenized Strategies (standalone single-strategy ERC-4626 vaults). VaultFactory enables permissionless vault deployment by cloning from an immutable VAULT_ORIGINAL. Tokenized Strategies use an immutable delegatecall proxy pattern pointing to a shared TokenizedStrategy.sol implementation, with Create2 for deterministic cross-chain addresses.

## Smart Contract Risk

**Contract Architecture:**
- Allocator Vaults (Vyper) are cloned from immutable VAULT_ORIGINAL via VaultFactory — once deployed, vault code cannot be changed
- Tokenized Strategies use immutable delegatecall to a shared TokenizedStrategy.sol implementation
- Create2 used for deterministic cross-chain strategy addresses
- Periphery modules: Accountants (fee management), Debt Allocators (capital allocation)
- V2 legacy: forwarder-style delegatecall proxy pattern (still active for some vaults)
- V3 vault code is immutable, but the strategies attached to a vault can be changed instantly by the role_manager — the real upgradeability risk is not the vault code but what it invests in

**Code Quality:**
- ChainSecurity: V3 v3.0.0, yETH
- Statemind: V3 v3.0.0
- yAudit: V3 v3.0.1
- MixBytes: V3 (also audited V1/V2)
- Trail of Bits: V2 v0.4.2
- No formal verification performed
- Bug bounty: Immunefi, $200K maximum payout

**Attack Surface:**
- Strategy risk varies by vault — each strategy interacts with different external protocols
- Complex multi-protocol interactions across strategies (Curve, Aave, Compound, etc.)
- role_manager can add a malicious strategy and allocate vault debt to it instantly (no timelock)
- Legacy V1/V2 contracts still live on-chain (source of recent exploits)

## Admin/Governance Risk

**Governance Structure:**
- Multi-DAO structure: YFI holders vote on Yearn Improvement Proposals (YIPs), yTeams handle specific operational areas
- 6-of-9 multisig (ychad.eth) serves as Guardian — can nullify proposals but CANNOT propose (YIP-81)
- Recent signer rotations: YIP-84 (April 2025), YIP-89 (December 2025)

**Key Controls:**
- **role_manager**: Controls all other roles — can add/remove strategies, assign roles, change debt allocations. No timelock on any operation.
- **EMERGENCY_MANAGER**: Triggers irreversible emergency shutdown (deposits halted, strategies unwind, withdrawals remain open)
- **DEBT_MANAGER / MAX_DEBT_MANAGER**: Manages strategy debt allocation
- **DEPOSIT_LIMIT_MANAGER / WITHDRAW_LIMIT_MANAGER**: Controls vault capacity
- **MINIMUM_IDLE_MANAGER**: Sets idle capital requirements
- **PROFIT_UNLOCK_MANAGER**: Configures profit distribution timing
- **DEBT_PURCHASER**: Handles debt purchasing operations
- No timelock on any admin operation — all role assignments and strategy changes execute instantly

**Trust Assumptions:**
- Strategists cannot directly drain user funds
- role_manager can add a malicious strategy and allocate vault debt to it without any delay
- max_loss parameter defaults to 0 on withdraw() — transactions revert on loss, providing some protection
- Emergency shutdown is irreversible: deposits halt, strategies unwind, but withdrawals REMAIN OPEN

## External Dependencies

**Oracle System:**
- No native oracle dependency at the vault architecture level
- Strategy-level oracle dependencies inherited from underlying protocols (Curve, Aave, Compound, etc.)

**Off-Chain Actors:**
- report() and tend() calls are PERMISSIONED — only authorized management/keeper addresses can trigger them, not permissionless
- Keep3r Network historically used for automation, Gelato as an alternative
- If keepers stop: withdrawals still function, but no harvesting, compounding, or rebalancing occurs — user funds sit idle in deployed strategies
- Strategies depend on external protocols (Curve, Aave, Compound, and others) for yield generation; each strategy inherits the risk profile of its underlying protocol(s)

**Overall Rating Justification:**
Rated `mixed` — the keeper system is permissioned rather than fully decentralized, creating dependency on authorized operators for core protocol functionality (harvesting and compounding). However, withdrawals operate independently of keepers, meaning user funds are not locked if keeper infrastructure fails. Strategy-level dependencies on external protocols add further centralized elements.

## Economic Risk

**Liquidity Risk:**
- ~$284M TVL across Ethereum, Arbitrum, and Optimism
- Individual vault deposits; exit liquidity depends on underlying protocol liquidity (Curve, Aave, Compound, etc.)
- Emergency shutdown mechanism ensures withdrawals remain accessible even during crises

**Operational History:**
- V1 launched February 2020, V2 January 2021, V3 late 2023
- Core V2/V3 vaults have NEVER been exploited
- February 2021 — V1 DAI Vault Exploit ($11.1M loss, $2.8M attacker profit): Flash loan attack manipulating the Curve 3pool. Security team mitigated within 11 minutes. Tether froze $1.7M USDT involved. Yearn repaid all affected users from treasury.
- November 30, 2025 — yETH Pool Exploit (~$9M): Unchecked arithmetic bug in the yETH weighted stableswap pool allowed an attacker to mint 235 septillion yETH tokens from a 16 wei deposit. 857.49 pxETH recovered (~$2.4M). Main yield vaults ($410M+ TVL) were unaffected.
- December 17, 2025 — Legacy V1 iEarn TUSD Exploit (~$300K / 103 ETH): Flash loan donation attack on a legacy iEarn TUSD contract. Second attack on the same legacy contract in December 2025. Active V2/V3 vaults were unaffected.

## Stage Assessment

**Stage 0 Criteria Met:**
- No timelock on critical operations: strategy additions, strategy removals, debt allocation changes, and role assignments all execute instantly
- role_manager can add a malicious strategy and allocate vault funds to it without any delay window for users to react
- This constitutes `instant` upgradeability under the framework, which caps the protocol at Stage 0

**Why Not Stage 1:**
- Stage 1 requires a timelock of at least 48 hours on critical upgrade operations
- No such timelock exists on strategy changes, debt allocation, or role assignment
- The instant strategy change capability means governance or the role_manager could redirect vault funds to a malicious strategy without any delay for users to withdraw
- To advance to Stage 1: implement a minimum 48-hour timelock on strategy additions and removals, debt allocation changes above a threshold, and role_manager assignment changes

**Justification:**
Yearn Finance is classified as Stage 0 (Fully Assisted) because the role_manager can add or remove strategies, change debt allocations, and assign roles with no timelock — any of these actions could redirect vault funds to a malicious strategy with no delay for users to react. This is the decisive factor, overriding Yearn's strong positives: multi-DAO governance with YFI token voting, a 6-of-9 multisig Guardian, multiple independent audits from reputable firms, 5+ years of operational history with core V2/V3 vaults never exploited, and an emergency shutdown mechanism that preserves user withdrawal access.

## Links

- [Official Website](https://yearn.fi)
- [Documentation](https://docs.yearn.fi)
- [GitHub](https://github.com/yearn)
- [Governance](https://gov.yearn.fi)
- [Security](https://github.com/yearn/yearn-security)
- [Immunefi Bug Bounty](https://immunefi.com/bounty/yearnfinance)
