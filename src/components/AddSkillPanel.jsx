import { useState } from 'react'
import { SALES_SKILLS } from '../data/skills'
import { PreviewModal } from './SkillLibrary'

/* Right slide-in panel to attach pre-created skills to an agent.
   Each row has a text "View" affordance that opens the same Skill Library preview. */
export default function AddSkillPanel({ onClose, onAdd, excludeIds = [] }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(() => new Set())
  const [preview, setPreview] = useState(null) // skill object | null

  const rows = SALES_SKILLS
    .filter(s => !excludeIds.includes(s.id))
    .filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || (s.desc || '').toLowerCase().includes(q.toLowerCase()))
  const toggle = (id) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const add = () => { if (!picked.size) return; onAdd?.(SALES_SKILLS.filter(s => picked.has(s.id)).map(s => ({ id: s.id, name: s.name, desc: s.desc }))); onClose?.() }

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(28,24,18,0.34)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 520, maxWidth: '94vw', height: '100%', background: '#FEFDFB', borderLeft: '1px solid #ece5d7', boxShadow: '-18px 0 60px rgba(40,32,18,0.22)', display: 'flex', flexDirection: 'column', animation: 'toolSlide .22s cubic-bezier(.4,0,.2,1)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 20px 16px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Add a skill</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* body */}
        <div className="dark-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="7" cy="7" r="4.5" stroke="#a89e88" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search skills"
              style={{ width: '100%', height: 42, border: '1px solid #e6ddca', borderRadius: 10, padding: '0 12px 0 36px', fontSize: 13.5, color: '#3a3a36', background: '#faf7f0', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
            {rows.map((s, i) => {
              const on = picked.has(s.id)
              return (
                <div key={s.id} onClick={() => toggle(s.id)} className="ask-row"
                  onMouseOver={e => { if (!on) e.currentTarget.style.background = '#faf7f0'; e.currentTarget.querySelector('.ask-view').style.opacity = 1 }}
                  onMouseOut={e => { if (!on) e.currentTarget.style.background = '#fff'; e.currentTarget.querySelector('.ask-view').style.opacity = 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', cursor: 'pointer', borderBottom: i < rows.length - 1 ? '1px solid #f4eee2' : 'none', background: on ? '#f3f8f3' : '#fff', transition: 'background .12s' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</div>
                  </div>
                  <button className="ask-view" onClick={e => { e.stopPropagation(); setPreview(s) }}
                    style={{ opacity: 0, transition: 'opacity .12s', height: 30, padding: '0 12px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                    onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                    View
                  </button>
                  <span style={{ width: 19, height: 19, borderRadius: 6, border: '1.6px solid', borderColor: on ? '#16341f' : '#cdd5cf', background: on ? '#16341f' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.3 2.3L9.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                </div>
              )
            })}
            {rows.length === 0 && <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No skills found.</div>}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: picked.size ? '#3a3a36' : '#9a917f' }}>{picked.size ? <><strong style={{ fontWeight: 700, color: '#2a2620' }}>{picked.size}</strong> selected</> : 'No skills selected'}</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={add} disabled={!picked.size} style={{ height: 38, padding: '0 18px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: picked.size ? 'pointer' : 'default', opacity: picked.size ? 1 : 0.45 }}
            onMouseOver={e => { if (picked.size) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (picked.size) e.currentTarget.style.background = '#16341f' }}>
            {picked.size ? `Add ${picked.size} skill${picked.size > 1 ? 's' : ''}` : 'Add skills'}
          </button>
        </div>
      </div>

      {/* Reused Skill Library preview */}
      {preview && (
        <PreviewModal
          entry={{ skill: preview, cat: { cat: 'Sales', icon: 'sales' } }}
          selected={picked.has(preview.id)}
          onToggle={() => toggle(preview.id)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
