# DeFi Protocol Research Guide

This guide contains everything a subagent needs to research, assess, and write a protocol risk assessment for ProtocolWatch. Follow it exactly. Your output must match the format in `template.md`. Don't forget to update the `lastUpdated` field for each file edited.

---

## Your Job

You are writing a risk assessment that answers **one question**:

> Can the user's deposited funds be taken, frozen, or made unrecoverable without the user's consent?

You are NOT writing a product review, an investment thesis, or a feature comparison. You are evaluating **custody trust** — who can rug, drain, freeze, or seize user funds, and what code-level constraints exist to prevent it.

---

## The Guiding Principle

The stage answers exactly one question (above). Everything else — audit count, formal verification, multisig disclosure, governance polish, renounced backstop roles, front-end security — is a **quality signal**. Quality signals belong in the body of the assessment as caveats. They do not, on their own, change the stage.

**This is the central calibration you must internalize:**

- A protocol whose fund-holding contracts are immutable and whose admin roles cannot touch user funds is **Stage 2**, even if its peripheral governance is opaque, its factory is upgradeable for *future* pools, or its team has not renounced a vetoer role that cannot drain funds.
- A protocol with a single but reputable audit on immutable, self-contained code with no admin fund access is **Stage 2** — audit prestige does not gate trustlessness.
- A protocol with five audits, formal verification, and a perfect governance structure that nonetheless allows admins to drain user funds via an emergency function is **Stage 0**.

`fundAccess` is the **gate**. Treat it as such.

---

## Stage System

Protocols are classified into three stages. **Stage determines the headline.** Everything else is supporting evidence.

### Stage 2 — Trustless

The user's funds are protected by code, not promises.

**ALL of the following must hold:**

1. **Immutable fund-holding contracts** — core contracts that custody user funds are immutable, OR upgradeable only via decentralized governance with a **≥7-day timelock** that cannot be bypassed.
2. **No admin path to user funds** — no role (admin, governance, guardian, emergency council, pauser, parameter manager) can withdraw, freeze, seize, or render user-deposited assets unrecoverable under any conditions. Pausing *new deposits* is acceptable; pausing *withdrawals* is not.
3. **No critical external dependency that can cause loss** — `externalDependencies` is `none` or `decentralized`.
4. **12+ months in production** with meaningful TVL and **no exploit of the core fund-holding contracts**.
5. **At least one credible independent audit** of the deployed code from a reputable firm.

**Caveats noted but NOT disqualifying for Stage 2** (flag these with ⚠ in the Stage Assessment, do not downgrade):
- Missing formal verification, missing bug bounty, or only one audit
- Undisclosed composition of multisigs whose powers cannot touch user funds
- Unrenounced backstop / vetoer / guardian roles that cannot drain funds
- Factory upgradeability where existing pool deposits remain in immutable contracts
- Front-end / DNS / domain-registrar incidents where smart contracts were unaffected
- Governance token concentration (does not change custody guarantees)

### Stage 1 — Limited Trust

Meaningful safeguards exist, but governance or admin retains powers that could indirectly affect user funds. Users have time to exit before harmful changes take effect.

**All of the following must hold:**

1. **≥48-hour timelock** on critical upgrades of fund-holding contracts, with no bypass path.
2. **Admin powers are scoped** — cannot directly drain user funds, but *could* indirectly affect them via a malicious upgrade after timelock, parameter changes (oracle source, LTV, liquidation thresholds), or withdrawal pauses.
3. **Admin control is decentralized governance or a 3-of-5+ diverse multisig** with independent signers.
4. **External dependencies are decentralized or have fallbacks**.
5. **6+ months in production**.
6. **At least one independent audit** from a reputable firm.

**Common Stage 1 patterns:** Governance-controlled upgradeable lending markets (Aave, Compound V3), liquid staking with DAO-curated operator sets (Lido), yield aggregators with governed strategy vaults.

