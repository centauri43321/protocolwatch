import { defineCollection, z } from 'astro:content';

const pageCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const protocolCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    baseName: z.string().optional(), // For grouping multi-version protocols (e.g., "Uniswap" for V1/V2/V3/V4)
    category: z.enum(['dexes', 'lending', 'liquid-staking', 'bridges', 'derivatives', 'yield', 'privacy']),
    stage: z.number().min(0).max(2),
    website: z.string().url(),
    logo: z.string().optional(),
    chains: z.array(z.string()),
    tvl: z.string().optional(),
    lastUpdated: z.string(),
    risks: z.object({
      upgradeability: z.enum(['immutable', 'timelock-7d+', 'timelock-48h+', 'instant']),
      adminControl: z.enum(['none', 'governance', 'multisig-diverse', 'multisig-weak', 'eoa']),
      fundAccess: z.enum(['impossible', 'restricted', 'possible']),
      audits: z.enum(['extensive', 'multiple', 'single', 'none']),
      externalDependencies: z.enum(['none', 'decentralized', 'mixed', 'centralized']),
      trackRecord: z.string(),
    }),
  }),
});

export const collections = {
  'pages': pageCollection,
  'dexes': protocolCollection,
  'lending': protocolCollection,
  'liquid-staking': protocolCollection,
  'bridges': protocolCollection,
  'derivatives': protocolCollection,
  'yield': protocolCollection,
  'privacy': protocolCollection,
};
