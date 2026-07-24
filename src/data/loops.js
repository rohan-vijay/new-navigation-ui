/* ─── Loops — standing objectives the platform pursues on its own ─────────
   A Loop is NOT an agent wrapped in a schedule. It is a persistent objective
   the platform keeps pursuing autonomously, with a human kept ON the loop
   through guardrails and exceptions.

   Two things define a loop:
     • objective  — what it should keep doing (plain language)
     • oversight  — how much it acts alone, and how it pulls a human in
   Cadence is a property. Skills and tools are optional equipment. */

/* ─── Cadence — how the loop runs ─────────────────────────────────────────*/
export const CADENCE_META = {
  continuous: { label: 'Continuous', fg: '#0f6e56', border: '#9fe1cb', bg: '#e1f5ee', blurb: 'Runs continuously, checking on an interval.' },
  scheduled:  { label: 'Scheduled',  fg: '#185fa5', border: '#b5d4f4', bg: '#e6f1fb', blurb: 'Wakes on a calendar — recurring.' },
  'on-event': { label: 'On event',   fg: '#3b6d11', border: '#c0dd97', bg: '#eaf3de', blurb: 'Wakes when an external event fires.' },
}
export const CADENCE_ORDER = ['continuous', 'scheduled', 'on-event']

/* ─── Trust — how much the loop acts on its own (human in/on/out) ─────────*/
export const TRUST_META = {
  watch:       { label: 'Watch only',          rank: 0, icon: 'eye-off', blurb: 'Observes and suggests. Acts on nothing — a human does.' },
  draft:       { label: 'Draft for me',        rank: 1, icon: 'check',   blurb: 'Prepares every action. You approve each one before it happens.' },
  'act-check': { label: 'Act, check big stuff',rank: 2, icon: 'eye',     blurb: 'Acts on its own and pauses for the exceptions you define below.' },
  autonomous:  { label: 'Fully autonomous',    rank: 3, icon: 'bolt',    blurb: 'Acts freely within its guardrails. Reviewed after the fact via the audit trail.' },
}
export const TRUST_ORDER = ['watch', 'draft', 'act-check', 'autonomous']

/* ─── Interrupt actions — what a tripped guardrail does ───────────────────*/
export const INTERRUPT_ACTIONS = {
  notify:  { label: 'Notify a human',    fg: '#185fa5', border: '#b5d4f4', bg: '#e6f1fb' },
  approve: { label: 'Require approval',   fg: '#b07a16', border: '#ecdcae', bg: '#faeeda' },
  pause:   { label: 'Pause the loop',     fg: '#a32d2d', border: '#f0a0a0', bg: '#fcebeb' },
  block:   { label: 'Block the action',   fg: '#791f1f', border: '#e08a8a', bg: '#fbe3e3' },
}
export const INTERRUPT_ORDER = ['notify', 'approve', 'pause', 'block']

/* ─── Where exceptions route — real routing, not a name ───────────────────*/
export const ROUTE_KINDS = {
  queue:  { label: 'Queue' },
  role:   { label: 'Role' },
  team:   { label: 'Team' },
  person: { label: 'Person' },
}
export const ROUTE_ORDER = ['queue', 'role', 'team', 'person']

/* ─── Stop conditions ─────────────────────────────────────────────────────*/
export const STOP_META = {
  recurring: { label: 'Runs indefinitely', blurb: 'Keeps running every time it is triggered.' },
  goal:      { label: 'Until a goal is met', blurb: 'Stops once the stated goal is satisfied.' },
}

export const SLA_OPTIONS = ['15 minutes', '30 minutes', '1 hour', '4 business hours', '1 business day', 'No SLA']
export const RETENTION_OPTIONS = ['90 days', '1 year', '3 years', '7 years', 'Indefinite']
export const LOG_LEVELS = ['Full decision trace', 'Actions and approvals', 'Approvals only']