### Stage 0 — Fully Assisted

**The default.** The protocol requires significant trust in centralized parties. This is not inherently bad — early-stage protocols, novel mechanisms, and CeDeFi designs may land here by design.

**Any one of the following triggers Stage 0:**
- Instant upgrades (or <48h timelock) possible on fund-holding contracts
- Admin can **directly** withdraw, freeze, or seize user funds
- Single EOA or weak multisig (e.g., 2-of-3, non-diverse) controls fund-touching functions
- Critical centralized external dependency with no fallback
- Less than 6 months in production, OR no public audit
- Recent unresolved smart-contract exploit of the core fund-holding logic

A protocol must clearly meet every Stage 1 criterion to advance.

---

## How to Decide a Stage (Decision Procedure)

Follow this order. **Do not skip ahead.**

### Step 1: Check fund access

Read the contracts and the governance docs. Identify every privileged role and write down what each can do to user funds. Then classify:

- **`possible`** — any admin role can directly move, freeze, or seize user funds → **Stage 0. Stop.**
- **`restricted`** — admin cannot directly drain, but can indirectly affect funds via upgrades, parameter changes, or withdrawal pauses → proceed to Step 2 for Stage 1 evaluation.
- **`impossible`** — no admin function (current or via upgrade) can touch user-deposited funds → proceed to Step 2 for Stage 2 evaluation.

### Step 2: Check immutability of the fund-custody surface

- **Immutable** OR **≥7d timelock with no bypass** + `fundAccess: impossible` → candidate for **Stage 2**.
- **≥48h timelock** + `fundAccess: restricted` → candidate for **Stage 1**.
- **Instant** or **<48h** → **Stage 0**.

### Step 3: Check external dependencies

- `none` or `decentralized` → Stage 2 still possible.
- `mixed` → maximum Stage 1.
- `centralized` (critical and unconstrained) → **Stage 0**.

### Step 4: Check track record and audits

- ≥12 months live, no core exploit, ≥1 reputable audit → Stage 2 possible.
- ≥6 months live, ≥2 reputable audits → Stage 1 possible.
- <6 months OR no audit → **Stage 0**.

### Step 5: Apply caveats

Identify quality concerns (audit gaps beyond the minimum, undisclosed governance details, unrenounced roles, factory upgradeability for future pools, front-end incidents). **List these as ⚠ caveats in the Stage Assessment section** — do not use them to downgrade the stage if Steps 1–4 cleared.

---

## Risk Dimensions

These are the six dimensions you must rate for every protocol.

### 1. Upgradeability

**Question:** Can the protocol's core fund-holding contracts be changed after deployment, and how much warning do users get?

| Value | Meaning | Stage Compatibility |
|-------|---------|---------------------|
| `immutable` | Cannot be upgraded by anyone | Stage 2 |
| `timelock-7d+` | Upgradeable with ≥7-day delay, no bypass | Stage 2 |
| `timelock-48h+` | Upgradeable with ≥48-hour delay, no bypass | Stage 1 |
| `instant` | No timelock, or bypass exists | Stage 0 only |

**Research checklist:**
- [ ] Are core fund-holding contracts behind proxies (TransparentProxy, UUPS, Beacon)?
- [ ] What is the timelock duration? Is it enforced on-chain or just policy?
- [ ] Can the timelock be bypassed (e.g., emergency functions that skip it)?
- [ ] Who can propose upgrades? Who can execute after timelock?

**Common pitfalls:**
- A 7-day timelock with an emergency admin that can bypass it is `instant`, not `timelock-7d+`.
- Timelocks on parameter changes don't count unless they also cover contract upgrades.
- Distinguish *factory* upgradeability (affects future pools only) from *fund-holding contract* upgradeability (affects existing deposits). The former is a caveat, not a stage-determining factor.

### 2. Admin Control

**Question:** Who holds the keys to privileged protocol functions?

