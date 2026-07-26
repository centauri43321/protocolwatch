---
name: "Alchemix"
category: "yield"
stage: 0
website: "https://alchemix.fi"
chains: ["ethereum", "optimism", "arbitrum"]
tvl: "$36M"
lastUpdated: "2026-05-16"
risks:
  upgradeability: "instant"
  adminControl: "multisig-diverse"
  fundAccess: "restricted"
  audits: "multiple"
  externalDependencies: "mixed"
  trackRecord: "5+ years; June 2021 self-bug (~$6.5M, no user loss); July 2023 Curve reentrancy treasury loss ($13.6M, largely recovered)"
---

# Alchemix Risk Assessment

## Overview

Alchemix is a self-repaying loan protocol. Users deposit yield-bearing collateral (yvDAI, yvWETH, wstETH, rETH, Aave aTokens, and others) and borrow up to 50% (alUSD on stablecoins) or 25% (alETH on ETH) as synthetic debt tokens. The collateral's yield gradually pays the loan down, eliminating liquidation risk on the user position itself — there is no margin call, no interest-rate model, and no third-party borrower demand.

V1 launched February 2021 on DAI/yvDAI only. V2 deployed in early 2022 with multi-collateral and multi-strategy support following a multi-month Runtime Verification engagement. V3, which introduces Meta-Yield Tokens and higher LTVs, completed its public audit competition on Immunefi in January 2026 and is approaching mainnet launch. As of May 2026, Alchemix's TVL is approximately $35.7M (DeFiLlama), with ~$33.2M on Ethereum, ~$2.1M on Optimism, and ~$0.4M on Arbitrum. This assessment focuses on the V2 deployment that holds the bulk of TVL on Ethereum mainnet.

## Smart Contract Risk

**Contract Architecture:**
- V2 uses **OpenZeppelin EIP-1967 Transparent Upgradeable Proxies**.
- Key mainnet contracts (Ethereum):
  - AlchemistV2 (alUSD) proxy: `0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd`
  - AlchemistV2 (alETH) proxy: `0x062bf725dC4cDF947aa79Ca2aaCCD4F385b13b5c`
  - AlchemistV2 Implementation: `0xf547b87Cd37607bDdAbAFd9bF1EA4587a0F4aCFb`
  - TransmuterV2 Implementation: `0xad2a6c1c6025be8c703930dcd921a2fa25220298`
  - DAI Transmuter V2: `0xA840C73a004026710471F727252a9a2800a5197F`
  - alETH Token: `0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6`
  - ALCX Token: `0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF`
- Core components: `AlchemistV2` (collateral and debt vault), `TransmuterV2` (peg-stabilization mechanism — alAsset holders redeem 1:1 for the underlying as borrowers repay), `TransmuterBuffer` (buffers transmuter inflows), `AlchemicTokenV2` (alUSD/alETH ERC-20 with mint/burn restricted to Alchemists), and `Whitelist` (gates which addresses can interact, used to limit composability/reentrancy surface).
- V1 used a different `Alchemist`/`Transmuter` design tied solely to yvDAI; V2 generalizes to per-yield-token configurations.

**Code Quality:**
- **Runtime Verification** — multi-month engagement; full V2 audit report delivered January 13, 2022 (seven-week review of AlchemistV2, AlchemicToken, TransmuterV2, TransmuterBuffer); resulted in significant design changes. The engagement is described as a design + code review rather than full formal verification proofs.
- **Code4rena** — V2 public audit contest, May 5–18, 2022, $125K prize pool. Outcome: 0 High, 17 Medium, 46 Low/QA findings.
- **Immunefi V3 Audit Competition** — concluded January 16, 2026, $100K pool, multiple Critical and High findings publicly disclosed.
- Engagements with Hacken and Spearbit are referenced in some community sources but could not be independently confirmed from primary documentation.
- Open source at github.com/alchemix-finance.
- Bug bounty active on Immunefi with maximum payout **$300,000** for critical smart contract vulnerabilities (minimum $35,000). One historical access-control bugfix payout has been publicly debriefed.

**Attack Surface:**
- Transparent-proxy upgradeability on AlchemistV2 and TransmuterV2: a malicious upgrade could in principle rewrite balances or drain collateral. The 24-hour timelock on the controlling multisig provides a partial exit window (see Admin/Governance).
- Multiple integrated yield strategies (Yearn V2, Aave, Lido, Rocket Pool) extend the attack surface to each integrated protocol's contract and oracle risk.
- Transmuter peg mechanism depends on continuous borrower repayment to honor 1:1 redemptions; under stress the queue can elongate.
- The 2021 alETH self-incident was an operator-configuration bug at deployment, not a contract bug per se — see Track Record.

## Admin/Governance Risk

**Governance Structure:**
- Two-tier Gnosis Safe structure:
  - **Operational Multisig** (`0x9e2b6378ee8ad2A4A95Fe481d63CAba8FB0EBBF9`): payroll, DeFi operations, no timelock.
  - **Treasury Timelocked Multisig** (`0x8392F6669292fA56123F71949B52d883aE57e225`): holds ALCX, receives protocol fees, holds admin rights over Alchemist and Transmuter parameters, guarded by a **24-hour timelock** on all function calls.
- Multisig signer thresholds and individual signer identities are not publicly attested in primary documentation.
- veALCX (locked 80/20 ALCX/ETH Balancer LP) provides voting power, emissions direction, and revenue share. Governance flow: forum signal → Snapshot vote → on-chain execution relayed via SafeSnap into the timelocked multisig. Governance is hybrid (Snapshot + on-chain), not a fully on-chain Governor-style executor.

**Key Controls:**
- In-contract roles: **Admin**, **Sentinel** (can disable yield tokens / emergency-pause minting), **Keeper** (calls `harvest()`), plus Curator/Allocator roles relevant to V3.
- ProxyAdmin is held by the Treasury Timelocked Multisig — upgrades to AlchemistV2 and TransmuterV2 implementations flow through the 24h timelock.
- Sentinel can pause minting and disable yield tokens immediately without timelock — a containment lever rather than a fund-movement lever.

**Trust Assumptions:**
- The 24-hour timelock provides a real but **sub-Stage-1** exit window (Stage 1 requires ≥48h). A motivated user has a day to detect a malicious upgrade and exit; a passive user does not.
- Multisig signer composition is unverified; Stage 1's diverse-independent-signer requirement cannot be confirmed.
- Sentinel can pause minting without timelock — used during the 2021 incident response — but cannot directly withdraw user collateral.
- Direct fund access via upgrade exists in principle but is gated by the timelock; the protocol's incident history demonstrates the team uses these powers operationally (treasury covered the 2021 shortfall, treasury team rescued alETH during the 2023 Curve drain).

## External Dependencies

**Oracle System:**
- **Chainlink** is used for collateral pricing (ETH/USD, stETH/ETH, and others where required).
- LST exchange rates are also read directly from the LST contracts themselves (rETH `getExchangeRate`, wstETH `stEthPerToken`), bypassing market-price oracles for the LST conversion path.
- This is a composite oracle approach: market-price feeds plus protocol-native exchange-rate calls.

**Off-Chain Actors:**
- **Keeper** role calls `harvest()` to claim yield from underlying strategies and credit it toward user debt. A stalled keeper would pause debt accrual against the loan but not threaten principal.
- **Sentinel** role can pause minting and disable yield tokens — used during incident response.

**Inherited Yield-Source Risk:**
- **Yearn V2** (yvDAI, yvUSDC, yvUSDT, yvWETH) — strategy and governance risk inherited.
- **Aave V2/V3** (aDAI, aUSDC, aWETH) — oracle and governance risk inherited.
- **Lido** (wstETH) — validator/slashing and DAO upgrade risk inherited.
- **Rocket Pool** (rETH) — node operator and oracle risk inherited.
- Alchemix inherits the full risk surface of each integrated yield source. Diversification across sources is partial protection against single-protocol failure but compounds the audit-scope footprint.

**Treasury Exposure:**
- Alchemix's AMO uses Curve and Balancer for peg stability. This was the surface exposed in the July 2023 Curve Vyper reentrancy incident — a treasury-side, not core-contract, exposure.

**Overall Rating Justification:**
Rated `mixed`. Chainlink and direct LST-contract exchange-rate reads are decentralized data sources, and integrated yield protocols are themselves broadly decentralized. Offsetting factors: the breadth of yield-source integrations compounds inherited risk surface, the keeper and sentinel roles are operationally trusted, and the 2023 Curve incident demonstrated realized treasury-side dependency loss.

## Economic Risk

**Liquidity Risk:**
- ~$35.7M total TVL as of May 2026, predominantly on Ethereum. This is materially below 2021–2022 peaks during the original alAsset launch cycle.
- Transmuter redemptions depend on continuous borrower repayment; secondary liquidity for alUSD and alETH on Curve/Balancer provides an alternative exit path subject to depth-dependent slippage.
- Per-yield-token deposit caps and Sentinel pause capability constrain the rate at which user funds can accumulate in any single yield source.

