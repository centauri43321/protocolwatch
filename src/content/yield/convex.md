---
name: "Convex Finance"
category: "yield"
stage: 1
website: "https://convexfinance.com"
chains: ["ethereum", "arbitrum", "polygon"]
tvl: "$721M"
lastUpdated: "2026-03-14"
risks:
  upgradeability: "immutable"
  adminControl: "multisig-diverse"
  fundAccess: "impossible"
  audits: "multiple"
  externalDependencies: "decentralized"
  trackRecord: "4+ years"
---

# Convex Finance Risk Assessment

## Overview

Convex Finance is a yield optimization protocol built on top of Curve Finance. It aggregates CRV staking power from multiple users, maximizing boost rewards without requiring individual users to lock CRV themselves. The CVX token captures protocol value, while vote-locked CVX (vlCVX) grants holders governance power over both Convex and Curve gauge weight allocations.

Convex controls approximately 47% of the total veCRV supply, making it a "kingmaker" in the Curve ecosystem. This concentration of voting power determines which Curve pools receive CRV emissions, driving significant bribery markets through platforms like Votium and Hidden Hand.

## Smart Contract Risk

**Contract Architecture:**
- Core contracts are immutable and non-upgradeable — no proxy patterns used
- When bugs are discovered, new contracts must be deployed and users migrate voluntarily (e.g., vlCVX contract abandoned and redeployed in March 2022 after a lock-related bug)
- Wrapper contracts for Curve LP positions (Booster, BaseRewardPool)
- cvxCRV for liquid staked CRV representation
- vlCVX for vote-locked governance participation
- Layered security through intermediate proxy contracts (poolManagerProxy, poolManagerSecondaryProxy, boosterOwner) that restrict admin functions to narrow scopes

**Code Quality:**
- Audited by MixBytes (April 2021), PeckShield (September 2022), Nomoi (January 2023), ChainSecurity (April 2023)
- OpenZeppelin responsible disclosure (December 2021) — identified critical vulnerability in multisig structure
- No formal verification performed
- Open source on GitHub
- Bug bounty program active (used Immunefi as intermediary)

**Attack Surface:**
- Deep dependency on Curve Finance contracts — exploits in Curve directly impact Convex
- Complex reward distribution mechanisms across multiple staking pools
- Gauge weight voting introduces governance attack vectors
- Known theoretical attack: fake gauge creation + shutdownPool(), mitigated by Curve's 30-day governance delay
- Large CVX concentration in few wallets (73%+) creates governance capture risk

## Admin/Governance Risk

**Governance Structure:**
- 3-of-5 multisig with publicly known, diverse signers (expanded after December 2021 OpenZeppelin disclosure)
- vlCVX holders vote on Curve gauge weights every 14 days
- vlCVX holders participate in Curve, Frax, f(x), and Convex governance proposals
- Lock period required for voting power

**Key Controls — Multisig CAN:**
- Update pool manager contracts via boosterOwner
- Control the arbitrator vault
- Manage reward stash contracts
- Change fee parameters within hard-coded ranges: treasury fee 0-2%, caller incentive 0.1-1.0%, maximum total fee 25%
- Execute shutdownPool() to disable individual pools or shutdownSystem() for full protocol shutdown

**Key Controls — Multisig CANNOT:**
- Access or withdraw user deposits
- Upgrade or modify core contracts (immutable)
- Change fee parameters outside hard-coded ranges
- Bypass intermediate proxy contract restrictions

**Trust Assumptions:**
- Users trust that the 3-of-5 multisig will not abuse shutdown capabilities or fee parameters
- Fee changes are bounded by immutable code — worst case is fees moving to the top of allowed ranges
- Shutdown capability is a meaningful admin power, but cannot be used to extract funds

## External Dependencies

**Oracle System:**
- No external price oracle dependencies
- Reward calculations based entirely on on-chain Curve gauge data
- Curve pool interactions use Curve's internal pricing mechanisms
- No oracle manipulation vectors

