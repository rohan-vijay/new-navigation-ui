import { useState, useRef } from 'react'
import { parseSkillZip } from '../utils/importZip'
import { SALES_SKILLS } from '../data/skills'

const SKILLS = SALES_SKILLS

// Premium outlined-chip styles (color only, no dot)
const STATUS_STYLE = {
  'Draft':       { fg: '#6b7280', border: '#dadfda' },
  'In Approval': { fg: '#b07a16', border: '#ecdcae' },
  'Live':        { fg: '#1f7a40', border: '#c2e3cd' },
  'Archived':    { fg: '#8a7d6a', border: '#e2dccf' },
}

/* Linear-style circular status icons — the icon IS the identity, no tile.
   Draft = dotted ring · In Approval = half-filled progress ring ·
   Live = filled check · Archived = filled cross. */
const STATUS_ICON = {
  'Draft':       { fg: '#5d6470', glyph: <circle cx="8" cy="8" r="5.6" stroke="#c2b6a3" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.2 2.95" fill="none" /> },
  'In Approval': { fg: '#9a6f15', glyph: <g><circle cx="8" cy="8" r="5.6" stroke="#bf9233" strokeWidth="1.6" fill="none" /><path d="M8 8 L8 3.6 A4.4 4.4 0 0 1 8 12.4 Z" fill="#bf9233" /></g> },
  'Live':        { fg: '#1f7a40', glyph: <g><circle cx="8" cy="8" r="6.2" fill="#2f7d4c" /><path d="M5.2 8.1l1.9 1.9 3.7-4.1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></g> },
  'Archived':    { fg: '#7a6f5c', glyph: <g><circle cx="8" cy="8" r="6.2" fill="#a3957f" /><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /></g> },
}

function StatusGlyph({ status, size = 19 }) {
  const ic = STATUS_ICON[status]
  if (!ic) return null
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, display: 'block' }}>{ic.glyph}</svg>
}

export function StatusBadge({ status }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <StatusGlyph status={status} />
      <span style={{ fontSize: 13, color: '#374151' }}>{status}</span>
    </span>
  )
}

const COLS = [
  { key: 'name',    label: 'Skill Name',   w: '24%' },
  { key: 'version', label: 'Version',      w: '11%' },
  { key: 'status',  label: 'Status',       w: '14%' },
  { key: 'shared',  label: 'Shared with',  w: '18%' },
  { key: 'owner',   label: 'Owner',        w: '18%' },
  { key: 'updated', label: 'Last Updated', w: '15%' },
]
const COLS_EXPANDED = [
  { key: 'name',    label: 'Skill Name',   w: '210px' },
  { key: 'version', label: 'Version',      w: '92px' },
  { key: 'status',  label: 'Status',       w: '120px' },
  { key: 'shared',  label: 'Shared with',  w: '150px' },
  { key: 'agents',  label: 'Used By',      w: '110px' },
  { key: 'execs',   label: 'Runs / month', w: '150px' },
  { key: 'owner',   label: 'Owner',        w: '160px' },
  { key: 'updated', label: 'Last Updated', w: '120px' },
]
const EXPANDED_MIN_W = 1120 // sum of expanded col widths + actions

// deterministic per-skill usage stats for the expanded view
function rowStat(s) {
  const seed = [...String(s.name)].reduce((a, c) => a + c.charCodeAt(0), 0)
  const used = 4 + (seed % 9)             // 4..12 agents
  const execs = 200 + (seed % 9) * 90     // ~200..920 (variety incl. 250 / 750)
  const sign = (seed % 3 === 0) ? -1 : 1  // ~1/3 of skills trend down
  const delta = sign * (4 + (seed % 16))  // ±4..19% vs last month
  const cost = (3 + (seed % 14)) / 100    // $0.03..$0.16 per run
  const latency = (8 + (seed % 40)) / 10  // 0.8s..4.7s
  const success = 88 + (seed % 12)        // 88..99%
  return { used, execs, delta, cost, latency, success }
}

