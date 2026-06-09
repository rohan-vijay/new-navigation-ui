import { useState, useMemo, useEffect } from 'react'
import { ShareDialog, ShareTypeIcon } from './SkillDetail'
import { StatusBadge, Dropdown } from './SkillsPage'
import CreateAgentPage, { ModelIcon, MODELS } from './CreateAgentModal'
import BuildWithAIModal from './BuildWithAIModal'
import { ToolGlyph } from './AddToolPanel'
import { LinkSourceFlow } from './LinkSourceFlow'
import GraphStage, { SIDEBAR_NODES, GRAPH_EDGES, ListGlyph, colorForNode, AddNodeFlow, NewEdgeFlow, generateProps, generateRules, PropertiesPane } from './GraphStage'
// Make node schema available to LinkSourceFlow.buildEditState (runs at module load time)
if (typeof window !== 'undefined') { window.NODES = SIDEBAR_NODES; window.EDGES = GRAPH_EDGES; window.generateProps = generateProps; window.ListGlyph = ListGlyph; }
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
   Unified Context Graph (records) view. */
function TableToolbar({ sort, sortOptions, onSort, filter, filterOptions, onFilter, search, onSearch, placeholder, cta, onCta }) {
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
      {cta && (
        <button onClick={() => onCta?.()} style={{ ...gBtnGhost, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>
          {cta}
        </button>
      )}
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
  const [editSourceSpec, setEditSourceSpec] = useState(null)
  const [nodeDetail, setNodeDetail] = useState(null)

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
              <button key={t} onClick={() => { setTab(t); setNodeDetail(null) }} style={{
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
      {nodeDetail ? (
        <NodeDetailPage node={nodeDetail} onBack={() => setNodeDetail(null)} onCanvas={() => { setNodeDetail(null); setTab('Graph') }} />
      ) : tab === 'Graph' ? (
        <GraphStage />
      ) : tab === 'Nodes' ? (
        <NodesList onOpen={id => setNodeDetail(SIDEBAR_NODES.find(n => n.id === id))} />
      ) : tab === 'Edges' ? (
        <EdgesList />
      ) : tab === 'Sources' ? (
        <SourcesList onConnect={() => setSourceFlow(true)} onEdit={spec => setEditSourceSpec(spec)} />
      ) : tab === 'Agents' && agents.length > 0 ? (
        <AgentsList agents={agents} onAction={onAgentAction} onRemove={i => setAgents(a => a.filter((_, j) => j !== i))} />
      ) : tab === 'Records' ? (
        <RecordsPage />
      ) : (
        <EmptyState meta={EMPTY[tab]} actions={tab === 'Agents' ? AGENT_MENU : undefined} onAction={onAgentAction} />
      )}

      {(sourceFlow || editSourceSpec) && <LinkSourceFlow node={null} existingSources={[]} editSource={editSourceSpec} onClose={() => { setSourceFlow(false); setEditSourceSpec(null); }} />}
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
  { key: 'name',     label: 'Source',          w: '20%' },
  { key: 'conn',     label: 'Connection',      w: '16%' },
  { key: 'status',   label: 'Status',          w: '11%' },
  { key: 'freq',     label: 'Frequency',       w: '11%' },
  { key: 'lastSync', label: 'Last Sync',       w: '11%' },
  { key: 'owner',    label: 'Owner',           w: '16%' },
  { key: 'modified', label: 'Last Modified',   w: '11%' },
]

// Icon component with 3-tier fallback: Simple Icons → Google Favicon → text glyph
// Handles brands not on Simple Icons (Apollo, NetSuite, Monday, UnifyApps)
// Clearbit gives full-color brand logos; Google favicon API for Google products
const _fav = (d) => `https://www.google.com/s2/favicons?sz=128&domain=${d}`
const FAVICON_OVERRIDES = {
  hubspot:        '/logos/hubspot.png',
  netsuite:       '/logos/netsuite.svg',
  slack:          _fav('slack.com'),
  monday:         _fav('monday.com'),
  docusign:       _fav('docusign.com'),
  zendesk:        _fav('zendesk.com'),
  apollo:         '/logos/apollo.svg',
  postgresql:     _fav('postgresql.org'),
  gitbook:        _fav('gitbook.com'),
  salesforce:     _fav('salesforce.com'),
  gmail:          '/logos/gmail.png',
  googledrive:    '/logos/googledrive.png',
  gcal:           '/logos/gcal.png',
  googlecalendar: '/logos/gcal.png',
  googlemeet:     _fav('meet.google.com'),
  googlechrome:   _fav('google.com'),
  productdocs:    _fav('unifyapps.com'),
  productusage:   _fav('unifyapps.com'),
  support:        _fav('unifyapps.com'),
  unifyapps:      _fav('unifyapps.com'),
}
function SourceIcon({ slug, name, size = 20 }) {
  const [failed, setFailed] = useState(false)
  const primary = FAVICON_OVERRIDES[slug] || _fav((slug || 'unknown') + '.com')
  if (failed) {
    return (
      <span style={{ width: size, height: size, borderRadius: 5, background: '#eee7da', color: '#7a6f5c',
        fontSize: size * 0.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    )
  }
  return <img src={primary} width={size} height={size} alt="" onError={() => setFailed(true)} style={{ display: 'block', objectFit: 'contain' }} />
}
const SRC_STATUS = {
  Connected: '#2f9e5a', Syncing: '#d99214', Error: '#c0492f', Paused: '#9097a0',
}
// One row per real source from the UnifyApps Brain architecture doc.
// The `edit` spec is passed as `editSource` to <LinkSourceFlow> — it calls
// buildEditState() internally to pre-fill every wizard step.
const SOURCES = [
  {
    name: 'HubSpot', slug: 'hubspot',
    objects: 'Account · Contact · Lead · Opportunity · Campaign · Renewal · Proposal',
    conn: 'Marketing hub', status: 'Connected', freq: 'Streaming', lastSync: 'Just now',
    owner: 'Emily Rodriguez', modified: '5 min ago',
    edit: {
      system: 'hubspot', connection: 'hs-mkt',
      tables: ['Account', 'Contact', 'Lead', 'Opportunity', 'Campaign', 'Renewal', 'Proposal'],
      tableNode: { Account: 'account', Contact: 'person', Lead: 'person', Opportunity: 'agreement', Campaign: 'interaction', Renewal: 'subscription', Proposal: 'agreement' },
      tableAgent: { Account: ['enrich_company', 'sentiment'], Contact: ['contact_enricher', 'dedupe'], Lead: ['lead_score', 'contact_enricher'], Opportunity: ['deal_intelligence'], Campaign: ['campaign_scorer'], Renewal: ['renewal_risk'], Proposal: ['deal_intelligence'] },
      settings: { refresh: true, loadStrategy: 'cdc', cadence: 'real_time', pipelineType: 'realtime',
                  resourceTier: 'Medium', onError: 'retry', retryCount: 3, freshnessSLO: '5m',
                  alertChannel: '#sales-wins', owner: 'emily.r@unifyapps.com' },
    },
  },
  {
    name: 'NetSuite ERP', slug: 'netsuite',
    objects: 'Invoice · Payment · Subscription · Renewal · Order · Customer',
    conn: 'Production org', status: 'Connected', freq: 'Hourly', lastSync: '18 min ago',
    owner: 'James Carter', modified: '1 hour ago',
    edit: {
      system: 'netsuite',
      tables: ['Invoice', 'Payment', 'Subscription', 'Renewal', 'Order', 'Customer'],
      tableNode: { Invoice: 'invoice', Payment: 'invoice', Subscription: 'subscription', Renewal: 'subscription', Order: 'invoice', Customer: 'account' },
      tableAgent: { Invoice: ['payment_risk', 'revenue_classifier'], Payment: ['payment_risk'], Subscription: ['renewal_risk', 'revenue_classifier'], Renewal: ['renewal_risk'], Order: ['revenue_classifier'], Customer: ['enrich_company', 'churn_predictor'] },
      settings: { refresh: true, loadStrategy: 'incremental', incrementalCol: 'date_created',
                  cadence: '1h', pipelineType: 'scheduled', resourceTier: 'Medium',
                  onError: 'retry', retryCount: 3, freshnessSLO: '2h',
                  alertChannel: '#finance-ops', owner: 'james.c@unifyapps.com' },
    },
  },
  {
    name: 'Monday.com', slug: 'monday',
    objects: 'Issue · Project · Task · Incident',
    conn: 'unifyapps.monday.com', status: 'Connected', freq: 'Every 30m', lastSync: '12 min ago',
    owner: 'Priya Sharma', modified: '30 min ago',
    edit: {
      system: 'monday',
      tables: ['Issue', 'Project', 'Task', 'Incident'],
      tableNode: { Issue: 'incident', Project: 'ticket', Task: 'ticket', Incident: 'incident' },
      tableAgent: { Issue: ['ticket_intelligence'], Project: ['summarize'], Task: ['summarize'], Incident: ['ticket_intelligence'] },
      settings: { refresh: true, loadStrategy: 'incremental', cadence: '30m',
                  pipelineType: 'scheduled', resourceTier: 'Small', onError: 'skip',
                  freshnessSLO: '1h', alertChannel: '#delivery-alerts', owner: 'priya.s@unifyapps.com' },
    },
  },
  {
    name: 'Support Portal', slug: 'support',
    objects: 'Ticket · Incident · Knowledge Article · Conversation',
    conn: 'support.unifyapps.com', status: 'Connected', freq: 'Streaming', lastSync: '1 min ago',
    owner: 'Alex Kim', modified: '2 min ago',
    edit: {
      system: 'support',
      tables: ['Ticket', 'Incident', 'Article', 'Conversation'],
      tableNode: { Ticket: 'ticket', Incident: 'incident', Article: 'interaction', Conversation: 'interaction' },
      tableAgent: { Ticket: ['ticket_intelligence', 'sentiment'], Incident: ['ticket_intelligence'], Article: ['kb_gap_detector', 'summarize'], Conversation: ['sentiment', 'ticket_intelligence'] },
      settings: { refresh: true, loadStrategy: 'cdc', cadence: 'real_time',
                  pipelineType: 'realtime', resourceTier: 'Medium', onError: 'retry',
                  retryCount: 3, freshnessSLO: '5m', alertChannel: '#cs-alerts',
                  owner: 'alex.k@unifyapps.com' },
    },
  },
  {
    name: 'Product Usage DB', slug: 'postgresql',
    objects: 'usage_events · feature_adoption · account_signals · sessions',
    conn: 'prod-analytics-db', status: 'Connected', freq: 'Streaming', lastSync: 'Just now',
    owner: 'Michael Brooks', modified: '10 min ago',
    edit: {
      system: 'productusage',
      tables: ['usage_events', 'feature_adoption', 'account_signals', 'sessions'],
      tableNode: { usage_events: 'signal', feature_adoption: 'signal', account_signals: 'signal', sessions: 'interaction' },
      tableAgent: { usage_events: ['churn_predictor', 'expansion_signal'], feature_adoption: ['expansion_signal', 'churn_predictor'], account_signals: ['churn_predictor', 'expansion_signal'], sessions: ['churn_predictor'] },
      settings: { refresh: true, loadStrategy: 'cdc', cadence: 'real_time',
                  pipelineType: 'realtime', resourceTier: 'Large', onError: 'retry',
                  retryCount: 5, freshnessSLO: '2m', alertChannel: '#data-platform',
                  owner: 'michael.b@unifyapps.com' },
    },
  },
  {
    name: 'Apollo', slug: 'apollo',
    objects: 'Company · Contact · Lead · Intent Signal',
    conn: 'unifyapps-apollo', status: 'Connected', freq: 'Daily', lastSync: '12h ago',
    owner: 'Emily Rodriguez', modified: '12 hours ago',
    edit: {
      system: 'apollo',
      tables: ['Company', 'Contact', 'Lead', 'IntentSignal'],
      tableNode: { Company: 'account', Contact: 'person', Lead: 'person', IntentSignal: 'signal' },
      tableAgent: { Company: ['enrich_company', 'lead_score'], Contact: ['contact_enricher', 'dedupe'], Lead: ['lead_score', 'buying_intent'], IntentSignal: ['buying_intent'] },
      settings: { refresh: true, loadStrategy: 'full', cadence: 'daily',
                  pipelineType: 'scheduled', resourceTier: 'Small', onError: 'skip',
                  freshnessSLO: '24h', alertChannel: '#sales-wins', owner: 'emily.r@unifyapps.com' },
    },
  },
  {
    name: 'DocuSign', slug: 'docusign',
    objects: 'Envelope · Signature Event · Recipient · Template',
    conn: 'legal-docusign', status: 'Connected', freq: 'Real time', lastSync: '4 min ago',
    owner: 'Sarah Chen', modified: '4 min ago',
    edit: {
      system: 'docusign',
      tables: ['Envelope', 'SignatureEvent', 'Recipient'],
      tableNode: { Envelope: 'agreement', SignatureEvent: 'signal', Recipient: 'person' },
      tableAgent: { Envelope: ['contract_risk', 'summarize'], SignatureEvent: ['contract_risk'], Recipient: ['contact_enricher'] },
      settings: { refresh: true, loadStrategy: 'cdc', cadence: 'real_time',
                  pipelineType: 'realtime', resourceTier: 'Small', onError: 'retry',
                  retryCount: 3, freshnessSLO: '10m', alertChannel: '#legal',
                  owner: 'sarah.c@unifyapps.com' },
    },
  },
  {
    name: 'Google Drive', slug: 'googledrive',
    objects: 'Contract · SOW · Proposal · Policy · Knowledge Article · Case Study',
    conn: 'unifyapps-drive', status: 'Connected', freq: 'Every 6h', lastSync: '2h ago',
    owner: 'Sarah Chen', modified: '2 hours ago',
    edit: {
      system: 'googledrive', scope: 'folders',
      locations: ['Legal / Contracts', 'Sales / SOWs', 'Sales / Proposals', 'Legal / Policies', 'Docs / Knowledge', 'Marketing / Case Studies'],
      contentMode: 'mixed',
      includeOnly: ['contract', 'sow', 'proposal', 'policy', 'knowledge_article', 'case_study'],
      entityNode: { contract: 'agreement', sow: '__new__', proposal: '__new__', policy: '__new__', knowledge_article: '__new__', case_study: '__new__' },
      settings: { refresh: true, retention: true, cadence: '6h', pipelineType: 'scheduled',
                  resourceTier: 'Medium', onError: 'skip', freshnessSLO: '12h',
                  alertChannel: '#docs-pipeline', owner: 'sarah.c@unifyapps.com' },
    },
  },
  {
    name: 'Gmail', slug: 'gmail',
    objects: 'Email thread · Attachment · Outreach history',
    conn: 'sales@unifyapps.com', status: 'Connected', freq: 'Every 1h', lastSync: '22 min ago',
    owner: 'Emily Rodriguez', modified: '30 min ago',
    edit: {
      system: 'gmail', scope: 'folders',
      locations: ['Sales inbox', 'Success inbox', 'BD inbox'],
      contentMode: 'mixed',
      includeOnly: ['gm_sales', 'gm_renewal', 'gm_support', 'gm_legal', 'gm_exec'],
      entityNode: { gm_sales: 'interaction', gm_renewal: 'interaction', gm_support: 'interaction', gm_legal: 'interaction', gm_exec: 'interaction' },
      settings: { refresh: true, cadence: '1h', pipelineType: 'scheduled',
                  resourceTier: 'Small', onError: 'skip', freshnessSLO: '2h',
                  alertChannel: '#sales-wins', owner: 'emily.r@unifyapps.com' },
    },
  },
  {
    name: 'Google Calendar', slug: 'googlecalendar',
    objects: 'Meeting · QBR · Demo · Kickoff event',
    conn: 'sales@unifyapps.com', status: 'Connected', freq: 'Every 1h', lastSync: '35 min ago',
    owner: 'Emily Rodriguez', modified: '35 min ago',
    edit: {
      system: 'gcal', scope: 'folders',
      locations: ['Sales calendar', 'CS calendar', 'SE calendar'],
      contentMode: 'mixed',
      includeOnly: ['gc_discovery', 'gc_demo', 'gc_qbr', 'gc_renewal', 'gc_exec'],
      entityNode: { gc_discovery: 'interaction', gc_demo: 'interaction', gc_qbr: 'interaction', gc_renewal: 'interaction', gc_exec: 'interaction' },
      settings: { refresh: true, cadence: '1h', pipelineType: 'scheduled',
                  resourceTier: 'Small', onError: 'skip', freshnessSLO: '2h',
                  alertChannel: '#cs-alerts', owner: 'emily.r@unifyapps.com' },
    },
  },
  {
    name: 'Slack', slug: 'slack',
    objects: 'Thread · Decision · Incident · Alert',
    conn: 'unifyapps.slack.com', status: 'Connected', freq: 'Streaming', lastSync: '1 min ago',
    owner: 'James Carter', modified: '1 min ago',
    edit: {
      system: 'slack', scope: 'folders',
      locations: ['#sales-wins', '#deal-desk', '#oncall', '#cs-alerts', '#escalations'],
      contentMode: 'mixed',
      includeOnly: ['thread', 'decision', 'incident', 'alert'],
      entityNode: { thread: 'interaction', decision: 'signal', incident: 'incident', alert: '__new__' },
      settings: { refresh: true, skipperms: true, cadence: 'real_time', pipelineType: 'realtime',
                  resourceTier: 'Medium', onError: 'retry', retryCount: 3, freshnessSLO: '5m',
                  alertChannel: '#oncall', owner: 'james.c@unifyapps.com' },
    },
  },
  {
    name: 'Product Docs', slug: 'productdocs',
    objects: 'Knowledge Article · Product Guide · Release Note',
    conn: 'docs.unifyapps.com', status: 'Connected', freq: 'Daily', lastSync: '9h ago',
    owner: 'Priya Sharma', modified: '9 hours ago',
    edit: {
      system: 'productdocs', scope: 'folders',
      locations: ['Docs / Guides', 'Docs / API Reference', 'Docs / Release Notes', 'Docs / FAQs'],
      contentMode: 'mixed',
      includeOnly: ['pd_article', 'pd_guide', 'pd_release'],
      entityNode: { pd_article: '__new__', pd_guide: '__new__', pd_release: '__new__' },
      settings: { refresh: true, cadence: 'daily', pipelineType: 'scheduled',
                  resourceTier: 'Small', onError: 'skip', freshnessSLO: '24h',
                  alertChannel: '#docs-pipeline', owner: 'priya.s@unifyapps.com' },
    },
  },
  {
    name: 'Web / Market Intel', slug: 'googlechrome',
    objects: 'Competitor Page · News Article · Market Signal',
    conn: 'web-crawler', status: 'Connected', freq: 'Daily', lastSync: '9h ago',
    owner: 'James Carter', modified: '9 hours ago',
    edit: {
      system: 'web', scope: 'folders',
      locations: ['rival.com', 'techcrunch.com', 'Industry analyst reports', 'G2 competitor pages'],
      contentMode: 'mixed',
      includeOnly: ['web_competitor', 'web_news', 'web_market'],
      entityNode: { web_competitor: '__new__', web_news: '__new__', web_market: 'signal' },
      settings: { refresh: true, cadence: 'daily', pipelineType: 'scheduled',
                  resourceTier: 'Small', onError: 'skip', freshnessSLO: '24h',
                  alertChannel: '#market-intel', owner: 'james.c@unifyapps.com' },
    },
  },
]

/* ── Node detail page ──────────────────────────────────── */
const DETAIL_TABS = ['Properties', 'Edges', 'Survivorship', 'Data Quality', 'Data Matching', 'Computation', 'Activity']
const _ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
const TAB_ICON = {
  Properties: <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><rect x="4" y="5" width="16" height="14" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /><line x1="9.5" y1="10" x2="9.5" y2="19" /></svg>,
  Edges: <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="12" r="2.4" /><line x1="8.4" y1="12" x2="15.6" y2="12" /></svg>,
  Survivorship: <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><path d="M12 3l7 3v6c0 4-3 6.6-7 7.6C8 18.6 5 16 5 12V6z" /></svg>,
  'Data Quality': <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4z" /></svg>,
  'Data Matching': <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><circle cx="6.5" cy="6" r="2" /><circle cx="6.5" cy="18" r="2" /><circle cx="17.5" cy="12" r="2" /><path d="M8.5 6.5c1 3.5 3 5 7 5.4M8.5 17.5c1-3.5 3-5 7-5.4" /></svg>,
  Computation: <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><path d="M9.5 4c-2 0-2.8 1-2.8 3v1.6c0 1.5-1 2.4-2.2 2.4 1.2 0 2.2.9 2.2 2.4V17c0 2 .8 3 2.8 3" /><path d="M14.5 4c2 0 2.8 1 2.8 3v1.6c0 1.5 1 2.4 2.2 2.4-1.2 0-2.2.9-2.2 2.4V17c0 2-.8 3-2.8 3" /></svg>,
  Activity: <svg width="14" height="14" viewBox="0 0 24 24" {..._ic}><polyline points="3 12 8 12 10 6 14 18 16 12 21 12" /></svg>,
}

function NodeIcon({ node, size = 34 }) {
  const c = colorForNode(node)
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44">
      {node.type === 'source'
        ? <rect x="-13" y="-13" width="26" height="26" rx="3" fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />
        : node.type === 'agent'
          ? <polygon points={[0, 1, 2, 3, 4, 5].map(i => { const a = (Math.PI / 3) * i - Math.PI / 2; const r = 14; return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}` }).join(' ')} fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />
          : <circle r="13" fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />}
    </svg>
  )
}

const dtHeadCell = { textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a', borderBottom: '1px solid #eaecea', whiteSpace: 'nowrap' }
function DetailTable({ cols, rows, empty }) {
  return (
    <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead><tr style={{ background: '#F7F5F3' }}>{cols.map(c => <th key={c.label} style={{ ...dtHeadCell, width: c.w }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((cells, i) => {
            const last = i === rows.length - 1
            const cell = { padding: '12px 18px', verticalAlign: 'middle', overflow: 'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' }
            return (
              <tr key={i} style={{ background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                {cells.map((cnt, j) => <td key={j} style={{ ...cell, ...(cols[j].cellStyle || {}) }}>{cnt}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div style={{ padding: '46px 0', textAlign: 'center', color: '#9097a0', fontSize: 13.5, background: '#fff' }}>{empty}</div>}
    </div>
  )
}

const fillCell = (v) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
    <span style={{ width: 54, height: 5, borderRadius: 3, background: '#ecebe6', overflow: 'hidden', flexShrink: 0 }}>
      <span style={{ display: 'block', height: '100%', width: `${v}%`, background: fillColor(v) }} />
    </span>
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: fillColor(v) }}>{v}%</span>
  </span>
)
const tagPills = (arr) => (
  <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
    {arr.map((t, i) => <span key={i} className={'snap-tag ' + (t.cls || '')}>{t.label}</span>)}
  </span>
)
const monoCell = (v, color = '#5b5547') => <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color }}>{v}</span>
const StatusPill = ({ on }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: on ? '#2f6f43' : '#9097a0' }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? '#2f9e5a' : '#c4bfb4' }} />{on ? 'Active' : 'Off'}
  </span>
)

function nodeEdgesFor(node) {
  const byId = {}; SIDEBAR_NODES.forEach(n => { byId[n.id] = n })
  return GRAPH_EDGES
    .map((e, i) => {
      if (e.s !== node.id && e.t !== node.id) return null
      const out = e.s === node.id
      const other = byId[out ? e.t : e.s]
      if (!other) return null
      const seed = e.label.length + i
      const m = meta(i)
      return { label: e.label, dir: out ? '→' : '←', other, from: node, to: other, owner: m.owner, modified: m.modified, kind: e.kind || 'direct', cardinality: ['1:1', '1:N', 'N:1', 'N:M'][seed % 4], instances: ((seed * 1287) % 142000) + 100 }
    })
    .filter(Boolean)
}
function genComputations(node) {
  if (node.type === 'source') return []
  const seed = node.id.charCodeAt(0) + node.id.length
  const all = [
    { field: node.id + '_score', kind: 'Formula', expr: 'weighted_avg(signals)', refreshed: '12 min ago', status: 'Healthy' },
    { field: 'risk_tier', kind: 'SQL', expr: 'CASE WHEN … END', refreshed: '1 hour ago', status: 'Healthy' },
    { field: 'segment', kind: 'Agent', expr: 'classify(description)', refreshed: '3 hours ago', status: 'Stale' },
  ]
  return all.slice(0, 1 + (seed % 3))
}
function genActivity(node) {
  const seed = node.id.charCodeAt(0) + node.id.length
  const base = [
    { event: 'Schema updated', actor: 'Emily Rodriguez', detail: `Added property ${node.id}_score`, when: '2 hours ago' },
    { event: 'Source synced', actor: 'System', detail: `${node.instances} records ingested`, when: '5 hours ago' },
    { event: 'Rule triggered', actor: 'System', detail: 'Freshness SLO evaluated', when: 'Yesterday' },
    { event: 'Property indexed', actor: 'Michael Brooks', detail: 'name → b-tree index', when: '2 days ago' },
    { event: 'Node created', actor: 'James Carter', detail: 'Initial schema defined', when: '2 weeks ago' },
  ]
  return base.slice(0, 3 + (seed % 3))
}

const DETAIL_TAB_CFG = {
  Properties: {
    sorters: { 'Name (A–Z)': (a, b) => a.name.localeCompare(b.name), 'Fill Rate': (a, b) => b.fill - a.fill, 'Type': (a, b) => a.type.localeCompare(b.type) },
    filters: { 'All attributes': null, Required: p => p.required, Indexed: p => p.indexed, PII: p => p.pii, 'Primary key': p => p.pk },
    search: p => p.name + ' ' + p.type, placeholder: 'Search properties', cta: 'New Property',
  },
  Edges: {
    sorters: { 'Relationship': (a, b) => a.label.localeCompare(b.label), 'Instances': (a, b) => b.instances - a.instances, 'Connected Node': (a, b) => a.other.label.localeCompare(b.other.label) },
    filters: { 'All kinds': null, Direct: e => e.kind === 'direct', Inferred: e => e.kind === 'inferred', Agent: e => e.kind === 'agent', Source: e => e.kind === 'source' },
    search: e => e.label + ' ' + e.other.label, placeholder: 'Search edges', cta: 'New Edge',
  },
  Survivorship: {
    sorters: { 'Rule (A–Z)': (a, b) => a.title.localeCompare(b.title), 'Property': (a, b) => a.property.localeCompare(b.property) },
    filters: { 'All status': null, Active: r => r.on, Off: r => !r.on },
    search: r => r.title + ' ' + r.property, placeholder: 'Search rules', cta: 'New Rule',
  },
  'Data Quality': {
    sorters: { 'Rule (A–Z)': (a, b) => a.title.localeCompare(b.title), 'Compliance': (a, b) => b.compliance - a.compliance, 'Severity': (a, b) => a.severity.localeCompare(b.severity) },
    filters: { 'All status': null, Active: r => r.on, Off: r => !r.on, Errors: r => r.severity === 'ERROR', Warnings: r => r.severity === 'WARN' },
    search: r => r.title + ' ' + r.kind, placeholder: 'Search rules', cta: 'New Rule',
  },
  'Data Matching': {
    sorters: { 'Rule (A–Z)': (a, b) => a.title.localeCompare(b.title) },
    filters: { 'All status': null, Active: r => r.on, Off: r => !r.on },
    search: r => r.title, placeholder: 'Search rules', cta: 'New Rule',
  },
  Computation: {
    sorters: { 'Field (A–Z)': (a, b) => a.field.localeCompare(b.field), 'Kind': (a, b) => a.kind.localeCompare(b.kind) },
    filters: { 'All status': null, Healthy: c => c.status === 'Healthy', Stale: c => c.status === 'Stale' },
    search: c => c.field + ' ' + c.expr + ' ' + c.kind, placeholder: 'Search computations', cta: 'New Computation',
  },
  Activity: {
    sorters: { 'Most recent': null, 'Event': (a, b) => a.event.localeCompare(b.event) },
    filters: { 'All events': null },
    search: a => a.event + ' ' + a.detail + ' ' + a.actor, placeholder: 'Search activity',
  },
}

function NodeDetailPage({ node, onBack, onCanvas }) {
  const [tab, setTab] = useState('Properties')
  const [menuOpen, setMenuOpen] = useState(false)
  const [edgeFlowOpen, setEdgeFlowOpen] = useState(false)
  const [iconHovered, setIconHovered] = useState(false)
  const cat = CAT_TAG[node.cat] || CAT_TAG.core
  const props = useMemo(() => generateProps(node), [node])
  const rules = useMemo(() => generateRules(node), [node])
  const edges = useMemo(() => nodeEdgesFor(node), [node])
  const comps = useMemo(() => genComputations(node), [node])
  const activity = useMemo(() => genActivity(node), [node])

  const RAW = { Properties: props, Edges: edges, Survivorship: rules.survivorship, 'Data Quality': rules.quality, 'Data Matching': rules.match, Computation: comps, Activity: activity }
  const tabCount = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, v.length]))

  // Per-tab toolbar state; reset to the tab's defaults whenever the tab changes.
  const cfg = DETAIL_TAB_CFG[tab]
  const [sort, setSort] = useState(Object.keys(DETAIL_TAB_CFG.Properties.sorters)[0])
  const [filter, setFilter] = useState(Object.keys(DETAIL_TAB_CFG.Properties.filters)[0])
  const [search, setSearch] = useState('')
  useEffect(() => {
    setSort(Object.keys(DETAIL_TAB_CFG[tab].sorters)[0])
    setFilter(Object.keys(DETAIL_TAB_CFG[tab].filters)[0])
    setSearch('')
  }, [tab])

  const view = useMemo(() => {
    let arr = RAW[tab] || []
    const q = search.trim().toLowerCase()
    if (q) arr = arr.filter(it => cfg.search(it).toLowerCase().includes(q))
    const f = cfg.filters[filter]
    if (typeof f === 'function') arr = arr.filter(f)
    if (cfg.sorters[sort]) arr = [...arr].sort(cfg.sorters[sort])
    return arr
    // eslint-disable-next-line
  }, [tab, sort, filter, search, props, edges, rules, comps, activity])

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfbf7', padding: '12px 26px 40px' }} className="dark-scroll">
      {/* Unified header: title + tabs as one cohesive premium block.
          A soft cream panel with the node identity on top and the tab rail
          along its bottom edge; the active tab's accent merges into the
          divider that hands off to the content below. */}
      {/* Full-bleed header: title zone + tab zone in subtly different shades,
          unified by an edge-to-edge bottom rule. */}
      <div style={{ margin: '-12px -26px 18px' }}>
        {/* title zone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEFDFB', padding: '14px 26px 12px' }}>
          <span
            onClick={iconHovered ? onBack : undefined}
            onMouseEnter={() => setIconHovered(true)}
            onMouseLeave={() => setIconHovered(false)}
            title={iconHovered ? 'Back to nodes list' : undefined}
            style={{ width: 32, height: 32, borderRadius: 8, background: iconHovered ? '#f2f0eb' : '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: iconHovered ? 'pointer' : 'default', transition: 'background .15s' }}>
            {iconHovered
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6b6b5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
              : <ListGlyph node={node} size={18} />}
          </span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2, marginLeft: -2 }}>{node.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: cat.color, border: `1px solid ${cat.border}`, background: cat.bg, padding: '2px 8px', borderRadius: 6 }}>{cat.label}</span>

          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)} title="More actions" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e3ddd1', background: menuOpen ? '#f2f1ee' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
              onMouseOver={e => { if (!menuOpen) e.currentTarget.style.background = '#faf8f3' }} onMouseOut={e => { if (!menuOpen) e.currentTarget.style.background = '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.3" fill="#6b6b66" /><circle cx="8" cy="8" r="1.3" fill="#6b6b66" /><circle cx="8" cy="12.5" r="1.3" fill="#6b6b66" /></svg>
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41, width: 200, background: '#fff', border: '1px solid #e3ddd1', borderRadius: 10, boxShadow: '0 14px 40px rgba(40,32,18,0.16)', padding: 5 }}>
                  {[{ l: 'Edit schema' }, { l: 'Export schema' }, { l: 'Version history' }, { divider: true }, { l: 'Delete node type', tone: '#c0492f' }].map((it, i) => it.divider
                    ? <div key={i} style={{ height: 1, background: '#f1f2f1', margin: '4px 6px' }} />
                    : <button key={i} onClick={() => setMenuOpen(false)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: it.tone || '#2a2620' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>{it.l}</button>)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* tab zone — minimal underline tabs; subtle rules above and below, edge-to-edge */}
        <div style={{ background: '#FEFDFB', borderTop: '1px solid #f1ede6', borderBottom: '1px solid #efece6', padding: '0 26px' }}>
          <div style={{ display: 'flex' }}>
          {DETAIL_TABS.map(t => {
            const on = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                position: 'relative', flex: 1, minWidth: 0, cursor: 'pointer', border: 'none', background: 'none',
                padding: '11px 8px 13px', fontSize: 13,
                fontWeight: on ? 600 : 500, color: on ? '#1a1a1a' : '#5b5547',
                transition: 'color .15s', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
                onMouseOver={e => { if (!on) e.currentTarget.style.color = '#1a1a1a' }}
                onMouseOut={e => { if (!on) e.currentTarget.style.color = '#5b5547' }}>
                <span style={{ display: 'inline-flex', color: on ? '#6b6453' : '#8a8378', transition: 'color .15s' }}>{TAB_ICON[t]}</span>
                {t}
                {tabCount[t] > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: on ? '#6b6453' : '#6b6453', background: on ? 'rgba(40,32,18,0.07)' : '#efe9dd', borderRadius: 5, padding: '1px 5px' }}>{tabCount[t]}</span>}
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -1, width: on ? '100%' : 0, maxWidth: 'calc(100% - 16px)', height: 2, borderRadius: 2, background: '#2a2620', transition: 'width .18s ease' }} />
              </button>
            )
          })}
          </div>
        </div>
      </div>

      {/* per-tab toolbar — Properties brings its own controls via PropertiesPane */}
      {tab !== 'Properties' && (
        <TableToolbar
          sort={sort} sortOptions={Object.keys(cfg.sorters)} onSort={setSort}
          filter={filter} filterOptions={Object.keys(cfg.filters)} onFilter={setFilter}
          search={search} onSearch={setSearch} placeholder={cfg.placeholder}
          cta={cfg.cta} onCta={() => { if (tab === 'Edges') setEdgeFlowOpen(true) }} />
      )}

      {/* tab body */}
      {tab === 'Properties' && (
        <div className="prop-pane-host"><PropertiesPane node={node} properties={props} /></div>
      )}

      {tab === 'Edges' && (
        <DetailTable
          cols={[{ label: 'Relationship', w: '20%' }, { label: 'From', w: '19%' }, { label: '', w: '4%', cellStyle: { textAlign: 'center' } }, { label: 'To', w: '19%' }, { label: 'Owner', w: '22%' }, { label: 'Modified On', w: '16%' }]}
          rows={view.map(e => {
            const ep = n => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ListGlyph node={n} size={15} /></span><span style={{ fontSize: 13, color: '#1a1a1a' }}>{n.label}</span></span>
            return [
              monoCell(':' + e.label, '#5b5547'),
              ep(e.from),
              <span style={{ color: '#9a948a', fontSize: 14 }}>→</span>,
              ep(e.to),
              <OwnerCell owner={e.owner} />,
              <span style={{ color: '#9097a0', fontSize: 13, whiteSpace: 'nowrap' }}>{e.modified}</span>,
            ]
          })}
          empty="No edges connected to this node." />
      )}

      {tab === 'Survivorship' && (
        <DetailTable
          cols={[{ label: 'Rule', w: '34%' }, { label: 'Property', w: '16%' }, { label: 'Strategy', w: '18%' }, { label: 'Status', w: '16%' }, { label: 'Last Run', w: '16%' }]}
          rows={view.map(r => [
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{r.title}</span>,
            monoCell(r.property), monoCell(r.strategy, '#374151'),
            <StatusPill on={r.on} />, <span style={{ fontSize: 13, color: '#9097a0' }}>{r.last}</span>,
          ])}
          empty="No survivorship rules configured." />
      )}

      {tab === 'Data Quality' && (
        <DetailTable
          cols={[{ label: 'Rule', w: '32%' }, { label: 'Kind', w: '14%' }, { label: 'Severity', w: '14%' }, { label: 'Compliance', w: '14%' }, { label: 'Status', w: '13%' }, { label: 'Last Run', w: '13%' }]}
          rows={view.map(r => [
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{r.title}</span>,
            monoCell(r.kind, '#374151'),
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: r.severity === 'ERROR' ? '#c0492f' : '#a98c54' }}>{r.severity}</span>,
            <span style={{ fontSize: 13.5, fontWeight: 600, color: fillColor(r.compliance) }}>{r.compliance}%</span>,
            <StatusPill on={r.on} />, <span style={{ fontSize: 13, color: '#9097a0' }}>{r.last}</span>,
          ])}
          empty="No enrichment rules configured." />
      )}

      {tab === 'Data Matching' && (
        <DetailTable
          cols={[{ label: 'Rule', w: '30%' }, { label: 'Signals', w: '22%' }, { label: 'Auto / Review', w: '18%' }, { label: 'Status', w: '15%' }, { label: 'Last Run', w: '15%' }]}
          rows={view.map(r => [
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{r.title}</span>,
            monoCell(r.signals.map(s => s.strategy).join(', '), '#374151'),
            monoCell(`${r.threshold_auto} / ${r.threshold_review}`, '#374151'),
            <StatusPill on={r.on} />, <span style={{ fontSize: 13, color: '#9097a0' }}>{r.last}</span>,
          ])}
          empty="No matching rules configured." />
      )}

      {tab === 'Computation' && (
        <DetailTable
          cols={[{ label: 'Computed Field', w: '24%' }, { label: 'Kind', w: '14%' }, { label: 'Expression', w: '32%' }, { label: 'Status', w: '15%' }, { label: 'Refreshed', w: '15%' }]}
          rows={view.map(c => [
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: '#1a1a1a' }}>{c.field}</span>,
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#6b5aa6', border: '1px solid #ddd5ef', background: '#f2effa', padding: '2px 8px', borderRadius: 6 }}>{c.kind}</span>,
            monoCell(c.expr, '#5b5547'),
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: c.status === 'Healthy' ? '#2f6f43' : '#a98c54' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'Healthy' ? '#2f9e5a' : '#d99214' }} />{c.status}</span>,
            <span style={{ fontSize: 13, color: '#9097a0' }}>{c.refreshed}</span>,
          ])}
          empty="No computed fields on this node." />
      )}

      {tab === 'Activity' && (
        <DetailTable
          cols={[{ label: 'Event', w: '24%' }, { label: 'Detail', w: '40%' }, { label: 'Actor', w: '20%' }, { label: 'When', w: '16%' }]}
          rows={view.map(a => [
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{a.event}</span>,
            <span style={{ fontSize: 13, color: '#5b5547' }}>{a.detail}</span>,
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 10.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.actor.charAt(0)}</span>{a.actor}</span>,
            <span style={{ fontSize: 13, color: '#9097a0' }}>{a.when}</span>,
          ])}
          empty="No recent activity." />
      )}

      {edgeFlowOpen && <NewEdgeFlow simple nodes={SIDEBAR_NODES} fromNode={node} onClose={() => setEdgeFlowOpen(false)} onCreate={() => setEdgeFlowOpen(false)} />}
    </div>
  )
}

/* ── Nodes table ───────────────────────────────────────── */
const NODE_COLS = [
  { key: 'name', label: 'Node Type', w: '19%' },
  { key: 'cat', label: 'Category', w: '11%' },
  { key: 'props', label: 'Properties', w: '10%' },
  { key: 'edges', label: 'Edges', w: '10%' },
  { key: 'owner', label: 'Owner', w: '26%' },
  { key: 'modified', label: 'Modified On', w: '17%' },
]
const OwnerCell = ({ owner }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 11.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{owner.charAt(0)}</span>
    {owner}
  </span>
)
const CAT_TAG = {
  core:    { label: 'Core',      color: '#3a6ea0', bg: '#eef3f9', border: '#d3e0ee' },
  support: { label: 'Secondary', color: '#6b5aa6', bg: '#f2effa', border: '#ddd5ef' },
  derived: { label: 'Derived',   color: '#8a7340', bg: '#faf5ea', border: '#e7dcc1' },
  source:  { label: 'Source',    color: '#2f6f43', bg: '#eef4ee', border: '#d6e6d8' },
}
const fillColor = (v) => v >= 92 ? '#2f9e5a' : v >= 80 ? '#a98c54' : '#c0492f'

const NODE_SORTERS = {
  'Name (A–Z)': (a, b) => a.label.localeCompare(b.label),
  'Properties': (a, b) => b.props - a.props,
  'Edges': (a, b) => b.edges - a.edges,
}
const NODE_FILTERS = { 'All categories': null, Core: 'core', Support: 'support', Derived: 'derived' }

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
              const m = meta(i)
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
                  <td style={{ ...cell, fontSize: 13, color: '#374151' }}>{n.props}</td>
                  <td style={{ ...cell, fontSize: 13, color: '#374151' }}>{n.edges}</td>
                  <td style={cell}><OwnerCell owner={m.owner} /></td>
                  <td style={{ ...cell, color: '#9097a0', fontSize: 13, whiteSpace: 'nowrap' }}>{m.modified}</td>
                  <td style={{ ...cell, textAlign: 'right', paddingRight: 14 }}>
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
  { key: 'label', label: 'Relationship', w: '20%' },
  { key: 'from', label: 'From', w: '19%' },
  { key: 'arrow', label: '', w: '4%' },
  { key: 'to', label: 'To', w: '19%' },
  { key: 'owner', label: 'Owner', w: '22%' },
  { key: 'modified', label: 'Modified On', w: '16%' },
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

// Quick (v2) new-edge popup — no stepper: name, source, destination, PK, FK.
function NewEdgeV2Modal({ onClose, onCreate }) {
  const nodes = useMemo(() => SIDEBAR_NODES.filter(n => n.type === 'entity'), [])
  const [label, setLabel] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [pk, setPk] = useState('')
  const [fk, setFk] = useState('')
  const fromNode = nodes.find(n => n.id === fromId)
  const toNode = nodes.find(n => n.id === toId)
  const fromProps = useMemo(() => fromNode ? generateProps(fromNode) : [], [fromId])
  const toProps = useMemo(() => toNode ? generateProps(toNode) : [], [toId])
  useEffect(() => { const p = fromProps.find(x => x.pk) || fromProps[0]; setPk(p ? p.name : '') }, [fromId])
  useEffect(() => { const p = toProps.find(x => x.pk) || toProps[0]; setFk(p ? p.name : '') }, [toId])
  const valid = label.trim().length >= 3 && fromId && toId && pk && fk
  const lbl = { display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#9a948a', marginBottom: 6 }
  const Picker = ({ value, onChange, options, placeholder, icon }) => {
    const [open, setOpen] = useState(false)
    const sel = options.find(o => o.id === value)
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box', border: '1px solid ' + (open ? '#1a1a1a' : '#e3ddd1'), borderRadius: 8, background: open ? '#fcfbf7' : '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left' }}>
          {sel ? <>{icon && icon(sel)}<span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.label}</span></> : <span style={{ flex: 1, fontSize: 13, color: '#a89e88' }}>{placeholder}</span>}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9a948a" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {open && (<>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 101, maxHeight: 240, overflowY: 'auto', background: '#fff', border: '1px solid #e3ddd1', borderRadius: 9, boxShadow: '0 12px 32px rgba(60,50,30,0.14)', padding: 5 }}>
            {options.map(o => (
              <button key={o.id} onClick={() => { onChange(o.id); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none', background: value === o.id ? '#f1ece0' : 'transparent', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12.5, textAlign: 'left' }}
                onMouseOver={e => { if (value !== o.id) e.currentTarget.style.background = '#f7f5f0' }} onMouseOut={e => { if (value !== o.id) e.currentTarget.style.background = 'transparent' }}>
                {icon && icon(o)}<span style={{ flex: 1, color: '#1a1a1a' }}>{o.label}</span>{o.pk && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#eef4ee', color: '#2f6f43', fontWeight: 700 }}>PK</span>}
              </button>
            ))}
          </div>
        </>)}
      </div>
    )
  }
  const nodeIcon = o => <span style={{ display: 'flex', flexShrink: 0 }}><ListGlyph node={o.node} size={16} /></span>
  const nodeOpts = nodes.map(n => ({ id: n.id, label: n.label, node: n }))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(30,25,15,0.34)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', background: '#fcfbf7', borderRadius: 14, border: '1px solid #e3ddd1', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #efece6', borderRadius: '14px 14px 0 0', background: '#fcfbf7' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: '#1a1a1a' }}>New Edge</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', color: '#6b6b66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={lbl}>Relationship label</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 13, color: '#a89e88' }}>:</span>
              <input value={label} onChange={e => setLabel(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))} placeholder="WORKS_AT" autoFocus style={{ width: '100%', height: 40, boxSizing: 'border-box', padding: '0 12px 0 22px', border: '1px solid #e3ddd1', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13, color: '#1a1a1a', background: '#fff', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Source entity</label><Picker value={fromId} onChange={setFromId} options={nodeOpts} placeholder="Select source…" icon={nodeIcon} /></div>
            <div><label style={lbl}>Destination entity</label><Picker value={toId} onChange={setToId} options={nodeOpts} placeholder="Select destination…" icon={nodeIcon} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Primary key</label><Picker value={pk} onChange={setPk} options={fromProps.map(p => ({ id: p.name, label: p.name, pk: p.pk }))} placeholder={fromId ? 'Select key…' : 'Pick source first'} /></div>
            <div><label style={lbl}>Foreign key</label><Picker value={fk} onChange={setFk} options={toProps.map(p => ({ id: p.name, label: p.name, pk: p.pk }))} placeholder={toId ? 'Select key…' : 'Pick destination first'} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid #efece6', borderRadius: '0 0 14px 14px', background: '#fcfbf7' }}>
          <button onClick={onClose} style={{ ...gBtnGhost, height: 38 }}>Cancel</button>
          <button onClick={() => valid && onCreate({ label, fromId, toId, pk, fk })} disabled={!valid} style={{ ...gBtnPrimary, height: 38, opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'default' }}>Create Edge</button>
        </div>
      </div>
    </div>
  )
}

function EdgesList() {
  const [sort, setSort] = useState('Relationship')
  const [filter, setFilter] = useState('All kinds')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addV2Open, setAddV2Open] = useState(false)
  const [addV3Open, setAddV3Open] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [editEdge, setEditEdge] = useState(null)
  // Logically derive edge attributes per edge so the edit modal pre-fills plausibly.
  const attrsForEdge = (e) => {
    const seed = (e.label || '').length + (e.from?.label || '').length
    const base = [{ name: 'since', type: 'datetime' }]
    if (e.kind === 'inferred') base.push({ name: 'confidence', type: 'float' }, { name: 'source_system', type: 'string' })
    if (seed % 2 === 0) base.push({ name: 'weight', type: 'float' })
    return base
  }
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
        <div style={{ position: 'relative' }}>
          <button onClick={() => setAddV3Open(true)} style={{ ...gBtnGhost, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
            onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>
            New Edge
          </button>
        </div>
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
              const m = meta(i)
              return (
                <tr key={e.uid} onClick={() => setEditEdge(e)} style={{ background: '#fff', cursor: 'pointer', transition: 'background .12s, box-shadow .12s' }}
                  onMouseOver={ev => { ev.currentTarget.style.background = '#f7f6f3'; ev.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                  onMouseOut={ev => { ev.currentTarget.style.background = '#fff'; ev.currentTarget.style.boxShadow = 'none' }}>
                  <td style={cell}><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#5b5547', fontWeight: 500 }}>:{e.label}</span></td>
                  <td style={cell}>{endpoint(e.from)}</td>
                  <td style={{ ...cell, textAlign: 'center', color: '#9a948a', fontSize: 14 }}>{e.directional ? '→' : '↔'}</td>
                  <td style={cell}>{endpoint(e.to)}</td>
                  <td style={cell}><OwnerCell owner={m.owner} /></td>
                  <td style={{ ...cell, color: '#9097a0', fontSize: 13, whiteSpace: 'nowrap' }}>{m.modified}</td>
                  <td style={{ ...cell, textAlign: 'right', paddingRight: 14 }}>
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

      {addOpen && <NewEdgeFlow nodes={SIDEBAR_NODES} onClose={() => setAddOpen(false)} onCreate={() => setAddOpen(false)} />}
      {addV2Open && <NewEdgeV2Modal onClose={() => setAddV2Open(false)} onCreate={() => setAddV2Open(false)} />}
      {addV3Open && <NewEdgeFlow simple nodes={SIDEBAR_NODES} onClose={() => setAddV3Open(false)} onCreate={() => setAddV3Open(false)} />}
      {editEdge && <NewEdgeFlow simple editMode nodes={SIDEBAR_NODES} fromNode={editEdge.from} toNode={editEdge.to} initialLabel={editEdge.label} initialCardinality={editEdge.cardinality} initialAttributes={attrsForEdge(editEdge)} initialBothSides={!editEdge.directional} initialUndirected={!editEdge.directional} onClose={() => setEditEdge(null)} onCreate={() => setEditEdge(null)} />}
    </div>
  )
}

const SOURCE_SORTERS = {
  'Name (A–Z)': (a, b) => a.name.localeCompare(b.name),
  'Connection': (a, b) => a.conn.localeCompare(b.conn),
  'Status': (a, b) => a.status.localeCompare(b.status),
}
const SOURCE_STATUS_FILTERS = ['All status', 'Connected', 'Syncing', 'Error', 'Paused']

function SourcesList({ onConnect, onEdit }) {
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
                <tr key={i} style={{ background: '#fff', cursor: s.edit ? 'pointer' : 'default', transition: 'background .12s, box-shadow .12s' }}
                  onClick={() => s.edit && onEdit?.(s.edit)}
                  onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><SourceIcon slug={s.slug} name={s.name} size={18} /></span>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a' }}>{s.name}</span>
                    </span>
                  </td>
                  <td style={cell}><span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#8a7a60' }}>{s.conn}</span></td>
                  <td style={cell}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#374151', whiteSpace: 'nowrap' }}>
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
                  <td style={{ ...cell, fontSize: 13, color: '#9097a0' }}>{s.modified}</td>
                  <td style={{ ...cell, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
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
