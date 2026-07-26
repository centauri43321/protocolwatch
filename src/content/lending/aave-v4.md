---
name: "Aave V4"
baseName: "Aave"
category: "lending"
stage: 0
website: "https://aave.com"
chains: ["ethereum"]
tvl: "$104M"
lastUpdated: "2026-06-09"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "~2.5 months in production (launched March 30, 2026)"
---

# Aave V4 Risk Assessment

## Overview

Aave V4 is the newest version of the Aave lending protocol, deployed to Ethereum mainnet on March 30, 2026 and announced at EthCC. It introduces a hub-and-spoke architecture in which a single immutable Liquidity Hub holds protocol assets and enforces accounting invariants, while modular Spokes (upgradeable, governance-controlled) implement user-facing lending markets, risk policies, and asset-listing rules.

V4 is not a replacement for V3 — both run side by side. As of June 2026, V4 holds approximately $104M in TVL on Ethereum only, with dedicated Spokes from Lido, EtherFi, Kelp, Ethena, and Lombard, and supported assets including USDT, USDC, EURC, cbBTC, frxUSD, and USDG. The protocol shipped after a $1.5M security program (345 cumulative review days, multiple top-tier firms, formal verification, a 6-week 900+ participant Sherlock contest). Because V4 has been live for under three months, the framework's track-record criterion forces an initial Stage 0 classification regardless of architecture or audit quality.

## Smart Contract Risk

