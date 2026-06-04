import { useState } from 'react'
import MiniGraph from './MiniGraph'

export const GRAPHS = [
  { id:'enterprise', label:'GLOBAL',   labelColor:'#9a6b1f', tint:'#f6ecd8', accent:'#b0832f', name:'Enterprise Context Graph' },
  { id:'customer',   label:'CUSTOMER', labelColor:'#6d28d9', tint:'#efe8fb', accent:'#8b5cf6', name:'Customer 360 Graph' },
  { id:'finance',    label:'FINANCE',  labelColor:'#1f7a40', tint:'#e3f4e7', accent:'#46a05c', name:'Finance graph' },
  { id:'sale',       label:'REVENUE',  labelColor:'#5b6066', tint:'#eef0f1', accent:'#9298a0', name:'Sales Graph' },
  { id:'security',   label:'SECURITY', labelColor:'#1e40af', tint:'#e6edfa', accent:'#4571d4', name:'Security Posture Graph' },
  { id:'support',    label:'SUPPORT',  labelColor:'#a52424', tint:'#fbe6e6', accent:'#d05151', name:'Support Graph' },
]
const DESC = 'Track all changes, actions, and deployments in one chronological view.'

const PLATE = {
  background:'#FEFDFB', borderRadius:14, overflow:'hidden',
  display:'flex', flexDirection:'column', minWidth:0,
}

