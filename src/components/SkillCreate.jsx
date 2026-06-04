import { useState, useContext } from 'react'
import AddToolPanel, { ToolGlyph } from './AddToolPanel'
import { BuildContext } from './aiBuild'

const FILES = [
  { name: 'SKILL.MD',  type: 'file' },
  { name: 'references', type: 'folder', children: [] },
  { name: 'scripts',    type: 'folder', children: [] },
  { name: 'templates',  type: 'folder', children: [] },
]

const STARTER = `# Skill Name

## Description
A brief summary of what this skill does and the outcome it produces.
Keep it focused so agents know exactly when to reach for it.

## When to use
- Describe the trigger conditions for this skill
- Add the scenarios where it should activate

## Workflow
1. Step one — what the agent does first
2. Step two — follow-up actions
3. Step three — how it completes the task

## Best practices
- Keep instructions concise and unambiguous
- Reference files in /references for source material
`

function flattenContent(files) {
  const c = {}, l = {}
  for (const f of files) {
    if (f.type === 'folder') for (const ch of (f.children || [])) { c[ch.name] = ch.content ?? ''; l[ch.name] = ch.lang || 'text' }
    else { c[f.name] = f.content ?? ''; l[f.name] = f.lang || 'text' }
  }
  return { c, l }
}

