# EIOS — EdgeInferenceOS

**A multi-agent AI reasoning layer for edge inference infrastructure.**

EIOS sits on top of existing monitoring stacks and adds autonomous reasoning, root cause analysis, SLA enforcement, and predictive what-if simulation. Built with Next.js 14, TypeScript, SQLite, and the Anthropic Claude API.

---

## What Problem It Solves

Traditional infrastructure monitoring uses rules and thresholds. Rules tell you *that* something is wrong. EIOS tells you *why*, *what to do*, and *what happens next* — in plain English, in seconds, automatically.

| Capability | Rules-Based Monitoring | EIOS |
|---|---|---|
| Anomaly detection | Threshold breach | Pattern + context reasoning |
| Root cause analysis | Manual, 20+ minutes | Automated, 4 seconds |
| Placement decisions | Static failover rules | SLA-aware reasoning |
| What-if simulation | Not available | Natural language query |
| Customer communication | Manual NOC write-up | Auto-generated brief |

---

## Architecture

EIOS is a 3-agent A2A (Agent-to-Agent) system connected via an EventEmitter bus.

```
Live Telemetry (5s tick)
        │
        ▼
┌─────────────────────┐
│   Telemetry Agent   │  ← MCP: get_node_metrics()
│                     │  ← RAG: similar historical incidents
│  Detects anomalies  │
│  Reasons severity   │
└────────┬────────────┘
         │ node.anomaly.detected
         ▼
┌─────────────────────┐
│  Placement Agent    │  ← MCP: get_sla_contract()
│                     │  ← RAG: remediation runbooks
│  Decides action     │
│  REROUTE/SCALE/     │
│  HOLD/FAILOVER      │
└────────┬────────────┘
         │ placement.decision
         ▼
┌─────────────────────┐
│   SLA Guardian      │  ← MCP: write_incident()
│                     │  ← RAG: SLA contract terms
│  Confirms breach    │
│  Writes full RCA    │
│  Logs incident      │
└─────────────────────┘
         │ sla.alert.fired
         ▼
    SQLite + Dashboard
```

---

## The Three Agents

### ① Telemetry Agent (`agents/telemetry-agent.ts`)

**Role:** Continuously monitors all 5 inference nodes and detects anomalies.

**What it does:**
- Calls `get_node_metrics()` MCP tool for live snapshot + 1-hour trend
- Retrieves similar historical incidents from RAG corpus
- Calls Claude to reason about severity, pattern match, and urgency
- Publishes `node.anomaly.detected` event to the bus

**What Claude reasons about:**
- Is this a hardware fault pattern (low util + low throughput = NVLink/PCIe issue)?
- Is this a thermal pattern (rising temp + high util = cooling issue)?
- Is this a memory pattern (high mem + dropping throughput = leak or overflow)?
- How does this compare to historical incidents?
- What severity level applies?

**Anomaly signals it detects:**
- GPU utilization above threshold
- Temperature rising toward SLA limit
- Token throughput below contracted minimum
- HBM memory pressure above safe level
- Power draw approaching cap

---

### ② Placement Agent (`agents/placement-agent.ts`)

**Role:** Decides what to do about the anomaly — reroute, scale, hold, or failover.

**What it does:**
- Receives anomaly event from Telemetry Agent
- Calls `get_sla_contract()` MCP tool for customer thresholds and penalties
- Retrieves relevant remediation runbooks from RAG
- Calls Claude to reason about best action given current node availability
- Publishes `placement.decision` event to the bus

**Four possible decisions:**
| Decision | When Used |
|---|---|
| `REROUTE` | Healthy peer node available with headroom below 85% util |
| `SCALE` | No peer available — reduce batch size, shed load on current node |
| `HOLD` | Anomaly is borderline — monitor without action |
| `FAILOVER` | Emergency — node unresponsive or hardware fault confirmed |

**What Claude reasons about:**
- Which nodes have capacity headroom?
- Is the anomaly customer-tier-specific (Cisco nodes only fail over to Cisco nodes)?
- What is the SLA penalty exposure if no action is taken?
- Which runbook applies to this failure pattern?

---

### ③ SLA Guardian Agent (`agents/sla-agent.ts`)

