import { useState, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as echarts from 'echarts'

// ─── AI APPLICATIONS ─────────────────────────────────────────────────────────
// Visual applications built on the ChargePoint Network Graph. Three demo apps:
//   'map'      → Network Atlas        — live Leaflet map of station health
//   'insights' → Network Pulse        — executive insights dashboard (ECharts)
//   'fleet'    → Fleet Readiness Board — overnight charging vs tomorrow's routes
// Inline styles only; Leaflet for the map, ECharts for the dashboard charts,
// hand-drawn SVG for sparklines / thumbnails / small widgets.

const INK = '#1a1a1a'
const MUTED = '#9a948a'
const LINE = '#ececea'
const LINE2 = '#e3ddd1'
const CANVAS = '#fcfbf7'
const PLATE = '#FEFDFB'
const HEALTH = { good: '#2f9e5a', warn: '#d99214', bad: '#c0492f' }
const BLUE = '#2f6fdb'
const GREEN = '#0f8a5f'
const CORAL = '#c2543a'
const PURPLE = '#6b5aa6'

const card = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12 }
const mono = { fontFamily: 'var(--mono)' }
const serif = { fontFamily: 'var(--serif)' }

const fmtK = n => n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K'
  : String(n)

// ─── US SILHOUETTE (used only for the list-view thumbnail) ───────────────────
const US_PATH =
  'M95 95 L170 78 L260 70 L360 66 L440 70 L478 64 L500 78 L528 92 L556 84 ' +
  'L592 98 L612 128 L628 104 L652 96 L668 120 L700 106 L726 118 L752 100 ' +
  'L776 84 L806 64 L820 86 L804 116 L812 138 L832 152 L814 166 L800 190 ' +
  'L786 214 L796 238 L782 262 L806 290 L796 326 L772 354 L786 394 L798 448 ' +
  'L792 506 L768 498 L748 448 L732 412 L688 398 L636 402 L596 414 L566 436 ' +
  'L540 422 L506 430 L478 448 L452 486 L432 524 L404 478 L368 438 L326 420 ' +
  'L276 416 L226 410 L178 398 L150 388 L122 342 L96 288 L84 236 L78 180 L86 128 Z'

// ─── METRO CLUSTERS ──────────────────────────────────────────────────────────
// { id, name, lat, lng, x, y (thumbnail only), stations, uptimePct, health, faults, utilization }
const METROS = [
  { id: 'sea', name: 'Seattle',          lat: 47.61, lng: -122.33, x: 118, y: 108, stations: 8420,  uptimePct: 98.9, health: 'good', faults: 22,  utilization: 61 },
  { id: 'pdx', name: 'Portland',         lat: 45.52, lng: -122.68, x: 102, y: 150, stations: 4210,  uptimePct: 98.7, health: 'good', faults: 14,  utilization: 58 },
  { id: 'slc', name: 'Salt Lake City',   lat: 40.76, lng: -111.89, x: 236, y: 232, stations: 2140,  uptimePct: 98.8, health: 'good', faults: 7,   utilization: 52 },
  { id: 'sac', name: 'Sacramento',       lat: 38.58, lng: -121.49, x: 122, y: 268, stations: 3860,  uptimePct: 98.4, health: 'good', faults: 18,  utilization: 66 },
  { id: 'sfo', name: 'Bay Area',         lat: 37.77, lng: -122.42, x: 104, y: 296, stations: 18240, uptimePct: 96.8, health: 'warn', faults: 214, utilization: 84 },
  { id: 'sjc', name: 'San Jose',         lat: 37.34, lng: -121.89, x: 128, y: 320, stations: 11380, uptimePct: 96.2, health: 'warn', faults: 186, utilization: 88 },
  { id: 'fre', name: 'Fremont Corridor', lat: 37.55, lng: -121.99, x: 146, y: 304, stations: 2410,  uptimePct: 94.1, health: 'bad',  faults: 96,  utilization: 91 },
  { id: 'lax', name: 'Los Angeles',      lat: 34.05, lng: -118.24, x: 150, y: 368, stations: 24630, uptimePct: 98.5, health: 'good', faults: 74,  utilization: 79 },
  { id: 'san', name: 'San Diego',        lat: 32.72, lng: -117.16, x: 162, y: 390, stations: 6120,  uptimePct: 98.9, health: 'good', faults: 19,  utilization: 72 },
  { id: 'las', name: 'Las Vegas',        lat: 36.17, lng: -115.14, x: 198, y: 322, stations: 3480,  uptimePct: 98.6, health: 'good', faults: 12,  utilization: 69 },
  { id: 'phx', name: 'Phoenix',          lat: 33.45, lng: -112.07, x: 234, y: 368, stations: 5240,  uptimePct: 96.9, health: 'warn', faults: 61,  utilization: 74 },
  { id: 'den', name: 'Denver',           lat: 39.74, lng: -104.99, x: 332, y: 262, stations: 6890,  uptimePct: 98.8, health: 'good', faults: 21,  utilization: 63 },
  { id: 'msp', name: 'Minneapolis',      lat: 44.98, lng: -93.27,  x: 492, y: 132, stations: 4720,  uptimePct: 98.9, health: 'good', faults: 13,  utilization: 55 },
  { id: 'kc',  name: 'Kansas City',      lat: 39.10, lng: -94.58,  x: 468, y: 272, stations: 2980,  uptimePct: 98.7, health: 'good', faults: 9,   utilization: 51 },
  { id: 'stl', name: 'St. Louis',        lat: 38.63, lng: -90.20,  x: 528, y: 276, stations: 3120,  uptimePct: 98.6, health: 'good', faults: 11,  utilization: 54 },
  { id: 'chi', name: 'Chicago',          lat: 41.88, lng: -87.63,  x: 566, y: 188, stations: 11940, uptimePct: 98.7, health: 'good', faults: 38,  utilization: 71 },
  { id: 'det', name: 'Detroit',          lat: 42.33, lng: -83.05,  x: 630, y: 158, stations: 5210,  uptimePct: 98.5, health: 'good', faults: 17,  utilization: 62 },
  { id: 'cmh', name: 'Columbus',         lat: 39.96, lng: -83.00,  x: 640, y: 225, stations: 2980,  uptimePct: 98.8, health: 'good', faults: 9,   utilization: 53 },
  { id: 'nsh', name: 'Nashville',        lat: 36.16, lng: -86.78,  x: 598, y: 308, stations: 2870,  uptimePct: 98.9, health: 'good', faults: 7,   utilization: 57 },
  { id: 'atl', name: 'Atlanta',          lat: 33.75, lng: -84.39,  x: 650, y: 338, stations: 8340,  uptimePct: 98.6, health: 'good', faults: 26,  utilization: 68 },
  { id: 'mia', name: 'Miami',            lat: 25.76, lng: -80.19,  x: 786, y: 486, stations: 7150,  uptimePct: 98.4, health: 'good', faults: 23,  utilization: 73 },
  { id: 'orl', name: 'Orlando',          lat: 28.54, lng: -81.38,  x: 762, y: 432, stations: 4480,  uptimePct: 98.7, health: 'good', faults: 12,  utilization: 64 },
  { id: 'clt', name: 'Charlotte',        lat: 35.23, lng: -80.84,  x: 700, y: 310, stations: 3640,  uptimePct: 98.7, health: 'good', faults: 11,  utilization: 60 },
  { id: 'rdu', name: 'Raleigh',          lat: 35.78, lng: -78.64,  x: 740, y: 285, stations: 2470,  uptimePct: 98.9, health: 'good', faults: 6,   utilization: 56 },
  { id: 'aus', name: 'Austin',           lat: 30.27, lng: -97.74,  x: 446, y: 428, stations: 5630,  uptimePct: 98.8, health: 'good', faults: 16,  utilization: 67 },
  { id: 'dal', name: 'Dallas',           lat: 32.78, lng: -96.80,  x: 456, y: 384, stations: 8910,  uptimePct: 98.6, health: 'good', faults: 28,  utilization: 65 },
  { id: 'hou', name: 'Houston',          lat: 29.76, lng: -95.37,  x: 490, y: 432, stations: 7820,  uptimePct: 98.5, health: 'good', faults: 25,  utilization: 66 },
  { id: 'dc',  name: 'Washington DC',    lat: 38.90, lng: -77.04,  x: 756, y: 232, stations: 6740,  uptimePct: 98.8, health: 'good', faults: 18,  utilization: 70 },
  { id: 'phl', name: 'Philadelphia',     lat: 39.95, lng: -75.17,  x: 774, y: 206, stations: 4980,  uptimePct: 98.7, health: 'good', faults: 15,  utilization: 62 },
  { id: 'nyc', name: 'New York',         lat: 40.71, lng: -74.01,  x: 792, y: 178, stations: 14210, uptimePct: 98.5, health: 'good', faults: 47,  utilization: 81 },
  { id: 'bos', name: 'Boston',           lat: 42.36, lng: -71.06,  x: 812, y: 140, stations: 6230,  uptimePct: 98.8, health: 'good', faults: 14,  utilization: 66 },
]

// marker radius: sqrt scale, 8–26px
const SQ_MIN = Math.sqrt(980), SQ_MAX = Math.sqrt(24630)
const metroR = s => Math.max(8, Math.min(26, 8 + ((Math.sqrt(s) - SQ_MIN) / (SQ_MAX - SQ_MIN)) * 18))

// Per-metro detail for the right panel. Special-cased for the firmware story;
// derived generically for healthy metros.
const METRO_DETAIL = {
  sfo: {
    faults: [['E-341 Contactor weld', 118], ['E-217 Comms loss', 64], ['E-108 Payment terminal', 32]],
    sites: [['Oakland Port Depot', 97.2, 'good'], ['SFO Cell Lot', 96.4, 'warn'], ['Mission Bay Garage', 95.9, 'warn'], ['Berkeley Transit Hub', 97.8, 'good']],
    techs: 3, riskPorts: 41,
    note: 'CT4000 fw 5.1.2.1104 rollback in progress — 61% of faults trace to this build.',
  },
  sjc: {
    faults: [['E-341 Contactor weld', 102], ['E-217 Comms loss', 58], ['E-512 Ground fault', 26]],
    sites: [['San Jose Airport', 95.8, 'warn'], ['Milpitas Transit Hub', 96.4, 'warn'], ['Santana Row Garage', 97.6, 'good'], ['North First Campus', 97.1, 'good']],
    techs: 3, riskPorts: 34,
    note: 'Same 5.1.2.1104 firmware cohort as Bay Area — rollback queued tonight.',
  },
  fre: {
    faults: [['E-341 Contactor weld', 54], ['E-217 Comms loss', 28], ['E-108 Payment terminal', 14]],
    sites: [['Fremont Depot', 94.1, 'bad'], ['Warm Springs BART', 95.2, 'warn'], ['Pacific Commons', 96.1, 'warn'], ['Ardenwood Park & Ride', 97.3, 'good']],
    techs: 4, riskPorts: 23,
    note: 'Worst corridor on the network this week — Assure SLA exposure $118K.',
  },
  phx: {
    faults: [['E-733 Thermal derate', 38], ['E-217 Comms loss', 15], ['E-341 Contactor weld', 8]],
    sites: [['Sky Harbor Lot C', 96.2, 'warn'], ['Tempe Marketplace', 97.4, 'good'], ['Scottsdale Quarter', 97.0, 'good'], ['Mesa Riverview', 97.9, 'good']],
    techs: 2, riskPorts: 12,
    note: 'Heat-driven thermal derates — cabinet fan retrofit scheduled for 14 sites.',
  },
}
function metroDetail(m) {
  if (METRO_DETAIL[m.id]) return METRO_DETAIL[m.id]
  return {
    faults: [['E-104 Screen unresponsive', Math.max(1, Math.round(m.faults * 0.4))], ['E-217 Comms loss', Math.max(1, Math.round(m.faults * 0.3))]],
    sites: [
      [`${m.name} Depot`, Math.min(99.6, m.uptimePct + 0.4), 'good'],
      [`${m.name} Transit Hub`, m.uptimePct, 'good'],
      [`${m.name} Airport`, Math.max(97.1, m.uptimePct - 0.3), 'good'],
    ],
    techs: 2, riskPorts: Math.max(1, Math.round(m.faults * 0.2)),
    note: null,
  }
}

// 7-day uptime series per metro (story-driven for the degraded metros,
// deterministic wiggle for the healthy ones).
const WEEK_SERIES = {
  sfo: [98.2, 97.9, 96.1, 95.8, 96.4, 96.7, 96.8],
  sjc: [98.0, 97.6, 95.4, 95.1, 95.9, 96.0, 96.2],
  fre: [97.4, 96.8, 93.2, 92.8, 93.6, 94.0, 94.1],
  phx: [97.8, 97.5, 97.1, 96.6, 96.5, 96.8, 96.9],
}
function weekSeries(m) {
  if (WEEK_SERIES[m.id]) return WEEK_SERIES[m.id]
  const seed = m.id.charCodeAt(0) + m.id.charCodeAt(1) * 3
  return [0, 1, 2, 3, 4, 5, 6].map(i =>
    Math.round((m.uptimePct + Math.sin(seed + i * 1.7) * 0.18) * 100) / 100)
}

// Expansion scoring — present for degraded / waitlisted / saturated metros.
const EXPANSION = {
  sjc: [84, 'Milpitas waitlist 240 drivers'],
  sfo: [76, 'Mission Bay queue events up 3×'],
  fre: [71, 'corridor at 91% peak — 8 ports scored'],
  phx: [68, 'Sky Harbor waitlist 90 drivers'],
  nyc: [82, '81% peak occupancy citywide'],
  lax: [74, '79% peak occupancy'],
}

// ─── ECHARTS SHARED STYLING + HELPER ─────────────────────────────────────────

const ECH_FONT = 'JetBrains Mono, ui-monospace, monospace'
const AX_LABEL = { fontFamily: ECH_FONT, fontSize: 10, color: MUTED }
const TT = {
  backgroundColor: '#fff', borderColor: LINE2, borderWidth: 1, padding: [7, 10],
  textStyle: { fontFamily: ECH_FONT, fontSize: 11, color: '#4b463d' },
  extraCssText: 'box-shadow:0 4px 14px rgba(26,26,26,0.09);border-radius:8px;',
}
const catAxis = data => ({
  type: 'category', data,
  axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false },
  axisLabel: AX_LABEL, splitLine: { show: false },
})
const valAxis = (extra = {}) => ({
  type: 'value',
  axisLine: { show: false }, axisTick: { show: false }, axisLabel: AX_LABEL,
  splitLine: { lineStyle: { color: LINE } },
  ...extra,
})

// Shared ECharts host: inits on a ref div, observes resize, disposes on unmount
// (StrictMode-safe: cleanup disposes, remount re-inits).
function Chart({ option, height = 220 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let chart = echarts.getInstanceByDom(el)
    if (!chart) chart = echarts.init(el)
    chart.setOption(option, true)
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => { ro.disconnect(); chart.dispose() }
  }, [option])
  return <div ref={ref} style={{ width: '100%', height, minWidth: 0 }} />
}

// ─── SMALL SHARED PIECES ─────────────────────────────────────────────────────

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Back to applications" style={{
      width: 32, height: 32, borderRadius: '50%', border: `1px solid ${LINE2}`,
      background: '#fff', color: INK, cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, lineHeight: 1, paddingBottom: 2, transition: 'background .15s',
    }}
      onMouseOver={e => e.currentTarget.style.background = '#f4f1ea'}
      onMouseOut={e => e.currentTarget.style.background = '#fff'}>
      ‹
    </button>
  )
}

function AppHeader({ title, subtitle, onBack, right }) {
  return (
    <div style={{ padding: '16px 26px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
      <BackButton onClick={onBack} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...serif, fontSize: 21, fontWeight: 500, color: INK, letterSpacing: -0.2, lineHeight: 1.15 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{subtitle}</div>
      </div>
      {right}
    </div>
  )
}

function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: HEALTH.good, border: '1px solid #cde7d6', background: '#f2faf5', borderRadius: 20, padding: '3px 10px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: HEALTH.good }} />
      Live
    </span>
  )
}

function NodeChip({ label }) {
  return (
    <span style={{ ...mono, fontSize: 10.5, color: '#6b6455', border: `1px solid ${LINE2}`, background: '#faf8f3', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function StatusDot({ health }) {
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: HEALTH[health] || HEALTH.good, display: 'inline-block', flexShrink: 0 }} />
}

// Generic SVG sparkline (metro panel + national trend strip).
function Spark({ values, w = 130, h = 36, color = BLUE, floor = null, lo = null, hi = null }) {
  const vLo = lo != null ? lo : Math.min(...values) - 0.25
  const vHi = hi != null ? hi : Math.max(...values) + 0.25
  const X = i => 3 + i * ((w - 6) / (values.length - 1))
  const Y = v => 3 + ((vHi - v) / (vHi - vLo)) * (h - 6)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, display: 'block' }}>
      {floor != null && floor > vLo && floor < vHi && (
        <line x1="3" y1={Y(floor)} x2={w - 3} y2={Y(floor)} stroke={CORAL} strokeWidth="1" strokeDasharray="3 3" />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(values.length - 1)} cy={Y(values[values.length - 1])} r="2.2" fill={color} />
    </svg>
  )
}

// ─── LIST VIEW ───────────────────────────────────────────────────────────────

const APPS = [
  {
    id: 'c360', name: 'Customer 360',
    desc: 'One customer, six lenses — every revenue team sees what they need.',
    stats: '42,850 accounts · 6 personas · 14 sources',
    chips: ['Account', 'Opportunity', 'Subscription', 'Support Ticket', 'Marketing Touch'],
    graph: 'Revenue Teams Context Graph',
  },
  {
    id: 'map', name: 'Network Atlas',
    desc: 'Live map of every station across the US, colored by health.',
    stats: '31 metros · 312,441 stations · 3 degraded',
    chips: ['Charging Station', 'Site', 'Fault Alert', 'Failure Risk'],
  },
  {
    id: 'insights', name: 'Network Pulse',
    desc: 'Executive insights: uptime, energy, sessions, faults, SLA exposure.',
    stats: '12 sources · 9.8M sessions/wk · $312K SLA exposure',
    chips: ['Charging Session', 'Payment', 'Fault Alert', 'Utilization Signal'],
  },
  {
    id: 'fleet', name: 'Fleet Readiness Board',
    desc: "Every depot's overnight charging vs tomorrow's routes.",
    stats: '6 fleets · 214 vehicles tonight · 9 at risk',
    chips: ['Fleet Operator', 'Vehicle', 'Charging Port', 'Tariff Plan'],
  },
]

function AtlasThumb() {
  const dots = ['sea', 'sfo', 'sjc', 'fre', 'lax', 'phx', 'den', 'dal', 'chi', 'atl', 'mia', 'nyc', 'dc']
    .map(id => METROS.find(m => m.id === id)).filter(Boolean)
  return (
    <svg viewBox="50 30 800 520" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <path d={US_PATH} fill="#f4f1ea" stroke="#d8d2c4" strokeWidth="2" />
      {dots.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={Math.max(8, metroR(m.stations) * 0.8)}
          fill={HEALTH[m.health]} fillOpacity="0.22" stroke={HEALTH[m.health]} strokeWidth="2.5" />
      ))}
    </svg>
  )
}

function PulseThumb() {
  const pts = [98.4, 98.55, 98.7, 98.5, 98.75, 98.6, 98.3, 98.5, 96.5, 97.6, 98.3, 98.61]
  const X = i => 16 + i * (208 / 11)
  const Y = v => 14 + ((99.4 - v) / (99.4 - 95.8)) * 78
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      {[30, 55, 80].map(y => <line key={y} x1="12" y1={y} x2="228" y2={y} stroke={LINE} strokeWidth="1" />)}
      <line x1="12" y1={Y(97)} x2="228" y2={Y(97)} stroke={CORAL} strokeWidth="1" strokeDasharray="4 3" />
      <path d={`${line} L ${X(11).toFixed(1)} 104 L ${X(0)} 104 Z`} fill={BLUE} opacity="0.08" />
      <path d={line} fill="none" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={X(8)} cy={Y(96.5)} r="3" fill="#fff" stroke={CORAL} strokeWidth="1.6" />
    </svg>
  )
}

function FleetThumb() {
  const rows = [[88, 'good'], [64, 'good'], [42, 'bad'], [95, 'good'], [71, 'warn']]
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      {rows.map(([pct, h], i) => {
        const y = 14 + i * 20
        return (
          <g key={i}>
            <circle cx="16" cy={y + 5} r="3.4" fill={HEALTH[h]} fillOpacity="0.25" stroke={HEALTH[h]} strokeWidth="1.4" />
            <rect x="30" y={y} width="180" height="10" rx="5" fill="#f1efe9" />
            <rect x="30" y={y} width={180 * pct / 100} height="10" rx="5" fill={h === 'bad' ? HEALTH.bad : HEALTH.good} opacity={h === 'bad' ? 0.8 : 0.65} />
          </g>
        )
      })}
    </svg>
  )
}

