import { useState, useRef, useEffect, useContext } from 'react'
import { BuildContext } from './aiBuild'
import { SALES_SKILLS } from '../data/skills'

const cmdSlug = (s) => (s || 'skill').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
// every available skill, exposed as a slash command for the test runner
const SKILL_CMDS = SALES_SKILLS.map(s => ({ slug: cmdSlug(s.name), name: s.name }))

// split text into plain + highlighted /command tokens for the colored backdrop
function highlightCommands(text) {
  const re = /\/[a-zA-Z0-9-]+/g
  const out = []
  let last = 0, m, k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={k++}>{text.slice(last, m.index)}</span>)
    out.push(<span key={k++} style={{ color: '#1f7a3d' }}>{m[0]}</span>)
    last = re.lastIndex
  }
  out.push(<span key={k++}>{text.slice(last)}</span>)
  return out
}

const SUGGESTIONS = {
  graphs: [
    'What is an Enterprise Context Graph?',
    'Which graphs are most active right now?',
    'Which data sources feed these graphs?',
  ],
  detail: [
    'Summarize the most connected nodes',
    'Which edges have the most violations?',
    'Show recent changes in this graph',
  ],
  skills: [
    'What can I build with Skills?',
    'Which skills are most used?',
    'Create a skill from a template',
  ],
  'skill-create': [
    'Draft a SKILL.md from a short description',
    'Suggest tools this skill should use',
    'Write the workflow steps for me',
    'Add example files to references',
  ],
}

const GREETING = {
  'skill-create': { title: "Let's build your skill", sub: "Describe what it should do and I'll draft it with you." },
}

// dummy responses (premium, contextual) keyed by the quick-starter text
const RESPONSES = {
  'Draft a SKILL.md from a short description':
    "Great — here's a starting structure based on a document-processing skill:\n\n**# Invoice Extractor**\n\n**Overview** — Pulls totals, line items, and vendor details from PDF invoices into clean JSON.\n\n**When to use** — Any time a finance workflow receives an invoice that needs structured data.\n\nWant me to drop this into SKILL.md and expand each section?",
  'Suggest tools this skill should use':
    "For this skill I'd recommend three tools:\n\n• **PDF Parser** — extracts text & tables from documents\n• **OCR Engine** — handles scanned or image-based files\n• **Schema Validator** — verifies the extracted fields\n\nShall I add these under the Tools section?",
  'Write the workflow steps for me':
    "Here's a clean workflow you can drop into SKILL.md:\n\n1. Receive the input document\n2. Detect format and route to the right parser\n3. Extract the target fields\n4. Validate against the output schema\n5. Return structured JSON\n\nWant me to insert this into the Workflow section?",
  'Add example files to references':
    "I'll add three starter references to ground the agent:\n\n• `sample-invoice.pdf`\n• `field-mapping.json`\n• `output-schema.json`\n\nThese give concrete examples to reference at runtime. Create them now?",
}

function getResponse(text) {
  return RESPONSES[text] ||
    "Got it. I've drafted an approach for that and I can apply it directly to your SKILL.md — just say the word and I'll make the edit, or refine it with a bit more detail."
}

/* ── Skill "run" simulation — produces a believable execution trace + result ── */
function runPlan(skill, input) {
  const s = (skill.name + ' ' + input).toLowerCase()
  const tools = []
  if (/sales|crm|deal|account|lead|pipeline|renewal/.test(s)) tools.push('Salesforce')
  if (/email|follow|outreach|message/.test(s)) tools.push('Gmail')
  if (/slack|notify|channel|alert/.test(s)) tools.push('Slack')
  if (/doc|pdf|invoice|contract|file|report/.test(s)) tools.push('Document Parser')
  const toolLine = tools.length ? `Invoked ${tools.join(', ')} to gather context` : 'Pulled the relevant records and context'
  return [
    `Parsed the input and matched it to this skill's trigger conditions`,
    `Loaded instructions from SKILL.md and the /references files`,
    toolLine,
    `Reasoned over the inputs following the skill's workflow steps`,
    `Validated the output against the skill's expected format`,
  ]
}

function runResponse(skill, input) {
  const s = (skill.name + ' ' + input).toLowerCase()
  const head = `Done — ran **${skill.name}** on your input. Here's what it returned:`
  if (/lead|qualif|prioriti|route/.test(s)) {
    return `${head}\n\n**Qualification: A — High priority**\n\n• **ICP fit** — Strong (mid-market SaaS, 200–500 employees, matches target segment)\n• **Intent signals** — Visited pricing twice, requested a demo, opened 3 of 4 emails\n• **Score** — 87 / 100\n\n**Recommended action** — Route to the Enterprise AE pod and book a discovery call within 24h. A draft intro email is ready in the activity log.`
  }
  if (/renewal|churn|risk|retention/.test(s)) {
    return `${head}\n\n**Renewal risk: Elevated**\n\n• **Health score** — 62 / 100 (down 11 pts this quarter)\n• **Signals** — Usage down 18%, two open support escalations, champion changed roles\n• **Renewal date** — 47 days out\n\n**Recommended action** — Trigger a save-play: exec sponsor check-in + tailored value review. Draft talking points attached.`
  }
  if (/follow|email|summary|recap|call|meeting/.test(s)) {
    return `${head}\n\n**Follow-up email (draft)**\n\n> Hi Sarah — great speaking today. As discussed, I'll send over the security overview and a tailored ROI estimate by Thursday. Next step: a 30-min technical deep-dive with your data team.\n\n**CRM summary** — Logged the call, advanced the deal to *Evaluation*, and set a follow-up task for Thursday.`
  }
  if (/invoice|doc|pdf|extract|contract|parse/.test(s)) {
    return `${head}\n\n**Extracted fields**\n\n• **Vendor** — Northwind Traders\n• **Invoice #** — INV-20418\n• **Total** — $14,250.00\n• **Due date** — 2026-06-30\n• **Line items** — 4 (validated against the PO)\n\nOutput is structured JSON, ready to push to your finance workflow.`
  }
  return `${head}\n\n**Result**\n\n• Interpreted the request and applied the skill's workflow end-to-end\n• Pulled the supporting context and ran the core logic\n• Produced a structured, CRM-ready output\n\nEverything matched the skill's expected format. Try another input to test a different case.`
}

// shared metrics so the colored backdrop and the transparent textarea wrap identically
const RUN_TEXT = {
  fontSize: 14, lineHeight: 1.45, fontFamily: 'inherit', padding: 0, margin: 0,
  whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere',
  maxHeight: 120, overflowY: 'hidden', boxSizing: 'border-box',
}

const BUILD_OPENER =
  "Hi — I'm AI FDE. Tell me what skill you'd like to build: who uses it, what inputs it works from, and what it should produce.\n\nFor example: *\"Handle post-call follow-up for my sales meetings — use the transcript, Salesforce record, email and Slack to draft a follow-up email and a CRM-ready deal summary.\"*"

export default function AIPanel({ onClose, context = 'graphs', buildMode = false, seed = null, runSkill = null }) {
  const runMode = !!runSkill && !buildMode
  const prefix = runMode ? `/${runSkill.slug} ` : ''
  const [input, setInput] = useState(prefix)
  const [messages, setMessages] = useState(
    runMode
      ? [{ role: 'ai', text: `You're testing the **${runSkill.name}** skill.\n\nType a sample input after the \`/${runSkill.slug}\` command below and press enter — I'll run the skill and show you exactly what it returns.` }]
      : buildMode ? (seed ? [{ role: 'user', text: seed }] : [{ role: 'ai', text: BUILD_OPENER }]) : [])
  const [typing, setTyping] = useState(false)
  const [slash, setSlash] = useState(null) // null | { start, end, items, active }
  const [tall, setTall] = useState(false)
  const [bPhase, setBPhase] = useState(buildMode && seed ? 'intro' : 'await') // await | questions | building | done
  const bottomRef = useRef(null)
  const taRef = useRef(null)
  const timers = useRef([])
  const autoGrow = (el) => { if (!el) return; el.style.height = 'auto'; const sh = el.scrollHeight; el.style.height = Math.min(sh, 120) + 'px'; el.style.overflowY = sh > 120 ? 'auto' : 'hidden'; setTall(sh > 30) }
  const descRef = useRef('')
  const build = useContext(BuildContext)

  const suggestions = SUGGESTIONS[context] || SUGGESTIONS.graphs
  const greeting = GREETING[context] || { title: "Hey, I'm AI FDE", sub: 'I can help you do your best work.' }
  const started = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  // reset textarea height whenever the field is cleared (after send)
  useEffect(() => { if (input === '' && taRef.current) taRef.current.style.height = 'auto' }, [input])
  // in run mode, place the caret right after the prefilled command
  useEffect(() => {
    if (!runMode || !taRef.current) return
    const el = taRef.current
    autoGrow(el)
    el.focus()
    const end = el.value.length
    el.setSelectionRange(end, end)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); return id }

  // If launched with a seed description, kick off the build journey immediately.
  // (No ref guard — must re-schedule cleanly under StrictMode's double-invoke.)
  useEffect(() => {
    if (buildMode && seed && build?.active) runBuildIntro(seed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Guided "skill_creator" intro → clarifying questions ──
  const runBuildIntro = (desc) => {
    descRef.current = desc
    const info = build.analyze(desc)
    setBPhase('intro')
    setTyping(true)
    after(700, () => {
      setTyping(false)
      setMessages(m => [...m, { role: 'ai', text: "Using the **skill_creator** skill since you want a reusable agent behavior, not just a one-off draft.", work: info.work }])
      setTyping(true)
    })
    after(1700, () => {
      setTyping(false)
      setMessages(m => [...m, { role: 'ai', text: info.plan }])
      setTyping(true)
    })
    after(2500, () => {
      setTyping(false)
      setMessages(m => [...m, { role: 'ai', text: "A few quick questions — answer them below and I'll build the skill.", subtle: true }])
      setBPhase('questions')
    })
  }

  // ── User finished the question card → summarize + stream the files in ──
  const onAnswers = async (answers) => {
    build.recordAnswers(answers)
    setMessages(m => [...m, { type: 'answers', answers }])
    setBPhase('building')
    setMessages(m => [...m, { role: 'ai', text: "On it — building your skill now. Watch the files take shape on the left." }])
    await build.setBasics()
    await build.addWorkflow()
    await build.addTools()
    await build.addReferences()
    setMessages(m => [...m, { role: 'ai', text: build.completionText() }])
    setBPhase('done')
  }

  // detect whether the caret sits inside a "/command" token → drive the dropdown
  const updateSlash = (el) => {
    const pos = el.selectionStart
    const val = el.value
    let i = pos
    while (i > 0 && !/\s/.test(val[i - 1])) i--
    const token = val.slice(i, pos)
    if (token.startsWith('/')) {
      const q = token.slice(1).toLowerCase()
      const items = SKILL_CMDS.filter(c => c.slug.includes(q) || c.name.toLowerCase().includes(q))
      setSlash(items.length ? { start: i, end: pos, items, active: 0 } : null)
    } else setSlash(null)
  }

  // replace the in-progress token with the chosen command
  const chooseSlash = (c) => {
    if (!slash) return
    const before = input.slice(0, slash.start)
    const after = input.slice(slash.end)
    const insert = `/${c.slug} `
    const next = before + insert + after
    const caret = (before + insert).length
    setInput(next)
    setSlash(null)
    requestAnimationFrame(() => {
      const el = taRef.current
      if (!el) return
      el.focus(); el.setSelectionRange(caret, caret); autoGrow(el)
    })
  }

  // ── Run / test a published skill against a sample input ──
  const runTest = (text) => {
    const m = text.match(/^\s*(\/[a-zA-Z0-9-]+)\s*/)
    const cmd = m ? m[1] : `/${runSkill.slug}`
    const t = (m ? text.slice(m[0].length) : text).trim()
    if (!t || typing) return
    const target = SKILL_CMDS.find(c => `/${c.slug}` === cmd) || runSkill
    setMessages(mm => [...mm, { role: 'user', cmd, text: t }])
    setInput('')
    setSlash(null)
    if (taRef.current) taRef.current.style.height = 'auto'
    const plan = runPlan(target, t)
    setMessages(mm => [...mm, { role: 'ai', text: `Running **${target.name}**…`, subtle: true }])
    setTyping(true)
    after(1500, () => {
      setTyping(false)
      setMessages(mm => [...mm, { role: 'ai', text: runResponse(target, t), work: plan }])
    })
  }

  const send = (text) => {
    const t = text.trim()
    if (!t) return
    if (runMode) { runTest(t); return }
    const isBuild = buildMode && build?.active
    setMessages(m => [...m, { role: 'user', text: t }])
    setInput('')
    if (isBuild && bPhase === 'await') { runBuildIntro(t); return }
    if (isBuild && bPhase === 'done') {
      setTyping(true)
      after(650, async () => {
        setTyping(false)
        const reply = await build.refine(t)
        setMessages(m => [...m, { role: 'ai', text: reply }])
      })
      return
    }
    setTyping(true)
    after(850, () => {
      setTyping(false)
      setMessages(m => [...m, { role: 'ai', text: getResponse(t) }])
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 48%, #f4f9f4 78%, #eaf4ec 100%)', position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 12px 12px 18px', flexShrink: 0, borderBottom: '1px solid rgba(16,52,31,0.06)' }}>
        <span style={{ flex: 1 }} />
        <HeaderIconButton title="History" onClick={() => {}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e685b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
        </HeaderIconButton>
        <HeaderIconButton title="New chat" onClick={() => setMessages(buildMode ? [{ role: 'ai', text: BUILD_OPENER }] : [])}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e685b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </HeaderIconButton>
        <HeaderIconButton title="Close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e685b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </HeaderIconButton>
      </div>
      {!started ? (
        /* ── Empty state: greeting + quick starters ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', overflowY: 'auto' }}>
          <FdeLogo />
          <div style={{ fontFamily: 'var(--serif)', fontSize: 25, fontWeight: 500, color: '#1a1a1a', marginTop: 22, marginBottom: 8, textAlign: 'center' }}>
            {greeting.title}
          </div>
          <div style={{ fontSize: 14.5, color: '#9097a0', marginBottom: 30, textAlign: 'center' }}>
            {greeting.sub}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: '10px 20px', background: '#fff', border: '1px solid #e6e8e6', borderRadius: 22,
                fontSize: 13.5, color: '#374151', cursor: 'pointer', transition: 'all .15s',
                textAlign: 'center', lineHeight: 1.4, maxWidth: '100%',
                boxShadow: '0 1px 2px rgba(16,52,31,0.04)',
              }}
                onMouseOver={e => { e.currentTarget.style.background = '#f5f8f5'; e.currentTarget.style.borderColor = '#cfe0d2'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,52,31,0.08)' }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e6e8e6'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(16,52,31,0.04)' }}
              >{s}</button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Conversation thread ── */
        <div className="dark-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => {
            if (m.type === 'answers') return <AnswersSummary key={i} answers={m.answers} />
            return <Bubble key={i} role={m.role} text={m.text} work={m.work} subtle={m.subtle} cmd={m.cmd} />
          })}
          {typing && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, animation: 'fdeFadeUp .2s ease' }}>
              <MiniLogo />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#fff', border: '1px solid #ececec', borderRadius: '14px 14px 14px 4px', padding: '13px 14px', boxShadow: '0 2px 10px rgba(16,52,31,0.06)' }}>
                {[0, 1, 2].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9bb39f', animation: 'fdeBlink 1.2s infinite', animationDelay: `${d * 0.16}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Bottom dock: question sheet (superimposed) + input ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {bPhase === 'questions' && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', padding: '0 16px 10px', zIndex: 5 }}>
            <QuestionCard onDone={onAnswers} questions={build.questions} />
          </div>
        )}
        {runMode && slash && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', padding: '0 18px 8px', zIndex: 6 }}>
            <div style={{ background: '#fff', border: '1px solid #e7efe8', borderRadius: 12, boxShadow: '0 16px 40px rgba(16,52,31,0.16), 0 3px 10px rgba(16,52,31,0.08)', padding: 5, maxHeight: 230, overflowY: 'auto' }} className="dark-scroll">
              {slash.items.map((c, i) => (
                <div key={c.slug}
                  onMouseDown={e => { e.preventDefault(); chooseSlash(c) }}
                  onMouseEnter={() => setSlash(s => s && { ...s, active: i })}
                  style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#2f3a30', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', background: i === slash.active ? '#f1f6f1' : 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.slug}
                </div>
              ))}
            </div>
          </div>
        )}
      <div style={{ padding: '14px 18px 18px' }}>
        <div style={{
          position: 'relative', display: 'flex', alignItems: tall ? 'flex-end' : 'center',
          background: '#fff', border: '1px solid #e4ece4', borderRadius: 16, padding: '13px 15px',
          boxShadow: '0 10px 30px rgba(16,52,31,0.14), 0 3px 8px rgba(16,52,31,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        }}>
          {!runMode && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 10, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.5v11M3.5 9h11" stroke="#9097a0" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}
          {runMode ? (
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <div aria-hidden style={{ ...RUN_TEXT, position: 'absolute', inset: 0, pointerEvents: 'none', color: '#374151' }}>
                {highlightCommands(input)}
              </div>
              <textarea ref={taRef} rows={1} value={input} autoFocus wrap="soft" spellCheck={false}
                onChange={e => { setInput(e.target.value); autoGrow(e.target); updateSlash(e.target) }}
                onKeyUp={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) updateSlash(e.target) }}
                onClick={e => updateSlash(e.target)}
                onBlur={() => setSlash(null)}
                onKeyDown={e => {
                  if (slash) {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSlash(s => ({ ...s, active: (s.active + 1) % s.items.length })); return }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSlash(s => ({ ...s, active: (s.active - 1 + s.items.length) % s.items.length })); return }
                    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); chooseSlash(slash.items[slash.active]); return }
                    if (e.key === 'Escape') { e.preventDefault(); setSlash(null); return }
                  }
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
                }}
                style={{ ...RUN_TEXT, position: 'relative', width: '100%', display: 'block', border: 'none', outline: 'none', background: 'transparent', resize: 'none', color: 'transparent', caretColor: '#16341f' }} />
            </div>
          ) : (
            <textarea ref={taRef} rows={1} value={input}
              onChange={e => { setInput(e.target.value); autoGrow(e.target) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder={started ? 'Reply to AI FDE...' : 'Ask about the current screen...'}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, color: '#374151', background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.45, maxHeight: 120, overflowY: 'hidden', padding: 0 }} />
          )}
          {(runMode ? input.replace(/^\s*\/[a-zA-Z0-9-]+\s*/, '').trim() : input.trim()) ? (
            <button onClick={() => send(input)} style={{ background: 'var(--green-btn)', border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><rect x="6" y="2" width="4" height="7" rx="2" stroke="#9097a0" strokeWidth="1.3" /><path d="M4 7.5a4 4 0 008 0M8 11.5v2" stroke="#9097a0" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

function HeaderIconButton({ title, onClick, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hov ? 'rgba(16,52,31,0.06)' : 'transparent', transition: 'background .12s' }}>
      {children}
    </button>
  )
}

function Bubble({ role, text, work, subtle, cmd }) {
  if (subtle) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px', color: '#9aa3a0', fontSize: 12.5, animation: 'fdeFadeUp .22s ease' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="#c4cdc5" strokeWidth="1.3" /><path d="M8 5v3.3l2 1.3" stroke="#c4cdc5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {text}
      </div>
    )
  }
  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fdeFadeUp .22s ease' }}>
        <div style={{
          maxWidth: '82%', background: 'linear-gradient(180deg,#1d4228,#16341f)', color: '#f4f9f4',
          fontSize: 13.5, lineHeight: 1.5, padding: '11px 15px', borderRadius: '15px 15px 4px 15px',
          boxShadow: '0 4px 14px rgba(16,52,31,0.18)',
        }}>
          {cmd && <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: '#a9e8bd', marginRight: 7 }}>{cmd}</span>}
          {text}
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, animation: 'fdeFadeUp .22s ease' }}>
      <MiniLogo />
      <div style={{ maxWidth: '82%' }}>
        <div style={{
          background: '#fff', border: '1px solid #ececec', color: '#2f3a30',
          fontSize: 13.5, lineHeight: 1.6, padding: '12px 15px', borderRadius: '14px 14px 14px 4px',
          boxShadow: '0 2px 12px rgba(16,52,31,0.06), 0 1px 2px rgba(0,0,0,0.03)',
        }}>{renderText(text)}</div>
        {work && work.length > 0 && <ShowWork steps={work} />}
      </div>
    </div>
  )
}

/* Collapsible "Show work" reasoning trace under an AI message */
function ShowWork({ steps }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        cursor: 'pointer', padding: '2px 0', fontSize: 12.5, color: '#8a9290', fontWeight: 500,
      }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M4 2.5L8 6l-4 3.5" stroke="#9aa3a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Show work
      </button>
      {open && (
        <div style={{ marginTop: 7, paddingLeft: 11, borderLeft: '2px solid #e7efe8', display: 'flex', flexDirection: 'column', gap: 7, animation: 'fdeFadeUp .18s ease' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#6f7a73', lineHeight: 1.45 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#bcd0bf', marginTop: 6, flexShrink: 0 }} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Inline clarifying-question card — carousel of single/multi-select questions */
function QuestionCard({ onDone, questions }) {
  const qs = questions
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(() => qs.map(q => q.multi ? (q.default || []) : (q.default ?? null)))
  const [extra, setExtra] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const q = qs[idx]
  const last = idx === qs.length - 1

  const pick = (oi) => {
    setAnswers(a => {
      const next = [...a]
      if (q.multi) {
        const set = new Set(next[idx])
        set.has(oi) ? set.delete(oi) : set.add(oi)
        next[idx] = [...set].sort((x, y) => x - y)
      } else next[idx] = oi
      return next
    })
  }
  const isPicked = (oi) => q.multi ? answers[idx].includes(oi) : answers[idx] === oi
  const advance = () => {
    if (extra.trim()) pickExtra()
    if (last) { setSubmitted(true); onDone(collect()); }
    else setIdx(i => i + 1)
  }
  const pickExtra = () => {} // free-text captured into collect()
  const collect = () => qs.map((qq, qi) => {
    if (qq.multi) return { q: qq.q, a: answers[qi].map(o => qq.options[o]).join(', ') || '—' }
    return { q: qq.q, a: answers[qi] != null ? qq.options[answers[qi]] : (qi === idx && extra.trim() ? extra.trim() : '—') }
  })

  if (submitted) return null

  return (
    <div style={{
      background: '#fff', border: '1px solid #e7efe8', borderRadius: 18,
      boxShadow: '0 18px 48px rgba(16,52,31,0.18), 0 4px 12px rgba(16,52,31,0.10), 0 1px 2px rgba(0,0,0,0.05)',
      padding: 16, animation: 'fdeFadeUp .24s cubic-bezier(.2,.7,.2,1)',
    }}>
      {/* header: question + pager */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#1f2a22', lineHeight: 1.45 }}>{q.q}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, color: '#9aa3a0', fontSize: 12 }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={pagerBtn(idx === 0)}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span style={{ whiteSpace: 'nowrap' }}>{idx + 1} of {qs.length}</span>
          <button onClick={() => setIdx(i => Math.min(qs.length - 1, i + 1))} disabled={last} style={pagerBtn(last)}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {q.options.map((opt, oi) => {
          const on = isPicked(oi)
          return (
            <button key={oi} onClick={() => pick(oi)} style={{
              display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', width: '100%',
              background: on ? '#f3f8f3' : 'transparent', border: '1px solid', borderColor: on ? '#cfe3d3' : 'transparent',
              borderRadius: 10, padding: '10px 11px', cursor: 'pointer', fontSize: 13, color: '#2f3a30', transition: 'all .12s',
            }}
              onMouseOver={e => { if (!on) e.currentTarget.style.background = '#f7faf7' }}
              onMouseOut={e => { if (!on) e.currentTarget.style.background = 'transparent' }}>
              {q.multi ? (
                <span style={{ width: 16, height: 16, borderRadius: 5, border: '1.6px solid', borderColor: on ? '#16341f' : '#cdd5cf', background: on ? '#16341f' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {on && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.3 2.3L9.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
              ) : (
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.6px solid', borderColor: on ? '#16341f' : '#cdd5cf', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16341f' }} />}
                </span>
              )}
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* footer: free-text + continue */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, paddingTop: 12, borderTop: '1px solid #f0f4f0' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10.5 3.2l2.3 2.3M2.5 13.5l.5-2.6 7.2-7.2 2.1 2.1-7.2 7.2-2.6.5z" stroke="#aab2ab" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          <input value={extra} onChange={e => setExtra(e.target.value)} placeholder="Something else..."
            onKeyDown={e => { if (e.key === 'Enter') advance() }}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }} />
        </div>
        <button onClick={advance} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--green-btn)', color: '#fff',
          border: 'none', borderRadius: 9, padding: '0 15px', height: 34, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(22,52,31,0.25)', flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 11, opacity: 0.7 }}>↵</span>
          {last ? 'Done' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

const pagerBtn = (disabled) => ({
  width: 20, height: 20, borderRadius: 6, border: '1px solid #e7efe8', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
  color: disabled ? '#d3dad4' : '#7d877f', opacity: disabled ? 0.5 : 1, padding: 0,
})

/* Answers recap — rendered as a normal user (green) message */
function AnswersSummary({ answers }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fdeFadeUp .22s ease' }}>
      <div style={{
        maxWidth: '86%', background: 'linear-gradient(180deg,#1d4228,#16341f)', color: '#f4f9f4',
        padding: '12px 15px', borderRadius: '15px 15px 4px 15px', boxShadow: '0 4px 14px rgba(16,52,31,0.18)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {answers.map((a, i) => (
            <div key={i}>
              <div style={{ fontSize: 13.5, color: 'rgba(244,249,244,0.66)', lineHeight: 1.5, marginBottom: 3 }}>{a.q}</div>
              <div style={{ fontSize: 13.5, color: '#fff', fontWeight: 500, lineHeight: 1.5 }}>{a.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// lightweight markdown-ish rendering for **bold** and `code`
function renderText(text) {
  return text.split('\n').map((line, i) => (
    <div key={i} style={{ minHeight: line ? 'auto' : 8 }}>
      {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, j) => {
        if (seg.startsWith('**') && seg.endsWith('**')) return <strong key={j} style={{ fontWeight: 600, color: '#1a1a1a' }}>{seg.slice(2, -2)}</strong>
        if (seg.startsWith('`') && seg.endsWith('`')) return <code key={j} style={{ fontFamily: 'var(--mono)', fontSize: 12, background: '#f3f1ea', color: '#6a5a32', padding: '1px 5px', borderRadius: 4 }}>{seg.slice(1, -1)}</code>
        return seg
      })}
    </div>
  ))
}

function MiniLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 29 29" fill="none" style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 5px rgba(16,52,31,0.18))' }}>
      <path d="M1.42578 12.7997C1.42578 8.81706 1.42578 6.82576 2.20085 5.30461C2.88261 3.96657 3.97047 2.87871 5.30852 2.19694C6.82967 1.42188 8.82096 1.42188 12.8036 1.42188H15.648C19.6306 1.42188 21.6219 1.42188 23.143 2.19694C24.4811 2.87871 25.569 3.96657 26.2507 5.30461C27.0258 6.82576 27.0258 8.81706 27.0258 12.7997V15.6441C27.0258 19.6267 27.0258 21.618 26.2507 23.1391C25.569 24.4772 24.4811 25.565 23.143 26.2468C21.6219 27.0219 19.6306 27.0219 15.648 27.0219H5.9769C4.38386 27.0219 3.58734 27.0219 2.97887 26.7118C2.44366 26.4391 2.00851 26.004 1.73581 25.4688C1.42578 24.8603 1.42578 24.0638 1.42578 22.4708V12.7997Z" fill="url(#fdeGradMini)" />
      <path d="M7.13645 13.746C7.07878 13.1286 7.12877 12.5627 7.2864 12.0482C7.44403 11.5338 7.73622 11.0707 8.16298 10.6592L13.73 13.5679L12.6612 7.30718C13.6877 6.74917 14.7181 6.74917 15.7446 7.30718L14.7181 13.5679L20.2428 10.6592C20.6696 11.0707 20.9695 11.5338 21.1425 12.0482C21.3155 12.5627 21.3693 13.1286 21.3155 13.746L15.0641 14.6721L19.5623 19.2588C19.1356 20.3471 18.2898 20.9645 17.0364 21.1109L14.2106 15.511L11.4271 21.1109C10.1699 20.9645 9.32791 20.3471 8.90115 19.2588L13.3571 14.6721L7.14798 13.746H7.13645Z" fill="white" />
      <defs><radialGradient id="fdeGradMini" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(21.1027 22.4 -5.97179 19.2548 4.53929 4.62188)"><stop stopColor="#6A763B" /><stop offset="1" stopColor="#17370B" /></radialGradient></defs>
    </svg>
  )
}

/* Brand FDE logo — radial-gradient box + white burst + drop shadow */
function FdeLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 29 29" fill="none"
      style={{ filter: 'drop-shadow(0 4px 10px rgba(16,52,31,0.18))' }}>
      <path d="M1.42578 12.7997C1.42578 8.81706 1.42578 6.82576 2.20085 5.30461C2.88261 3.96657 3.97047 2.87871 5.30852 2.19694C6.82967 1.42188 8.82096 1.42188 12.8036 1.42188H15.648C19.6306 1.42188 21.6219 1.42188 23.143 2.19694C24.4811 2.87871 25.569 3.96657 26.2507 5.30461C27.0258 6.82576 27.0258 8.81706 27.0258 12.7997V15.6441C27.0258 19.6267 27.0258 21.618 26.2507 23.1391C25.569 24.4772 24.4811 25.565 23.143 26.2468C21.6219 27.0219 19.6306 27.0219 15.648 27.0219H5.9769C4.38386 27.0219 3.58734 27.0219 2.97887 26.7118C2.44366 26.4391 2.00851 26.004 1.73581 25.4688C1.42578 24.8603 1.42578 24.0638 1.42578 22.4708V12.7997Z" fill="url(#fdeGrad)" />
      <path d="M7.13645 13.746C7.07878 13.1286 7.12877 12.5627 7.2864 12.0482C7.44403 11.5338 7.73622 11.0707 8.16298 10.6592L13.73 13.5679L12.6612 7.30718C13.6877 6.74917 14.7181 6.74917 15.7446 7.30718L14.7181 13.5679L20.2428 10.6592C20.6696 11.0707 20.9695 11.5338 21.1425 12.0482C21.3155 12.5627 21.3693 13.1286 21.3155 13.746L15.0641 14.6721L19.5623 19.2588C19.1356 20.3471 18.2898 20.9645 17.0364 21.1109L14.2106 15.511L11.4271 21.1109C10.1699 20.9645 9.32791 20.3471 8.90115 19.2588L13.3571 14.6721L7.14798 13.746H7.13645Z" fill="white" />
      <defs>
        <radialGradient id="fdeGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(21.1027 22.4 -5.97179 19.2548 4.53929 4.62188)">
          <stop stopColor="#6A763B" />
          <stop offset="1" stopColor="#17370B" />
        </radialGradient>
      </defs>
    </svg>
  )
}
