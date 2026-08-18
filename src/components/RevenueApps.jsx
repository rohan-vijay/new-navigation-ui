import { useState, useMemo } from 'react'
import * as echarts from 'echarts'
import {
  INK, MUTED, LINE, LINE2, CANVAS, HEALTH, BLUE, GREEN, CORAL, PURPLE, GOLD,
  card, mono, serif, fmtUSD, clamp,
  ECH_FONT, AX_LABEL, TT, catAxis, valAxis,
  Chart, AppHeader, LiveBadge, StatusDot, Spark,
} from './appsKit'

// ─── REVENUE TEAMS APPLICATIONS ──────────────────────────────────────────────
// Five visual applications on the Revenue Teams Context Graph — Sales,
// Marketing and Customer Success resolved onto one Account × Opportunity spine.
//
//   'rv_pipeline'    → Pipeline Command    — Sales leadership · forecast + risk
//   'rv_attribution' → Attribution Studio  — Marketing · what creates pipeline
//   'rv_retention'   → Retention Cockpit   — CS · churn risk before renewal
//   'rv_expansion'   → Expansion Map       — Growth · whitespace and upsell
//   'rv_pulse'       → Revenue Pulse       — CRO · ARR, retention, efficiency
//
// Every number lives in ONE place below. Northwind Logistics' $1.24M ARR, its
// 72 health score, its 240 licensed / 186 active seats, its 112-day renewal and
// its $480K of open pipeline across three opportunities are the same figures
// the existing Customer 360 application renders — all five apps here read the
// same tables, so nothing can disagree.

// ─── QUARTER CONSTANTS ───────────────────────────────────────────────────────
// $M unless noted. Coverage and the gap to quota are derived, never restated.
const Q = {
  quota: 9.2,
  pipeline: 24.6,
  closed: 5.6,          // closed-won so far this quarter
  commitOpen: 2.8,      // open deals in commit
  bestOpen: 2.8,        // upside on top of commit
  cycleDays: 68,
  winRate: 24,
  elapsedPct: 68,       // Aug 18 — the quarter is two-thirds gone
}
Q.commit = Math.round((Q.closed + Q.commitOpen) * 10) / 10   // 8.4
Q.best = Math.round((Q.commit + Q.bestOpen) * 10) / 10       // 11.2
Q.coverage = Math.round((Q.pipeline / Q.quota) * 10) / 10
Q.gap = Math.round((Q.quota - Q.commit) * 10) / 10

const COMPETITOR = 'Atlas Data Cloud'
const SOURCES = [
  'Salesforce', 'Marketo', 'Marketing Cloud', 'Google Ads', 'LinkedIn Ads', 'Segment CDP',
  '6sense', 'Gong', 'Outreach', 'Gainsight', 'Zendesk', 'Zuora', 'Clari', 'Snowflake', 'Pendo',
]

// ─── SHARED DATA · PRODUCTS ──────────────────────────────────────────────────
const PRODUCTS = [
  { id: 'platform', name: 'Platform', short: 'Platform', color: BLUE },
  { id: 'analytics', name: 'Analytics add-on', short: 'Analytics', color: PURPLE },
  { id: 'api', name: 'API Gateway', short: 'API GW', color: GREEN },
]

// ─── SHARED DATA · ACCOUNTS ──────────────────────────────────────────────────
// Twelve named accounts. Northwind is the hero record and is pinned to the
// figures Customer 360 already publishes. `health` bands: good ≥ 80,
// watch 75–79, at risk < 75.
const ACCOUNTS = [
  {
    id: 'northwind', name: 'Northwind Logistics', segment: 'Enterprise', industry: 'Logistics & Supply Chain',
    arr: 1240000, health: 72, prevHealth: 84, renewal: '2026-11-30', renewalDays: 112,
    owner: 'Priya Raman', csm: 'Sam Ortega', seats: 240, activeSeats: 186, usage: 'falling',
    products: ['platform'], nps: 6, driver: 'Seat utilisation −22% in 12 weeks',
  },
  {
    id: 'cascade', name: 'Cascade Analytics', segment: 'Enterprise', industry: 'Data & Analytics',
    arr: 860000, health: 88, prevHealth: 85, renewal: '2027-02-08', renewalDays: 174,
    owner: 'Priya Raman', csm: 'Ivy Delgado', seats: 160, activeSeats: 151, usage: 'rising',
    products: ['platform', 'analytics'], nps: 9, driver: null,
  },
  {
    id: 'meridian', name: 'Meridian Labs', segment: 'Enterprise', industry: 'Life Sciences',
    arr: 610000, health: 64, prevHealth: 70, renewal: '2026-10-06', renewalDays: 49,
    owner: 'Elena Ruiz', csm: 'Sam Ortega', seats: 120, activeSeats: 81, usage: 'falling',
    products: ['platform'], nps: 5, driver: 'Onboarding never completed — 48%',
  },
  {
    id: 'horizon', name: 'Horizon Tech', segment: 'Strategic', industry: 'Software & Internet',
    arr: 2100000, health: 91, prevHealth: 89, renewal: '2027-04-06', renewalDays: 231,
    owner: 'Daniel Osei', csm: 'Ivy Delgado', seats: 420, activeSeats: 402, usage: 'rising',
    products: ['platform', 'analytics', 'api'], nps: 9, driver: null,
  },
  {
    id: 'summit', name: 'Summit Partners', segment: 'Mid-Market', industry: 'Financial Services',
    arr: 445000, health: 55, prevHealth: 68, renewal: '2026-09-06', renewalDays: 19,
    owner: 'Marcus Webb', csm: 'Rosa Kim', seats: 90, activeSeats: 51, usage: 'falling',
    products: ['platform'], nps: 4, driver: 'Champion left — no exec sponsor mapped',
  },
  {
    id: 'apex', name: 'Apex Global', segment: 'Strategic', industry: 'Manufacturing',
    arr: 1680000, health: 79, prevHealth: 81, renewal: '2027-07-06', renewalDays: 322,
    owner: 'Sofia Marchetti', csm: 'Sam Ortega', seats: 340, activeSeats: 296, usage: 'flat',
    products: ['platform'], nps: 7, driver: null,
  },
  {
    id: 'quantum', name: 'Quantum Dynamics', segment: 'SMB', industry: 'Research & Development',
    arr: 320000, health: 83, prevHealth: 76, renewal: '2026-11-21', renewalDays: 95,
    owner: 'Tom Bradley', csm: 'Rosa Kim', seats: 60, activeSeats: 56, usage: 'rising',
    products: ['platform', 'analytics'], nps: 8, driver: null,
  },
  {
    id: 'vertex', name: 'Vertex Solutions', segment: 'Enterprise', industry: 'Professional Services',
    arr: 975000, health: 47, prevHealth: 66, renewal: '2026-11-06', renewalDays: 80,
    owner: 'Marcus Webb', csm: 'Rosa Kim', seats: 200, activeSeats: 104, usage: 'falling',
    products: ['platform'], nps: 3, driver: 'Exec sponsor left · 52% of seats dormant',
  },
  {
    id: 'beacon', name: 'Beacon Industries', segment: 'Enterprise', industry: 'Industrial Distribution',
    arr: 1050000, health: 86, prevHealth: 82, renewal: '2027-03-08', renewalDays: 200,
    owner: 'Tom Bradley', csm: 'Ivy Delgado', seats: 210, activeSeats: 194, usage: 'rising',
    products: ['platform', 'analytics'], nps: 8, driver: null,
  },
  {
    id: 'delphi', name: 'Delphi Networks', segment: 'Mid-Market', industry: 'Telecommunications',
    arr: 720000, health: 68, prevHealth: 74, renewal: '2027-04-20', renewalDays: 245,
    owner: 'Sofia Marchetti', csm: 'Rosa Kim', seats: 150, activeSeats: 112, usage: 'falling',
    products: ['platform', 'analytics'], nps: 6, driver: 'Sev-2 aging 11 days · two escalations',
  },
  {
    id: 'forge', name: 'Forge Systems', segment: 'Mid-Market', industry: 'Engineering Software',
    arr: 540000, health: 71, prevHealth: 73, renewal: '2027-05-30', renewalDays: 285,
    owner: 'Daniel Osei', csm: 'Ivy Delgado', seats: 110, activeSeats: 79, usage: 'falling',
    products: ['platform'], nps: 6, driver: 'Champion silent 41 days',
  },
  {
    id: 'pinnacle', name: 'Pinnacle Systems', segment: 'Enterprise', industry: 'Healthcare IT',
    arr: 1320000, health: 81, prevHealth: 78, renewal: '2026-10-21', renewalDays: 64,
    owner: 'Elena Ruiz', csm: 'Sam Ortega', seats: 260, activeSeats: 238, usage: 'rising',
    products: ['platform', 'api'], nps: 8, driver: null,
  },
]

// Colour band for the ring / dots / renewal bubbles. The at-risk *flag* is a
// separate, stricter line at 75 — Northwind at 72 reads amber but is still on
// the watchlist, which is exactly the state the renewal calendar has to show.
const healthBand = h => h >= 80 ? 'good' : h >= 65 ? 'warn' : 'bad'
ACCOUNTS.forEach(a => { a.band = healthBand(a.health); a.atRisk = a.health < 75 })

const acctById = id => ACCOUNTS.find(a => a.id === id)
const BOOK_WINDOW = 182 // "next two quarters" in days

// Licensed vs active seats over 12 weeks. Northwind's series is pinned to the
// shape Customer 360 renders and lands exactly on 186.
const NORTHWIND_SEATS = [238, 236, 233, 230, 226, 221, 215, 209, 203, 197, 191, 186]
function seatSeries(a) {
  if (a.id === 'northwind') return NORTHWIND_SEATS
  const end = a.activeSeats
  const drift = a.usage === 'falling' ? 0.14 : a.usage === 'rising' ? -0.10 : 0.02
  return Array.from({ length: 12 }, (_, i) =>
    Math.round(end * (1 + drift * (11 - i) / 11) + Math.sin(i * 1.7 + a.name.length) * (end * 0.008)))
}

// ─── SHARED DATA · REPS ──────────────────────────────────────────────────────
// Quotas sum to the $9.2M quarter quota; closed sums to the $5.6M already
// booked; quota × coverage sums to the $24.6M pipeline. Nothing is restated.
const REPS = [
  { name: 'Priya Raman', quota: 1800000, closed: 1310000, coverage: 3.3, slipping: 1, trend: [58, 62, 66, 69, 71, 73], accounts: 11 },
  { name: 'Daniel Osei', quota: 1600000, closed: 1090000, coverage: 3.0, slipping: 2, trend: [46, 51, 57, 61, 65, 68], accounts: 12 },
  { name: 'Sofia Marchetti', quota: 1500000, closed: 930000, coverage: 2.8, slipping: 2, trend: [41, 46, 50, 55, 59, 62], accounts: 9 },
  { name: 'Tom Bradley', quota: 1600000, closed: 880000, coverage: 2.5, slipping: 3, trend: [38, 42, 46, 49, 52, 55], accounts: 14 },
  { name: 'Elena Ruiz', quota: 1400000, closed: 700000, coverage: 2.3, slipping: 4, trend: [31, 35, 40, 44, 47, 50], accounts: 16 },
  { name: 'Marcus Webb', quota: 1300000, closed: 690000, coverage: 1.9, slipping: 5, trend: [36, 41, 44, 47, 50, 53], accounts: 7 },
]
REPS.forEach(r => {
  r.attain = Math.round((r.closed / r.quota) * 100)
  r.pipeline = Math.round(r.quota * r.coverage)
})
const REP_QUOTA = REPS.reduce((s, r) => s + r.quota, 0)
const REP_PIPELINE = REPS.reduce((s, r) => s + r.pipeline, 0)
const REP_SLIPPING = REPS.reduce((s, r) => s + r.slipping, 0)

// ─── SHARED DATA · OPPORTUNITIES ─────────────────────────────────────────────
// Northwind's three carry the same amounts, stages, probabilities and idle days
// Customer 360 shows — $310K + $120K + $50K = the $480K of open pipeline.
const OPEN_STAGES = ['Discovery', 'Proposal', 'Negotiation']

const RISKS = {
  nonext: 'No next step',
  single: 'Single-threaded',
  pushed: 'Pushed twice',
  silent: 'Champion silent',
}

