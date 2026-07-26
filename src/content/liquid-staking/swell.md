---
name: "Swell"
category: "liquid-staking"
stage: 0
website: "https://www.swellnetwork.io"
chains: ["ethereum"]
tvl: "$138M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "3+ years, no smart contract exploits"
---

# Swell Risk Assessment

## Overview

Swell is a non-custodial liquid staking and liquid restaking protocol on Ethereum. It issues swETH, a reward-bearing ETH liquid staking token, and rswETH, a liquid restaking token that delegates the underlying stake through EigenLayer.

swETH launched on Ethereum mainnet on April 17, 2023; rswETH followed on January 26, 2024, with native withdrawals enabled in July 2024 via the rswETH v2 upgrade. Swell also operated an OP-Stack L2 ("Swellchain") launched December 2024, which the DAO has announced will be wound down by June 15, 2026; swETH and rswETH continue to operate on Ethereum mainnet. As of May 2026, Swell's total TVL is approximately $138M (DeFiLlama), down from multi-billion peaks during the 2024 EigenLayer points-farming era.

## Smart Contract Risk

**Contract Architecture:**
- Core contracts are upgradeable via OpenZeppelin **Transparent Upgradeable Proxy (EIP-1967)**, not UUPS. The swETH proxy has had approximately four implementation upgrades since April 2023.
- Three core upgradeable contracts in the swETH stack: `swETH` token (`0xf951E335afb289353dc249e82926178EaC7DEd78`), `DepositManager` (`0xb3d9cf8E163bbc840195a97e81F8a34E295B8f39`), and `NodeOperatorRegistry`, coordinated by an `AccessControlManager` (`0x625087d72c762254a72CB22cC2ECa40da6b95EAC`).
- rswETH (`0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0`) and rSWELL (`0x358d94b5b2f147d741088803d932acb566acb7b6`) follow the same upgradeable-proxy pattern with their own access-control manager.
- No critical core contracts are immutable; the full stack can be upgraded by the admin role.

**Code Quality:**
- Sigma Prime — comprehensive pre-launch audit of swETH (April 2023): 3 medium, 5 low findings, all resolved, no criticals.
- Sigma Prime and Nethermind — audits of rswETH and withdrawals (May–July 2024).
- Cyfrin and MixBytes — referenced as additional auditors across the protocol's rolling audit program; specific report dates and scopes are unverified from primary sources.
- No formal verification documented.
- Risk-management partners include Gauntlet and Chaos Labs (parameter advisory, not security audits).
- Bug bounty active on Immunefi since April 2023; maximum payout $250,000 for critical smart contract vulnerabilities (capped at 10% of funds at risk). PoC required.

**Attack Surface:**
- Transparent Proxy upgradeability on every core contract means a compromised admin multisig can swap any implementation in a single transaction. With no on-chain timelock between multisig action and execution, users have no exit window.
- swETH/rswETH exchange-rate accounting is internal (not driven by an external market price oracle), reducing flash-loan exchange-rate manipulation risk inside the core protocol. External consumers of swETH price (lending markets) use RedStone feeds sourced from Balancer and Maverick.
- rswETH extends Swell's attack surface to EigenLayer's smart contracts, operator network, and AVS slashing conditions for the restaked portion of TVL.
- No smart contract exploits reported in 3+ years of mainnet operation.

## Admin/Governance Risk

**Governance Structure:**
- The `PLATFORM_ADMIN` role is held by a **3-of-6 multisig** composed of Swell-team-controlled EOAs. Individual signer identities are not publicly disclosed; diversity and independence cannot be verified from public sources.
- The SWELL governance token launched November 7, 2024 (10B supply). The DAO has formal scope over incentives, parameters, and grants, but **upgrade authority over swETH/rswETH contracts remains with the multisig** as of mid-2026. Full on-chain DAO control of upgrades is on the roadmap but not yet implemented.
- `BOT_ROLE` is a single EOA that performs automated repricing and validator setup operations within rate-limited bounds.

**Key Controls:**
- `PLATFORM_ADMIN` can upgrade any proxy, pause and unpause deposits and withdrawals, change system addresses, and modify repricing parameters.
- Repricing rate limits (60-minute minimum interval, maximum 1% per update) constrain `BOT_ROLE` behavior but do **not** constrain upgrade authority.
- Chainlink Proof-of-Reserve performs a daily reserve check with a 2% deviation threshold against the protocol's internally reported total ETH.
- No on-chain `TimelockController` between the multisig and proxy `upgradeTo` is documented; the practical upgrade delay appears to be zero.

**Trust Assumptions:**
- Three colluding (or compromised) team signers can deploy a malicious implementation with no user exit window, effectively gaining access to all staked ETH and rswETH-restaked positions.
- Governance can change node operator membership, repricing parameters, fees, and — via upgrade — any contract logic.
- Fund access via upgrade is functionally direct under this design: there is no timelock buffer to detect or front-run a malicious change.

## External Dependencies

**Oracle System:**
- Repricing is performed internally by `BOT_ROLE` postings, constrained by the rate limits above. There is no external market price oracle in the core exchange-rate path.
- Chainlink Proof-of-Reserve validates total ETH reserves daily (2% deviation threshold). This is a sanity check on internal reporting, not a primary price source.
- External price consumers (e.g., lending protocols integrating swETH) typically rely on RedStone feeds backed by Balancer and Maverick liquidity.