/* ─── Skill Groups ──────────────────────────────────────── */
export const GROUPS = [
  { id: 'sales', name: 'Sales',       icon: 'sales',     skills: 12, relevance: 'High',   sharedBy: 'Everyone',      sharedType: 'org',     createdBy: 'James Carter',    ci: 'JC', modified: '2 hours ago', desc: 'GTM and revenue skills for the full sales motion — qualification, outreach, deal review, and proposals.' },
  { id: 'finance', name: 'Finance',     icon: 'finance',   skills: 8,  relevance: 'High',   sharedBy: 'Finance Team',  sharedType: 'team',    createdBy: 'Emily Rodriguez', ci: 'ER', modified: 'Yesterday', desc: 'Forecasting, reconciliation, and spend analysis skills used by the finance team.' },
  { id: 'marketing', name: 'Marketing',   icon: 'marketing', skills: 6,  relevance: 'Medium', sharedBy: '5 Teams',       sharedType: 'teams',   createdBy: 'Olivia Bennett',  ci: 'OB', modified: '3 days ago', desc: 'Content, campaign, and brand skills shared across marketing pods.' },
  { id: 'support', name: 'Support',     icon: 'support',   skills: 9,  relevance: 'High',   sharedBy: 'Support Team',  sharedType: 'team',    createdBy: 'Michael Brooks',  ci: 'MB', modified: '4 days ago', desc: 'Ticket triage, summarization, and escalation skills for customer support.' },
  { id: 'engineering', name: 'Engineering', icon: 'eng',       skills: 14, relevance: 'Medium', sharedBy: 'Everyone',      sharedType: 'org',     createdBy: 'David Sullivan',  ci: 'DS', modified: '1 week ago', desc: 'Code review, incident response, and documentation skills for engineering teams.' },
  { id: 'hr-people', name: 'HR & People', icon: 'hr',        skills: 5,  relevance: 'Low',    sharedBy: '10 Users',      sharedType: 'users',   createdBy: 'James Carter',    ci: 'JC', modified: '2 weeks ago', desc: 'Hiring, onboarding, and people-ops skills shared with selected users.' },
  { id: 'legal', name: 'Legal',       icon: 'legal',     skills: 4,  relevance: 'Medium', sharedBy: 'Legal Team',    sharedType: 'team',    createdBy: 'Emily Rodriguez', ci: 'ER', modified: '2 weeks ago', desc: 'Contract review and compliance skills for the legal team.' },
  { id: 'operations', name: 'Operations',  icon: 'ops',       skills: 7,  relevance: 'Medium', sharedBy: 'Only me',       sharedType: 'private', createdBy: 'Olivia Bennett',  ci: 'OB', modified: '3 weeks ago', desc: 'Process documentation and operational skills — private to you for now.' },
]

const GROUP_COLS = [
  { key: 'name',      label: 'Group Name',    w: '26%' },
  { key: 'skills',    label: 'Skills',        w: '16%' },
  { key: 'sharedBy',  label: 'Shared With',   w: '20%' },
  { key: 'createdBy', label: 'Created By',    w: '21%' },
  { key: 'modified',  label: 'Last Modified', w: '17%' },
]