export default function SkillCreate({ onBack, imported }) {
  const imp = imported && imported.files?.length ? imported : null
  const impFlat = imp ? flattenContent(imp.files) : { c: { 'SKILL.MD': STARTER }, l: { 'SKILL.MD': 'markdown' } }
  const firstSel = imp ? (imp.files.find(f => /^skill\.md$/i.test(f.name))?.name || imp.files[0].name) : 'SKILL.MD'

  // ── Optional AI build bridge: when active, this editor is driven by the AI panel ──
  const build = useContext(BuildContext)
  const buildOn = !!build?.active

  // Local state (always declared; used when not in AI-build mode)
  const [lSelected, lSetSelected] = useState(firstSel)
  const [lName, lSetName] = useState(imp ? imp.name : '')
  const [lContents, lSetContents] = useState(impFlat.c)
  const [lLangs] = useState(impFlat.l)
  const [lOpenFolders, lSetOpenFolders] = useState(imp ? Object.fromEntries(imp.files.filter(f => f.type === 'folder').map(f => [f.name, true])) : {})
  const [lFiles, lSetFiles] = useState(imp ? imp.files : FILES)
  const [lTools, lSetTools] = useState([])

  // Unified accessors (route to bridge when building)
  const selected = buildOn ? build.selected : lSelected
  const setSelected = buildOn ? build.setSelected : lSetSelected
  const name = buildOn ? build.name : lName
  const setName = buildOn ? build.setName : lSetName
  const contents = buildOn ? build.contents : lContents
  const setContents = buildOn ? build.setContents : lSetContents
  const langs = buildOn ? build.langs : lLangs
  const openFolders = buildOn ? build.openFolders : lOpenFolders
  const setOpenFolders = buildOn ? build.setOpenFolders : lSetOpenFolders
  const files = buildOn ? build.files : lFiles
  const setFiles = buildOn ? build.setFiles : lSetFiles
  const tools = buildOn ? build.tools : lTools
  const setTools = buildOn ? build.setTools : lSetTools

  const [editMode, setEditMode] = useState('markdown') // 'markdown' | 'rich'
  const content = contents[selected] ?? ''
  const setContent = (v) => setContents(c => ({ ...c, [selected]: v }))
  const [creating, setCreating] = useState(null) // { type: 'file' | 'folder', folder: string | null }
  const [panelHov, setPanelHov] = useState(false)
  const [toolPanel, setToolPanel] = useState(false)
  const addTool = (t) => setTools(ts => [...ts, t])
  const removeTool = (i) => setTools(ts => ts.filter((_, j) => j !== i))

  const startCreate = (type, folder) => {
    if (folder) setOpenFolders(o => ({ ...o, [folder]: true }))
    setCreating({ type, folder: folder || null })
  }
  const commitCreate = (raw) => {
    const nm = (raw || '').trim()
    if (nm && creating) {
      const finalName = creating.type === 'file' && !/\./.test(nm) ? `${nm}.md` : nm
      const item = { name: finalName, type: creating.type, ...(creating.type === 'folder' ? { children: [] } : {}) }
      if (creating.folder) {
        setFiles(fs => fs.map(f => f.name === creating.folder ? { ...f, children: [...(f.children || []), item] } : f))
      } else {
        setFiles(fs => [...fs, item])
      }
      if (creating.type === 'file') setSelected(finalName)
    }
    setCreating(null)
  }

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* ── Top bar: breadcrumb + actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 60, padding: '0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 17, color: '#9a8f7d', padding: 0 }}>Skills</button>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3l3.5 3.5L5 10" stroke="#c9c2b4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>{(buildOn && name) ? name : imp ? imp.name : 'New skill'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9,
            padding: '0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(60,50,30,0.04)', transition: 'all .15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#faf8f3'}
            onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            Save Draft
          </button>
          <button style={{
            background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
            padding: '0 20px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(22,52,31,0.28), 0 1px 2px rgba(0,0,0,0.1)', transition: 'all .15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
            onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
            Publish
          </button>
        </div>
      </div>

      {/* ── Body: one unified card (files + editor) ── */}
      <div style={{ flex: 1, display: 'flex', padding: '18px 22px 22px', overflow: 'hidden' }}>
        <div style={{
          flex: 1, display: 'flex', minWidth: 0,
          background: '#fff', border: '1px solid #efe9dd', borderRadius: 14,
          boxShadow: '0 1px 2px rgba(60,50,30,0.03), 0 10px 30px rgba(60,50,30,0.06)', overflow: 'hidden',
        }}>
          {/* Left panel */}
          <div onMouseEnter={() => setPanelHov(true)} onMouseLeave={() => setPanelHov(false)}
            style={{ width: 282, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', background: '#fcfbf7', borderRight: '1px solid #efe9dd', padding: '18px 16px' }}>
            {/* Files */}
            <Section title="Files" action={<AddMenu subtle visible={panelHov} onCreate={(type) => startCreate(type, null)} />}>
              {files.map(f => (
                <div key={f.name}>
                  <FileRow f={f}
                    selected={selected === f.name}
                    open={!!openFolders[f.name]}
                    onCreate={(type) => startCreate(type, f.name)}
                    onClick={() => f.type === 'file' ? setSelected(f.name) : setOpenFolders(o => ({ ...o, [f.name]: !o[f.name] }))} />
                  {f.type === 'folder' && openFolders[f.name] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                      {(f.children || []).map(c => (
                        <FileRow key={c.name} f={c} indent
                          selected={selected === c.name}
                          onClick={() => c.type === 'file' && setSelected(c.name)} />
                      ))}
                      {creating?.folder === f.name && <NewItemRow type={creating.type} indent onCommit={commitCreate} onCancel={() => setCreating(null)} />}
                    </div>
                  )}
                </div>
              ))}
              {creating && !creating.folder && <NewItemRow type={creating.type} onCommit={commitCreate} onCancel={() => setCreating(null)} />}
            </Section>
            {/* Tools */}
            <Section title="Tools" action={tools.length > 0 ? (
              <button onClick={() => setToolPanel(true)} title="Add tool" style={{ ...addBtn, width: 22, height: 22, border: '1px solid transparent', background: 'transparent', opacity: panelHov ? 1 : 0, pointerEvents: panelHov ? 'auto' : 'none', transition: 'opacity .15s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f1ede4'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            ) : null}>
              {tools.length === 0 ? (
                <button onClick={() => setToolPanel(true)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  border: '1px dashed #ddd6c8', borderRadius: 10, padding: '13px 14px',
                  fontSize: 13, color: '#a59c89', background: '#fff', cursor: 'pointer', transition: 'all .12s',
                }} onMouseOver={e => { e.currentTarget.style.background = '#faf7f0'; e.currentTarget.style.borderColor = '#cbbfa9' }} onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd6c8' }}>
                  Add a tool
                  <span style={addBtn}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tools.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', border: '1px solid #eee7da', borderRadius: 10, background: '#fff' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ToolGlyph slug={t.app.slug} name={t.app.name} icon={t.app.icon} size={17} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.action.name}</div>
                        <div style={{ fontSize: 11, color: '#9a917f' }}>{t.app.name}</div>
                      </div>
                      <button onClick={() => removeTool(i)} title="Remove" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#b3a888', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {/* editor header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px 12px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5h5L13 5.5V14a.5.5 0 01-.5.5h-8A.5.5 0 014 14V1.5z" stroke="#7a6a48" strokeWidth="1.2" strokeLinejoin="round" /><path d="M9 1.5V5.5h4" stroke="#7a6a48" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: '#1a1a1a' }}>{selected === 'SKILL.MD' ? 'Skill.MD' : selected}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#a59c89', background: '#f5f1e8', padding: '2px 8px', borderRadius: 5, marginLeft: 2 }}>{langs[selected] || 'markdown'}</span>
              <div style={{ flex: 1 }} />
              {/* view toggle: rich text (eye) | markdown (code) */}
              <div style={{ display: 'flex', background: '#f3f0e9', border: '1px solid #e9e2d4', borderRadius: 9, padding: 3, gap: 2 }}>
                {[
                  { id: 'rich', title: 'Rich text', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M1.5 9s2.6-4.5 7.5-4.5S16.5 9 16.5 9s-2.6 4.5-7.5 4.5S1.5 9 1.5 9z" stroke="currentColor" strokeWidth="1.4" /><circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" /></svg> },
                  { id: 'markdown', title: 'Markdown', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M6.5 5L3 9l3.5 4M11.5 5L15 9l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                ].map(m => (
                  <button key={m.id} onClick={() => setEditMode(m.id)} title={m.title} style={{
                    width: 34, height: 28, border: 'none', borderRadius: 7, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: editMode === m.id ? '#fff' : 'transparent',
                    color: editMode === m.id ? '#3a342a' : '#a59c89',
                    boxShadow: editMode === m.id ? '0 1px 2px rgba(60,50,30,0.12), 0 0 0 1px rgba(60,50,30,0.04)' : 'none',
                    transition: 'all .15s',
                  }}>{m.icon}</button>
                ))}
              </div>
              <FileOptionsMenu />
            </div>
            {/* editor body */}
            {editMode === 'markdown' ? (
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* gutter */}
                <div style={{ width: 44, flexShrink: 0, borderRight: '1px solid #f4efe6', padding: '16px 0', textAlign: 'right', background: '#fdfcf9' }}>
                  {content.split('\n').map((_, i) => (
                    <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: '22px', color: '#cfc7b6', paddingRight: 12 }}>{i + 1}</div>
                  ))}
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} spellCheck={false}
                  style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', padding: '16px 20px',
                    fontFamily: 'var(--mono)', fontSize: 13, lineHeight: '22px', color: '#3a3a36', background: 'transparent' }} />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 36px' }}>
                <RichMarkdown content={content} />
              </div>
            )}
          </div>
        </div>
      </div>

      {toolPanel && <AddToolPanel onClose={() => setToolPanel(false)} onAdd={addTool} />}
    </div>
  )
}