const OPPS = [
  { id: 'OPP-4412', acct: 'northwind', name: 'Platform expansion — 240 seats', product: 'platform', amount: 310000, stage: 'Negotiation', prob: 70, close: 'Nov 14', idle: 6, rep: 'Priya Raman', next: 'Legal redlines back from Procurement', comp: COMPETITOR, risks: [] },
  { id: 'OPP-4508', acct: 'northwind', name: 'Analytics add-on', product: 'analytics', amount: 120000, stage: 'Proposal', prob: 45, close: 'Dec 5', idle: 26, rep: 'Priya Raman', next: 'No next step logged', comp: COMPETITOR, risks: ['nonext', 'silent'] },
  { id: 'OPP-4577', acct: 'northwind', name: 'API Gateway cross-sell', product: 'api', amount: 50000, stage: 'Discovery', prob: 20, close: 'Jan 30', idle: 4, rep: 'Priya Raman', next: 'Technical discovery with Alex Reyes', comp: null, risks: [] },
  { id: 'OPP-4601', acct: 'horizon', name: 'Platform renewal + 80 seats', product: 'platform', amount: 420000, stage: 'Negotiation', prob: 75, close: 'Sep 26', idle: 3, rep: 'Daniel Osei', next: 'Security review scheduled', comp: null, risks: [] },
  { id: 'OPP-4620', acct: 'apex', name: 'Analytics rollout — 4 plants', product: 'analytics', amount: 380000, stage: 'Proposal', prob: 50, close: 'Oct 12', idle: 12, rep: 'Sofia Marchetti', next: 'Pricing workshop with Finance', comp: COMPETITOR, risks: [] },
  { id: 'OPP-4633', acct: 'beacon', name: 'API Gateway platform deal', product: 'api', amount: 265000, stage: 'Discovery', prob: 25, close: 'Dec 18', idle: 8, rep: 'Tom Bradley', next: 'Architecture review booked', comp: null, risks: [] },
  { id: 'OPP-4644', acct: 'cascade', name: 'Seat expansion — 60 seats', product: 'platform', amount: 190000, stage: 'Negotiation', prob: 65, close: 'Sep 30', idle: 5, rep: 'Priya Raman', next: 'Order form with Procurement', comp: null, risks: [] },
  { id: 'OPP-4655', acct: 'pinnacle', name: 'Analytics add-on', product: 'analytics', amount: 240000, stage: 'Proposal', prob: 40, close: 'Nov 8', idle: 18, rep: 'Elena Ruiz', next: 'Awaiting security questionnaire', comp: COMPETITOR, risks: ['single'] },
  { id: 'OPP-4662', acct: 'vertex', name: 'Renewal FY27', product: 'platform', amount: 640000, stage: 'Negotiation', prob: 35, close: 'Nov 6', idle: 21, rep: 'Marcus Webb', next: 'Chasing new exec sponsor', comp: COMPETITOR, risks: ['silent', 'pushed'] },
  { id: 'OPP-4671', acct: 'summit', name: 'Seat expansion — 40 seats', product: 'platform', amount: 210000, stage: 'Proposal', prob: 30, close: 'Sep 30', idle: 34, rep: 'Marcus Webb', next: 'No next step logged', comp: null, risks: ['pushed', 'nonext'] },
  { id: 'OPP-4688', acct: 'meridian', name: 'Analytics platform', product: 'analytics', amount: 180000, stage: 'Discovery', prob: 20, close: 'Dec 20', idle: 29, rep: 'Elena Ruiz', next: 'One contact engaged', comp: null, risks: ['single'] },
  { id: 'OPP-4694', acct: 'quantum', name: 'API Gateway', product: 'api', amount: 95000, stage: 'Discovery', prob: 20, close: 'Jan 15', idle: 31, rep: 'Tom Bradley', next: 'No next step logged', comp: null, risks: ['nonext'] },
  { id: 'OPP-4702', acct: 'delphi', name: 'Platform expansion — 50 seats', product: 'platform', amount: 155000, stage: 'Proposal', prob: 45, close: 'Oct 30', idle: 9, rep: 'Sofia Marchetti', next: 'Business case with the CFO', comp: null, risks: [] },
  { id: 'OPP-4711', acct: 'forge', name: 'Analytics add-on', product: 'analytics', amount: 130000, stage: 'Discovery', prob: 20, close: 'Jan 22', idle: 14, rep: 'Daniel Osei', next: 'Discovery call booked', comp: null, risks: [] },
  { id: 'OPP-4390', acct: 'horizon', name: 'Q3 renewal + Analytics', product: 'platform', amount: 560000, stage: 'Closed Won', prob: 100, close: 'Jul 18', idle: 0, rep: 'Daniel Osei', next: '—', comp: null, risks: [] },
  { id: 'OPP-4402', acct: 'apex', name: 'Platform expansion — 80 seats', product: 'platform', amount: 445000, stage: 'Closed Won', prob: 100, close: 'Jul 31', idle: 0, rep: 'Sofia Marchetti', next: '—', comp: null, risks: [] },
  { id: 'OPP-4418', acct: 'beacon', name: 'Renewal FY27 + 30 seats', product: 'platform', amount: 310000, stage: 'Closed Won', prob: 100, close: 'Aug 8', idle: 0, rep: 'Tom Bradley', next: '—', comp: null, risks: [] },
  { id: 'OPP-4377', acct: 'meridian', name: 'Data warehouse connector', product: 'api', amount: 74000, stage: 'Closed Lost', prob: 0, close: 'Jun 26', idle: 0, rep: 'Elena Ruiz', next: '—', comp: COMPETITOR, risks: [] },
]

const openOpps = OPPS.filter(o => OPEN_STAGES.includes(o.stage))
const oppsFor = id => OPPS.filter(o => o.acct === id)
const openPipelineFor = id => oppsFor(id).filter(o => OPEN_STAGES.includes(o.stage)).reduce((s, o) => s + o.amount, 0)
const AT_RISK_OPPS = openOpps.filter(o => o.risks.length > 0).sort((a, b) => b.idle - a.idle)
const AT_RISK_USD = AT_RISK_OPPS.reduce((s, o) => s + o.amount, 0)

// Stage totals for the funnel — book-wide $M, summing to the $24.6M pipeline.
// The conversion rates are historical, and their product is the 24% win rate.
const FUNNEL_STAGES = [
  { stage: 'Discovery', usd: 10.9, conv: 62 },
  { stage: 'Proposal', usd: 8.3, conv: 66 },
  { stage: 'Negotiation', usd: 5.4, conv: 59 },
]
const FUNNEL_TOTAL = Math.round(FUNNEL_STAGES.reduce((s, f) => s + f.usd, 0) * 10) / 10

// Pipeline movement across the quarter — starts at last quarter's close and
// lands exactly on the $24.6M open pipeline.
const MOVEMENT = [
  ['Opening', 23.9, 'base'],
  ['Opened', 9.8, 'up'],
  ['Upsized', 0.8, 'up'],
  ['Slipped out', -2.4, 'down'],
  ['Lost', -1.9, 'down'],
  ['Won', -5.6, 'down'],
  ['Now', 24.6, 'base'],
]

// ─── SHARED DATA · CAMPAIGNS ─────────────────────────────────────────────────
// spend sums to $860K, sourced to $4.2M. `last` touches distribute the $15.3M
// of influenced pipeline under a last-touch model; the multi-touch split is
// derived from first/mid/last with W-shaped weights, so the two models are
// guaranteed to move the same total money around.
const MKT = { spend: 860000, sourced: 4200000, influenced: 15300000, mqlToSql: 31, newLogos: 68, newBizSpend: 2900000 }

const CAMPAIGNS = [
  { id: 'summit', name: 'Logistics Summit Chicago', channel: 'Field Event', spend: 180000, sourced: 820000, first: 34, mid: 62, last: 18 },
  { id: 'visibility', name: 'Supply Chain Visibility 2026', channel: 'Webinar', spend: 96000, sourced: 640000, first: 58, mid: 88, last: 12 },
  { id: 'compterms', name: 'API Gateway — competitor terms', channel: 'Google Ads', spend: 142000, sourced: 510000, first: 26, mid: 31, last: 74 },
  { id: 'drip', name: 'Analytics Add-on Drip', channel: 'Email Nurture', spend: 34000, sourced: 290000, first: 8, mid: 104, last: 22 },
  { id: 'gartner', name: 'Gartner MQ Reprint', channel: 'Syndication', spend: 78000, sourced: 380000, first: 41, mid: 36, last: 9 },
  { id: 'abm', name: 'LinkedIn ABM — Enterprise', channel: 'LinkedIn Ads', spend: 124000, sourced: 560000, first: 32, mid: 48, last: 16 },
  { id: 'pricing', name: 'Pricing page — direct', channel: 'Website', spend: 12000, sourced: 310000, first: 14, mid: 42, last: 96 },
  { id: 'advocacy', name: 'Customer Advocacy Program', channel: 'Referral', spend: 46000, sourced: 420000, first: 22, mid: 18, last: 11 },
  { id: 'launch', name: 'Q3 Product Launch', channel: 'Multi-channel', spend: 118000, sourced: 190000, first: 12, mid: 54, last: 7 },
  { id: 'retarget', name: 'Retargeting — always on', channel: 'Google Ads', spend: 30000, sourced: 80000, first: 4, mid: 26, last: 41 },
]

const LAST_TOTAL = CAMPAIGNS.reduce((s, c) => s + c.last, 0)
const W_TOTAL = CAMPAIGNS.reduce((s, c) => s + (0.3 * c.first + 0.4 * c.mid + 0.3 * c.last), 0)
CAMPAIGNS.forEach(c => {
  c.touches = c.first + c.mid + c.last
  c.lastTouch = Math.round((c.last / LAST_TOTAL) * MKT.influenced)
  c.multiTouch = Math.round(((0.3 * c.first + 0.4 * c.mid + 0.3 * c.last) / W_TOTAL) * MKT.influenced)
  c.shift = c.multiTouch - c.lastTouch
  c.roi = Math.round((c.sourced / c.spend) * 10) / 10
  c.cpp = Math.round((c.spend / c.sourced) * 100) / 100  // cost per pipeline $
  c.health = c.roi >= 5 ? 'good' : c.roi >= 2.5 ? 'warn' : 'bad'
})
const MKT_SPEND_CHECK = CAMPAIGNS.reduce((s, c) => s + c.spend, 0)
const MKT_SOURCED_CHECK = CAMPAIGNS.reduce((s, c) => s + c.sourced, 0)
// The campaign last-touch model most flatters: biggest positive last-touch gap.
const FLATTERED = [...CAMPAIGNS].sort((a, b) => a.shift - b.shift)[0]

const CHANNELS = (() => {
  const map = {}
  CAMPAIGNS.forEach(c => {
    if (!map[c.channel]) map[c.channel] = { channel: c.channel, spend: 0, sourced: 0, campaigns: 0 }
    map[c.channel].spend += c.spend
    map[c.channel].sourced += c.sourced
    map[c.channel].campaigns += 1
  })
  return Object.values(map)
    .map(c => ({ ...c, cpp: Math.round((c.spend / c.sourced) * 100) / 100 }))
    .sort((a, b) => b.sourced - a.sourced)
})()

// The typical winning journey — average touch counts per step across won deals.
const JOURNEY = [
  ['First touch', 'Google Ads · competitor terms', 1.0],
  ['Content', 'Gartner MQ Reprint', 2.4],
  ['Webinar', 'Supply Chain Visibility 2026', 1.8],
  ['Field event', 'Logistics Summit Chicago', 1.2],
  ['Demo', 'Outreach sequence → SE demo', 2.6],
  ['Proposal', 'Quote + ROI calculator', 3.1],
  ['Closed Won', 'Signature', 2.1],
]
const JOURNEY_TOUCHES = Math.round(JOURNEY.reduce((s, j) => s + j[2], 0) * 10) / 10

const INTENT = [
  { acct: 'northwind', topic: 'evaluating API gateway vendors', score: 88, trend: 'surging', delta: '+34 in 14 days' },
  { acct: 'pinnacle', topic: 'analytics platform comparison', score: 76, trend: 'surging', delta: '+21 in 14 days' },
  { acct: 'delphi', topic: 'contract renewal / pricing research', score: 71, trend: 'rising', delta: '+16 in 14 days' },
]

// ─── SHARED DATA · RETENTION ─────────────────────────────────────────────────
const RET = { book: 14.8, nrr: 108, grr: 91 }

// Portfolio health distribution — 793 logos, the same logo count the segment
// table rolls up to. Its weighted mean is the 78 average health score.
const HEALTH_DIST = [
  ['<40', 18], ['40–50', 27], ['50–60', 44], ['60–70', 86],
  ['70–80', 190], ['80–90', 264], ['90+', 164],
]
const HEALTH_MIDS = [35, 45, 55, 65, 75, 85, 95]
const LOGOS = HEALTH_DIST.reduce((s, d) => s + d[1], 0)
const AVG_HEALTH = Math.round(HEALTH_DIST.reduce((s, d, i) => s + d[1] * HEALTH_MIDS[i], 0) / LOGOS)

const RENEWAL_BOOK = ACCOUNTS.filter(a => a.renewalDays <= BOOK_WINDOW).sort((a, b) => a.renewalDays - b.renewalDays)
const RENEWAL_BOOK_USD = RENEWAL_BOOK.reduce((s, a) => s + a.arr, 0)
const AT_RISK_ACCTS = ACCOUNTS.filter(a => a.atRisk).sort((a, b) => a.health - b.health)
const AT_RISK_BOOK_USD = RENEWAL_BOOK.filter(a => a.atRisk).reduce((s, a) => s + a.arr, 0)

// Which signals actually predict a churn event, ranked by lift over base rate.
const CHURN_DRIVERS = [
  ['Seat utilisation trend · 12 wk', 0.78, true, 'Strongest single predictor. Northwind is −22% and falling.'],
  ['Champion engagement recency', 0.71, true, 'No inbound from the champion in 30+ days.'],
  ['Sev-2 ticket aging > 7 days', 0.64, true, 'TCK-8841 has been open 9 days on Northwind.'],
  ['Onboarding completion < 60%', 0.58, true, 'Meridian never finished — 48% complete.'],
  ['Exec sponsor change', 0.52, true, 'Summit and Vertex both lost their sponsor.'],
  ['NPS score alone', 0.21, false, 'Detractors churn barely more often than promoters.'],
  ['Ticket volume alone', 0.14, false, 'Volume tracks size, not risk.'],
  ['Login count alone', 0.09, false, 'Logins stay flat right up to the non-renewal.'],
]