// Customer record: health-score ring on the left, a stack of revenue metrics
// on the right — one bar per motion (pipeline / seats / touches / tickets).
function C360Thumb() {
  const r = 32, C = 2 * Math.PI * r
  const bars = [[0.78, BLUE], [0.62, PURPLE], [0.44, GREEN], [0.21, CORAL]]
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <circle cx="58" cy="60" r={r} fill="none" stroke="#f1efe9" strokeWidth="9" />
      <circle cx="58" cy="60" r={r} fill="none" stroke={HEALTH.warn} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${0.72 * C} ${C}`} transform="rotate(-90 58 60)" />
      <text x="58" y="65" textAnchor="middle" style={{ ...mono, fontSize: 19, fontWeight: 600, fill: INK }}>72</text>
      {bars.map(([pct, color], i) => {
        const y = 24 + i * 22
        return (
          <g key={i}>
            <rect x="112" y={y} width="112" height="9" rx="4.5" fill="#f1efe9" />
            <rect x="112" y={y} width={112 * pct} height="9" rx="4.5" fill={color} opacity="0.62" />
          </g>
        )
      })}
    </svg>
  )
}

const THUMBS = { c360: C360Thumb, map: AtlasThumb, insights: PulseThumb, fleet: FleetThumb }

function AppCard({ app, onOpen }) {
  const Thumb = THUMBS[app.id]
  return (
    <div onClick={onOpen} style={{
      ...card, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
      transition: 'box-shadow .15s, border-color .15s',
    }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(26,26,26,0.07)'; e.currentTarget.style.borderColor = '#d8d2c4' }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = LINE }}>
      <div style={{ height: 148, background: CANVAS, borderBottom: `1px solid ${LINE}`, padding: 10 }}>
        <Thumb />
      </div>
      <div style={{ padding: '16px 18px 14px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...serif, fontSize: 17, fontWeight: 500, color: INK, flex: 1 }}>{app.name}</span>
          <LiveBadge />
        </div>
        <div style={{ fontSize: 13, color: '#6b6455', lineHeight: 1.45 }}>{app.desc}</div>
        <div style={{ ...mono, fontSize: 10.5, color: MUTED }}>{app.stats}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {app.chips.map(c => <NodeChip key={c} label={c} />)}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid #f4f2ee`, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: MUTED }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="3" cy="6" r="1.8" stroke={MUTED} strokeWidth="1.1" />
            <circle cx="9" cy="2.8" r="1.8" stroke={MUTED} strokeWidth="1.1" />
            <circle cx="9" cy="9.2" r="1.8" stroke={MUTED} strokeWidth="1.1" />
            <path d="M4.6 5.2L7.4 3.6M4.6 6.8L7.4 8.4" stroke={MUTED} strokeWidth="1.1" />
          </svg>
          Built on {app.graph || 'ChargePoint Network Graph'}
        </div>
      </div>
    </div>
  )
}

function AppList({ onOpen }) {
  return (
    <>
      <div style={{ padding: '18px 26px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <h1 style={{ flex: 1, ...serif, fontSize: 27, fontWeight: 500, color: INK, letterSpacing: -0.3, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            Applications
          </h1>
          <button style={{
            background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
            padding: '0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', transition: 'background .15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
            onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Build New App
          </button>
        </div>
        <div style={{ fontSize: 13.5, color: MUTED, paddingBottom: 18 }}>
          Visual applications built on your enterprise context graphs.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 26px 26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {APPS.map(app => <AppCard key={app.id} app={app} onOpen={() => onOpen(app.id)} />)}
        </div>
      </div>
    </>
  )
}

// ─── APP 1: NETWORK ATLAS ────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'good', label: 'Healthy' },
  { key: 'warn', label: 'Degraded' },
  { key: 'bad', label: 'Critical' },
]

function FilterPills({ filter, setFilter }) {
  const counts = { all: METROS.length }
  METROS.forEach(m => { counts[m.health] = (counts[m.health] || 0) + 1 })
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {FILTERS.map(f => {
        const active = filter === f.key
        const accent = f.key === 'all' ? INK : HEALTH[f.key]
        return (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            border: `1px solid ${active ? accent : LINE2}`, background: active ? '#fff' : 'transparent',
            color: active ? accent : '#6b6455', borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
            boxShadow: active ? '0 1px 4px rgba(26,26,26,0.06)' : 'none',
          }}>
            {f.key !== 'all' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: HEALTH[f.key] }} />}
            {f.label}
            <span style={{ ...mono, fontSize: 10.5, color: active ? accent : MUTED }}>{counts[f.key] || 0}</span>
          </button>
        )
      })}
    </div>
  )
}

function MetroSearch({ query, setQuery }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search metros"
        style={{ border: `1px solid ${LINE2}`, borderRadius: 8, padding: '6px 10px 6px 27px', fontSize: 12.5, color: '#374151', outline: 'none', width: 140, background: '#fff', transition: 'border-color .15s' }}
        onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = LINE2} />
    </div>
  )
}

function ViewToggle({ view, setView }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${LINE2}`, borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(26,26,26,0.05)' }}>
      {[['map', 'Map'], ['table', 'Table']].map(([v, label]) => (
        <button key={v} onClick={() => setView(v)} style={{
          border: 'none', padding: '5px 14px', fontSize: 12, fontWeight: view === v ? 600 : 500, cursor: 'pointer',
          background: view === v ? '#16341f' : 'transparent', color: view === v ? '#fff' : '#6b6455', transition: 'all .15s',
        }}>{label}</button>
      ))}
    </div>
  )
}

// Real Leaflet map: CARTO Positron tiles + circle markers per metro.
function AtlasMap({ filter, query, selectedId, onSelect }) {
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // init / teardown (StrictMode-safe: cleanup removes the map, remount re-creates)
  useEffect(() => {
    const el = divRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, {
      center: [39.5, -98.35], zoom: 4.4, zoomSnap: 0.2, zoomDelta: 0.6,
      minZoom: 3.4, scrollWheelZoom: true, zoomControl: false,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19,
    }).addTo(map)
    const markers = {}
    METROS.forEach(m => {
      const mk = L.circleMarker([m.lat, m.lng], {
        radius: metroR(m.stations),
        fillColor: HEALTH[m.health], fillOpacity: 0.25,
        color: HEALTH[m.health], weight: 2,
      })
      mk.bindTooltip(
        `<span style="font-family:var(--serif);font-size:12.5px;font-weight:600;color:${INK}">${m.name}</span><br/>` +
        `<span style="font-family:var(--mono);font-size:10px;color:${MUTED}">${m.stations.toLocaleString()} stations · ` +
        `<span style="color:${HEALTH[m.health]}">${m.uptimePct.toFixed(1)}% uptime</span></span>`,
        { sticky: true, direction: 'top', opacity: 1 },
      )
      mk.on('click', () => onSelectRef.current(m.id))
      mk.addTo(map)
      markers[m.id] = mk
    })
    markersRef.current = markers
    mapRef.current = map
    // panel open/close resizes the container — keep leaflet in sync
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; markersRef.current = {} }
  }, [])

  // filter + search → marker visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const q = query.trim().toLowerCase()
    METROS.forEach(m => {
      const mk = markersRef.current[m.id]
      if (!mk) return
      const match = (filter === 'all' || m.health === filter) && (!q || m.name.toLowerCase().includes(q))
      if (match) { if (!map.hasLayer(mk)) mk.addTo(map) }
      else if (map.hasLayer(mk)) map.removeLayer(mk)
    })
  }, [filter, query])

  // search → fly to the first match and open its panel
  useEffect(() => {
    const map = mapRef.current
    const q = query.trim().toLowerCase()
    if (!map || q.length < 3) return
    const m = METROS.find(x => x.name.toLowerCase().includes(q))
    if (m) {
      map.flyTo([m.lat, m.lng], 7, { duration: 1.1 })
      onSelectRef.current(m.id)
    }
  }, [query])

  // selection emphasis
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, mk]) => {
      const sel = id === selectedId
      mk.setStyle({ weight: sel ? 3.5 : 2, fillOpacity: sel ? 0.45 : 0.25 })
      if (sel) mk.bringToFront()
    })
  }, [selectedId])

  return <div ref={divRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
}

function UptimeBar({ pct, floor = 97 }) {
  // scale 90 → 100
  const P = v => ((v - 90) / 10) * 100
  const color = pct >= floor ? HEALTH.good : pct >= 96 ? HEALTH.warn : HEALTH.bad
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Uptime vs NEVI floor</span>
        <span style={{ ...mono, fontSize: 12, fontWeight: 600, color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 5, background: '#f1efe9', overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${P(pct)}%`, background: color, opacity: 0.75, borderRadius: 5 }} />
        </div>
        <div style={{ position: 'absolute', left: `${P(floor)}%`, top: -3, bottom: -3, width: 2, background: CORAL, borderRadius: 1 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ ...mono, fontSize: 9.5, color: '#c4beb2' }}>90%</span>
        <span style={{ ...mono, fontSize: 9.5, color: CORAL }}>NEVI 97%</span>
        <span style={{ ...mono, fontSize: 9.5, color: '#c4beb2' }}>100%</span>
      </div>
    </div>
  )
}

