import { useState } from 'react'

export default function StatusBar({ aiOpen, onToggleAI }) {
  const [q, setQ] = useState('')
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', alignItems: 'center',
      padding: '8px 14px 0 14px',
      background: 'var(--green-sidebar)',
      gap: 14,
    }}>
      {/* subtle search box */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        height: 26, width: 280,
        padding: '0 10px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7,
        transition: 'border-color .15s, background .15s',
      }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="6" cy="6" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" />
          <path d="M10 10l3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search..."
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--sans)', fontSize: 12.5,
            color: 'rgba(255,255,255,0.85)',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleAI}
        title="Toggle Ask Unify"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--mono)', fontSize: 11,
          border: 'none', cursor: 'pointer',
          padding: '5px 10px', borderRadius: 6,
          background: aiOpen ? 'rgba(125,216,150,0.16)' : 'transparent',
          color: aiOpen ? '#9ee8b3' : 'rgba(255,255,255,0.6)',
          transition: 'background .15s, color .15s',
        }}
        onMouseOver={e => { if (!aiOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseOut={e => { if (!aiOpen) e.currentTarget.style.background = 'transparent' }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 0C9.38424 0 10.5765 -0.00018927 11.4951 0.445312C12.3933 0.880983 13.119 1.60666 13.5547 2.50488C14.0002 3.42349 14 4.61576 14 7C14 9.38424 14.0002 10.5765 13.5547 11.4951C13.119 12.3933 12.3933 13.119 11.4951 13.5547C10.5765 14.0002 9.38424 14 7 14H2.84473C1.84923 14 1.35097 14.0003 0.970703 13.8066C0.636193 13.6362 0.363801 13.3638 0.193359 13.0293C-0.000315126 12.649 0 12.1508 0 11.1553V7C0 4.61576 -0.00018927 3.42349 0.445312 2.50488C0.880983 1.60666 1.60666 0.880983 2.50488 0.445312C3.42349 -0.00018927 4.61576 0 7 0ZM7.85547 3.23535C7.27816 2.92153 6.69841 2.92165 6.12109 3.23535L6.72168 6.75684L3.59082 5.12109C3.35077 5.35261 3.18632 5.61295 3.09766 5.90234C3.00899 6.19174 2.98026 6.51015 3.0127 6.85742H3.01953L6.51172 7.37793L4.00586 9.95801C4.24591 10.5702 4.71958 10.9176 5.42676 11L6.99219 7.84961L8.58203 11C9.28689 10.9176 9.76291 10.5701 10.0029 9.95801L7.47266 7.37793L10.9883 6.85742C11.0186 6.5102 10.9889 6.1917 10.8916 5.90234C10.7943 5.61307 10.6256 5.35254 10.3857 5.12109L7.27734 6.75684L7.85547 3.23535Z" fill={aiOpen ? '#9ee8b3' : '#7dd896'} />
        </svg>
        AI FDE
      </button>
    </div>
  )
}
