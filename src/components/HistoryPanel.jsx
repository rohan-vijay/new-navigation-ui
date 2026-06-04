function base(path) { return path.split('/').pop() }

function fileChanges(curFiles, prevFiles) {
  const out = []
  const paths = new Set([...Object.keys(curFiles), ...Object.keys(prevFiles || {})])
  paths.forEach(p => {
    const a = (prevFiles?.[p] || '').split('\n'), b = (curFiles[p] || '').split('\n')
    const add = b.filter(x => !a.includes(x)).length
    const del = a.filter(x => !b.includes(x)).length
    if (add || del) out.push({ path: p, add, del })
  })
  return out
}

function buildCommits(skill) {
  const versions = skill.versions || []
  return versions.map((v, i) => {
    const prev = versions[i + 1]
    const changes = prev ? fileChanges(v.files, prev.files) : []
    let message
    if (!prev) message = `Created ${skill.name}`
    else if (changes.length === 0) message = `Saved version ${v.version}`
    else if (changes.length === 1) message = `Edited ${base(changes[0].path)}`
    else message = `Edited ${base(changes[0].path)} and ${changes.length - 1} more file${changes.length > 2 ? 's' : ''}`
    return {
      version: v.version,
      message,
      author: v.author,
      init: v.init,
      when: v.when,
      changes,
      isFirst: !prev,
    }
  })
}

export default function HistoryPanel({ skill, onClose }) {
  const commits = buildCommits(skill)
  // group consecutive commits by their `when` label
  const groups = []
  commits.forEach(c => {
    const last = groups[groups.length - 1]
    if (last && last.when === c.when) last.items.push(c)
    else groups.push({ when: c.when, items: [c] })
  })

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(28,24,18,0.30)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 540, maxWidth: '94vw', height: '100%', background: '#FEFDFB', borderLeft: '1px solid #ece5d7', boxShadow: '-18px 0 60px rgba(40,32,18,0.22)', display: 'flex', flexDirection: 'column', animation: 'toolSlide .22s cubic-bezier(.4,0,.2,1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.4" stroke="#7a6f5c" strokeWidth="1.4" /><path d="M9 5.2V9l2.7 1.7" stroke="#7a6f5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Activity history</div>
            <div style={{ fontSize: 12.5, color: '#8a8170', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Every change made to {skill.name}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 24px' }}>
          {groups.map((g, gi) => (
            <div key={gi}>
              {/* date node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', border: '2px solid #b3a888' }} />
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#7a7468' }}>{g.when}</span>
              </div>
              {/* commits */}
              {g.items.map((c, ci) => {
                const lastOverall = gi === groups.length - 1 && ci === g.items.length - 1
                return (
                  <div key={c.hash} style={{ display: 'flex', gap: 12 }}>
                    {/* rail */}
                    <div style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ width: 2, background: lastOverall ? 'transparent' : '#eee3d0', minHeight: '100%' }} />
                    </div>
                    {/* card */}
                    <div style={{ flex: 1, minWidth: 0, marginBottom: 12, border: '1px solid #eee7da', borderRadius: 11, background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620', lineHeight: 1.35 }}>{c.message}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#ede4d2', color: '#8a7648', fontSize: 9, fontWeight: 700, border: '1px solid #e3d8c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.init}</span>
                          <span style={{ fontSize: 12, color: '#6b6453' }}><strong style={{ fontWeight: 600, color: '#3a352b' }}>{c.author}</strong> · {c.when}</span>
                          <div style={{ flex: 1 }} />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#8a7340', background: '#faf5ea', border: '1px solid #e7dcc1', padding: '2px 8px', borderRadius: 5 }}>{c.version}</span>
                        </div>
                      </div>
                      {c.changes.length > 0 && (
                        <div style={{ borderTop: '1px solid #f4eee2', background: '#fcfbf7', padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {c.changes.map(ch => (
                            <span key={ch.path} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, color: '#6b6453' }}>
                              <span>{ch.path}</span>
                              {ch.add > 0 && <span style={{ color: '#1f7a40', fontWeight: 600 }}>+{ch.add}</span>}
                              {ch.del > 0 && <span style={{ color: '#c0492f', fontWeight: 600 }}>−{ch.del}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {/* end */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
            <span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="3.2" stroke="#cabfa9" strokeWidth="1.6" /></svg>
            </span>
            <span style={{ fontSize: 12, color: '#a89e88' }}>This is where {skill.name} began</span>
          </div>
        </div>
      </div>
    </div>
  )
}
