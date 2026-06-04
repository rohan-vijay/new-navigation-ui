import { useState, useRef } from 'react'
import { SALES_SKILLS } from '../data/skills'
import { GroupIcon, Dropdown, CreateSkillMenu } from './SkillsPage'
import { ShareDialog } from './SkillDetail'
import { parseSkillZip } from '../utils/importZip'

const STATUS_STYLE = {
  'Draft': { fg: '#6b7280', border: '#dadfda' },
  'In Approval': { fg: '#b07a16', border: '#ecdcae' },
  'Live': { fg: '#1f7a40', border: '#c2e3cd' },
  'Archived': { fg: '#8a7d6a', border: '#e2dccf' },
}

export default function SkillGroupDetail({ group, onBack, onOpenSkill, onCreate, onBuildAI, onLibrary, onImportZip }) {
  const [menu, setMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [createWhich, setCreateWhich] = useState(null) // 'header' | 'placeholder' | null
  const zipInputRef = useRef(null)
  const createAction = (action) => {
    setCreateWhich(null)
    if (action === 'ai') onBuildAI?.()
    else if (action === 'scratch') onCreate?.()
    else if (action === 'zip') zipInputRef.current?.click()
    else if (action === 'library') onLibrary?.()
  }
  const [sort, setSort] = useState('Last Updated')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState([])

  // representative skills in this group + any added during this session
  const base = [...SALES_SKILLS.slice(0, Math.min(group.skills, SALES_SKILLS.length)), ...added]
  const skills = base
    .filter(s => statusFilter === 'All status' || s.status === statusFilter)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => sort === 'Name (A–Z)' ? a.name.localeCompare(b.name) : sort === 'Version' ? b.version.localeCompare(a.version) : sort === 'Status' ? a.status.localeCompare(b.status) : 0)

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', height: 60, padding: '0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <button onClick={onBack} title="Back to Skill Groups" style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid #e6e0d4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.background = '#f5f1e8'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#6b6453" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{group.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginLeft: 16 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(o => !o)} title="More" style={{ ...btnGhost, width: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: menu ? '#faf8f3' : '#fff' }} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => { if (!menu) e.currentTarget.style.background = '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.2" r="1.3" fill="#6b6453" /><circle cx="8" cy="8" r="1.3" fill="#6b6453" /><circle cx="8" cy="12.8" r="1.3" fill="#6b6453" /></svg>
            </button>
            {menu && (
              <>
                <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 31, width: 176, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 14px 38px rgba(40,32,18,0.18)', padding: 5 }}>
                  {['Rename group', 'Duplicate', 'Manage access', 'Delete group'].map((label, i) => (
                    <div key={label} onClick={() => setMenu(false)}
                      onMouseOver={e => e.currentTarget.style.background = i === 3 ? '#fbf1ee' : '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      style={{ padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: i === 3 ? '#c0492f' : '#3a3a36', transition: 'background .1s' }}>{label}</div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={() => setShareOpen(true)} style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', gap: 8, paddingRight: 12 }} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <ShareTypeIcon type={group.sharedType} />
            Share
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1 }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setCreateWhich(w => w === 'header' ? null : 'header')} style={btnPrimary} onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6, verticalAlign: '-1px' }}><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
              Create Skill
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 5, transform: createWhich === 'header' ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {createWhich === 'header' && (
              <>
                <div onClick={() => setCreateWhich(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41 }}><CreateSkillMenu onAction={createAction} /></div>
              </>
            )}
          </div>
        </div>
      </div>
      <input ref={zipInputRef} type="file" accept=".zip,application/zip,application/x-zip-compressed" style={{ display: 'none' }}
        onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const data = await parseSkillZip(f); onImportZip?.(data) } catch (err) { alert('Could not read that zip: ' + (err?.message || 'invalid file')) } }} />

      {base.length === 0 ? (
        /* Empty stage */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: '#f6f3ec', border: '1px solid #ece5d7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M3 7.5A1.5 1.5 0 014.5 6H9l1.6 2H19.5A1.5 1.5 0 0121 9.5v8A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-10z" stroke="#bcae90" strokeWidth="1.4" strokeLinejoin="round" /><path d="M12 11.5v4M10 13.5h4" stroke="#bcae90" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>No skills in this group yet</div>
          <div style={{ fontSize: 13.5, color: '#8a8170', marginTop: 7, maxWidth: 380, lineHeight: 1.5 }}>
            Add skills to <strong style={{ fontWeight: 600, color: '#3a352b' }}>{group.name}</strong> to organize them together and share them as a set.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button onClick={() => setAddOpen(true)} style={{ ...btnGhost, height: 40, padding: '0 18px', display: 'inline-flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 7 }}><path d="M3 8.5l3 3 7-7.5" stroke="#4a463e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Add existing skills
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setCreateWhich(w => w === 'placeholder' ? null : 'placeholder')} style={{ ...btnPrimary, height: 40, padding: '0 20px' }} onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
                <svg width="14" height="14" viewBox="0 0 13 13" fill="none" style={{ marginRight: 7 }}><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
                Create skill
              </button>
              {createWhich === 'placeholder' && (
                <>
                  <div onClick={() => setCreateWhich(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41 }}><CreateSkillMenu onAction={createAction} /></div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 26px 14px', flexShrink: 0 }}>
        <Dropdown value={sort} options={['Last Updated', 'Name (A–Z)', 'Version', 'Status']} onChange={setSort} icon="sort" />
        <Dropdown value={statusFilter} options={['All status', 'Draft', 'In Approval', 'Live', 'Archived']} onChange={setStatusFilter} icon="filter" />
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills"
            style={{ border: '1px solid #e3e6e3', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 210, transition: 'border-color .15s' }}
            onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3e6e3'} />
        </div>
      </div>

      {/* Skills list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 26px 26px' }}>
        <div style={{ border: '1px solid #eaecea', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#F7F5F3' }}>
                {[['Skill Name', '30%'], ['Version', '13%'], ['Status', '15%'], ['Owner', '24%'], ['Last Updated', '18%']].map(([l, w]) => (
                  <th key={l} style={{ width: w, textAlign: 'left', padding: '12px 18px', fontSize: 10.5, fontWeight: 600, color: '#9aa0a6', letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid #eef0ee' }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((s, i) => {
                const st = STATUS_STYLE[s.status] || STATUS_STYLE.Draft
                const last = i === skills.length - 1
                const cell = { padding: '15px 18px', verticalAlign: 'middle', borderBottom: last ? 'none' : '1px solid #f1f2f1', overflow: 'hidden' }
                return (
                  <tr key={s.id} onClick={() => onOpenSkill?.(s)} style={{ cursor: 'pointer', background: '#fff', transition: 'background .12s, box-shadow .12s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.boxShadow = 'inset 3px 0 0 #16341f' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}>
                    <td style={{ ...cell, paddingLeft: 20 }}><span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{s.name}</span></td>
                    <td style={cell}><span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#8a7340', border: '1px solid #e7dcc1', background: '#faf5ea', padding: '2px 8px', borderRadius: 6 }}>{s.version}</span></td>
                    <td style={cell}><span style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${st.border}`, color: st.fg, fontSize: 12, fontWeight: 500, padding: '3px 11px', borderRadius: 6 }}>{s.status}</span></td>
                    <td style={cell}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 9.5, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.ownerInit}</span>{s.owner}</span></td>
                    <td style={{ ...cell, color: '#9097a0', fontSize: 13 }}>{s.updated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {skills.length === 0 && (
            <div style={{ padding: '54px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No skills match your filters.</div>
          )}
        </div>
      </div>
      </>
      )}

      {addOpen && <AddSkillsModal group={group} existing={base} onClose={() => setAddOpen(false)} onAdd={(skills) => { setAdded(a => [...a, ...skills]); setAddOpen(false) }} />}
      {shareOpen && <ShareDialog skill={{ name: group.name, owner: group.createdBy, ownerInit: group.ci, sharedType: group.sharedType }} onClose={() => setShareOpen(false)} />}
    </div>
  )
}

function AddSkillsModal({ group, existing, onClose, onAdd }) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState(() => new Set())
  const existingIds = new Set((existing || []).map(s => s.id))
  const rows = SALES_SKILLS
    .filter(s => !existingIds.has(s.id))
    .filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.desc?.toLowerCase().includes(query.toLowerCase()))
  const toggle = (id) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,24,18,0.34)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 720, maxWidth: '94vw', height: '80vh', maxHeight: 680, background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px 14px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Add skills to {group.name}</div>
            <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2 }}>Select one or more skills to add to this group</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {/* search */}
        <div style={{ padding: '0 22px 12px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="7" cy="7" r="4.6" stroke="#a89e88" strokeWidth="1.4" /><path d="M10.5 10.5l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search skills…"
              style={{ width: '100%', height: 42, border: '1px solid #ece5d7', borderRadius: 11, padding: '0 14px 0 36px', fontSize: 13.5, color: '#3a3a36', background: '#faf7f0', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#ece5d7'} />
          </div>
        </div>
        {/* list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>
          <div style={{ border: '1px solid #eee7da', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            {rows.map((s, i) => <AddSkillRow key={s.id} s={s} on={picked.has(s.id)} last={i === rows.length - 1} onToggle={() => toggle(s.id)} />)}
            {rows.length === 0 && (
              <div style={{ padding: '46px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No skills found.</div>
            )}
          </div>
        </div>
        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: '#8a8170' }}>{picked.size > 0 ? <><strong style={{ fontWeight: 700, color: '#2a2620' }}>{picked.size}</strong> selected</> : 'No skills selected'}</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (picked.size) onAdd?.(SALES_SKILLS.filter(s => picked.has(s.id))) }} disabled={picked.size === 0} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: picked.size ? 'pointer' : 'default', opacity: picked.size ? 1 : 0.45 }}>
            Add {picked.size || ''} {picked.size === 1 ? 'skill' : 'skills'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddSkillRow({ s, on, last, onToggle }) {
  const [hov, setHov] = useState(false)
  const st = STATUS_STYLE[s.status] || STATUS_STYLE.Draft
  return (
    <div onClick={onToggle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px', cursor: 'pointer', background: on ? '#f6f2ea' : hov ? '#faf7f0' : '#fff', borderBottom: last ? 'none' : '1px solid #f4eee2', transition: 'background .12s' }}>
      <span style={{ width: 19, height: 19, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#16341f' : '#fff', border: on ? '1.5px solid #16341f' : '1.5px solid #d8cfba' }}>
        {on && <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5L11 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{s.name}</div>
        <div style={{ fontSize: 12, color: '#8a8170', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.owner} · Updated {s.updated}</div>
      </div>
      {hov && <span style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${st.border}`, color: st.fg, fontSize: 11.5, fontWeight: 500, padding: '2px 9px', borderRadius: 6, flexShrink: 0 }}>{s.status}</span>}
    </div>
  )
}

function ShareTypeIcon({ type, c = '#4a463e' }) {
  if (type === 'org') return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.3" /><path d="M2 8h12M8 2c1.8 1.6 1.8 10.4 0 12M8 2c-1.8 1.6-1.8 10.4 0 12" stroke={c} strokeWidth="1.1" /></svg>
  if (type === 'private' || !type) return <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="7.2" rx="1.6" stroke={c} strokeWidth="1.3" /><path d="M5.9 8V5.9a3.1 3.1 0 016.2 0V8" stroke={c} strokeWidth="1.3" /></svg>
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="3.4" stroke={c} strokeWidth="1.7" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const btnGhost = { background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, padding: '0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(60,50,30,0.04)', transition: 'all .15s' }
const btnPrimary = { background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, padding: '0 18px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'all .15s' }
