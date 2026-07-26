---
name: "Symbiosis"
category: "bridges"
stage: 0
website: "https://symbiosis.finance"
chains: ["ethereum", "arbitrum", "optimism", "polygon", "base", "avalanche", "bnb-chain", "tron", "bitcoin", "ton"]
tvl: "$9.6M"
lastUpdated: "2026-03-18"
risks:
  upgradeability: "instant"
  adminControl: "multisig-weak"
  fundAccess: "possible"
  audits: "multiple"
  externalDependencies: "centralized"
  trackRecord: "4+ years, no exploits"
---

# Symbiosis Risk Assessment

## Overview

Symbiosis is a cross-chain liquidity protocol and meta-aggregator that enables token swaps across 60+ EVM and non-EVM networks including Bitcoin, TON, and TRON. Unlike pure messaging bridges, Symbiosis routes swaps through liquidity pools on each chain and uses a permissioned MPC relayer network to pass signed calldata between chains.

The protocol launched its beta mainnet on March 9, 2022, having raised a $2M seed round in October 2021 from investors including Blockchain.com Ventures, KuCoin Ventures, Primitive Ventures, and Wave Financial. It has processed $3.7B in volume and 1.3M cross-chain transactions in 2025 with no documented smart contract exploits. Current TVL is approximately $9.6M — modest relative to volume, reflecting its role as an aggregation layer rather than a deep liquidity venue.

The SIS token was launched on Ethereum in November 2021 and serves as the governance and staking token for the relayer network, though meaningful on-chain governance has not been demonstrated — admin control remains concentrated with the Symbiosis team.

## Smart Contract Risk

**Contract Architecture:**

- **Portal** (`0xb8f275fbf7a959f4bce59999a2ef122a099e81a8` on Ethereum): Locks and unlocks user stablecoins during cross-chain operations. Deployed as an ERC1967 transparent upgradeable proxy, with the implementation at `0x57dbcb192fa64bf07eab76941d1dae5177c8f4f3`. This is the most security-critical contract as it holds bridged assets.
- **Synthesis**: Mints and burns synthetic sTokens on the destination chain. Also deployed with an upgradeable proxy pattern.
- **BridgeV2**: Acts as the interface between the on-chain Portal/Synthesis contracts and the off-chain MPC relayer network. Deployed per supported chain.
- **MetaRouter / MetaRouterGateway**: Handle cross-chain swap routing and user token approvals. Users should only approve MetaRouterGateway, which secures ERC-20 token interactions.

**Upgradeability:**

The Portal contract (and related core contracts) use OpenZeppelin's transparent proxy pattern, enabling the admin to push arbitrary implementation upgrades. An Omniscia security audit found the owner has wide-ranging powers (e.g., `setMetaRouter` allows reconfiguring a critical contract address). The Symbiosis team acknowledged this in their audit response, stating they would place the owner behind "a multisignature wallet and timelock implementation" — however, no timelock duration is specified in public documentation, and the audit confirmed no hardcoded timelock exists in the contract itself. Without a verifiable on-chain timelock, upgrades are effectively instant once the multisig threshold is met. This is rated `instant`.

**Code Quality:**

- 8+ security audits have been completed since launch, covering different parts of the protocol:
  - **Omniscia**: EVM core contracts (Portal, Bridge) — found 3 issues in Portal including unrestricted access to `revertBurnRequest` and owner privilege concentration
  - **SlowMist**: EVM core contracts
  - **Zokyo**: EVM core (x2), MetaRouterV3 update, Pool contracts, TON bridge, NEAR core
  - **Decurity**: Depository contracts (2022), Frontend app, Relayers Network (2024)
  - **HashCloak**: Terra core (now deprecated)
