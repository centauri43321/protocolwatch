---
name: "Euler V2"
baseName: "Euler"
category: "lending"
stage: 1
website: "https://euler.finance"
chains: ["ethereum", "base", "arbitrum", "avalanche", "sonic"]
tvl: "$521M"
lastUpdated: "2026-03-17"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "1.5+ years (V2); V1 exploited March 2023 ($197M flash loan, fully recovered)"
---

# Euler V2 Risk Assessment

## Overview

Euler V2 is a modular lending infrastructure protocol that provides a vault creation framework for permissionless deployment of isolated lending markets on Ethereum and multiple L2s.

Unlike monolithic lending protocols (Aave, Compound) with shared collateral pools, Euler V2 is built around two immutable primitives: the **Ethereum Vault Connector (EVC)** — a cross-vault authentication layer — and the **Euler Vault Kit (EVK)** — a factory for deploying customizable lending vaults. Each vault operates independently with its own oracle, collateral configuration, and risk parameters. The Euler DAO deploys and governs a set of "DAO-managed vaults" for blue-chip assets, which represent the bulk of the protocol's ~$521M TVL. Euler V2 launched September 4, 2024, following the deprecation of Euler V1 after the March 2023 $197M exploit.

## Smart Contract Risk

**Contract Architecture:**
- Two immutable core primitives: the **EVC** (Ethereum Vault Connector) and the **EVKFactory** — neither can be upgraded by anyone
- Individual vaults are deployed as proxies pointing to the EVKFactory's implementation; DAO-managed vaults use the upgradeable path
- Vault upgrades are controlled by an **Admin TimelockController** (minimum 48-hour delay), which is itself governed by the Euler DAO multisig
- A second **Wildcard TimelockController** (also min 48h) controls day-to-day parameter changes (LTVs, caps, IRM)
- Three instant-action emergency roles exist for risk reduction only: `LTV_EMERGENCY_ROLE`, `CAPS_EMERGENCY_ROLE`, and `HOOK_EMERGENCY_ROLE` (pause all vault operations)
- Oracle infrastructure uses immutable adapter factories; each vault configures its own oracle via a governed `EulerRouter`

**Code Quality:**
- Over 60 security reviews from 16+ firms before V2 launch; $4M+ spent on pre-launch security
- Key auditors: Spearbit/Cantina, Trail of Bits, OpenZeppelin, ChainSecurity, Certora, Zellic, Omniscia, Electisec
- Formal verification by Certora covering critical protocol invariants
- Live CTF challenge ($3.5M on Hats Finance, using live protocol funds) — no compromise
- $500K EulerSwap CTF on Cantina — no compromise
- Pre-launch Cantina audit competition ($1.25M prize) yielded zero critical/high/medium findings
- Active bug bounty on Cantina: up to $7.5M for critical findings
- Open source on GitHub (euler-xyz organization)
- 2 critical and 5 high severity issues found across pre-launch audits; all resolved before deployment

**Attack Surface:**
- Modular isolated vault architecture limits contagion — an exploit in one vault cannot drain others
- Per-vault oracle configuration creates heterogeneous trust surface; lower-tier vaults may use less robust oracles
- EVC's cross-vault collateral routing introduces cross-vault interaction complexity
- Flash loan exposure exists for individual vaults; vault-level isolation contains blast radius
- Euler V1 was exploited March 2023 ($197M) via a `donateToReserves()` accounting flaw that bypassed health checks; V2 was built from scratch with the attack surface in mind and has no analogous mechanism

## Admin/Governance Risk

**Governance Structure:**
- **EUL token** holders govern the protocol via on-chain voting (Tally/Governor)
- Proposals flow through a dual-timelock structure: Admin Timelock (upgrades) and Wildcard Timelock (parameters), both with minimum 48-hour delays
- A **Security Council** (described as a "safe-of-safes" multisig composed of multiple multisig participants) holds `CANCELLER_ROLE` — veto power over queued governance proposals
- A **Treasury multisig** (4-of-9) manages protocol funds; signer identities are not publicly disclosed
- Governance structure was separated from operations in November 2025 (Euler Foundation multisig update)

**Key Controls:**
- `DEFAULT_ADMIN_ROLE`: Held by the Admin Timelock (min 48h) → controlled by Euler DAO multisig; can grant/revoke all roles and execute vault upgrades
- `WILD_CARD` role: Held by the Wildcard Timelock (min 48h); covers routine parameter changes
- `PAUSE_GUARDIAN_ROLE`: Held by Euler Labs Ops multisig + two unnamed security monitoring firms; can instantly pause vaults
- Emergency roles (`LTV_EMERGENCY_ROLE`, `CAPS_EMERGENCY_ROLE`, `HOOK_EMERGENCY_ROLE`): Held by Euler Labs + security partners; instant action, restricted to risk-reduction operations only. Recovery from emergency state still requires timelock approval
- `CapRiskSteward`: A separate multisig (Gauntlet, Objective Labs, Euler Labs) that can adjust supply/borrow caps and interest rate models **without timelock** — a deliberate bypass for incremental risk management

**Trust Assumptions:**
- Users must trust that the Euler DAO will not pass malicious upgrade proposals; the 48h timelock provides an exit window
- The `CapRiskSteward` can adjust caps and IRMs immediately without governance approval; this multisig includes Euler Labs employees and is not fully independent
- Emergency roles held by Euler Labs (and unnamed security firms) can instantly pause all vault operations including withdrawals — this is a meaningful centralization point, not fully mitigated by the "risk-reduction only" constraint
- The Security Council's composition is not publicly disclosed; its independence cannot be verified
- Treasury multisig signers are not publicly identified

## External Dependencies

