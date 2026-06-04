import { useState, useRef, useEffect, useCallback } from 'react'

const TABS = ['Graph','Nodes','Edges','Sources','Records','Violations','Governance']

const BLUE='#2f6fdb', RED='#d0402f', YELLOW='#d4a017'

/* canvas nodes — internal coordinate space */
const CN = [
  { id:'acc_tl',  x:300, y:170, name:'ACCOUNT',  kind:'acct',     v:'2.8K' },
  { id:'inc_t',   x:660, y:130, name:'INCIDENT', kind:'incident', v:'2.8K' },
  { id:'acc_tr',  x:980, y:200, name:'ACCOUNT',  kind:'acct',     v:'2.8K' },
  { id:'acc_hub', x:660, y:380, name:'ACCOUNT',  kind:'acct',     v:'2.8K', sel:true },
  { id:'acc_l',   x:320, y:430, name:'ACCOUNT',  kind:'acct',     v:'2.8K' },
  { id:'risk_c',  x:500, y:490, name:'RISK',     kind:'risk',     v:'2.8K' },
  { id:'acc_b',   x:760, y:660, name:'ACCOUNT',  kind:'acct',     v:'2.8K' },
  { id:'acc_br',  x:1120,y:660, name:'ACCOUNT',  kind:'acct',     v:'2.8K', faded:true },
  { id:'inc_b',   x:400, y:790, name:'INCIDENT', kind:'incident', v:'2.8K', faded:true },
  { id:'risk_b',  x:600, y:830, name:'RISK',     kind:'risk',     v:'2.8K', faded:true },
]
const CE = [
  { a:'acc_tl',  b:'acc_hub', label:':SOURCES' },
  { a:'inc_t',   b:'acc_hub', label:':ATTACHED_TO' },
  { a:'acc_tr',  b:'acc_hub', label:'' },
  { a:'acc_l',   b:'acc_hub', label:':SOURCES' },
  { a:'risk_c',  b:'acc_hub', label:':OBSERVED_ON' },
  { a:'acc_hub', b:'acc_b',   label:':HAS_SUBSCRIPTION' },
  { a:'risk_c',  b:'acc_b',   label:':AGAINST', faded:true },
  { a:'inc_b',   b:'acc_hub', label:':TOUCHES' },
  { a:'inc_b',   b:'acc_b',   label:':RAISES', faded:true },
  { a:'acc_b',   b:'acc_br',  label:':BILLS', faded:true },
  { a:'acc_hub', b:'acc_br',  label:':EXPOSES', faded:true, dash:true },
]

const LIST = [
  { name:'Account',   kind:'acct' }, { name:'Incident', kind:'incident' },
  { name:'Risk',      kind:'risk' }, { name:'Agreement', kind:'acct' },
  { name:'Account',   kind:'acct' }, { name:'Agreement', kind:'acct' },
  { name:'Risk',      kind:'risk' }, { name:'Agreement', kind:'acct' },
  { name:'Agreement', kind:'acct' }, { name:'Risk', kind:'risk' },
  { name:'Agreement', kind:'acct' }, { name:'Risk', kind:'risk' },
]

const NR = 26