// ─── SHARED DATA · EXPANSION ─────────────────────────────────────────────────
// Whitespace value for every product an account does not already own. Where an
// open opportunity exists the number IS the opportunity amount, so the matrix
// and the pipeline can never diverge. The whole grid sums to $6.4M.
const WHITESPACE = {
  northwind: { analytics: 120000, api: 50000 },
  cascade: { api: 900000 },
  meridian: { analytics: 180000, api: 340000 },
  horizon: {},
  summit: { analytics: 260000, api: 180000 },
  apex: { analytics: 380000, api: 1340000 },
  quantum: { api: 95000 },
  vertex: { analytics: 700000, api: 380000 },
  beacon: { api: 265000 },
  delphi: { api: 540000 },
  forge: { analytics: 130000, api: 300000 },
  pinnacle: { analytics: 240000 },
}
const WHITESPACE_TOTAL = Object.values(WHITESPACE).reduce((s, m) => s + Object.values(m).reduce((t, v) => t + v, 0), 0)
const OWNED_TOTAL = ACCOUNTS.reduce((s, a) => s + a.products.length, 0)
const AVG_PRODUCTS = Math.round((OWNED_TOTAL / ACCOUNTS.length) * 10) / 10
const EXPANSION_YTD = 2100000

// cell state for the penetration matrix
function cellState(acct, prod) {
  if (acct.products.includes(prod)) return 'owned'
  if (openOpps.some(o => o.acct === acct.id && o.product === prod)) return 'pipeline'
  return (WHITESPACE[acct.id] || {})[prod] ? 'white' : 'none'
}
const productPenetration = prod => ACCOUNTS.filter(a => a.products.includes(prod)).length

const EVIDENCE = {
  headroom: 'Usage headroom',
  intent: 'API intent',
  pricing: 'Pricing-page sessions',
  sponsor: 'Exec sponsor',
}

const READINESS = [
  { acct: 'apex', score: 92, evidence: ['headroom', 'sponsor', 'pricing'] },
  { acct: 'cascade', score: 88, evidence: ['headroom', 'intent'] },
  { acct: 'northwind', score: 84, evidence: ['intent', 'pricing', 'sponsor'] },
  { acct: 'pinnacle', score: 79, evidence: ['intent', 'sponsor'] },
  { acct: 'beacon', score: 76, evidence: ['headroom', 'sponsor'] },
  { acct: 'delphi', score: 71, evidence: ['pricing'] },
  { acct: 'quantum', score: 68, evidence: ['headroom', 'intent'] },
  { acct: 'forge', score: 64, evidence: ['pricing'] },
  { acct: 'meridian', score: 61, evidence: ['intent'] },
  { acct: 'summit', score: 38, evidence: [] },
  { acct: 'vertex', score: 24, evidence: [] },
]
READINESS.forEach(r => { r.whitespace = Object.values(WHITESPACE[r.acct] || {}).reduce((s, v) => s + v, 0) })
const READY_NOW = READINESS.filter(r => r.score >= 60).length

// Consumption against contracted plan limits — the strongest upsell tell.
const HEADROOM = [
  ['apex', 94, 'API calls'], ['cascade', 91, 'Analytics queries'], ['horizon', 88, 'API calls'],
  ['beacon', 84, 'Analytics queries'], ['quantum', 82, 'API calls'], ['pinnacle', 74, 'API calls'],
  ['delphi', 69, 'Analytics queries'], ['northwind', 61, 'Platform seats'],
]

const EXP_SIGNALS = [
  ['Aug 16', 'apex', 'Usage threshold', 'API calls at 94% of plan for a third straight week', 'Pendo'],
  ['Aug 15', 'northwind', 'Intent surge', '"evaluating API gateway vendors" at 88 — up 34 in 14 days', '6sense'],
  ['Aug 14', 'cascade', 'Pricing page', '9 sessions from 4 contacts in 5 days', 'Segment CDP'],
  ['Aug 12', 'pinnacle', 'Exec sponsor', 'New CDO joined from an Analytics customer', 'Salesforce'],
  ['Aug 11', 'beacon', 'Product event', '214 API console visits and no key ever issued', 'Pendo'],
  ['Aug 09', 'delphi', 'Seat utilisation', '96% of licensed seats active — capacity is gone', 'Zuora'],
  ['Aug 07', 'quantum', 'Call keyword', '"add-on pricing" raised on three calls this month', 'Gong'],
]

// ─── SHARED DATA · CRO / PULSE ───────────────────────────────────────────────
// The bridge is the source of truth: NRR, GRR and net new ARR are all derived
// from it, so the board numbers cannot drift from the components.
const BRIDGE = { start: 42.3, newLogo: 2.5, expansion: 7.2, contraction: 1.4, churn: 2.4 }
BRIDGE.end = Math.round((BRIDGE.start + BRIDGE.newLogo + BRIDGE.expansion - BRIDGE.contraction - BRIDGE.churn) * 10) / 10
BRIDGE.netNew = Math.round((BRIDGE.newLogo + BRIDGE.expansion - BRIDGE.contraction - BRIDGE.churn) * 10) / 10
BRIDGE.nrr = Math.round(((BRIDGE.start + BRIDGE.expansion - BRIDGE.contraction - BRIDGE.churn) / BRIDGE.start) * 100)
BRIDGE.grr = Math.round(((BRIDGE.start - BRIDGE.contraction - BRIDGE.churn) / BRIDGE.start) * 100)
BRIDGE.yoy = Math.round(((BRIDGE.end / BRIDGE.start) - 1) * 100)

const QTRS8 = ['Q4 24', 'Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26']
const ARR_TREND = [36.8, 38.4, 40.1, 42.3, 43.9, 45.4, 46.9, 48.2]
const SM_SPEND = [3.6, 3.7, 3.9, 4.0, 4.1, 4.2, 4.2, 4.3]
const NET_NEW_Q = [1.05, 1.15, 1.30, 1.45, 1.40, 1.45, 1.55, 1.50]
const MAGIC = NET_NEW_Q.map((n, i) => Math.round((n * 4 / SM_SPEND[i]) * 100) / 100)
const SM_TTM = Math.round(SM_SPEND.slice(4).reduce((s, v) => s + v, 0) * 10) / 10
const GROSS_MARGIN = 0.82
const CAC = Math.round(MKT.newBizSpend / MKT.newLogos / 1000)
const CAC_PAYBACK = Math.round((MKT.newBizSpend / 1e6) / (BRIDGE.newLogo * GROSS_MARGIN) * 12)

const COHORT_MONTHS = ['0', '3', '6', '9', '12', '15', '18', '21']
const COHORTS = [
  ['Q4 24', [100, 101, 104, 106, 109, 112, 114, 117]],
  ['Q1 25', [100, 102, 105, 107, 110, 113, 115, null]],
  ['Q2 25', [100, 101, 103, 106, 108, 111, null, null]],
  ['Q3 25', [100, 102, 104, 107, 109, null, null, null]],
  ['Q4 25', [100, 103, 106, 108, null, null, null, null]],
  ['Q1 26', [100, 102, 105, null, null, null, null, null]],
  ['Q2 26', [100, 103, null, null, null, null, null, null]],
  ['Q3 26', [100, null, null, null, null, null, null, null]],
]

// ARR sums to the $48.2M ending ARR; NRR, payback and growth blend back to the
// headline 108% / 17 months / 14%.
const SEGMENTS = [
  { name: 'SMB', arr: 4.6, growth: 6, nrr: 94, payback: 11, logos: 512 },
  { name: 'Mid-Market', arr: 9.8, growth: 11, nrr: 103, payback: 15, logos: 186 },
  { name: 'Enterprise', arr: 21.4, growth: 15, nrr: 108, payback: 17, logos: 74 },
  { name: 'Strategic', arr: 12.4, growth: 19, nrr: 118, payback: 21, logos: 21 },
]
const SEG_ARR = Math.round(SEGMENTS.reduce((s, x) => s + x.arr, 0) * 10) / 10
const SEG_LOGOS = SEGMENTS.reduce((s, x) => s + x.logos, 0)

// ─── SMALL SHARED PIECES (Revenue apps only) ─────────────────────────────────

const sect = { fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, marginBottom: 8 }
// Every cell carries a right gutter so adjacent columns — especially the
// right-aligned numeric ones — never run into their neighbour's label.
const thStyle = { textAlign: 'left', padding: '0 14px 7px 0', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }
const tdStyle = { padding: '8px 14px 8px 0', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: 12.5 }

const usdM = n => '$' + (Math.abs(n) >= 100 ? Math.round(n) : n.toFixed(1)) + 'M'
const pct = n => `${n}%`

const TONE = {
  risk: { color: CORAL, bg: '#faf1ee', border: '#eddcd5' },
  warn: { color: GOLD, bg: '#fbf5e8', border: '#efe2c6' },
  info: { color: BLUE, bg: '#eef3fc', border: '#d6e2f6' },
  good: { color: GREEN, bg: '#f2faf5', border: '#cde7d6' },
  sig: { color: PURPLE, bg: '#f4f1fa', border: '#e0daf0' },
  mute: { color: '#6b6455', bg: '#faf8f3', border: LINE2 },
}

function RChip({ label, tone = 'mute' }) {
  const t = TONE[tone] || TONE.mute
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: t.color, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function RCard({ title, accent, right, children, style }) {
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: accent || MUTED }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function RKpi({ label, value, delta, good, sub }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 138, padding: '13px 15px' }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>{label}</div>
      <div style={{ ...serif, fontSize: 24, fontWeight: 500, color: INK, letterSpacing: -0.4, margin: '5px 0 3px' }}>{value}</div>
      {delta && <div style={{ ...mono, fontSize: 10.5, color: good ? HEALTH.good : HEALTH.bad }}>{delta}</div>}
      {sub && <div style={{ ...mono, fontSize: 10.5, color: MUTED }}>{sub}</div>}
    </div>
  )
}

