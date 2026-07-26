---
name: "Tornado Cash"
category: "privacy"
stage: 2
website: "https://tornadocash.eth.limo/"
chains: ["ethereum", "arbitrum", "optimism", "polygon", "avalanche", "bsc"]
tvl: "$250M"
lastUpdated: "2026-05-15"
# Stage 2 via battle-tested override (single audit, but immutable + no fund access + no external deps + 6+ years at $400M+ peak TVL with no core exploit)
risks:
  upgradeability: "immutable"
  adminControl: "none"
  fundAccess: "impossible"
  audits: "single"
  externalDependencies: "none"
  trackRecord: "6+ years, OFAC sanctions August 2022 (delisted March 2025), governance hack May 2023 (~$1M+ TORN)"
---

# Tornado Cash Risk Assessment

## Overview

Tornado Cash is a non-custodial privacy protocol on Ethereum and several EVM chains that breaks the on-chain link between deposit and withdrawal addresses using zk-SNARK proofs.

Users deposit a fixed denomination (e.g., 0.1, 1, 10, or 100 ETH) into a pool contract, receive a secret note, and can later withdraw the same denomination to a fresh address by submitting a zero-knowledge proof of inclusion in the deposit Merkle tree without revealing which deposit. The core pool contracts are immutable and ownerless: there is no admin, no pause, no upgrade path. The protocol drew US Treasury OFAC sanctions in August 2022 and remains the subject of ongoing criminal prosecutions against its developers; the core contracts continue to operate autonomously.

## Smart Contract Risk

**Contract Architecture:**
- Each denomination is its own immutable contract — no proxy, no admin, no upgrade authority
- Ethereum mainnet ETH pools: 0.1 ETH (`0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc`), 1 ETH (`0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936`), 10 ETH (`0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF`), 100 ETH (`0xA160cdAB225685dA1d56aa342Ad8841c3b53f291`)
- ERC-20 pools (DAI, USDC, USDT, WBTC, cDAI) follow the same immutable pattern
- Pool logic: an append-only Merkle tree of commitments plus a per-denomination Groth16 verifier contract
- Deployer keys were burned in a public ceremony in May 2020 — no party can alter or stop the pool contracts