| Value | Meaning | Stage Compatibility |
|-------|---------|---------------------|
| `none` | No admin, owner, or governance | Stage 2 |
| `governance` | Decentralized token-holder governance | Stage 1 or 2 |
| `multisig-diverse` | 3-of-5+ diverse, independent signers | Stage 1 (Stage 2 if powers cannot touch funds) |
| `multisig-weak` | Low threshold (2-of-3) or non-diverse | Stage 0 (unless powers cannot touch funds) |
| `eoa` | Single externally owned account | Stage 0 (unless powers cannot touch funds) |

**Note:** A weak multisig or EOA that controls *only* roles which cannot touch user funds (e.g., cosmetic parameters, fee receiver address) does not by itself force Stage 0. Always map each role's *capability*, not just its existence.

**Research checklist:**
- [ ] What is the admin address? (Check Etherscan / block explorer)
- [ ] If multisig: threshold, signer count, signer independence
- [ ] If governance: token, quorum, proposal lifecycle, timelock
- [ ] Map every privileged role and what each can actually do to user funds

### 3. Fund Access — THE GATE

**Question:** Can anyone other than the depositor move, freeze, or render user funds unrecoverable?

| Value | Meaning | Stage Compatibility |
|-------|---------|---------------------|
| `impossible` | No path (direct or via upgrade) lets any role touch user funds | Stage 2 eligible |
| `restricted` | Indirect risk via upgrades/parameters, no direct drain | Stage 1 |
| `possible` | Admin can directly access user funds | Stage 0 |

**Research checklist:**
- [ ] Does any admin function allow withdrawing from user pools/vaults?
- [ ] Can an upgrade introduce a drain function? (If contracts are upgradeable, the answer to fund access is gated by the upgrade controls — see below.)
- [ ] Are there emergency withdrawal functions? Who can trigger them?
- [ ] Can admin pause **withdrawals** (fund freezing)? Or only new deposits?
- [ ] Can parameters be set to values that effectively confiscate funds (e.g., 100% fee, oracle pointing to zero)?

**How upgradeability interacts with fund access:**
- Immutable contracts + no direct admin drain → `impossible`.
- Upgradeable contracts with **≥7d timelock + decentralized governance** + no direct drain → `impossible` (the upgrade path exists but is constrained enough that we treat it as outside the trust assumption).
- Upgradeable contracts with **48h timelock** + no direct drain → `restricted` (upgrade could add drain logic; users have an exit window).
- Upgradeable contracts with **instant upgrade** + no direct drain → `possible` (an instant upgrade can add drain logic with no warning).

**Common pitfalls:**
- "Emergency pause" that only stops new deposits is fundamentally different from one that blocks withdrawals. The latter is `restricted` at best.
- Lending protocols where admin can change oracle sources: a malicious oracle could trigger unfair liquidations → `restricted`, not `impossible`.
- "Kill gauge" / "deactivate market" functions that halt new activity but leave existing withdrawals open → does NOT make fund access `restricted` if users can still withdraw principal.

### 4. Audits

**Question:** Has the deployed code been independently reviewed by reputable firms?

| Value | Meaning | Stage Compatibility |
|-------|---------|---------------------|
| `extensive` | Multiple top-tier audits + formal verification | Stage 2 |
| `multiple` | 2+ independent audits from reputable firms | Stage 1 or 2 |
| `single` | One audit from a reputable firm | Stage 1 or 2 (if other criteria clear) |
| `none` | No public audit | Stage 0 |

**Reputable firms include (non-exhaustive):** Trail of Bits, OpenZeppelin, Certora, Spearbit, Runtime Verification, Sigma Prime, ChainSecurity, Cantina, Code4rena (competitive), Sherlock.

**Research checklist:**
- [ ] Which firms audited? When?
- [ ] Do the audits cover the currently deployed code, or older versions?
- [ ] Was formal verification performed? On which components?
- [ ] Is there an active bug bounty? Platform? Max payout?
- [ ] Were audit findings resolved?