function RBar({ pct: value, color = BLUE, target = null, h = 8, max = 100 }) {
  const P = v => clamp((v / max) * 100, 0, 100)
  return (
    <span style={{ position: 'relative', display: 'block', height: h, borderRadius: h / 2, background: '#f1efe9' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${P(value)}%`, background: color, opacity: 0.72, borderRadius: h / 2 }} />
      {target != null && <span style={{ position: 'absolute', left: `${P(target)}%`, top: -2, bottom: -2, width: 1.5, background: CORAL, borderRadius: 1 }} />}
    </span>
  )
}

// Health-score ring — the number every renewal conversation opens with.
function HealthRing({ score, prev, size = 96 }) {
  const r = size / 2 - 9
  const C = 2 * Math.PI * r
  const color = HEALTH[healthBand(score)]
  const drop = prev != null ? score - prev : null
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, display: 'block', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1efe9" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * C} ${C}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      {prev != null && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={MUTED} strokeWidth="8" strokeDasharray={`1.4 ${C}`}
          strokeDashoffset={-(prev / 100) * C} transform={`rotate(-90 ${size / 2} ${size / 2})`} opacity="0.8" />
      )}
      <text x={size / 2} y={size / 2 + 2} textAnchor="middle" style={{ ...mono, fontSize: 18, fontWeight: 600, fill: INK }}>{score}</text>
      {drop != null && (
        <text x={size / 2} y={size / 2 + 15} textAnchor="middle" style={{ ...mono, fontSize: 8, fill: drop < 0 ? CORAL : GREEN }}>
          {drop < 0 ? '▼' : '▲'} {Math.abs(drop)} pts
        </text>
      )}
    </svg>
  )
}

function DerivedCallout({ title = 'Derived signals', rows, note }) {
  return (
    <div style={{ background: '#f7f5fb', border: '1px solid #e5e0f0', borderLeft: `3px solid ${PURPLE}`, borderRadius: 9, padding: '10px 13px' }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: PURPLE, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#4b463d', lineHeight: 1.65 }}>
        {rows.map(([sig, text]) => (
          <div key={sig}><b style={{ color: PURPLE }}>{sig}</b> — {text}</div>
        ))}
      </div>
      {note && <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginTop: 7 }}>{note}</div>}
    </div>
  )
}

// ─── THUMBNAILS ──────────────────────────────────────────────────────────────

// Pipeline Command — the stage funnel with the quota line cutting across it.
function PipelineThumb() {
  const max = FUNNEL_STAGES[0].usd
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      {FUNNEL_STAGES.map((f, i) => {
        const w = (f.usd / max) * 180
        return <rect key={f.stage} x={(240 - w) / 2} y={14 + i * 24} width={w} height="17" rx="4" fill={BLUE} opacity={0.62 - i * 0.11} />
      })}
      <rect x={(240 - (Q.closed / max) * 180) / 2} y="86" width={(Q.closed / max) * 180} height="17" rx="4" fill={GREEN} opacity="0.6" />
      <line x1="18" y1="8" x2="18" y2="112" stroke={CORAL} strokeWidth="1.6" strokeDasharray="4 3" />
      <circle cx="18" cy="60" r="3" fill="#fff" stroke={CORAL} strokeWidth="1.6" />
    </svg>
  )
}

// Attribution Studio — last-touch bars against multi-touch bars, per campaign.
function AttribThumb() {
  const rows = CAMPAIGNS.slice(0, 6)
  const max = Math.max(...rows.map(c => Math.max(c.lastTouch, c.multiTouch)))
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <line x1="16" y1="8" x2="16" y2="112" stroke={LINE} strokeWidth="1" />
      {rows.map((c, i) => {
        const y = 12 + i * 17
        return (
          <g key={c.id}>
            <rect x="16" y={y} width={Math.max(3, (c.lastTouch / max) * 206)} height="6" rx="2" fill={GOLD} opacity="0.68" />
            <rect x="16" y={y + 7} width={Math.max(3, (c.multiTouch / max) * 206)} height="6" rx="2" fill={PURPLE} opacity="0.6" />
          </g>
        )
      })}
    </svg>
  )
}

// Retention Cockpit — renewals on a six-month rail, sized by ARR, colored by risk.
function RetentionThumb() {
  const R = a => 4 + Math.sqrt(a.arr / 1e6) * 7
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <line x1="14" y1="72" x2="226" y2="72" stroke={LINE2} strokeWidth="1.4" />
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <line key={i} x1={14 + i * 35.3} y1="68" x2={14 + i * 35.3} y2="76" stroke={LINE2} strokeWidth="1" />
      ))}
      {RENEWAL_BOOK.map(a => {
        const x = 14 + (a.renewalDays / BOOK_WINDOW) * 212
        return (
          <circle key={a.id} cx={x} cy="72" r={R(a)} fill={HEALTH[a.band]} fillOpacity="0.24" stroke={HEALTH[a.band]} strokeWidth="1.6" />
        )
      })}
      <path d={NORTHWIND_SEATS.map((v, i) => `${i ? 'L' : 'M'}${(16 + i * 18.5).toFixed(1)} ${(46 - (v - 180) * 0.55).toFixed(1)}`).join(' ')}
        fill="none" stroke={CORAL} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="16" y1="12.9" x2="219" y2="12.9" stroke={LINE2} strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  )
}

// Expansion Map — the product penetration matrix in miniature.
function ExpansionThumb() {
  const rows = ACCOUNTS.slice(0, 8)
  const fill = { owned: GREEN, pipeline: BLUE, white: '#efece4', none: '#f6f4ee' }
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      {rows.map((a, r) => PRODUCTS.map((p, c) => {
        const st = cellState(a, p.id)
        return (
          <rect key={`${a.id}-${p.id}`} x={62 + c * 60} y={10 + r * 13} width="54" height="10" rx="2.5"
            fill={fill[st]} opacity={st === 'owned' ? 0.62 : st === 'pipeline' ? 0.5 : 1}
            stroke={st === 'white' ? LINE2 : 'none'} strokeWidth="0.8" strokeDasharray={st === 'white' ? '2 2' : undefined} />
        )
      }))}
      {rows.map((a, r) => (
        <rect key={`l-${a.id}`} x="10" y={12 + r * 13} width={Math.max(12, (a.arr / 2100000) * 44)} height="6" rx="2" fill={INK} opacity="0.16" />
      ))}
    </svg>
  )
}

// Revenue Pulse — the ARR bridge as a waterfall.
function PulseThumbRv() {
  const steps = [
    ['start', BRIDGE.start, INK], ['new', BRIDGE.newLogo, GREEN], ['exp', BRIDGE.expansion, BLUE],
    ['con', -BRIDGE.contraction, GOLD], ['chn', -BRIDGE.churn, CORAL], ['end', BRIDGE.end, INK],
  ]
  const S = v => (v / 52) * 88
  let run = 0
  const bars = steps.map(([k, v, c], i) => {
    const base = i === 0 || i === steps.length - 1
    const h = Math.max(3, S(Math.abs(base ? v : v)))
    let y
    if (base) { y = 106 - S(v); run = v }
    else if (v >= 0) { y = 106 - S(run + v); run += v }
    else { y = 106 - S(run); run += v }
    return { k, x: 14 + i * 38, y, h, c }
  })
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <line x1="8" y1="106" x2="232" y2="106" stroke={LINE} strokeWidth="1" />
      {bars.slice(0, -1).map((b, i) => (
        <line key={`c${i}`} x1={b.x} y1={b.y} x2={bars[i + 1].x + 26} y2={b.y} stroke={LINE2} strokeWidth="0.9" strokeDasharray="3 3" />
      ))}
      {bars.map(b => <rect key={b.k} x={b.x} y={b.y} width="26" height={b.h} rx="3" fill={b.c} opacity="0.7" />)}
    </svg>
  )
}

// ─── APP 1 · PIPELINE COMMAND ────────────────────────────────────────────────

const PIPE_KPIS = [
  { label: 'Commit', value: usdM(Q.commit), delta: `${usdM(Q.gap)} short of quota`, good: false },
  { label: 'Best case', value: usdM(Q.best), sub: `${usdM(Q.bestOpen)} of upside on commit` },
  { label: 'Quota', value: usdM(Q.quota), sub: `${Q.elapsedPct}% of the quarter elapsed` },
  { label: 'Coverage', value: `${Q.coverage}x`, sub: `${usdM(Q.pipeline)} open pipeline` },
  { label: 'Avg cycle', value: `${Q.cycleDays} days`, delta: '▲ 4 days vs last quarter', good: false },
  { label: 'Win rate', value: pct(Q.winRate), sub: '62% × 66% × 59% stage conversion' },
]

const FORECAST_OPTION = {
  grid: { left: 8, right: 12, top: 6, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => usdM(v) },
  legend: { show: false },
  xAxis: valAxis({ max: 12.4, axisLabel: { ...AX_LABEL, formatter: v => `$${v}M` } }),
  yAxis: { ...catAxis(['Q3 26']), axisLabel: { show: false }, axisLine: { show: false } },
  series: [
    { name: 'Closed won', type: 'bar', stack: 'f', data: [Q.closed], barWidth: 34, itemStyle: { color: GREEN, opacity: 0.78, borderRadius: [4, 0, 0, 4] } },
    { name: 'Commit', type: 'bar', stack: 'f', data: [Q.commitOpen], itemStyle: { color: BLUE, opacity: 0.7 } },
    {
      name: 'Best case', type: 'bar', stack: 'f', data: [Q.bestOpen],
      itemStyle: { color: BLUE, opacity: 0.28, borderRadius: [0, 4, 4, 0] },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: CORAL, type: 'dashed', width: 1.4 },
        label: { formatter: `Quota ${usdM(Q.quota)}`, position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
        data: [{ xAxis: Q.quota }],
      },
    },
  ],
}

const FUNNEL_OPTION = {
  tooltip: { trigger: 'item', ...TT, formatter: p => `${p.name}<br/><b>${usdM(p.value)}</b> open` },
  series: [{
    type: 'funnel', left: 20, right: 20, top: 8, bottom: 8, minSize: '38%', gap: 3,
    sort: 'descending',
    data: FUNNEL_STAGES.map((f, i) => ({
      name: f.stage, value: f.usd,
      itemStyle: { color: BLUE, opacity: 0.62 - i * 0.12, borderColor: '#fff', borderWidth: 1.5 },
    })),
    label: {
      position: 'inside', fontFamily: ECH_FONT, fontSize: 11, fontWeight: 600, color: '#20355c',
      formatter: p => `${p.name}  ${usdM(p.value)}`,
    },
  }],
}

const MOVE_OPTION = (() => {
  let run = 0
  const base = []
  const up = []
  const down = []
  MOVEMENT.forEach(([, v, kind]) => {
    if (kind === 'base') { base.push(Math.abs(v)); up.push('-'); down.push('-'); run = Math.abs(v) }
    else if (v >= 0) { base.push(run); up.push(v); down.push('-'); run += v }
    else { run += v; base.push(run); up.push('-'); down.push(-v) }
  })
  return {
    grid: { left: 40, right: 12, top: 18, bottom: 26 },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT,
      formatter: ps => {
        const i = ps[0].dataIndex
        const [label, v] = MOVEMENT[i]
        return `${label}<br/><b>${v >= 0 ? '+' : '−'}${usdM(Math.abs(v))}</b>`
      },
    },
    xAxis: catAxis(MOVEMENT.map(m => m[0])),
    yAxis: valAxis({ max: 36, axisLabel: { ...AX_LABEL, formatter: v => `$${v}M` } }),
    series: [
      { type: 'bar', stack: 'w', data: base, itemStyle: { color: 'transparent' }, silent: true, barWidth: '52%' },
      { type: 'bar', stack: 'w', data: up, itemStyle: { color: GREEN, opacity: 0.66, borderRadius: [3, 3, 0, 0] } },
      { type: 'bar', stack: 'w', data: down, itemStyle: { color: CORAL, opacity: 0.66, borderRadius: [3, 3, 0, 0] } },
      {
        type: 'bar', stack: 'w', data: MOVEMENT.map(m => m[2] === 'base' ? Math.abs(m[1]) : '-'),
        itemStyle: { color: INK, opacity: 0.34, borderRadius: [3, 3, 0, 0] },
      },
    ],
  }
})()

function RepLeaderboard() {
  const rows = [...REPS].sort((a, b) => b.attain - a.attain)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Rep</th>
          <th style={{ ...thStyle, textAlign: 'right', paddingRight: 18 }}>Quota</th>
          <th style={{ ...thStyle, width: 150 }}>Attainment vs {Q.elapsedPct}% pace</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Coverage</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Slipping</th>
          <th style={{ ...thStyle, textAlign: 'right', width: 96 }}>Trend</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const bd = i < rows.length - 1 ? '1px solid #f4f2ee' : 'none'
          const color = r.attain >= Q.elapsedPct ? HEALTH.good : r.attain >= 60 ? HEALTH.warn : HEALTH.bad
          return (
            <tr key={r.name}>
              <td style={{ ...tdStyle, borderBottom: bd, color: INK, fontWeight: 500 }}>{r.name}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', paddingRight: 18, ...mono, fontSize: 11.5, color: '#4b463d' }}>{fmtUSD(r.quota)}</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color, width: 34, textAlign: 'right' }}>{r.attain}%</span>
                  <span style={{ flex: 1, minWidth: 60 }}><RBar pct={r.attain} color={color} target={Q.elapsedPct} h={7} /></span>
                </span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: r.coverage >= 2.7 ? '#4b463d' : HEALTH.warn }}>{r.coverage.toFixed(1)}x</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: r.slipping >= 4 ? HEALTH.bad : r.slipping >= 2 ? HEALTH.warn : MUTED }}>{r.slipping}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right' }}>
                <span style={{ display: 'inline-block' }}><Spark values={r.trend} w={88} h={22} color={color} /></span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function AtRiskDeals() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Opportunity</th>
          <th style={thStyle}>Account</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
          <th style={thStyle}>Stage</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Idle</th>
          <th style={thStyle}>Why</th>
        </tr>
      </thead>
      <tbody>
        {AT_RISK_OPPS.map((o, i) => {
          const bd = i < AT_RISK_OPPS.length - 1 ? '1px solid #f4f2ee' : 'none'
          const a = acctById(o.acct)
          return (
            <tr key={o.id} title={o.next}>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'block', color: INK, fontWeight: 500 }}>{o.name}</span>
                <span style={{ ...mono, fontSize: 10, color: '#8a7340' }}>{o.id}</span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#4b463d' }}>
                  <StatusDot health={a.band} />{a.name}
                </span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{fmtUSD(o.amount)}</td>
              <td style={{ ...tdStyle, borderBottom: bd, color: '#6b6455', fontSize: 12 }}>{o.stage}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: o.idle >= 28 ? HEALTH.bad : o.idle >= 14 ? HEALTH.warn : MUTED }}>{o.idle}d</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', gap: 5, flexWrap: 'wrap' }}>
                  {o.risks.map(k => <RChip key={k} label={RISKS[k]} tone={k === 'nonext' ? 'risk' : k === 'silent' ? 'warn' : 'sig'} />)}
                  {o.comp && <RChip label={o.comp} tone="info" />}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function PipelineCommand({ onBack }) {
  const span2 = { gridColumn: '1 / -1' }
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Pipeline Command"
        subtitle={`Q3 26 · ${REPS.length} reps · ${usdM(Q.pipeline)} open across ${openOpps.length} tracked opportunities`}
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {PIPE_KPIS.map(k => <RKpi key={k.label} {...k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <RCard title="Forecast against quota" right={<span style={{ ...mono, fontSize: 10.5, color: HEALTH.bad }}>{usdM(Q.gap)} gap on commit</span>}>
            <Chart option={FORECAST_OPTION} height={118} />
            <div style={{ display: 'flex', gap: 10 }}>
              {[['Closed won', usdM(Q.closed), GREEN], ['Commit', usdM(Q.commit), BLUE], ['Best case', usdM(Q.best), '#8fb0e8']].map(([label, val, color]) => (
                <div key={label} style={{ flex: 1, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 12px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 600, color, marginTop: 3 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: '#4b463d', lineHeight: 1.5, marginTop: 'auto' }}>
              Commit lands <b style={{ color: CORAL }}>{usdM(Q.gap)}</b> under quota with {100 - Q.elapsedPct}% of the quarter left. That gap is well inside
              the <b>{fmtUSD(AT_RISK_USD)}</b> sitting in the {AT_RISK_OPPS.length} deals below — none of which are forecast in commit today.
            </div>
          </RCard>

          <RCard title="Open pipeline by stage" right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{usdM(FUNNEL_TOTAL)}</span>}>
            <Chart option={FUNNEL_OPTION} height={168} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {FUNNEL_STAGES.map((f, i) => (
                <div key={f.stage} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: f.conv >= 62 ? GREEN : GOLD }}>{f.conv}%</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
                    {f.stage} → {i < FUNNEL_STAGES.length - 1 ? FUNNEL_STAGES[i + 1].stage : 'Won'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              62% × 66% × 59% compounds to the {Q.winRate}% win rate. Proposal → Negotiation is where the quarter is actually
              being lost — {AT_RISK_OPPS.filter(o => o.stage === 'Proposal').length} of the {AT_RISK_OPPS.length} at-risk deals are stuck there.
            </div>
          </RCard>

          <RCard title="Pipeline movement · quarter to date" style={span2}>
            <Chart option={MOVE_OPTION} height={212} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              {usdM(9.8)} opened and {usdM(0.8)} was upsized, but {usdM(2.4)} slipped out of the quarter and {usdM(1.9)} was lost —
              {' '}{OPPS.filter(o => o.stage === 'Closed Lost' && o.comp).length} of the losses went to {COMPETITOR}. Net, the book is up {usdM(0.7)} on where it opened.
            </div>
          </RCard>

          <RCard title="Rep leaderboard" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{fmtUSD(REP_QUOTA)} quota · {fmtUSD(REP_PIPELINE)} pipeline · {REP_SLIPPING} deals slipping</span>}>
            <RepLeaderboard />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              Nobody is at pace. Marcus Webb carries the thinnest coverage at {REPS.find(r => r.name === 'Marcus Webb').coverage}x and the most slipping deals —
              both of his at-risk opportunities are on accounts scoring below 60 health.
            </div>
          </RCard>

          <RCard title="Deals at risk" accent={CORAL} style={{ ...span2, borderLeft: `3px solid ${CORAL}` }}
            right={<span style={{ ...mono, fontSize: 10.5, color: CORAL }}>{fmtUSD(AT_RISK_USD)} exposed</span>}>
            <AtRiskDeals />
            <DerivedCallout title="What the graph flagged, and why" rows={[
              ['Pipeline Health', `${AT_RISK_OPPS.length} open deals score below 0.4 — every one has no logged next step, a single thread, or a silent champion`],
              ['Champion silent', `Northwind's Maya Chen has not replied in 34 days while a Sev-2 has been open 9 — the ${fmtUSD(openPipelineFor('northwind'))} it has open across ${oppsFor('northwind').filter(o => OPEN_STAGES.includes(o.stage)).length} deals is all exposed to it`],
              ['Competitive', `${COMPETITOR} is present on ${OPPS.filter(o => o.comp).length} opportunities and already took one deal off Meridian this year`],
            ]} note={`Recomputed nightly from ${SOURCES.slice(0, 5).join(', ')} and ${SOURCES.length - 5} more sources.`} />
          </RCard>
        </div>
      </div>
    </>
  )
}