// Compact uptime readout + bar for the leaderboard table.
function InlineUptime({ pct }) {
  const P = v => ((v - 90) / 10) * 100
  const color = pct >= 97 ? HEALTH.good : pct >= 96 ? HEALTH.warn : HEALTH.bad
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color, width: 44, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
      <span style={{ position: 'relative', width: 92, height: 6, borderRadius: 3, background: '#f1efe9', display: 'inline-block' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${P(pct)}%`, background: color, opacity: 0.7, borderRadius: 3 }} />
        <span style={{ position: 'absolute', left: `${P(97)}%`, top: -2, bottom: -2, width: 1.5, background: CORAL }} />
      </span>
    </span>
  )
}

function ModelBars({ stations }) {
  const models = [
    ['CT4000', Math.round(stations * 0.62)],
    ['Express Plus', Math.round(stations * 0.26)],
    ['CPF50', Math.round(stations * 0.12)],
  ]
  const max = models[0][1]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {models.map(([name, count]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...mono, fontSize: 10.5, color: '#6b6455', width: 82, flexShrink: 0 }}>{name}</span>
          <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#f1efe9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: BLUE, opacity: 0.55, borderRadius: 4 }} />
          </div>
          <span style={{ ...mono, fontSize: 10.5, color: MUTED, width: 40, textAlign: 'right', flexShrink: 0 }}>{fmtK(count)}</span>
        </div>
      ))}
    </div>
  )
}

function MetroPanel({ metro, onClose }) {
  const d = metroDetail(metro)
  const series = weekSeries(metro)
  const exp = EXPANSION[metro.id]
  const sessionsDay = Math.round(metro.stations * 4.6)
  const energyDay = Math.round(metro.stations * 0.032) // MWh
  const sect = { fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, marginBottom: 8 }
  const sparkLo = Math.min(...series, 96.8) - 0.35
  const sparkHi = Math.max(...series, 97.2) + 0.25
  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${LINE}`, background: PLATE, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 17 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot health={metro.health} />
            <span style={{ ...serif, fontSize: 18, fontWeight: 500, color: INK }}>{metro.name}</span>
          </div>
          <div style={{ ...mono, fontSize: 11, color: MUTED, marginTop: 4 }}>
            {metro.stations.toLocaleString()} stations · {metro.faults} open faults
          </div>
        </div>
        <button onClick={onClose} aria-label="Close panel" style={{
          width: 24, height: 24, borderRadius: '50%', border: `1px solid ${LINE2}`, background: '#fff',
          color: MUTED, cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>

      <UptimeBar pct={metro.uptimePct} />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={sect}>Uptime · last 7 days</span>
          <span style={{ ...mono, fontSize: 9.5, color: CORAL }}>⋯ 97%</span>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 10px' }}>
          <Spark values={series} w={256} h={46} color={HEALTH[metro.health]} floor={97} lo={sparkLo} hi={sparkHi} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ ...mono, fontSize: 9, color: '#c4beb2' }}>Aug 3</span>
            <span style={{ ...mono, fontSize: 9, color: '#c4beb2' }}>Aug 9</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[['Sessions / day', fmtK(sessionsDay)], ['Energy / day', `${energyDay.toLocaleString()} MWh`]].map(([label, val]) => (
          <div key={label} style={{ flex: 1, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 12px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
            <div style={{ ...mono, fontSize: 15, fontWeight: 600, color: INK, marginTop: 3 }}>{val}</div>
          </div>
        ))}
      </div>

      {d.note && (
        <div style={{ fontSize: 12, lineHeight: 1.5, color: '#7a4a3a', background: '#faf1ee', border: '1px solid #eddcd5', borderRadius: 9, padding: '9px 12px' }}>
          {d.note}
        </div>
      )}

      <div>
        <div style={sect}>Stations by model</div>
        <ModelBars stations={metro.stations} />
      </div>

      <div>
        <div style={sect}>Open faults</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {d.faults.map(([code, n]) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
              <span style={{ ...mono, fontSize: 10.5, color: CORAL, border: '1px solid #eddcd5', background: '#faf1ee', borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>
                {code.split(' ')[0]}
              </span>
              <span style={{ flex: 1, color: '#4b463d' }}>{code.split(' ').slice(1).join(' ')}</span>
              <span style={{ ...mono, fontSize: 11, color: MUTED }}>× {n}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={sect}>Top sites</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {d.sites.map(([name, up, h], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < d.sites.length - 1 ? '1px solid #f4f2ee' : 'none', fontSize: 12.5 }}>
              <StatusDot health={h} />
              <span style={{ flex: 1, color: '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <span style={{ ...mono, fontSize: 11, color: HEALTH[h] }}>{up.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b6455' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="4" r="2.2" stroke="#6b6455" strokeWidth="1.2" />
          <path d="M2.2 11.5a4.3 4.3 0 0 1 8.6 0" stroke="#6b6455" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Dispatch coverage: {d.techs} technician{d.techs === 1 ? '' : 's'} in region
      </div>

      <div style={{ borderLeft: `3px solid ${PURPLE}`, background: '#f7f5fb', border: '1px solid #e5e0f0', borderLeftWidth: 3, borderLeftColor: PURPLE, borderRadius: 9, padding: '10px 13px' }}>
        <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: PURPLE, marginBottom: 6 }}>Derived signals</div>
        <div style={{ fontSize: 12, color: '#4b463d', lineHeight: 1.6 }}>
          <div><b style={{ color: PURPLE }}>Failure Risk</b> — {d.riskPorts} ports scoring &gt; 0.6</div>
          <div><b style={{ color: PURPLE }}>Utilization</b> — {metro.utilization}% peak occupancy</div>
          {exp && <div><b style={{ color: PURPLE }}>Expansion</b> — score {exp[0]}/100 · {exp[1]}</div>}
        </div>
      </div>
    </div>
  )
}

function MetroTable({ metros, selected, onSelect }) {
  const th = { textAlign: 'left', padding: '9px 14px', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED, borderBottom: `1px solid ${LINE}`, background: '#F7F5F3', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 1 }
  const td = { padding: '8px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }
  const rows = [...metros].sort((a, b) => a.uptimePct - b.uptimePct)
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '54px 16px 16px' }}>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 40 }}>#</th>
              <th style={th}>Metro</th>
              <th style={{ ...th, textAlign: 'right' }}>Stations</th>
              <th style={th}>Uptime vs NEVI <span style={{ ...mono, fontSize: 9, color: '#cfc9bd' }}>▲ asc</span></th>
              <th style={{ ...th, textAlign: 'right' }}>Faults</th>
              <th style={{ ...th, textAlign: 'right' }}>Util %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => {
              const isSel = selected === m.id
              return (
                <tr key={m.id}
                  onClick={() => onSelect(m.id)}
                  style={{ cursor: 'pointer', background: isSel ? '#f7f6f3' : '#fff', boxShadow: isSel ? 'inset 3px 0 0 #16341f' : 'none', transition: 'background .12s' }}
                  onMouseOver={e => { if (!isSel) e.currentTarget.style.background = '#faf9f6' }}
                  onMouseOut={e => { if (!isSel) e.currentTarget.style.background = '#fff' }}>
                  <td style={{ ...td, ...mono, fontSize: 11, color: MUTED, borderBottom: i < rows.length - 1 ? '1px solid #f4f2ee' : 'none' }}>{i + 1}</td>
                  <td style={{ ...td, borderBottom: i < rows.length - 1 ? '1px solid #f4f2ee' : 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: INK }}>
                      <StatusDot health={m.health} />{m.name}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d', borderBottom: i < rows.length - 1 ? '1px solid #f4f2ee' : 'none' }}>{m.stations.toLocaleString()}</td>
                  <td style={{ ...td, borderBottom: i < rows.length - 1 ? '1px solid #f4f2ee' : 'none' }}><InlineUptime pct={m.uptimePct} /></td>
                  <td style={{ ...td, textAlign: 'right', ...mono, fontSize: 11.5, color: m.faults > 50 ? CORAL : '#4b463d', borderBottom: i < rows.length - 1 ? '1px solid #f4f2ee' : 'none' }}>{m.faults}</td>
                  <td style={{ ...td, textAlign: 'right', ...mono, fontSize: 11.5, color: m.utilization >= 85 ? HEALTH.warn : '#4b463d', borderBottom: i < rows.length - 1 ? '1px solid #f4f2ee' : 'none' }}>{m.utilization}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED, fontSize: 13 }}>No metros match.</div>
        )}
      </div>
    </div>
  )
}

const NATIONAL_UPTIME = [98.42, 98.55, 98.70, 98.48, 98.74, 98.60, 98.31, 98.52, 96.50, 97.62, 98.34, 98.61]

function NationalTrendStrip() {
  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${LINE}`, background: PLATE, padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>National trend</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Spark values={NATIONAL_UPTIME} w={160} h={30} color={BLUE} floor={97} lo={96} hi={99.3} />
        <span style={{ ...mono, fontSize: 10.5, color: '#6b6455' }}>12-wk uptime · now <b style={{ color: HEALTH.good }}>98.61%</b></span>
      </div>
      <span style={{ width: 1, height: 20, background: LINE }} />
      <span style={{ ...mono, fontSize: 10.5, color: '#6b6455' }}>Stations added this quarter <b style={{ color: INK }}>+8,412</b></span>
      <span style={{ width: 1, height: 20, background: LINE }} />
      <span style={{ ...mono, fontSize: 10.5, color: '#6b6455' }}>NEVI-funded share <b style={{ color: INK }}>14.2%</b></span>
    </div>
  )
}

function NetworkAtlas({ onBack }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('map')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const matches = m => (filter === 'all' || m.health === filter) && (!q || m.name.toLowerCase().includes(q))
  const visible = METROS.filter(matches)

  return (
    <>
      <style>{`.leaflet-container{background:${CANVAS};font-family:inherit}
        .leaflet-tooltip{border:1px solid ${LINE2};border-radius:8px;box-shadow:0 2px 8px rgba(26,26,26,0.10);padding:7px 11px}
        .leaflet-control-zoom a{color:#4b463d}`}</style>
      <AppHeader
        onBack={onBack}
        title="Network Atlas"
        subtitle="312,441 stations · live health from NOS Telemetry"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MetroSearch query={query} setQuery={setQuery} />
            <FilterPills filter={filter} setFilter={setFilter} />
          </div>
        }
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', background: CANVAS, minHeight: 0 }}>
            {/* Map | Table toggle — top-right of the map area */}
            <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 1200 }}>
              <ViewToggle view={view} setView={setView} />
            </div>

            {view === 'table' ? (
              <MetroTable metros={visible} selected={selected} onSelect={setSelected} />
            ) : (
              <>
                <AtlasMap filter={filter} query={query} selectedId={selected} onSelect={setSelected} />

                {/* KPI micro-strip, top-left (above the leaflet panes) */}
                <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 1200, display: 'flex', gap: 0, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 0', boxShadow: '0 2px 8px rgba(26,26,26,0.07)' }}>
                  {[['Network uptime', '98.61%', HEALTH.good], ['Ports online', '96.9%', INK], ['Active faults', '1,204', CORAL]].map(([label, val, color], i) => (
                    <div key={label} style={{ padding: '0 16px', borderLeft: i ? `1px solid ${LINE}` : 'none' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
                      <div style={{ ...mono, fontSize: 14, fontWeight: 600, color, marginTop: 2 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Legend, bottom-left */}
                <div style={{ position: 'absolute', bottom: 14, left: 16, zIndex: 1200, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 8px rgba(26,26,26,0.07)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[['good', 'Healthy · ≥ 97% uptime'], ['warn', 'Degraded · 96–97%'], ['bad', 'Critical · < 96%']].map(([h, label]) => (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#4b463d' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: HEALTH[h], opacity: 0.25, border: `1.6px solid ${HEALTH[h]}`, boxSizing: 'border-box' }} />
                      {label}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: MUTED, marginTop: 2, paddingTop: 7, borderTop: '1px solid #f4f2ee' }}>
                    <svg width="26" height="14" viewBox="0 0 26 14">
                      <circle cx="5" cy="7" r="3" fill="none" stroke="#b9b2a6" strokeWidth="1.2" />
                      <circle cx="17" cy="7" r="6" fill="none" stroke="#b9b2a6" strokeWidth="1.2" />
                    </svg>
                    Size = stations
                  </div>
                </div>
              </>
            )}
          </div>

          <NationalTrendStrip />
        </div>

        {selected && <MetroPanel metro={METROS.find(m => m.id === selected)} onClose={() => setSelected(null)} />}
      </div>
    </>
  )
}

// ─── APP 2: NETWORK PULSE ────────────────────────────────────────────────────

const KPIS = [
  { label: 'Network Uptime', value: '98.61%', delta: '▲ 0.2 pts vs last week', good: true },
  { label: 'Sessions', value: '9.8M', delta: '▲ 4% vs last week', good: true },
  { label: 'Energy Delivered', value: '68.4 GWh', delta: '▲ 3.1 GWh vs last week', good: true },
  { label: 'Revenue', value: '$14.2M', delta: '▲ 2.6% vs last week', good: true },
  { label: 'SLA Exposure', value: '$312K', delta: '▼ $96K after Bay Area fix', good: true },
]

// 26 weeks of national uptime, dip 3 weeks back (fw 5.1.2.1104 incident).
const UPTIME26 = [
  98.32, 98.45, 98.51, 98.40, 98.62, 98.55, 98.47, 98.66, 98.58, 98.49,
  98.61, 98.72, 98.44, 98.36, 98.58, 98.63, 98.42, 98.55, 98.70, 98.48,
  98.74, 98.60, 96.50, 97.62, 98.34, 98.61,
]
const UPTIME26_LABELS = Array.from({ length: 26 }, (_, i) => {
  const d = new Date(2026, 7, 9)
  d.setDate(d.getDate() - (25 - i) * 7)
  return `${d.getMonth() + 1}/${d.getDate()}`
})
const DIP_INDEX = 22

const UPTIME_OPTION = {
  grid: { left: 44, right: 16, top: 18, bottom: 46 },
  tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v}%` },
  xAxis: { ...catAxis(UPTIME26_LABELS), boundaryGap: false },
  yAxis: valAxis({ min: 96, max: 99.5, axisLabel: { ...AX_LABEL, formatter: '{value}%' } }),
  dataZoom: [
    { type: 'inside' },
    { type: 'slider', height: 14, bottom: 8, borderColor: LINE, fillerColor: 'rgba(47,111,219,0.08)', handleSize: 14, textStyle: AX_LABEL },
  ],
  series: [{
    name: 'Uptime', type: 'line', smooth: true, data: UPTIME26, showSymbol: false, symbolSize: 5,
    lineStyle: { color: BLUE, width: 2 }, itemStyle: { color: BLUE },
    areaStyle: { color: BLUE, opacity: 0.07 },
    markLine: {
      silent: true, symbol: 'none',
      lineStyle: { color: CORAL, type: 'dashed', width: 1.2 },
      label: { formatter: 'NEVI floor 97%', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
      data: [{ yAxis: 97 }],
    },
    markPoint: {
      symbol: 'circle', symbolSize: 9,
      itemStyle: { color: '#fff', borderColor: CORAL, borderWidth: 2 },
      label: { formatter: '96.5% · fw incident', position: 'bottom', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5, distance: 8 },
      data: [{ coord: [DIP_INDEX, 96.5] }],
    },
  }],
}

const FAULT_PARETO = [
  ['CT4000 · fw 5.1.2.1104', 61],
  ['Express Plus · fw 7.0.3', 7],
  ['CPF50 · fw 3.9.12', 5],
  ['All other hardware', 12],
]
const PARETO_OPTION = {
  grid: { left: 158, right: 42, top: 10, bottom: 10 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => `${v} fault clusters` },
  xAxis: valAxis({ show: false }),
  yAxis: { ...catAxis(FAULT_PARETO.map(f => f[0])), inverse: true, axisLine: { show: false } },
  series: [{
    type: 'bar', data: FAULT_PARETO.map(f => f[1]), barWidth: 15,
    label: { show: true, position: 'right', fontFamily: ECH_FONT, fontSize: 10.5, fontWeight: 600, color: CORAL },
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: CORAL }, { offset: 1, color: '#dd8f74' },
      ]),
    },
  }],
}

// 14 days: Jul 27 → Aug 9
const DAY14_LABELS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 7, 9)
  d.setDate(d.getDate() - (13 - i))
  return `${d.getMonth() + 1}/${d.getDate()}`
})
const SESSIONS_14 = [1.25, 1.29, 1.33, 1.36, 1.40, 1.37, 1.28, 1.32, 1.38, 1.41, 1.44, 1.47, 1.43, 1.35]
const ENERGY_14 = [8.8, 9.0, 9.3, 9.6, 9.8, 9.5, 8.9, 9.2, 9.5, 9.8, 10.1, 10.3, 10.0, 9.5]

const SESSIONS_OPTION = {
  grid: { left: 40, right: 40, top: 28, bottom: 26 },
  tooltip: { trigger: 'axis', ...TT },
  legend: { top: 0, left: 40, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  dataZoom: [{ type: 'inside' }],
  xAxis: catAxis(DAY14_LABELS),
  yAxis: [
    valAxis({ max: 1.6, axisLabel: { ...AX_LABEL, formatter: '{value}M' } }),
    valAxis({ max: 11, splitLine: { show: false }, axisLabel: { ...AX_LABEL, formatter: '{value}' } }),
  ],
  series: [
    { name: 'Sessions (M)', type: 'bar', data: SESSIONS_14, itemStyle: { color: BLUE, opacity: 0.65, borderRadius: [3, 3, 0, 0] }, barWidth: '28%' },
    { name: 'Energy (GWh)', type: 'bar', yAxisIndex: 1, data: ENERGY_14, itemStyle: { color: GREEN, opacity: 0.65, borderRadius: [3, 3, 0, 0] }, barWidth: '28%' },
  ],
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HEAT_BUCKETS = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']
const HEATMAP = [
  [12, 8, 6, 9, 24, 38, 46, 52, 71, 88, 74, 38],
  [13, 9, 7, 10, 26, 40, 48, 55, 74, 91, 78, 41],
  [14, 9, 7, 11, 27, 41, 50, 56, 76, 93, 80, 43],
  [13, 10, 8, 11, 28, 42, 51, 58, 78, 94, 82, 44],
  [15, 10, 8, 12, 30, 44, 54, 61, 80, 96, 84, 48],
  [18, 12, 9, 14, 34, 52, 58, 54, 62, 70, 58, 36],
  [16, 11, 8, 12, 30, 46, 52, 48, 55, 63, 50, 30],
]
const HEATMAP_OPTION = {
  grid: { left: 42, right: 12, top: 10, bottom: 26 },
  tooltip: {
    ...TT,
    formatter: p => {
      const bucket = HEAT_BUCKETS[p.value[0]]
      const end = String((Number(bucket) + 2) % 24).padStart(2, '0')
      return `${DAYS[p.value[1]]} ${bucket}:00–${end}:00<br/><b>${p.value[2]}%</b> avg port occupancy`
    },
  },
  xAxis: { ...catAxis(HEAT_BUCKETS), axisLine: { show: false } },
  yAxis: { ...catAxis(DAYS), inverse: true, axisLine: { show: false } },
  visualMap: {
    show: false, min: 20, max: 95,
    inRange: { color: ['#e6f2ea', '#8cc9a3', HEALTH.good, HEALTH.warn, HEALTH.bad] },
  },
  series: [{
    type: 'heatmap',
    data: HEATMAP.flatMap((row, d) => row.map((v, b) => [b, d, v])),
    itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
    emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(26,26,26,0.25)' } },
  }],
}

const REVENUE_SEGMENTS = [
  ['Retail', 6.1, BLUE],
  ['Workplace', 3.2, GREEN],
  ['Fleet depots', 3.4, PURPLE],
  ['Roaming', 1.5, CORAL],
]
const REVENUE_OPTION = {
  grid: { left: 8, right: 8, top: 10, bottom: 30 },
  tooltip: { ...TT, trigger: 'item', valueFormatter: v => `$${v}M` },
  legend: { bottom: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10.5, color: '#4b463d' } },
  xAxis: valAxis({ show: false, max: 14.2 }),
  yAxis: { type: 'category', data: ['This week'], show: false },
  series: REVENUE_SEGMENTS.map(([name, v, color], i) => ({
    name, type: 'bar', stack: 'rev', data: [v], barWidth: 30,
    itemStyle: { color, opacity: 0.75, borderRadius: i === 0 ? [5, 0, 0, 5] : i === REVENUE_SEGMENTS.length - 1 ? [0, 5, 5, 0] : 0 },
    label: { show: v > 1.6, formatter: `$${v}M`, color: '#fff', fontFamily: ECH_FONT, fontSize: 10, fontWeight: 600 },
  })),
}

const ROAMING_PARTNERS = [
  ['Electrify America', '720K'],
  ['EVgo', '540K'],
  ['Shell Recharge', '310K'],
  ['Other Hubject partners', '194K'],
]
const DONUT_OPTION = {
  tooltip: {
    ...TT, trigger: 'item',
    formatter: p => p.name === 'Roaming'
      ? 'Roaming <b>18%</b> · 1.76M sessions<br/>Electrify America 720K · EVgo 540K<br/>Shell Recharge 310K · other 194K'
      : 'Native <b>82%</b> · 8.04M sessions',
  },
  title: {
    text: 'Native', subtext: '82%', left: 'center', top: '34%',
    textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: MUTED, fontWeight: 400 },
    subtextStyle: { fontFamily: ECH_FONT, fontSize: 17, fontWeight: 600, color: INK },
  },
  series: [{
    type: 'pie', radius: ['55%', '75%'], label: { show: false }, labelLine: { show: false },
    data: [
      { name: 'Native', value: 82, itemStyle: { color: BLUE, opacity: 0.72 } },
      { name: 'Roaming', value: 18, itemStyle: { color: CORAL, opacity: 0.78 } },
    ],
    emphasis: { scale: true, scaleSize: 4 },
  }],
}

const TOP_SITES = [
  ['Fremont Depot', 4310, 94.1, 'bad'],
  ['San Jose Airport', 2750, 95.8, 'warn'],
  ['Milpitas Transit Hub', 1940, 96.4, 'warn'],
  ['Sky Harbor Lot C', 1420, 96.2, 'warn'],
  ['Oakland Port Depot', 1210, 97.2, 'good'],
]

const SLA_WATCHLIST = [
  ['ASR-04412', 'Fremont Depot', 97.0, 94.1, '$86.4K', 'bad'],
  ['ASR-03918', 'San Jose Airport', 97.0, 95.8, '$54.2K', 'warn'],
  ['ASR-05127', 'Milpitas Transit Hub', 97.0, 96.4, '$38.7K', 'warn'],
  ['ASR-02244', 'Sky Harbor Lot C', 98.0, 96.2, '$31.5K', 'warn'],
  ['ASR-04871', 'Mission Bay Garage', 97.0, 95.9, '$26.9K', 'warn'],
]

function KpiTile({ k }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 150, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>{k.label}</div>
      <div style={{ ...serif, fontSize: 26, fontWeight: 500, color: INK, letterSpacing: -0.4, margin: '6px 0 4px' }}>{k.value}</div>
      <div style={{ ...mono, fontSize: 10.5, color: k.good ? HEALTH.good : HEALTH.bad }}>{k.delta}</div>
    </div>
  )
}

function CardShell({ title, accent, children, style }) {
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, ...style }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: accent || MUTED }}>{title}</div>
      {children}
    </div>
  )
}

function SlaWatchlist() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', padding: '0 0 7px', borderBottom: `1px solid ${LINE}`, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>
        <span style={{ width: 86 }}>Contract</span>
        <span style={{ flex: 1 }}>Site</span>
        <span style={{ width: 64, textAlign: 'right' }}>Commit</span>
        <span style={{ width: 64, textAlign: 'right' }}>Current</span>
        <span style={{ width: 74, textAlign: 'right' }}>Penalty</span>
      </div>
      {SLA_WATCHLIST.map(([contract, site, commit, current, penalty, h], i) => (
        <div key={contract} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < SLA_WATCHLIST.length - 1 ? '1px solid #f4f2ee' : 'none', fontSize: 12.5 }}>
          <span style={{ width: 86, ...mono, fontSize: 10.5, color: '#8a7340' }}>{contract}</span>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, color: '#4b463d', overflow: 'hidden' }}>
            <StatusDot health={h} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site}</span>
          </span>
          <span style={{ width: 64, textAlign: 'right', ...mono, fontSize: 11, color: MUTED }}>{commit.toFixed(1)}%</span>
          <span style={{ width: 64, textAlign: 'right', ...mono, fontSize: 11, fontWeight: 600, color: HEALTH[h] }}>{current.toFixed(1)}%</span>
          <span style={{ width: 74, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: CORAL }}>{penalty}</span>
        </div>
      ))}
    </div>
  )
}

function NetworkPulse({ onBack }) {
  const span2 = { gridColumn: '1 / -1' }
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Network Pulse"
        subtitle="Week of Aug 3 – Aug 9, 2026 · data from 12 sources"
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        {/* KPI row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          {KPIS.map(k => <KpiTile key={k.label} k={k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          {/* Row 1 */}
          <CardShell title="Uptime vs NEVI floor · 26 weeks (drag to zoom)">
            <Chart option={UPTIME_OPTION} height={250} />
          </CardShell>

          <CardShell title="Faults by hardware / firmware">
            <Chart option={PARETO_OPTION} height={150} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              CT4000 units on firmware 5.1.2.1104 account for 61 of 85 recurring fault clusters — OTA rollback covering 1,912 stations completes tonight.
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, margin: '4px 0 8px' }}>Top sites by lost minutes</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {TOP_SITES.map(([name, min, up, h], i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', padding: '5.5px 0', borderBottom: i < TOP_SITES.length - 1 ? '1px solid #f4f2ee' : 'none', fontSize: 12.5 }}>
                    <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#4b463d' }}>
                      <StatusDot health={h} />{name}
                    </span>
                    <span style={{ width: 84, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{min.toLocaleString()}</span>
                    <span style={{ width: 66, textAlign: 'right', ...mono, fontSize: 11, color: HEALTH[h] }}>{up.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardShell>

          {/* Row 2 — utilization heatmap full width */}
          <CardShell title="Utilization heatmap · avg port occupancy by 2-hour bucket" style={span2}>
            <Chart option={HEATMAP_OPTION} height={200} />
            <span style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              The 16:00–21:00 band runs hot on weekdays — commuter top-ups coincide with fleet depot arrivals. The Energy Cost Agent shifts depot load past 22:00.
            </span>
          </CardShell>

          {/* Row 3 */}
          <CardShell title="Sessions & energy by day · 14 days">
            <Chart option={SESSIONS_OPTION} height={210} />
          </CardShell>

          <CardShell title="Revenue by segment · $14.2M this week">
            <Chart option={REVENUE_OPTION} height={110} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Fleet depots grew 9% week over week — managed-charging contracts at Fremont and Oakland depots came online Aug 5.
            </div>
          </CardShell>

          {/* Row 4 — three small cards */}
          <div style={{ ...span2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <CardShell title="Roaming mix · via Hubject">
              <Chart option={DONUT_OPTION} height={150} />
              <div>
                {ROAMING_PARTNERS.map(([name, n]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#6b6455', padding: '2.5px 0' }}>
                    <span>{name}</span>
                    <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{n}</span>
                  </div>
                ))}
              </div>
            </CardShell>

            <CardShell title="Driver base">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ ...serif, fontSize: 26, fontWeight: 500, color: INK, letterSpacing: -0.4 }}>1.3M</span>
                <span style={{ ...mono, fontSize: 11, color: HEALTH.good }}>▲ +12K this week</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b6455', lineHeight: 1.55 }}>
                Active drivers across app, fleet and roaming accounts. 68% charge at least weekly.
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: PURPLE, border: '1px solid #e0daf0', background: '#f4f1fa', borderRadius: 5, padding: '2px 8px' }}>Derived</span>
                <span style={{ fontSize: 12, color: '#4b463d' }}>Churn-risk cohort <b style={{ color: PURPLE }}>4.2%</b> — 3+ failed sessions in 90d</span>
              </div>
            </CardShell>

            <CardShell title="Energy cost">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ ...serif, fontSize: 26, fontWeight: 500, color: INK, letterSpacing: -0.4 }}>$184K</span>
                <span style={{ ...mono, fontSize: 11, color: HEALTH.good }}>▼ $46K vs last week</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b6455', lineHeight: 1.55 }}>
                Demand charges dropped after the Energy Cost Agent re-shaped overnight fleet load at Fremont Depot — peak drawn down from 505 kW to 330 kW.
              </div>
            </CardShell>
          </div>

          {/* Row 5 */}
          <CardShell title="SLA watchlist · Assure contracts nearest breach">
            <SlaWatchlist />
          </CardShell>

          <CardShell title="Derived signals this week" accent={PURPLE}
            style={{ borderLeft: `3px solid ${PURPLE}`, background: '#fdfcff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Failure Risk', '23 ports scoring > 0.6 — work orders auto-raised for 19'],
                ['Utilization', '6 sites saturated above 85% peak occupancy'],
                ['Expansion', 'Milpitas waitlist at 240 drivers — site scored for 12 new ports'],
              ].map(([sig, text]) => (
                <div key={sig} style={{ display: 'flex', gap: 10, fontSize: 12.5, lineHeight: 1.5 }}>
                  <span style={{ ...mono, fontSize: 10.5, fontWeight: 600, color: PURPLE, border: '1px solid #e0daf0', background: '#f4f1fa', borderRadius: 5, padding: '2px 8px', height: 'fit-content', whiteSpace: 'nowrap' }}>{sig}</span>
                  <span style={{ color: '#4b463d' }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Signals computed nightly in Snowflake from NOS telemetry drift, fault history and session demand curves.
            </div>
          </CardShell>
        </div>
      </div>
    </>
  )
}

// ─── APP 3: FLEET READINESS BOARD ────────────────────────────────────────────

// vehicle row: [name, vinTail, port, nowPct, targetPct, readyBy, departure, status]
const FLEETS = [
  {
    id: 'sunrise', name: 'Sunrise Parcel', depot: 'Fremont Depot', vehicles: 82,
    target: 90, firstRoute: '04:30', managed: true,
    readiness: 88, avgSoc: 68, energyKwh: 4280, capacityKw: 600, availKw: 528,
    banner: 'Bay 4 contactor repair (E-341) reduces depot capacity 12% tonight — 6 vehicles re-sequenced by the charging scheduler.',
    rows: [
      ['Ford E-Transit 041', '…8241', 'Bay 2 · P1 · 62.5 kW', 62, 90, '05:30', '04:30', 'risk'],
      ['Ford E-Transit 087', '…3310', 'Bay 2 · P2 · 31 kW', 58, 90, '05:45', '04:30', 'risk'],
      ['Rivian EDV 700 112', '…9077', 'Bay 3 · P1 · 62.5 kW', 66, 90, '05:15', '04:45', 'risk'],
      ['Rivian EDV 700 118', '…4152', 'Bay 3 · P2 · 31 kW', 71, 90, '05:05', '04:45', 'risk'],
      ['BrightDrop Zevo 600 07', '…2864', 'Bay 5 · P1 · 62.5 kW', 54, 90, '06:10', '05:00', 'risk'],
      ['BrightDrop Zevo 600 12', '…7719', 'Bay 5 · P2 · 31 kW', 60, 90, '05:50', '05:00', 'risk'],
      ['Ford E-Transit 059', '…5527', 'Bay 1 · P1 · 62.5 kW', 84, 90, '03:40', '04:30', 'ok'],
      ['Rivian EDV 700 103', '…1198', 'Bay 6 · P1 · 62.5 kW', 90, 90, '01:52', '04:45', 'done'],
    ],
  },
  {
    id: 'baymetro', name: 'Bay Metro Transit', depot: 'Oakland Depot', vehicles: 96,
    target: 95, firstRoute: '05:10', managed: true,
    readiness: 96, avgSoc: 81, energyKwh: 6120, capacityKw: 900, availKw: 900,
    banner: null,
    rows: [
      ['Proterra ZX5 214', '…6402', 'Yard A · P3 · 150 kW', 78, 95, '04:20', '05:10', 'ok'],
      ['Proterra ZX5 221', '…8830', 'Yard A · P4 · 150 kW', 81, 95, '04:05', '05:10', 'ok'],
      ['New Flyer XE40 118', '…2245', 'Yard B · P1 · 150 kW', 64, 95, '05:35', '05:10', 'risk'],
      ['New Flyer XE40 124', '…9012', 'Yard B · P2 · 150 kW', 68, 95, '05:25', '05:10', 'risk'],
      ['Proterra ZX5 209', '…3376', 'Yard A · P1 · 150 kW', 88, 95, '03:15', '05:25', 'ok'],
      ['New Flyer XE40 131', '…5583', 'Yard B · P4 · 150 kW', 92, 95, '02:40', '05:40', 'ok'],
      ['Proterra ZX5 217', '…7148', 'Yard A · P2 · 150 kW', 95, 95, '01:35', '05:25', 'done'],
      ['New Flyer XE40 109', '…4906', 'Yard B · P3 · 150 kW', 95, 95, '02:10', '05:40', 'done'],
    ],
  },
  {
    id: 'valley', name: 'Valley Fresh Foods', depot: 'San Jose Depot', vehicles: 36,
    target: 85, firstRoute: '06:00', managed: true,
    readiness: 97, avgSoc: 76, energyKwh: 1480, capacityKw: 320, availKw: 320,
    banner: null,
    rows: [
      ['Ford F-150 Lightning 12', '…7731', 'Dock 1 · P1 · 19.2 kW', 70, 85, '03:50', '06:00', 'ok'],
      ['Mercedes eSprinter 04', '…2018', 'Dock 1 · P2 · 19.2 kW', 59, 85, '06:40', '06:00', 'risk'],
      ['Ram ProMaster EV 09', '…5564', 'Dock 2 · P1 · 19.2 kW', 74, 85, '03:20', '06:15', 'ok'],
      ['Mercedes eSprinter 07', '…8893', 'Dock 2 · P2 · 19.2 kW', 77, 85, '03:05', '06:15', 'ok'],
      ['Ford E-Transit 022', '…1409', 'Dock 3 · P1 · 19.2 kW', 80, 85, '02:45', '06:30', 'ok'],
      ['Ram ProMaster EV 11', '…6675', 'Dock 3 · P2 · 19.2 kW', 85, 85, '01:28', '06:30', 'done'],
      ['Ford F-150 Lightning 15', '…3342', 'Dock 4 · P1 · 19.2 kW', 85, 85, '02:02', '06:45', 'done'],
      ['Mercedes eSprinter 02', '…9250', 'Dock 4 · P2 · 19.2 kW', 85, 85, '01:44', '06:45', 'done'],
    ],
  },
]

// Charging schedule tonight — kW per hour, 20:00 → 06:00
const SCHED_HOURS = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00']
const MANAGED_KW = [210, 280, 320, 330, 325, 310, 300, 285, 240, 180, 120]
const UNMANAGED_KW = [140, 340, 505, 490, 430, 300, 190, 120, 80, 60, 40]

const SCHEDULE_OPTION = {
  grid: { left: 52, right: 18, top: 24, bottom: 26 },
  tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} kW` },
  xAxis: catAxis(SCHED_HOURS),
  yAxis: valAxis({ max: 550, axisLabel: { ...AX_LABEL, formatter: '{value} kW' } }),
  series: [
    {
      name: 'Managed load', type: 'bar', data: MANAGED_KW, barWidth: '52%',
      itemStyle: { color: GREEN, opacity: 0.55, borderRadius: [4, 4, 0, 0] },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: GREEN, type: 'dotted', width: 1 },
        label: { formatter: 'managed peak 330 kW', position: 'insideEndTop', color: GREEN, fontFamily: ECH_FONT, fontSize: 9.5 },
        data: [{ yAxis: 330 }],
      },
    },
    {
      name: 'Unmanaged baseline', type: 'line', data: UNMANAGED_KW,
      lineStyle: { color: CORAL, width: 1.6, type: 'dashed' },
      itemStyle: { color: CORAL }, symbol: 'circle', symbolSize: 4,
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: CORAL, type: 'dashed', width: 1 },
        label: { formatter: 'unmanaged peak 505 kW', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
        data: [{ yAxis: 505 }],
      },
    },
  ],
}

const STATUS_META = {
  ok: { label: 'OK', color: HEALTH.good, bg: '#f2faf5', border: '#cde7d6' },
  risk: { label: 'AT RISK', color: HEALTH.bad, bg: '#fbf1ee', border: '#eccfc6' },
  done: { label: 'DONE', color: '#7d7668', bg: '#f6f4ef', border: '#e5e0d4' },
}

function SocBar({ now, target, status }) {
  const miss = status === 'risk'
  const fillColor = miss ? HEALTH.bad : HEALTH.good
  return (
    <div style={{ position: 'relative', height: 12, borderRadius: 6, background: '#f1efe9', overflow: 'hidden' }}>
      {target > now && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${now}%`, width: `${target - now}%`,
          backgroundImage: `repeating-linear-gradient(45deg, ${miss ? 'rgba(192,73,47,0.22)' : 'rgba(47,158,90,0.20)'} 0 3px, transparent 3px 7px)`,
        }} />
      )}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${now}%`, background: fillColor, opacity: status === 'done' ? 0.45 : 0.75, borderRadius: 6 }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target}%`, width: 2, background: '#8a8375' }} />
    </div>
  )
}

// Small donut: % of vehicles projected to hit target SoC before first route.
function ReadinessRing({ pct }) {
  const r = 16, C = 2 * Math.PI * r
  const color = pct >= 95 ? HEALTH.good : pct >= 85 ? HEALTH.warn : HEALTH.bad
  return (
    <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#f1efe9" strokeWidth="4.5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * C} ${C}`} transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" style={{ ...mono, fontSize: 10.5, fontWeight: 600, fill: color }}>{pct}</text>
    </svg>
  )
}

