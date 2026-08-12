import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

// ─── APPLICATIONS SHARED KIT ─────────────────────────────────────────────────
// Theme constants, ECharts styling primitives and the small presentational
// pieces every visual application on this page reuses. Nothing in here knows
// about a specific app — ApplicationsPage.jsx and GreifApps.jsx both import
// from it, so it must never import back from either.

export const INK = '#1a1a1a'
export const MUTED = '#9a948a'
export const LINE = '#ececea'
export const LINE2 = '#e3ddd1'
export const CANVAS = '#fcfbf7'
export const PLATE = '#FEFDFB'
export const HEALTH = { good: '#2f9e5a', warn: '#d99214', bad: '#c0492f' }
export const BLUE = '#2f6fdb'
export const GREEN = '#0f8a5f'
export const CORAL = '#c2543a'
export const PURPLE = '#6b5aa6'
export const GOLD = HEALTH.warn

export const card = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12 }
export const mono = { fontFamily: 'var(--mono)' }
export const serif = { fontFamily: 'var(--serif)' }

export const fmtK = n => n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K'
  : String(n)

export const fmtUSD = n => n >= 1000000
  ? '$' + (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  : '$' + Math.round(n / 1000) + 'K'

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ─── ECHARTS SHARED STYLING + HELPER ─────────────────────────────────────────

export const ECH_FONT = 'JetBrains Mono, ui-monospace, monospace'
export const AX_LABEL = { fontFamily: ECH_FONT, fontSize: 10, color: MUTED }
export const TT = {
  backgroundColor: '#fff', borderColor: LINE2, borderWidth: 1, padding: [7, 10],
  textStyle: { fontFamily: ECH_FONT, fontSize: 11, color: '#4b463d' },
  extraCssText: 'box-shadow:0 4px 14px rgba(26,26,26,0.09);border-radius:8px;',
}
export const catAxis = data => ({
  type: 'category', data,
  axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false },
  axisLabel: AX_LABEL, splitLine: { show: false },
})
export const valAxis = (extra = {}) => ({
  type: 'value',
  axisLine: { show: false }, axisTick: { show: false }, axisLabel: AX_LABEL,
  splitLine: { lineStyle: { color: LINE } },
  ...extra,
})

// Shared ECharts host: inits on a ref div, observes resize, disposes on unmount
// (StrictMode-safe: cleanup disposes, remount re-inits).
export function Chart({ option, height = 220 }) {
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

export function BackButton({ onClick }) {
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

export function AppHeader({ title, subtitle, onBack, right }) {
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

export function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: HEALTH.good, border: '1px solid #cde7d6', background: '#f2faf5', borderRadius: 20, padding: '3px 10px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: HEALTH.good }} />
      Live
    </span>
  )
}

export function NodeChip({ label }) {
  return (
    <span style={{ ...mono, fontSize: 10.5, color: '#6b6455', border: `1px solid ${LINE2}`, background: '#faf8f3', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export function StatusDot({ health }) {
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: HEALTH[health] || HEALTH.good, display: 'inline-block', flexShrink: 0 }} />
}

// Generic SVG sparkline (metro panel + national trend strip).
export function Spark({ values, w = 130, h = 36, color = BLUE, floor = null, lo = null, hi = null }) {
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
