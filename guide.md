# DeFi Risk Site - Content Guide

## Overview

This site uses Astro's content collections. All protocol data lives in Markdown files with YAML frontmatter. The frontend automatically reads these files and renders them. No database, no CMS — edit a `.md` file and the site updates.

For detailed research methodology and how to write a new assessment, see `RESEARCH_GUIDE.md`.
For the assessment content template, see `template.md`.

## File Structure

```
src/content/
├── config.ts              # Zod schema (validates all .md frontmatter)
├── pages/                 # Static pages (home, framework)
├── dexes/                 # DEX protocols
│   ├── uniswap-v1.md
│   ├── uniswap-v2.md
│   ├── uniswap-v3.md
│   ├── uniswap-v4.md
│   ├── balancer.md
│   └── curve.md
├── lending/               # Lending protocols
│   ├── aave-v1.md
│   ├── aave-v2.md
│   ├── aave-v3.md
│   ├── compound-v1.md
│   ├── compound-v2.md
│   ├── compound-v3.md
│   ├── makerdao.md
│   ├── morpho.md
│   └── spark.md
├── liquid-staking/        # Liquid staking protocols
│   ├── lido.md
│   ├── rocket-pool.md
│   ├── etherfi.md
│   ├── eigenlayer.md
│   └── frax.md
├── bridges/               # Bridge protocols (no content yet)
├── derivatives/           # Derivatives protocols
│   ├── dydx.md
│   └── gmx.md
└── yield/                 # Yield protocols
    ├── convex.md
    ├── ethena.md
    ├── instadapp.md
    ├── pendle.md
    └── yearn.md
```

## How Data Flows

```
.md file (frontmatter + content)
        ↓
config.ts validates the schema with Zod
        ↓
Astro reads via getCollection()
        ↓
Pages render the data (homepage table, category pages, protocol detail pages, sidebar)
```

## Adding a New Protocol

1. Create a new `.md` file in the appropriate category folder
2. The filename becomes the URL slug (e.g., `aave-v3.md` → `/lending/aave-v3`)
3. Add the required frontmatter (see below)
4. Write the assessment content following the structure in `template.md`
5. The protocol auto-appears in the homepage table, category listing, sidebar, and search

For full research methodology and quality standards, see `RESEARCH_GUIDE.md`.

## Frontmatter Reference

Every protocol file must have this frontmatter structure:

```yaml
---
name: "Protocol Name"           # Display name (e.g., "Uniswap V3")
baseName: "Base Name"           # Optional — groups multi-version protocols in sidebar (e.g., "Uniswap")
category: "lending"             # Must match folder: dexes, lending, liquid-staking, bridges, derivatives, yield
stage: 2                        # 0 (Fully Assisted), 1 (Limited Trust), or 2 (Trustless)
website: "https://example.com"  # Must be valid URL
chains: ["ethereum", "arbitrum"] # Lowercase chain names
tvl: "$1.5B"                    # Optional — auto-updated daily by scripts/update-tvl.mjs
lastUpdated: "2026-01-20"       # ISO date of last human assessment
risks:
  upgradeability: "immutable"   # immutable | timelock-7d+ | timelock-48h+ | instant
  adminControl: "governance"    # governance | multisig-diverse | multisig-weak | eoa
  fundAccess: "impossible"      # impossible | restricted | possible
  audits: "extensive"           # extensive | multiple | single | none
  externalDependencies: "none"  # none | decentralized | mixed | centralized
  trackRecord: "4+ years"       # Free text (duration + notable events)
---
```

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `baseName` | string | Groups protocol versions in sidebar dropdown (e.g., all Uniswap versions share `baseName: "Uniswap"`) |
| `tvl` | string | Total Value Locked. Auto-updated daily by `scripts/update-tvl.mjs` — manual edits will be overwritten |
| `logo` | string | Path to logo image |

### Protocol Version Grouping

Protocols with multiple versions (Uniswap V1-V4, Aave V1-V3, Compound V1-V3) are grouped in the sidebar using `baseName`:

```yaml
# In uniswap-v3.md
baseName: "Uniswap"  # Groups with V1, V2, V4 under a collapsible dropdown
```

All files sharing the same `baseName` appear under a single expandable group. State persists across navigation via localStorage. If `baseName` is omitted, the protocol appears as a standalone sidebar entry.

## Risk Field Values

### upgradeability
| Value | Meaning | Badge Color |
|-------|---------|-------------|
| `immutable` | Cannot be upgraded by anyone | Green (Good) |
| `timelock-7d+` | 7+ day delay before upgrades take effect | Green (Good) |
| `timelock-48h+` | 48h+ delay before upgrades take effect | Yellow (Warning) |
| `instant` | No timelock — immediate upgrades possible | Red (Bad) |

### adminControl
| Value | Meaning | Badge Color |
|-------|---------|-------------|
| `governance` | Decentralized token-holder governance | Green (Good) |
| `multisig-diverse` | Multisig with 3-of-5+ diverse, independent signers | Yellow (Warning) |
| `multisig-weak` | Low threshold or non-diverse signers (e.g., 2-of-3) | Yellow (Warning) |
| `eoa` | Single externally owned account | Red (Bad) |

### fundAccess
| Value | Meaning | Badge Color |
|-------|---------|-------------|
| `impossible` | No admin function can move/freeze user funds | Green (Good) |
| `restricted` | Indirect risk via upgrades/parameters, no direct drain | Yellow (Warning) |
| `possible` | Admin can directly access user funds | Red (Bad) |

