# CN6000 NPI Program Brief

**SIMULATED — Pre-GA Internal Draft — Not for external distribution**

This document is a simulated internal program brief used to ground the Phase-Gate Brief Agent in CN6000-specific NPI context. It is not derived from any leaked or non-public Cornelis materials. Specifications and timeline language reflect what is publicly known about CN6000 (800 Gbps Ethernet SuperNIC, RoCEv2 native, UEC roadmap alignment) extended with plausible NPI program structure for demo purposes.

## Product Overview

CN6000 is Cornelis Networks' next-generation 800 Gbps Ethernet SuperNIC, succeeding the CN5000 family. Native RoCEv2 protocol support positions CN6000 for direct deployment into existing enterprise Ethernet fabrics with no NVIDIA switching required. Future UEC (Ultra Ethernet Consortium) protocol alignment is on the roadmap for late 2026 to 2027 release. CN6000 retains compatibility with the broader Omni-Path ecosystem and pairs with CN5000-era director-class switches during the transition window.

## Target Segments

CN6000 targets three primary AI and HPC segments at GA:

- **Federal HPC** — DOE national labs, NNSA labs, federal procurement programs (DOE, LLNL, SNL, LANL). Anchored on predictable MPI tail latency, mature libfabric/Slurm stack, and NDAA-clean US supply chain. Day-1 gating ISV is the Slurm topology-aware scheduler with libfabric OPA provider on CN6000.
- **NeoCloud** — GPU-as-a-service operators (CoreWeave, Lambda, Crusoe, RunPod class). Anchored on $/GPU fabric cost, supply lead time, and protocol flexibility for UEC migration. Day-1 gating ISV is NCCL certification on RoCEv2 mode for PyTorch FSDP workloads.
- **Sovereign AI** — Nation-state and regional AI infrastructure programs (EU Mistral/EuroHPC, APAC NTT/Hitachi-led). Anchored on supply-chain provenance, vendor independence from NVIDIA, and long-term roadmap visibility through CN7000 UEC alignment.

## Phase-Gate Milestones

The CN6000 program follows a six-phase NPI lifecycle tracked across seven program lanes (architecture, silicon design, validation, ISV certification, manufacturing, supply chain, program):

1. **Concept** — Product definition, market sizing, architecture exploration. Closed across all lanes.
2. **Plan** — Detailed product requirements, technology selection, supplier qualification plan. Closed across most lanes; supply_chain plan currently in_progress due to Intel component lead-time extension.
3. **Development** — Silicon design build complete (tape-out closed), system architecture finalized (tri-protocol architecture closed), software stack development in execution. Validation lane is currently at_risk due to silicon bring-up bench-time contention. ISV certification, manufacturing, and supply chain development workstreams are in_progress.
4. **Sampling** — First customer samples to lighthouse customers, bring-up validation, ISV interoperability sampling. Target Q2 2026. Future state for most lanes.
5. **Production** — Volume manufacturing ramp, ISV certification complete, GA shipping. Target Q4 2026. Future state across all lanes.
6. **Sustaining** — Production support, lifecycle management, follow-on product roadmap execution.

## Silicon Lineage and CN5000 Predecessor Context

CN6000 is architecturally a successor to the CN5000 family of Omni-Path products. The CN6000 NPI program leverages predecessor lessons across four dimensions:

- **Architecture carry-forward.** CN6000 builds on CN5000 Omni-Path architecture — port design (CN5000 SuperNIC and CN5000 Switch port topologies inform CN6000 800 Gbps port layout), fabric topology (CN5000 director class switch fat-tree fabric pattern carries forward to CN6000 director class), and RoCEv2 implementation lessons learned in CN5000 SuperNIC carry directly to CN6000 RoCEv2 native silicon. Backwards compatibility with the previous-generation Omni-Path 100G fabric is preserved.
- **Validation lessons applied to bring-up.** CN5000 silicon bring-up established baselines for bench-time validation requirements, thermal validation under sustained load, signal integrity testing at 400 Gbps line rates, and protocol conformance testing patterns. CN6000 silicon bring-up reuses these CN5000 validation playbooks, with adjustments for the 800 Gbps line rate (doubled throughput requires denser test matrix and extended bench-time bookings per workstream).
- **CN5000 director class switch as reference baseline.** CN6000 director class design references the CN5000 Omni-Path Director Class Switch architecture (576-port chassis, two-tier internal fat-tree, redundant hot-swappable power and cooling) as its baseline. Mechanical chassis, power distribution, and cooling design carry forward with the increment of 800 Gbps optical and copper modules.
- **CN5000 ISV certification patterns reused.** CN5000 ISV certification tracks (libfabric OPA provider, Slurm topology-aware scheduling, NCCL on RoCEv2, PyTorch and Megatron-LM distributed training) established certification harness patterns and partner relationships that CN6000 ISV certification phase reuses. Re-certification on CN6000 silicon is the bulk of the CN6000 ISV certification effort; the certification matrix structure itself is inherited.