**Role:** Confirms SLA breach status, writes root cause analysis, logs incident.

**What it does:**
- Receives placement decision from Placement Agent
- Calls `get_sla_contract()` MCP tool for breach thresholds and penalty rates
- Retrieves SLA contract terms from RAG
- Calls Claude to write a full RCA in plain English
- Calls `write_incident()` MCP tool to persist to SQLite
- Publishes `sla.alert.fired` event to the bus

**RCA format it produces:**
```
BREACH: YES or NO
RCA: [Full root cause analysis in plain English]
ACTION: [What was done automatically]
FINANCIAL IMPACT: [Penalty amount or none]
STATUS: RESOLVED or MONITORING
```

---

## MCP Tools (`lib/mcp-tools.ts`)

MCP (Model Context Protocol) tools are the structured data layer that agents call to get real information. All four tools are defined in `lib/mcp-tools.ts`.

### `get_node_metrics(nodeId)`
Returns live snapshot + 1-hour trend summary for any node.

**Returns:**
- `live` — current util%, tempC, tokensPerSec, memUsedGB, memTotalGB, powerW
- `trend` — avgUtil, avgTemp, avgTokens, peakUtil, peakTemp over last hour
- `allNodes` — snapshot of all 5 nodes for comparison

**Used by:** Telemetry Agent, Placement Agent

---

### `get_sla_contract(customerId)`
Returns the full SLA contract for a customer.

**Customers:** `cisco`, `hippocratic`, `opencolo`

**Returns:**
- SLA thresholds: maxLatencyMs, minUptimePct, maxTempC, minTokensPerSec, maxMemUsedPct
- Penalty rates: perHourDowntime, perLatencyBreach
- Assigned nodes

**Used by:** Placement Agent, SLA Guardian

---

### `write_incident(params)`
Persists a confirmed incident to SQLite with full RCA.

**Parameters:** nodeId, customerId, severity, anomaly, decision, rca

**Returns:** Generated incident ID (e.g. `INC-1234567890-ABC123`)

**Used by:** SLA Guardian

---

### `run_whatif_simulation(scenario)`
Simulates node state changes for a natural language scenario.

**How it works:**
- Parses scenario string for pod name and event type keywords
- Modifies node metrics in memory (does not affect live simulator)
- Returns original state, simulated state, and list of affected nodes

**Keyword mapping:**
| Keywords | Effect |
|---|---|
| `memory`, `hbm` | memUsedGB → 97% of total, util +20% |
| `temp`, `thermal` | tempC +15C, tokensPerSec × 0.6 |
| `fail`, `down` | util → 0, tokensPerSec → 0, tempC → 0 |
| `peak`, `surge` | util → 96%, tempC +8C, tokensPerSec × 0.7 |

**Used by:** What-If Query panel

---

## RAG Corpus (`lib/rag.ts`)

RAG (Retrieval Augmented Generation) gives agents access to historical knowledge. EIOS uses token-based cosine similarity search across 24 documents.

### Incident History (`data/incidents/`) — 15 files

Synthetic historical incidents spanning November 2025 to March 2026. Each file contains: node, customer, anomaly description, root cause, action taken, SLA impact, and resolution.

| File | Node | Severity | Event Type |
|---|---|---|---|
| inc-001 | pod-alpha | CRITICAL | GPU utilization spike, Cisco SLA breach |
| inc-002 | pod-gamma | HIGH | Thermal escalation, AMD MI300X cooling |
| inc-003 | pod-epsilon | MEDIUM | Memory leak, RTX PRO session overflow |
| inc-004 | pod-beta | CRITICAL | NVLink fabric degradation |
| inc-005 | pod-alpha | HIGH | Power cap breach, new model deployment |
| inc-006 | pod-delta | CRITICAL | ROCm driver crash, full node dropout |
| inc-007 | pod-gamma | MEDIUM | Job priority contention, throughput oscillation |
| inc-008 | pod-alpha | HIGH | Runaway context window, HBM overflow |
| inc-009 | pod-epsilon | LOW | Ambient temp rise, CRAC maintenance |
| inc-010 | pod-beta | CRITICAL | PCIe bus error, hard node failure |
| inc-011 | pod-alpha | HIGH | Batch job scheduling conflict, 3am peak |
| inc-012 | pod-gamma | MEDIUM | Concurrent model load, memory exceeded |
| inc-013 | pod-delta | HIGH | Valentine's Day traffic surge, power + thermal |
| inc-014 | pod-epsilon | MEDIUM | Network egress bottleneck, switch failure |
| inc-015 | pod-alpha | CRITICAL | Cascading failure — both Cisco nodes down simultaneously |

