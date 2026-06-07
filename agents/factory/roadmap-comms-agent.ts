import Anthropic from '@anthropic-ai/sdk'
import { loadRoadmap, loadSegments } from '@/lib/factory/load-target'
import type {
  CommitmentRegisterEntry,
  Segment,
} from '@/lib/factory/types'
import { resolveSegmentId } from '@/lib/factory/customer-segment-resolver'
import {
  parseRoadmapComms,
  type RoadmapComms,
} from '@/lib/factory/roadmap-comms-parser'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL_PRIMARY = 'claude-sonnet-4-5'
const MODEL_FALLBACK = 'claude-sonnet-4-20250514'

export interface RoadmapCommsInput {
  customer: string
  commitment: string
}

function joinOrPass(value: string | string[]): string {
  return Array.isArray(value) ? value.join('; ') : value
}

function buildPrompt(
  entry: CommitmentRegisterEntry,
  segment: Segment | null,
  neighbors: CommitmentRegisterEntry[],
): string {
  const segmentBlock = segment
    ? `CUSTOMER SEGMENT PROFILE (from segments data — ground IMPACT in what this customer actually cares about; do not invent buying criteria):
Segment: ${segment.name} — ${segment.subtitle}
Buying criteria: ${joinOrPass(segment.workload.buying_criteria)}
Day-1 priorities: ${joinOrPass(segment.channel.day1_isv_priority)}
Value position: ${segment.value_proposition.statement}`
    : 'CUSTOMER SEGMENT PROFILE: not resolved — use generic enterprise framing.'

  const neighborsBlock = neighbors.length
    ? neighbors
        .map((n) => `- ${n.customer} | ${n.commitment} | ${n.date} | ${n.status}`)
        .join('\n')
    : '(none)'

  return `You are the Roadmap Comms Generator for the Cornelis Networks CN6000 SuperNIC program. A Director PM has clicked a commitment register entry. Draft the customer-facing register entry the Director PM will send to the named customer contact. The tone and structure must be calibrated to the commitment's risk status.

COMMITMENT (from roadmap.json register):
Customer: ${entry.customer}
Commitment: ${entry.commitment}
Date: ${entry.date}
Status: ${entry.status}

NOTE on the Date field: this is the ORIGINAL committed date. For SLIP status, the original date is moving to a later quarter — the entry must name a specific later quarter the date is shifting to, with the slip duration justified by a concrete technical reason. Format example: "Q4 2027 commitment is shifting to Q2 2028, a two-quarter revision driven by [technical reason]." For AT RISK status, the original date is held today; the entry names the trigger that would convert it to slip.

${segmentBlock}

PROGRAM CONTEXT:
- CN6000 generation phases: development 2024–2026, sampling 2026, production 2026–2029
- Critical path: silicon bring-up → validation → ISV certification → manufacturing → customer ship
- Other commitments in the register:
${neighborsBlock}

AUTHOR ROLE:
The PM author is the Cornelis Director of Product for the customer's segment (Federal HPC for SNL/DOE/LLNL, Neoclouds for Neocloud A, Enterprise AI for Enterprise Auto, Sovereign AI for sovereign customers, Academic HPC for academic labs).

FROM line and SIGN-OFF must use the EXACT segment name as provided in CUSTOMER SEGMENT PROFILE above — do not elaborate, rename, or add modifiers. If the profile says "Enterprise AI", use "Enterprise AI vertical" not "Enterprise Commercial AI vertical".

SIGN-OFF AND IDENTITY RULES (HARD CONSTRAINTS):
- DO NOT generate personal names, email addresses, phone numbers, or specific individual identities anywhere in the output.
- FROM line format: "Director of Product, [Segment] vertical, Cornelis Networks" — role only, no fabricated name.
- TO line: customer contact role appropriate to segment — role only, no individual names.
- When narrative text would naturally name an individual (e.g., "VP Engineering has committed…"), use role only — never invent a person's name.
- SIGN-OFF signature block format (literal placeholders, the human PM fills these in before sending):
    [Director PM, to be named]
    Director of Product, [Segment] vertical
    Cornelis Networks
    cc: VP Engineering (role only); VP Sales/Federal Programs as warranted by status

TECHNICAL CONTEXT CONSTRAINTS:
- ALLOWED: industry-standard technical references when relevant to segment buying criteria — NCCL, PyTorch FSDP, libfabric, Slurm, RoCEv2, OPA, MPI, ISV certification phases, supply chain validation gates.
- AVOID: specific vendor hardware models (e.g., "Dell PowerEdge XE9680"), customer-specific procurement vehicles (e.g., "SEWP", "GSA schedule", "FY28 budget cycle"), specific calendar dates (e.g., "November 15, 2026", "December 20"), or specific NVIDIA program names.
- When elaborating context, prefer language signaling inference:
    - "typically Dell or HPE-class GPU servers" not a specific model
    - "your fiscal planning cycle" not "FY28 budget cycle"
    - "the certification window" not a specific calendar date
    - "your federal procurement vehicle" not "SEWP" or "GSA"

WRITE THE REGISTER ENTRY IN THIS EXACT FORMAT:

SUBJECT: [one line — status-calibrated, customer-inbox-ready]
TO: [customer contact role appropriate to segment — role only]
FROM: Director of Product, [Segment] vertical, Cornelis Networks
RE: [commitment summary, 6–10 words]

SITUATION:
[Exactly ONE sentence. SLIP: name the original committed date, the specific later quarter it is shifting to, and the technical driver of the slip. AT RISK: name the watched trigger and confirm the original date is held today.]

IMPACT:
[Exactly ONE sentence. Tie directly to this segment's buying criteria and day-1 priorities above. State a specific operational consequence — not generic.]

MITIGATION / NEXT STEPS:
[Exactly ONE sentence of prose — NOT a bullet list. Pack in recovery owner role + key gate date (quarter) + the action being taken.]

ESCALATION PATH:
[Exactly ONE sentence. Owner role + named trigger that promotes escalation.]

SIGN-OFF:
[Exactly ONE closing line appropriate to status — either a specific check-in commitment OR a hard date, not both — followed by the role-based signature block exactly as specified in the SIGN-OFF AND IDENTITY RULES above. No multi-sentence closing. No compound sentences joining two commitments with "and". One clean thought, then the signature block. No personal names, no emails, no phones.]

BREVITY DISCIPLINE (HARD CONSTRAINT):
Each prose section is EXACTLY ONE sentence. Pack operator-critical content into a single sentence per section. Do not pad with adverbs or qualifying clauses. Director PM voice is direct.

STATUS-CALIBRATED TONE RULES:
- SLIP → formal acknowledgment, recovery plan, exec escalation visible, no hedging. Subject prefix "[Schedule Revision]" or "[Update]". Customer gets a real plan with a concrete new target quarter.
- AT RISK → preventive framing, in-control tone. Surfacing the risk is the strength move. Subject prefix "[Heads Up]" or "[Status Watch]". Don't manufacture drama. The original date is held today; only the conversion trigger is named.

DO NOT:
- Generate personal names, emails, phone numbers, or invented individual identities (HARD CONSTRAINT)
- Cite specific vendor hardware models, procurement vehicles, calendar dates, or NVIDIA program names (HARD CONSTRAINT)
- Use vague language ("we're working on it", "stay tuned")
- Soften a real SLIP with AT-RISK hedging
- Manufacture drama for AT RISK that doesn't exist
- Invent buying criteria not in the segment profile above
- Use generic team-style sign-offs ("The Cornelis Team")`
}