export default function GraphsPage({ onOpenGraph }) {
  const [viewMode, setViewMode] = useState('grid')
  const [filter, setFilter] = useState('Most Active')
  const [search, setSearch] = useState('')

  const filtered = GRAPHS.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
      <div style={{ ...PLATE, flex:1 }}>
        {/* ── Header ── */}
        <div style={{ padding:'18px 26px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
            <h1 style={{ fontFamily:'var(--serif)', fontSize:27, fontWeight:500, color:'#1a1a1a', letterSpacing:-0.3, flex:1 }}>
              Enterprise Context Graph
            </h1>
            <div style={{ display:'flex', gap:34, marginRight:22 }}>
              {[['GRAPHS','9'],['NODES','183,202'],['SOURCES','12']].map(([l,v]) => (
                <div key={l} style={{ textAlign:'left' }}>
                  <div style={{ fontFamily:'var(--sans)', fontSize:10.5, color:'#9ca3af', fontWeight:500, letterSpacing:0.8, marginBottom:3, textTransform:'uppercase' }}>{l}</div>
                  <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:600, color:'#111827' }}>{v}</div>
                </div>
              ))}
            </div>
            <button style={{
              background:'var(--green-btn)', color:'#fff', border:'none', borderRadius:9,
              padding:'0 16px', height:34, fontSize:13.5, fontWeight:500, cursor:'pointer',
              display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap', transition:'background .15s',
            }}
              onMouseOver={e => e.currentTarget.style.background='#1d4228'}
              onMouseOut={e => e.currentTarget.style.background='#16341f'}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              New graph
            </button>
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:14 }}>
            <button style={iconBtn}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M13 7.5a5.5 5.5 0 11-1.4-3.6" stroke="#5b6066" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M13 2v3h-3" stroke="#5b6066" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <Dropdown value={filter} options={['Most Active','Recently Updated','Alphabetical']} onChange={setFilter}/>
            <Pill label="Domain"/>
            <div style={{ flex:1 }}/>
            <div style={{ display:'flex', border:'1px solid #e3e6e3', borderRadius:8, overflow:'hidden' }}>
              {[['grid',GridIcon],['list',ListIcon]].map(([m,Icon]) => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  width:34, height:32, background: viewMode===m?'#f1f3f1':'#fff', border:'none',
                  borderRight: m==='grid'?'1px solid #e3e6e3':'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}><Icon active={viewMode===m}/></button>
              ))}
            </div>
            <div style={{ position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search graphs"
                style={{ border:'1px solid #e3e6e3', borderRadius:8, padding:'7px 12px 7px 30px', fontSize:13, color:'#374151', outline:'none', width:210, transition:'border-color .15s' }}
                onFocus={e => e.target.style.borderColor='#9298a0'} onBlur={e => e.target.style.borderColor='#e3e6e3'}/>
            </div>
          </div>
        </div>

        {/* ── Cards ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 26px 26px' }}>
          <div style={{ display:'grid', gridTemplateColumns: viewMode==='grid'?'repeat(3,1fr)':'1fr', gap:22 }}>
            {filtered.map(g => <Card key={g.id} g={g} onClick={() => onOpenGraph(g)} list={viewMode==='list'}/>)}
          </div>
        </div>
      </div>
  )
}

function Card({ g, onClick, list }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background:'#fff', border:'1px solid #ebedeb', borderRadius:14, overflow:'hidden', cursor:'pointer',
        transition:'transform .18s ease, box-shadow .18s ease',
        boxShadow: hov?'0 8px 26px rgba(0,0,0,0.1)':'0 1px 3px rgba(0,0,0,0.04)',
        transform: hov?'translateY(-2px)':'none', display: list?'flex':'block',
      }}>
      {!list && (
        <div style={{ position:'relative', height:215, background:`linear-gradient(180deg, ${g.tint} 0%, #ffffff 92%)` }}>
          <span style={{
            position:'absolute', top:13, left:13, zIndex:2,
            background:'#fff', borderRadius:5, padding:'3px 8px',
            fontFamily:'var(--mono)', fontSize:10, fontWeight:600, letterSpacing:0.5,
            color:g.labelColor, boxShadow:'0 1px 2px rgba(0,0,0,0.06)',
          }}>{g.label}</span>
          <span style={{
            position:'absolute', top:13, right:13, zIndex:2,
            background:'#fff', borderRadius:11, padding:'3px 9px',
            fontSize:11, fontWeight:500, color:'#374151',
            display:'flex', alignItems:'center', gap:5, boxShadow:'0 1px 2px rgba(0,0,0,0.06)',
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#3fb863' }}/>96%
          </span>
          <MiniGraph color={g.accent}/>
        </div>
      )}
      <div style={{ padding: list?'18px 20px':'18px 20px 20px', flex:1 }}>
        <div style={{ fontFamily:'var(--serif)', fontWeight:500, fontSize:18, color:'#1a1a1a', marginBottom:8 }}>{g.name}</div>
        <div style={{ fontSize:13.5, color:'#9097a0', marginBottom:16, lineHeight:1.5 }}>{DESC}</div>
        <div style={{ borderTop:'1px solid #f0f1f0', paddingTop:14, display:'flex', gap:0 }}>
          {[['NODES','28,431'],['EDGES','183,202'],['SOURCES','12']].map(([l,v]) => (
            <div key={l} style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'#9ca3af', fontWeight:500, letterSpacing:0.7, marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#374151' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...iconBtn, width:'auto', padding:'0 12px', gap:7, fontSize:13, color:'#374151' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M3.5 4.5L5 3l1.5 1.5M5 3v7M9.5 8.5L8 10 6.5 8.5M8 10V3" stroke="#9298a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {value}
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'#fff', border:'1px solid #e3e6e3', borderRadius:8, boxShadow:'0 4px 16px rgba(0,0,0,0.1)', zIndex:50, minWidth:180, overflow:'hidden' }}>
          {options.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false) }} style={{ padding:'9px 14px', fontSize:13, cursor:'pointer', color:o===value?'#1f7a40':'#374151', background:o===value?'#f0f8f2':'transparent' }}
              onMouseOver={e => { if(o!==value) e.currentTarget.style.background='#f8f9f8' }}
              onMouseOut={e => { if(o!==value) e.currentTarget.style.background='transparent' }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({ label }) {
  return (
    <button style={{ ...iconBtn, width:'auto', padding:'0 12px', gap:7, fontSize:13, color:'#374151' }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2 3.5h9M3.5 6.5h6M5 9.5h3" stroke="#9298a0" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      {label}
    </button>
  )
}

const iconBtn = { background:'#fff', border:'1px solid #e3e6e3', borderRadius:8, height:32, width:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, transition:'background .12s' }

function GridIcon({ active }) {
  const c = active?'#374151':'#9ca3af'
  return <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" stroke={c} strokeWidth="1.3"/><rect x="8" y="1.5" width="4.5" height="4.5" rx="1" stroke={c} strokeWidth="1.3"/><rect x="1.5" y="8" width="4.5" height="4.5" rx="1" stroke={c} strokeWidth="1.3"/><rect x="8" y="8" width="4.5" height="4.5" rx="1" stroke={c} strokeWidth="1.3"/></svg>
}
function ListIcon({ active }) {
  const c = active?'#374151':'#9ca3af'
  return <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M2 7h10M2 10.5h10" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>
}