**Operational History:**
- V1 mainnet: February 2021. V2 mainnet: Q1 2022. Approximately 5+ years of operation.
- **June 16, 2021 — alETH self-incident ("reverse rug"):** An operator-configuration error at alETH transmuter launch — three vaults were added but the harvest function received the wrong index — caused yield to be credited to the wrong adapter and allowed alETH borrowers to withdraw ETH collateral without burning debt. Approximately 4,300 ETH of yield was mis-routed, producing an undercollateralization gap of ~$6.5M (~2,200 ETH). Alchemix halted minting within ~15 minutes; the treasury covered the gap. **No user funds were stolen** — borrowers received unintended free withdrawals. Yearn was not affected. Public reporting consistently cites ~4,300 ETH / ~$6.5M, not larger figures sometimes referenced informally.
- **July 30, 2023 — Curve Vyper reentrancy (treasury exposure):** Curve's alETH/ETH pool was drained via a compiler-level Vyper reentrancy bug. Alchemix's AMO position lost approximately 4,821 alETH and 7,258 ETH (~$13.6M). The treasury team rescued 8,027 alETH before the drain completed; the attacker subsequently returned 4,820.55 alETH within a week. This was a third-party dependency exposure, not an Alchemix contract bug.
- No other major incidents publicly reported. The protocol has progressed through increased audit coverage and the V3 audit competition in 2026.

## Stage Assessment

**Stage 0 Criteria Met:**

- ✓ Multiple audits — Runtime Verification (multi-month V2), Code4rena May 2022 public contest, Immunefi V3 audit competition January 2026, $300K Immunefi bug bounty
- ✓ 5+ years of mainnet operation; no direct loss of user collateral in any incident
- ✓ Sentinel-based emergency response — used effectively in the 2021 incident
- ⚠ Upgradeability: 24-hour timelock on the Treasury Multisig falls **below the Stage 1 ≥48h threshold**. Recorded as `instant` in frontmatter under the conservative default, with the actual 24-hour delay documented in the assessment text
- ⚠ Admin control: `multisig-diverse` recorded based on the two-tier multisig + veALCX governance overlay; signer thresholds and identities are not publicly attested
- ⚠ Fund access: `restricted` — direct drain requires an upgrade gated by the 24h timelock; Sentinel can pause but not withdraw user collateral
- ⚠ External dependencies: `mixed` — multiple integrated yield sources (Yearn, Aave, Lido, Rocket Pool) add inherited risk; 2023 Curve incident realized treasury-side exposure

**Why Not Stage 1:**
- **Upgradeability:** Stage 1 requires a **≥48-hour timelock** on critical upgrades. Alchemix's controlling timelock is 24 hours — half the Stage 1 threshold.
- **Admin control:** Multisig signer composition and threshold are not publicly attested; Stage 1's "diverse, independent signers" requirement cannot be verified.
- **External dependencies:** Breadth of inherited yield-source risk and realized 2023 treasury-side loss keep this `mixed` rather than `decentralized`.

**Justification:**
Alchemix is classified as Stage 0 (Fully Assisted). The principal Stage 1 blocker is the 24-hour timelock, which gives users a real but sub-Stage-1 exit window. Audit coverage, incident response history, and the absence of any direct user-collateral loss across two notable incidents reflect a mature operational posture, but they do not substitute for the framework's structural Stage 1 requirements. Extending the timelock to ≥48 hours, publicly attesting the multisig signer set, and either narrowing or further documenting Sentinel powers would close most of the gap to Stage 1. The breadth of inherited yield-source risk would still keep external dependencies at `mixed`, making a clean Stage 1 plausible but not Stage 2 in any near-term scenario.

## Links

- [Official Website](https://alchemix.fi)
- [Documentation](https://alchemix-finance.gitbook.io/v2)
- [GitHub](https://github.com/alchemix-finance)
- [Runtime Verification V2 Audit](https://runtimeverification.medium.com/alchemix-v2-audit-and-reviewed-code-fixes-75fd72d6f469)
- [Code4rena V2 Report](https://code4rena.com/reports/2022-05-alchemix)
- [Immunefi V3 Audit Competition](https://immunefi.com/audit-competition/alchemix-v3-audit-competition/)
- [Bug Bounty](https://immunefi.com/bug-bounty/alchemix/)
- [Governance Forum](https://forum.alchemix.fi)
- [2021 Incident Post-Mortem (CoinDesk)](https://www.coindesk.com/tech/2021/06/16/free-money-bug-hits-defi-platform-alchemix)
- [2023 Curve Exploit Post-Mortem](https://alchemixfi.medium.com/curve-exploit-post-mortem-7142e78bc339)
- [DeFiLlama](https://defillama.com/protocol/alchemix)