**Oracle System:**
- Euler V2 uses a library of **immutable oracle adapters** deployed via factory contracts (the factories themselves are immutable)
- Supported adapter types: Chainlink (push), Pyth (pull), Redstone (on-chain pull), Chronicle, Uniswap V3 TWAP, Pendle TWAP, Lido/wstETH rate-based, Balancer rate provider
- Each vault independently selects its oracle adapter; DAO-managed vaults for blue-chip assets use Chainlink and Uniswap V3 TWAP
- The `EulerRouter` contract that routes oracle calls is governed (configurable), though the underlying adapter contracts are immutable
- An OpenZeppelin audit noted that `ChronicleOracle` may not properly register with Chronicle's Toll access control system, which could cause failures on some deployments
- No single oracle source is mandated — oracle diversity per vault introduces heterogeneous trust assumptions across the ecosystem

**Off-Chain Actors:**
- Liquidations are fully **permissionless** — no whitelisted keepers required; any address can liquidate undercollateralized positions
- The `CapRiskSteward` multisig functions as an off-chain risk management actor that can adjust parameters without timelock; not bonded or slashable
- No sequencer, relayer, or other critical off-chain actor dependencies in core contract functionality

**Overall Rating Justification:**
Euler V2's oracle infrastructure is modular and primarily uses Chainlink (decentralized) and Uniswap V3 TWAP (on-chain) for DAO-managed vaults. Liquidations are permissionless. However, the `CapRiskSteward` multisig operates as an unconstrained off-chain actor that can change risk parameters without timelock approval, and per-vault oracle flexibility means individual vaults may rely on less robust oracle sources. The combination of a decentralized primary oracle and an unbonded, privileged parameter actor places this in the `mixed` category.

## Economic Risk

**Liquidity Risk:**
- ~$521M TVL across 15+ chains as of March 2026; peaked at ~$671M in April 2025
- Isolated vault architecture provides natural liquidity segregation — no systemic collateral contagion between vaults
- DAO-managed vaults hold the majority of TVL; permissionless third-party vaults exist at smaller scale
- 575% TVL growth in the first 3 months post-launch (September–December 2024) indicates rapid adoption

**Operational History:**
- Euler V1 launched December 2021 on Ethereum mainnet; operated for ~15 months before the exploit
- **March 13, 2023:** Euler V1 exploited for $197M via flash loan attack targeting the `donateToReserves()` function; the attacker manipulated eToken/dToken accounting to extract excess value. All V1 user funds were subsequently returned
- **March 18–25, 2023:** Attacker ("Jacob") returned the stolen funds over a week of negotiations. ETH appreciation during recovery meant ~$240M was returned vs $197M stolen
- All V1 users were made whole; V1 contracts were deprecated
- **September 4, 2024:** Euler V2 launches with complete architectural redesign
- No exploits of V2 contracts as of March 2026
- V2 has operated through volatile market conditions in late 2024 and 2025 without incident

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Timelock >=48 hours on critical upgrades — Admin and Wildcard TimelockControllers enforce minimum 48h delays for vault upgrades and parameter changes
- ✓ Admin control via decentralized governance — EUL token governance controls both timelocks; Security Council holds veto power
- ✓ Admin powers scoped — no direct fund drain capability; emergency roles restricted to risk-reduction (pause, lower LTVs/caps); recovery requires timelock
- ✓ Multiple independent security audits — 60+ reviews from 16+ firms including Trail of Bits, OpenZeppelin, Spearbit, Certora, ChainSecurity, Zellic
- ✓ Formal verification — Certora verified critical protocol invariants
- ✓ 6+ months production operation — V2 has operated since September 2024 (~18 months)
- ✓ Permissionless liquidations — no keeper dependency for core protocol operation

**Why Not Stage 2:**
- DAO-managed vaults are upgradeable, not immutable; the 48h timelock, while meaningful, does not meet the 7-day threshold for Stage 2
- Emergency roles (`HOOK_EMERGENCY_ROLE`, `PAUSE_GUARDIAN_ROLE`) held by Euler Labs + unnamed third parties can instantly pause all vault operations including withdrawals — this is a material centralization
- The `CapRiskSteward` multisig bypasses the timelock for supply/borrow cap and IRM changes; this represents an unconstrained off-chain parameter actor
- Treasury multisig and Security Council signers are not publicly identified, limiting accountability
- External dependencies rated `mixed` due to CapRiskSteward and per-vault oracle variance

**Justification:**
Euler V2 achieves Stage 1 (Limited Trust) on the strength of its dual 48h timelock structure, EUL governance control, and an exceptionally comprehensive audit portfolio — among the most thorough in DeFi. The isolated vault architecture substantially limits systemic risk compared to monolithic predecessors. However, Euler Labs retains direct control over emergency pause capabilities and the `CapRiskSteward` multisig bypasses governance for parameter changes, representing meaningful trust in the protocol team. The V1 exploit history is relevant context; V2's architectural response and security investment are a material improvement. The 18-month clean track record on V2 supports the Stage 1 classification.

## Links

- [Official Website](https://euler.finance)
- [Documentation](https://docs.euler.finance)
- [GitHub](https://github.com/euler-xyz)
- [Security Overview](https://docs.euler.finance/security/overview/)
- [Audit Reports](https://docs.euler.finance/security/audits/)
- [Bug Bounty (Cantina)](https://cantina.xyz/bounties/4d285eee-602e-440a-845e-25e155cec26a)
- [DAO Vaults Governance](https://docs.euler.finance/security/dao-vaults-governance/)
- [DeFiLlama TVL](https://defillama.com/protocol/euler-v2)
- [V1 Exploit Recovery](https://www.euler.finance/blog/war-peace-behind-the-scenes-of-eulers-240m-exploit-recovery)
