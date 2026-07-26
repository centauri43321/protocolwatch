---
name: "Raydium"
category: "dexes"
stage: 0
website: "https://raydium.io"
chains: ["solana"]
tvl: "$1B"
lastUpdated: "2026-05-15"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "decentralized"
  trackRecord: "4+ years, December 2022 admin-key exploit (~$4.4M, LPs reimbursed)"
---

# Raydium Risk Assessment

## Overview

Raydium is one of Solana's oldest DEXes (live since February 2021) and a consistent top-two venue by TVL and volume. It operates three concurrent pool programs — the original AMM v4 (constant-product, historically integrated with the Serum/OpenBook orderbook), CLMM (concentrated liquidity, Uniswap V3-style), and CPMM (a permissionless constant-product standard introduced mid-2024) — alongside the LaunchLab token launchpad.

The protocol is gated to Stage 0 by two factors. Solana program upgrade authority on all three pool programs remains active under a team-controlled Squads multisig with no on-chain timelock. And Raydium has a documented admin-key exploit on record: in December 2022 an attacker compromised the AMM v4 admin private key and drained ~$4.4M from several pools via the privileged `withdrawPnl` path. The team patched the program to narrow the admin surface, rotated keys to a hardware-secured multisig, and reimbursed affected LPs, but did not make the program immutable.

## Smart Contract Risk

**Contract Architecture:**
- **AMM v4** (`675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`): original constant-product pools; some pools historically integrated with the Serum/OpenBook orderbook for shared liquidity
- **CLMM** (`CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`): concentrated-liquidity pools launched 2023
- **CPMM** (`CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`): permissionless constant-product pool program launched mid-2024; the default for new pool creation today, with no OpenBook market dependency
- All three programs are upgradeable; upgrade authority has not been renounced on any of them and is held by a team-controlled Squads multisig
- The OpenBook integration on AMM v4 is effectively legacy — new liquidity flows to CPMM and CLMM, neither of which uses an external orderbook

**Code Quality:**
- **AMM v4** audited by Kudelski Security (2021, pre-launch)
- **CLMM** audited by OtterSec and MadShield (2022–2023)
- **CPMM** audited by MadShield and OtterSec (2024)
- No publicly disclosed Trail of Bits, Certora, or Halborn engagements
- Active bug bounty
- Open source

**Attack Surface:**
- The December 2022 incident demonstrated that AMM v4 carried privileged admin paths (notably `withdrawPnl`) that could be misused if the admin key were compromised. The post-incident patch narrowed the dangerous surface and moved key custody to multisig, but the program retains an admin authority
- CPMM was designed without the legacy admin hooks that enabled the 2022 incident
- Solana liveness: chain outages halt trading entirely
- Permissionless pool creation on CPMM exposes end users to scam tokens, but this is supply-chain risk at the token layer, not protocol-level

## Admin/Governance Risk

**Governance Structure:**
- **RAY token** launched February 2021; one of Solana's earliest DeFi tokens. Used for staking, fee discounts, and incentive distribution
- Despite RAY being marketed as a governance token, **Raydium has no meaningful on-chain DAO governance**. There is no binding vote process — all protocol parameters, program upgrades, fee switches, and treasury actions are controlled by the **core team via Squads multisig**
- This is consistent with several other major Solana DEXes (Orca, Jupiter operate under similar custody models)

**Key Controls:**
- Squads multisig holds program-upgrade authority on AMM v4, CLMM, and CPMM
- No on-chain timelock; Solana's BPF Loader Upgradeable has no native timelock primitive, and no Squads time-locked execution path has been publicly verified for Raydium's vault
- AMM v4 retains an admin authority post-2022, with a narrower surface than before; CPMM is designed without legacy admin hooks
- Treasury / fee-switch actions executed through the same multisig

**Trust Assumptions:**
- Users trust the multisig signers not to push a malicious upgrade. Because upgrades are instant, there is no exit window
- For AMM v4 specifically, the December 2022 incident is the empirical demonstration that admin key compromise translates directly into LP losses. Post-incident remediation was procedural (better key custody) rather than architectural (renouncing admin)
- For CPMM, the admin surface is narrower by design, but program-upgrade authority still applies

## External Dependencies

**Oracle System:**
- None for pricing — AMM v4, CLMM, and CPMM all use internal pool state (constant-product or tick math) for execution. No external oracle is consulted to fill swaps