async function streamFromModel(
  model: string,
  prompt: string,
  onStream?: (token: string) => void,
): Promise<string> {
  let full = ''
  const stream = await client.messages.stream({
    model,
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      full += chunk.delta.text
      onStream?.(chunk.delta.text)
    }
  }
  return full
}

export async function runRoadmapCommsAgent(
  input: RoadmapCommsInput,
  onStream?: (token: string) => void,
): Promise<RoadmapComms> {
  const roadmap = loadRoadmap()
  const entry = roadmap.commitment_register.find(
    (e) => e.customer === input.customer && e.commitment === input.commitment,
  )
  if (!entry) {
    throw new Error(
      `Commitment register entry not found: ${input.customer} / ${input.commitment}`,
    )
  }
  if (entry.status === 'on_track') {
    throw new Error('Comms agent only runs for at_risk or slip commitments')
  }

  const segmentId = resolveSegmentId(entry.customer)
  const segments = loadSegments()
  const segment = segmentId ? segments.find((s) => s.id === segmentId) ?? null : null

  const neighbors = roadmap.commitment_register.filter(
    (e) => !(e.customer === entry.customer && e.commitment === entry.commitment),
  )

  const prompt = buildPrompt(entry, segment, neighbors)

  let full: string
  try {
    full = await streamFromModel(MODEL_PRIMARY, prompt, onStream)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    if (msg.toLowerCase().includes('model') || msg.includes('400') || msg.includes('404')) {
      full = await streamFromModel(MODEL_FALLBACK, prompt, onStream)
    } else {
      throw e
    }
  }

  return parseRoadmapComms(full, entry.status)
}
