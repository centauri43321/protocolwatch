---
name: "Renzo"
category: "liquid-staking"
stage: 0
website: "https://www.renzoprotocol.com"
chains: ["ethereum", "arbitrum", "base", "linea", "optimism", "bsc", "blast"]
tvl: "$192M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "timelock-48h+"
  adminControl: "multisig-diverse"
  fundAccess: "possible"
  audits: "extensive"
  externalDependencies: "mixed"
  trackRecord: "2+ years, April 2024 ezETH depeg (>$65M in third-party liquidations, no contract exploit)"
---

# Renzo Risk Assessment

## Overview

Renzo is a liquid restaking protocol built on top of EigenLayer. Its primary product, **ezETH**, is a reward-bearing ERC-20 receipt token; users deposit ETH, stETH, wBETH, or wstETH, and ezETH's ETH exchange rate accrues over time as EigenLayer restaking and Ethereum staking rewards compound. A secondary product, **pzETH**, is a Symbiotic-based restaking token launched in collaboration with Mellow Protocol that accepts stETH/wstETH/wETH/ETH and secures AVSs in the Symbiotic ecosystem.

Renzo launched in late 2023 and grew rapidly during the 2024 EigenLayer points cycle, peaking above $3.3B TVL in April 2024 before contracting roughly 94% to approximately $192M by May 2026 (DeFiLlama), of which ~$155M is on Ethereum. The protocol is deployed across roughly 13 chains, with L2-native restaking using Hyperlane as the cross-chain messaging layer and Chainlink for price feeds. The REZ governance token launched April 30, 2024 via Binance Launchpool. The protocol's most material historical event is the April 24, 2024 ezETH depeg, which caused >$65M of cascading liquidations on third-party lending markets without a Renzo contract exploit.

## Smart Contract Risk

**Contract Architecture:**
- Core contracts are upgradeable behind **OpenZeppelin transparent proxies** (`Initializable` base). Key modules:
  - `RestakeManager` — primary user entry point; orchestrates deposits across `OperatorDelegator` contracts with configurable allocations.
  - `ezETH` — reward-bearing ERC-20 LRT.
  - `OperatorDelegator` (per operator) — wraps EigenLayer's `StrategyManager`, `DelegationManager`, and `EigenPodManager`.
  - `DepositQueue` — buffers ETH until 32 ETH is accumulated, then deposits to the Beacon Chain with withdrawal credentials pointing at the EigenPod.
  - `WithdrawQueue` — handles ezETH redemption requests (added post-depeg).
  - `RenzoOracle` — internal oracle aggregating LST collateral values.
  - `RewardHandler` — receives consensus and execution layer rewards.
  - `RoleManager` — central access-control registry.
- Known mainnet addresses:
  - `RestakeManager`: `0x74a09653A083691711cF8215a6ab074BB4e99ef5`
  - `ezETH`: `0xbf5495Efe5DB9ce00f80364C8B423567e58d2110`
  - `WithdrawQueue`: `0x5efc9D10E42FB517456f4ac41EB5e2eBe42C8918`
- Roles defined in `RoleManager` include `RX_ADMIN`, `RX_OPERATOR`, `RX_PAUSER`, `RX_PRICE_FEED_SENDER`, `RX_NATIVE_ETH_RESTAKE_ADMIN`, and `RX_EMERGENCY_WITHDRAW_TOKEN_ADMIN`. The emergency-withdraw role in particular grants privileged movement of token balances.

**Code Quality:**
- Halborn — November 2023 (EVM contracts), April 2024 (REZ staking), May 2024 (protocol withdrawals), September 2024 (ezRVaults flow).
- Code4rena — April–May 2024 public audit contest covering withdrawals and L2 restaking ($112,500 pot; 8 High and 14 Medium unique findings). Code4rena mitigation review June 2024.
- Sigma Prime — June 2024 restaking-security review.
- Nethermind — April 2025 (general protocol), May 2025 (Renzo Bridge).
- No public formal verification (e.g., Certora) is listed.
- Open source at github.com/Renzo-Protocol/contracts-public.
- Bug bounty active on Immunefi with maximum payout **$500,000** for critical smart contract vulnerabilities (capped at 10% of funds at risk, minimum $100K); web/app critical capped at $25K; nine assets in scope.

