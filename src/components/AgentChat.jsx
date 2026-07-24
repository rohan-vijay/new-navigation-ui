import { useState, useRef, useEffect } from 'react'
import { NIKE_DATA, ListGlyph } from './GraphStage'

// ── Node lookup (for rendering graph chips in the reasoning trace) ──
const NODE_BY_ID = (() => { const m = {}; NIKE_DATA.nodes.forEach(n => { m[n.id] = n }); return m })()

// ── Agents ──────────────────────────────────────────────────────────────────
const AGENTS = [
  { id: 'demand',  name: 'Retail Demand Analyst', color: '#16341f', tagline: 'Explains demand spikes across product, store, media & supply.',
    greeting: "I'm grounded in the Nike Retail Context Graph. I answer by running Cypher over the graph — ask me why a product is moving in a market and I'll trace it through demand, media and supply.",
    starters: ['seattle_ny', 'airmax_spike', 'pegasus_pnw'] },
  { id: 'supply',  name: 'Supply Chain Copilot', color: '#3a6ea0', tagline: 'Spots stockout risk and replenishment gaps before they cost sales.',
    greeting: "I watch inventory positions, weeks-of-supply and inbound replenishment across every door. I query the graph directly — ask me where you're about to lose sales.",
    starters: ['stockout_risk', 'seattle_ny', 'pegasus_pnw'] },
  { id: 'merch',   name: 'Merch & Campaign Analyst', color: '#8a5a2b', tagline: 'Ties sell-through back to campaigns, media spend and events.',
    greeting: "I connect sell-through to the campaigns, paid media and cultural events behind it. I run Cypher across the graph — ask me what's actually driving a lift.",
    starters: ['campaign_roi', 'airmax_spike', 'seattle_ny'] },
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
      { kind: 'para', text: 'Both metros are riding the same World Cup lift[2] (impact 0.90), so the underlying pull is comparable. The divergence comes from two levers the graph makes explicit:' },
      { kind: 'bullet', text: '**Media** — 8× more paid spend went to the Pacific Northwest ($48K vs $6K)[3], so Seattle demand is being actively amplified while New York is left to run on its own.' },
      { kind: 'bullet', text: '**Supply** — Nike NYC is down to 1.2 weeks of supply[4] with replenishment still 3 days out[5]. It is turning away sales it would otherwise convert, which mechanically depresses its sell-through[1].' },
      { kind: 'para', text: 'Decomposing the gap: roughly ~60% is media allocation, ~40% is the New York stockout. Critically, NY purchase intent is healthy — search index 132 vs Seattle 148[1] — so this is a fulfillment problem, not a want problem.' },
      { kind: 'action', text: 'Recommend: (1) expedite SH-5540 into Nike NYC[5]; (2) rebalance ~$15K of Pacific NW spend to the Northeast[3] while the event window is open; (3) hold Seattle — it is converting cleanly.' },
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
      { kind: 'para', text: 'The demand signal is surging (+42% add-to-cart, 0.81 sell-through)[1] but paid media is flat week-over-week[3]. The lift lines up with the Air Max Day event[2], a cultural moment rather than a funded push — the graph shows the spike arriving *before* any spend change.' },
      { kind: 'para', text: "That's the good kind of demand: you're not paying for it. The risk is under-supplying a moment you didn't forecast." },
      { kind: 'action', text: 'Recommend: (1) add incremental spend now to compound free momentum[3]; (2) pull Air Max 90 inventory forward before the event tail fades[1].' },
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
      { kind: 'verdict', text: 'Seasonal running demand — the region is running 17% ahead of forecast.' },
      { kind: 'para', text: 'Pegasus 41 is a running franchise and the Pacific NW is in marathon season[2], which is pulling sell-through to 0.76 and Rising[1]. Actuals are outrunning the o9 forecast by ~900 units[3], so the plan is under-calling this pocket of demand.' },
      { kind: 'action', text: 'Recommend: (1) raise the regional forecast to actuals[3]; (2) pull replenishment forward into Seattle & Portland before the season peaks[1].' },
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
      { kind: 'verdict', text: 'Three doors at risk — Chicago is the most urgent because it has no inbound cover.' },
      { kind: 'bullet', text: '**Nike Chicago** — 1.9 weeks, demand Rising[2], and no open replenishment[3]. Highest lost-sales risk.' },
      { kind: 'bullet', text: '**Nike NYC** — thinnest at 1.2 weeks[1] but SH-5540 lands in 3 days[3]; it will squeeze but recover.' },
      { kind: 'bullet', text: '**Nike Miami** — 1.6 weeks with replenishment 6 days out[3]; borderline, watch-list.' },
      { kind: 'action', text: 'Recommend: open an expedite for Chicago today[3], confirm the NYC ETA holds, and keep Miami on watch. All three still have Rising demand[2] — none will self-correct.' },
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
      { kind: 'verdict', text: 'Converting where it lands — but the allocation is skewed and leaving demand on the table.' },
      { kind: 'para', text: 'Where the Push spent heavily (Pacific NW, $48K)[1], sell-through is 0.89 vs 0.71 in the lightly-spent Northeast[2] — so the media is genuinely working, not just impressions. The problem is distribution: the Northeast has live demand but both thin spend[1] and thin inventory[3].' },
      { kind: 'para', text: "Scaling spend into the Northeast right now would partly fund demand you can't fulfill (NYC at 1.2 weeks)[3] — so sequencing matters." },
      { kind: 'action', text: 'Recommend: shift ~$15K to the Northeast, but stage it to land *after* SH-5540 replenishes NYC[3] — otherwise you pay for demand that stocks out.' },
    ],
    sources: [
      { n: 1, node: 'media_spend', ref: 'AD-9912', detail: '$48K PNW / 2.4M impr vs $6K NE' },
      { n: 2, node: 'demand_signal', ref: 'SIG-587794', detail: 'PNW sell-through 0.89 vs NE 0.71' },
      { n: 3, node: 'inventory', ref: 'IP-7781', detail: 'Northeast (Nike NYC) 1.2 weeks of supply' },
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
  const timers = useRef([])
  const scrollRef = useRef(null)
  const agent = AGENTS.find(a => a.id === agentId)

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
  const newChat = () => { timers.current.forEach(clearTimeout); timers.current = []; setMessages([]) }

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
        <div style={{ padding: 12, fontSize: 11, color: '#a89e88', borderTop: '1px solid #efece6' }}>Grounded in the <b style={{ color: '#6b6960' }}>Nike Retail Context Graph</b></div>
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
                : <AssistantMessage key={m.id} msg={m} agent={AGENTS.find(a => a.id === m.agentId)} />)
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
          <div style={{ maxWidth: 780, margin: '6px auto 0', textAlign: 'center', fontSize: 11, color: '#b5ad9c' }}>Answers run live as Cypher over the Nike Retail Context Graph.</div>
        </div>
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