const CREATE_OPTIONS = [
  {
    title: 'Build with AI', action: 'ai',
    desc: 'Describe what you need and let AI draft the skill for you.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.2l1.35 3.4a1.6 1.6 0 00.9.9L14.6 7.8a.4.4 0 010 .75l-3.35 1.3a1.6 1.6 0 00-.9.9L9 14.1a.4.4 0 01-.75 0l-1.35-3.35a1.6 1.6 0 00-.9-.9L2.65 8.55a.4.4 0 010-.75L6 6.5a1.6 1.6 0 00.9-.9L8.25 2.2a.4.4 0 01.75 0z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /><path d="M14 2.2v2.2M15.1 3.3h-2.2" stroke="#7a6f5c" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  },
  {
    title: 'Create from scratch', action: 'scratch',
    desc: 'Start with a blank skill and build it up file by file.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 2.5H5A1.5 1.5 0 003.5 4v10A1.5 1.5 0 005 15.5h8a1.5 1.5 0 001.5-1.5V6.5L10.5 2.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /><path d="M10.3 2.6V6a.6.6 0 00.6.6h3.4M9 9v3M7.5 10.5h3" stroke="#7a6f5c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    title: 'Import .zip file', action: 'zip',
    desc: 'Upload a packaged skill folder with its files and tools.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 5.5A1.5 1.5 0 014 4h3l1.4 1.6H14a1.5 1.5 0 011.5 1.5V13A1.5 1.5 0 0114 14.5H4A1.5 1.5 0 012.5 13V5.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /><path d="M9 7.5v4M7.2 9.7L9 11.5l1.8-1.8" stroke="#7a6f5c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    title: 'Import from Skill Library', action: 'library',
    desc: 'Browse curated, ready-made skills and customize one.',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3.5h3.2a2 2 0 012 2v8a1.6 1.6 0 00-1.6-1.6H3V3.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /><path d="M15 3.5h-3.2a2 2 0 00-2 2v8a1.6 1.6 0 011.6-1.6H15V3.5z" stroke="#7a6f5c" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  },
]

const RELEVANCE_STYLE = {
  High:   { fg: '#1f7a40', border: '#c2e3cd' },
  Medium: { fg: '#b07a16', border: '#ecdcae' },
  Low:    { fg: '#6b7280', border: '#dadfda' },
}

export default function SkillsPage({ tab = 'Skills', onTabChange, onCreate, onBuildAI, onReveal, onLibrary, onImportZip, onOpenSkill, onOpenGroup }) {
  const setTab = onTabChange || (() => {})
  const [sort, setSort] = useState('Last Updated')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [search, setSearch] = useState('')
  const [density, setDensity] = useState('default') // 'default' | 'expanded'
  const [createOpen, setCreateOpen] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const zipInputRef = useRef(null)
  const isGroups = tab === 'Skill Groups'

  const rows = SKILLS
    .filter(s => statusFilter === 'All status' || s.status === statusFilter)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const groupRows = GROUPS.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Header */}
      <div style={{ padding: '18px 26px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 27, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.3, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              {isGroups ? 'Skill Groups' : 'Skills'}
            </h1>
          </div>
          {/* center segmented tabs */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', background: '#f2f1ee', borderRadius: 11, padding: 4, gap: 2 }}>
              {['Skills', 'Skill Groups'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  width: 118, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#1a1a1a' : '#6b6b66', fontWeight: tab === t ? 500 : 400,
                  boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' : 'none',
                  transition: 'background .15s, box-shadow .15s, color .15s', whiteSpace: 'nowrap', textAlign: 'center',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          {/* Invisible trigger — no visual, but clickable (pointer on hover) */}
          <button onClick={() => onReveal?.()} aria-label="Reveal AI FDE" title=""
            style={{ width: 26, height: 36, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => isGroups ? setGroupModalOpen(true) : setCreateOpen(o => !o)} style={{
              background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
              padding: '0 14px 0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', transition: 'background .15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
              onMouseOut={e => e.currentTarget.style.background = '#16341f'}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
              {isGroups ? 'Create Group' : 'Create Skill'}
              {!isGroups && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1, transform: createOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            {!isGroups && createOpen && (
              <>
                <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41, width: 340, background: '#fff', border: '1px solid #ece5d7', borderRadius: 14, boxShadow: '0 18px 50px rgba(40,32,18,0.18)', overflow: 'hidden', padding: 6, animation: 'fdeFadeUp .16s ease-out' }}>
                  {CREATE_OPTIONS.map((o, i) => (
                    <div key={o.title} onClick={() => { setCreateOpen(false); if (o.action === 'ai') onBuildAI?.(); else if (o.action === 'scratch') onCreate?.(); else if (o.action === 'zip') zipInputRef.current?.click(); else if (o.action === 'library') onLibrary?.() }}
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
            <input ref={zipInputRef} type="file" accept=".zip,application/zip,application/x-zip-compressed" style={{ display: 'none' }}
              onChange={async e => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                try { const data = await parseSkillZip(f); onImportZip?.(data) }
                catch (err) { alert('Could not read that zip: ' + (err?.message || 'invalid file')) }
              }} />
          </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <Dropdown value={sort} options={['Last Updated', 'Name (A–Z)', 'Version', 'Status']} onChange={setSort} icon="sort" />
          <Dropdown value={statusFilter} options={['All status', 'Draft', 'In Approval', 'Live', 'Archived']} onChange={setStatusFilter} icon="filter" />
          <div style={{ flex: 1 }} />
          {!isGroups && (
            <div style={{ display: 'flex', background: '#f2f1ee', borderRadius: 9, padding: 3, gap: 2 }}>
              {[
                { id: 'default', title: 'Compact', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h10M3 11.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
                { id: 'expanded', title: 'Expanded', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.3" y="3" width="11.4" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.3" /><path d="M2.3 6.5h11.4M9.2 6.5V13" stroke="currentColor" strokeWidth="1.3" /></svg> },
              ].map(m => (
                <button key={m.id} onClick={() => setDensity(m.id)} title={m.title} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: density === m.id ? '#fff' : 'transparent', color: density === m.id ? '#1a1a1a' : '#9a948a',
                  boxShadow: density === m.id ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' : 'none', transition: 'all .15s',
                }}>{m.icon}</button>
              ))}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "Skill Groups" ? "Search groups" : "Search skills"}
              style={{ border: '1px solid #e3e6e3', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 210, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3e6e3'} />
          </div>
        </div>
      </div>

      {/* Table — inside a bordered box */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 26px 26px' }}>
        {tab === 'Skill Groups' ? (
          <GroupsTable rows={groupRows} sort={sort} onOpenGroup={onOpenGroup} />
        ) : (
        <div style={{ border: '1px solid #eaecea', borderRadius: 12, overflowX: density === 'expanded' ? 'auto' : 'hidden', overflowY: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', minWidth: density === 'expanded' ? EXPANDED_MIN_W : undefined, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#F7F5F3', zIndex: 1 }}>
                {(density === 'expanded' ? COLS_EXPANDED : COLS).map((c, ci) => {
                  const active = SORT_COL[sort] === c.key
                  return (
                  <th key={c.key} style={{
                    width: c.w, textAlign: 'left', padding: '10px 18px',
                    fontSize: 10.5, fontWeight: 600, color: active ? '#5b6066' : '#9aa0a6', letterSpacing: 1,
                    textTransform: 'uppercase', borderBottom: '1px solid #eaecea',
                    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                    paddingLeft: ci === 0 ? 22 : 18,
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {c.label}
                      {active
                        ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2.5 3.5L4.5 5.5 6.5 3.5" stroke="#16341f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2.5 5.5L4.5 7.5 6.5 5.5M2.5 3.5L4.5 1.5 6.5 3.5" stroke="#cfd2cd" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                  </th>
                  )
                })}
                <th style={{ width: 48, borderBottom: '1px solid #eaecea', background: '#F7F5F3' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const last = i === rows.length - 1
                const cell = { ...td, borderBottom: last ? 'none' : '1px solid #f1f2f1' }
                return (
                  <tr key={i} onClick={() => onOpenSkill?.(s)} style={{ cursor: 'pointer', background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                    {/* Skill Name */}
                    <td style={{ ...cell, paddingLeft: 22 }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    </td>
                    {/* Version — outlined mono chip */}
                    <td style={cell}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#8a7340', border: '1px solid #e7dcc1', background: '#faf5ea', padding: '2px 8px', borderRadius: 6 }}>{s.version}</span>
                    </td>
                    {/* Status — solid identity icon + label */}
                    <td style={cell}>
                      <StatusBadge status={s.status} />
                    </td>
                    {/* Shared with (both densities) */}
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
                        <SharedIcon type={s.sharedType} />{s.shared}
                      </span>
                    </td>
                    {/* Used By + Runs/month + Avg Cost + Latency + Success (expanded only) */}
                    {density === 'expanded' && (() => { const st = rowStat(s); const sc = st.success >= 95 ? '#1f7a40' : st.success >= 90 ? '#b07a16' : '#c0492f'; return (
                      <>
                        <td style={{ ...cell, fontSize: 13, color: '#374151' }}><span style={{ fontWeight: 600, color: '#1a1a1a' }}>{st.used}</span> agents</td>
                        <td style={cell}>
                          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{st.execs.toLocaleString()}</span>
                            {(() => { const up = st.delta >= 0; const c = up ? '#1f7a40' : '#c0492f'; return (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 600, color: c }}>
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ transform: up ? 'none' : 'rotate(180deg)' }}><path d="M5 8V2M5 2L2 5M5 2l3 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                {Math.abs(st.delta)}%
                              </span>
                            ) })()}
                          </span>
                        </td>
                      </>
                    ) })()}
                    {/* Owner */}
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', maxWidth: '100%' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 11.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{(s.owner || s.ownerInit || '?').charAt(0)}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.owner}</span>
                      </span>
                    </td>
                    {/* Last Updated */}
                    <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{s.updated}</td>
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
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No skills match your filters.</div>
          )}
        </div>
        )}
      </div>

      {groupModalOpen && <CreateGroupModal onClose={() => setGroupModalOpen(false)} onCreate={(g) => onOpenGroup?.(g)} />}
    </div>
  )
}

const GP = { stroke: '#7a6f5c', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
const GLYPHS = {
  chart:     <path d="M3 15V9M7 15V5M11 15v-7M15 15V3" {...GP} />,
  dollar:    <g {...GP}><circle cx="9" cy="9" r="6.5" /><path d="M9 5.5v7M7.3 7.2h2.4a1.3 1.3 0 010 2.6H8.3a1.3 1.3 0 000 2.6h2.4" /></g>,
  megaphone: <path d="M3 7.5v3a1.5 1.5 0 001.5 1.5H6l1 3h1.5l-.5-3 6 3V4.5L8 7.5H4.5A1.5 1.5 0 003 7.5Z" {...GP} />,
  headset:   <g {...GP}><path d="M3.5 10v-1a5.5 5.5 0 0111 0v1" /><rect x="2.5" y="9.5" width="3" height="4" rx="1" /><rect x="12.5" y="9.5" width="3" height="4" rx="1" /><path d="M14 13.5v.5a2 2 0 01-2 2H9.5" /></g>,
  code:      <path d="M6 6 3 9l3 3M12 6l3 3-3 3M10.5 4.5l-3 9" {...GP} />,
  person:    <g {...GP}><circle cx="9" cy="6" r="2.6" /><path d="M4 14.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" /></g>,
  scales:    <path d="M9 3v12M4.5 15h9M5 6l-2.5 4a2.5 2.5 0 005 0L5 6ZM13 6l-2.5 4a2.5 2.5 0 005 0L13 6ZM4 5.5l10-2" {...GP} />,
  sun:       <g {...GP}><circle cx="9" cy="9" r="2.4" /><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" /></g>,
  folder:    <path d="M2.5 5.5A1.5 1.5 0 014 4h3l1.5 2H14a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0114 15H4a1.5 1.5 0 01-1.5-1.5v-8Z" {...GP} />,
  star:      <path d="M9 2.5l2 4.2 4.6.6-3.4 3.1.9 4.5L9 12.8 4.9 14.9l.9-4.5L2.4 7.3l4.6-.6L9 2.5Z" {...GP} />,
  bolt:      <path d="M10 2.5L4.5 10H8.5l-1 5.5L13 8H9l1-5.5Z" {...GP} />,
  heart:     <path d="M9 14.5S3 11 3 6.8A3.3 3.3 0 019 4.6a3.3 3.3 0 016 2.2C15 11 9 14.5 9 14.5Z" {...GP} />,
  flag:      <path d="M4.5 15V3M4.5 4h7.5l-1.5 2.5L12 9H4.5" {...GP} />,
  rocket:    <path d="M9 2.5c2.5 1 4 3.5 4 6.5l-2 2H7l-2-2c0-3 1.5-5.5 4-6.5ZM7 13l-1.5 2M11 13l1.5 2" {...GP} />,
  gear:      <g {...GP}><circle cx="9" cy="9" r="2.4" /><path d="M9 2.2v1.6M9 14.2v1.6M2.2 9h1.6M14.2 9h1.6M4.3 4.3l1.1 1.1M12.6 12.6l1.1 1.1M4.3 13.7l1.1-1.1M12.6 5.4l1.1-1.1" /></g>,
  briefcase: <g {...GP}><rect x="3" y="6" width="12" height="8" rx="1.5" /><path d="M6.5 6V4.8A1.3 1.3 0 017.8 3.5h2.4a1.3 1.3 0 011.3 1.3V6M3 9.5h12" /></g>,
  globe:     <g {...GP}><circle cx="9" cy="9" r="6.4" /><path d="M2.6 9h12.8M9 2.6c1.8 1.7 1.8 11 0 12.8M9 2.6c-1.8 1.7-1.8 11 0 12.8" /></g>,
  shield:    <path d="M9 2.5l5 1.8v4c0 3.3-2.2 5.4-5 6.2-2.8-.8-5-2.9-5-6.2v-4L9 2.5Z" {...GP} />,
  book:      <path d="M3 4.2h4.5A1.5 1.5 0 019 5.7v8.6a1.2 1.2 0 00-1.2-1.2H3V4.2ZM15 4.2h-4.5A1.5 1.5 0 009 5.7v8.6a1.2 1.2 0 011.2-1.2H15V4.2Z" {...GP} />,
  bulb:      <g {...GP}><path d="M6.2 10.5a4 4 0 115.6 0c-.7.6-1 1.1-1.1 1.8H7.3c-.1-.7-.4-1.2-1.1-1.8Z" /><path d="M7.3 14h3.4M8 15.5h2" /></g>,
  target:    <g {...GP}><circle cx="9" cy="9" r="6.2" /><circle cx="9" cy="9" r="3.4" /><circle cx="9" cy="9" r=".8" fill="#7a6f5c" stroke="none" /></g>,
  puzzle:    <path d="M7 3.5a1.3 1.3 0 012.6 0c0 .5.4.8 1 .8H13v2.4c0 .6.3 1 .8 1a1.3 1.3 0 010 2.6c-.5 0-.8.4-.8 1V14H10c-.6 0-1-.4-1-1a1.3 1.3 0 00-2.6 0c0 .6-.4 1-1 1H3v-2.6c0-.6.4-.9.9-.9a1.3 1.3 0 000-2.6c-.5 0-.9-.3-.9-.9V4.3h2.4c.6 0 1-.3 1-.8Z" {...GP} />,
  tag:       <g {...GP}><path d="M3 3.5h5l6.5 6.5-4.5 4.5L3.5 8V3.5Z" /><circle cx="6" cy="6" r="1" /></g>,
  calendar:  <g {...GP}><rect x="3" y="4" width="12" height="11" rx="1.5" /><path d="M3 7h12M6 2.5V5M12 2.5V5" /></g>,
  chat:      <path d="M3 5.5A1.5 1.5 0 014.5 4h9A1.5 1.5 0 0115 5.5v5A1.5 1.5 0 0113.5 12H7l-3 2.5V12H4.5A1.5 1.5 0 013 10.5v-5Z" {...GP} />,
  cloud:     <path d="M5.5 13a3 3 0 01-.3-6A4 4 0 0113 7.5a2.75 2.75 0 01-.3 5.5H5.5Z" {...GP} />,
  database:  <g {...GP}><ellipse cx="9" cy="4.5" rx="5.5" ry="2" /><path d="M3.5 4.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M3.5 9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" /></g>,
  beaker:    <path d="M7 2.5h4M7.5 2.5v4L4 13a1.2 1.2 0 001.1 1.8h7.8A1.2 1.2 0 0014 13l-3.5-6.5v-4M6 10h6" {...GP} />,
  sparkle:   <path d="M9 2.5l1.3 3.7L14 7.5l-3.7 1.3L9 12.5 7.7 8.8 4 7.5l3.7-1.3L9 2.5ZM14 11.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" {...GP} />,
}
const GROUP_GLYPHS = [{ id: 'none' }, ...Object.keys(GLYPHS).map(id => ({ id }))]

function GroupGlyph({ id }) {
  const g = GLYPHS[id]
  if (!g) return null
  return <svg width="17" height="17" viewBox="0 0 18 18" fill="none">{g}</svg>
}

function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [icon, setIcon] = useState('none')
  const [pickerOpen, setPickerOpen] = useState(false)
  const canCreate = name.trim().length > 0
  const create = () => {
    if (!canCreate) return
    onCreate?.({
      id: 'grp-' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: name.trim(), icon: icon === 'none' ? 'sales' : icon, skills: 0,
      desc: desc.trim(), sharedBy: 'Only me', sharedType: 'private',
      createdBy: 'You', ci: 'YO', modified: 'just now',
    })
    onClose?.()
  }
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,24,18,0.34)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 480, maxWidth: '92vw', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 22px 16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Create skill group</div>
            <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2 }}>Organize related skills under one group</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div style={{ padding: '0 22px 4px' }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>Group name</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer Success"
            style={{ width: '100%', height: 42, border: '1px solid #e6ddca', borderRadius: 10, padding: '0 14px', fontSize: 14, color: '#3a3a36', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#e6ddca'} />

          {/* description */}
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', margin: '18px 0 7px' }}>Description <span style={{ color: '#a89e88', fontWeight: 400 }}>(optional)</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this group for?" rows={2}
            style={{ width: '100%', border: '1px solid #e6ddca', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#3a3a36', background: '#fff', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#e6ddca'} />
        </div>

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '18px 22px', marginTop: 12, borderTop: '1px solid #f2ede3' }}>
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={create} disabled={!canCreate} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: canCreate ? 'pointer' : 'default', opacity: canCreate ? 1 : 0.45 }}>Create group</button>
        </div>
      </div>
    </div>
  )
}

const td = { padding: '11px 18px', verticalAlign: 'middle', overflow: 'hidden' }
const SORT_COL = { 'Last Updated': 'updated', 'Name (A–Z)': 'name', 'Version': 'version', 'Status': 'status' }

/* ─── Skill Groups table ────────────────────────────────── */
function GroupsTable({ rows, sort, onOpenGroup }) {
  return (
    <div style={{ border: '1px solid #eaecea', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: '#F7F5F3', zIndex: 1 }}>
            {GROUP_COLS.map((c, ci) => {
              const active = SORT_COL[sort] === c.key
              return (
                <th key={c.key} style={{
                  width: c.w, textAlign: 'left', padding: '10px 18px',
                  fontSize: 10.5, fontWeight: 600, color: active ? '#5b6066' : '#9aa0a6', letterSpacing: 1,
                  textTransform: 'uppercase', borderBottom: '1px solid #eaecea',
                  whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', paddingLeft: ci === 0 ? 22 : 18,
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {c.label}
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2.5 5.5L4.5 7.5 6.5 5.5M2.5 3.5L4.5 1.5 6.5 3.5" stroke="#cfd2cd" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </th>
              )
            })}
            <th style={{ width: 48, borderBottom: '1px solid #eaecea', background: '#F7F5F3' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((g, i) => {
            const last = i === rows.length - 1
            const cell = { ...td, borderBottom: last ? 'none' : '1px solid #f1f2f1' }
            return (
              <tr key={i} onClick={() => onOpenGroup?.(g)} style={{ cursor: 'pointer', background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                {/* Group Name */}
                <td style={{ ...cell, paddingLeft: 22 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                </td>
                {/* Skills count — emphasized */}
                <td style={cell}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', lineHeight: 1 }}>{g.skills}</span>
                    <span style={{ fontSize: 12.5, color: '#9097a0', lineHeight: 1 }}>skills</span>
                  </span>
                </td>
                {/* Shared by */}
                <td style={cell}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
                    <SharedIcon type={g.sharedType} />{g.sharedBy}
                  </span>
                </td>
                {/* Created by */}
                <td style={cell}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 9.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.ci}</span>
                    {g.createdBy}
                  </span>
                </td>
                {/* Last Modified */}
                <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{g.modified}</td>
                {/* actions */}
                <td style={{ ...cell, textAlign: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="8" r="1.2" fill="#b8bcb8" /><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8" /></svg>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No skill groups match your search.</div>
      )}
    </div>
  )
}

export function GroupIcon({ name }) {
  const c = '#7a6f5c'
  const p = { stroke: c, strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
  const I = {
    sales:     <svg width="17" height="17" viewBox="0 0 18 18"><path d="M3 15V9M7 15V5M11 15v-7M15 15V3" {...p} /></svg>,
    finance:   <svg width="17" height="17" viewBox="0 0 18 18"><path d="M9 3v12" {...p} /><path d="M11.8 5.4A2.6 2.6 0 009.4 4H8.2a2.2 2.2 0 000 4.4h1.6a2.2 2.2 0 010 4.4H8.2a2.6 2.6 0 01-2.4-1.4" {...p} /></svg>,
    marketing: <svg width="17" height="17" viewBox="0 0 18 18"><path d="M3 7.5v3a1.5 1.5 0 001.5 1.5H6l1 3h1.5l-.5-3 6 3V4.5L8 7.5H4.5A1.5 1.5 0 003 7.5Z" {...p} /></svg>,
    support:   <svg width="17" height="17" viewBox="0 0 18 18"><path d="M3.5 10v-1a5.5 5.5 0 0111 0v1" {...p} /><rect x="2.5" y="9.5" width="3" height="4" rx="1" {...p} /><rect x="12.5" y="9.5" width="3" height="4" rx="1" {...p} /><path d="M14 13.5v.5a2 2 0 01-2 2H9.5" {...p} /></svg>,
    eng:       <svg width="17" height="17" viewBox="0 0 18 18"><path d="M6 6 3 9l3 3M12 6l3 3-3 3M10.5 4.5l-3 9" {...p} /></svg>,
    hr:        <svg width="17" height="17" viewBox="0 0 18 18"><circle cx="9" cy="6" r="2.6" {...p} /><path d="M4 14.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" {...p} /></svg>,
    legal:     <svg width="17" height="17" viewBox="0 0 18 18"><path d="M9 3v12M4.5 15h9M5 6l-2.5 4a2.5 2.5 0 005 0L5 6ZM13 6l-2.5 4a2.5 2.5 0 005 0L13 6ZM4 5.5l10-2" {...p} /></svg>,
    ops:       <svg width="17" height="17" viewBox="0 0 18 18"><circle cx="9" cy="9" r="2.4" {...p} /><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" {...p} /></svg>,
  }
  return I[name] || <svg width="17" height="17" viewBox="0 0 18 18"><path d="M2.5 5.5A1.5 1.5 0 014 4h3l1.5 2H14a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0114 15H4a1.5 1.5 0 01-1.5-1.5v-8Z" {...p} /></svg>
}

export function SharedIcon({ type }) {
  const c = '#a98c54' // warm gold/sand — neutral across all states
  // Everyone — solid gold globe, one clean meridian + equator
  if (type === 'org') return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
      <circle cx="8" cy="8" r="6.4" fill={c} />
      <g stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.92">
        <path d="M1.7 8h12.6" />
        <ellipse cx="8" cy="8" rx="2.7" ry="6.4" />
      </g>
    </svg>
  )
  // Only me — solid gold padlock with a white keyhole (squarer body)
  if (type === 'private') return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
      <path d="M4.6 7V5.1a3.4 3.4 0 0 1 6.8 0V7" stroke={c} strokeWidth="1.9" strokeLinecap="round" fill="none" />
      <rect x="2.8" y="6.9" width="10.4" height="7.5" rx="1.7" fill={c} />
    </svg>
  )
  // Team / Users — a single clean solid person, centered & symmetric
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
      <g fill={c}>
        <circle cx="8" cy="5.4" r="2.7" />
        <path d="M2.4 13.9c0-3 2.5-4.8 5.6-4.8s5.6 1.8 5.6 4.8a.4.4 0 0 1-.4.4H2.8a.4.4 0 0 1-.4-.4z" />
      </g>
    </svg>
  )
}

/* Reusable Create-Skill option menu (4 options) */
export function CreateSkillMenu({ onAction, style }) {
  return (
    <div style={{ width: 340, background: '#fff', border: '1px solid #ece5d7', borderRadius: 14, boxShadow: '0 18px 50px rgba(40,32,18,0.18)', overflow: 'hidden', padding: 6, animation: 'fdeFadeUp .16s ease-out', textAlign: 'left', ...style }}>
      {CREATE_OPTIONS.map(o => (
        <div key={o.title} onClick={() => onAction?.(o.action)}
          onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .12s' }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{o.title}</div>
            <div style={{ fontSize: 12, color: '#8a8170', marginTop: 2, lineHeight: 1.4 }}>{o.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dropdown({ value, options, onChange, icon }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...iconBtn, width: 'auto', padding: '0 12px', gap: 7, fontSize: 13, color: '#374151' }}>
        {icon === 'sort'
          ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3.5 4.5L5 3l1.5 1.5M5 3v7M9.5 8.5L8 10 6.5 8.5M8 10V3" stroke="#9298a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M3.5 6.5h6M5 9.5h3" stroke="#9298a0" strokeWidth="1.3" strokeLinecap="round" /></svg>}
        <StatusGlyph status={value} size={16} />
        {value}
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 3l3 3 3-3" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #e3e6e3', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 170, overflow: 'hidden' }}>
          {options.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: o === value ? '#1f7a40' : '#374151', background: o === value ? '#f0f8f2' : 'transparent' }}
              onMouseOver={e => { if (o !== value) e.currentTarget.style.background = '#f8f9f8' }}
              onMouseOut={e => { if (o !== value) e.currentTarget.style.background = 'transparent' }}><StatusGlyph status={o} size={16} />{o}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const iconBtn = { background: '#fff', border: '1px solid #e3e6e3', borderRadius: 8, height: 32, width: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'background .12s' }
const pageBtn = { background: '#fff', border: '1px solid #e3e6e3', borderRadius: 7, padding: '5px 12px', fontSize: 12.5, color: '#374151', cursor: 'pointer' }