function Section({ title, action, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, padding: '2px 2px' }}>
        <span onClick={() => setOpen(o => !o)} style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#7a7468', letterSpacing: 0.2, cursor: 'pointer' }}>{title}</span>
        {action}
      </div>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</div>}
    </div>
  )
}

/* shared "+" add menu (New file / New folder / Upload) */
function AddMenu({ onCreate, subtle, visible = true }) {
  const [open, setOpen] = useState(false)
  const show = visible || open
  return (
    <div style={{ position: 'relative', flexShrink: 0, opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none', transition: 'opacity .15s' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} title="Add" style={{
        ...addBtn, width: 22, height: 22, border: open ? '1px solid #e0d8c6' : (subtle ? '1px solid transparent' : '1px solid #e6dfd1'),
        background: open ? '#f3efe6' : (subtle ? 'transparent' : '#fff'), transition: 'all .12s',
      }} onMouseOver={e => { if (!open && subtle) e.currentTarget.style.background = '#f1ede4' }} onMouseOut={e => { if (!open && subtle) e.currentTarget.style.background = 'transparent' }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 31, width: 184, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 12px 34px rgba(40,32,18,0.16)', padding: 5 }}>
            {[
              { id: 'file', label: 'New file', icon: <path d="M4 1.5h5L13 5.5V14a.5.5 0 01-.5.5h-8A.5.5 0 014 14V1.5z M9 1.5V5.5h4" stroke="#7a6f5c" strokeWidth="1.2" strokeLinejoin="round" fill="none" /> },
              { id: 'folder', label: 'New folder', icon: <path d="M1.8 4.2A1.2 1.2 0 013 3h3l1.3 1.6H13a1.2 1.2 0 011.2 1.2v6.4A1.2 1.2 0 0113 13.4H3a1.2 1.2 0 01-1.2-1.2V4.2z" stroke="#7a6f5c" strokeWidth="1.2" strokeLinejoin="round" fill="none" /> },
              { id: 'sep' },
              { id: 'upload', label: 'Upload', icon: <path d="M8 10.5V3M5.2 5.3L8 2.5l2.8 2.8M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="#7a6f5c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
            ].map(o => o.id === 'sep' ? (
              <div key="sep" style={{ height: 1, background: '#f2ede3', margin: '5px 4px' }} />
            ) : (
              <div key={o.id} onClick={() => { setOpen(false); if (o.id !== 'upload') onCreate?.(o.id) }}
                onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#3a3a36', transition: 'background .1s' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">{o.icon}</svg>
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const FOPT = { stroke: '#6b6453', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
function FileOptionsMenu() {
  const [open, setOpen] = useState(false)
  const items = [
    { id: 'rename', label: 'Rename', icon: <path d="M9.5 3.2l3.3 3.3M2.5 13.5l.5-2.6 7-7 2.1 2.1-7 7-2.6.5z" {...FOPT} /> },
    { id: 'duplicate', label: 'Duplicate', icon: <g {...FOPT}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V4A1.5 1.5 0 009 2.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5" /></g> },
    { id: 'download', label: 'Download', icon: <path d="M8 2.5v7M5 6.5l3 3 3-3M3 12.5h10" {...FOPT} /> },
    { id: 'copypath', label: 'Copy path', icon: <path d="M6.5 9.5l3-3M6.8 4.5l1-1a2.5 2.5 0 013.6 3.6l-1 1M9.2 11.5l-1 1a2.5 2.5 0 01-3.6-3.6l1-1" {...FOPT} /> },
    { id: 'sep' },
    { id: 'delete', label: 'Delete', danger: true, icon: <path d="M3 4.5h10M6 4.5V3.2A1 1 0 017 2.2h2a1 1 0 011 1v1.3M5 4.5l.6 8a1 1 0 001 .9h2.8a1 1 0 001-.9l.6-8" stroke="#c0492f" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
  ]
  return (
    <div style={{ position: 'relative', marginLeft: 2 }}>
      <button onClick={() => setOpen(o => !o)} title="File options" style={{
        width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid', borderColor: open ? '#e0d8c6' : 'transparent', background: open ? '#f5f1e8' : 'transparent', transition: 'all .12s',
      }} onMouseOver={e => { if (!open) e.currentTarget.style.background = '#f5f1e8' }} onMouseOut={e => { if (!open) e.currentTarget.style.background = 'transparent' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.2" r="1.3" fill="#6b6453" /><circle cx="8" cy="8" r="1.3" fill="#6b6453" /><circle cx="8" cy="12.8" r="1.3" fill="#6b6453" /></svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 31, width: 188, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 14px 38px rgba(40,32,18,0.18)', padding: 5 }}>
            {items.map(a => a.id === 'sep' ? (
              <div key="sep" style={{ height: 1, background: '#f2ede3', margin: '5px 4px' }} />
            ) : (
              <div key={a.id} onClick={() => setOpen(false)}
                onMouseOver={e => e.currentTarget.style.background = a.danger ? '#fbf1ee' : '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: a.danger ? '#c0492f' : '#3a3a36', transition: 'background .1s' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">{a.icon}</svg>
                {a.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NewItemRow({ type, indent, onCommit, onCancel }) {
  const [val, setVal] = useState('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', paddingLeft: indent ? 28 : 10, borderRadius: 9, background: '#f5f1e8', boxShadow: 'inset 0 0 0 1px #e6ddca' }}>
      {type === 'folder'
        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.8 4.2A1.2 1.2 0 013 3h3l1.3 1.6H13a1.2 1.2 0 011.2 1.2v6.4A1.2 1.2 0 0113 13.4H3a1.2 1.2 0 01-1.2-1.2V4.2z" stroke="#8a8378" strokeWidth="1.2" strokeLinejoin="round" /></svg>
        : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5h5L13 5.5V14a.5.5 0 01-.5.5h-8A.5.5 0 014 14V1.5z" stroke="#8a8378" strokeWidth="1.2" strokeLinejoin="round" /><path d="M9 1.5V5.5h4" stroke="#8a8378" strokeWidth="1.2" strokeLinejoin="round" /></svg>}
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onCommit(val); if (e.key === 'Escape') onCancel() }}
        onBlur={() => onCommit(val)}
        placeholder={type === 'folder' ? 'folder name' : 'file name'}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }} />
    </div>
  )
}

function FileRow({ f, selected, open, indent, onClick, onCreate }) {
  const [hov, setHov] = useState(false)
  const [menu, setMenu] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', paddingLeft: indent ? 28 : 10, borderRadius: 9, cursor: 'pointer',
        background: selected ? 'linear-gradient(180deg,#f5f1e8,#efe9dd)' : hov ? '#f7f4ee' : 'transparent',
        boxShadow: selected ? 'inset 0 0 0 1px #e6ddca, 0 1px 2px rgba(60,50,30,0.05)' : 'none',
        transition: 'background .12s',
      }}>
      {f.type === 'file'
        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5h5L13 5.5V14a.5.5 0 01-.5.5h-8A.5.5 0 014 14V1.5z" stroke={selected ? '#7a6a48' : '#8a8378'} strokeWidth="1.2" strokeLinejoin="round" /><path d="M9 1.5V5.5h4" stroke={selected ? '#7a6a48' : '#8a8378'} strokeWidth="1.2" strokeLinejoin="round" /></svg>
        : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.8 4.2A1.2 1.2 0 013 3h3l1.3 1.6H13a1.2 1.2 0 011.2 1.2v6.4A1.2 1.2 0 0113 13.4H3a1.2 1.2 0 01-1.2-1.2V4.2z" stroke="#8a8378" strokeWidth="1.2" strokeLinejoin="round" /></svg>}
      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: selected ? 600 : 500, color: selected ? '#1a1a1a' : '#4a463e' }}>{f.name}</span>
      {f.type === 'folder' && (
        <>
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ ...addBtn, opacity: (hov || menu) ? 1 : 0, pointerEvents: (hov || menu) ? 'auto' : 'none', background: menu ? '#f3efe6' : '#fff', transition: 'opacity .12s' }} onClick={() => setMenu(m => !m)} title="Add">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            {menu && (
              <>
                <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 31, width: 184, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 12px 34px rgba(40,32,18,0.16)', padding: 5 }}>
                  {[
                    { id: 'file', label: 'New file', icon: <path d="M4 1.5h5L13 5.5V14a.5.5 0 01-.5.5h-8A.5.5 0 014 14V1.5z M9 1.5V5.5h4" stroke="#7a6f5c" strokeWidth="1.2" strokeLinejoin="round" fill="none" /> },
                    { id: 'folder', label: 'New folder', icon: <path d="M1.8 4.2A1.2 1.2 0 013 3h3l1.3 1.6H13a1.2 1.2 0 011.2 1.2v6.4A1.2 1.2 0 0113 13.4H3a1.2 1.2 0 01-1.2-1.2V4.2z" stroke="#7a6f5c" strokeWidth="1.2" strokeLinejoin="round" fill="none" /> },
                    { id: 'sep' },
                    { id: 'upload', label: 'Upload', icon: <path d="M8 10.5V3M5.2 5.3L8 2.5l2.8 2.8M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="#7a6f5c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
                  ].map(o => o.id === 'sep' ? (
                    <div key="sep" style={{ height: 1, background: '#f2ede3', margin: '5px 4px' }} />
                  ) : (
                    <div key={o.id} onClick={() => { setMenu(false); if (o.id === 'file' || o.id === 'folder') onCreate?.(o.id) }}
                      onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#3a3a36', transition: 'background .1s' }}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">{o.icon}</svg>
                      {o.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
            <path d="M5 3l3.5 3.5L5 10" stroke="#b3ab99" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </>
      )}
    </div>
  )
}

const addBtn = { width: 24, height: 24, background: '#fff', border: '1px solid #e6dfd1', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

/* ── Rich-text rendering of the markdown ── */
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, j) => {
    if (seg.startsWith('**') && seg.endsWith('**')) return <strong key={j} style={{ fontWeight: 600, color: '#1a1a1a' }}>{seg.slice(2, -2)}</strong>
    if (seg.startsWith('`') && seg.endsWith('`')) return <code key={j} style={{ fontFamily: 'var(--mono)', fontSize: 13, background: '#f3f1ea', color: '#6a5a32', padding: '1px 5px', borderRadius: 4 }}>{seg.slice(1, -1)}</code>
    return seg
  })
}

export function RichMarkdown({ content }) {
  const out = []
  content.split('\n').forEach((line, i) => {
    const t = line.trimEnd()
    if (!t.trim()) { out.push(<div key={i} style={{ height: 10 }} />); return }
    if (t.startsWith('# ')) out.push(<div key={i} style={{ fontFamily: 'var(--serif)', fontSize: 27, fontWeight: 600, color: '#1a1a1a', margin: '0 0 6px', letterSpacing: -0.3 }}>{inline(t.slice(2))}</div>)
    else if (t.startsWith('## ')) out.push(<div key={i} style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, color: '#1a1a1a', margin: '20px 0 8px' }}>{inline(t.slice(3))}</div>)
    else if (t.startsWith('### ')) out.push(<div key={i} style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '16px 0 6px' }}>{inline(t.slice(4))}</div>)
    else if (/^-\s/.test(t)) out.push(<div key={i} style={{ display: 'flex', gap: 12, margin: '5px 0', fontSize: 14.5, lineHeight: 1.6, color: '#3a3a36' }}><span style={{ color: '#b3a888' }}>•</span><span>{inline(t.slice(2))}</span></div>)
    else if (/^\d+\.\s/.test(t)) { const m = t.match(/^(\d+)\.\s(.*)/); out.push(<div key={i} style={{ display: 'flex', gap: 11, margin: '5px 0', fontSize: 14.5, lineHeight: 1.6, color: '#3a3a36' }}><span style={{ color: '#7a6a48', fontWeight: 600, minWidth: 16 }}>{m[1]}.</span><span>{inline(m[2])}</span></div>) }
    else out.push(<p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3a3a36', margin: '5px 0' }}>{inline(t)}</p>)
  })
  return <div style={{ maxWidth: 760 }}>{out}</div>
}