// ─── APP 2 · ATTRIBUTION STUDIO ──────────────────────────────────────────────

const ATTRIB_KPIS = [
  { label: 'Sourced pipeline', value: fmtUSD(MKT.sourced), sub: `${CAMPAIGNS.length} campaigns` },
  { label: 'Influenced pipeline', value: fmtUSD(MKT.influenced), sub: `${Math.round((MKT.influenced / (Q.pipeline * 1e6)) * 100)}% of open pipeline` },
  { label: 'Spend', value: fmtUSD(MKT.spend), sub: 'quarter to date' },
  { label: 'Cost per sourced $', value: `$${(MKT.spend / MKT.sourced).toFixed(2)}`, sub: `${(MKT.sourced / MKT.spend).toFixed(1)}x return` },
  { label: 'MQL → SQL', value: pct(MKT.mqlToSql), delta: '▲ 3 pts vs last quarter', good: true },
  { label: 'Blended CAC', value: `$${CAC}K`, sub: `${fmtUSD(MKT.newBizSpend)} / ${MKT.newLogos} new logos` },
]

const MODEL_OPTION = {
  grid: { left: 156, right: 42, top: 26, bottom: 24 },
  tooltip: {
    trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT,
    valueFormatter: v => fmtUSD(v),
  },
  legend: { top: 0, right: 8, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  xAxis: valAxis({ axisLabel: { ...AX_LABEL, formatter: v => `$${(v / 1e6).toFixed(0)}M` } }),
  yAxis: {
    ...catAxis([...CAMPAIGNS].sort((a, b) => a.lastTouch - b.lastTouch).map(c => c.name)),
    axisLine: { show: false }, axisLabel: { ...AX_LABEL, fontSize: 9.5, width: 148, overflow: 'truncate' },
  },
  series: [
    {
      name: 'Last touch', type: 'bar', barWidth: 7, barGap: '10%',
      data: [...CAMPAIGNS].sort((a, b) => a.lastTouch - b.lastTouch).map(c => c.lastTouch),
      itemStyle: { color: GOLD, opacity: 0.78, borderRadius: [0, 3, 3, 0] },
    },
    {
      name: 'Multi-touch (W)', type: 'bar', barWidth: 7,
      data: [...CAMPAIGNS].sort((a, b) => a.lastTouch - b.lastTouch).map(c => c.multiTouch),
      itemStyle: { color: PURPLE, opacity: 0.7, borderRadius: [0, 3, 3, 0] },
    },
  ],
}

const CHANNEL_OPTION = {
  grid: { left: 44, right: 44, top: 28, bottom: 44 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => fmtUSD(v) },
  legend: { top: 0, left: 40, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  xAxis: { ...catAxis(CHANNELS.map(c => c.channel)), axisLabel: { ...AX_LABEL, fontSize: 9, rotate: 26 } },
  yAxis: valAxis({ axisLabel: { ...AX_LABEL, formatter: v => `$${(v / 1000).toFixed(0)}K` } }),
  series: [
    { name: 'Spend', type: 'bar', data: CHANNELS.map(c => c.spend), barWidth: '26%', itemStyle: { color: CORAL, opacity: 0.62, borderRadius: [3, 3, 0, 0] } },
    {
      name: 'Sourced pipeline', type: 'bar', data: CHANNELS.map(c => c.sourced), barWidth: '26%',
      itemStyle: {
        borderRadius: [3, 3, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: BLUE }, { offset: 1, color: '#8fb0e8' },
        ]),
        opacity: 0.85,
      },
    },
  ],
}

function JourneyPath() {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
      {JOURNEY.map(([step, detail, touches], i) => {
        const last = i === JOURNEY.length - 1
        const color = last ? GREEN : i === 0 ? BLUE : PURPLE
        return (
          <div key={step} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch' }}>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{ position: 'relative', height: 18, marginBottom: 8 }}>
                <span style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 2, background: LINE2 }} />
                <span style={{
                  position: 'absolute', left: '50%', top: 2, transform: 'translateX(-50%)',
                  width: 15, height: 15, borderRadius: '50%', background: '#fff',
                  border: `2.4px solid ${color}`, boxSizing: 'border-box',
                }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step}</div>
              <div style={{ ...mono, fontSize: 10.5, color, marginTop: 2 }}>{touches.toFixed(1)} touches</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 3, lineHeight: 1.35 }}>{detail}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CampaignTable() {
  const rows = [...CAMPAIGNS].sort((a, b) => b.sourced - a.sourced)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...thStyle, width: 22 }} />
          <th style={thStyle}>Campaign</th>
          <th style={thStyle}>Channel</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Spend</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Sourced</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Influenced (W)</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>ROI</th>
          <th style={{ ...thStyle, width: 108 }}>Touch mix</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => {
          const bd = i < rows.length - 1 ? '1px solid #f4f2ee' : 'none'
          return (
            <tr key={c.id}>
              <td style={{ ...tdStyle, borderBottom: bd }}><StatusDot health={c.health} /></td>
              <td style={{ ...tdStyle, borderBottom: bd, color: INK, fontWeight: 500 }}>{c.name}</td>
              <td style={{ ...tdStyle, borderBottom: bd, color: '#6b6455', fontSize: 12 }}>{c.channel}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d' }}>{fmtUSD(c.spend)}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{fmtUSD(c.sourced)}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d' }}>{fmtUSD(c.multiTouch)}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: HEALTH[c.health] }}>{c.roi.toFixed(1)}x</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', background: '#f1efe9', width: 100 }}>
                  <span style={{ width: `${(c.first / c.touches) * 100}%`, background: BLUE, opacity: 0.7 }} />
                  <span style={{ width: `${(c.mid / c.touches) * 100}%`, background: PURPLE, opacity: 0.6 }} />
                  <span style={{ width: `${(c.last / c.touches) * 100}%`, background: GOLD, opacity: 0.75 }} />
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function AttributionStudio({ onBack }) {
  const span2 = { gridColumn: '1 / -1' }
  const flattered = FLATTERED
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Attribution Studio"
        subtitle={`${CAMPAIGNS.length} campaigns · ${CHANNELS.length} channels · ${fmtUSD(MKT_SPEND_CHECK)} spend sourcing ${fmtUSD(MKT_SOURCED_CHECK)}`}
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {ATTRIB_KPIS.map(k => <RKpi key={k.label} {...k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <RCard title="Last touch vs multi-touch · same $15.3M, redistributed" accent={PURPLE} style={span2}>
            <Chart option={MODEL_OPTION} height={268} />
            <div style={{ background: '#fbf5e8', border: '1px solid #efe2c6', borderLeft: `3px solid ${GOLD}`, borderRadius: 9, padding: '10px 13px' }}>
              <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: '#8a7340', marginBottom: 5 }}>
                Credit that does not survive the model change
              </div>
              <div style={{ fontSize: 12, color: '#4b463d', lineHeight: 1.6 }}>
                <b>{flattered.name}</b> takes <b style={{ color: GOLD }}>{fmtUSD(flattered.lastTouch)}</b> under last touch —
                {' '}{Math.round((flattered.lastTouch / MKT.influenced) * 100)}% of all influenced pipeline — on {fmtUSD(flattered.spend)} of spend.
                Under W-shaped attribution it earns <b style={{ color: PURPLE }}>{fmtUSD(flattered.multiTouch)}</b>, a swing of {fmtUSD(Math.abs(flattered.shift))}.
                It is credited on {flattered.last} last touches against only {flattered.first} first touches: it is closing deals that were already in flight,
                not creating them.
              </div>
            </div>
          </RCard>

          <RCard title="Channel mix · spend against sourced pipeline">
            <Chart option={CHANNEL_OPTION} height={224} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ ...sect, marginBottom: 2 }}>Cost per pipeline dollar</div>
              {CHANNELS.map(c => (
                <div key={c.channel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 11.5, color: '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.channel}</span>
                  <span style={{ width: 92 }}><RBar pct={c.cpp} max={0.45} h={6} color={c.cpp <= 0.15 ? GREEN : c.cpp <= 0.3 ? GOLD : CORAL} /></span>
                  <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: c.cpp <= 0.15 ? GREEN : c.cpp <= 0.3 ? GOLD : CORAL, width: 38, textAlign: 'right' }}>${c.cpp.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Referral and Website source pipeline at a fraction of paid cost. Multi-channel launch spend is the worst
              line in the plan at ${CHANNELS.find(c => c.channel === 'Multi-channel').cpp.toFixed(2)} per sourced dollar.
            </div>
          </RCard>

          <RCard title="Intent signals · 6sense" accent={PURPLE}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {INTENT.map(s => {
                const a = acctById(s.acct)
                return (
                  <div key={s.acct} style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: '11px 13px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <StatusDot health={a.band} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: INK }}>{a.name}</span>
                      <RChip label={s.trend} tone={s.trend === 'surging' ? 'risk' : 'warn'} />
                    </div>
                    <div style={{ fontSize: 12, color: '#4b463d', marginBottom: 7 }}>“{s.topic}”</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ flex: 1 }}><RBar pct={s.score} color={PURPLE} h={8} /></span>
                      <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: PURPLE, width: 26, textAlign: 'right' }}>{s.score}</span>
                      <span style={{ ...mono, fontSize: 10, color: MUTED, width: 84, textAlign: 'right' }}>{s.delta}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Northwind's API gateway research is the highest-intensity signal in the book — and there is already a
              {' '}{fmtUSD(oppsFor('northwind').find(o => o.product === 'api').amount)} API Gateway opportunity open against it.
            </div>
          </RCard>

          <RCard title="The winning journey · average touches per won deal" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{JOURNEY_TOUCHES} touches · {Q.cycleDays} days</span>}>
            <JourneyPath />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              {JOURNEY_TOUCHES} touches over a {Q.cycleDays}-day cycle. Only {JOURNEY[0][2].toFixed(1)} of them is a first touch — which is exactly why a
              last-touch model rewards the channels that sit closest to the signature.
            </div>
          </RCard>

          <RCard title="Campaign performance" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>first · mid · last touch mix</span>}>
            <CampaignTable />
            <DerivedCallout title="What the graph is telling marketing" rows={[
              ['Attribution', `Campaign-level influenced figures overlap — the de-duplicated total across all ${CAMPAIGNS.length} campaigns is ${fmtUSD(MKT.influenced)}, not their sum`],
              ['Sourced pipeline', `${fmtUSD(MKT.sourced)} on ${fmtUSD(MKT.spend)} of spend — $${(MKT.spend / MKT.sourced).toFixed(2)} per pipeline dollar`],
              ['Intent', `${INTENT.length} accounts surging on 6sense, ${INTENT.filter(s => acctById(s.acct).atRisk).length} of which is also on the retention watchlist`],
            ]} note="Touch-level records resolve to the same Account and Opportunity nodes the sales apps read, which is why influenced pipeline reconciles to open pipeline." />
          </RCard>
        </div>
      </div>
    </>
  )
}

