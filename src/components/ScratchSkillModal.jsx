import { useState } from 'react'

/* Captures a skill name + description before opening the blank editor.
   The description is what an agent reads to decide when to trigger the skill. */
export default function ScratchSkillModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const valid = name.trim() && desc.trim()
  const submit = () => { if (valid) onSubmit?.(name.trim(), desc.trim()) }

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(28,24,18,0.40)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 540, maxWidth: '94vw', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', overflow: 'hidden', animation: 'fdeFadeUp .18s ease-out' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 22px 14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: '#1a1a1a' }}>Create a skill</div>
            <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2 }}>Give your skill a name and help agents understand when to use it.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* fields */}
        <div style={{ padding: '0 22px 4px' }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>Skill name</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lead Qualifier"
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            style={{ width: '100%', height: 42, border: '1px solid #d8cfbb', borderRadius: 10, padding: '0 14px', fontSize: 14, color: '#3a3a36', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#d8cfbb'} />

          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', margin: '16px 0 7px' }}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe what this skill does and when it should be used.&#10;&#10;For example: Qualifies inbound leads against the ICP and routes high-priority leads to the right sales representative. Use when a new lead is created or when a user asks to qualify, prioritize, or route a lead."
            style={{ width: '100%', minHeight: 156, border: '1px solid #d8cfbb', borderRadius: 12, padding: '12px 14px', fontSize: 14, lineHeight: 1.5, color: '#3a3a36', background: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#d8cfbb'} />
        </div>

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px 18px', marginTop: 6, borderTop: '1px solid #f2ede3' }}>
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!valid} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: valid ? 'pointer' : 'default', opacity: valid ? 1 : 0.45 }}
            onMouseOver={e => { if (valid) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (valid) e.currentTarget.style.background = '#16341f' }}>
            Create skill
          </button>
        </div>
      </div>
    </div>
  )
}
