import { useMemo, useState } from 'react'
import { ModelIcon } from './CreateAgentModal'
import { ToolGlyph } from './AddToolPanel'

const TG = { fill: 'none', stroke: '#8a7648', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
const DOC_GLYPH = <g {...TG}><rect x="4" y="2.5" width="12" height="15" rx="1.5" /><path d="M7 6.5h6M7 9.5h6M7 12.5h4" /></g>
const OCR_GLYPH = <g {...TG}><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><path d="M2.5 13l4-4 3 3 3-3 4.5 4.5" /><circle cx="7" cy="7.5" r="1.2" /></g>

// fields by document-type category
const CAT_FIELDS = {
  'Contracts & Agreements': [['parties', 'Array'], ['effective_date', 'Date'], ['term_length', 'String'], ['total_value', 'Number'], ['status', 'String']],
  'Invoices & Receipts': [['vendor', 'String'], ['invoice_number', 'String'], ['total', 'Number'], ['due_date', 'Date'], ['line_items', 'Array']],
  'Resumes & Applications': [['full_name', 'String'], ['email', 'String'], ['experience', 'Array'], ['skills', 'Array'], ['education', 'Array']],
  'Financial Statements': [['period', 'String'], ['revenue', 'Number'], ['expenses', 'Number'], ['net_income', 'Number']],
  'Forms & Records': [['form_type', 'String'], ['submitted_by', 'String'], ['fields', 'Object'], ['submitted_date', 'Date']],
  'Insurance & Claims': [['claimant', 'String'], ['claim_number', 'String'], ['incident_date', 'Date'], ['amount', 'Number'], ['status', 'String']],
  'Identity & Compliance': [['full_name', 'String'], ['document_number', 'String'], ['expiry_date', 'Date'], ['issuer', 'String']],
}

function synth(skill, catName) {
  const fields = CAT_FIELDS[catName] || [['title', 'String'], ['date', 'Date'], ['amount', 'Number'], ['summary', 'String']]
  const docType = (catName || 'document').toLowerCase().replace(/ ?& .*/, '').replace(/s$/, '')
  const prompt = `Read each ${docType} from the connected sources and extract the following fields: ${fields.map(f => f[0]).join(', ')}.\n\nFormatting rules:\n- Return dates as YYYY-MM-DD\n- Return amounts as plain numbers (no currency symbols)\n- If a field is missing, return null\n\nReturn a single JSON object that matches the output schema.`
  const tools = [
    { name: 'Document Parser', sub: 'Extract text & tables from files', icon: DOC_GLYPH },
    { name: 'OCR Engine', sub: 'Read scanned or image documents', icon: OCR_GLYPH },
  ]
  const skills = [
    { name: 'PDF Extractor', sub: 'Pull text and tables out of any PDF' },
    { name: 'Schema Validator', sub: 'Verify extracted fields against the schema' },
  ]
  return { name: skill.name, prompt, fields, tools, skills, model: { name: 'Claude Sonnet 4.5', provider: 'claude' } }
}

const TYPE_C = { String: '#3b6fb0', Number: '#b07d3b', Boolean: '#b04b3b', Date: '#3b8f5b', Array: '#7a5bb0', Object: '#6b6256' }
const NAV = [
  { id: 'instructions', label: 'Instructions', icon: <path d="M3.5 4.5h13M3.5 8h13M3.5 11.5h9M3.5 15h6" /> },
  { id: 'tools', label: 'Tools', icon: <path d="M11.5 3a3 3 0 00-4 4l-4 4a1.4 1.4 0 102 2l4-4a3 3 0 004-4l-2 2-1.5-.5L9 5l.5-2z" /> },
  { id: 'skills', label: 'Skills', icon: <path d="M9 2.5l1.7 4.3 4.3.3-3.3 2.7 1 4.2L9 11.8 5.3 14l1-4.2L3 7.1l4.3-.3L9 2.5z" /> },
]

export default function AgentPreviewModal({ entry, selected, onToggle, onClose }) {
  const { skill, cat } = entry
  const ag = useMemo(() => synth(skill, cat.cat), [skill, cat])
  const [tab, setTab] = useState('instructions')

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,24,18,0.36)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 1040, maxWidth: '94vw', height: '86vh', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
          <span style={{ width: 42, height: 42, borderRadius: 11, background: '#f6f3ec', border: '1px solid #ece5d7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="21" height="21" viewBox="0 0 18 18" fill="none"><path d="M4 1.5h5L13 5.5V16a.5.5 0 01-.5.5h-9A.5.5 0 013 16V2a.5.5 0 01.5-.5z" stroke="#8a7648" strokeWidth="1.3" strokeLinejoin="round" /><path d="M9 1.5V5.5h4M6 9h6M6 12h4" stroke="#8a7648" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.name}</div>
            <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.desc}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* left rail */}
          <div style={{ width: 244, flexShrink: 0, borderRight: '1px solid #efe9dd', background: '#fcfbf7', overflowY: 'auto', padding: '14px 12px' }}>
            {NAV.map(n => {
              const on = tab === n.id
              const count = n.id === 'tools' ? ag.tools.length : n.id === 'skills' ? ag.skills.length : null
              return (
                <div key={n.id} onClick={() => setTab(n.id)}
                  onMouseOver={e => { if (!on) e.currentTarget.style.background = '#f4f1ea' }} onMouseOut={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', background: on ? '#efe9dc' : 'transparent', marginBottom: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={on ? '#7a6a48' : '#9a917f'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? '#1a1a1a' : '#4a463e' }}>{n.label}</span>
                  {count != null && <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8a7648', background: '#f1ebdd', borderRadius: 20, padding: '1px 8px', minWidth: 20, textAlign: 'center', flexShrink: 0 }}>{count}</span>}
                </div>
              )
            })}
          </div>

          {/* main */}
          <div className="dark-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 30px' }}>
            {tab === 'instructions' && (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', marginBottom: 8 }}>Name</div>
                    <div style={{ ...box, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ag.name}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', marginBottom: 8 }}>Model</div>
                    <div style={{ ...box, display: 'flex', alignItems: 'center', gap: 9 }}>
                      <ModelIcon provider={ag.model.provider} size={18} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ag.model.name}</span>
                    </div>
                  </div>
                </div>
                <Field label="Extraction prompt"><pre style={{ ...box, margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ag.prompt}</pre></Field>
                <Field label="Output schema" last>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ag.fields.map(([fn, ft]) => (
                      <div key={fn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid #eee7da', borderRadius: 10, background: '#fff' }}>
                        <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, color: '#3a3a36' }}>{fn}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600, color: TYPE_C[ft] || '#6b6256', background: '#faf8f3', border: '1px solid #eee7da', padding: '2px 9px', borderRadius: 6 }}>{ft}</span>
                      </div>
                    ))}
                  </div>
                </Field>
              </>
            )}
            {tab === 'tools' && <RowList items={ag.tools} withIcon />}
            {tab === 'skills' && <RowList items={ag.skills} />}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Close</button>
          <button onClick={() => { onToggle(); onClose() }} style={{ height: 38, padding: '0 18px', background: selected ? '#fff' : 'var(--green-btn)', color: selected ? '#16341f' : '#fff', border: selected ? '1px solid #cdddd1' : 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
            {selected ? 'Remove from selection' : 'Add to selection'}
          </button>
        </div>
      </div>
    </div>
  )
}

const box = { width: '100%', border: '1px solid #e6ddca', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, color: '#3a3a36', background: '#fff', boxSizing: 'border-box' }

function Field({ label, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 22 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

function RowList({ items, withIcon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1px solid #eee7da', borderRadius: 11, background: '#fff' }}>
          {withIcon && <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ToolGlyph slug="__builtin" icon={t.icon} size={18} /></span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2a2620' }}>{t.name}</div>
            <div style={{ fontSize: 12, color: '#9a917f' }}>{t.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