function AssistantMessage({ msg, agent }) {
  const thinking = msg.phase === 'thinking'
  const done = msg.phase === 'done'
  const [open, setOpen] = useState(true)
  const wasThinking = useRef(true)
  // Auto-collapse the trace once the answer is generated.
  useEffect(() => { if (done && wasThinking.current) { setOpen(false); wasThinking.current = false } }, [done])
  const shown = msg.chain.slice(0, msg.reveal)
  const srcRefs = useRef({})

  const jumpToCite = n => { const el = srcRefs.current[n]; if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.background = '#f3f7f3'; setTimeout(() => { el.style.background = 'transparent' }, 1200) } }

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
                {st.nodes?.map((nid, kk) => <NodeChip key={kk} id={nid} size={13} />)}
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
              if (b.kind === 'action') return <div key={i} style={{ marginTop: 12, padding: '12px 14px', background: '#f3f7f3', border: '1px solid #dce8dc', borderRadius: 10, fontSize: 13.5, color: '#20492e', lineHeight: 1.55 }}><Rich text={b.text} onCite={jumpToCite} /></div>
              return <p key={i} style={{ margin: '0 0 11px', fontSize: 14, color: '#3a3a36', lineHeight: 1.65 }}><Rich text={b.text} onCite={jumpToCite} /></p>
            })}

            {/* Sources — resolve each [n] to the exact graph record */}
            {msg.sources?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0eee7' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', marginBottom: 8 }}>Sources · graph records</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {msg.sources.map(s => (
                    <div key={s.n} ref={el => { srcRefs.current[s.n] = el }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 8, transition: 'background .4s' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#2f6f43', background: '#eef4ee', border: '1px solid #d6e6d8', borderRadius: 4, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
                      <NodeChip id={s.node} size={13} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#3a6ea0', flexShrink: 0 }}>{s.ref}</span>
                      <span style={{ fontSize: 12.5, color: '#8a857c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.detail}</span>
                    </div>
                  ))}
                </div>
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
