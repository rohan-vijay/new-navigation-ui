import { useState, useMemo } from 'react'
import { ShareDialog, ShareTypeIcon } from './SkillDetail'
import { StatusBadge } from './SkillsPage'
import CreateAgentPage, { ModelIcon, MODELS } from './CreateAgentModal'
import BuildWithAIModal from './BuildWithAIModal'
import { ToolGlyph } from './AddToolPanel'
import { LinkSourceFlow } from './LinkSourceFlow'
import GraphStage from './GraphStage'
import SkillLibrary from './SkillLibrary'
import { AGENT_LIBRARY, AGENT_GROUP_ORDER } from '../data/agentLibrary'

const TABS = ['Graph', 'Nodes', 'Edges', 'Sources', 'Agents', 'Records', 'Governance']

// same button styling as the Skills detail header
const gBtnGhost = { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, padding: '0 14px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(60,50,30,0.04)', transition: 'all .15s' }
const gBtnPrimary = { background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, padding: '0 20px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 3px rgba(22,52,31,0.16)', transition: 'all .15s' }

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

export default function GraphCanvas({ title = 'New graph', onBack, onAgentAI }) {
  const [tab, setTab] = useState('Graph')
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
        <button onClick={() => onBack?.()} title="Back" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#5b5547" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', flexShrink: 0 }}>{title}</span>

        {/* segmented tabs */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, overflowX: 'auto' }} className="no-scrollbar">
          <div style={{ display: 'flex', background: '#f2f1ee', borderRadius: 11, padding: 4, gap: 2 }}>
            {TABS.map(t => (
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

        {/* right actions: Share + Publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={() => setShareOpen(true)} style={gBtnGhost} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <ShareTypeIcon type={shareType} />
            Share
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1 }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button style={gBtnGhost} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>Publish</button>
        </div>
      </div>

      {/* Body */}
      {tab === 'Graph' ? (
        <GraphStage />
      ) : tab === 'Sources' ? (
        <SourcesList onConnect={() => setSourceFlow(true)} />
      ) : tab === 'Agents' && agents.length > 0 ? (
        <AgentsList agents={agents} onAction={onAgentAction} onRemove={i => setAgents(a => a.filter((_, j) => j !== i))} />
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

function SourcesList({ onConnect }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfbf7', padding: '12px 26px 40px' }} className="dark-scroll">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2 }}>Sources</span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#a89e88' }}>{SOURCES.length}</span>
        </div>
        <button onClick={() => onConnect?.()} style={{ ...gBtnPrimary, height: 32, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
          Connect Source
        </button>
      </div>

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
            {SOURCES.map((s, i) => {
              const last = i === SOURCES.length - 1
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
