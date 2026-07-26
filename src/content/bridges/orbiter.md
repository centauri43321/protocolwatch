---
name: "Orbiter Finance"
category: "bridges"
stage: 0
website: "https://orbiter.finance"
chains: ["ethereum", "arbitrum", "optimism", "base", "polygon", "zksync", "starknet", "linea", "scroll", "bnb", "mantle", "solana"]
tvl: "$50M"
lastUpdated: "2026-03-18"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "centralized"
  trackRecord: "3+ years, no protocol exploit"
---

# Orbiter Finance Risk Assessment

## Overview

Orbiter Finance is a cross-rollup bridge protocol launched in 2021 (seed round November 2022, Series A March 2023) focused on low-cost, near-instant transfers of native Ethereum assets across Layer 2 networks and beyond. Rather than using a traditional lock-and-mint model, Orbiter employs a peer-to-peer "Maker" system in which professional liquidity providers hold pre-funded balances on every supported chain and relay transfers on users' behalf.

As of early 2026 the protocol supports 60+ chains, has processed 35M+ transactions totaling $28B+ in lifetime volume, and claims 4.3M+ unique users. The native OBT governance token launched in January 2025. Annual revenue has been reported at $50M+, making it one of the most active bridge protocols in the Ethereum ecosystem. No exploit of the core bridging mechanism has been reported since launch.

## Smart Contract Risk

**Contract architecture:**

Orbiter's on-chain system is built around three contracts, all deployed on Ethereum mainnet and selectively on L2s:

- **MDC (Maker Deposit Contract):** Holds Maker margin deposits and adjudicates disputes. If a Maker fails to complete a transfer, the Sender can file an arbitration request; the MDC will compensate the Sender from the Maker's deposited margin if the Maker cannot provide on-chain proof of delivery.
- **EBC (Event Binding Contract):** Verifies the correspondence between source-chain and destination-chain transactions using agreed-upon parameters (fee schedules, token types, amounts).
- **ZK-SPV (Zero-Knowledge Simple Payment Verification):** Uses ZK proofs to demonstrate the existence and validity of both source and target transactions without requiring the destination chain to re-execute the source chain's state.

**Upgradeability:**

Specific proxy patterns and timelock configurations are not publicly documented in Orbiter's developer docs or the `OB_ReturnCabin` GitHub repository. The absence of documented timelocks, combined with the team's ability to push protocol upgrades (evidenced by the January 2025 OBT-related governance contracts), means upgrades must be treated as potentially instant. There is no evidence of a community-enforced timelock protecting the MDC or EBC contracts.

**Critical user-flow detail:**

Users send funds directly to a Maker's EOA address on the source chain — not to a smart contract. The transfer amount's last four digits encode the destination chain identifier. This means the source-side of every user transfer is custodied by the Maker EOA, not a contract, offering no on-chain protection at the point of deposit.

## Admin/Governance Risk

**OBT token governance:**

The OBT token (TGE January 20, 2025) was described as having on-chain governance active from February 2025. However, governance scope, voting quorums, and whether governance has veto power over contract upgrades are not publicly specified in the documentation reviewed.

**Admin key structure:**

No public information is available regarding the multisig configuration protecting admin keys (number of signers, threshold, signer identities, or hardware wallet usage). Given the absence of this disclosure and the protocol's stage of development, admin control is classified conservatively as `multisig-weak`. Users cannot independently verify the security of the upgrade path.

**Centralization of Makers:**

The Maker whitelist is controlled by the Orbiter team. As of the last available documentation, the Maker Client was "only available to members of our Whitelist," with plans for eventual permissionless access described as "80% complete." Until the Maker network is truly permissionless and bonded on-chain, the set of active Makers is a team-controlled list.

## Fund Access Risk

Users send funds directly to Maker EOA addresses. This creates two fund-access risk vectors:

1. **Maker default:** A Maker could fail to relay (deliberately or due to technical failure). The MDC arbitration mechanism provides a path to recover funds from the Maker's deposited margin, but this requires the Sender to submit an on-chain arbitration request with proof. The process is not instant and depends on the MDC contract functioning correctly.

