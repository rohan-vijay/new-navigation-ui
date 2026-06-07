import { useState, useMemo, useEffect } from 'react'
import { ShareDialog, ShareTypeIcon } from './SkillDetail'
import { StatusBadge, Dropdown } from './SkillsPage'
import CreateAgentPage, { ModelIcon, MODELS } from './CreateAgentModal'
import BuildWithAIModal from './BuildWithAIModal'
import { ToolGlyph } from './AddToolPanel'
import { LinkSourceFlow } from './LinkSourceFlow'
import GraphStage, { SIDEBAR_NODES, GRAPH_EDGES, ListGlyph, AddNodeFlow } from './GraphStage'
import RecordsPage from './RecordsPage'
import SkillLibrary from './SkillLibrary'
import { AGENT_LIBRARY, AGENT_GROUP_ORDER } from '../data/agentLibrary'
import { FeatureModeProvider, useFeatureMode } from '../featureMode'

const TABS = ['Graph', 'Nodes', 'Edges', 'Sources', 'Agents', 'Records', 'Governance']
// Tabs shown only in Full production mode (hidden in MVP).
const FULL_ONLY_TABS = ['Agents', 'Governance']

// same button styling as the Skills detail header
const gBtnGhost = { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, padding: '0 14px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(60,50,30,0.04)', transition: 'all .15s' }
const gBtnPrimary = { background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, padding: '0 20px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 3px rgba(22,52,31,0.16)', transition: 'all .15s' }

/* Compact table toolbar — sort + filter dropdowns + search, matching the
   Enterprise Context Graph (records) view. */
function TableToolbar({ sort, sortOptions, onSort, filter, filterOptions, onFilter, search, onSearch, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <Dropdown value={sort} options={sortOptions} onChange={onSort} icon="sort" />
      <Dropdown value={filter} options={filterOptions} onChange={onFilter} icon="filter" />
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder}
          style={{ border: '1px solid #e3e6e3', borderRadius: 8, padding: '6px 12px 6px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 200, height: 32, boxSizing: 'border-box', transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3e6e3'} />
      </div>
    </div>
  )
}

/* MVP ↔ Full-production feature toggle — segmented pill, two outline icons
   in the same line-icon family as the Share icon. Left = MVP (a single
   minimal tile), right = Full (a 2×2 grid of all features). */
function FeatureModeToggle({ mode, setMode }) {
  const seg = (active) => ({
    width: 34, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', borderRadius: 7, padding: 0,
    background: active ? '#fff' : 'transparent',
    color: active ? '#16341f' : '#8a8378',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' : 'none',
    transition: 'background .15s, color .15s, box-shadow .15s',
  })
  return (
    <div role="group" aria-label="Feature mode"
      style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f2f1ee', border: '1px solid #e3ddd1', borderRadius: 9, padding: 3, height: 36 }}>
      <button onClick={() => setMode('mvp')} title="MVP — show only the minimal feature set" aria-pressed={mode === 'mvp'} style={seg(mode === 'mvp')}>
        {/* single minimal tile */}
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3.5" y="3.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <button onClick={() => setMode('full')} title="Full production — show all features" aria-pressed={mode === 'full'} style={seg(mode === 'full')}>
        {/* 2×2 grid of tiles */}
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9" y="2.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <rect x="2.5" y="9" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9" y="9" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </div>
  )
}