**Important calibration:**
- A *single* audit from a reputable firm is **sufficient for Stage 2** if the fund-custody surface is immutable, fund access is impossible, external deps are none/decentralized, and the protocol has 12+ months of clean track record. Audits are a *minimum quality bar*, not the gate.
- A protocol with multiple audits but `fundAccess: possible` is still **Stage 0**.

### 5. External Dependencies

**Question:** What external systems does this protocol trust, and how constrained are they?

| Value | Meaning | Stage Compatibility |
|-------|---------|---------------------|
| `none` | No oracles, keepers, or off-chain actors | Stage 2 |
| `decentralized` | All external deps are decentralized/bonded | Stage 1 or 2 |
| `mixed` | Some decentralized, some centralized | Stage 1 at best |
| `centralized` | Critical reliance on centralized systems | Stage 0 |

This dimension merges what were formerly separate **Oracle** and **Off-Chain Dependency** fields. Assess them together as a single trust surface.

**Research checklist — Oracle:**
- [ ] What oracle? (Chainlink, internal TWAP, Pyth, API3, custom, centralized API, none)
- [ ] Fallback oracle? Update frequency? Deviation threshold?
- [ ] Can governance change the oracle source? Under what controls?

**Research checklist — Off-chain actors:**
- [ ] Does core functionality require keepers, relayers, sequencers, or node operators?
- [ ] What happens if those actors disappear? Can users still withdraw?
- [ ] Are off-chain actors bonded with slashable collateral?
- [ ] Is there a decentralized, on-chain-governed process to eject misbehaving actors?

**Research checklist — Bridges and wrapped assets:**
- [ ] Does the protocol accept bridged tokens as collateral?
- [ ] What bridge secures those assets? Trust-minimized?
- [ ] Are there supply caps or isolation modes that limit bridge exposure?

**Combining oracle + off-chain into a single rating:**

| Oracle | Off-Chain Actors | Combined Rating |
|--------|-----------------|-----------------|
| None | None | `none` |
| Decentralized (Chainlink, TWAP) | None or bonded/governed | `decentralized` |
| Decentralized | Unbonded but governed (DAO-curated) | `mixed` |
| Centralized | None | `mixed` |
| Decentralized | Critical, unbonded, ungoverned | `mixed` or `centralized` |
| Centralized | Critical, unbonded | `centralized` |

**Common pitfalls:**
- Chainlink is "decentralized" but governance can swap oracle sources — note this as a caveat.
- "Keeper" may be permissionless (anyone can call) vs. permissioned (only whitelisted) — big difference.
- Reputational risk alone (known operators, no slashing) does NOT qualify as "constrained" — must have economic bonding or decentralized removal.
- Front-ends, dashboards, and UIs are out of scope of *this* dimension (covered as caveats elsewhere). Only core contract functionality matters here.

### 6. Track Record

**Question:** How long has the protocol operated in production with real economic value at stake, and has its core custody been exploited?

Track record is **free text**, not an enum.

| Duration | Track Record Compatibility |
|----------|---------------------------|
| 12+ months with significant TVL | Stage 2 eligible |
| 6+ months in production | Stage 1 eligible |
| < 6 months | Stage 0 |

**Important:** Exploits of **peripheral, governance-token, or front-end systems** that did NOT touch core fund custody do not disqualify higher stages. Note them in the track-record field, but they are not stage-determining. Exploits of the **core fund-holding contracts** are stage-determining and should drop the protocol to Stage 0 until resolved and re-audited.

Format exploit references as: "2+ years, July 2025 exploit ($42M, core lending pool, post-mortem published)" — include date, scope, and whether the core was affected.

**Research checklist:**
- [ ] Mainnet launch date
- [ ] Peak and current TVL
- [ ] Any exploits? Dated. Did they touch the core fund-holding contracts?
- [ ] Near-misses or white-hat disclosures
- [ ] Has it survived major market stress events?