const slug = (s) => (s || 'loop').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* ─── The enterprise loop catalogue ───────────────────────────────────────*/
const RAW = [
  {
    id: 'invoice-reconciliation', name: 'Invoice reconciliation', version: 'v3.2.0',
    status: 'Live', shared: 'Finance Team', sharedType: 'team', owner: 'Emily Rodriguez', ownerInit: 'ER', updated: '2 hours ago',
    objective: 'Keep every inbound invoice reconciled against its purchase order and the ledger, and surface anything that does not match.',
    cadence: { mode: 'scheduled', detail: 'Each weekday · 6:00 AM' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'act-check',
    interrupts: [
      { when: 'A discrepancy exceeds $50,000', action: 'approve' },
      { when: 'Match confidence is below 80%', action: 'notify' },
      { when: 'The vendor is not in the approved master', action: 'pause' },
    ],
    routeTo: { kind: 'queue', name: 'Finance Ops queue', sla: '4 business hours', fallback: 'Controller' },
    authority: ['Read NetSuite ledgers', 'Read PO records', 'Post reconciliation drafts', 'Cannot approve journals'],
    budget: { perRun: '$2.50', monthlyCap: '$1,200', maxIterations: '500' },
    audit: { retention: '7 years', logLevel: 'Full decision trace' },
    skills: ['Invoice Reconciler', 'Spend Anomaly Detector'],
    tools: ['NetSuite'],
  },
  {
    id: 'lead-enrichment-routing', name: 'Lead enrichment & routing', version: 'v2.4.1',
    status: 'Live', shared: 'Everyone', sharedType: 'org', owner: 'James Carter', ownerInit: 'JC', updated: '5 hours ago',
    objective: 'Enrich every new lead and route the qualified ones to the right rep within minutes.',
    cadence: { mode: 'on-event', detail: 'When a CRM lead is created' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'draft',
    interrupts: [
      { when: 'Lead value is over $100k ARR', action: 'approve' },
      { when: 'Routing confidence is below 70%', action: 'notify' },
    ],
    routeTo: { kind: 'role', name: 'SDR manager', sla: '1 hour', fallback: 'RevOps lead' },
    authority: ['Read CRM leads', 'Enrich via data provider', 'Assign owner', 'Notify rep'],
    budget: { perRun: '$0.40', monthlyCap: '$900', maxIterations: '3000' },
    audit: { retention: '1 year', logLevel: 'Actions and approvals' },
    skills: ['Lead Qualifier', 'Account Researcher'],
    tools: ['Salesforce'],
  },
  {
    id: 'renewal-risk-watch', name: 'Renewal risk watch', version: 'v1.1.0',
    status: 'In Approval', shared: '4 Teams', sharedType: 'teams', owner: 'David Sullivan', ownerInit: 'DS', updated: '2 days ago',
    objective: 'Watch the book of business for accounts drifting toward churn and surface them well before renewal.',
    cadence: { mode: 'continuous', detail: 'Checked every 4 hours' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'watch',
    interrupts: [
      { when: 'Health score drops two tiers in a week', action: 'notify' },
      { when: 'Account ARR is over $250k', action: 'approve' },
    ],
    routeTo: { kind: 'team', name: 'CS pod leads', sla: '1 business day', fallback: 'VP Customer Success' },
    authority: ['Read product usage', 'Read Zendesk tickets', 'Read sentiment signals', 'Read-only — no actions'],
    budget: { perRun: '$0.15', monthlyCap: '$600', maxIterations: '5000' },
    audit: { retention: '1 year', logLevel: 'Full decision trace' },
    skills: ['Renewal Risk Monitor', 'Account Health Scorer'],
    tools: ['Zendesk'],
  },
  {
    id: 'quarterly-forecast-rollup', name: 'Quarterly forecast rollup', version: 'v0.6.0',
    status: 'Draft', shared: 'Only me', sharedType: 'private', owner: 'Michael Brooks', ownerInit: 'MB', updated: '1 week ago',
    objective: 'Assemble the quarterly forecast and keep refining it until commit, best case, and worst case reconcile.',
    cadence: { mode: 'scheduled', detail: 'Weekly during close' },
    stop: { kind: 'goal', detail: 'Forecast variance within ±3%' },
    trust: 'act-check',
    interrupts: [
      { when: 'Forecast swings more than 10% vs last run', action: 'notify' },
      { when: '200 iterations are reached', action: 'pause' },
    ],
    routeTo: { kind: 'role', name: 'FP&A manager', sla: 'No SLA', fallback: 'Finance leadership' },
    authority: ['Read pipeline', 'Read historical conversion', 'Read budget', 'Write forecast draft'],
    budget: { perRun: '$1.10', monthlyCap: '$400', maxIterations: '200' },
    audit: { retention: '3 years', logLevel: 'Full decision trace' },
    skills: ['Pipeline Forecaster', 'Budget Variance Analyzer'],
    tools: [],
  },
  {
    id: 'inventory-anomaly-sentinel', name: 'Inventory anomaly sentinel', version: 'v2.0.3',
    status: 'Live', shared: 'Operations Team', sharedType: 'team', owner: 'Olivia Bennett', ownerInit: 'OB', updated: '3 weeks ago',
    objective: 'Keep inventory counts reconciled across warehouses and act on anomalies within set limits.',
    cadence: { mode: 'continuous', detail: 'Every 30 minutes' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'act-check',
    interrupts: [
      { when: 'Shrinkage exceeds 2% of SKU value', action: 'notify' },
      { when: 'A replenishment order is over $25,000', action: 'approve' },
      { when: 'Counts mismatch across 3 or more sites', action: 'pause' },
    ],
    routeTo: { kind: 'team', name: 'Warehouse leads', sla: '2 hours', fallback: 'Ops Director' },
    authority: ['Read WMS positions', 'Reconcile counts', 'Open replenishment tasks', 'Flag shrinkage'],
    budget: { perRun: '$0.20', monthlyCap: '$1,500', maxIterations: '8000' },
    audit: { retention: '3 years', logLevel: 'Actions and approvals' },
    skills: ['Inventory Reconciler', 'Spend Anomaly Detector'],
    tools: ['WMS'],
  },
  {
    id: 'access-request-triage', name: 'Access request triage', version: 'v1.3.2',
    status: 'Live', shared: 'IT & Security', sharedType: 'team', owner: 'David Sullivan', ownerInit: 'DS', updated: '4 days ago',
    objective: 'Triage every access request against least-privilege policy, clearing the safe ones and escalating the rest.',
    cadence: { mode: 'on-event', detail: 'When access is requested' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'act-check',
    interrupts: [
      { when: 'The request touches production or PII', action: 'approve' },
      { when: 'Privilege exceeds the requester baseline', action: 'block' },
      { when: 'Policy match confidence is below 90%', action: 'notify' },
    ],
    routeTo: { kind: 'queue', name: 'Security on-call', sla: '30 minutes', fallback: 'Security Lead' },
    authority: ['Read IdP requests', 'Read policy baselines', 'Grant low-risk access', 'Escalate sensitive grants'],
    budget: { perRun: '$0.30', monthlyCap: '$700', maxIterations: '2500' },
    audit: { retention: '7 years', logLevel: 'Full decision trace' },
    skills: ['Access Request Reviewer', 'Policy Compliance Scanner'],
    tools: ['Okta'],
  },
  {
    id: 'campaign-performance-optimizer', name: 'Campaign performance optimizer', version: 'v0.9.1',
    status: 'In Approval', shared: '2 Users, 5 Teams', sharedType: 'teams', owner: 'Olivia Bennett', ownerInit: 'OB', updated: '6 days ago',
    objective: 'Reallocate campaign spend toward what is working until cost-per-acquisition hits target, within budget.',
    cadence: { mode: 'scheduled', detail: 'Daily' },
    stop: { kind: 'goal', detail: 'CPA at or below $45' },
    trust: 'draft',
    interrupts: [
      { when: 'Daily spend would exceed $10,000', action: 'pause' },
      { when: 'A reallocation shifts more than 30% of budget', action: 'approve' },
    ],
    routeTo: { kind: 'role', name: 'Growth marketing lead', sla: '4 business hours', fallback: 'Marketing ops' },
    authority: ['Read campaign metrics', 'Propose budget reallocation', 'Draft ad variants', 'Apply within daily ceiling'],
    budget: { perRun: '$0.80', monthlyCap: '$2,000', maxIterations: '400' },
    audit: { retention: '1 year', logLevel: 'Actions and approvals' },
    skills: ['Ad Copy Generator', 'Landing Page Auditor'],
    tools: [],
  },
  {
    id: 'support-escalation-router', name: 'Support escalation router', version: 'v1.0.0',
    status: 'Archived', shared: 'Support Team', sharedType: 'team', owner: 'James Carter', ownerInit: 'JC', updated: '2 months ago',
    objective: 'Classify every escalation and route it to the right owner with full context attached.',
    cadence: { mode: 'on-event', detail: 'When a case is escalated' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'act-check',
    interrupts: [
      { when: 'The customer is enterprise tier', action: 'notify' },
      { when: 'Routing confidence is below 75%', action: 'notify' },
    ],
    routeTo: { kind: 'role', name: 'Support duty manager', sla: '15 minutes', fallback: 'Support Manager' },
    authority: ['Read support cases', 'Classify escalation', 'Route to owner', 'Attach context summary'],
    budget: { perRun: '$0.18', monthlyCap: '$300', maxIterations: '0' },
    audit: { retention: '90 days', logLevel: 'Approvals only' },
    skills: ['Escalation Router', 'Ticket Summarizer'],
    tools: [],
  },
]

export const LOOPS = RAW.slice()
export const findLoop = (id) => LOOPS.find(l => l.id === id)

/* tools/connectors a loop can be granted */
export const TOOL_CATALOGUE = ['Salesforce', 'NetSuite', 'HubSpot', 'Snowflake', 'Slack', 'Zendesk', 'Okta', 'GitHub', 'Google Sheets', 'Jira', 'WMS']

/* ─── Loop Library — curated, ready-to-adopt templates ────────────────────*/
const LIB = [
  {
    cat: 'Continuous', icon: 'it', group: 'By cadence', skills: [
      { name: 'Renewal risk watch', desc: 'Surface accounts drifting toward churn ahead of renewal.' },
      { name: 'Inventory anomaly sentinel', desc: 'Reconcile counts and flag shrinkage across warehouses.' },
      { name: 'Spend anomaly monitor', desc: 'Watch for unusual spend patterns and flag for review.' },
      { name: 'Uptime & SLA sentinel', desc: 'Watch service health and escalate on SLA risk.' },
    ],
  },
  {
    cat: 'Scheduled', icon: 'ops', group: 'By cadence', skills: [
      { name: 'Daily invoice reconciliation', desc: 'Keep invoices reconciled to POs every morning.' },
      { name: 'Nightly data quality sweep', desc: 'Profile key tables overnight and open tickets for anomalies.' },
      { name: 'Weekly pipeline hygiene', desc: 'Flag stale or single-threaded deals before the forecast call.' },
      { name: 'Quarterly forecast rollup', desc: 'Refine the forecast until commit and best case reconcile.' },
    ],
  },
  {
    cat: 'On event', icon: 'eng', group: 'By cadence', skills: [
      { name: 'Lead enrichment & routing', desc: 'Enrich and route every new CRM lead to the right rep.' },
      { name: 'Access request triage', desc: 'Evaluate access requests against least-privilege policy.' },
      { name: 'Incident first-responder', desc: 'Open a timeline and page the on-call when an alert fires.' },
      { name: 'Contract intake reviewer', desc: 'Flag risky clauses the moment a contract is uploaded.' },
    ],
  },
  {
    cat: 'Finance', icon: 'finance', group: 'By department', skills: [
      { name: 'Month-end close assistant', desc: 'Drive the close checklist and chase open items.' },
      { name: 'Expense policy enforcer', desc: 'Review expenses against policy and flag exceptions.' },
    ],
  },
  {
    cat: 'IT & Security', icon: 'it', group: 'By department', skills: [
      { name: 'Phishing triage', desc: 'Classify reported emails and recommend action.' },
      { name: 'Cert expiry watcher', desc: 'Watch certificates and open renewal tasks before expiry.' },
    ],
  },
]
export const LOOP_LIBRARY = LIB.map(c => ({ ...c, skills: c.skills.map(s => ({ ...s, id: `loop-${slug(c.cat)}-${slug(s.name)}` })) }))
export const LOOP_LIBRARY_GROUPS = ['By cadence', 'By department']

/* a blank loop draft — enterprise-safe defaults so a loop is governed even
   if the author never opens Advanced oversight */
export function blankLoop(objective = '') {
  return {
    id: 'new-loop', name: '', version: 'v0.1.0', status: 'Draft',
    shared: 'Only me', sharedType: 'private', owner: 'You', ownerInit: 'YO', updated: 'just now',
    objective,
    cadence: { mode: 'scheduled', detail: '' },
    stop: { kind: 'recurring', detail: '' },
    trust: 'act-check',
    interrupts: [{ when: '', action: 'approve' }],
    routeTo: { kind: 'queue', name: '', sla: '4 business hours', fallback: '' },
    authority: [],
    budget: { perRun: '', monthlyCap: '', maxIterations: '500' },
    audit: { retention: '1 year', logLevel: 'Full decision trace' },
    skills: [],
    tools: [],
  }
}

/* derive a loop name from its objective when the author hasn't set one */
export function nameFromObjective(objective) {
  const t = (objective || '').trim()
  if (!t) return ''
  const first = t.replace(/^(keep|watch|triage|enrich|reconcile|assemble|reallocate|classify)\b/i, '').trim() || t
  const words = first.split(/\s+/).slice(0, 5).join(' ').replace(/[.,]$/, '')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
