# DeFi Risk Assessment Framework

This framework provides a systematic approach to evaluating DeFi protocols based on their level of decentralization, security practices, and trust assumptions. Inspired by L2Beat's approach to Layer 2 solutions, we categorize protocols into three stages based on objective criteria.

## Guiding Principle

The stage answers **one question**:

> Can the user's deposited funds be taken, frozen, or made unrecoverable without the user's consent?

Everything else — audit count, audit firm prestige, formal verification, multisig disclosure, governance polish, renounced backstop roles, front-end security — is a **quality signal**. Quality signals belong in the body of the assessment as caveats. They do not, on their own, change the stage.

A protocol whose fund-holding contracts are immutable and whose admin roles cannot touch user funds is **trustless with respect to its custody guarantee**, even if its peripheral governance is undisclosed, its factory is upgradeable for *future* pools, or its team has not renounced a vetoer role that cannot drain funds.

---

## Stage System Overview

Protocols are evaluated across multiple dimensions and assigned to one of three stages. Higher stages indicate lower trust requirements for the custody of user funds.

---

### Stage 2 — Trustless

The user's funds are protected by code, not promises. A compromised or malicious admin cannot take user assets.

**All of the following must hold:**

1. **Immutable fund-holding contracts** — core contracts that custody user funds are immutable, OR upgradeable only via decentralized governance with a ≥7-day timelock that cannot be bypassed.
2. **No admin path to user funds** — no role (admin, governance, guardian, emergency council, pauser, parameter manager) can withdraw, freeze, seize, or render user-deposited assets unrecoverable under any conditions. Pausing *new deposits* is acceptable; pausing *withdrawals* is not.
3. **No critical external dependency that can cause loss** — self-contained, OR all external dependencies are decentralized/bonded such that no single off-chain entity's failure or malice can take user funds.
4. **12+ months in production** with meaningful TVL and **no exploit of the core fund-holding contracts** (peripheral, front-end, or governance-token incidents that did not touch user funds in the core contracts do not disqualify).
5. **At least one credible independent audit** of the deployed code from a reputable firm.

**Caveats noted but NOT disqualifying for Stage 2:**
- Missing formal verification or bug bounty
- Single audit (one is enough if the firm is reputable and the code is immutable)
- Undisclosed composition of multisigs whose powers cannot touch user funds
- Unrenounced backstop / vetoer / guardian roles that cannot drain funds
- Factory upgradeability where existing pool deposits remain in immutable contracts
- Front-end, DNS, or domain-registrar incidents where smart contracts were unaffected
- Governance token concentration (does not change custody guarantees)

---

### Stage 1 — Limited Trust

Meaningful safeguards exist, but governance or admin retains powers that could indirectly affect user funds. Users have time to exit before harmful changes take effect.

**All of the following must hold:**

1. **≥48-hour timelock** on critical upgrades of fund-holding contracts, with no bypass path.
2. **Admin powers are scoped** — cannot directly drain user funds, but *could* indirectly affect them via:
   - A malicious upgrade pushed after timelock
   - Parameter changes that affect fund recoverability (oracle source, LTV, interest model, liquidation thresholds)
   - Temporary withdrawal pauses
3. **Admin control is decentralized governance or a 3-of-5+ diverse multisig** with independent signers.
4. **External dependencies are decentralized or have fallbacks** — no single off-chain actor with unilateral power to cause loss.
5. **6+ months in production** operation.
6. **At least one independent audit** from a reputable firm.

**Common Stage 1 patterns:** Governance-controlled upgradeable lending markets (Aave, Compound V3), liquid staking with DAO-curated operator sets (Lido), yield aggregators with governed strategy vaults.

---

### Stage 0 — Fully Assisted

The user must trust centralized parties or admin mechanisms with the safety of their funds. This is **the default** — a protocol must earn its way out by clearly meeting Stage 1 criteria.

**Any one of the following triggers Stage 0:**

- Instant upgrades (or <48h timelock) possible on fund-holding contracts
- Admin can **directly** withdraw, freeze, or seize user funds
- Single EOA or weak multisig (e.g., 2-of-3, non-diverse) controls fund-touching functions
- Critical centralized external dependency with no fallback (centralized oracle, unbonded operator, third-party off-chain service)
- Less than 6 months in production, OR no public audit
- Recent unresolved smart-contract exploit of the core fund-holding logic

