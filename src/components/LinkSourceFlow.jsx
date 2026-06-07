import { useState, useMemo } from 'react'

/* ─── Design tokens ─── */
const C = {
  ink:       '#1a1a1a', ink2: '#4a4a4a', ink3: '#9a948a', ink4: '#c4bdb0',
  line:      '#ececea', line2: '#f1f2f1',
  panel:     '#fff',    panel2: '#fcfbf7', canvas: '#fcfbf7', chip: '#f4f3ef',
  green:     '#16341f', greenFill: '#e8f0e9', greenSoft: '#b8d4bb',
  blue:      '#1d4ed8', purple: '#7c3aed', gold: '#d97706', coral: '#ef4444',
}

const inp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 9, border: `1px solid ${C.line}`, background: C.panel,
  fontFamily: 'var(--sans)', fontSize: 13, color: C.ink, outline: 'none',
}
const lbl = { display: 'block', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.6px', textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }

/* ─── Buttons ─── */
function BtnDark({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, background: disabled?'#aaa':C.green, color:'#fff', border:'none', cursor: disabled?'not-allowed':'pointer', fontFamily:'var(--sans)', fontSize:13, fontWeight:600, opacity: disabled?0.5:1, ...style }}>{children}</button>
  )
}
function BtnGhost({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, background:'transparent', color:C.ink2, border:`1px solid ${C.line}`, cursor: disabled?'not-allowed':'pointer', fontFamily:'var(--sans)', fontSize:13, fontWeight:500, ...style }}>{children}</button>
  )
}

