/**
 * update-tvl.mjs
 *
 * Fetches current TVL for every tracked protocol from DeFiLlama's free public
 * API and writes the value directly into each protocol's frontmatter.
 *
 * Usage:
 *   node scripts/update-tvl.mjs
 *
 * Cron (daily at 06:00):
 *   0 6 * * * cd /path/to/defirisk && node scripts/update-tvl.mjs >> logs/tvl.log 2>&1
 *
 * No API key required. One HTTP request covers all protocols.
 * Safe to run repeatedly — skips files where the value hasn't changed.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Maps DeFiLlama protocol slug → path to markdown file (relative to project root).
// To verify or find a slug: https://defillama.com/protocol/<slug>
const PROTOCOL_MAP = {
  // DEXes
  'uniswap-v2':     'src/content/dexes/uniswap-v2.md',
  'uniswap-v3':     'src/content/dexes/uniswap-v3.md',
  'uniswap-v4':     'src/content/dexes/uniswap-v4.md',
  'balancer-v2':    'src/content/dexes/balancer.md',         // Balancer V2 is primary tracked version
  'curve-dex':      'src/content/dexes/curve.md',

  // Lending
  'aave-v2':        'src/content/lending/aave-v2.md',
  'aave-v3':        'src/content/lending/aave-v3.md',
  'compound-v2':    'src/content/lending/compound-v2.md',
  'compound-v3':    'src/content/lending/compound-v3.md',
  'sky-lending':    'src/content/lending/makerdao.md',        // MakerDAO rebranded to Sky
  'morpho-v1':      'src/content/lending/morpho.md',         // Morpho Blue (V1)
  'sparklend':      'src/content/lending/spark.md',

  // Liquid Staking
  'lido':           'src/content/liquid-staking/lido.md',
  'rocket-pool':    'src/content/liquid-staking/rocket-pool.md',
  'ether.fi-stake': 'src/content/liquid-staking/etherfi.md',
  'eigencloud':     'src/content/liquid-staking/eigenlayer.md', // EigenLayer restaking (DeFiLlama slug)

  // Derivatives
  'dydx-v4':        'src/content/derivatives/dydx.md',
  'gmx-v2-perps':   'src/content/derivatives/gmx.md',

  // Yield
  'convex-finance': 'src/content/yield/convex.md',
  'ethena-usde':    'src/content/yield/ethena.md',
  'fluid-lending':  'src/content/yield/instadapp.md',         // Instadapp rebranded to Fluid
  'pendle':         'src/content/yield/pendle.md',
  'yearn-finance':  'src/content/yield/yearn.md',
};

// Protocols intentionally omitted (negligible TVL, no DeFiLlama entry):
//   uniswap-v1, aave-v1, compound-v1

/**
 * Formats a raw TVL number into a compact human-readable string.
 * Returns null if TVL is zero, negative, or too small to be meaningful.
 *
 * Examples:
 *   22500000000 → "$22.5B"
 *   850000000   → "$850M"
 *   42000000    → "$42M"
 */
function formatTvl(tvl) {
  if (!tvl || tvl <= 0) return null;
  if (tvl >= 1e9) {
    const b = tvl / 1e9;
    // Show one decimal unless it's a whole number
    return `$${Number.isInteger(b) ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  if (tvl >= 1e6) {
    return `$${Math.round(tvl / 1e6)}M`;
  }
  if (tvl >= 1e3) {
    return `$${Math.round(tvl / 1e3)}K`;
  }
  return null;
}

/**
 * Replaces the tvl field in YAML frontmatter.
 * If no tvl field exists yet, inserts one after lastUpdated.
 */
function patchFrontmatter(content, newTvl) {
  if (/^tvl:/m.test(content)) {
    return content.replace(/^tvl:.*$/m, `tvl: "${newTvl}"`);
  }
  // Field doesn't exist yet — insert after lastUpdated
  return content.replace(/^(lastUpdated:.*)$/m, `$1\ntvl: "${newTvl}"`);
}

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Fetching TVL data from DeFiLlama...`);

  const res = await fetch('https://api.llama.fi/protocols');
  if (!res.ok) throw new Error(`DeFiLlama API responded with ${res.status}`);

  const all = await res.json();

  // Build a lookup map: slug → tvl (number)
  const llamaTvl = Object.fromEntries(all.map(p => [p.slug, p.tvl]));

  const results = { updated: 0, unchanged: 0, notFound: 0, error: 0 };

  for (const [slug, relPath] of Object.entries(PROTOCOL_MAP)) {
    const filePath = resolve(ROOT, relPath);

    // Check DeFiLlama has this slug
    if (!(slug in llamaTvl)) {
      console.warn(`  ⚠  Not found in DeFiLlama: "${slug}" — verify slug at defillama.com/protocol/${slug}`);
      results.notFound++;
      continue;
    }

    const formatted = formatTvl(llamaTvl[slug]);
    if (!formatted) {
      console.warn(`  ⚠  TVL too low to display for "${slug}" (${llamaTvl[slug]})`);
      results.unchanged++;
      continue;
    }

    // Read file
    let original;
    try {
      original = readFileSync(filePath, 'utf8');
    } catch {
      console.error(`  ✗  Could not read: ${relPath}`);
      results.error++;
      continue;
    }

    const patched = patchFrontmatter(original, formatted);

    // Skip write if nothing changed
    if (patched === original) {
      console.log(`  ·  Unchanged: ${slug.padEnd(18)} ${formatted}`);
      results.unchanged++;
      continue;
    }

    try {
      writeFileSync(filePath, patched, 'utf8');
      console.log(`  ✓  Updated:   ${slug.padEnd(18)} ${formatted}`);
      results.updated++;
    } catch {
      console.error(`  ✗  Could not write: ${relPath}`);
      results.error++;
    }
  }

  console.log(
    `\nDone: ${results.updated} updated, ${results.unchanged} unchanged, ` +
    `${results.notFound} not found, ${results.error} errors`
  );
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
