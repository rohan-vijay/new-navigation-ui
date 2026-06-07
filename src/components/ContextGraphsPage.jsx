import { useState } from 'react'
import { Dropdown, SharedIcon, StatusBadge } from './SkillsPage'
import { NewGraphFlow } from './NewGraphFlow'

// sample Enterprise Context Graphs
const GRAPHS = [
  { name: 'Customer 360',          version: 'v3.2.0', status: 'Live',     nodes: 42850, edges: 183202, sources: 12, lastSync: '2 min ago',  sharedType: 'org',     shared: 'Everyone',        owner: 'James Carter',    ownerInit: 'J', modified: '2 hours ago' },
  { name: 'Product Catalog Graph', version: 'v2.1.0', status: 'Live',     nodes: 18430, edges: 64120,  sources: 6,  lastSync: '18 min ago', sharedType: 'team',    shared: 'Data Team',       owner: 'Emily Rodriguez', ownerInit: 'E', modified: '5 hours ago' },
  { name: 'Revenue Operations',    version: 'v0.9.0', status: 'Draft',    nodes: 9820,  edges: 41760,  sources: 9,  lastSync: '1 hour ago', sharedType: 'team',    shared: 'RevOps Team',     owner: 'Olivia Bennett',  ownerInit: 'O', modified: 'Yesterday' },
  { name: 'Supply Chain Network',  version: 'v4.0.1', status: 'Live',     nodes: 31200, edges: 128940, sources: 14, lastSync: '4 hours ago',sharedType: 'org',     shared: 'Everyone',        owner: 'Michael Brooks',  ownerInit: 'M', modified: '2 days ago' },
  { name: 'Marketing Attribution', version: 'v1.5.2', status: 'Archived', nodes: 7640,  edges: 22980,  sources: 8,  lastSync: '6 hours ago',sharedType: 'users',   shared: '10 Users',        owner: 'Olivia Bennett',  ownerInit: 'O', modified: '3 days ago' },
  { name: 'Support Knowledge',     version: 'v2.0.0', status: 'Live',     nodes: 5310,  edges: 16470,  sources: 4,  lastSync: '1 day ago',  sharedType: 'team',    shared: 'Support Team',    owner: 'Emily Rodriguez', ownerInit: 'E', modified: '4 days ago' },
  { name: 'Employee Directory',    version: 'v0.4.0', status: 'Draft',    nodes: 2940,  edges: 8120,   sources: 3,  lastSync: '1 day ago',  sharedType: 'private', shared: 'Only me',         owner: 'David Sullivan',  ownerInit: 'D', modified: '1 week ago' },
  { name: 'Finance Ledger Graph',  version: 'v1.2.0', status: 'Archived', nodes: 12760, edges: 53400,  sources: 7,  lastSync: '2 days ago', sharedType: 'teams',   shared: '2 Users, 4 Teams',owner: 'David Sullivan',  ownerInit: 'D', modified: '2 weeks ago' },
]

const GRAPH_COLS = [
  { key: 'name',     label: 'Graph Name',  w: '15%' },
  { key: 'version',  label: 'Version',     w: '8%' },
  { key: 'status',   label: 'Status',      w: '11%' },
  { key: 'nodes',    label: 'Nodes',       w: '9%' },
  { key: 'edges',    label: 'Edges',       w: '9%' },
  { key: 'sources',  label: 'Sources',     w: '7%' },
  { key: 'lastSync', label: 'Last Sync',   w: '10%' },
  { key: 'shared',   label: 'Shared With', w: '12%' },
  { key: 'owner',    label: 'Owner',       w: '10%' },
  { key: 'modified', label: 'Modified On', w: '9%' },
]

const SORTERS = {
  'Last Modified': null,
  'Name (A–Z)': (a, b) => a.name.localeCompare(b.name),
  'Nodes': (a, b) => b.nodes - a.nodes,
  'Edges': (a, b) => b.edges - a.edges,
}

const td = { padding: '11px 18px', verticalAlign: 'middle', overflow: 'hidden' }

export default function ContextGraphsPage({ onCreate, onOpenGraph }) {
  const [sort, setSort] = useState('Last Modified')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [search, setSearch] = useState('')
  const [newGraph, setNewGraph] = useState(false)

  let rows = GRAPHS
    .filter(g => statusFilter === 'All status' || g.status === statusFilter)
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
  if (SORTERS[sort]) rows = [...rows].sort(SORTERS[sort])

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Header */}
      <div style={{ padding: '18px 26px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 27, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.3, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            Enterprise Context Graph
          </h1>
          <button onClick={() => setNewGraph(true)} style={{
            background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
            padding: '0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', transition: 'background .15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
            onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Create New Graph
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <Dropdown value={sort} options={Object.keys(SORTERS)} onChange={setSort} icon="sort" />
          <Dropdown value={statusFilter} options={['All status', 'Live', 'Draft', 'Archived']} onChange={setStatusFilter} icon="filter" />
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search graphs"
              style={{ border: '1px solid #e3e6e3', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 210, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3e6e3'} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 26px 26px' }}>
        <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#F7F5F3', zIndex: 1 }}>
                {GRAPH_COLS.map(c => (
                  <th key={c.key} style={{
                    width: c.w, textAlign: 'left', padding: '10px 18px',
                    fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
                    color: '#9a948a', borderBottom: '1px solid #eaecea', background: '#F7F5F3', whiteSpace: 'nowrap',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {c.label}
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2.5 5.5L4.5 7.5 6.5 5.5M2.5 3.5L4.5 1.5 6.5 3.5" stroke="#cfd2cd" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </th>
                ))}
                <th style={{ width: 48, borderBottom: '1px solid #eaecea', background: '#F7F5F3' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((g, i) => {
                const last = i === rows.length - 1
                const cell = { ...td, borderBottom: last ? 'none' : '1px solid #f1f2f1' }
                return (
                  <tr key={i} onClick={() => onOpenGraph?.(g)} style={{ cursor: 'pointer', background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                    <td style={cell}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                    </td>
                    <td style={cell}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#8a7340', border: '1px solid #e7dcc1', background: '#faf5ea', padding: '2px 8px', borderRadius: 6 }}>{g.version}</span>
                    </td>
                    <td style={cell}><StatusBadge status={g.status} /></td>
                    <td style={cell}><Metric value={g.nodes} /></td>
                    <td style={cell}><Metric value={g.edges} /></td>
                    <td style={cell}><Metric value={g.sources} /></td>
                    <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{g.lastSync}</td>
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
                        <SharedIcon type={g.sharedType} />{g.shared}
                      </span>
                    </td>
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 11.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.ownerInit}</span>
                        {g.owner}
                      </span>
                    </td>
                    <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{g.modified}</td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No graphs match your search.</div>
          )}
        </div>
      </div>
      {newGraph && <NewGraphFlow onClose={() => setNewGraph(false)} onCreate={() => { setNewGraph(false); onCreate?.() }} />}
    </div>
  )
}

function Metric({ value }) {
  return <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{value.toLocaleString()}</span>
}
