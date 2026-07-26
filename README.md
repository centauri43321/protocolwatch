# ProtocolWatch

A lightweight, text-based DeFi risk assessment website inspired by L2Beat. ProtocolWatch provides systematic evaluation of DeFi protocols based on decentralization, security, and trust assumptions using a 3-stage risk framework.

## Features

- **3-Stage Risk Framework**: Protocols rated as Stage 0 (Fully Assisted), Stage 1 (Limited Trust), or Stage 2 (Trustless)
- **File-based Content**: All protocols stored as markdown files, no database required
- **Fast & Minimal**: Built with Astro for optimal performance
- **Dark Theme**: Text-focused, minimal design
- **Responsive**: Mobile-friendly with collapsible sidebar
- **Easy to Update**: Add new protocols by simply creating markdown files

## Project Structure

```
/
├── src/
│   ├── content/
│   │   ├── config.ts           # Content collection schema (Zod)
│   │   ├── pages/              # Editorial pages (home.md, framework.md)
│   │   ├── dexes/              # DEX protocols
│   │   ├── lending/            # Lending protocols
│   │   ├── liquid-staking/     # Liquid staking
│   │   ├── bridges/            # Cross-chain bridges
│   │   ├── derivatives/        # Derivatives protocols
│   │   ├── yield/              # Yield protocols
│   │   └── privacy/            # Privacy protocols
│   ├── components/             # Reusable Astro components (badges, cards, search)
│   ├── layouts/
│   │   └── BaseLayout.astro    # Main layout with sidebar
│   ├── styles/
│   │   ├── global.css          # Tailwind @theme tokens + global styles
│   │   └── prose.css           # Rendered-markdown styles
│   └── pages/
│       ├── index.astro         # Homepage with protocol table
│       ├── framework.astro     # Framework methodology
│       └── [category]/
│           ├── index.astro     # Category listing page
│           └── [slug].astro    # Protocol detail page
├── public/                     # Favicons, logos, robots.txt
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18.20.8+ or 20.3.0+ or 22.0.0+
- npm 9.6.5+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server will start at `http://localhost:4321`


### Protocol slug map

The mapping of DeFiLlama slugs to local files lives entirely in `scripts/update-tvl.mjs`. To add a new protocol or fix a slug:

1. Find the correct slug at `https://defillama.com/protocol/<slug>`
2. Add an entry to `PROTOCOL_MAP` in the script:
   ```js
   'your-slug': 'src/content/category/protocol.md',
   ```

### Protocols currently tracked

| Category | Protocols |
|---|---|
| DEXes | Uniswap V2/V3/V4, Balancer V2, Curve |
| Lending | Aave V2/V3, Compound V2/V3, MakerDAO/Sky, Morpho, Spark |
| Liquid Staking | Lido, Rocket Pool, EtherFi, EigenLayer |
| Derivatives | dYdX V4, GMX V2 |
| Yield | Convex, Ethena, Fluid (Instadapp), Pendle, Yearn |

> Uniswap V1, Aave V1, and Compound V1 are intentionally excluded — negligible TVL on DeFiLlama.

---

## Adding a New Protocol

1. Create a new markdown file in the appropriate category directory:

```bash
# Example: Add a new DEX
touch src/content/dexes/balancer-v2.md
```

2. Add frontmatter and content:

```yaml
---
name: "Balancer V2"
category: "dexes"
stage: 1
website: "https://balancer.fi"
chains: ["ethereum", "arbitrum", "polygon"]
tvl: "$1.2B"
lastUpdated: "2025-01-23"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "governance"
  fundAccess: "restricted"
  audits: "extensive"
  externalDependencies: "decentralized"
  trackRecord: "3+ years"
---

# Balancer V2 Risk Assessment

## Overview
[Your assessment here...]

## Smart Contract Risk
[Analysis...]

## Admin/Governance Risk
[Analysis...]

## Stage Assessment
[Justification...]
```

3. The protocol will automatically appear in:
   - Homepage summary table
   - Category listing page
   - Sidebar navigation

## Risk Dimension Values

### Upgradeability
- `immutable` - No upgrade mechanism
- `timelock-7d+` - 7+ day timelock
- `timelock-48h+` - 48+ hour timelock
- `instant` - No timelock protection

