import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const WORKSPACES = [
  { name:'Global',                      emoji:'',    color:'#7c6cf0', selected:true },
  { name:'Service and Support',         emoji:'📞',  color:'#f0a14b' },
  { name:'[RS] Assets',                 emoji:'',    color:'#f0703a' },
  { name:'Developer Tools and Soft…',   emoji:'👷',  color:'#f06a3a' },
  { name:'HR and Workforce',            emoji:'🧑‍💼', color:'#c44bf0' },
]

const NAV = [
  { id:'agents',     label:'AI Agents',           icon:'agents',     children:['Agents','Teams','Skills','Copilot','MCP Servers','A2A Servers','Deployments'] },
  { id:'apps',       label:'AI Applications',     icon:'apps',       children:['Applications','Design System','Custom Components','Template Components'] },
  { id:'workflows',  label:'AI Workflows',        icon:'workflows',  children:['Automations','API Gateway','Decision Tables','Automation Interfaces','Automation Templates'] },
  { id:'ontology',   label:'AI Ontology & Data',  icon:'ontology',   children:['Data Pipelines','Data Catalog & Lineage','Data Quality','Ontology','Event Streams','Campaigns','Segments'] },
  { id:'resources',  label:'Enterprise Resources',icon:'platform',   children:['Objects Manager','Knowledge','Memory Set','Code Functions','Templates','Environment Variables'] },
  { id:'system',     label:'Enterprise Systems',  icon:'system',     children:['Connections Manager','Connectors SDK'] },
]

const BOTTOM = [
  { id:'governance', label:'AI Governance',  icon:'governance' },
  { id:'ptools',     label:'Platform tools', icon:'layers' },
  { id:'settings',   label:'Settings',       icon:'settings' },
  { id:'notifs',     label:'Notifications',  icon:'bell' },
]

const W_C = 56
const W_E = 232

export default function Sidebar({ onNavigate, activeId = 'agents', onSelectNav, activeChild = null, showFde = false, fdeActive = false, onToggleFde }) {
  const [mode, setMode]       = useState('collapsed')
  const active = activeId
  const setActive = onSelectNav || (() => {})
  const [openAcc, setOpenAcc] = useState(null)
  const [flyout, setFlyout]   = useState(null)
  const [logoHover, setLogoHover] = useState(false)
  const closeT = useRef(null)
  const openT  = useRef(null)

  const exp = mode === 'expanded'
  const w = exp ? W_E : W_C

  const parentOf = (child) => NAV.find(n => n.children && n.children.includes(child))
  // expand sidebar + auto-open the active sub-item's parent accordion
  const expand = () => {
    setMode('expanded')
    const parent = activeChild && parentOf(activeChild)
    if (parent) setOpenAcc(parent.id)
  }
  // also auto-open when it loads already expanded with an active sub-item
  useEffect(() => {
    if (exp && activeChild) {
      const parent = parentOf(activeChild)
      if (parent) setOpenAcc(parent.id)
    }
  }, [exp, activeChild])

  const openFly = (item, el) => {
    if (exp || (!item.children && !item.workspaceSwitcher)) return
    clearTimeout(closeT.current); clearTimeout(openT.current)
    openT.current = setTimeout(() => {
      const r = el.getBoundingClientRect()
      setFlyout({ item, y: r.top })
    }, 70)
  }
  const closeFly = () => { clearTimeout(openT.current); closeT.current = setTimeout(() => setFlyout(null), 130) }
  const keepFly  = () => { clearTimeout(closeT.current); clearTimeout(openT.current) }

  return (
    <>
      <div
        onMouseEnter={() => setLogoHover(true)}
        onMouseLeave={() => setLogoHover(false)}
        onClick={() => { if (!exp) { expand(); setFlyout(null) } }}
        style={{
        width:w, minWidth:w, flexShrink:0, height:'100vh',
        background:'var(--green-sidebar)',
        display:'flex', flexDirection:'column',
        transition:'width .26s cubic-bezier(.4,0,.2,1), min-width .26s cubic-bezier(.4,0,.2,1)',
        overflow:'hidden', position:'relative', zIndex:200,
        cursor: exp ? 'default' : 'pointer',
      }}>
        {/* Logo / toggle */}
        <div
          onClick={() => { exp ? setMode('collapsed') : expand(); setFlyout(null) }}
          title={exp ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            display:'flex', alignItems:'center', height:64, flexShrink:0,
            padding: exp ? '0 16px' : '0',
            justifyContent: exp ? 'flex-start' : 'center',
            gap:8, cursor:'pointer',
          }}>
          {exp ? (
            <>
              <img src="/unify-logo-sand.png" alt="UnifyApps" style={{ height:32, objectFit:'contain', flex:1, objectPosition:'left' }} />
              <PanelIcon />
            </>
          ) : (
            /* collapsed: spiral symbol, swaps to panel-toggle icon on hover */
            <div style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {logoHover ? (
                <PanelIcon size={18} color="rgba(255,255,255,0.55)" />
              ) : (
                <img src="/unify-symbol-sand.png" alt="UnifyApps" style={{ width:36, height:36, objectFit:'contain' }} />
              )}
            </div>
          )}
        </div>

        {/* Main nav */}
        <div className="no-scrollbar" style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'4px 8px', cursor:'pointer' }}>
          {NAV.map(item => (
            <Row key={item.id} item={item} exp={exp}
              active={active===item.id}
              accOpen={openAcc===item.id}
              activeChild={activeChild}
              onClick={() => {
                setActive(item.id)
                if (!exp) { expand(); setFlyout(null); return }
                if (item.children) setOpenAcc(o => o===item.id?null:item.id)
              }}
              onNavigate={onNavigate}
              onEnter={el => openFly(item, el)} onLeave={closeFly} />
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ padding:'6px 8px 4px', cursor:'pointer' }}>
          {BOTTOM.map(item => (
            <Row key={item.id} item={item} exp={exp}
              active={active===item.id}
              onClick={() => { setActive(item.id); if (!exp) expand() }}
              onEnter={el => openFly(item, el)} onLeave={closeFly} />
          ))}
          {showFde && (
            <div onClick={e => { e.stopPropagation(); onToggleFde?.() }}
              title="AI FDE"
              style={{
                display:'flex', alignItems:'center', height:38, borderRadius:8, marginTop:4,
                padding: exp ? '0 8px' : '0', justifyContent: exp ? 'flex-start' : 'center', gap:10, cursor:'pointer',
                background: fdeActive ? 'rgba(125,216,150,0.16)' : 'transparent', transition:'background .15s',
              }}
              onMouseOver={e => { if (!fdeActive) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
              onMouseOut={e => { if (!fdeActive) e.currentTarget.style.background='transparent' }}>
              <div style={{ width:24, height:24, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FdeNavIcon />
              </div>
              {exp && <span style={{ flex:1, fontSize:13, color:'#F8F3EC', fontWeight: fdeActive ? 500 : 400, whiteSpace:'nowrap' }}>AI FDE</span>}
            </div>
          )}
        </div>

        {/* User */}
        <div style={{
          display:'flex', alignItems:'center', gap:9,
          height:54, flexShrink:0,
          padding: exp ? '0 16px' : '0',
          justifyContent: exp ? 'flex-start' : 'center',
          borderTop:'1px solid rgba(255,255,255,0.06)',
          cursor:'pointer',
        }}>
          <div style={{
            width:30, height:30, borderRadius:'50%', flexShrink:0,
            background:'#2b4a36', border:'1px solid rgba(255,255,255,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:600, color:'#e8f0ea',
          }}>A</div>
          {exp && (
            <div style={{ lineHeight:1.25 }}>
              <div style={{ fontSize:13, color:'#F8F3EC', fontWeight:500 }}>Tushar Yadav</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', fontFamily:'var(--mono)' }}>QA</div>
            </div>
          )}
        </div>
      </div>

      {flyout && !exp && createPortal(
        <Flyout item={flyout.item} top={flyout.y} left={W_C} onNavigate={onNavigate} onEnter={keepFly} onLeave={closeFly} />,
        document.body)}
    </>
  )
}

function FdeNavIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 29 29" fill="none" style={{ opacity: 0.9 }}>
      <defs>
        <linearGradient id="fdeWhiteGrad" x1="14" y1="1.4" x2="14" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <mask id="fdeCutout">
        <path d="M1.42578 12.7997C1.42578 8.81706 1.42578 6.82576 2.20085 5.30461C2.88261 3.96657 3.97047 2.87871 5.30852 2.19694C6.82967 1.42188 8.82096 1.42188 12.8036 1.42188H15.648C19.6306 1.42188 21.6219 1.42188 23.143 2.19694C24.4811 2.87871 25.569 3.96657 26.2507 5.30461C27.0258 6.82576 27.0258 8.81706 27.0258 12.7997V15.6441C27.0258 19.6267 27.0258 21.618 26.2507 23.1391C25.569 24.4772 24.4811 25.565 23.143 26.2468C21.6219 27.0219 19.6306 27.0219 15.648 27.0219H5.9769C4.38386 27.0219 3.58734 27.0219 2.97887 26.7118C2.44366 26.4391 2.00851 26.004 1.73581 25.4688C1.42578 24.8603 1.42578 24.0638 1.42578 22.4708V12.7997Z" fill="white" />
        <path d="M7.13645 13.746C7.07878 13.1286 7.12877 12.5627 7.2864 12.0482C7.44403 11.5338 7.73622 11.0707 8.16298 10.6592L13.73 13.5679L12.6612 7.30718C13.6877 6.74917 14.7181 6.74917 15.7446 7.30718L14.7181 13.5679L20.2428 10.6592C20.6696 11.0707 20.9695 11.5338 21.1425 12.0482C21.3155 12.5627 21.3693 13.1286 21.3155 13.746L15.0641 14.6721L19.5623 19.2588C19.1356 20.3471 18.2898 20.9645 17.0364 21.1109L14.2106 15.511L11.4271 21.1109C10.1699 20.9645 9.32791 20.3471 8.90115 19.2588L13.3571 14.6721L7.14798 13.746H7.13645Z" fill="black" />
      </mask>
      <path d="M1.42578 12.7997C1.42578 8.81706 1.42578 6.82576 2.20085 5.30461C2.88261 3.96657 3.97047 2.87871 5.30852 2.19694C6.82967 1.42188 8.82096 1.42188 12.8036 1.42188H15.648C19.6306 1.42188 21.6219 1.42188 23.143 2.19694C24.4811 2.87871 25.569 3.96657 26.2507 5.30461C27.0258 6.82576 27.0258 8.81706 27.0258 12.7997V15.6441C27.0258 19.6267 27.0258 21.618 26.2507 23.1391C25.569 24.4772 24.4811 25.565 23.143 26.2468C21.6219 27.0219 19.6306 27.0219 15.648 27.0219H5.9769C4.38386 27.0219 3.58734 27.0219 2.97887 26.7118C2.44366 26.4391 2.00851 26.004 1.73581 25.4688C1.42578 24.8603 1.42578 24.0638 1.42578 22.4708V12.7997Z" fill="url(#fdeWhiteGrad)" mask="url(#fdeCutout)" />
    </svg>
  )
}

function Row({ item, exp, active, accOpen, activeChild, onClick, onNavigate, onEnter, onLeave }) {
  const ref = useRef(null)
  const [hov, setHov] = useState(false)
  const bg = active ? 'rgba(125,216,150,0.13)' : hov ? 'rgba(255,255,255,0.05)' : 'transparent'
  return (
    <div>
      <div ref={ref}
        onClick={onClick}
        onMouseEnter={() => { setHov(true); onEnter?.(ref.current) }}
        onMouseLeave={() => { setHov(false); onLeave?.() }}
        style={{
          display:'flex', alignItems:'center',
          height: exp ? 38 : 40, borderRadius:8,
          padding: exp ? '0 10px' : '0',
          justifyContent: exp ? 'flex-start' : 'center',
          gap:10, cursor:'pointer', marginBottom:2,
          background: exp ? bg : 'transparent',
          transition:'background .15s',
        }}
      >
        {exp ? (
          <div style={{ width:20, height:20, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <NavIcon name={item.icon} active={active} />
          </div>
        ) : (
          <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: bg, transition:'background .15s' }}>
            <NavIcon name={item.icon} active={active} />
          </div>
        )}
        {exp && (
          <>
            <span style={{ flex:1, fontSize:13, whiteSpace:'nowrap',
              color: '#F8F3EC',
              fontWeight: active ? 500 : 400 }}>
              {item.label}
            </span>
            {(item.children || item.workspaceSwitcher) && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transition:'transform .2s', transform: accOpen?'rotate(90deg)':'none', flexShrink:0 }}>
                <path d="M4.5 3l3 3-3 3" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </>
        )}
      </div>

      {exp && item.children && (
        <div style={{ maxHeight: accOpen ? item.children.length*32+2 : 0, overflow:'hidden', transition:'max-height .22s cubic-bezier(.4,0,.2,1)' }}>
          {item.children.map(c => {
            const sel = c === activeChild
            return (
            <div key={c}
              onClick={e => { e.stopPropagation(); onNavigate?.(c) }}
              style={{
              height:30, display:'flex', alignItems:'center',
              paddingLeft:40, fontSize:12.5,
              color: sel ? '#F8F3EC' : 'rgba(248,243,236,0.9)',
              fontWeight: sel ? 500 : 400,
              background: sel ? 'rgba(125,216,150,0.13)' : 'transparent',
              cursor:'pointer', borderRadius:6, transition:'color .12s,background .12s',
            }}
              onMouseOver={e => { if(!sel) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
              onMouseOut={e => { if(!sel) e.currentTarget.style.background='transparent' }}
            >{c}</div>
          )})}
        </div>
      )}
    </div>
  )
}

function Flyout({ item, top, left, onNavigate, onEnter, onLeave }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setVis(true)); return () => cancelAnimationFrame(t) }, [])

  if (item.workspaceSwitcher) return (
    <WorkspaceFlyout top={top} left={left} vis={vis} onEnter={onEnter} onLeave={onLeave} />
  )

  const h = item.children.length*30 + 80
  const clamped = Math.min(top, window.innerHeight - h - 10)
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{
        position:'fixed', left: left + 6, top:clamped, zIndex:1000,
        background:'#0d2a14', borderRadius:16,
        boxShadow:'0 14px 40px rgba(0,0,0,0.5)', minWidth:230, padding:'20px 22px',
        opacity:vis?1:0, transform:vis?'translateX(0)':'translateX(-6px)',
        transition:'opacity .15s, transform .15s',
      }}>
      <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:18 }}>{item.label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {item.children.map(c => (
          <div key={c}
            onClick={e => { e.stopPropagation(); onNavigate?.(c) }}
            style={{ height:28, display:'flex', alignItems:'center', fontSize:14.5, color:'#F8F3EC', cursor:'pointer', transition:'color .12s' }}
            onMouseOver={e => e.currentTarget.style.color='#fff'}
            onMouseOut={e => e.currentTarget.style.color='#F8F3EC'}
          >{c}</div>
        ))}
      </div>
    </div>
  )
}