### audits
| Value | Meaning | Badge Color |
|-------|---------|-------------|
| `extensive` | Multiple audits from top firms + formal verification | Green (Good) |
| `multiple` | 2+ independent audits from reputable firms | Green (Good) |
| `single` | One audit only | Yellow (Warning) |
| `none` | No public audit | Red (Bad) |

### externalDependencies
| Value | Meaning | Badge Color |
|-------|---------|-------------|
| `none` | No oracles, keepers, or off-chain actors needed | Green (Good) |
| `decentralized` | All external deps are decentralized and well-constrained | Green (Good) |
| `mixed` | Some decentralized, some centralized dependencies | Yellow (Warning) |
| `centralized` | Critical reliance on centralized/unconstrained external systems | Red (Bad) |

### trackRecord
Free text field. Examples:
- `"4+ years"` — long production history, no incidents
- `"3+ years"` — established but shorter history
- `"2 years, July 2025 exploit ($42M)"` — include notable incidents
- `"< 6 months"` — newly launched

## Stage Definitions

**Guiding principle:** The stage answers one question — *can the user's deposited funds be taken, frozen, or made unrecoverable without the user's consent?* Audit count, governance polish, multisig disclosure, and front-end security are quality signals (caveats in the body of the assessment), not stage gates. `fundAccess` is the gate.

### Stage 2 — Trustless
The user's funds are protected by code, not promises. **All must hold:**
- Fund-holding contracts immutable, OR upgradeable only via decentralized governance with ≥7-day timelock (no bypass)
- No admin role can withdraw, freeze, seize, or block withdrawals of user funds
- External dependencies are `none` or `decentralized`
- 12+ months in production, no exploit of the core fund-holding contracts
- At least one credible independent audit from a reputable firm

Caveats (missing formal verification, single audit, undisclosed multisig composition for non-fund-touching roles, unrenounced backstop roles that cannot drain funds, factory upgradeability for future pools, front-end incidents) are noted in the assessment but do **not** downgrade the stage.

### Stage 1 — Limited Trust
Meaningful safeguards exist; governance/admin retains powers that could indirectly affect user funds. **All must hold:**
- ≥48-hour timelock on critical upgrades, no bypass
- Admin powers scoped — no direct fund drain, indirect risk via upgrades/parameter changes acceptable
- Admin control via governance or 3-of-5+ diverse multisig
- External dependencies decentralized or have fallbacks
- 6+ months production, at least 1 independent audits

### Stage 0 — Fully Assisted
**Default stage.** Any one trigger is sufficient:
- Admin can directly access user funds
- Instant upgrades / <48h timelock on fund-holding contracts
- EOA or weak multisig controls fund-touching functions
- Critical centralized external dependency with no fallback
- No public audit, OR <6 months in production
- Recent unresolved core fund-custody exploit

## Content Section Structure

Protocol assessment content (below frontmatter) follows this structure. See `template.md` for the full template with subsection prompts:

```markdown
# Protocol Name Risk Assessment
## Overview
## Smart Contract Risk
## Admin/Governance Risk
## External Dependencies
## Economic Risk
## Stage Assessment
## Links
```

The **External Dependencies** section covers both oracle systems and off-chain actors (keepers, operators, bridges) as a unified trust surface. This replaces the old separate "Oracle Risk" and "Off-Chain Dependencies" sections.

## TVL Auto-Update

TVL values are updated daily by `scripts/update-tvl.mjs`:
- Fetches from DeFiLlama's public API (no key needed)
- Patches the `tvl` frontmatter field in each protocol file
- Run manually: `node scripts/update-tvl.mjs`
- Protocol-to-slug mapping is maintained in the script

The `lastUpdated` field is NOT changed by TVL updates — it reflects the last human assessment date.

## Editing Content

### Change protocol metadata
Edit the frontmatter in the `.md` file. Changes appear immediately in dev mode.

### Update risk assessment text
Edit the Markdown content below the frontmatter. Standard Markdown is supported:
- Headings (`## Section`)
- Lists (`- item`)
- Bold (`**text**`)
- Links (`[text](url)`)
- Tables

### Add a new category
1. Create directory in `src/content/`
2. Add to enum in `src/content/config.ts` and to collections export
3. Update `BaseLayout.astro` to fetch the new collection
4. Update `[category]/index.astro` getStaticPaths with category metadata

## Where Data Appears

| Frontmatter Field | Where It Shows |
|-------------------|----------------|
| `name` | Protocol card, page title, sidebar, search |
| `baseName` | Sidebar grouping (collapsible dropdown) |
| `stage` | Stage badge on cards, table, and protocol page |
| `tvl` | Homepage table and protocol page |
| `chains` | Chain badges on cards and protocol page |
| `risks.*` | Risk summary table on protocol page |
| `lastUpdated` | Homepage table and protocol page |
| Markdown content | Protocol detail page body |

## Validation

The Zod schema in `config.ts` validates all frontmatter at build time. If validation fails:
- Dev server shows an error with the specific field
- Build fails with details about which field is wrong

Common errors:
- Missing required field
- Invalid enum value (e.g., `audits: "many"` instead of `audits: "multiple"`)
- Invalid URL format for `website`
- `category` doesn't match folder name
- Using old field names (`oracle` instead of `externalDependencies`)

## Related Files

| File | Purpose |
|------|---------|
| `RESEARCH_GUIDE.md` | Comprehensive guide for researching and writing protocol assessments |
| `template.md` | Blank template with all sections and prompts |
| `framework.md` | Stage system overview and dimension definitions (research context) |
| `guide.md` | This file — quick reference for content structure |
| `src/content/config.ts` | Zod schema that validates frontmatter |
| `scripts/update-tvl.mjs` | Daily TVL update script (DeFiLlama API) |
