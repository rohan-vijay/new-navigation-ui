/* Adaptive, key-free skill synthesizer.
   Parses a free-text description and produces a tailored name, clarifying
   questions, file contents, tools, and references — so testers can type
   anything and get a real-feeling build without any API call. */

const TOOL_CATALOG = [
  { re: /salesforce|\bcrm\b|opportunit|pipeline|deal/i, slug: 'salesforce', name: 'Salesforce', action: 'Fetch records' },
  { re: /slack/i, slug: 'slack', name: 'Slack', action: 'Read channel' },
  { re: /gmail|e-?mail|inbox|outreach|reply/i, slug: 'gmail', name: 'Gmail', action: 'Draft email' },
  { re: /hubspot/i, slug: 'hubspot', name: 'HubSpot', action: 'Sync contact' },
  { re: /notion/i, slug: 'notion', name: 'Notion', action: 'Update page' },
  { re: /jira/i, slug: 'jira', name: 'Jira', action: 'Create issue' },
  { re: /zendesk|ticket|helpdesk|support queue/i, slug: 'zendesk', name: 'Zendesk', action: 'Read ticket' },
  { re: /intercom/i, slug: 'intercom', name: 'Intercom', action: 'Read conversation' },
  { re: /calendar|schedul/i, slug: 'googlecalendar', name: 'Google Calendar', action: 'Read events' },
  { re: /drive|\bdoc\b|document/i, slug: 'googledrive', name: 'Google Drive', action: 'Fetch document' },
  { re: /sheet|spreadsheet|excel/i, slug: 'googlesheets', name: 'Google Sheets', action: 'Update sheet' },
  { re: /github|pull request|\bpr\b|\brepo\b|codebase/i, slug: 'github', name: 'GitHub', action: 'Read pull request' },
  { re: /linear/i, slug: 'linear', name: 'Linear', action: 'Update issue' },
  { re: /stripe|payment|invoice|billing|subscription/i, slug: 'stripe', name: 'Stripe', action: 'Fetch invoice' },
  { re: /zoom|gong|call recording|transcript/i, slug: 'zoom', name: 'Zoom', action: 'Get transcript' },
  { re: /figma|design/i, slug: 'figma', name: 'Figma', action: 'Read file' },
  { re: /shopify|order|store/i, slug: 'shopify', name: 'Shopify', action: 'Fetch order' },
]

const INPUT_SIGNALS = [
  { re: /transcript|recording|call notes/i, label: 'meeting transcripts' },
  { re: /salesforce|crm record|opportunit/i, label: 'the Salesforce record' },
  { re: /account history|past deals|history/i, label: 'account history' },
  { re: /e-?mail|inbox/i, label: 'recent emails' },
  { re: /slack/i, label: 'Slack threads' },
  { re: /ticket|support/i, label: 'support tickets' },
  { re: /document|\bdoc\b|file|pdf/i, label: 'attached documents' },
  { re: /spreadsheet|sheet|csv|data/i, label: 'spreadsheet data' },
  { re: /calendar|meeting/i, label: 'calendar context' },
  { re: /pull request|\bpr\b|commit|code/i, label: 'code changes' },
  { re: /invoice|payment|billing/i, label: 'billing records' },
]

const OUTPUT_SIGNALS = [
  { re: /follow-?up email|customer email|reply|outreach/i, noun: 'a follow-up email', kind: 'email' },
  { re: /e-?mail|draft/i, noun: 'an email draft', kind: 'email' },
  { re: /summary|recap|brief/i, noun: 'a summary', kind: 'summary' },
  { re: /report|analysis|analy[sz]e/i, noun: 'an analysis report', kind: 'report' },
  { re: /\bjson\b|structured data|fields|schema/i, noun: 'structured data', kind: 'json' },
  { re: /action items|next steps|tasks|to-?dos?/i, noun: 'a list of next steps', kind: 'tasks' },
  { re: /ticket|issue/i, noun: 'a ticket', kind: 'ticket' },
  { re: /score|risk|rating/i, noun: 'a score with rationale', kind: 'score' },
]

const STOP = new Set('a an the for to of and or with from into that this my our your me i we help create build make draft handle skill agent please can could would using use use: it its their them they when which what who how on in by at as is are be do'.split(/\s+/))

function titleCase(s) { return s.replace(/\b\w/g, c => c.toUpperCase()) }