---

## Research Process

Follow this order. Each step builds on the previous.

### Step 1: Identify the Protocol
- Official website, documentation, GitHub repos
- Which chain(s)?
- Category (DEX, lending, liquid staking, bridge, derivatives, yield)
- Version (V1, V2, V3 — assess each separately; set `baseName` for multi-version groups)

### Step 2: Smart Contract Architecture
- Read the docs section on architecture/contracts
- Identify core fund-holding contracts vs. periphery
- Determine upgrade mechanism (proxy type, timelock, who owns)
- Note which components are immutable vs. upgradeable

### Step 3: Admin and Governance — map every privileged role
- Find the admin/owner address of core contracts
- For each privileged role: who controls it, and what *exactly* can it do to user funds?
- If multisig: threshold, signers, independence
- If governance: token, quorum, proposal lifecycle, timelock enforcement

### Step 4: Security Audits
- Protocol's security page or GitHub audits folder
- Verify reports are public and match deployed code
- Check Immunefi or other bug bounty platforms
- Note any formal verification

### Step 5: External Dependencies
- Oracle sources (check contract code or docs)
- Off-chain actors and their bonding/governance
- Bridge or wrapped-asset exposure

### Step 6: Track Record
- Mainnet launch date
- Exploit history (rekt.news, DeFiLlama hacks, protocol post-mortems) — distinguish core vs. peripheral
- DeFiLlama for TVL history

### Step 7: Stage Classification
- Run the Decision Procedure above (Steps 1–5)
- Default to Stage 0
- Write the Stage Assessment using ✓ for met criteria, ⚠ for caveats that do not disqualify, ✗ for criteria that block a higher stage. Examples:
  - `✓ Immutable core contracts — no upgrade capability, no proxy patterns`
  - `✓ No admin path to user funds — emergency council can kill gauges but cannot block withdrawals`
  - `⚠ Audit scope: single reputable audit, no formal verification (does not disqualify Stage 2)`
  - `✗ Centralized oracle with no fallback — blocks Stage 1`

---

## Output Format

Your output must be a complete Markdown file matching the format in `template.md`:

```
---
name: "Protocol Name"
baseName: "Base Name"  # Only if multi-version
category: "category"
stage: X
website: "https://..."
chains: ["ethereum", ...]
tvl: "$X.XB"
lastUpdated: "YYYY-MM-DD"
risks:
  upgradeability: "value"
  adminControl: "value"
  fundAccess: "value"
  audits: "value"
  externalDependencies: "value"
  trackRecord: "free text"
---

# Protocol Name Risk Assessment

## Overview
## Smart Contract Risk
## Admin/Governance Risk
## External Dependencies
## Economic Risk
## Stage Assessment
## Links
```

See `template.md` for the full section structure with subsection headings and bullet prompts.

---

## Quality Standards

### Tone
- **Analytical, not promotional.** Never use words like "innovative", "revolutionary", "cutting-edge".
- **Precise, not vague.** "2-of-3 multisig" not "small multisig". "$42M exploit" not "major incident".
- **Neutral, not opinionated.** Report facts. Let the framework's stage system render the judgment.
- State the rating and justify it with evidence. Don't hedge.

### Evidence Rules
- Every claim must be traceable to a source (contract address, audit report, documentation, governance proposal).
- If you cannot verify a claim, say "unverified" or "could not confirm".
- Do not assume. If you can't find the timelock duration, mark it as unknown and default to the conservative rating.
- When in doubt about *fund access* specifically, rate conservatively — it is the gate.

### Frontmatter Rules
- `category` must match the directory name: `dexes`, `lending`, `liquid-staking`, `bridges`, `derivatives`, `yield`, `privacy`
- `stage` is a number (0, 1, or 2)
- `chains` uses lowercase: `["ethereum", "arbitrum", "polygon", "optimism", "base", "avalanche"]`
- `tvl` format: `"$X.XB"` or `"$XM"`
- `lastUpdated` is the date you wrote the assessment, ISO format
- `risks.trackRecord` is free text; all others are enums

