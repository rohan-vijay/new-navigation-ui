import { useState } from 'react'

/* Asks the user to describe the skill in natural language before launching AI FDE. */
export default function BuildWithAIModal({
  onClose, onSubmit,
  title = 'Build a skill with AI',
  cta = 'Build skill',
  placeholder = 'Describe the skill that you want to build with AI.\n\nExample: Handle post-call follow-up for my sales meetings — use the transcript, Salesforce record, email and Slack to draft a follow-up email and a CRM-ready deal summary.',
}) {
  const [desc, setDesc] = useState('')
  const submit = () => { const v = desc.trim(); if (v) onSubmit?.(v) }

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(28,24,18,0.40)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 680, maxWidth: '94vw', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', overflow: 'hidden', animation: 'fdeFadeUp .18s ease-out' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '20px 22px 14px' }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(16,52,31,0.22))' }}>
            <svg width="32" height="32" viewBox="0 0 29 29" fill="none">
              <path d="M1.43 12.8c0-3.98 0-5.97.78-7.5A6.4 6.4 0 015.3 2.2C6.83 1.42 8.82 1.42 12.8 1.42h2.85c3.98 0 5.97 0 7.5.78a6.4 6.4 0 013.1 3.1c.78 1.53.78 3.52.78 7.5v2.85c0 3.98 0 5.97-.78 7.5a6.4 6.4 0 01-3.1 3.1c-1.53.78-3.52.78-7.5.78H5.98c-1.6 0-2.39 0-3-.31a3 3 0 01-1.24-1.24c-.31-.61-.31-1.4-.31-3V12.8z" fill="url(#bwaGrad)" />
              <path d="M7.14 13.75a3.7 3.7 0 01.15-1.7 3.7 3.7 0 01.88-1.39l5.57 2.91-1.07-6.26a3.5 3.5 0 013.08 0l-1.07 6.26 5.53-2.91c.43.41.72.88.9 1.39.17.51.22 1.08.17 1.7l-6.25.92 4.5 4.59c-.43 1.09-1.27 1.7-2.53 1.85l-2.83-5.6-2.78 5.6c-1.26-.15-2.1-.76-2.53-1.85l4.46-4.59-6.21-.92h-.01z" fill="white" />
              <defs><radialGradient id="bwaGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(21.1 22.4 -5.97 19.25 4.54 4.62)"><stop stopColor="#6A763B" /><stop offset="1" stopColor="#17370B" /></radialGradient></defs>
            </svg>
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', height: 32 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: '#1a1a1a' }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* textarea */}
        <div style={{ padding: '0 22px 4px' }}>
          <textarea autoFocus value={desc} onChange={e => setDesc(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
            placeholder={placeholder}
            style={{ width: '100%', minHeight: 184, border: '1px solid #d8cfbb', borderRadius: 12, padding: '14px 16px', fontSize: 14.5, lineHeight: 1.55, color: '#3a3a36', background: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#d8cfbb'} />
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px 18px' }}>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!desc.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: desc.trim() ? 'pointer' : 'default', opacity: desc.trim() ? 1 : 0.45 }}
            onMouseOver={e => { if (desc.trim()) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (desc.trim()) e.currentTarget.style.background = '#16341f' }}>
            {cta}
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