**Attack Surface:**
- Transparent-proxy upgradeability on every core contract, gated by the admin multisig and a reported ≥48-hour timelock. A malicious upgrade could reroute deposits or withdrawals.
- `RX_EMERGENCY_WITHDRAW_TOKEN_ADMIN` and `RX_NATIVE_ETH_RESTAKE_ADMIN` roles grant privileged token movement; their exact scope per contract is not exhaustively documented publicly.
- Downstream exposure to EigenLayer admin controls and AVS slashing.
- No known direct Renzo contract exploit. The April 2024 ezETH depeg was a market/liquidity event tied to airdrop design and the absence of native withdrawals at the time, not a contract bug.

## Admin/Governance Risk

**Governance Structure:**
- Upgrade and parameter authority is held by the **Renzo team multisig**, gated through `RoleManager` roles. Third-party assessments report **≥4 signers** with a **≥48-hour timelock** before upgrades take effect; exact signer count, identities, and threshold are not publicly attested and could not be confirmed from primary sources.
- REZ governance scope (per Binance/Renzo announcements) covers risk parameters, deposit and collateral concentration limits, operator whitelisting, and AVS whitelisting. Governance is conducted **off-chain via Snapshot** at gov.renzoprotocol.com, with the team multisig executing approved proposals on-chain. No on-chain governor contract has been confirmed.

**Key Controls:**
- `RX_PAUSER` can pause deposits/withdrawals.
- Timelock-gated upgrade path covers RestakeManager, OperatorDelegators, and ezETH.
- Emergency-withdraw and native-ETH-restake admin roles allow privileged token operations outside the standard deposit/withdraw flow.
- Operator and AVS whitelists are governance-controlled — adding or removing operators changes where user ETH gets delegated on EigenLayer.

**Trust Assumptions:**
- The 48-hour timelock provides a user exit window in principle, but the existence of emergency-withdraw roles materially reduces that protection — those roles can act without the timelock.
- Multisig signer composition is unverified; a Stage 1-qualifying diverse, independent signer set cannot be confirmed.
- Direct fund-access risk is `possible`, not `restricted`, because the emergency-withdraw role can move token balances without the timelock buffer.

## External Dependencies

**Oracle System:**
- `RenzoOracle` computes ezETH/ETH exchange rate internally from on-chain accounting of LST and EigenLayer Strategy balances. The internal rate is exposed externally via a Balancer rate provider and via Chainlink ezETH/ETH exchange-rate feeds on Arbitrum and other chains for integrator use.
- LST collateral is valued at an internal/fair rate rather than at market price. This design choice contributed to the April 2024 depeg dynamics: external secondary markets (Uniswap, Balancer) priced ezETH well below the internal rate when forced selling overwhelmed thin liquidity and native withdrawals were not yet available.

**Off-Chain Actors:**
- **Permissioned EigenLayer operators:** Renzo delegates restaked ETH to a curated whitelist (Figment as primary partner, plus Pier Two, P2P.org, Hashkey Cloud, and others). Operator selection is governance-controlled; no on-chain Renzo-level bond is required of operators beyond EigenLayer's own slashing exposure.
- **EigenLayer dependency:** ezETH inherits EigenLayer's smart contract risk, operator network behavior, and AVS slashing conditions for the restaked portion of TVL.
- **Cross-chain messaging:** L2-native restaking uses **Hyperlane** as the cross-chain messaging layer. xezETH on L2s inherits Hyperlane's validator-set trust assumptions. Chainlink supplies the L2 price feeds. The earlier Connext-based L2 deposit flow has been superseded per current docs.
- **MEV-Boost:** Operators run MEV-Boost at the validator level following industry-standard practice; an explicit Renzo-level relay policy is not publicly documented.

**Overall Rating Justification:**
Rated `mixed`. The permissioned EigenLayer operator set is curated by governance with no Renzo-level bond, the cross-chain path depends on Hyperlane's validator set, and the internal exchange-rate design proved fragile under stress in April 2024 when secondary liquidity diverged sharply from the internal rate. Offsetting factors: the internal accounting approach avoids external price-oracle dependence in the redemption path, native withdrawals shipped post-depeg, and audit coverage of the cross-chain bridge is current (Nethermind, May 2025).

## Economic Risk