**Off-Chain Actors:**
- No keepers required for swap execution; all trading is atomic and on-chain
- Legacy AMM v4 pools that reference OpenBook markets depend on OpenBook orderbook state for fills routed that way, but this path is largely deprecated and new liquidity does not use it
- **Solana L1** is a hard liveness dependency — multi-hour outages have historically halted Raydium (2021–2023 era; chain stability improved in 2024–2025)

**Overall Rating Justification:**
Decentralized. The pool programs do not require oracles, keepers, or off-chain attestations for swap execution. The remaining external dependency is Solana L1 liveness, which is the baseline cost of operating on Solana. Legacy OpenBook ties on AMM v4 pools do not affect newer CPMM/CLMM pools.

## Economic Risk

**Liquidity Risk:**
- TVL ~$1B as of mid-2026; consistently #1 or #2 Solana DEX by TVL alongside Orca
- Volume share has been amplified by the 2023–2025 Solana memecoin cycle, in which Raydium captured a large share of pump.fun graduations and similar launchpad flow
- LaunchLab (2025) is Raydium's response to pump.fun and feeds new pools into CPMM
- Liquidity is fragmented across three pool programs; deep pools exist in major pairs on CLMM and CPMM

**Operational History:**
- Launched February 21, 2021 (4+ years)
- **December 16, 2022 admin-key exploit**: an attacker compromised the AMM v4 admin private key (attributed to malware on a team machine) and invoked the privileged `withdrawPnl` and parameter-manipulation paths to drain ~$4.4M from SOL-USDC, RAY-USDC, RAY-SOL and other pools. Raydium reimbursed affected LPs from treasury and RAY buybacks; patched the program to narrow the admin surface; rotated keys to hardware-secured multisig custody. The program was **not** made immutable
- Survived the FTX / Alameda collapse despite tight Serum dependency by pivoting to the OpenBook fork and then de-emphasizing orderbook integration over time
- No further exploits since December 2022

## Stage Assessment

**Criteria evaluation:**

- ⚠ Upgradeability: `instant` — programs are upgradeable via Squads multisig with no runtime-enforced timelock
- ✓ Admin control: `multisig-diverse` — team-controlled Squads multisig; threshold and signer set partially disclosed
- ⚠ Fund access: `restricted` — pool programs do not have direct drain paths in normal operation, but the upgrade authority can ship logic that does. AMM v4 additionally retains a narrowed admin authority post-2022. The 2022 incident is direct evidence that admin compromise can translate to LP losses
- ✓ Audits: `multiple` — Kudelski, OtterSec, and MadShield across the three programs
- ✓ External dependencies: `decentralized` — no oracles, no keepers, no off-chain actors required for swap execution; Solana L1 liveness is the only meaningful dependency
- ⚠ Track record: 4+ years with one documented admin-key exploit (December 2022, ~$4.4M, LPs reimbursed)

**Why Not Stage 1:**
- Upgradeability does not meet `timelock-48h+`. Program upgrades are effectively instant given the lack of an on-chain timelock
- The December 2022 incident, while remediated, demonstrates that admin paths in the older program carry real custody risk. The remediation was procedural (key custody hardening) rather than architectural (renouncing admin or making AMM v4 immutable)
- Battle-tested override does not apply because the core programs are not immutable

**Justification:**
Raydium is gated to Stage 0 by the combination of upgradeable pool programs with no enforced timelock and a documented history of admin-key compromise translating into LP losses. The external-dependency surface is genuinely clean (no oracles or off-chain actors required for swap execution), audit coverage is reasonable across the three programs, and the protocol has operated continuously for four years. Renouncing upgrade authority on AMM v4 (and ideally CLMM/CPMM) or wiring a meaningful Squads timelock on the upgrade path would be the cleanest route toward Stage 1.

## Links

- [Official Website](https://raydium.io)
- [Documentation](https://docs.raydium.io/)
- [GitHub](https://github.com/raydium-io)
- [AMM v4 Program](https://solscan.io/account/675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)
- [CLMM Program](https://solscan.io/account/CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK)
- [CPMM Program](https://solscan.io/account/CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C)
- [December 2022 Incident Post-Mortem](https://raydium.medium.com/raydium-liquidity-pool-v4-exploit-post-mortem-d4ef61a4e76e)