**Off-Chain Actors:**
- The `earmarkRewards()` function is fully permissionless — anyone can call it to harvest CRV rewards from Curve gauges and distribute them to Convex stakers
- Callers receive a 1% incentive of harvested rewards as gas reimbursement, creating a self-sustaining economic mechanism
- If the Convex team disappeared, the protocol would continue functioning — any party can call earmarkRewards() for profit
- No keeper, relayer, or sequencer dependencies

**Overall Rating Justification:**
Convex rates as `decentralized` for external dependencies. Its primary dependency is on Curve Finance, which is itself decentralized, immutable infrastructure. The critical earmarkRewards() harvest function is fully permissionless with economic incentives for third-party callers, requiring no centralized operator. There are no oracle dependencies, no off-chain keepers, and no bridge exposure. The Curve dependency is deep — if Curve experiences issues, Convex is directly affected (as demonstrated in July 2023) — but Curve itself meets decentralized infrastructure standards.

## Economic Risk

**Liquidity Risk:**
- TVL approximately $721M (peak ~$21B in January 2022)
- Deep liquidity in cvxCRV secondary markets
- vlCVX lock-up periods reduce circulating CVX supply
- Curve ecosystem health directly affects Convex TVL and yields
- 73% of CVX supply held by top wallets — significant governance capture risk
- Bribery markets (Votium, Hidden Hand) drive vlCVX value but concentrate influence

**Operational History:**
- Launched May 2021 — 4+ years of continuous operation
- Rapidly accumulated majority of veCRV voting power
- Survived multiple market cycles including the 2022 bear market
- Four notable incidents, none resulting in loss of Convex user funds from core contracts: December 2021 OpenZeppelin disclosure (critical multisig vulnerability, $15B at risk, never exploited, fixed by expanding to 3-of-5 multisig); March 2022 vlCVX lock bug (contract redeployed, ~20% CVX price crash, no fund loss); July 2023 Curve Vyper reentrancy exploit (Convex indirectly impacted via CRV price decline, no Convex contracts exploited); June 2025 Resupply exploit ($9.5M, downstream protocol, not Convex vulnerability, bad debt repaid)

## Stage Assessment

**Stage 1 Criteria Met:**
- ✓ Immutable, non-upgradeable core contracts — no proxy patterns or admin upgrade paths
- ✓ 3-of-5 diverse multisig with publicly known signers — not a single EOA or weak multisig
- ✓ No admin ability to access user deposits — fund access rated impossible
- ✓ Multiple security audits from independent firms (MixBytes, PeckShield, Nomoi, ChainSecurity)
- ✓ 4+ years of operational track record with no loss of user funds from core contracts

**Why Not Stage 2:**
- Multisig retains meaningful admin powers: fee changes within hard-coded ranges, pool and system shutdown capabilities
- Deep external dependency on Curve Finance — not a self-contained system
- Documented known attack vector (fake gauge + shutdown), mitigated but not eliminated by Curve's 30-day governance delay
- 73% CVX token concentration in top wallets creates governance capture risk
- No formal verification of contract code

**Justification:**
Convex achieves Stage 1 (Limited Trust) through its fully immutable contract architecture, the impossibility of admin fund access, and a 4+ year track record without loss of user funds from core contracts. The December 2021 vulnerability disclosure — while severe — was responsibly handled and resulted in stronger multisig governance. The primary trust assumptions relate to the multisig's bounded but real admin powers (shutdown, fee parameters) and the deep dependency on Curve infrastructure. Reaching Stage 2 would require eliminating multisig admin capabilities, reducing Curve dependency exposure, and addressing CVX governance concentration.

## Links

- [Official Website](https://convexfinance.com)
- [Documentation](https://docs.convexfinance.com)
- [GitHub](https://github.com/convex-eth)
- [Governance](https://vote.convexfinance.com)
- [Audit Reports](https://docs.convexfinance.com/convexfinance/faq/audits)