- Bug bounty on Immunefi: up to $100,000 for critical smart contract vulnerabilities (MetaRouter, MetaRouterGateway on ETH/BSC/Avalanche/Polygon)
- Core contracts are open source: [github.com/symbiosis-finance/core-contracts](https://github.com/symbiosis-finance/core-contracts)
- Decurity's 2024 audit of the relayer network is notable as the most recent coverage of the most centralized component

**Attack Surface:**

- The upgradeable Portal contract holding locked assets is the primary risk: a compromised or malicious multisig could push an implementation upgrade to drain locked funds
- MetaRouterGateway holds user token approvals — a flaw here can expose users who have approved the contract
- The MPC relayer network is a second major attack surface: if 2/3 of active MPC nodes are compromised or collude, they can construct fraudulent cross-chain messages. The LI.FI deep-dive explicitly identifies this as a fund-theft vector
- Synthesis contract minting logic: a bug here could allow unbacked sToken minting, which could be redeemed against the Portal's locked assets

## Admin/Governance Risk

**Governance Structure:**

- The SIS token confers governance rights via veSIS (received when staking SIS). Governance is described as controlling protocol upgrades and parameter adjustments through a DAO. However, there is no evidence of an on-chain governor contract with enforced timelocks governing the core contracts — admin changes appear to be executed by the Symbiosis team multisig directly.
- All modifications to PoS Staking Contracts, On-Chain Configuration, and Core Contracts require multisig approval. The specific multisig threshold (M-of-N signers) and signer identities are not publicly disclosed in documentation.
- The Veto Group — a set of 1–2 trusted relayer nodes manually selected by Symbiosis sysadmins — must co-sign every MPC group signature. A single Veto Group member abstaining halts all cross-chain transaction processing. This veto power is assigned by Symbiosis administrators, not through a decentralized process.
- Future plans exist to transition Veto Group assignment and epoch management to a decentralized mechanism, but this has not been implemented as of the assessment date.

**Key Controls:**

- Multisig can upgrade Portal and BridgeV2 implementations without an enforced on-chain delay
- Symbiosis sysadmins control which nodes are registered as Veto Group members — they can effectively halt or censor the bridge by controlling these 1–2 nodes
- Up to 100 relayer nodes can join the MPC network, but registration in PoS Staking Contracts is gated by sysadmin flagging
- The `setMetaRouter` function in Portal allows the owner to reroute cross-chain logic to an arbitrary address

**Rating Justification:**

The multisig is undisclosed in threshold and composition, the Veto Group is sysadmin-controlled (not community-controlled), and the relayer registration process is manually permissioned. This is rated `multisig-weak` rather than `multisig-diverse` because the multisig controls are not independently verifiable, no on-chain timelock is confirmed, and effective protocol control (relayer veto power, upgrade authority) is concentrated with the Symbiosis team.

## External Dependencies

**MPC Relayer Network:**

- Symbiosis operates a permissioned MPC (Multi-Party Computation) network using threshold signature scheme (TSS)
- A valid cross-chain signature requires approval from at least 2/3 of the active MPC group for a given epoch
- Up to 100 nodes can participate; the active MPC group for each epoch is selected by an on-relayer algorithm, weighted by stake
- Relayer registration requires: (1) staking SIS in PoS Staking Contracts, and (2) being flagged as trusted by Symbiosis sysadmins. Nodes not manually registered cannot participate regardless of stake
- The **Veto Group** (1–2 nodes, sysadmin-appointed) must participate in every MPC signature. A single Veto Group member withholding participation silently halts cross-chain processing
- No slashing conditions are documented for malicious behavior, only the ability for sysadmins to "block" misbehaving nodes
- The Decurity 2024 audit covered the relayer network, providing some external validation of the off-chain codebase

**Transition to PoS:**

- Symbiosis has been transitioning from a pure Proof of Authority model toward PoS, requiring a minimum of 100,000 SIS stake to become a validator
- Symbiotic restaking vault integration allows additional collateral from external stakers
- Despite the PoS framing, the permissioned entry requirement (sysadmin approval) means this is not yet a trust-minimized validator set

**Oracle Dependencies:**

- The MPC network functions as its own oracle layer — relayers observe events on the source chain and relay signed calldata to the destination chain
- There are no external price oracle dependencies (Chainlink, etc.) in the core bridge flow
- This concentrates trust in the relayer network rather than distributing it across independent oracle providers

**Overall Rating Justification:**

For bridge protocols, a permissioned relayer set without meaningful slashing, with sysadmin-controlled veto power, and with no on-chain proof of valid state transitions is rated `centralized`. While the 2/3 TSS threshold provides some redundancy against individual node failure, the effective control exercised by Symbiosis sysadmins over Veto Group membership makes this a permissioned system operationally controlled by the team.

## Economic Risk

**TVL and Liquidity:**

- Current TVL: ~$9.6M (March 2026), down from higher levels during the 2022–2023 expansion period
- The protocol operates primarily as an aggregation and routing layer — TVL represents assets locked in stablecoin pools and the Portal contract, not the full value of assets bridged
- $3.7B in 2025 volume demonstrates real usage despite modest TVL, reflecting the aggregator model

**Fund Safety:**

- Assets locked in the Portal contract are exposed to smart contract upgrade risk (upgradeable proxy, multisig-controlled)
- A 2/3 MPC collusion or Veto Group compromise would enable constructing fraudulent calldata authorizing unauthorized Portal unlocks
- sToken holders (holders of Symbiosis synthetic tokens) rely on the Portal's locked collateral remaining intact; a Portal exploit would leave sTokens unbacked

**Operational History:**

- Beta mainnet: March 9, 2022
- SIS token: November 2021
- No smart contract exploits identified in 4+ years of operation
- No documented incidents involving unauthorized fund access
- Operated through multiple market stress events (LUNA/UST collapse, FTX collapse, 2022 bear market) without fund loss
- The protocol survived a period (2022) when numerous other cross-chain bridges were exploited ($1B+ total across Ronin, Wormhole, Nomad, Harmony)

## Stage Assessment

**Stage 0 — Fully Assisted**

Symbiosis is rated Stage 0 due to the combination of:

1. **Instant upgradeability**: Core contracts (Portal, BridgeV2, Synthesis) use transparent upgradeable proxies. No on-chain timelock is confirmed; the Omniscia audit noted the team committed to a timelock but found no such mechanism in the contract code. Multisig can push implementation upgrades without a community-observable delay.

2. **Centralized external dependencies**: The MPC relayer network is permissioned — nodes must be manually approved by Symbiosis sysadmins. The Veto Group (1–2 nodes) is sysadmin-appointed and can halt the entire network unilaterally. No slashing mechanism is documented for malicious behavior.

3. **Fund access is possible**: The upgradeable Portal contract holds all locked assets. A multisig action (with no confirmed timelock) can push a malicious implementation that drains funds. Additionally, a 2/3 MPC group compromise enables unauthorized unlocks via fraudulent calldata.

**Why Not Stage 1:**

Stage 1 requires a 48h+ timelock on upgrades and either diverse multisig or governance control. Symbiosis has not publicly demonstrated an on-chain timelock on the Portal contract, and the multisig threshold/composition is not disclosed. The relayer network's permissioned entry and sysadmin veto control also prevents reaching the `mixed` or `decentralized` external dependency threshold required for Stage 1.

**Positive Factors (noted but insufficient for Stage upgrade):**

- 8+ audits across multiple firms — more than most Stage 0 protocols
- 4+ years of operation without an exploit — meaningful real-world validation
- SIS staking mechanism and PoS transition represent a credible decentralization roadmap
- Bug bounty on Immunefi provides ongoing incentive for vulnerability disclosure
- The 2/3 MPC threshold (not 1-of-N) provides redundancy against individual node failure

**Path to Stage 1:**

- Deploy and verify an on-chain timelock (minimum 48h) governing all Portal and BridgeV2 upgrades
- Publicly disclose multisig threshold, signer count, and signer identities (or demonstrate on-chain governance)
- Publish verifiable Veto Group composition and transition its management to an on-chain process
- Document and implement slashing conditions for malicious relayer behavior

## Links

- [Official Website](https://symbiosis.finance)
- [Documentation](https://docs.symbiosis.finance)
- [GitHub — Core Contracts](https://github.com/symbiosis-finance/core-contracts)
- [GitHub — Audit Reports](https://github.com/symbiosis-finance/audits)
- [Portal Contract (Etherscan)](https://etherscan.io/address/0xb8f275fbf7a959f4bce59999a2ef122a099e81a8)
- [BridgeV2 Contract (Etherscan)](https://etherscan.io/address/0xd5f0f8db993d26f5df89e70a83d32b369dccdaa0)
- [Bug Bounty (Immunefi)](https://immunefi.com/bug-bounty/symbiosis/information/)
- [SIS Staking](https://staking.symbiosis.finance)
- [Omniscia Audit — Portal/Bridge](https://omniscia.io/reports/symbiosis-finance-router-bridge/manual-review/Portal-POR/)
- [DeFiLlama TVL](https://defillama.com/protocol/symbiosis)
- [LI.FI Deep Dive](https://li.fi/knowledge-hub/symbiosis-a-deep-dive/)