### Content Guidelines
- **Overview**: 2 paragraphs — one-sentence summary, then longer explanation
- **Smart Contract Risk**: architecture, code quality, attack surface
- **Admin/Governance Risk**: governance structure, key controls per role, trust assumptions
- **External Dependencies**: unified section covering oracles, keepers, bridges, off-chain actors
- **Economic Risk**: liquidity and operational history
- **Stage Assessment**: use ✓ for met criteria with brief evidence, ⚠ for caveats that do not disqualify, ✗ for blockers preventing a higher stage. End with a one-paragraph **Justification**.

### What NOT to Do
- Do not downgrade a stage based on quality signals (audit prestige, governance opacity, unrenounced backstop roles) when those concerns cannot touch user funds. **Flag as caveats, do not downgrade.**
- Do not copy-paste from protocol marketing materials.
- Do not write "N/A" for any risk dimension.
- Do not assess governance tokens as investment opportunities.
- Do not speculate about future upgrades or roadmap items — assess current state only.
- Do not treat "decentralized governance" as automatically safe — check quorum, voter concentration, timelock enforcement.
- Do not conflate "open source" with "audited".

---

## Reference: Valid Frontmatter Values

```yaml
category: dexes | lending | liquid-staking | bridges | derivatives | yield | privacy
stage: 0 | 1 | 2

risks.upgradeability: immutable | timelock-7d+ | timelock-48h+ | instant
risks.adminControl: none | governance | multisig-diverse | multisig-weak | eoa
risks.fundAccess: impossible | restricted | possible
risks.audits: extensive | multiple | single | none
risks.externalDependencies: none | decentralized | mixed | centralized
risks.trackRecord: (free text)
```

---

## Reference: Calibration Examples

Use these as anchors when assessing a new protocol.

| Protocol | Stage | Upgradeability | Admin | Fund Access | Audits | Ext. Deps | Why |
|----------|-------|----------------|-------|-------------|--------|-----------|-----|
| Uniswap V2 | 2 | immutable | governance | impossible | extensive | none | Immutable AMM; governance (fee switch) cannot touch deposits, no oracles |
| Uniswap V3 | 2 | immutable | governance | impossible | extensive | none | Immutable pools; governance cannot touch deposits |
| Aerodrome | 2 | immutable | governance | impossible | multiple | none | Immutable pools; Emergency Council can kill gauges but cannot block withdrawals |
| Aave V3 | 1 | timelock-48h+ | governance | restricted | extensive | mixed | Upgradeable; oracle changes could affect liquidations |
| Compound V3 | 1 | timelock-48h+ | governance | restricted | extensive | decentralized | Upgradeable with timelock |
| Lido | 1 | timelock-48h+ | governance | restricted | extensive | mixed | DAO-curated operator set is unbonded |
| MakerDAO | 1 | timelock-48h+ | governance | restricted | extensive | mixed | Upgradeable, oracle-dependent |
| Ethena | 0 | timelock-48h+ | multisig-weak | restricted | extensive | centralized | Centralized custody of backing collateral |
| GMX | 0 | instant | eoa | restricted | extensive | mixed | Instant upgrades + EOA admin + centralized keeper |

**Note on Uniswap V2 / Aerodrome / similar:** These earn Stage 2 because their fund-custody surface is immutable and no admin role can touch user deposits. Caveats (Uniswap V2 has no formal verification of the original Solidity; Aerodrome's Slipstream lacks a tier-1 Aerodrome-branded audit and the Emergency Council composition is undisclosed) are noted in the assessment but do not downgrade the stage.

---

## File Placement

Save your completed assessment to:
```
src/content/{category}/{slug}.md
```

The file automatically appears on the site. The Zod schema in `src/content/config.ts` validates your frontmatter at build time.