/* ─── Source systems catalog ─── */
const SOURCE_SYSTEMS = [
  { id:'salesforce',   cat:'CRM & Marketing',    name:'Salesforce',            tag:'CRM',         kind:'structured',   status:'healthy',  icon:'S',   slug:'salesforce',          domain:'salesforce.com',   color:'#1798c1', desc:'Accounts, contacts, opportunities and custom objects.' },
  { id:'hubspot',      cat:'CRM & Marketing',    name:'HubSpot',               tag:'Marketing',   kind:'structured',   status:'healthy',  icon:'H',   slug:'hubspot',             domain:'hubspot.com',       color:'#FF7A59', desc:'Contacts, deals, companies and marketing events.' },
  { id:'snowflake',    cat:'Data Warehouse',     name:'Snowflake',             tag:'Warehouse',   kind:'structured',   status:'healthy',  icon:'❄',  slug:'snowflake',           domain:'snowflake.com',     color:'#29B5E8', desc:'Cloud data-warehouse tables and views.' },
  { id:'bigquery',     cat:'Data Warehouse',     name:'Google BigQuery',       tag:'Warehouse',   kind:'structured',   status:'healthy',  icon:'BQ',  slug:'googlebigquery',      domain:'cloud.google.com',  color:'#4285f4', desc:'Serverless warehouse datasets and tables.' },
  { id:'databricks',   cat:'Data Warehouse',     name:'Databricks',            tag:'Lakehouse',   kind:'structured',   status:'healthy',  icon:'DB',  slug:'databricks',          domain:'databricks.com',    color:'#FF3621', desc:'Delta tables and Unity Catalog assets.' },
  { id:'redshift',     cat:'Data Warehouse',     name:'Amazon Redshift',       tag:'Warehouse',   kind:'structured',   status:'healthy',  icon:'RS',  slug:'amazonredshift',      domain:'aws.amazon.com',    color:'#8C4FFF', desc:'Columnar warehouse schemas and tables.' },
  { id:'postgres',     cat:'Databases',          name:'PostgreSQL',            tag:'Database',    kind:'structured',   status:'healthy',  icon:'PG',  slug:'postgresql',          domain:'postgresql.org',    color:'#4169E1', desc:'Relational tables, views and materialised views.' },
  { id:'mysql',        cat:'Databases',          name:'MySQL',                 tag:'Database',    kind:'structured',   status:'healthy',  icon:'My',  slug:'mysql',               domain:'mysql.com',         color:'#4479A1', desc:'Relational tables from a MySQL instance.' },
  { id:'sqlserver',    cat:'Databases',          name:'Microsoft SQL Server',  tag:'Database',    kind:'structured',   status:'healthy',  icon:'MS',  slug:'microsoftsqlserver',  domain:'microsoft.com',     color:'#CC2927', desc:'Tables, views and stored procedures.' },
  { id:'oracle',       cat:'Databases',          name:'Oracle Database',       tag:'Database',    kind:'structured',   status:'healthy',  icon:'Or',  slug:'oracle',              domain:'oracle.com',        color:'#F80000', desc:'Enterprise relational schemas.' },
  { id:'mongodb',      cat:'Databases',          name:'MongoDB',               tag:'NoSQL',       kind:'structured',   status:'healthy',  icon:'Mo',  slug:'mongodb',             domain:'mongodb.com',       color:'#47A248', desc:'Document collections and embedded records.' },
  { id:'netsuite',     cat:'ERP & Finance',      name:'NetSuite ERP',          tag:'ERP',         kind:'structured',   status:'healthy',  icon:'N',   slug:'',                    domain:'netsuite.com',      color:'#1F7A3D', desc:'Invoices, agreements and financial records.' },
  { id:'sap',          cat:'ERP & Finance',      name:'SAP',                   tag:'ERP',         kind:'structured',   status:'healthy',  icon:'SAP', slug:'sap',                 domain:'sap.com',           color:'#0FAAFF', desc:'ERP modules, materials and finance documents.' },
  { id:'stripe',       cat:'ERP & Finance',      name:'Stripe',                tag:'Billing',     kind:'structured',   status:'healthy',  icon:'$',   slug:'stripe',              domain:'stripe.com',        color:'#635BFF', desc:'Customers, subscriptions, invoices and payouts.' },
  { id:'shopify',      cat:'ERP & Finance',      name:'Shopify',               tag:'Commerce',    kind:'structured',   status:'healthy',  icon:'Sh',  slug:'shopify',             domain:'shopify.com',       color:'#96BF48', desc:'Orders, products, customers and inventory.' },
  { id:'googledrive',  cat:'Files & Storage',    name:'Google Drive',          tag:'Files',       kind:'unstructured', status:'healthy',  icon:'GD',  slug:'googledrive',         domain:'google.com',        color:'#1FA463', desc:'Docs, Sheets, Slides and stored files.' },
  { id:'sharepoint',   cat:'Files & Storage',    name:'SharePoint',            tag:'Files',       kind:'unstructured', status:'healthy',  icon:'SP',  slug:'microsoftsharepoint', domain:'microsoft.com',     color:'#0078D4', desc:'Document libraries and team sites.' },
  { id:'onedrive',     cat:'Files & Storage',    name:'OneDrive',              tag:'Files',       kind:'unstructured', status:'healthy',  icon:'OD',  slug:'microsoftonedrive',   domain:'microsoft.com',     color:'#0078D4', desc:'Personal and shared cloud files.' },
  { id:'dropbox',      cat:'Files & Storage',    name:'Dropbox',               tag:'Files',       kind:'unstructured', status:'healthy',  icon:'Dx',  slug:'dropbox',             domain:'dropbox.com',       color:'#0061FF', desc:'Synced files, folders and content.' },
  { id:'box',          cat:'Files & Storage',    name:'Box',                   tag:'Files',       kind:'unstructured', status:'healthy',  icon:'Bx',  slug:'box',                 domain:'box.com',           color:'#0061D5', desc:'Enterprise content and shared files.' },
  { id:'s3',           cat:'Files & Storage',    name:'Amazon S3',             tag:'Object store',kind:'unstructured', status:'healthy',  icon:'S3',  slug:'amazons3',            domain:'aws.amazon.com',    color:'#FF9900', desc:'Objects and files in S3 buckets.' },
  { id:'gcs',          cat:'Files & Storage',    name:'Google Cloud Storage',  tag:'Object store',kind:'unstructured', status:'healthy',  icon:'GCS', slug:'googlecloud',         domain:'cloud.google.com',  color:'#4285F4', desc:'Objects and files in GCS buckets.' },
  { id:'confluence',   cat:'Docs & Wikis',       name:'Confluence',            tag:'Wiki',        kind:'unstructured', status:'healthy',  icon:'Cf',  slug:'confluence',          domain:'atlassian.com',     color:'#172B4D', desc:'Spaces, pages and knowledge bases.' },
  { id:'notion',       cat:'Docs & Wikis',       name:'Notion',                tag:'Wiki',        kind:'unstructured', status:'healthy',  icon:'No',  slug:'notion',              domain:'notion.so',         color:'#000',    desc:'Pages, wikis and databases.' },
  { id:'slack',        cat:'Messaging & Email',  name:'Slack',                 tag:'Messaging',   kind:'unstructured', status:'healthy',  icon:'Sl',  slug:'slack',               domain:'slack.com',         color:'#4A154B', desc:'Channels, threads and message history.' },
  { id:'gmail',        cat:'Messaging & Email',  name:'Gmail',                 tag:'Email',       kind:'unstructured', status:'healthy',  icon:'GM',  slug:'gmail',               domain:'google.com',        color:'#EA4335', desc:'Email threads, messages and attachments.' },
  { id:'outlook',      cat:'Messaging & Email',  name:'Outlook',               tag:'Email',       kind:'unstructured', status:'healthy',  icon:'Ol',  slug:'microsoftoutlook',    domain:'outlook.com',       color:'#0078D4', desc:'Mailboxes, threads and calendar items.' },
  { id:'github',       cat:'Dev & Code',         name:'GitHub',                tag:'Code',        kind:'unstructured', status:'healthy',  icon:'GH',  slug:'github',              domain:'github.com',        color:'#181717', desc:'Repos, pull requests, issues and READMEs.' },
  { id:'jira',         cat:'Project & Support',  name:'Jira',                  tag:'Issues',      kind:'structured',   status:'healthy',  icon:'Jr',  slug:'jira',                domain:'atlassian.com',     color:'#0052CC', desc:'Issues, sprints and project tracking.' },
  { id:'zendesk',      cat:'Project & Support',  name:'Zendesk',               tag:'Support',     kind:'structured',   status:'healthy',  icon:'Z',   slug:'zendesk',             domain:'zendesk.com',       color:'#03363D', desc:'Tickets, macros and help-center articles.' },
  { id:'asana',        cat:'Project & Support',  name:'Asana',                 tag:'Tasks',       kind:'structured',   status:'healthy',  icon:'As',  slug:'asana',               domain:'asana.com',         color:'#F06A6A', desc:'Projects, tasks and portfolios.' },
  { id:'okta',         cat:'Identity & Events',  name:'Okta',                  tag:'Identity',    kind:'structured',   status:'healthy',  icon:'O',   slug:'okta',                domain:'okta.com',          color:'#007DC1', desc:'Users, groups and identity mappings.' },
  { id:'kafka',        cat:'Identity & Events',  name:'Apache Kafka',          tag:'Streaming',   kind:'structured',   status:'healthy',  icon:'K',   slug:'apachekafka',         domain:'apache.org',        color:'#231F20', desc:'Event topics consumed as a stream.' },
  { id:'segment',      cat:'Identity & Events',  name:'Segment',               tag:'CDP',         kind:'structured',   status:'healthy',  icon:'Sg',  slug:'segment',             domain:'segment.com',       color:'#52BD94', desc:'Event streams and identity profiles.' },
  { id:'airtable',     cat:'Databases',          name:'Airtable',              tag:'Database',    kind:'structured',   status:'healthy',  icon:'At',  slug:'airtable',            domain:'airtable.com',      color:'#18BFFF', desc:'Bases, tables and linked records.' },
  { id:'googlesheets', cat:'Files & Storage',    name:'Google Sheets',         tag:'Spreadsheet', kind:'structured',   status:'healthy',  icon:'GS',  slug:'googlesheets',        domain:'google.com',        color:'#34A853', desc:'Spreadsheet rows as structured records.' },
  { id:'linear',       cat:'Project & Support',  name:'Linear',                tag:'Issues',      kind:'structured',   status:'healthy',  icon:'Ln',  slug:'linear',              domain:'linear.app',        color:'#5E6AD2', desc:'Issues, cycles and project updates.' },
  { id:'figma',        cat:'Design',             name:'Figma',                 tag:'Design',      kind:'unstructured', status:'healthy',  icon:'Fi',  slug:'figma',               domain:'figma.com',         color:'#F24E1E', desc:'Components, frames and design specs.' },
  { id:'zoom',         cat:'Messaging & Email',  name:'Zoom',                  tag:'Video',       kind:'unstructured', status:'healthy',  icon:'Zo',  slug:'zoom',                domain:'zoom.us',           color:'#2D8CFF', desc:'Recordings, transcripts and meeting metadata.' },
  { id:'teams',        cat:'Messaging & Email',  name:'Microsoft Teams',       tag:'Messaging',   kind:'unstructured', status:'healthy',  icon:'Te',  slug:'microsoftteams',      domain:'microsoft.com',     color:'#6264A7', desc:'Channels, chats, meetings and shared files.' },
  { id:'intercom',     cat:'CRM & Marketing',    name:'Intercom',              tag:'Support',     kind:'structured',   status:'healthy',  icon:'I',   slug:'intercom',            domain:'intercom.com',      color:'#1F8DD6', desc:'Conversations, contacts and tickets.' },
  { id:'workday',      cat:'ERP & Finance',      name:'Workday',               tag:'HR',          kind:'structured',   status:'healthy',  icon:'W',   slug:'',                    domain:'workday.com',       color:'#F05A28', desc:'HR, headcount, compensation and roles.' },
  { id:'servicenow',   cat:'Project & Support',  name:'ServiceNow',            tag:'ITSM',        kind:'structured',   status:'healthy',  icon:'S',   slug:'servicenow',          domain:'servicenow.com',    color:'#81B5A1', desc:'ITSM, CMDB, incidents and change.' },
]