const PLATE = { background:'#FEFDFB', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', flex:1, minWidth:0 }

export default function GraphDetailPage({ graph, onBack }) {
  const [tab, setTab] = useState('Graph')
  const [ftab, setFtab] = useState('All')
  const [sel, setSel] = useState(0)
  const [sigTab, setSigTab] = useState('Overview')
  const [pan, setPan] = useState({ x:40, y:30 })
  const [zoom, setZoom] = useState(0.95)
  const drag = useRef(false), last = useRef({x:0,y:0}), svg = useRef(null)
  const M = Object.fromEntries(CN.map(n => [n.id, n]))

  const onWheel = useCallback(e => { e.preventDefault(); setZoom(z => Math.min(2.2, Math.max(.3, z*(e.deltaY>0?.92:1.08)))) }, [])
  useEffect(() => { const el=svg.current; if(el) el.addEventListener('wheel', onWheel, {passive:false}); return () => el && el.removeEventListener('wheel', onWheel) }, [onWheel])
  const md = e => { if(e.target.closest('.ng')) return; drag.current=true; last.current={x:e.clientX,y:e.clientY} }
  const mm = e => { if(!drag.current) return; setPan(p => ({x:p.x+e.clientX-last.current.x, y:p.y+e.clientY-last.current.y})); last.current={x:e.clientX,y:e.clientY} }
  const mu = () => drag.current=false

  return (
    <div style={PLATE}>
      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', height:58, borderBottom:'1px solid #eef0ee', flexShrink:0, padding:'0 16px' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:8, marginRight:6, display:'flex' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="#5b6066" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ marginRight:24 }}>
          <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:500, color:'#1a1a1a', lineHeight:1.1 }}>
            {graph?.name || 'Enterprise Context Graph'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--mono)', fontSize:10.5, color:'#9ca3af', marginTop:2 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#3fb863' }}/>LIVE · V2.14.0
          </div>
        </div>
        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <div style={{ display:'flex', background:'#f2f3f2', borderRadius:12, padding:4, gap:2 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'7px 16px', borderRadius:9, border:'none', cursor:'pointer', fontSize:14,
                background: tab===t?'#fff':'transparent',
                color: tab===t?'#1a1a1a':'#5b6066', fontWeight: tab===t?500:400,
                boxShadow: tab===t?'0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)':'none',
                transition:'background .15s, box-shadow .15s, color .15s', whiteSpace:'nowrap',
              }}>{t}</button>
            ))}
          </div>
        </div>
        <button style={{ background:'var(--green-btn)', color:'#fff', border:'none', borderRadius:8, padding:'0 18px', height:34, fontSize:13.5, fontWeight:500, cursor:'pointer', marginRight:6 }}
          onMouseOver={e => e.currentTarget.style.background='#1d4228'} onMouseOut={e => e.currentTarget.style.background='#16341f'}>Publish</button>
        <button style={{ background:'none', border:'none', cursor:'pointer', padding:8, display:'flex' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.3" fill="#6b7280"/><circle cx="9" cy="9" r="1.3" fill="#6b7280"/><circle cx="9" cy="14" r="1.3" fill="#6b7280"/></svg>
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Left panel */}
        <div style={{ width:248, flexShrink:0, borderRight:'1px solid #eef0ee', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 14px 10px' }}>
            <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:11 }}>
                <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input placeholder="Search nodes..." style={{ flex:1, border:'1px solid #e3e6e3', borderRadius:9, padding:'9px 34px 9px 32px', fontSize:13, color:'#374151', outline:'none' }}/>
              <button style={{ position:'absolute', right:6, background:'none', border:'none', cursor:'pointer', padding:4, display:'flex' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="#9ca3af" strokeWidth="1.3"/><path d="M6 2.5v11" stroke="#9ca3af" strokeWidth="1.3"/></svg>
              </button>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, padding:'0 14px 12px' }}>
            {['All','Entities','Resources'].map(t => (
              <button key={t} onClick={() => setFtab(t)} style={{
                padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12.5,
                background: ftab===t?'#1a1a1a':'#f1f3f1', color: ftab===t?'#fff':'#6b7280', fontWeight:500, transition:'all .15s',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ padding:'0 16px 8px', fontFamily:'var(--mono)', fontSize:10.5, color:'#9ca3af', letterSpacing:0.5 }}>14 NODES</div>
          <div style={{ flex:1, overflowY:'auto', padding:'0 8px' }}>
            {LIST.map((n,i) => (
              <div key={i} onClick={() => setSel(i)} style={{
                display:'flex', alignItems:'center', gap:11, padding:'9px 10px', borderRadius:9, cursor:'pointer',
                background: sel===i?'#f4f5f4':'transparent', transition:'background .12s',
              }}
                onMouseOver={e => { if(sel!==i) e.currentTarget.style.background='#f9faf9' }}
                onMouseOut={e => { if(sel!==i) e.currentTarget.style.background='transparent' }}>
                <NodeBadge kind={n.kind}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'#1a1a1a', lineHeight:1.2 }}>{n.name}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'#9ca3af', letterSpacing:0.5 }}>ENTITY</div>
                </div>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3l3 3.5-3 3.5" stroke="#c5c9c5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#fbfbfa' }}>
          <svg ref={svg} width="100%" height="100%" style={{ cursor: drag.current?'grabbing':'grab', userSelect:'none' }}
            onMouseDown={md} onMouseMove={mm} onMouseUp={mu} onMouseLeave={mu}>
            <defs>
              <pattern id="dg" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#e6e8e6"/></pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dg)"/>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* edges */}
              {CE.map((e,i) => {
                const a=M[e.a], b=M[e.b]; if(!a||!b) return null
                const op = e.faded?0.28:0.85
                const mx=(a.x+b.x)/2, my=(a.y+b.y)/2
                return (
                  <g key={i}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="#b8bcb8" strokeOpacity={op} strokeWidth="1.3"
                      strokeDasharray={e.dash?'5 4':'none'}/>
                    {e.label && (
                      <text x={mx} y={my-4} textAnchor="middle" fontFamily="var(--mono)" fontSize="10"
                        fill="#9ca3af" fillOpacity={e.faded?0.4:1}>{e.label}</text>
                    )}
                  </g>
                )
              })}
              {/* nodes */}
              {CN.map((n,i) => {
                const isSel = n.sel
                const op = n.faded?0.32:1
                const col = n.kind==='acct'?BLUE : n.kind==='incident'?RED : YELLOW
                return (
                  <g key={n.id} className="ng" opacity={op} style={{ cursor:'pointer' }}>
                    {/* value label above */}
                    <text x={n.x} y={n.y-NR-8} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="#9ca3af">{n.v}</text>
                    {isSel && <circle cx={n.x} cy={n.y} r={NR+7} fill={col} fillOpacity="0.08"/>}
                    <circle cx={n.x} cy={n.y} r={NR} fill="#fff" stroke={col} strokeWidth={isSel?2.4:1.8}/>
                    <NodeGlyph kind={n.kind} cx={n.x} cy={n.y} col={col}/>
                    <text x={n.x} y={n.y+NR+16} textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill="#6b7280" letterSpacing="0.5">{n.name}</text>
                  </g>
                )
              })}
            </g>
          </svg>

          {/* legend */}
          <div style={{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-150px)', display:'flex', gap:16, alignItems:'center' }}>
            <Legend c={BLUE} l="Sources"/><Legend c={RED} l="Entities"/>
          </div>
          {/* view/edit */}
          <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50px)', display:'flex', background:'#fff', border:'1px solid #e3e6e3', borderRadius:9, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#f4f5f4', border:'none', borderRight:'1px solid #e3e6e3', cursor:'pointer', fontSize:12.5, color:'#1a1a1a', fontWeight:500 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" stroke="#374151" strokeWidth="1.2"/><circle cx="7" cy="7" r="1.6" stroke="#374151" strokeWidth="1.2"/></svg>
              View
            </button>
            <button style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#fff', border:'none', cursor:'pointer', fontSize:12.5, color:'#6b7280' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2l2.5 2.5L5 11.5 2 12l.5-3L9.5 2z" stroke="#6b7280" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              Edit
            </button>
          </div>

          {/* minimap */}
          <div style={{ position:'absolute', bottom:14, right:62, width:150, height:96, background:'#fff', border:'1px solid #e3e6e3', borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <svg width="100%" height="100%" viewBox="0 0 150 96">
              {CE.map((e,i) => { const a=M[e.a],b=M[e.b]; if(!a||!b) return null; return <line key={i} x1={a.x*0.12+8} y1={a.y*0.1+8} x2={b.x*0.12+8} y2={b.y*0.1+8} stroke="#d5d8d5" strokeWidth="0.7"/> })}
              {CN.map(n => { const col=n.kind==='acct'?BLUE:n.kind==='incident'?RED:YELLOW; return <circle key={n.id} cx={n.x*0.12+8} cy={n.y*0.1+8} r="3.5" fill={col} fillOpacity={n.faded?0.3:0.85}/> })}
            </svg>
          </div>
          {/* zoom */}
          <div style={{ position:'absolute', bottom:14, right:14, display:'flex', flexDirection:'column', background:'#fff', border:'1px solid #e3e6e3', borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <button onClick={() => setZoom(z => Math.min(2.2,z*1.15))} style={zbtn}>+</button>
            <div style={{ ...zbtn, fontSize:10, color:'#9ca3af', cursor:'default', fontFamily:'var(--mono)' }}>{Math.round(zoom*100)}%</div>
            <button onClick={() => setZoom(z => Math.max(.3,z*0.87))} style={zbtn}>−</button>
            <button onClick={() => { setZoom(0.95); setPan({x:40,y:30}) }} style={{ ...zbtn, fontSize:9, color:'#9ca3af', fontFamily:'var(--mono)' }}>FIT</button>
          </div>
        </div>

        {/* Signal panel */}
        <div className="dark-scroll" style={{ width:300, flexShrink:0, borderLeft:'1px solid #eef0ee', overflow:'auto' }}>
          <div style={{ padding:'18px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:'#1a1a1a', flex:1 }}>Signal</span>
              <button style={{ background:'none', border:'none', cursor:'pointer', padding:2, display:'flex' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
              {[['REQUIRED','2.8K'],['PROPERTIES','18'],['EDGE TYPES','2']].map(([l,v]) => (
                <div key={l} style={statBox}>
                  <div style={statLbl}>{l}</div><div style={statVal}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:18, borderBottom:'1px solid #eef0ee', marginBottom:18 }}>
              {['Overview','Props','Edges','Sources','Rules'].map(t => (
                <button key={t} onClick={() => setSigTab(t)} style={{
                  background:'none', border:'none', padding:'0 0 9px', cursor:'pointer', fontSize:13,
                  color: sigTab===t?'#1a1a1a':'#9ca3af', fontWeight: sigTab===t?500:400,
                  borderBottom: sigTab===t?'2px solid #2e7d46':'2px solid transparent', marginBottom:-1,
                }}>{t}</button>
              ))}
            </div>

            <Heading>At a glance</Heading>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 }}>
              {[['REQUIRED','2.8K'],['COMPUTED','0/7'],['INDEXED','2.8K'],['PII FIELDS','1/7']].map(([l,v]) => (
                <div key={l} style={{ ...statBox, padding:'12px 14px' }}>
                  <div style={statLbl}>{l}</div><div style={{ ...statVal, fontSize:20 }}>{v}</div>
                </div>
              ))}
            </div>

            <Heading>Data quality (24 hrs)</Heading>
            <div style={{ marginBottom:22 }}>
              {[
                ['Completeness','12 missing · 88%',88],
                ['Freshness','17m 7s · 86%',86],
                ['Validity','13 violation · 92%',92],
                ['Identity match','5 in queue · 90%',90],
              ].map(([l,note,pct]) => (
                <div key={l} style={{ marginBottom:13 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'#374151' }}>{l}</span>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{note}</span>
                  </div>
                  <div style={{ height:6, background:'#eef0ee', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'#3fb863', borderRadius:3, transition:'width .5s' }}/>
                  </div>
                </div>
              ))}
            </div>

            <Heading>Lineage</Heading>
            <div style={{ marginBottom:22 }}>
              {[['Direct Sources','1'],['Inferred edges','0 in · 0 out'],['Computed properties','0']].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f3' }}>
                  <span style={{ fontSize:13, color:'#6b7280' }}>{l}</span>
                  <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>

            <Heading>Top edges</Heading>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={tagPill}>:OBSERVED_ON</span>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 6.5h10M7.5 3l3.5 3.5L7.5 10" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ ...tagPill, display:'flex', alignItems:'center', gap:4 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2.5" width="9" height="7" rx="1.2" stroke="#5b6066" strokeWidth="1.1"/><path d="M1.5 4.5h9" stroke="#5b6066" strokeWidth="1.1"/></svg>
                ACCOUNT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NodeBadge({ kind }) {
  const col = kind==='acct'?BLUE : kind==='incident'?RED : YELLOW
  return (
    <div style={{ width:28, height:28, borderRadius:'50%', border:`1.8px solid ${col}`, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="14" height="14" viewBox="0 0 14 14">
        {kind==='acct' && <path d="M7 2.5L11 7l-4 4.5L3 7z" fill={col}/>}
        {kind==='incident' && <path d="M7 3L11 10H3z" fill={col}/>}
        {kind==='risk' && <><line x1="7" y1="3.5" x2="7" y2="8" stroke={col} strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="10" r="1" fill={col}/></>}
      </svg>
    </div>
  )
}

function NodeGlyph({ kind, cx, cy, col }) {
  const s = NR*0.5
  if (kind==='acct') return <path d={`M${cx},${cy-s} L${cx+s},${cy} L${cx},${cy+s} L${cx-s},${cy} Z`} fill={col}/>
  if (kind==='incident') return <path d={`M${cx},${cy-s*0.9} L${cx+s*0.95},${cy+s*0.7} L${cx-s*0.95},${cy+s*0.7} Z`} fill={col}/>
  return <><line x1={cx} y1={cy-s} x2={cx} y2={cy+s*0.4} stroke={col} strokeWidth="3" strokeLinecap="round"/><circle cx={cx} cy={cy+s*0.85} r="1.6" fill={col}/></>
}

function Legend({ c, l }) {
  return <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:'50%', background:c }}/><span style={{ fontSize:12, color:'#6b7280' }}>{l}</span></div>
}

function Heading({ children }) {
  return <div style={{ fontFamily:'var(--serif)', fontSize:16, fontWeight:500, color:'#1a1a1a', marginBottom:12 }}>{children}</div>
}

const statBox = { background:'#fafbfa', border:'1px solid #eef0ee', borderRadius:9, padding:'10px 12px' }
const statLbl = { fontSize:9.5, color:'#9ca3af', fontWeight:500, letterSpacing:0.6, marginBottom:4 }
const statVal = { fontSize:18, fontWeight:600, color:'#1a1a1a' }
const tagPill = { fontFamily:'var(--mono)', fontSize:11, color:'#374151', background:'#f1f3f1', padding:'4px 8px', borderRadius:5 }
const zbtn = { width:32, height:30, background:'#fff', border:'none', borderBottom:'1px solid #eef0ee', color:'#5b6066', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }
