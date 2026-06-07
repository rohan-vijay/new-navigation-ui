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

/* ── Agent build driver — same interface as useBuildDraft, so the AI panel
   drives it identically, but it fills an extraction-agent form instead. ── */
const AGENT_QUESTIONS = [
  { q: 'Which sources should this agent read from?', multi: true, options: ['Google Drive', 'SharePoint', 'Notion', 'Uploaded files'], default: [0] },
  { q: 'When a value is missing, it should…', multi: false, options: ['Return null', 'Skip the field', 'Flag for review'], default: 0 },
]
function agentAnalyze(desc) {
  const s = (desc || '').toLowerCase()
  let name, type, fields
  if (/contract|agreement|nda|msa/.test(s)) { name = 'Contract Extraction'; type = 'contract'; fields = [{ name: 'parties', type: 'Array' }, { name: 'effective_date', type: 'Date' }, { name: 'term_length', type: 'String' }, { name: 'total_value', type: 'Number' }, { name: 'renewal_terms', type: 'String' }, { name: 'status', type: 'String' }] }
  else if (/invoice|receipt|bill/.test(s)) { name = 'Invoice Extraction'; type = 'invoice'; fields = [{ name: 'vendor', type: 'String' }, { name: 'invoice_number', type: 'String' }, { name: 'total', type: 'Number' }, { name: 'due_date', type: 'Date' }, { name: 'line_items', type: 'Array' }] }
  else { name = 'Document Extraction'; type = 'document'; fields = [{ name: 'title', type: 'String' }, { name: 'date', type: 'Date' }, { name: 'amount', type: 'Number' }, { name: 'summary', type: 'String' }, { name: 'status', type: 'String' }] }
  const work = [`Identified this as a ${type} extraction task`, `Selected ${fields.length} output fields to capture`, 'Chose formatting rules for dates and amounts', 'Picked a default model for the workload']
  const plan = `I'll set up an agent that reads each ${type}, extracts ${fields.map(f => f.name).join(', ')}, and returns a clean JSON object.`
  return { name, type, fields, work, plan }
}
function agentPromptText(ctx, answers) {
  const sources = (answers && answers[0] && answers[0].a) || 'Google Drive'
  const missing = ((answers && answers[1] && answers[1].a) || 'Return null').toLowerCase()
  const missLine = missing.startsWith('return') ? '- If a field is missing, return null'
    : missing.startsWith('skip') ? '- If a field is missing, omit it from the output'
    : '- If a field is missing, set it to null and flag it for review'
  return `Read each ${ctx.type} from ${sources} and extract the following fields: ${ctx.fields.map(f => f.name).join(', ')}.\n\nFormatting rules:\n- Return dates as YYYY-MM-DD\n- Return amounts as plain numbers (no currency symbols)\n${missLine}\n\nOnly process documents that are ${ctx.type}s; skip anything else. Return a single JSON object that matches the output schema.`
}

export function useAgentDraft() {
  const [active, setActive] = useState(false)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('sonnet')
  const [fields, setFields] = useState([{ name: '', type: 'String' }])
  const [tools, setTools] = useState([])
  const [skills, setSkills] = useState([])
  const [questions, setQuestions] = useState([])
  const ctxRef = useRef(null)
  const answersRef = useRef(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setActive(true); setName(''); setPrompt(''); setModel('sonnet'); setFields([{ name: '', type: 'String' }]); setTools([]); setSkills([]); setQuestions([]); ctxRef.current = null; answersRef.current = null }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; setActive(false) }

  const copy = {
    intro: "Using your description to draft an **extraction agent** — I'll pull structured fields from your sources, not just a one-off answer.",
    ask: "A couple of quick questions — answer them below and I'll build the agent.",
    building: "On it — building your agent now. Watch it fill in on the left.",
  }

  const analyze = (desc) => {
    const ctx = agentAnalyze(desc)
    ctxRef.current = ctx
    setName(ctx.name)
    setQuestions(AGENT_QUESTIONS)
    return { ctx, questions: AGENT_QUESTIONS, work: ctx.work, plan: ctx.plan }
  }
  const recordAnswers = (a) => { answersRef.current = a }

  const streamPrompt = (full) => new Promise(resolve => {
    const total = full.length, step = Math.max(3, Math.round(total / 110)); let i = 0
    const tick = () => { i = Math.min(total, i + step); setPrompt(full.slice(0, i)); if (i < total) timers.current.push(setTimeout(tick, 16)); else resolve() }
    tick()
  })

  const setBasics = () => { setName(ctxRef.current.name); return streamPrompt(agentPromptText(ctxRef.current, answersRef.current)) }
  const addWorkflow = () => Promise.resolve()
  const addTools = () => { setFields(ctxRef.current.fields); return Promise.resolve() }
  const addReferences = () => Promise.resolve()
  const completionText = () => `Done — your **${ctxRef.current.name}** agent is drafted with ${ctxRef.current.fields.length} output fields. Review it and hit **Create agent**, or tell me what to change.`
  const refine = async () => "Got it — I've adjusted the draft on the left to reflect that."

  return {
    active, reset, stop, analyze, recordAnswers,
    setBasics, addWorkflow, addTools, addReferences, refine, completionText,
    questions, copy,
    name, setName, prompt, setPrompt, model, setModel, fields, setFields, tools, setTools, skills, setSkills,
  }
}