**Off-Chain Actors:**
- **Permissioned node operators:** Approximately eight whitelisted institutional operators (Blockscape, Hashkey/HashQuark, RockX, InfStones, SNC, DSRV, Stakely, Kiln) run validators under a round-robin assignment. **No on-chain slashable bond is documented**; trust is reputational.
- **DVT integration:** Swell has integrated with SSV Network, with over 4,000 Swell validators onboarded to SSV distributed validator clusters. This partially mitigates single-operator failure but does not change the permissioned selection model. Obol usage is not documented.
- **Repricing bot:** A single EOA with `BOT_ROLE`. If it stalls, reward accrual pauses but withdrawals continue at the last canonical exchange rate.
- **rswETH-specific:** EigenLayer dependency for restaking — Swell inherits EigenLayer's contract risk and the slashing behavior of every AVS the protocol delegates to.

**Overall Rating Justification:**
Rated `mixed`. The core exchange-rate path avoids external market price oracles (positive), and Chainlink PoR plus the repricing rate limits provide guardrails on the internal reporter. However, the node operator set is permissioned and reputation-bonded only, a single EOA holds `BOT_ROLE`, and rswETH layers EigenLayer's off-chain operator and AVS dependencies on top. This combination prevents a `decentralized` rating but stops short of `centralized` because no single external party can unilaterally drain or freeze user funds without going through the multisig upgrade path.

## Economic Risk

**Liquidity Risk:**
- ~$138M TVL across swETH and rswETH on Ethereum mainnet as of May 2026, down from multi-billion peaks during the 2024 LRT points-farming era.
- swETH and rswETH have secondary liquidity on Balancer, Maverick, and Curve, allowing exits without waiting for the validator withdrawal queue, though at depth-dependent slippage at this TVL level.
- Native withdrawals require validator exit queue wait times; rswETH withdrawals additionally inherit the EigenLayer AVS escrow period (typically 14 days).

**Operational History:**
- swETH launched April 17, 2023; rswETH launched January 26, 2024; rswETH withdrawals enabled July 2024.
- No smart contract exploits or loss-of-funds incidents reported in 3+ years of operation.
- Survived the 2024–2025 LRT growth-and-contraction cycle and the April 2025 restaking repricing event.
- Swellchain L2 wind-down announced for June 15, 2026 — an operational/strategic event, not a security incident; users were notified to bridge funds back to Ethereum mainnet.

## Stage Assessment

**Stage 0 Criteria Met:**

- ✓ Multiple audits — Sigma Prime, Nethermind, plus referenced Cyfrin and MixBytes work qualifies for `multiple` rating
- ✓ 3+ years of mainnet operation with no smart contract exploits
- ⚠ Upgradeability: `instant` — Transparent Proxy with no documented on-chain timelock between multisig action and `upgradeTo` execution
- ⚠ Admin control: `multisig-weak` — 3-of-6 multisig composed entirely of Swell-team-controlled EOAs; signer diversity and independence are not publicly attested
- ⚠ Fund access: `possible` — admin can upgrade implementations with no user exit window, which is functionally equivalent to direct fund access
- ⚠ External dependencies: `mixed` — permissioned node operators with no on-chain bond, single-EOA repricing bot, and (for rswETH) EigenLayer operator and AVS dependencies

**Why Not Stage 1:**
- **Upgradeability:** Stage 1 requires a verified ≥48-hour timelock on critical upgrades. No on-chain timelock is documented between the `PLATFORM_ADMIN` multisig and proxy upgrades.
- **Admin control:** Stage 1 requires a diverse 3-of-5+ multisig (with independent, attested signers) or decentralized governance. The 3-of-6 here is team-controlled with undisclosed signer identities; SWELL token governance does not yet control upgrades on-chain.
- **Fund access:** Without a timelock, the upgrade path provides effective direct access to user funds, which exceeds the `restricted` threshold Stage 1 allows.

**Justification:**
Swell is classified as Stage 0 (Fully Assisted). Despite a clean 3+ year operational record, multiple reputable audits, and a live Immunefi bug bounty, the on-chain trust footprint is significant: a 3-of-5 of the team's own multisig can upgrade every core contract with no timelock and no user exit window. Until either a verified ≥48-hour `TimelockController` is placed in front of proxy upgrades, the multisig is replaced with a diverse and independently attested signer set (or on-chain SWELL governance), and node operator participation is constrained by an on-chain bond or decentralized removal process, Stage 0 is the appropriate classification.

## Links

- [Official Website](https://www.swellnetwork.io/)
- [Builder Documentation](https://build.swellnetwork.io/)
- [Contract Addresses](https://build.swellnetwork.io/docs/developer-resources/contract-addresses)
- [Sigma Prime Audit Announcement](https://www.swellnetwork.io/post/smart-contract-audit-completed-by-sigma-prime)
- [Immunefi Bug Bounty](https://immunefi.com/bug-bounty/swell/)
- [DeFiLlama](https://defillama.com/protocol/swell)
- [Independent Risk Assessment (Prisma, Oct 2023)](https://hackmd.io/@PrismaRisk/HJqoSgCeT)