const SRC_CATEGORIES = ['CRM & Marketing','ERP & Finance','Data Warehouse','Databases','Files & Storage','Docs & Wikis','Messaging & Email','Dev & Code','Project & Support','Identity & Events','Design']

/* ─── Mock saved connections ─── */
const SAVED_CONNECTIONS = {
  salesforce: [
    { id:'sfdc-prod',    name:'Production',    detail:'acme.my.salesforce.com',                      auth:'OAuth 2.0',  lastUsed:'2 days ago',  status:'healthy'  },
    { id:'sfdc-sandbox', name:'Sandbox',       detail:'acme--sandbox.sandbox.my.salesforce.com',     auth:'OAuth 2.0',  lastUsed:'1 week ago',  status:'healthy'  },
  ],
  snowflake: [
    { id:'snow-prod',    name:'PROD_DW',       detail:'acme-prod.snowflakecomputing.com / PROD_DW',  auth:'Key-pair',   lastUsed:'1 hour ago',  status:'healthy'  },
    { id:'snow-analytics',name:'ANALYTICS',   detail:'acme-prod.snowflakecomputing.com / ANALYTICS', auth:'Key-pair',   lastUsed:'3 days ago',  status:'healthy'  },
  ],
  postgres: [
    { id:'pg-app',       name:'App DB (replica)', detail:'app-replica.acme.internal / app_prod',    auth:'Password',   lastUsed:'4 hours ago', status:'healthy'  },
  ],
  hubspot: [
    { id:'hubspot-mkt',  name:'Marketing hub',detail:'hub 8472913',                                  auth:'OAuth 2.0',  lastUsed:'1 day ago',   status:'healthy'  },
  ],
  sharepoint: [
    { id:'sp-legal',     name:'Legal site',   detail:'acme.sharepoint.com/sites/Legal',             auth:'OAuth 2.0',  lastUsed:'2 days ago',  status:'healthy'  },
  ],
  s3: [
    { id:'s3-archive',   name:'Legal archive',detail:'s3://acme-legal-archive (us-east-1)',          auth:'Key-pair',   lastUsed:'1 week ago',  status:'healthy'  },
  ],
}

/* ─── Mock source objects per connector ─── */
const SOURCE_OBJECTS = {
  salesforce:  [{ name:'Account', type:'Table', cols:64, rows:'2.4M' }, { name:'Contact', type:'Table', cols:48, rows:'8.1M' }, { name:'Lead', type:'Table', cols:42, rows:'1.9M' }, { name:'Opportunity', type:'Table', cols:58, rows:'3.2M' }, { name:'Task', type:'Table', cols:28, rows:'12M' }, { name:'Case', type:'Table', cols:36, rows:'440K' }, { name:'Campaign', type:'Table', cols:32, rows:'88K' }, { name:'Contract', type:'Table', cols:44, rows:'210K' }],
  snowflake:   [{ name:'CUSTOMERS', type:'Table', cols:22, rows:'1.1M' }, { name:'ORDERS', type:'Table', cols:18, rows:'8.7M' }, { name:'ORDER_ITEMS', type:'Table', cols:12, rows:'24M' }, { name:'PRODUCTS', type:'Table', cols:16, rows:'42K' }, { name:'EVENTS', type:'Table', cols:14, rows:'180M' }, { name:'REVENUE_DAILY', type:'View', cols:9, rows:'1.8K' }],
  postgres:    [{ name:'users', type:'Table', cols:18, rows:'280K' }, { name:'accounts', type:'Table', cols:24, rows:'94K' }, { name:'subscriptions', type:'Table', cols:22, rows:'120K' }, { name:'audit_log', type:'Table', cols:12, rows:'4.2M' }],
  bigquery:    [{ name:'users', type:'Table', cols:20, rows:'3.1M' }, { name:'sessions', type:'Table', cols:16, rows:'94M' }, { name:'events', type:'Table', cols:14, rows:'440M' }, { name:'purchases', type:'Table', cols:18, rows:'8.2M' }],
  hubspot:     [{ name:'contacts', type:'Table', cols:42, rows:'1.2M' }, { name:'companies', type:'Table', cols:38, rows:'120K' }, { name:'deals', type:'Table', cols:54, rows:'84K' }, { name:'tickets', type:'Table', cols:36, rows:'220K' }],
  jira:        [{ name:'issues', type:'Table', cols:48, rows:'420K' }, { name:'projects', type:'Table', cols:22, rows:'140' }, { name:'sprints', type:'Table', cols:18, rows:'4.4K' }],
  stripe:      [{ name:'customers', type:'Table', cols:28, rows:'180K' }, { name:'charges', type:'Table', cols:32, rows:'2.1M' }, { name:'subscriptions', type:'Table', cols:44, rows:'82K' }],
}