const IS = { stroke: '#bcae90', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
const EMPTY = {
  Nodes: {
    icon: <g {...IS}><circle cx="6" cy="6" r="2.2" /><circle cx="17" cy="8" r="2.2" /><circle cx="10" cy="17" r="2.2" /><path d="M7.7 7.3l7.6 1M8.4 15.4l1.2-7M15.4 9.6l-4.4 5.7" /></g>,
    title: 'No nodes yet', desc: 'Nodes are the entities in your graph — people, accounts, products. Connect a source to start populating them.', cta: 'Add nodes',
  },
  Edges: {
    icon: <g {...IS}><circle cx="5" cy="12" r="2.1" /><circle cx="19" cy="6" r="2.1" /><circle cx="18" cy="17" r="2.1" /><path d="M6.9 11l10.2-4.2M7 12.6l9 4" /></g>,
    title: 'No edges yet', desc: 'Edges describe how entities relate. Once nodes exist, define the relationships that link them together.', cta: 'Define edges',
  },
  Sources: {
    icon: <g {...IS}><ellipse cx="12" cy="6" rx="6.5" ry="2.5" /><path d="M5.5 6v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V6M5.5 12v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-6" /></g>,
    title: 'No sources connected', desc: 'Sources feed data into the graph. Connect a database, warehouse, or app to begin syncing entities.', cta: 'Connect Source',
  },
  Agents: {
    icon: <g {...IS}><path d="M4.5 19.5L13.2 10.8" /><path d="M16 4.2l.85 2.15L19 7.2l-2.15.85L16 10.2l-.85-2.15L13 7.2l2.15-.85L16 4.2z" /><path d="M6.6 4.4l.5 1.25L8.35 6.15l-1.25.5L6.6 7.9l-.5-1.25L4.85 6.15l1.25-.5L6.6 4.4z" /><path d="M19.4 12.2l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1z" /></g>,
    title: 'No agents assigned', desc: 'Agents extract and structure data from unstructured sources — Google Drive, documents, and more — turning their content into graph-ready context. Assign one to put the context to work.', cta: 'Create Agent',
  },
  Records: {
    icon: <g {...IS}><rect x="4" y="4.5" width="16" height="15" rx="2" /><path d="M4 9h16M4 14h16M9 9.5v9.5" /></g>,
    title: 'No records yet', desc: 'Records are the underlying rows behind each entity. They appear here as sources sync into the graph.', cta: 'View sources',
  },
  Governance: {
    icon: <g {...IS}><path d="M12 3.5l7 2.5v5c0 4-3 7-7 9-4-2-7-5-7-9V6l7-2.5z" /><path d="M9 11.5l2 2 4-4.2" /></g>,
    title: 'Governance not set up', desc: 'Define access policies, retention rules, and data classifications to keep this graph compliant.', cta: 'Set up governance',
  },
}

const MO = { stroke: '#7a6f5c', strokeWidth: 1.3, strokeLinejoin: 'round', strokeLinecap: 'round', fill: 'none' }
const AGENT_MENU = [
  { id: 'ai', title: 'Build with AI', desc: 'Describe what to extract and let AI draft the agent for you.', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.2l1.35 3.4a1.6 1.6 0 00.9.9L14.6 7.8a.4.4 0 010 .75l-3.35 1.3a1.6 1.6 0 00-.9.9L9 14.1a.4.4 0 01-.75 0l-1.35-3.35a1.6 1.6 0 00-.9-.9L2.65 8.55a.4.4 0 010-.75L6 6.5a1.6 1.6 0 00.9-.9L8.25 2.2a.4.4 0 01.75 0z" {...MO} /><path d="M14 2.2v2.2M15.1 3.3h-2.2" {...MO} /></svg> },
  { id: 'scratch', title: 'Build from scratch', desc: 'Configure the prompt, model, and output schema yourself.', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 2.5H5A1.5 1.5 0 003.5 4v10A1.5 1.5 0 005 15.5h8a1.5 1.5 0 001.5-1.5V6.5L10.5 2.5z" {...MO} /><path d="M10.3 2.6V6a.6.6 0 00.6.6h3.4M9 9v3M7.5 10.5h3" {...MO} /></svg> },
  { id: 'library', title: 'Import from library', desc: 'Start from a ready-made extraction agent and tweak it.', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 4.5C7.5 3.3 5.7 3 3.8 3.2a.6.6 0 00-.55.6v8.5a.6.6 0 00.65.6c1.8-.2 3.5.1 5.1 1.3 1.6-1.2 3.3-1.5 5.1-1.3a.6.6 0 00.65-.6V3.8a.6.6 0 00-.55-.6C12.3 3 10.5 3.3 9 4.5zM9 4.5v9" {...MO} /></svg> },
]

function EmptyState({ meta, onCta, actions, onAction }) {
  const [open, setOpen] = useState(false)
  if (!meta) return <div style={{ flex: 1, backgroundColor: '#fcfbf7' }} />
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', backgroundColor: '#fcfbf7' }}>
      <div style={{ width: 76, height: 76, borderRadius: 18, background: '#f6f3ec', border: '1px solid #ece5d7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">{meta.icon}</svg>
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{meta.title}</div>
      <div style={{ fontSize: 13.5, color: '#8a8170', marginTop: 7, maxWidth: 400, lineHeight: 1.5 }}>{meta.desc}</div>
      <div style={{ position: 'relative', marginTop: 22 }}>
        <button onClick={() => actions ? setOpen(o => !o) : onCta?.()} style={{ ...gBtnPrimary, height: 40, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
          {meta.cta}
          {actions && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        {actions && open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 41, width: 380, background: '#fff', border: '1px solid #ece5d7', borderRadius: 14, boxShadow: '0 18px 50px rgba(40,32,18,0.18)', padding: 6, textAlign: 'left', animation: 'fdeFadeUp .16s ease-out' }}>
              {actions.map(a => (
                <div key={a.id} onClick={() => { setOpen(false); onAction?.(a.id) }}
                  onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#8a8170', marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function GraphCanvas(props) {
  return (
    <FeatureModeProvider initial="mvp">
      <GraphCanvasInner {...props} />
    </FeatureModeProvider>
  )
}

function GraphCanvasInner({ title = 'New graph', onBack, onAgentAI }) {
  const { mode, setMode } = useFeatureMode()
  const [tab, setTab] = useState('Graph')
  // If we drop into MVP while on a Full-only tab, fall back to Graph.
  useEffect(() => {
    if (mode !== 'full' && FULL_ONLY_TABS.includes(tab)) setTab('Graph')
  }, [mode, tab])
  const [shareOpen, setShareOpen] = useState(false)
  const [shareType, setShareType] = useState('team')
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentAi, setAgentAi] = useState(false)
  const [agentLib, setAgentLib] = useState(false)
  const [agents, setAgents] = useState([])
  const [sourceFlow, setSourceFlow] = useState(false)

  const AGENT_BY_ID = useMemo(() => { const m = {}; AGENT_LIBRARY.forEach(c => c.skills.forEach(s => { m[s.id] = { ...s, cat: c.cat } })); return m }, [])
  const importAgents = (ids) => {
    setAgents(list => {
      const fresh = ids.map(id => AGENT_BY_ID[id]).filter(Boolean).filter(a => !list.some(x => x.name === a.name))
      const added = fresh.map((a, k) => ({ name: a.name, desc: a.desc, cat: a.cat, model: A_MODELS[(list.length + k) % A_MODELS.length], status: 'Draft', ...meta(list.length + k) }))
      return [...list, ...added]
    })
    setTab('Agents')
  }

  const onAgentAction = (id) => {
    if (id === 'ai') setAgentAi(true)
    else if (id === 'library') setAgentLib(true)
    else setAgentOpen(true)
  }

  if (agentLib) return <SkillLibrary library={AGENT_LIBRARY} groupOrder={AGENT_GROUP_ORDER} title="Agent Library" noun="agent" onBack={() => setAgentLib(false)} onImport={importAgents} />
  if (agentOpen) return <CreateAgentPage onBack={() => setAgentOpen(false)} onCreate={a => { if (a?.name) setAgents(l => [...l, { name: a.name, desc: '', cat: 'Custom', model: (MODELS.find(m => m.id === a.model)?.name) || 'Claude Sonnet 4.5', status: 'Draft', ...meta(l.length) }]); setAgentOpen(false); setTab('Agents') }} />

  return (
    <div style={{ flex: 1, minWidth: 0, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header: back + title + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 60, padding: '0 18px 0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        {/* left group (back + title) — equal flex with the right group so tabs sit at true center */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button onClick={() => onBack?.()} title="Back" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
            onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#5b5547" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>

        {/* segmented tabs — centered to the canvas */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', minWidth: 0, overflowX: 'auto' }} className="no-scrollbar">
          <div style={{ display: 'flex', background: '#f2f1ee', borderRadius: 11, padding: 4, gap: 2 }}>
            {TABS.filter(t => mode === 'full' || !FULL_ONLY_TABS.includes(t)).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#1a1a1a' : '#6b6b66', fontWeight: tab === t ? 500 : 400,
                boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' : 'none',
                transition: 'background .15s, box-shadow .15s, color .15s', whiteSpace: 'nowrap',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* right actions: MVP/Full toggle + Share + Publish — equal flex with left group */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, minWidth: 0 }}>
          <FeatureModeToggle mode={mode} setMode={setMode} />
          <button onClick={() => setShareOpen(true)} style={gBtnGhost} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <ShareTypeIcon type={shareType} />
            Share
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1 }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button style={gBtnPrimary} onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = 'var(--green-btn)'}>Publish</button>
        </div>
      </div>

      {/* Body */}
      {tab === 'Graph' ? (
        <GraphStage />
      ) : tab === 'Nodes' ? (
        <NodesList onOpen={() => setTab('Graph')} />
      ) : tab === 'Edges' ? (
        <EdgesList onAddEdge={() => setTab('Graph')} />
      ) : tab === 'Sources' ? (
        <SourcesList onConnect={() => setSourceFlow(true)} />
      ) : tab === 'Agents' && agents.length > 0 ? (
        <AgentsList agents={agents} onAction={onAgentAction} onRemove={i => setAgents(a => a.filter((_, j) => j !== i))} />
      ) : tab === 'Records' ? (
        <RecordsPage />
      ) : (
        <EmptyState meta={EMPTY[tab]} actions={tab === 'Agents' ? AGENT_MENU : undefined} onAction={onAgentAction} />
      )}

      {sourceFlow && <LinkSourceFlow node={null} existingSources={[]} onClose={() => setSourceFlow(false)} />}
      {shareOpen && <ShareDialog skill={{ name: title, sharedType: shareType, owner: 'James Carter', ownerInit: 'J' }} initialType={shareType} onTypeChange={setShareType} onClose={() => setShareOpen(false)} />}
      {agentAi && (
        <BuildWithAIModal
          title="Build an agent with AI"
          cta="Build agent"
          placeholder={'Describe what this agent should extract and from where.\n\nExample: Extract the parties, effective date, term length, and total value from contracts in Google Drive. Return dates as YYYY-MM-DD and amounts as numbers; if a field is missing, return null.'}
          onClose={() => setAgentAi(false)}
          onSubmit={desc => { setAgentAi(false); onAgentAI?.(desc) }}
        />
      )}
    </div>
  )
}

/* Agents list shown in the Agents tab once agents exist */
function AgentsList({ agents, onAction, onRemove }) {
  const [menu, setMenu] = useState(false)
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfbf7', padding: '12px 26px 40px' }} className="dark-scroll">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2 }}>Agents</span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#a89e88' }}>{agents.length}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(o => !o)} style={{ ...gBtnPrimary, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
            onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Create Agent
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1, transform: menu ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {menu && (
            <>
              <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41, width: 360, background: '#fff', border: '1px solid #ece5d7', borderRadius: 14, boxShadow: '0 18px 50px rgba(40,32,18,0.18)', padding: 6, textAlign: 'left', animation: 'fdeFadeUp .16s ease-out' }}>
                {AGENT_MENU.map(a => (
                  <div key={a.id} onClick={() => { setMenu(false); onAction?.(a.id) }}
                    onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}>
                    <span style={{ width: 36, height: 36, borderRadius: 9, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#8a8170', marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#F7F5F3' }}>
              {AGENT_COLS.map(c => (
                <th key={c.key} style={{ width: c.w, textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', borderBottom: '1px solid #eaecea', whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
              <th style={{ width: 48, borderBottom: '1px solid #eaecea' }} />
            </tr>
          </thead>
          <tbody>
            {agents.map((a, i) => {
              const last = i === agents.length - 1
              const cell = { padding: '12px 18px', verticalAlign: 'middle', overflow: 'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' }
              return (
                <tr key={i} style={{ background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                  <td style={cell}><span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{a.name}</span></td>
                  <td style={cell}><StatusBadge status={a.status} /></td>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      <ModelIcon provider={modelProvider(a.model)} size={16} />{a.model}
                    </span>
                  </td>
                  <td style={cell}><span style={{ fontSize: 11.5, color: '#8a7340', background: '#faf5ea', border: '1px solid #e7dcc1', padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>{a.cat}</span></td>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 11.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{(a.owner || '?').charAt(0)}</span>
                      {a.owner}
                    </span>
                  </td>
                  <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{a.modified}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <button onClick={() => onRemove?.(i)} title="More" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const AGENT_COLS = [
  { key: 'name', label: 'Agent Name', w: '22%' },
  { key: 'status', label: 'Status', w: '13%' },
  { key: 'model', label: 'Model', w: '19%' },
  { key: 'cat', label: 'Document Type', w: '19%' },
  { key: 'owner', label: 'Owner', w: '15%' },
  { key: 'modified', label: 'Last Modified', w: '12%' },
]
const modelProvider = (name) => { const n = (name || '').toLowerCase(); return n.includes('gpt') ? 'openai' : n.includes('gemini') ? 'gemini' : 'claude' }
// varied, realistic owner + last-modified per row (like the other tables)
const A_MODELS = MODELS.map(m => m.name) // mix across the full model list
const A_OWNERS = ['James Carter', 'Emily Rodriguez', 'Olivia Bennett', 'Michael Brooks', 'David Sullivan']
const A_MODIFIED = ['2 hours ago', 'Yesterday', '3 days ago', '5 days ago', '1 week ago', '2 weeks ago']
const meta = (i) => { const owner = A_OWNERS[i % A_OWNERS.length]; return { owner, ownerInit: owner.charAt(0), modified: A_MODIFIED[i % A_MODIFIED.length] } }

/* ── Sources table ─────────────────────────────────────── */
const SOURCE_COLS = [
  { key: 'name', label: 'Source', w: '18%' },
  { key: 'conn', label: 'Connection Name', w: '16%' },
  { key: 'status', label: 'Connection Status', w: '15%' },
  { key: 'freq', label: 'Frequency', w: '11%' },
  { key: 'lastSync', label: 'Last Sync', w: '12%' },
  { key: 'owner', label: 'Owner', w: '14%' },
  { key: 'modified', label: 'Last Modified', w: '11%' },
]
const SRC_STATUS = {
  Connected: '#2f9e5a', Syncing: '#d99214', Error: '#c0492f', Paused: '#9097a0',
}
const SOURCES = [
  { name: 'Snowflake', slug: 'snowflake', conn: 'prod-warehouse', status: 'Connected', freq: 'Hourly', lastSync: '12 min ago', owner: 'James Carter', modified: '2 hours ago' },
  { name: 'Salesforce', slug: 'salesforce', conn: 'acme-crm', status: 'Connected', freq: 'Real-time', lastSync: 'Just now', owner: 'Emily Rodriguez', modified: '5 hours ago' },
  { name: 'Google Drive', slug: 'googledrive', conn: 'shared-drive', status: 'Syncing', freq: 'Daily', lastSync: '15 min ago', owner: 'Olivia Bennett', modified: 'Yesterday' },
  { name: 'PostgreSQL', slug: 'postgresql', conn: 'app-db', status: 'Connected', freq: 'Real-time', lastSync: 'Just now', owner: 'Michael Brooks', modified: '2 days ago' },
  { name: 'Amazon S3', slug: 'amazons3', conn: 'data-lake', status: 'Paused', freq: 'Daily', lastSync: '1 day ago', owner: 'David Sullivan', modified: '3 days ago' },
  { name: 'HubSpot', slug: 'hubspot', conn: 'marketing-hub', status: 'Error', freq: 'Hourly', lastSync: '3 hours ago', owner: 'Emily Rodriguez', modified: '4 days ago' },
  { name: 'Notion', slug: 'notion', conn: 'team-workspace', status: 'Connected', freq: 'Hourly', lastSync: '40 min ago', owner: 'Olivia Bennett', modified: '1 week ago' },
  { name: 'Slack', slug: 'slack', conn: 'acme-slack', status: 'Connected', freq: 'Real-time', lastSync: 'Just now', owner: 'James Carter', modified: '2 weeks ago' },
]

/* ── Nodes table ───────────────────────────────────────── */
const NODE_COLS = [
  { key: 'name', label: 'Node Type', w: '20%' },
  { key: 'cat', label: 'Category', w: '13%' },
  { key: 'records', label: 'Records', w: '12%' },
  { key: 'props', label: 'Properties', w: '11%' },
  { key: 'edges', label: 'Edges', w: '11%' },
  { key: 'fill', label: 'Fill Rate', w: '14%' },
]
const CAT_TAG = {
  core:    { label: 'Core',    color: '#2f6f43', bg: '#eef4ee', border: '#d6e6d8' },
  support: { label: 'Support', color: '#8a7340', bg: '#faf5ea', border: '#e7dcc1' },
  derived: { label: 'Derived', color: '#6b5aa6', bg: '#f2effa', border: '#ddd5ef' },
  source:  { label: 'Source',  color: '#3a6ea0', bg: '#eef3f9', border: '#d3e0ee' },
}
const fillColor = (v) => v >= 92 ? '#2f9e5a' : v >= 80 ? '#a98c54' : '#c0492f'

const NODE_SORTERS = {
  'Name (A–Z)': (a, b) => a.label.localeCompare(b.label),
  'Records': (a, b) => (b.instancesN || 0) - (a.instancesN || 0),
  'Properties': (a, b) => b.props - a.props,
  'Edges': (a, b) => b.edges - a.edges,
  'Fill Rate': (a, b) => b.fill - a.fill,
}
const NODE_FILTERS = { 'All categories': null, Core: 'core', Support: 'support', Derived: 'derived', Source: 'source' }

function NodesList({ onOpen }) {
  const [sort, setSort] = useState('Name (A–Z)')
  const [filter, setFilter] = useState('All categories')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const NODES = useMemo(() => {
    const fcat = NODE_FILTERS[filter]
    let rows = SIDEBAR_NODES
      .filter(n => !fcat || n.cat === fcat)
      .filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    return [...rows].sort(NODE_SORTERS[sort])
  }, [sort, filter, search])
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfbf7', padding: '12px 26px 40px' }} className="dark-scroll">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2 }}>Nodes</span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#a89e88' }}>{NODES.length}</span>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ ...gBtnGhost, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>
          New Node
        </button>
      </div>

      <TableToolbar
        sort={sort} sortOptions={Object.keys(NODE_SORTERS)} onSort={setSort}
        filter={filter} filterOptions={Object.keys(NODE_FILTERS)} onFilter={setFilter}
        search={search} onSearch={setSearch} placeholder="Search nodes" />

      <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#F7F5F3' }}>
              {NODE_COLS.map(c => (
                <th key={c.key} style={{ width: c.w, textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', borderBottom: '1px solid #eaecea', whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
              <th style={{ width: 48, borderBottom: '1px solid #eaecea' }} />
            </tr>
          </thead>
          <tbody>
            {NODES.map((n, i) => {
              const last = i === NODES.length - 1
              const cell = { padding: '12px 18px', verticalAlign: 'middle', overflow: 'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' }
              const cat = CAT_TAG[n.cat] || CAT_TAG.core
              return (
                <tr key={n.id} onClick={() => onOpen?.(n.id)} style={{ background: '#fff', cursor: 'pointer', transition: 'background .12s, box-shadow .12s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ListGlyph node={n} size={16} /></span>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{n.label}</span>
                    </span>
                  </td>
                  <td style={cell}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: cat.color, border: `1px solid ${cat.border}`, background: cat.bg, padding: '2px 8px', borderRadius: 6 }}>{cat.label}</span>
                  </td>
                  <td style={{ ...cell, fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{n.instancesN ? n.instancesN.toLocaleString() : '—'}</td>
                  <td style={{ ...cell, fontSize: 13, color: '#374151' }}>{n.props}</td>
                  <td style={{ ...cell, fontSize: 13, color: '#374151' }}>{n.edges}</td>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 54, height: 5, borderRadius: 3, background: '#ecebe6', overflow: 'hidden', flexShrink: 0 }}>
                        <span style={{ display: 'block', height: '100%', width: `${n.fill}%`, background: fillColor(n.fill) }} />
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: fillColor(n.fill) }}>{n.fill}%</span>
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <button onClick={e => e.stopPropagation()} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {addOpen && <AddNodeFlow onClose={() => setAddOpen(false)} onCreate={() => setAddOpen(false)} />}
    </div>
  )
}

/* ── Edges table ───────────────────────────────────────── */
const EDGE_COLS = [
  { key: 'label', label: 'Relationship', w: '19%' },
  { key: 'from', label: 'From', w: '17%' },
  { key: 'arrow', label: '', w: '4%' },
  { key: 'to', label: 'To', w: '17%' },
  { key: 'kind', label: 'Kind', w: '12%' },
  { key: 'card', label: 'Cardinality', w: '12%' },
  { key: 'inst', label: 'Instances', w: '11%' },
]
const EDGE_KIND_TAG = {
  direct:   { label: 'Direct',   color: '#2f6f43', bg: '#eef4ee', border: '#d6e6d8' },
  inferred: { label: 'Inferred', color: '#6b5aa6', bg: '#f2effa', border: '#ddd5ef' },
  agent:    { label: 'Agent',    color: '#8a7340', bg: '#faf5ea', border: '#e7dcc1' },
  source:   { label: 'Source',   color: '#3a6ea0', bg: '#eef3f9', border: '#d3e0ee' },
}

const EDGE_SORTERS = {
  'Relationship': (a, b) => a.label.localeCompare(b.label),
  'Instances': (a, b) => b.instances - a.instances,
  'From': (a, b) => a.from.label.localeCompare(b.from.label),
  'To': (a, b) => a.to.label.localeCompare(b.to.label),
}

function EdgesList({ onAddEdge }) {
  const [sort, setSort] = useState('Relationship')
  const [filter, setFilter] = useState('All kinds')
  const [search, setSearch] = useState('')
  const byId = useMemo(() => { const m = {}; SIDEBAR_NODES.forEach(n => { m[n.id] = n }); return m }, [])
  const allEdges = useMemo(() => GRAPH_EDGES
    .map((e, i) => {
      const from = byId[e.s], to = byId[e.t]
      if (!from || !to) return null
      const seed = e.label.length + i
      return {
        uid: e.s + ':' + e.t + ':' + e.label, label: e.label, from, to,
        kind: e.kind || 'direct',
        cardinality: ['1:1', '1:N', 'N:1', 'N:M'][seed % 4],
        instances: ((seed * 1287) % 142000) + 100,
        directional: !e.bidirectional,
      }
    })
    .filter(Boolean), [byId])
  const kindOptions = useMemo(() => ['All kinds', ...[...new Set(allEdges.map(e => e.kind))].map(k => (EDGE_KIND_TAG[k] || { label: k }).label)], [allEdges])
  const rows = useMemo(() => {
    const fkind = filter === 'All kinds' ? null : filter
    const q = search.toLowerCase()
    let r = allEdges
      .filter(e => !fkind || (EDGE_KIND_TAG[e.kind] || { label: e.kind }).label === fkind)
      .filter(e => !q || e.label.toLowerCase().includes(q) || e.from.label.toLowerCase().includes(q) || e.to.label.toLowerCase().includes(q))
    return [...r].sort(EDGE_SORTERS[sort])
  }, [allEdges, sort, filter, search])

  const endpoint = (n) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
      <span style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ListGlyph node={n} size={14} /></span>
      <span style={{ fontSize: 13, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>
    </span>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfbf7', padding: '12px 26px 40px' }} className="dark-scroll">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2 }}>Edges</span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#a89e88' }}>{rows.length}</span>
        </div>
        <button onClick={() => onAddEdge?.()} style={{ ...gBtnGhost, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>
          New Edge
        </button>
      </div>

      <TableToolbar
        sort={sort} sortOptions={Object.keys(EDGE_SORTERS)} onSort={setSort}
        filter={filter} filterOptions={kindOptions} onFilter={setFilter}
        search={search} onSearch={setSearch} placeholder="Search edges" />

      <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#F7F5F3' }}>
              {EDGE_COLS.map(c => (
                <th key={c.key} style={{ width: c.w, textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', borderBottom: '1px solid #eaecea', whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
              <th style={{ width: 48, borderBottom: '1px solid #eaecea' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const last = i === rows.length - 1
              const cell = { padding: '12px 18px', verticalAlign: 'middle', overflow: 'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' }
              const k = EDGE_KIND_TAG[e.kind] || EDGE_KIND_TAG.direct
              return (
                <tr key={e.uid} style={{ background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                  onMouseOver={ev => { ev.currentTarget.style.background = '#f7f6f3'; ev.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                  onMouseOut={ev => { ev.currentTarget.style.background = '#fff'; ev.currentTarget.style.boxShadow = 'none' }}>
                  <td style={cell}><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#5b5547', fontWeight: 500 }}>:{e.label}</span></td>
                  <td style={cell}>{endpoint(e.from)}</td>
                  <td style={{ ...cell, textAlign: 'center', color: '#9a948a', fontSize: 14 }}>{e.directional ? '→' : '↔'}</td>
                  <td style={cell}>{endpoint(e.to)}</td>
                  <td style={cell}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: k.color, border: `1px solid ${k.border}`, background: k.bg, padding: '2px 8px', borderRadius: 6 }}>{k.label}</span>
                  </td>
                  <td style={{ ...cell }}><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#374151' }}>{e.cardinality}</span></td>
                  <td style={{ ...cell, fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{e.instances.toLocaleString()}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <button onClick={ev => ev.stopPropagation()} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const SOURCE_SORTERS = {
  'Name (A–Z)': (a, b) => a.name.localeCompare(b.name),
  'Connection': (a, b) => a.conn.localeCompare(b.conn),
  'Status': (a, b) => a.status.localeCompare(b.status),
}
const SOURCE_STATUS_FILTERS = ['All status', 'Connected', 'Syncing', 'Error', 'Paused']

function SourcesList({ onConnect }) {
  const [sort, setSort] = useState('Name (A–Z)')
  const [filter, setFilter] = useState('All status')
  const [search, setSearch] = useState('')
  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let r = SOURCES
      .filter(s => filter === 'All status' || s.status === filter)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.conn.toLowerCase().includes(q))
    return [...r].sort(SOURCE_SORTERS[sort])
  }, [sort, filter, search])
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfbf7', padding: '12px 26px 40px' }} className="dark-scroll">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2 }}>Sources</span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#a89e88' }}>{rows.length}</span>
        </div>
        <button onClick={() => onConnect?.()} style={{ ...gBtnGhost, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>
          Connect Source
        </button>
      </div>

      <TableToolbar
        sort={sort} sortOptions={Object.keys(SOURCE_SORTERS)} onSort={setSort}
        filter={filter} filterOptions={SOURCE_STATUS_FILTERS} onFilter={setFilter}
        search={search} onSearch={setSearch} placeholder="Search sources" />

      <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#F7F5F3' }}>
              {SOURCE_COLS.map(c => (
                <th key={c.key} style={{ width: c.w, textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', borderBottom: '1px solid #eaecea', whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
              <th style={{ width: 48, borderBottom: '1px solid #eaecea' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const last = i === rows.length - 1
              const cell = { padding: '12px 18px', verticalAlign: 'middle', overflow: 'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' }
              return (
                <tr key={i} style={{ background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ToolGlyph slug={s.slug} name={s.name} size={16} /></span>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{s.name}</span>
                    </span>
                  </td>
                  <td style={cell}><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#5b5547' }}>{s.conn}</span></td>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: SRC_STATUS[s.status], flexShrink: 0 }} />{s.status}
                    </span>
                  </td>
                  <td style={{ ...cell, fontSize: 13, color: '#374151' }}>{s.freq}</td>
                  <td style={{ ...cell, fontSize: 13, color: '#9097a0' }}>{s.lastSync}</td>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 11.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.owner.charAt(0)}</span>
                      {s.owner}
                    </span>
                  </td>
                  <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{s.modified}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
