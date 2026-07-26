---
name: "Synapse"
category: "bridges"
stage: 0
website: "https://synapseprotocol.com"
chains: ["ethereum", "arbitrum", "optimism", "base", "polygon", "avalanche", "bsc", "gnosis", "canto", "aurora", "harmony", "moonbeam", "moonriver", "cronos", "fantom", "klaytn", "metis", "boba"]
tvl: "$17M"
lastUpdated: "2026-03-18"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "centralized"
  trackRecord: "4.5+ years, $8M exploit attempt Nov 2021 (blocked), TVL declined sharply, team pivoted away from bridging in late 2025"
---

# Synapse Risk Assessment

## Overview

Synapse Protocol is a cross-chain bridge and liquidity network that launched on August 29, 2021. It supports 18+ EVM and non-EVM chains, enabling cross-chain swaps via three mechanisms: canonical wrapping (lock/mint), liquidity pool routing through nexus stablecoins (nUSD, nETH), and native USDC via CCTP integration. The protocol is secured by a set of MPC (multi-party computation) validators using threshold signature schemes (TSS).

Synapse was one of the leading bridges in 2022, reaching over $1B TVL at peak. Since then it has declined sharply to approximately $17-22M TVL as of early 2026. In late 2025, Synapse Labs announced a pivot away from bridging, declaring that "a structurally profitable bridging business doesn't exist," and redirected resources toward Hypercall, an on-chain options venue for Hyperliquid. The bridge continues to operate but is in effective wind-down mode. The planned Synapse Chain (an optimistic rollup) was never launched; the protocol instead shipped a request-for-quote (RFQ) system called the Synapse Intent Network (SIN) in late 2024.

## Smart Contract Risk

**Contract Architecture:**
- The core bridge contract (`SynapseBridge`) on Ethereum mainnet is deployed at `0x2796317b0ff8538f253012862c06787adfb8ceb6`. This is an **OpenZeppelin TransparentProxy** — the proxy delegates calls to an upgradeable implementation contract, with upgrade authority held by the admin (a TimelockController)
- The proxy's implementation can be changed by whoever controls the TimelockController's admin role; a DevMultisig holds the `DEFAULT_ADMIN_ROLE`
- The same upgradeable proxy pattern is used on all supported chains (BSC: `0xd123f70ae324d34a9e76b67a27bf77593ba8749f`, Optimism: `0xaf41a65f786339e7911f4acdad6bd49426f2dc6b`, Arbitrum: `0x6f4e8eba4d337f874ab57478acc2cb5bacdc19c9`)
- Bridge contracts for wrapped tokens (`BridgeToken`) are also upgradeable; a malicious upgrade to these contracts could allow arbitrary minting or fund theft
- The TimelockController governing upgrades has a configurable delay; according to L2Beat and Exponential.fi, the effective delay on the Ethereum mainnet bridge is approximately 3 minutes — far below the 48-hour threshold required for Stage 1. This gives users no meaningful exit window before a malicious upgrade can execute

**Role Structure:**
- `DEFAULT_ADMIN_ROLE`: Controls role assignments and contract upgrades; held by the DevMultisig
- `GOVERNANCE_ROLE`: Sets chain gas amounts, pauses/unpauses the bridge, manages bridging fees; held by two separate Governor addresses
- `NODEGROUP_ROLE`: Assigned to MPC validators; enables cross-chain mint and withdraw operations
- An `AllowanceModule` (Safe module) manages bridge parameters and can upgrade the bridge implementation

**Code Quality:**
- The Synapse Bridge contract has been audited by **PeckShield**
- The stableswap AMM pools (forked from Saddle Finance) were audited by **CertiK** (April 2021, via Nerve Finance — same codebase), **OpenZeppelin**, and **Quantstamp**
- CertiK's April 2021 audit of the core AMM found no critical, major, medium, or minor findings
- No audits from Trail of Bits, Spearbit, or Certora; no formal verification; no active Immunefi bug bounty identified in current records
- The stableswap AMM code was forked from Saddle Finance; this same Saddle fork contained the vulnerability exploited in the November 2021 attack (see Track Record)
- With the team now pivoting away from bridging, the likelihood of further security investment (re-audits, formal verification) is low

## Admin/Governance Risk