### Admin Control
- `none` - No admin, owner, or governance
- `governance` - Decentralized governance
- `multisig-diverse` - Diverse multisig (3-of-5+)
- `multisig-weak` - Weak multisig (2-of-3)
- `eoa` - Single EOA control

### Fund Access
- `impossible` - Admin cannot access funds
- `restricted` - Limited access conditions
- `possible` - Admin can access funds

### Audits
- `extensive` - Multiple audits + formal verification
- `multiple` - 2+ independent audits
- `single` - Single audit
- `none` - Not audited

### External Dependencies
- `none` - No oracles, keepers, or off-chain actors
- `decentralized` - All external deps decentralized/bonded (e.g., Chainlink, TWAP)
- `mixed` - Some decentralized, some centralized
- `centralized` - Critical reliance on centralized systems

### Track Record
- Free text (e.g., "4+ years", "2 years", "6 months")

## Stage Criteria

**Guiding principle:** The stage answers one question — *can the user's deposited funds be taken, frozen, or made unrecoverable without their consent?* Audit count, governance polish, and similar quality signals are caveats in the body of the assessment, not stage gates.

### Stage 2 - Trustless
- Fund-holding contracts immutable, OR upgradeable only via decentralized governance with ≥7-day timelock (no bypass)
- No admin role can withdraw, freeze, or block withdrawals of user funds
- External dependencies are none or fully decentralized
- 12+ months in production, no core fund-custody exploit
- At least one credible independent audit

### Stage 1 - Limited Trust
- ≥48-hour timelock, no bypass
- Admin via governance or 3-of-5+ diverse multisig
- No direct fund drain; indirect risk (upgrades, parameter changes) acceptable
- External dependencies decentralized or have fallbacks
- 6+ months in production, 2+ independent audits

### Stage 0 - Fully Assisted (default — any one trigger is sufficient)
- Admin can directly access user funds
- Instant upgrades / <48h timelock on fund-holding contracts
- EOA or weak multisig controlling fund-touching functions
- Critical centralized external dependency with no fallback
- No audit, or <6 months in production
- Recent unresolved core fund-custody exploit

See `framework.md` and `RESEARCH_GUIDE.md` for the full criteria, decision procedure, and calibration examples.

## Customization

### Styling

The dark theme is defined in `src/styles/global.css` via a Tailwind v4 `@theme` block. Key tokens:

```css
@theme {
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #12121a;
  --color-text-primary: #e8e8ed;
  --color-text-secondary: #9a9ab4;
  --color-border-subtle: #1e1e2e;
  --color-accent: #6366f1;
  --color-stage-0: #ef4444;  /* Red    — Stage 0 */
  --color-stage-1: #f59e0b;  /* Orange — Stage 1 */
  --color-stage-2: #10b981;  /* Green  — Stage 2 */
}
```

Rendered-markdown styles live in `src/styles/prose.css`.

### Adding Categories

1. Create directory: `src/content/your-category/`
2. Update `src/content/config.ts`:
   - Add to category enum
   - Add to collections export
3. Update `BaseLayout.astro` to fetch the new collection
4. Update `[category]/index.astro` getStaticPaths with category metadata

## Tech Stack

- **Astro 5** - Static site generator
- **TypeScript** - Type safety
- **Markdown** - Content format
- **Tailwind CSS v4** - Styling (via `@tailwindcss/vite`)
- **@astrojs/sitemap** - Sitemap generation

## Deployment

Build the static site:

```bash
npm run build
```

The output will be in `dist/` directory. Deploy to any static hosting:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Any static web server

### Vercel Deployment

```bash
npm i -g vercel
vercel --prod
```

### Netlify Deployment

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Contributing

To add or update protocol assessments:

1. Research the protocol thoroughly
2. Evaluate across all risk dimensions
3. Create or update the markdown file
4. Submit for review with supporting evidence
5. Include links to contracts, audits, and governance docs

## License

No license yet — all rights reserved. The source is published for viewing; it is not yet licensed for reuse or redistribution. A license may be added later.

## Acknowledgments

- Inspired by [L2Beat](https://l2beat.com)
- Risk framework adapted for DeFi protocols