### Remediation Runbooks (`data/runbooks/`) — 6 files

Step-by-step remediation procedures that Placement Agent retrieves when deciding action.

| File | Covers |
|---|---|
| rb-thermal.txt | Temperature escalation — WARNING/HIGH/CRITICAL response steps |
| rb-memory.txt | HBM memory pressure — session termination, driver restart protocol |
| rb-throughput.txt | Token throughput degradation — hardware vs software fault diagnosis |
| rb-power.txt | Power cap escalation — load shed thresholds and recovery |
| rb-failover.txt | Emergency node failover — target selection, DNS redirect, burn-in |
| rb-cascade.txt | Cascading failure prevention — correlated failure detection, isolation |

### SLA Contracts (`data/sla-contracts/`) — 3 files

Customer SLA definitions used by Placement and SLA Guardian agents.

| Customer | Tier | Nodes | Min Throughput | Max Latency | Penalty/hr |
|---|---|---|---|---|---|
| Cisco | Enterprise | pod-alpha, pod-beta | 800 tok/s | 50ms | $5,000 |
| Hippocratic AI | Healthcare | pod-gamma, pod-delta | 400 tok/s | 100ms | $2,000 |
| OpenColo | Standard | pod-epsilon | 200 tok/s | 200ms | $500 |

---

## Infrastructure Nodes (`data/nodes.json`)

| Node | GPU | VRAM | Max Temp | Max Power | Customer |
|---|---|---|---|---|---|
| pod-alpha | NVIDIA B200 | 192GB HBM3e | 85C | 1000W | Cisco |
| pod-beta | NVIDIA B200 | 192GB HBM3e | 85C | 1000W | Cisco |
| pod-gamma | AMD MI300X | 192GB HBM | 90C | 750W | Hippocratic AI |
| pod-delta | AMD MI300X | 192GB HBM | 90C | 750W | Hippocratic AI |
| pod-epsilon | NVIDIA RTX PRO | 96GB GDDR7 | 83C | 600W | OpenColo |

---

## Telemetry Simulator (`lib/simulator.ts`)

Generates realistic live metrics for all 5 nodes.

- **Tick rate:** Every 5 seconds
- **Chaos event:** Every 45 seconds, one random node degrades
- **Degradation:** util spikes, temp rises, throughput drops, memory pressure increases over 6 ticks (~30 seconds)
- **Recovery:** Node returns to normal after chaos cycle ends
- **Node colors:** Green (healthy) → Amber (warning) → Red (critical)

---

## Dashboard Panels

### Panel 1 — Node Health
Live color-coded cards for all 5 inference nodes. Updates every 5 seconds via Server-Sent Events.

**Color thresholds:**
- 🟢 Green: util < 75%, temp < 75C, mem < 80%
- 🟡 Amber: util > 75% OR temp > 75C OR mem > 80%
- 🔴 Red: util > 90% OR temp > 82C OR mem > 90%

**Metrics shown per node:** util%, tempC, mem%, powerW, tok/s

---

### Panel 2 — Agent Reasoning Chain
Live token streaming from all 3 agents as they reason. Shows Claude's thinking in real time as each agent processes the anomaly.

- ① Telemetry Agent — situation analysis and pattern matching
- ② Placement Agent — decision reasoning with SLA context
- ③ SLA Guardian — breach confirmation and RCA

---

### Panel 3 — Incident Log
Persistent incident history from SQLite. Click any row to expand the full RCA report written by the SLA Guardian.

**Fields:** severity badge, node ID, customer, timestamp, full RCA on expand

---

### Panel 4 — What-If Query
Natural language scenario simulation. Type any what-if question, get a streaming analysis covering cascade effects, SLA risk, financial impact, and recommended preemptive actions.

---

### Panel 5 — NOC Brief Generator
One-click generation of two professional briefs after any agent pipeline run:

- **Gruve Internal Brief** — executive-facing internal NOC report with incident ID, what happened, action taken, SLA status, and next steps
- **Customer Notification** — professional customer-facing service notification with impact summary, resolution, and financial impact

---

## What-If Query Reference

### ✅ Safe Queries — Always Work

Always include a pod name AND an event keyword.

**High Drama (best for demos):**
```
What if pod-alpha loses 40GB HBM3e at 3am peak?
What if pod-beta fails during Cisco peak hours?
What if pod-alpha and pod-beta fail simultaneously?
```

**Cascade Scenarios:**
```
What if pod-gamma sees a traffic surge during Hippocratic peak?
What if pod-delta has a thermal event overnight?
What if pod-epsilon runs out of memory during a batch job?
What if pod-gamma overheats during a batch job?
```

**Proactive Planning:**
```
What if pod-alpha goes down for scheduled maintenance?
What if pod-beta has a thermal surge at 3am?
What if pod-delta loses power during peak inference?
What if pod-epsilon fails and opencolo has no failover?
```

**Safe Anytime:**
```
What if pod-alpha hits 95% utilization during peak?
What if pod-gamma memory pressure reaches 95%?
What if pod-delta temperature spikes to 88C?
```

### ⚠️ Avoid These

Queries without a pod name will get a Claude response but no simulation data:
```
What if the whole rack fails?
What if the network goes down?
What if we get a traffic surge?   ← no pod name
```

### Keyword Reference

| Include this word | Simulates |
|---|---|
| `memory`, `hbm` | Memory pressure to 97% |
| `temp`, `thermal` | +15C temperature spike |
| `fail`, `down` | Complete node dropout |
| `peak`, `surge` | Utilization spike to 96% |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| AI | Anthropic Claude claude-sonnet-4-20250514 |
| Database | SQLite via better-sqlite3 |
| RAG | Token-based cosine similarity (no vector DB required) |
| Streaming | Server-Sent Events (SSE) |
| Agent Bus | Node.js EventEmitter (A2A pattern) |
| Styling | Tailwind CSS |

---

## Project Structure

```
eios/
├── app/
│   ├── api/
│   │   ├── telemetry/route.ts      # SSE stream of live node metrics
│   │   ├── agents/run/route.ts     # Triggers 3-agent pipeline
│   │   ├── whatif/route.ts         # What-if simulation endpoint
│   │   ├── brief/route.ts          # NOC brief generator
│   │   └── incidents/route.ts      # Incident log API
│   ├── dashboard/page.tsx          # Main dashboard UI
│   └── layout.tsx
├── agents/
│   ├── telemetry-agent.ts          # Agent 1 — anomaly detection
│   ├── placement-agent.ts          # Agent 2 — placement decisions
│   └── sla-agent.ts                # Agent 3 — SLA enforcement + RCA
├── lib/
│   ├── bus.ts                      # A2A EventEmitter bus
│   ├── simulator.ts                # Live telemetry simulator
│   ├── types.ts                    # Shared TypeScript interfaces
│   ├── db.ts                       # SQLite schema + queries
│   ├── rag.ts                      # RAG retrieval engine
│   └── mcp-tools.ts                # MCP tool definitions
├── data/
│   ├── nodes.json                  # Node configuration
│   ├── incidents/                  # 15 historical incident files
│   ├── runbooks/                   # 6 remediation runbooks
│   └── sla-contracts/              # 3 customer SLA contracts
├── .env.local                      # ANTHROPIC_API_KEY
└── package.json
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local

# Start development server
npm run dev

# Open browser
http://localhost:3000
```

---

## Demo Script

1. Start `npm run dev` 2 minutes before the demo
2. Let the chaos engine run — nodes will start turning amber
3. Click **▶ Run Agents** — walk through the 3-agent reasoning chain
4. Click **📋 Generate NOC Brief** — show Gruve internal + customer briefs
5. Type a what-if query — the $108K cascade analysis speaks for itself

---

*Built by Ashit Ghevaria — Silicon Valley PM, ex-Calix Director (E9-2 platform, $100M+ revenue)*
*EIOS demonstrates the intelligence layer that sits on top of existing edge inference infrastructure.*