// ─── APP 3 · RETENTION COCKPIT ───────────────────────────────────────────────

const RET_KPIS = [
  { label: 'Renewal book · 2 qtrs', value: usdM(RET.book), sub: `${fmtUSD(RENEWAL_BOOK_USD)} on ${RENEWAL_BOOK.length} named accounts` },
  { label: 'At risk in book', value: fmtUSD(AT_RISK_BOOK_USD), delta: `${Math.round((AT_RISK_BOOK_USD / RENEWAL_BOOK_USD) * 100)}% of the named book`, good: false },
  { label: 'NRR', value: pct(RET.nrr), delta: '▲ 2 pts vs last quarter', good: true },
  { label: 'GRR', value: pct(RET.grr), delta: '▼ 1 pt vs last quarter', good: false },
  { label: 'Avg health', value: String(AVG_HEALTH), sub: `${LOGOS} logos scored nightly` },
  { label: 'Accounts at risk', value: String(AT_RISK_ACCTS.length), sub: 'health below 75' },
]

const HEALTH_HIST_OPTION = {
  grid: { left: 38, right: 14, top: 26, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => `${v} accounts` },
  xAxis: catAxis(HEALTH_DIST.map(d => d[0])),
  yAxis: valAxis({ axisLabel: { ...AX_LABEL } }),
  series: [{
    type: 'bar', barWidth: '62%',
    data: HEALTH_DIST.map((d, i) => ({
      value: d[1],
      itemStyle: { color: HEALTH_MIDS[i] < 75 ? CORAL : HEALTH_MIDS[i] < 85 ? GOLD : GREEN, opacity: HEALTH_MIDS[i] < 75 ? 0.62 : 0.5, borderRadius: [3, 3, 0, 0] },
    })),
    markLine: {
      silent: true, symbol: 'none',
      lineStyle: { color: CORAL, type: 'dashed', width: 1.2 },
      label: { formatter: 'At-risk band', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
      data: [{ xAxis: 3.5 }],
    },
  }],
}

function seatOption(a) {
  const series = seatSeries(a)
  return {
    grid: { left: 38, right: 14, top: 26, bottom: 26 },
    tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} seats` },
    legend: { top: 0, left: 32, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
    xAxis: { ...catAxis(series.map((_, i) => `W${i + 1}`)), boundaryGap: false },
    yAxis: valAxis({ min: Math.floor(Math.min(...series) * 0.9 / 10) * 10, max: Math.ceil(a.seats * 1.04 / 10) * 10 }),
    series: [
      {
        name: 'Licensed', type: 'line', data: series.map(() => a.seats), showSymbol: false,
        lineStyle: { color: LINE2, width: 1.4, type: 'dashed' }, itemStyle: { color: LINE2 },
      },
      {
        name: 'Active', type: 'line', smooth: true, data: series, showSymbol: false,
        lineStyle: { color: HEALTH[a.band], width: 2.2 }, itemStyle: { color: HEALTH[a.band] },
        areaStyle: { color: HEALTH[a.band], opacity: 0.08 },
      },
    ],
  }
}

// Six-month renewal rail — one bubble per renewal, area ∝ ARR, color = risk.
function RenewalTimeline({ selected, onSelect }) {
  const W = 1000, H = 132
  const R = a => 7 + Math.sqrt(a.arr / 1e6) * 15
  const X = d => 42 + (d / BOOK_WINDOW) * (W - 84)
  const marks = [0, 1, 2, 3, 4, 5, 6]
  const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <line x1="42" y1="86" x2={W - 42} y2="86" stroke={LINE2} strokeWidth="1.6" />
      {marks.map(i => {
        const x = 42 + (i / 6) * (W - 84)
        return (
          <g key={i}>
            <line x1={x} y1="80" x2={x} y2="92" stroke={LINE2} strokeWidth="1.2" />
            <text x={x} y="110" textAnchor="middle" style={{ ...mono, fontSize: 11, fill: MUTED }}>{MONTHS[i]}</text>
          </g>
        )
      })}
      {RENEWAL_BOOK.map((a, i) => {
        const x = X(a.renewalDays)
        const r = R(a)
        const sel = selected === a.id
        const up = i % 2 === 0
        const ly = up ? 86 - r - 10 : 86 + r + 18
        return (
          <g key={a.id} onClick={() => onSelect(a.id)} style={{ cursor: 'pointer' }}>
            <circle cx={x} cy="86" r={r} fill={HEALTH[a.band]} fillOpacity={sel ? 0.42 : 0.22}
              stroke={HEALTH[a.band]} strokeWidth={sel ? 3 : 1.8} />
            <text x={x} y={ly} textAnchor="middle" style={{ ...serif, fontSize: 12, fontWeight: sel ? 600 : 500, fill: sel ? INK : '#4b463d' }}>
              {a.name.split(' ')[0]}
            </text>
            <text x={x} y={ly + (up ? -13 : 13)} textAnchor="middle" style={{ ...mono, fontSize: 10, fill: MUTED }}>
              {fmtUSD(a.arr)} · {a.renewalDays}d
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function AtRiskAccounts({ selected, onSelect }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Account</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>ARR</th>
          <th style={{ ...thStyle, width: 130 }}>Health</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Renewal</th>
          <th style={thStyle}>Top churn driver</th>
          <th style={thStyle}>Owner</th>
          <th style={thStyle}>Action</th>
        </tr>
      </thead>
      <tbody>
        {AT_RISK_ACCTS.map((a, i) => {
          const bd = i < AT_RISK_ACCTS.length - 1 ? '1px solid #f4f2ee' : 'none'
          const sel = selected === a.id
          const drop = a.health - a.prevHealth
          const inBook = a.renewalDays <= BOOK_WINDOW
          return (
            <tr key={a.id} onClick={() => onSelect(a.id)}
              style={{ cursor: 'pointer', background: sel ? '#f7f6f3' : 'transparent', boxShadow: sel ? 'inset 3px 0 0 #16341f' : 'none' }}>
              <td style={{ ...tdStyle, borderBottom: bd, paddingLeft: sel ? 8 : 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: INK, fontWeight: 500 }}>
                  <StatusDot health={a.band} />{a.name}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, color: MUTED, marginLeft: 15 }}>{a.segment} · {a.industry}</span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{fmtUSD(a.arr)}</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: HEALTH[a.band], width: 20 }}>{a.health}</span>
                  <span style={{ flex: 1, minWidth: 44 }}><RBar pct={a.health} color={HEALTH[a.band]} target={75} h={7} /></span>
                  <span style={{ ...mono, fontSize: 10, color: drop < 0 ? CORAL : GREEN, width: 26, textAlign: 'right' }}>{drop < 0 ? '▼' : '▲'}{Math.abs(drop)}</span>
                </span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: a.renewalDays <= 60 ? HEALTH.bad : a.renewalDays <= 120 ? HEALTH.warn : MUTED }}>
                {a.renewalDays}d
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, color: '#4b463d', fontSize: 12, whiteSpace: 'normal' }}>{a.driver}</td>
              <td style={{ ...tdStyle, borderBottom: bd, color: '#6b6455', fontSize: 12 }}>{a.csm}</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <RChip label={inBook ? 'Save play now' : 'Monitor'} tone={inBook ? 'risk' : 'warn'} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function RetentionCockpit({ onBack }) {
  const [selected, setSelected] = useState('northwind')
  const a = acctById(selected)
  const span2 = { gridColumn: '1 / -1' }
  const seatOpt = useMemo(() => seatOption(a), [a])
  const dropPct = Math.round((1 - a.activeSeats / a.seats) * 100)
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Retention Cockpit"
        subtitle={`${usdM(RET.book)} renewing in two quarters · NRR ${RET.nrr}% · GRR ${RET.grr}% · ${LOGOS} logos scored`}
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {RET_KPIS.map(k => <RKpi key={k.label} {...k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <RCard title="Renewal calendar · next six months" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>bubble area = ARR · color = risk · click to select</span>}>
            <RenewalTimeline selected={selected} onSelect={setSelected} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              {RENEWAL_BOOK.length} named renewals worth {fmtUSD(RENEWAL_BOOK_USD)}, of which {fmtUSD(AT_RISK_BOOK_USD)} sits on accounts already below 75 health.
              Northwind is {acctById('northwind').renewalDays} days out and amber — far enough to fix, close enough that the fix has to start now.
            </div>
          </RCard>

          <RCard title="Health distribution · whole book">
            <Chart option={HEALTH_HIST_OPTION} height={216} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Average health {AVG_HEALTH} across {LOGOS} logos. {HEALTH_DIST.slice(0, 4).reduce((s, d) => s + d[1], 0)} accounts sit inside the shaded
              at-risk band below 70 — the {AT_RISK_ACCTS.length} named below are the ones with ARR big enough to move the quarter.
            </div>
          </RCard>

          <RCard title={`Seat utilisation · ${a.name}`} accent={HEALTH[a.band]}
            right={<span style={{ ...mono, fontSize: 10.5, color: HEALTH[a.band] }}>{a.activeSeats} / {a.seats} active</span>}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}><Chart option={seatOpt} height={216} /></div>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <HealthRing score={a.health} prev={a.prevHealth} />
                <div style={{ ...mono, fontSize: 9.5, color: MUTED, marginTop: 4 }}>health</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                ['Licensed', String(a.seats), INK],
                ['Active', String(a.activeSeats), HEALTH[a.band]],
                ['Dormant', `${dropPct}%`, dropPct >= 20 ? CORAL : MUTED],
              ].map(([label, val, color]) => (
                <div key={label} style={{ flex: 1, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 12px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 600, color, marginTop: 3 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              {a.id === 'northwind'
                ? `Twelve straight weeks of decline: ${NORTHWIND_SEATS[0]} active seats down to ${a.activeSeats} against ${a.seats} licensed. The renewal quote assumes ${a.seats}.`
                : `${a.name} is ${a.usage} on seat consumption with ${a.renewalDays} days to renewal.`}
            </div>
          </RCard>

          <RCard title="Accounts at risk" accent={CORAL} style={{ ...span2, borderLeft: `3px solid ${CORAL}` }}
            right={<span style={{ ...mono, fontSize: 10.5, color: CORAL }}>{fmtUSD(AT_RISK_ACCTS.reduce((s, x) => s + x.arr, 0))} of ARR below 75 health</span>}>
            <AtRiskAccounts selected={selected} onSelect={setSelected} />
          </RCard>

          <RCard title="What actually predicts churn" accent={PURPLE} style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>lift over base churn rate · trailing 8 quarters</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0 26px' }}>
              {CHURN_DRIVERS.map(([label, lift, strong, note]) => (
                <div key={label} style={{ padding: '7px 0', borderBottom: '1px solid #f4f2ee' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 12.5, color: strong ? INK : MUTED, fontWeight: strong ? 500 : 400 }}>{label}</span>
                    <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: strong ? PURPLE : '#c4beb2' }}>{lift.toFixed(2)}</span>
                  </div>
                  <RBar pct={lift} max={1} h={7} color={strong ? PURPLE : '#d8d2c4'} />
                  <div style={{ fontSize: 10.5, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>{note}</div>
                </div>
              ))}
            </div>
            <DerivedCallout title="Churn Risk · how the signal is built" rows={[
              ['Weighted', 'Seat utilisation trend, champion recency, Sev-2 aging and onboarding completion carry 91% of the model weight'],
              ['Discarded', 'NPS, ticket volume and login counts are reported but scored near zero — they describe the account, they do not predict it'],
              ['Northwind', `Health ${acctById('northwind').health} from ${acctById('northwind').prevHealth}: seats −${Math.round((1 - 186 / 240) * 100)}%, champion silent 34 days, TCK-8841 open 9 days`],
            ]} note="Fed by Gainsight, Zendesk, Pendo, Zuora and Salesforce; every driver resolves to the same Account node the sales and marketing apps read." />
          </RCard>
        </div>
      </div>
    </>
  )
}

// ─── APP 4 · EXPANSION MAP ───────────────────────────────────────────────────

const EXP_KPIS = [
  { label: 'Total whitespace', value: usdM(WHITESPACE_TOTAL / 1e6), sub: `${ACCOUNTS.length} accounts × ${PRODUCTS.length} products` },
  { label: 'Ready-now accounts', value: String(READY_NOW), sub: 'readiness score ≥ 60' },
  { label: 'Avg products / account', value: AVG_PRODUCTS.toFixed(1), sub: `${OWNED_TOTAL} of ${ACCOUNTS.length * PRODUCTS.length} cells owned` },
  { label: 'Expansion ARR · YTD', value: fmtUSD(EXPANSION_YTD), delta: '▲ 31% vs last year', good: true },
]

const CELL_STYLE = {
  owned: { bg: '#eaf5ef', border: '#cde7d6', color: GREEN, label: 'Owned' },
  pipeline: { bg: '#eef3fc', border: '#d6e2f6', color: BLUE, label: 'In pipeline' },
  white: { bg: '#fffdf8', border: '#efe2c6', color: '#8a7340', label: 'Whitespace' },
  none: { bg: '#faf9f6', border: LINE, color: '#c4beb2', label: '—' },
}

const HEADROOM_OPTION = {
  grid: { left: 116, right: 46, top: 12, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => `${v}% of plan` },
  xAxis: valAxis({ max: 100, axisLabel: { ...AX_LABEL, formatter: '{value}%' } }),
  yAxis: {
    ...catAxis([...HEADROOM].sort((a, b) => a[1] - b[1]).map(h => acctById(h[0]).name)),
    axisLine: { show: false }, axisLabel: { ...AX_LABEL, fontSize: 9.5 },
  },
  series: [{
    type: 'bar', barWidth: 13,
    data: [...HEADROOM].sort((a, b) => a[1] - b[1]).map(h => ({
      value: h[1],
      itemStyle: { color: h[1] >= 85 ? CORAL : h[1] >= 75 ? GOLD : BLUE, opacity: 0.7, borderRadius: [0, 4, 4, 0] },
    })),
    label: { show: true, position: 'right', formatter: p => `${p.value}%`, fontFamily: ECH_FONT, fontSize: 10.5, fontWeight: 600, color: MUTED },
    markLine: {
      silent: true, symbol: 'none',
      lineStyle: { color: CORAL, type: 'dashed', width: 1.2 },
      label: { formatter: 'Upsell line 85%', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
      data: [{ xAxis: 85 }],
    },
  }],
}

function PenetrationMatrix({ selected, onSelect }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', minWidth: 480 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, borderBottom: 'none' }}>Account</th>
            <th style={{ ...thStyle, borderBottom: 'none', textAlign: 'right' }}>ARR</th>
            {PRODUCTS.map(p => (
              <th key={p.id} style={{ ...thStyle, borderBottom: 'none', textAlign: 'center', width: 118 }}>{p.name}</th>
            ))}
            <th style={{ ...thStyle, borderBottom: 'none', textAlign: 'right' }}>Whitespace</th>
          </tr>
        </thead>
        <tbody>
          {[...ACCOUNTS].sort((a, b) => b.arr - a.arr).map(a => {
            const ws = Object.values(WHITESPACE[a.id] || {}).reduce((s, v) => s + v, 0)
            const sel = selected === a.id
            return (
              <tr key={a.id} onClick={() => onSelect(a.id)} style={{ cursor: 'pointer' }}>
                <td style={{ ...tdStyle, padding: '5px 8px 5px 0', background: sel ? '#f7f6f3' : 'transparent', boxShadow: sel ? 'inset 3px 0 0 #16341f' : 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: INK, fontWeight: sel ? 600 : 500, paddingLeft: sel ? 8 : 0 }}>
                    <StatusDot health={a.band} />{a.name}
                  </span>
                </td>
                <td style={{ ...tdStyle, padding: '5px 10px 5px 0', textAlign: 'right', ...mono, fontSize: 11, color: MUTED, background: sel ? '#f7f6f3' : 'transparent' }}>{fmtUSD(a.arr)}</td>
                {PRODUCTS.map(p => {
                  const st = cellState(a, p.id)
                  const s = CELL_STYLE[st]
                  const val = (WHITESPACE[a.id] || {})[p.id]
                  return (
                    <td key={p.id} style={{ padding: '3px 4px' }}>
                      <div style={{
                        background: s.bg, border: `1px solid ${s.border}`, borderRadius: 7,
                        padding: '6px 8px', textAlign: 'center',
                        borderStyle: st === 'white' ? 'dashed' : 'solid',
                      }}>
                        <div style={{ ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: s.color }}>{s.label}</div>
                        {val != null && <div style={{ ...mono, fontSize: 11, color: s.color, marginTop: 2 }}>{fmtUSD(val)}</div>}
                      </div>
                    </td>
                  )
                })}
                <td style={{ ...tdStyle, padding: '5px 0 5px 10px', textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: ws ? INK : '#c4beb2', background: sel ? '#f7f6f3' : 'transparent' }}>
                  {ws ? fmtUSD(ws) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReadinessTable({ selected, onSelect }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Account</th>
          <th style={thStyle}>Owns today</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Whitespace</th>
          <th style={{ ...thStyle, width: 128 }}>Readiness</th>
          <th style={thStyle}>Evidence</th>
        </tr>
      </thead>
      <tbody>
        {READINESS.map((r, i) => {
          const a = acctById(r.acct)
          const bd = i < READINESS.length - 1 ? '1px solid #f4f2ee' : 'none'
          const sel = selected === r.acct
          const color = r.score >= 75 ? GREEN : r.score >= 60 ? GOLD : CORAL
          return (
            <tr key={r.acct} onClick={() => onSelect(r.acct)}
              style={{ cursor: 'pointer', background: sel ? '#f7f6f3' : 'transparent', boxShadow: sel ? 'inset 3px 0 0 #16341f' : 'none' }}>
              <td style={{ ...tdStyle, borderBottom: bd, paddingLeft: sel ? 8 : 0, color: INK, fontWeight: 500 }}>{a.name}</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', gap: 5 }}>
                  {a.products.map(p => <RChip key={p} label={PRODUCTS.find(x => x.id === p).short} tone="good" />)}
                </span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{fmtUSD(r.whitespace)}</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color, width: 20 }}>{r.score}</span>
                  <span style={{ flex: 1, minWidth: 50 }}><RBar pct={r.score} color={color} target={60} h={7} /></span>
                </span>
              </td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', gap: 5, flexWrap: 'wrap' }}>
                  {r.evidence.length
                    ? r.evidence.map(e => <RChip key={e} label={EVIDENCE[e]} tone="sig" />)
                    : <span style={{ fontSize: 11.5, color: MUTED }}>No expansion signal — retention play first</span>}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ExpansionMap({ onBack }) {
  const [selected, setSelected] = useState('apex')
  const a = acctById(selected)
  const span2 = { gridColumn: '1 / -1' }
  const ws = Object.values(WHITESPACE[selected] || {}).reduce((s, v) => s + v, 0)
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Expansion Map"
        subtitle={`${usdM(WHITESPACE_TOTAL / 1e6)} of whitespace across ${ACCOUNTS.length} accounts · ${READY_NOW} ready now`}
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {EXP_KPIS.map(k => <RKpi key={k.label} {...k} />)}
          {PRODUCTS.map(p => (
            <RKpi key={p.id} label={`${p.name} penetration`}
              value={pct(Math.round((productPenetration(p.id) / ACCOUNTS.length) * 100))}
              sub={`${productPenetration(p.id)} of ${ACCOUNTS.length} accounts`} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <RCard title="Product penetration matrix" style={span2}
            right={
              <span style={{ display: 'inline-flex', gap: 8 }}>
                {['owned', 'pipeline', 'white'].map(k => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: MUTED }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: CELL_STYLE[k].bg, border: `1px solid ${CELL_STYLE[k].border}` }} />
                    {CELL_STYLE[k].label}
                  </span>
                ))}
              </span>
            }>
            <PenetrationMatrix selected={selected} onSelect={setSelected} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              {OWNED_TOTAL} of {ACCOUNTS.length * PRODUCTS.length} cells are filled — {AVG_PRODUCTS} products per account. Every whitespace cell carrying an open
              opportunity shows the opportunity's own amount, which is why the matrix and Pipeline Command never disagree:
              Northwind's two open cells are exactly its {fmtUSD(120000)} Analytics and {fmtUSD(50000)} API Gateway deals.
            </div>
          </RCard>

          <RCard title="Usage headroom · consumption against plan" accent={CORAL}>
            <Chart option={HEADROOM_OPTION} height={244} />
            <div style={{ fontSize: 11.5, color: '#4b463d', lineHeight: 1.5, marginTop: 'auto' }}>
              {HEADROOM.filter(h => h[1] >= 85).length} accounts are past 85% of contracted volume — the point where the next
              conversation is a plan uplift, not a discount. Northwind is the exception at {HEADROOM.find(h => h[0] === 'northwind')[1]}%:
              its expansion case is intent, not consumption.
            </div>
          </RCard>

          <RCard title={`Expansion signal feed`} accent={PURPLE}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>last 10 days</span>}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {EXP_SIGNALS.map(([date, acct, type, detail, src], i) => {
                const ac = acctById(acct)
                return (
                  <div key={date + acct} onClick={() => setSelected(acct)} style={{
                    display: 'flex', gap: 11, padding: '9px 0', cursor: 'pointer',
                    borderBottom: i < EXP_SIGNALS.length - 1 ? '1px solid #f4f2ee' : 'none',
                  }}>
                    <span style={{ ...mono, fontSize: 10.5, color: MUTED, width: 42, flexShrink: 0, paddingTop: 1 }}>{date}</span>
                    <span style={{ width: 2, background: PURPLE, opacity: 0.35, borderRadius: 1, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: INK }}>{ac.name}</span>
                        <RChip label={type} tone="sig" />
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: '#6b6455', lineHeight: 1.45 }}>{detail}</span>
                    </span>
                    <span style={{ ...mono, fontSize: 10, color: '#c4beb2', flexShrink: 0, paddingTop: 2 }}>{src}</span>
                  </div>
                )
              })}
            </div>
          </RCard>

          <RCard title="Readiness ranking" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{READY_NOW} of {READINESS.length} scored ready · {a.name} selected · {fmtUSD(ws)} whitespace</span>}>
            <ReadinessTable selected={selected} onSelect={setSelected} />
            <DerivedCallout title="Expansion signal · what it is built from" rows={[
              ['Usage headroom', `${HEADROOM.filter(h => h[1] >= 85).length} accounts above 85% of plan — Pendo events and Zuora entitlements, not survey intent`],
              ['Intent', `${INTENT.length} accounts surging on 6sense, ${INTENT.filter(s => !acctById(s.acct).products.includes('api')).length} of them on topics they do not own a product for`],
              ['Whitespace', `${usdM(WHITESPACE_TOTAL / 1e6)} unaddressed, ${fmtUSD(READINESS.filter(r => r.score >= 60).reduce((s, r) => s + r.whitespace, 0))} of it on accounts already scoring ready`],
              ['Held back', `Summit and Vertex score below 40 — both are in the retention book, and the graph will not surface an upsell into a churn risk`],
            ]} />
          </RCard>
        </div>
      </div>
    </>
  )
}

// ─── APP 5 · REVENUE PULSE ───────────────────────────────────────────────────

const PULSE_KPIS = [
  { label: 'ARR', value: usdM(BRIDGE.end), delta: `▲ ${BRIDGE.yoy}% YoY`, good: true },
  { label: 'Net new ARR', value: usdM(BRIDGE.netNew), sub: 'trailing twelve months' },
  { label: 'NRR', value: pct(BRIDGE.nrr), delta: '▲ 2 pts YoY', good: true },
  { label: 'GRR', value: pct(BRIDGE.grr), delta: '▼ 1 pt YoY', good: false },
  { label: 'CAC payback', value: `${CAC_PAYBACK} mo`, sub: `new-logo basis · ${Math.round(GROSS_MARGIN * 100)}% GM` },
  { label: 'Magic number', value: MAGIC[MAGIC.length - 1].toFixed(1), sub: `${usdM(SM_TTM)} S&M trailing` },
]

const BRIDGE_OPTION = (() => {
  const steps = [
    ['Starting ARR', BRIDGE.start, 'base'],
    ['New logo', BRIDGE.newLogo, 'up'],
    ['Expansion', BRIDGE.expansion, 'up'],
    ['Contraction', -BRIDGE.contraction, 'down'],
    ['Churn', -BRIDGE.churn, 'down'],
    ['Ending ARR', BRIDGE.end, 'base'],
  ]
  let run = 0
  const pad = []
  const up = []
  const down = []
  const base = []
  steps.forEach(([, v, kind]) => {
    if (kind === 'base') { pad.push(0); up.push('-'); down.push('-'); base.push(v); run = v }
    else if (v >= 0) { pad.push(run); up.push(v); down.push('-'); base.push('-'); run = Math.round((run + v) * 10) / 10 }
    else { run = Math.round((run + v) * 10) / 10; pad.push(run); up.push('-'); down.push(-v); base.push('-') }
  })
  return {
    grid: { left: 42, right: 14, top: 22, bottom: 30 },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT,
      formatter: ps => {
        const i = ps[0].dataIndex
        const [label, v] = steps[i]
        return `${label}<br/><b>${v >= 0 ? '' : '−'}${usdM(Math.abs(v))}</b>`
      },
    },
    xAxis: { ...catAxis(steps.map(s => s[0])), axisLabel: { ...AX_LABEL, fontSize: 9.5, interval: 0 } },
    yAxis: valAxis({ min: 30, max: 56, axisLabel: { ...AX_LABEL, formatter: v => `$${v}M` } }),
    series: [
      { type: 'bar', stack: 'b', data: pad, itemStyle: { color: 'transparent' }, silent: true, barWidth: '48%' },
      { type: 'bar', stack: 'b', data: base, itemStyle: { color: INK, opacity: 0.4, borderRadius: [3, 3, 0, 0] }, label: { show: true, position: 'top', formatter: p => p.value === '-' ? '' : `$${p.value}M`, fontFamily: ECH_FONT, fontSize: 10, fontWeight: 600, color: INK } },
      { type: 'bar', stack: 'b', data: up, itemStyle: { color: GREEN, opacity: 0.68, borderRadius: [3, 3, 0, 0] }, label: { show: true, position: 'top', formatter: p => p.value === '-' ? '' : `+$${p.value}M`, fontFamily: ECH_FONT, fontSize: 10, color: GREEN } },
      { type: 'bar', stack: 'b', data: down, itemStyle: { color: CORAL, opacity: 0.68, borderRadius: [3, 3, 0, 0] }, label: { show: true, position: 'bottom', formatter: p => p.value === '-' ? '' : `−$${p.value}M`, fontFamily: ECH_FONT, fontSize: 10, color: CORAL } },
    ],
  }
})()

const ARR_OPTION = {
  grid: { left: 42, right: 16, top: 20, bottom: 26 },
  tooltip: { trigger: 'axis', ...TT, valueFormatter: v => usdM(v) },
  xAxis: { ...catAxis(QTRS8), boundaryGap: false },
  yAxis: valAxis({ min: 34, max: 50, axisLabel: { ...AX_LABEL, formatter: v => `$${v}M` } }),
  series: [{
    type: 'line', smooth: true, data: ARR_TREND, showSymbol: false, name: 'ARR',
    lineStyle: { color: BLUE, width: 2.2 }, itemStyle: { color: BLUE },
    areaStyle: {
      opacity: 0.16,
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: BLUE }, { offset: 1, color: '#ffffff' },
      ]),
    },
    markPoint: {
      symbol: 'circle', symbolSize: 9,
      itemStyle: { color: '#fff', borderColor: BLUE, borderWidth: 2 },
      label: { formatter: `${usdM(BRIDGE.end)}`, position: 'top', color: BLUE, fontFamily: ECH_FONT, fontSize: 10, fontWeight: 600, distance: 8 },
      data: [{ coord: [7, ARR_TREND[7]] }],
    },
  }],
}

const COHORT_OPTION = (() => {
  const data = []
  COHORTS.forEach(([, vals], y) => vals.forEach((v, x) => { if (v != null) data.push([x, COHORTS.length - 1 - y, v]) }))
  return {
    grid: { left: 54, right: 66, top: 16, bottom: 32 },
    tooltip: {
      ...TT,
      formatter: p => `${COHORTS[COHORTS.length - 1 - p.value[1]][0]} cohort<br/>month ${COHORT_MONTHS[p.value[0]]} · <b>${p.value[2]}%</b> of starting ARR`,
    },
    xAxis: { ...catAxis(COHORT_MONTHS), splitArea: { show: true }, name: 'months', nameLocation: 'end', nameTextStyle: { ...AX_LABEL, padding: [22, 0, 0, 0] } },
    yAxis: { ...catAxis([...COHORTS].reverse().map(c => c[0])), splitArea: { show: true } },
    visualMap: {
      min: 96, max: 120, calculable: false, orient: 'vertical', right: 4, top: 'middle',
      itemWidth: 10, itemHeight: 96, textStyle: { fontFamily: ECH_FONT, fontSize: 9.5, color: MUTED },
      inRange: { color: ['#f6f2e8', '#dbe7f7', '#9dbdea', BLUE] },
    },
    series: [{
      type: 'heatmap', data,
      label: { show: true, formatter: p => `${p.value[2]}`, fontFamily: ECH_FONT, fontSize: 9.5, color: '#3d4a5e' },
      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
    }],
  }
})()

const EFFICIENCY_OPTION = {
  grid: { left: 40, right: 44, top: 28, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT },
  legend: { top: 0, left: 34, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  xAxis: catAxis(QTRS8),
  yAxis: [
    valAxis({ axisLabel: { ...AX_LABEL, formatter: v => `$${v}M` } }),
    valAxis({ min: 0, max: 2, splitLine: { show: false }, axisLabel: { ...AX_LABEL, formatter: v => v.toFixed(1) } }),
  ],
  series: [
    { name: 'S&M spend', type: 'bar', data: SM_SPEND, barWidth: '22%', itemStyle: { color: CORAL, opacity: 0.5, borderRadius: [3, 3, 0, 0] } },
    { name: 'Net new ARR', type: 'bar', data: NET_NEW_Q, barWidth: '22%', itemStyle: { color: GREEN, opacity: 0.62, borderRadius: [3, 3, 0, 0] } },
    {
      name: 'Magic number', type: 'line', yAxisIndex: 1, data: MAGIC, smooth: true, symbolSize: 5,
      lineStyle: { color: PURPLE, width: 1.8 }, itemStyle: { color: '#fff', borderColor: PURPLE, borderWidth: 1.8 },
      markLine: {
        silent: true, symbol: 'none', lineStyle: { color: PURPLE, type: 'dashed', width: 1 },
        label: { formatter: 'Efficient 1.0', position: 'insideStartTop', color: PURPLE, fontFamily: ECH_FONT, fontSize: 9 },
        data: [{ yAxis: 1 }],
      },
    },
  ],
}

function SegmentTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Segment</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>ARR</th>
          <th style={{ ...thStyle, width: 132 }}>Share of ARR</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Growth</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>NRR</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>CAC payback</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Logos</th>
        </tr>
      </thead>
      <tbody>
        {SEGMENTS.map((s, i) => {
          const bd = i < SEGMENTS.length - 1 ? '1px solid #f4f2ee' : 'none'
          return (
            <tr key={s.name}>
              <td style={{ ...tdStyle, borderBottom: bd, color: INK, fontWeight: 500 }}>{s.name}</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{usdM(s.arr)}</td>
              <td style={{ ...tdStyle, borderBottom: bd }}>
                <RBar pct={s.arr} max={SEG_ARR} color={BLUE} h={7} />
              </td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: s.growth >= 14 ? GREEN : MUTED }}>▲ {s.growth}%</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: s.nrr >= 108 ? GREEN : s.nrr >= 100 ? GOLD : CORAL }}>{s.nrr}%</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: s.payback <= CAC_PAYBACK ? GREEN : GOLD }}>{s.payback} mo</td>
              <td style={{ ...tdStyle, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d' }}>{s.logos}</td>
            </tr>
          )
        })}
        <tr>
          <td style={{ ...tdStyle, ...serif, fontWeight: 500, color: INK, paddingTop: 10 }}>Total</td>
          <td style={{ ...tdStyle, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK, paddingTop: 10 }}>{usdM(SEG_ARR)}</td>
          <td style={{ ...tdStyle, paddingTop: 10 }} />
          <td style={{ ...tdStyle, textAlign: 'right', ...mono, fontSize: 11.5, color: GREEN, paddingTop: 10 }}>▲ {BRIDGE.yoy}%</td>
          <td style={{ ...tdStyle, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: GREEN, paddingTop: 10 }}>{BRIDGE.nrr}%</td>
          <td style={{ ...tdStyle, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d', paddingTop: 10 }}>{CAC_PAYBACK} mo</td>
          <td style={{ ...tdStyle, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d', paddingTop: 10 }}>{SEG_LOGOS}</td>
        </tr>
      </tbody>
    </table>
  )
}

function RevenuePulse({ onBack }) {
  const span2 = { gridColumn: '1 / -1' }
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Revenue Pulse"
        subtitle={`${usdM(BRIDGE.end)} ARR · ${SEG_LOGOS} logos · ${SOURCES.length} sources · eight quarters to Q3 26`}
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {PULSE_KPIS.map(k => <RKpi key={k.label} {...k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <RCard title="ARR bridge · trailing twelve months" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: HEALTH.good }}>net new {usdM(BRIDGE.netNew)}</span>}>
            <Chart option={BRIDGE_OPTION} height={246} />
            <div style={{ fontSize: 11.5, color: '#4b463d', lineHeight: 1.5 }}>
              Expansion at <b style={{ color: GREEN }}>{usdM(BRIDGE.expansion)}</b> is now {Math.round((BRIDGE.expansion / (BRIDGE.newLogo + BRIDGE.expansion)) * 100)}% of gross new ARR —
              this is an installed-base business. NRR {BRIDGE.nrr}% and GRR {BRIDGE.grr}% are both computed directly off this bridge:
              {' '}{usdM(BRIDGE.contraction)} of contraction and {usdM(BRIDGE.churn)} of churn against a {usdM(BRIDGE.start)} opening base.
            </div>
          </RCard>

          <RCard title="ARR · eight quarters">
            <Chart option={ARR_OPTION} height={222} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              {usdM(ARR_TREND[0])} to {usdM(BRIDGE.end)} over two years. The four most recent quarters added {usdM(BRIDGE.netNew)} —
              {BRIDGE.yoy}% growth on a base that is now large enough that retention, not acquisition, sets the slope.
            </div>
          </RCard>

          <RCard title="Sales & marketing efficiency">
            <Chart option={EFFICIENCY_OPTION} height={222} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Magic number has held above 1.3 for six quarters and reads {MAGIC[MAGIC.length - 1].toFixed(2)} today —
              {usdM(BRIDGE.netNew)} of net new ARR against {usdM(SM_TTM)} of trailing S&M. New-logo CAC payback is {CAC_PAYBACK} months at {Math.round(GROSS_MARGIN * 100)}% gross margin.
            </div>
          </RCard>

          <RCard title="Cohort retention · % of starting ARR" accent={BLUE} style={span2}>
            <Chart option={COHORT_OPTION} height={272} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              Every cohort crosses 100% by month 6 and keeps climbing — the Q4 24 cohort is worth {COHORTS[0][1][7]}% of its
              original ARR twenty-one months in. That curve, not new logo count, is what carries NRR to {BRIDGE.nrr}%.
            </div>
          </RCard>

          <RCard title="Performance by segment" style={span2}>
            <SegmentTable />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              Strategic is {Math.round((SEGMENTS[3].arr / SEG_ARR) * 100)}% of ARR on {SEGMENTS[3].logos} logos and returns {SEGMENTS[3].nrr}% NRR.
              SMB is the only segment below 100% NRR — it is {Math.round((SEGMENTS[0].arr / SEG_ARR) * 100)}% of revenue and {Math.round((SEGMENTS[0].logos / SEG_LOGOS) * 100)}% of the logo count.
            </div>
          </RCard>

          <div style={span2}>
            <DerivedCallout title="What the graph is telling the CRO this quarter" rows={[
              ['Pipeline', `${usdM(Q.pipeline)} open at ${Q.coverage}x coverage, but commit is ${usdM(Q.gap)} short of the ${usdM(Q.quota)} quota — see Pipeline Command`],
              ['Churn Risk', `${fmtUSD(AT_RISK_BOOK_USD)} of the named renewal book scores below 75 health, led by ${AT_RISK_ACCTS[0].name} at ${AT_RISK_ACCTS[0].health}`],
              ['Expansion', `${usdM(WHITESPACE_TOTAL / 1e6)} of whitespace with ${READY_NOW} accounts already carrying usage or intent evidence`],
              ['Attribution', `${fmtUSD(MKT.influenced)} of influenced pipeline on ${fmtUSD(MKT.spend)} of spend — but one campaign holds ${Math.round((FLATTERED.lastTouch / MKT.influenced) * 100)}% of last-touch credit it does not earn`],
            ]} note={`One Account × Opportunity spine across ${SOURCES.length} systems: ${SOURCES.join(', ')}.`} />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── MANIFEST ────────────────────────────────────────────────────────────────

export const REVENUE_APPS = [
  {
    id: 'rv_pipeline', name: 'Pipeline Command',
    desc: 'Forecast, coverage and the deals that decide the quarter.',
    stats: '$24.6M pipeline · 2.7x coverage · $8.4M commit',
    chips: ['Opportunity', 'Account Executive', 'Forecast', 'Quote', 'Pipeline Signal'],
    graph: 'Revenue Teams Context Graph',
    Thumb: PipelineThumb, View: PipelineCommand,
  },
  {
    id: 'rv_attribution', name: 'Attribution Studio',
    desc: 'What creates pipeline, separated from what takes credit.',
    stats: '10 campaigns · $4.2M sourced · 62% influenced',
    chips: ['Campaign', 'Marketing Touch', 'Web Session', 'Ad Spend', 'Attribution Model'],
    graph: 'Revenue Teams Context Graph',
    Thumb: AttribThumb, View: AttributionStudio,
  },
  {
    id: 'rv_retention', name: 'Retention Cockpit',
    desc: 'Churn risk in the usage data, months before renewal.',
    stats: '$14.8M renewal book · 6 at risk · NRR 108%',
    chips: ['Subscription', 'Renewal', 'Product Usage', 'Support Ticket', 'Churn Risk'],
    graph: 'Revenue Teams Context Graph',
    Thumb: RetentionThumb, View: RetentionCockpit,
  },
  {
    id: 'rv_expansion', name: 'Expansion Map',
    desc: 'Whitespace and upsell the usage data already proves.',
    stats: '$6.4M whitespace · 9 accounts ready · 3 products',
    chips: ['Account', 'Product', 'Product Usage', 'Intent Signal', 'Expansion Signal'],
    graph: 'Revenue Teams Context Graph',
    Thumb: ExpansionThumb, View: ExpansionMap,
  },
  {
    id: 'rv_pulse', name: 'Revenue Pulse',
    desc: 'One board-ready view of ARR, retention and efficiency.',
    stats: '$48.2M ARR · 108% NRR · 1.4 magic number',
    chips: ['Account', 'Subscription', 'Segment', 'Forecast', 'Health Score'],
    graph: 'Revenue Teams Context Graph',
    Thumb: PulseThumbRv, View: RevenuePulse,
  },
]
