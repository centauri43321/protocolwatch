# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeFi Risk Assessment Framework - a static website built with Astro that evaluates DeFi protocols using a 3-stage risk framework (Stage 0: Fully Assisted → Stage 1: Limited Trust → Stage 2: Trustless). Inspired by L2Beat.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Workflow Orchestration

### 1. Plan Mode Default
Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents often to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes, when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "Is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:4321
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run update-tvl   # Refresh TVL values (scripts/update-tvl.mjs)
```

No linting or test scripts are configured.

## Architecture

**Stack:** Astro 5.x, TypeScript, Markdown, Tailwind CSS v4 (via `@tailwindcss/vite`), `@astrojs/sitemap`

**Content-driven static site:** All protocol data lives in Markdown files with YAML frontmatter. No database.

### Key Directories

- `src/content/` - Protocol assessments as Markdown files, organized by category (dexes, lending, liquid-staking, bridges, derivatives, yield, privacy)
- `src/content/pages/` - Editorial page content (`home.md`, `framework.md`) in the separate `pages` collection (schema: `title`, optional `description`)
- `src/content/config.ts` - Two collections: `protocolCollection` (used by every category) and `pageCollection`; Zod schema validates all frontmatter fields
- `src/components/` - Reusable Astro components: `StageBadge`, `DependencyBadge`, `RiskIndicator`, `Breadcrumb`, `StatsBar`, `ProtocolCard`, `RiskDashboard`, `SearchDialog`
- `src/layouts/BaseLayout.astro` - Main layout with responsive sidebar navigation, search trigger, and view transitions
- `src/pages/[category]/[slug].astro` - Dynamic routing for protocol detail pages
- `src/pages/framework.astro` - Standalone page explaining the 3-stage methodology
- `src/styles/global.css` - Tailwind theme config (`@theme` block) with all custom color tokens, typography, and sizing variables
- `src/styles/prose.css` - Styles for rendered Markdown content

### Data Flow

```
Markdown file (frontmatter + content)
    → config.ts validates schema with Zod
    → Astro reads via getCollection()
    → Pages render the data
