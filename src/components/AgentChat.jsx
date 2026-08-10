import { useState, useRef, useEffect } from 'react'
import { NIKE_DATA, CHARGEPOINT_DATA, ListGlyph } from './GraphStage'

// ── Node lookup (for rendering graph chips in the reasoning trace) ──
const NODE_BY_ID = (() => { const m = {}; [...NIKE_DATA.nodes, ...CHARGEPOINT_DATA.nodes].forEach(n => { m[n.id] = n }); return m })()

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
  if (/seattle|new york|nyc|jersey|usmnt/.test(t)) return 'seattle_ny'
  if (/air ?max/.test(t)) return 'airmax_spike'
  if (/pegasus|running|marathon/.test(t)) return 'pegasus_pnw'
  if (/stock|out of stock|risk|weeks of supply|replenish/.test(t)) return 'stockout_risk'
  if (/campaign|spend|roi|convert|media|push/.test(t)) return 'campaign_roi'
  if (/uptime|nevi|bay area|firmware|fault/.test(t)) return 'bayarea_uptime'
  if (/fail|predict|14 day|ignore/.test(t)) return 'failing_port'
  if (/truck roll|backlog|dispatch|p1|socal/.test(t)) return 'truck_rolls'
  if (/demand charge|tariff|fremont|energy|peak/.test(t)) return 'demand_charges'
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
        <div style={{ padding: '4px 10px', flex: 1, overflowY: 'auto' }}>
          {AGENTS.map(a => {
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
                  <div style={{ marginTop: 7, fontSize: 10.5, color: '#a89e88' }}>Record from the {s.node.startsWith('cp_') ? 'ChargePoint Network Graph' : 'Nike Retail Context Graph'}</div>
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