**Code Quality:**
- Audited by ABDK Consulting (2019) covering core mixer contracts and the underlying circuits
- Additional internal review by PepperSec (founders' firm) and informal community/circuit review (e.g., ZoKrates contributors)
- Groth16 trusted setup performed in two phases: Phase 1 reused the Perpetual Powers of Tau ceremony; Phase 2 was a Tornado-specific ceremony with ~1,114 participants. Soundness holds if any single participant honestly discarded their toxic waste
- Open source; codebase has been forked, mirrored, and analyzed extensively
- Bug bounty inactive post-sanctions

**Attack Surface:**
- Smart contracts: minimal — no admin functions, no external calls beyond ERC-20 transfers in the token pools
- Cryptographic: relies on the integrity of the trusted setup and on Groth16 zk-SNARK soundness
- Operational: anonymity set depends on number and timing of deposits; using small denominations or correlated timing degrades privacy. Compliance/sanctions risk is now part of the threat model for any user
- No core pool has been exploited in 6+ years of operation

## Admin/Governance Risk

**Governance Structure:**
- Core pool contracts have **no owner, no governance hook, and no admin role**
- TORN token launched December 2020 to govern peripheral systems only: the relayer registry, staking/reward distribution, and the governance treasury
- Governance is a Compound-style Governor controlling a Vault contract that holds locked TORN
- Governance has no authority over the immutable mixer pools

**Key Controls:**
- No pause, no upgrade, no parameter changes on the core pools
- Governance can change peripheral parameters: relayer registration, staking rewards, treasury spending
- No emergency mechanisms on the pools themselves

**Trust Assumptions:**
- Users trust the trusted setup ceremony (one honest participant suffices) and the zk-SNARK implementation
- Users do **not** trust any operator, multisig, or governance body for fund safety on the core pools
- Compromise of the TORN governance system cannot drain user deposits from the pools — confirmed by the May 2023 hack, in which an attacker submitted a malicious proposal (#20) using a CREATE2 deployment trick, took control of the governance contract, and minted/drained ~$1M+ in TORN. A subsequent community recovery proposal restored governance; the mixer pools were unaffected throughout

## External Dependencies

**Oracle System:**
- None. Pools handle fixed denominations only; no pricing is required

**Off-Chain Actors:**
- Relayers: permissionless third parties that submit withdrawal transactions on behalf of users so the user does not need a gas-funded address (which would deanonymize them). The withdrawal recipient is bound into the zk proof, so relayers **cannot steal user funds** — they can only censor (refuse to relay) or take their declared fee
- Relayers register by staking TORN in the on-chain Relayer Registry for sybil/spam resistance. They are not slashable for misbehavior in the user-fund sense
- A user can always self-relay (at the cost of weakened privacy if their address has a history)
- No bridge dependencies; each chain deployment is independent

**Overall Rating Justification:**
None. The core privacy guarantee and the safety of user funds require no oracle, no keeper, no off-chain attestation, and no bridge. Relayers are a UX convenience and cannot affect fund safety because the recipient is bound into the zk proof. The protocol functions identically regardless of whether any specific relayer, frontend, or team member is online.

## Economic Risk

**Liquidity Risk:**
- "TVL" is the cumulative undrawn deposits across pools; estimated ~$250M as of 2026, down from a ~$400M+ peak in mid-2022
- A meaningful share is presumed unrecoverable due to lost notes, sanctions-related caution by depositors, or operational opsec choices
- Withdrawals do not require liquidity matching — each pool is denomination-locked; a depositor of 1 ETH can always withdraw 1 ETH so long as the pool holds at least that amount (which it does by construction since deposits and withdrawals are 1:1)

**Operational History:**
- Launched August 2019 (ETH mixer); broader denominations and ERC-20 pools rolled out late 2019 through 2020
- Deployer keys ceremonially burned May 2020
- TORN token and governance launched December 2020
- **OFAC sanctions:** August 8, 2022 — US Treasury added Tornado Cash addresses to the SDN list. In November 2024 the Fifth Circuit ruled in *Van Loon v. Treasury* that immutable smart contracts are not "property" under IEEPA; OFAC formally delisted the addresses in March 2025
- **Alexey Pertsev:** arrested in the Netherlands August 2022; convicted of money laundering May 2024 (64-month sentence); appeal pending
- **Roman Storm:** US trial July–August 2025; convicted on one count (unlicensed money transmitter), hung jury on others
- **Governance hack:** May 20–21, 2023, ~$1M+ TORN drained via malicious proposal; pools unaffected; governance later recovered
- Codebase effectively frozen since 2022; community-maintained UI mirrors on IPFS

## Stage Assessment

**Stage 2 Criteria Met (via battle-tested override):**

- ✓ Immutable core contracts — no proxy, no admin, no upgrade path; deployer keys ceremonially burned in 2020
- ✓ No admin control over pools — no owner, no privileged role; the May 2023 governance hack confirmed governance cannot touch the mixer pools
- ✓ No fund access — no admin function can move, freeze, or redirect user funds; relayers are bound by the zk proof
- ✓ No external dependencies — no oracles, no off-chain attestations, no bridges; relayers are optional and cannot steal funds
- ✓ 6+ years of production operation with no core-pool exploit, surviving sanctions and prosecution of developers
- ⚠ Audits: single — ABDK Consulting (2019) covered the core mixer contracts; additional review via the 1,114-participant trusted setup ceremony. Qualifies for the battle-tested override: immutable core, no fund access, no external dependencies, and >$100M TVL sustained for well over 3 years with no core exploit

**Justification:**
Tornado Cash's core pools are a textbook trustless design: immutable contracts, no admin, no upgrade path, no oracle, and no off-chain trust beyond optional relayers (which are bound by the zk proof and cannot steal funds). The 2023 governance hack on the peripheral TORN contracts served as a direct stress test — governance compromise did not and could not affect the mixer pools. The protocol carries only a single reputable audit (ABDK Consulting, 2019), which would normally cap it at Stage 0, but it meets every condition of the battle-tested override: immutable core, no fund-access surface, no/decentralized external dependencies, and a peak TVL exceeding $400M sustained across more than 6 years with no core-pool exploit. Sanctions and developer prosecutions affect legal and operational risk for users but do not change the on-chain trust model.

## Links

- [Documentation Mirror](https://docs.tornadoeth.cash/)
- [GitHub (tornadocash)](https://github.com/tornadocash)
- [ABDK Audit Report](https://github.com/tornadocash/tornado-core/blob/master/audit/TornadoCash_audit_Report_ABDK.pdf)
- [0.1 ETH Pool](https://etherscan.io/address/0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc)
- [1 ETH Pool](https://etherscan.io/address/0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936)
- [10 ETH Pool](https://etherscan.io/address/0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF)
- [100 ETH Pool](https://etherscan.io/address/0xA160cdAB225685dA1d56aa342Ad8841c3b53f291)
- [Van Loon v. Treasury (Fifth Circuit ruling)](https://www.ca5.uscourts.gov/opinions/pub/23/23-50669-CV0.pdf)
