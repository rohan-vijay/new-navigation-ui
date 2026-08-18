import { useState, useRef, useEffect } from 'react'
import { NIKE_DATA, CHARGEPOINT_DATA, ListGlyph } from './GraphStage'
import * as GRAPHS from './GraphStage'

// The Greif operations graph is optional — picked up only once it lands in GraphStage.
const GREIF_NODES = GRAPHS.GREIF_DATA?.nodes || []
// Same for the revenue teams graph.
const REVENUE_NODES = GRAPHS.REVENUE_DATA?.nodes || []

// ── Node lookup (for rendering graph chips in the reasoning trace) ──
const NODE_BY_ID = (() => { const m = {}; [...NIKE_DATA.nodes, ...CHARGEPOINT_DATA.nodes, ...GREIF_NODES, ...REVENUE_NODES].forEach(n => { m[n.id] = n }); return m })()

// Synthesize a record's field values from the node's property schema — lets the
// "View record" action show a real record inspector for a cited source.
function genFieldVal(p, ref) {
  if (p.pk) return ref
  let h = 0; const key = ref + ':' + p.name; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  const v = Math.abs(h), n = p.name, t = p.type
  if (/(_id$|^id$)/.test(n)) return n.replace(/_id$/, '').slice(0, 3).toUpperCase() + '-' + (1000 + v % 8999)
  if (/name|title|subject/.test(n)) return ref
  if (/sell_through|accuracy|impact/.test(n) || t === 'float') return (0.5 + (v % 50) / 100).toFixed(2)
  if (t === 'int') return String(1 + v % 900)
  if (t === 'decimal') return '$' + (1000 + v % 9000).toLocaleString()
  if (t === 'date') return '2026-06-' + String(1 + v % 28).padStart(2, '0')
  if (t === 'timestamp') return '2026-06-' + String(1 + v % 28).padStart(2, '0') + 'T' + String(v % 24).padStart(2, '0') + ':00Z'
  if (t === 'bool') return v % 2 ? 'true' : 'false'
  if (t === 'enum') return ['Active', 'Rising', 'High', 'Standard', 'Live'][v % 5]
  if (t === 'string[]') return ['football, kits', 'running, seasonal'][v % 2]
  if (t === 'uuid') return 'UID-' + (10000 + v % 89999)
  return '—'
}
function recordFields(source) {
  const n = NODE_BY_ID[source.node]
  return (n?._userProps || []).slice(0, 7).map(p => ({ name: p.name, value: genFieldVal(p, source.ref), pk: !!p.pk }))
}

// ── Agents ──────────────────────────────────────────────────────────────────
const AGENTS = [
  { id: 'demand',  name: 'Retail Demand Agent', color: '#16341f', tagline: 'Explains demand spikes across product, store, media & supply.', graph: 'Nike Retail Context Graph',
    greeting: "I'm grounded in the Nike Retail Context Graph. I answer by running Cypher over the graph — ask me why a product is moving in a market and I'll trace it through demand, media and supply.",
    starters: ['seattle_ny', 'airmax_spike', 'pegasus_pnw'] },
  { id: 'supply',  name: 'Supply Chain Agent', color: '#3a6ea0', tagline: 'Spots stockout risk and replenishment gaps before they cost sales.', graph: 'Nike Retail Context Graph',
    greeting: "I watch inventory positions, weeks-of-supply and inbound replenishment across every door. I query the graph directly — ask me where you're about to lose sales.",
    starters: ['stockout_risk', 'seattle_ny', 'pegasus_pnw'] },
  { id: 'merch',   name: 'Merch & Campaign Agent', color: '#8a5a2b', tagline: 'Ties sell-through back to campaigns, media spend and events.', graph: 'Nike Retail Context Graph',
    greeting: "I connect sell-through to the campaigns, paid media and cultural events behind it. I run Cypher across the graph — ask me what's actually driving a lift.",
    starters: ['campaign_roi', 'airmax_spike', 'seattle_ny'] },
  { id: 'uptime',  name: 'Uptime Agent', color: '#c2543a', tagline: 'Finds failing ports before drivers do.', graph: 'ChargePoint Network Graph',
    greeting: "I'm grounded in the ChargePoint Network Graph. I answer by tracing telemetry through faults, work orders and Assure warranty SLAs — ask me why uptime moved and I'll show you the ports, firmware and penalty dollars behind it.",
    starters: ['bayarea_uptime', 'failing_port', 'truck_rolls'] },
  { id: 'fieldops', name: 'Field Ops Agent', color: '#3a6ea0', tagline: 'Cuts truck rolls with parts-aware, SLA-aware dispatch.', graph: 'ChargePoint Network Graph',
    greeting: "I'm grounded in the ChargePoint Network Graph. I plan dispatch by joining open work orders to technician skills, spare-part stock and SLA clocks — ask me how to clear a backlog and I'll batch it into the fewest truck rolls.",
    starters: ['truck_rolls', 'failing_port', 'bayarea_uptime'] },
  { id: 'energy',  name: 'Energy Cost Agent', color: '#0f8a5f', tagline: 'Shrinks demand charges with tariff-aware load shaping.', graph: 'ChargePoint Network Graph',
    greeting: "I'm grounded in the ChargePoint Network Graph. I trace energy cost through sites, utilities, tariff peak windows and fleet charging behavior — ask me why a bill spiked and I'll show you the load shape that caused it.",
    starters: ['demand_charges', 'bayarea_uptime', 'failing_port'] },
  { id: 'maint',   name: 'Maintenance Agent', color: '#6b5aa6', tagline: 'Plans repairs and preventive maintenance across the network.', graph: 'ChargePoint Network Graph',
    greeting: "I'm grounded in the ChargePoint Network Graph. I plan repairs and preventive maintenance by tracing faults, wear signals, parts stock and SLA windows — ask me what needs fixing, in what order, and what should change in the schedule.",
    starters: ['repair_queue', 'pm_schedule', 'failing_port'] },
  { id: 'plantops', name: 'Plant Performance Agent', color: '#3a6ea0', tagline: 'Explains OEE swings across lines, assets, shifts and materials.', graph: 'Greif Operations Context Graph',
    greeting: "I'm grounded in the Greif Operations Context Graph. I decompose OEE into availability, performance and quality, then trace each loss back to the line, asset, shift and crew that produced it — ask me why a plant moved and I'll show you the minutes.",
    starters: ['oee_drop', 'downtime_pareto', 'changeover_loss'] },
  { id: 'supplyrisk', name: 'Supply Risk Agent', color: '#8a5a2b', tagline: 'Flags raw-material exposure before it stops a line.', graph: 'Greif Operations Context Graph',
    greeting: "I'm grounded in the Greif Operations Context Graph. I watch steel coil, resin, OCC and linerboard positions against supplier concentration, index moves and days of cover — ask me what tightening supply actually costs and I'll name the plants, SKUs and customers exposed.",
    starters: ['resin_exposure', 'oee_drop', 'otif_miss'] },
  { id: 'otif', name: 'Service & Freight Agent', color: '#0f8a5f', tagline: 'Traces OTIF misses and cost-to-serve to their real cause.', graph: 'Greif Operations Context Graph',
    greeting: "I'm grounded in the Greif Operations Context Graph. I trace every late or short order line back through quality holds, carrier tenders and forecast error, and price what each lane costs to serve — ask me why a customer's service slipped and I'll split it by cause.",
    starters: ['otif_miss', 'freight_cost', 'changeover_loss'] },
  { id: 'ehsq', name: 'Safety & Quality Agent', color: '#c2543a', tagline: 'Connects recordables and non-conformances to plants, shifts and training.', graph: 'Greif Operations Context Graph',
    greeting: "I'm grounded in the Greif Operations Context Graph. I connect recordables and non-conformances to the plants, shifts, tenure bands, training records and material lots behind them — ask me whether an incident or defect trend has a pattern and I'll show you the evidence.",
    starters: ['safety_pattern', 'quality_ncr', 'oee_drop'] },
  { id: 'pipeline', name: 'Pipeline Agent', color: '#16341f', tagline: 'Tests the forecast against what the graph actually shows.', graph: 'Revenue Teams Context Graph',
    greeting: "I'm grounded in the Revenue Teams Context Graph. I test the number against the evidence underneath it — logged activity on the deals in commit, close dates that have already moved, threading and stage velocity — ask me whether the forecast survives contact with the graph.",
    starters: ['forecast_call', 'deal_slippage', 'stage_conversion'] },
  { id: 'attribution', name: 'Attribution Agent', color: '#8a5a2b', tagline: 'Separates campaigns that create pipeline from ones that take credit.', graph: 'Revenue Teams Context Graph',
    greeting: "I'm grounded in the Revenue Teams Context Graph. I trace pipeline back through touches, web sessions, ad spend and intent, then re-run the credit under multi-touch — ask me which campaigns created pipeline and which ones only stood next to it.",
    starters: ['campaign_pipeline', 'channel_mix', 'forecast_call'] },
  { id: 'retention', name: 'Retention Agent', color: '#c2543a', tagline: 'Finds churn early, in usage and engagement, not at renewal.', graph: 'Revenue Teams Context Graph',
    greeting: "I'm grounded in the Revenue Teams Context Graph. I read churn in seat utilization, champion silence and ageing Sev-2s months before anyone opens a renewal conversation — ask me which accounts are leaving and I'll show you the tell that fired first.",
    starters: ['churn_watch', 'renewal_risk', 'health_drivers'] },
  { id: 'expansion', name: 'Expansion Agent', color: '#0f8a5f', tagline: 'Surfaces whitespace and upsell the usage data already proves.', graph: 'Revenue Teams Context Graph',
    greeting: "I'm grounded in the Revenue Teams Context Graph. I join product telemetry to entitlements, third-party intent and pricing-page behaviour to find accounts that are already buying before anyone has asked them — ask me where the whitespace is and I'll size it.",
    starters: ['whitespace', 'expansion_signals', 'churn_watch'] },
  { id: 'winloss', name: 'Win-Loss Agent', color: '#6b5aa6', tagline: 'Explains why deals are actually won and lost.', graph: 'Revenue Teams Context Graph',
    greeting: "I'm grounded in the Revenue Teams Context Graph. I take won and lost deals apart across competitor mentions, discount depth, threading and call transcripts — ask me why we lose and I'll tell you whether it was really the price.",
    starters: ['competitive_loss', 'discount_leak', 'stage_conversion'] },
]

