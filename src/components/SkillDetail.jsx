import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RichMarkdown } from './SkillCreate'
import HistoryPanel from './HistoryPanel'
import { GROUPS, GroupIcon } from './SkillsPage'

const STATUS_STYLE = {
  'Draft': { fg: '#6b7280', border: '#dadfda' },
  'In Approval': { fg: '#b07a16', border: '#ecdcae' },
  'Live': { fg: '#1f7a40', border: '#c2e3cd' },
  'Archived': { fg: '#8a7d6a', border: '#e2dccf' },
}
const LANG_LABEL = { markdown: 'markdown', python: 'python', json: 'json' }

function CopyRefButton({ text, visible }) {
  const [copied, setCopied] = useState(false)
  const copy = (e) => {
    e.stopPropagation()
    try { navigator.clipboard?.writeText(text || '') } catch (_) { /* noop */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} title="Copy reference text" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, cursor: 'pointer',
      border: '1px solid', borderColor: copied ? '#c2e3cd' : 'transparent', background: copied ? '#eef6f0' : 'transparent',
      opacity: visible || copied ? 1 : 0, pointerEvents: visible || copied ? 'auto' : 'none', transition: 'opacity .12s, background .12s',
    }} onMouseOver={e => { if (!copied) e.currentTarget.style.background = '#f5f1e8' }} onMouseOut={e => { if (!copied) e.currentTarget.style.background = 'transparent' }}>
      {copied
        ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l2.5 2.5L12.5 4" stroke="#1f7a40" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="#6b6453" strokeWidth="1.3" /><path d="M10.5 5.5V4A1.5 1.5 0 009 2.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5" stroke="#6b6453" strokeWidth="1.3" /></svg>}
    </button>
  )
}