```

### Adding a Protocol

1. Create `src/content/{category}/{slug}.md` (filename = URL slug)
2. Add required frontmatter - schema enforces these fields:
   - `name`, `category`, `stage` (0-2), `website`, `chains[]`, `lastUpdated`
   - `baseName` (optional) - For grouping protocol versions (see below)
   - `risks`: `upgradeability`, `adminControl`, `fundAccess`, `audits`, `externalDependencies`, `trackRecord`
3. Protocol auto-appears in homepage table, category listing, and sidebar

### Protocol Version Grouping

Protocols with multiple versions (e.g., Uniswap V1-V4, Aave V1-V3) can be grouped together in the sidebar navigation using the `baseName` field:

**Example:**
```yaml
---
name: "Uniswap V3"
baseName: "Uniswap"  # Groups with V1, V2, V4
category: "dexes"
# ... rest of frontmatter
---
```

**How it works:**
- Protocols with the same `baseName` are grouped together under an expandable dropdown in the sidebar
- Click the protocol name to expand/collapse all versions
- Dropdown state persists across page navigation using localStorage
- If `baseName` is omitted, the protocol appears as a standalone entry
- Versions are sorted by stage (descending), then name

**Adding a new version:**
1. Create a new `.md` file (e.g., `uniswap-v5.md`)
2. Use the same `baseName` as existing versions (e.g., `baseName: "Uniswap"`)
3. The new version automatically appears in the dropdown group

**Existing grouped protocols:**
- Uniswap (V1, V2, V3, V4)
- Aave (V1, V2, V3, V4)
- Compound (V1, V2, V3)
- StakeWise (V2, V3)
- Liquity (V1, V2)

### Adding a Category

1. Create directory `src/content/{new-category}/`
2. Add to enum in `src/content/config.ts` and to collections export
3. Update `BaseLayout.astro` to fetch the new collection
4. Update `[category]/index.astro` getStaticPaths with category metadata

## Frontmatter Schema Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full protocol name (e.g., "Uniswap V3") |
| `category` | enum | One of: `dexes`, `lending`, `liquid-staking`, `bridges`, `derivatives`, `yield`, `privacy` |
| `stage` | number | Risk stage: 0 (Fully Assisted), 1 (Limited Trust), 2 (Trustless) |
| `website` | URL | Official protocol website |
| `chains` | string[] | Array of chains (e.g., `["ethereum", "arbitrum"]`) |
| `lastUpdated` | string | ISO date (e.g., "2026-02-06") |
| `risks` | object | Risk assessment object (see below) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `baseName` | string | Base protocol name for grouping versions (e.g., "Uniswap") |
| `tvl` | string | Total Value Locked (e.g., "$3.8B") |
| `logo` | string | Path to logo image |

### Risk Object Fields

Valid enum values for `risks` object in frontmatter:

| Field | Values |
|-------|--------|
| `upgradeability` | `immutable`, `timelock-7d+`, `timelock-48h+`, `instant` |
| `adminControl` | `none`, `governance`, `multisig-diverse`, `multisig-weak`, `eoa` |
| `fundAccess` | `impossible`, `restricted`, `possible` |
| `audits` | `extensive`, `multiple`, `single`, `none` |
| `externalDependencies` | `none`, `decentralized`, `mixed`, `centralized` |
| `trackRecord` | Free text (e.g., "4+ years") |

## Styling

Dark theme using Tailwind CSS v4 with custom tokens defined in `src/styles/global.css` via `@theme`:
- Stage colors: `--color-stage-0: #ef4444` (red), `--color-stage-1: #f59e0b` (orange), `--color-stage-2: #10b981` (green)
- Custom color palette: `bg-primary`, `bg-secondary`, `text-primary`, `text-muted`, `accent`, `border-subtle`, etc.
- Breakpoints: Tailwind defaults — `sm:` (640px), `md:` (768px); templates use `max-md:` and `max-sm:` for mobile-first responsive
- Fonts: Inter (sans), JetBrains Mono (mono) — loaded via Google Fonts in BaseLayout
- Border radii are customized in `@theme`: `--radius-xl: 24px` (larger than Tailwind default of 12px)

**Rounded corners + overflow-hidden:** Do NOT use `overflow-hidden` on containers with `rounded-xl` (or larger). The 24px radius clips text/content at corners. Instead, apply border-radius directly to inner elements (e.g., first/last table cells). Global rules in `global.css` handle table corner rounding automatically via `thead tr:first-child th:first-child` etc.

## Sidebar Navigation Implementation

The sidebar in `BaseLayout.astro` features:

**Protocol grouping logic:**
- Groups protocols by `baseName` within each category
- Protocols with `baseName` and multiple versions → expandable dropdown
- Protocols without `baseName` or single version → standalone link

**Persistent dropdown state:**
- Uses `localStorage` key `'defirisk-sidebar-state'` to store expanded/collapsed state
- Inline script at end of sidebar restores state immediately on page load (prevents flash)
- State is saved when user clicks dropdown headers
- State persists across page navigation and browser sessions

**Technical details:**
- Inline `is:inline` script runs synchronously before page render completes
- Each dropdown has unique `data-group-id` (format: `{categoryIndex}-{groupIndex}`)
- CSS classes: `.expanded` on header, toggles Tailwind `hidden`/`block` on version list
- Arrow rotation: `transform: rotate(90deg)` when expanded

## View Transitions

Uses Astro's `ClientRouter` for smooth page transitions:
- Sidebar has `transition:persist` to maintain state across navigations
- Main content area uses `transition:animate="fade"`
- Active link highlighting updates dynamically after each navigation via `astro:page-load` event

## Search

`SearchDialog` component provides Ctrl+K search:
- Triggered from sidebar search button or keyboard shortcut
- Searches across all protocol names
