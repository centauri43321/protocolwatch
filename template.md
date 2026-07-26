---
name: "Protocol Name"
category: "dexes"  # Options: dexes, lending, liquid-staking, bridges, derivatives, yield, privacy
stage: 0  # 0 = Fully Assisted, 1 = Limited Trust, 2 = Trustless
website: "https://example.com"
chains: ["ethereum"]
tvl: "$0"
lastUpdated: "YYYY-MM-DD"
risks:
  upgradeability: "instant"  # Options: immutable, timelock-7d+, timelock-48h+, instant
  adminControl: "eoa"  # Options: none, governance, multisig-diverse, multisig-weak, eoa
  fundAccess: "possible"  # Options: impossible, restricted, possible
  audits: "none"  # Options: extensive, multiple, single, none
  externalDependencies: "centralized"  # Options: none, decentralized, mixed, centralized
  trackRecord: "< 6 months"
---

# Protocol Name Risk Assessment

## Overview

Brief description of the protocol and its purpose.

Extended overview covering the protocol's main features, how it works, and what makes it unique. Include market position (TVL rank within category, volume stats if applicable).

## Smart Contract Risk

**Contract Architecture:**
- Core contract design (proxy patterns, immutable, modular, etc.)
- Upgrade mechanisms (if any)
- Key contract addresses and their roles
- Inter-contract dependencies

**Code Quality:**
- Audit firms and dates (e.g., "Audited by Trail of Bits and Certora, 2024")
- Formal verification status
- Open source status
- Bug bounty program details (platform, max payout)

**Attack Surface:**
- Known attack vectors for this protocol type
- Reentrancy protections
- Flash loan exposure
- Historical vulnerabilities (if any)

## Admin/Governance Risk

**Governance Structure:**
- Governance mechanism (token voting, multisig, EOA)
- Governance token and voting mechanics
- Proposal lifecycle and quorum requirements
- Delegation and participation stats

**Key Controls:**
- What admin functions exist (pause, upgrade, parameter changes)
- Timelock details (duration, scope)
- Emergency mechanisms and who can trigger them
- Parameter boundaries (caps, floors, rate limits)

**Trust Assumptions:**
- What can governance change?
- Can governance access user funds (directly or via upgrade)?
- What happens if governance is compromised?

## External Dependencies

**Oracle System:**
- Oracle type (Chainlink, TWAP, custom, centralized API, none)
- Fallback mechanisms
- Update frequency and deviation thresholds
- Manipulation resistance

**Off-Chain Actors:**
- Keepers, relayers, sequencers, node operators
- Are they bonded/slashable? Governed by on-chain processes?
- What happens if they disappear?
- Bridge dependencies or wrapped asset exposure

**Overall Rating Justification:**
One paragraph explaining the externalDependencies rating. Reference the framework criteria:
- None: No external systems needed
- Decentralized: All external deps decentralized/constrained
- Mixed: Combination of decentralized and centralized elements
- Centralized: Critical reliance on centralized/unconstrained systems

## Economic Risk

**Liquidity Risk:**
- TVL and liquidity depth
- Concentration risk
- Exit liquidity under stress

**Operational History:**
- Launch date
- Cumulative volume or usage stats
- Exploit history (dates, amounts, response)
- Market stress survival

## Stage Assessment

**Stage X Criteria Met:**

Use ✓ for each Stage criterion the protocol satisfies, ⚠ for caveats that are noted but do NOT disqualify the stage (e.g., quality signals like missing formal verification, undisclosed multisig composition for non-fund-touching roles), and ✗ for criteria that would block a higher stage.

- ✓ [Upgradeability criterion] — [brief evidence]
- ✓ [Admin control criterion] — [brief evidence]
- ✓ [Fund access criterion] — [brief evidence]
- ✓ [External dependencies criterion] — [brief evidence]
- ✓ [Audits criterion] — [brief evidence]
- ✓ [Track record criterion] — [brief evidence]
- ⚠ [Caveat that does not disqualify the stage] — [brief explanation]

Example (Stage 2):
- ✓ Immutable fund-holding contracts — no proxy patterns on pool contracts
- ✓ Fund access impossible — no admin function can withdraw user liquidity; emergency powers limited to gauge actions that leave withdrawals open
- ✓ Self-contained — no external oracle, keeper, or off-chain dependency
- ✓ 2+ years of production with no smart-contract exploit
- ✓ Multiple audits from reputable firms
- ⚠ No formal verification and no Aerodrome-branded tier-1 audit on Slipstream (noted, does not disqualify)
- ⚠ Emergency Council composition undisclosed (powers cannot touch user funds — caveat only)

**Why Not Stage [X+1]:**
Use ✗ to list the specific criteria preventing a higher stage. Be precise about what would need to change. If the protocol is Stage 2, omit this section.

- ✗ [Specific blocker] — [what would need to change]

**Justification:**
Summary paragraph explaining the stage assignment. Anchor it to the guiding principle: *can the user's funds be taken, frozen, or made unrecoverable without their consent?* This should read as a verdict — not a description.

## Links

- [Official Website](https://example.com)
- [Documentation](https://docs.example.com)
- [GitHub](https://github.com/example)
- [Audit Reports](https://example.com/audits)