/* "Recent Workspaces" switcher — same dark-green hover style as other flyouts */
function WorkspaceFlyout({ top, left, vis, onEnter, onLeave }) {
  const h = WORKSPACES.length*48 + 130
  const clamped = Math.min(Math.max(top - 10, 10), window.innerHeight - h - 10)
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{
        position:'fixed', left: left + 6, top:clamped, zIndex:1000,
        background:'#0d2a14', borderRadius:16,
        boxShadow:'0 14px 40px rgba(0,0,0,0.5)', minWidth:280, padding:'16px', overflow:'hidden',
        opacity:vis?1:0, transform:vis?'translateX(0)':'translateX(-6px)',
        transition:'opacity .15s, transform .15s',
      }}>
      <div style={{ padding:'2px 4px 12px', fontFamily:'var(--mono)', fontSize:11, fontWeight:600, letterSpacing:1, color:'rgba(255,255,255,0.4)' }}>
        RECENT WORKSPACES
      </div>
      {WORKSPACES.map(w => (
        <div key={w.name} style={{
          display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer',
          background: w.selected ? 'rgba(255,255,255,0.07)' : 'transparent', transition:'background .12s',
        }}
          onMouseOver={e => { if(!w.selected) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
          onMouseOut={e => { if(!w.selected) e.currentTarget.style.background='transparent' }}>
          <div style={{ width:22, height:22, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {w.selected
              ? <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3.5 3.5 8.5V16a1 1 0 0 0 1 1h3v-4h5v4h3a1 1 0 0 0 1-1V8.5L10 3.5Z" stroke="#7dd896" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              : <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4"/><rect x="10" y="2.5" width="5.5" height="5.5" rx="1.4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4"/><rect x="2.5" y="10" width="5.5" height="5.5" rx="1.4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4"/><rect x="10" y="10" width="5.5" height="5.5" rx="1.4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4"/></svg>}
          </div>
          <span style={{ fontSize:14.5, color: w.selected?'#fff':'#d6e3d9', fontWeight: w.selected?600:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {w.emoji && <span style={{ marginRight:6 }}>{w.emoji}</span>}{w.name}
          </span>
        </div>
      ))}
      <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:8, paddingTop:8 }}>
        <button style={wfBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="#d6e3d9" strokeWidth="1.5" strokeLinecap="round"/></svg>
          New Workspace
        </button>
        <button style={wfBtn}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2 2 5l6 3 6-3-6-3ZM2 8l6 3 6-3M2 11l6 3 6-3" stroke="#d6e3d9" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          Browse All
        </button>
      </div>
    </div>
  )
}

const wfBtn = { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'9px 8px', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#d6e3d9', borderRadius:8 }

function PanelIcon({ size = 16, color = 'rgba(255,255,255,0.4)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M6 2.5v11" stroke={color} strokeWidth="1.3" />
    </svg>
  )
}

function NavIcon({ name, active }) {
  const c = '#F8F3EC'
  const p = { stroke:c, strokeWidth:1.4, strokeLinecap:'round', strokeLinejoin:'round', fill:'none' }
  const I = {
    /* workspace / box — brand icon */
    workspace: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M6.23666 6.08729e-06H11.7631C11.9472 -4.41453e-05 12.0883 -8.60197e-05 12.2117 0.0131503C13.3453 0.134822 14.2131 1.06582 14.2658 2.1936C15.2627 2.49129 15.973 3.41372 15.9859 4.47168C16.4891 4.62266 16.9231 4.86079 17.2783 5.24454C17.8242 5.83415 17.9934 6.56078 17.9998 7.40955C18.006 8.22558 17.8606 9.25677 17.68 10.5374L17.3125 13.1441C17.1713 14.1455 17.0566 14.9589 16.8782 15.5964C16.6915 16.2633 16.4164 16.812 15.907 17.2339C15.4015 17.6523 14.8019 17.8327 14.0931 17.9178C13.4079 18 12.5458 18 11.4724 18H6.5276C5.45423 18 4.59209 18 3.90681 17.9178C3.19808 17.8327 2.59846 17.6523 2.09304 17.2339C1.58359 16.812 1.30844 16.2633 1.12177 15.5964C0.943331 14.9589 0.828659 14.1455 0.687497 13.1441L0.319971 10.5374C0.139402 9.25677 -0.00600445 8.22558 0.000190889 7.40955C0.00662902 6.56078 0.175787 5.83415 0.721638 5.24454C1.07682 4.86089 1.5107 4.62277 2.01372 4.47178C2.02653 3.41372 2.73697 2.49119 3.73399 2.19354C3.78665 1.0658 4.6544 0.134822 5.78811 0.0131503C5.91148 -8.60197e-05 6.0526 -4.41453e-05 6.23666 6.08729e-06ZM3.29778 4.25122C4.07286 4.18604 5.02302 4.18604 6.16682 4.18605H11.8331C12.9767 4.18604 13.9268 4.18604 14.7018 4.25119C14.587 3.74247 14.1326 3.34884 13.5726 3.34884H4.42705C3.86703 3.34884 3.41261 3.74248 3.29778 4.25122ZM12.0776 1.2618C12.5383 1.31123 12.9023 1.6546 12.9915 2.09303H5.00826C5.09744 1.6546 5.46148 1.31123 5.92212 1.2618C5.96923 1.25674 6.03638 1.25582 6.27152 1.25582H11.7283C11.9634 1.25582 12.0305 1.25674 12.0776 1.2618ZM1.64316 6.09769C1.89675 5.82378 2.27809 5.64209 3.01907 5.54354C3.77351 5.44319 4.78345 5.44187 6.21408 5.44187H11.7859C13.2165 5.44187 14.2264 5.44319 14.9809 5.54354C15.7218 5.64209 16.1032 5.82378 16.3568 6.09769C16.6045 6.36524 16.7388 6.72934 16.744 7.4191C16.7494 8.13081 16.6188 9.06932 16.4292 10.4135L16.0751 12.9251C15.9263 13.9806 15.8221 14.7106 15.6689 15.2579C15.5213 15.7849 15.3477 16.0665 15.1061 16.2666C14.8604 16.47 14.5304 16.6005 13.9435 16.6709C13.3418 16.7432 12.5552 16.7442 11.4317 16.7442H6.5682C5.44476 16.7442 4.65817 16.7432 4.05643 16.6709C3.46953 16.6005 3.13965 16.47 2.89393 16.2666C2.65223 16.0665 2.47862 15.7849 2.3311 15.2579C2.17791 14.7106 2.07368 13.9806 1.92485 12.9251L1.57073 10.4135C1.38123 9.06932 1.25056 8.13081 1.25596 7.4191C1.2612 6.72934 1.39547 6.36524 1.64316 6.09769Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M6 14.5C6 14.2239 6.26863 14 6.6 14H11.4C11.7314 14 12 14.2239 12 14.5C12 14.7761 11.7314 15 11.4 15H6.6C6.26863 15 6 14.7761 6 14.5Z" fill={c}/></svg>,
    /* user / agent — brand icon */
    agents: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9.64316 10.803L7.1937 8.35227M11.2846 2.22538V1M14.501 3.50031L15.367 2.63384M14.501 9.98611L15.367 10.8526M8.01864 3.50031L7.15262 2.63384M15.7753 6.71843H17M4.03501 16.4141L11.5771 8.86805C11.9005 8.54454 12.0621 8.38278 12.1227 8.19625C12.176 8.03218 12.176 7.85544 12.1227 7.69137C12.0621 7.50484 11.9005 7.34309 11.5771 7.01957L10.9752 6.41729C10.6518 6.09378 10.4901 5.93202 10.3037 5.87142C10.1397 5.81811 9.96308 5.81811 9.7991 5.87142C9.61267 5.93202 9.451 6.09378 9.12765 6.41729L1.58555 13.9634C1.26221 14.2869 1.10054 14.4487 1.03996 14.6352C0.986679 14.7993 0.986679 14.976 1.03996 15.1401C1.10054 15.3266 1.26221 15.4883 1.58555 15.8119L2.18751 16.4141C2.51085 16.7377 2.67253 16.8994 2.85895 16.96C3.02294 17.0133 3.19958 17.0133 3.36357 16.96C3.55 16.8994 3.71167 16.7377 4.03501 16.4141Z" stroke={c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    /* app window — brand icon */
    apps: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5.83268 5.00033C5.83268 5.46057 5.45959 5.83366 4.99935 5.83366C4.53912 5.83366 4.16602 5.46057 4.16602 5.00033C4.16602 4.54009 4.53912 4.16699 4.99935 4.16699C5.45959 4.16699 5.83268 4.54009 5.83268 5.00033Z" fill={c}/><path d="M8.33268 5.00033C8.33268 5.46057 7.95959 5.83366 7.49935 5.83366C7.03912 5.83366 6.66602 5.46057 6.66602 5.00033C6.66602 4.54009 7.03912 4.16699 7.49935 4.16699C7.95959 4.16699 8.33268 4.54009 8.33268 5.00033Z" fill={c}/><path d="M9.99935 5.83366C10.4596 5.83366 10.8327 5.46057 10.8327 5.00033C10.8327 4.54009 10.4596 4.16699 9.99935 4.16699C9.5391 4.16699 9.16602 4.54009 9.16602 5.00033C9.16602 5.46057 9.5391 5.83366 9.99935 5.83366Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M9.95152 1.04199C8.02787 1.04198 6.52034 1.04198 5.34411 1.20012C4.14016 1.36198 3.19014 1.69977 2.44447 2.44544C1.69879 3.19112 1.36101 4.14113 1.19914 5.34508C1.10548 6.0417 1.06729 6.85453 1.05172 7.80118C1.04469 7.83871 1.04102 7.87742 1.04102 7.91699C1.04102 7.95024 1.04362 7.98288 1.04862 8.01473C1.04101 8.60833 1.04102 9.25291 1.04102 9.95249V10.0482C1.04101 11.9718 1.041 13.4793 1.19914 14.6556C1.36101 15.8595 1.69879 16.8096 2.44447 17.5552C3.19014 18.3009 4.14016 18.6387 5.34411 18.8006C6.52034 18.9587 8.02787 18.9587 9.95152 18.9587H10.0472C11.9708 18.9587 13.4783 18.9587 14.6546 18.8006C15.8585 18.6387 16.8086 18.3009 17.5543 17.5552C18.2999 16.8096 18.6377 15.8595 18.7996 14.6556C18.9577 13.4793 18.9577 11.9718 18.9577 10.0482V9.95249C18.9577 9.25291 18.9577 8.60833 18.9501 8.01473C18.9551 7.98288 18.9577 7.95024 18.9577 7.91699C18.9577 7.87742 18.954 7.83871 18.9469 7.80118C18.9314 6.85453 18.8932 6.0417 18.7996 5.34508C18.6377 4.14113 18.2999 3.19112 17.5543 2.44544C16.8086 1.69977 15.8585 1.36198 14.6546 1.20012C13.4783 1.04198 11.9708 1.04198 10.0472 1.04199H9.95152ZM2.29102 10.0003C2.29102 9.47658 2.29111 8.99183 2.29393 8.54199H6.87435V17.5003C6.87435 17.5602 6.88276 17.618 6.89845 17.6727C6.37926 17.6512 5.9206 17.6168 5.51067 17.5617C4.44532 17.4185 3.80306 17.1461 3.32835 16.6713C2.85363 16.1966 2.58122 15.5543 2.43799 14.489C2.29234 13.4057 2.29102 11.9822 2.29102 10.0003ZM8.09117 17.7017C8.66343 17.7085 9.29627 17.7087 9.99935 17.7087C11.9812 17.7087 13.4047 17.7073 14.488 17.5617C15.5533 17.4185 16.1956 17.1461 16.6703 16.6713C17.1451 16.1966 17.4175 15.5543 17.5607 14.489C17.7064 13.4057 17.7077 11.9822 17.7077 10.0003C17.7077 9.47658 17.7076 8.99183 17.7048 8.54199H8.12435V17.5003C8.12435 17.5708 8.11268 17.6386 8.09117 17.7017ZM2.43799 5.51164C2.36937 6.02198 2.33279 6.60783 2.31328 7.29199H17.6854C17.6659 6.60783 17.6294 6.02198 17.5607 5.51164C17.4175 4.4463 17.1451 3.80403 16.6703 3.32933C16.1956 2.85461 15.5533 2.5822 14.488 2.43897C13.4047 2.29332 11.9812 2.29199 9.99935 2.29199C8.0175 2.29199 6.59398 2.29332 5.51067 2.43897C4.44532 2.5822 3.80306 2.85461 3.32835 3.32933C2.85363 3.80403 2.58122 4.4463 2.43799 5.51164Z" fill={c}/></svg>,
    /* workflow / branch — brand icon */
    workflows: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10.002 8.49707V8.99512C10.002 10.0997 9.10652 10.9951 8.00195 10.9951H5.00195" stroke={c} strokeWidth="1.25" strokeLinecap="round"/><path d="M10.002 8.49707V8.99512C10.002 10.0997 10.8974 10.9951 12.002 10.9951H15.002" stroke={c} strokeWidth="1.25" strokeLinecap="round"/><rect x="6.62695" y="1.625" width="6.75" height="4.75" rx="1.375" stroke={c} strokeWidth="1.25"/><rect x="11.627" y="13.625" width="6.75" height="4.75" rx="1.375" stroke={c} strokeWidth="1.25"/><rect x="1.62695" y="13.625" width="6.75" height="4.75" rx="1.375" stroke={c} strokeWidth="1.25"/></svg>,
    /* share / 3 nodes — brand icon */
    ontology: <svg width="18" height="18" viewBox="0 0 19 19" fill="none"><circle cx="4.5" cy="4.5" r="2.875" stroke={c} strokeWidth="1.25"/><circle cx="4.5" cy="15.5" r="2.875" stroke={c} strokeWidth="1.25"/><circle cx="15.5" cy="15.5" r="2.875" stroke={c} strokeWidth="1.25"/><circle cx="15.5" cy="4.5" r="2.875" stroke={c} strokeWidth="1.25"/><path d="M4.5 9.5V10.5" stroke={c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.5 9.5V10.5" stroke={c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 4.5H10.5" stroke={c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 15.5H10.5" stroke={c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    /* database — brand icon */
    platform: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2.70703 5.00033C2.70703 3.71558 3.73227 2.72072 5.00515 2.08428C6.3154 1.42916 8.08176 1.04199 9.9987 1.04199C11.9156 1.04199 13.682 1.42916 14.9923 2.08428C16.2651 2.72072 17.2904 3.71558 17.2904 5.00033V15.0003C17.2904 16.2851 16.2651 17.2799 14.9923 17.9163C13.682 18.5715 11.9156 18.9587 9.9987 18.9587C8.08176 18.9587 6.3154 18.5715 5.00515 17.9163C3.73227 17.2799 2.70703 16.2851 2.70703 15.0003V5.00033ZM3.95703 5.00033C3.95703 4.44412 4.42417 3.77232 5.56416 3.20232C6.66676 2.65102 8.23374 2.29199 9.9987 2.29199C11.7637 2.29199 13.3306 2.65102 14.4332 3.20232C15.5732 3.77232 16.0404 4.44412 16.0404 5.00033C16.0404 5.55653 15.5732 6.22833 14.4332 6.79833C13.3306 7.34963 11.7637 7.70866 9.9987 7.70866C8.23374 7.70866 6.66676 7.34963 5.56416 6.79833C4.42417 6.22833 3.95703 5.55653 3.95703 5.00033ZM3.95703 15.0003C3.95703 15.5565 4.42417 16.2283 5.56416 16.7983C6.66676 17.3497 8.23374 17.7087 9.9987 17.7087C11.7637 17.7087 13.3306 17.3497 14.4332 16.7983C15.5732 16.2283 16.0404 15.5565 16.0404 15.0003V12.2563C15.7264 12.5067 15.3703 12.7273 14.9923 12.9163C13.682 13.5715 11.9156 13.9587 9.9987 13.9587C8.08176 13.9587 6.3154 13.5715 5.00515 12.9163C4.62715 12.7273 4.27099 12.5067 3.95703 12.2563V15.0003ZM16.0404 7.25634V10.0003C16.0404 10.5565 15.5732 11.2283 14.4332 11.7983C13.3306 12.3497 11.7637 12.7087 9.9987 12.7087C8.23374 12.7087 6.66676 12.3497 5.56416 11.7983C4.42417 11.2283 3.95703 10.5565 3.95703 10.0003V7.25634C4.27099 7.50676 4.62715 7.72737 5.00515 7.91637C6.3154 8.57149 8.08176 8.95866 9.9987 8.95866C11.9156 8.95866 13.682 8.57149 14.9923 7.91637C15.3703 7.72737 15.7264 7.50676 16.0404 7.25634Z" fill={c}/></svg>,
    /* 2x2 grid — brand icon */
    resources: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M5.37203 1.45801C4.62332 1.45798 3.99895 1.45797 3.5033 1.5246C2.98014 1.59494 2.50781 1.74967 2.12825 2.12923C1.74869 2.50878 1.59397 2.98112 1.52362 3.50428C1.45699 3.99993 1.45701 4.62427 1.45703 5.37299V5.45968C1.45701 6.2084 1.45699 6.83277 1.52362 7.32841C1.59397 7.85158 1.74869 8.32391 2.12825 8.70342C2.50781 9.08301 2.98014 9.23776 3.5033 9.30809C3.99895 9.37476 4.62329 9.37468 5.37202 9.37468H5.4587C6.20742 9.37468 6.83179 9.37476 7.32743 9.30809C7.8506 9.23776 8.32293 9.08301 8.70245 8.70342C9.08203 8.32391 9.23678 7.85158 9.30712 7.32841C9.37378 6.83277 9.3737 6.20843 9.3737 5.4597V5.37302C9.3737 4.62429 9.37378 3.99993 9.30712 3.50428C9.23678 2.98112 9.08203 2.50878 8.70245 2.12923C8.32293 1.74967 7.8506 1.59494 7.32743 1.5246C6.83179 1.45797 6.20745 1.45798 5.45872 1.45801H5.37203ZM3.01213 3.01311C3.12073 2.90451 3.28531 2.81516 3.66987 2.76346C4.07239 2.70934 4.61202 2.70801 5.41537 2.70801C6.21871 2.70801 6.75834 2.70934 7.16087 2.76346C7.54542 2.81516 7.71001 2.90451 7.81861 3.01311C7.9272 3.12171 8.01656 3.28628 8.06826 3.67084C8.12237 4.07337 8.1237 4.613 8.1237 5.41634C8.1237 6.21968 8.12237 6.75932 8.06826 7.16185C8.01656 7.5464 7.9272 7.71098 7.81861 7.81958C7.71001 7.92818 7.54542 8.01753 7.16087 8.06923C6.75834 8.12335 6.21871 8.12468 5.41537 8.12468C4.61202 8.12468 4.07239 8.12335 3.66987 8.06923C3.28531 8.01753 3.12073 7.92818 3.01213 7.81958C2.90353 7.71098 2.81418 7.5464 2.76248 7.16185C2.70837 6.75932 2.70703 6.21968 2.70703 5.41634C2.70703 4.613 2.70837 4.07337 2.76248 3.67084C2.81418 3.28628 2.90353 3.12171 3.01213 3.01311Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M14.54 10.625C13.7912 10.625 13.1669 10.6249 12.6712 10.6916C12.1481 10.7619 11.6758 10.9167 11.2962 11.2962C10.9167 11.6758 10.7619 12.1481 10.6916 12.6712C10.6249 13.1669 10.625 13.7912 10.625 14.54V14.6267C10.625 15.3754 10.6249 15.9998 10.6916 16.4954C10.7619 17.0186 10.9167 17.4909 11.2962 17.8704C11.6758 18.25 12.1481 18.4047 12.6712 18.4751C13.1669 18.5417 13.7913 18.5417 14.5399 18.5417H14.6267C15.3753 18.5417 15.9998 18.5417 16.4954 18.4751C17.0186 18.4047 17.4909 18.25 17.8704 17.8704C18.25 17.4909 18.4047 17.0186 18.4751 16.4954C18.5417 15.9998 18.5417 15.3754 18.5417 14.6267V14.54C18.5417 13.7913 18.5417 13.1669 18.4751 12.6712C18.4047 12.1481 18.25 11.6758 17.8704 11.2962C17.4909 10.9167 17.0186 10.7619 16.4954 10.6916C15.9998 10.6249 15.3754 10.625 14.6267 10.625H14.54ZM12.1801 12.1801C12.2887 12.0715 12.4533 11.9822 12.8378 11.9304C13.2403 11.8763 13.78 11.875 14.5833 11.875C15.3867 11.875 15.9263 11.8763 16.3288 11.9304C16.7134 11.9822 16.878 12.0715 16.9866 12.1801C17.0952 12.2887 17.1845 12.4533 17.2362 12.8378C17.2903 13.2403 17.2917 13.78 17.2917 14.5833C17.2917 15.3867 17.2903 15.9263 17.2362 16.3288C17.1845 16.7134 17.0952 16.878 16.9866 16.9866C16.878 17.0952 16.7134 17.1845 16.3288 17.2362C15.9263 17.2903 15.3867 17.2917 14.5833 17.2917C13.78 17.2917 13.2403 17.2903 12.8378 17.2362C12.4533 17.1845 12.2887 17.0952 12.1801 16.9866C12.0715 16.878 11.9822 16.7134 11.9304 16.3288C11.8763 15.9263 11.875 15.3867 11.875 14.5833C11.875 13.78 11.8763 13.2403 11.9304 12.8378C11.9822 12.4533 12.0715 12.2887 12.1801 12.1801Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M5.37203 10.625H5.4587C6.20743 10.625 6.83178 10.6249 7.32743 10.6916C7.8506 10.7619 8.32293 10.9167 8.70245 11.2962C9.08203 11.6758 9.23678 12.1481 9.30712 12.6712C9.37378 13.1669 9.3737 13.7912 9.3737 14.54V14.6267C9.3737 15.3754 9.37378 15.9998 9.30712 16.4954C9.23678 17.0186 9.08203 17.4909 8.70245 17.8704C8.32293 18.25 7.8506 18.4047 7.32743 18.4751C6.83179 18.5417 6.20746 18.5417 5.45875 18.5417H5.37204C4.62332 18.5417 3.99894 18.5417 3.5033 18.4751C2.98014 18.4047 2.50781 18.25 2.12825 17.8704C1.74869 17.4909 1.59397 17.0186 1.52362 16.4954C1.45699 15.9998 1.45701 15.3754 1.45703 14.6267V14.54C1.45701 13.7912 1.45699 13.1669 1.52362 12.6712C1.59397 12.1481 1.74869 11.6758 2.12825 11.2962C2.50781 10.9167 2.98014 10.7619 3.5033 10.6916C3.99895 10.6249 4.6233 10.625 5.37203 10.625ZM3.66987 11.9304C3.28531 11.9822 3.12073 12.0715 3.01213 12.1801C2.90353 12.2887 2.81418 12.4533 2.76248 12.8378C2.70837 13.2403 2.70703 13.78 2.70703 14.5833C2.70703 15.3867 2.70837 15.9263 2.76248 16.3288C2.81418 16.7134 2.90353 16.878 3.01213 16.9866C3.12073 17.0952 3.28531 17.1845 3.66987 17.2362C4.07239 17.2903 4.61202 17.2917 5.41537 17.2917C6.21871 17.2917 6.75834 17.2903 7.16087 17.2362C7.54542 17.1845 7.71001 17.0952 7.81861 16.9866C7.9272 16.878 8.01656 16.7134 8.06826 16.3288C8.12237 15.9263 8.1237 15.3867 8.1237 14.5833C8.1237 13.78 8.12237 13.2403 8.06826 12.8378C8.01656 12.4533 7.9272 12.2887 7.81861 12.1801C7.71001 12.0715 7.54542 11.9822 7.16087 11.9304C6.75834 11.8763 6.21871 11.875 5.41537 11.875C4.61202 11.875 4.07239 11.8763 3.66987 11.9304Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M14.54 1.45801C13.7912 1.45798 13.1669 1.45797 12.6712 1.5246C12.1481 1.59494 11.6758 1.74967 11.2962 2.12923C10.9167 2.50878 10.7619 2.98112 10.6916 3.50428C10.6249 3.99993 10.625 4.62428 10.625 5.37301V5.45968C10.625 6.20841 10.6249 6.83276 10.6916 7.32841C10.7619 7.85158 10.9167 8.32391 11.2962 8.70342C11.6758 9.08301 12.1481 9.23776 12.6712 9.30809C13.1669 9.37476 13.7912 9.37468 14.54 9.37468H14.6267C15.3754 9.37468 15.9998 9.37476 16.4954 9.30809C17.0186 9.23776 17.4909 9.08301 17.8704 8.70342C18.25 8.32391 18.4047 7.85158 18.4751 7.32841C18.5417 6.83277 18.5417 6.20843 18.5417 5.4597V5.37302C18.5417 4.62429 18.5417 3.99993 18.4751 3.50428C18.4047 2.98112 18.25 2.50878 17.8704 2.12923C17.4909 1.74967 17.0186 1.59494 16.4954 1.5246C15.9998 1.45797 15.3754 1.45798 14.6267 1.45801H14.54ZM12.1801 3.01311C12.2887 2.90451 12.4533 2.81516 12.8378 2.76346C13.2403 2.70934 13.78 2.70801 14.5833 2.70801C15.3867 2.70801 15.9263 2.70934 16.3288 2.76346C16.7134 2.81516 16.878 2.90451 16.9866 3.01311C17.0952 3.12171 17.1845 3.28628 17.2362 3.67084C17.2903 4.07337 17.2917 4.613 17.2917 5.41634C17.2917 6.21968 17.2903 6.75932 17.2362 7.16185C17.1845 7.5464 17.0952 7.71098 16.9866 7.81958C16.878 7.92818 16.7134 8.01753 16.3288 8.06923C15.9263 8.12335 15.3867 8.12468 14.5833 8.12468C13.78 8.12468 13.2403 8.12335 12.8378 8.06923C12.4533 8.01753 12.2887 7.92818 12.1801 7.81958C12.0715 7.71098 11.9822 7.5464 11.9304 7.16185C11.8763 6.75932 11.875 6.21968 11.875 5.41634C11.875 4.613 11.8763 4.07337 11.9304 3.67084C11.9822 3.28628 12.0715 3.12171 12.1801 3.01311Z" fill={c}/></svg>,
    /* grid + plus — brand icon */
    system: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M5.37399 1.45801C4.62527 1.45798 4.0009 1.45797 3.50525 1.5246C2.98209 1.59494 2.50976 1.74967 2.1302 2.12923C1.75064 2.50878 1.59592 2.98112 1.52558 3.50428C1.45894 3.99993 1.45896 4.62427 1.45899 5.37299V5.45968C1.45896 6.2084 1.45894 6.83277 1.52558 7.32841C1.59592 7.85158 1.75064 8.32391 2.1302 8.70342C2.50976 9.08301 2.98209 9.23776 3.50525 9.30809C4.0009 9.37476 4.62524 9.37468 5.37397 9.37468H5.46065C6.20938 9.37468 6.83374 9.37476 7.32939 9.30809C7.85255 9.23776 8.32488 9.08301 8.7044 8.70342C9.08398 8.32391 9.23874 7.85158 9.30907 7.32841C9.37574 6.83277 9.37565 6.20843 9.37565 5.4597V5.37302C9.37565 4.62429 9.37574 3.99993 9.30907 3.50428C9.23874 2.98112 9.08398 2.50878 8.7044 2.12923C8.32488 1.74967 7.85255 1.59494 7.32939 1.5246C6.83374 1.45797 6.2094 1.45798 5.46068 1.45801H5.37399ZM3.01409 3.01311C3.12269 2.90451 3.28726 2.81516 3.67182 2.76346C4.07434 2.70934 4.61398 2.70801 5.41732 2.70801C6.22066 2.70801 6.76029 2.70934 7.16283 2.76346C7.54738 2.81516 7.71196 2.90451 7.82056 3.01311C7.92915 3.12171 8.01851 3.28628 8.07021 3.67084C8.12433 4.07337 8.12565 4.613 8.12565 5.41634C8.12565 6.21968 8.12433 6.75932 8.07021 7.16185C8.01851 7.5464 7.92915 7.71098 7.82056 7.81958C7.71196 7.92818 7.54738 8.01753 7.16283 8.06923C6.76029 8.12335 6.22066 8.12468 5.41732 8.12468C4.61398 8.12468 4.07434 8.12335 3.67182 8.06923C3.28726 8.01753 3.12269 7.92818 3.01409 7.81958C2.90549 7.71098 2.81614 7.5464 2.76444 7.16185C2.71032 6.75932 2.70899 6.21968 2.70899 5.41634C2.70899 4.613 2.71032 4.07337 2.76444 3.67084C2.81614 3.28628 2.90549 3.12171 3.01409 3.01311Z" fill={c}/><path d="M15.209 2.91699C15.209 2.57182 14.9292 2.29199 14.584 2.29199C14.2388 2.29199 13.959 2.57182 13.959 2.91699V4.79199H12.084C11.7388 4.79199 11.459 5.07182 11.459 5.41699C11.459 5.76218 11.7388 6.04199 12.084 6.04199H13.959V7.91699C13.959 8.26218 14.2388 8.54199 14.584 8.54199C14.9292 8.54199 15.209 8.26218 15.209 7.91699V6.04199H17.084C17.4292 6.04199 17.709 5.76218 17.709 5.41699C17.709 5.07182 17.4292 4.79199 17.084 4.79199H15.209V2.91699Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M14.54 10.625H14.6267C15.3754 10.625 15.9998 10.6249 16.4954 10.6916C17.0186 10.7619 17.4909 10.9167 17.8704 11.2963C18.25 11.6758 18.4047 12.1481 18.4751 12.6712C18.5417 13.1669 18.5417 13.7913 18.5417 14.5399V14.6267C18.5417 15.3754 18.5417 15.9998 18.4751 16.4954C18.4047 17.0186 18.25 17.4909 17.8704 17.8704C17.4909 18.25 17.0186 18.4047 16.4954 18.4751C15.9998 18.5417 15.3754 18.5417 14.6267 18.5417H14.54C13.7913 18.5417 13.1669 18.5417 12.6712 18.4751C12.1481 18.4047 11.6758 18.25 11.2963 17.8704C10.9167 17.4909 10.7619 17.0186 10.6916 16.4954C10.6249 15.9998 10.625 15.3754 10.625 14.6267V14.54C10.625 13.7912 10.6249 13.1669 10.6916 12.6712C10.7619 12.1481 10.9167 11.6758 11.2963 11.2963C11.6758 10.9167 12.1481 10.7619 12.6712 10.6916C13.1669 10.6249 13.7912 10.625 14.54 10.625ZM12.8378 11.9304C12.4533 11.9822 12.2887 12.0715 12.1801 12.1801C12.0715 12.2887 11.9822 12.4533 11.9304 12.8378C11.8763 13.2403 11.875 13.78 11.875 14.5833C11.875 15.3867 11.8763 15.9263 11.9304 16.3288C11.9822 16.7134 12.0715 16.878 12.1801 16.9866C12.2887 17.0952 12.4533 17.1845 12.8378 17.2363C13.2403 17.2903 13.78 17.2917 14.5833 17.2917C15.3867 17.2917 15.9263 17.2903 16.3288 17.2363C16.7134 17.1845 16.878 17.0952 16.9866 16.9866C17.0952 16.878 17.1845 16.7134 17.2363 16.3288C17.2903 15.9263 17.2917 15.3867 17.2917 14.5833C17.2917 13.78 17.2903 13.2403 17.2363 12.8378C17.1845 12.4533 17.0952 12.2887 16.9866 12.1801C16.878 12.0715 16.7134 11.9822 16.3288 11.9304C15.9263 11.8763 15.3867 11.875 14.5833 11.875C13.78 11.875 13.2403 11.8763 12.8378 11.9304Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M5.37399 10.625C4.62525 10.625 4.0009 10.6249 3.50525 10.6916C2.98209 10.7619 2.50976 10.9167 2.1302 11.2963C1.75064 11.6758 1.59592 12.1481 1.52558 12.6712C1.45894 13.1669 1.45896 13.7912 1.45899 14.54V14.6267C1.45896 15.3754 1.45894 15.9998 1.52558 16.4954C1.59592 17.0186 1.75064 17.4909 2.1302 17.8704C2.50976 18.25 2.98209 18.4047 3.50525 18.4751C4.0009 18.5417 4.62524 18.5417 5.37397 18.5417H5.46065C6.20938 18.5417 6.83374 18.5417 7.32939 18.4751C7.85255 18.4047 8.32488 18.25 8.7044 17.8704C9.08398 17.4909 9.23874 17.0186 9.30907 16.4954C9.37574 15.9998 9.37565 15.3754 9.37565 14.6267V14.54C9.37565 13.7912 9.37574 13.1669 9.30907 12.6712C9.23874 12.1481 9.08398 11.6758 8.7044 11.2963C8.32488 10.9167 7.85255 10.7619 7.32939 10.6916C6.83374 10.6249 6.20938 10.625 5.46065 10.625H5.37399ZM3.01409 12.1801C3.12269 12.0715 3.28726 11.9822 3.67182 11.9304C4.07434 11.8763 4.61398 11.875 5.41732 11.875C6.22066 11.875 6.76029 11.8763 7.16283 11.9304C7.54738 11.9822 7.71196 12.0715 7.82056 12.1801C7.92915 12.2887 8.01851 12.4533 8.07021 12.8378C8.12433 13.2403 8.12565 13.78 8.12565 14.5833C8.12565 15.3867 8.12433 15.9263 8.07021 16.3288C8.01851 16.7134 7.92915 16.878 7.82056 16.9866C7.71196 17.0952 7.54738 17.1845 7.16283 17.2363C6.76029 17.2903 6.22066 17.2917 5.41732 17.2917C4.61398 17.2917 4.07434 17.2903 3.67182 17.2363C3.28726 17.1845 3.12269 17.0952 3.01409 16.9866C2.90549 16.878 2.81614 16.7134 2.76444 16.3288C2.71032 15.9263 2.70899 15.3867 2.70899 14.5833C2.70899 13.78 2.71032 13.2403 2.76444 12.8378C2.81614 12.4533 2.90549 12.2887 3.01409 12.1801Z" fill={c}/></svg>,
    /* shield + sparkle — brand icon */
    governance: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M10 2.29199C9.45192 2.29199 8.91258 2.46836 7.56718 2.92891L7.08983 3.0923C5.82934 3.52378 4.91008 3.8387 4.26466 4.1009C3.9425 4.23178 3.70908 4.34145 3.54524 4.4366C3.46435 4.48358 3.40862 4.52234 3.37139 4.5526C3.33983 4.57825 3.3278 4.59278 3.32608 4.5949C3.32447 4.59752 3.31411 4.61483 3.29952 4.65578C3.28287 4.70253 3.26441 4.76957 3.24642 4.86288C3.21003 5.05173 3.18245 5.31117 3.1634 5.66109C3.12523 6.36208 3.125 7.3406 3.125 8.68091V9.99316C3.125 14.3057 6.34992 16.4282 8.499 17.367C8.80858 17.5022 8.98733 17.5787 9.18633 17.6297C9.37642 17.6783 9.60833 17.7087 10 17.7087C10.3917 17.7087 10.6236 17.6783 10.8137 17.6297C11.0127 17.5787 11.1914 17.5022 11.501 17.367C13.6501 16.4282 16.875 14.3057 16.875 9.99316V8.68091C16.875 7.3406 16.8747 6.36208 16.8366 5.66109C16.8176 5.31117 16.79 5.05173 16.7536 4.86288C16.7356 4.76957 16.7172 4.70253 16.7005 4.65578C16.6859 4.6148 16.6755 4.59749 16.6739 4.59489C16.6722 4.59276 16.6602 4.57823 16.6286 4.5526C16.5914 4.52234 16.5357 4.48358 16.4548 4.4366C16.2909 4.34145 16.0575 4.23178 15.7353 4.1009C15.0899 3.8387 14.1707 3.52378 12.9102 3.0923L12.4328 2.92891C11.0874 2.46836 10.5481 2.29199 10 2.29199ZM7.26949 1.70959C8.47275 1.29748 9.21875 1.04199 10 1.04199C10.7812 1.04199 11.5272 1.29748 12.7305 1.70959C12.7658 1.72168 12.8015 1.73391 12.8377 1.74628L13.3367 1.9171C14.5712 2.33966 15.5238 2.66576 16.2058 2.94282C16.5493 3.08238 16.8447 3.21755 17.0825 3.35567C17.3114 3.48858 17.541 3.65436 17.697 3.87661C17.8512 4.09629 17.9309 4.36636 17.981 4.62634C18.0331 4.89663 18.0645 5.22086 18.0847 5.59313C18.125 6.33233 18.125 7.345 18.125 8.65849V9.99316C18.125 15.0773 14.285 17.5149 12.0014 18.5125L11.9788 18.5223C11.6957 18.6461 11.4295 18.7623 11.1237 18.8407C10.8007 18.9233 10.4577 18.9587 10 18.9587C9.54225 18.9587 9.19925 18.9233 8.87633 18.8407C8.5705 18.7623 8.30436 18.6461 8.02119 18.5223L7.99861 18.5125C5.71502 17.5149 1.875 15.0773 1.875 9.99316V8.65858C1.875 7.34503 1.875 6.33233 1.91525 5.59313C1.93552 5.22086 1.96693 4.89663 2.01901 4.62634C2.06911 4.36636 2.14883 4.09629 2.30302 3.87661C2.45902 3.65436 2.68862 3.48858 2.91748 3.35567C3.15531 3.21755 3.45065 3.08238 3.79419 2.94282C4.47617 2.66576 5.42886 2.33966 6.6633 1.9171L7.16236 1.74628C7.19847 1.73391 7.23417 1.72168 7.26949 1.70959ZM10 6.58407C9.90092 6.73115 9.77875 6.94797 9.597 7.2741L9.48775 7.47005C9.47958 7.4846 9.47125 7.4998 9.46258 7.51554C9.37208 7.67996 9.24917 7.90332 9.04625 8.0574C8.8395 8.21433 8.59017 8.26921 8.412 8.30844C8.39508 8.31217 8.37875 8.31575 8.36325 8.31927L8.15111 8.36724C7.76346 8.45499 7.52187 8.51108 7.35955 8.56783C7.45992 8.71866 7.6284 8.91783 7.9017 9.23741L8.04631 9.40649C8.05694 9.41899 8.06803 9.43183 8.07947 9.44508C8.2026 9.58758 8.36642 9.77716 8.44208 10.0207C8.517 10.2616 8.49167 10.5108 8.47225 10.7013C8.47042 10.7192 8.46867 10.7364 8.46708 10.7532L8.44525 10.9787C8.40617 11.3817 8.38208 11.6425 8.38275 11.8269C8.543 11.7702 8.76233 11.6705 9.09717 11.5163L9.29575 11.4249C9.31042 11.4182 9.32567 11.411 9.34167 11.4036C9.5065 11.3264 9.74042 11.2169 10 11.2169C10.2596 11.2169 10.4935 11.3264 10.6583 11.4036C10.6743 11.411 10.6896 11.4182 10.7043 11.4249L10.9028 11.5163C11.2377 11.6705 11.457 11.7702 11.6172 11.8269C11.6179 11.6425 11.5938 11.3817 11.5547 10.9787L11.5329 10.7532C11.5313 10.7364 11.5296 10.7192 11.5277 10.7013C11.5083 10.5108 11.483 10.2616 11.5579 10.0207C11.6336 9.77716 11.7974 9.58758 11.9205 9.44508C11.932 9.43183 11.9431 9.41899 11.9537 9.40649L12.0983 9.23741C12.3716 8.91783 12.5401 8.71866 12.6404 8.56783C12.4781 8.51108 12.2365 8.45499 11.8489 8.36724L11.6367 8.31927C11.6212 8.31575 11.6049 8.31217 11.588 8.30844C11.4098 8.26921 11.1605 8.21433 10.9537 8.0574C10.7508 7.90332 10.6279 7.67997 10.5374 7.51555C10.5288 7.4998 10.5204 7.4846 10.5122 7.47005L10.403 7.2741C10.2212 6.94797 10.0991 6.73115 10 6.58407ZM9.06925 5.73769C9.249 5.503 9.5425 5.20866 10 5.20866C10.4575 5.20866 10.751 5.503 10.9307 5.73769C11.1038 5.96368 11.2809 6.28158 11.4736 6.62732C11.4807 6.63999 11.4878 6.65272 11.4948 6.66547L11.6041 6.86143C11.6347 6.91643 11.6585 6.95897 11.6796 6.99542C11.6937 7.01993 11.7048 7.03843 11.7137 7.05271C11.7277 7.05658 11.7455 7.06118 11.7682 7.06672C11.8074 7.07625 11.8529 7.08658 11.9127 7.10008L12.1247 7.14808C12.1392 7.15135 12.1537 7.15461 12.168 7.15787C12.5404 7.24207 12.8881 7.32065 13.1506 7.42409C13.4349 7.53618 13.7786 7.73818 13.911 8.16398C14.0413 8.58299 13.8809 8.94466 13.7188 9.20208C13.5666 9.44391 13.3316 9.71866 13.0763 10.0171C13.067 10.028 13.0577 10.0389 13.0483 10.0498L12.9037 10.2189C12.8631 10.2664 12.8317 10.3031 12.8052 10.3352C12.7834 10.3615 12.7683 10.3805 12.7575 10.3948C12.7589 10.4412 12.7649 10.5066 12.7771 10.6326L12.8031 10.9006C12.8418 11.3 12.8772 11.6645 12.8644 11.9516C12.8511 12.2498 12.7807 12.6491 12.4262 12.9182C12.0614 13.1951 11.6539 13.1411 11.3648 13.0582C11.0943 12.9807 10.7692 12.8311 10.4207 12.6705C10.4072 12.6642 10.3937 12.658 10.3801 12.6517L10.1814 12.5603C10.1256 12.5346 10.0828 12.5149 10.0457 12.4986C10.0274 12.4905 10.0124 12.4841 10 12.479C9.98758 12.4841 9.97258 12.4905 9.95433 12.4986C9.91717 12.5149 9.87442 12.5346 9.81858 12.5603L9.61992 12.6517C9.60633 12.658 9.59283 12.6642 9.57925 12.6705C9.23075 12.8311 8.90567 12.9807 8.63517 13.0582C8.34608 13.1411 7.93857 13.1951 7.57382 12.9182C7.21926 12.6491 7.14888 12.2498 7.1356 11.9516C7.12281 11.6645 7.15818 11.3 7.19692 10.9007C7.1983 10.8865 7.19967 10.8724 7.20104 10.8582L7.22291 10.6326C7.23512 10.5066 7.24107 10.4412 7.24248 10.3948C7.23169 10.3805 7.21662 10.3615 7.19482 10.3352C7.16822 10.3031 7.13692 10.2664 7.09631 10.2189L6.9517 10.0498C6.94234 10.0389 6.933 10.028 6.92369 10.0171C6.66839 9.71866 6.43338 9.44391 6.28115 9.20208C6.11911 8.94466 5.95871 8.58299 6.089 8.16398C6.22141 7.73818 6.56504 7.53618 6.84946 7.42409C7.11194 7.32065 7.45955 7.24207 7.83197 7.15787C7.84636 7.15461 7.86079 7.15135 7.87525 7.14808L8.08737 7.10008C8.14704 7.08658 8.19261 7.07626 8.23178 7.06672C8.25452 7.06118 8.27224 7.05658 8.28627 7.05272C8.2952 7.03843 8.3063 7.01993 8.32046 6.99542C8.3415 6.95897 8.36525 6.91644 8.39592 6.86143L8.50517 6.66547C8.51225 6.65272 8.51933 6.64 8.52642 6.62732C8.71908 6.28158 8.89625 5.96368 9.06925 5.73769Z" fill={c}/></svg>,
    /* layers — brand icon */
    layers: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9.99935 3.95801C9.11568 3.95801 8.40827 4.23131 6.72088 4.90625L4.38049 5.84241C3.53847 6.17922 2.95499 6.4135 2.57681 6.61177C2.53985 6.63114 2.50654 6.64933 2.47657 6.66634C2.50654 6.68335 2.53985 6.70154 2.57681 6.72092C2.95499 6.91918 3.53847 7.15347 4.38049 7.49027L6.72088 8.42642C8.40827 9.10134 9.11568 9.37468 9.99935 9.37468C10.883 9.37468 11.5904 9.10134 13.2779 8.42642L15.6182 7.49027C16.4603 7.15347 17.0437 6.91918 17.4219 6.72092C17.4589 6.70154 17.4922 6.68335 17.5221 6.66634C17.4922 6.64933 17.4589 6.63114 17.4219 6.61177C17.0437 6.4135 16.4603 6.17922 15.6182 5.84241L13.2779 4.90625C11.5904 4.23131 10.883 3.95801 9.99935 3.95801ZM6.35303 3.70709C7.91702 3.08131 8.85002 2.70801 9.99935 2.70801C11.1487 2.70801 12.0817 3.08131 13.6457 3.70709C13.6775 3.71984 13.7097 3.73269 13.742 3.74565L16.1203 4.69692C16.9157 5.0151 17.56 5.27281 18.0023 5.50468C18.2261 5.62203 18.4429 5.75507 18.6102 5.91546C18.782 6.08024 18.9577 6.33016 18.9577 6.66634C18.9577 7.00252 18.782 7.25244 18.6102 7.41723C18.4429 7.57761 18.2261 7.71065 18.0023 7.828C17.56 8.05987 16.9157 8.31758 16.1203 8.63576L13.742 9.58701C13.7097 9.60001 13.6775 9.61284 13.6457 9.62559C12.0817 10.2513 11.1487 10.6247 9.99935 10.6247C8.85002 10.6247 7.91702 10.2513 6.35304 9.62559C6.32117 9.61284 6.28904 9.60001 6.25664 9.58701L3.87847 8.63576C3.08298 8.31758 2.43869 8.05987 1.99641 7.828C1.77257 7.71065 1.55572 7.57761 1.38852 7.41723C1.21672 7.25244 1.04102 7.00252 1.04102 6.66634C1.04102 6.33016 1.21672 6.08024 1.38852 5.91546C1.55572 5.75507 1.77257 5.62203 1.99641 5.50468C2.43869 5.27281 3.08299 5.0151 3.87848 4.69692L6.25664 3.74565C6.28904 3.73269 6.32117 3.71984 6.35303 3.70709ZM2.08182 9.53309L2.08486 9.53568C2.08853 9.53893 2.09537 9.54476 2.10537 9.55309C2.12537 9.56984 2.15803 9.59643 2.20334 9.63142C2.29397 9.70151 2.43509 9.80492 2.62668 9.92917C3.00989 10.1777 3.59451 10.5092 4.38049 10.8236L6.72088 11.7598C8.40827 12.4347 9.11568 12.708 9.99935 12.708C10.883 12.708 11.5904 12.4347 13.2779 11.7598L15.6182 10.8236C16.4042 10.5092 16.9888 10.1777 17.372 9.92917C17.5636 9.80492 17.7048 9.70151 17.7953 9.63142C17.8407 9.59643 17.8733 9.56984 17.8933 9.55309C17.9033 9.54476 17.9102 9.53893 17.9139 9.53568L17.9156 9.53426C17.916 9.53384 17.9165 9.53342 17.9169 9.53301C18.1739 9.30401 18.5679 9.32593 18.7979 9.58234C19.0284 9.83926 19.0069 10.2344 18.75 10.4649L18.3327 9.99968C18.75 10.4649 18.75 10.4648 18.75 10.4649L18.7488 10.4659L18.7474 10.4673L18.7435 10.4707L18.7321 10.4807C18.7228 10.4887 18.7104 10.4994 18.6944 10.5126C18.6628 10.5391 18.6178 10.5756 18.5597 10.6205C18.4434 10.7103 18.2743 10.8338 18.0522 10.9779C17.6079 11.266 16.9513 11.6367 16.0824 11.9842L13.742 12.9203C13.7097 12.9333 13.6775 12.9462 13.6457 12.9589C12.0817 13.5847 11.1487 13.958 9.99935 13.958C8.85002 13.958 7.91702 13.5847 6.35304 12.9589C6.32117 12.9462 6.28904 12.9333 6.25664 12.9203L3.91626 11.9842C3.04734 11.6367 2.39077 11.266 1.94653 10.9779C1.72439 10.8338 1.55522 10.7103 1.43899 10.6205C1.38087 10.5756 1.33595 10.5391 1.30424 10.5126C1.28838 10.4994 1.27582 10.4887 1.26657 10.4807L1.25515 10.4707L1.25129 10.4673L1.24982 10.4659L1.24893 10.4652C1.2488 10.465 1.24867 10.4649 1.66602 9.99968L1.24893 10.4652C0.991982 10.2347 0.970282 9.83926 1.20077 9.58234C1.43081 9.32593 1.82483 9.30401 2.08182 9.53309ZM17.9157 12.8675C17.9161 12.8671 17.9165 12.8668 17.9169 12.8663C18.1739 12.6373 18.5679 12.6593 18.7979 12.9157C19.0284 13.1726 19.0069 13.5678 18.75 13.7983L18.3327 13.333C18.75 13.7983 18.75 13.7981 18.75 13.7983L18.7488 13.7993L18.7474 13.8006L18.7435 13.804L18.7321 13.814C18.7228 13.822 18.7104 13.8328 18.6944 13.8459C18.6628 13.8724 18.6178 13.9089 18.5597 13.9538C18.4434 14.0437 18.2743 14.1672 18.0522 14.3113C17.6079 14.5993 16.9513 14.97 16.0824 15.3175L13.742 16.2537C13.7097 16.2667 13.6775 16.2795 13.6457 16.2923C12.0817 16.918 11.1487 17.2913 9.99935 17.2913C8.85002 17.2913 7.91702 16.918 6.35304 16.2923C6.32117 16.2795 6.28904 16.2667 6.25664 16.2537L3.91626 15.3175C3.04734 14.97 2.39077 14.5993 1.94653 14.3113C1.72439 14.1672 1.55522 14.0437 1.43899 13.9538C1.38087 13.9089 1.33595 13.8724 1.30424 13.8459C1.28838 13.8328 1.27582 13.822 1.26657 13.814L1.25515 13.804L1.25129 13.8006L1.24982 13.7993L1.24893 13.7985C1.2488 13.7983 1.24867 13.7983 1.66602 13.333L1.24893 13.7985C0.991982 13.568 0.970282 13.1726 1.20077 12.9157C1.4308 12.6593 1.82479 12.6373 2.08177 12.8663C2.08193 12.8665 2.08257 12.8671 2.08273 12.8672L2.08486 12.869C2.08853 12.8723 2.09537 12.8781 2.10537 12.8864C2.12537 12.9032 2.15803 12.9298 2.20334 12.9648C2.29397 13.0348 2.43509 13.1383 2.62668 13.2625C3.00989 13.511 3.59451 13.8425 4.38049 14.1569L6.72088 15.0931C8.40827 15.768 9.11568 16.0413 9.99935 16.0413C10.883 16.0413 11.5904 15.768 13.2779 15.0931L15.6182 14.1569C16.4042 13.8425 16.9888 13.511 17.372 13.2625C17.5636 13.1383 17.7048 13.0348 17.7953 12.9648C17.8407 12.9298 17.8733 12.9032 17.8933 12.8864C17.9033 12.8781 17.9102 12.8723 17.9139 12.869L17.9157 12.8675Z" fill={c}/></svg>,
    /* gear — brand icon */
    settings: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M10 6.875C8.27412 6.875 6.875 8.27411 6.875 10C6.875 11.7259 8.27412 13.125 10 13.125C11.7259 13.125 13.125 11.7259 13.125 10C13.125 8.27411 11.7259 6.875 10 6.875ZM8.125 10C8.125 8.9645 8.9645 8.125 10 8.125C11.0355 8.125 11.875 8.9645 11.875 10C11.875 11.0355 11.0355 11.875 10 11.875C8.9645 11.875 8.125 11.0355 8.125 10Z" fill={c}/><path fillRule="evenodd" clipRule="evenodd" d="M9.9803 1.04199C9.60997 1.04198 9.30072 1.04198 9.04688 1.0593C8.78263 1.07733 8.53305 1.1162 8.29106 1.21643C7.72954 1.44903 7.28341 1.89515 7.05082 2.45668C6.92973 2.74901 6.89694 3.05709 6.88442 3.39196C6.87435 3.66115 6.7385 3.88575 6.53801 4.0015C6.33753 4.11725 6.07509 4.1226 5.83693 3.99673C5.54067 3.84013 5.25746 3.71448 4.94374 3.67318C4.34116 3.59385 3.73173 3.75715 3.24954 4.12715C3.04174 4.2866 2.88328 4.48333 2.73554 4.70316C2.59362 4.91433 2.43903 5.18212 2.25383 5.50288L2.23279 5.53933C2.04759 5.86009 1.89299 6.12786 1.78107 6.35635C1.66456 6.59422 1.57342 6.82982 1.53923 7.0895C1.45989 7.69209 1.62319 8.30151 1.99318 8.78374C2.18578 9.03466 2.43616 9.21716 2.71986 9.39541C2.94801 9.53874 3.07462 9.76874 3.0746 10.0003C3.07459 10.2318 2.94798 10.4618 2.71986 10.6052C2.43613 10.7834 2.18573 10.9659 1.99311 11.2169C1.62311 11.6991 1.45982 12.3085 1.53914 12.9111C1.57333 13.1707 1.66448 13.4064 1.78098 13.6442C1.89291 13.8727 2.04751 14.1405 2.2327 14.4612L2.25375 14.4977C2.43894 14.8185 2.59353 15.0862 2.73546 15.2974C2.88319 15.5172 3.04166 15.714 3.24946 15.8734C3.73165 16.2434 4.34108 16.4067 4.94366 16.3274C5.25736 16.2861 5.54055 16.1605 5.8368 16.0039C6.07499 15.878 6.33746 15.8833 6.53797 15.9992C6.73848 16.1149 6.87435 16.3395 6.88442 16.6087C6.89694 16.9436 6.92974 17.2517 7.05082 17.544C7.28341 18.1055 7.72954 18.5517 8.29106 18.7842C8.53305 18.8845 8.78263 18.9233 9.04688 18.9413C9.30072 18.9587 9.60997 18.9587 9.9803 18.9587H10.0224C10.3928 18.9587 10.702 18.9587 10.9559 18.9413C11.2201 18.9233 11.4697 18.8845 11.7117 18.7842C12.2732 18.5517 12.7194 18.1055 12.952 17.544C13.0731 17.2517 13.1058 16.9436 13.1183 16.6087C13.1284 16.3395 13.2642 16.1149 13.4647 15.9991C13.6652 15.8833 13.9277 15.878 14.1659 16.0038C14.4621 16.1604 14.7453 16.2861 15.0591 16.3273C15.6616 16.4067 16.2711 16.2434 16.7532 15.8734C16.9611 15.7139 17.1195 15.5172 17.2672 15.2974C17.4091 15.0862 17.5637 14.8185 17.7489 14.4977L17.77 14.4612C17.9551 14.1405 18.1098 13.8727 18.2217 13.6442C18.3382 13.4063 18.4293 13.1707 18.4636 12.9111C18.5429 12.3084 18.3796 11.699 18.0096 11.2168C17.817 10.9658 17.5666 10.7834 17.2829 10.6052C17.0547 10.4618 16.9281 10.2318 16.9281 10.0002C16.9281 9.76874 17.0547 9.53883 17.2828 9.39549C17.5666 9.21724 17.8171 9.03483 18.0096 8.78374C18.3796 8.30157 18.543 7.69215 18.4636 7.08956C18.4294 6.82988 18.3383 6.59428 18.2218 6.35641C18.1099 6.12793 17.9553 5.86018 17.7701 5.53945L17.7491 5.50298C17.5638 5.1822 17.4092 4.91439 17.2673 4.70322C17.1196 4.48338 16.9611 4.28666 16.7533 4.1272C16.2711 3.75721 15.6617 3.59391 15.0591 3.67324C14.7454 3.71454 14.4622 3.84018 14.166 3.99676C13.9278 4.12265 13.6653 4.11729 13.4648 4.00153C13.2643 3.88577 13.1284 3.66113 13.1183 3.39192C13.1058 3.05706 13.0731 2.74899 12.952 2.45668C12.7194 1.89515 12.2732 1.44903 11.7117 1.21643C11.4697 1.1162 11.2201 1.07733 10.9559 1.0593C10.702 1.04198 10.3928 1.04198 10.0224 1.04199H9.9803ZM8.76938 2.37128C8.83372 2.34465 8.93138 2.32009 9.13197 2.3064C9.33822 2.29233 9.60455 2.29199 10.0014 2.29199C10.3982 2.29199 10.6646 2.29233 10.8707 2.3064C11.0714 2.32009 11.1691 2.34465 11.2333 2.37128C11.4886 2.47701 11.6914 2.67979 11.7971 2.93503C11.8305 3.01554 11.8581 3.14105 11.8692 3.43863C11.8939 4.09895 12.2347 4.73473 12.8398 5.08406C13.4448 5.43339 14.1659 5.41066 14.7501 5.10189C15.0133 4.96274 15.1359 4.92393 15.2222 4.91255C15.4961 4.87649 15.7731 4.95072 15.9923 5.11889C16.0476 5.16126 16.1176 5.23357 16.2298 5.40046C16.3451 5.57202 16.4786 5.80249 16.677 6.14616C16.8754 6.48983 17.0083 6.72064 17.0992 6.90627C17.1876 7.08684 17.2152 7.18372 17.2243 7.25272C17.2604 7.52662 17.1861 7.80363 17.018 8.02281C16.9649 8.09195 16.8701 8.17865 16.6178 8.33708C16.0584 8.68866 15.6782 9.30166 15.6781 10.0002C15.6781 10.6989 16.0583 11.312 16.6178 11.6636C16.87 11.822 16.9648 11.9087 17.0179 11.9778C17.1861 12.197 17.2603 12.474 17.2242 12.7479C17.2151 12.8169 17.1876 12.9137 17.0991 13.0943C17.0082 13.2799 16.8753 13.5107 16.6769 13.8544C16.4785 14.1981 16.3451 14.4286 16.2297 14.6002C16.1176 14.767 16.0475 14.8393 15.9922 14.8817C15.7731 15.0499 15.4961 15.1241 15.2221 15.0881C15.1358 15.0767 15.0132 15.0378 14.75 14.8987C14.1658 14.5899 13.4447 14.5672 12.8396 14.9166C12.2347 15.2659 11.8939 15.9017 11.8692 16.562C11.8581 16.8596 11.8305 16.9851 11.7971 17.0657C11.6914 17.3208 11.4886 17.5237 11.2333 17.6294C11.1691 17.656 11.0714 17.6806 10.8707 17.6942C10.6646 17.7083 10.3982 17.7087 10.0014 17.7087C9.60455 17.7087 9.33822 17.7083 9.13197 17.6942C8.93138 17.6806 8.83372 17.656 8.76938 17.6294C8.51422 17.5237 8.31139 17.3208 8.20567 17.0657C8.17232 16.9851 8.14468 16.8596 8.13354 16.562C8.10885 15.9017 7.76803 15.2659 7.16297 14.9166C6.55792 14.5672 5.8369 14.59 5.2527 14.8987C4.98943 15.0379 4.86691 15.0767 4.78051 15.0881C4.5066 15.1242 4.22959 15.0499 4.01042 14.8817C3.9552 14.8394 3.88509 14.7671 3.77293 14.6002C3.65764 14.4287 3.52418 14.1982 3.32577 13.8545C3.12734 13.5108 2.99448 13.28 2.90355 13.0944C2.8151 12.9138 2.78753 12.8169 2.77845 12.7479C2.74239 12.474 2.81662 12.197 2.9848 11.9778C3.03785 11.9087 3.13273 11.822 3.38488 11.6636C3.94437 11.3121 4.32457 10.699 4.3246 10.0004C4.32464 9.30166 3.94443 8.68858 3.38489 8.33699C3.13279 8.17857 3.03793 8.09188 2.98488 8.02275C2.8167 7.80358 2.74248 7.52657 2.77853 7.25266C2.78762 7.18367 2.81518 7.08678 2.90363 6.90622C2.99456 6.72058 3.12743 6.48978 3.32584 6.1461C3.52427 5.80243 3.65772 5.57196 3.77302 5.4004C3.88518 5.23352 3.95528 5.1612 4.01049 5.11884C4.22968 4.95066 4.50668 4.87643 4.78058 4.91249C4.86699 4.92387 4.98952 4.96268 5.25283 5.10186C5.83699 5.41062 6.55798 5.43334 7.163 5.08403C7.76803 4.73473 8.10885 4.09897 8.13354 3.43868C8.14468 3.14107 8.17232 3.01555 8.20567 2.93503C8.31139 2.67979 8.51422 2.47701 8.76938 2.37128Z" fill={c}/></svg>,
    /* bell — brand icon */
    bell: <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9.99984 1.04199C6.43303 1.04199 3.54154 3.93348 3.54154 7.50033V8.08708C3.54154 8.66783 3.36963 9.23566 3.04748 9.71883L2.0903 11.1546C0.979395 12.821 1.82749 15.086 3.75965 15.6129C4.38932 15.7847 5.02431 15.9299 5.66299 16.0487L5.66457 16.053C6.3054 17.7629 8.01815 18.9587 9.99984 18.9587C11.9815 18.9587 13.6943 17.7629 14.3351 16.053L14.3367 16.0487C14.9753 15.9299 15.6104 15.7847 16.2401 15.6129C18.1723 15.086 19.0203 12.821 17.9094 11.1546L16.9523 9.71883C16.6301 9.23566 16.4582 8.66783 16.4582 8.08708V7.50033C16.4582 3.93348 13.5667 1.04199 9.99984 1.04199ZM12.8135 16.2812C10.9444 16.5045 9.05517 16.5044 7.18608 16.2811C7.77854 17.1324 8.809 17.7087 9.99984 17.7087C11.1906 17.7087 12.2211 17.1324 12.8135 16.2812ZM4.79154 7.50033C4.79154 4.62384 7.12339 2.29199 9.99984 2.29199C12.8763 2.29199 15.2082 4.62384 15.2082 7.50033V8.08708C15.2082 8.91466 15.4532 9.72366 15.9122 10.4122L16.8693 11.848C17.507 12.8044 17.0203 14.1045 15.9112 14.407C12.041 15.4625 7.95875 15.4625 4.08854 14.407C2.97951 14.1045 2.49273 12.8044 3.13037 11.848L4.08754 10.4122C4.54658 9.72366 4.79154 8.91466 4.79154 8.08708V7.50033Z" fill={c}/></svg>,
  }
  return I[name] || null
}
