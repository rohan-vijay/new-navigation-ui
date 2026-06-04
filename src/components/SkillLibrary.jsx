import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RichMarkdown } from './SkillCreate'
import { GROUPS, GroupIcon } from './SkillsPage'
import { ToolGlyph } from './AddToolPanel'

const CP = { strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
function CatIcon({ id, color = '#7a6f5c', size = 18 }) {
  const s = { width: size, height: size, viewBox: '0 0 18 18', fill: 'none' }
  const p = { ...CP, stroke: color }
  switch (id) {
    case 'sales': return <svg {...s}><path d="M3 15V9M7 15V5M11 15v-7M15 15V3" {...p} /></svg>
    case 'marketing': return <svg {...s}><path d="M3 7.5v3a1.5 1.5 0 001.5 1.5H6l1 3h1.5l-.5-3 6 3V4.5L8 7.5H4.5A1.5 1.5 0 003 7.5Z" {...p} /></svg>
    case 'success': return <svg {...s}><path d="M3.5 10v-1a5.5 5.5 0 0111 0v1" {...p} /><rect x="2.5" y="9.5" width="3" height="4" rx="1" {...p} /><rect x="12.5" y="9.5" width="3" height="4" rx="1" {...p} /><path d="M14 13.5v.5a2 2 0 01-2 2H9.5" {...p} /></svg>
    case 'finance': return <svg {...s}><path d="M9 3v12" {...p} /><path d="M11.8 5.4A2.6 2.6 0 009.4 4H8.2a2.2 2.2 0 000 4.4h1.6a2.2 2.2 0 010 4.4H8.2a2.6 2.6 0 01-2.4-1.4" {...p} /></svg>
    case 'eng': return <svg {...s}><path d="M6 6 3 9l3 3M12 6l3 3-3 3M10.5 4.5l-3 9" {...p} /></svg>
    case 'people': return <svg {...s}><circle cx="9" cy="6" r="2.6" {...p} /><path d="M4 14.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" {...p} /></svg>
    case 'product': return <svg {...s}><path d="M9 2.5l6 3.2v6.6l-6 3.2-6-3.2V5.7l6-3.2z" {...p} /><path d="M3 5.7l6 3.3 6-3.3M9 9v6.5" {...p} /></svg>
    case 'legal': return <svg {...s}><path d="M9 3v12M4.5 15h9M5 6l-2.5 4a2.5 2.5 0 005 0L5 6ZM13 6l-2.5 4a2.5 2.5 0 005 0L13 6ZM4 5.5l10-2" {...p} /></svg>
    case 'ops': return <svg {...s}><circle cx="9" cy="9" r="2.4" {...p} /><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" {...p} /></svg>
    case 'it': return <svg {...s}><path d="M9 2.5l5 1.8v4c0 3.3-2.2 5.4-5 6.2-2.8-.8-5-2.9-5-6.2v-4L9 2.5Z" {...p} /></svg>
    case 'data': return <svg {...s}><ellipse cx="9" cy="4.5" rx="5.5" ry="2" {...p} /><path d="M3.5 4.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M3.5 9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" {...p} /></svg>
    case 'utility': return <svg {...s}><path d="M12.4 2.6a3.2 3.2 0 00-3.9 4.2L3.2 12.1a1.5 1.5 0 102.1 2.1l5.3-5.3a3.2 3.2 0 004.2-3.9l-2 2-1.7-.4-.4-1.7 1.7-2.3z" {...p} /></svg>
    default: return <svg {...s}><rect x="3" y="3" width="12" height="12" rx="3" {...p} /></svg>
  }
}
function CatVisual({ c, size = 18 }) {
  return c.logo ? <ToolGlyph slug={c.logo} name={c.cat} size={size} /> : <CatIcon id={c.icon} size={size} />
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const RAW_LIBRARY = [
  {
    cat: 'Sales', icon: 'sales', skills: [
      { name: 'Lead Qualifier', desc: 'Score inbound leads against your ICP and route A-tier to the right rep.' },
      { name: 'Outreach Email Writer', desc: 'Draft personalized cold and follow-up emails grounded in account signals.' },
      { name: 'Discovery Call Summarizer', desc: 'Turn call transcripts into MEDDIC notes and next steps.' },
      { name: 'Competitor Battlecard', desc: 'Surface live positioning and objection responses for a competitor.' },
      { name: 'Proposal Generator', desc: 'Assemble tailored proposals and pricing from approved templates.' },
      { name: 'Deal Risk Analyzer', desc: 'Flag stalled or single-threaded deals and recommend a save play.' },
      { name: 'Account Researcher', desc: 'Build a research brief — org chart, initiatives, and entry points.' },
      { name: 'Objection Handler', desc: 'Suggest proven responses to pricing, timing, and competitor pushback.' },
      { name: 'Meeting Prep Brief', desc: 'Compile attendee context and talking points before a call.' },
      { name: 'Quote Builder', desc: 'Configure pricing and discounts from approved rate cards.' },
    ],
  },
  {
    cat: 'Marketing', icon: 'marketing', skills: [
      { name: 'Campaign Brief Builder', desc: 'Draft channel-ready campaign briefs from a single goal statement.' },
      { name: 'SEO Content Optimizer', desc: 'Analyze a page and recommend on-page SEO improvements.' },
      { name: 'Social Post Composer', desc: 'Generate on-brand posts across platforms from one update.' },
      { name: 'Persona Researcher', desc: 'Build buyer personas from firmographic and behavioral signals.' },
      { name: 'Ad Copy Generator', desc: 'Write and A/B-variant ad copy for a target audience.' },
      { name: 'Landing Page Auditor', desc: 'Review a page for clarity, conversion, and messaging gaps.' },
      { name: 'Newsletter Drafter', desc: 'Turn recent updates into a ready-to-send newsletter.' },
      { name: 'Brand Voice Checker', desc: 'Flag copy that strays from your brand voice and tone.' },
      { name: 'Event Recap Writer', desc: 'Summarize a webinar or event into shareable highlights.' },
    ],
  },
  {
    cat: 'Customer Success', icon: 'success', skills: [
      { name: 'Renewal Risk Monitor', desc: 'Flag at-risk accounts ahead of renewal from usage and sentiment.' },
      { name: 'Onboarding Planner', desc: 'Generate a tailored onboarding plan for a new customer.' },
      { name: 'QBR Deck Generator', desc: 'Assemble a quarterly business review from account data.' },
      { name: 'Account Health Scorer', desc: 'Compute a health score from product, support, and sentiment signals.' },
      { name: 'Ticket Summarizer', desc: 'Condense a support thread into status and next action.' },
      { name: 'Churn Predictor', desc: 'Surface early churn signals and recommend interventions.' },
      { name: 'Adoption Nudge Writer', desc: 'Draft targeted nudges to drive feature adoption.' },
      { name: 'Escalation Router', desc: 'Classify and route escalations to the right owner.' },
    ],
  },
  {
    cat: 'Finance', icon: 'finance', skills: [
      { name: 'Pipeline Forecaster', desc: 'Predict quarterly attainment from pipeline coverage and velocity.' },
      { name: 'Invoice Reconciler', desc: 'Match invoices to POs and flag discrepancies.' },
      { name: 'Expense Categorizer', desc: 'Classify expenses against your chart of accounts.' },
      { name: 'Budget Variance Analyzer', desc: 'Explain actuals-vs-budget variances by line item.' },
      { name: 'Contract Term Extractor', desc: 'Pull key financial terms from contracts and MSAs.' },
      { name: 'Spend Anomaly Detector', desc: 'Surface unusual spend patterns for review.' },
      { name: 'Revenue Recognizer', desc: 'Apply rev-rec rules to bookings and subscriptions.' },
    ],
  },
  {
    cat: 'Engineering', icon: 'eng', skills: [
      { name: 'PR Reviewer', desc: 'Review diffs for correctness and suggest improvements.' },
      { name: 'Incident Summarizer', desc: 'Turn alert threads into a structured incident timeline.' },
      { name: 'API Doc Generator', desc: 'Generate reference docs from source and comments.' },
      { name: 'Issue Triager', desc: 'Label, prioritize, and route incoming issues.' },
      { name: 'Test Case Writer', desc: 'Draft unit and edge-case tests from a spec.' },
      { name: 'Log Anomaly Finder', desc: 'Scan logs for anomalies and likely root causes.' },
      { name: 'Release Notes Drafter', desc: 'Compile merged PRs into readable release notes.' },
      { name: 'Dependency Auditor', desc: 'Flag outdated or vulnerable dependencies.' },
    ],
  },
  {
    cat: 'Product', icon: 'product', skills: [
      { name: 'Feedback Theme Clusterer', desc: 'Group customer feedback into prioritized themes.' },
      { name: 'PRD Drafter', desc: 'Turn a problem statement into a structured PRD.' },
      { name: 'Feature Spec Reviewer', desc: 'Check specs for gaps, risks, and missing edge cases.' },
      { name: 'Roadmap Summarizer', desc: 'Produce a stakeholder-ready roadmap update.' },
      { name: 'Interview Synthesizer', desc: 'Synthesize user-interview notes into insights.' },
      { name: 'Competitive Teardown', desc: 'Compare a competitor feature set against yours.' },
      { name: 'Launch Announcer', desc: 'Draft internal and external launch announcements.' },
    ],
  },
  {
    cat: 'People & HR', icon: 'people', skills: [
      { name: 'Job Description Writer', desc: 'Draft inclusive, role-specific job descriptions.' },
      { name: 'Resume Screener', desc: 'Screen resumes against a role rubric and rank candidates.' },
      { name: 'New Hire Onboarder', desc: 'Build a first-30-days plan for a new employee.' },
      { name: 'Interview Question Generator', desc: 'Generate role-calibrated interview questions.' },
      { name: 'Policy Q&A Assistant', desc: 'Answer employee questions from HR policy docs.' },
      { name: 'Performance Review Helper', desc: 'Draft balanced review summaries from inputs.' },
      { name: 'Org Chart Builder', desc: 'Assemble and update reporting structures.' },
    ],
  },
  {
    cat: 'Legal', icon: 'legal', skills: [
      { name: 'Contract Reviewer', desc: 'Review contracts and flag risky or non-standard clauses.' },
      { name: 'NDA Generator', desc: 'Draft NDAs from approved templates and inputs.' },
      { name: 'Clause Risk Flagger', desc: 'Highlight liability, term, and indemnity risks.' },
      { name: 'Policy Summarizer', desc: 'Summarize long policy documents into key points.' },
      { name: 'Compliance Checklist Builder', desc: 'Generate checklists for a given regulation.' },
      { name: 'DPA Analyzer', desc: 'Extract data-processing terms and obligations.' },
    ],
  },
  {
    cat: 'Operations', icon: 'ops', skills: [
      { name: 'SOP Generator', desc: 'Turn a process into a clear standard operating procedure.' },
      { name: 'Vendor Researcher', desc: 'Compile vendor options with pros, cons, and pricing.' },
      { name: 'Meeting Notes Summarizer', desc: 'Capture decisions and action items from meetings.' },
      { name: 'Process Mapper', desc: 'Map a workflow into steps, owners, and handoffs.' },
      { name: 'Inventory Reconciler', desc: 'Match counts against records and flag gaps.' },
      { name: 'Task Router', desc: 'Assign incoming requests to the right team.' },
      { name: 'Status Report Compiler', desc: 'Roll up project updates into a status report.' },
    ],
  },
  {
    cat: 'IT & Security', icon: 'it', skills: [
      { name: 'Access Request Reviewer', desc: 'Evaluate access requests against least-privilege rules.' },
      { name: 'Phishing Triager', desc: 'Classify reported emails and recommend action.' },
      { name: 'Runbook Generator', desc: 'Draft step-by-step runbooks for common incidents.' },
      { name: 'Asset Inventory Auditor', desc: 'Reconcile device and software inventory.' },
      { name: 'Incident Report Writer', desc: 'Produce a post-incident report from the timeline.' },
      { name: 'Policy Compliance Scanner', desc: 'Check configs against security policy baselines.' },
    ],
  },
  {
    cat: 'Data & Analytics', icon: 'data', skills: [
      { name: 'SQL Query Writer', desc: 'Translate a question into a validated SQL query.' },
      { name: 'Dashboard Summarizer', desc: 'Narrate what changed in a dashboard this week.' },
      { name: 'Data Quality Checker', desc: 'Profile a dataset and flag quality issues.' },
      { name: 'Metric Definition Finder', desc: 'Resolve a metric to its canonical definition.' },
      { name: 'Anomaly Explainer', desc: 'Explain a spike or drop with likely drivers.' },
      { name: 'Report Narrator', desc: 'Turn a table of results into a written summary.' },
      { name: 'Cohort Analyzer', desc: 'Build and compare cohorts on a chosen metric.' },
    ],
  },
]
const RAW_GENERAL = [
  {
    cat: 'Utilities', icon: 'utility', skills: [
      { name: 'Doc to PDF', desc: 'Convert documents into clean, shareable PDFs.' },
      { name: 'PDF Extractor', desc: 'Pull text and tables out of any PDF.' },
      { name: 'File Converter', desc: 'Convert between common file formats.' },
      { name: 'Web Researcher', desc: 'Search the web and compile a sourced brief.' },
      { name: 'Summarizer', desc: 'Condense long documents into key points.' },
      { name: 'Translator', desc: 'Translate documents between languages.' },
      { name: 'Transcriber', desc: 'Turn audio and video into searchable transcripts.' },
      { name: 'OCR Reader', desc: 'Extract text from images and scanned files.' },
      { name: 'Data Extractor', desc: 'Pull structured fields from unstructured text.' },
      { name: 'Spreadsheet Cleaner', desc: 'Normalize and de-duplicate messy spreadsheets.' },
    ],
  },
]
const RAW_APPS = [
  {
    cat: 'Salesforce', logo: 'salesforce', skills: [
      { name: 'Opportunity Updater', desc: 'Sync deal notes and next steps to Salesforce.' },
      { name: 'Lead Enricher', desc: 'Enrich Salesforce leads with firmographic data.' },
      { name: 'Pipeline Hygiene Bot', desc: 'Flag stale or incomplete opportunities.' },
      { name: 'Account 360 Brief', desc: 'Compile a full account summary from Salesforce.' },
      { name: 'Report Narrator', desc: 'Explain a Salesforce report in plain English.' },
    ],
  },
  {
    cat: 'Snowflake', logo: 'snowflake', skills: [
      { name: 'SQL Generator', desc: 'Turn questions into validated Snowflake SQL.' },
      { name: 'Warehouse Cost Monitor', desc: 'Flag expensive queries and warehouses.' },
      { name: 'Schema Explainer', desc: 'Document tables and columns automatically.' },
      { name: 'Data Freshness Checker', desc: 'Alert when pipelines fall behind schedule.' },
      { name: 'Query Optimizer', desc: 'Suggest rewrites for slow or costly queries.' },
    ],
  },
  {
    cat: 'HubSpot', logo: 'hubspot', skills: [
      { name: 'Contact Deduper', desc: 'Find and merge duplicate contacts.' },
      { name: 'Sequence Drafter', desc: 'Draft outreach sequences from a single goal.' },
      { name: 'Deal Stage Auditor', desc: 'Flag deals stuck in a stage too long.' },
      { name: 'Form Lead Router', desc: 'Route new form leads to the right owner.' },
    ],
  },
  {
    cat: 'Slack', logo: 'slack', skills: [
      { name: 'Channel Digest', desc: "Summarize a channel's activity into a daily digest." },
      { name: 'Thread Summarizer', desc: 'Condense a long thread into decisions and owners.' },
      { name: 'Standup Collector', desc: 'Gather and post async standups automatically.' },
    ],
  },
  {
    cat: 'GitHub', logo: 'github', skills: [
      { name: 'PR Summarizer', desc: 'Summarize a pull request for reviewers.' },
      { name: 'Issue Triager', desc: 'Label, prioritize, and route new issues.' },
      { name: 'Release Notes Drafter', desc: 'Compile merged PRs into readable release notes.' },
    ],
  },
  {
    cat: 'Notion', logo: 'notion', skills: [
      { name: 'Meeting Notes Sync', desc: 'Push meeting notes into the right Notion database.' },
      { name: 'Doc Summarizer', desc: 'Summarize a Notion page or database view.' },
      { name: 'Wiki Gardener', desc: 'Flag stale or duplicate wiki pages for cleanup.' },
    ],
  },
]
const RAW_ALL = [
  ...RAW_GENERAL.map(c => ({ ...c, group: 'General' })),
  ...RAW_LIBRARY.map(c => ({ ...c, group: 'Departments' })),
  ...RAW_APPS.map(c => ({ ...c, group: 'By app' })),
]
const GROUP_ORDER = ['General', 'Departments', 'By app']
const LIBRARY = RAW_ALL.map(c => ({ ...c, skills: c.skills.map(s => ({ ...s, id: `lib-${slug(c.cat)}-${slug(s.name)}` })) }))

const ALL_COUNT = LIBRARY.reduce((n, c) => n + c.skills.length, 0)

export default function SkillLibrary({ onBack, onImport }) {
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [preview, setPreview] = useState(null) // { skill, cat }
  const [importing, setImporting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LIBRARY
      .filter(c => activeCat === 'all' || c.cat === activeCat)
      .map(c => ({ ...c, skills: c.skills.filter(s => !q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)) }))
      .filter(c => c.skills.length > 0)
  }, [query, activeCat])

  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const catIds = (cat) => cat.skills.map(s => s.id)
  const allInCat = (cat) => catIds(cat).every(id => selected.has(id))
  const toggleCat = (cat) => setSelected(s => {
    const n = new Set(s); const ids = catIds(cat)
    if (ids.every(id => n.has(id))) ids.forEach(id => n.delete(id)); else ids.forEach(id => n.add(id))
    return n
  })
  const clear = () => setSelected(new Set())
  const doImport = () => { onImport?.([...selected]); onBack?.() }

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 60, padding: '0 22px', borderBottom: '1px solid #efece6', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap' }}>Skill Library</span>
          <span style={{ fontSize: 12.5, color: '#a89e88', whiteSpace: 'nowrap' }}>{ALL_COUNT} skills</span>
        </div>
        <div style={{ position: 'relative', flexShrink: 0, width: 540, maxWidth: '52%' }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="8" cy="8" r="5.2" stroke="#9a917f" strokeWidth="1.5" /><path d="M12 12l3.5 3.5" stroke="#9a917f" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Search skills…"
            style={{ width: '100%', height: 40, border: '1px solid #e7dcc1', borderRadius: 10, padding: '0 38px 0 42px', fontSize: 14.5, color: '#2a2620', background: '#fff', outline: 'none', boxShadow: '0 1px 3px rgba(60,50,30,0.05)', transition: 'border-color .15s, box-shadow .15s' }}
            onFocus={e => { e.target.style.borderColor = '#16341f'; e.target.style.boxShadow = '0 2px 10px rgba(22,52,31,0.08)' }} onBlur={e => { e.target.style.borderColor = '#e7dcc1'; e.target.style.boxShadow = '0 1px 3px rgba(60,50,30,0.05)' }} />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: '#f1ede4', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8170' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onBack} title="Close" style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: '1px solid #e6e0d4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.background = '#f5f1e8'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#6b6453" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Category rail */}
        <div style={{ width: 268, flexShrink: 0, borderRight: '1px solid #efe9dd', background: '#fcfbf7', padding: '16px 14px', overflowY: 'auto' }}>
          <RailItem active={activeCat === 'all'} onClick={() => setActiveCat('all')} label="All skills" count={ALL_COUNT} icon={<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="5" height="5" rx="1.2" {...CP} stroke="#7a6f5c" /><rect x="10" y="3" width="5" height="5" rx="1.2" {...CP} stroke="#7a6f5c" /><rect x="3" y="10" width="5" height="5" rx="1.2" {...CP} stroke="#7a6f5c" /><rect x="10" y="10" width="5" height="5" rx="1.2" {...CP} stroke="#7a6f5c" /></svg>} />
          {GROUP_ORDER.map(g => {
            const cats = LIBRARY.filter(c => c.group === g)
            if (!cats.length) return null
            return (
              <div key={g} style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, color: '#b3a98f', textTransform: 'uppercase', padding: '2px 8px 6px' }}>{g}</div>
                {cats.map(c => {
                  const sel = catIds(c).filter(id => selected.has(id)).length
                  return <RailItem key={c.cat} active={activeCat === c.cat} onClick={() => setActiveCat(c.cat)} label={c.cat} count={c.skills.length} selCount={sel} icon={<CatVisual c={c} size={17} />} />
                })}
              </div>
            )
          })}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 100px' }}>
          {filtered.map(c => {
            const sel = catIds(c).filter(id => selected.has(id)).length
            return (
              <div key={c.cat} style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CatVisual c={c} size={17} /></span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>{c.cat}</span>
                  <span style={{ fontSize: 12, color: '#a89e88' }}>{c.skills.length} skills</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => toggleCat(c)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                    border: '1px solid', borderColor: allInCat(c) ? '#16341f' : '#e3ddd1', background: allInCat(c) ? '#eef3ee' : '#fff', color: allInCat(c) ? '#16341f' : '#4a463e', transition: 'all .12s',
                  }}>
                    <Check on={allInCat(c)} />
                    {allInCat(c) ? 'All selected' : `Add all ${c.cat}`}
                  </button>
                </div>
                <div style={{ border: '1px solid #eee7da', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
                  {c.skills.map((s, i) => (
                    <SkillRow key={s.id} s={s} on={selected.has(s.id)} last={i === c.skills.length - 1}
                      onToggle={() => toggle(s.id)} onView={() => setPreview({ skill: s, cat: c })} />
                  ))}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#9a917f', fontSize: 14 }}>No skills match “{query}”.</div>
          )}
        </div>
      </div>

      {/* Sticky footer (always visible) */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', background: 'rgba(254,253,251,0.94)', backdropFilter: 'blur(6px)', borderTop: '1px solid #ece5d7' }}>
        <span style={{ fontSize: 13.5, color: selected.size ? '#3a3a36' : '#9a917f' }}>
          {selected.size ? <><strong style={{ fontWeight: 700 }}>{selected.size}</strong> skill{selected.size > 1 ? 's' : ''} selected</> : 'No skills selected'}
        </span>
        {selected.size > 0 && <button onClick={clear} style={{ fontSize: 12.5, color: '#8a8170', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>}
        <div style={{ flex: 1 }} />
        <button onClick={onBack} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => selected.size && setImporting(true)} disabled={selected.size === 0}
          style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: selected.size ? 'pointer' : 'default', opacity: selected.size ? 1 : 0.45, boxShadow: selected.size ? '0 4px 14px rgba(22,52,31,0.25)' : 'none' }}
          onMouseOver={e => { if (selected.size) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (selected.size) e.currentTarget.style.background = '#16341f' }}>
          {selected.size ? `Add ${selected.size} to skills` : 'Add to skills'}
        </button>
      </div>

      {preview && (
        <PreviewModal entry={preview} selected={selected.has(preview.skill.id)}
          onToggle={() => toggle(preview.skill.id)} onClose={() => setPreview(null)} />
      )}

      {importing && (
        <ImportFlow count={selected.size} onClose={() => setImporting(false)}
          onDone={(opts) => { onImport?.([...selected], opts); onBack?.() }} />
      )}
    </div>
  )
}

const IMPORT_ACCESS = [
  { id: 'private', title: 'Only me', sub: 'Keep these private to you for now' },
  { id: 'restricted', title: 'Specific people', sub: 'Share with selected teammates' },
  { id: 'org', title: 'Everyone at Acme', sub: 'Anyone in the workspace can use them' },
]

function ImportFlow({ count, onClose, onDone }) {
  const [step, setStep] = useState(1)
  const [access, setAccess] = useState('private')
  const [invite, setInvite] = useState('')
  const [groupMode, setGroupMode] = useState('none') // 'none' | 'group'
  const [groupIds, setGroupIds] = useState([])
  const [grpQuery, setGrpQuery] = useState('')
  const [grpOpen, setGrpOpen] = useState(false)
  const [grpPos, setGrpPos] = useState(null)
  const grpBtnRef = useRef(null)
  const selGroups = GROUPS.filter(g => groupIds.includes(g.id))
  const toggleGroup = (id) => setGroupIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  const openGrp = () => {
    if (grpOpen) { setGrpOpen(false); return }
    const r = grpBtnRef.current.getBoundingClientRect()
    const menuH = 340
    const below = r.bottom + 6 + menuH < window.innerHeight
    setGrpPos({ left: r.left, width: r.width, top: below ? r.bottom + 6 : undefined, bottom: below ? undefined : (window.innerHeight - r.top + 6) })
    setGrpQuery(''); setGrpOpen(true)
  }

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(28,24,18,0.36)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 520, maxWidth: '92vw', maxHeight: '86vh', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* header + stepper */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f2ede3' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Add {count} skill{count > 1 ? 's' : ''} to your workspace</div>
              <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2 }}>{step === 1 ? 'Step 1 of 2 · Set who can access them' : 'Step 2 of 2'}</div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {step === 1 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {IMPORT_ACCESS.map(o => {
                  const on = access === o.id
                  return (
                    <div key={o.id} onClick={() => setAccess(o.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 11, cursor: 'pointer', background: on ? '#f6f2ea' : '#fff', border: '1px solid', borderColor: on ? '#16341f' : '#eee7da', transition: 'all .12s' }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f6f3ec', border: '1px solid #ece5d7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AccessGlyph id={o.id} /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{o.title}</div>
                        <div style={{ fontSize: 12, color: '#8a8170', marginTop: 1 }}>{o.sub}</div>
                      </div>
                      <Radio on={on} />
                    </div>
                  )
                })}
              </div>
              {access === 'restricted' && (
                <input value={invite} onChange={e => setInvite(e.target.value)} placeholder="Add people by name or email"
                  style={{ width: '100%', height: 40, marginTop: 12, border: '1px solid #e6ddca', borderRadius: 10, padding: '0 14px', fontSize: 13.5, color: '#3a3a36', background: '#fff', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#e6ddca'} />
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {/* Don't add */}
                <div onClick={() => { setGroupMode('none'); setGroupIds([]); setGrpOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 11, cursor: 'pointer', background: groupMode === 'none' ? '#f6f2ea' : '#fff', border: '1px solid', borderColor: groupMode === 'none' ? '#16341f' : '#eee7da' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f6f3ec', border: '1px dashed #ddd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4l1 8.5a1 1 0 001 .9h6a1 1 0 001-.9L13 4M2 4h12M6 4V2.8A.8.8 0 016.8 2h2.4a.8.8 0 01.8.8V4" stroke="#b3a888" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>Don't add to a group</div>
                    <div style={{ fontSize: 12, color: '#8a8170', marginTop: 1 }}>Keep them ungrouped in your skills list</div>
                  </div>
                  <Radio on={groupMode === 'none'} />
                </div>

                {/* Add to a group */}
                <div>
                  <div onClick={() => setGroupMode('group')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 11, cursor: 'pointer', background: groupMode === 'group' ? '#f6f2ea' : '#fff', border: '1px solid', borderColor: groupMode === 'group' ? '#16341f' : '#eee7da' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f1ede4', border: '1px solid #e6e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5.2A1.2 1.2 0 013.2 4H6l1.2 1.5h5.6A1.2 1.2 0 0114 6.7v5.1a1.2 1.2 0 01-1.2 1.2H3.2A1.2 1.2 0 012 11.8V5.2z" stroke="#8a7648" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>Add to a group</div>
                      <div style={{ fontSize: 12, color: '#8a8170', marginTop: 1 }}>Place them in an existing skill group</div>
                    </div>
                    <Radio on={groupMode === 'group'} />
                  </div>

                  {groupMode === 'group' && (
                    <div style={{ marginTop: 10 }}>
                      <button ref={grpBtnRef} onClick={openGrp} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', minHeight: 48, padding: '8px 14px', borderRadius: 10, border: '1px solid', borderColor: grpOpen ? '#16341f' : '#e3ddd1', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {selGroups.length === 0 && <span style={{ fontSize: 13.5, color: '#9a917f' }}>Select one or more groups…</span>}
                          {selGroups.map(g => (
                            <span key={g.id} onMouseDown={e => { e.stopPropagation(); toggleGroup(g.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 6px 3px 8px', background: '#f1ede4', border: '1px solid #e6e0d4', borderRadius: 7, fontSize: 12.5, color: '#2a2620' }}>
                              {g.name}
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#8a8170" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            </span>
                          ))}
                        </div>
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ transform: grpOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      {grpOpen && grpPos && createPortal(
                        <>
                          <div onMouseDown={() => setGrpOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                          <div style={{ position: 'fixed', left: grpPos.left, width: grpPos.width, top: grpPos.top, bottom: grpPos.bottom, zIndex: 91, background: '#fff', border: '1px solid #e8e1d2', borderRadius: 11, boxShadow: '0 16px 44px rgba(40,32,18,0.22)', display: 'flex', flexDirection: 'column', maxHeight: 340, overflow: 'hidden' }}>
                            <div style={{ padding: 8, borderBottom: '1px solid #f2ede3' }}>
                              <div style={{ position: 'relative' }}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="7" cy="7" r="4.5" stroke="#a89e88" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                <input autoFocus value={grpQuery} onChange={e => setGrpQuery(e.target.value)} placeholder="Search groups…"
                                  style={{ width: '100%', height: 36, border: '1px solid #ece5d7', borderRadius: 9, padding: '0 12px 0 32px', fontSize: 13, color: '#3a3a36', background: '#faf7f0', outline: 'none', boxSizing: 'border-box' }}
                                  onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#ece5d7'} />
                              </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
                              {GROUPS.filter(g => g.name.toLowerCase().includes(grpQuery.trim().toLowerCase())).map(g => {
                                const on = groupIds.includes(g.id)
                                return (
                                  <div key={g.id} onMouseDown={e => { e.preventDefault(); toggleGroup(g.id) }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f7f4ee'} onMouseOut={e => e.currentTarget.style.background = on ? '#f6f2ea' : 'transparent'}
                                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', background: on ? '#f6f2ea' : 'transparent' }}>
                                    <span style={{ width: 18, height: 18, borderRadius: 5, border: '1.6px solid', borderColor: on ? '#16341f' : '#cdc3ae', background: on ? '#16341f' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.3 2.3L9.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2a2620' }}>{g.name}</div>
                                      <div style={{ fontSize: 11.5, color: '#9a917f' }}>{g.skills} skills · shared with {g.sharedBy}</div>
                                    </div>
                                  </div>
                                )
                              })}
                              {GROUPS.filter(g => g.name.toLowerCase().includes(grpQuery.trim().toLowerCase())).length === 0 && (
                                <div style={{ padding: '20px 0', textAlign: 'center', color: '#9a917f', fontSize: 13 }}>No groups found.</div>
                              )}
                            </div>
                          </div>
                        </>,
                        document.body)}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: '1px solid #f2ede3' }}>
          <button onClick={() => step === 1 ? onClose() : setStep(1)} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>{step === 1 ? 'Cancel' : 'Back'}</button>
          <div style={{ flex: 1 }} />
          {step === 1 ? (
            <button onClick={() => setStep(2)} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>Continue</button>
          ) : (
            <button onClick={() => onDone({ access, groupIds })} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>Add {count} skill{count > 1 ? 's' : ''}</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Radio({ on }) {
  return <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: on ? '5px solid #16341f' : '1.5px solid #d8cfba', background: '#fff', transition: 'all .12s' }} />
}

function AccessGlyph({ id }) {
  if (id === 'org') return <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.4" stroke="#7a6f5c" strokeWidth="1.3" /><path d="M2.6 9h12.8M9 2.6c1.8 1.7 1.8 11 0 12.8M9 2.6c-1.8 1.7-1.8 11 0 12.8" stroke="#7a6f5c" strokeWidth="1.1" /></svg>
  if (id === 'restricted') return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#7a6f5c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="3.4" stroke="#7a6f5c" strokeWidth="1.7" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#7a6f5c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="7.2" rx="1.6" stroke="#7a6f5c" strokeWidth="1.3" /><path d="M5.9 8V5.9a3.1 3.1 0 016.2 0V8" stroke="#7a6f5c" strokeWidth="1.3" /></svg>
}

function SkillRow({ s, on, last, onToggle, onView }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onToggle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', cursor: 'pointer',
        background: on ? '#f6f2ea' : hov ? '#faf7f0' : '#fff', borderBottom: last ? 'none' : '1px solid #f4eee2', transition: 'background .12s' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{s.name}</div>
        <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onView() }} style={{
        flexShrink: 0, height: 30, padding: '0 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        border: '1px solid #e3ddd1', background: '#fff', color: '#4a463e',
        opacity: hov ? 1 : 0, pointerEvents: hov ? 'auto' : 'none', transition: 'opacity .12s' }}
        onMouseOver={e => e.currentTarget.style.background = '#f5f1e8'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>View</button>
      <span style={{ flexShrink: 0 }}><Check on={on} box /></span>
    </div>
  )
}

function flattenPreview(files) {
  const rows = [], map = {}
  files.forEach(f => {
    if (f.type === 'folder') {
      rows.push({ name: f.name, folder: true })
      f.children.forEach(c => { const path = `${f.name}/${c.name}`; rows.push({ name: c.name, path, depth: 1, lang: c.lang }); map[path] = c })
    } else { rows.push({ name: f.name, path: f.name, lang: f.lang }); map[f.name] = f }
  })
  return { rows, map }
}

/* ── Category-aware, realistic preview content ── */
const TRAITS = {
  Sales: { input: 'CRM records, emails, and call notes', source: 'Salesforce', output: 'a CRM-ready brief', ref: 'Sales Playbook', unit: 'account', verbs: ['Score the inputs against ICP and intent signals', 'Draft the recommended action for the rep'] },
  Marketing: { input: 'briefs, content, and channel data', source: 'the CMS and analytics', output: 'channel-ready content', ref: 'Brand & Channel Guide', unit: 'campaign', verbs: ['Check the draft against brand voice and SEO rules', 'Generate per-channel variants'] },
  'Customer Success': { input: 'usage, support, and sentiment signals', source: 'the product and Zendesk', output: 'a health summary and next action', ref: 'CS Playbook', unit: 'account', verbs: ['Compute a health score from the signals', 'Recommend a retention or adoption play'] },
  Finance: { input: 'invoices, ledgers, and contracts', source: 'the ERP and spreadsheets', output: 'a reconciled report', ref: 'Finance Policy', unit: 'period', verbs: ['Match records and flag discrepancies', 'Explain variances against budget'] },
  Engineering: { input: 'code, diffs, and logs', source: 'GitHub and CI', output: 'a structured report', ref: 'Engineering Standards', unit: 'change', verbs: ['Analyze the diff for correctness and risk', 'Summarize findings with severity'] },
  Product: { input: 'feedback, specs, and research notes', source: 'the tracker and interviews', output: 'a synthesized document', ref: 'Product Rubric', unit: 'feature', verbs: ['Cluster the inputs into themes', 'Draft the structured output with priorities'] },
  'People & HR': { input: 'resumes, policies, and role rubrics', source: 'the ATS and HRIS', output: 'a structured assessment', ref: 'Hiring Rubric', unit: 'candidate', verbs: ['Evaluate against the role rubric', 'Produce a ranked, evidence-backed summary'] },
  Legal: { input: 'contracts and policy documents', source: 'the document store', output: 'a clause-level review', ref: 'Clause Standards', unit: 'document', verbs: ['Extract key clauses and obligations', 'Flag risky or non-standard terms with rationale'] },
  Operations: { input: 'processes, tickets, and records', source: 'internal systems', output: 'an SOP or status report', ref: 'Operations Playbook', unit: 'process', verbs: ['Map the steps, owners, and handoffs', 'Compile the output for distribution'] },
  'IT & Security': { input: 'access requests, configs, and alerts', source: 'the IdP and SIEM', output: 'a triage decision', ref: 'Security Baseline', unit: 'request', verbs: ['Evaluate against least-privilege and policy', 'Recommend approve / deny / escalate'] },
  'Data & Analytics': { input: 'tables, queries, and metrics', source: 'the warehouse', output: 'a validated query or narrative', ref: 'Metric Definitions', unit: 'dataset', verbs: ['Resolve metrics to canonical definitions', 'Generate and validate the query or summary'] },
  Utilities: { input: 'documents and files', source: 'the uploaded file', output: 'a converted or extracted result', ref: 'Conversion Rules', unit: 'file', verbs: ['Parse the input and detect its format', 'Transform and validate the output'] },
  Salesforce: { input: 'Salesforce objects and fields', source: 'Salesforce', output: 'an updated record or brief', ref: 'Salesforce Field Map', unit: 'record', verbs: ['Query the relevant objects via SOQL', 'Write back updates with an audit note'] },
  Snowflake: { input: 'warehouse tables and queries', source: 'Snowflake', output: 'validated SQL and results', ref: 'Warehouse Conventions', unit: 'query', verbs: ['Resolve tables and columns from the schema', 'Generate, cost-check, and run the SQL'] },
  HubSpot: { input: 'HubSpot contacts and deals', source: 'HubSpot', output: 'an updated CRM object', ref: 'HubSpot Field Map', unit: 'record', verbs: ['Fetch the matching contacts and deals', 'Apply the update via the HubSpot API'] },
  Slack: { input: 'channel and thread messages', source: 'Slack', output: 'a posted digest', ref: 'Channel Conventions', unit: 'channel', verbs: ['Read the relevant messages', 'Compose and post the digest'] },
  GitHub: { input: 'pull requests and issues', source: 'GitHub', output: 'a review or summary', ref: 'Repo Conventions', unit: 'PR', verbs: ['Read the diff or issue thread', 'Produce the review or release summary'] },
  Notion: { input: 'Notion pages and databases', source: 'Notion', output: 'an updated page', ref: 'Workspace Conventions', unit: 'page', verbs: ['Query the page or database', 'Write the structured update back'] },
}
const T_DEFAULT = { input: 'the provided inputs', source: 'connected sources', output: 'a structured result', ref: 'Reference Guide', unit: 'item', verbs: ['Analyze the inputs against the rules', 'Produce the result'] }

const TOOLS_BY_CAT = {
  Sales: [['Salesforce', ['Find records', 'Update opportunity']], ['Gmail', ['Draft email']]],
  Marketing: [['Google Analytics', ['Read metrics']], ['CMS', ['Publish content']]],
  'Customer Success': [['Zendesk', ['Read tickets']], ['Product API', ['Read usage signals']]],
  Finance: [['NetSuite', ['Read ledger']], ['Google Sheets', ['Read & write rows']]],
  Engineering: [['GitHub', ['Read PR', 'Comment']], ['CI', ['Read build logs']]],
  Product: [['Linear', ['Read issues']], ['Notion', ['Read research']]],
  'People & HR': [['Greenhouse', ['Read candidates']], ['HRIS', ['Read policies']]],
  Legal: [['Google Drive', ['Fetch document']], ['DocuSign', ['Read agreements']]],
  Operations: [['Google Sheets', ['Read records']], ['Jira', ['Create task']]],
  'IT & Security': [['Okta', ['Read access requests']], ['SIEM', ['Read alerts']]],
  'Data & Analytics': [['Snowflake', ['Run query', 'Read schema']], ['dbt', ['Read models']]],
  Utilities: [['File Reader', ['Parse file']], ['PDF Engine', ['Read & write PDF']]],
  Salesforce: [['Salesforce', ['SOQL query', 'Update record', 'Create record']]],
  Snowflake: [['Snowflake', ['Run query', 'Read schema', 'Estimate cost']]],
  HubSpot: [['HubSpot', ['Find contacts', 'Update deal', 'Enrich record']]],
  Slack: [['Slack', ['Read channel', 'Post message']]],
  GitHub: [['GitHub', ['Read PR', 'Comment', 'Create issue']]],
  Notion: [['Notion', ['Query database', 'Update page']]],
}
const APP_SLUG = {
  Salesforce: 'salesforce', Gmail: 'gmail', Slack: 'slack', Snowflake: 'snowflake', HubSpot: 'hubspot',
  GitHub: 'github', Notion: 'notion', Zendesk: 'zendesk', Linear: 'linear', Jira: 'jira',
  'Google Analytics': 'googleanalytics', 'Google Sheets': 'googlesheets', 'Google Drive': 'googledrive',
  Greenhouse: 'greenhouse', DocuSign: 'docusign', Okta: 'okta', dbt: 'dbt', NetSuite: 'netsuite',
}
function toolsForCat(catName) {
  const list = TOOLS_BY_CAT[catName] || [['Connected source', ['Read', 'Write']]]
  return list.map(([app, actions]) => ({ app, slug: APP_SLUG[app], actions }))
}

function firstClause(desc) {
  const m = (desc || '').replace(/\.$/, '').match(/^[^.,]+/)
  let c = (m ? m[0] : desc || '').trim()
  return c.charAt(0).toLowerCase() + c.slice(1)
}

function libFiles(skill, catName) {
  const t = TRAITS[catName] || T_DEFAULT
  const name = skill.name, desc = skill.desc
  const refName = slug(t.ref) + '.md'

  const skillMd = `# ${name}

## Description
${desc} It works from ${t.input} (via ${t.source}) and produces ${t.output}.

## When to use
- When a ${t.unit} needs to ${firstClause(desc)}
- As a repeatable step in the ${catName} workflow, run on demand or on a trigger

## Inputs
- ${t.input}
- Any parameters or context the caller provides

## Workflow
1. Gather ${t.input} from ${t.source}
2. ${t.verbs[0]}
3. ${t.verbs[1]}
4. Produce ${t.output} with a short rationale
5. Return the result for review before anything is sent or saved

## Output
${t.output.charAt(0).toUpperCase() + t.output.slice(1)}, formatted for ${catName}. See \`templates/output.md\`.

## Best practices
- Ground every result in the source ${t.unit} data — cite what it used
- Surface assumptions and a confidence signal alongside the output
- Never take an irreversible action without an explicit confirmation step
`

  const refDoc = `# ${t.ref}

Reference guidance **${name}** follows at runtime. Edit this to tune behavior
without touching the workflow.

## Principles
- Optimize for accuracy over completeness — flag low-confidence results
- Prefer the freshest ${t.unit} data available from ${t.source}
- Keep the output concise and ready to act on

## Checklist
- [ ] Required inputs present and validated
- [ ] Rules in \`config.json\` applied
- [ ] Output matches the template in \`templates/output.md\`
- [ ] Confidence and sources attached

## Thresholds
| Setting            | Value |
| ------------------ | ----- |
| Confidence floor   | 0.70  |
| Needs human review | < 0.55 |
`

  const configJson = `{
  "version": 1,
  "category": "${catName}",
  "source": "${t.source}",
  "thresholds": {
    "confidence_floor": 0.7,
    "needs_review_below": 0.55,
    "require_confirmation": true
  },
  "output": {
    "format": "markdown",
    "include_rationale": true,
    "cite_sources": true
  }
}
`

  const runPy = `"""${name} — ${catName} skill.

Reads ${t.input} from ${t.source}, applies the rules in references/,
and returns ${t.output}.
"""
from skill import tool, context, output


def run(request):
    cfg = context.load("references/config.json")

    # 1. gather inputs
    data = tool("${t.source}").fetch(request)

    # 2. ${t.verbs[0].toLowerCase()}
    rules = context.load("references/${refName}")
    analysis = analyze(data, rules, cfg)

    if analysis.confidence < cfg["thresholds"]["needs_review_below"]:
        analysis.flag_for_review("low confidence")

    # 3. ${t.verbs[1].toLowerCase()}
    return output.render("templates/output.md", analysis)


def analyze(data, rules, cfg):
    ...
`

  const outputTmpl = `# ${name} — Result

**${t.unit.charAt(0).toUpperCase() + t.unit.slice(1)}:** {{ ${t.unit} }}
**Generated:** {{ timestamp }}  ·  **Confidence:** {{ confidence }}

## Summary
{{ summary }}

## Key findings
- {{ finding }}

## Recommended next step
- {{ next_step }} — _owner:_ {{ owner }}

## Sources
- {{ source }}
`

  return [
    { name: 'SKILL.md', type: 'file', lang: 'markdown', content: skillMd },
    {
      name: 'references', type: 'folder', children: [
        { name: refName, type: 'file', lang: 'markdown', content: refDoc },
        { name: 'config.json', type: 'file', lang: 'json', content: configJson },
      ],
    },
    { name: 'scripts', type: 'folder', children: [{ name: 'run.py', type: 'file', lang: 'python', content: runPy }] },
    { name: 'templates', type: 'folder', children: [{ name: 'output.md', type: 'file', lang: 'markdown', content: outputTmpl }] },
  ]
}

function PreviewModal({ entry, selected, onToggle, onClose }) {
  const { skill, cat } = entry
  const files = useMemo(() => libFiles(skill, cat.cat), [skill, cat])
  const { rows, map } = useMemo(() => flattenPreview(files), [files])
  const tools = useMemo(() => toolsForCat(cat.cat), [cat])
  const [sel, setSel] = useState('SKILL.md')
  const file = map[sel]
  const content = file?.content ?? ''

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(28,24,18,0.36)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 1040, maxWidth: '94vw', height: '86vh', background: '#FEFDFB', borderRadius: 16, border: '1px solid #ece5d7', boxShadow: '0 24px 70px rgba(40,32,18,0.30)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* header (kept as is) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
          <span style={{ width: 42, height: 42, borderRadius: 11, background: '#f6f3ec', border: '1px solid #ece5d7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CatIcon id={cat.icon} size={21} color="#8a7648" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500, color: '#1a1a1a' }}>{skill.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8a7648', background: '#faf5ea', border: '1px solid #e7dcc1', padding: '2px 9px', borderRadius: 20 }}>{cat.cat}</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.desc}</div>
          </div>
          <span style={{ fontSize: 11.5, color: '#a89e88', background: '#f5f1e8', padding: '3px 10px', borderRadius: 6, flexShrink: 0 }}>Preview</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* body: tree + viewer */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* tree */}
          <div style={{ width: 244, flexShrink: 0, borderRight: '1px solid #efe9dd', background: '#fcfbf7', overflowY: 'auto', padding: '14px 12px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, color: '#9a917f', textTransform: 'uppercase', padding: '0 6px 8px' }}>Files</div>
            {rows.map((r, i) => r.folder ? (
              <div key={'f' + i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1.8 4.2A1.2 1.2 0 013 3h3l1.3 1.6H13a1.2 1.2 0 011.2 1.2v6.4A1.2 1.2 0 0113 13.4H3a1.2 1.2 0 01-1.2-1.2V4.2z" stroke="#9a917f" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: '#4a463e' }}>{r.name}</span>
              </div>
            ) : (
              <div key={r.path} onClick={() => setSel(r.path)}
                onMouseOver={e => { if (sel !== r.path) e.currentTarget.style.background = '#f4f1ea' }} onMouseOut={e => { if (sel !== r.path) e.currentTarget.style.background = 'transparent' }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', paddingLeft: r.depth ? 28 : 8, borderRadius: 7, cursor: 'pointer', background: sel === r.path ? '#efe9dc' : 'transparent' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 1.75h4.7a1 1 0 01.7.3l3.3 3.3a1 1 0 01.3.7V13.5A1.25 1.25 0 0111.75 14.75h-7.5A1.25 1.25 0 013 13.5v-10.5A1.25 1.25 0 014.25 1.75z" stroke={sel === r.path ? '#7a6a48' : '#9a917f'} strokeWidth="1.2" strokeLinejoin="round" /><path d="M8.75 1.9V5a1 1 0 001 1h3.1" stroke={sel === r.path ? '#7a6a48' : '#9a917f'} strokeWidth="1.2" strokeLinejoin="round" /></svg>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: sel === r.path ? 600 : 500, color: sel === r.path ? '#1a1a1a' : '#4a463e' }}>{r.name}</span>
              </div>
            ))}

            {/* Tools section (like the editor) */}
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, color: '#9a917f', textTransform: 'uppercase', padding: '18px 6px 8px' }}>Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tools.map((tl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid #eee7da', borderRadius: 10, background: '#fff' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ToolGlyph slug={tl.slug} name={tl.app} size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2a2620', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tl.app}</div>
                    <div style={{ fontSize: 11, color: '#9a917f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tl.actions.join(' · ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 16px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{file?.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#a59c89', background: '#f5f1e8', padding: '2px 8px', borderRadius: 5 }}>{file?.lang || 'text'}</span>
            </div>
            {file?.lang === 'markdown' ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '22px 30px' }}><RichMarkdown content={content} /></div>
            ) : (
              <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'auto', background: '#fff' }}>
                <div style={{ width: 46, flexShrink: 0, borderRight: '1px solid #f4efe6', padding: '16px 0', textAlign: 'right', background: '#fdfcf9' }}>
                  {content.split('\n').map((_, i) => <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: '22px', color: '#cfc7b6', paddingRight: 11 }}>{i + 1}</div>)}
                </div>
                <pre style={{ flex: 1, margin: 0, padding: '16px 20px', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: '22px', color: '#3a3a36', whiteSpace: 'pre' }}>{content}</pre>
              </div>
            )}
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

function RailItem({ active, onClick, label, count, selCount, icon }) {
  return (
    <div onClick={onClick}
      onMouseOver={e => { if (!active) e.currentTarget.style.background = '#f5f1e8' }} onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', background: active ? '#efe9dc' : 'transparent', transition: 'background .12s' }}>
      <span style={{ flexShrink: 0, opacity: 0.9 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? '#1a1a1a' : '#4a463e' }}>{label}</span>
      {selCount > 0
        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#8a6a3b', background: '#f1e8d7', padding: '1px 7px', borderRadius: 20 }}>{selCount}</span>
        : <span style={{ fontSize: 11.5, color: '#b3a888' }}>{count}</span>}
    </div>
  )
}

function Check({ on, box }) {
  if (box) return (
    <span style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#16341f' : '#fff', border: on ? '1.5px solid #16341f' : '1.5px solid #d8cfba' }}>
      {on && <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5L11 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </span>
  )
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5L11 4.5" stroke={on ? '#16341f' : '#b3a888'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