---

## Risk Dimensions

Each protocol is evaluated across six dimensions. The combination of these factors, judged against the guiding principle above, determines the stage.

| Dimension | Description | Key Questions |
|-----------|-------------|---------------|
| **Upgradeability** | How and when core contracts can be modified | Are contracts immutable? What timelock delays exist? Who can upgrade? Can the timelock be bypassed? |
| **Admin Control** | Who controls privileged functions | DAO governance, multisig, or EOA? How distributed are signers? |
| **Fund Access** | Can admins access user funds | Can anyone other than the depositor move, freeze, or redirect user funds? Under what conditions? |
| **Audits** | Security review depth | Has the deployed code been independently reviewed by a reputable firm? |
| **External Dependencies** | What external systems the protocol trusts | Oracle type? Off-chain actors bonded/governed? Bridge or wrapped-asset risk? |
| **Track Record** | Time in production with real value | How long operating? Any exploits affecting core fund custody? |

### Fund Access — the gate

Fund access is the **single most important dimension**. A protocol with `fundAccess: impossible` and `upgradeability: immutable` cannot be downgraded below Stage 2 by audit gaps, governance opacity, or peripheral concerns — because no human party can take the user's funds regardless of those concerns.

Conversely, `fundAccess: possible` is an automatic Stage 0 trigger no matter how prestigious the audits or how decentralized the governance: if an admin can drain you, you are trusting that admin.

| Rating | Description |
|--------|-------------|
| **Impossible** | No admin function can move, freeze, or redirect user funds. Only the depositor (or an authorized liquidator) can affect a position. Even a compromised admin key cannot touch user assets. |
| **Restricted** | Admin cannot *directly* withdraw, but could indirectly affect funds via upgrade mechanisms, parameter changes, or emergency pauses. A malicious upgrade could introduce drain logic — the risk is real but requires multiple steps or conspicuous on-chain actions. Typically a Stage 1 pattern. |
| **Possible** | An admin path exists to directly withdraw, freeze, or seize user funds. Automatic Stage 0 trigger. |

### External Dependencies — merged dimension

Evaluates how much the protocol relies on external systems — oracle feeds, off-chain operators, bridges, or third-party infrastructure — and how constrained those systems are.

| Rating | Description |
|--------|-------------|
| **None** | No external dependencies. Price discovery, execution, and settlement happen on-chain. No oracles, keepers, or off-chain actors needed. |
| **Decentralized** | External dependencies exist but are all decentralized/well-constrained. Oracle feeds from decentralized networks (Chainlink, TWAP). Off-chain actors are bonded with slashable collateral or governed by on-chain processes. |
| **Mixed** | Mix of decentralized and centralized elements. E.g., decentralized oracles alongside critical off-chain actors that are governed but not fully constrained. |
| **Centralized** | Critical reliance on centralized or unconstrained external systems. The protocol relies on trust alone — centralized oracle, unbonded operators, or third-party services with no fallback. |

---

## Methodology

### Research Process

Each protocol assessment involves:

- Review of smart contract code and architecture
- Identification of all privileged roles and what they can/cannot do to user funds
- Analysis of governance and admin mechanisms
- Examination of security audits and formal verification
- Historical analysis of upgrades, incidents, and exploits
- Review of oracle dependencies and external integrations

### What the Framework Does NOT Capture

This framework focuses on **custody trust** — whether user funds are safe from the protocol itself. It does not fully capture:

- Economic attacks and game theory risks
- Composability risks with other protocols
- User interface, front-end, and operational security (assessed separately as a caveat)
- Regulatory or legal risks
- Market and liquidity risks

### Updates

Assessments are updated when protocols undergo significant changes such as major upgrades, governance transitions, or security incidents. Each assessment includes a "Last Updated" timestamp.

## Contributing

This is an open framework. If you believe an assessment is inaccurate or outdated, please submit corrections with supporting evidence. The goal is objective, community-verified risk information to help users make informed decisions.
