import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import GraphsPage, { GRAPHS } from './components/GraphsPage'
import GraphDetailPage from './components/GraphDetailPage'
import SkillsPage from './components/SkillsPage'
import SkillCreate from './components/SkillCreate'
import SkillDetail from './components/SkillDetail'
import SkillLibrary from './components/SkillLibrary'
import SkillGroupDetail from './components/SkillGroupDetail'
import { findSkill } from './data/skills'
import { GROUPS } from './components/SkillsPage'
import AIPanel from './components/AIPanel'
import StatusBar from './components/StatusBar'
import { BuildContext, useBuildDraft } from './components/aiBuild'
import BuildWithAIModal from './components/BuildWithAIModal'
import ScratchSkillModal from './components/ScratchSkillModal'

/* ── URL <-> state helpers ─────────────────────────────── */
function readParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    view: p.get('view') || 'graphs',
    graphId: p.get('graph') || null,
    skillId: p.get('skill') || null,
    groupId: p.get('grp') || null,
    ai: p.get('ai') === '1',
    nav: p.get('nav') || 'agents',
    tab: p.get('tab') === 'groups' ? 'Skill Groups' : 'Skills',
  }
}

export default function App() {
  const init = readParams()
  const [view, setView] = useState(init.view)
  const [selectedGraph, setSelectedGraph] = useState(() =>
    init.graphId ? GRAPHS.find(g => g.id === init.graphId) || null : null)
  const [aiOpen, setAiOpen] = useState(init.ai)
  const [activeNav, setActiveNav] = useState(init.nav)
  const [skillsTab, setSkillsTab] = useState(init.tab)
  const [selectedSkill, setSelectedSkill] = useState(() => init.skillId ? findSkill(init.skillId) || null : null)
  const [selectedGroup, setSelectedGroup] = useState(() => init.groupId ? GROUPS.find(g => g.id === init.groupId) || null : null)
  const [importedSkill, setImportedSkill] = useState(null)
  const [aiBuild, setAiBuild] = useState(false)
  const [aiSide, setAiSide] = useState('right') // 'right' | 'left'
  const [leftSession, setLeftSession] = useState(false)
  const [aiSeed, setAiSeed] = useState(null)
  const [aiNonce, setAiNonce] = useState(0)
  const [buildPrompt, setBuildPrompt] = useState(null) // null | 'right' | 'left'
  const [scratchOpen, setScratchOpen] = useState(false)
  const [runSkill, setRunSkill] = useState(null) // null | { slug, name }
  const build = useBuildDraft()

  const slugify = (s) => (s || 'skill').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Open AI FDE in "test / run" mode for a published skill — prefilled slash command.
  const startTest = (skill) => {
    if (!skill) return
    setImportedSkill(null); build.stop(); setAiBuild(false); setAiSeed(null)
    setRunSkill({ slug: slugify(skill.name), name: skill.name })
    setAiSide('right'); setLeftSession(false); setAiNonce(n => n + 1); setAiOpen(true)
  }

  // Build a blank skill seeded with the given name + description.
  const startScratch = (name, desc) => {
    const md = `# ${name}\n\n## Description\n${desc || 'Describe what this skill does and the outcome it produces.'}\n\n## When to use\n- Describe the trigger conditions for this skill\n- Add the scenarios where it should activate\n\n## Workflow\n1. Step one — what the agent does first\n2. Step two — follow-up actions\n3. Step three — how it completes the task\n\n## Best practices\n- Keep instructions concise and unambiguous\n- Reference files in /references for source material\n`
    const files = [
      { name: 'SKILL.md', type: 'file', lang: 'markdown', content: md },
      { name: 'references', type: 'folder', children: [] },
      { name: 'scripts', type: 'folder', children: [] },
      { name: 'templates', type: 'folder', children: [] },
    ]
    setScratchOpen(false)
    openEditor({ name, files })
  }

  // Open the editor for a non-AI flow (scratch / zip) — deactivate the build bridge
  // so SkillCreate falls back to its own starter template instead of the AI draft.
  const openEditor = (imported = null) => {
    build.stop(); setAiBuild(false); setAiSeed(null); setRunSkill(null); setAiSide('right'); setLeftSession(false); setAiOpen(false)
    setImportedSkill(imported); setView('skill-create')
  }

  // Launch the AI FDE build journey seeded with the user's description.
  const startAIBuild = (side, desc) => {
    setImportedSkill(null); build.reset(); setRunSkill(null)
    setView('skill-create'); setAiBuild(true); setAiSide(side)
    setLeftSession(side === 'left')
    setAiSeed(desc); setAiNonce(n => n + 1); setAiOpen(true)
    setBuildPrompt(null)
  }

  const closeAI = () => {
    setAiSeed(null)
    if (aiSide === 'left') { setAiOpen(false); return } // keep session so the nav button can reopen
    setAiOpen(false); setAiBuild(false); setAiSide('right'); setRunSkill(null); build.stop()
  }
  const aiPanelEl = (
    <AIPanel key={aiBuild ? 'build-' + aiNonce : runSkill ? 'run-' + aiNonce : 'chat'} context={view} buildMode={aiBuild} seed={aiSeed} runSkill={runSkill} onClose={closeAI} />
  )

  // write state -> URL whenever anything changes
  useEffect(() => {
    const p = new URLSearchParams()
    if (view !== 'graphs') p.set('view', view)
    if (view === 'detail' && selectedGraph) p.set('graph', selectedGraph.id)
    if (view === 'skill-detail' && selectedSkill) p.set('skill', selectedSkill.id)
    if (view === 'skill-group-detail' && selectedGroup) p.set('grp', selectedGroup.id)
    if (aiOpen) p.set('ai', '1')
    if (activeNav && activeNav !== 'agents') p.set('nav', activeNav)
    if (view === 'skills' && skillsTab === 'Skill Groups') p.set('tab', 'groups')
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }, [view, selectedGraph, selectedSkill, selectedGroup, aiOpen, activeNav, skillsTab])

  // sync state <- URL on back/forward
  useEffect(() => {
    const onPop = () => {
      const s = readParams()
      setView(s.view)
      setSelectedGraph(s.graphId ? GRAPHS.find(g => g.id === s.graphId) || null : null)
      setSelectedSkill(s.skillId ? findSkill(s.skillId) || null : null)
      setSelectedGroup(s.groupId ? GROUPS.find(g => g.id === s.groupId) || null : null)
      setAiOpen(s.ai)
      setActiveNav(s.nav)
      setSkillsTab(s.tab)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const handleNavigate = (label) => {
    if (label === 'Skills') { setView('skills'); setActiveNav('agents'); setSkillsTab('Skills') }
  }

  return (
    <BuildContext.Provider value={build}>
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      overflow: 'hidden', background: 'var(--green-frame)',
    }}>
      <Sidebar onNavigate={handleNavigate} activeId={activeNav} onSelectNav={setActiveNav}
        activeChild={view === 'skills' ? 'Skills' : null}
        showFde={leftSession} fdeActive={aiOpen && aiSide === 'left'}
        onToggleFde={() => setAiOpen(o => !o)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <StatusBar aiOpen={aiOpen} onToggleAI={() => { setAiSide('right'); setLeftSession(false); setAiOpen(o => !o) }} />
        <div style={{ flex: 1, display: 'flex', gap: 0, padding: `8px 8px 8px ${(aiOpen && aiSide === 'left') ? 8 : 0}px`, overflow: 'hidden' }}>
          {/* AI FDE — LEFT dock (between sidebar and canvas) */}
          <div style={{
            position: 'relative', flexShrink: 0, overflow: 'hidden',
            width: (aiOpen && aiSide === 'left') ? 360 : 0, minWidth: (aiOpen && aiSide === 'left') ? 360 : 0,
            marginRight: (aiOpen && aiSide === 'left') ? 6 : 0,
            transition: 'width .42s cubic-bezier(.22,1,.36,1), min-width .42s cubic-bezier(.22,1,.36,1)',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 360, height: '100%', background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {leftSession && aiSide === 'left' && aiPanelEl}
            </div>
          </div>
          {view === 'graphs' && (
            <GraphsPage onOpenGraph={g => { setSelectedGraph(g); setView('detail') }} />
          )}
          {view === 'detail' && (
            <GraphDetailPage graph={selectedGraph} onBack={() => setView('graphs')} />
          )}
          {view === 'skills' && <SkillsPage tab={skillsTab} onTabChange={setSkillsTab} onCreate={() => setScratchOpen(true)} onBuildAI={() => setBuildPrompt('right')} onReveal={() => setBuildPrompt('left')} onLibrary={() => setView('skill-library')} onImportZip={d => openEditor(d)} onOpenSkill={s => { setSelectedSkill(s); setView('skill-detail') }} onOpenGroup={g => { setSelectedGroup(g); setView('skill-group-detail') }} />}
          {view === 'skill-create' && <SkillCreate imported={importedSkill} onBack={() => { setView('skills'); setActiveNav('agents') }} />}
          {view === 'skill-library' && <SkillLibrary onBack={() => { setView('skills'); setActiveNav('agents') }} onImport={() => {}} />}
          {view === 'skill-group-detail' && selectedGroup && <SkillGroupDetail group={selectedGroup} onBack={() => { setView('skills'); setActiveNav('agents'); setSkillsTab('Skill Groups') }} onOpenSkill={s => { setSelectedSkill(s); setView('skill-detail') }} onCreate={() => setScratchOpen(true)} onBuildAI={() => setBuildPrompt('right')} onLibrary={() => setView('skill-library')} onImportZip={d => openEditor(d)} />}
          {view === 'skill-detail' && selectedSkill && <SkillDetail skill={selectedSkill} onBack={() => { setView('skills'); setActiveNav('agents') }} onTest={() => startTest(selectedSkill)} />}

          {/* AI FDE — RIGHT dock (default) */}
          <div style={{
            position: 'relative', flexShrink: 0, overflow: 'hidden',
            width: (aiOpen && aiSide === 'right') ? 360 : 0, minWidth: (aiOpen && aiSide === 'right') ? 360 : 0,
            marginLeft: (aiOpen && aiSide === 'right') ? 6 : 0,
            transition: 'width .42s cubic-bezier(.22,1,.36,1), min-width .42s cubic-bezier(.22,1,.36,1)',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 360, height: '100%', background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {aiOpen && aiSide === 'right' && aiPanelEl}
            </div>
          </div>
        </div>
      </div>
      {buildPrompt && (
        <BuildWithAIModal onClose={() => setBuildPrompt(null)} onSubmit={desc => startAIBuild(buildPrompt, desc)} />
      )}
      {scratchOpen && (
        <ScratchSkillModal onClose={() => setScratchOpen(false)} onSubmit={(name, desc) => startScratch(name, desc)} />
      )}
    </div>
    </BuildContext.Provider>
  )
}