/* ─── Connector logo ─── */
function ConnLogo({ c, size = 22 }) {
  const box = size + 12
  const simple = c.slug ? `https://cdn.simpleicons.org/${c.slug}/${c.color.replace('#','')}` : ''
  const favicon = c.domain ? `https://www.google.com/s2/favicons?sz=64&domain=${c.domain}` : ''
  const [src, setSrc] = useState(simple || favicon)
  const [failed, setFailed] = useState(!simple && !favicon)
  const onErr = () => { if (src === simple && favicon) setSrc(favicon); else setFailed(true) }
  return (
    <span style={{ width:box, height:box, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'#fff', border:`1px solid ${C.line}`, overflow:'hidden' }}>
      {!failed && src
        ? <img src={src} width={size} height={size} alt="" style={{ display:'block', objectFit:'contain' }} onError={onErr} />
        : <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', color:c.color, fontFamily:'var(--mono)', fontWeight:700, fontSize: size>20?12:10 }}>{c.icon}</span>}
    </span>
  )
}

/* ─── Inline mini "custom select" ─── */
function MiniSelect({ value, onChange, options }) {
  return (
    <div style={{ position:'relative', width:200, flexShrink:0 }}>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...inp, paddingRight:28, appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a948a' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', cursor:'pointer' }}>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  )
}

/* ─── Main component ─── */
export function LinkSourceFlow({ onClose }) {
  const [step, setStep] = useState(0)

  // Form state (flat object like ECG)
  const [s, setS] = useState({
    system:'', connection:'', newConnName:'', newConnHost:'', newConnAuth:'OAuth2',
    tables:[], query:'',
    loadStrategy:'incremental', cadence:'15', frequency:'Minutes',
    ingestMode:'hist_live', pipelineType:'realtime', resourceTier:'Small',
    onError:'alert', avoidDup:false, schemaMethod:'manual',
  })
  const set = patch => setS(v => ({ ...v, ...patch }))

  const sel = SOURCE_SYSTEMS.find(x => x.id === s.system)
  const conns = sel ? (SAVED_CONNECTIONS[sel.id] || []) : []
  const objects = sel ? (SOURCE_OBJECTS[sel.id] || []) : []

  // Sidebar step definitions (dynamic hints)
  const srcSteps = [
    { label:'Source system', hint: sel ? sel.name : 'Pick connector from catalog' },
    { label:'Connection',    hint: s.connection === '__new__' ? (s.newConnName || 'New connection') : (conns.find(c=>c.id===s.connection)?.name || 'Pick or add a connection') },
    { label:'Objects',       hint: s.tables.length ? `${s.tables.length} object${s.tables.length===1?'':'s'}` : 'Choose what to read' },
    { label:'Extract data',  hint: 'Optional' },
    { label:'Map columns',   hint: 'Map source → node props' },
    { label:'Settings',      hint: (s.pipelineType==='scheduled'?'Scheduled':'Real Time') + ' · ' + s.resourceTier },
  ]

  const canNext =
    step === 0 ? !!s.system :
    step === 1 ? !!s.connection :
    step === 2 ? s.tables.length > 0 || !!s.query :
    true

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,14,10,0.5)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ width:'96vw', maxWidth:1420, height:'94vh', background:C.panel2, borderRadius:14, border:`1px solid ${C.line}`, boxShadow:'0 32px 80px rgba(0,0,0,0.28)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── Header ── */}
        <div style={{ flexShrink:0, height:56, borderBottom:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', background:C.panel }}>
          <span style={{ fontFamily:'var(--serif)', fontSize:18, color:C.ink }}>
            {sel ? `Add Data Sources · ${sel.name}` : 'Add Data Sources'}
          </span>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:`1px solid ${C.line}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.ink3 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'300px minmax(0,1fr)', minHeight:0 }}>

          {/* Sidebar */}
          <aside style={{ background:C.panel2, borderRight:`1px solid ${C.line}`, padding:'20px 14px', display:'flex', flexDirection:'column', gap:3, overflowY:'auto' }}>
            {srcSteps.map((st, i) => {
              const on = step===i, done = step>i
              return (
                <button key={i} onClick={()=>setStep(i)} style={{ display:'flex', gap:12, padding:'10px 12px', borderRadius:8, border: on?`1px solid ${C.line}`:'1px solid transparent', background: on?C.canvas:'transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left', alignItems:'center' }}
                  onMouseEnter={e=>{ if(!on) e.currentTarget.style.background=C.chip }}
                  onMouseLeave={e=>{ if(!on) e.currentTarget.style.background='transparent' }}>
                  <span style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${done?C.green:on?C.ink:C.line}`, background: done?C.green:on?C.ink:C.canvas, color: done||on?'#fff':C.ink3, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:12, fontWeight:700, flexShrink:0 }}>
                    {done ? <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5"/></svg> : i+1}
                  </span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, color:C.ink, fontWeight: on?600:400, lineHeight:1.2 }}>{st.label}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{st.hint}</div>
                  </div>
                </button>
              )
            })}
          </aside>

          {/* Main content */}
          <main style={{ padding:'28px 36px 32px', overflowY:'auto' }}>

            {/* ── STEP 0: Source system ── */}
            {step===0 && <StepSourceSystem s={s} set={set} />}

            {/* ── STEP 1: Connection ── */}
            {step===1 && sel && <StepConnection s={s} set={set} sel={sel} conns={conns} />}

            {/* ── STEP 2: Objects ── */}
            {step===2 && sel && <StepObjects s={s} set={set} sel={sel} objects={objects} />}

            {/* ── STEP 3: Extract data (optional) ── */}
            {step===3 && <StepExtract s={s} set={set} />}

            {/* ── STEP 4: Map columns ── */}
            {step===4 && <StepMapColumns s={s} set={set} />}

            {/* ── STEP 5: Settings ── */}
            {step===5 && <StepSettings s={s} set={set} />}

          </main>
        </div>

        {/* ── Footer ── */}
        <div style={{ flexShrink:0, padding:'13px 22px', borderTop:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.panel }}>
          <BtnGhost onClick={()=>{ if(step>0) setStep(s=>s-1) }} disabled={step===0}>← Back</BtnGhost>
          <div style={{ display:'flex', gap:8 }}>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>
            {step < srcSteps.length-1
              ? <BtnDark disabled={!canNext} onClick={()=>setStep(s=>s+1)}>Continue →</BtnDark>
              : <BtnDark onClick={onClose}>Publish pipeline ↵</BtnDark>
            }
          </div>
        </div>

      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   STEP 0 — Source system