This predecessor lineage is the primary risk-mitigation mechanism for the CN6000 NPI program: CN5000 production experience reduces unknowns in CN6000 silicon bring-up, validation bench-time scheduling, and ISV certification track sequencing.

## Silicon Bring-Up Phase

CN6000 silicon bring-up is in active execution. First silicon was returned from the fab on schedule. Bench-time validation is running against the planned test matrix covering RoCEv2 protocol conformance, throughput characterization at the 800 Gbps line rate, tail latency under congestion, error injection and recovery, and thermal characterization. Bench-time contention is the primary risk to the validation schedule — limited bench capacity is being shared across multiple validation workstreams (RoCEv2 conformance, libfabric provider validation, NCCL pre-certification rehearsal). Validation development is currently tracking 4 weeks behind plan.

## ISV Certification Timeline

ISV certification is the gating workstream for production readiness. Three certification tracks run in parallel and represent the bulk of post-silicon validation effort:

- **NCCL on RoCEv2** — Required for PyTorch FSDP and large-model training workloads on NeoCloud and Enterprise AI deployments. Partnership track with NVIDIA developer relations is the primary path; in-house collective library investment (~$1.5M NRE, 6-month timeline) is the contingency. Status: in_progress.
- **Slurm topology-aware scheduling and libfabric OPA provider** — Required for Federal HPC procurement readiness, particularly for HPE Cray EX-series integration. Joint engineering with the libfabric maintainer community. Status: in_progress.
- **PyTorch and Megatron-LM distributed training** — Required for Enterprise AI and NeoCloud production workloads. Validation runs on lighthouse customer cluster designs.

ISV certification work begins upon silicon validation sign-off and is targeted for sequential completion through Q2 to Q4 2026. Parallelization across the three tracks is the program's primary lever for compressing the certification window if validation closes ahead of plan.

## Known Risks

- **Bench-time contention during validation** — Limited bench capacity is the single largest risk to the validation schedule. A 4-week slip in validation development is being actively managed. Mitigation options under exec consideration: pull from sampling buffer (compresses sampling by 4 weeks) or push GA by 4 weeks. Decision owner: VP Engineering. Escalation to: COO. Target decision date: Q1 2026.
- **ISV certification parallelization** — Sequential certification through Q2 to Q4 2026 leaves limited margin for any individual track to slip. Parallel execution across NCCL, libfabric, and PyTorch tracks is being scoped but requires additional NRE investment and risks splitting limited validation engineering attention.
- **Intel supply constraint** — Intel component lead time has extended from 16 to 24+ weeks. Alt-source qualification is under evaluation (3-month qualification cycle, ~$200K NRE). Decision owner: VP Operations. Escalation to: COO.
- **NCCL certification gap on RoCEv2 mode** — CN6000 RoCEv2 mode has no NCCL certification yet; gates Enterprise AI and NeoCloud design wins. Decision owner: VP Product. Escalation to: CEO.

## Program Critical Path

Silicon bring-up → validation → ISV certification → manufacturing → customer ship. The validation lane currently sits on the critical path; any further slip propagates into sampling phase compression, GA commitment slip, and customer-segment ship risk. Downstream impacts include the Q4 2026 DOE / Lynx 800G upgrade window, the Q1 2027 LLNL CTS-3 procurement, and the Q1 2027 Enterprise Automotive Tier-1 OEM internal training cluster commitment.

## Customer Commitments Anchored to CN6000

- **DOE / Lynx Cluster** — Q4 2026, CN6000 800G upgrade path. Status: on_track.
- **LLNL / CTS-3 procurement** — Q1 2027, CN6000 fabric option in HPE Cray EX-series bid. Status: on_track.
- **Neocloud A (under NDA)** — Q2 2027, 10K-NIC CN6000 leaf-spine deployment. Status: at_risk (NCCL certification dependency).
- **Sovereign AI partner (FR)** — Q3 2027, Phase-1 800-NIC pilot. Status: on_track.
- **SNL Tier-1 Federal** — Q4 2027, CN6000 EX-series integration delivery. Status: slip (libfabric certification window).
- **Enterprise Automotive Tier-1 OEM** — Q1 2027, internal AI training cluster on CN6000 RoCEv2. Status: at_risk (NCCL certification dependency).