// ── Scripted, graph-grounded conversations ───────────────────────────────────
// Each step runs one Cypher query against the graph. Answers carry inline
// citations [n] that resolve to the exact graph records in `sources`.
const SCRIPTS = {
  seattle_ny: {
    q: "Why is Seattle outselling New York on the USMNT jersey this week?",
    tag: 'Demand · Media · Supply',
    chain: [
      { kind: 'cypher', title: 'Compare demand at both stores', nodes: ['product', 'store', 'demand_signal'],
        cypher: `MATCH (p:Product {name:'USMNT Home Jersey 2026'})
      -[:SOLD_AT]->(s:Store)-[:HAS_DEMAND]->(d:DemandSignal)
WHERE s.city IN ['Seattle','New York']
RETURN s.name, d.sell_through_rate, d.trend, d.search_index`,
        result: `Nike Seattle → 0.89  Rising  (idx 148)\nNike NYC — 5th Ave → 0.71  Flat  (idx 132)` },
      { kind: 'sql', title: 'Quantify units & revenue from the warehouse', nodes: ['sale'],
        cypher: `SELECT s.store_name, SUM(f.units) AS units, AVG(f.sell_through) AS st
FROM   sales_facts f JOIN dim_store s ON s.id = f.store_id
WHERE  f.style = 'DV1120-100' AND f.week = CURRENT_WEEK
GROUP BY 1 ORDER BY units DESC`,
        result: `Nike Seattle → 1,240 units · 0.89 ST\nNike NYC — 5th Ave → 610 units · 0.71 ST` },
      { kind: 'semantic', title: 'Retrieve what is driving interest', nodes: ['event', 'campaign'],
        query: 'What is driving USMNT jersey demand this week?',
        matches: [
          { score: 0.93, text: '“World Cup — USMNT advances” — event brief', src: 'Market Signals' },
          { score: 0.88, text: 'Campaign brief · “World Cup 2026 Push” objectives', src: 'Knowledge' },
          { score: 0.81, text: 'USMNT trending across Pacific NW social', src: 'Adobe Analytics' },
        ] },
      { kind: 'cypher', title: 'Attribute paid media by geo', nodes: ['campaign', 'media_spend', 'region'],
        cypher: `MATCH (c:Campaign {name:'World Cup 2026 Push'})<-[:PART_OF]-(m:MediaSpend)
      -[:TARGETS]->(r:Region)
RETURN r.name, sum(m.spend_usd) AS spend ORDER BY spend DESC`,
        result: `Pacific Northwest → $48,000\nNortheast → $6,000` },
      { kind: 'cypher', title: 'Check supply & inbound cover', nodes: ['inventory', 'shipment'],
        cypher: `MATCH (s:Store)<-[:AT_STORE]-(i:Inventory)
OPTIONAL MATCH (i)<-[:REPLENISHES]-(sh:Shipment)
WHERE s.city IN ['Seattle','New York']
RETURN s.name, i.weeks_of_supply, i.on_hand, sh.eta`,
        result: `Nike NYC → 1.2 wks · 42 on-hand · ETA 3d (SH-5540)\nNike Seattle → 5.4 wks · healthy` },
    ],
    answer: [
      { kind: 'verdict', text: "Seattle's lead is real demand amplified by media — and New York isn't lower demand, it's supply-constrained." },
      { kind: 'para', text: 'The headline gap is real: this week Seattle moved 1,240 units at 0.89 sell-through versus New York\'s 610 units at 0.71[1]. But the two metros are riding the *same* World Cup lift[2] (impact 0.90 across both), so the underlying pull is comparable — which means the outcome gap is being manufactured downstream, by two levers the graph makes explicit.' },
      { kind: 'bullet', text: '**Media** — 8× more paid spend went to the Pacific Northwest ($48K vs $6K)[3]. Seattle\'s demand is being actively amplified while New York is left to run on the organic event alone.' },
      { kind: 'bullet', text: '**Supply** — Nike NYC is down to 1.2 weeks of supply[4] with replenishment still 3 days out[5]. It is physically turning away sales it would otherwise convert, which mechanically depresses its sell-through[1] and makes the demand look softer than it is.' },
      { kind: 'para', text: 'Decomposing the gap: roughly ~60% is media allocation and ~40% is the New York stockout. The tell that this is fulfillment and not appetite is purchase intent — NY\'s search index is 132 against Seattle\'s 148[1], i.e. within striking distance. New York wants the jersey; it can\'t buy it and isn\'t being reminded to.' },
      { kind: 'para', text: 'Left alone, this compounds: the stockout suppresses NY\'s numbers, which makes it look like a weaker market, which justifies sending *even less* media and inventory there — a doom loop that misreads a supply gap as a demand gap.' },
      { kind: 'action', text: 'Recommend: (1) expedite SH-5540 into Nike NYC to break the stockout[5]; (2) rebalance ~$15K of Pacific NW spend to the Northeast[3] while the event window is open; (3) hold Seattle — it is converting cleanly and is near diminishing returns on spend.' },
    ],
    sources: [
      { n: 1, node: 'demand_signal', ref: 'SIG-587794', detail: 'Seattle 0.89 Rising · NYC 0.71 Flat · idx 148 vs 132' },
      { n: 2, node: 'event', ref: 'EV-771', detail: 'World Cup — USMNT advances · impact 0.90' },
      { n: 3, node: 'media_spend', ref: 'AD-9912', detail: '$48K Pacific NW vs $6K Northeast' },
      { n: 4, node: 'inventory', ref: 'IP-7781', detail: 'Nike NYC · 1.2 weeks of supply · 42 on-hand' },
      { n: 5, node: 'shipment', ref: 'SH-5540', detail: 'Replenishment to Nike NYC · ETA 3 days' },
    ],
  },
  airmax_spike: {
    q: "Is the Air Max 90 spike this week demand or media driven?",
    tag: 'Demand · Media',
    chain: [
      { kind: 'cypher', title: 'Read the demand signal', nodes: ['product', 'demand_signal'],
        cypher: `MATCH (p:Product {name:'Air Max 90 OG'})-[:FOR_PRODUCT]-(d:DemandSignal)
RETURN d.add_to_cart, d.sell_through_rate, d.trend`,
        result: `add_to_cart +42% WoW · sell_through 0.81 · trend Surging` },
      { kind: 'sql', title: 'Pull the add-to-cart trend from the warehouse', nodes: ['demand_signal'],
        cypher: `SELECT week, SUM(add_to_cart) AS atc
FROM   behavior_facts
WHERE  style = 'DV0900-OG'
GROUP BY 1 ORDER BY 1 DESC LIMIT 3`,
        result: `this wk 5,400 · prior 3,800 · 2wk 3,700  →  +42% step-change` },
      { kind: 'semantic', title: 'Is there a cultural moment behind it?', nodes: ['event'],
        query: 'Air Max 90 cultural moments and mentions this week',
        matches: [
          { score: 0.90, text: '“Air Max Day” — cultural event, organic', src: 'Market Signals' },
          { score: 0.79, text: 'Sneaker press round-up features Air Max 90 OG', src: 'Knowledge' },
        ] },
      { kind: 'cypher', title: 'Check whether media actually moved', nodes: ['campaign', 'media_spend'],
        cypher: `MATCH (c:Campaign {name:'Air Max Day'})<-[:PART_OF]-(m:MediaSpend)
RETURN sum(m.spend_usd) AS spend, m.period`,
        result: `$9,000 this week · flat vs prior week (no step-up)` },
    ],
    answer: [
      { kind: 'verdict', text: 'Demand-driven, not media-driven — this is an organic Air Max Day lift.' },
      { kind: 'para', text: 'The demand signal is genuinely surging — add-to-cart is up 42% week-over-week to 5,400 and sell-through has climbed to 0.81 with a Surging trend[1]. The warehouse confirms this is a clean step-change, not noise: the prior two weeks sat at 3,800 and 3,700, so the jump is real and abrupt rather than a gradual drift.' },
      { kind: 'para', text: 'What matters for attribution is the *sequencing*. Paid media on the Air Max Day campaign is flat at $9K with no step-up[3], and the graph shows the demand spike arriving **before** any spend moved. Semantic retrieval over knowledge surfaces the cause: the Air Max Day cultural moment[2] and a wave of sneaker-press coverage — an earned, organic driver, not a funded one.' },
      { kind: 'bullet', text: '**Reads as organic** — demand moved first, media never scaled, and the driver is a cultural event rather than a campaign.' },
      { kind: 'bullet', text: '**The exposure is supply, not spend** — because this wasn\'t planned, forecasts under-called it and inventory may not be positioned for the peak.' },
      { kind: 'para', text: "This is the highest-margin kind of demand — you're not paying to acquire it. The failure mode isn\'t wasted spend, it\'s stocking out during a moment you didn\'t see coming and leaving the lift on the table." },
      { kind: 'action', text: 'Recommend: (1) add incremental spend now to compound momentum you\'re currently getting for free[3]; (2) pull Air Max 90 inventory forward into high-velocity doors before the event tail fades[1]; (3) flag the forecast miss so planning widens the band on culturally-driven styles.' },
    ],
    sources: [
      { n: 1, node: 'demand_signal', ref: 'DS-33120', detail: 'add_to_cart +42% · sell-through 0.81 Surging' },
      { n: 2, node: 'event', ref: 'EV-Airmax', detail: 'Air Max Day · Cultural · impact 0.70' },
      { n: 3, node: 'media_spend', ref: 'AD-Airmax', detail: '$9K this week · flat WoW' },
    ],
  },
  pegasus_pnw: {
    q: "What's driving Pegasus 41 demand in the Pacific Northwest?",
    tag: 'Demand · Seasonality',
    chain: [
      { kind: 'cypher', title: 'Read regional demand', nodes: ['product', 'region', 'demand_signal'],
        cypher: `MATCH (p:Product {name:'Pegasus 41'})-[:FOR_PRODUCT]-(d:DemandSignal)
      -[:IN_REGION]->(r:Region {name:'Pacific Northwest'})
RETURN d.sell_through_rate, d.trend`,
        result: `sell_through 0.76 · trend Rising · concentrated in Seattle & Portland` },
      { kind: 'semantic', title: 'Find the seasonal driver', nodes: ['event'],
        query: 'running events in the Pacific Northwest this season',
        matches: [
          { score: 0.87, text: '“Marathon Season” — seasonal running peak', src: 'Market Signals' },
          { score: 0.74, text: 'Regional race calendar: Seattle & Portland', src: 'Knowledge' },
        ] },
      { kind: 'sql', title: 'Compare actuals to forecast', nodes: ['forecast'],
        cypher: `SELECT forecast_units, actual_units, accuracy
FROM   forecast_facts
WHERE  style = 'DV1704-XXX' AND region = 'Pacific Northwest'`,
        result: `forecast 5,200 · actual 6,100 · running 17% ahead of plan` },
    ],
    answer: [
      { kind: 'verdict', text: 'Seasonal running demand — the Pacific NW is running 17% ahead of forecast and the plan hasn\'t caught up.' },
      { kind: 'para', text: 'Pegasus 41 is a core running franchise, and demand is concentrated exactly where you\'d expect a seasonal running story: Seattle and Portland doors, with sell-through at 0.76 and a Rising trend[1]. Semantic retrieval over the knowledge base ties this to marathon season in the region[2] — a recurring calendar driver, not a one-off spike.' },
      { kind: 'para', text: 'The warehouse makes the gap concrete: actuals are 6,100 units against an o9 forecast of 5,200 — roughly 900 units, or 17%, ahead of plan[3]. Because the plan is under-calling demand, allocation and replenishment are being sized off a number that\'s already stale.' },
      { kind: 'bullet', text: '**Predictable, not anomalous** — marathon season repeats every year, so this is forecastable signal the plan should already carry.' },
      { kind: 'bullet', text: '**The risk is a self-inflicted stockout** — under-forecasting caps replenishment, so healthy demand quietly converts into lost sales in the two doors driving it.' },
      { kind: 'action', text: 'Recommend: (1) raise the regional forecast to actuals and hold the higher number through the season[3]; (2) pull replenishment forward into Seattle & Portland before the peak[1]; (3) add a seasonal-running rule so Pegasus auto-lifts in this region next cycle.' },
    ],
    sources: [
      { n: 1, node: 'demand_signal', ref: 'DS-PNW-Peg', detail: 'sell-through 0.76 Rising · PNW' },
      { n: 2, node: 'event', ref: 'EV-Marathon', detail: 'Marathon Season · Seasonal · impact 0.60' },
      { n: 3, node: 'forecast', ref: 'FC-4410', detail: 'forecast 5,200 vs actual 6,100 (+17%)' },
    ],
  },
  stockout_risk: {
    q: "Which stores risk stocking out on World Cup kits in the next 2 weeks?",
    tag: 'Supply · Risk',
    chain: [
      { kind: 'cypher', title: 'Find low weeks-of-supply on kits', nodes: ['product', 'inventory', 'store'],
        cypher: `MATCH (p:Product)-[:FEATURES]->(:Team)
MATCH (i:Inventory)-[:AT_STORE]->(s:Store)
WHERE i.weeks_of_supply < 2
RETURN s.name, i.weeks_of_supply ORDER BY i.weeks_of_supply`,
        result: `Nike NYC → 1.2 wks\nNike Miami → 1.6 wks\nNike Chicago → 1.9 wks` },
      { kind: 'sql', title: 'Project days-to-zero from sell-down rate', nodes: ['sale'],
        cypher: `SELECT s.store_name, AVG(f.units) AS daily_burn
FROM   sales_facts f JOIN dim_store s ON s.id = f.store_id
WHERE  f.category = 'National Team Kit'
GROUP BY 1 ORDER BY daily_burn DESC`,
        result: `NYC 5.1/day → ~8d · Chicago 4.4/day → ~9d · Miami 3.8/day → ~11d` },
      { kind: 'cypher', title: 'Check inbound replenishment cover', nodes: ['shipment'],
        cypher: `MATCH (s:Store)<-[:AT_STORE]-(i:Inventory)
OPTIONAL MATCH (i)<-[:REPLENISHES]-(sh:Shipment)
RETURN s.name, sh.eta`,
        result: `Nike NYC → ETA 3d · Nike Miami → ETA 6d · Nike Chicago → none open` },
    ],
    answer: [
      { kind: 'verdict', text: 'Three doors at risk in the next two weeks — and Chicago, not the thinnest one, is the most urgent.' },
      { kind: 'para', text: 'Three stores are under two weeks of supply on national-team kits[1], and the warehouse burn rates say none of them coast: at current sell-down they hit zero in roughly 8–11 days[2]. The ranking flips once you factor inbound cover — the thinnest door isn\'t the biggest problem, the uncovered one is.' },
      { kind: 'bullet', text: '**Nike Chicago** — 1.9 weeks and ~9 days to zero[2], demand still Rising, and **no open replenishment**[3]. This is the real emergency: nothing is on the way.' },
      { kind: 'bullet', text: '**Nike NYC** — thinnest at 1.2 weeks[1] and fastest burn (~8 days)[2], but SH-5540 lands in 3 days[3]; it will squeeze but recover if the ETA holds.' },
      { kind: 'bullet', text: '**Nike Miami** — 1.6 weeks with replenishment 6 days out[3]; covered but tight — watch-list.' },
      { kind: 'para', text: 'Demand is Rising at all three, so none of these will self-correct through cooling interest — every day short is a converted sale lost during the highest-intent window of the World Cup.' },
      { kind: 'action', text: 'Recommend: (1) open an expedite into Chicago today — it has zero cover[3]; (2) confirm SH-5540\'s 3-day ETA into NYC and escalate if it slips[3]; (3) hold Miami on watch and reassess in 48 hours.' },
    ],
    sources: [
      { n: 1, node: 'inventory', ref: 'IP-7781', detail: 'Nike NYC 1.2 · Miami 1.6 · Chicago 1.9 weeks' },
      { n: 2, node: 'demand_signal', ref: 'DS-Kits', detail: 'All three trend Rising' },
      { n: 3, node: 'shipment', ref: 'SH-5540', detail: 'NYC 3d · Miami 6d · Chicago none' },
    ],
  },
  campaign_roi: {
    q: "Is the World Cup 2026 Push actually converting, or just spending?",
    tag: 'Campaign · Attribution',
    chain: [
      { kind: 'cypher', title: 'Break media down by geo', nodes: ['campaign', 'media_spend', 'region'],
        cypher: `MATCH (c:Campaign {name:'World Cup 2026 Push'})<-[:PART_OF]-(m:MediaSpend)
      -[:TARGETS]->(r:Region)
RETURN r.name, sum(m.spend_usd) AS spend, sum(m.impressions) AS impr`,
        result: `Pacific NW → $48K / 2.4M impr\nNortheast → $6K / 0.3M impr` },
      { kind: 'sql', title: 'Read downstream sell-through by region', nodes: ['product', 'demand_signal'],
        cypher: `SELECT r.region, AVG(f.sell_through) AS st
FROM   sales_facts f JOIN dim_region r ON r.id = f.region_id
WHERE  f.style = 'DV1120-100'
GROUP BY 1 ORDER BY st DESC`,
        result: `Pacific NW → 0.89 · Northeast → 0.71` },
      { kind: 'cypher', title: 'Check for demand we cannot fulfill', nodes: ['inventory'],
        cypher: `MATCH (i:Inventory)-[:AT_STORE]->(s:Store)-[:IN_REGION]->(r:Region {name:'Northeast'})
RETURN s.name, i.weeks_of_supply`,
        result: `Nike NYC → 1.2 wks (demand exists, stock does not)` },
    ],
    answer: [
      { kind: 'verdict', text: 'Converting where it lands — but the allocation is skewed and quietly leaving demand on the table.' },
      { kind: 'para', text: 'The Push is genuinely working, not just buying impressions. Where it spent heavily — Pacific NW at $48K against 2.4M impressions[1] — downstream sell-through is 0.89, versus 0.71 in the lightly-spent Northeast[2]. That 18-point spread lines up with spend, so the money is translating into conversion, not just reach.' },
      { kind: 'para', text: 'The problem is distribution. The Northeast has live, comparable demand but is starved on two fronts at once: thin media[1] *and* thin inventory — Nike NYC is down to 1.2 weeks of supply[3]. So the campaign is under-serving a market that would respond, while over-indexing one that\'s already saturated.' },
      { kind: 'bullet', text: '**Media is efficient where it runs** — the PNW spread proves the creative and targeting convert.' },
      { kind: 'bullet', text: '**But naïvely reallocating backfires** — pushing spend into the Northeast today would partly fund demand you can\'t fulfill[3], turning paid clicks into stockouts and a poor experience.' },
      { kind: 'action', text: 'Recommend: (1) shift ~$15K from PNW to the Northeast, but stage it to land **after** SH-5540 replenishes NYC[3]; (2) hold PNW spend flat — it\'s at diminishing returns; (3) set a supply-gated rule so spend only scales into a market once weeks-of-supply clears a threshold.' },
    ],
    sources: [
      { n: 1, node: 'media_spend', ref: 'AD-9912', detail: '$48K PNW / 2.4M impr vs $6K NE' },
      { n: 2, node: 'demand_signal', ref: 'SIG-587794', detail: 'PNW sell-through 0.89 vs NE 0.71' },
      { n: 3, node: 'inventory', ref: 'IP-7781', detail: 'Northeast (Nike NYC) 1.2 weeks of supply' },
    ],
  },
  bayarea_uptime: {
    q: "Why did uptime dip below the NEVI 97% floor in the Bay Area this week?",
    tag: 'Uptime · Faults · SLA',
    chain: [
      { kind: 'cypher', title: 'Find repeat-fault ports in the metro', nodes: ['cp_station', 'cp_port', 'cp_fault'],
        cypher: `MATCH (f:FaultAlert)-[:RAISED_ON]->(p:ChargingPort)
      -[:INSTALLED_ON]->(s:ChargingStation)-[:LOCATED_AT]->(st:Site)
WHERE st.metro = 'Bay Area' AND f.raised_at > date() - duration('P7D')
WITH s, p, count(f) AS faults WHERE faults >= 3
RETURN s.model, s.firmware_version, count(p) AS ports, sum(faults) AS faults`,
        result: `CT4000 · fw 5.1.2.1104 → 14 ports · 61 faults\nExpress Plus · fw 7.0.3 → 2 ports · 7 faults` },
      { kind: 'sql', title: 'Quantify downtime minutes by site', nodes: ['cp_site'],
        cypher: `SELECT s.site_name, SUM(d.downtime_min) AS down_min,
       1 - SUM(d.downtime_min) / SUM(d.tracked_min) AS uptime
FROM   port_downtime_facts d JOIN dim_site s ON s.id = d.site_id
WHERE  d.metro = 'Bay Area' AND d.week = CURRENT_WEEK
GROUP BY 1 ORDER BY down_min DESC`,
        result: `Fremont Hub → 4,310 min · 94.1%\nSan Jose Airport → 2,750 min · 95.3%\nOther 21 sites → 1,760 min · 98.9%  →  two sites = 80% of lost minutes` },
      { kind: 'semantic', title: 'Check for a known firmware issue', nodes: ['cp_station', 'cp_fault'],
        query: 'known issues on CT4000 firmware 5.1.2.1104',
        matches: [
          { score: 0.94, text: '“CP-FW-1104: DC contactor chatter after OTA 5.1.2.1104” — known issue', src: 'Firmware OTA' },
          { score: 0.87, text: 'Field bulletin: CT4000 power-module resets on build 1104', src: 'ServiceNow' },
          { score: 0.78, text: 'Rollback validation notes — 5.1.1 is the stable baseline', src: 'Firmware OTA' },
        ] },
      { kind: 'cypher', title: 'Price the SLA exposure & check work-order cover', nodes: ['cp_warranty', 'cp_workorder'],
        cypher: `MATCH (w:AssureContract)-[:COVERS]->(s:ChargingStation)
      <-[:INSTALLED_ON]-(p:ChargingPort)
WHERE p.port_id IN $repeat_fault_ports
OPTIONAL MATCH (wo:WorkOrder)-[:RESOLVES]->(:FaultAlert)-[:RAISED_ON]->(p)
RETURN w.uptime_commitment_pct, count(DISTINCT p) AS ports,
       sum(w.penalty_accrual) AS exposure, collect(DISTINCT wo.status)`,
        result: `97% NEVI floor · 14 ports covered · $86,400 penalty exposure\nwork orders: 3 open · 11 ports with none raised` },
    ],
    answer: [
      { kind: 'verdict', text: 'The dip is a firmware regression, not random hardware — 14 CT4000 ports on one bad build, with two sites driving 80% of the lost minutes.' },
      { kind: 'para', text: 'Bay Area uptime landed at 96.5% this week against the 97% NEVI floor, and the graph shows the shortfall is tightly concentrated: 14 CT4000 ports with three or more faults each, all running firmware 5.1.2.1104[1], threw 61 faults in seven days[2]. This is not a fleet-wide reliability slide — it is one build misbehaving on one hardware family.' },
      { kind: 'bullet', text: '**Two sites carry the dip** — Fremont Hub (4,310 min) and San Jose Airport (2,750 min) account for 80% of lost minutes[3]; the other 21 Bay Area sites sit at 98.9% and are fine.' },
      { kind: 'bullet', text: '**The cause is already documented** — the OTA registry flags build 5.1.2.1104 for DC contactor chatter on CT4000 (CP-FW-1104), and the fault signature on these ports matches it exactly[2].' },
      { kind: 'para', text: 'The money side: all 14 ports sit under Assure contracts carrying the 97% NEVI commitment, and penalty exposure is already $86,400 if the dip holds through month-end[4]. Yet only 3 work orders are open — 11 of the 14 ports have nothing raised against them[5], so the service loop has not caught up with what telemetry already knows.' },
      { kind: 'action', text: 'Recommend: (1) raise pre-emptive work orders on the 11 uncovered ports today[5]; (2) expedite DC power modules into Fremont Hub and San Jose Airport ahead of the visits[3]; (3) OTA-rollback the affected CT4000s to 5.1.1 — the registry flags it as the stable baseline[2].' },
    ],
    sources: [
      { n: 1, node: 'cp_port', ref: 'PORT-88412', detail: '14 CT4000 ports · ≥3 faults each · fw 5.1.2.1104' },
      { n: 2, node: 'cp_fault', ref: 'FLT-99120', detail: '61 faults in 7d · contactor chatter · matches CP-FW-1104' },
      { n: 3, node: 'cp_site', ref: 'SITE-2214', detail: 'Fremont Hub 4,310 + San Jose Airport 2,750 min = 80% of downtime' },
      { n: 4, node: 'cp_warranty', ref: 'ASR-55310', detail: 'Assure NEVI tier · 97% floor · $86,400 penalty exposure' },
      { n: 5, node: 'cp_workorder', ref: 'WO-20871', detail: '3 open work orders · 11 ports with none raised' },
    ],
  },
  failing_port: {
    q: "Which ports will fail in the next 14 days and what will it cost to ignore them?",
    tag: 'Predictive · Parts · Dispatch',
    chain: [
      { kind: 'cypher', title: 'Pull ports over the risk threshold', nodes: ['cp_failrisk', 'cp_port', 'cp_station'],
        cypher: `MATCH (r:FailureRisk)-[:ON_PORT]->(p:ChargingPort)
      -[:INSTALLED_ON]->(s:ChargingStation)
WHERE r.probability > 0.6 AND r.horizon_days <= 14
RETURN s.name, p.port_id, r.probability, r.top_signal
ORDER BY r.probability DESC`,
        result: `23 ports above 0.6 (9 above 0.8)\ntop: PORT-88412 0.91 contactor drift · PORT-71553 0.88 comms flap · PORT-90234 0.84 relay wear` },
      { kind: 'sql', title: 'Backtest fault → hard-failure conversion', nodes: ['cp_failrisk', 'cp_fault'],
        cypher: `SELECT risk_band, COUNT(*) AS ports,
       AVG(hard_failure_within_14d::int) AS conversion
FROM   failrisk_backtest
WHERE  scored_at > DATEADD('month', -6, CURRENT_DATE)
GROUP BY 1 ORDER BY 1 DESC`,
        result: `p > 0.8 → 71% fail within 14d · 0.6–0.8 → 44%\n→ ~12 expected hard failures from the 23 flagged` },
      { kind: 'cypher', title: 'Check spare-part stock & lead times', nodes: ['cp_part', 'cp_workorder'],
        cypher: `MATCH (r:FailureRisk)-[:ON_PORT]->(p:ChargingPort)
WHERE r.probability > 0.6
MATCH (pt:SparePart) WHERE pt.sku IN p.likely_parts
RETURN pt.name, pt.warehouse, pt.stock_qty, pt.lead_time_days`,
        result: `DC power module → Reno · 11 in stock · 2d\ncable assembly → Stockton · 26 in stock · 1d\ncontrol board → factory only · 0 regional · 18d lead\n→ 9 of 23 ports fixable with in-region stock` },
      { kind: 'cypher', title: 'Price the cost of ignoring them', nodes: ['cp_warranty', 'cp_session'],
        cypher: `MATCH (w:AssureContract)-[:COVERS]->(s:ChargingStation)
      <-[:INSTALLED_ON]-(p:ChargingPort)
WHERE p.port_id IN $flagged
OPTIONAL MATCH (sess:ChargingSession)-[:DELIVERED_BY]->(p)
WITH w, p, avg(sess.cost) AS avg_rev, count(sess) / 90.0 AS per_day
RETURN sum(w.penalty_accrual_14d) AS penalties, sum(avg_rev * per_day * 14)`,
        result: `Assure penalty accrual (14d) → $54,000\nlost session revenue → ~$11,900 (12 failures × ~$71/day)\ncost to ignore ≈ $66K · fixing the 9 in-stock ports ≈ $8,100` },
    ],
    answer: [
      { kind: 'verdict', text: '23 ports cross the failure threshold within 14 days — ignoring them costs ~$66K, fixing the 9 with in-region parts costs ~$8K.' },
      { kind: 'para', text: 'The failure-risk model flags 23 ports above 0.6 probability on a 14-day horizon, nine of them above 0.8 — led by PORT-88412 at 0.91 on contactor drift[1][2]. The backtest says these scores are earned: over the last six months, ports above 0.8 converted to hard failures 71% of the time, and the 0.6–0.8 band 44%[1] — so expect roughly 12 hard failures from this list if nothing moves.' },
      { kind: 'bullet', text: '**Parts split the list into “now” and “expedite”** — 9 ports need DC power modules or cable assemblies stocked in-region (Reno 2-day, Stockton 1-day)[3]. The other 14 need control boards with zero regional stock and an 18-day factory lead[3].' },
      { kind: 'bullet', text: '**The cost of waiting is asymmetric** — Assure penalty accrual runs $54,000 over the window[4], plus ~$11.9K in lost session revenue (12 failures × ~$71/port/day at 6.2 sessions of $11.40 each)[5]. Fixing the 9 in-stock ports now is ~$8,100 in truck rolls.' },
      { kind: 'para', text: 'The ranked batch: take the nine in-stock ports in probability order first — each visit is cheap and each one averted keeps a whole station inside its Assure commitment[4]. The control-board cohort cannot be fixed faster than its lead time, so the only lever there is starting the clock.' },
      { kind: 'action', text: 'Recommend: (1) dispatch the 9 in-stock ports this week as one batched route, highest probability first[1][3]; (2) place the control-board order today so the 18-day lead starts now[3]; (3) soft-close the highest-risk uncovered ports at off-peak stations to cap penalty accrual while parts are in transit[4].' },
    ],
    sources: [
      { n: 1, node: 'cp_failrisk', ref: 'RSK-90211', detail: '23 ports > 0.6 · 9 above 0.8 · backtest 71% / 44% conversion' },
      { n: 2, node: 'cp_port', ref: 'PORT-88412', detail: 'top risk 0.91 · contactor drift' },
      { n: 3, node: 'cp_part', ref: 'PRT-4407', detail: 'power modules 11 @ Reno (2d) · control boards 0 regional, 18d lead' },
      { n: 4, node: 'cp_warranty', ref: 'ASR-55310', detail: '$54,000 Assure penalty accrual over 14 days' },
      { n: 5, node: 'cp_session', ref: 'SES-33018', detail: 'avg 6.2 sessions/day · $11.40 per session → ~$71/port/day' },
    ],
  },
  truck_rolls: {
    q: "How do I clear the P1 backlog in SoCal with the fewest truck rolls?",
    tag: 'Dispatch · Parts · SLA',
    chain: [
      { kind: 'cypher', title: 'Group open P1 work orders by site', nodes: ['cp_workorder', 'cp_site'],
        cypher: `MATCH (wo:WorkOrder {status:'Open', priority:'P1'})-[:RESOLVES]->(f:FaultAlert)
      -[:RAISED_ON]->(:ChargingPort)-[:INSTALLED_ON]->(s:ChargingStation)
      -[:LOCATED_AT]->(st:Site)
WHERE st.metro IN ['Los Angeles','San Diego','Inland Empire']
RETURN st.name, count(wo) AS orders, min(wo.sla_due_at) AS first_due`,
        result: `31 open P1s across 12 sites\nLong Beach Depot 6 · Anaheim Retail 5 · Ontario Corridor 4 · 9 sites ≤3\nearliest SLA: WO-20871 in 31h · WO-20904 in 40h` },
      { kind: 'cypher', title: 'Match technicians by skill, region & load', nodes: ['cp_tech', 'cp_workorder'],
        cypher: `MATCH (t:Technician)-[:ASSIGNED_TO]->(wo:WorkOrder {status:'Open'})
WHERE t.region = 'SoCal'
RETURN t.name, t.certifications, t.open_orders, t.utilization_pct
ORDER BY t.utilization_pct`,
        result: `7 certified techs in region · 4 carry the Express Plus cert\navg load 4.4 open orders · 2 techs under 60% utilization` },
      { kind: 'sql', title: 'Check part stock against requirements', nodes: ['cp_part'],
        cypher: `SELECT p.part_name, p.warehouse, p.stock_qty, r.required_qty
FROM   part_stock p JOIN wo_part_requirements r ON r.sku = p.sku
WHERE  r.metro = 'SoCal' AND r.priority = 'P1'
ORDER  BY r.required_qty - p.stock_qty DESC`,
        result: `power modules 11 req / 4 stock → short 7 (Reno, 2d)\ncables 18 req / 24 stock ✓ · screens 6 req / 9 stock ✓` },
      { kind: 'semantic', title: 'Retrieve past batched-dispatch outcomes', nodes: ['cp_workorder', 'cp_tech'],
        query: 'outcomes of batching P1 work orders by site and shared part',
        matches: [
          { score: 0.91, text: 'Q1 SoCal batching pilot: 38% fewer truck rolls · SLA hit-rate 99.2%', src: 'ServiceNow' },
          { score: 0.84, text: 'Route-clustering playbook — batch by same-site + same-part', src: 'Knowledge' },
          { score: 0.77, text: 'Post-mortem: split dispatch on Ontario corridor doubled drive time', src: 'ServiceNow' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: '31 open P1s collapse into 9 batched routes — but two orders can\'t wait for the batch, and you\'re 7 power modules short.' },
      { kind: 'para', text: 'SoCal holds 31 open P1 work orders across 12 sites, but the spread is deceptive: Long Beach Depot, Anaheim Retail and Ontario Corridor carry 15 of them[1][4]. Because the fault mix is concentrated too — 55% connector lock, 26% power module[5] — clustering by site and shared part collapses the backlog into 9 routes, the same batching that cut truck rolls 38% in the Q1 pilot while holding SLA hit-rate at 99.2%[1].' },
      { kind: 'bullet', text: '**Two orders must jump the queue** — WO-20871 (31h to SLA breach) and WO-20904 (40h) cannot wait for batch day[1]; send the two under-utilized techs at them today[2].' },
      { kind: 'bullet', text: '**Parts gate the plan, not people** — 7 certified techs can absorb 9 routes, but power modules are 7 short against 11 required[3]; cables and screens are covered. Without the expedite, 4 of the 9 routes go out incomplete and become repeat rolls.' },
      { kind: 'para', text: 'Assignment matters as much as routing: 4 of the 7 techs carry the Express Plus certification the depot sites require[2], so put them on Long Beach and Ontario and let the CT4000-only techs sweep the retail sites.' },
      { kind: 'action', text: 'Recommend: (1) dispatch WO-20871 and WO-20904 today, outside the batch[1][2]; (2) expedite 7 power modules from Reno (2-day) before batch day[3]; (3) run the remaining 29 orders as 9 site-clustered routes over 4 days, Express Plus-certified techs on the depots[2].' },
    ],
    sources: [
      { n: 1, node: 'cp_workorder', ref: 'WO-20871', detail: '31 open P1 · earliest SLA 31h · Q1 batching pilot −38% rolls' },
      { n: 2, node: 'cp_tech', ref: 'TECH-1147', detail: '7 certified techs · 4 Express Plus · 2 under 60% utilization' },
      { n: 3, node: 'cp_part', ref: 'PRT-4407', detail: 'power modules 11 required / 4 in stock → short 7 · Reno 2d' },
      { n: 4, node: 'cp_site', ref: 'SITE-3306', detail: 'Long Beach 6 · Anaheim 5 · Ontario 4 of 31 orders' },
      { n: 5, node: 'cp_fault', ref: 'FLT-84433', detail: 'fault mix: 55% connector lock · 26% power module · 19% comms' },
    ],
  },
  demand_charges: {
    q: "Why did the Fremont depot's demand charges spike 40% and what do we do about it?",
    tag: 'Energy · Tariffs · Load',
    chain: [
      { kind: 'cypher', title: 'Trace the site to its tariff & peak window', nodes: ['cp_site', 'cp_utility', 'cp_tariff'],
        cypher: `MATCH (st:Site {name:'Fremont Depot'})<-[:SERVES]-(u:Utility)
      <-[:OFFERED_BY]-(t:TariffPlan)
RETURN u.name, t.name, t.peak_start, t.peak_end, t.demand_charge_kw`,
        result: `PG&E · BEV-2-S (new filing, eff. Jul 1)\npeak window 16:00–21:00 · demand charge $23.10/kW (was $20.40)` },
      { kind: 'sql', title: 'Find the coincident peak in session data', nodes: ['cp_session'],
        cypher: `SELECT DATE_TRUNC('hour', start_at) AS hr, SUM(peak_kw) AS site_kw
FROM   session_facts
WHERE  site_id = 'SITE-FRE-01' AND month = CURRENT_MONTH
GROUP BY 1 ORDER BY site_kw DESC LIMIT 3`,
        result: `Jul 22 18:00 → 505 kW · Jul 15 17:00 → 498 kW · Jul 29 18:00 → 491 kW\nall three inside the 4–7pm shift-end window (prior monthly high: 410 kW)` },
      { kind: 'cypher', title: 'Read the utilization curve & fleet SoC targets', nodes: ['cp_util', 'cp_fleet', 'cp_vehicle'],
        cypher: `MATCH (u:UtilizationSignal)-[:AT_SITE]->(st:Site {name:'Fremont Depot'})
MATCH (v:Vehicle)-[:OPERATED_BY]->(fl:FleetOperator {name:'BayShore Logistics'})
RETURN u.peak_hour, u.avg_occupancy_pct, count(v) AS vans, fl.soc_target_pct`,
        result: `peak hour 18:00 · occupancy 92% at shift end (34% overnight)\n42 vans · SoC target 90% by 05:30 — all plug in 16:30–18:00` },
      { kind: 'semantic', title: 'Retrieve the utility\'s new rate filing', nodes: ['cp_tariff', 'cp_utility'],
        query: 'PG&E BEV-2-S rate filing changes effective July',
        matches: [
          { score: 0.95, text: 'PG&E BEV-2-S filing: demand charge $20.40 → $23.10/kW eff. Jul 1', src: 'Genability' },
          { score: 0.86, text: 'Advice letter: overnight off-peak kWh cut to $0.14 under BEV-2-S', src: 'Genability' },
          { score: 0.79, text: 'Managed-charging case study: staggered depot charging −31% demand charge', src: 'Knowledge' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'It\'s plug-in coincidence under a new tariff — 42 fleet vans all charge at shift end inside PG&E\'s peak window; stagger them and most of the spike unwinds.' },
      { kind: 'para', text: 'Two things moved at once. PG&E\'s new BEV-2-S filing took effect July 1, lifting the demand charge from $20.40 to $23.10/kW[1][5]. At the same time the depot\'s coincident peak jumped from 410 kW to 505 kW[2] — and all three of the month\'s highest hours land between 4 and 7pm, exactly where the tariff\'s 16:00–21:00 peak window prices demand hardest[1]. Rate ×1.13 compounding with peak ×1.23 is the ~40% bill jump.' },
      { kind: 'bullet', text: '**The peak is behavioral, not load growth** — occupancy hits 92% at shift end against 34% overnight[3]: BayShore\'s 42 vans plug in together between 16:30 and 18:00[4], stacking their draw into one coincident spike.' },
      { kind: 'bullet', text: '**The constraint is soft** — the fleet\'s real requirement is 90% SoC by 05:30[4], which leaves an 11-hour overnight window; nothing about the routes requires charging at 6pm power levels.' },
      { kind: 'para', text: 'Staggered managed charging that spreads the same energy across the overnight window keeps every van at its SoC target while dropping the coincident peak to roughly 330 kW — about $4,000/month less in demand charges at the new rate ((505−330) × $23.10)[1][2], before counting the cheaper $0.14 off-peak kWh BEV-2-S introduces[5].' },
      { kind: 'action', text: 'Recommend: (1) push a staggered charging profile to the Fremont depot — start windows spread 21:00–03:00, SoC targets unchanged[4]; (2) cap site draw at 350 kW during the 16:00–21:00 window[1]; (3) re-run this tariff check across the other PG&E depots — the same filing hits them on their next billing cycle[5].' },
    ],
    sources: [
      { n: 1, node: 'cp_tariff', ref: 'TRF-8802', detail: 'BEV-2-S · peak 16:00–21:00 · $23.10/kW (was $20.40)' },
      { n: 2, node: 'cp_session', ref: 'SES-71204', detail: 'coincident peak 505 kW at 18:00 · prior high 410 kW' },
      { n: 3, node: 'cp_util', ref: 'SIG-4471', detail: '92% occupancy at shift end vs 34% overnight' },
      { n: 4, node: 'cp_fleet', ref: 'FLEET-2041', detail: 'BayShore Logistics · 42 vans · SoC 90% by 05:30' },
      { n: 5, node: 'cp_utility', ref: 'UTIL-PGE', detail: 'PG&E · BEV-2-S filing eff. Jul 1 · off-peak $0.14/kWh' },
    ],
  },
  repair_queue: {
    q: "Which stations need repair right now, and in what order?",
    tag: 'Repairs · Severity · SLA',
    chain: [
      { kind: 'cypher', title: 'Pull active faults with no resolving work order', nodes: ['cp_fault', 'cp_port', 'cp_station'],
        cypher: `MATCH (f:FaultAlert)-[:RAISED_ON]->(p:ChargingPort)
      -[:INSTALLED_ON]->(s:ChargingStation)
WHERE f.cleared_at IS NULL
OPTIONAL MATCH (wo:WorkOrder)-[:RESOLVES]->(f) WHERE wo.status <> 'Closed'
RETURN f.severity, count(DISTINCT s) AS stations, count(wo) AS covered
ORDER BY f.severity`,
        result: `Critical → 9 stations · 3 covered by open WOs\nMajor → 14 stations · 5 covered\nMinor → 15 stations · 2 covered  →  38 stations carry active faults` },
      { kind: 'cypher', title: 'Rank by SLA clock and failure risk', nodes: ['cp_warranty', 'cp_failrisk', 'cp_workorder'],
        cypher: `MATCH (w:AssureContract)-[:COVERS]->(s:ChargingStation)
      <-[:INSTALLED_ON]-(p:ChargingPort)<-[:RAISED_ON]-(f:FaultAlert)
WHERE f.severity = 'Critical' AND f.cleared_at IS NULL
OPTIONAL MATCH (r:FailureRisk)-[:ON_PORT]->(p)
RETURN s.name, w.sla_due_at, r.probability
ORDER BY w.sla_due_at`,
        result: `6 of 9 critical stations under Assure · SLA due < 24h\nFremont Depot — Bay 4 due in 9h · Santana Row P2 due in 14h\n3 of the 6 already have technicians assigned` },
      { kind: 'sql', title: 'Price the downtime per station-day', nodes: ['cp_session', 'cp_site'],
        cypher: `SELECT s.site_name, AVG(f.sessions_per_day) AS lost_sessions,
       AVG(f.sessions_per_day * f.avg_revenue) AS lost_rev_day
FROM   station_down_facts f JOIN dim_site s ON s.id = f.site_id
WHERE  f.status = 'down' GROUP BY 1 ORDER BY lost_rev_day DESC LIMIT 5`,
        result: `Fremont Depot → $540/day · SFO Lot A → $470/day\nSantana Row → $410/day · Mission St → $360/day · Milpitas → $310/day` },
      { kind: 'cypher', title: 'Check parts availability for each repair', nodes: ['cp_part', 'cp_workorder'],
        cypher: `MATCH (pt:SparePart) WHERE pt.sku IN $needed_skus
RETURN pt.name, pt.warehouse, pt.stock_qty, pt.lead_time_days`,
        result: `Contactor 400A → Fremont DC · 11 in stock · same-day\nPower Module 62.5kW → Fremont DC · 4 in stock · same-day\nTouchscreen 10in → Reno DC · 6 in stock · 2-day transfer\n→ parts in-region for 7 of 9 critical repairs` },
    ],
    answer: [
      { kind: 'verdict', text: 'Nine stations need repair now — six are SLA-critical inside 24 hours, and seven of the nine can be fixed with parts already in-region.' },
      { kind: 'para', text: 'The graph shows 38 stations carrying active faults, but severity and SLA clocks compress the real queue to nine[1]. In priority order:' },
      { kind: 'list', n: 1, text: '**Fremont Depot — Bay 4** — contactor weld (E-341) · SLA due 9h · $540/day downtime[2][3] · part in Fremont DC' },
      { kind: 'list', n: 2, text: '**Santana Row P2** — power module reset loop · SLA due 14h · part in Fremont DC[2]' },
      { kind: 'list', n: 3, text: '**SFO Long-Term Lot A** — meter comms failure (E-102) · $470/day · high failure-risk overlay[3]' },
      { kind: 'list', n: 4, text: '**Mission St Garage** — ground fault trip (E-108) · SLA due 21h · $360/day[3]' },
      { kind: 'list', n: 5, text: '**Milpitas Great Mall** — cellular link lost (E-220) · SLA due 23h · $310/day[3]' },
      { kind: 'list', n: 6, text: '**Remaining 4 critical stations** — no SLA clock inside 24h · sequence by failure-risk score, incl. the two touchscreen repairs waiting on a 2-day Reno transfer[4]' },
      { kind: 'bullet', text: '**Parts are not the bottleneck** — contactors and power modules are in Fremont DC same-day for 7 of 9 repairs[4]; only the touchscreen repairs wait on Reno, and neither is SLA-critical.' },
      { kind: 'bullet', text: '**Only 3 of the 9 have an open work order** — six need one raised now[1]; 4 co-located Major repairs can ride along at zero extra truck rolls[5].' },
      { kind: 'action', text: 'Recommend: (1) raise work orders on the 6 uncovered critical stations now[1]; (2) dispatch in the order above with parts picked from Fremont DC[4]; (3) fold the 4 co-located Major repairs into the same visits; (4) start the Reno touchscreen transfer today so next week\'s visits aren\'t blocked.' },
    ],
    sources: [
      { n: 1, node: 'cp_fault', ref: 'FLT-99411', detail: '9 Critical · 14 Major · 15 Minor active · 6 critical uncovered' },
      { n: 2, node: 'cp_warranty', ref: 'ASR-55344', detail: '6 stations SLA due < 24h · Fremont 9h · Santana Row 14h' },
      { n: 3, node: 'cp_site', ref: 'SITE-2214', detail: 'Downtime cost $310–$540 per station-day, top 5 sites' },
      { n: 4, node: 'cp_part', ref: 'PRT-3306', detail: 'Contactor + power module in Fremont DC same-day · screens 2d Reno' },
      { n: 5, node: 'cp_workorder', ref: 'WO-21440', detail: '3 of 9 critical covered · 4 Major repairs co-located' },
    ],
  },
  pm_schedule: {
    q: "What preventive maintenance is due in the next 30 days — and should the schedule change?",
    tag: 'Preventive · Wear · Scheduling',
    chain: [
      { kind: 'cypher', title: 'Find calendar-due stations', nodes: ['cp_station', 'cp_site'],
        cypher: `MATCH (s:ChargingStation)-[:LOCATED_AT]->(st:Site)
WHERE duration.between(s.last_service_at, date()).days > 150
RETURN st.name, count(s) AS due, min(s.last_service_at) AS oldest
ORDER BY due DESC`,
        result: `46 stations calendar-due in the next 30 days\nheaviest: SFO Lot A (7) · Fremont Depot (6) · Milpitas Great Mall (5)` },
      { kind: 'sql', title: 'Overlay actual wear against fleet medians', nodes: ['cp_port', 'cp_session'],
        cypher: `SELECT s.station_id,
       w.contactor_cycles / m.median_cycles AS cycle_ratio,
       w.cable_insertions / m.median_insert AS wear_ratio,
       w.overtemp_events_90d
FROM   wear_facts w JOIN fleet_medians m ON m.model = w.model
JOIN   dim_station s ON s.id = w.station_id
WHERE  s.calendar_due = TRUE ORDER BY cycle_ratio DESC`,
        result: `12 of 46 show accelerated wear (≥1.6× median cycles)\n9 of 46 show minimal wear (≤0.4× median) — barely used\n25 in the normal band` },
      { kind: 'semantic', title: 'Check OEM cadence guidance', nodes: ['cp_station'],
        query: 'CT4000 Express Plus preventive maintenance interval guidance',
        matches: [
          { score: 0.92, text: '“SB-2311: move CT4000 PM to usage-based — 8k contactor cycles or 12 months” — service bulletin', src: 'Firmware OTA' },
          { score: 0.85, text: 'Coastal sites: add corrosion inspection at every PM visit', src: 'ServiceNow' },
          { score: 0.77, text: 'Express Plus cable-liner replacement moved to 15k insertions', src: 'Firmware OTA' },
        ] },
      { kind: 'cypher', title: 'Overlap PM with already-planned visits', nodes: ['cp_workorder', 'cp_tech'],
        cypher: `MATCH (wo:WorkOrder)-[:RESOLVES]->(:FaultAlert)-[:RAISED_ON]->(:ChargingPort)
      -[:INSTALLED_ON]->(s:ChargingStation)-[:LOCATED_AT]->(st:Site)
WHERE wo.status IN ['Open','Dispatched'] AND st.id IN $pm_due_sites
RETURN st.name, count(wo) AS visits_in_window`,
        result: `17 of 46 due stations sit at sites with a repair visit already scheduled\nin the next 30 days — PM can ride along at zero extra rolls` },
    ],
    answer: [
      { kind: 'verdict', text: '46 stations are calendar-due, but the wear data says the calendar is wrong — 12 need attention early, 9 can safely wait a quarter, and 17 can ride along with visits you\'ve already planned.' },
      { kind: 'para', text: 'The 30-day calendar queue is 46 stations[1], concentrated at SFO Lot A, Fremont Depot and Milpitas. But wear telemetry splits that queue three ways: 12 stations are running at 1.6× or more of median contactor cycles and should be serviced early, while 9 are barely used and can slip a quarter without risk[2].' },
      { kind: 'bullet', text: '**The schedule should change** — the OEM bulletin SB-2311 already recommends usage-based PM (8k contactor cycles or 12 months, whichever first)[3]. Your own wear data supports it: calendar-only scheduling is over-servicing idle stations and under-servicing the busy ones.' },
      { kind: 'bullet', text: '**17 free ride-alongs** — 17 of the 46 due stations sit at sites with a repair visit already scheduled this window[4]; folding PM into those visits clears more than a third of the queue at zero extra truck rolls.' },
      { kind: 'para', text: 'Net effect: instead of 46 standalone PM visits, the graph supports a 29-visit plan — 12 early (wear-driven), 17 folded into existing routes, and the 9 low-wear stations deferred with telemetry watching them[2]. Coastal sites get the corrosion check added per the bulletin[3].' },
      { kind: 'action', text: 'Recommend: (1) approve the switch to usage-based cadence per SB-2311[3]; (2) schedule the 12 high-wear stations this week; (3) attach PM tasks to the 17 overlapping repair visits[4]; (4) defer the 9 low-wear stations to next quarter with a telemetry watch.' },
    ],
    sources: [
      { n: 1, node: 'cp_station', ref: 'STA-514332', detail: '46 calendar-due · SFO 7, Fremont 6, Milpitas 5' },
      { n: 2, node: 'cp_port', ref: 'PORT-90233', detail: '12 at ≥1.6× median cycles · 9 at ≤0.4× — defer-safe' },
      { n: 3, node: 'cp_station', ref: 'STA-860881', detail: 'SB-2311 usage-based cadence · coastal corrosion check' },
      { n: 4, node: 'cp_workorder', ref: 'WO-21502', detail: '17 due stations overlap scheduled repair visits' },
      { n: 5, node: 'cp_site', ref: 'SITE-3320', detail: '29-visit plan vs 46 standalone — 37% fewer rolls' },
    ],
  },
  oee_drop: {
    q: "Why did OEE drop at Lavonia this month?",
    tag: 'OEE · Downtime · Shifts',
    chain: [
      { kind: 'cypher', title: 'Decompose OEE line by line', nodes: ['gr_plant', 'gr_line', 'gr_oee'],
        cypher: `MATCH (p:Plant {name:'Lavonia GA — Steel Drum'})-[:HAS_LINE]->(l:Line)
      -[:SCORED_BY]->(o:OEEMetric {period:'MTD'})
RETURN l.name, o.oee, o.availability, o.performance, o.quality, o.prior_oee
ORDER BY o.oee`,
        result: `Line 3 → 71.2%  (avail 74.1 · perf 96.8 · qual 99.3)   prior 78.4%\nLine 1 → 79.1% · Line 2 → 80.3% · Line 4 → 78.8%  (all flat vs prior)` },
      { kind: 'sql', title: 'Split Line 3 downtime by asset and shift', nodes: ['gr_downtime', 'gr_asset', 'gr_shift'],
        cypher: `SELECT a.asset_id, d.shift, SUM(d.minutes) AS min, COUNT(*) AS events
FROM   downtime_facts d JOIN dim_asset a ON a.id = d.asset_id
WHERE  d.line_id = 'LN-LAV-03' AND d.month = CURRENT_MONTH
GROUP BY 1, 2 ORDER BY min DESC`,
        result: `PRESS-04 · B-shift → 1,002 min / 154 events (micro-stops < 4 min)\nPRESS-04 · A-shift →   408 min /  64 events\nchangeover, all assets · B-shift → 840 min\nremaining assets → 400 min   →  2,650 lost minutes` },
      { kind: 'semantic', title: 'Retrieve asset condition history', nodes: ['gr_asset', 'gr_maint'],
        query: 'PRESS-04 seamer vibration and bearing condition at Lavonia',
        matches: [
          { score: 0.94, text: 'PRESS-04 seamer spindle vibration 6.1 mm/s vs 2.8 baseline, rising 6 weeks', src: 'PI Historian' },
          { score: 0.88, text: 'Notification 10442318 “seamer bearing noise, chuck run-out” — deferred twice', src: 'SAP Plant Maintenance' },
          { score: 0.80, text: 'Micro-stop signature: seam-fault trip then auto-restart, 4 of 5 on B-shift', src: 'MES' },
        ] },
      { kind: 'cypher', title: 'Tie changeover creep to crew certification', nodes: ['gr_shift', 'gr_operator', 'gr_training'],
        cypher: `MATCH (s:Shift)<-[:WORKED_ON]-(op:Operator)-[:CERTIFIED_BY]->(t:Training)
MATCH (s)-[:RAN]->(r:ProductionRun {line:'LN-LAV-03'})
RETURN s.code, avg(r.changeover_min) AS co, count(DISTINCT op) AS crew,
       sum(CASE WHEN t.status <> 'Current' THEN 1 ELSE 0 END) AS gaps`,
        result: `B-shift → 62 min avg changeover · 14 operators · 5 without full seamer cert\nA-shift → 41 min avg changeover · 13 operators · 0 gaps\n9 of the 14 B-shift operators are inside their first 90 days` },
    ],
    answer: [
      { kind: 'verdict', text: 'OEE fell 7.2 points on Line 3 alone — it is an availability loss on B-shift, not a speed loss, and it resolves to one seamer plus one under-certified crew.' },
      { kind: 'para', text: "Lavonia's decline is not plant-wide. Lines 1, 2 and 4 are flat; Line 3 moved 78.4% → 71.2%[1]. The decomposition is what matters: performance still runs 96.8% and quality 99.3%[1], so when the line runs it runs at rate and makes good drums. Availability carries the entire loss, 82.6% → 74.1%[1] — 2,650 minutes the line was scheduled and not producing[2]." },
      { kind: 'bullet', text: '**PRESS-04 micro-stops — 1,410 minutes across 218 events**[2], 71% of them on B-shift. These are sub-four-minute seam-fault trips with auto-restart, so they never open a work order and never show up as a breakdown. The asset data says why: seamer spindle vibration is at 6.1 mm/s against a 2.8 baseline and has been climbing for six weeks, and the SAP PM notification for bearing noise has been deferred twice[3].' },
      { kind: 'bullet', text: '**Changeover creep — 840 minutes**[2]. B-shift averages 62 minutes per changeover against A-shift\'s 41[4]. That crew turned over: 9 of 14 operators are inside their first 90 days and 5 are running the seamer without full certification[5].' },
      { kind: 'bullet', text: '**Not a material or demand problem** — quality held at 99.3%[1] and no coil-related stops appear in the downtime record[2], so the loss is entirely on the plant floor.' },
      { kind: 'para', text: 'Sizing it: 2,650 minutes at Line 3\'s nine 55gal Tight-Head Steel Drums per minute is roughly **23,800 drums** not made, about **$152K of contribution margin** at $6.40 per drum[1][2]. Roughly 85% of that sits in the two causes above, both of which are fixable inside the next two weeks.' },
      { kind: 'action', text: 'Recommend: (1) pull PRESS-04 into this weekend\'s planned outage and replace the seamer bearing and chuck before the vibration trend converts into a hard failure[3]; (2) restrict the 5 uncertified operators to supervised changeovers and pair them with A-shift leads until sign-off[5]; (3) set a 4.5 mm/s vibration alert on PRESS-04 so the next drift raises a notification instead of 218 micro-stops[3].' },
    ],
    sources: [
      { n: 1, node: 'gr_oee', ref: 'OEE-LAV-L3', detail: 'Line 3 OEE 71.2% vs 78.4% · availability 74.1 · performance 96.8 · quality 99.3' },
      { n: 2, node: 'gr_downtime', ref: 'DT-44821', detail: '2,650 lost min · PRESS-04 1,410 (218 events) · changeover 840' },
      { n: 3, node: 'gr_asset', ref: 'AST-PRESS-04', detail: 'Seamer vibration 6.1 mm/s vs 2.8 baseline · notification 10442318 deferred 2×' },
      { n: 4, node: 'gr_shift', ref: 'SHF-LAV-B', detail: 'B-shift changeover 62 min avg vs A-shift 41 min' },
      { n: 5, node: 'gr_training', ref: 'TRN-9902', detail: '5 of 14 B-shift operators without full seamer certification · 9 under 90 days' },
    ],
  },
  downtime_pareto: {
    q: "Where is unplanned downtime actually costing us the most across the network?",
    tag: 'Downtime · Cost · Network',
    chain: [
      { kind: 'cypher', title: 'Rank assets by unplanned minutes network-wide', nodes: ['gr_plant', 'gr_asset', 'gr_downtime'],
        cypher: `MATCH (pl:Plant)-[:HAS_LINE]->(:Line)-[:USES_ASSET]->(a:Asset)
      <-[:ON_ASSET]-(d:DowntimeEvent {classification:'Unplanned'})
WHERE d.started_at > date('2026-01-01')
RETURN pl.name, a.asset_id, sum(d.minutes) AS min ORDER BY min DESC LIMIT 6`,
        result: `Mount Vernon OH — URB Mill · DRYER-02 → 26,800\nMount Vernon OH — URB Mill · DRYER-05 → 21,300\nRiverville VA — Containerboard · WINDER-03 → 18,900\nLavonia GA — Steel Drum · PRESS-04 → 16,200\nDiadema BR — Plastic Drum · BLOW-07 → 14,100\nTaicang CN — IBC · CAGE-WELD-02 → 12,600\n214 plants · 268,000 unplanned min YTD  →  top 6 = 109,900 (41%)` },
      { kind: 'sql', title: 'Reprice the minutes by cost of downtime', nodes: ['gr_plant', 'gr_cts'],
        cypher: `SELECT p.business, p.plant_name, c.cost_per_down_min,
       SUM(d.minutes) * c.cost_per_down_min AS cost
FROM   downtime_facts d JOIN dim_plant p ON p.id = d.plant_id
JOIN   plant_cost_rates c ON c.plant_id = p.id
WHERE  d.asset_id IN (SELECT asset_id FROM top_unplanned_assets)
GROUP  BY 1, 2, 3 ORDER BY cost DESC`,
        result: `URB Mill $41/min · Containerboard $37/min · IBC $22/min · Steel Drum $18/min · Plastic Drum $15/min\ntop-6 cost = $3.45M YTD  →  the two Mount Vernon dryers = $1.97M (57%)` },
      { kind: 'cypher', title: 'Contrast planned vs unplanned mix', nodes: ['gr_maint', 'gr_dtrisk'],
        cypher: `MATCH (a:Asset)<-[:ON_ASSET]-(d:DowntimeEvent)
OPTIONAL MATCH (a)<-[:TARGETS]-(m:MaintenanceOrder)
RETURN a.cohort, sum(CASE WHEN d.classification='Planned' THEN d.minutes END) AS planned,
       sum(CASE WHEN d.classification='Unplanned' THEN d.minutes END) AS unplanned`,
        result: `network → 61% planned / 39% unplanned\ntop-6 assets → 34% planned / 66% unplanned (inverted)` },
      { kind: 'semantic', title: 'Retrieve the maintenance backlog narrative', nodes: ['gr_maint'],
        query: 'deferred maintenance orders on URB dryer sections and winders',
        matches: [
          { score: 0.92, text: '38 maintenance orders deferred past due date; 14 sit on the top-6 assets', src: 'SAP Plant Maintenance' },
          { score: 0.85, text: 'Mount Vernon dryer section 2 — “felt and bearing rebuild deferred to next annual outage”', src: 'SAP Plant Maintenance' },
          { score: 0.76, text: 'Reliability review: dryer draw variation drives sheet breaks on URB 0.024 Caliper', src: 'MES' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Six assets out of roughly nineteen hundred carry 41% of unplanned minutes — and once you price the minutes, two dryer sections at Mount Vernon carry 57% of the cost.' },
      { kind: 'para', text: 'Across 214 plants the network lost 268,000 unplanned minutes year to date, and 109,900 of them — 41% — came from six assets[1]. That concentration is the whole finding: the remaining 59% is spread thinly enough that no single intervention touches it, while the top six are addressable with a named list of work.' },
      { kind: 'para', text: 'Ranking by minutes alone is misleading, because a lost minute is not worth the same everywhere: a URB mill minute costs $41 against $18 on a steel drum line[3]. Repriced, the top six cost **$3.45M year to date**[3]:' },
      { kind: 'list', n: 1, text: '**Mount Vernon OH — URB Mill · DRYER-02 + DRYER-05** — 48,100 min · **$1.97M**[1][2]. Two dryer sections, one mill, 44% of the top-6 minutes and 57% of the top-6 cost.' },
      { kind: 'list', n: 2, text: '**Riverville VA — Containerboard · WINDER-03** — 18,900 min · $699K[1][3]' },
      { kind: 'list', n: 3, text: '**Diadema BR · BLOW-07 and Taicang CN · CAGE-WELD-02** — 26,700 min combined · $489K[1][3]' },
      { kind: 'list', n: 4, text: '**Lavonia GA — Steel Drum · PRESS-04** — 16,200 min · $292K[1][3] — the same seamer driving the Lavonia OEE decline.' },
      { kind: 'bullet', text: '**The mix is inverted on exactly these assets** — the network runs 61% planned / 39% unplanned downtime, but the top six run 34% / 66%[5]. They are not being maintained on a plan; they are being reacted to.' },
      { kind: 'bullet', text: '**The backlog explains it** — 38 maintenance orders are deferred past due, and 14 of them sit on these six assets, including the Mount Vernon dryer felt-and-bearing rebuild pushed to the next annual outage[4].' },
      { kind: 'action', text: 'Recommend: (1) fund the DRYER-02 and DRYER-05 rebuild into the next Mount Vernon outage rather than deferring again — it is the single largest cost item in the network[2][4]; (2) release the 14 deferred orders on the top-6 assets and block further deferral without COO sign-off[4]; (3) re-rank the reliability capital list on cost-per-minute rather than minute count, which moves the URB and containerboard assets above the drum lines[3].' },
    ],
    sources: [
      { n: 1, node: 'gr_downtime', ref: 'DT-NET-YTD', detail: '268,000 unplanned min across 214 plants · top 6 assets = 109,900 (41%)' },
      { n: 2, node: 'gr_asset', ref: 'AST-MV-DRYER-02', detail: 'Mount Vernon DRYER-02 + DRYER-05 · 48,100 min · $1.97M' },
      { n: 3, node: 'gr_plant', ref: 'PLT-MTVERNON-URB', detail: 'URB $41/min · containerboard $37 · IBC $22 · steel drum $18 · top-6 cost $3.45M' },
      { n: 4, node: 'gr_maint', ref: 'MO-77410', detail: '38 maintenance orders deferred past due · 14 on the top-6 assets' },
      { n: 5, node: 'gr_dtrisk', ref: 'DTR-1180', detail: 'Top-6 planned/unplanned 34/66 vs network 61/39' },
    ],
  },
  changeover_loss: {
    q: "How much capacity are we losing to changeovers, and where should we fix it first?",
    tag: 'Changeover · Scheduling · Capacity',
    chain: [
      { kind: 'cypher', title: 'Split scheduled time into run, changeover and downtime', nodes: ['gr_line', 'gr_run'],
        cypher: `MATCH (l:Line)<-[:RAN_ON]-(r:ProductionRun)
WHERE l.business = 'Global Industrial Packaging' AND r.quarter = 'Q3'
RETURN l.name, sum(r.run_min) AS run, sum(r.changeover_min) AS co,
       sum(r.changeover_min) * 1.0 / sum(r.scheduled_min) AS co_share
ORDER BY co_share DESC`,
        result: `6 highest-mix drum & IBC lines → run 236,000 min · changeover 41,600 min (15.0%)\nLavonia GA Line 3 → 18.9%  ·  Diadema BR Line 2 → 17.4%  ·  Taicang CN Line 1 → 15.8%` },
      { kind: 'sql', title: 'Profile order size against changeover count', nodes: ['gr_sku', 'gr_orderline'],
        cypher: `SELECT CASE WHEN order_qty < 4000 THEN 'short run' ELSE 'campaign' END AS band,
       COUNT(*) AS orders, SUM(changeovers) AS cos, AVG(order_qty) AS avg_qty
FROM   production_order_facts
WHERE  quarter = 'Q3' AND line_group = 'DRUM'
GROUP  BY 1`,
        result: `short run (<4,000) → 41% of orders · 63% of changeovers · avg 1,780 drums\ncampaign (≥4,000) → 59% of orders · 37% of changeovers · avg 11,400 drums\n182 active drum SKUs; 61 of them ran once in the quarter` },
      { kind: 'semantic', title: 'Retrieve sequencing practice for high-mix drum lines', nodes: ['gr_line', 'gr_sku'],
        query: 'colour and closure family sequencing to cut drum line changeover time',
        matches: [
          { score: 0.91, text: 'Light-to-dark colour sequencing removes full wash-out: 78 min → 34 min per change', src: 'MES' },
          { score: 0.84, text: 'Blue Yonder sequencing rule set — group by closure family before colour', src: 'Blue Yonder' },
          { score: 0.75, text: 'Kinaxis scenario: campaign length +40% raises finished-goods cover 1.8 days', src: 'Kinaxis' },
        ] },
      { kind: 'cypher', title: 'Simulate colour and closure sequencing', nodes: ['gr_forecast', 'gr_oee'],
        cypher: `MATCH (r:ProductionRun)-[:PRODUCED]->(s:SKU)
WITH s.colour AS col, s.closure_family AS fam, count(r) AS changes,
     avg(r.changeover_min) AS cur
RETURN col, fam, changes, cur, cur - 44 AS sequenced`,
        result: `380 colour changes per quarter · avg 78 min → 34 min when sequenced light-to-dark\nrecoverable ≈ 16,720 min/qtr  →  ~150,000 drums  →  ~$960K contribution` },
    ],
    answer: [
      { kind: 'verdict', text: 'Changeovers eat 15% of scheduled time on the six highest-mix lines — sequencing by colour and closure family gives back roughly 150,000 drums a quarter without touching a single asset.' },
      { kind: 'para', text: 'Last quarter those six lines ran 236,000 productive minutes and spent another 41,600 changing over — 15.0% of scheduled time[1]. Lavonia Line 3 is worst at 18.9%[3]. This is a scheduling loss, not a reliability loss: the lines are healthy, they are simply being asked to change too often.' },
      { kind: 'para', text: 'The driver is SKU proliferation at the short end. Orders under 4,000 drums are 41% of the order count but consume **63% of all changeovers**[2], averaging 1,780 drums each — and 61 of the 182 active drum SKUs ran exactly once in the quarter[2]. Every one of those single-run SKUs buys a full changeover.' },
      { kind: 'bullet', text: '**Colour is the expensive dimension** — a change into a lighter colour forces a full wash-out at 78 minutes, while sequencing light-to-dark drops the same change to 34[4]. Across 380 colour changes a quarter that is 44 minutes each, or **16,720 minutes** recovered[4].' },
      { kind: 'bullet', text: '**Closure family is the cheap dimension** — grouping tight-head and open-head work before colour avoids the tooling swap entirely and costs nothing but sequence discipline[4].' },
      { kind: 'bullet', text: '**Recovered capacity, not saved cost** — 16,720 minutes at nine drums a minute is roughly 150,000 drums per quarter, about **$960K of contribution margin**, and it lands as 6.2 points of availability back on these lines[5].' },
      { kind: 'para', text: 'Where to start is settled by concentration, not by percentage: Lavonia Line 3 (5,200 recoverable minutes), Diadema Line 2 (4,400) and Taicang Line 1 (3,100) hold 76% of the opportunity[1][4]. The remaining three lines are worth doing but only after the sequencing rules are proven.' },
      { kind: 'action', text: 'Recommend: (1) turn on colour-then-closure sequencing rules in the scheduler for Lavonia Line 3 first, measure for two cycles, then roll to Diadema and Taicang[4]; (2) set a 4,000-drum minimum run and consolidate the 61 single-run SKUs into scheduled campaign slots[2]; (3) accept the trade explicitly — longer campaigns raise finished-goods cover by about 1.8 days, which is cheap against $960K a quarter[4].' },
    ],
    sources: [
      { n: 1, node: 'gr_run', ref: 'RUN-Q3-DRUM', detail: '41,600 changeover min vs 236,000 run min across 6 lines (15.0%)' },
      { n: 2, node: 'gr_sku', ref: 'SKU-55TH-STL', detail: 'Short runs = 41% of orders, 63% of changeovers · 61 of 182 SKUs ran once' },
      { n: 3, node: 'gr_line', ref: 'LN-LAV-03', detail: 'Lavonia Line 3 · 18.9% of scheduled time in changeover — worst of the six' },
      { n: 4, node: 'gr_forecast', ref: 'FC-SEQ-Q4', detail: '380 colour changes/qtr · 78 → 34 min sequenced · 16,720 min recovered' },
      { n: 5, node: 'gr_oee', ref: 'OEE-DRUM-Q3', detail: '6.2 pts availability drag from changeover · ~150,000 drums ≈ $960K/qtr' },
    ],
  },
  resin_exposure: {
    q: "What's our exposure if HDPE resin tightens next quarter?",
    tag: 'Raw Material · Supply Risk',
    chain: [
      { kind: 'cypher', title: 'Read days of cover by plant', nodes: ['gr_material', 'gr_inventory', 'gr_plant'],
        cypher: `MATCH (m:Material {name:'HDPE Resin — Blow Grade'})<-[:OF_MATERIAL]-(i:Inventory)
      -[:HELD_AT]->(p:Plant)
RETURN p.name, i.on_hand_lb, i.days_of_cover, i.policy_min_days
ORDER BY i.days_of_cover`,
        result: `Diadema BR — Plastic Drum →  9 days  (policy 25)\nBaton Rouge LA — Plastic Drum → 14 days  (policy 25)\nTaicang CN — IBC → 21 days  (policy 25)\nnetwork median 18 days · 3 of 7 resin plants below half of policy` },
      { kind: 'sql', title: 'Measure supplier concentration on blow grade', nodes: ['gr_supplier', 'gr_po'],
        cypher: `SELECT s.supplier_name, SUM(po.volume_lb) AS lb,
       SUM(po.volume_lb) / SUM(SUM(po.volume_lb)) OVER () AS share
FROM   purchase_orders po JOIN dim_supplier s ON s.id = po.supplier_id
WHERE  po.material = 'HDPE Resin — Blow Grade' AND po.year = 2026
GROUP  BY 1 ORDER BY lb DESC`,
        result: `LyondellBasell → 68% of blow-grade volume\nsecondary sources → 22% · spot → 10%\n3 of 7 plastic plants are single-sourced to LyondellBasell (incl. Diadema BR)` },
      { kind: 'semantic', title: 'Retrieve market and index signals', nodes: ['gr_index', 'gr_supplyrisk'],
        query: 'HDPE blow grade price direction and Gulf Coast supply next quarter',
        matches: [
          { score: 0.95, text: 'HDPE blow moulding grade index +11.4% over 60 days; +6–9% forecast for Q4', src: 'Fastmarkets' },
          { score: 0.87, text: 'Two Gulf Coast cracker turnarounds scheduled in the quarter — allocation risk noted', src: 'Kinaxis' },
          { score: 0.79, text: 'Braskem qualified as approved blow-grade vendor for Diadema, never volumed', src: 'SAP Ariba' },
        ] },
      { kind: 'cypher', title: 'Trace exposed SKUs through to customers', nodes: ['gr_sku', 'gr_order', 'gr_customer'],
        cypher: `MATCH (m:Material {name:'HDPE Resin — Blow Grade'})<-[:CONSUMES]-(s:SKU)
      <-[:FOR_SKU]-(ol:OrderLine)-[:ON_ORDER]->(:Order)-[:FOR_CUSTOMER]->(c:Customer)
RETURN s.name, c.name, sum(ol.revenue) AS rev ORDER BY rev DESC`,
        result: `275gal Composite IBC → Nutrien Ag Solutions · $8.9M/qtr\n55gal Tight-Head Plastic Drum → Shell Lubricants · $6.1M/qtr\n30gal Open-Head Plastic Drum → BASF Coatings · $3.4M/qtr   →  $18.4M exposed` },
    ],
    answer: [
      { kind: 'verdict', text: 'A six-week tightening costs about 41,000 units of output and puts $18.4M of quarterly revenue at risk — and the reason is concentration, not price.' },
      { kind: 'para', text: 'Cover is already thin before anything happens. Diadema BR sits at 9 days against a 25-day policy minimum, Baton Rouge at 14 and Taicang at 21[1]; three of seven resin-consuming plants are below half of policy. The Fastmarkets blow-grade index is up 11.4% in 60 days with another 6–9% forecast for the quarter, and two Gulf Coast cracker turnarounds fall inside the same window[3].' },
      { kind: 'bullet', text: '**Concentration is the real exposure** — LyondellBasell supplies 68% of blow-grade volume, and three plants including Diadema are single-sourced to them[2]. Price is survivable and passes through on contract; an allocation letter to a single-sourced plant is not.' },
      { kind: 'bullet', text: '**Modelled impact** — a six-week tightening at current cover leaves the network roughly **41,000 IBC and drum equivalents short**, with a risk score of 0.82 concentrated on Diadema and Baton Rouge[4].' },
      { kind: 'bullet', text: '**Where it lands commercially** — the shortfall maps to three customers: Nutrien Ag Solutions on the 275gal Composite IBC ($8.9M/qtr), Shell Lubricants on the 55gal Tight-Head Plastic Drum ($6.1M), BASF Coatings on the 30gal Open-Head ($3.4M) — **$18.4M of quarterly revenue**[5]. Nutrien is the acute one: it is single-plant, single-material and inside its ag season.' },
      { kind: 'bullet', text: '**A second source already exists on paper** — Braskem is qualified in Ariba for Diadema blow grade but has never taken volume[3]. The qualification work is done; only the commercial trial is missing.' },
      { kind: 'para', text: 'The two levers behave differently. Rebuilding cover to policy at Diadema and Baton Rouge costs working capital now and buys time; volumeing the second source costs a price premium and buys optionality. Given a 0.82 risk score against $18.4M, both are cheap.' },
      { kind: 'action', text: 'Recommend: (1) rebuild Diadema and Baton Rouge to the 25-day policy minimum before the turnaround window opens[1]; (2) place a trial order with Braskem at Diadema this month so the second source is live rather than qualified[3]; (3) fix pricing on the LyondellBasell base volume through Q4 against the +6–9% index forecast[3]; (4) give Nutrien early visibility on the 275gal IBC — it is the single largest exposed line[5].' },
    ],
    sources: [
      { n: 1, node: 'gr_inventory', ref: 'INV-HDPE-BR', detail: 'Diadema 9 days · Baton Rouge 14 · Taicang 21 vs 25-day policy' },
      { n: 2, node: 'gr_supplier', ref: 'SUP-LYB', detail: 'LyondellBasell 68% of blow-grade volume · 3 plants single-sourced' },
      { n: 3, node: 'gr_index', ref: 'IDX-FM-HDPE', detail: 'Fastmarkets blow grade +11.4% in 60d · +6–9% Q4 · 2 cracker turnarounds' },
      { n: 4, node: 'gr_supplyrisk', ref: 'SRK-2207', detail: 'Exposure score 0.82 · 6-week tightening → ~41,000 units short' },
      { n: 5, node: 'gr_customer', ref: 'CUST-NUTRIEN', detail: 'Nutrien $8.9M · Shell Lubricants $6.1M · BASF Coatings $3.4M per quarter' },
    ],
  },
  otif_miss: {
    q: "Why did OTIF slip below 94% for Dow Chemical last quarter?",
    tag: 'OTIF · Logistics · Quality',
    chain: [
      { kind: 'cypher', title: 'Measure OTIF at the order-line level', nodes: ['gr_customer', 'gr_order', 'gr_otif'],
        cypher: `MATCH (c:Customer {name:'Dow Chemical'})<-[:FOR_CUSTOMER]-(o:Order)
      -[:HAS_LINE]->(ol:OrderLine)-[:MEASURED_BY]->(m:OTIFMetric {quarter:'Q3'})
RETURN m.otif_pct, m.target_pct, count(ol) AS lines,
       sum(CASE WHEN ol.on_time = false THEN 1 ELSE 0 END) AS missed`,
        result: `91.6% actual vs 94.0% target · 1,842 order lines · 155 missed\nsplit: 98 late · 57 short-shipped` },
      { kind: 'sql', title: 'Bucket the misses by root cause', nodes: ['gr_orderline', 'gr_otif'],
        cypher: `SELECT root_cause, COUNT(*) AS lines, AVG(days_late) AS avg_late
FROM   otif_miss_facts
WHERE  customer = 'Dow Chemical' AND quarter = 'Q3'
GROUP  BY 1 ORDER BY lines DESC`,
        result: `quality hold — closure torque → 61 lines · 6.2d avg\ncarrier tender rejection → 48 lines · 3.1d avg\ndemand above forecast → 39 lines · 4.4d avg\ndocumentation / other → 7 lines   →  155 total` },
      { kind: 'cypher', title: 'Inspect carrier behaviour on the shipping lane', nodes: ['gr_carrier', 'gr_lane', 'gr_outbound'],
        cypher: `MATCH (l:Lane {code:'LANE-LAV-FRPT'})<-[:SHIPS_ON]-(s:OutboundShipment)
      -[:TENDERED_TO]->(ca:Carrier)
RETURN ca.name, count(s) AS loads, avg(ca.tender_reject_pct) AS reject,
       avg(s.transit_days) AS transit`,
        result: `J.B. Hunt (primary) → 22% tender rejection vs 6% network average\nXPO (fallback) → covers rejects, adds 2.4 days transit\nSchneider → 9 spot loads at +$310/load` },
      { kind: 'semantic', title: 'Retrieve the quality-hold narrative', nodes: ['gr_ncr', 'gr_complaint'],
        query: 'closure torque non-conformance on Dow Chemical drum orders',
        matches: [
          { score: 0.93, text: 'NCR-3341: 55gal Tight-Head closure torque 18.2 Nm against 22–26 Nm spec — lot held', src: 'LIMS' },
          { score: 0.86, text: 'Dow QA raised 14 complaints in the quarter, 9 citing seal integrity', src: 'Salesforce' },
          { score: 0.77, text: 'Torque wrench calibration overdue on Lavonia closure station 2', src: 'MES' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Three causes, and only one of them is logistics — a closure-torque quality hold is the single largest driver at 61 of 155 missed lines.' },
      { kind: 'para', text: 'Dow finished the quarter at 91.6% OTIF against a 94.0% target: 155 misses out of 1,842 order lines, 98 late and 57 short-shipped[1]. Treated as one number it looks like a service failure; decomposed, it is three unrelated problems that each need a different owner.' },
      { kind: 'list', n: 1, text: '**Quality hold — 61 lines, 6.2 days late average**[2]. NCR-3341 caught closure torque at 18.2 Nm against a 22–26 Nm spec on the 55gal Tight-Head, and the affected lots were held at Lavonia[3]. Root cause on the floor is an overdue torque wrench calibration on closure station 2[3]. This is the biggest bucket and it is entirely inside our control.' },
      { kind: 'list', n: 2, text: '**Carrier tender rejection — 48 lines, 3.1 days late average**[2]. J.B. Hunt is rejecting 22% of tenders on the Lavonia GA → Freeport TX lane against a 6% network average; XPO picks up the rejects but adds 2.4 days of transit[4].' },
      { kind: 'list', n: 3, text: '**Demand above forecast — 39 lines, 4.4 days late average**[2]. Dow pulled 18% above the forecast the plan was built on, so the shortfall was in finished-goods cover, not in the plant[5].' },
      { kind: 'bullet', text: '**The remaining 7 lines** are documentation and paperwork misses[2] — real, but noise against the other three.' },
      { kind: 'bullet', text: '**They compound where they overlap** — Dow logged 14 complaints in the quarter and 9 cite seal integrity[3], which means the torque hold is not only a service miss but is shaping how the customer scores our quality.' },
      { kind: 'para', text: 'Closing the quality bucket alone lifts Dow to roughly 94.9% and back over target. Fixing the lane on top of that takes it to about 97.5%. The forecast bucket is the slowest to move because it needs a planning change at Dow, not at Greif.' },
      { kind: 'action', text: 'Recommend: (1) recalibrate Lavonia closure station 2 and add torque verification to first-piece inspection — this recovers the largest bucket[3]; (2) reprice or replace the primary tender on LANE-LAV-FRPT, since a 22% rejection rate is a contract problem, not a capacity problem[4]; (3) move Dow to a collaborative forecast with a shipped-versus-forecast review, and hold safety stock on the top three Dow SKUs until the bias closes[5].' },
    ],
    sources: [
      { n: 1, node: 'gr_otif', ref: 'OTIF-DOW-Q3', detail: '91.6% vs 94.0% target · 155 of 1,842 lines missed (98 late · 57 short)' },
      { n: 2, node: 'gr_orderline', ref: 'OL-Q3-DOW', detail: 'Quality 61 · carrier 48 · forecast 39 · documentation 7' },
      { n: 3, node: 'gr_ncr', ref: 'NCR-3341', detail: 'Closure torque 18.2 Nm vs 22–26 Nm spec · station 2 calibration overdue' },
      { n: 4, node: 'gr_lane', ref: 'LANE-LAV-FRPT', detail: 'J.B. Hunt tender rejection 22% vs 6% network · XPO fallback +2.4 days' },
      { n: 5, node: 'gr_forecast', ref: 'FC-DOW-Q3', detail: 'Dow actual +18% above forecast · 39 lines short-shipped' },
    ],
  },
  freight_cost: {
    q: "Where is freight cost per ton rising fastest, and what can we actually do about it?",
    tag: 'Freight · Cost-to-Serve',
    chain: [
      { kind: 'sql', title: 'Rank lanes by cost per ton and quarterly movement', nodes: ['gr_lane', 'gr_cts'],
        cypher: `SELECT l.lane_code, l.origin_plant, l.dest_metro,
       AVG(f.cost_per_ton) AS cpt,
       AVG(f.cost_per_ton) / AVG(f.cost_per_ton_prior) - 1 AS qoq
FROM   freight_facts f JOIN dim_lane l ON l.id = f.lane_id
GROUP  BY 1,2,3 ORDER BY qoq DESC LIMIT 5`,
        result: `network $86.40/ton · +7.2% QoQ\nLavonia GA → Freeport TX  $112 → $131  (+17.0%)\nMount Vernon OH → Chicago IL  $63 → $71  (+12.7%)\nMorris IL → Memphis TN  $78 → $86  (+10.3%)\nRiverville VA → Charlotte NC  $58 → $62  (+6.9%)` },
      { kind: 'cypher', title: 'Check trailer utilisation and empty miles', nodes: ['gr_outbound', 'gr_carrier'],
        cypher: `MATCH (s:OutboundShipment)-[:SHIPS_ON]->(l:Lane)
WHERE l.product_group = 'DRUM'
RETURN avg(s.weight_util_pct) AS wt, avg(s.cube_util_pct) AS cube,
       sum(s.empty_miles) * 1.0 / sum(s.total_miles) AS deadhead`,
        result: `cube utilisation 94% · weight utilisation 62%  →  drums cube out light\ndeadhead 38% of miles on drum lanes vs 19% on board lanes` },
      { kind: 'cypher', title: 'Find customers served from the wrong plant', nodes: ['gr_plant', 'gr_customer', 'gr_order'],
        cypher: `MATCH (p:Plant)<-[:SOURCED_FROM]-(o:Order)-[:FOR_CUSTOMER]->(c:Customer)
MATCH (p2:Plant) WHERE p2.capability = p.capability
WITH c, p, p2, o, distance(c.ship_to, p.geo) AS cur, distance(c.ship_to, p2.geo) AS alt
WHERE alt < cur * 0.6 AND p2.available_capacity_pct > 8
RETURN c.name, p.name, cur, p2.name, alt ORDER BY (cur - alt) DESC`,
        result: `BASF Coatings — Greenville SC · from Morris IL 782 mi → Lavonia GA 108 mi\nShell Lubricants — Houston TX · from Lavonia GA 874 mi → Baton Rouge LA 271 mi\nNutrien Ag Solutions — Memphis TN · from Morris IL 536 mi → Lavonia GA 395 mi` },
      { kind: 'semantic', title: 'Retrieve lane and market context', nodes: ['gr_carrier', 'gr_lane'],
        query: 'why Gulf Coast chemical lane rates are rising and tender coverage is failing',
        matches: [
          { score: 0.90, text: 'LANE-LAV-FRPT: primary tender rejection 22%, spot coverage at +$310/load', src: 'project44' },
          { score: 0.83, text: 'Gulf dry-van capacity tightened on chemical demand; spot up 14% QoQ', src: 'Fastmarkets' },
          { score: 0.76, text: 'Backhaul pairing model: drum outbound + OCC inbound cuts deadhead to 21%', src: 'Blue Yonder' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Cost per ton is up 7.2% network-wide, but the steep lanes are self-inflicted — deadhead on drum lanes and three customers being served from the wrong plant account for most of the increase we can actually control.' },
      { kind: 'para', text: 'Network freight is $86.40 per ton, up 7.2% quarter over quarter[1]. The rise is not evenly spread: Lavonia GA → Freeport TX moved $112 → $131 per ton (+17%), Mount Vernon OH → Chicago $63 → $71, Morris IL → Memphis $78 → $86[2]. Roughly half the network increase sits in the top decile of lanes.' },
      { kind: 'bullet', text: '**Freeport is a coverage problem, not a market problem** — the primary tender is being rejected 22% of the time and the spot cover runs +$310 a load[4]. Market spot on Gulf dry van is up 14%, so about half the 17% is market and half is a contract that is no longer being honoured[4].' },
      { kind: 'bullet', text: '**Drum lanes are structurally empty on the return** — trailers hit 94% cube but only 62% weight, so drums fill the box without paying for it, and deadhead runs 38% of miles against 19% on board lanes[3]. Pairing drum outbound with OCC inbound to the URB mills takes deadhead to about 21%[4].' },
      { kind: 'bullet', text: '**Three customers are sourced from the wrong plant**[5] — BASF Coatings in Greenville SC is served from Morris IL (782 mi) when Lavonia is 108; Shell Lubricants in Houston from Lavonia (874 mi) when Baton Rouge is 271; Nutrien in Memphis from Morris (536 mi) when Lavonia is 395. That is 1.9M avoidable ton-miles.' },
      { kind: 'para', text: 'Re-sourcing those three is worth about **$1.4M a year** — $612K on BASF, $497K on Shell Lubricants, $291K on Nutrien[5] — and each destination plant already carries the capability and the spare capacity, so it is a scheduling and allocation change rather than a capital one.' },
      { kind: 'action', text: 'Recommend: (1) re-source the three customers to their nearest capable plant, starting with BASF Coatings where the mileage delta is largest[5]; (2) rebid the primary tender on LANE-LAV-FRPT and hold the incumbent to a rejection SLA, since spot coverage is pricing the rest[4]; (3) run the drum-outbound / OCC-inbound backhaul pairing on the Southeast lanes to pull deadhead from 38% toward 21%[3][4].' },
    ],
    sources: [
      { n: 1, node: 'gr_cts', ref: 'CTS-Q3-NET', detail: 'Network $86.40/ton · +7.2% QoQ · top-decile lanes +17%' },
      { n: 2, node: 'gr_lane', ref: 'LANE-LAV-FRPT', detail: 'Lavonia → Freeport $112 → $131/ton (+17.0%) — steepest lane' },
      { n: 3, node: 'gr_outbound', ref: 'OB-55210', detail: '94% cube / 62% weight utilisation · 38% deadhead on drum lanes' },
      { n: 4, node: 'gr_carrier', ref: 'CAR-JBH', detail: 'J.B. Hunt 22% rejection · XPO/Schneider spot +$310/load · Gulf spot +14%' },
      { n: 5, node: 'gr_customer', ref: 'CUST-BASF', detail: '3 mis-sourced customers · 1.9M ton-miles · $1.4M annual saving' },
    ],
  },
  safety_pattern: {
    q: "Is there a pattern behind our recordables this year?",
    tag: 'EHS · Shifts · Training',
    chain: [
      { kind: 'cypher', title: 'Distribute recordables across plants and shifts', nodes: ['gr_safety', 'gr_plant', 'gr_shift'],
        cypher: `MATCH (e:SafetyEvent {classification:'Recordable'})-[:AT_PLANT]->(p:Plant)
MATCH (e)-[:ON_SHIFT]->(s:Shift)
WHERE e.occurred_at > date('2026-01-01')
RETURN s.code, count(e) AS events, sum(s.hours_share) AS hours_share,
       collect(DISTINCT p.name)[..3] AS top_plants`,
        result: `B-shift → 54 recordables on 33% of hours worked\nA-shift → 41 on 41% of hours · C-shift → 23 on 26% of hours\n118 recordables YTD · TRIR 1.12 (prior year 0.94)\nheaviest plants: Lavonia GA 14 · Diadema BR 11 · Taicang CN 9` },
      { kind: 'sql', title: 'Test tenure and overtime as factors', nodes: ['gr_operator', 'gr_safety'],
        cypher: `SELECT tenure_band, COUNT(*) AS events, AVG(ot_ratio) AS ot,
       COUNT(*) * 1.0 / SUM(headcount_share) AS index
FROM   safety_event_facts e JOIN dim_worker w ON w.id = e.worker_id
WHERE  e.year = 2026 GROUP BY 1 ORDER BY events DESC`,
        result: `under 90 days → 41 events on 11% of headcount (index 3.7)\n90 days–2 yrs → 38 events on 34% of headcount\nover 2 yrs → 39 events on 55% of headcount\nplants above 12% overtime ratio → 2.3× the recordable rate` },
      { kind: 'cypher', title: 'Check certification currency against incident type', nodes: ['gr_training', 'gr_operator'],
        cypher: `MATCH (op:Operator)-[:CERTIFIED_BY]->(t:Training {code:'LOTO'})
OPTIONAL MATCH (op)<-[:INVOLVED]-(e:SafetyEvent {classification:'Recordable'})
RETURN t.status, count(DISTINCT op) AS workers, count(e) AS events`,
        result: `Lapsed → 217 workers · 7 recordables\nCurrent → 9,140 workers · 2 recordables of the same type\n9 of 118 recordables involved energy isolation; 7 on lapsed certification` },
      { kind: 'semantic', title: 'Retrieve incident narratives for common factors', nodes: ['gr_safety'],
        query: 'common factors in 2026 recordable incident narratives',
        matches: [
          { score: 0.91, text: 'Recurring narrative: guard bypassed to clear a jam during changeover, B-shift', src: 'Cority' },
          { score: 0.84, text: 'Overtime above 12% correlates with hand and pinch-point injuries at drum plants', src: 'Cority' },
          { score: 0.78, text: 'Three plants flagged for overdue LOTO refresher training in the annual audit', src: 'Sphera' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Yes. The 118 recordables this year concentrate on B-shift, on employees inside their first 90 days, and at three plants — and the same three plants carry the overtime and the lapsed lockout/tagout certifications.' },
      { kind: 'para', text: 'The network recorded 118 recordables year to date, with TRIR at 1.12 against 0.94 last year[1]. The distribution is not uniform. B-shift produced 54 of the 118 while working 33% of total hours; A-shift produced 41 on 41% of hours[2]. Three plants — Lavonia GA (14), Diadema BR (11) and Taicang CN (9) — account for 34 events on roughly 8% of hours worked[5].' },
      { kind: 'bullet', text: '**Tenure is the strongest single factor** — 41 of 118 recordables involved employees inside their first 90 days, a group that is 11% of headcount[3]. That is an index of 3.7 against exposure.' },
      { kind: 'bullet', text: '**Overtime tracks with rate** — plants running above a 12% overtime ratio show 2.3× the recordable rate of plants below it[5], and the three concentrated plants are all above that line.' },
      { kind: 'bullet', text: '**Certification currency shows a direct link** — 217 workers hold lapsed lockout/tagout certification[4]. Nine recordables this year involved energy isolation, and seven of those nine involved a worker whose LOTO certification had lapsed.' },
      { kind: 'bullet', text: '**The narratives agree with the numbers** — the most frequent recurring description is a guard bypassed to clear a jam during a changeover on B-shift[1], which is the same shift, the same task and the same plants the quantitative data points to.' },
      { kind: 'para', text: 'These factors are not independent. The three plants are short-staffed, which produces overtime, which is covered with new hires placed on B-shift, where supervision is thinnest and changeovers are most frequent. The Lavonia case is the clearest: the same B-shift crew carrying the changeover time creep is the crew with the certification gaps and the injury concentration.' },
      { kind: 'action', text: 'Recommend: (1) close the 217 lapsed LOTO certifications with a hard stop — no energy-isolation work without current certification[4]; (2) put a qualified lead on every B-shift changeover at Lavonia, Diadema and Taicang, and treat jam clearing as a stop-and-isolate task rather than a guard-bypass task[5]; (3) cap overtime at 12% at the three plants and staff to the gap rather than covering it[3][5]; (4) extend new-hire supervised work from 30 to 90 days on drum lines, matched to where the events actually occur[3].' },
    ],
    sources: [
      { n: 1, node: 'gr_safety', ref: 'SAF-YTD-2026', detail: '118 recordables YTD · TRIR 1.12 vs 0.94 prior year' },
      { n: 2, node: 'gr_shift', ref: 'SHF-B-NET', detail: 'B-shift 54 of 118 recordables on 33% of hours worked' },
      { n: 3, node: 'gr_operator', ref: 'OPR-T90', detail: 'Under-90-day employees: 41 events on 11% of headcount (index 3.7)' },
      { n: 4, node: 'gr_training', ref: 'TRN-LOTO', detail: '217 lapsed LOTO certifications · 7 of 9 isolation recordables' },
      { n: 5, node: 'gr_safetyidx', ref: 'SFX-3PLANT', detail: 'Lavonia 14 · Diadema 11 · Taicang 9 · overtime >12% → 2.3× rate' },
    ],
  },
  quality_ncr: {
    q: "What's driving the rise in non-conformances on steel drums?",
    tag: 'Quality · NCR · Supplier',
    chain: [
      { kind: 'sql', title: 'Trend NCR rate by plant and defect type', nodes: ['gr_ncr', 'gr_qc'],
        cypher: `SELECT plant_name, defect_type, week,
       COUNT(*) * 1000.0 / SUM(units_produced) AS ncr_per_1k
FROM   ncr_facts
WHERE  product_family = 'Steel Drum' AND week >= CURRENT_WEEK - 9
GROUP  BY 1,2,3 ORDER BY ncr_per_1k DESC`,
        result: `network rate 3.1 → 7.4 NCRs per 1,000 drums over 9 weeks\n214 NCRs in window · 168 (79%) seam integrity / double-seam pull-out\nconcentrated at Lavonia GA (96) and Morris IL (72); other plants flat` },
      { kind: 'cypher', title: 'Trace the NCRs back to material lots', nodes: ['gr_ncr', 'gr_run', 'gr_material', 'gr_po'],
        cypher: `MATCH (n:NCR)-[:RAISED_ON]->(r:ProductionRun)-[:CONSUMED]->(b:MaterialLot)
      -[:OF_MATERIAL]->(m:Material {name:'Cold-Rolled Steel Coil G60'})
MATCH (b)<-[:DELIVERED]-(po:PurchaseOrder)-[:FROM_SUPPLIER]->(s:Supplier)
RETURN s.name, min(b.lot_id), max(b.lot_id), avg(b.gauge_in), count(n) AS ncrs`,
        result: `Nucor Steel · lots N4-88210 → N4-88460 · avg gauge 0.0189 in (nominal 0.0210)\n2,410 tons shipped to Lavonia GA and Morris IL\n159 of the 168 seam NCRs trace to runs consuming this lot band` },
      { kind: 'semantic', title: 'Check incoming inspection and supplier documentation', nodes: ['gr_qc', 'gr_supplier'],
        query: 'incoming inspection of cold-rolled coil gauge and certificate of analysis',
        matches: [
          { score: 0.93, text: 'Coil gauge Cpk 0.71 on the affected lot band against 1.33 requirement', src: 'LIMS' },
          { score: 0.85, text: 'Incoming inspection accepts G60 coil on supplier COA only — no gauge verification', src: 'LIMS' },
          { score: 0.79, text: 'Nucor COA reports nominal gauge; no lot-level measured value supplied', src: 'SAP Ariba' },
        ] },
      { kind: 'cypher', title: 'Link the defect to customer complaints downstream', nodes: ['gr_complaint', 'gr_customer'],
        cypher: `MATCH (n:NCR)-[:RAISED_ON]->(r:ProductionRun)-[:PRODUCED]->(:SKU)
      <-[:ABOUT_SKU]-(cm:Complaint)-[:FROM_CUSTOMER]->(c:Customer)
RETURN c.name, count(cm) AS complaints,
       avg(duration.between(r.finished_at, cm.logged_at).days) AS lag_days`,
        result: `Dow Chemical → 14 complaints · 21.4 day lag\nShell Lubricants → 9 complaints · 19.8 day lag\n23 complaints total, all citing seal or seam integrity` },
    ],
    answer: [
      { kind: 'verdict', text: 'One supplier lot band. Steel drum NCRs more than doubled because Nucor coil in lots N4-88210 to N4-88460 ran 10% under nominal gauge, and thin coil does not form a sound double seam.' },
      { kind: 'para', text: 'The rate moved from 3.1 to 7.4 NCRs per 1,000 drums over nine weeks — 214 NCRs, of which 168 (79%) are seam integrity or double-seam pull-out[1]. It is not a network trend: Lavonia GA (96) and Morris IL (72) carry almost all of it while the other steel drum plants are flat[1].' },
      { kind: 'bullet', text: '**The two plants share one input** — 159 of the 168 seam NCRs trace to production runs consuming Cold-Rolled Steel Coil G60 from Nucor Steel lots N4-88210 through N4-88460, 2,410 tons split between the two sites[3].' },
      { kind: 'bullet', text: '**The material is measurably out of tolerance** — average gauge on the band is 0.0189 inches against a 0.0210 nominal, roughly 10% thin, with Cpk at 0.71 against a 1.33 requirement[2]. Thin coil under-fills the seam roll and the double seam pulls out under stack load, which is exactly the failure mode being written up.' },
      { kind: 'bullet', text: '**Incoming inspection could not have caught it** — G60 coil is accepted on the supplier certificate of analysis alone, with no gauge verification on receipt, and the Nucor COA reports nominal gauge rather than a lot-level measured value[4]. The specification was met on paper and missed in the coil.' },
      { kind: 'bullet', text: '**It reaches the customer about three weeks later** — 23 complaints, 14 from Dow Chemical and 9 from Shell Lubricants, all citing seal or seam integrity, logged 19 to 21 days after the runs that produced the drums[5]. That lag is why the internal NCR trend and the complaint trend looked unrelated.' },
      { kind: 'para', text: 'This also explains part of the Dow OTIF miss: the closure and seam holds at Lavonia sit on the same lot band, so the quality event, the service miss and the complaint trend are one issue counted three ways.' },
      { kind: 'action', text: 'Recommend: (1) raise a supplier corrective action with Nucor on lots N4-88210 to N4-88460 with the Cpk evidence attached, and quarantine remaining inventory from the band at both plants[2][3]; (2) change incoming inspection for G60 coil from COA acceptance to measured gauge verification per lot, with an SPC chart against the 1.33 Cpk requirement[4]; (3) require lot-level measured gauge on the COA as a purchasing condition going forward[4]; (4) notify Dow and Shell Lubricants proactively with the affected date range rather than waiting for the next complaint[5].' },
    ],
    sources: [
      { n: 1, node: 'gr_ncr', ref: 'NCR-4407', detail: '214 NCRs · 79% seam integrity · 3.1 → 7.4 per 1,000 drums · Lavonia 96 / Morris 72' },
      { n: 2, node: 'gr_material', ref: 'MAT-CRS-G60', detail: 'Cold-Rolled Steel Coil G60 · 0.0189 in vs 0.0210 nominal · Cpk 0.71 vs 1.33' },
      { n: 3, node: 'gr_po', ref: 'PO-771204', detail: 'Nucor Steel lots N4-88210 → N4-88460 · 2,410 tons to Lavonia and Morris' },
      { n: 4, node: 'gr_qc', ref: 'QC-9930', detail: 'Incoming inspection on COA only · no lot-level gauge verification' },
      { n: 5, node: 'gr_complaint', ref: 'CMP-9041', detail: '23 complaints (Dow 14 · Shell Lubricants 9) at 19–21 day lag' },
    ],
  },
  forecast_call: {
    q: "Is the Q3 commit real?",
    tag: 'Forecast · Pipeline · Risk',
    chain: [
      { kind: 'cypher', title: 'Read the submitted commit against quota', nodes: ['rv_forecast', 'rv_ae', 'rv_territory'],
        cypher: `MATCH (f:ForecastSubmission {period:'FY26-Q3'})-[:SUBMITTED_BY]->(ae:AccountExecutive)
      -[:COVERS]->(t:Territory)
RETURN sum(f.commit_usd) AS commit, sum(f.best_case_usd) AS best_case,
       sum(t.quota_usd) AS quota, sum(f.closed_usd) AS closed`,
        result: `commit $8.40M · best case $11.20M · quota $9.20M · closed-won $3.10M\nopen pipeline $21.8M → 2.4× coverage on the remaining gap` },
      { kind: 'cypher', title: 'Test every commit deal for logged activity', nodes: ['rv_opportunity', 'rv_activity', 'rv_pipeline'],
        cypher: `MATCH (o:Opportunity {forecast_category:'Commit'})<-[:ADVANCED]-(a:Activity)
WITH o, max(a.occurred_at) AS last_touch
WHERE last_touch < date() - duration('P21D')
RETURN count(o) AS deals, sum(o.amount_usd) AS amount`,
        result: `19 of 61 commit deals dark → $2.60M of $8.40M (31%) with no logged activity in 21 days` },
      { kind: 'sql', title: 'Count close-date pushes per commit deal', nodes: ['rv_opportunity', 'rv_forecast'],
        cypher: `SELECT o.name, o.amount_usd, o.owner_name, COUNT(*) AS pushes
FROM   opportunity_field_history h JOIN dim_opportunity o ON o.id = h.opportunity_id
WHERE  h.field = 'CloseDate' AND o.forecast_category = 'Commit'
GROUP  BY 1,2,3 HAVING COUNT(*) >= 2 ORDER BY o.amount_usd DESC`,
        result: `Meridian Labs $680K → pushed 2× (Sofia Marchetti)\nCascade Analytics $520K → pushed 2× (Daniel Osei)\nNorthwind Logistics — Expansion $410K → pushed 2× (Priya Raman)\n→ $1.61M of the commit has already moved twice` },
      { kind: 'semantic', title: 'Read the call record on the commit deals', nodes: ['rv_activity', 'rv_opportunity'],
        query: 'agreed next steps and buyer commitments on Q3 commit deals',
        matches: [
          { score: 0.93, text: 'Meridian Labs 08-06: “legal review not started, no date agreed”', src: 'Gong' },
          { score: 0.88, text: 'Cascade Analytics: procurement sponsor changed, sequence paused 12 days', src: 'Outreach' },
          { score: 0.81, text: '3 commit deals scored slip-risk High two weeks running', src: 'Clari' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'No — $8.40M is not the number. Strip out what the graph shows is not moving and the realistic commit is about **$7.6M**, roughly $1.6M short of the $9.20M quota.' },
      { kind: 'para', text: 'The submitted call is $8.40M commit and $11.20M best case against a $9.20M quota, with $3.10M already closed-won[1]. On its face that is a normal, slightly-short quarter. The graph disagrees with the composition of the commit, not the arithmetic — a third of it has no evidence underneath it.' },
      { kind: 'bullet', text: '**31% of the commit has gone dark** — 19 of 61 commit deals, worth $2.60M, have no logged call, meeting or email in 21 days[2]. These are not early-stage deals being neglected; they are deals a rep has personally committed to close inside 45 days.' },
      { kind: 'bullet', text: '**$1.61M has already moved twice** — Meridian Labs $680K (Sofia Marchetti), Cascade Analytics $520K (Daniel Osei) and the Northwind Logistics expansion $410K (Priya Raman) have each pushed their close date two times[3][5]. A second push is the strongest single predictor of a third.' },
      { kind: 'bullet', text: '**The calls corroborate the silence** — Meridian ended on “legal review not started, no date agreed”, Cascade lost its procurement sponsor and has been paused 12 days, and Clari has flagged the same three deals slip-risk High for two consecutive weeks[4].' },
      { kind: 'para', text: "Re-pricing the commit on the graph's own historical conversion: the $5.80M with live activity converts at 94% ($5.45M), and the $2.60M dark block converts at 38% ($0.99M)[2][4]. Add the $1.20M of best case that is genuinely running ahead of schedule and the realistic landing is **$7.6M** — a $1.6M gap, not the $0.8M gap the submitted call implies." },
      { kind: 'action', text: 'Recommend: (1) move Meridian, Cascade and the Northwind expansion out of Commit until a mutual close plan with a dated legal step is logged[3]; (2) gate the Commit category on 21-day activity so a dark deal cannot carry the number[2]; (3) call $7.6M now and work the $11.20M best case for pull-forward — the gap is findable this quarter, but only if it is named this week[1].' },
    ],
    sources: [
      { n: 1, node: 'rv_forecast', ref: 'FCS-Q3-0442', detail: 'Q3 commit $8.40M · best case $11.20M · quota $9.20M · closed-won $3.10M' },
      { n: 2, node: 'rv_activity', ref: 'ACT-771204', detail: '19 of 61 commit deals · $2.60M · no logged activity in 21 days' },
      { n: 3, node: 'rv_opportunity', ref: 'OPP-44210', detail: 'Meridian $680K · Cascade $520K · Northwind expansion $410K — each pushed 2×' },
      { n: 4, node: 'rv_pipeline', ref: 'PH-3312', detail: 'Slip-risk High on 3 commit deals, two consecutive weeks' },
      { n: 5, node: 'rv_ae', ref: 'AE-1188', detail: 'Sofia Marchetti · Daniel Osei · Priya Raman own the three twice-pushed deals' },
    ],
  },
  deal_slippage: {
    q: "Which deals are about to slip, and why?",
    tag: 'Deal Risk · Activity',
    chain: [
      { kind: 'cypher', title: 'Score late-stage deals for slip risk', nodes: ['rv_pipeline', 'rv_opportunity', 'rv_ae'],
        cypher: `MATCH (ph:PipelineHealth)-[:ON_PIPELINE]->(o:Opportunity)-[:OWNED_BY]->(ae:AccountExecutive)
WHERE o.stage IN ['Proposal','Negotiation'] AND o.close_date <= date() + duration('P45D')
RETURN o.name, o.amount_usd, ae.name, ph.slip_risk, ph.stage_velocity_days
ORDER BY ph.slip_risk DESC, o.amount_usd DESC`,
        result: `Meridian Labs $680K · Sofia Marchetti · High · 41d in Proposal\nCascade Analytics $520K · Daniel Osei · High · 38d\nHorizon Tech $445K · Tom Bradley · High · 29d\nNorthwind — Expansion $410K · Priya Raman · Medium · 24d\nSummit Partners $390K · Elena Ruiz · Low · 11d` },
      { kind: 'cypher', title: 'Count engaged contacts per deal (threading)', nodes: ['rv_opportunity', 'rv_contact', 'rv_activity'],
        cypher: `MATCH (o:Opportunity)-[:HAS_BUYER]->(c:Contact)<-[:WITH_CONTACT]-(a:Activity)
WHERE a.occurred_at > date() - duration('P30D')
RETURN o.name, count(DISTINCT c) AS threads, collect(DISTINCT c.title)[..3] AS roles`,
        result: `Meridian Labs → 1 (Director, Analytics)\nHorizon Tech → 1 (Solutions Architect)\nCascade Analytics → 2 (VP Engineering, Manager)\nNorthwind — Expansion → 2 (VP Ops, Admin)\nSummit Partners → 5 (CFO, VP Ops, Security, 2 users)` },
      { kind: 'sql', title: 'Measure champion silence and next-step staleness', nodes: ['rv_activity', 'rv_contact'],
        cypher: `SELECT o.name, MAX(a.occurred_at) AS last_touch,
       DATEDIFF('day', MAX(a.occurred_at), CURRENT_DATE) AS quiet_days,
       DATEDIFF('day', MAX(o.next_step_updated_at), CURRENT_DATE) AS next_step_age
FROM   activity_facts a JOIN dim_opportunity o ON o.id = a.opportunity_id
WHERE  a.contact_role = 'Champion' GROUP BY 1 ORDER BY quiet_days DESC`,
        result: `Northwind — Expansion → Maya Chen quiet 34d · next step age 28d\nMeridian Labs → champion quiet 22d · next step unchanged 19d\nCascade Analytics → quiet 17d · next step “follow up” unchanged 26d\nSummit Partners → quiet 3d · next step age 4d` },
      { kind: 'semantic', title: 'Read what the last calls actually agreed', nodes: ['rv_activity', 'rv_competitor'],
        query: 'agreed next steps and competitor mentions on late-stage deals',
        matches: [
          { score: 0.92, text: 'Meridian Labs: “we will circle back after budget planning” — no date set', src: 'Gong' },
          { score: 0.86, text: 'Horizon Tech: Atlas Data Cloud named on the last two calls', src: 'Gong' },
          { score: 0.79, text: 'Cascade Analytics: 12-day sequence gap, no reply to the last 3 steps', src: 'Outreach' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Four deals worth $2.06M are slipping, and in every case the tell is structural — one contact, a stale next step, or a champion who stopped replying — not a pricing objection.' },
      { kind: 'para', text: 'Five deals close inside 45 days. Four of them carry at least two of the three failure signatures the graph tracks: single-threading, a next step that has not changed in weeks, and champion silence[1][2][3]. Ranked by slip probability:' },
      { kind: 'list', n: 1, text: '**Meridian Labs — $680K · Sofia Marchetti · 0.78** — 41 days in Proposal, single-threaded to one Director of Analytics[2], champion quiet 22 days with the next step untouched for 19[3], and the last call closed on “circle back after budget planning” with no date attached[4]. It has already pushed twice[1].' },
      { kind: 'list', n: 2, text: '**Cascade Analytics — $520K · Daniel Osei · 0.71** — two contacts, both below the buying line[2]; the Outreach sequence has been stalled 12 days with no reply to the last three steps[4], and the next step has read “follow up” for 26 days[3].' },
      { kind: 'list', n: 3, text: '**Horizon Tech — $445K · Tom Bradley · 0.66** — single-threaded to a solutions architect[2] with Atlas Data Cloud named on the last two calls[4]. The deal is being shopped and we are talking to the one person who cannot decide it.' },
      { kind: 'list', n: 4, text: "**Northwind Logistics — Expansion $410K · Priya Raman · 0.63** — champion Maya Chen has been quiet 34 days[3]. The same silence shows up on the retention side: Northwind's renewal is 112 days out at health 72[5], so this is one account problem being counted as two." },
      { kind: 'bullet', text: '**Summit Partners is the control** — same stage, comparable size at $390K, but five engaged contacts spanning CFO, VP Ops and Security, champion touched 3 days ago and only 11 days in stage[1][2][3]. None of the signals fire.' },
      { kind: 'bullet', text: '**Single-threading is the strongest predictor in the set** — deals with one engaged contact slip 3.1× more often than deals with four or more[1][2], and every High-risk deal here has one or two.' },
      { kind: 'action', text: 'Recommend: (1) run a multi-thread play on Meridian and Horizon this week — an exec-to-exec touch above the current contact, not another email to the same person[2]; (2) treat a next step older than 14 days as an automatic stage review rather than a reporting field[3]; (3) put Horizon into the competitive motion now that Atlas is named, rather than after the proposal[4]; (4) hand Northwind to the CSM and the AE together — the expansion and the renewal are the same conversation[5].' },
    ],
    sources: [
      { n: 1, node: 'rv_pipeline', ref: 'PH-3318', detail: 'Slip-risk High: Meridian, Cascade, Horizon · 41/38/29 days in stage' },
      { n: 2, node: 'rv_contact', ref: 'CON-55120', detail: 'Meridian 1 engaged contact · Horizon 1 · Summit 5 across CFO/VP Ops/Security' },
      { n: 3, node: 'rv_activity', ref: 'ACT-771318', detail: 'Maya Chen quiet 34d · Meridian next step unchanged 19d · Cascade 26d' },
      { n: 4, node: 'rv_competitor', ref: 'CMP-ATLAS', detail: 'Atlas Data Cloud named on the last two Horizon Tech calls' },
      { n: 5, node: 'rv_health', ref: 'HS-NORTHWIND', detail: 'Northwind Logistics · health 72 · $1.24M ARR · renewal in 112 days' },
    ],
  },
  stage_conversion: {
    q: "Where is the funnel actually leaking?",
    tag: 'Funnel · Conversion',
    chain: [
      { kind: 'sql', title: 'Compute stage-to-stage conversion by segment', nodes: ['rv_opportunity', 'rv_territory'],
        cypher: `SELECT t.segment, s.stage_from, s.stage_to,
       COUNT(*) FILTER (WHERE s.advanced) * 1.0 / COUNT(*) AS conv
FROM   stage_transition_facts s JOIN dim_territory t ON t.id = s.territory_id
WHERE  s.quarter IN ('FY26-Q2','FY26-Q3')
GROUP  BY 1,2,3 ORDER BY conv`,
        result: `Discovery → Proposal      Ent 58% · MM 54% · SMB 51%\nProposal → Negotiation    Ent 62% · MM 31% · SMB 49%\nNegotiation → Closed Won  Ent 74% · MM 71% · SMB 69%\n→ one cell sits 31 points below its peer; every other gap is inside 7` },
      { kind: 'cypher', title: 'Check who is engaged before the proposal goes out', nodes: ['rv_opportunity', 'rv_contact', 'rv_activity'],
        cypher: `MATCH (o:Opportunity)-[:HAS_BUYER]->(c:Contact)<-[:WITH_CONTACT]-(a:Activity)
WHERE a.occurred_at < o.proposal_sent_at
RETURN o.segment,
       sum(CASE WHEN c.persona = 'Economic Buyer' THEN 1 ELSE 0 END) * 1.0
       / count(DISTINCT o) AS eb_rate`,
        result: `Enterprise → economic buyer engaged pre-Proposal on 81% of deals\nSMB → 47%\nMid-Market → 34%` },
      { kind: 'sql', title: 'Test whether the buyer explains the gap', nodes: ['rv_opportunity', 'rv_quote'],
        cypher: `SELECT eb_engaged, COUNT(*) AS deals,
       AVG(advanced_to_negotiation::int) AS conv, AVG(days_in_proposal) AS days
FROM   proposal_stage_facts
WHERE  segment = 'Mid-Market' AND quarter IN ('FY26-Q2','FY26-Q3')
GROUP  BY 1`,
        result: `EB engaged pre-Proposal →  64 deals · 71% advance · 12 days in stage\nno EB engaged          → 126 deals · 29% advance · 34 days in stage` },
      { kind: 'semantic', title: 'Read the stall language on Mid-Market proposals', nodes: ['rv_activity', 'rv_opportunity'],
        query: 'why mid-market proposals stall before negotiation',
        matches: [
          { score: 0.94, text: '“I need to take this to my VP” — in 58% of stalled MM proposal calls', src: 'Gong' },
          { score: 0.85, text: 'MM opportunities average 2.1 engaged contacts vs 4.6 in Enterprise', src: 'Salesforce' },
          { score: 0.77, text: 'MM sequences target practitioner titles over VP+ by 4:1', src: 'Outreach' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: "The funnel leaks in exactly one cell — Proposal → Negotiation in Mid-Market, 31% against Enterprise's 62% — and the cause is that nobody who can sign has been in the room before the proposal goes out." },
      { kind: 'para', text: 'Every other transition is within seven points across segments: Discovery → Proposal runs 51–58%, Negotiation → Closed Won runs 69–74%[1]. There is no general conversion problem and no segment that is broadly weaker. One cell is 31 points below its peer, and that is worth explaining before anyone reworks the top of the funnel.' },
      { kind: 'bullet', text: '**The economic buyer is missing** — Enterprise engages an economic buyer before Proposal on 81% of deals; Mid-Market manages 34%[2]. That is the largest structural difference between the two motions, and it lands exactly at the stage that leaks.' },
      { kind: 'bullet', text: '**Within Mid-Market the split is decisive** — proposals with an economic buyer engaged advance 71% of the time in 12 days; proposals without advance 29% of the time and sit 34 days in stage[3]. Same segment, same product, same reps: the only variable is who was in the room.' },
      { kind: 'bullet', text: '**The calls say it out loud** — “I need to take this to my VP” appears in 58% of stalled Mid-Market proposal calls[4]. The proposal is not being rejected; it is being handed to someone who has never heard the pitch.' },
      { kind: 'bullet', text: '**It is a targeting artefact, not a skill gap** — Mid-Market sequences aim at practitioner titles over VP+ by four to one[4], so the pipeline is built bottom-up and then asked to close top-down.' },
      { kind: 'para', text: 'Sizing it: Mid-Market ran 190 proposals over two quarters, 126 of them without an economic buyer[3][5]. Lifting that cohort from 29% to 50% is about 13 extra deals into Negotiation per quarter — roughly $2.4M of incremental late-stage pipeline at the $185K Mid-Market average, or about $1.7M of bookings at the 71% negotiation-to-close rate[1][5].' },
      { kind: 'action', text: 'Recommend: (1) make an engaged economic buyer an exit criterion for Discovery in Mid-Market — no proposal without one[2]; (2) rebalance Mid-Market sequences toward VP+ titles so the buyer is reachable before the proposal exists[4]; (3) enforce the gate against the graph rather than a checkbox — the contact and activity records already prove it[3]; (4) leave Enterprise and SMB alone, they are converting normally[1].' },
    ],
    sources: [
      { n: 1, node: 'rv_opportunity', ref: 'OPP-STG-Q3', detail: 'Proposal → Negotiation: Enterprise 62% · Mid-Market 31% · SMB 49%' },
      { n: 2, node: 'rv_contact', ref: 'CON-EB-MM', detail: 'Economic buyer engaged pre-Proposal: Enterprise 81% · SMB 47% · Mid-Market 34%' },
      { n: 3, node: 'rv_activity', ref: 'ACT-MM-PROP', detail: 'MM: EB-engaged 71% advance in 12 days vs 29% in 34 days' },
      { n: 4, node: 'rv_pipeline', ref: 'PH-MM-3402', detail: '“Take this to my VP” in 58% of stalled MM calls · sequences 4:1 practitioner' },
      { n: 5, node: 'rv_territory', ref: 'TER-MM-NA', detail: 'Mid-Market NA · 190 proposals over two quarters · avg deal $185K' },
    ],
  },
  campaign_pipeline: {
    q: "Which campaigns actually created pipeline last quarter?",
    tag: 'Attribution · Campaigns',
    chain: [
      { kind: 'cypher', title: 'Credit pipeline under the last-touch model', nodes: ['rv_attrib', 'rv_touch', 'rv_campaign'],
        cypher: `MATCH (cr:AttributionCredit {model:'Last Touch'})-[:CREDITS]->(t:Touch)
      -[:FROM_CAMPAIGN]->(c:Campaign)
MATCH (cr)-[:ATTRIBUTES_TO]->(o:Opportunity)
RETURN c.name, sum(cr.credited_amount_usd) AS credited
ORDER BY credited DESC LIMIT 4`,
        result: `“State of Ops” webinar series → $4.10M\nCompetitor paid search (Atlas terms) → $1.10M\nABM / intent-triggered outbound → $0.86M\nLinkedIn paid social → $0.74M` },
      { kind: 'cypher', title: 'Re-run multi-touch and split sourced from influenced', nodes: ['rv_touch', 'rv_opportunity', 'rv_attrib'],
        cypher: `MATCH (t:Touch)-[:FROM_CAMPAIGN]->(c:Campaign)
MATCH (t)-[:INFLUENCED]->(o:Opportunity)
WITH c, o, min(t.touched_at) AS first_touch, o.created_at AS opened
RETURN c.name,
       sum(CASE WHEN first_touch < opened THEN o.amount_usd END) AS sourced,
       sum(CASE WHEN first_touch >= opened THEN o.amount_usd END) AS influenced`,
        result: `“State of Ops” webinar → sourced $0.90M · influenced $3.20M (78% of touches landed on deals already open)\nCompetitor paid search → sourced $2.90M · influenced $0.31M\nABM / intent outbound → sourced $1.80M · influenced $0.42M` },
      { kind: 'sql', title: 'Count net-new logos and cost per sourced dollar', nodes: ['rv_adspend', 'rv_account', 'rv_campaign'],
        cypher: `SELECT c.name, SUM(s.spend_usd) AS spend,
       COUNT(DISTINCT a.account_id) AS new_logos,
       SUM(s.spend_usd) / NULLIF(SUM(p.sourced_usd), 0) AS cost_per_sourced_dollar
FROM   dim_campaign c JOIN adspend_facts s ON s.campaign_id = c.id
JOIN   sourced_pipeline p ON p.campaign_id = c.id
LEFT   JOIN dim_account a ON a.first_touch_campaign_id = c.id AND a.is_new_logo
GROUP  BY 1 ORDER BY cost_per_sourced_dollar`,
        result: `ABM / intent outbound → $108K spend ·  9 net-new logos · $0.06 per $1 sourced\nCompetitor paid search → $232K spend · 14 net-new logos · $0.08\n“State of Ops” webinar → $279K spend ·  2 net-new logos · $0.31` },
      { kind: 'semantic', title: 'Read the journey behind the webinar credit', nodes: ['rv_websession', 'rv_content', 'rv_touch'],
        query: 'who attends the State of Ops webinar and where they sit in the journey',
        matches: [
          { score: 0.93, text: '78% of webinar registrants map to accounts with an open opportunity', src: 'Marketo' },
          { score: 0.87, text: 'Registration traffic is 61% direct and email — almost no new discovery', src: 'Segment CDP' },
          { score: 0.80, text: '“Atlas Data Cloud alternative” ad group: 3.4× the visit-to-MQL rate', src: 'Google Ads' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'The webinar is a scoreboard artefact. It banks $4.10M on last touch but sources only $0.90M — the campaign actually creating pipeline is competitor paid search, at $2.90M sourced and 14 net-new logos for $0.08 per sourced dollar.' },
      { kind: 'para', text: 'Under last touch the ranking looks settled: the “State of Ops” webinar series takes $4.10M of credit, nearly four times the next campaign[1]. Re-run the same touches under multi-touch, splitting pipeline a campaign *sourced* from pipeline it merely *touched*, and the ranking inverts completely[2].' },
      { kind: 'list', n: 1, text: '**Competitor paid search — the real creator.** $2.90M sourced against $0.31M influenced[2], 14 net-new logos on $232K of spend, $0.08 per sourced dollar[3][5]. The “Atlas Data Cloud alternative” ad group converts visits to MQLs at 3.4× the account average[4] — it buys in-market demand at the exact moment a buyer is comparing us to the competitor we lose to most.' },
      { kind: 'list', n: 2, text: '**ABM / intent-triggered outbound — the efficient one.** $1.80M sourced on $108K of spend and 9 net-new logos, the cheapest sourced dollar in the mix at $0.06[2][3][5]. It takes the least last-touch credit ($0.86M) precisely because it works accounts long before a form fill exists to be credited[1].' },
      { kind: 'list', n: 3, text: '**“State of Ops” webinar — influence, not creation.** $0.90M sourced against $3.20M influenced[2]. 78% of registrants already had an open opportunity and 61% of registration traffic arrives direct or by email[4] — it re-touches pipeline sales already built, then collects the last-touch credit for it. Two net-new logos on $279K[3][5].' },
      { kind: 'bullet', text: '**The webinar is still worth running — just not for sourcing.** Re-touching open deals is a legitimate job; it should be measured on stage progression in the accounts it touches, not on sourced pipeline, and it should stop being the reason paid search is under-funded[2][3].' },
      { kind: 'bullet', text: '**The model choice is the entire finding.** Nothing about the campaigns changed between the two views. Last touch systematically rewards whatever ran closest to the close, which is exactly the campaign that did the least to create the deal[1][2].' },
      { kind: 'action', text: 'Recommend: (1) move sourcing budget to competitor paid search and intent-triggered outbound, which together sourced $4.70M on $340K[2][3]; (2) retire last touch as the reporting default and publish sourced against influenced side by side[1]; (3) re-scope the webinar as a late-stage program measured on progression[4]; (4) raise impression share on the competitor ad group before a rival buys the term[4].' },
    ],
    sources: [
      { n: 1, node: 'rv_attrib', ref: 'ATC-Q3-LT', detail: 'Last touch: webinar $4.10M · paid search $1.10M · ABM $0.86M · social $0.74M' },
      { n: 2, node: 'rv_touch', ref: 'TCH-Q3-MTA', detail: 'Multi-touch: webinar sourced $0.90M / influenced $3.20M · search sourced $2.90M' },
      { n: 3, node: 'rv_adspend', ref: 'ADS-PS-4412', detail: 'Paid search $232K at $0.08 per sourced $1 · webinar $279K at $0.31' },
      { n: 4, node: 'rv_campaign', ref: 'CMP-SOO-26', detail: '“State of Ops” webinar · 78% of registrants already on an open opportunity' },
      { n: 5, node: 'rv_account', ref: 'ACC-NEWLOGO-Q3', detail: '14 net-new logos from paid search · 9 from ABM · 2 from the webinar' },
    ],
  },
  channel_mix: {
    q: "Where should the next $500K of spend go?",
    tag: 'Channel · Spend · ROI',
    chain: [
      { kind: 'sql', title: 'Rank channels by cost per sourced pipeline dollar', nodes: ['rv_adspend', 'rv_campaign'],
        cypher: `SELECT c.channel, SUM(s.spend_usd) AS spend, SUM(p.sourced_usd) AS sourced,
       SUM(s.spend_usd) / NULLIF(SUM(p.sourced_usd), 0) AS cost_per_sourced_dollar
FROM   adspend_facts s JOIN dim_campaign c ON c.id = s.campaign_id
JOIN   sourced_pipeline p ON p.campaign_id = c.id
GROUP  BY 1 ORDER BY cost_per_sourced_dollar`,
        result: `ABM / intent-triggered outbound → $0.06 per $1 sourced ($108K spend)\nCompetitor paid search → $0.08 ($232K)\nPartner co-marketing → $0.14 ($64K)\nLinkedIn paid social → $0.24 ($196K)\n“State of Ops” webinar → $0.31 ($279K)` },
      { kind: 'cypher', title: 'Fit the saturation curve on paid social', nodes: ['rv_adspend', 'rv_touch', 'rv_campaign'],
        cypher: `MATCH (s:AdSpend)-[:FUNDS]->(c:Campaign {channel:'Paid Social'})
MATCH (t:Touch)-[:FROM_CAMPAIGN]->(c)
WITH s.week AS wk, sum(s.spend_usd) AS spend, sum(t.attributed_amount_usd) AS sourced
RETURN wk, spend, sourced, sourced / spend AS return_per_dollar
ORDER BY spend`,
        result: `up to $20K/wk → $5.10 sourced per $1\n$20–35K/wk → $4.20\n$35–50K/wk → $2.30\nabove $50K/wk → $1.60\n→ marginal return breaks down past roughly $35K per week` },
      { kind: 'cypher', title: 'Size the unworked in-market headroom', nodes: ['rv_intent', 'rv_account', 'rv_segment'],
        cypher: `MATCH (i:IntentSignal)-[:ON_ACCOUNT]->(a:Account)
WHERE i.intent_score > 70 AND i.buying_stage IN ['Consideration','Decision']
OPTIONAL MATCH (a)<-[:TOUCHED]-(t:Touch)
WHERE t.touched_at > date() - duration('P30D')
RETURN count(DISTINCT a) AS accounts, count(DISTINCT t) AS touched,
       sum(a.modelled_potential_usd) AS headroom`,
        result: `486 in-market accounts scored above 70 · only 137 touched in the last 30 days\n349 unworked → $18.4M of modelled potential` },
      { kind: 'semantic', title: 'Retrieve platform and channel constraints', nodes: ['rv_adspend', 'rv_intent'],
        query: 'channel saturation, ad fatigue and unbought demand this quarter',
        matches: [
          { score: 0.91, text: 'LinkedIn frequency 4.8 per member per week — above the 3.0 fatigue threshold', src: 'LinkedIn Ads' },
          { score: 0.86, text: '349 in-market accounts with no outbound sequence attached', src: '6sense' },
          { score: 0.78, text: 'Competitor-term impression share 41% — 59% of available demand unbought', src: 'Google Ads' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Not into paid social. Put **$260K into intent-triggered outbound, $180K into competitor paid search and hold $60K on the webinar** — the same $500K poured into paid social buys roughly a third of the pipeline.' },
      { kind: 'para', text: 'Cost per sourced pipeline dollar spreads five-fold across the channel set: $0.06 on ABM and intent-triggered outbound and $0.08 on competitor paid search, against $0.24 on paid social and $0.31 on the webinar[1]. That spread alone would settle the allocation — provided the cheap channels have somewhere to put the money, which the graph confirms they do.' },
      { kind: 'bullet', text: '**Paid social is already past its knee.** Return falls from $5.10 per dollar below $20K a week to $1.60 above $50K[2], and LinkedIn frequency is at 4.8 impressions per member per week against a 3.0 fatigue threshold[5]. Adding budget here buys repetition, not reach.' },
      { kind: 'bullet', text: '**Intent outbound has the deepest headroom.** 486 accounts score above 70 in Consideration or Decision, and only 137 have been touched in 30 days — 349 unworked accounts carrying $18.4M of modelled potential[3]. This is demand we already pay 6sense to identify and then do not act on.' },
      { kind: 'bullet', text: '**Competitor search is capacity-constrained, not demand-constrained.** Impression share on the competitor terms is 41%, so 59% of available demand goes unbought[4] — the same query set that produced 14 net-new logos last quarter. Raising share is the lowest-risk incremental dollar in the plan.' },
      { kind: 'para', text: 'Modelled outcome of the split: $260K into intent outbound at a degrading $0.09 marginal cost sources about $2.9M; $180K into competitor search at a marginal $0.11 sources about $1.6M; the $60K webinar hold protects late-stage touch coverage. Total ≈ **$4.5M of sourced pipeline**, against roughly $1.6M if the same $500K went to paid social at its current marginal return[1][2][3].' },
      { kind: 'action', text: 'Recommend: (1) allocate $260K / $180K / $60K to intent outbound, competitor search and webinar, with zero incremental paid social[1]; (2) cap paid social at $35K a week rather than cutting it — it is efficient below the knee[2]; (3) attach a sequence to the 349 unworked in-market accounts before buying any new demand[3]; (4) re-check impression share monthly, since the competitor term is the one input a rival can take away from us[4][5].' },
    ],
    sources: [
      { n: 1, node: 'rv_adspend', ref: 'ADS-Q3-MIX', detail: 'Cost per sourced $1: ABM $0.06 · search $0.08 · social $0.24 · webinar $0.31' },
      { n: 2, node: 'rv_campaign', ref: 'CMP-PS-SOCIAL', detail: 'Paid social return $5.10 → $1.60 per $1 as weekly spend passes $35K' },
      { n: 3, node: 'rv_intent', ref: 'INT-6S-4471', detail: '486 accounts scored >70 · 349 unworked · $18.4M modelled potential' },
      { n: 4, node: 'rv_segment', ref: 'SEG-ICP-MM', detail: 'Competitor-term impression share 41% — 59% of demand unbought' },
      { n: 5, node: 'rv_touch', ref: 'TCH-LI-FREQ', detail: 'LinkedIn frequency 4.8 per member per week vs 3.0 fatigue threshold' },
    ],
  },
  churn_watch: {
    q: "Which accounts are going to churn, and what's the tell?",
    tag: 'Churn · Usage · Engagement',
    chain: [
      { kind: 'cypher', title: 'Score the installed base for churn risk', nodes: ['rv_churn', 'rv_subscription', 'rv_account'],
        cypher: `MATCH (r:ChurnRisk)-[:PREDICTS]->(s:Subscription)-[:BILLED_TO]->(a:Account)
WHERE r.probability > 0.35
RETURN a.name, r.probability, s.arr_usd, r.top_driver,
       duration.between(date(), s.term_end).days AS days_to_renewal
ORDER BY r.probability DESC`,
        result: `Northwind Logistics → 0.68 · $1.24M ARR · seat decline · renews in 112d\nCascade Analytics → 0.54 · $860K · support escalation · 74d\nHorizon Tech → 0.41 · $540K · competitive · 138d\nBeacon Industries → 0.37 · $410K · onboarding stall · 61d\n→ $3.05M ARR above the 0.35 action threshold` },
      { kind: 'sql', title: 'Trend seat utilization on the flagged accounts', nodes: ['rv_usage', 'rv_subscription'],
        cypher: `SELECT a.name, u.active_users, s.seats,
       u.active_users * 1.0 / s.seats AS utilization,
       u.active_users * 1.0 / LAG(u.active_users, 60) OVER (PARTITION BY a.id
         ORDER BY u.measured_on) - 1 AS delta_60d
FROM   usage_facts u JOIN dim_subscription s ON s.id = u.subscription_id
JOIN   dim_account a ON a.id = s.account_id ORDER BY delta_60d`,
        result: `Northwind Logistics → 186 of 240 seats active (77.5%) · −22% in 60 days\nCascade Analytics → 118 of 150 (78.7%) · −14%\nBeacon Industries →  47 of  60 (78.3%) · −9%\nHorizon Tech →  91 of 100 (91.0%) · flat` },
      { kind: 'cypher', title: 'Join engagement, support and sentiment', nodes: ['rv_contact', 'rv_ticket', 'rv_nps'],
        cypher: `MATCH (a:Account)<-[:RAISED_BY]-(t:Ticket)
OPTIONAL MATCH (a)<-[:SCORES_ACCOUNT]-(n:NPSResponse)
OPTIONAL MATCH (a)<-[:WORKS_AT]-(c:Contact {persona:'Champion'})
RETURN a.name, max(c.last_activity_at) AS champion_touch,
       collect(t.ticket_no)[..2] AS open_sev2, n.score`,
        result: `Northwind: champion Maya Chen (VP Ops) last touch 34 days ago\n  TCK-8841 Sev-2 open 19 days · NPS 6 (was 9)\nCascade: 2 Sev-2 raised in 30 days · NPS 7\nHorizon: champion touched 4 days ago · NPS 8` },
      { kind: 'semantic', title: 'Retrieve the account narrative', nodes: ['rv_ticket', 'rv_usage'],
        query: 'what changed at Northwind Logistics in the last quarter',
        matches: [
          { score: 0.94, text: 'QBR note: “team reorganised under a new COO, re-evaluating tooling”', src: 'Gainsight' },
          { score: 0.88, text: 'TCK-8841 escalated twice; last reply “still blocking our month-end”', src: 'Zendesk' },
          { score: 0.81, text: 'Northwind deprovisioned 54 licenses across two batches', src: 'Pendo' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Northwind Logistics — $1.24M ARR at 0.68 churn probability. Every tell has already fired, and the renewal conversation is still 112 days away.' },
      { kind: 'para', text: 'Four accounts carrying $3.05M of ARR sit above the 0.35 action threshold[1]. They are not equally urgent and they are not failing for the same reason, so the ranking below is by probability, with the specific evidence that produced it.' },
      { kind: 'list', n: 1, text: '**Northwind Logistics — $1.24M ARR · 0.68 · renews in 112 days.** Seat utilization has fallen to 186 of 240 licensed, down 22% in 60 days, with 54 licenses deprovisioned in two deliberate batches[2][4]. Champion Maya Chen has been silent 34 days[3]. Sev-2 **TCK-8841** has been open 19 days, escalated twice, with the customer writing “still blocking our month-end”[4]. NPS fell from 9 to 6 and health from 84 to 72[3][5]. The QBR note explains all of it: a reorganisation under a new COO and an active tooling re-evaluation[4].' },
      { kind: 'list', n: 2, text: '**Cascade Analytics — $860K · 0.54 · renews in 74 days.** Utilization down 14%, two Sev-2s raised inside 30 days, NPS 7[2][3]. Shorter runway than Northwind but a shallower decline — recoverable on support responsiveness alone.' },
      { kind: 'list', n: 3, text: '**Horizon Tech — $540K · 0.41 · renews in 138 days.** Usage flat at 91% and the champion was touched four days ago[2][3]. Nothing is broken operationally; the driver is competitive, so it belongs to the open deal rather than the CSM.' },
      { kind: 'bullet', text: '**The tell is always usage before sentiment.** On Northwind, seats started falling roughly six weeks before NPS moved and about three months before any renewal conversation was scheduled[2][3]. Deprovisioning is a decision someone made and paid for — the least deniable signal in the graph.' },
      { kind: 'bullet', text: '**Beacon Industries is the near-term one.** Lowest probability at 0.37, but it renews in 61 days — half of Northwind\'s runway — with an onboarding stall as the driver[1]. Low risk on a short clock still needs this week.' },
      { kind: 'action', text: 'Recommend: (1) escalate TCK-8841 to a named engineer today with a committed fix date — it is the one blocker the customer has put in writing[4]; (2) get an exec-to-exec meeting with the new COO inside two weeks rather than another check-in with the quiet champion[3][4]; (3) build a re-adoption plan against the 54 deprovisioned seats before the renewal opens, because seats lost quietly never come back at renewal[2]; (4) route Horizon to the competitive motion and keep the CSM on Cascade and Beacon[1][5].' },
    ],
    sources: [
      { n: 1, node: 'rv_churn', ref: 'CHR-4471', detail: 'Northwind 0.68 · Cascade 0.54 · Horizon 0.41 · Beacon 0.37 · $3.05M ARR flagged' },
      { n: 2, node: 'rv_usage', ref: 'USG-NW-30D', detail: 'Northwind 186 of 240 seats active · −22% in 60 days · 54 licenses deprovisioned' },
      { n: 3, node: 'rv_nps', ref: 'NPS-NW-0442', detail: 'Northwind NPS 6 (was 9) · champion Maya Chen last touch 34 days ago' },
      { n: 4, node: 'rv_ticket', ref: 'TCK-8841', detail: 'Sev-2 open 19 days · escalated 2× · “still blocking our month-end”' },
      { n: 5, node: 'rv_health', ref: 'HS-NORTHWIND', detail: 'Northwind health 72, down from 84 · $1.24M ARR · renewal in 112 days' },
    ],
  },
  renewal_risk: {
    q: "What's at risk in the next 90 days?",
    tag: 'Renewal · Health · SLA',
    chain: [
      { kind: 'cypher', title: 'Pull the 90-day renewal book by dollar', nodes: ['rv_renewal', 'rv_subscription', 'rv_csm'],
        cypher: `MATCH (r:Renewal)-[:RENEWS]->(s:Subscription)-[:BILLED_TO]->(a:Account)
OPTIONAL MATCH (csm:CSM)-[:MANAGES]->(a)
WHERE r.renewal_date <= date() + duration('P90D')
RETURN count(r) AS renewals, sum(r.renewal_arr_usd) AS book,
       r.risk_level, collect(DISTINCT csm.name) AS owners`,
        result: `34 renewals · $6.80M ARR inside 90 days\nred $2.10M (4 accounts) · amber $0.95M (6) · green $3.75M (24)\nowners: Nadia Okafor $3.10M · Ben Kessler $2.40M · unassigned $1.30M` },
      { kind: 'sql', title: 'Rank the at-risk book with its blocker', nodes: ['rv_renewal', 'rv_churn'],
        cypher: `SELECT a.name, r.renewal_arr_usd, r.renewal_date - CURRENT_DATE AS days_out,
       c.probability, c.top_driver
FROM   renewal_facts r JOIN dim_account a ON a.id = r.account_id
JOIN   churn_risk c ON c.subscription_id = r.subscription_id
WHERE  r.risk_level = 'Red' ORDER BY r.renewal_arr_usd DESC`,
        result: `Cascade Analytics $860K · 74d · 0.54 · two Sev-2 in 30d, utilization −14%\nVertex Solutions $520K · 39d · 0.49 · exec sponsor left in June\nBeacon Industries $410K · 61d · 0.37 · onboarding stalled at phase 2\nQuantum Dynamics $310K · 82d · 0.33 · Analytics uplift disputed` },
      { kind: 'cypher', title: 'Trace each blocker to an owner and an SLA', nodes: ['rv_ticket', 'rv_onboarding', 'rv_csm'],
        cypher: `MATCH (a:Account)<-[:MANAGES]-(csm:CSM)
OPTIONAL MATCH (a)<-[:RAISED_BY]-(t:Ticket {priority:'Sev-2'})
OPTIONAL MATCH (o:OnboardingProject)-[:ONBOARDS]->(:Subscription)-[:BILLED_TO]->(a)
RETURN a.name, csm.name, avg(t.first_response_min) AS frt,
       o.phase, o.target_go_live`,
        result: `Cascade Analytics · Nadia Okafor → 2 Sev-2 breached first response (260 min vs 60 target)\nBeacon Industries · Ben Kessler → ONB-2214 stalled at phase 2 of 4, 141 days past go-live\nVertex Solutions · unassigned → no CSM touch in 47 days\nQuantum Dynamics · Ben Kessler → healthy usage, commercial blocker only` },
      { kind: 'semantic', title: 'Retrieve the renewal-conversation context', nodes: ['rv_renewal', 'rv_activity'],
        query: 'what is blocking each upcoming renewal conversation',
        matches: [
          { score: 0.92, text: 'Vertex Solutions: sponsor departure logged, no replacement mapped', src: 'Gainsight' },
          { score: 0.85, text: 'Quantum Dynamics: “the Analytics uplift is hard to justify at renewal”', src: 'Gong' },
          { score: 0.78, text: 'Beacon: 3 of 4 onboarding milestones open past target', src: 'Gainsight' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: '$2.10M of the $6.80M 90-day book is red, across four accounts — and each one has a different, named, fixable blocker. None of them is price.' },
      { kind: 'para', text: 'The book is 34 renewals worth $6.80M: $3.75M green, $0.95M amber, $2.10M red[1]. Coverage is uneven before risk even enters — $1.30M of the book has no CSM assigned at all[1][4]. Ranked by dollars at risk, with the blocker and the owner:' },
      { kind: 'list', n: 1, text: '**Cascade Analytics — $860K · 74 days · risk 0.54 · Nadia Okafor.** Two Sev-2s in 30 days, both breaching first response at 260 minutes against a 60-minute target, and utilization down 14%[2][3]. This is a support-quality renewal, and the SLA breach is ours to fix.' },
      { kind: 'list', n: 2, text: '**Vertex Solutions — $520K · 39 days · risk 0.49 · unassigned.** The executive sponsor left in June with no replacement mapped, and there has been no CSM touch in 47 days[2][4]. Shortest clock in the book and nobody is holding it.' },
      { kind: 'list', n: 3, text: '**Beacon Industries — $410K · 61 days · risk 0.37 · Ben Kessler.** Onboarding project ONB-2214 is stalled at phase 2 of 4, 141 days past target go-live, with three of four milestones open[5]. The account is being asked to renew something it never finished switching on.' },
      { kind: 'list', n: 4, text: '**Quantum Dynamics — $310K · 82 days · risk 0.33 · Ben Kessler.** Usage is healthy; the blocker is purely commercial — “the Analytics uplift is hard to justify at renewal”[2][4]. Longest runway, easiest to solve, and the only one where a pricing conversation is the right move.' },
      { kind: 'bullet', text: '**The biggest risk in the base is not in this window.** Northwind Logistics carries $1.24M at 0.68 probability but renews in 112 days, so it falls outside the 90-day report entirely[2]. Working the book strictly by date puts the largest exposure last.' },
      { kind: 'action', text: 'Recommend: (1) assign Vertex Solutions an owner today and run sponsor-replacement mapping before the 39-day clock closes[3][4]; (2) put Cascade\'s two Sev-2s on a named engineer with a written response-time commitment — the SLA breach is the renewal argument[3]; (3) re-baseline Beacon with a 30-day go-live plan rather than renewing into an unfinished implementation[5]; (4) open the Quantum pricing conversation early, at value rather than at discount[2]; (5) start Northwind now even though it sits outside the window[1][2].' },
    ],
    sources: [
      { n: 1, node: 'rv_renewal', ref: 'RNW-Q4-BOOK', detail: '34 renewals · $6.80M in 90 days · red $2.10M / amber $0.95M / green $3.75M' },
      { n: 2, node: 'rv_churn', ref: 'CHR-4471', detail: 'Cascade 0.54 · Vertex 0.49 · Beacon 0.37 · Quantum 0.33 · Northwind 0.68 at 112d' },
      { n: 3, node: 'rv_ticket', ref: 'TCK-9120', detail: 'Cascade 2 Sev-2 breached first response · 260 min vs 60 min target' },
      { n: 4, node: 'rv_csm', ref: 'CSM-1104', detail: 'Nadia Okafor $3.10M · Ben Kessler $2.40M · Vertex unassigned 47 days' },
      { n: 5, node: 'rv_onboarding', ref: 'ONB-2214', detail: 'Beacon Industries stalled at phase 2 of 4 · 141 days past target go-live' },
    ],
  },
  health_drivers: {
    q: "What actually predicts churn for us?",
    tag: 'Signals · Model',
    chain: [
      { kind: 'sql', title: 'Test each health input against actual churn outcomes', nodes: ['rv_health', 'rv_churn'],
        cypher: `SELECT input_name, current_weight, auc_lift, precision_at_churn
FROM   health_model_inputs
WHERE  model_version = 'v3' ORDER BY auc_lift DESC`,
        result: `seat utilization trend (30d)   weight 0.12 · AUC lift +0.21 · precision 0.74\nchampion engagement recency    weight 0.08 · +0.16 · 0.68\nSev-2 aging (open > 14 days)   weight 0.06 · +0.11 · 0.63\ntime-to-value (onboarding)     weight 0.10 · +0.06 · 0.52\nNPS score alone                weight 0.40 · +0.01 · 0.31\nopen ticket count alone        weight 0.24 · −0.02 · 0.27` },
      { kind: 'cypher', title: 'Replay the signals against accounts that actually churned', nodes: ['rv_churn', 'rv_subscription', 'rv_usage'],
        cypher: `MATCH (r:ChurnRisk)-[:PREDICTS]->(s:Subscription {status:'Churned'})
MATCH (u:Usage)-[:MEASURES]->(s)
WITH s, min(u.license_utilization_pct) AS low, max(u.license_utilization_pct) AS high
RETURN count(s) AS churned, sum(s.arr_usd) AS arr_lost,
       sum(CASE WHEN low < high * 0.85 THEN 1 ELSE 0 END) AS seat_decline`,
        result: `31 churned subscriptions · $9.40M ARR lost\n27 of 31 showed a >15% seat-utilization decline 60+ days before renewal\n24 of 31 had champion silence over 21 days\n 9 of 31 ever returned an NPS score below 7 — the rest never responded at all` },
      { kind: 'cypher', title: 'Test the vanity inputs directly', nodes: ['rv_nps', 'rv_ticket', 'rv_account'],
        cypher: `MATCH (a:Account)<-[:SCORES_ACCOUNT]-(n:NPSResponse)
OPTIONAL MATCH (a)<-[:RAISED_BY]-(t:Ticket)
WITH a, n.score AS nps, count(t) AS tickets
RETURN CASE WHEN nps <= 6 THEN 'detractor' ELSE 'promoter' END AS band,
       avg(a.churned) AS churn_rate, avg(tickets) AS ticket_vol`,
        result: `NPS ≤ 6 → 38% churned  ·  NPS ≥ 9 → 21% churned   (weak separation)\ntop-quartile ticket volume → 12% churned\nbottom-quartile ticket volume → 34% churned   (inverted — quiet accounts churn more)` },
      { kind: 'semantic', title: 'Retrieve model and product-signal notes', nodes: ['rv_health', 'rv_usage'],
        query: 'health score model performance and leading product signals',
        matches: [
          { score: 0.93, text: 'Health score v3 AUC 0.71; reweighted v4 candidate scores 0.83 on holdout', src: 'Snowflake' },
          { score: 0.86, text: 'License deprovisioning precedes non-renewal by a median 74 days', src: 'Pendo' },
          { score: 0.79, text: 'Health card is 40% NPS-weighted — the highest weight, the lowest signal', src: 'Gainsight' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: 'Three inputs carry almost all the signal — seat-utilization trend, champion engagement recency and Sev-2 aging — while the score spends 64% of its weight on NPS and ticket count, which barely separate churners from renewers.' },
      { kind: 'para', text: 'Replaying the model against 31 accounts that actually churned, worth $9.40M of lost ARR, gives a clean read on what was visible beforehand[2]. 27 of the 31 showed a seat-utilization decline over 15% at least 60 days before renewal, and 24 of 31 had a champion silent for more than 21 days[2]. Neither was subtle; both were sitting in Pendo and Outreach months ahead.' },
      { kind: 'bullet', text: '**Seat-utilization trend is the strongest input** — +0.21 AUC lift and 0.74 precision at churn, carrying only 0.12 of the current weight[1]. License deprovisioning specifically precedes non-renewal by a median 74 days[5]: an account paying to remove seats has already decided something.' },
      { kind: 'bullet', text: '**Champion engagement recency is second** — +0.16 lift, 0.68 precision, weighted 0.08[1]. It is also the cheapest to act on, because silence is reversible in a way that a lapsed implementation is not.' },
      { kind: 'bullet', text: '**Sev-2 aging beats ticket volume decisively** — an open Sev-2 past 14 days lifts AUC +0.11[1], while raw ticket count is actively misleading: bottom-quartile ticket volume churns at 34% against 12% in the top quartile[4]. Accounts that file tickets are engaged; accounts that have gone quiet have stopped trying.' },
      { kind: 'bullet', text: '**NPS alone is the vanity input** — 40% of the weight for +0.01 AUC lift and 0.31 precision[1][3]. Detractors churn at 38% against promoters at 21%, directionally right and practically useless, and only 9 of the 31 churned accounts ever returned a score[2][3]. You cannot run retention on a signal two thirds of your churners never send.' },
      { kind: 'para', text: 'Reweighting to the v4 candidate moves holdout AUC from 0.71 to 0.83[5]. Operationally, the current score flags about 61% of churn roughly two weeks out; the reweighted score flags 78% of it at 90 days — the difference between a save play and an exit interview. Northwind is the live proof: seats down 22% and the champion quiet 34 days, while its NPS-heavy health score has only drifted from 84 to 72[2].' },
      { kind: 'action', text: 'Recommend: (1) ship v4 — seat-utilization trend to 0.34, champion recency to 0.27, Sev-2 aging to 0.19, NPS down to 0.05[1][5]; (2) make a license-deprovisioning event a hard trigger that opens a save play regardless of score[5]; (3) replace open-ticket count with Sev-2 age, and alert when ticket volume *falls* rather than rises[4]; (4) re-score the base on v4 before the next renewal cycle so the 90-day lead time is actually usable[2][3].' },
    ],
    sources: [
      { n: 1, node: 'rv_health', ref: 'HS-MODEL-V3', detail: 'v3 weights vs AUC lift · NPS 0.40 weight for +0.01 · utilization 0.12 for +0.21' },
      { n: 2, node: 'rv_churn', ref: 'CHR-BT-31', detail: '31 churned subscriptions · $9.40M ARR · 27 seat decline · 24 champion silence' },
      { n: 3, node: 'rv_nps', ref: 'NPS-BT-Q', detail: 'NPS ≤6 churn 38% vs ≥9 21% · only 9 of 31 churners ever responded' },
      { n: 4, node: 'rv_ticket', ref: 'TCK-BT-Q', detail: 'Bottom-quartile ticket volume churns 34% vs 12% top quartile (inverted)' },
      { n: 5, node: 'rv_usage', ref: 'USG-CHURN-BT', detail: 'Deprovisioning precedes non-renewal by median 74 days · v4 AUC 0.83' },
    ],
  },
  whitespace: {
    q: "Where is the whitespace in the installed base?",
    tag: 'Expansion · Whitespace',
    chain: [
      { kind: 'cypher', title: 'Build the product penetration matrix', nodes: ['rv_account', 'rv_subscription', 'rv_product'],
        cypher: `MATCH (a:Account)<-[:BILLED_TO]-(s:Subscription)
OPTIONAL MATCH (u:Usage)-[:MEASURES]->(s)
OPTIONAL MATCH (u)-[:OF_PRODUCT]->(p:Product)
RETURN collect(DISTINCT p.name) AS stack, count(DISTINCT a) AS accounts,
       sum(s.arr_usd) AS arr ORDER BY accounts DESC`,
        result: `624 paying accounts\nPlatform only → 214 (34%)\nPlatform + Analytics → 322 (52%)\nPlatform + Analytics + API Gateway → 88 (14%)\n→ Analytics attach 66% · API Gateway attach 22%` },
      { kind: 'sql', title: 'Find Analytics-shaped usage inside Platform-only accounts', nodes: ['rv_usage', 'rv_subscription'],
        cypher: `SELECT a.name, u.reporting_session_share, u.scheduled_exports_per_user_week
FROM   usage_facts u JOIN dim_subscription s ON s.id = u.subscription_id
JOIN   dim_account a ON a.id = s.account_id
WHERE  s.plan = 'Platform' AND NOT s.has_analytics
  AND  u.reporting_session_share > 0.40 ORDER BY 2 DESC`,
        result: `61 of 214 Platform-only accounts spend over 40% of sessions in reporting / export workflows\nmedian 47% of sessions · 3.2 scheduled exports per user per week\n18 of the 61 exceed the usage profile of the median paying Analytics customer` },
      { kind: 'cypher', title: 'Size the opportunity at modelled attach', nodes: ['rv_expansion', 'rv_account', 'rv_product'],
        cypher: `MATCH (e:ExpansionSignal)-[:ON_ACCOUNT]->(a:Account)
WHERE e.recommended_product = 'Analytics add-on'
RETURN count(a) AS accounts, avg(e.expected_arr_usd) AS median_acv,
       sum(e.expected_arr_usd) AS whitespace, avg(e.propensity) AS attach`,
        result: `61 accounts · Analytics add-on median ACV $86K → $5.24M whitespace\ntop 18 by usage fit = $2.40M · modelled attach 0.58 → $1.39M expected` },
      { kind: 'semantic', title: 'Retrieve buying context on the whitespace accounts', nodes: ['rv_usage', 'rv_websession'],
        query: 'platform-only accounts behaving like analytics customers',
        matches: [
          { score: 0.91, text: 'Quantum Dynamics: 63% of sessions in reporting, no Analytics entitlement', src: 'Pendo' },
          { score: 0.84, text: 'Vertex Solutions: 4 users requested scheduled exports through support', src: 'Zendesk' },
          { score: 0.76, text: 'Summit Partners: Analytics pricing page viewed 12 times in 30 days', src: 'Segment CDP' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: '**$5.24M of Analytics whitespace** sits inside 61 Platform-only accounts that already use the product like Analytics customers — $2.40M of it concentrated in 18 accounts, worth about $1.39M at modelled attach.' },
      { kind: 'para', text: 'Of 624 paying accounts, 214 are on Platform only[1]. That is not automatically whitespace — most are on Platform because Platform is what they need. The graph separates the two cases by asking what an account actually does in the product rather than what it bought.' },
      { kind: 'list', n: 1, text: '**Analytics whitespace — 61 accounts, $5.24M.** These accounts spend over 40% of sessions in reporting and export workflows, at a median 47% and 3.2 scheduled exports per user per week[2]. 18 of them exceed the usage profile of the *median paying Analytics customer*[2] — getting the value without paying for it, which is a packaging failure rather than a demand problem. At $86K median ACV and 0.58 modelled attach the realistic take is $1.39M[3][4].' },
      { kind: 'list', n: 2, text: '**API Gateway whitespace — the bigger structural gap.** Attach is 22% against Analytics\' 66%[1]. The 88 accounts on the full stack are also the highest-retaining cohort in the base, so this is a retention argument as much as an expansion one.' },
      { kind: 'list', n: 3, text: '**The named three lead the list.** Quantum Dynamics runs 63% of sessions in reporting with no Analytics entitlement, Vertex Solutions has had four users ask support for scheduled exports, and Summit Partners viewed the Analytics pricing page 12 times in 30 days[4][5]. Three different systems — telemetry, support and web — pointing at the same product.' },
      { kind: 'bullet', text: '**The support requests are the strongest tell.** A user opening a ticket to ask for a feature that exists in a tier they do not own is a qualified expansion lead currently being closed as a support case[4].' },
      { kind: 'bullet', text: '**Do not work the other 153.** Platform-only accounts below the 40% reporting threshold show no Analytics-shaped behaviour[2]; pitching them is the fastest way to make the whole motion look like it does not work.' },
      { kind: 'action', text: 'Recommend: (1) run the top 18 by usage fit first — $2.40M with the strongest evidence, taking the proof of value from their own telemetry into the call[2][3]; (2) route export and reporting support requests to expansion instead of closing them[4]; (3) trigger an in-product offer on the 61 at the moment the reporting workflow is used[5]; (4) treat API Gateway as the next campaign once Analytics attach moves — the 22% is the larger long-run gap[1].' },
    ],
    sources: [
      { n: 1, node: 'rv_subscription', ref: 'SUB-BASE-624', detail: '624 accounts · Platform only 214 · Analytics attach 66% · API Gateway 22%' },
      { n: 2, node: 'rv_usage', ref: 'USG-WS-61', detail: '61 Platform-only accounts >40% reporting sessions · 18 above median Analytics customer' },
      { n: 3, node: 'rv_expansion', ref: 'EXP-WS-Q3', detail: '61 × $86K = $5.24M · top 18 = $2.40M · attach 0.58 → $1.39M expected' },
      { n: 4, node: 'rv_product', ref: 'PRD-ANALYTICS', detail: 'Analytics add-on · median ACV $86K · 4 Vertex export requests via support' },
      { n: 5, node: 'rv_account', ref: 'ACC-QUANTUM', detail: 'Quantum 63% reporting sessions · Summit 12 pricing-page views in 30 days' },
    ],
  },
  expansion_signals: {
    q: "Which accounts are showing buying signals right now?",
    tag: 'Expansion · Intent · Usage',
    chain: [
      { kind: 'cypher', title: 'Rank expansion propensity across the base', nodes: ['rv_expansion', 'rv_account', 'rv_subscription'],
        cypher: `MATCH (e:ExpansionSignal)-[:ON_ACCOUNT]->(a:Account)<-[:BILLED_TO]-(s:Subscription)
WHERE e.propensity > 0.6
RETURN a.name, e.propensity, s.arr_usd, e.recommended_product, e.expected_arr_usd
ORDER BY e.propensity DESC`,
        result: `Apex Global → 0.86 · $2.10M ARR · API Gateway · $240K expected\nSummit Partners → 0.79 · $940K · Analytics add-on · $180K\nQuantum Dynamics → 0.74 · $760K · Analytics add-on · $150K\nVertex Solutions → 0.68 · $520K · seat expansion · $110K\n→ top 10 = $1.40M expected expansion ARR` },
      { kind: 'sql', title: 'Check usage headroom and licence saturation', nodes: ['rv_usage', 'rv_subscription'],
        cypher: `SELECT a.name, u.active_users, s.seats,
       u.license_utilization_pct, u.api_calls / s.api_ceiling AS ceiling_ratio
FROM   usage_facts u JOIN dim_subscription s ON s.id = u.subscription_id
JOIN   dim_account a ON a.id = s.account_id
WHERE  u.license_utilization_pct > 0.80 ORDER BY 4 DESC`,
        result: `Apex Global → 288 of 300 seats (96%) · API calls 2.4× plan ceiling\nSummit Partners → 128 of 140 (91%) · reporting sessions +38% QoQ\nVertex Solutions →  53 of  60 (88%) · 4 export requests via support\nQuantum Dynamics → 84% · 63% of sessions in reporting workflows` },
      { kind: 'cypher', title: 'Overlay third-party intent and pricing-page behaviour', nodes: ['rv_intent', 'rv_websession', 'rv_account'],
        cypher: `MATCH (a:Account)
OPTIONAL MATCH (i:IntentSignal)-[:ON_ACCOUNT]->(a)
OPTIONAL MATCH (w:WebSession)-[:DEANONYMIZED_TO]->(a)
WHERE w.landing_page CONTAINS 'pricing' OR w.landing_page CONTAINS 'docs'
RETURN a.name, i.topic, i.intent_score, i.buying_stage, count(w) AS sessions`,
        result: `Apex Global → “API management” 78 · Decision · 41 docs sessions in 30d\nSummit Partners → — · pricing page 12 sessions · 5 distinct users incl. CFO\nQuantum Dynamics → “embedded analytics” 64 · Consideration · 6 sessions\nVertex Solutions → no third-party intent · 2 sessions` },
      { kind: 'semantic', title: 'Retrieve what buyers are saying on live calls', nodes: ['rv_activity', 'rv_intent'],
        query: 'expansion language on recent customer calls',
        matches: [
          { score: 0.92, text: 'Apex Global QBR: “we are rate-limited — what does the gateway tier look like?”', src: 'Gong' },
          { score: 0.85, text: 'Summit Partners: CFO joined the last two calls unprompted', src: 'Gong' },
          { score: 0.77, text: 'Apex Global in Decision stage on API management three weeks running', src: '6sense' },
        ] },
    ],
    answer: [
      { kind: 'verdict', text: "Four accounts are ready now, worth about **$680K of expansion ARR** — and Apex Global is the only one where telemetry, third-party intent and the buyer's own words all point at the same product." },
      { kind: 'para', text: 'Readiness here is not a propensity score on its own — it is agreement between independent sources. An account saturated in usage but silent on intent is a different conversation from one researching a category it has never touched. Ranked by how many signals agree:' },
      { kind: 'list', n: 1, text: '**Apex Global — 0.86 · $2.10M ARR · API Gateway · $240K expected.** 288 of 300 seats active with API calls at 2.4× the plan ceiling[2]; 6sense scores “API management” 78 and has held Decision stage three consecutive weeks[3]; 41 docs sessions in 30 days[4]; and on the last QBR the customer asked outright, “we are rate-limited — what does the gateway tier look like?”[5]. Every source agrees. This is an inbound deal nobody has written down.' },
      { kind: 'list', n: 2, text: '**Summit Partners — 0.79 · $940K · Analytics add-on · $180K.** 91% licence utilization with reporting sessions up 38% QoQ[2], 12 pricing-page sessions from 5 distinct users including the CFO[4], and the CFO has joined the last two calls unprompted[5]. No third-party intent, but a finance buyer self-serving on pricing outranks a research score.' },
      { kind: 'list', n: 3, text: '**Quantum Dynamics — 0.74 · $760K · Analytics add-on · $150K.** 63% of sessions in reporting workflows with no entitlement[2] and “embedded analytics” intent at 64 in Consideration[3]. Unambiguous behaviour, one buying stage earlier — a nurture, not a proposal. It also renews in 82 days with a pricing objection already logged, so sequencing matters.' },
      { kind: 'list', n: 4, text: '**Vertex Solutions — 0.68 · $520K · seat expansion · $110K.** 88% utilization and four export requests through support[2], but no intent and only two web sessions[3][4]. One source, not three — worth a call, not a forecast. Its renewal is 39 days out and unassigned, so retention comes first.' },
      { kind: 'bullet', text: '**Rate-limit breaches are the highest-converting signal in the set.** An account running 2.4× its API ceiling is already consuming the next tier[2][5] — the commercial conversation is behind the product reality, not ahead of it.' },
      { kind: 'action', text: 'Recommend: (1) put a gateway-tier proposal in front of Apex Global this week while the intent is live and the question is theirs[3][5]; (2) invite the Summit Partners CFO into a value conversation rather than letting them self-serve to a number[4]; (3) nurture Quantum with usage evidence and fold the Analytics offer into the renewal instead of running two negotiations[1][2]; (4) hold Vertex for retention first — expansion into an at-risk, unowned renewal does not close[1].' },
    ],
    sources: [
      { n: 1, node: 'rv_expansion', ref: 'EXP-4488', detail: 'Apex 0.86 $240K · Summit 0.79 $180K · Quantum 0.74 $150K · Vertex 0.68 $110K' },
      { n: 2, node: 'rv_usage', ref: 'USG-APEX-96', detail: 'Apex 288 of 300 seats · API calls 2.4× plan ceiling · Summit 91% utilization' },
      { n: 3, node: 'rv_intent', ref: 'INT-APEX-API', detail: '6sense “API management” 78 · Decision stage three weeks running' },
      { n: 4, node: 'rv_websession', ref: 'WSS-SUMMIT-PP', detail: 'Summit pricing page 12 sessions, 5 users incl. CFO · Apex 41 docs sessions' },
      { n: 5, node: 'rv_activity', ref: 'ACT-APEX-QBR', detail: 'Apex QBR: “we are rate-limited — what does the gateway tier look like?”' },
    ],
  },
  competitive_loss: {
    q: "Why are we losing to Atlas Data Cloud?",
    tag: 'Win-Loss · Competitor',
    chain: [
      { kind: 'cypher', title: 'Split win rate by competitor and segment', nodes: ['rv_competitor', 'rv_opportunity', 'rv_territory'],
        cypher: `MATCH (o:Opportunity)-[:COMPETING_WITH]->(c:Competitor {name:'Atlas Data Cloud'})
MATCH (o)-[:FOR_ACCOUNT]->(:Account)-[:IN_TERRITORY]->(t:Territory)
WHERE o.stage IN ['Closed Won','Closed Lost']
RETURN t.segment, count(o) AS deals,
       sum(CASE WHEN o.stage = 'Closed Won' THEN 1 ELSE 0 END) * 1.0 / count(o) AS win_rate`,
        result: `overall win rate 41% · versus Atlas 28%\nEnterprise vs Atlas → 47% (n=19)\nSMB vs Atlas → 44% (n=12)\nMid-Market vs Atlas → 19% (n=36)\n→ 23 competitive losses in two quarters · 17 of them Mid-Market` },
      { kind: 'sql', title: 'Test the price hypothesis on the losses', nodes: ['rv_quote', 'rv_opportunity'],
        cypher: `SELECT o.outcome, AVG(q.discount_pct) AS avg_discount,
       SUM(CASE WHEN q.amount_usd < o.competitor_quote_usd THEN 1 ELSE 0 END) AS we_were_cheaper,
       SUM(CASE WHEN o.primary_loss_reason = 'Price' THEN 1 ELSE 0 END) AS price_losses
FROM   quote_facts q JOIN dim_opportunity o ON o.id = q.opportunity_id
WHERE  o.competitor = 'Atlas Data Cloud' GROUP BY 1`,
        result: `losses → avg discount 12.4% · we were the lower price in 14 of 23\nwins   → avg discount  9.1%\nprice named as the primary loss reason on only 5 of 23` },
      { kind: 'semantic', title: 'Read the loss calls', nodes: ['rv_activity', 'rv_competitor'],
        query: 'what buyers say when they choose Atlas Data Cloud',
        matches: [
          { score: 0.95, text: '“Atlas gives us row-level permissions out of the box” — 14 of 23 loss calls', src: 'Gong' },
          { score: 0.88, text: 'Our governance answer is a services engagement quoted at 6–8 weeks', src: 'Gong' },
          { score: 0.81, text: 'Atlas mentions on open Mid-Market deals up 2.6× quarter over quarter', src: '6sense' },
        ] },
      { kind: 'cypher', title: 'Find where the capability gap actually bites', nodes: ['rv_product', 'rv_opportunity', 'rv_activity'],
        cypher: `MATCH (o:Opportunity)-[:COMPETING_WITH]->(:Competitor {name:'Atlas Data Cloud'})
MATCH (a:Activity)-[:ADVANCED]->(o)
WHERE a.topics CONTAINS 'row-level access'
RETURN CASE WHEN a.occurred_at < o.proposal_sent_at THEN 'pre-Proposal'
            ELSE 'post-Proposal' END AS raised_when,
       count(o) AS deals, avg(o.won) AS win_rate`,
        result: `raised pre-Proposal → 21 deals · 34% win rate\nraised post-Proposal → 27 deals · 11% win rate\nEnterprise mitigates with a funded services SOW; Mid-Market cannot budget one mid-cycle` },
    ],
    answer: [
      { kind: 'verdict', text: 'It is not price. We lose to Atlas in Mid-Market — 19% win rate against 47% in Enterprise — on one capability, row-level permissions, which Atlas ships natively and we answer with a 6–8 week services engagement Mid-Market cannot fund.' },
      { kind: 'para', text: 'Against Atlas our win rate is 28% versus 41% overall, but the average hides the story. Enterprise wins 47% and SMB 44%; Mid-Market wins 19% across 36 deals[1]. Seventeen of the 23 competitive losses in the last two quarters came from that one cell — a segment failure wearing a competitor\'s name.' },
      { kind: 'bullet', text: '**Price is ruled out by our own quotes.** We discounted *more* on the losses than the wins (12.4% vs 9.1%), we were the cheaper option in 14 of 23 losses, and price was the primary reason on only 5[2]. Discounting harder is our current response to this competitor, and it is demonstrably not working.' },
      { kind: 'bullet', text: '**The calls are unanimous on the real reason.** “Atlas gives us row-level permissions out of the box” appears in 14 of the 23 loss calls[3]. Our answer to the same requirement is a services engagement quoted at six to eight weeks[3] — technically a yes, commercially a no.' },
      { kind: 'bullet', text: '**That is why the gap is segment-shaped.** Enterprise deals absorb a funded services SOW without breaking the business case; Mid-Market cannot budget one mid-cycle[4]. Same product gap, same competitor, different ability to pay around it.' },
      { kind: 'bullet', text: '**Timing decides the outcome more than the gap itself.** When row-level access comes up before the proposal we still win 34% of the time; when it surfaces after, we win 11%[4]. Late discovery turns a scoping conversation into an unbudgeted change order.' },
      { kind: 'para', text: 'This is live, not historical. Atlas mentions on open Mid-Market deals are up 2.6× quarter over quarter[3], and Horizon Tech — $445K, single-threaded to an architect — has had Atlas named on its last two calls[5]. On current form it becomes loss number 24.' },
      { kind: 'action', text: 'Recommend: (1) package a fixed-scope, fixed-price governance starter so Mid-Market has a fundable answer instead of an open-ended SOW[4]; (2) move row-level access into discovery qualification — asking early is worth 23 points of win rate[4]; (3) stop discounting against Atlas, since deeper discounts track with losses, and redirect the concession into the governance package[2]; (4) put Horizon Tech into the competitive motion now and multi-thread above the architect[5]; (5) take the 14-of-23 evidence to product as the ranked ask — one feature, priced in lost Mid-Market deals[1][3].' },
    ],
    sources: [
      { n: 1, node: 'rv_competitor', ref: 'CMP-ATLAS', detail: 'Win rate vs Atlas 28% · Enterprise 47% · Mid-Market 19% · 23 losses in 2 quarters' },
      { n: 2, node: 'rv_quote', ref: 'QTE-LOSS-Q3', detail: 'Losses discounted 12.4% vs wins 9.1% · we were cheaper in 14 of 23' },
      { n: 3, node: 'rv_activity', ref: 'ACT-GONG-RLP', detail: 'Row-level permissions cited on 14 of 23 loss calls · Atlas mentions +2.6× QoQ' },
      { n: 4, node: 'rv_product', ref: 'PRD-GOV-SOW', detail: 'Governance answered as a 6–8 week SOW · pre-Proposal 34% win vs post 11%' },
      { n: 5, node: 'rv_opportunity', ref: 'OPP-44318', detail: 'Horizon Tech $445K open · Atlas named on the last two calls' },
    ],
  },
  discount_leak: {
    q: "Where are we leaking margin on discounting?",
    tag: 'Pricing · Discounting',
    chain: [
      { kind: 'sql', title: 'Distribution of discount depth by segment and stage', nodes: ['rv_quote', 'rv_territory'],
        cypher: `SELECT t.segment, q.stage_at_quote, AVG(q.discount_pct) AS avg_discount,
       AVG(CASE WHEN q.sequence_no = 1 THEN q.discount_pct END) AS first_quote
FROM   quote_facts q JOIN dim_territory t ON t.id = q.territory_id
WHERE  q.quarter IN ('FY26-Q2','FY26-Q3') GROUP BY 1,2 ORDER BY 3 DESC`,
        result: `book-wide average discount 14.2%\nMid-Market 19.4% · SMB 12.1% · Enterprise 9.8%\nat Proposal 11.6% → at Negotiation 16.9%\n41% of quotes already carry a discount on the FIRST quote sent` },
      { kind: 'cypher', title: 'Rank reps by discount depth against attainment', nodes: ['rv_ae', 'rv_quote', 'rv_opportunity'],
        cypher: `MATCH (q:Quote)-[:QUOTES]->(o:Opportunity)-[:OWNED_BY]->(ae:AccountExecutive)
RETURN ae.name, avg(q.discount_pct) AS avg_discount, ae.attainment_pct,
       count(q) AS quotes ORDER BY avg_discount DESC`,
        result: `Daniel Osei → 24.1% avg discount · attainment  84%\nTom Bradley → 21.6% · 91%\nMarcus Webb → 15.3% · 96%\nPriya Raman → 11.2% · 112%\nElena Ruiz →  9.4% · 118%` },
      { kind: 'semantic', title: 'Check whether the buyer ever pushed back', nodes: ['rv_activity', 'rv_quote'],
        query: 'pricing objections raised on calls before a discount was issued',
        matches: [
          { score: 0.93, text: 'No pricing objection logged on the call preceding 38% of discounted quotes', src: 'Gong' },
          { score: 0.86, text: 'Discount approvals: 61% initiated by the rep, not by a buyer request', src: 'Salesforce' },
          { score: 0.79, text: '22% of first-year discounts persist into the renewal term', src: 'Zuora' },
        ] },
      { kind: 'cypher', title: 'Test what the discount actually buys', nodes: ['rv_quote', 'rv_opportunity', 'rv_contract'],
        cypher: `MATCH (q:Quote)-[:QUOTES]->(o:Opportunity)
WHERE o.stage IN ['Closed Won','Closed Lost']
RETURN CASE WHEN q.discount_pct >= 0.20 THEN 'deep' ELSE 'shallow' END AS band,
       avg(o.won) AS win_rate, percentileCont(o.days_to_close, 0.5) AS median_days,
       sum(q.list_amount_usd - q.amount_usd) AS given_away`,
        result: `discount ≥ 20% → win rate 39% · median 47 days to close\ndiscount < 10% → win rate 41% · median 44 days\n→ annualised leak $1.9M · $740K of it issued with no buyer objection on record` },
    ],
    answer: [
      { kind: 'verdict', text: 'About **$1.9M a year**, and $740K of it is given away before the buyer ever asks — deals discounted over 20% do not win more often or close any faster than deals discounted under 10%.' },
      { kind: 'para', text: "The book-wide average discount is 14.2%, but the dispersion is where the money is: Mid-Market runs 19.4% against Enterprise's 9.8%[1]. Discounting also deepens as deals age, from 11.6% at Proposal to 16.9% at Negotiation — defensible if the buyer were driving it. Mostly they are not." },
      { kind: 'bullet', text: '**38% of discounted quotes follow a call with no pricing objection on it**[3]. Salesforce agrees from the other side: 61% of discount approvals were initiated by the rep rather than requested by the buyer[3]. That is the $740K — a concession made against an objection that was never raised.' },
      { kind: 'bullet', text: '**41% of first quotes are already discounted**[1]. List price is being negotiated against before it has been presented, which forfeits the anchor and guarantees the second round starts lower.' },
      { kind: 'bullet', text: '**The discount buys nothing measurable.** Deals discounted 20% or more win 39% of the time in a median 47 days; deals under 10% win 41% in 44 days[5]. Deeper discounting is marginally *worse* on both dimensions — it is not purchasing speed or certainty.' },
      { kind: 'bullet', text: '**Rep dispersion runs inverse to attainment.** Daniel Osei averages 24.1% at 84% attainment and Tom Bradley 21.6% at 91%, while Priya Raman discounts 11.2% at 112% and Elena Ruiz 9.4% at 118%[2]. The reps giving the most away are hitting their numbers least, so this is coachable behaviour rather than a market condition.' },
      { kind: 'para', text: 'Two things compound it. 22% of first-year discounts persist into the renewal term[4] — Quantum Dynamics is currently disputing an Analytics uplift that exists only because the first year was discounted into it. And the segment leaking most is Mid-Market, the same segment where we lose to Atlas on row-level permissions[1] — reps are discounting to cover a capability gap, which is precisely why the money buys no additional wins[5].' },
      { kind: 'action', text: 'Recommend: (1) require a logged pricing objection before any discount approval — the Gong record already makes this checkable[3]; (2) ban discounts on the first quote so the anchor survives to Negotiation[1]; (3) coach Osei and Bradley on the attainment data rather than the discount policy — the correlation is the argument[2]; (4) price renewals off list rather than off the discounted first year to stop the 22% carry-through[4]; (5) fix the Mid-Market capability gap so price stops being the substitute answer[5].' },
    ],
    sources: [
      { n: 1, node: 'rv_quote', ref: 'QTE-Q3-DISC', detail: 'Avg discount 14.2% · MM 19.4% · Ent 9.8% · 41% discounted on the first quote' },
      { n: 2, node: 'rv_ae', ref: 'AE-2207', detail: 'Osei 24.1% at 84% attainment · Ruiz 9.4% at 118%' },
      { n: 3, node: 'rv_activity', ref: 'ACT-GONG-PRC', detail: 'No pricing objection before 38% of discounted quotes · 61% rep-initiated' },
      { n: 4, node: 'rv_contract', ref: 'CTR-RNW-22', detail: '22% of first-year discounts persist into the renewal term' },
      { n: 5, node: 'rv_opportunity', ref: 'OPP-DISC-BT', detail: 'Discount ≥20% → 39% win / 47 days vs <10% → 41% / 44 days · $1.9M leak' },
    ],
  },
}

const FALLBACK = {
  q: null,
  chain: [{ kind: 'cypher', title: 'Scope the graph', nodes: ['product', 'store', 'demand_signal'],
    cypher: `MATCH (n) RETURN labels(n), count(*)`,
    result: `15 node types across demand, supply and media` }],
  answer: [{ kind: 'para', text: "I answer questions grounded in the Nike Retail Context Graph by running Cypher over it — I can trace a sales pattern through demand signals, events, campaigns, media spend and inventory. Try one of the starter questions to see the queries run live." }],
  sources: [],
}

function matchScript(text) {
  const t = text.toLowerCase()
  // Revenue Teams — matched first. The retail/network routes below already claim
  // broad words like "campaign", "spend", "risk" and "predict", so these patterns
  // are deliberately narrow enough not to catch any of the questions they own.
  if (/atlas|win.?loss|competitor|lose to|losing deals/.test(t)) return 'competitive_loss'
  if (/discount|leaking margin|margin leak|pricing pressure/.test(t)) return 'discount_leak'
  if (/predicts? churn|churn model|health score|health driver|predictive weight/.test(t)) return 'health_drivers'
  if (/churn/.test(t)) return 'churn_watch'
  if (/renewal|renew\b|at risk in the next|next 90 days/.test(t)) return 'renewal_risk'
  if (/whitespace|white space|installed base|product penetration/.test(t)) return 'whitespace'
  if (/buying signal|expansion|upsell|intent signal|ready to buy/.test(t)) return 'expansion_signals'
  if (/commit\b|quota|forecast|make the number/.test(t)) return 'forecast_call'
  if (/slippage|about to slip|deals?[^?]*slip|slip[^?]*deals?|single.?thread|stalled deal/.test(t)) return 'deal_slippage'
  if (/funnel|stage conversion|stage.to.stage|conversion by segment/.test(t)) return 'stage_conversion'
  if (/campaigns?[^?]*pipeline|created pipeline|sourced pipeline|multi.?touch|last.?touch/.test(t)) return 'campaign_pipeline'
  if (/channel mix|spend go|cost per sourced|paid social|\babm\b/.test(t)) return 'channel_mix'
  if (/seattle|new york|nyc|jersey|usmnt/.test(t)) return 'seattle_ny'
  if (/air ?max/.test(t)) return 'airmax_spike'
  if (/pegasus|running|marathon/.test(t)) return 'pegasus_pnw'
  if (/stock|out of stock|risk|weeks of supply|replenish/.test(t)) return 'stockout_risk'
  if (/campaign|spend|roi|convert|media|push/.test(t)) return 'campaign_roi'
  if (/uptime|nevi|bay area|firmware|fault/.test(t)) return 'bayarea_uptime'
  if (/fail|predict|14 day|ignore/.test(t)) return 'failing_port'
  if (/truck roll|backlog|dispatch|p1|socal/.test(t)) return 'truck_rolls'
  if (/demand charge|tariff|fremont|energy|peak/.test(t)) return 'demand_charges'
  // Greif operations — matched ahead of the generic repair/maintenance catch-alls
  // below, which would otherwise swallow words like "fix" and "schedule".
  if (/oee|lavonia|throughput/.test(t)) return 'oee_drop'
  if (/pareto|unplanned downtime|downtime cost/.test(t)) return 'downtime_pareto'
  if (/changeover|sequenc|short run/.test(t)) return 'changeover_loss'
  if (/resin|hdpe|raw material|exposure/.test(t)) return 'resin_exposure'
  if (/otif|on.?time in full|dow chemical/.test(t)) return 'otif_miss'
  if (/freight|cost per ton|lane|deadhead/.test(t)) return 'freight_cost'
  if (/recordable|safety|ehs|injur/.test(t)) return 'safety_pattern'
  if (/non.?conformance|\bncr\b|quality|defect/.test(t)) return 'quality_ncr'
  if (/repair|broken|fix|what needs|order should/.test(t)) return 'repair_queue'
  if (/maintenance|preventive|\bpm\b|service due|schedule|cadence/.test(t)) return 'pm_schedule'
  return null
}

// Summarize the retrieval modalities used in a trace (for the collapsed header).
function traceKinds(chain) {
  const order = ['cypher', 'sql', 'semantic']
  const present = order.filter(k => chain.some(s => (s.kind || 'cypher') === k))
  return present.map(k => KIND[k].tag).join(' · ')
}

let MID = 0

export default function AgentChat({ onBack }) {
  const [agentId, setAgentId] = useState('demand')
  // Graph filter for the agent rail — derived from the agents themselves.
  const [graphFilter, setGraphFilter] = useState('All graphs')
  const [graphOpen, setGraphOpen] = useState(false)
  const graphRef = useRef(null)
  const graphOptions = ['All graphs', ...Array.from(new Set(AGENTS.map(a => a.graph)))]
  const graphCount = g => g === 'All graphs' ? AGENTS.length : AGENTS.filter(a => a.graph === g).length
  const visibleAgents = graphFilter === 'All graphs' ? AGENTS : AGENTS.filter(a => a.graph === graphFilter)
  useEffect(() => {
    if (!graphOpen) return
    const close = e => { if (graphRef.current && !graphRef.current.contains(e.target)) setGraphOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [graphOpen])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [srcPanel, setSrcPanel] = useState(null) // { sources, focus }
  const timers = useRef([])
  const scrollRef = useRef(null)
  const agent = AGENTS.find(a => a.id === agentId)
  const openSources = (sources, focus) => setSrcPanel({ sources, focus })

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight }, [messages])

  const patch = (id, fn) => setMessages(ms => ms.map(m => m.id === id ? fn(m) : m))

  const run = (scriptId, freeText) => {
    const script = SCRIPTS[scriptId] || FALLBACK
    const userText = freeText || script.q
    const uid = ++MID, aid = ++MID
    setMessages(ms => [...ms,
      { id: uid, role: 'user', text: userText },
      { id: aid, role: 'assistant', agentId, chain: script.chain, answer: script.answer, sources: script.sources, reveal: 0, phase: 'thinking' },
    ])
    const step = 900
    script.chain.forEach((_, i) => {
      timers.current.push(setTimeout(() => patch(aid, m => ({ ...m, reveal: i + 1 })), (i + 1) * step))
    })
    timers.current.push(setTimeout(() => patch(aid, m => ({ ...m, phase: 'done' })), script.chain.length * step + 650))
  }

  const send = () => { const t = input.trim(); if (!t) return; setInput(''); run(matchScript(t), t) }
  const newChat = () => { timers.current.forEach(clearTimeout); timers.current = []; setMessages([]); setSrcPanel(null) }

  return (
    <div style={{ flex: 1, minWidth: 0, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex' }}>
      {/* ── Agent rail ── */}
      <div style={{ width: 246, flexShrink: 0, borderRight: '1px solid #efece6', background: '#fbf9f3', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px' }}>
          <button onClick={onBack} title="Back" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#5b5547" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>AI Agents</span>
        </div>
        {/* Graph filter — quiet dropdown, options derived from the agent list */}
        <div ref={graphRef} style={{ position: 'relative', padding: '0 12px 10px' }}>
          <button onClick={() => setGraphOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 32, padding: '0 9px',
            boxSizing: 'border-box', borderRadius: 8, border: '1px solid ' + (graphOpen ? '#cfc7b6' : '#e3ddd1'),
            background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.6px', color: '#a89e88', flexShrink: 0 }}>GRAPH</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {graphFilter === 'All graphs' ? 'All graphs' : graphFilter.replace(/ Context Graph| Network Graph| Retail Context Graph/, '')}
            </span>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: graphOpen ? 'rotate(180deg)' : 'none' }}>
              <path d="M2.5 4L5 6.5 7.5 4" stroke="#a89e88" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {graphOpen && (
            <div style={{
              position: 'absolute', top: 36, left: 12, right: 12, zIndex: 40, background: '#fff',
              border: '1px solid #e3ddd1', borderRadius: 10, boxShadow: '0 8px 28px rgba(26,26,26,0.10)', padding: 4, overflow: 'hidden',
            }}>
              {graphOptions.map(g => {
                const on = g === graphFilter
                return (
                  <button key={g} onClick={() => {
                    setGraphFilter(g); setGraphOpen(false)
                    const next = g === 'All graphs' ? AGENTS : AGENTS.filter(a => a.graph === g)
                    if (next.length && !next.some(a => a.id === agentId)) { setAgentId(next[0].id); newChat() }
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', textAlign: 'left',
                    borderRadius: 7, border: 'none', background: on ? '#f4f2ec' : 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                    onMouseOver={e => { if (!on) e.currentTarget.style.background = '#faf8f3' }}
                    onMouseOut={e => { if (!on) e.currentTarget.style.background = 'transparent' }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: on ? 600 : 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#a89e88', flexShrink: 0 }}>{graphCount(g)}</span>
                    {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><path d="M2.5 6.2l2.2 2.2 4.8-4.8" stroke="#16341f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ padding: '4px 10px', flex: 1, overflowY: 'auto' }}>
          {visibleAgents.map(a => {
            const on = a.id === agentId
            return (
              <button key={a.id} onClick={() => { setAgentId(a.id); newChat() }} style={{
                display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '10px 10px', marginBottom: 4,
                borderRadius: 10, border: '1px solid ' + (on ? '#dfe7df' : 'transparent'), background: on ? '#fff' : 'transparent',
                boxShadow: on ? '0 1px 2px rgba(30,24,12,0.05)' : 'none', cursor: 'pointer',
              }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: a.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{a.name[0]}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{a.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: '#8a857c', lineHeight: 1.3, marginTop: 2 }}>{a.tagline}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: 12, fontSize: 11, color: '#a89e88', borderTop: '1px solid #efece6' }}>Grounded in the <b style={{ color: '#6b6960' }}>{agent.graph}</b></div>
      </div>

      {/* ── Conversation ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderBottom: '1px solid #efece6' }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: agent.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{agent.name[0]}</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: '#1a1a1a', flex: 1 }}>{agent.name}</span>
          {messages.length > 0 && (
            <button onClick={newChat} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e3ddd1', borderRadius: 8, padding: '0 12px', height: 32, fontSize: 13, color: '#3a3a36', cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>New chat
            </button>
          )}
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 26px' }}>
            {messages.length === 0 ? (
              <Empty agent={agent} onPick={run} />
            ) : (
              messages.map(m => m.role === 'user'
                ? <UserBubble key={m.id} text={m.text} />
                : <AssistantMessage key={m.id} msg={m} agent={AGENTS.find(a => a.id === m.agentId)} onOpenSources={openSources} />)
            )}
          </div>
        </div>

        {/* Composer */}
        <div style={{ padding: '12px 26px 20px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 10, border: '1px solid #e3ddd1', borderRadius: 14, background: '#fff', padding: '8px 8px 8px 16px', boxShadow: '0 1px 3px rgba(30,24,12,0.05)' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              rows={1} placeholder={`Ask ${agent.name}…`}
              style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: 14, fontFamily: 'var(--sans)', color: '#1a1a1a', background: 'transparent', maxHeight: 120, lineHeight: 1.5, padding: '6px 0' }} />
            <button onClick={send} disabled={!input.trim()} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: input.trim() ? 'var(--green-btn)' : '#e7e2d7', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M4 6.5 8 2.5l4 4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div style={{ maxWidth: 780, margin: '6px auto 0', textAlign: 'center', fontSize: 11, color: '#b5ad9c' }}>Answers run live as Cypher over the {agent.graph}.</div>
        </div>
      </div>

      {/* ── Sources pane (opens on demand) ── */}
      {srcPanel && <SourcePanel panel={srcPanel} onClose={() => setSrcPanel(null)} />}
    </div>
  )
}

function SourcePanel({ panel, onClose }) {
  const refs = useRef({})
  const [openRec, setOpenRec] = useState(null)
  useEffect(() => { setOpenRec(null) }, [panel])
  useEffect(() => {
    const el = refs.current[panel.focus]
    if (el) { el.scrollIntoView({ block: 'nearest' }); el.style.boxShadow = 'inset 3px 0 0 #16341f'; setTimeout(() => { if (el) el.style.boxShadow = 'none' }, 1400) }
  }, [panel])
  return (
    <div style={{ width: 340, flexShrink: 0, borderLeft: '1px solid #efece6', background: '#fbf9f3', display: 'flex', flexDirection: 'column', animation: 'fadeStep .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 16px 13px', borderBottom: '1px solid #efece6' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2.4" stroke="#2f6f43" strokeWidth="1.6" /><circle cx="18" cy="9" r="2.4" stroke="#2f6f43" strokeWidth="1.6" /><circle cx="9" cy="18" r="2.4" stroke="#2f6f43" strokeWidth="1.6" /><path d="M7.9 7.4 16 8.6M7.4 8 8.6 16" stroke="#2f6f43" strokeWidth="1.4" strokeLinecap="round" /></svg>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 15.5, fontWeight: 500, color: '#1a1a1a', flex: 1 }}>Sources</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#a89e88' }}>{panel.sources.length} records</span>
        <button onClick={onClose} title="Close" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', color: '#6b6b66', fontSize: 15, marginLeft: 4 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {panel.sources.map(s => {
          const n = NODE_BY_ID[s.node]
          return (
            <div key={s.n} ref={el => { refs.current[s.n] = el }}
              style={{ border: '1px solid #ececea', borderRadius: 10, background: '#fff', padding: '11px 12px', marginBottom: 10, transition: 'box-shadow .4s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 700, color: '#2f6f43', background: '#eef4ee', border: '1px solid #d6e6d8', borderRadius: 5, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
                {n && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}><ListGlyph node={n} size={15} />{n.label}</span>}
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#3a6ea0' }}>{s.ref}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#5b5547', lineHeight: 1.5 }}>{s.detail}</div>
              <div style={{ marginTop: 9, display: 'flex', gap: 6 }}>
                <button onClick={() => setOpenRec(o => o === s.n ? null : s.n)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#3a3a36', background: '#faf8f3', border: '1px solid #e7e0d2', borderRadius: 7, padding: '4px 9px', cursor: 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7a6f5c" strokeWidth="2"><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="9" r="2.2" /><circle cx="9" cy="18" r="2.2" /><path d="M8 7l8 1M8 8l1 8" /></svg>
                  Open in graph
                </button>
                <button onClick={() => setOpenRec(o => o === s.n ? null : s.n)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: openRec === s.n ? 600 : 400, color: openRec === s.n ? '#16341f' : '#3a3a36', background: openRec === s.n ? '#eef4ee' : '#faf8f3', border: '1px solid ' + (openRec === s.n ? '#d6e6d8' : '#e7e0d2'), borderRadius: 7, padding: '4px 9px', cursor: 'pointer' }}>
                  {openRec === s.n ? 'Hide record' : 'View record'}
                </button>
              </div>
              {openRec === s.n && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0eee7', animation: 'fadeStep .2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {n && <ListGlyph node={n} size={14} />}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600, color: '#1a1a1a' }}>{s.ref}</span>
                    <span style={{ fontSize: 11.5, color: '#9a948a' }}>· {n?.label}</span>
                  </div>
                  <div style={{ border: '1px solid #ececea', borderRadius: 8, overflow: 'hidden' }}>
                    {recordFields(s).map((f, fi) => (
                      <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', borderTop: fi ? '1px solid #f4f2ec' : 'none', background: '#fff' }}>
                        <div style={{ padding: '5px 9px', fontFamily: 'var(--mono)', fontSize: 10.5, color: '#8a857c', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {f.pk && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, background: '#1a1a1a', color: '#fff', borderRadius: 3, padding: '0 3px' }}>PK</span>}
                          {f.name}
                        </div>
                        <div style={{ padding: '5px 9px', fontFamily: 'var(--mono)', fontSize: 10.5, color: '#3a3a36', borderLeft: '1px solid #f4f2ec', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 7, fontSize: 10.5, color: '#a89e88' }}>Record from the {s.node.startsWith('cp_') ? 'ChargePoint Network Graph' : s.node.startsWith('gr_') ? 'Greif Operations Context Graph' : 'Nike Retail Context Graph'}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Empty({ agent, onPick }) {
  return (
    <div style={{ paddingTop: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
        <span style={{ width: 46, height: 46, borderRadius: 12, background: agent.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, marginBottom: 14 }}>{agent.name[0]}</span>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.3 }}>{agent.name}</div>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b6960', maxWidth: 540, lineHeight: 1.5 }}>{agent.greeting}</p>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', marginBottom: 10 }}>Try one of these</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {agent.starters.map(sid => {
          const s = SCRIPTS[sid]
          return (
            <button key={sid} onClick={() => onPick(sid)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '14px 16px',
              border: '1px solid #ececea', borderRadius: 12, background: '#fff', cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#d6e2d6'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#ececea'; e.currentTarget.style.boxShadow = 'none' }}>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{s.q}</span>
                <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, color: '#8a857c', marginTop: 3 }}>{s.tag}</span>
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b5ad9c" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <div style={{ maxWidth: '78%', background: '#eef3ee', border: '1px solid #dfe7df', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', fontSize: 14, color: '#1a1a1a', lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}

function NodeChip({ id, size = 14 }) {
  const n = NODE_BY_ID[id]; if (!n) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #e7e0d2', borderRadius: 6, padding: '1px 7px 1px 5px', fontSize: 12, fontWeight: 600, color: '#3a3a36', verticalAlign: 'middle' }}>
      <ListGlyph node={n} size={size} />{n.label}
    </span>
  )
}

// Query kinds — the agent retrieves across the graph, the warehouse and the
// knowledge base. Cypher is always primary/first; SQL + Semantic augment it.
const KIND = {
  cypher:   { label: 'Cypher', tag: 'Graph',     color: '#2f8f5b', bg: '#eef4ee', bd: '#d6e6d8' },
  sql:      { label: 'SQL', tag: 'Snowflake', color: '#3a6ea0', bg: '#eef3f9', bd: '#d3e0ee' },
  semantic: { label: 'Semantic search', tag: 'Knowledge', color: '#8a5cc0', bg: '#f2edfa', bd: '#e2d7f0' },
}
const KW = {
  cypher: /('[^']*')|\b(MATCH|OPTIONAL|WHERE|RETURN|WITH|AS|IN|ORDER BY|DESC|ASC|AND|OR|sum|avg|count|labels)\b/g,
  sql:    /('[^']*')|\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|JOIN|ON|AS|AND|OR|DESC|ASC|SUM|AVG|COUNT|CURRENT_WEEK|LIMIT)\b/g,
}

function CodeQuery({ kind, src }) {
  const re = KW[kind] || KW.cypher
  const out = []
  src.split('\n').forEach((line, li) => {
    const parts = []; let last = 0; let m; re.lastIndex = 0
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push(<span key={parts.length}>{line.slice(last, m.index)}</span>)
      if (m[1]) parts.push(<span key={parts.length} style={{ color: '#b8923a' }}>{m[1]}</span>)
      else parts.push(<span key={parts.length} style={{ color: KIND[kind].color, fontWeight: 600 }}>{m[2]}</span>)
      last = m.index + m[0].length
    }
    if (last < line.length) parts.push(<span key={parts.length}>{line.slice(last)}</span>)
    out.push(<div key={li} style={{ whiteSpace: 'pre-wrap' }}>{parts}</div>)
  })
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.55, color: '#5b5547', background: '#f4f2ec', border: '1px solid #eae6dc', borderRadius: 8, padding: '9px 11px', overflowX: 'auto' }}>{out}</div>
}

// Semantic step renders as a natural-language query + ranked knowledge matches.
function SemanticQuery({ query, matches }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f2ec', border: '1px solid #eae6dc', borderRadius: 8, padding: '8px 11px' }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="4" stroke="#8a5cc0" strokeWidth="1.5" /><path d="M9.2 9.2 12 12" stroke="#8a5cc0" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#5b4a6e', fontStyle: 'italic' }}>“{query}”</span>
      </div>
      <div style={{ marginTop: 7, display: 'grid', gap: 5 }}>
        {matches.map((mt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 700, color: '#8a5cc0', background: '#f2edfa', border: '1px solid #e2d7f0', borderRadius: 4, padding: '0 5px', flexShrink: 0 }}>{mt.score}</span>
            <span style={{ fontSize: 12.5, color: '#3a3a36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mt.text}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#a89e88', flexShrink: 0 }}>{mt.src}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Render answer text with **bold** and inline [n] citations.
function Rich({ text, onCite }) {
  const nodes = []; let last = 0; let m
  const re = /\*\*(.+?)\*\*|\[(\d+)\]/g
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1]) nodes.push(<b key={nodes.length} style={{ fontWeight: 600, color: '#1a1a1a' }}>{m[1]}</b>)
    else nodes.push(
      <sup key={nodes.length} onClick={() => onCite?.(+m[2])} title="Jump to source"
        style={{ cursor: 'pointer', fontSize: 9.5, fontWeight: 700, color: '#2f6f43', background: '#eef4ee', border: '1px solid #d6e6d8', borderRadius: 4, padding: '0 3px', margin: '0 1px', verticalAlign: 'super' }}>{m[2]}</sup>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return <>{nodes}</>
}

function AssistantMessage({ msg, agent, onOpenSources }) {
  const thinking = msg.phase === 'thinking'
  const done = msg.phase === 'done'
  const [open, setOpen] = useState(true)
  const wasThinking = useRef(true)
  // Auto-collapse the trace once the answer is generated.
  useEffect(() => { if (done && wasThinking.current) { setOpen(false); wasThinking.current = false } }, [done])
  const shown = msg.chain.slice(0, msg.reveal)
  // Inline citation → open the sources pane focused on that record.
  const jumpToCite = n => onOpenSources?.(msg.sources, n)

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: agent.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{agent.name[0]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Reasoning trace — collapses to a header once done */}
        <div style={{ border: '1px solid #ececea', borderRadius: 12, background: '#fbfaf6', overflow: 'hidden', marginBottom: done ? 14 : 0 }}>
          <button onClick={() => done && setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'transparent', cursor: done ? 'pointer' : 'default', borderBottom: (open && shown.length) ? '1px solid #f0eee7' : 'none' }}>
            <GraphSpark spinning={thinking} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: '#8a857c', flex: 1 }}>
              {thinking ? 'Retrieving across graph, warehouse & knowledge…' : `Traced · ${msg.chain.length} steps · ${traceKinds(msg.chain)}`}
            </span>
            {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a89e88" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}><path d="M6 9l6 6 6-6" /></svg>}
          </button>
          {open && shown.map((st, i) => {
            const k = KIND[st.kind || 'cypher']
            return (
            <div key={i} style={{ padding: '11px 14px', borderTop: i ? '1px solid #f4f2ec' : 'none', animation: 'fadeStep .25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#b5ad9c', width: 14, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: k.color, background: k.bg, border: '1px solid ' + k.bd, borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>{k.label} · {k.tag}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#3a3a36', flex: 1 }}>{st.title}</span>
              </div>
              <div style={{ paddingLeft: 22 }}>
                {st.kind === 'semantic'
                  ? <SemanticQuery query={st.query} matches={st.matches} />
                  : <><CodeQuery kind={st.kind || 'cypher'} src={st.cypher} />
                      {st.result && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7dbb92', paddingTop: 1, flexShrink: 0 }}>▸</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#4b6b56', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{st.result}</span>
                        </div>
                      )}</>}
              </div>
            </div>
          )})}
        </div>

        {/* Answer with inline citations */}
        {done && (
          <div style={{ animation: 'fadeStep .3s ease' }}>
            {msg.answer.map((b, i) => {
              if (b.kind === 'verdict') return <p key={i} style={{ margin: '0 0 12px', fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#16341f', lineHeight: 1.4 }}><Rich text={b.text} onCite={jumpToCite} /></p>
              if (b.kind === 'bullet') return <div key={i} style={{ display: 'flex', gap: 8, margin: '0 0 8px', fontSize: 14, color: '#3a3a36', lineHeight: 1.6 }}><span style={{ color: '#16341f', marginTop: 1 }}>•</span><span><Rich text={b.text} onCite={jumpToCite} /></span></div>
              if (b.kind === 'list') return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '0 0 8px', padding: '10px 12px', background: '#faf9f5', border: '1px solid #f0eee7', borderRadius: 9 }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: '#16341f', color: '#fff', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)' }}>{b.n}</span>
                  <span style={{ fontSize: 13.5, color: '#3a3a36', lineHeight: 1.55, paddingTop: 2 }}><Rich text={b.text} onCite={jumpToCite} /></span>
                </div>
              )
              if (b.kind === 'action') return <div key={i} style={{ marginTop: 12, padding: '12px 14px', background: '#f3f7f3', border: '1px solid #dce8dc', borderRadius: 10, fontSize: 13.5, color: '#20492e', lineHeight: 1.55 }}><Rich text={b.text} onCite={jumpToCite} /></div>
              return <p key={i} style={{ margin: '0 0 11px', fontSize: 14, color: '#3a3a36', lineHeight: 1.65 }}><Rich text={b.text} onCite={jumpToCite} /></p>
            })}

            {/* Compact sources trigger — numbers open the pane on demand */}
            {msg.sources?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0eee7', flexWrap: 'wrap' }}>
                <button onClick={() => onOpenSources?.(msg.sources, msg.sources[0].n)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 500, color: '#3a3a36', background: '#fff', border: '1px solid #e3ddd1', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2.2" stroke="#2f6f43" strokeWidth="1.7" /><circle cx="18" cy="9" r="2.2" stroke="#2f6f43" strokeWidth="1.7" /><circle cx="9" cy="18" r="2.2" stroke="#2f6f43" strokeWidth="1.7" /><path d="M8 7l8 1M8 8l1 8" stroke="#2f6f43" strokeWidth="1.4" /></svg>
                  {msg.sources.length} sources
                </button>
                {msg.sources.map(s => (
                  <button key={s.n} onClick={() => onOpenSources?.(msg.sources, s.n)} title={`${NODE_BY_ID[s.node]?.label} · ${s.ref}`}
                    style={{ width: 22, height: 22, borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#2f6f43', background: '#eef4ee', border: '1px solid #d6e6d8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GraphSpark({ spinning }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, animation: spinning ? 'graphSpin 1.4s linear infinite' : 'none' }}>
      <circle cx="6" cy="6" r="2.4" stroke="#2f6f43" strokeWidth="1.6" />
      <circle cx="18" cy="9" r="2.4" stroke="#2f6f43" strokeWidth="1.6" />
      <circle cx="9" cy="18" r="2.4" stroke="#2f6f43" strokeWidth="1.6" />
      <path d="M7.9 7.4 16 8.6M7.4 8 8.6 16" stroke="#2f6f43" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