export function deriveName(desc) {
  const t = (desc || '').toLowerCase()
  // strong patterns first
  if (/follow-?up/.test(t) && /(call|meeting|sales)/.test(t)) return 'Post-Call Follow-Up'
  if (/deal risk|risk analy/.test(t)) return 'Deal Risk Analyzer'
  if (/invoice|billing/.test(t) && /(extract|read|parse)/.test(t)) return 'Invoice Extractor'
  if (/support|ticket/.test(t) && /(triage|route|classify)/.test(t)) return 'Ticket Triage'
  // generic: pick the most meaningful 2–3 keywords
  const words = (desc || '')
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !STOP.has(w))
  const picked = words.slice(0, 3)
  if (!picked.length) return 'New Skill'
  return titleCase(picked.join(' '))
}

function detectMany(catalog, desc, key, max) {
  const out = []
  const seen = new Set()
  for (const item of catalog) {
    if (item.re.test(desc) && !seen.has(item[key] || item.label)) {
      seen.add(item[key] || item.label)
      out.push(item)
      if (out.length >= max) break
    }
  }
  return out
}

export function analyze(desc) {
  const name = deriveName(desc)
  let tools = detectMany(TOOL_CATALOG, desc, 'slug', 4).map(t => ({ app: { slug: t.slug, name: t.name }, action: { name: t.action } }))
  if (tools.length < 2) {
    // sensible defaults so the Tools section is never empty
    const defaults = [
      { app: { slug: 'googledrive', name: 'Google Drive' }, action: { name: 'Fetch document' } },
      { app: { slug: 'gmail', name: 'Gmail' }, action: { name: 'Draft email' } },
    ]
    for (const d of defaults) { if (!tools.find(x => x.app.slug === d.app.slug)) tools.push(d) }
    tools = tools.slice(0, 2)
  }
  let inputs = detectMany(INPUT_SIGNALS, desc, 'label', 4).map(i => i.label)
  if (inputs.length < 2) inputs = Array.from(new Set([...inputs, 'the provided context', 'relevant records'])).slice(0, 3)
  let outputs = detectMany(OUTPUT_SIGNALS, desc, 'noun', 3)
  if (!outputs.length) outputs = [{ noun: 'a structured result', kind: 'summary' }]

  const clean = (desc || '').trim().replace(/\s+/g, ' ')
  return { name, tools, inputs, outputs, clean, outputNouns: outputs.map(o => o.noun), outputKinds: outputs.map(o => o.kind) }
}

/* ── Conversation copy, tailored to the analysis ── */
export function workSteps(ctx) {
  return [
    'Classifying the request → a reusable agent skill, not a one-off draft',
    'Selecting the skill_creator workflow',
    `Mapping inputs: ${ctx.inputs.join(' · ')}`,
    `Identifying outputs: ${ctx.outputNouns.join(' + ')}`,
    'Flagging open decisions to confirm with you before drafting files',
  ]
}

export function planLine(ctx) {
  return `I've got the core workflow: pull context from ${ctx.inputs.slice(0, 3).join(', ')}, then produce ${joinNouns(ctx.outputNouns)}. To make the skill reusable instead of overly generic, I need a couple of specifics from you.`
}

function joinNouns(arr) {
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`
}

/* ── Clarifying questions, referencing what the user actually wrote ── */
export function buildQuestions(ctx) {
  const primary = ctx.outputNouns[0] || 'the result'
  const firstTool = ctx.tools[0]?.app.name || 'a tracked record'
  const signalOpts = [...ctx.inputs]
  while (signalOpts.length < 3) signalOpts.push(['the latest activity', 'historical records', 'the source documents'][signalOpts.length - ctx.inputs.length] || 'additional context')
  return [
    {
      id: 'output',
      multi: false,
      q: `For ${primary}, what should the skill optimize for?`,
      options: [
        'Ready to use as-is, with minimal editing',
        'Structured for downstream systems and fields',
        'Both a ready-to-use version and a structured one',
      ],
      default: 2,
    },
    {
      id: 'trigger',
      multi: false,
      q: 'When should this skill run by default?',
      options: [
        'Automatically, every relevant time',
        `Only when tied to ${firstTool}`,
        'Only when I run it manually',
      ],
      default: 1,
    },
    {
      id: 'signals',
      multi: true,
      q: 'Which inputs should it prioritize most heavily?',
      options: signalOpts.slice(0, 3).map(s => titleCaseFirst(s)),
      default: [0],
    },
  ]
}

function titleCaseFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

/* ── File contents ── */
export function overviewMd(ctx) {
  const lines = [`# ${ctx.name}`, '', '## Description', sentence(ctx.clean) + '']
  if (ctx.inputs.length) lines.push('', `It draws on ${joinNouns(ctx.inputs)} and produces ${joinNouns(ctx.outputNouns)}.`)
  lines.push('', '## When to use', `- Whenever ${ctx.outputNouns[0]} is needed for this workflow`, '- When the team wants a consistent, repeatable result', '')
  return lines.join('\n')
}