function ShareTypeIcon({ type, c = '#4a463e' }) {
  if (type === 'org') return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.3" /><path d="M2 8h12M8 2c1.8 1.6 1.8 10.4 0 12M8 2c-1.8 1.6-1.8 10.4 0 12" stroke={c} strokeWidth="1.1" /></svg>
  if (type === 'private' || !type) return <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="7.2" rx="1.6" stroke={c} strokeWidth="1.3" /><path d="M5.9 8V5.9a3.1 3.1 0 016.2 0V8" stroke={c} strokeWidth="1.3" /></svg>
  // team / teams / users — people group
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="3.4" stroke={c} strokeWidth="1.7" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const FA = { stroke: '#6b6453', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
const SKILL_ACTIONS = [
  { id: 'rename', label: 'Rename', icon: <path d="M9.5 3.2l3.3 3.3M2.5 13.5l.5-2.6 7-7 2.1 2.1-7 7-2.6.5z" {...FA} /> },
  { id: 'duplicate', label: 'Duplicate', icon: <g {...FA}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V4A1.5 1.5 0 009 2.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5" /></g> },
  { id: 'history', label: 'Activity log', icon: <g {...FA}><circle cx="3.6" cy="4" r="1.1" /><path d="M6.5 4h7" /><circle cx="3.6" cy="8" r="1.1" /><path d="M6.5 8h7" /><circle cx="3.6" cy="12" r="1.1" /><path d="M6.5 12h7" /></g> },
  { id: 'versions', label: 'Version history', icon: <g {...FA}><circle cx="8" cy="8" r="6.3" /><path d="M8 4.6V8l2.3 1.4" /></g> },
  { id: 'export', label: 'Export as .zip', icon: <path d="M8 2.5v7M5 6.5l3 3 3-3M3 12.5h10" {...FA} /> },
  { id: 'move', label: 'Move to group', icon: <path d="M2.5 5.5A1.2 1.2 0 013.7 4.3H6l1.2 1.4h5.1a1.2 1.2 0 011.2 1.2v5.4a1.2 1.2 0 01-1.2 1.2H3.7a1.2 1.2 0 01-1.2-1.2V5.5z" {...FA} /> },
  { id: 'sep', key: 'sep1' },
  { id: 'delete', label: 'Delete skill', danger: true, icon: <path d="M3 4.5h10M6 4.5V3.2A1 1 0 017 2.2h2a1 1 0 011 1v1.3M5 4.5l.6 8a1 1 0 001 .9h2.8a1 1 0 001-.9l.6-8" stroke="#c0492f" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
]
const FILE_ACTIONS = [
  { id: 'rename', label: 'Rename', icon: <path d="M9.5 3.2l3.3 3.3M2.5 13.5l.5-2.6 7-7 2.1 2.1-7 7-2.6.5z" {...FA} /> },
  { id: 'duplicate', label: 'Duplicate', icon: <g {...FA}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V4A1.5 1.5 0 009 2.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5" /></g> },
  { id: 'download', label: 'Download', icon: <path d="M8 2.5v7M5 6.5l3 3 3-3M3 12.5h10" {...FA} /> },
  { id: 'copypath', label: 'Copy path', icon: <path d="M6.5 9.5l3-3M6.8 4.5l1-1a2.5 2.5 0 013.6 3.6l-1 1M9.2 11.5l-1 1a2.5 2.5 0 01-3.6-3.6l1-1" {...FA} /> },
  { id: 'sep', key: 'sep1' },
  { id: 'delete', label: 'Delete', danger: true, icon: <path d="M3 4.5h10M6 4.5V3.2A1 1 0 017 2.2h2a1 1 0 011 1v1.3M5 4.5l.6 8a1 1 0 001 .9h2.8a1 1 0 001-.9l.6-8" stroke="#c0492f" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
]

function flatten(files) {
  const map = {}
  files.forEach(f => {
    if (f.type === 'file') map[f.name] = { ...f, path: f.name, folder: null }
    else (f.children || []).forEach(c => { map[`${f.name}/${c.name}`] = { ...c, path: `${f.name}/${c.name}`, folder: f.name } })
  })
  return map
}

/* ── LCS line diff ────────────────────────────────────────── */
function lineDiff(oldStr, newStr) {
  const a = (oldStr == null ? '' : oldStr).split('\n')
  const b = (newStr == null ? '' : newStr).split('\n')
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: 'same', text: a[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: 'del', text: a[i] }); i++ }
    else { out.push({ t: 'add', text: b[j] }); j++ }
  }
  while (i < n) out.push({ t: 'del', text: a[i++] })
  while (j < m) out.push({ t: 'add', text: b[j++] })
  return out
}
const lineCount = (rows) => rows.some(r => r.t !== 'same')

export default function SkillDetail({ skill, onBack, onTest }) {
  const fileMap = useMemo(() => flatten(skill.files), [skill])
  const [selected, setSelected] = useState('SKILL.md')
  const [openFolders, setOpenFolders] = useState({ scripts: true })
  const [editMode, setEditMode] = useState('markdown')
  const [contents, setContents] = useState(() =>
    Object.fromEntries(Object.values(fileMap).map(f => [f.path, f.content])))

  const versions = skill.versions || []
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareType, setShareType] = useState(skill.sharedType || 'private')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [allVersionsOpen, setAllVersionsOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [dupOpen, setDupOpen] = useState(false)
  const [skillName, setSkillName] = useState(skill.name)
  const [toast, setToast] = useState(null)
  const [headHov, setHeadHov] = useState(false)
  const [skillMenu, setSkillMenu] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const exportZip = () => {
    setToast(`Preparing ${skillName}.zip — your download will start shortly…`)
    setTimeout(() => setToast(`${skillName}.zip is ready — check your downloads.`), 2600)
    setTimeout(() => setToast(null), 5200)
  }
  const [fileMenu, setFileMenu] = useState(false)
  const [diffIdx, setDiffIdx] = useState(null) // index into versions, or null = live/current
  const [restoreOpen, setRestoreOpen] = useState(false)

  const diffVer = diffIdx != null ? versions[diffIdx] : null
  const prevVer = diffVer ? versions[diffIdx + 1] : null
  const prevFiles = prevVer ? prevVer.files : (diffVer ? {} : null)

  // per-file add/del counts for the version being viewed
  const fileDiffs = useMemo(() => {
    if (!diffVer) return null
    const out = {}
    const paths = new Set([...Object.keys(diffVer.files), ...Object.keys(prevFiles || {})])
    paths.forEach(p => {
      const d = lineDiff(prevFiles?.[p], diffVer.files[p])
      const add = d.filter(x => x.t === 'add').length
      const del = d.filter(x => x.t === 'del').length
      if (add || del) out[p] = { add, del }
    })
    return out
  }, [diffVer, prevFiles])

  const enterDiff = (idx) => {
    setDiffIdx(idx)
    setVersionsOpen(false)
    // jump to the first changed file
    const changed = versions[idx]
    const prev = versions[idx + 1]?.files || {}
    const firstChanged = Object.keys(changed.files).find(p => lineCount(lineDiff(prev[p], changed.files[p])))
    if (firstChanged) setSelected(firstChanged)
  }
  const exitDiff = () => { setDiffIdx(null) }

  const file = fileMap[selected]
  const st = STATUS_STYLE[skill.status] || STATUS_STYLE.Draft
  // in diff mode, content comes from the selected version (read-only)
  const content = diffVer ? (diffVer.files[selected] ?? '') : (contents[selected] ?? '')
  const diffRows = diffVer ? lineDiff(prevFiles?.[selected], diffVer.files[selected]) : null
  const setContent = (v) => setContents(c => ({ ...c, [selected]: v }))

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', height: 60, padding: '0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <button onClick={onBack} title="Back to Skills" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid #e6e0d4', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background .12s' }}
            onMouseOver={e => e.currentTarget.style.background = '#f5f1e8'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#6b6453" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{skillName}</span>
          {diffVer ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4, border: '1px solid #ecd8a8', color: '#9a6a16', background: '#fbf3e0', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="#b07a16" strokeWidth="1.3" /><path d="M8 4.6V8l2.3 1.4" stroke="#b07a16" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Viewing {diffVer.version}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, border: `1px solid ${st.border}`, color: st.fg, fontSize: 11.5, fontWeight: 500, padding: '2px 10px', borderRadius: 6 }}>{skill.status}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, marginLeft: 16 }}>
          {diffVer ? (
            <>
              <button style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, flexShrink: 0,
                height: 36, padding: '0 18px', whiteSpace: 'nowrap', cursor: 'pointer',
                background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9,
                fontSize: 13.5, fontWeight: 500, boxShadow: '0 1px 2px rgba(60,50,30,0.04)', transition: 'background .15s',
              }} onClick={() => setRestoreOpen(true)} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 1 1.6 3.7" stroke="#6b6453" strokeWidth="1.4" strokeLinecap="round" /><path d="M3 4.5V8h3.5" stroke="#6b6453" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Restore {diffVer.version}
              </button>
              <button onClick={exitDiff} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, flexShrink: 0,
                height: 36, padding: '0 20px', whiteSpace: 'nowrap', cursor: 'pointer',
                background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
                fontSize: 13.5, fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'background .15s',
              }} onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3.5a4.5 4.5 0 1 0 4.4 5.5M8 3.5V1.5M8 3.5l2 1.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to live
              </button>
            </>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setSkillMenu(o => !o)} title="More" style={{ ...btnGhost, width: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: skillMenu ? '#faf8f3' : '#fff' }} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => { if (!skillMenu) e.currentTarget.style.background = '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.2" r="1.3" fill="#4a463e" /><circle cx="8" cy="8" r="1.3" fill="#4a463e" /><circle cx="8" cy="12.8" r="1.3" fill="#4a463e" /></svg>
                </button>
                {skillMenu && (
                  <>
                    <div onClick={() => setSkillMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 31, width: 196, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 14px 38px rgba(40,32,18,0.18)', padding: 5 }}>
                      {SKILL_ACTIONS.map(a => a.id === 'sep' ? (
                        <div key={a.key} style={{ height: 1, background: '#f2ede3', margin: '5px 4px' }} />
                      ) : (
                        <div key={a.id} onClick={() => { setSkillMenu(false); if (a.id === 'history') setHistoryOpen(true); else if (a.id === 'versions') setAllVersionsOpen(true); else if (a.id === 'move') setMoveOpen(true); else if (a.id === 'rename') setRenameOpen(true); else if (a.id === 'duplicate') setDupOpen(true); else if (a.id === 'analytics') setAnalyticsOpen(true); else if (a.id === 'export') exportZip() }}
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
              <button onClick={() => onTest?.()} title="Test skill" style={{ ...btnGhost, width: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5 3.2v3.1L2.4 11a1.4 1.4 0 001.2 2.1h8.8A1.4 1.4 0 0013.6 11L11 6.3V3.2" stroke="#4a463e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M4.3 3.2h7.4" stroke="#4a463e" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.4 9.2h3.2" stroke="#4a463e" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </button>
              <button onClick={() => setShareOpen(true)} style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', gap: 8, paddingRight: 12 }} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                <ShareTypeIcon type={shareType} />
                Share
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 1 }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button style={btnGhost} onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>Save Draft</button>
              <button style={btnPrimary} onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>Publish</button>
            </>
          )}
        </div>
      </div>

      {/* Diff-mode notice strip */}
      {diffVer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 22px', background: '#fbf3e0', borderBottom: '1px solid #f0e3c4', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.6l6.4 11.1a.6.6 0 01-.5.9H2.1a.6.6 0 01-.5-.9L8 1.6z" stroke="#b07a16" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6.2v3.1" stroke="#b07a16" strokeWidth="1.4" strokeLinecap="round" /><circle cx="8" cy="11.3" r=".75" fill="#b07a16" /></svg>
          <span style={{ fontSize: 13, color: '#7a5a14' }}>
            You're viewing an older version <strong style={{ fontWeight: 600 }}>{diffVer.version}</strong> — this is not the live version. Changes shown are relative to {prevVer ? prevVer.version : 'an empty file'}.
          </span>
        </div>
      )}

      {/* Body: unified card (files + viewer) — or Analytics */}
      <div style={{ flex: 1, display: 'flex', padding: '18px 22px 22px', overflow: 'hidden' }}>
        {analyticsOpen ? <SkillAnalytics skill={skill} name={skillName} onBack={() => setAnalyticsOpen(false)} /> : (
        <div style={{ flex: 1, display: 'flex', minWidth: 0, background: '#fff', border: '1px solid #efe9dd', borderRadius: 14, boxShadow: '0 1px 2px rgba(60,50,30,0.03), 0 10px 30px rgba(60,50,30,0.06)', overflow: 'hidden' }}>
          {/* Left tree */}
          <div style={{ width: 282, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fcfbf7', borderRight: '1px solid #efe9dd', position: 'relative' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', padding: '18px 14px' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#7a7468', letterSpacing: 0.2, marginBottom: 8, padding: '0 4px' }}>Files</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {skill.files.map(f => f.type === 'file' ? (
                    <FileItem key={f.name} name={f.name} lang={f.lang} selected={selected === f.name} badge={fileDiffs?.[f.name]} onClick={() => setSelected(f.name)} />
                  ) : (
                    <FolderBlock key={f.name} folder={f} open={!!openFolders[f.name]} selected={selected} diffs={fileDiffs}
                      onToggle={() => setOpenFolders(o => ({ ...o, [f.name]: !o[f.name] }))}
                      onSelect={(path) => setSelected(path)} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#7a7468', letterSpacing: 0.2, marginBottom: 8, padding: '0 4px' }}>Tools</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed #ddd6c8', borderRadius: 10, padding: '13px 14px', fontSize: 13, color: '#a59c89', background: '#fff' }}>
                  No tools added
                  {!diffVer && <button style={addBtn}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" /></svg></button>}
                </div>
              </div>
            </div>

            {/* Version footer + popover */}
            <VersionFooter versions={versions} diffIdx={diffIdx} open={versionsOpen}
              onToggle={() => setVersionsOpen(o => !o)} onPick={enterDiff} onLive={exitDiff} onViewAll={() => setAllVersionsOpen(true)} />
          </div>

          {/* Viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {/* viewer header */}
            <div onMouseEnter={() => setHeadHov(true)} onMouseLeave={() => setHeadHov(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px 12px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
              <FileGlyph selected />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{file?.name}</span>
              <CopyRefButton text={content} visible={headHov} />
              {diffVer && fileDiffs?.[selected] && (
                <span style={{ display: 'inline-flex', gap: 7, fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600 }}>
                  <span style={{ color: '#1f7a40' }}>+{fileDiffs[selected].add}</span>
                  <span style={{ color: '#c0492f' }}>−{fileDiffs[selected].del}</span>
                </span>
              )}
              <div style={{ flex: 1 }} />
              {diffVer && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#8a8378', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span>{prevVer ? prevVer.version : 'empty'}</span>
                  <svg width="13" height="11" viewBox="0 0 13 11" fill="none"><path d="M1 5.5h10M7.5 2l3.5 3.5L7.5 9" stroke="#b3a888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span style={{ color: '#3a342a', fontWeight: 600 }}>{diffVer.version}</span>
                </span>
              )}
              {!diffVer && (
                <div style={{ position: 'relative', marginRight: 2 }}>
                  <button onClick={() => setFileMenu(o => !o)} title="File options" style={{
                    width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid', borderColor: fileMenu ? '#e0d8c6' : 'transparent', background: fileMenu ? '#f5f1e8' : 'transparent', transition: 'all .12s',
                  }} onMouseOver={e => { if (!fileMenu) e.currentTarget.style.background = '#f5f1e8' }} onMouseOut={e => { if (!fileMenu) e.currentTarget.style.background = 'transparent' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.2" r="1.3" fill="#6b6453" /><circle cx="8" cy="8" r="1.3" fill="#6b6453" /><circle cx="8" cy="12.8" r="1.3" fill="#6b6453" /></svg>
                  </button>
                  {fileMenu && (
                    <>
                      <div onClick={() => setFileMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 31, width: 188, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 14px 38px rgba(40,32,18,0.18)', padding: 5 }}>
                        {FILE_ACTIONS.map(a => a.id === 'sep' ? (
                          <div key={a.key} style={{ height: 1, background: '#f2ede3', margin: '5px 4px' }} />
                        ) : (
                          <div key={a.id} onClick={() => setFileMenu(false)}
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
              )}
              {!diffVer && file?.lang === 'markdown' && (
                <div style={{ display: 'flex', background: '#f3f0e9', border: '1px solid #e9e2d4', borderRadius: 9, padding: 3, gap: 2 }}>
                  {[
                    { id: 'rich', title: 'Rich text', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M1.5 9s2.6-4.5 7.5-4.5S16.5 9 16.5 9s-2.6 4.5-7.5 4.5S1.5 9 1.5 9z" stroke="currentColor" strokeWidth="1.4" /><circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" /></svg> },
                    { id: 'markdown', title: 'Markdown', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M6.5 5L3 9l3.5 4M11.5 5L15 9l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                  ].map(m => (
                    <button key={m.id} onClick={() => setEditMode(m.id)} title={m.title} style={{
                      width: 34, height: 28, border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: editMode === m.id ? '#fff' : 'transparent', color: editMode === m.id ? '#3a342a' : '#a59c89',
                      boxShadow: editMode === m.id ? '0 1px 2px rgba(60,50,30,0.12), 0 0 0 1px rgba(60,50,30,0.04)' : 'none', transition: 'all .15s',
                    }}>{m.icon}</button>
                  ))}
                </div>
              )}
            </div>
            {/* viewer body */}
            {diffVer ? (
              <DiffView key={selected + diffVer.id} rows={diffRows} lang={file?.lang} />
            ) : file?.lang === 'markdown' && editMode === 'rich' ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 36px' }}><RichMarkdown content={content} /></div>
            ) : file?.lang === 'markdown' ? (
              <div key={selected} style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div style={{ width: 48, flexShrink: 0, borderRight: '1px solid #f4efe6', padding: '16px 0', textAlign: 'right', background: '#fdfcf9', overflow: 'hidden' }}>
                  {content.split('\n').map((_, i) => (
                    <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: '22px', color: '#cfc7b6', paddingRight: 12 }}>{i + 1}</div>
                  ))}
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} spellCheck={false}
                  style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', padding: '16px 22px', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: '22px', color: '#3a3a36', background: 'transparent', whiteSpace: 'pre', overflow: 'auto' }} />
              </div>
            ) : (
              <div key={selected} style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'auto', background: '#fff' }}>
                <div style={{ width: 48, flexShrink: 0, borderRight: '1px solid #f4efe6', padding: '16px 0', textAlign: 'right', background: '#fdfcf9' }}>
                  {content.split('\n').map((_, i) => (
                    <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: '22px', color: '#cfc7b6', paddingRight: 12 }}>{i + 1}</div>
                  ))}
                </div>
                <pre style={{ flex: 1, margin: 0, padding: '16px 22px', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: '22px', color: '#3a3a36', whiteSpace: 'pre' }}>
                  {highlight(content, file?.lang)}
                </pre>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {restoreOpen && diffVer && (
        <RestoreModal skillName={skillName} version={diffVer.version} liveVersion={versions[0]?.version || skill.version}
          onClose={() => setRestoreOpen(false)}
          onConfirm={() => {
            const v = diffVer.version
            setRestoreOpen(false); exitDiff()
            setToast(`Restoring “${skillName}” to ${v} — a new version is publishing from it.`)
            setTimeout(() => setToast(null), 4000)
          }} />
      )}
      {shareOpen && <ShareDialog skill={skill} initialType={shareType} onTypeChange={setShareType} onClose={() => setShareOpen(false)} />}
      {historyOpen && <HistoryPanel skill={skill} onClose={() => setHistoryOpen(false)} />}
      {allVersionsOpen && (
        <AllVersionsPanel versions={versions} diffIdx={diffIdx}
          onPick={(i) => { enterDiff(i); setAllVersionsOpen(false) }}
          onLive={() => { exitDiff(); setAllVersionsOpen(false) }}
          onClose={() => setAllVersionsOpen(false)} />
      )}
      {moveOpen && <MoveToGroupModal skill={{ ...skill, name: skillName }} onClose={() => setMoveOpen(false)} />}
      {renameOpen && <RenameModal name={skillName} onClose={() => setRenameOpen(false)} onSave={(n) => { setSkillName(n); setRenameOpen(false) }} />}
      {dupOpen && <DuplicateModal skill={{ ...skill, name: skillName }} onClose={() => setDupOpen(false)} onDone={() => { setDupOpen(false); setToast(`Created a copy of "${skillName}".`); setTimeout(() => setToast(null), 3600) }} />}
      {toast && <Toast text={toast} />}
    </div>
  )
}

/* ── Full-plate analytics view for a single skill ── */
function rng32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

function SkillAnalytics({ skill, name, onBack }) {
  const seed = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) + 7
  const rnd = rng32(seed)
  const ri = (lo, hi) => Math.floor(lo + rnd() * (hi - lo + 1))

  // 14-day run series (success / failed / in-progress)
  const DAYS = 14
  const series = Array.from({ length: DAYS }, () => {
    const total = ri(34, 86)
    const failed = Math.round(total * (ri(4, 16) / 100))
    const inprog = ri(0, 3)
    return { success: total - failed - inprog, failed, inprog, total }
  })
  const sum = (k) => series.reduce((a, s) => a + s[k], 0)
  const totalRuns = sum('total'), totalFailed = sum('failed'), totalSuccess = sum('success')
  const errorRate = +(totalFailed / totalRuns * 100).toFixed(1)
  const successRate = +(100 - errorRate).toFixed(1)
  const errDelta = ri(-22, 14) / 10           // pts change vs prev period (negative = improving)
  const runDelta = ri(-12, 22)
  const p50 = +(ri(6, 14) / 10).toFixed(1), p90 = +(ri(20, 34) / 10).toFixed(1), p95 = +(ri(34, 54) / 10).toFixed(1), p99 = +(ri(60, 96) / 10).toFixed(1)
  const avgCost = +(0.03 + ri(1, 14) / 100).toFixed(2)
  const periodCost = +(totalRuns * avgCost).toFixed(0)
  const costDelta = ri(-14, 22)
  const successColor = successRate >= 95 ? '#1f7a40' : successRate >= 90 ? '#b07a16' : '#c0492f'

  // failure reasons (sum ≈ totalFailed)
  const reasonDefs = [
    { label: 'Tool / integration error', w: 0.40, color: '#c0492f' },
    { label: 'Timeout', w: 0.22, color: '#d98a3a' },
    { label: 'Output validation failed', w: 0.18, color: '#b07a16' },
    { label: 'Rate limited', w: 0.12, color: '#8a7648' },
    { label: 'Unhandled exception', w: 0.08, color: '#9a5a6a' },
  ]
  const reasons = reasonDefs.map(r => ({ ...r, count: Math.max(1, Math.round(totalFailed * r.w)), trend: ri(-30, 30) }))

  // where it fails — top steps
  const STEPS = ['Fetch CRM record', 'Score model call', 'Compose summary', 'Post to Slack', 'Schema validate']
  const failSteps = STEPS.map(s => ({ s, fails: ri(2, 40), rate: ri(1, 18) })).sort((a, b) => b.fails - a.fails).slice(0, 4)

  // cost breakdown
  const costParts = [
    { label: 'LLM — scoring', color: '#16341f' },
    { label: 'LLM — drafting', color: '#3e7a52' },
    { label: 'Embeddings', color: '#a98c54' },
    { label: 'Tool calls', color: '#cbb88a' },
  ].map((c, i) => ({ ...c, pct: [42, 31, 16, 11][i] + ri(-3, 3) }))
  const costTotalPct = costParts.reduce((a, c) => a + c.pct, 0)

  // top agents
  const AGENTS = ['Pipeline Reviewer', 'Deal Desk Copilot', 'Forecast Agent', 'Account Planner', 'Renewal Watch']
  const usedBy = 3 + (seed % 4)
  const agents = AGENTS.slice(0, Math.min(5, usedBy)).map(a => {
    const runs = ri(40, 460)
    return { name: a, runs, success: ri(86, 99), p95: +(ri(18, 56) / 10).toFixed(1) }
  }).sort((a, b) => b.runs - a.runs)

  // recent failures
  const WHEN = ['3 min ago', '41 min ago', '2 hours ago', '5 hours ago', 'Yesterday']
  const failures = WHEN.map((w, i) => ({
    when: w, agent: AGENTS[ri(0, AGENTS.length - 1)],
    reason: reasonDefs[ri(0, reasonDefs.length - 1)].label, dur: +(ri(3, 60) / 10).toFixed(1),
  }))

  const maxTotal = Math.max(...series.map(s => s.total))
  const maxLat = p99

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff', border: '1px solid #efe9dd', borderRadius: 14, boxShadow: '0 1px 2px rgba(60,50,30,0.03), 0 10px 30px rgba(60,50,30,0.06)', overflow: 'hidden' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
        <button onClick={onBack} title="Back to editor" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #e6e0d4', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M10 3.5L5.5 8l4.5 4.5" stroke="#6b6453" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>Analytics</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#6b6453', border: '1px solid #e6dfd1', borderRadius: 8, padding: '6px 11px', background: '#fcfbf7' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="9" rx="1.4" stroke="#8a8378" strokeWidth="1.2" /><path d="M2 5.5h10M4.5 2v2M9.5 2v2" stroke="#8a8378" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Last 14 days
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#fcfbf7' }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          <KTile label="Total runs" value={totalRuns.toLocaleString()} delta={runDelta} good={runDelta >= 0} suffix="%" />
          <KTile label="Success rate" value={`${successRate}%`} valueColor={successColor} delta={-errDelta} good={errDelta <= 0} suffix=" pts" />
          <KTile label="Error rate" value={`${errorRate}%`} delta={errDelta} good={errDelta <= 0} suffix=" pts" invert />
          <KTile label="p95 latency" value={`${p95}s`} sub={`p50 ${p50}s`} />
          <KTile label="Avg cost / run" value={`$${avgCost.toFixed(2)}`} delta={costDelta} good={costDelta <= 0} suffix="%" invert />
          <KTile label="Spend (14d)" value={`$${periodCost.toLocaleString()}`} sub="est." />
        </div>

        {/* runs over time + outcomes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12, marginTop: 12 }}>
          <ACard title="Runs over time" legend={[['#1f7a40', 'Success'], ['#c0492f', 'Failed'], ['#d98a3a', 'In progress']]}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 160, padding: '6px 2px 0' }}>
              {series.map((s, i) => (
                <div key={i} title={`${s.total} runs · ${s.failed} failed`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 0, height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    {s.inprog > 0 && <div style={{ height: `${s.inprog / maxTotal * 100}%`, background: '#d98a3a' }} />}
                    {s.failed > 0 && <div style={{ height: `${s.failed / maxTotal * 100}%`, background: '#c0492f' }} />}
                    <div style={{ height: `${s.success / maxTotal * 100}%`, background: i === series.length - 1 ? '#16341f' : '#2e6b40', borderRadius: '3px 3px 0 0' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: '#a89e88' }}>
              <span>14d ago</span><span>7d ago</span><span>Today</span>
            </div>
          </ACard>

          <ACard title="Outcome breakdown">
            <Donut success={totalSuccess} failed={totalFailed} inprog={sum('inprog')} />
          </ACard>
        </div>

        {/* failure analysis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <ACard title="Failure reasons" subtitle={`${totalFailed} failed runs`}>
            {reasons.map((r, i) => {
              const pct = Math.round(r.count / totalFailed * 100)
              return (
                <div key={i} style={{ padding: '7px 0', borderBottom: i < reasons.length - 1 ? '1px solid #f4efe6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: '#3a3a36' }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2a2620' }}>{r.count}</span>
                    <TrendChip v={r.trend} invert />
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#f1ece2', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: r.color }} /></div>
                </div>
              )
            })}
          </ACard>

          <ACard title="Where it fails" subtitle="Steps with most failures">
            {failSteps.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i < failSteps.length - 1 ? '1px solid #f4efe6' : 'none' }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: '#fbf1ee', color: '#c0492f', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#2a2620' }}>{f.s}</span>
                <span style={{ fontSize: 12, color: '#9a917f' }}>{f.fails} fails</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: f.rate >= 10 ? '#c0492f' : '#b07a16' }}>{f.rate}%</span>
              </div>
            ))}
          </ACard>
        </div>

        {/* latency + cost */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <ACard title="Latency distribution" subtitle="seconds per run">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
              {[['p50', p50, '#a98c54'], ['p90', p90, '#8a7648'], ['p95', p95, '#b07a16'], ['p99', p99, '#c0492f']].map(([k, v, c], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 32, fontSize: 12, fontWeight: 600, color: '#6b6453' }}>{k}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f1ece2', overflow: 'hidden' }}><div style={{ width: `${v / maxLat * 100}%`, height: '100%', background: c, borderRadius: 4 }} /></div>
                  <span style={{ width: 42, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: '#2a2620' }}>{v}s</span>
                </div>
              ))}
            </div>
          </ACard>

          <ACard title="Cost breakdown" subtitle={`$${avgCost.toFixed(2)} avg / run`}>
            <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
              {costParts.map((c, i) => <span key={i} style={{ width: `${c.pct / costTotalPct * 100}%`, background: c.color }} />)}
            </div>
            {costParts.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: '#4a463e' }}>{c.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#2a2620' }}>{Math.round(c.pct / costTotalPct * 100)}%</span>
              </div>
            ))}
          </ACard>
        </div>

        {/* agents + recent failures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <ACard title="Top agents using this skill">
            <div style={{ display: 'flex', fontSize: 10.5, fontWeight: 600, color: '#a89e88', letterSpacing: 0.3, textTransform: 'uppercase', padding: '0 0 6px', borderBottom: '1px solid #f2ede3' }}>
              <span style={{ flex: 1 }}>Agent</span><span style={{ width: 56, textAlign: 'right' }}>Runs</span><span style={{ width: 64, textAlign: 'right' }}>Success</span><span style={{ width: 48, textAlign: 'right' }}>p95</span>
            </div>
            {agents.map((a, i) => {
              const sc = a.success >= 95 ? '#1f7a40' : a.success >= 90 ? '#b07a16' : '#c0492f'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: i < agents.length - 1 ? '1px solid #f4efe6' : 'none', fontSize: 13 }}>
                  <span style={{ flex: 1, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span style={{ width: 56, textAlign: 'right', color: '#4a463e' }}>{a.runs}</span>
                  <span style={{ width: 64, textAlign: 'right', fontWeight: 600, color: sc }}>{a.success}%</span>
                  <span style={{ width: 48, textAlign: 'right', color: '#4a463e' }}>{a.p95}s</span>
                </div>
              )
            })}
          </ACard>

          <ACard title="Recent failures" subtitle="Newest first">
            {failures.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < failures.length - 1 ? '1px solid #f4efe6' : 'none' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c0492f', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.reason}</div>
                  <div style={{ fontSize: 11.5, color: '#9a917f' }}>{f.agent} · {f.dur}s</div>
                </div>
                <span style={{ fontSize: 11.5, color: '#a89e88', flexShrink: 0 }}>{f.when}</span>
              </div>
            ))}
          </ACard>
        </div>
      </div>
    </div>
  )
}

function KTile({ label, value, valueColor, delta, good, suffix = '%', sub, invert }) {
  const showDelta = delta !== undefined && delta !== null
  const up = delta >= 0
  const c = good ? '#1f7a40' : '#c0492f'
  return (
    <div style={{ background: '#fff', border: '1px solid #efe9dd', borderRadius: 12, padding: '13px 14px' }}>
      <div style={{ fontSize: 11.5, color: '#9a917f', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: valueColor || '#1a1a1a' }}>{value}</span>
        {showDelta && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 11, fontWeight: 600, color: c }}>
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ transform: up ? 'none' : 'rotate(180deg)' }}><path d="M5 8V2M5 2L2 5M5 2l3 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {Math.abs(delta)}{suffix}
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: '#a89e88' }}>{sub}</span>}
      </div>
    </div>
  )
}

function ACard({ title, subtitle, legend, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #efe9dd', borderRadius: 12, padding: '15px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: '#9a917f', marginTop: 1 }}>{subtitle}</div>}
        </div>
        {legend && (
          <div style={{ display: 'flex', gap: 12 }}>
            {legend.map(([c, l], i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8a8170' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function TrendChip({ v, invert }) {
  const up = v >= 0
  const good = invert ? !up : up
  const c = good ? '#1f7a40' : '#c0492f'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 10.5, fontWeight: 600, color: c, width: 40, justifyContent: 'flex-end' }}>
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ transform: up ? 'none' : 'rotate(180deg)' }}><path d="M5 8V2M5 2L2 5M5 2l3 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {Math.abs(v)}%
    </span>
  )
}

function Donut({ success, failed, inprog }) {
  const total = success + failed + inprog || 1
  const segs = [['#1f7a40', success, 'Completed'], ['#c0492f', failed, 'Failed'], ['#d98a3a', inprog, 'In progress']]
  const R = 52, C = 2 * Math.PI * R
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="128" height="128" viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
        <circle cx="64" cy="64" r={R} fill="none" stroke="#f1ece2" strokeWidth="16" />
        {segs.map(([c, v], i) => {
          const frac = v / total
          const dash = frac * C
          const el = <circle key={i} cx="64" cy="64" r={R} fill="none" stroke={c} strokeWidth="16" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} transform="rotate(-90 64 64)" />
          offset += dash
          return el
        })}
        <text x="64" y="60" textAnchor="middle" style={{ fontFamily: 'var(--serif)', fontSize: 22, fill: '#1a1a1a' }}>{Math.round(success / total * 100)}%</text>
        <text x="64" y="78" textAnchor="middle" style={{ fontSize: 10, fill: '#9a917f' }}>completed</text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {segs.map(([c, v, l], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0' }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: c, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12.5, color: '#4a463e' }}>{l}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#2a2620' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


function RestoreModal({ skillName, version, liveVersion, onClose, onConfirm }) {
  const points = [
    { t: `${liveVersion} stays in history`, s: `Restoring publishes a new version from ${version}. Nothing is deleted — you can roll forward again anytime.` },
    { t: 'Live behavior changes immediately', s: 'Agents using this skill will pick up the restored content on their next run.' },
    { t: 'Unsaved draft edits are discarded', s: 'Any in-progress changes that haven’t been published will be lost.' },
    { t: 'Check tools & connections', s: `Make sure the integrations referenced by ${version} are still connected, or runs may fail.` },
  ]
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(28,24,18,0.40)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 480, maxWidth: '92vw', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', overflow: 'hidden', animation: 'fdeFadeUp .18s ease-out' }}>
        <div style={{ display: 'flex', gap: 13, padding: '20px 22px 14px' }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: '#fcf3e1', border: '1px solid #f0e2c4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2.5l8 14H2l8-14z" stroke="#b07a16" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 8v3.2M10 13.6h.01" stroke="#b07a16" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Restore {version}?</div>
            <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2, lineHeight: 1.45 }}>This replaces what's live for <strong style={{ color: '#3a3a36', fontWeight: 600 }}>{skillName}</strong>. Review before you continue — it affects every agent using this skill.</div>
          </div>
        </div>

        <div style={{ padding: '4px 22px 8px' }}>
          {points.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 11, padding: '10px 0', borderTop: i ? '1px solid #f4efe6' : 'none' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="8" cy="8" r="6.4" stroke="#c9bfa8" strokeWidth="1.3" /><path d="M8 5v3.4M8 10.8h.01" stroke="#9a8c6a" strokeWidth="1.3" strokeLinecap="round" /></svg>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{p.t}</div>
                <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 1, lineHeight: 1.45 }}>{p.s}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px 18px', marginTop: 4, borderTop: '1px solid #f2ede3' }}>
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}
            onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 1 1.6 3.7" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /><path d="M3 4.5V8h3.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Restore {version}
          </button>
        </div>
      </div>
    </div>
  )
}

const modalShell = { width: 460, maxWidth: '92vw', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)' }
const fieldInput = { width: '100%', height: 42, border: '1px solid #e6ddca', borderRadius: 10, padding: '0 14px', fontSize: 14, color: '#3a3a36', background: '#fff', outline: 'none' }

function ModalHead({ title, sub, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '18px 22px 14px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}
function ModalFoot({ onClose, onConfirm, label, disabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', marginTop: 14, borderTop: '1px solid #f2ede3' }}>
      <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
      <button onClick={onConfirm} disabled={disabled} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1 }}>{label}</button>
    </div>
  )
}

function RenameModal({ name, onClose, onSave }) {
  const [val, setVal] = useState(name)
  const ok = val.trim().length > 0
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,24,18,0.34)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={modalShell}>
        <ModalHead title="Rename skill" sub="Give this skill a new name" onClose={onClose} />
        <div style={{ padding: '0 22px' }}>
          <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ok) onSave(val.trim()) }}
            style={fieldInput} onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#e6ddca'} />
        </div>
        <ModalFoot onClose={onClose} onConfirm={() => ok && onSave(val.trim())} label="Save" disabled={!ok} />
      </div>
    </div>
  )
}

function DuplicateModal({ skill, onClose, onDone }) {
  const versions = skill.versions || []
  const [name, setName] = useState(`Copy of ${skill.name}`)
  const [versionId, setVersionId] = useState(versions[0]?.id)
  const [verOpen, setVerOpen] = useState(false)
  const [inherit, setInherit] = useState(false)
  const curVer = versions.find(v => v.id === versionId) || versions[0]
  const ok = name.trim().length > 0
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,24,18,0.34)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={modalShell}>
        <ModalHead title="Duplicate skill" sub={`Create a copy of “${skill.name}”`} onClose={onClose} />
        <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>New skill name</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} style={fieldInput} onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#e6ddca'} />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>Version to copy</label>
            <button type="button" onClick={() => setVerOpen(o => !o)} style={{ ...fieldInput, display: 'flex', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13 }}>{curVer?.version}{versions[0]?.id === versionId ? ' (current)' : ''}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: verOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {verOpen && (
              <>
                <div onClick={() => setVerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 2, maxHeight: 200, overflowY: 'auto', background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 12px 34px rgba(40,32,18,0.16)', padding: 5 }}>
                  {versions.map((v, i) => (
                    <div key={v.id} onClick={() => { setVersionId(v.id); setVerOpen(false) }}
                      onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = v.id === versionId ? '#f5f1e8' : 'transparent'}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', background: v.id === versionId ? '#f5f1e8' : 'transparent' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: '#2a2620' }}>{v.version}</span>
                      {i === 0 && <span style={{ fontSize: 10, fontWeight: 600, color: '#1f7a40', background: '#e9f4ec', padding: '1px 6px', borderRadius: 5 }}>Current</span>}
                      <span style={{ flex: 1 }} /><span style={{ fontSize: 11, color: '#a89e88' }}>{v.when}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 9 }}>Sharing</label>
            {[{ v: false, t: 'Share only with me' }, { v: true, t: `Inherit sharing — ${skill.sharedBy || 'same as original'}` }].map(o => (
              <div key={String(o.v)} onClick={() => setInherit(o.v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, cursor: 'pointer', background: inherit === o.v ? '#f6f2ea' : '#fff', border: '1px solid', borderColor: inherit === o.v ? '#16341f' : '#eee7da', marginBottom: 7 }}>
                <span style={{ width: 17, height: 17, borderRadius: '50%', flexShrink: 0, border: inherit === o.v ? '5px solid #16341f' : '1.5px solid #d8cfba', background: '#fff' }} />
                <span style={{ fontSize: 13, color: '#3a3a36' }}>{o.t}</span>
              </div>
            ))}
          </div>
        </div>
        <ModalFoot onClose={onClose} onConfirm={() => ok && onDone({ name: name.trim(), versionId, inherit })} label="Duplicate skill" disabled={!ok} />
      </div>
    </div>
  )
}

function MoveToGroupModal({ skill, onClose }) {
  const [picked, setPicked] = useState([]) // array of group ids
  const [open, setOpen] = useState(false)
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const pickedGroups = GROUPS.filter(g => picked.includes(g.id))
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,24,18,0.34)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={modalShell}>
        <ModalHead title={`Move “${skill.name}”`} sub="Select one or more groups to add this skill to" onClose={onClose} />
        <div style={{ padding: '0 22px' }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>Groups</label>
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setOpen(o => !o)} style={{ ...fieldInput, height: 'auto', minHeight: 42, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '7px 12px', cursor: 'pointer', textAlign: 'left' }}>
              {pickedGroups.length === 0
                ? <span style={{ flex: 1, color: '#9a917f' }}>Select groups…</span>
                : pickedGroups.map(g => (
                  <span key={g.id} onClick={e => { e.stopPropagation(); toggle(g.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, background: '#f1ede4', border: '1px solid #e6e0d4', borderRadius: 7, padding: '3px 8px' }}>
                    {g.name}<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#8a8170" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </span>
                ))}
              <span style={{ flex: 1 }} />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {open && (
              <>
                <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 2, maxHeight: 264, overflowY: 'auto', background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 12px 34px rgba(40,32,18,0.16)', padding: 5 }}>
                  {GROUPS.map(g => {
                    const on = picked.includes(g.id)
                    return (
                      <div key={g.id} onClick={() => toggle(g.id)}
                        onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', transition: 'background .1s' }}>
                        <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#16341f' : '#fff', border: on ? '1.5px solid #16341f' : '1.5px solid #d8cfba' }}>
                          {on && <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5L11 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a2620' }}>{g.name}</div>
                          <div style={{ fontSize: 11.5, color: '#9a917f' }}>{g.skills} skills</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <ModalFoot onClose={onClose} onConfirm={onClose} label={picked.length > 1 ? `Add to ${picked.length} groups` : 'Move to group'} disabled={picked.length === 0} />
      </div>
    </div>
  )
}

function Toast({ text }) {
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 90, display: 'flex', alignItems: 'center', gap: 11, maxWidth: 360, background: '#1f2a22', color: '#f4f1ea', padding: '13px 16px', borderRadius: 11, boxShadow: '0 14px 40px rgba(20,30,20,0.35)', animation: 'fdeFadeUp .2s ease-out' }}>
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}><path d="M9 2.5v8M6 7.5L9 10.5l3-3M3.5 12.5v1A1.5 1.5 0 005 15h8a1.5 1.5 0 001.5-1.5v-1" stroke="#9fd3ad" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span style={{ fontSize: 13, lineHeight: 1.4 }}>{text}</span>
    </div>
  )
}

function AllVersionsPanel({ versions, diffIdx, onPick, onLive, onClose }) {
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(28,24,18,0.30)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 420, maxWidth: '94vw', height: '100%', background: '#FEFDFB', borderLeft: '1px solid #ece5d7', boxShadow: '-18px 0 60px rgba(40,32,18,0.22)', display: 'flex', flexDirection: 'column', animation: 'toolSlide .22s cubic-bezier(.4,0,.2,1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.4" stroke="#7a6f5c" strokeWidth="1.4" /><path d="M9 5.2V9l2.7 1.7" stroke="#7a6f5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>All versions</div>
            <div style={{ fontSize: 12.5, color: '#8a8170' }}>{versions.length} versions · newest first</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 20px' }}>
          {versions.map((v, i) => {
            const isCur = i === 0
            const active = diffIdx == null ? isCur : i === diffIdx
            return (
              <div key={v.id} onClick={() => isCur ? onLive() : onPick(i)}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = '#faf8f3' }} onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 12px', borderRadius: 10, cursor: 'pointer', background: active ? '#f3efe6' : 'transparent', transition: 'background .12s' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: isCur ? '#1f7a40' : '#d8cfb9', boxShadow: isCur ? '0 0 0 3px rgba(31,122,64,0.12)' : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{v.version}</span>
                    {isCur && <span style={{ fontSize: 10, fontWeight: 600, color: '#1f7a40', background: '#e9f4ec', padding: '1px 7px', borderRadius: 5 }}>Current</span>}
                    {active && !isCur && <span style={{ fontSize: 10, fontWeight: 600, color: '#9a6a16', background: '#fbf3e0', padding: '1px 7px', borderRadius: 5 }}>Viewing</span>}
                    <span style={{ flex: 1 }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#a89e88' }}>{v.when}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 3 }}>{v.author}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const ACCESS_LABEL = {
  private: { title: 'Only Me', sub: 'Only you can open this' },
  restricted: { title: 'Restricted', sub: 'Only people with access can open with the link' },
  org: { title: 'Everyone at Acme', sub: 'Anyone at Acme with the link can view' },
}
const ACCESS_ORDER = ['private', 'restricted', 'org']
const AV_COLORS = ['#2f8f6e', '#a855c7', '#3b82f6', '#d97706', '#0ea5a4', '#e0577a']
const avColor = (s) => AV_COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]

// directory of users + teams the share field suggests from
const DIRECTORY = [
  { type: 'user', name: 'Sarah Chen', email: 'sarah.chen@acme.com' },
  { type: 'user', name: 'Marcus Lee', email: 'marcus.lee@acme.com' },
  { type: 'user', name: 'Priya Nair', email: 'priya.nair@acme.com' },
  { type: 'user', name: 'David Kim', email: 'david.kim@acme.com' },
  { type: 'user', name: 'Elena Garcia', email: 'elena.garcia@acme.com' },
  { type: 'team', name: 'Sales Team', count: 24 },
  { type: 'team', name: 'Engineering', count: 18 },
  { type: 'team', name: 'Customer Success', count: 12 },
  { type: 'team', name: 'Marketing', count: 9 },
]
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

function TeamAvatar({ size = 36 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 9, background: '#e3edfb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 20 20" fill="none"><circle cx="7" cy="8" r="2.4" stroke="#3b6fd4" strokeWidth="1.5" /><circle cx="13.5" cy="8.5" r="2" stroke="#3b6fd4" strokeWidth="1.5" /><path d="M3 15.5c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M11.5 15.5c0-1.8 1.3-3 3-3s3 1.2 3 3" stroke="#3b6fd4" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </span>
  )
}

function AccessIcon({ id }) {
  if (id === 'org') return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 17V5.5a1 1 0 011-1h6a1 1 0 011 1V17M12 9h3a1 1 0 011 1v7M3 17h14M6.5 7.5h2M6.5 10.5h2M6.5 13.5h2" stroke="#3b6fd4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="4.5" y="9" width="11" height="7.5" rx="1.6" stroke="#6b6453" strokeWidth="1.5" /><path d="M7 9V6.8a3 3 0 016 0V9" stroke="#6b6453" strokeWidth="1.5" /></svg>
  )
}

/* Google-style inline role selector (Viewer / Editor + Remove).
   Menu is portaled to <body> with fixed positioning so it never clips
   inside the scrollable members list. */
function RoleDropdown({ value, onChange, onRemove }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const W = 168
  const toggle = () => {
    if (open) { setOpen(false); return }
    const r = btnRef.current.getBoundingClientRect()
    const estH = onRemove ? 132 : 86
    const below = r.bottom + 6 + estH < window.innerHeight
    setPos({ left: Math.max(8, r.right - W), top: below ? r.bottom + 6 : undefined, bottom: below ? undefined : (window.innerHeight - r.top + 6) })
    setOpen(true)
  }
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button ref={btnRef} onClick={toggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: open ? '#f3efe6' : 'none', cursor: 'pointer', fontSize: 13, color: '#3a3a36', padding: '5px 8px', borderRadius: 7 }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = '#f5f1e8' }} onMouseOut={e => { if (!open) e.currentTarget.style.background = 'none' }}>
        {value}
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && pos && createPortal(
        <>
          <div onMouseDown={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, zIndex: 91, width: W, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 14px 38px rgba(40,32,18,0.20)', padding: 5 }}>
            {['Viewer', 'Editor'].map(r => (
              <div key={r} onMouseDown={() => { onChange(r); setOpen(false) }}
                onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#2a2620' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M2.5 7l3 3 6-6.5" stroke={value === r ? '#1f7a40' : 'transparent'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {r}
              </div>
            ))}
            {onRemove && <>
              <div style={{ height: 1, background: '#f2ede3', margin: '5px 4px' }} />
              <div onMouseDown={() => { onRemove(); setOpen(false) }}
                onMouseOver={e => e.currentTarget.style.background = '#fbf1ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px 8px 33px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#c0492f' }}>Remove access</div>
            </>}
          </div>
        </>,
        document.body)}
    </div>
  )
}

const TYPE_TO_ACCESS = (t) => t === 'org' ? 'org' : (t === 'private' || !t) ? 'private' : 'restricted'
const ACCESS_TO_TYPE = { private: 'private', restricted: 'team', org: 'org' }

export function ShareDialog({ skill, initialType, onTypeChange, onClose }) {
  const [access, setAccess] = useState(TYPE_TO_ACCESS(initialType ?? skill.sharedType)) // 'private' | 'restricted' | 'org'
  const [accessMenu, setAccessMenu] = useState(false)
  const [orgRole, setOrgRole] = useState('Viewer')
  const [copied, setCopied] = useState(false)
  const [invite, setInvite] = useState('')
  const [sugOpen, setSugOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [members, setMembers] = useState(() => [
    { name: skill.owner, init: skill.ownerInit, email: emailOf(skill.owner), role: 'Owner', you: true },
    { name: 'Michael Bennett', init: 'M', email: 'michael.bennett@acme.com', role: 'Editor' },
    { name: 'Sarah Johnson', init: 'S', email: 'sarah.johnson@acme.com', role: 'Viewer' },
  ])
  const setRole = (i, role) => setMembers(ms => ms.map((m, j) => j === i ? { ...m, role } : m))
  const removeMember = (i) => { setMembers(ms => ms.filter((_, j) => j !== i)) }
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1600) }
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800) }
  const changeAccess = (id) => { setAccess(id); setAccessMenu(false); onTypeChange?.(ACCESS_TO_TYPE[id]) }
  const taken = new Set(members.map(m => m.email))
  const q = invite.trim().toLowerCase()
  const suggestions = DIRECTORY.filter(d => {
    if (d.type === 'user' && taken.has(d.email)) return false
    if (taken.has(d.name)) return false
    if (!q) return true
    return d.name.toLowerCase().includes(q) || (d.email && d.email.toLowerCase().includes(q))
  })
  const addEntry = (d) => {
    const m = d.type === 'team'
      ? { name: d.name, init: initials(d.name), email: `${d.count} members`, role: 'Viewer', team: true }
      : { name: d.name, init: initials(d.name), email: d.email, role: 'Viewer' }
    setMembers(ms => [...ms, m]); setInvite(''); setSugOpen(false)
  }
  const addPerson = () => {
    if (suggestions.length) { addEntry(suggestions[0]); return }
    const v = invite.trim(); if (!v) return
    const isEmail = v.includes('@')
    setMembers(ms => [...ms, { name: v, init: (v[0] || '?').toUpperCase(), email: isEmail ? v : emailOf(v), role: 'Viewer' }])
    setInvite(''); setSugOpen(false)
  }

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(28,24,18,0.34)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ position: 'relative', width: 520, maxWidth: '92vw', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', animation: 'fdeFadeUp .18s ease-out' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '20px 22px 14px' }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Share “{skill.name}”</div>
        </div>

        {/* add people field */}
        <div style={{ padding: '0 22px 18px', position: 'relative' }}>
          <input value={invite} onChange={e => { setInvite(e.target.value); setSugOpen(true) }} onKeyDown={e => { if (e.key === 'Enter') addPerson() }}
            placeholder="Add people, teams, and emails"
            onFocus={e => { e.target.style.borderColor = '#16341f'; setSugOpen(true) }}
            onBlur={e => { e.target.style.borderColor = '#d8cfbb'; setTimeout(() => setSugOpen(false), 150) }}
            style={{ width: '100%', height: 46, border: '1px solid #d8cfbb', borderRadius: 10, padding: '0 16px', fontSize: 14, color: '#3a3a36', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
          {sugOpen && suggestions.length > 0 && (
            <div style={{ position: 'absolute', left: 22, right: 22, top: 'calc(100% - 6px)', zIndex: 30, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 12, boxShadow: '0 16px 40px rgba(40,32,18,0.18)', padding: 6, maxHeight: 264, overflowY: 'auto' }}>
              {q === '' && <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9a917f', letterSpacing: 0.3, textTransform: 'uppercase', padding: '6px 10px 4px' }}>Suggestions</div>}
              {suggestions.map((d, i) => (
                <div key={i} onMouseDown={() => addEntry(d)}
                  onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 9, cursor: 'pointer' }}>
                  {d.type === 'team'
                    ? <TeamAvatar size={34} />
                    : <span style={{ width: 34, height: 34, borderRadius: '50%', background: avColor(d.email), color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(d.name)}</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2a2620' }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: '#9a917f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.type === 'team' ? `Team · ${d.count} members` : d.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* people with access */}
        <div style={{ padding: '0 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#2a2620' }}>People with access</span>
          </div>
          <div style={{ maxHeight: 210, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
            {members.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                {m.team
                  ? <TeamAvatar size={36} />
                  : <span style={{ width: 36, height: 36, borderRadius: '50%', background: avColor(m.email), color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.init}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}{m.you && <span style={{ color: '#9a917f', fontWeight: 400 }}> (you)</span>}</div>
                  <div style={{ fontSize: 12, color: '#9a917f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                </div>
                {m.role === 'Owner'
                  ? <span style={{ fontSize: 13, color: '#9a917f', padding: '0 8px' }}>Owner</span>
                  : <RoleDropdown value={m.role} onChange={r => setRole(i, r)} onRemove={() => removeMember(i)} />}
              </div>
            ))}
          </div>
        </div>

        {/* general access */}
        <div style={{ padding: '16px 22px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2620', marginBottom: 8 }}>General access</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f6f2ea', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: access === 'org' ? '#e3edfb' : '#ece5d7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AccessIcon id={access} />
            </span>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <button type="button" onClick={() => setAccessMenu(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: accessMenu ? '#ece5d7' : 'none', padding: '3px 7px', marginLeft: -7, cursor: 'pointer', borderRadius: 7 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{ACCESS_LABEL[access].title}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: accessMenu ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 1 }}>{ACCESS_LABEL[access].sub}</div>
              {accessMenu && (
                <>
                  <div onClick={() => setAccessMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: -7, zIndex: 2, width: 280, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10, boxShadow: '0 14px 38px rgba(40,32,18,0.18)', padding: 5 }}>
                    {ACCESS_ORDER.map(id => (
                      <div key={id} onClick={() => changeAccess(id)}
                        onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = id === access ? '#f5f1e8' : 'transparent'}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 10px', borderRadius: 7, cursor: 'pointer', background: id === access ? '#f5f1e8' : 'transparent', transition: 'background .1s' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><path d="M2.5 7l3 3 6-6.5" stroke={id === access ? '#1f7a40' : 'transparent'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2a2620' }}>{ACCESS_LABEL[id].title}</div>
                          <div style={{ fontSize: 11.5, color: '#9a917f', marginTop: 1 }}>{ACCESS_LABEL[id].sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {access === 'org' && <RoleDropdown value={orgRole} onChange={r => setOrgRole(r)} up />}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px 20px' }}>
          <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 999, border: '1px solid #cdc3ae', background: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: copied ? '#1f7a40' : '#16341f' }}>
            {copied
              ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="#1f7a40" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5l3-3M6.8 4.5l1-1a2.5 2.5 0 013.6 3.6l-1 1M9.2 11.5l-1 1a2.5 2.5 0 01-3.6-3.6l1-1" stroke="#16341f" strokeWidth="1.3" strokeLinecap="round" /></svg>}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ ...btnPrimary, height: 40, padding: '0 26px', borderRadius: 999 }} onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>Done</button>
        </div>

        {toast && (
          <div style={{ position: 'absolute', left: 22, bottom: 74, background: '#1f2a22', color: '#f4f9f4', fontSize: 13, padding: '10px 16px', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.24)', animation: 'fdeFadeUp .18s ease' }}>{toast}</div>
        )}
      </div>
    </div>
  )
}

const iconBtn = { width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

function emailOf(name) {
  return name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean).join('.') + '@acme.com'
}

function DiffBadge({ badge }) {
  if (!badge) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
      fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, lineHeight: 1,
      padding: '3px 7px', borderRadius: 6, background: '#f3efe6', border: '1px solid #e9e2d3',
    }}>
      {badge.add > 0 && <span style={{ color: '#1f7a40' }}>+{badge.add}</span>}
      {badge.del > 0 && <span style={{ color: '#c0492f' }}>−{badge.del}</span>}
    </span>
  )
}

function FolderBlock({ folder, open, selected, diffs, onToggle, onSelect }) {
  const [hov, setHov] = useState(false)
  const folderBadge = diffs ? folder.children.reduce((acc, c) => {
    const b = diffs[`${folder.name}/${c.name}`]
    return b ? { add: acc.add + b.add, del: acc.del + b.del } : acc
  }, { add: 0, del: 0 }) : null
  const hasBadge = !!(folderBadge && (folderBadge.add || folderBadge.del))
  return (
    <div>
      <div onClick={onToggle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', background: hov ? '#f7f4ee' : 'transparent', transition: 'background .12s' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.8 4.2A1.2 1.2 0 013 3h3l1.3 1.6H13a1.2 1.2 0 011.2 1.2v6.4A1.2 1.2 0 0113 13.4H3a1.2 1.2 0 01-1.2-1.2V4.2z" stroke="#8a8378" strokeWidth="1.2" strokeLinejoin="round" /></svg>
        <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: '#4a463e' }}>{folder.name}</span>
        {hasBadge && <DiffBadge badge={folderBadge} />}
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M5 3l3.5 3.5L5 10" stroke="#b3ab99" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ maxHeight: open ? folder.children.length * 36 + 4 : 0, overflow: 'hidden', transition: 'max-height .22s cubic-bezier(.4,0,.2,1)' }}>
        {folder.children.map(c => {
          const path = `${folder.name}/${c.name}`
          return <FileItem key={path} name={c.name} lang={c.lang} indent selected={selected === path} badge={diffs?.[path]} onClick={() => onSelect(path)} />
        })}
      </div>
    </div>
  )
}

function FileItem({ name, lang, selected, indent, badge, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', paddingLeft: indent ? 30 : 10, borderRadius: 8, cursor: 'pointer',
        background: selected ? '#efe9dc' : hov ? '#f4f1ea' : 'transparent',
        boxShadow: 'none', transition: 'background .12s',
      }}>
      <FileGlyph lang={lang} selected={selected} />
      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: selected ? 600 : 500, color: selected ? '#1a1a1a' : '#4a463e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <DiffBadge badge={badge} />
      <span style={{ width: 13, flexShrink: 0 }} />
    </div>
  )
}

/* ── version footer + popover ─────────────────────────────── */
function VersionFooter({ versions, diffIdx, open, onToggle, onPick, onLive, onViewAll }) {
  const current = versions[0]
  const viewing = diffIdx != null ? versions[diffIdx] : current
  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid #efe9dd', position: 'relative' }}>
      {open && (
        <>
          <div onClick={onToggle} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(100% - 2px)', zIndex: 31, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 12, boxShadow: '0 14px 40px rgba(60,50,30,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px 9px', fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, color: '#8a8068', textTransform: 'uppercase', borderBottom: '1px solid #f2ede3' }}>Version history</div>
            {versions.slice(0, 5).map((v, i) => {
              const isCur = i === 0
              const active = diffIdx == null ? isCur : i === diffIdx
              const lastShown = i === Math.min(versions.length, 5) - 1
              return (
                <div key={v.id} onClick={() => isCur ? onLive() : onPick(i)}
                  onMouseOver={e => e.currentTarget.style.background = active ? '#f3efe6' : '#faf8f3'}
                  onMouseOut={e => e.currentTarget.style.background = active ? '#f3efe6' : '#fff'}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 14px', cursor: 'pointer', background: active ? '#f3efe6' : '#fff', borderBottom: !lastShown ? '1px solid #f5f1e8' : 'none' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: isCur ? '#1f7a40' : '#d8cfb9', boxShadow: isCur ? '0 0 0 3px rgba(31,122,64,0.12)' : 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: '#2a2620' }}>{v.version}</span>
                      {isCur && <span style={{ fontSize: 10, fontWeight: 600, color: '#1f7a40', background: '#e9f4ec', padding: '1px 7px', borderRadius: 5 }}>Current</span>}
                      <span style={{ flex: 1 }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#a89e88' }}>{v.when}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#a89e88', marginTop: 4 }}>{v.author}</div>
                  </div>
                </div>
              )
            })}
            {versions.length > 5 && (
              <div onClick={() => { onToggle(); onViewAll?.() }}
                onMouseOver={e => e.currentTarget.style.background = '#faf8f3'} onMouseOut={e => e.currentTarget.style.background = '#fff'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', cursor: 'pointer', borderTop: '1px solid #f2ede3', fontSize: 12, color: '#8a8170', transition: 'background .12s' }}>
                View all {versions.length} versions
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="#b3a888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
          </div>
        </>
      )}
      <div onClick={onToggle} onMouseOver={e => e.currentTarget.style.background = '#f5f1e8'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer', transition: 'background .12s' }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="#8a8378" strokeWidth="1.2" /><path d="M8 4.6V8l2.3 1.4" stroke="#8a8378" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: '#a89e88', letterSpacing: 0.2 }}>{diffIdx != null ? 'Viewing version' : 'Current version'}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: '#2a2620' }}>{viewing.version}</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M3 5l3.5 3.5L10 5" stroke="#b3ab99" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  )
}

/* ── unified diff viewer (red/green redlines) ─────────────── */
function DiffView({ rows, lang }) {
  let oldN = 0, newN = 0
  const isCode = lang === 'python' || lang === 'json'
  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
      {(rows || []).map((r, i) => {
        const sign = r.t === 'add' ? '+' : r.t === 'del' ? '−' : ''
        if (r.t !== 'add') oldN++
        if (r.t !== 'del') newN++
        const bg = r.t === 'add' ? '#f0f8f1' : r.t === 'del' ? '#fbf1ee' : 'transparent'
        const signColor = r.t === 'add' ? '#1f7a40' : r.t === 'del' ? '#c0492f' : '#cfc7b6'
        const body = isCode && r.t !== 'del' ? highlight(r.text, lang) : r.text
        return (
          <div key={i} style={{ display: 'flex', background: bg, minHeight: 22 }}>
            <span style={{ width: 38, flexShrink: 0, textAlign: 'right', paddingRight: 8, fontFamily: 'var(--mono)', fontSize: 11, lineHeight: '22px', color: '#cfc7b6', userSelect: 'none' }}>{r.t === 'add' ? '' : oldN}</span>
            <span style={{ width: 38, flexShrink: 0, textAlign: 'right', paddingRight: 8, fontFamily: 'var(--mono)', fontSize: 11, lineHeight: '22px', color: '#cfc7b6', userSelect: 'none', borderRight: '1px solid #f4efe6' }}>{r.t === 'del' ? '' : newN}</span>
            <span style={{ width: 20, flexShrink: 0, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: '22px', color: signColor, fontWeight: 600, userSelect: 'none' }}>{sign}</span>
            <pre style={{ flex: 1, margin: 0, padding: '0 14px 0 2px', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: '22px', color: r.t === 'del' ? '#9a6a5e' : '#3a3a36', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textDecoration: r.t === 'del' ? 'none' : 'none' }}>{body === '' ? ' ' : body}</pre>
          </div>
        )
      })}
    </div>
  )
}

/* ── restrained, on-brand syntax highlighting ─────────────── */
const TONE = {
  comment: '#a8a08c', // muted sand-gray — recedes
  string: '#8a7340',  // warm brand gold
  keyword: '#2e6b40', // dark green accent
  number: '#7a6a8a',  // soft slate
  base: '#3a3a36',    // base ink
}
const PY_KW = /\b(?:def|return|from|import|class|if|elif|else|for|while|in|with|as|None|True|False|and|or|not|is|lambda|try|except|finally|raise|yield|pass|break|continue|global|nonlocal|assert|await|async|del)\b/
const PY_RE = new RegExp([
  /"""[\s\S]*?"""|'''[\s\S]*?'''/.source,        // docstrings
  /#[^\n]*/.source,                               // comments
  /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/.source,   // strings
  PY_KW.source,                                    // keywords
  /\b\d+\.?\d*\b/.source,                          // numbers
].join('|'), 'g')
const JSON_RE = new RegExp([
  /"(?:\\.|[^"\\])*"/.source,
  /\b(?:true|false|null)\b/.source,
  /-?\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/.source,
].join('|'), 'g')

function tokenType(tok, lang) {
  if (lang === 'json') {
    if (tok[0] === '"') return 'string'
    if (tok === 'true' || tok === 'false' || tok === 'null') return 'keyword'
    return 'number'
  }
  if (tok[0] === '#') return 'comment'
  if (tok[0] === '"' || tok[0] === "'") return 'string'
  if (/^\d/.test(tok)) return 'number'
  return 'keyword'
}

function highlight(code, lang) {
  if (!code) return code
  const re = lang === 'json' ? JSON_RE : PY_RE
  re.lastIndex = 0
  const out = []
  let last = 0, m, k = 0
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index))
    out.push(<span key={k++} style={{ color: TONE[tokenType(m[0], lang)] }}>{m[0]}</span>)
    last = m.index + m[0].length
    if (m[0].length === 0) re.lastIndex++ // guard against zero-width
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

function FileGlyph({ selected }) {
  const c = selected ? '#7a6a48' : '#9a917f'
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M4 1.75h4.7a1 1 0 01.7.3l3.3 3.3a1 1 0 01.3.7V13.5A1.25 1.25 0 0111.75 14.75h-7.5A1.25 1.25 0 013 13.5v-10.5A1.25 1.25 0 014.25 1.75z"
        stroke={c} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.75 1.9V5a1 1 0 001 1h3.1" stroke={c} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const btnGhost = { background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, padding: '0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(60,50,30,0.04)', transition: 'all .15s' }
const btnPrimary = { background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, padding: '0 20px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,52,31,0.28), 0 1px 2px rgba(0,0,0,0.1)', transition: 'all .15s' }
const addBtn = { width: 24, height: 24, background: '#fff', border: '1px solid #e6dfd1', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