**Liquidity Risk:**
- ~$192M total TVL as of May 2026, down ~94% from the April 2024 peak of ~$3.3B+.
- ezETH secondary liquidity remains concentrated on Balancer, Curve, and Uniswap; the April 2024 depeg demonstrated that under stress, secondary liquidity can be insufficient to absorb forced sellers without large dislocations.
- Native ezETH withdrawals are now live (post-Pectra/withdrawal release), providing a redemption path that bypasses secondary markets but is gated by validator exit queues and the WithdrawQueue.

**Operational History:**
- Mainnet launch: late 2023 (deposits accepted from approximately October 30, 2023; public launch commonly cited as December 2023).
- **April 24, 2024 — ezETH depeg incident:** Following the REZ airdrop snapshot/announcement, which excluded certain large and restricted users, ezETH crashed to approximately $688 intraday on Uniswap against an ETH price near $3,200. Triggers included airdrop exclusion-driven forced selling, the absence of native withdrawals at the time (exit was only via roughly $200M of secondary liquidity, mostly on Blast), and end-of-Season-1 farming rotation. Cascading liquidations on Morpho (~10K ezETH) and Gearbox (~10K ezETH) totaled more than $65M, with protocol-level bad debt of ~$34K on Morpho and ~$83K on Gearbox. Renzo subsequently modified airdrop parameters in response to community pressure and prioritized shipping native withdrawals (audited by Halborn May 2024 and Code4rena April 2024).
- No known direct smart-contract exploit in 2+ years of operation.
- TVL contraction from peak is consistent with the broader LRT-cycle unwind, not a Renzo-specific solvency event.

## Stage Assessment

**Stage 0 Criteria Met:**

- ✓ Extensive audits — Halborn (×4), Code4rena (×2 including mitigation review), Sigma Prime, Nethermind (×2); $500K Immunefi bug bounty
- ✓ 2+ years of mainnet operation; no direct contract exploit
- ✓ Upgradeability: `timelock-48h+` — third-party assessments report ≥48h timelock on standard upgrades; the on-chain TimelockController address could not be independently confirmed and is flagged as unverified
- ⚠ Admin control: `multisig-diverse` recorded on the assumption of ≥4 signers per third-party reports; signer identities, threshold, and independence are not publicly attested
- ⚠ Fund access: `possible` — `RX_EMERGENCY_WITHDRAW_TOKEN_ADMIN` role can move token balances outside the timelock buffer, exceeding the `restricted` threshold
- ⚠ External dependencies: `mixed` — permissioned EigenLayer operator whitelist with no Renzo-level bond; cross-chain dependence on Hyperlane; internal exchange-rate design proved fragile under April 2024 stress

**Why Not Stage 1:**
- **Fund access:** Emergency-withdraw and native-ETH-restake admin roles allow privileged token movement without timelock gating. Stage 1 requires admin powers to be clearly scoped with no direct fund access — the existing emergency roles fail this test.
- **Admin control:** Multisig threshold and signer diversity are not publicly attested; Stage 1 requires a verifiable diverse 3-of-5+ multisig or decentralized governance.
- **External dependencies:** The combination of permissioned operator whitelist (no on-chain bond), Hyperlane cross-chain dependency, and demonstrated stress-time fragility of the internal exchange-rate design prevents the `decentralized` rating Stage 1 prefers.

**Justification:**
Renzo is classified as Stage 0 (Fully Assisted). Audit coverage is `extensive`, native withdrawals shipped after the April 2024 incident, and no direct contract exploit has occurred. The Stage 1 blockers are structural rather than reputational: the emergency-withdraw role provides a non-timelocked fund-movement path, multisig composition is unverified, and the April 2024 depeg — though not a contract bug — demonstrated that the internal-rate design combined with thin secondary liquidity can produce >$65M of third-party liquidations under stress. Publishing the multisig and TimelockController on-chain configuration, narrowing or removing the emergency-withdraw role, and adding on-chain operator constraints would materially close the gap to Stage 1.

## Links

- [Official Website](https://www.renzoprotocol.com/)
- [Documentation](https://docs.renzoprotocol.com/)
- [GitHub](https://github.com/Renzo-Protocol/contracts-public)
- [Audit Reports](https://docs.renzoprotocol.com/docs/security/audits)
- [Code4rena April 2024 Report](https://code4rena.com/reports/2024-04-renzo)
- [Bug Bounty](https://immunefi.com/bug-bounty/renzoprotocol/)
- [Governance Forum](https://gov.renzoprotocol.com)
- [DeFiLlama](https://defillama.com/protocol/renzo)