**Multisig Structure:**
- Bridge administration is controlled by a Gnosis Safe multisig with a **2-of-3 threshold**
- The three signer addresses (as identified via L2Beat) are abbreviated as `0xb3DA…4e15`, `0x9Ce9…38f3`, and `0x0d74…D5BC` — fewer than 4 signers total, which falls below the threshold for `multisig-diverse`
- The identity and independence of these signers is not publicly verified; they appear to be Synapse Labs team members or closely affiliated parties
- A 2/3 multisig concentrated among a small team represents a meaningful centralization risk: collusion or key compromise of any 2 signers gives full upgrade authority over bridge contracts

**Governance Token (SYN / CX):**
- SYN was the original governance token; in 2024/2025 a new token CX was introduced via SIP-43, with governance rights transferred to the Cortex DAO
- SYN and CX remain "indefinitely interchangeable" (neither fully migrated due to lack of infrastructure support)
- CX holders with 550,000+ CX can submit proposals; passage requires 50% + 1 of votes and 2.25M CX quorum
- Snapshot-based voting is non-binding on-chain; the multisig executes actual protocol changes
- In practice, token governance does not override or constrain the multisig's ability to upgrade contracts directly

**Key Controls:**
- The multisig can: upgrade bridge implementations, upgrade wrapped token contracts (enabling arbitrary minting), set bridging fees, pause the bridge, modify liquidity pool parameters
- The ~3-minute timelock provides no meaningful exit window for users before a malicious upgrade executes
- Two `GOVERNANCE_ROLE` holders can independently pause the bridge at any time (emergency response mechanism)

## External Dependencies

**Validator Set (MPC/TSS):**
- Cross-chain messages are validated by a set of MPC validators operating with threshold signature schemes — consensus requires 2/3 of validators to sign each transaction
- Validators observe on-chain events (lock/mint/burn operations) and attest to their validity before the bridge releases funds on the destination chain
- Validators are assigned the `NODEGROUP_ROLE` in the bridge contracts; this role enables mint and withdraw operations — a compromise of sufficient validators enables fund theft
- Slashing for validator misbehavior was listed as a roadmap item ("validators' staked balances will be penalized") but there is no confirmed on-chain slashing implementation in the production bridge as of this assessment. Per the classification rules for this framework: **validators that are not bonded/slashable = centralized external dependency**
- Synapse Labs itself is the sole Guard operator of the newer Synapse Intent Network (SIN) system, meaning a single entity controls fraud proof submission for that layer

**Synapse Intent Network (SIN):**
- Launched late 2024 as an RFQ/intent-based bridging system layered over the original bridge infrastructure
- Uses off-chain relayers who respond to quote requests via WebSocket; intents can be exclusively assigned to the best-quoting relayer
- Synapse Labs confirmed it is "the sole Guard operator" of SIN — all fraud proofs for the optimistic verification layer flow through Synapse Labs, a single point of failure

**Liquidity Pool Dependencies:**
- Pool-based routes depend on nUSD and nETH nexus liquidity pools on Ethereum being sufficiently liquid
- If pools become imbalanced or illiquid (likely given TVL decline), bridging via this route may fail or experience high slippage

**Overall:** Centralized — the MPC validator set lacks confirmed on-chain slashing, Synapse Labs controls the sole Guard role in SIN, and the multisig is small enough that validator + multisig compromise is a concentrated risk.

## Economic Risk

**TVL Trajectory:**
- Peak TVL exceeded $1B in early 2022
- As of March 2026, TVL is approximately $17-22M — a decline of over 98% from peak
- TVL is concentrated on Ethereum ($13M+) with small amounts on Canto, Avalanche, and other chains
- Low TVL reduces the economic incentive for maintaining validator infrastructure and liquidity

**Protocol Viability:**
- In November 2025, Synapse Labs publicly announced the bridging business is "not structurally profitable" and shifted focus to Hypercall, an options protocol on Hyperliquid
- The bridge contracts remain deployed and functional but no meaningful development or security investment is expected
- With the team's attention elsewhere, response time to bugs or emergencies is uncertain
- The SYN/CX token has lost significant value; governance participation is likely low

**Track Record:**

