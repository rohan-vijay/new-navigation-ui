import { useState } from 'react'
import AddToolPanel, { ToolGlyph } from './AddToolPanel'
import AddSkillPanel from './AddSkillPanel'

/* Model list — real brand icons (Claude + Gemini via Simple Icons CDN, OpenAI inline) */
export const MODELS = [
  { id: 'opus',     name: 'Claude Opus 4.5',   provider: 'claude', desc: 'Highest accuracy on complex, messy documents — fields that are nuanced, buried, or inconsistently formatted.' },
  { id: 'sonnet',   name: 'Claude Sonnet 4.5', provider: 'claude', desc: 'Balanced accuracy, speed, and cost — a strong default for most extraction workloads.' },
  { id: 'haiku',    name: 'Claude Haiku 4.5',  provider: 'claude', desc: 'Fastest and most economical Claude — ideal for high-volume, well-structured documents.' },
  { id: 'gpt5',     name: 'GPT-5',             provider: 'openai', desc: 'Strong step-by-step reasoning — good for ambiguous or multi-step extraction logic.' },
  { id: 'gpt4o',    name: 'GPT-4o',            provider: 'openai', desc: 'Multimodal and fast — best for scanned or image-based documents that need vision.' },
  { id: 'gem25pro', name: 'Gemini 2.5 Pro',    provider: 'gemini', desc: 'Very large context window — handles long contracts or many documents in one pass.' },
  { id: 'gem25fl',  name: 'Gemini 2.5 Flash',  provider: 'gemini', desc: 'Fast, low-cost, long-context — high-throughput batch extraction at scale.' },
]

export function ModelIcon({ provider, size = 17 }) {
  if (provider === 'openai') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#000" style={{ display: 'block' }}>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.1419.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  )
  const slug = provider === 'gemini' ? 'googlegemini' : 'claude'
  return <img src={`https://cdn.simpleicons.org/${slug}`} width={size} height={size} alt="" style={{ display: 'block', objectFit: 'contain' }} />
}

export const FIELD_TYPES = ['String', 'Number', 'Boolean', 'Date', 'Array', 'Object']

const PROMPT_PLACEHOLDER = `Describe exactly what to pull out and how.\n\nBest practices:\n• State the document type and the fields to extract\n• Define the format for each field (date as YYYY-MM-DD, amounts as numbers)\n• Say what to do when a value is missing (return null)\n\nExample: Extract the contract's parties, effective date, term length, and total value from the document. Return dates as YYYY-MM-DD and the value as a number. If a field is absent, return null.`

export const labelS = { fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 8 }
export const inputS = { width: '100%', height: 44, border: '1px solid #d8cfbb', borderRadius: 10, padding: '0 14px', fontSize: 14, color: '#3a3a36', background: '#fff', outline: 'none', boxSizing: 'border-box' }

/* ── Shared design tokens for a coherent builder ─────────────────────────── */
const FOCUS = '#16341f', BORDER = '#d8cfbb', BORDER_SOFT = '#eee7da'
const onFocus = e => { e.target.style.borderColor = FOCUS }
const onBlur = e => { e.target.style.borderColor = BORDER }