function HeaderChip({ label, value, color }) {
  return (
    <span style={{ ...mono, fontSize: 10.5, color: color || '#6b6455', border: `1px solid ${LINE2}`, background: '#fff', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      {label} <b style={{ color: color || INK }}>{value}</b>
    </span>
  )
}

// Energy needed tonight vs available depot capacity.
function DepotPowerGauge({ fleet }) {
  const reduced = fleet.availKw < fleet.capacityKw
  const pctAvail = (fleet.availKw / fleet.capacityKw) * 100
  const color = reduced ? HEALTH.warn : HEALTH.good
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px', background: reduced ? '#fdf7ec' : '#fafaf7', borderBottom: `1px solid ${LINE}`, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, flexShrink: 0 }}>Depot power</span>
      <div style={{ position: 'relative', flex: 1, minWidth: 120, maxWidth: 320, height: 9, borderRadius: 5, background: '#eceade', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pctAvail}%`, background: color, opacity: 0.6, borderRadius: 5 }} />
        {reduced && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: `${pctAvail}%`, right: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(192,73,47,0.3) 0 3px, transparent 3px 7px)',
          }} />
        )}
      </div>
      <span style={{ ...mono, fontSize: 10.5, color: reduced ? '#8a6a1f' : '#6b6455' }}>
        <b style={{ color: reduced ? HEALTH.warn : GREEN }}>{fleet.availKw} kW</b> available of {fleet.capacityKw} kW
        {reduced && ' · Bay 4 offline'}
      </span>
      <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>· {fleet.energyKwh.toLocaleString()} kWh needed tonight</span>
    </div>
  )
}

function VehicleRow({ row, last }) {
  const [name, vin, port, now, target, readyBy, depart, status] = row
  const s = STATUS_META[status]
  const socText = status === 'done'
    ? `${now}% · done ${readyBy}`
    : `now ${now}% → ${target}% by ${readyBy}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '9px 18px', borderBottom: last ? 'none' : '1px solid #f4f2ee', background: '#fff' }}>
      <div style={{ width: 176, flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ ...mono, fontSize: 10, color: MUTED }}>VIN {vin}</div>
      </div>
      <span style={{ ...mono, fontSize: 10, color: '#6b6455', width: 138, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {port}
      </span>
      <div style={{ flex: 1, minWidth: 80 }}>
        <SocBar now={now} target={target} status={status} />
      </div>
      <div style={{ ...mono, fontSize: 10.5, color: status === 'risk' ? HEALTH.bad : '#6b6455', width: 160, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {socText}
      </div>
      <span style={{ ...mono, fontSize: 10.5, color: '#6b6455', border: `1px solid ${LINE2}`, background: '#faf8f3', borderRadius: 5, padding: '2px 8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
        dep {depart}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px', width: 62, textAlign: 'center', flexShrink: 0 }}>
        {s.label}
      </span>
    </div>
  )
}

function FleetSection({ fleet }) {
  const atRisk = fleet.rows.filter(r => r[7] === 'risk').length
  return (
    <div style={{ ...card, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', background: '#F7F5F3', borderBottom: `1px solid ${LINE}`, flexWrap: 'wrap' }}>
        <ReadinessRing pct={fleet.readiness} />
        <div style={{ minWidth: 150 }}>
          <div style={{ ...serif, fontSize: 15.5, fontWeight: 500, color: INK }}>{fleet.name}</div>
          <div style={{ fontSize: 11.5, color: MUTED }}>{fleet.depot} · {fleet.vehicles} vehicles · first route {fleet.firstRoute}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <HeaderChip label="avg SoC" value={`${fleet.avgSoc}%`} />
          <HeaderChip label="target" value={`${fleet.target}%`} />
          <HeaderChip label="tonight" value={`${fleet.energyKwh.toLocaleString()} kWh`} />
          {atRisk > 0 && <HeaderChip label="at risk" value={atRisk} color={HEALTH.bad} />}
        </div>
        <div style={{ flex: 1 }} />
        {fleet.managed && (
          <span style={{ fontSize: 10.5, fontWeight: 600, color: GREEN, border: '1px solid #cbe5da', background: '#f0f9f5', borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>
            Managed charging
          </span>
        )}
      </div>
      <DepotPowerGauge fleet={fleet} />
      {fleet.banner && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 18px', background: '#fbf1ee', borderBottom: '1px solid #eccfc6', fontSize: 12, color: '#7a4a3a', lineHeight: 1.5 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M6.5 1.2L12.2 11.3H0.8L6.5 1.2Z" stroke={HEALTH.bad} strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="6.5" y1="5" x2="6.5" y2="7.6" stroke={HEALTH.bad} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6.5" cy="9.4" r="0.7" fill={HEALTH.bad} />
          </svg>
          {fleet.banner}
        </div>
      )}
      <div>
        {fleet.rows.map((r, i) => <VehicleRow key={r[1]} row={r} last={i === fleet.rows.length - 1} />)}
      </div>
    </div>
  )
}

function FleetBoard({ onBack }) {
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Fleet Readiness Board"
        subtitle="Tonight's charging vs tomorrow's routes · Geotab + NOS"
      />
      {/* NOTE: every direct child of this flex-column scroll container carries
          flexShrink: 0 — without it, children with overflow:hidden (the cards)
          compress to fit the viewport instead of overflowing into scroll. */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Summary strip */}
        <div style={{ ...card, display: 'flex', flexWrap: 'wrap', flexShrink: 0 }}>
          {[
            ['Fleets', '6', INK],
            ['Vehicles charging', '214', INK],
            ['At risk', '9', HEALTH.bad],
            ['First departure', '04:30', INK],
          ].map(([label, val, color], i) => (
            <div key={label} style={{ flex: 1, minWidth: 130, padding: '13px 18px', borderLeft: i ? `1px solid ${LINE}` : 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>{label}</div>
              <div style={{ ...serif, fontSize: 23, fontWeight: 500, color, letterSpacing: -0.3, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>

        {FLEETS.map(f => <FleetSection key={f.id} fleet={f} />)}

        <div style={{ ...card, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: MUTED, flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke={MUTED} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          3 more fleets — Cascade Couriers, Mission Linen, Peninsula Produce — all on track for morning routes.
        </div>

        <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>Charging schedule tonight</div>
          <Chart option={SCHEDULE_OPTION} height={210} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#4b463d' }}>
              <span style={{ width: 14, height: 10, borderRadius: 2.5, background: GREEN, opacity: 0.55 }} />
              Managed load (tonight's plan)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#4b463d' }}>
              <svg width="20" height="8" viewBox="0 0 20 8"><line x1="1" y1="4" x2="19" y2="4" stroke={CORAL} strokeWidth="1.4" strokeDasharray="5 4" opacity="0.75" /></svg>
              Unmanaged baseline (coincident peak)
            </span>
            <span style={{ fontSize: 11.5, color: MUTED }}>
              Staggered by Energy Cost Agent — peak 330 kW vs 505 kW unmanaged · off-peak window per PG&amp;E B-19 tariff.
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── APP 4: CUSTOMER 360 ─────────────────────────────────────────────────────
// One customer record, six persona lenses. Every lens reads the SAME model
// (built once per account by c360Model) and renders a different dashboard from
// it — the same $480K pipeline, the same 240/186 seats, the same aging Sev-2
// appear wherever they are relevant, never re-stated with different numbers.

const GOLD = HEALTH.warn

// Revenue motions — the colour key for the unified timeline and provenance.
const MOTION = {
  marketing: { label: 'Marketing', color: PURPLE },
  sales: { label: 'Sales', color: BLUE },
  success: { label: 'Success', color: GREEN },
  support: { label: 'Support', color: CORAL },
}

const MONTHS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtUSD = n => n >= 1000000
  ? '$' + (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  : '$' + Math.round(n / 1000) + 'K'
const fmtDate = iso => { const p = iso.split('-'); return `${MONTHS3[+p[1] - 1]} ${+p[2]}` }
const fmtDateY = iso => { const p = iso.split('-'); return `${MONTHS3[+p[1] - 1]} ${+p[2]}, ${p[0]}` }
const initials = name => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const healthColor = h => h >= 80 ? HEALTH.good : h >= 60 ? HEALTH.warn : HEALTH.bad

// ── The book of business (account switcher). Northwind is the hero record;
//    the other eight carry real top-line figures so the switcher reads live.
const ACCOUNTS = [
  {
    id: 'northwind', name: 'Northwind Logistics', domain: 'northwind.com',
    industry: 'Logistics & Supply Chain', employees: 4200, hq: 'Chicago, IL',
    territory: 'NA-Central', since: 'Mar 2022', renewal: '2026-11-30', renewalDays: 112,
    tier: 'Enterprise', arr: 1240000, health: 72, prevHealth: 84,
    owner: 'Dana Whitfield', csm: 'Sam Ortega', seats: 240, activeSeats: 186,
    nps: 6, tickets: 2, churn: 0.38, expansion: 0.61, influenced: 62, qbrs: 3, seed: 3,
  },
  {
    id: 'cascade', name: 'Cascade Analytics', domain: 'cascadeanalytics.io',
    industry: 'Data & Analytics', employees: 1150, hq: 'Seattle, WA',
    territory: 'NA-West', since: 'Jul 2023', renewal: '2027-01-31', renewalDays: 174,
    tier: 'Enterprise', arr: 860000, health: 88, prevHealth: 85,
    owner: 'Priya Raman', csm: 'Ivy Delgado', seats: 160, activeSeats: 151,
    nps: 9, tickets: 1, churn: 0.09, expansion: 0.74, influenced: 51, qbrs: 4, seed: 7,
  },
  {
    id: 'meridian', name: 'Meridian Labs', domain: 'meridianlabs.com',
    industry: 'Life Sciences', employees: 2600, hq: 'Boston, MA',
    territory: 'NA-East', since: 'Sep 2021', renewal: '2026-09-30', renewalDays: 49,
    tier: 'Enterprise', arr: 610000, health: 64, prevHealth: 70,
    owner: 'Dana Whitfield', csm: 'Sam Ortega', seats: 120, activeSeats: 81,
    nps: 5, tickets: 3, churn: 0.46, expansion: 0.28, influenced: 39, qbrs: 2, seed: 11,
  },
  {
    id: 'horizon', name: 'Horizon Tech', domain: 'horizontech.com',
    industry: 'Software & Internet', employees: 8900, hq: 'Austin, TX',
    territory: 'NA-Central', since: 'Jan 2020', renewal: '2027-03-31', renewalDays: 231,
    tier: 'Strategic', arr: 2100000, health: 91, prevHealth: 89,
    owner: 'Marcus Bell', csm: 'Ivy Delgado', seats: 420, activeSeats: 402,
    nps: 9, tickets: 1, churn: 0.06, expansion: 0.83, influenced: 44, qbrs: 4, seed: 5,
  },
  {
    id: 'summit', name: 'Summit Partners', domain: 'summitpartners.co',
    industry: 'Financial Services', employees: 640, hq: 'New York, NY',
    territory: 'NA-East', since: 'Feb 2024', renewal: '2026-08-31', renewalDays: 19,
    tier: 'Growth', arr: 445000, health: 55, prevHealth: 68,
    owner: 'Dana Whitfield', csm: 'Rosa Kim', seats: 90, activeSeats: 51,
    nps: 4, tickets: 3, churn: 0.57, expansion: 0.19, influenced: 71, qbrs: 1, seed: 13,
  },
  {
    id: 'apex', name: 'Apex Global', domain: 'apexglobal.com',
    industry: 'Manufacturing', employees: 12400, hq: 'Detroit, MI',
    territory: 'NA-Central', since: 'Jun 2019', renewal: '2027-06-30', renewalDays: 322,
    tier: 'Strategic', arr: 1680000, health: 79, prevHealth: 81,
    owner: 'Priya Raman', csm: 'Sam Ortega', seats: 340, activeSeats: 296,
    nps: 7, tickets: 2, churn: 0.24, expansion: 0.58, influenced: 33, qbrs: 4, seed: 2,
  },
  {
    id: 'quantum', name: 'Quantum Dynamics', domain: 'quantumdyn.ai',
    industry: 'Research & Development', employees: 380, hq: 'Boulder, CO',
    territory: 'NA-West', since: 'Nov 2024', renewal: '2026-11-15', renewalDays: 95,
    tier: 'Growth', arr: 320000, health: 83, prevHealth: 76,
    owner: 'Elena Vasquez', csm: 'Rosa Kim', seats: 60, activeSeats: 56,
    nps: 8, tickets: 1, churn: 0.13, expansion: 0.66, influenced: 58, qbrs: 2, seed: 17,
  },
  {
    id: 'vertex', name: 'Vertex Solutions', domain: 'vertexsolutions.net',
    industry: 'Professional Services', employees: 3100, hq: 'Atlanta, GA',
    territory: 'NA-East', since: 'Apr 2021', renewal: '2026-10-31', renewalDays: 80,
    tier: 'Enterprise', arr: 975000, health: 47, prevHealth: 66,
    owner: 'Marcus Bell', csm: 'Rosa Kim', seats: 200, activeSeats: 104,
    nps: 3, tickets: 3, churn: 0.68, expansion: 0.12, influenced: 27, qbrs: 1, seed: 19,
  },
  {
    id: 'beacon', name: 'Beacon Industries', domain: 'beaconind.com',
    industry: 'Industrial Distribution', employees: 5400, hq: 'Cleveland, OH',
    territory: 'NA-Central', since: 'Aug 2022', renewal: '2027-02-28', renewalDays: 200,
    tier: 'Enterprise', arr: 1050000, health: 86, prevHealth: 82,
    owner: 'Tomás Ortiz', csm: 'Ivy Delgado', seats: 210, activeSeats: 194,
    nps: 8, tickets: 1, churn: 0.11, expansion: 0.69, influenced: 46, qbrs: 3, seed: 23,
  },
]

// ── Commercial ───────────────────────────────────────────────────────────────
const C360_OPPS = [
  {
    id: 'OPP-4412', name: 'Platform expansion — 240 seats', amount: 310000,
    stage: 'Negotiation', prob: 70, close: '2026-11-14', owner: 'Dana Whitfield',
    next: 'Legal redlines back from Procurement', idle: 6, stalled: false,
  },
  {
    id: 'OPP-4508', name: 'Analytics add-on', amount: 120000,
    stage: 'Proposal', prob: 45, close: '2026-12-05', owner: 'Dana Whitfield',
    next: 'No next step logged', idle: 26, stalled: true,
  },
  {
    id: 'OPP-4577', name: 'API Gateway cross-sell', amount: 50000,
    stage: 'Discovery', prob: 20, close: '2027-01-30', owner: 'Priya Raman',
    next: 'Technical discovery with Alex Reyes', idle: 4, stalled: false,
  },
]

const C360_CLOSED = [
  { id: 'OPP-3120', name: 'Renewal FY26 + 40 seats', amount: 285000, result: 'won', date: '2025-11-22', to: null },
  { id: 'OPP-3388', name: 'Workflow automation module', amount: 96000, result: 'won', date: '2026-02-10', to: null },
  { id: 'OPP-3401', name: 'Data warehouse connector', amount: 74000, result: 'lost', date: '2026-04-18', to: 'Atlas Data Cloud' },
]

const C360_ACV = [['FY23', 620000], ['FY24', 840000], ['FY25', 1100000], ['FY26', 1240000]]

// ── People ───────────────────────────────────────────────────────────────────
const C360_CONTACTS = [
  { name: 'Maya Chen', title: 'VP Operations', role: 'Champion', lastTouch: 34, engagement: 22, email: 'm.chen@northwind.com' },
  { name: 'Robert Osei', title: 'Chief Financial Officer', role: 'Economic Buyer', lastTouch: 11, engagement: 58, email: 'r.osei@northwind.com' },
  { name: 'Derek Vaughn', title: 'Chief Operating Officer', role: 'Economic Buyer', lastTouch: 29, engagement: 8, email: 'd.vaughn@northwind.com' },
  { name: 'Alex Reyes', title: 'IT Director', role: 'Detractor', lastTouch: 4, engagement: 71, email: 'a.reyes@northwind.com' },
  { name: 'Priya Nandan', title: 'Director, Logistics Systems', role: 'User', lastTouch: 6, engagement: 84, email: 'p.nandan@northwind.com' },
  { name: 'Sofia Marchetti', title: 'Operations Analyst', role: 'User', lastTouch: 2, engagement: 91, email: 's.marchetti@northwind.com' },
  { name: 'Tom Bradley', title: 'Procurement Lead', role: 'Blocker', lastTouch: 9, engagement: 35, email: 't.bradley@northwind.com' },
]
const ROLE_ORDER = ['Champion', 'Economic Buyer', 'User', 'Blocker', 'Detractor']
const ROLE_COLOR = {
  Champion: GREEN, 'Economic Buyer': BLUE, User: '#6b6455', Blocker: GOLD, Detractor: CORAL,
}

// ── Marketing ────────────────────────────────────────────────────────────────
const C360_TOUCHES = [
  { date: '2026-05-21', channel: 'Webinar', campaign: 'Supply Chain Visibility 2026', attributed: 62000 },
  { date: '2026-06-09', channel: 'Paid Search', campaign: 'API Gateway — competitor terms', attributed: 41000 },
  { date: '2026-06-27', channel: 'Field Event', campaign: 'Logistics Summit Chicago', attributed: 88000 },
  { date: '2026-07-08', channel: 'Email Nurture', campaign: 'Analytics Add-on Drip', attributed: 34000 },
  { date: '2026-07-22', channel: 'Syndication', campaign: 'Gartner MQ Reprint', attributed: 29000 },
  { date: '2026-08-04', channel: 'Website', campaign: 'Pricing page — direct', attributed: 44000 },
]
const CHANNEL_COLOR = {
  Webinar: PURPLE, 'Paid Search': BLUE, 'Field Event': GREEN,
  'Email Nurture': GOLD, Syndication: '#8a7fbe', Website: CORAL,
}

const C360_CAMPAIGNS = [
  ['Logistics Summit Chicago', 'Field Event', 3, 88000, 'Platform expansion'],
  ['Supply Chain Visibility 2026', 'Webinar', 4, 62000, 'Platform expansion'],
  ['Pricing page — direct', 'Website', 2, 44000, 'API Gateway cross-sell'],
  ['API Gateway — competitor terms', 'Paid Search', 2, 41000, 'API Gateway cross-sell'],
  ['Analytics Add-on Drip', 'Email Nurture', 5, 34000, 'Analytics add-on'],
  ['Gartner MQ Reprint', 'Syndication', 1, 29000, 'Analytics add-on'],
]

const C360_INTENT = [
  { topic: 'evaluating API gateway vendors', score: 88, trend: 'rising', source: '6sense Intent' },
  { topic: 'pricing page — competitor', score: 74, trend: 'rising', source: '6sense Intent' },
  { topic: 'analytics buyer research', score: 51, trend: 'flat', source: '6sense Intent' },
]

const C360_CONTENT = [
  ['Gartner MQ Reprint 2026', 'PDF', 'Alex Reyes', '2026-07-22'],
  ['API Gateway technical brief', 'Doc', 'Alex Reyes', '2026-07-18'],
  ['ROI calculator — 240 seats', 'Tool', 'Robert Osei', '2026-07-05'],
  ['Route optimisation case study', 'PDF', 'Priya Nandan', '2026-06-24'],
  ['Analytics Workbench demo', 'Video', 'Sofia Marchetti', '2026-06-11'],
]

const C360_WEB = [42, 38, 45, 51, 48, 56, 61, 58, 72, 84, 96, 88]

// ── Product / success ────────────────────────────────────────────────────────
const C360_SEAT_SHAPE = [238, 236, 233, 230, 226, 221, 215, 209, 203, 197, 191, 186]
const C360_WAU = [172, 171, 169, 168, 166, 163, 161, 158, 155, 152, 148, 145]
const C360_FEATURES = [
  ['Route Optimizer', 78, 'core'],
  ['Live Tracking', 64, 'core'],
  ['Analytics Workbench', 31, 'expansion'],
  ['API Gateway', 12, 'expansion'],
]
const C360_CHECKLIST = [
  ['Renewal quote delivered', true],
  ['Multi-threaded — 3+ engaged contacts', true],
  ['Success plan reviewed this quarter', true],
  ['Executive sponsor re-mapped after COO change', false],
  ['Health score above 75', false],
  ['All Sev-2 tickets closed', false],
]

const C360_TICKETS = [
  {
    id: 'TCK-8841', sev: 2, subject: 'API rate limits exceeded on prod', age: 9,
    category: 'API / Integration', requester: 'Alex Reyes', assignee: 'Nia Osborne',
    slaHours: 96, elapsedHours: 216, status: 'Open',
  },
  {
    id: 'TCK-8903', sev: 3, subject: 'SSO group sync drops on nightly job', age: 3,
    category: 'Authentication', requester: 'Priya Nandan', assignee: 'Kofi Mensah',
    slaHours: 120, elapsedHours: 72, status: 'Pending',
  },
  {
    id: 'TCK-8917', sev: 3, subject: 'Scheduled report exports arrive empty', age: 1,
    category: 'Reporting', requester: 'Sofia Marchetti', assignee: 'Kofi Mensah',
    slaHours: 120, elapsedHours: 26, status: 'Open',
  },
]
const C360_TICKET_WEEKS = [3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9]
const C360_CSAT = [4.6, 4.5, 4.4, 4.3, 4.1, 4.0, 3.9, 3.8]
const C360_CATEGORIES = [
  ['API / Integration', 42, CORAL], ['Authentication', 21, BLUE],
  ['Billing', 14, GOLD], ['Reporting', 13, PURPLE], ['Other', 10, '#a8a294'],
]
const C360_TICKET_LOG = [
  ['2026-08-09', 'TCK-8903 opened · Sev-3', 'SSO group sync drops during the nightly job.'],
  ['2026-08-06', 'TCK-8841 escalated', 'Reassigned to Nia Osborne after 72h without a fix plan.'],
  ['2026-08-03', 'TCK-8841 opened · Sev-2', 'API rate limits exceeded on prod — 4 outages in 24h.'],
  ['2026-07-02', 'TCK-8790 resolved', 'Tracking API latency — closed in 4 days, CSAT 4/5.'],
  ['2026-06-14', 'TCK-8702 resolved', 'Billing contact update — closed same day, CSAT 5/5.'],
]

// ── Team roll-up (Director of Sales lens) ────────────────────────────────────
const C360_REPS = [
  { name: 'Priya Raman', quota: 1200000, attain: 104, pipeline: 2400000, slipping: 0, accounts: 11 },
  { name: 'Marcus Bell', quota: 1400000, attain: 91, pipeline: 3600000, slipping: 3, accounts: 12 },
  { name: 'Tomás Ortiz', quota: 1000000, attain: 88, pipeline: 2200000, slipping: 1, accounts: 9 },
  { name: 'Dana Whitfield', quota: 1400000, attain: 78, pipeline: 3100000, slipping: 2, accounts: 14 },
  { name: 'Elena Vasquez', quota: 900000, attain: 66, pipeline: 1900000, slipping: 4, accounts: 16 },
  { name: 'Jordan Iwu', quota: 300000, attain: 41, pipeline: 900000, slipping: 2, accounts: 7 },
]
const C360_FUNNEL = [
  ['Discovery', 5200000], ['Qualification', 3600000],
  ['Proposal', 2600000], ['Negotiation', 1800000], ['Verbal', 900000],
]
const C360_ATRISK = [
  ['Vertex Solutions', 'Renewal FY27', 640000, 'Negotiation', 'Marcus Bell', 'Health 47 · exec sponsor left'],
  ['Summit Partners', 'Seat expansion', 210000, 'Proposal', 'Dana Whitfield', 'Close date pushed 3×'],
  ['Meridian Labs', 'Analytics platform', 180000, 'Qualification', 'Elena Vasquez', 'Single-threaded · 1 contact'],
  ['Northwind Logistics', 'Analytics add-on', 120000, 'Proposal', 'Dana Whitfield', 'No next step · idle 26d'],
  ['Quantum Dynamics', 'API Gateway', 95000, 'Discovery', 'Jordan Iwu', 'No activity 31d'],
]
const C360_FORECAST_Q = {
  labels: ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26'],
  submitted: [4.2, 4.6, 5.1, 5.8, 5.4, 6.0],
  actual: [4.0, 4.9, 4.7, 5.6, 5.0, 5.7],
}

// ── RevOps ───────────────────────────────────────────────────────────────────
const C360_SOURCES = [
  ['Salesforce CRM', '4 min ago', '1.2M', 'good'],
  ['Zendesk Support', '2 min ago', '312K', 'good'],
  ['Snowflake Product Events', '6 min ago', '48.2M', 'good'],
  ['Outreach Sequences', '7 min ago', '610K', 'good'],
  ['Marketo Email', '9 min ago', '1.9M', 'good'],
  ['HubSpot Marketing', '11 min ago', '840K', 'good'],
  ['Stripe Payments', '14 min ago', '220K', 'good'],
  ['Gainsight CS', '18 min ago', '128K', 'good'],
  ['6sense Intent', '22 min ago', '2.6M', 'good'],
  ['Gong Conversations', '31 min ago', '84K', 'good'],
  ['NetSuite Billing', '1 h ago', '96K', 'good'],
  ['Clearbit Enrichment', '2 d ago', '760K', 'warn'],
  ['ZoomInfo Firmographics', '3 d ago', '4.1M', 'warn'],
  ['Okta Identity', 'failed 5 h ago', '58K', 'bad'],
]
const C360_COMPLETENESS = [
  ['Account', 94, 'ok'], ['Contact', 78, 'flag'], ['Opportunity', 88, 'ok'],
  ['Subscription', 96, 'ok'], ['Support Ticket', 91, 'ok'],
]
const C360_CONFLICTS = [
  {
    field: 'employee_count', a: ['Salesforce CRM', '4,200', '2026-08-09'], b: ['ZoomInfo Firmographics', '3,800', '2026-08-06'],
    rule: 'most-recently-verified', resolved: true,
  },
  {
    field: 'billing_country', a: ['NetSuite Billing', 'United States', '2026-08-11'], b: ['Salesforce CRM', 'US', '2026-07-30'],
    rule: 'canonical value set', resolved: true,
  },
  {
    field: 'primary_contact_email', a: ['HubSpot Marketing', 'maya.chen@northwind.com', '2026-07-09'], b: ['Salesforce CRM', 'm.chen@northwind.com', '2026-07-09'],
    rule: 'no tie-break — same timestamp', resolved: false,
  },
]
const C360_LINEAGE = [
  ['annual_recurring_revenue', 'NetSuite Billing', 'billing system of record'],
  ['industry / employee_count', 'Salesforce CRM', 'most-recently-verified'],
  ['health_score', 'Gainsight CS', 'only publisher'],
  ['licensed_seats / active_seats', 'Snowflake Product Events', 'event-level truth'],
  ['intent_topics', '6sense Intent', 'only publisher'],
  ['open_tickets', 'Zendesk Support', 'only publisher'],
]

// ── The unified timeline: 14 events across all four motions ──────────────────
const C360_TIMELINE = [
  { date: '2026-08-10', motion: 'sales', actor: 'Dana Whitfield · AM', title: 'Renewal 112 days out', desc: 'Renewal reminder fired. Forecast category held at Commit, flagged at risk.' },
  { date: '2026-08-09', motion: 'support', actor: 'Priya Nandan · User', title: 'TCK-8903 opened · Sev-3', desc: 'SSO group sync drops during the nightly job.' },
  { date: '2026-08-04', motion: 'marketing', actor: 'Web Analytics', title: 'Pricing page · 7 sessions', desc: 'Seven pricing-page sessions in three days from the northwind.com range.' },
  { date: '2026-08-03', motion: 'support', actor: 'Alex Reyes · IT Director', title: 'TCK-8841 opened · Sev-2', desc: 'API rate limits exceeded on prod. Still open — 9 days and counting.' },
  { date: '2026-07-22', motion: 'marketing', actor: 'Content Syndication', title: 'Gartner MQ reprint downloaded', desc: 'Downloaded by Alex Reyes — competitive evaluation signal.' },
  { date: '2026-07-21', motion: 'success', actor: 'Alex Reyes · IT Director', title: 'NPS returned: 6', desc: 'Detractor. Verbatim cites rate limits and slow ticket turnaround.' },
  { date: '2026-07-19', motion: 'success', actor: 'Product Telemetry', title: 'Usage drop detected', desc: 'Weekly active users fell below 190 for the first time in 14 months.' },
  { date: '2026-07-14', motion: 'sales', actor: 'ZoomInfo Firmographics', title: 'Executive change', desc: 'Derek Vaughn appointed COO — new economic buyer, relationship unmapped.' },
  { date: '2026-07-09', motion: 'sales', actor: 'Maya Chen · Champion', title: 'Champion last replied', desc: 'Last inbound from Maya Chen. Three follow-ups since have gone unanswered.' },
  { date: '2026-07-08', motion: 'marketing', actor: 'Marketo Email', title: 'Analytics nurture engaged', desc: '5 opens, 2 clicks across the Analytics Add-on Drip. $34K attributed.' },
  { date: '2026-07-02', motion: 'support', actor: 'Nia Osborne · Support', title: 'TCK-8790 resolved', desc: 'Tracking API latency — closed in 4 days, CSAT 4/5.' },
  { date: '2026-06-27', motion: 'marketing', actor: 'Field Marketing', title: 'Logistics Summit Chicago', desc: 'Met 3 contacts including Robert Osei (CFO). $88K attributed.' },
  { date: '2026-06-18', motion: 'sales', actor: 'Dana Whitfield · AM', title: 'Platform expansion opened', desc: 'OPP-4412 created — 240 seats, $310K, close Nov 14 2026.' },
  { date: '2026-06-02', motion: 'success', actor: 'Sam Ortega · CSM', title: 'Q2 business review', desc: 'QBR #3 held. Health scored 84. Expansion to 300 seats discussed with Maya Chen.' },
]

// 12 weekly buckets ending Aug 10, 2026 — shared x-axis for every trend chart.
const C360_WEEKS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, 7, 10)
  d.setDate(d.getDate() - (11 - i) * 7)
  return `${d.getMonth() + 1}/${d.getDate()}`
})

// ── The model. Northwind is returned verbatim; every other account is scaled
//    deterministically off its ARR, health and seat counts so the switcher
//    never looks static, and every lens still agrees with every other lens.
function c360Model(a) {
  const hero = a.id === 'northwind'
  const s = a.arr / 1240000
  const money = v => hero ? v : Math.round(v * s / 1000) * 1000

  const opps = C360_OPPS.map(o => ({
    ...o,
    amount: money(o.amount),
    idle: hero ? o.idle : ((o.idle + a.seed) % 34) + 2,
    stalled: hero ? o.stalled : o.stalled && a.health < 82,
  }))
  const pipeline = opps.reduce((t, o) => t + o.amount, 0)
  const weighted = Math.round(opps.reduce((t, o) => t + o.amount * o.prob / 100, 0))
  const closed = C360_CLOSED.map(c => ({ ...c, amount: money(c.amount) }))

  const contacts = C360_CONTACTS.map((c, i) => hero ? c : {
    ...c,
    lastTouch: c.role === 'Champion'
      ? (a.health >= 80 ? 2 + (a.seed % 5) : Math.round(26 + (80 - a.health) * 0.85))
      : Math.max(1, ((c.lastTouch + a.seed * (i + 1)) % 27) + 1),
    engagement: clamp(c.engagement + Math.round((a.health - 72) * 0.7), 6, 97),
  })
  const champion = contacts.find(c => c.role === 'Champion')
  const championQuiet = champion.lastTouch >= 21

  const seatActive = C360_SEAT_SHAPE.map(v => {
    const w = (v - 186) / 52
    return Math.round(a.activeSeats + ((a.seats - 2) - a.activeSeats) * w)
  })
  const seatDrop = Math.round((1 - a.activeSeats / (a.seats - 2)) * 100)
  const wau = C360_WAU.map(v => Math.round(v * a.activeSeats / 186))
  const features = C360_FEATURES.map(([n, pct, kind]) =>
    [n, hero ? pct : clamp(pct + Math.round((a.health - 72) * 0.55), 3, 97), kind])

  const tickets = C360_TICKETS.slice(0, a.tickets).map(t => hero ? t : {
    ...t,
    age: ((t.age + a.seed) % 13) + 1,
    elapsedHours: (((t.age + a.seed) % 13) + 1) * 24,
  })
  const sev2 = tickets.find(t => t.sev === 2) || null
  const ticketWeeks = C360_TICKET_WEEKS.map(v => Math.max(0, hero ? v : Math.round(v * a.tickets / 2)))
  const csat = C360_CSAT.map(v => hero ? v : Math.round(clamp(v + (a.health - 72) * 0.02, 2.4, 5) * 10) / 10)

  const touches = C360_TOUCHES.map(t => ({ ...t, attributed: money(t.attributed) }))
  const attributed = touches.reduce((t, x) => t + x.attributed, 0)
  const campaigns = C360_CAMPAIGNS.map(c => [c[0], c[1], c[2], money(c[3]), c[4]])
  const intent = C360_INTENT.map(x => hero ? x : { ...x, score: clamp(x.score + a.seed - 9, 12, 97) })
  const web = C360_WEB.map(v => hero ? v : Math.max(4, Math.round(v * Math.sqrt(s))))

  const healthTrend = Array.from({ length: 8 }, (_, i) =>
    Math.round(a.prevHealth + (a.health - a.prevHealth) * (i / 7)))
  const npsHistory = hero ? [8, 8, 7, 6] : [clamp(a.nps + 2, 0, 10), clamp(a.nps + 2, 0, 10), clamp(a.nps + 1, 0, 10), a.nps]

  const drivers = [
    `seat utilization down ${seatDrop}%`,
    `champion disengaged ${champion.lastTouch}d`,
    sev2 ? 'open Sev-2 aging' : 'no exec sponsor mapped',
  ]

  const checklist = C360_CHECKLIST.map(([label, done], i) => [
    label,
    hero ? done : i === 4 ? a.health >= 75 : i === 5 ? !sev2 : done || a.health >= 85,
  ])

  return {
    a, hero, opps, pipeline, weighted, closed, acv: C360_ACV,
    contacts, champion, championQuiet,
    seatActive, seatDrop, wau, features, tickets, sev2, ticketWeeks, csat,
    touches, attributed, campaigns, intent, web,
    healthTrend, npsHistory, drivers, checklist,
    timeline: hero ? C360_TIMELINE : C360_TIMELINE.map(e => ({
      ...e,
      title: e.title.replace('112 days out', `${a.renewalDays} days out`),
      desc: e.desc
        .replace('northwind.com', a.domain)
        .replace('9 days and counting', `${sev2 ? sev2.age : 0} days and counting`)
        .replace('240 seats, $310K', `${a.seats} seats, ${fmtUSD(opps[0].amount)}`),
    })),
  }
}

// ── Small pieces shared by the six lenses ────────────────────────────────────

function C360Card({ title, accent, right, children, style }) {
  return (
    <div style={{ ...card, padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0, overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: accent || MUTED, minWidth: 0 }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function DataTable({ cols, rows, empty }) {
  const cell = (c, header) => ({
    width: c.w, flex: c.w ? undefined : 1, flexShrink: c.w ? 0 : 1,
    textAlign: c.align || 'left', paddingRight: 8, minWidth: c.w ? 0 : (c.min || 96),
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    color: header ? MUTED : '#4b463d',
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ display: 'flex', padding: '0 0 7px', borderBottom: `1px solid ${LINE}`, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {cols.map((c, i) => <span key={i} style={cell(c, true)}>{c.label}</span>)}
      </div>
      {rows.map((r, ri) => (
        <div key={ri} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: ri < rows.length - 1 ? '1px solid #f4f2ee' : 'none', fontSize: 12.5, minWidth: 0 }}>
          {r.map((v, i) => <span key={i} style={cell(cols[i], false)}>{v}</span>)}
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ padding: '18px 0', textAlign: 'center', fontSize: 12.5, color: MUTED }}>{empty || 'Nothing here.'}</div>
      )}
    </div>
  )
}

function MiniBar({ pct, color = BLUE, h = 6, w = '100%', opacity = 0.7 }) {
  return (
    <span style={{ display: 'inline-block', position: 'relative', width: w, height: h, borderRadius: h / 2, background: '#f1efe9', verticalAlign: 'middle' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(pct, 0, 100)}%`, background: color, opacity, borderRadius: h / 2 }} />
    </span>
  )
}

function StatTile({ label, value, sub, color, flex }) {
  return (
    <div style={{ flex: flex || 1, minWidth: 104, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 12px' }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
      <div style={{ ...serif, fontSize: 20, fontWeight: 500, color: color || INK, letterSpacing: -0.3, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ ...mono, fontSize: 10, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const TONES = {
  bad: { fg: '#7a4a3a', bg: '#fbf1ee', border: '#eccfc6', accent: HEALTH.bad },
  warn: { fg: '#7d6220', bg: '#fdf7ec', border: '#eddfc2', accent: HEALTH.warn },
  good: { fg: '#2c5b40', bg: '#f2faf5', border: '#cde7d6', accent: HEALTH.good },
  purple: { fg: '#4c4270', bg: '#f7f5fb', border: '#e5e0f0', accent: PURPLE },
  blue: { fg: '#31456e', bg: '#f3f6fd', border: '#d8e2f5', accent: BLUE },
}

function Callout({ tone = 'warn', title, children }) {
  const t = TONES[tone]
  return (
    <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 9, padding: '10px 13px' }}>
      {title && (
        <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: t.accent, marginBottom: 5 }}>{title}</div>
      )}
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: t.fg }}>{children}</div>
    </div>
  )
}

function Tag({ label, color, bg, border }) {
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 600, color, background: bg || '#faf8f3', border: `1px solid ${border || LINE2}`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function Avatar({ name, color }) {
  return (
    <span style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: '#f4f2ee', border: `1px solid ${color || LINE2}`, color: color || '#6b6455',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      ...mono, fontSize: 9.5, fontWeight: 600,
    }}>{initials(name)}</span>
  )
}

// Big health ring — the CSM headline and the account-switcher glyph.
function HealthRing({ score, prev, size = 128 }) {
  const r = size / 2 - 11, C = 2 * Math.PI * r
  const color = healthColor(score)
  const delta = score - prev
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1efe9" strokeWidth="11" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * C} ${C}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" style={{ ...serif, fontSize: size * 0.30, fontWeight: 500, fill: INK }}>{score}</text>
      <text x={size / 2} y={size / 2 + 22} textAnchor="middle" style={{ ...mono, fontSize: 9.5, fill: delta < 0 ? HEALTH.bad : HEALTH.good }}>
        {delta < 0 ? '▼' : '▲'} {Math.abs(delta)} pts
      </text>
    </svg>
  )
}

// ── The persona rail ─────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: 'am', name: 'Account Manager', accent: BLUE,
    blurb: 'Relationships, open deals, next best actions',
    context: m => `Your book: 14 accounts · ${m.a.name} is your largest at risk — ${fmtUSD(m.pipeline)} open, renewal in ${m.a.renewalDays} days.`,
    nodes: ['Account', 'Contact', 'Opportunity', 'Activity', 'Competitor'],
    sources: ['Salesforce CRM', 'Gong Conversations', 'Outreach Sequences'],
  },
  {
    id: 'dos', name: 'Director of Sales', accent: PURPLE,
    blurb: 'Team roll-up, forecast, deals at risk',
    context: m => `Q4 roll-up: $4.9M commit against a $6.2M quota · 2.3× coverage · ${m.a.name} sits in your at-risk list.`,
    nodes: ['Opportunity', 'Forecast Snapshot', 'Quota Plan', 'Sales Rep'],
    sources: ['Salesforce CRM', 'Snowflake Product Events', 'Gong Conversations'],
  },
  {
    id: 'csm', name: 'CSM', accent: GREEN,
    blurb: 'Health, usage, tickets, renewal readiness',
    context: m => `Renewal in ${m.a.renewalDays} days · health ${m.a.health} and ${m.a.health < m.a.prevHealth ? 'falling' : 'rising'} · ${m.a.seats - m.a.activeSeats} of ${m.a.seats} seats unused.`,
    nodes: ['Subscription', 'Product Usage', 'Health Score', 'Support Ticket', 'NPS Response'],
    sources: ['Gainsight CS', 'Snowflake Product Events', 'Zendesk Support'],
  },
  {
    id: 'mkt', name: 'Marketing Lead', accent: GOLD,
    blurb: 'Attribution, campaigns, intent, engagement',
    context: m => `${m.a.influenced}% of open pipeline here is marketing-influenced — ${fmtUSD(m.attributed)} attributed across 6 touches in 90 days.`,
    nodes: ['Marketing Touch', 'Campaign', 'Intent Signal', 'Web Session', 'Content Asset'],
    sources: ['HubSpot Marketing', 'Marketo Email', '6sense Intent'],
  },
  {
    id: 'revops', name: 'RevOps', accent: '#6b6455',
    blurb: 'Completeness, source freshness, conflicts',
    context: m => `14 sources feeding this record · 1 sync failing · 3 field conflicts, 1 unresolved.`,
    nodes: ['Account', 'Contact', 'Opportunity', 'Source Record', 'Merge Rule'],
    sources: ['All 14 sources', 'Salesforce CRM', 'ZoomInfo Firmographics'],
  },
  {
    id: 'sup', name: 'Support Lead', accent: CORAL,
    blurb: 'SLA clocks, volume, escalation risk, CSAT',
    context: m => m.sev2
      ? `${m.tickets.length} open ticket${m.tickets.length === 1 ? '' : 's'} · Sev-2 aging ${m.sev2.age} days against a renewal in ${m.a.renewalDays} days.`
      : `${m.tickets.length} open ticket${m.tickets.length === 1 ? '' : 's'} · no Sev-2 outstanding · CSAT trending down.`,
    nodes: ['Support Ticket', 'SLA Policy', 'CSAT Response', 'Contact'],
    sources: ['Zendesk Support', 'Okta Identity', 'Snowflake Product Events'],
  },
]

function PersonaGlyph({ id, color }) {
  const p = { stroke: color, strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      {id === 'am' && <><circle cx="5" cy="4.6" r="2.2" {...p} /><path d="M1.4 12a3.6 3.6 0 0 1 7.2 0" {...p} /><path d="M10.4 6.4h2.4M10.4 9h2.4" {...p} /></>}
      {id === 'dos' && <><path d="M1.6 12h10.8" {...p} /><path d="M3.4 12V8.4M6.4 12V5.4M9.4 12V6.8M12.2 12V2.6" {...p} /></>}
      {id === 'csm' && <><circle cx="7" cy="7" r="5.4" {...p} /><path d="M4.6 7.2l1.8 1.8 3-3.6" {...p} /></>}
      {id === 'mkt' && <><path d="M2 5.4v3.2h2.4L9.4 11V3L4.4 5.4H2z" {...p} /><path d="M11.2 5.2a2.6 2.6 0 0 1 0 3.6" {...p} /></>}
      {id === 'revops' && <><ellipse cx="7" cy="3.4" rx="4.8" ry="1.8" {...p} /><path d="M2.2 3.4v7.2c0 1 2.1 1.8 4.8 1.8s4.8-.8 4.8-1.8V3.4" {...p} /><path d="M2.2 7c0 1 2.1 1.8 4.8 1.8s4.8-.8 4.8-1.8" {...p} /></>}
      {id === 'sup' && <><circle cx="7" cy="7" r="5.4" {...p} /><circle cx="7" cy="7" r="2.2" {...p} /><path d="M3.2 3.2l2.2 2.2M10.8 3.2L8.6 5.4M3.2 10.8l2.2-2.2M10.8 10.8L8.6 8.6" {...p} /></>}
    </svg>
  )
}

// Deliberately quiet: a single 34px control in the header, not a banner. The
// dashboards do the talking; switching lens should feel like changing a filter.
function PersonaSwitcher({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const p = PERSONAS.find(x => x.id === value)
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, whiteSpace: 'nowrap' }}>
        Viewing as
      </span>
      <button onClick={() => setOpen(o => !o)} style={{
        width: 224, height: 34, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: 9,
        background: PLATE, border: `1px solid ${LINE}`, borderRadius: 8, padding: '0 11px',
        cursor: 'pointer', transition: 'border-color .15s, background .15s',
      }}
        onMouseOver={e => e.currentTarget.style.borderColor = '#d8d2c4'}
        onMouseOut={e => e.currentTarget.style.borderColor = LINE}>
        <PersonaGlyph id={p.id} color={p.accent} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 500, color: INK, whiteSpace: 'nowrap' }}>{p.name}</span>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M1.5 3l3 3 3-3" stroke={MUTED} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41, width: 280,
          background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10,
          boxShadow: '0 8px 28px rgba(26,26,26,0.10)', padding: 5,
        }}>
          {PERSONAS.map(x => {
            const active = x.id === value
            return (
              <button key={x.id} onClick={() => { onChange(x.id); setOpen(false) }} style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 9, textAlign: 'left',
                border: 'none', background: active ? '#f7f6f2' : 'transparent', borderRadius: 7,
                padding: '8px 10px', cursor: 'pointer', transition: 'background .12s',
              }}
                onMouseOver={e => e.currentTarget.style.background = '#faf9f6'}
                onMouseOut={e => e.currentTarget.style.background = active ? '#f7f6f2' : 'transparent'}>
                <span style={{ paddingTop: 1, flexShrink: 0 }}>
                  <PersonaGlyph id={x.id} color={active ? x.accent : '#9a948a'} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? x.accent : INK }}>{x.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: MUTED, lineHeight: 1.4, marginTop: 1 }}>{x.blurb}</span>
                </span>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 3 }}>
                    <path d="M2.5 6.2l2.4 2.4 4.6-5" fill="none" stroke={x.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AccountSwitcher({ accounts, value, onChange }) {
  const [open, setOpen] = useState(false)
  const a = accounts.find(x => x.id === value)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 9, background: '#fff',
        border: `1px solid ${LINE2}`, borderRadius: 9, padding: '5px 11px', cursor: 'pointer',
        fontSize: 13, color: INK, transition: 'border-color .15s',
      }}
        onMouseOver={e => e.currentTarget.style.borderColor = '#c9c2b4'}
        onMouseOut={e => e.currentTarget.style.borderColor = LINE2}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: healthColor(a.health), flexShrink: 0 }} />
        <span style={{ fontWeight: 500 }}>{a.name}</span>
        <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{fmtUSD(a.arr)}</span>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M1.5 3l3 3 3-3" stroke={MUTED} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41, width: 330,
            background: '#fff', border: `1px solid ${LINE2}`, borderRadius: 11,
            boxShadow: '0 8px 28px rgba(26,26,26,0.13)', padding: 6, maxHeight: 400, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, padding: '6px 10px 8px' }}>
              Your book · 9 of 42,850 accounts
            </div>
            {accounts.map(x => {
              const sel = x.id === value
              return (
                <button key={x.id} onClick={() => { onChange(x.id); setOpen(false) }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  border: 'none', background: sel ? '#f6f5f1' : 'transparent', borderRadius: 8,
                  padding: '8px 10px', cursor: 'pointer', transition: 'background .12s',
                }}
                  onMouseOver={e => e.currentTarget.style.background = '#faf9f6'}
                  onMouseOut={e => e.currentTarget.style.background = sel ? '#f6f5f1' : 'transparent'}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: healthColor(x.health), flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: sel ? 600 : 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span>
                    <span style={{ ...mono, display: 'block', fontSize: 10, color: MUTED, marginTop: 1 }}>{x.owner} · {x.tier}</span>
                  </span>
                  <span style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ ...mono, display: 'block', fontSize: 11.5, color: INK }}>{fmtUSD(x.arr)}</span>
                    <span style={{ ...mono, display: 'block', fontSize: 10, color: healthColor(x.health), marginTop: 1 }}>health {x.health}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── LENS 1 · ACCOUNT MANAGER — relationship + deal execution ─────────────────

const STAGE_COLOR = {
  Discovery: '#8db0ec', Qualification: '#6a97e6', Proposal: '#4a81e0',
  Negotiation: BLUE, Verbal: GREEN,
}

function RelationshipMap({ m }) {
  const groups = ROLE_ORDER.map(role => [role, m.contacts.filter(c => c.role === role)]).filter(g => g[1].length)
  const engaged = m.contacts.filter(c => c.lastTouch <= 14).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map(([role, people]) => (
        <div key={role}>
          <div style={{ ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: ROLE_COLOR[role], marginBottom: 6 }}>
            {role}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {people.map(c => {
              const quiet = c.role === 'Champion' && c.lastTouch >= 21
              const cold = c.lastTouch >= 21
              return (
                <div key={c.email} style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  border: `1px solid ${quiet ? '#eccfc6' : LINE}`, background: quiet ? '#fdf6f4' : '#fff',
                  borderRadius: 9, padding: '7px 10px', minWidth: 0,
                }}>
                  <Avatar name={c.name} color={ROLE_COLOR[role]} />
                  <span style={{ flex: 1, minWidth: 116 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  </span>
                  <span style={{ width: 74, flexShrink: 0 }}>
                    <MiniBar pct={c.engagement} color={c.engagement >= 60 ? GREEN : c.engagement >= 30 ? GOLD : CORAL} h={5} />
                    <span style={{ ...mono, display: 'block', fontSize: 9.5, color: MUTED, marginTop: 3 }}>eng {c.engagement}</span>
                  </span>
                  <span style={{ ...mono, fontSize: 10.5, color: cold ? CORAL : '#6b6455', width: 66, textAlign: 'right', flexShrink: 0 }}>
                    {c.lastTouch}d ago
                  </span>
                  {quiet && <Tag label="GONE QUIET" color={HEALTH.bad} bg="#fbf1ee" border="#eccfc6" />}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div style={{ ...mono, fontSize: 10.5, color: MUTED, paddingTop: 2 }}>
        {m.contacts.length} mapped contacts · {engaged} touched in the last 14 days · 1 economic buyer unmapped
      </div>
    </div>
  )
}

function AmView({ m }) {
  const span2 = { gridColumn: '1 / -1' }
  const stalled = m.opps.filter(o => o.stalled)
  const actions = [
    {
      tone: 'bad', title: `Re-engage ${m.champion.name} — ${m.champion.lastTouch} days silent`,
      body: `Route through ${m.contacts.find(c => c.role === 'User').name}, who is still active weekly, and anchor on the ${m.sev2 ? 'open Sev-2' : 'usage decline'}.`,
    },
    {
      tone: 'warn', title: 'Map the new COO before the renewal cycle opens',
      body: 'Derek Vaughn took the COO seat 29 days ago and has had no contact. He signs the renewal.',
    },
    stalled.length > 0
      ? {
        tone: 'blue', title: `Unstick ${fmtUSD(stalled.reduce((t, o) => t + o.amount, 0))} in the ${stalled[0].name}`,
        body: `No next step logged and idle ${stalled[0].idle} days. Book the pricing workshop this week or move the close date out.`,
      }
      : {
        tone: 'blue', title: `Push ${fmtUSD(m.opps[0].amount)} through Negotiation`,
        body: `${m.opps[0].name} is ${m.opps[0].prob}% and closing ${fmtDate(m.opps[0].close)}. Procurement redlines are the only open item.`,
      },
    {
      tone: 'purple', title: 'Convert API gateway intent into the cross-sell',
      body: 'Intent score 88 and rising, plus 7 pricing-page sessions. Alex Reyes is the evaluator — give him the technical brief.',
    },
  ]
  return (
    <>
      <C360Card title="Open opportunities" style={span2}
        right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{fmtUSD(m.pipeline)} open · {fmtUSD(m.weighted)} weighted · close within 2 quarters</span>}>
        {stalled.length > 0 && (
          <Callout tone="warn" title="Stalled deal">
            <b>{stalled[0].name}</b> ({fmtUSD(stalled[0].amount)}) has had no logged next step for {stalled[0].idle} days — the longest idle deal in your book. Probability still shows {stalled[0].prob}%.
          </Callout>
        )}
        <DataTable
          cols={[
            { label: 'Opportunity' }, { label: 'Stage', w: 118 }, { label: 'Amount', w: 82, align: 'right' },
            { label: 'Close', w: 92 }, { label: 'Prob', w: 78 }, { label: 'Next step', w: 250 },
          ]}
          rows={m.opps.map(o => [
            <span key="n" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ ...mono, fontSize: 10, color: MUTED, flexShrink: 0 }}>{o.id}</span>
              <span style={{ fontWeight: 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</span>
            </span>,
            <Tag key="s" label={o.stage} color={STAGE_COLOR[o.stage]} bg="#f6f8fd" border="#dde5f4" />,
            <span key="a" style={{ ...mono, fontWeight: 600, color: INK }}>{fmtUSD(o.amount)}</span>,
            <span key="c" style={{ ...mono, fontSize: 11 }}>{fmtDate(o.close)}</span>,
            <span key="p" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MiniBar pct={o.prob} color={BLUE} h={5} w={38} />
              <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{o.prob}%</span>
            </span>,
            <span key="x" style={{ color: o.stalled ? CORAL : '#4b463d' }}>
              {o.stalled ? '⚠ ' : ''}{o.next} <span style={{ ...mono, fontSize: 10, color: MUTED }}>· idle {o.idle}d</span>
            </span>,
          ])}
        />
      </C360Card>

      <C360Card title="Relationship map · by buying role">
        <RelationshipMap m={m} />
      </C360Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <C360Card title="Next best actions" accent={PURPLE}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {actions.map((x, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, minWidth: 0 }}>
                <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: TONES[x.tone].accent, border: `1px solid ${TONES[x.tone].border}`, background: TONES[x.tone].bg, borderRadius: 5, padding: '2px 7px', height: 'fit-content', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: INK, lineHeight: 1.4 }}>{x.title}</span>
                  <span style={{ display: 'block', fontSize: 12, color: '#6b6455', lineHeight: 1.5, marginTop: 2 }}>{x.body}</span>
                </span>
              </div>
            ))}
          </div>
        </C360Card>

        <C360Card title="Competitive threat" accent={CORAL}>
          <Callout tone="bad" title="Atlas Data Cloud">
            Lost the <b>{m.closed[2].name}</b> deal ({fmtUSD(m.closed[2].amount)}) to Atlas Data Cloud in April.
            Since then: paid-search clicks on competitor comparison terms, a Gartner reprint pulled by the IT Director,
            and 7 pricing-page sessions in three days.
          </Callout>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatTile label="Closed won · 12 mo" value={fmtUSD(m.closed[0].amount + m.closed[1].amount)} sub="2 deals" color={GREEN} />
            <StatTile label="Closed lost" value={fmtUSD(m.closed[2].amount)} sub="to Atlas Data Cloud" color={CORAL} />
            <StatTile label="Tenure" value={`${m.a.since.split(' ')[1] ? 2026 - Number(m.a.since.split(' ')[1]) : 4} yrs`} sub={`since ${m.a.since}`} />
          </div>
        </C360Card>
      </div>

      <C360Card title="Recent activity · all motions" style={span2}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {m.timeline.slice(0, 6).map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '8px 0', borderBottom: i < 5 ? '1px solid #f4f2ee' : 'none', minWidth: 0 }}>
              <span style={{ ...mono, fontSize: 10.5, color: MUTED, width: 52, flexShrink: 0, paddingTop: 1 }}>{fmtDate(e.date)}</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: MOTION[e.motion].color, flexShrink: 0, marginTop: 5 }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: INK }}>{e.title}</span>
                <span style={{ fontSize: 12.5, color: '#6b6455' }}> — {e.desc}</span>
              </span>
              <span style={{ ...mono, fontSize: 10, color: MUTED, flexShrink: 0 }}>{e.actor}</span>
            </div>
          ))}
        </div>
      </C360Card>
    </>
  )
}

// ── LENS 2 · DIRECTOR OF SALES — roll-up and forecast ────────────────────────

const TEAM = { commit: 4900000, best: 6400000, pipeline: 14100000, quota: 6200000 }

function DosView({ m }) {
  const span2 = { gridColumn: '1 / -1' }
  const gauge = useMemo(() => ({
    series: [{
      type: 'gauge', startAngle: 205, endAngle: -25, min: 0, max: 120,
      radius: '96%', center: ['50%', '64%'],
      progress: { show: true, width: 15, roundCap: true, itemStyle: { color: GOLD } },
      axisLine: { roundCap: true, lineStyle: { width: 15, color: [[1, '#f1efe9']] } },
      axisTick: { show: false },
      splitLine: { distance: -19, length: 7, lineStyle: { color: LINE2, width: 1 } },
      axisLabel: { distance: -2, fontFamily: ECH_FONT, fontSize: 9, color: MUTED, formatter: v => v % 60 === 0 ? v + '%' : '' },
      pointer: { show: false }, anchor: { show: false },
      title: { offsetCenter: [0, '30%'], fontFamily: ECH_FONT, fontSize: 10, color: MUTED },
      detail: { offsetCenter: [0, '0%'], fontFamily: ECH_FONT, fontSize: 26, fontWeight: 600, color: INK, formatter: '{value}%' },
      data: [{ value: Math.round(TEAM.commit / TEAM.quota * 100), name: 'commit vs quota' }],
    }],
  }), [])

  const funnel = useMemo(() => {
    const shades = [BLUE, '#4a81e0', '#6a97e6', '#8db0ec', '#b0c9f2']
    return {
      tooltip: { ...TT, trigger: 'item', formatter: p => `${p.name}<br/><b>$${(p.value / 1000000).toFixed(1)}M</b>` },
      series: [{
        type: 'funnel', left: '6%', right: '6%', top: 6, bottom: 6, minSize: '32%',
        sort: 'descending', gap: 3, labelLine: { show: false },
        label: { position: 'inside', fontFamily: ECH_FONT, fontSize: 10.5, color: '#fff', formatter: p => `${p.name}  $${(p.value / 1000000).toFixed(1)}M` },
        itemStyle: { borderWidth: 0 },
        data: C360_FUNNEL.map(([name, v], i) => ({ name, value: v, itemStyle: { color: shades[i], opacity: 0.88 } })),
      }],
    }
  }, [])

  const accuracy = useMemo(() => ({
    grid: { left: 42, right: 16, top: 26, bottom: 24 },
    tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `$${v}M` },
    legend: { top: 0, left: 40, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
    xAxis: { ...catAxis(C360_FORECAST_Q.labels), boundaryGap: false },
    yAxis: valAxis({ min: 3.5, max: 6.5, axisLabel: { ...AX_LABEL, formatter: '${value}M' } }),
    series: [
      { name: 'Submitted', type: 'line', data: C360_FORECAST_Q.submitted, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: BLUE, width: 2 }, itemStyle: { color: BLUE } },
      { name: 'Actual', type: 'line', data: C360_FORECAST_Q.actual, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: GREEN, width: 2, type: 'dashed' }, itemStyle: { color: GREEN } },
    ],
  }), [])

  return (
    <>
      <C360Card title="Team forecast · Q4 FY26" accent={PURPLE}>
        <Chart option={gauge} height={168} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            ['Commit', TEAM.commit, GREEN, 'signed + verbal'],
            ['Best case', TEAM.best, BLUE, 'commit + upside'],
            ['Open pipeline', TEAM.pipeline, PURPLE, '2.3× coverage'],
            ['Quota', TEAM.quota, INK, '6 reps'],
          ].map(([label, v, color, note]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#4b463d', width: 92, flexShrink: 0 }}>{label}</span>
              <MiniBar pct={v / TEAM.pipeline * 100} color={color} h={7} />
              <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color, width: 56, textAlign: 'right', flexShrink: 0 }}>{fmtUSD(v)}</span>
              <span style={{ ...mono, fontSize: 10, color: MUTED, width: 104, flexShrink: 0 }}>{note}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
          Commit lands {fmtUSD(TEAM.quota - TEAM.commit)} short of quota. Closing the two largest at-risk deals covers the gap.
        </div>
      </C360Card>

      <C360Card title="Pipeline by stage · team-wide">
        <Chart option={funnel} height={210} />
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
          {fmtUSD(m.pipeline)} of this sits on {m.a.name} — {fmtUSD(m.opps[0].amount)} of it already in Negotiation.
        </div>
      </C360Card>

      <C360Card title="Rep leaderboard · attainment and coverage" style={span2}>
        <DataTable
          cols={[
            { label: 'Rep' }, { label: 'Accts', w: 62, align: 'right' }, { label: 'Quota', w: 78, align: 'right' },
            { label: 'Attainment', w: 168 }, { label: 'Pipeline', w: 84, align: 'right' },
            { label: 'Coverage', w: 84, align: 'right' }, { label: 'Slipping', w: 76, align: 'right' },
          ]}
          rows={C360_REPS.map(r => {
            const cov = r.pipeline / r.quota
            const col = r.attain >= 100 ? GREEN : r.attain >= 80 ? INK : r.attain >= 60 ? GOLD : CORAL
            return [
              <span key="n" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Avatar name={r.name} color={r.name === m.a.owner ? BLUE : LINE2} />
                <span style={{ flex: 1, minWidth: 0, fontWeight: r.name === m.a.owner ? 600 : 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                {r.name === m.a.owner && <span style={{ flexShrink: 0 }}><Tag label="owner" color={BLUE} bg="#f3f6fd" border="#d8e2f5" /></span>}
              </span>,
              <span key="a" style={{ ...mono, fontSize: 11, color: MUTED }}>{r.accounts}</span>,
              <span key="q" style={{ ...mono, fontSize: 11.5 }}>{fmtUSD(r.quota)}</span>,
              <span key="t" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <MiniBar pct={clamp(r.attain, 0, 120) / 1.2} color={col} h={7} />
                <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: col, width: 40, textAlign: 'right', flexShrink: 0 }}>{r.attain}%</span>
              </span>,
              <span key="p" style={{ ...mono, fontSize: 11.5 }}>{fmtUSD(r.pipeline)}</span>,
              <span key="c" style={{ ...mono, fontSize: 11.5, color: cov >= 2.5 ? GREEN : cov >= 2 ? INK : CORAL }}>{cov.toFixed(1)}×</span>,
              <span key="s" style={{ ...mono, fontSize: 11.5, color: r.slipping >= 3 ? CORAL : r.slipping ? GOLD : MUTED }}>{r.slipping}</span>,
            ]
          })}
        />
      </C360Card>

      <C360Card title="Deals at risk · across the team" accent={CORAL}>
        <DataTable
          cols={[
            { label: 'Account' }, { label: 'Deal', w: 148 }, { label: 'Amount', w: 74, align: 'right' },
            { label: 'Owner', w: 116 }, { label: 'Why', w: 190 },
          ]}
          rows={C360_ATRISK.map(([acct, deal, amt, stage, owner, why]) => [
            <span key="a" style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <StatusDot health={amt >= 400000 ? 'bad' : 'warn'} />
              <span style={{ fontWeight: acct === m.a.name ? 600 : 500, color: acct === m.a.name ? INK : '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acct}</span>
            </span>,
            <span key="d">{deal} <span style={{ ...mono, fontSize: 10, color: MUTED }}>{stage}</span></span>,
            <span key="m" style={{ ...mono, fontWeight: 600, color: CORAL }}>{fmtUSD(amt)}</span>,
            <span key="o" style={{ fontSize: 12 }}>{owner}</span>,
            <span key="w" style={{ fontSize: 12, color: '#7a4a3a' }}>{why}</span>,
          ])}
        />
        <div style={{ ...mono, fontSize: 10.5, color: MUTED, marginTop: 'auto' }}>
          $1.25M at risk · 20% of open pipeline · 12 deals slipping team-wide
        </div>
      </C360Card>

      <C360Card title="Forecast accuracy · last 6 quarters">
        <Chart option={accuracy} height={200} />
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
          The team has over-submitted in 4 of 6 quarters, averaging 5% optimistic. Deals like the {m.a.name} analytics add-on —
          high probability, no next step — are the usual cause.
        </div>
      </C360Card>
    </>
  )
}

// ── LENS 3 · CSM — health and retention ──────────────────────────────────────

function CsmView({ m }) {
  const span2 = { gridColumn: '1 / -1' }
  const a = m.a
  const seats = useMemo(() => ({
    grid: { left: 40, right: 16, top: 28, bottom: 24 },
    tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} seats` },
    legend: { top: 0, left: 38, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
    xAxis: { ...catAxis(C360_WEEKS), boundaryGap: false },
    yAxis: valAxis({ min: Math.max(0, Math.round(a.activeSeats * 0.7)), max: Math.round(a.seats * 1.05) }),
    series: [
      {
        name: 'Licensed', type: 'line', data: C360_WEEKS.map(() => a.seats), showSymbol: false,
        lineStyle: { color: MUTED, width: 1.4, type: 'dashed' }, itemStyle: { color: MUTED },
      },
      {
        name: 'Active', type: 'line', data: m.seatActive, smooth: true, showSymbol: false,
        lineStyle: { color: m.seatDrop >= 15 ? CORAL : GREEN, width: 2 },
        itemStyle: { color: m.seatDrop >= 15 ? CORAL : GREEN },
        areaStyle: { color: m.seatDrop >= 15 ? CORAL : GREEN, opacity: 0.08 },
      },
    ],
  }), [a.id])

  return (
    <>
      <C360Card title="Health score" accent={healthColor(a.health)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <HealthRing score={a.health} prev={a.prevHealth} size={126} />
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, marginBottom: 5 }}>
              8-week trend
            </div>
            <Spark values={m.healthTrend} w={168} h={40} color={healthColor(a.health)} lo={Math.min(...m.healthTrend) - 6} hi={Math.max(...m.healthTrend) + 6} />
            <div style={{ ...mono, fontSize: 10.5, color: MUTED, marginTop: 4 }}>
              {a.prevHealth} → {a.health} · churn risk <b style={{ color: a.churn >= 0.35 ? CORAL : GOLD }}>{a.churn.toFixed(2)}</b>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, margin: '2px 0 7px' }}>
            Top churn drivers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.drivers.map((d, i) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: '#4b463d' }}>
                <span style={{ ...mono, fontSize: 10, fontWeight: 600, color: CORAL, border: '1px solid #eccfc6', background: '#fbf1ee', borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>{i + 1}</span>
                {d}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
          <StatTile label="Renewal" value={`${a.renewalDays}d`} sub={fmtDateY(a.renewal)} color={a.renewalDays < 90 ? CORAL : INK} />
          <StatTile label="Expansion signal" value={a.expansion.toFixed(2)} sub="usage headroom + intent" color={PURPLE} />
          <StatTile label="QBRs held" value={a.qbrs} sub="since go-live" />
        </div>
      </C360Card>

      <C360Card title="Seat utilization · 12 weeks"
        right={<span style={{ ...mono, fontSize: 10.5, color: m.seatDrop >= 15 ? CORAL : MUTED }}>{a.activeSeats} / {a.seats} active · ▼ {m.seatDrop}%</span>}>
        <Chart option={seats} height={196} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatTile label="Licensed seats" value={a.seats} sub="contracted" />
          <StatTile label="Active seats" value={a.activeSeats} sub={`${a.seats - a.activeSeats} idle`} color={m.seatDrop >= 15 ? CORAL : INK} />
          <StatTile label="Weekly actives" value={m.wau[11]} sub="▼ 8% QoQ" color={CORAL} />
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
          {a.seats - a.activeSeats} paid seats have not signed in for 30 days. At renewal that is {fmtUSD(Math.round(a.arr / a.seats * (a.seats - a.activeSeats)))} of
          contracted value the customer can point at.
        </div>
      </C360Card>

      <C360Card title="Feature adoption · share of active seats">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {m.features.map(([name, pct, kind]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: '#4b463d', width: 152, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <MiniBar pct={pct} color={kind === 'core' ? BLUE : PURPLE} h={9} />
              <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: pct >= 50 ? INK : GOLD, width: 40, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
              <span style={{ ...mono, fontSize: 10, color: MUTED, width: 62, flexShrink: 0 }}>{Math.round(pct / 100 * a.activeSeats)} users</span>
            </div>
          ))}
        </div>
        <Callout tone="purple" title="Expansion angle">
          API Gateway sits at {m.features[3][1]}% adoption while intent for gateway vendors scores {m.intent[0].score}.
          The capability they are shopping for externally is already in their contract.
        </Callout>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: MUTED, marginTop: 'auto' }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: BLUE, opacity: 0.7 }} /> Core
          <span style={{ width: 9, height: 9, borderRadius: 2, background: PURPLE, opacity: 0.7, marginLeft: 8 }} /> Expansion
          <span style={{ marginLeft: 'auto', ...mono, fontSize: 10.5 }}>Onboarding completed {a.since}</span>
        </div>
      </C360Card>

      <C360Card title="Open tickets and voice of customer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.tickets.map(t => (
            <div key={t.id} style={{ border: `1px solid ${t.sev === 2 ? '#eccfc6' : LINE}`, background: t.sev === 2 ? '#fdf6f4' : '#fff', borderRadius: 9, padding: '9px 11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Tag label={`SEV-${t.sev}`} color={t.sev === 2 ? HEALTH.bad : GOLD} bg={t.sev === 2 ? '#fbf1ee' : '#fdf7ec'} border={t.sev === 2 ? '#eccfc6' : '#eddfc2'} />
                <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{t.id}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
                <span style={{ ...mono, fontSize: 10.5, color: t.age >= 7 ? CORAL : MUTED, flexShrink: 0 }}>{t.age}d old</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <MiniBar pct={t.elapsedHours / t.slaHours * 100} color={t.elapsedHours > t.slaHours ? CORAL : GREEN} h={5} />
              </div>
              <div style={{ ...mono, fontSize: 10, color: MUTED, marginTop: 4 }}>
                {t.requester} → {t.assignee} · SLA {t.slaHours}h · {t.elapsedHours}h elapsed
                {t.elapsedHours > t.slaHours && <span style={{ color: CORAL, fontWeight: 600 }}> · BREACHED</span>}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, margin: '2px 0 8px' }}>
            NPS history
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            {m.npsHistory.map((n, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 54, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ width: '72%', height: `${n / 10 * 100}%`, background: n >= 9 ? GREEN : n >= 7 ? GOLD : CORAL, opacity: 0.65, borderRadius: '4px 4px 0 0' }} />
                </div>
                <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: INK, marginTop: 4 }}>{n}</div>
                <div style={{ ...mono, fontSize: 9.5, color: MUTED }}>{['Q3 25', 'Q4 25', 'Q1 26', 'Q2 26'][i]}</div>
              </div>
            ))}
            <div style={{ flex: 1.4, paddingLeft: 8, borderLeft: `1px solid ${LINE}` }}>
              <div style={{ ...serif, fontSize: 24, fontWeight: 500, color: a.nps >= 9 ? GREEN : a.nps >= 7 ? GOLD : CORAL }}>{a.nps}</div>
              <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.4 }}>
                {a.nps >= 9 ? 'Promoter' : a.nps >= 7 ? 'Passive' : 'Detractor'} · submitted 3 weeks ago by the IT Director
              </div>
            </div>
          </div>
        </div>
      </C360Card>

      <C360Card title="Renewal readiness · 6-point checklist" style={span2}
        right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{m.checklist.filter(c => c[1]).length} of 6 complete · {a.renewalDays} days out</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 9 }}>
          {m.checklist.map(([label, done]) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              border: `1px solid ${done ? LINE : '#eccfc6'}`, background: done ? '#fff' : '#fdf6f4', borderRadius: 9,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" fill="none" stroke={done ? HEALTH.good : HEALTH.bad} strokeWidth="1.3" />
                {done
                  ? <path d="M5 8.2l2 2 4-4.4" fill="none" stroke={HEALTH.good} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" stroke={HEALTH.bad} strokeWidth="1.4" strokeLinecap="round" />}
              </svg>
              <span style={{ fontSize: 12.5, color: done ? '#4b463d' : '#7a4a3a' }}>{label}</span>
            </div>
          ))}
        </div>
      </C360Card>
    </>
  )
}

// ── LENS 4 · MARKETING LEAD — influence and attribution ─────────────────────

function MktView({ m }) {
  const span2 = { gridColumn: '1 / -1' }
  const a = m.a

  const attribution = useMemo(() => {
    let run = 0
    const cum = m.touches.map(t => (run += t.attributed))
    return {
      grid: { left: 52, right: 52, top: 26, bottom: 46 },
      tooltip: { trigger: 'axis', ...TT, valueFormatter: v => fmtUSD(v) },
      legend: { top: 0, left: 50, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
      xAxis: {
        ...catAxis(m.touches.map(t => fmtDate(t.date))),
        axisLabel: { ...AX_LABEL, interval: 0, rotate: 24 },
      },
      yAxis: [
        valAxis({ axisLabel: { ...AX_LABEL, formatter: v => '$' + Math.round(v / 1000) + 'K' } }),
        valAxis({ splitLine: { show: false }, axisLabel: { ...AX_LABEL, formatter: v => '$' + Math.round(v / 1000) + 'K' } }),
      ],
      series: [
        {
          name: 'Attributed', type: 'bar', barWidth: '46%',
          data: m.touches.map(t => ({ value: t.attributed, itemStyle: { color: CHANNEL_COLOR[t.channel], opacity: 0.75, borderRadius: [4, 4, 0, 0] } })),
        },
        {
          name: 'Cumulative', type: 'line', yAxisIndex: 1, data: cum, smooth: true,
          symbol: 'circle', symbolSize: 5, lineStyle: { color: INK, width: 1.6 }, itemStyle: { color: INK },
        },
      ],
    }
  }, [a.id])

  const channels = useMemo(() => {
    const byChannel = {}
    m.touches.forEach(t => { byChannel[t.channel] = (byChannel[t.channel] || 0) + t.attributed })
    return {
      tooltip: { ...TT, trigger: 'item', formatter: p => `${p.name}<br/><b>${fmtUSD(p.value)}</b> · ${p.percent}%` },
      title: {
        text: 'Attributed', subtext: fmtUSD(m.attributed), left: 'center', top: '36%',
        textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: MUTED, fontWeight: 400 },
        subtextStyle: { fontFamily: ECH_FONT, fontSize: 16, fontWeight: 600, color: INK },
      },
      series: [{
        type: 'pie', radius: ['56%', '76%'], label: { show: false }, labelLine: { show: false },
        data: Object.entries(byChannel).map(([name, v]) => ({ name, value: v, itemStyle: { color: CHANNEL_COLOR[name], opacity: 0.78 } })),
        emphasis: { scale: true, scaleSize: 4 },
      }],
    }
  }, [a.id])

  const web = useMemo(() => ({
    grid: { left: 36, right: 16, top: 16, bottom: 24 },
    tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} sessions` },
    xAxis: { ...catAxis(C360_WEEKS), boundaryGap: false },
    yAxis: valAxis({}),
    series: [{
      type: 'line', data: m.web, smooth: true, showSymbol: false,
      lineStyle: { color: PURPLE, width: 2 }, itemStyle: { color: PURPLE },
      areaStyle: { color: PURPLE, opacity: 0.09 },
      markPoint: {
        symbol: 'circle', symbolSize: 9,
        itemStyle: { color: '#fff', borderColor: PURPLE, borderWidth: 2 },
        label: { formatter: 'pricing page spike', position: 'top', color: PURPLE, fontFamily: ECH_FONT, fontSize: 9.5, distance: 8 },
        data: [{ coord: [10, m.web[10]] }],
      },
    }],
  }), [a.id])

  return (
    <>
      <C360Card title="Attribution · 6 touches over 90 days" style={span2}
        right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{fmtUSD(m.attributed)} attributed · {a.influenced}% of {fmtUSD(m.pipeline)} open pipeline</span>}>
        <Chart option={attribution} height={230} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatTile label="Influenced pipeline" value={`${a.influenced}%`} sub={`${fmtUSD(m.attributed)} of ${fmtUSD(m.pipeline)}`} color={PURPLE} />
          <StatTile label="Touches · 90d" value={m.touches.length} sub="across 6 channels" />
          <StatTile label="Contacts reached" value={m.contacts.filter(c => c.engagement > 20).length} sub={`of ${m.contacts.length} mapped`} />
          <StatTile label="Largest single touch" value={fmtUSD(Math.max(...m.touches.map(t => t.attributed)))} sub="Logistics Summit Chicago" color={GREEN} />
        </div>
      </C360Card>

      <C360Card title="Campaign influence">
        <DataTable
          cols={[
            { label: 'Campaign' }, { label: 'Channel', w: 116 }, { label: 'Touches', w: 66, align: 'right' },
            { label: 'Attributed', w: 82, align: 'right' }, { label: 'Opportunity', w: 152 },
          ]}
          rows={m.campaigns.map(([name, ch, n, amt, opp]) => [
            <span key="n" style={{ fontWeight: 500, color: INK }}>{name}</span>,
            <Tag key="c" label={ch} color={CHANNEL_COLOR[ch]} bg="#faf8f3" border={LINE2} />,
            <span key="t" style={{ ...mono, fontSize: 11 }}>{n}</span>,
            <span key="a" style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: PURPLE }}>{fmtUSD(amt)}</span>,
            <span key="o" style={{ fontSize: 12, color: '#6b6455' }}>{opp}</span>,
          ])}
        />
      </C360Card>

      <C360Card title="Channel mix · attributed dollars">
        <Chart option={channels} height={186} />
        <div>
          {m.touches.map(t => (
            <div key={t.date} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#6b6455', padding: '2.5px 0' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: CHANNEL_COLOR[t.channel], opacity: 0.78, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.channel} · {t.campaign}</span>
              <span style={{ ...mono, fontSize: 10.5, color: MUTED, flexShrink: 0 }}>{fmtUSD(t.attributed)}</span>
            </div>
          ))}
        </div>
      </C360Card>

      <C360Card title="Intent signals · 6sense" accent={PURPLE}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {m.intent.map(s => (
            <div key={s.topic}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                <span style={{ flex: 1, fontSize: 12.5, color: INK, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.topic}</span>
                <span style={{ ...mono, fontSize: 10.5, color: s.trend === 'rising' ? CORAL : MUTED }}>{s.trend === 'rising' ? '▲ rising' : '— flat'}</span>
                <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: s.score >= 70 ? CORAL : GOLD, width: 26, textAlign: 'right' }}>{s.score}</span>
              </div>
              <MiniBar pct={s.score} color={s.score >= 70 ? CORAL : GOLD} h={8} />
            </div>
          ))}
        </div>
        <Callout tone="bad" title="Read this together">
          Gateway-vendor intent at {m.intent[0].score} plus competitor pricing research means this account is shopping.
          The API Gateway cross-sell ({fmtUSD(m.opps[2].amount)}) is a defensive play, not just an upsell.
        </Callout>
      </C360Card>

      <C360Card title="Web engagement · 12 weeks"
        right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{m.web.reduce((t, v) => t + v, 0)} sessions from {a.domain}</span>}>
        <Chart option={web} height={186} />
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
          Sessions doubled in the last four weeks, concentrated on pricing and gateway documentation — the same window
          in which the champion stopped replying.
        </div>
      </C360Card>

      <C360Card title="Content consumed">
        <DataTable
          cols={[{ label: 'Asset' }, { label: 'Type', w: 66 }, { label: 'By', w: 132 }, { label: 'When', w: 74, align: 'right' }]}
          rows={C360_CONTENT.map(([asset, type, by, when]) => [
            <span key="a" style={{ color: INK }}>{asset}</span>,
            <Tag key="t" label={type} color="#6b6455" />,
            <span key="b" style={{ fontSize: 12 }}>{by}</span>,
            <span key="w" style={{ ...mono, fontSize: 10.5, color: MUTED }}>{fmtDate(when)}</span>,
          ])}
        />
        <div style={{ ...mono, fontSize: 10.5, color: MUTED, marginTop: 'auto' }}>
          3 of 5 assets pulled by Alex Reyes — the detractor is also the most engaged researcher.
        </div>
      </C360Card>
    </>
  )
}

// ── LENS 5 · REVOPS — data quality and process ───────────────────────────────

function ConflictRow({ c }) {
  return (
    <div style={{ border: `1px solid ${c.resolved ? LINE : '#eccfc6'}`, background: c.resolved ? '#fff' : '#fdf6f4', borderRadius: 9, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: INK, flex: 1 }}>{c.field}</span>
        {c.resolved
          ? <Tag label="AUTO-RESOLVED" color={HEALTH.good} bg="#f2faf5" border="#cde7d6" />
          : <Tag label="UNRESOLVED" color={HEALTH.bad} bg="#fbf1ee" border="#eccfc6" />}
      </div>
      {[c.a, c.b].map(([src, val, seen], i) => {
        const wins = c.resolved && i === 0
        return (
          <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0', fontSize: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: wins ? HEALTH.good : '#cfc9bd', flexShrink: 0 }} />
            <span style={{ ...mono, fontSize: 10.5, color: MUTED, width: 158, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src}</span>
            <span style={{ flex: 1, ...mono, fontSize: 11.5, fontWeight: wins ? 600 : 400, color: wins ? INK : '#6b6455', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            <span style={{ ...mono, fontSize: 10, color: MUTED, flexShrink: 0 }}>seen {fmtDate(seen)}</span>
          </div>
        )
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingTop: 7, borderTop: '1px solid #f4f2ee' }}>
        <span style={{ flex: 1, ...mono, fontSize: 10, color: MUTED }}>rule · {c.rule}</span>
        <button style={{
          border: `1px solid ${c.resolved ? LINE2 : '#eccfc6'}`, background: c.resolved ? '#fff' : '#fff',
          color: c.resolved ? MUTED : HEALTH.bad, borderRadius: 6, padding: '3px 10px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background .15s',
        }}
          onMouseOver={e => e.currentTarget.style.background = '#f7f5f1'}
          onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          {c.resolved ? 'Review rule' : 'Resolve'}
        </button>
      </div>
    </div>
  )
}

function RevOpsView({ m }) {
  const span2 = { gridColumn: '1 / -1' }
  const stale = m.opps.filter(o => o.idle > 21).length
  const noNext = m.opps.filter(o => o.stalled).length
  return (
    <>
      <C360Card title="Data completeness by object">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {C360_COMPLETENESS.map(([obj, pct, flag]) => (
            <div key={obj}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                <span style={{ flex: 1, fontSize: 12.5, color: INK }}>{obj}</span>
                {flag === 'flag' && <Tag label="BELOW 85% THRESHOLD" color={HEALTH.bad} bg="#fbf1ee" border="#eccfc6" />}
                <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: flag === 'flag' ? CORAL : INK }}>{pct}%</span>
              </div>
              <MiniBar pct={pct} color={flag === 'flag' ? CORAL : GREEN} h={9} />
            </div>
          ))}
        </div>
        <Callout tone="bad" title="Contact object">
          78% complete — 22% of contacts on this account are missing a title, a role, or both.
          The new COO has no role, no engagement history and no owner. Every downstream lens inherits that gap.
        </Callout>
      </C360Card>

      <C360Card title="Source freshness · 14 sources"
        right={<span style={{ ...mono, fontSize: 10.5, color: CORAL }}>1 failed · 2 stale</span>}>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          <DataTable
            cols={[{ label: 'Source' }, { label: 'Last sync', w: 106, align: 'right' }, { label: 'Records', w: 74, align: 'right' }, { label: '', w: 22, align: 'right' }]}
            rows={C360_SOURCES.map(([name, sync, recs, health]) => [
              <span key="n" style={{ color: INK }}>{name}</span>,
              <span key="s" style={{ ...mono, fontSize: 10.5, color: health === 'bad' ? CORAL : health === 'warn' ? GOLD : MUTED }}>{sync}</span>,
              <span key="r" style={{ ...mono, fontSize: 11 }}>{recs}</span>,
              <StatusDot key="d" health={health} />,
            ])}
          />
        </div>
        <div style={{ ...mono, fontSize: 10.5, color: MUTED, marginTop: 'auto' }}>
          Okta Identity has failed for 5 hours — SSO group membership on this account is stale.
        </div>
      </C360Card>

      <C360Card title="Field-level conflicts" accent={CORAL}
        right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>3 detected · 1 needs a human</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {C360_CONFLICTS.map(c => <ConflictRow key={c.field} c={c} />)}
        </div>
      </C360Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <C360Card title="Pipeline hygiene · this account">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatTile label="Stale deals" value={stale} sub="> 21d no activity" color={stale ? CORAL : INK} />
            <StatTile label="Missing next step" value={noNext} sub={`of ${m.opps.length} open`} color={noNext ? CORAL : INK} />
            <StatTile label="Past-due close" value="0" sub="all dates future" color={GREEN} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatTile label="Duplicate contacts" value="2" sub="same person, 2 emails" color={GOLD} />
            <StatTile label="Unmapped buyer" value="1" sub="COO, no role set" color={CORAL} />
            <StatTile label="Activity capture" value="91%" sub="Gong + Outreach" />
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
            The duplicate contact is Maya Chen — HubSpot writes <span style={{ ...mono, fontSize: 10.5 }}>maya.chen@</span> while
            Salesforce writes <span style={{ ...mono, fontSize: 10.5 }}>m.chen@</span>. Marketing engagement is being split across two records,
            which is part of why she scores as disengaged.
          </div>
        </C360Card>

        <C360Card title="Lineage · which source won">
          <DataTable
            cols={[{ label: 'Field' }, { label: 'Winning source', w: 190 }, { label: 'Why', w: 168 }]}
            rows={C360_LINEAGE.map(([field, src, why]) => [
              <span key="f" style={{ ...mono, fontSize: 11, color: INK }}>{field}</span>,
              <span key="s" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <StatusDot health="good" /><span style={{ fontSize: 12 }}>{src}</span>
              </span>,
              <span key="w" style={{ ...mono, fontSize: 10.5, color: MUTED }}>{why}</span>,
            ])}
          />
          <div style={{ ...mono, fontSize: 10.5, color: MUTED, marginTop: 'auto' }}>
            Merge rules evaluated nightly · last full rebuild 02:14 today · 42,850 accounts resolved
          </div>
        </C360Card>
      </div>

      <C360Card title="Record vitals · what every lens inherits" style={span2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 10 }}>
          {[
            ['Domain', m.a.domain], ['Industry', m.a.industry], ['Employees', m.a.employees.toLocaleString()],
            ['HQ', m.a.hq], ['Territory', m.a.territory], ['Customer since', m.a.since],
            ['Tier', m.a.tier], ['Renewal', fmtDateY(m.a.renewal)], ['ARR', fmtUSD(m.a.arr)],
            ['Owner', m.a.owner], ['CSM', m.a.csm], ['Licensed seats', String(m.a.seats)],
          ].map(([label, val]) => (
            <div key={label} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px', minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
              <div style={{ ...mono, fontSize: 11.5, color: INK, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
            </div>
          ))}
        </div>
      </C360Card>
    </>
  )
}

// ── LENS 6 · SUPPORT LEAD — service posture ──────────────────────────────────

function SupView({ m }) {
  const span2 = { gridColumn: '1 / -1' }
  const a = m.a
  const volume = useMemo(() => ({
    grid: { left: 34, right: 16, top: 16, bottom: 24 },
    tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} tickets` },
    xAxis: catAxis(C360_WEEKS),
    yAxis: valAxis({}),
    series: [{
      type: 'bar', data: m.ticketWeeks, barWidth: '52%',
      itemStyle: { color: CORAL, opacity: 0.62, borderRadius: [4, 4, 0, 0] },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: MUTED, type: 'dashed', width: 1 },
        label: { formatter: 'baseline', position: 'insideEndTop', color: MUTED, fontFamily: ECH_FONT, fontSize: 9.5 },
        data: [{ yAxis: Math.round(m.ticketWeeks.reduce((t, v) => t + v, 0) / 12) }],
      },
    }],
  }), [a.id])

  const cats = useMemo(() => ({
    tooltip: { ...TT, trigger: 'item', formatter: p => `${p.name}<br/><b>${p.value}%</b> of tickets` },
    title: {
      text: 'API', subtext: '42%', left: 'center', top: '36%',
      textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: MUTED, fontWeight: 400 },
      subtextStyle: { fontFamily: ECH_FONT, fontSize: 16, fontWeight: 600, color: CORAL },
    },
    series: [{
      type: 'pie', radius: ['56%', '76%'], label: { show: false }, labelLine: { show: false },
      data: C360_CATEGORIES.map(([name, v, color]) => ({ name, value: v, itemStyle: { color, opacity: 0.78 } })),
      emphasis: { scale: true, scaleSize: 4 },
    }],
  }), [])

  const csat = useMemo(() => ({
    grid: { left: 34, right: 16, top: 16, bottom: 24 },
    tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} / 5` },
    xAxis: { ...catAxis(C360_WEEKS.slice(4)), boundaryGap: false },
    yAxis: valAxis({ min: 2.5, max: 5 }),
    series: [{
      type: 'line', data: m.csat, smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: GOLD, width: 2 }, itemStyle: { color: GOLD },
      areaStyle: { color: GOLD, opacity: 0.09 },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: CORAL, type: 'dashed', width: 1 },
        label: { formatter: 'target 4.2', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
        data: [{ yAxis: 4.2 }],
      },
    }],
  }), [a.id])

  return (
    <>
      <C360Card title="Open tickets · SLA clocks" style={span2} accent={CORAL}
        right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{m.tickets.length} open · {m.tickets.filter(t => t.elapsedHours > t.slaHours).length} breached</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {m.tickets.map(t => {
            const pct = t.elapsedHours / t.slaHours * 100
            const breached = t.elapsedHours > t.slaHours
            return (
              <div key={t.id} style={{ border: `1px solid ${breached ? '#eccfc6' : LINE}`, background: breached ? '#fdf6f4' : '#fff', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <Tag label={`SEV-${t.sev}`} color={t.sev === 2 ? HEALTH.bad : GOLD} bg={t.sev === 2 ? '#fbf1ee' : '#fdf7ec'} border={t.sev === 2 ? '#eccfc6' : '#eddfc2'} />
                  <span style={{ ...mono, fontSize: 11, color: MUTED }}>{t.id}</span>
                  <span style={{ flex: 1, minWidth: 180, fontSize: 13, fontWeight: 500, color: INK }}>{t.subject}</span>
                  <Tag label={t.category} color="#6b6455" />
                  <Tag label={t.status} color={t.status === 'Open' ? CORAL : GOLD} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9 }}>
                  <span style={{ ...mono, fontSize: 10, color: MUTED, width: 118, flexShrink: 0 }}>SLA {t.slaHours}h</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <MiniBar pct={Math.min(pct, 100)} color={breached ? CORAL : pct > 70 ? GOLD : GREEN} h={10} opacity={0.8} />
                  </span>
                  <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: breached ? CORAL : '#6b6455', width: 132, textAlign: 'right', flexShrink: 0 }}>
                    {t.elapsedHours}h / {t.slaHours}h {breached ? '· BREACHED' : ''}
                  </span>
                </div>
                <div style={{ ...mono, fontSize: 10, color: MUTED, marginTop: 6 }}>
                  aging {t.age}d · raised by {t.requester} · assigned {t.assignee}
                </div>
              </div>
            )
          })}
        </div>
      </C360Card>

      <C360Card title="Ticket volume by week"
        right={<span style={{ ...mono, fontSize: 10.5, color: CORAL }}>{m.ticketWeeks[11]} this week · ▲ {m.ticketWeeks[11] - m.ticketWeeks[0]} vs 12 wks ago</span>}>
        <Chart option={volume} height={196} />
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
          Volume has tripled over the quarter and the growth is entirely in API / Integration —
          the same subsystem behind the open Sev-2.
        </div>
      </C360Card>

      <C360Card title="Category breakdown · 12 weeks">
        <Chart option={cats} height={186} />
        <div>
          {C360_CATEGORIES.map(([name, v, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#6b6455', padding: '2.5px 0' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: color, opacity: 0.78, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{name}</span>
              <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{v}%</span>
            </div>
          ))}
        </div>
      </C360Card>

      <C360Card title="Escalation risk" accent={CORAL}>
        <Callout tone="bad" title="Support is now a renewal problem">
          {m.sev2
            ? <>
              <b>{m.sev2.id}</b> — {m.sev2.subject} — has been open {m.sev2.age} days against a {m.sev2.slaHours}h SLA.
              It was raised by <b>{m.sev2.requester}</b>, who is also the account's only detractor (NPS {a.nps}) and the
              contact pulling competitor research. The renewal is <b>{a.renewalDays} days</b> out and worth <b>{fmtUSD(a.arr)}</b>.
            </>
            : <>No Sev-2 outstanding, but CSAT has fallen to {m.csat[m.csat.length - 1]} against a 4.2 target with a renewal {a.renewalDays} days out.</>}
        </Callout>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatTile label="ARR exposed" value={fmtUSD(a.arr)} sub={`renewal in ${a.renewalDays}d`} color={CORAL} />
          <StatTile label="Churn risk" value={a.churn.toFixed(2)} sub="support is driver #3" color={CORAL} />
          <StatTile label="Detractors" value={m.contacts.filter(c => c.role === 'Detractor').length} sub="of 7 contacts" color={GOLD} />
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
          Recommended: hand {m.sev2 ? m.sev2.id : 'the open queue'} to the platform escalation team today and put the fix plan
          in front of {m.contacts.find(c => c.role === 'Detractor').name} before the CSM's renewal call.
        </div>
      </C360Card>

      <C360Card title="CSAT trend · 8 weeks"
        right={<span style={{ ...mono, fontSize: 10.5, color: CORAL }}>{m.csat[m.csat.length - 1]} / 5 · below 4.2 target</span>}>
        <Chart option={csat} height={186} />
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
          Eight consecutive weeks of decline. The drop tracks the rise in API tickets almost exactly.
        </div>
      </C360Card>

      <C360Card title="Recent ticket timeline">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {C360_TICKET_LOG.map(([date, title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 11, padding: '9px 0', borderBottom: i < C360_TICKET_LOG.length - 1 ? '1px solid #f4f2ee' : 'none' }}>
              <span style={{ ...mono, fontSize: 10.5, color: MUTED, width: 52, flexShrink: 0, paddingTop: 1 }}>{fmtDate(date)}</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: title.includes('resolved') ? GREEN : CORAL, flexShrink: 0, marginTop: 5 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: INK }}>{title}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#6b6455', lineHeight: 1.5, marginTop: 1 }}>{desc}</span>
              </span>
            </div>
          ))}
        </div>
      </C360Card>
    </>
  )
}

// ── CROSS-CUTTING · unified timeline + provenance ────────────────────────────

function UnifiedTimeline({ m, filter, setFilter }) {
  const counts = { all: m.timeline.length }
  m.timeline.forEach(e => { counts[e.motion] = (counts[e.motion] || 0) + 1 })
  const events = filter === 'all' ? m.timeline : m.timeline.filter(e => e.motion === filter)
  const chips = [['all', 'All motions', INK], ...Object.keys(MOTION).map(k => [k, MOTION[k].label, MOTION[k].color])]
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 13, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>
          Unified timeline · every motion, one record
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {chips.map(([key, label, color]) => {
            const active = filter === key
            return (
              <button key={key} onClick={() => setFilter(key)} style={{
                border: `1px solid ${active ? color : LINE2}`, background: active ? '#fff' : 'transparent',
                color: active ? color : '#6b6455', borderRadius: 20, padding: '3px 11px',
                fontSize: 11.5, fontWeight: active ? 600 : 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
                boxShadow: active ? '0 1px 4px rgba(26,26,26,0.06)' : 'none',
              }}>
                {key !== 'all' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                {label}
                <span style={{ ...mono, fontSize: 10, color: active ? color : MUTED }}>{counts[key] || 0}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 78 }}>
        <div style={{ position: 'absolute', left: 71, top: 6, bottom: 6, width: 1, background: LINE }} />
        {events.map((e, i) => {
          const mo = MOTION[e.motion]
          return (
            <div key={e.date + e.title} style={{ position: 'relative', padding: '9px 0', borderBottom: i < events.length - 1 ? '1px solid #f7f5f1' : 'none' }}>
              <span style={{ ...mono, position: 'absolute', left: -78, top: 11, width: 56, textAlign: 'right', fontSize: 10.5, color: MUTED }}>
                {fmtDate(e.date)}
              </span>
              <span style={{
                position: 'absolute', left: -11.5, top: 13, width: 9, height: 9, borderRadius: '50%',
                background: '#fff', border: `2px solid ${mo.color}`, boxSizing: 'border-box',
              }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                <Tag label={mo.label} color={mo.color} bg="#fff" border={LINE2} />
                <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{e.title}</span>
                <span style={{ ...mono, fontSize: 10, color: MUTED, marginLeft: 'auto' }}>{e.actor}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#6b6455', lineHeight: 1.55, marginTop: 3 }}>{e.desc}</div>
            </div>
          )
        })}
        {events.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: MUTED }}>No events in this motion.</div>
        )}
      </div>
    </div>
  )
}

function ProvenanceStrip({ persona }) {
  return (
    <div style={{ ...card, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flexShrink: 0, background: PLATE }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, flexShrink: 0 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="3" cy="6" r="1.8" stroke={MUTED} strokeWidth="1.1" />
          <circle cx="9" cy="2.8" r="1.8" stroke={MUTED} strokeWidth="1.1" />
          <circle cx="9" cy="9.2" r="1.8" stroke={MUTED} strokeWidth="1.1" />
          <path d="M4.6 5.2L7.4 3.6M4.6 6.8L7.4 8.4" stroke={MUTED} strokeWidth="1.1" />
        </svg>
        Where this comes from
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ ...mono, fontSize: 10, color: MUTED }}>nodes</span>
        {persona.nodes.map(n => <NodeChip key={n} label={n} />)}
      </span>
      <span style={{ width: 1, height: 18, background: LINE }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ ...mono, fontSize: 10, color: MUTED }}>sources</span>
        {persona.sources.map(s => (
          <span key={s} style={{ ...mono, fontSize: 10.5, color: persona.accent, border: `1px solid ${LINE2}`, background: '#fff', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
            {s}
          </span>
        ))}
      </span>
      <span style={{ marginLeft: 'auto', ...mono, fontSize: 10, color: MUTED }}>
        Revenue Teams Context Graph · resolved 02:14 today
      </span>
    </div>
  )
}

// ── The application ──────────────────────────────────────────────────────────

function Customer360({ onBack }) {
  const [acctId, setAcctId] = useState('northwind')
  const [personaId, setPersonaId] = useState('am')
  const [motion, setMotion] = useState('all')

  const acct = ACCOUNTS.find(a => a.id === acctId)
  const m = useMemo(() => c360Model(acct), [acctId])
  const persona = PERSONAS.find(p => p.id === personaId)
  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }

  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Customer 360"
        subtitle={`${acct.name} · ${acct.tier} · ${fmtUSD(acct.arr)} ARR · renewal in ${acct.renewalDays} days`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <PersonaSwitcher value={personaId} onChange={setPersonaId} />
            <span style={{ width: 1, height: 22, background: LINE }} />
            <AccountSwitcher accounts={ACCOUNTS} value={acctId} onChange={setAcctId} />
            <LiveBadge />
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', background: CANVAS, minHeight: 0 }}>
        {/* One quiet line saying what this lens is looking at */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: CANVAS, borderBottom: `1px solid ${LINE}`, padding: '11px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ width: 3, height: 15, borderRadius: 2, background: persona.accent, flexShrink: 0 }} />
            <span style={{ ...serif, fontSize: 13.5, fontStyle: 'italic', color: '#6b6455' }}>
              {persona.context(m)}
            </span>
            <span style={{ marginLeft: 'auto', ...mono, fontSize: 10.5, color: MUTED }}>
              same record · {PERSONAS.length} lenses · {m.timeline.length} events
            </span>
          </div>
        </div>

        <div style={{ padding: '16px 26px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={grid2}>
            {personaId === 'am' && <AmView m={m} />}
            {personaId === 'dos' && <DosView m={m} />}
            {personaId === 'csm' && <CsmView m={m} />}
            {personaId === 'mkt' && <MktView m={m} />}
            {personaId === 'revops' && <RevOpsView m={m} />}
            {personaId === 'sup' && <SupView m={m} />}
          </div>

          <UnifiedTimeline m={m} filter={motion} setFilter={setMotion} />
          <ProvenanceStrip persona={persona} />
        </div>
      </div>
    </>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [openApp, setOpenApp] = useState(null)
  const back = () => setOpenApp(null)
  return (
    <div style={{ flex: 1, background: PLATE, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {openApp === 'c360' && <Customer360 onBack={back} />}
      {openApp === 'map' && <NetworkAtlas onBack={back} />}
      {openApp === 'insights' && <NetworkPulse onBack={back} />}
      {openApp === 'fleet' && <FleetBoard onBack={back} />}
      {!openApp && <AppList onOpen={setOpenApp} />}
    </div>
  )
}