export function workflowMd(ctx, answers) {
  const gather = ctx.inputs.length ? ctx.inputs.join(', ') : 'the available context'
  const produce = joinNouns(ctx.outputNouns)
  const focus = answers?.find(a => /priorit/i.test(a.q))?.a
  const out = [
    '',
    '## Workflow',
    `1. Gather context — ${gather}`,
    '2. Extract the key facts, entities, and open items',
    `3. Apply the skill's logic to produce ${produce}`,
    '4. Validate the output and flag anything uncertain',
    '5. Return the result for review before anything is sent or saved',
    '',
    '## Best practices',
    '- Ground every claim in the source inputs',
  ]
  if (focus) out.push(`- Weight ${lower(focus)} most heavily when shaping the output`)
  out.push('- Keep the output concise and ready to act on', '- Never take an irreversible action without an explicit confirmation step', '')
  return out.join('\n')
}

export function references(ctx) {
  const kinds = new Set(ctx.outputKinds)
  const files = []
  if (kinds.has('email')) files.push({ name: 'email-tone.md', content: EMAIL_TONE_MD })
  if (kinds.has('summary') || kinds.has('report') || kinds.has('score')) files.push({ name: 'output-template.md', content: outputTemplate(ctx) })
  if (kinds.has('json')) files.push({ name: 'output-schema.json', content: SCHEMA_JSON })
  if (kinds.has('tasks')) files.push({ name: 'next-steps-format.md', content: NEXT_STEPS_MD })
  if (!files.length) files.push({ name: 'examples.md', content: examplesMd(ctx) })
  return files.slice(0, 2)
}

export function completionText(ctx, refNames) {
  const toolNames = ctx.tools.map(t => t.app.name)
  return `Done — your skill is on the left. I drafted **SKILL.md** with the overview, workflow, and best practices, wired up **${joinNouns(toolNames)}**, and added ${refNames.length > 1 ? 'references' : 'a reference'} (${refNames.map(n => '`' + n + '`').join(', ')}).\n\nEdit any file directly, or just tell me what to change and I'll update it here.`
}

/* helpers */
function sentence(s) {
  if (!s) return 'Handles the described task end to end.'
  let out = s.charAt(0).toUpperCase() + s.slice(1)
  if (!/[.!?]$/.test(out)) out += '.'
  return out
}
function lower(s) { return (s || '').charAt(0).toLowerCase() + (s || '').slice(1) }

const EMAIL_TONE_MD = `# Email Tone & Voice

Guidance the skill follows when drafting the email.

- Warm, concise, and specific — reference what was actually discussed
- Lead with value to the reader, not internal process
- One clear call-to-action per email
- Mirror the reader's level of formality
- Always close with a concrete next step and a date
`

function outputTemplate(ctx) {
  return `# Output Template

A reusable structure for ${ctx.outputNouns[0]}.

## Summary
- {{one_line_summary}}

## Key points
- {{point}}

## Risks / open items
- {{risk}} — _owner:_ {{owner}}

## Next steps
- [ ] {{next_step}} — _owner:_ {{owner}} — _due:_ {{date}}
`
}

const SCHEMA_JSON = `{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "entities": { "type": "array", "items": { "type": "string" } },
    "fields": { "type": "object" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["summary", "confidence"]
}
`

const NEXT_STEPS_MD = `# Next-Steps Format

Each item the skill produces should follow this shape:

- [ ] {{action}} — _owner:_ {{owner}} — _due:_ {{date}}

Rules:
- Every item has a single, named owner
- Dates are concrete (no "soon" / "later")
- Group by theme when there are more than five items
`

function examplesMd(ctx) {
  return `# Examples

Concrete examples the agent can reference at runtime for ${ctx.name}.

## Example input
${ctx.inputs.map(i => `- ${titleCaseFirst(i)}`).join('\n')}

## Example output
- ${titleCaseFirst(ctx.outputNouns[0])}
`
}