══════════════════════════════════════════════════ */
function StepSourceSystem({ s, set }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const sel = SOURCE_SYSTEMS.find(x => x.id === s.system)
  const catOptions = [{ id:'all', label:'All categories' }].concat(SRC_CATEGORIES.map(c => ({ id:c, label:c })))

  const list = useMemo(() => SOURCE_SYSTEMS.filter(c => {
    if (cat !== 'all' && c.cat !== cat) return false
    if (q && (c.name + ' ' + (c.desc||'')).toLowerCase().indexOf(q.toLowerCase()) < 0) return false
    return true
  }), [q, cat])

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>STEP 1 / 6</div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, color:C.ink, margin:'0 0 6px', lineHeight:1.1 }}>Pick a source connector</h2>
        <p style={{ fontSize:13, color:C.ink3, margin:0, lineHeight:1.55 }}>Choose the system you want to bring data from. Each connector has its own extraction paradigm.</p>
      </div>

      {/* Search + category dropdown */}
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.ink3, display:'flex', pointerEvents:'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          </span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search connectors…" autoFocus style={{ ...inp, paddingLeft:38 }} />
        </div>
        <MiniSelect value={cat} onChange={setCat} options={catOptions} />
      </div>

      {/* List meta row: count + selected chip */}
      <div style={{ position:'sticky', top:0, zIndex:6, background:C.canvas, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'8px 2px', marginBottom:4, borderBottom: sel ? `1px solid ${C.line2}` : 'none' }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'0.5px', color:C.ink3, textTransform:'uppercase', flexShrink:0 }}>{list.length} connectors</span>
        {sel && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, minWidth:0, maxWidth:'60%' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'0.5px', textTransform:'uppercase', color:C.ink4, flexShrink:0 }}>Selected</span>
            <ConnLogo c={sel} size={15} />
            <span style={{ fontSize:12.5, fontWeight:600, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sel.name}</span>
            <span style={{ color:C.green, fontSize:13, fontWeight:700 }}>✓</span>
          </span>
        )}
      </div>

      {/* Connector list */}
      <div style={{ border:`1px solid ${C.line}`, borderRadius:11, overflow:'hidden', background:C.panel }}>
        {list.map((c, i) => {
          const on = s.system === c.id
          return (
            <button key={c.id} onClick={()=>set({ system:c.id })}
              style={{ display:'flex', alignItems:'center', gap:13, width:'100%', padding:'12px 14px', border:'none', borderTop: i?`1px solid ${C.line2}`:'none', background: on?C.canvas:'transparent', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
              onMouseEnter={e=>{ if(!on) e.currentTarget.style.background=C.panel2 }}
              onMouseLeave={e=>{ if(!on) e.currentTarget.style.background='transparent' }}>
              <ConnLogo c={c} size={22} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13.5, fontWeight:600, color:C.ink }}>{c.name}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, padding:'1px 6px', borderRadius:4, background:C.chip, color:C.ink3, border:`1px solid ${C.line2}` }}>{c.tag}</span>
                  {c.status==='degraded' && <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.gold }}>● degraded</span>}
                </div>
                <div style={{ fontSize:12, color:C.ink3, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.desc}</div>
              </div>
              {on
                ? <span style={{ flexShrink:0, width:22, height:22, borderRadius:'50%', background:C.ink, color:C.canvas, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>✓</span>
                : <span style={{ flexShrink:0, fontSize:12, fontWeight:600, color:C.ink3, padding:'5px 12px', borderRadius:7, border:`1px solid ${C.line}` }}>Select</span>}
            </button>
          )
        })}
        {list.length===0 && <div style={{ padding:32, textAlign:'center', color:C.ink3, fontSize:13 }}>No connectors match "{q}".</div>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   STEP 1 — Connection
══════════════════════════════════════════════════ */
function StepConnection({ s, set, sel, conns }) {
  const [newOpen, setNewOpen] = useState(false)
  const createdNew = s.connection === '__new__'
  const canCreate = (s.newConnName||'').trim().length>0 && (s.newConnHost||'').trim().length>0

  const hostLabel = sel?.id==='salesforce'?'Instance URL':sel?.cat==='Data Warehouse'||sel?.cat==='Databases'?'Host / account':sel?.cat==='Files & Storage'?'Bucket / site':'Endpoint'

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>STEP 2 / 6</div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, color:C.ink, margin:'0 0 6px', lineHeight:1.1 }}>Connect to {sel.name}</h2>
        <p style={{ fontSize:13, color:C.ink3, margin:0, lineHeight:1.55 }}>Credentials are stored encrypted and reused across pipelines.</p>
      </div>

      {conns.length>0 && (
        <>
          <div style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'0.5px', color:C.ink3, textTransform:'uppercase', marginBottom:8 }}>Your connections</div>
          <div style={{ border:`1px solid ${C.line}`, borderRadius:11, overflow:'hidden', background:C.panel, marginBottom:12 }}>
            {conns.map((cn, i) => {
              const on = s.connection===cn.id
              const statusColor = cn.status==='healthy'?C.green:cn.status==='degraded'?C.gold:C.ink3
              return (
                <button key={cn.id} onClick={()=>set({ connection:cn.id })}
                  style={{ display:'flex', alignItems:'center', gap:13, width:'100%', padding:'13px 14px', border:'none', borderTop: i?`1px solid ${C.line2}`:'none', background: on?C.canvas:'transparent', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
                  onMouseEnter={e=>{ if(!on) e.currentTarget.style.background=C.panel2 }}
                  onMouseLeave={e=>{ if(!on) e.currentTarget.style.background='transparent' }}>
                  <ConnLogo c={sel} size={20} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:statusColor, flexShrink:0 }} />
                      <span style={{ fontSize:13.5, fontWeight:600, color:C.ink }}>{cn.name}</span>
                      {cn.status==='degraded' && <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.gold }}>degraded</span>}
                    </div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cn.detail}</div>
                  </div>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink4, flexShrink:0, textAlign:'right', lineHeight:1.5 }}>{cn.auth}<br/>used {cn.lastUsed}</span>
                  {on
                    ? <span style={{ flexShrink:0, width:22, height:22, borderRadius:'50%', background:C.ink, color:C.canvas, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>✓</span>
                    : <span style={{ flexShrink:0, fontSize:12, fontWeight:600, color:C.ink3, padding:'5px 12px', borderRadius:7, border:`1px solid ${C.line}` }}>Use</span>}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Add new connection row */}
      <button onClick={()=>setNewOpen(true)} style={{ display:'flex', alignItems:'center', gap:11, width:'100%', padding:'13px 14px', borderRadius:10, border:`${createdNew?'1px solid':'1px dashed'} ${createdNew?C.ink:C.line}`, background: createdNew?C.panel:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:C.ink, textAlign:'left' }}>
        {createdNew && sel
          ? <ConnLogo c={sel} size={20} />
          : <span style={{ width:22, height:22, borderRadius:6, background:C.chip, border:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontWeight:700, color:C.ink2, flexShrink:0 }}>+</span>}
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontWeight:600 }}>{createdNew?(s.newConnName||'New connection'):'Add a new connection'}</span>
          {createdNew && s.newConnHost && <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.newConnHost} · {s.newConnAuth}</div>}
        </div>
        {createdNew
          ? <span style={{ flexShrink:0, width:22, height:22, borderRadius:'50%', background:C.ink, color:C.canvas, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>✓</span>
          : <span style={{ marginLeft:'auto', fontSize:12, color:C.ink3, flexShrink:0 }}>to {sel.name}</span>}
      </button>

      {/* New connection modal */}
      {newOpen && (
        <div onClick={()=>setNewOpen(false)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(20,22,16,0.42)', backdropFilter:'blur(2px)', display:'grid', placeItems:'center', padding:24 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:520, maxWidth:'92vw', background:C.panel, border:`1px solid ${C.line}`, borderRadius:14, boxShadow:'0 24px 64px rgba(0,0,0,0.22)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'16px 20px', borderBottom:`1px solid ${C.line2}` }}>
              <ConnLogo c={sel} size={26} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--serif)', fontSize:21, color:C.ink, lineHeight:1.1 }}>New connection</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, marginTop:3 }}>to {sel.name}</div>
              </div>
              <button onClick={()=>setNewOpen(false)} style={{ width:30, height:30, borderRadius:'50%', border:`1px solid ${C.line}`, background:'none', cursor:'pointer', color:C.ink3 }}>✕</button>
            </div>
            <div style={{ padding:'18px 20px', display:'grid', gap:14 }}>
              <div>
                <label style={lbl}>Connection name *</label>
                <input style={inp} placeholder={`${sel.name} — production`} value={s.newConnName} onChange={e=>set({ newConnName:e.target.value })} autoFocus />
              </div>
              <div>
                <label style={lbl}>{hostLabel} *</label>
                <input style={{ ...inp, fontFamily:'var(--mono)', fontSize:12 }} placeholder={sel?.id==='salesforce'?'acme.my.salesforce.com':sel?.cat==='Files & Storage'?'s3://acme-bucket':'host.acme.internal'} value={s.newConnHost} onChange={e=>set({ newConnHost:e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Authentication</label>
                <select value={s.newConnAuth} onChange={e=>set({ newConnAuth:e.target.value })} style={inp}>
                  {['OAuth2','API key','Key-pair','Username / password','Service account'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ fontSize:11.5, color:C.ink4, lineHeight:1.5 }}>You'll be redirected to authorize. Credentials are stored encrypted and reused across pipelines.</div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 20px', borderTop:`1px solid ${C.line2}`, background:C.panel2 }}>
              <BtnGhost onClick={()=>setNewOpen(false)}>Cancel</BtnGhost>
              <BtnDark disabled={!canCreate} onClick={()=>{ if(canCreate){ set({ connection:'__new__' }); setNewOpen(false) } }}>Create connection</BtnDark>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   STEP 2 — Objects
══════════════════════════════════════════════════ */
function StepObjects({ s, set, sel, objects }) {
  const [q, setQ] = useState('')
  const list = objects.filter(o => !q || o.name.toLowerCase().includes(q.toLowerCase()))
  const selected = s.tables || []
  const toggle = name => set({ tables: selected.includes(name) ? selected.filter(x=>x!==name) : [...selected,name], query:'' })
  const allListed = list.length>0 && list.every(o=>selected.includes(o.name))
  const toggleAll = () => set({ tables: allListed ? selected.filter(n=>list.every(o=>o.name!==n)) : Array.from(new Set([...selected,...list.map(o=>o.name)])), query:'' })

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>STEP 3 / 6</div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, color:C.ink, margin:'0 0 6px', lineHeight:1.1 }}>Select the objects to read</h2>
        <p style={{ fontSize:13, color:C.ink3, margin:0, lineHeight:1.55 }}>Pick which tables or objects to extract. Each will be mapped to a node type in the next steps.</p>
      </div>

      <div style={{ position:'relative', marginBottom:12 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.ink3, display:'flex', pointerEvents:'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        </span>
        <input style={{ ...inp, paddingLeft:40 }} placeholder="Search objects…" value={q} onChange={e=>setQ(e.target.value)} autoFocus />
      </div>

      {/* Meta row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 2px', marginBottom:4, borderBottom:`1px solid ${C.line2}` }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'0.5px', color:C.ink3, textTransform:'uppercase' }}>{list.length} objects</span>
        <span style={{ display:'flex', alignItems:'center', gap:12 }}>
          {selected.length>0 && <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink2, fontWeight:600 }}>{selected.length} selected</span>}
          <button onClick={toggleAll} style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>{allListed?'Clear all':'Select all'}</button>
        </span>
      </div>

      <div style={{ border:`1px solid ${C.line}`, borderRadius:11, overflow:'hidden', background:C.panel }}>
        {list.map((o, i) => {
          const on = selected.includes(o.name)
          return (
            <button key={o.name} onClick={()=>toggle(o.name)}
              style={{ display:'flex', alignItems:'center', gap:14, width:'100%', padding:'14px 16px', border:'none', borderTop: i?`1px solid ${C.line2}`:'none', background: on?C.canvas:'transparent', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
              onMouseEnter={e=>{ if(!on) e.currentTarget.style.background=C.panel2 }}
              onMouseLeave={e=>{ if(!on) e.currentTarget.style.background='transparent' }}>
              <span style={{ width:20, height:20, borderRadius:5, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderStyle:'solid', borderColor: on?C.ink:C.line, background: on?C.ink:'transparent', color:'#fff' }}>
                {on && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5"/></svg>}
              </span>
              <ConnLogo c={sel} size={20} />
              <div style={{ flex:1, minWidth:0 }}>
                <code style={{ fontFamily:'var(--mono)', fontSize:13.5, fontWeight:600, color:C.ink }}>{o.name}</code>
                <div style={{ fontSize:11.5, color:C.ink4, marginTop:3 }}>{o.type} · {o.cols} columns</div>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink3, flexShrink:0 }}>{o.rows} rows</span>
            </button>
          )
        })}
        {list.length===0 && <div style={{ padding:32, textAlign:'center', color:C.ink3, fontSize:13 }}>No objects match "{q}".</div>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   STEP 3 — Extract data (optional)
══════════════════════════════════════════════════ */
const EXTRACT_AGENTS = ['Contract Analyst','Document Extractor','Risk Reviewer','Invoice Parser','Resume Screener']
const EXTRACT_AUTOMATIONS = ['PDF Form Parser','Regex Extractor','Apache Tika Pipeline','AWS Textract Pipeline','Layout Parser']

function StepExtract({ s, set }) {
  const method = s.extractMethod || ''
  const agent  = s.extractAgent || ''
  const auto   = s.extractAutomation || ''

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>STEP 4 / 6 · OPTIONAL</div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, color:C.ink, margin:'0 0 6px', lineHeight:1.1 }}>Extract data</h2>
        <p style={{ fontSize:13, color:C.ink3, margin:0, lineHeight:1.55 }}>Optionally assign an agent or automation to enrich each object's records before mapping.</p>
      </div>

      <div>
        <label style={lbl}>Extraction method</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:640, marginBottom:18 }}>
          {[{ id:'agent', label:'AI Agent', desc:'Use a Claude agent to read and extract fields' }, { id:'automation', label:'Automation', desc:'Run a saved deterministic pipeline' }].map(m => {
            const on = method===m.id
            return (
              <button key={m.id} type="button" onClick={()=>set({ extractMethod:m.id, extractAgent:'', extractAutomation:'' })}
                style={{ textAlign:'left', padding:'14px 16px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', border:`1px solid ${on?C.ink:C.line}`, background: on?C.canvas:C.panel }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.ink, marginBottom:4 }}>{m.label}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, lineHeight:1.45 }}>{m.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {method==='agent' && (
        <div style={{ maxWidth:480 }}>
          <label style={lbl}>Agent</label>
          <select value={agent} onChange={e=>set({ extractAgent:e.target.value })} style={inp}>
            <option value="">— choose an agent —</option>
            {EXTRACT_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {method==='automation' && (
        <div style={{ maxWidth:480 }}>
          <label style={lbl}>Automation</label>
          <select value={auto} onChange={e=>set({ extractAutomation:e.target.value })} style={inp}>
            <option value="">— choose an automation —</option>
            {EXTRACT_AUTOMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {!method && (
        <div style={{ marginTop:14, padding:'14px 16px', border:`1px dashed ${C.line}`, borderRadius:9, background:C.canvas, fontSize:13, color:C.ink4, maxWidth:560 }}>
          Skip this step to map columns directly in the next step without any extraction.
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   STEP 4 — Map columns
══════════════════════════════════════════════════ */
const SAMPLE_COLS = ['id','name','email','domain','industry','tier','region','created_at','updated_at','arr_usd','owner_id','billing_country']
const NODE_OPTS = ['Account','Contact','Deal','Invoice','Contract','Product']
const TRANSFORMS = ['— none —','lower()','upper()','trim()','to_iso_date()','to_decimal()','parse_currency()','normalize_email()','hash_sha256()']
const TYPE_COLOR = { string:'#1d4ed8', 'string[]':'#1d4ed8', decimal:'#d97706', int:'#d97706', bool:'#ef4444', date:'#059669', timestamp:'#059669', uuid:'#7c3aed', enum:'#7c3aed' }

function StepMapColumns({ s, set }) {
  const [targetNode, setTargetNode] = useState('Account')
  const [mapping, setMapping] = useState({})
  const [transforms, setTransforms] = useState({})
  const mappedN = Object.keys(mapping).filter(k=>mapping[k]).length

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>STEP 5 / 6</div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, color:C.ink, margin:'0 0 6px', lineHeight:1.1 }}>Map columns</h2>
        <p style={{ fontSize:13, color:C.ink3, margin:0, lineHeight:1.55 }}>Map source columns to the properties of the target node type.</p>
      </div>

      <div style={{ maxWidth:200, marginBottom:20 }}>
        <label style={lbl}>Target node type</label>
        <select value={targetNode} onChange={e=>setTargetNode(e.target.value)} style={inp}>
          {NODE_OPTS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ border:`1px solid ${C.line}`, borderRadius:11, overflow:'hidden', background:C.panel }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:12, padding:'10px 16px', background:C.canvas, borderBottom:`1px solid ${C.line2}`, fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.5px', textTransform:'uppercase', color:C.ink3 }}>
          <div>Source column</div>
          <div>Transform <span style={{ textTransform:'none', color:C.ink4 }}>(optional)</span></div>
          <div>Target property <span style={{ float:'right', fontSize:10, color: mappedN?C.green:C.ink4 }}>{mappedN}/{SAMPLE_COLS.length} mapped</span></div>
        </div>
        {SAMPLE_COLS.map((col, i) => (
          <div key={col} style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:12, padding:'9px 16px', alignItems:'center', borderBottom: i<SAMPLE_COLS.length-1?`1px solid ${C.line2}`:'none', background: i%2===0?'transparent':C.canvas }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'4px 9px', borderRadius:6, background:C.chip, border:`1px solid ${C.line2}`, fontFamily:'var(--mono)', fontSize:12, color:C.ink, width:'fit-content', maxWidth:'100%' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:C.ink3, flexShrink:0 }}/>
              <code>{col}</code>
            </span>
            <select value={transforms[col]||''} onChange={e=>setTransforms(t=>({...t,[col]:e.target.value}))} style={{ ...inp, padding:'6px 9px', fontFamily:'var(--mono)', fontSize:11.5, color: transforms[col]?C.purple:C.ink3 }}>
              {TRANSFORMS.map(t => <option key={t} value={t===TRANSFORMS[0]?'':t}>{t}</option>)}
            </select>
            <select value={mapping[col]||''} onChange={e=>setMapping(m=>({...m,[col]:e.target.value}))} style={{ ...inp, padding:'6px 9px', fontFamily:'var(--mono)', fontSize:11.5 }}>
              <option value="">— skip —</option>
              {['name','email','domain','industry','tier','region','arr_usd','owner_id'].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   STEP 5 — Settings
══════════════════════════════════════════════════ */
function StepSettings({ s, set }) {
  const v = (k, d) => (s[k]!==undefined ? s[k] : d)

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>STEP 6 / 6</div>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:24, color:C.ink, margin:'0 0 6px', lineHeight:1.1 }}>Pipeline settings</h2>
        <p style={{ fontSize:13, color:C.ink3, margin:0, lineHeight:1.55 }}>Configure how this pipeline runs and how records are ingested.</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:640 }}>

        {/* Pipeline type */}
        <div>
          <label style={lbl}>Pipeline type</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{ id:'realtime', l:'Real Time', d:'Ingests and loads data to destination in real-time.' }, { id:'scheduled', l:'Scheduled', d:'Pipeline operates at a recurring schedule.' }].map(o=>{
              const on = v('pipelineType','realtime')===o.id
              return <button key={o.id} onClick={()=>set({ pipelineType:o.id })} style={{ textAlign:'left', padding:'12px 14px', borderRadius:9, border:`1px solid ${on?C.ink:C.line}`, background: on?C.canvas:C.panel, cursor:'pointer', fontFamily:'inherit' }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:C.ink, marginBottom:3 }}>{o.l}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, lineHeight:1.45 }}>{o.d}</div>
              </button>
            })}
          </div>
        </div>

        {/* Schedule (if scheduled) */}
        {v('pipelineType','realtime')==='scheduled' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Trigger every *</label>
              <input style={inp} value={v('triggerEvery','15')} onChange={e=>set({ triggerEvery:e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Frequency *</label>
              <select style={inp} value={v('frequency','Minutes')} onChange={e=>set({ frequency:e.target.value })}>
                {['Minutes','Hours','Days','Weeks'].map(x=><option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Ingestion mode */}
        <div>
          <label style={lbl}>Ingestion mode</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
            {[{ id:'hist_live', l:'Historical and Live', d:'Ingest all historical data and process new data in real-time.' }, { id:'live', l:'Live only', d:'Only process new data from connection time onward.' }, { id:'hist', l:'Historical only', d:'Backfill existing data once, with no live updates.' }].map(o=>{
              const on = v('ingestMode','hist_live')===o.id
              return <button key={o.id} onClick={()=>set({ ingestMode:o.id })} style={{ display:'flex', alignItems:'flex-start', gap:12, textAlign:'left', padding:'11px 14px', borderRadius:9, border:`1px solid ${on?C.ink:C.line}`, background: on?C.canvas:C.panel, cursor:'pointer', fontFamily:'inherit' }}>
                <span style={{ width:16, height:16, borderRadius:'50%', border:`1.5px solid ${on?C.ink:C.line}`, background: on?C.ink:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{on&&<span style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }}/>}</span>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:C.ink, marginBottom:2 }}>{o.l}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, lineHeight:1.45 }}>{o.d}</div>
                </div>
              </button>
            })}
          </div>
        </div>

        {/* Avoid duplicates */}
        <div>
          <label style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 15px', border:`1px solid ${C.line}`, borderRadius:9, cursor:'pointer', background: s.avoidDup?C.canvas:C.panel }}>
            <input type="checkbox" checked={!!s.avoidDup} onChange={e=>set({ avoidDup:e.target.checked })} style={{ accentColor:C.ink, width:15, height:15, marginTop:2, flexShrink:0 }} />
            <span>
              <span style={{ fontSize:13.5, fontWeight:600, color:C.ink }}>Avoid Duplicate Operations</span>
              <span style={{ display:'block', fontFamily:'var(--mono)', fontSize:11, color:C.ink3, marginTop:3, lineHeight:1.5 }}>Checks existing record hashes to ensure one-way data flow and prevent cyclical writes.</span>
            </span>
          </label>
        </div>

        {/* Resource tier */}
        <div>
          <label style={lbl}>Resource tier</label>
          <select style={{ ...inp, maxWidth:240 }} value={v('resourceTier','Small')} onChange={e=>set({ resourceTier:e.target.value })}>
            {['Small','Medium','Large','X-Large'].map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export default LinkSourceFlow