2. **Protocol admin:** Because MDC upgrade paths are not timelocked or publicly disclosed, a compromised admin key could theoretically drain or modify the MDC, which holds Maker margin deposits. Direct theft of user funds mid-transfer (while in the Maker's EOA) would require a malicious or compromised Maker, not the admin.

The fund-access risk is therefore rated `possible`: Makers hold live user funds in EOAs, and admin keys can potentially modify the compensation contract.

## Audits

Orbiter Finance has engaged SlowMist for three documented audit engagements:

1. **Official Cross-Chain Bridge** — SlowMist audit report (PDF linked in official docs)
2. **Decentralized Maker (OB\_ReturnCabin contracts)** — SlowMist audit report
3. **Swap & Bridge & OPOOL** — SlowMist audit report

All three audits are by a single firm (SlowMist). Audit dates are not disclosed in the public documentation. No findings summaries or remediation confirmations are publicly available. No second-opinion audit from an independent firm (e.g., Trail of Bits, Zellic, Spearbit) is documented. The audit scope covers core bridge and Maker contracts, but the ZK-SPV component's audit status is unclear.

Rated `multiple` (3 engagements from one reputable firm) rather than `extensive` (multiple independent firms, public findings, formal verification).

## External Dependencies

**Maker network — the central dependency:**

The entire bridge relies on Makers holding pre-funded balances on all supported destination chains and executing transfers in time. Key risks:

- **Maker concentration:** The current Maker set is whitelisted and small. If the dominant Maker(s) experience downtime, users on that route cannot complete transfers until the Maker resumes.
- **Maker insolvency:** A Maker could run out of liquidity on a destination chain, leaving transfers unconfirmed.
- **Bonding is marginal relative to throughput:** Makers hold 110–180 ETH in their EOA as operating liquidity, plus an additional margin in the MDC. For a $28B+ volume protocol, this margin pool may not cover large coordinated failures.
- **Arbitration latency:** The MDC dispute resolution process requires on-chain proofs and is not instantaneous. Users may wait hours or days for resolution if a Maker defaults.
- **Permissioned Maker set:** Becoming a Maker requires team approval. This is a centralized dependency that affects liveness and censorship resistance.

The Maker model is structurally similar to an optimistic bridge with a permissioned relayer set, rated `centralized`.

**Other dependencies:**

- ZK-SPV proof generation relies on functioning ZK infrastructure per chain. Failures in proof generation could delay arbitration.
- 60+ supported chains creates a wide attack surface; a vulnerability on any one chain's integration could affect bridge integrity on that route.

## Economic Risk

Orbiter's Maker model creates counterparty risk that traditional AMM bridges do not have. Users are effectively extending short-term credit to a Maker: they send funds, and trust the Maker will deliver on the other side within minutes. The MDC margin backstop provides a formal remedy, but the margin pool size relative to peak daily volumes is unknown. During periods of high volume or market stress, Makers could become capacity-constrained, causing transfers to queue or fail without automatic fallback.

The $50M+ annual revenue reported by the team is generated by Makers charging withholding and trading fees on each transfer. This economic incentive aligns Makers with reliable operation, but it does not eliminate the structural counterparty risk.

## Stage Assessment

**Stage 0 — Fully Assisted**

Orbiter Finance is classified as **Stage 0** based on multiple disqualifying characteristics:

| Criterion | Status | Detail |
|-----------|--------|--------|
| Upgradeability | Instant (assumed) | No public timelock documented; admin keys can modify MDC/EBC |
| Admin control | Multisig-weak | No public disclosure of multisig threshold or signer identity |
| Fund access | Possible | User funds held in Maker EOAs; MDC margin accessible via admin key |
| Audits | Multiple (one firm) | 3 SlowMist audits; no independent second opinion; dates undisclosed |
| External dependencies | Centralized | Whitelisted Maker set controlled by team; Maker bonding insufficient at scale |
| Track record | 3+ years, no protocol exploit | Discord/Twitter social engineering incidents; one October 2023 Maker availability incident (resolved without fund loss) |

For a bridge to qualify for Stage 1 it would need at minimum: a documented timelock of 48h+ on upgrades, a disclosed multisig with diverse signers, at least two independent audit firms, and either a permissionless or credibly bonded Maker set. Orbiter does not currently meet any of these thresholds.

The protocol has a strong operational track record — no loss of user funds from a protocol exploit in 3+ years, $28B+ volume, and a working dispute resolution mechanism. However, the trust model places significant reliance on the Orbiter team and a whitelisted Maker set, which is characteristic of Stage 0.

## Links

- [Orbiter Finance App](https://orbiter.finance)
- [Official Documentation](https://docs.orbiter.finance)
- [Bridge Protocol Overview](https://docs.orbiter.finance/welcome/bridge-protocol)
- [Maker System Documentation](https://docs.orbiter.finance/welcome/maker-system)
- [Security Audits Page](https://docs.orbiter.finance/faq/security-audits)
- [ZKP Applications](https://docs.orbiter.finance/welcome/zkp-applications)
- [Supported Chains](https://docs.orbiter.finance/supported-chains)
- [OB\_ReturnCabin Smart Contracts (GitHub)](https://github.com/Orbiter-Finance/OB_ReturnCabin)
- [Bridge Volume (DeFiLlama)](https://defillama.com/bridge/orbiter-finance)
- [OBT Token Announcement (The Block)](https://www.theblock.co/post/335392/orbiter-finance-obt-token-tge-airdrop)
