import { createContext, useState, useRef, useEffect } from 'react'
import * as Synth from './skillSynth'

/* Shared bridge between the AI panel (right) and the SkillCreate editor (left).
   When `active`, SkillCreate is controlled by this state. The AI panel drives a
   guided "skill_creator" journey; content is synthesized from the user's input
   (see skillSynth.js) so any description produces a real-feeling build. */
export const BuildContext = createContext(null)

export const BASE_FILES = [
  { name: 'SKILL.MD', type: 'file' },
  { name: 'references', type: 'folder', children: [] },
  { name: 'scripts', type: 'folder', children: [] },
  { name: 'templates', type: 'folder', children: [] },
]

export function useBuildDraft() {
  const [active, setActive] = useState(false)
  const [name, setName] = useState('')
  const [files, setFiles] = useState(BASE_FILES)
  const [contents, setContents] = useState({ 'SKILL.MD': '' })
  const [langs, setLangs] = useState({ 'SKILL.MD': 'markdown' })
  const [selected, setSelected] = useState('SKILL.MD')
  const [openFolders, setOpenFolders] = useState({})
  const [tools, setTools] = useState([])
  const [questions, setQuestions] = useState([])

  // synchronous mirrors for stream prefixes / generation context
  const contentsRef = useRef({ 'SKILL.MD': '' })
  useEffect(() => { contentsRef.current = contents }, [contents])
  const ctxRef = useRef(null)
  const answersRef = useRef([])
  const refNamesRef = useRef([])
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const reset = () => {
    timers.current.forEach(clearTimeout); timers.current = []
    setActive(true); setName('')
    setFiles(BASE_FILES); setContents({ 'SKILL.MD': '' }); setLangs({ 'SKILL.MD': 'markdown' })
    setSelected('SKILL.MD'); setOpenFolders({}); setTools([]); setQuestions([])
    contentsRef.current = { 'SKILL.MD': '' }; ctxRef.current = null; answersRef.current = []; refNamesRef.current = []
  }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; setActive(false) }

  // Stream `addition` into a file char-by-char, keeping `prefix` static in front.
  const streamText = (fileName, prefix, addition, { lang = 'markdown', select = true } = {}) =>
    new Promise(resolve => {
      if (select) setSelected(fileName)
      if (lang) setLangs(l => ({ ...l, [fileName]: lang }))
      const total = addition.length
      const step = Math.max(3, Math.round(total / 110))
      let i = 0
      const tick = () => {
        i = Math.min(total, i + step)
        setContents(c => ({ ...c, [fileName]: prefix + addition.slice(0, i) }))
        if (i < total) { timers.current.push(setTimeout(tick, 16)) }
        else resolve()
      }
      tick()
    })

  // Analyze the description → derive name, tools, and clarifying questions.
  const analyze = (desc) => {
    const ctx = Synth.analyze(desc)
    ctxRef.current = ctx
    setName(ctx.name)
    const qs = Synth.buildQuestions(ctx)
    setQuestions(qs)
    return { ctx, questions: qs, work: Synth.workSteps(ctx), plan: Synth.planLine(ctx) }
  }
  const recordAnswers = (a) => { answersRef.current = a }

  // ── Staged build steps the AI panel awaits in sequence (each streams) ──
  const setBasics = () => streamText('SKILL.MD', '', Synth.overviewMd(ctxRef.current), { lang: 'markdown', select: true })
  const addWorkflow = () =>
    streamText('SKILL.MD', contentsRef.current['SKILL.MD'] || '', Synth.workflowMd(ctxRef.current, answersRef.current), { lang: 'markdown', select: true })
  const addTools = () => { setTools(ctxRef.current.tools); return Promise.resolve() }
  const addReferences = async () => {
    const refs = Synth.references(ctxRef.current)
    refNamesRef.current = refs.map(r => r.name)
    setFiles(fs => fs.map(f => f.name === 'references'
      ? { ...f, children: [...(f.children || []), ...refs.map(r => ({ name: r.name, type: 'file' }))] }
      : f))
    setOpenFolders(o => ({ ...o, references: true }))
    for (const r of refs) {
      const lang = r.name.endsWith('.json') ? 'json' : 'markdown'
      await streamText(r.name, '', r.content, { lang, select: true })
    }
  }
  const completionText = () => Synth.completionText(ctxRef.current, refNamesRef.current)

  // Post-build refinement: interpret the request, edit the most relevant file,
  // and return a natural confirmation.
  const refine = async (text) => {
    const t = (text || '').toLowerCase()
    const clean = (text || '').trim()
      .replace(/^(hey,?\s*)?(can you|could you|would you|please|pls|i want( to)?|i'?d like( to)?|let'?s|make sure to|make|add|also|and|update|change)\s+/i, '')
      .replace(/[.]+$/, '').trim()
    const bullet = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : (text || '').trim()

    // prefer an existing reference file if the topic matches, else SKILL.md
    const fileNames = Object.keys(contentsRef.current)
    let file = 'SKILL.MD', reply
    const emailRef = fileNames.find(n => /email-tone/.test(n))
    if (emailRef && /tone|voice|friendl|formal|warm|casual|concise|polite|sign-?off|greeting|subject/.test(t)) {
      file = emailRef; reply = `Refined **${emailRef}** so the message reflects that.`
    } else if (/risk|owner|next step|due|deadline|confirm|approval|review/.test(t)) {
      reply = 'Adjusted the **Best practices** in SKILL.md to cover that.'
    } else if (/tool|integration|connect|signal|input|context|source/.test(t)) {
      reply = 'Factored that into SKILL.md so the skill accounts for it.'
    } else {
      reply = 'Captured that in SKILL.md.'
    }
    const lang = file.endsWith('.json') ? 'json' : 'markdown'
    const prefix = (contentsRef.current[file] || '').replace(/\s+$/, '')
    await streamText(file, prefix + '\n', `- ${bullet}\n`, { lang, select: true })
    return reply
  }

  return {
    active, reset, stop, analyze, recordAnswers,
    setBasics, addWorkflow, addTools, addReferences, refine, completionText,
    questions,
    name, setName, files, setFiles, contents, setContents, langs, setLangs,
    selected, setSelected, openFolders, setOpenFolders, tools, setTools,
  }
}