**Contract Architecture:**
- **Liquidity Hub** — a single immutable contract per network that custodies all V4 assets and tracks accounting (total supplied ≥ total borrowed across Spokes, per-Spoke debit/credit lines)
- **Spokes** — upgradeable contracts that users interact with directly; each Spoke defines its own collateral set, oracle wiring, risk parameters, and pause controls, and routes liquidity to and from the Hub through Hub-enforced caps
- ERC-4626-style share accounting (moving away from V3's rebasing aTokens)
- Hub is immutable by design — no proxy, no upgrade path; this is the central trust feature of V4
- New Spokes are governance-added; V4 launched with DAO-governed Spoke creation only (permissionless Spoke creation is a future roadmap item)

**Code Quality:**
- $1.5M DAO-funded security program across 345 cumulative review days
- Manual audits: Certora (manual review + formal verification), Trail of Bits (manual review + invariant testing, 3-expert × 2-week engagement), ChainSecurity, Blackthorn
- Independent researchers (Stermi, Deadrosesecxyz, Josselin, Kurt Barry) involved at early stages and in fix-validation
- Formal verification by Certora as a continuous track during development
- Enigma Dark actor-based invariant testing using Echidna and Medusa fuzzers
- Sherlock public contest (Dec 2025 – Jan 2026): 900+ verified participants, 950+ findings, no critical or high-severity vulnerabilities
- Fix-validation second round: ChainSecurity, Blackthorn, Josselin, Stermi (~80 additional audit days)
- Open source on GitHub (aave/aave-v4)
- Active Immunefi bug bounty under the Aave program

**Attack Surface:**
- Hub immutability removes the primary upgrade-path-to-drain concern for assets in custody
- Spoke upgrades remain a trust surface — a malicious Spoke upgrade could in principle borrow against Hub liquidity within its Hub-enforced credit line, but cannot drain Hub assets beyond that envelope
- Cross-Spoke contagion is bounded by Hub-level caps and accounting invariants
- ERC-4626 share accounting reduces a class of integration bugs but introduces new ones (rounding, donation attacks) that the audit program targeted
- Hub-and-Spoke is a novel architecture in production — calibrated against extensive verification but lacks the multi-year battle-testing of V3

## Admin/Governance Risk

**Governance Structure:**
- Controlled by AAVE token governance (Aave Governance V3 framework reused for V4)
- Cross-chain governance via a.DI (Aave Delivery Infrastructure) — Hub on Ethereum mainnet at launch
- Voting on Ethereum (and lower-fee voting networks); execution via a.DI on target chains
- Guardian multisig retained for emergency actions (pause / freeze, proposal cancellation)

**Key Controls:**
- **Hub** — immutable; no governance function can upgrade, replace, or extract from the Hub contract directly
- **Spokes** — upgradeable via governance through the Aave Governance V3 executors (Short Executor 1-day timelock + voting period; Long Executor 7-day timelock for high-impact changes)
- Hub-level configuration (authorising new Spokes, setting per-Spoke borrow/supply budgets, global rate-curve parameters, premium tables) is governance-controlled
- Risk Stewards / Risk Agents apply bounded automated parameter changes within governance-set envelopes
- Guardian can pause Spokes / freeze listed markets without upgrading code
- Emergency stop controls are scoped to halting activity, not transferring assets

**Trust Assumptions:**
- Users must trust governance not to ship a malicious Spoke upgrade — exit window is ≥48h effective (voting + 1-day timelock) for routine upgrades, 7d for long-executor changes
- The Hub's immutability means a malicious Spoke upgrade cannot exfiltrate Hub-held liquidity beyond that Spoke's credit line; this materially shrinks the worst-case admin blast radius compared to V3
- Fund access is `restricted`: governance can re-shape Spokes (parameters, oracles, listings) in ways that affect outstanding positions, but cannot directly withdraw from the Hub
- Permissioned Spoke launch model (DAO-governed) reduces the surface for malicious Spokes during the "training wheels" phase

## External Dependencies

**Oracle System:**
- Chainlink price feeds remain the primary oracle source for V4 Spokes
- LST/LRT Spokes (Lido, EtherFi, Kelp) use composite or exchange-rate oracles for the underlying collateral
- Spokes configure their own oracle wiring within governance-set bounds
- Risk Steward / Risk Agent automation reuses Chainlink Edge Risk Oracle infrastructure already operational on V3

**Off-Chain Actors:**
- Liquidations remain permissionless
- No keeper requirement for core operation
- a.DI cross-chain governance uses multiple bridge providers (CCIP, LayerZero, Hyperlane); V4 currently only on Ethereum, so cross-chain bridge exposure is limited to governance message delivery for any future multi-chain expansion

**Bridge / Wrapped-Asset Exposure:**
- V4 launched after the April 2026 rsETH incident on V3, and the listing standards for V4 Spokes — particularly the LRT-focused Kelp Spoke — incorporate the tightened bridge-security requirements (multi-DVN, supply caps tied to bridge configuration, mandatory monitoring)
- Bridged-collateral exposure on V4 is therefore narrower at launch than on V3, but the same class of dependency exists

**Overall Rating Justification:**
V4's external dependency profile is `decentralized`: Chainlink oracles, permissionless liquidations, a.DI for any future cross-chain message delivery. The bridged-collateral risk that materialised on V3 (rsETH) is constrained on V4 by tightened post-incident listing standards. Because V4 currently has only one chain deployment and a smaller asset universe, the empirical dependency surface is presently narrower than V3's.

## Economic Risk

**Liquidity Risk:**
- ~$104M TVL on Ethereum — small relative to V3, expected during the early-launch phase
- Single-chain deployment (Ethereum) reduces cross-chain contagion paths
- Hub-and-Spoke liquidity consolidation allows shared liquidity across Spokes with isolated risk
- Hub-enforced per-Spoke credit/debit lines cap Spoke-level contagion

**Operational History:**
- Mainnet launch: March 30, 2026
- ~2.5 months in production as of this assessment
- No exploits, no public incidents on V4 to date
- V4 was unaffected by the April 18, 2026 rsETH event on V3 (rsETH not listed on V4 at the time, and the Hub's listing model gates Spoke onboarding through governance)
- Has not yet survived a market-wide stress event independently of V3

## Stage Assessment

**Stage 0 Criteria Met:**
- ✗ <6 months in production — V4 launched March 30, 2026 and has only ~2.5 months of live operation; the framework requires ≥6 months for any Stage 1 candidacy and ≥12 months for Stage 2 regardless of audit or architecture quality
- ✓ (architectural) Immutable Liquidity Hub — the asset-custody layer is genuinely immutable, which is a Stage-2 quality on that dimension alone
- ✓ (architectural) Spoke upgrades behind ≥48h effective timelock (Short Executor 1-day + voting; Long Executor 7-day)
- ✓ Admin powers scoped — governance cannot directly drain the Hub; Guardian can only pause/freeze
- ✓ Extensive audits (Certora formal verification, Trail of Bits, ChainSecurity, Blackthorn, Sherlock public contest, fuzzing, $1.5M security budget, no critical findings)
- ✓ External dependencies decentralized (Chainlink oracles, permissionless liquidations)
- ⚠ Hub-and-Spoke is a novel production architecture — extensive verification but unproven under multi-year load
- ⚠ Spoke configuration and listing changes can be made by Risk Stewards / governance within bounded envelopes — same `restricted` fund-access posture as V3

**Why Not Stage 1:**
- ✗ <6 months in production — this is the only blocker. Once V4 passes the 6-month mark (~September 30, 2026) without a core-contract incident, Stage 1 is a candidate based on the existing architecture, audit portfolio, and admin scoping
- All other Stage 1 criteria (timelock ≥48h, governance-controlled admin, scoped admin powers, multiple reputable audits, decentralized dependencies) are already met

**Why Not Stage 2:**
- ✗ Hub Spokes are upgradeable; raw Short Executor timelock is 1 day (not 7+ days)
- ✗ <12 months in production with meaningful TVL
- ✗ Governance retains parameter and Spoke-upgrade control
- ⚠ The architecture is Stage-2-quality at the Hub layer but Stage-1 at the Spoke layer

**Justification:**
Aave V4 is classified as Stage 0 (Fully Assisted) on a single basis: the framework's hard floor that any protocol with less than 6 months of live production exposure starts at Stage 0, irrespective of audit prestige or architectural quality. This is the correct call — even a $1.5M security program with formal verification and zero high-severity findings cannot substitute for in-production track record, and a novel hub-and-spoke architecture warrants conservative initial trust. On every other dimension V4 is a strong Stage 1 candidate today and a plausible Stage 2 candidate within ~12 months if the Hub remains exploit-free and Spoke upgrades continue to be processed through the ≥48h-effective governance lifecycle. Practically, depositors should treat V4 as carrying early-launch risk, not as a fully matured V3 successor.

## Links

- [Official Website](https://aave.com)
- [V4 Documentation](https://aave.com/docs/aave-v4)
- [V4 Architecture Blog](https://aave.com/blog/understanding-aave-v4s-architecture)
- [V4 Security Blog](https://aave.com/blog/aave-v4-security-by-design)
- [GitHub](https://github.com/aave/aave-v4)
- [Governance](https://governance.aave.com)
- [Bug Bounty](https://immunefi.com/bounty/aave/)