/* One add-row affordance, shared by Tools / Skills / Add field */
const addRowS = { width: '100%', height: 44, display: 'flex', alignItems: 'center', gap: 11, padding: '0 12px', borderRadius: 10, border: '1px solid ' + BORDER, background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s, background .15s' }
const addRowIcon = { width: 28, height: 28, borderRadius: 8, border: '1px solid ' + BORDER_SOFT, background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const addRowOver = e => { e.currentTarget.style.borderColor = FOCUS; e.currentTarget.style.background = '#fcfbf8' }
const addRowOut = e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#fff' }

/* Output-schema type glyphs — give each field type a small monospace chip */
const TYPE_META = {
  String: { g: 'Aa', c: '#3b6fb0' }, Number: { g: '#', c: '#b07d3b' }, Boolean: { g: '0/1', c: '#b04b3b' },
  Date: { g: '◷', c: '#3b8f5b' }, Array: { g: '[ ]', c: '#7a5bb0' }, Object: { g: '{ }', c: '#6b6256' },
}
function TypeGlyph({ type }) {
  const m = TYPE_META[type] || TYPE_META.String
  return <span style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid ' + BORDER_SOFT, background: '#faf8f3', color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{m.g}</span>
}

/* Numbered section header — gives the builder structure & a first-class feel */
function Section({ n, title, desc, children, first }) {
  return (
    <section style={{ marginTop: first ? 0 : 30, paddingTop: first ? 0 : 28, borderTop: first ? 'none' : '1px solid #efeae0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: desc ? 4 : 16 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: FOCUS, color: '#fff', fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: '#1a1a1a', lineHeight: 1.1 }}>{title}</span>
      </div>
      {desc && <div style={{ fontSize: 12.5, color: '#9a917f', margin: '0 0 16px 37px', lineHeight: 1.45 }}>{desc}</div>}
      <div style={{ marginLeft: 37 }}>{children}</div>
    </section>
  )
}

/* Controlled form body — used standalone and inside the AI builder */
export function AgentForm({ name, setName, prompt, setPrompt, model, setModel, fields, setFields, tools = [], setTools = () => {}, skills = [], setSkills = () => {}, autoFocusName = true }) {
  const [modelOpen, setModelOpen] = useState(false)
  const [toolPanel, setToolPanel] = useState(false)
  const [skillPanel, setSkillPanel] = useState(false)
  const cur = MODELS.find(m => m.id === model) || MODELS[0]
  const setField = (i, patch) => setFields(f => f.map((x, j) => j === i ? { ...x, ...patch } : x))
  const addField = () => setFields(f => [...f, { name: '', type: 'String' }])
  const removeField = (i) => setFields(f => f.filter((_, j) => j !== i))

  return (
    <>
      <label style={labelS}>Agent name</label>
      <input autoFocus={autoFocusName} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Contract Extraction"
        style={inputS} onFocus={onFocus} onBlur={onBlur} />

      <label style={{ ...labelS, marginTop: 16 }}>Extraction prompt</label>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={PROMPT_PLACEHOLDER}
        style={{ ...inputS, height: 'auto', minHeight: 240, padding: '12px 14px', lineHeight: 1.55, resize: 'vertical', fontFamily: 'inherit' }}
        onFocus={onFocus} onBlur={onBlur} />

      <label style={{ ...labelS, marginTop: 16 }}>Tools</label>
        {tools.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {tools.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 11px', border: '1px solid ' + BORDER_SOFT, borderRadius: 10, background: '#fff' }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', border: '1px solid ' + BORDER_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ToolGlyph slug={t.app.slug} name={t.app.name} icon={t.app.icon} size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.action?.name || t.app.name}</div>
                  <div style={{ fontSize: 11, color: '#9a917f' }}>{t.app.name}</div>
                </div>
                <button onClick={() => setTools(ts => ts.filter((_, j) => j !== i))} title="Remove" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#b3a888', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setToolPanel(true)} style={addRowS} onMouseOver={addRowOver} onMouseOut={addRowOut}>
          <span style={addRowIcon}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 3.2v9.6M3.2 8h9.6" stroke="#9a8c6a" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
          <span style={{ flex: 1, fontSize: 14, color: '#7a7468' }}>Add a tool</span>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M5 3.5L9.5 8 5 12.5" stroke="#8a8378" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {toolPanel && <AddToolPanel onClose={() => setToolPanel(false)} onAdd={t => setTools(ts => [...ts, t])} />}

        <label style={{ ...labelS, marginTop: 18 }}>Skills</label>
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {skills.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px', border: '1px solid ' + BORDER_SOFT, borderRadius: 10, background: '#fff' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#9a917f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</div>
                </div>
                <button onClick={() => setSkills(ss => ss.filter((_, j) => j !== i))} title="Remove" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#b3a888', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setSkillPanel(true)} style={addRowS} onMouseOver={addRowOver} onMouseOut={addRowOut}>
          <span style={addRowIcon}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 3.2v9.6M3.2 8h9.6" stroke="#9a8c6a" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
          <span style={{ flex: 1, fontSize: 14, color: '#7a7468' }}>Add a skill</span>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M5 3.5L9.5 8 5 12.5" stroke="#8a8378" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {skillPanel && <AddSkillPanel excludeIds={skills.map(s => s.id)} onClose={() => setSkillPanel(false)} onAdd={picked => setSkills(ss => [...ss, ...picked])} />}

        <label style={{ ...labelS, marginTop: 18 }}>LLM model</label>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setModelOpen(o => !o)} style={{ ...inputS, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}>
            <ModelIcon provider={cur.provider} size={18} />
            <span style={{ flex: 1, color: '#3a3a36' }}>{cur.name}</span>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {modelOpen && (
            <>
              <div onMouseDown={() => setModelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 6, background: '#fff', border: '1px solid #e7e0d2', borderRadius: 11, boxShadow: '0 16px 40px rgba(40,32,18,0.18)', padding: 5, maxHeight: 372, overflowY: 'auto' }} className="dark-scroll">
                {MODELS.map(m => (
                  <div key={m.id} onMouseDown={e => { e.preventDefault(); setModel(m.id); setModelOpen(false) }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 10px', borderRadius: 8, cursor: 'pointer', background: m.id === model ? '#f4f0e8' : 'transparent' }}
                    onMouseOver={e => { if (m.id !== model) e.currentTarget.style.background = '#f7f4ee' }}
                    onMouseOut={e => { if (m.id !== model) e.currentTarget.style.background = 'transparent' }}>
                    <span style={{ marginTop: 1, flexShrink: 0 }}><ModelIcon provider={m.provider} size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2f3a30' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#9a917f', marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
                    </div>
                    {m.id === model && <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ marginTop: 3, flexShrink: 0 }}><path d="M2.5 7.5l3 3 6-6.5" stroke="#16341f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      <label style={{ ...labelS, marginTop: 16, marginBottom: 0 }}>Output schema</label>
      <div style={{ fontSize: 12, color: '#9a917f', margin: '3px 0 9px' }}>Define the fields the agent should return.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={f.name} onChange={e => setField(i, { name: e.target.value })} placeholder="field_name"
              style={{ ...inputS, height: 38, flex: 1, fontFamily: 'var(--mono)', fontSize: 13 }}
              onFocus={onFocus} onBlur={onBlur} />
            <select value={f.type} onChange={e => setField(i, { type: e.target.value })}
              style={{ ...inputS, height: 38, width: 130, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M2.5 4.5L6 8l3.5-3.5\' stroke=\'%238a8378\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center' }}>
              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => removeField(i)} disabled={fields.length === 1} title="Remove field"
              style={{ width: 34, height: 38, borderRadius: 9, border: '1px solid #e3ddd1', background: '#fff', cursor: fields.length === 1 ? 'default' : 'pointer', opacity: fields.length === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#9a917f' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button onClick={addField} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#16341f', fontSize: 13, fontWeight: 500, padding: '2px 0' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#16341f" strokeWidth="1.6" strokeLinecap="round" /></svg>
        Add field
      </button>
    </>
  )
}

/* Canvas form bound to a draft object (the agent build bridge) — used during AI build */
export function AgentCanvas({ draft, title = 'Build agent with AI', onBack, onCreate }) {
  const { name, setName, prompt, setPrompt, model, setModel, fields, setFields, tools, setTools, skills, setSkills } = draft
  const valid = name.trim() && prompt.trim()
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 60, padding: '0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        <button onClick={() => onBack?.()} title="Back" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#5b5547" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>{title}</div>
        <button onClick={() => onBack?.()} style={{ height: 36, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => valid && onCreate?.()} disabled={!valid} style={{ height: 36, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: valid ? 'pointer' : 'default', opacity: valid ? 1 : 0.45, boxShadow: '0 1px 3px rgba(22,52,31,0.16)' }}
          onMouseOver={e => { if (valid) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (valid) e.currentTarget.style.background = '#16341f' }}>Create agent</button>
      </div>
      <div className="dark-scroll" style={{ flex: 1, overflowY: 'auto', padding: '26px 22px 40px' }}>
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <AgentForm name={name} setName={setName} prompt={prompt} setPrompt={setPrompt} model={model} setModel={setModel} fields={fields} setFields={setFields} tools={tools} setTools={setTools} skills={skills} setSkills={setSkills} autoFocusName={false} />
        </div>
      </div>
    </div>
  )
}

export default function CreateAgentPage({ onBack, onCreate, initialPrompt = '' }) {
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState(initialPrompt)
  const [model, setModel] = useState('sonnet')
  const [fields, setFields] = useState([{ name: '', type: 'String' }, { name: '', type: 'String' }])
  const [tools, setTools] = useState([])
  const [skills, setSkills] = useState([])
  const valid = name.trim() && prompt.trim()
  const submit = () => { if (valid) onCreate?.({ name: name.trim(), prompt: prompt.trim(), model, fields: fields.filter(f => f.name.trim()), tools, skills }) }

  return (
    <div style={{ flex: 1, minWidth: 0, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 60, padding: '0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        <button onClick={() => onBack?.()} title="Back" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e3ddd1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#5b5547" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>Create extraction agent</div>
        </div>
        <button onClick={() => onBack?.()} style={{ height: 36, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={submit} disabled={!valid} style={{ height: 36, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: valid ? 'pointer' : 'default', opacity: valid ? 1 : 0.45, boxShadow: '0 1px 3px rgba(22,52,31,0.16)' }}
          onMouseOver={e => { if (valid) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (valid) e.currentTarget.style.background = '#16341f' }}>
          Create agent
        </button>
      </div>

      <div className="dark-scroll" style={{ flex: 1, overflowY: 'auto', padding: '26px 22px 40px' }}>
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <AgentForm name={name} setName={setName} prompt={prompt} setPrompt={setPrompt} model={model} setModel={setModel} fields={fields} setFields={setFields} tools={tools} setTools={setTools} skills={skills} setSkills={setSkills} />
        </div>
      </div>
    </div>
  )
}