*November 2021 — Exploit Attempt (Funds Preserved):*
Attackers identified a vulnerability in the Saddle Finance fork used by Synapse's stableswap AMM pools. The vulnerability allowed inflation of LP tokens via a mismatch between the `swap` and `swapUnderlying` functions (which calculate LP token "virtual price" differently). Using flash loans, attackers obtained inflated LP tokens and attempted to drain approximately $8M in tokens. The attempted cross-chain transfer of stolen funds was **rejected by Synapse's MPC validators**, and all Avalanche nUSD LPs were made whole. No funds were ultimately lost. This incident demonstrated the validator set's ability to identify and block in-progress attacks, but also highlighted the code quality risk from inheriting vulnerable forks. The parallel Nerve Bridge (same Saddle fork code) was successfully exploited for ~$537,000 in the same attack wave.

*No other major exploits* have been publicly disclosed since the November 2021 incident. The protocol operated without a successful hack over 4+ years.

## Stage Assessment

**Stage 0 (Fully Assisted):**

Synapse Protocol is rated **Stage 0** on multiple independent dimensions:

- **Upgradeability** (`instant`): The SynapseBridge proxy contract can be upgraded with a ~3-minute timelock delay — far below the 48-hour minimum required for Stage 1. Users have no meaningful exit window before a malicious upgrade executes.

- **Admin Control** (`multisig-weak`): A 2-of-3 multisig with fewer than 4 signers controls bridge upgrades, wrapped token contracts (with minting authority), and fee parameters. The signer identities are not publicly verified. This is below the threshold for `multisig-diverse` and does not meet the governance requirement for Stage 1.

- **Fund Access** (`possible`): The multisig can upgrade bridge contracts and wrapped token implementations. A malicious upgrade to `BridgeToken` contracts could enable arbitrary minting, allowing the multisig to effectively create unlimited tokens and drain liquidity pools. L2Beat explicitly flags this risk.

- **External Dependencies** (`centralized`): MPC validators are not confirmed to be bonded or subject to on-chain slashing in production; they hold `NODEGROUP_ROLE` which enables mint/withdraw operations. Synapse Labs is the sole Guard operator of SIN. Per the framework's bridge classification rule: non-bonded/non-slashable validators = centralized.

- **Audits** (`multiple`): Four audit firms have reviewed components (PeckShield: bridge; CertiK, OpenZeppelin, Quantstamp: AMM). This meets the `multiple` threshold, which prevents the lowest possible audit rating, but audits are from 2021 vintage with no recent re-audits and no formal verification.

- **Track Record** (4.5+ years, no successful exploits): The bridge has operated since August 2021 with no successful exploit — a positive signal. The November 2021 attempt was blocked by validators. However, the ongoing team pivot away from bridging reduces confidence in continued security maintenance.

**Why Not Stage 1:**
Even if the timelock were extended to 48h+, the 2/3 multisig structure (fewer than 4 signers, unverified identities) combined with centralized, non-bonded validators and possible fund access means the protocol would still fail Stage 1 criteria on multiple dimensions simultaneously.

## Links

- [Official Website](https://synapseprotocol.com)
- [Documentation](https://docs.synapseprotocol.com)
- [GitHub](https://github.com/synapsecns/synapse-contracts)
- [Contract Documentation](https://contracts.synapseprotocol.com/bridge)
- [Bridge Contract (Ethereum)](https://etherscan.io/address/0x2796317b0ff8538f253012862c06787adfb8ceb6)
- [TimelockController (Arbitrum)](https://arbiscan.io/address/0xa67b7147dce20d6f25fd9abfbcb1c3ca74e11f0b)
- [SYN Token (Ethereum)](https://etherscan.io/token/0x0f2d719407fdbeff09d87557abb7232601fd9f29)
- [L2Beat Bridge Assessment](https://l2beat.com/bridges/projects/synapse)
- [DeFiLlama TVL](https://defillama.com/protocol/synapse)
- [Halborn: Synapse & Nerve Bridge Hack Explained (Nov 2021)](https://www.halborn.com/blog/post/explained-the-synapse-and-nerve-bridge-hacks-november-2021)
- [Synapse Intent Network Docs](https://docs.synapseprotocol.com/blog/synapse-intent-network-launch)
- [CertiK Skynet](https://skynet.certik.com/projects/synapseprotocol)
