import { useState } from 'react'
import { LOOPS, CADENCE_META } from '../data/loops'
import { StatusBadge, Dropdown, SharedIcon } from './SkillsPage'

/* ─── Cadence chip — how the loop runs ───────────────────── */
export function CadenceChip({ mode, detail }) {
  const m = CADENCE_META[mode]
  if (!m) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 11.5, color: m.fg, border: `1px solid ${m.border}`, background: m.bg, padding: '2px 8px', borderRadius: 6 }}>{m.label}</span>
      {detail && <span style={{ fontSize: 12, color: '#9097a0' }}>{detail}</span>}
    </span>
  )
}

/* ─── Columns ────────────────────────────────────────────── */
const COLS = [
  { key: 'name',      label: 'Loop Name',   w: '24%' },
  { key: 'status',    label: 'Status',      w: '14%' },
  { key: 'cadence',   label: 'Cadence',     w: '16%' },
  { key: 'shared',    label: 'Shared with', w: '18%' },
  { key: 'owner',     label: 'Owner',       w: '16%' },
  { key: 'updated',   label: 'Updated',     w: '12%' },
]
const SORT_COL = { 'Last Updated': 'updated', 'Name (A–Z)': 'name', 'Cadence': 'cadence', 'Status': 'status' }

const CREATE_OPTIONS = [
  { title: 'Describe it with AI', action: 'ai', desc: 'Say what the loop should keep doing and let AI draft it.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.2l1.35 3.4a1.6 1.6 0 00.9.9L14.6 7.8a.4.4 0 010 .75l-3.35 1.3a1.6 1.6 0 00-.9.9L9 14.1a.4.4 0 01-.75 0l-1.35-3.35a1.6 1.6 0 00-.9-.9L2.65 8.55a.4.4 0 010-.75L6 6.5a1.6 1.6 0 00.9-.9L8.25 2.2a.4.4 0 01.75 0z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /></svg> },
  { title: 'Start blank', action: 'scratch', desc: 'Write the objective and set how it runs and how you stay in control.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 2.5H5A1.5 1.5 0 003.5 4v10A1.5 1.5 0 005 15.5h8a1.5 1.5 0 001.5-1.5V6.5L10.5 2.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /><path d="M9 9v3M7.5 10.5h3" stroke="#7a6f5c" strokeWidth="1.3" strokeLinecap="round" /></svg> },
  { title: 'Import from Loop Library', action: 'library', desc: 'Browse curated, ready-to-adopt loop templates.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3.5h3.2a2 2 0 012 2v8a1.6 1.6 0 00-1.6-1.6H3V3.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /><path d="M15 3.5h-3.2a2 2 0 00-2 2v8a1.6 1.6 0 011.6-1.6H15V3.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /></svg> },
]

const td = { padding: '11px 18px', verticalAlign: 'middle', overflow: 'hidden' }

export default function LoopsPage({ onCreate, onBuildAI, onLibrary, onOpenLoop }) {
  const [sort, setSort] = useState('Last Updated')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const rows = LOOPS
    .filter(l => statusFilter === 'All status' || l.status === statusFilter)
    .filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (sort === 'Name (A–Z)') return a.name.localeCompare(b.name)
      if (sort === 'Cadence') return a.cadence.mode.localeCompare(b.cadence.mode)
      if (sort === 'Status') return a.status.localeCompare(b.status)
      return 0
    })

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Header */}
      <div style={{ padding: '18px 26px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 11 }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 27, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.3, lineHeight: 1.1, whiteSpace: 'nowrap' }}>Loops</h1>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setCreateOpen(o => !o)} style={{
              background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
              padding: '0 14px 0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', transition: 'background .15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
              onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
              Create Loop
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1, transform: createOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {createOpen && (
              <>
                <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41, width: 340, background: '#fff', border: '1px solid #ece5d7', borderRadius: 14, boxShadow: '0 18px 50px rgba(40,32,18,0.18)', overflow: 'hidden', padding: 6, animation: 'fdeFadeUp .16s ease-out' }}>
                  {CREATE_OPTIONS.map(o => (
                    <div key={o.title} onClick={() => { setCreateOpen(false); if (o.action === 'ai') onBuildAI?.(); else if (o.action === 'scratch') onCreate?.(); else if (o.action === 'library') onLibrary?.() }}
                      onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}>
                      <span style={{ width: 36, height: 36, borderRadius: 9, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{o.title}</div>
                        <div style={{ fontSize: 12, color: '#8a8170', marginTop: 2, lineHeight: 1.4 }}>{o.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <Dropdown value={sort} options={['Last Updated', 'Name (A–Z)', 'Cadence', 'Status']} onChange={setSort} icon="sort" />
          <Dropdown value={statusFilter} options={['All status', 'Draft', 'In Approval', 'Live', 'Archived']} onChange={setStatusFilter} icon="filter" />
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loops"
              style={{ border: '1px solid #e3e6e3', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 190, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3e6e3'} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 26px 26px' }}>
        <div style={{ border: '1px solid #eaecea', borderRadius: 12, overflowX: 'hidden', overflowY: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#F7F5F3' }}>
                {COLS.map((c, ci) => {
                  const active = SORT_COL[sort] === c.key
                  return (
                    <th key={c.key} style={{
                      width: c.w, textAlign: 'left', padding: '10px 18px',
                      fontSize: 10.5, fontWeight: 600, color: active ? '#5b6066' : '#9aa0a6', letterSpacing: 1,
                      textTransform: 'uppercase', borderBottom: '1px solid #eaecea', whiteSpace: 'nowrap',
                      paddingLeft: ci === 0 ? 22 : 18,
                    }}>{c.label}</th>
                  )
                })}
                <th style={{ width: 48, borderBottom: '1px solid #eaecea', background: '#F7F5F3' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((l, i) => {
                const last = i === rows.length - 1
                const cell = { ...td, borderBottom: last ? 'none' : '1px solid #f1f2f1' }
                return (
                  <tr key={l.id} onClick={() => onOpenLoop?.(l)} style={{ cursor: 'pointer', background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                    {/* Loop Name */}
                    <td style={{ ...cell, paddingLeft: 22 }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                    </td>
                    {/* Status */}
                    <td style={cell}><StatusBadge status={l.status} /></td>
                    {/* Cadence */}
                    <td style={cell}><CadenceChip mode={l.cadence.mode} /></td>
                    {/* Shared with */}
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
                        <SharedIcon type={l.sharedType} />{l.shared}
                      </span>
                    </td>
                    {/* Owner */}
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 11.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{l.ownerInit}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.owner}</span>
                      </span>
                    </td>
                    {/* Updated */}
                    <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{l.updated}</td>
                    {/* Row actions */}
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No loops match your filters.</div>
          )}
        </div>
      </div>
    </div>
  )
}
