import { useState, useMemo } from 'react'

/* ─── Design tokens ─── */
const C = {
  ink:        '#1a1a1a',
  ink2:       '#4a4a4a',
  ink3:       '#9a948a',
  ink4:       '#b8b0a0',
  line:       '#ececea',
  line2:      '#f1f2f1',
  panel:      '#fff',
  panel2:     '#fcfbf7',
  canvas:     '#fcfbf7',
  chip:       '#f4f3ef',
  green:      '#16341f',
  greenFill:  '#e8f0e9',
  greenSoft:  '#b8d4bb',
  blue:       '#1d4ed8',
  purple:     '#7c3aed',
  purpleFill: '#f5f3ff',
  gold:       '#d97706',
  coral:      '#ef4444',
}

/* ─── Shared input styles ─── */
const inp = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.line}`,
  background: C.panel, fontFamily: 'var(--sans)', fontSize: 13,
  color: C.ink, outline: 'none',
}
const lbl = {
  display: 'block', fontFamily: 'var(--sans)', fontSize: 10.5,
  fontWeight: 700, letterSpacing: '0.55px', textTransform: 'uppercase',
  color: C.ink3, marginBottom: 6,
}

/* ─── Button helpers ─── */
function BtnDark({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 8,
        background: disabled ? '#aaa' : C.green,
        color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
        opacity: disabled ? 0.5 : 1, ...style,
      }}
    >{children}</button>
  )
}
function BtnGhost({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 8,
        background: 'transparent', color: C.ink2,
        border: `1px solid ${C.line}`, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
        opacity: disabled ? 0.5 : 1, ...style,
      }}
    >{children}</button>
  )
}

/* ─── RichSelect (inline-styled native select) ─── */
function RichSelect({ value, onChange, options, placeholder, mono, accent, leadingColor }) {
  return (
    <div style={{ position: 'relative' }}>
      {leadingColor && (
        <span style={{
          position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
          width: 7, height: 7, borderRadius: '50%', background: leadingColor,
          pointerEvents: 'none',
        }} />
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inp,
          paddingLeft: leadingColor ? 22 : 9,
          fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
          fontSize: mono ? 11.5 : 13,
          color: accent || C.ink,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a948a' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: 28,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}{o.sub ? ` · ${o.sub}` : ''}</option>
        ))}
      </select>
    </div>
  )
}

/* ─── Connector data ─── */
const SOURCE_CONNECTORS = [
  { id:'salesforce',  name:'Salesforce',           category:'saas',      paradigm:'structured', auth:'oauth',   color:'#1798c1', letter:'S', brief:'CRM records, accounts, contacts, opps',             popular:true  },
  { id:'hubspot',     name:'HubSpot',               category:'saas',      paradigm:'structured', auth:'apikey',  color:'#ff7a59', letter:'H', brief:'Marketing CRM, contacts and deals',                 popular:true  },
  { id:'netsuite',    name:'NetSuite',              category:'saas',      paradigm:'structured', auth:'connstr', color:'#b8923a', letter:'N', brief:'ERP — GL, orders, inventory, AP/AR',                popular:false },
  { id:'stripe',      name:'Stripe',                category:'saas',      paradigm:'structured', auth:'apikey',  color:'#635bff', letter:'S', brief:'Payments, subscriptions, invoices',                 popular:true  },
  { id:'zendesk',     name:'Zendesk',               category:'saas',      paradigm:'structured', auth:'apikey',  color:'#03363d', letter:'Z', brief:'Support tickets, users, satisfaction',              popular:false },
  { id:'jira',        name:'Jira',                  category:'saas',      paradigm:'structured', auth:'apikey',  color:'#0052cc', letter:'J', brief:'Issues, sprints, projects, velocity',               popular:true  },
  { id:'servicenow',  name:'ServiceNow',            category:'saas',      paradigm:'structured', auth:'connstr', color:'#81b5a1', letter:'S', brief:'ITSM, CMDB, incidents, change',                     popular:false },
  { id:'workday',     name:'Workday',               category:'saas',      paradigm:'structured', auth:'oauth',   color:'#f05a28', letter:'W', brief:'HR, headcount, compensation, roles',                popular:false },
  { id:'intercom',    name:'Intercom',              category:'saas',      paradigm:'structured', auth:'apikey',  color:'#1f8dd6', letter:'I', brief:'Customers, conversations, events',                  popular:false },
  { id:'okta',        name:'Okta',                  category:'saas',      paradigm:'structured', auth:'apikey',  color:'#007dc1', letter:'O', brief:'Users, groups, authentication logs',                popular:false },
  { id:'snowflake',   name:'Snowflake',             category:'warehouse', paradigm:'structured', auth:'connstr', color:'#29b5e8', letter:'❄', brief:'Cloud data warehouse · SQL · CDC',                  popular:true  },
  { id:'databricks',  name:'Databricks',            category:'warehouse', paradigm:'structured', auth:'connstr', color:'#ff3621', letter:'D', brief:'Delta Lake, Unity Catalog, SQL',                    popular:true  },
  { id:'bigquery',    name:'BigQuery',              category:'warehouse', paradigm:'structured', auth:'oauth',   color:'#4285f4', letter:'B', brief:'Google Cloud analytics data warehouse',             popular:true  },
  { id:'redshift',    name:'Redshift',              category:'warehouse', paradigm:'structured', auth:'connstr', color:'#8c4fff', letter:'R', brief:'AWS analytics warehouse',                           popular:false },
  { id:'postgres',    name:'PostgreSQL',            category:'warehouse', paradigm:'structured', auth:'connstr', color:'#336791', letter:'P', brief:'Relational DB via logical replication',             popular:true  },
  { id:'mysql',       name:'MySQL',                 category:'warehouse', paradigm:'structured', auth:'connstr', color:'#4479a1', letter:'M', brief:'Relational DB · binlog CDC',                        popular:false },
  { id:'mongodb',     name:'MongoDB',               category:'warehouse', paradigm:'structured', auth:'connstr', color:'#47a248', letter:'M', brief:'Document store · change streams',                   popular:false },
  { id:'sharepoint',  name:'SharePoint',            category:'docs',      paradigm:'documents',  auth:'oauth',   color:'#0078d4', letter:'S', brief:'Document libraries and lists (M365)',               popular:true  },
  { id:'gdrive',      name:'Google Drive',          category:'docs',      paradigm:'documents',  auth:'oauth',   color:'#4285f4', letter:'G', brief:'Docs, Sheets, PDFs · Workspace',                   popular:true  },
  { id:'onedrive',    name:'OneDrive',              category:'docs',      paradigm:'documents',  auth:'oauth',   color:'#0078d4', letter:'O', brief:'Personal cloud storage (M365)',                     popular:false },
  { id:'dropbox',     name:'Dropbox',               category:'docs',      paradigm:'documents',  auth:'oauth',   color:'#0061ff', letter:'D', brief:'Cloud file storage and sync',                       popular:false },
  { id:'box',         name:'Box',                   category:'docs',      paradigm:'documents',  auth:'oauth',   color:'#0061d5', letter:'B', brief:'Enterprise content management',                     popular:false },
  { id:'confluence',  name:'Confluence',            category:'docs',      paradigm:'documents',  auth:'apikey',  color:'#0052cc', letter:'C', brief:'Wiki, knowledge base, pages',                      popular:false },
  { id:'notion',      name:'Notion',                category:'docs',      paradigm:'documents',  auth:'apikey',  color:'#000',    letter:'N', brief:'Notes, databases, wikis',                          popular:true  },
  { id:'s3',          name:'Amazon S3',             category:'docs',      paradigm:'documents',  auth:'keys',    color:'#ff9900', letter:'S', brief:'Object storage · CSV, JSON, PDF, Parquet',         popular:true  },
  { id:'gcs',         name:'Google Cloud Storage',  category:'docs',      paradigm:'documents',  auth:'oauth',   color:'#4285f4', letter:'G', brief:'GCS buckets · structured and unstructured files',  popular:false },
  { id:'azure-blob',  name:'Azure Blob Storage',    category:'docs',      paradigm:'documents',  auth:'keys',    color:'#0078d4', letter:'A', brief:'Azure storage accounts and containers',            popular:false },
  { id:'slack',       name:'Slack',                 category:'comm',      paradigm:'event',      auth:'oauth',   color:'#4a154b', letter:'S', brief:'Channel messages and threads',                      popular:true  },
  { id:'gmail',       name:'Gmail',                 category:'comm',      paradigm:'documents',  auth:'oauth',   color:'#ea4335', letter:'G', brief:'Emails via Gmail API',                             popular:false },
  { id:'outlook',     name:'Outlook',               category:'comm',      paradigm:'documents',  auth:'oauth',   color:'#0078d4', letter:'O', brief:'Emails and calendar via Graph API',                popular:false },
  { id:'kafka',       name:'Apache Kafka',          category:'stream',    paradigm:'event',      auth:'connstr', color:'#000',    letter:'K', brief:'High-throughput event streaming',                  popular:true  },
  { id:'kinesis',     name:'AWS Kinesis',           category:'stream',    paradigm:'event',      auth:'keys',    color:'#ff9900', letter:'K', brief:'AWS managed event stream',                         popular:false },
  { id:'webhook',     name:'Webhook',               category:'stream',    paradigm:'event',      auth:'none',    color:'#7c3aed', letter:'W', brief:'POST events from any HTTP source',                 popular:false },
  { id:'csv',         name:'CSV Upload',            category:'manual',    paradigm:'manual',     auth:'none',    color:'#059669', letter:'C', brief:'Upload a CSV file to seed records',                popular:false },
  { id:'admin',       name:'Manual Entry',          category:'manual',    paradigm:'manual',     auth:'none',    color:'#64748b', letter:'M', brief:'Stewards create and edit records directly',        popular:false },
]

const CONNECTOR_CATEGORIES = [
  { id:'all',       l:'All'       },
  { id:'popular',   l:'Popular'   },
  { id:'saas',      l:'SaaS'      },
  { id:'warehouse', l:'Warehouse' },
  { id:'docs',      l:'Documents' },
  { id:'comm',      l:'Comms'     },
  { id:'stream',    l:'Streaming' },
  { id:'manual',    l:'Manual'    },
]

const SAMPLE_OBJECTS_BY_CONNECTOR = {
  salesforce:  ['Account','Contact','Lead','Opportunity','Task','Event','Campaign','CampaignMember','Contract','Quote','Product2','Pricebook2','Case','Solution'],
  hubspot:     ['contacts','companies','deals','tickets','products','line_items','quotes','meetings','calls','emails'],
  netsuite:    ['Account','Contact','Customer','Transaction','SalesOrder','PurchaseOrder','JournalEntry','Vendor','Item','Employee','Project'],
  stripe:      ['customers','charges','invoices','subscriptions','payment_intents','refunds','disputes','products','prices'],
  zendesk:     ['tickets','users','organizations','groups','macros','triggers','automations','satisfaction_ratings'],
  jira:        ['issues','projects','sprints','users','boards','versions','components','changelogs'],
  snowflake:   ['CUSTOMERS','ORDERS','ORDER_ITEMS','PRODUCTS','ACCOUNTS','EVENTS','SESSIONS','PAGEVIEWS','REVENUE_DAILY'],
  databricks:  ['customers','orders','products','sessions','events','revenue','churn_features','ml_predictions'],
  bigquery:    ['users','sessions','events','purchases','inventory','marketing_spend','attribution'],
  redshift:    ['dim_customers','dim_products','fact_orders','fact_sessions','fact_events'],
  postgres:    ['users','accounts','subscriptions','audit_log','feature_flags','notifications'],
  mysql:       ['users','orders','products','inventory','sessions','audit_log'],
  mongodb:     ['customers','products','orders','sessions','logs'],
}

const SAMPLE_FOLDERS_BY_CONNECTOR = {
  sharepoint:  ['/sites/Legal/Contracts','/sites/Finance/Reports','/sites/HR/Policies','/sites/Sales/Proposals'],
  gdrive:      ['Legal/Contracts 2025','Finance/Board Decks','Sales/Proposals','HR/Job Descriptions'],
  onedrive:    ['Documents/Contracts','Documents/Invoices','Documents/Reports'],
  dropbox:     ['/Legal','/Finance','/Operations/Contracts'],
  box:         ['Legal Contracts','Finance Reports','Sales Collateral'],
  confluence:  ['Legal','Finance','Engineering','Product'],
  notion:      ['Legal','Finance','HR','Sales'],
  s3:          ['s3://my-bucket/contracts/','s3://my-bucket/invoices/','s3://my-bucket/reports/'],
  gcs:         ['gs://my-bucket/contracts/','gs://my-bucket/docs/'],
  'azure-blob':['contracts/','reports/','invoices/'],
}

const SAVED_CONNECTIONS = {
  salesforce:  [{ id:'sf1', name:'Acme Salesforce Prod',         hint:'login.salesforce.com',               owner:'data-team',     connected:'3 months ago' }],
  hubspot:     [{ id:'hs1', name:'Acme HubSpot Marketing',       hint:'api.hubapi.com',                     owner:'rev-ops',       connected:'6 months ago' }],
  snowflake:   [{ id:'sf1', name:'PROD_DW (Snowflake)',          hint:'acme.snowflakecomputing.com',         owner:'data-eng',      connected:'1 month ago'  }],
  bigquery:    [{ id:'bq1', name:'BigQuery Analytics',           hint:'acme-data.bigquery',                 owner:'data-eng',      connected:'2 months ago' }],
  postgres:    [{ id:'pg1', name:'Postgres RDS (prod)',          hint:'prod-db.us-east-1.rds.amazonaws.com', owner:'eng',          connected:'2 weeks ago'  }],
  jira:        [{ id:'j1',  name:'Acme Jira Cloud',              hint:'acme.atlassian.net',                 owner:'eng-tools',     connected:'4 months ago' }],
  slack:       [{ id:'sl1', name:'Acme Slack Workspace',         hint:'acme.slack.com',                     owner:'it-team',       connected:'1 year ago'   }],
}

const DEFAULT_EXTRACTION_FIELDS = [
  { name:'parties',        type:'string[]', desc:'Full names of all parties to the agreement' },
  { name:'effective_date', type:'date',     desc:'The date the agreement becomes effective'   },
  { name:'expiry_date',    type:'date',     desc:'Expiry or termination date if stated'       },
  { name:'value_usd',      type:'decimal',  desc:'Total contract value in USD if stated'      },
  { name:'governing_law',  type:'string',   desc:'Jurisdiction / governing law clause'        },
]

const EXTRACTION_AUTOMATIONS = [
  { id:'contract', name:'Contract Extractor', domain:'legal',   color:'#1d4ed8', icon:'⚖',  brief:'Parties, dates, value, clauses, governing law',   runs:'12.4k', accuracy:'94.2%',
    fields:[{name:'parties',type:'string[]'},{name:'effective_date',type:'date'},{name:'expiry_date',type:'date'},{name:'contract_value',type:'decimal'},{name:'governing_law',type:'string'},{name:'auto_renewal',type:'bool'},{name:'payment_terms',type:'string'}] },
  { id:'invoice',  name:'Invoice Extractor',  domain:'finance', color:'#d97706', icon:'🧾', brief:'Vendor, amounts, line items, due dates, tax',      runs:'31.1k', accuracy:'96.8%',
    fields:[{name:'vendor_name',type:'string'},{name:'invoice_number',type:'string'},{name:'issue_date',type:'date'},{name:'due_date',type:'date'},{name:'total_amount',type:'decimal'},{name:'tax_amount',type:'decimal'},{name:'line_items',type:'string[]'}] },
  { id:'resume',   name:'Resume Parser',      domain:'hr',      color:'#059669', icon:'📋', brief:'Candidate info, skills, experience, education',    runs:'8.7k',  accuracy:'91.5%',
    fields:[{name:'full_name',type:'string'},{name:'email',type:'string'},{name:'phone',type:'string'},{name:'skills',type:'string[]'},{name:'years_experience',type:'decimal'},{name:'current_title',type:'string'}] },
  { id:'receipt',  name:'Receipt Extractor',  domain:'finance', color:'#7c3aed', icon:'🧾', brief:'Merchant, date, total, items, payment method',     runs:'19.2k', accuracy:'97.1%',
    fields:[{name:'merchant',type:'string'},{name:'date',type:'date'},{name:'total',type:'decimal'},{name:'tax',type:'decimal'},{name:'items',type:'string[]'},{name:'payment_method',type:'string'}] },
  { id:'policy',   name:'Policy Extractor',   domain:'legal',   color:'#0078d4', icon:'📜', brief:'Scope, effective dates, key obligations, renewals', runs:'4.1k', accuracy:'89.3%',
    fields:[{name:'policy_name',type:'string'},{name:'effective_date',type:'date'},{name:'scope',type:'string'},{name:'obligations',type:'string[]'},{name:'review_date',type:'date'}] },
  { id:'meeting',  name:'Meeting Notes',      domain:'ops',     color:'#ef4444', icon:'📝', brief:'Action items, decisions, attendees, next steps',   runs:'6.3k',  accuracy:'88.7%',
    fields:[{name:'attendees',type:'string[]'},{name:'date',type:'date'},{name:'decisions',type:'string[]'},{name:'action_items',type:'string[]'},{name:'next_meeting',type:'date'}] },
]

const EXTRACTION_AGENTS = [
  { id:'doc_general',    name:'Document General',         model:'claude-3.5-sonnet', trained:'fine-tuned', brief:'General-purpose document extractor — handles mixed corpora well', successRate:'91.4%', trainedOn:'2.1M docs' },
  { id:'contract_ai',    name:'Contract AI',              model:'claude-3.5-sonnet', trained:'fine-tuned', brief:'Specialised for legal contracts, MSAs, SOWs, NDAs',              successRate:'95.8%', trainedOn:'480k docs' },
  { id:'doc_classifier', name:'Doc Classifier + Extract', model:'claude-3.5-haiku',  trained:null,         brief:'Auto-detects document type, then routes to the best extractor',  successRate:'89.2%', trainedOn:'5M docs'   },
]

const NODES = [
  { id:'account',  label:'Account',  props:[{name:'name',type:'string'},{name:'domain',type:'string'},{name:'industry',type:'string'},{name:'tier',type:'enum'},{name:'region',type:'string'},{name:'arr_usd',type:'decimal'}] },
  { id:'contact',  label:'Contact',  props:[{name:'full_name',type:'string'},{name:'email',type:'string'},{name:'title',type:'string'},{name:'account_id',type:'uuid'},{name:'phone',type:'string'}] },
  { id:'deal',     label:'Deal',     props:[{name:'name',type:'string'},{name:'stage',type:'enum'},{name:'amount_usd',type:'decimal'},{name:'close_date',type:'date'},{name:'owner_id',type:'uuid'}] },
  { id:'product',  label:'Product',  props:[{name:'name',type:'string'},{name:'sku',type:'string'},{name:'price_usd',type:'decimal'},{name:'category',type:'enum'}] },
  { id:'contract', label:'Contract', props:[{name:'parties',type:'string[]'},{name:'effective_date',type:'date'},{name:'expiry_date',type:'date'},{name:'value_usd',type:'decimal'},{name:'governing_law',type:'string'}] },
  { id:'invoice',  label:'Invoice',  props:[{name:'vendor_name',type:'string'},{name:'invoice_number',type:'string'},{name:'issue_date',type:'date'},{name:'total_amount',type:'decimal'}] },
]

const TYPE_COLOR = { uuid:C.purple, string:C.blue, 'string[]':C.blue, decimal:C.gold, float:C.gold, bool:C.coral, timestamp:'#059669', date:'#059669', datetime:'#059669', enum:C.purple, struct:C.ink3, int:C.gold }
const TYPE_GLYPH = { uuid:{g:'ID',c:C.purple}, string:{g:'T',c:C.blue}, 'string[]':{g:'[T]',c:C.blue}, decimal:{g:'#',c:C.gold}, float:{g:'.5',c:C.gold}, bool:{g:'01',c:C.coral}, timestamp:{g:'TS',c:'#059669'}, date:{g:'DT',c:'#059669'}, datetime:{g:'DT',c:'#059669'}, enum:{g:'E',c:C.purple}, struct:{g:'{}',c:C.ink3}, int:{g:'#',c:C.gold} }
const PARADIGM_COLOR = { structured:C.blue, documents:C.purple, event:C.gold, manual:'#64748b' }

/* ─── ConnLogo ─── */
function ConnLogo({ c, size = 32 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: c.color + '18', color: c.color,
      border: `1.5px solid ${c.color}30`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.44), flexShrink: 0,
      fontFamily: 'var(--sans)', letterSpacing: '-0.5px',
    }}>{c.letter}</span>
  )
}

/* ─── Main component ─── */
export function LinkSourceFlow({ onClose }) {
  /* Step state */
  const [step, setStep] = useState(1)

  /* Step 1 */
  const [connSearch, setConnSearch] = useState('')
  const [connCat, setConnCat]       = useState('all')
  const [connector, setConnector]   = useState(null)

  /* Step 2 */
  const [connectionMode, setConnectionMode] = useState('saved')
  const [savedConnId, setSavedConnId]       = useState(null)
  const [authConnected, setAuthConnected]   = useState(false)
  const [authKey, setAuthKey]               = useState('')
  const [authHost, setAuthHost]             = useState('')
  const [authDb, setAuthDb]                 = useState('')
  const [authUser, setAuthUser]             = useState('')
  const [authPass, setAuthPass]             = useState('')

  /* Step 3 */
  const [selectedObjects, setSelectedObjects] = useState([])
  const [objectFilter, setObjectFilter]       = useState('')
  const [folderPath, setFolderPath]           = useState('')
  const [fileTypes, setFileTypes]             = useState(['pdf','docx'])
  const [recursive, setRecursive]             = useState(true)
  const [topicName, setTopicName]             = useState('')

  /* Step 4 – Extract (docs only) */
  const [extractMethod, setExtractMethod]           = useState('automation')
  const [extractAutomationId, setExtractAutomationId] = useState(null)
  const [extractAgentId, setExtractAgentId]         = useState(null)
  const [extractionPrompt, setExtractionPrompt]     = useState('')
  const [extractionFields, setExtractionFields]     = useState(DEFAULT_EXTRACTION_FIELDS)
  const [llmModel, setLlmModel]                     = useState('claude-3.5-sonnet')
  const [confThreshold, setConfThreshold]           = useState('0.75')

  /* Step 5 – Map */
  const [targetNodeId, setTargetNodeId]     = useState('')
  const [columnMap, setColumnMap]           = useState({})
  const [columnTransform, setColumnTransform] = useState({})

  /* Step 6 – Sync */
  const [syncStrategy, setSyncStrategy]       = useState('incremental')
  const [syncFrequency, setSyncFrequency]     = useState('hourly')
  const [conflictHandling, setConflictHandling] = useState('overwrite')
  const [backfill, setBackfill]               = useState('none')
  const [onError, setOnError]                 = useState('retry')

  /* Step 7 – Review */
  const [activate, setActivate] = useState(true)

  /* ── Derived ── */
  const connectorDef     = connector ? SOURCE_CONNECTORS.find(c => c.id === connector) : null
  const paradigm         = connectorDef?.paradigm ?? 'structured'
  const savedConns       = connectorDef ? (SAVED_CONNECTIONS[connectorDef.id] || []) : []
  const sampleObjects    = connectorDef ? (SAMPLE_OBJECTS_BY_CONNECTOR[connectorDef.id] || ['table_a','table_b','table_c']) : []
  const sampleFolders    = connectorDef ? (SAMPLE_FOLDERS_BY_CONNECTOR[connectorDef.id] || []) : []
  const targetNode       = NODES.find(n => n.id === targetNodeId) || null
  const targetProps      = targetNode?.props || []
  const selAutomation    = EXTRACTION_AUTOMATIONS.find(a => a.id === extractAutomationId) || null
  const selAgent         = EXTRACTION_AGENTS.find(a => a.id === extractAgentId) || null

  /* Step index helpers */
  const S_EXTRACT = paradigm === 'documents' ? 4 : 0
  const S_MAP     = paradigm === 'documents' ? 5 : 4
  const S_SYNC    = paradigm === 'documents' ? 6 : 5
  const S_REVIEW  = paradigm === 'documents' ? 7 : 6
  const totalSteps = paradigm === 'documents' ? 7 : 6
  const stepNames  = paradigm === 'documents'
    ? ['Connector','Connect','Source','Extract','Map','Sync','Review']
    : ['Connector','Connect','Source','Map','Sync','Review']

  /* ── Helpers ── */
  function docExtractedFields() {
    if (extractMethod === 'automation' && selAutomation) return selAutomation.fields
    if (extractMethod === 'agent' && extractAgentId === '__custom') return extractionFields
    if (extractMethod === 'agent' && selAgent) return DEFAULT_EXTRACTION_FIELDS
    return []
  }
  function addField()           { setExtractionFields(f => [...f, { name:'', type:'string', desc:'' }]) }
  function updateField(i,k,v)   { setExtractionFields(f => f.map((x,j) => j===i ? {...x,[k]:v} : x)) }
  function removeField(i)       { setExtractionFields(f => f.filter((_,j) => j!==i)) }
  function toggleObject(o)      { setSelectedObjects(a => a.includes(o) ? a.filter(x=>x!==o) : [...a,o]) }
  function toggleFileType(t)    { setFileTypes(a => a.includes(t) ? a.filter(x=>x!==t) : [...a,t]) }

  /* ── canContinue validation ── */
  function canContinue() {
    if (step === 1) return !!connector
    if (step === 2) {
      if (connectionMode === 'saved' && savedConns.length > 0) return !!savedConnId
      if (connectorDef?.auth === 'oauth')   return authConnected
      if (connectorDef?.auth === 'apikey')  return authKey.length > 3
      if (connectorDef?.auth === 'connstr') return authHost.length > 0 && authUser.length > 0
      if (connectorDef?.auth === 'keys')    return authUser.length > 3 && authKey.length > 3
      if (connectorDef?.auth === 'none')    return true
      return authConnected
    }
    if (step === 3) {
      if (paradigm === 'structured') return selectedObjects.length > 0
      if (paradigm === 'documents')  return folderPath.length > 0 && fileTypes.length > 0
      if (paradigm === 'event')      return topicName.length > 0
      return true
    }
    if (step === S_EXTRACT) {
      if (extractMethod === 'automation') return !!extractAutomationId
      if (extractMethod === 'agent')      return !!extractAgentId
      return false
    }
    if (step === S_MAP) return !!targetNodeId && Object.keys(columnMap).length > 0
    return true
  }

  /* ── Filtered connectors (step 1) ── */
  const filteredConnectors = useMemo(() =>
    SOURCE_CONNECTORS.filter(c => {
      const matchCat = connCat === 'all' ? true : connCat === 'popular' ? c.popular : c.category === connCat
      const matchQ   = !connSearch || c.name.toLowerCase().includes(connSearch.toLowerCase())
      return matchCat && matchQ
    }), [connCat, connSearch])

  /* ── Render ── */
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,14,10,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '92vw', maxWidth: 1060, height: '88vh', maxHeight: 760,
        background: C.panel2, borderRadius: 16,
        border: `1px solid ${C.line}`,
        boxShadow: '0 24px 60px rgba(10,20,10,0.22)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ flexShrink:0, padding:'16px 22px', borderBottom:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.panel }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {connectorDef && <ConnLogo c={connectorDef} size={30} />}
            <div>
              <div style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:500, color:C.ink, lineHeight:1.2 }}>
                {connectorDef ? `Connect ${connectorDef.name}` : 'Connect a source'}
              </div>
              {connectorDef && (
                <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, marginTop:1 }}>
                  {connectorDef.paradigm} · {connectorDef.brief}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.line}`, background:C.panel2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.ink3, fontSize:18 }}>×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Sidebar */}
          <div style={{ width:190, flexShrink:0, borderRight:`1px solid ${C.line}`, padding:'22px 0', background:C.panel, overflowY:'auto' }}>
            {stepNames.map((name,i) => {
              const n = i+1, done = n < step, active = n === step
              return (
                <button key={n} onClick={() => done && setStep(n)} style={{ width:'100%', textAlign:'left', padding:'10px 20px', display:'flex', alignItems:'center', gap:11, background: active ? C.greenFill : 'transparent', border:'none', cursor: done ? 'pointer' : 'default', borderLeft: active ? `3px solid ${C.green}` : '3px solid transparent' }}>
                  <span style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize: done ? 12 : 11, fontWeight:700, background: active ? C.green : done ? C.greenFill : C.chip, color: active ? '#fff' : done ? C.green : C.ink3, border:`1px solid ${active ? C.green : done ? C.greenSoft : C.line}` }}>
                    {done ? '✓' : n}
                  </span>
                  <span style={{ fontFamily:'var(--sans)', fontSize:12.5, fontWeight: active ? 600 : 400, color: active ? C.green : done ? C.ink2 : C.ink3 }}>{name}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'26px 30px' }}>

            {/* Step heading */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.6px', textTransform:'uppercase', color:C.ink3, marginBottom:5 }}>
                Step {step} of {totalSteps}
              </div>
              <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:500, color:C.ink, marginBottom:4 }}>
                {stepNames[step-1]}
              </div>
              <div style={{ fontFamily:'var(--sans)', fontSize:13, color:C.ink3 }}>
                {step===1 && 'Choose a connector for your data source.'}
                {step===2 && `Authenticate with ${connectorDef?.name||'your connector'}.`}
                {step===3 && 'Select the data to ingest.'}
                {step===S_EXTRACT && 'Configure how documents are extracted.'}
                {step===S_MAP && 'Map source fields to target node properties.'}
                {step===S_SYNC && 'Configure sync schedule and error handling.'}
                {step===S_REVIEW && 'Review your configuration and activate.'}
              </div>
            </div>

            {/* ── STEP 1: Connector ── */}
            {step===1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ position:'relative' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:C.ink3, pointerEvents:'none' }}>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <input value={connSearch} onChange={e=>setConnSearch(e.target.value)} placeholder="Search connectors…" style={{ ...inp, paddingLeft:32 }} />
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {CONNECTOR_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={()=>setConnCat(cat.id)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${connCat===cat.id?C.green:C.line}`, background: connCat===cat.id?C.greenFill:C.panel, color: connCat===cat.id?C.green:C.ink3, fontFamily:'var(--sans)', fontSize:12, fontWeight: connCat===cat.id?600:400, cursor:'pointer' }}>{cat.l}</button>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  {filteredConnectors.map(c => {
                    const isOn = connector===c.id
                    return (
                      <button key={c.id} onClick={()=>setConnector(c.id)} style={{ textAlign:'left', padding:'12px 13px', borderRadius:10, border:`1px solid ${isOn?C.green:C.line}`, background: isOn?C.greenFill:C.panel, cursor:'pointer', fontFamily:'inherit', boxShadow: isOn?`0 0 0 2px ${C.greenSoft}`:'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <ConnLogo c={c} size={26} />
                          <span style={{ fontSize:12.5, fontWeight:600, color:C.ink, lineHeight:1.2 }}>{c.name}</span>
                        </div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink4, lineHeight:1.4, marginBottom:6 }}>{c.brief}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: PARADIGM_COLOR[c.paradigm], flexShrink:0 }} />
                          <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.4px' }}>{c.paradigm}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 2: Connect ── */}
            {step===2 && connectorDef && (
              <div style={{ maxWidth:600, display:'flex', flexDirection:'column', gap:18 }}>
                {savedConns.length>0 && (
                  <div>
                    <label style={lbl}>SAVED CONNECTIONS</label>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {savedConns.map(s => {
                        const isOn = connectionMode==='saved' && savedConnId===s.id
                        return (
                          <button key={s.id} onClick={()=>{ setConnectionMode('saved'); setSavedConnId(s.id) }} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', border:`1px solid ${isOn?C.green:C.line}`, borderRadius:9, background: isOn?C.greenFill:C.panel, cursor:'pointer', textAlign:'left' }}>
                            <ConnLogo c={connectorDef} size={28} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:'var(--sans)', fontSize:13, fontWeight:600, color:C.ink }}>{s.name}</div>
                              <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3 }}>{s.hint}</div>
                              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink4, marginTop:2 }}>owned by {s.owner} · connected {s.connected}</div>
                            </div>
                            {isOn && <span style={{ color:C.green, fontFamily:'var(--mono)', fontWeight:700, fontSize:14 }}>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                    <button onClick={()=>{ setConnectionMode('new'); setSavedConnId(null); setAuthConnected(false) }} style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, padding:'10px 12px', border:`1px dashed ${connectionMode==='new'?C.ink:C.line}`, borderRadius:9, background: connectionMode==='new'?C.canvas:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:12.5, color: connectionMode==='new'?C.ink:C.ink3, width:'100%', textAlign:'left' }}>
                      <span style={{ width:22, height:22, borderRadius:5, border:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:C.ink3 }}>+</span>
                      <span>Add a new {connectorDef.name} connection</span>
                    </button>
                  </div>
                )}

                {(connectionMode==='new' || savedConns.length===0) && (
                  <div>
                    {savedConns.length>0 && <label style={lbl}>NEW CONNECTION CREDENTIALS</label>}

                    {connectorDef.auth==='oauth' && (
                      <div style={{ padding:20, border:`1px solid ${C.line}`, borderRadius:10, background:C.panel }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                          <ConnLogo c={connectorDef} size={38} />
                          <div>
                            <div style={{ fontSize:15, fontWeight:600, color:C.ink }}>{connectorDef.name}</div>
                            <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>Authenticate via OAuth 2.0</div>
                          </div>
                        </div>
                        <div style={{ fontSize:12.5, color:C.ink3, marginBottom:16, lineHeight:1.55 }}>
                          You'll be redirected to {connectorDef.name} to sign in and grant access. Tokens are stored encrypted and refreshed automatically.
                        </div>
                        {!authConnected
                          ? <BtnDark onClick={()=>setAuthConnected(true)} style={{ width:'100%', justifyContent:'center' }}>Sign in with {connectorDef.name} →</BtnDark>
                          : <div style={{ padding:'10px 12px', background:C.greenFill, border:`1px solid ${C.greenSoft}`, borderRadius:7, fontSize:12.5, color:C.green, display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontFamily:'var(--mono)', fontWeight:700 }}>✓</span>
                              <span>Connected as <code style={{ fontFamily:'var(--mono)' }}>data-platform@acme.com</code> · 8 scopes granted</span>
                              <button onClick={()=>setAuthConnected(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:C.green, cursor:'pointer', fontFamily:'var(--mono)', fontSize:11, textDecoration:'underline' }}>disconnect</button>
                            </div>
                        }
                      </div>
                    )}

                    {connectorDef.auth==='apikey' && (
                      <div>
                        <label style={lbl}>API KEY</label>
                        <input value={authKey} onChange={e=>setAuthKey(e.target.value)} placeholder={connectorDef.id==='stripe'?'sk_live_…':`API key from ${connectorDef.name}`} style={{ ...inp, fontFamily:'var(--mono)' }} />
                        <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink4, marginTop:6 }}>Encrypted at rest with AES-256.</div>
                      </div>
                    )}

                    {connectorDef.auth==='connstr' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
                          <div>
                            <label style={lbl}>HOST / ACCOUNT</label>
                            <input value={authHost} onChange={e=>setAuthHost(e.target.value)} placeholder={connectorDef.id==='snowflake'?'myorg-acme.snowflakecomputing.com':'host or account identifier'} style={{ ...inp, fontFamily:'var(--mono)' }} />
                          </div>
                          <div>
                            <label style={lbl}>DATABASE / WAREHOUSE</label>
                            <input value={authDb} onChange={e=>setAuthDb(e.target.value)} placeholder="PROD_DW" style={{ ...inp, fontFamily:'var(--mono)' }} />
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                          <div>
                            <label style={lbl}>USERNAME</label>
                            <input value={authUser} onChange={e=>setAuthUser(e.target.value)} placeholder="svc_reader" style={inp} />
                          </div>
                          <div>
                            <label style={lbl}>PASSWORD</label>
                            <input value={authPass} onChange={e=>setAuthPass(e.target.value)} type="password" placeholder="••••••••" style={inp} />
                          </div>
                        </div>
                        <BtnGhost onClick={()=>setAuthConnected(true)} style={{ alignSelf:'flex-start' }}>Test connection →</BtnGhost>
                        {authConnected && <div style={{ padding:'8px 11px', background:C.greenFill, border:`1px solid ${C.greenSoft}`, borderRadius:7, fontSize:12, color:C.green }}>✓ Connection successful · responded in 142ms</div>}
                      </div>
                    )}

                    {connectorDef.auth==='keys' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <div>
                          <label style={lbl}>ACCESS KEY ID</label>
                          <input value={authUser} onChange={e=>setAuthUser(e.target.value)} placeholder="AKIA…" style={{ ...inp, fontFamily:'var(--mono)' }} />
                        </div>
                        <div>
                          <label style={lbl}>SECRET ACCESS KEY</label>
                          <input value={authKey} onChange={e=>setAuthKey(e.target.value)} type="password" placeholder="••••••••" style={{ ...inp, fontFamily:'var(--mono)' }} />
                        </div>
                        <div>
                          <label style={lbl}>REGION</label>
                          <select value={authHost||'us-east-1'} onChange={e=>setAuthHost(e.target.value)} style={inp}>
                            <option value="us-east-1">us-east-1</option><option value="us-west-2">us-west-2</option><option value="eu-west-1">eu-west-1</option><option value="ap-south-1">ap-south-1</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {connectorDef.auth==='none' && (
                      <div style={{ padding:'16px 18px', background:C.canvas, border:`1px dashed ${C.line}`, borderRadius:8, fontSize:13, color:C.ink3 }}>
                        No authentication required for this connector.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Source – structured ── */}
            {step===3 && paradigm==='structured' && (
              <div style={{ maxWidth:780, display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <label style={lbl}>OBJECTS / TABLES</label>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3 }}>{selectedObjects.length} of {sampleObjects.length} selected</span>
                  </div>
                  <div style={{ position:'relative', marginBottom:8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.ink3, pointerEvents:'none' }}>
                      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                    <input value={objectFilter} onChange={e=>setObjectFilter(e.target.value)} placeholder="Filter objects…" style={{ ...inp, paddingLeft:30, fontFamily:'var(--mono)', fontSize:12.5 }} />
                  </div>
                  <div style={{ border:`1px solid ${C.line}`, borderRadius:8, maxHeight:340, overflowY:'auto', background:C.panel }}>
                    {sampleObjects.filter(o=>!objectFilter||o.toLowerCase().includes(objectFilter.toLowerCase())).map((o,i,arr) => {
                      const isOn = selectedObjects.includes(o)
                      return (
                        <div key={o} onClick={()=>toggleObject(o)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom: i<arr.length-1?`1px solid ${C.line2}`:'none', cursor:'pointer', background: isOn?C.greenFill:'transparent' }}>
                          <span style={{ width:16, height:16, borderRadius:4, border:`1px solid ${isOn?C.green:C.line}`, background: isOn?C.green:C.panel, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0 }}>{isOn?'✓':''}</span>
                          <code style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink, flex:1 }}>{o}</code>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink4 }}>~{(1000+((o.length*137)%50000)).toLocaleString()} rows</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Source – documents ── */}
            {step===3 && paradigm==='documents' && (
              <div style={{ maxWidth:600, display:'flex', flexDirection:'column', gap:18 }}>
                <div>
                  <label style={lbl}>FOLDER PATH</label>
                  <input value={folderPath} onChange={e=>setFolderPath(e.target.value)} placeholder={connectorDef?.id==='s3'?'s3://bucket-name/path/':connectorDef?.id==='sharepoint'?'/sites/Legal/Contracts':'Folder or path'} style={{ ...inp, fontFamily:'var(--mono)', fontSize:12.5 }} />
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink4, marginTop:6, display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
                    <span>Suggestions:</span>
                    {sampleFolders.slice(0,4).map(f => (
                      <button key={f} onClick={()=>setFolderPath(f)} style={{ background:C.chip, border:`1px solid ${C.line2}`, borderRadius:4, padding:'2px 7px', fontFamily:'var(--mono)', fontSize:10, color:C.ink2, cursor:'pointer' }}>{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>FILE TYPES TO PROCESS</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {['pdf','docx','xlsx','pptx','txt','md','html','eml'].map(t => {
                      const isOn = fileTypes.includes(t)
                      return <button key={t} onClick={()=>toggleFileType(t)} style={{ padding:'6px 11px', border:`1px solid ${isOn?C.green:C.line}`, borderRadius:6, background: isOn?C.green:C.panel, color: isOn?'#fff':C.ink2, fontFamily:'var(--mono)', fontSize:11, cursor:'pointer' }}>.{t}</button>
                    })}
                  </div>
                </div>
                <div>
                  <label style={lbl}>SCAN OPTIONS</label>
                  <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:`1px solid ${C.line}`, borderRadius:7, cursor:'pointer', background: recursive?C.canvas:C.panel }}>
                    <input type="checkbox" checked={recursive} onChange={e=>setRecursive(e.target.checked)} style={{ accentColor:C.green }} />
                    <span style={{ fontSize:13, color:C.ink }}>Recursively scan sub-folders</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 3: Source – event ── */}
            {step===3 && paradigm==='event' && (
              <div style={{ maxWidth:560, display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={lbl}>TOPIC / STREAM NAME</label>
                  <input value={topicName} onChange={e=>setTopicName(e.target.value)} placeholder="e.g. crm.account.updated" style={{ ...inp, fontFamily:'var(--mono)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={lbl}>STARTING OFFSET</label><select style={inp}><option>latest</option><option>earliest</option><option>specific timestamp</option></select></div>
                  <div><label style={lbl}>CONSUMER GROUP</label><input placeholder="ecg-graph-consumer" style={{ ...inp, fontFamily:'var(--mono)' }} /></div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Source – manual ── */}
            {step===3 && paradigm==='manual' && (
              <div style={{ maxWidth:560, padding:'16px 18px', background:C.canvas, border:`1px dashed ${C.line}`, borderRadius:8, fontSize:13, color:C.ink3 }}>
                Manual sources don't have a source location. Records are added or edited directly through the steward UI or by uploading a CSV file.
              </div>
            )}

            {/* ── STEP 4: Extract (documents only) ── */}
            {S_EXTRACT>0 && step===S_EXTRACT && paradigm==='documents' && (() => {
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:900 }}>
                  <div>
                    <label style={lbl}>EXTRACTION METHOD</label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {[
                        { id:'automation', l:'Use an automation', d:'Pre-built extraction recipe with a known output schema. Battle-tested, deterministic, lowest cost.',
                          icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/></svg> },
                        { id:'agent', l:'Use an agent', d:'Pick an existing Claude agent or configure one inline. Flexible — you own the prompt and the schema.',
                          icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3"/><path d="M12 19v3"/><path d="M4.93 4.93l2.12 2.12"/><path d="M16.95 16.95l2.12 2.12"/><path d="M2 12h3"/><path d="M19 12h3"/><circle cx="12" cy="12" r="5"/></svg> },
                      ].map(m => {
                        const isOn = extractMethod===m.id
                        return (
                          <button key={m.id} type="button" onClick={()=>setExtractMethod(m.id)} style={{ textAlign:'left', padding:'16px 18px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', border:`1px solid ${isOn?C.green:C.line}`, background: isOn?C.greenFill:C.panel, display:'flex', alignItems:'flex-start', gap:14 }}>
                            <span style={{ width:38, height:38, borderRadius:9, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, background: isOn?C.green:C.chip, color: isOn?'#fff':C.ink2, border:`1px solid ${isOn?C.green:C.line}` }}>{m.icon}</span>
                            <div>
                              <div style={{ fontSize:14, color:C.ink, fontWeight:600, lineHeight:1.25 }}>{m.l}</div>
                              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, marginTop:5, lineHeight:1.5 }}>{m.d}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {extractMethod==='automation' && (
                    <div>
                      <label style={lbl}>PICK AN AUTOMATION</label>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                        {EXTRACTION_AUTOMATIONS.map(a => {
                          const isOn = extractAutomationId===a.id
                          return (
                            <button key={a.id} type="button" onClick={()=>setExtractAutomationId(a.id)} style={{ textAlign:'left', padding:'14px 15px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', border:`1px solid ${isOn?C.green:C.line}`, background: isOn?C.greenFill:C.panel }}>
                              <div style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
                                <span style={{ width:34, height:34, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:a.color+'18', color:a.color, border:`1px solid ${a.color}26`, fontSize:18 }}>{a.icon}</span>
                                <div style={{ minWidth:0, flex:1 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:4 }}>
                                    <span style={{ fontSize:13.5, color:C.ink, fontWeight:600 }}>{a.name}</span>
                                    <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background:C.chip, color:C.ink3, fontWeight:600, letterSpacing:'0.4px', textTransform:'uppercase' }}>{a.domain}</span>
                                  </div>
                                  <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, lineHeight:1.5, marginBottom:8 }}>{a.brief}</div>
                                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                                    {a.fields.slice(0,5).map(f => {
                                      const tg = TYPE_GLYPH[f.type]||TYPE_GLYPH.string
                                      return (
                                        <span key={f.name} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 7px 3px 4px', borderRadius:5, background:C.chip, border:`1px solid ${C.line2}`, fontFamily:'var(--mono)', fontSize:10.5, color:C.ink2 }}>
                                          <span style={{ minWidth:18, height:14, padding:'0 4px', borderRadius:3, background:tg.c, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 }}>{tg.g}</span>
                                          {f.name}
                                        </span>
                                      )
                                    })}
                                    {a.fields.length>5 && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink4, alignSelf:'center' }}>+{a.fields.length-5} more</span>}
                                  </div>
                                  <div style={{ display:'flex', gap:14, paddingTop:8, borderTop:`1px dashed ${C.line2}`, fontFamily:'var(--mono)', fontSize:9.5, color:C.ink3 }}>
                                    <span><span style={{ color:C.ink4 }}>RUNS </span><span style={{ color:C.ink2 }}>{a.runs}</span></span>
                                    <span><span style={{ color:C.ink4 }}>ACC </span><span style={{ color:C.green }}>{a.accuracy}</span></span>
                                    <span style={{ marginLeft:'auto' }}><span style={{ color:C.ink4 }}>FIELDS </span><span style={{ color:C.ink2 }}>{a.fields.length}</span></span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {extractMethod==='agent' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div>
                        <label style={lbl}>PICK AN AGENT</label>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {[...EXTRACTION_AGENTS,{id:'__custom',name:'Configure a new agent',brief:'Inline setup — model, system prompt, and extraction schema'}].map(agent => {
                            const isOn = extractAgentId===agent.id, custom = agent.id==='__custom'
                            return (
                              <button key={agent.id} type="button" onClick={()=>setExtractAgentId(agent.id)} style={{ textAlign:'left', padding:'12px 14px', borderRadius:9, cursor:'pointer', fontFamily:'inherit', border:`1px solid ${isOn?C.green:C.line}`, background: isOn?C.greenFill:C.panel, display:'flex', alignItems:'center', gap:13 }}>
                                <span style={{ width:32, height:32, borderRadius:7, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, background: custom?C.chip:C.purpleFill, color: custom?C.ink2:C.purple, border:`1px solid ${custom?C.line:C.purple+'40'}` }}>
                                  {custom
                                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.93 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
                                </span>
                                <div style={{ flex:1 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                                    <span style={{ fontSize:13.5, color:C.ink, fontWeight:600 }}>{agent.name}</span>
                                    {agent.model && <span style={{ fontFamily:'var(--mono)', fontSize:9.5, padding:'2px 6px', borderRadius:4, background:C.chip, color:C.ink3, fontWeight:600 }}>{agent.model}</span>}
                                    {agent.trained && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background:C.greenFill, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>{agent.trained}</span>}
                                  </div>
                                  <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, marginTop:4, lineHeight:1.45 }}>{agent.brief}</div>
                                </div>
                                {!custom && (
                                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, paddingLeft:14, borderLeft:`1px dashed ${C.line2}`, flexShrink:0 }}>
                                    <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Success</div>
                                    <div style={{ fontFamily:'var(--mono)', fontSize:14, color:C.green, fontWeight:700 }}>{agent.successRate}</div>
                                    <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.ink4 }}>{agent.trainedOn}</div>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {extractAgentId==='__custom' && (
                        <div style={{ padding:'16px 18px', border:`1px solid ${C.line}`, borderRadius:10, background:C.panel, display:'flex', flexDirection:'column', gap:14 }}>
                          <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.6px', color:C.ink3, textTransform:'uppercase' }}>Custom agent config</div>
                          <div>
                            <label style={lbl}>SYSTEM PROMPT</label>
                            <textarea value={extractionPrompt} onChange={e=>setExtractionPrompt(e.target.value)} rows={4} style={{ ...inp, fontFamily:'var(--mono)', fontSize:12, resize:'vertical', lineHeight:1.55 }} />
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                              <label style={lbl}>FIELDS TO EXTRACT</label>
                              <BtnGhost onClick={addField} style={{ fontSize:11.5 }}>+ Add field</BtnGhost>
                            </div>
                            <div style={{ border:`1px solid ${C.line}`, borderRadius:8, overflow:'hidden' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 2fr 32px', background:C.canvas, borderBottom:`1px solid ${C.line2}`, padding:'7px 12px', fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.5px', color:C.ink3, textTransform:'uppercase' }}>
                                <div>Name</div><div>Type</div><div>Description</div><div/>
                              </div>
                              {extractionFields.map((f,i) => (
                                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 2fr 32px', gap:6, padding:'6px 12px', alignItems:'center', borderBottom: i<extractionFields.length-1?`1px solid ${C.line2}`:'none' }}>
                                  <input value={f.name} onChange={e=>updateField(i,'name',e.target.value)} style={{ ...inp, padding:'5px 8px', fontSize:12, fontFamily:'var(--mono)' }} />
                                  <select value={f.type} onChange={e=>updateField(i,'type',e.target.value)} style={{ ...inp, padding:'5px 8px', fontSize:12, fontFamily:'var(--mono)' }}>
                                    <option value="string">string</option><option value="string[]">string[]</option><option value="decimal">decimal</option><option value="bool">bool</option><option value="date">date</option><option value="timestamp">timestamp</option><option value="enum">enum</option>
                                  </select>
                                  <input value={f.desc} onChange={e=>updateField(i,'desc',e.target.value)} style={{ ...inp, padding:'5px 8px', fontSize:12 }} />
                                  <button onClick={()=>removeField(i)} disabled={extractionFields.length===1} style={{ width:26, height:26, borderRadius:5, border:`1px solid ${C.line}`, background:C.canvas, color:C.ink3, cursor: extractionFields.length===1?'not-allowed':'pointer', opacity: extractionFields.length===1?0.4:1 }}>×</button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
                            <div>
                              <label style={lbl}>MODEL</label>
                              <select value={llmModel} onChange={e=>setLlmModel(e.target.value)} style={inp}>
                                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet · best quality</option>
                                <option value="claude-3.5-haiku">Claude 3.5 Haiku · fast & cheap</option>
                                <option value="gpt-4o">GPT-4o · best quality</option>
                                <option value="gpt-4o-mini">GPT-4o mini · fast & cheap</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>MIN CONFIDENCE</label>
                              <input value={confThreshold} onChange={e=>setConfThreshold(e.target.value)} style={{ ...inp, fontFamily:'var(--mono)' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding:'14px 16px', border:`1px dashed ${C.line}`, borderRadius:9, background:C.canvas }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.5px', color:C.ink3, textTransform:'uppercase' }}>DRY RUN ON 3 SAMPLE DOCUMENTS</span>
                      <BtnGhost style={{ fontSize:11.5 }}>Run preview →</BtnGhost>
                    </div>
                    <div style={{ fontSize:11.5, color:C.ink3, lineHeight:1.5 }}>Sample 3 documents and preview extracted fields before committing. Estimated cost <code style={{ fontFamily:'var(--mono)', color:C.ink2 }}>~$0.04 / 3 docs</code>.</div>
                  </div>
                </div>
              )
            })()}

            {/* ── STEP S_MAP: Map ── */}
            {step===S_MAP && (() => {
              const SRC_COLS = paradigm==='structured'
                ? ['Id','Name','Email','Domain','Industry','Tier','Region','CreatedAt','AnnualRevenue','OwnerId','BillingCountry']
                : paradigm==='event'
                ? ['id','name','email','status','timestamp','payload.amount','payload.currency','headers.source']
                : docExtractedFields().map(f=>f.name)
              const SRC_TYPES = {}
              if (paradigm==='documents') docExtractedFields().forEach(f=>{ SRC_TYPES[f.name]=f.type })
              const TRANSFORMS = [
                {v:'',l:'— none —'},{v:'lower',l:'lower()'},{v:'upper',l:'upper()'},{v:'trim',l:'trim()'},
                {v:'normalize_domain',l:'normalize_domain()'},{v:'normalize_email',l:'normalize_email()'},
                {v:'to_iso_date',l:'to_iso_date()'},{v:'to_decimal',l:'to_decimal()'},{v:'parse_currency',l:'parse_currency()'},
                {v:'hash_sha256',l:'hash_sha256() — PII safe'},{v:'custom',l:'custom JS expression…'},
              ]
              const mappedCount = Object.keys(columnMap).filter(k=>columnMap[k]).length
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:18, maxWidth:860 }}>
                  <div>
                    <label style={lbl}>TARGET NODE TYPE</label>
                    <RichSelect value={targetNodeId} onChange={setTargetNodeId} options={NODES.map(n=>({value:n.id,label:n.label,sub:(n.props||[]).length+' properties'}))} placeholder="Pick a target node" leadingColor={C.blue} />
                  </div>
                  {paradigm!=='manual' && (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div>
                          <label style={{ ...lbl, marginBottom:2 }}>{paradigm==='documents'?'EXTRACTED FIELD':'COLUMN'} → PROPERTY MAPPING</label>
                          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink4 }}>{mappedCount} of {SRC_COLS.length} {paradigm==='documents'?'fields':'columns'} mapped</div>
                        </div>
                        <button onClick={()=>{ const auto={}; targetProps.forEach(p=>{ const src=SRC_COLS.find(c=>c.toLowerCase().replace(/_/g,'').includes(p.name.replace(/_/g,''))||p.name.replace(/_/g,'').includes(c.toLowerCase().replace(/_/g,''))); if(src) auto[src]=p.name }); setColumnMap(auto) }} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:7, border:`1px solid ${C.line}`, background:C.panel, color:C.ink, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:500 }}>
                          <span style={{ color:C.gold }}>⚡</span> Auto-detect mapping
                        </button>
                      </div>
                      <div style={{ border:`1px solid ${C.line}`, borderRadius:10, background:C.panel }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1.05fr 22px 0.95fr 22px 1.1fr', gap:10, background:C.canvas, borderBottom:`1px solid ${C.line2}`, padding:'10px 16px', fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.55px', color:C.ink3, textTransform:'uppercase', borderRadius:'10px 10px 0 0' }}>
                          <div>{paradigm==='event'?'Event field':paradigm==='documents'?'Extracted field':'Source column'}</div><div/><div>Transform <span style={{ textTransform:'none', color:C.ink4 }}>(optional)</span></div><div/><div>Target property</div>
                        </div>
                        {SRC_COLS.length===0 && <div style={{ padding:'22px 16px', textAlign:'center', color:C.ink3, fontSize:12 }}>Pick an automation or agent in the Extract step first.</div>}
                        {SRC_COLS.map((srcCol,i,arr) => {
                          const mapped=columnMap[srcCol], mappedProp=mapped?targetProps.find(p=>p.name===mapped):null, transform=columnTransform[srcCol]||''
                          const stype=SRC_TYPES[srcCol]||'string', tg=TYPE_GLYPH[stype]||TYPE_GLYPH.string
                          return (
                            <div key={srcCol} style={{ display:'grid', gridTemplateColumns:'1.05fr 22px 0.95fr 22px 1.1fr', gap:10, padding:'9px 16px', alignItems:'center', borderBottom: i<arr.length-1?`1px solid ${C.line2}`:'none', background: i%2===0?'transparent':C.canvas }}>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 10px 5px 6px', borderRadius:6, background:C.chip, border:`1px solid ${C.line2}`, fontFamily:'var(--mono)', fontSize:11.5, color:C.ink, maxWidth:'100%', overflow:'hidden' }}>
                                {paradigm==='documents'
                                  ? <span style={{ minWidth:18, height:14, padding:'0 4px', borderRadius:3, background:tg.c, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, flexShrink:0 }}>{tg.g}</span>
                                  : <span style={{ width:5, height:5, borderRadius:'50%', background:C.ink3, flexShrink:0 }} />}
                                <code style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{srcCol}</code>
                              </span>
                              <span style={{ textAlign:'center', color:C.ink3, fontFamily:'var(--mono)', fontSize:13 }}>→</span>
                              <RichSelect value={transform} onChange={v=>setColumnTransform(m=>{ const n={...m}; if(v) n[srcCol]=v; else delete n[srcCol]; return n })} options={TRANSFORMS.map(t=>({value:t.v,label:t.l}))} placeholder="— none —" mono accent={transform?C.purple:null} />
                              <span style={{ textAlign:'center', color:C.ink3, fontFamily:'var(--mono)', fontSize:13 }}>→</span>
                              <RichSelect value={mapped||''} onChange={v=>setColumnMap(m=>{ const n={...m}; if(v) n[srcCol]=v; else delete n[srcCol]; return n })} options={[{value:'',label:'— skip —'}].concat(targetProps.map(p=>({value:p.name,label:p.name,sub:p.type,color:TYPE_COLOR[p.type]||C.ink3})))} placeholder="— skip —" mono leadingColor={mappedProp?(TYPE_COLOR[mappedProp.type]||C.ink3):null} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ── STEP S_SYNC: Sync ── */}
            {step===S_SYNC && (
              <div style={{ maxWidth:720, display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <label style={lbl}>SYNC STRATEGY</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      {id:'full',l:'Full refresh',d:'Replace everything every sync. Simple, expensive.'},
                      {id:'incremental',l:'Incremental',d:'Only changed rows since last sync. Most efficient.'},
                      {id:'append',l:'Append-only',d:'New rows only; never modify or delete.'},
                      {id:'streaming',l:'Streaming / CDC',d:'Real-time change-data-capture. Requires CDC source.'},
                    ].map(o => {
                      const isOn=syncStrategy===o.id, disabled=(paradigm==='documents'&&o.id==='streaming')||(paradigm==='event'&&o.id!=='streaming'&&o.id!=='append')
                      return <button key={o.id} disabled={disabled} onClick={()=>{ if(!disabled) setSyncStrategy(o.id) }} style={{ textAlign:'left', padding:'10px 12px', border:`1px solid ${isOn?C.green:C.line}`, borderRadius:7, background: isOn?C.greenFill:C.panel, cursor: disabled?'not-allowed':'pointer', opacity: disabled?0.4:1, fontFamily:'inherit' }}>
                        <div style={{ fontSize:13, fontWeight:500, color:C.ink }}>{o.l}</div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3, marginTop:3 }}>{o.d}</div>
                      </button>
                    })}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={lbl}>FREQUENCY</label>
                    <select value={syncFrequency} onChange={e=>setSyncFrequency(e.target.value)} disabled={syncStrategy==='streaming'} style={inp}>
                      <option value="realtime">Real-time (CDC)</option><option value="15m">Every 15 minutes</option><option value="hourly">Hourly</option><option value="6h">Every 6 hours</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="manual">Manual only</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>ON DUPLICATE / CONFLICT</label>
                    <select value={conflictHandling} onChange={e=>setConflictHandling(e.target.value)} style={inp}>
                      <option value="overwrite">Overwrite — source wins</option><option value="merge">Merge — apply survivorship rules</option><option value="skip">Skip — keep existing</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>BACKFILL ON FIRST SYNC</label>
                  <select value={backfill} onChange={e=>setBackfill(e.target.value)} style={{ ...inp, maxWidth:360 }}>
                    <option value="none">No backfill — start from now</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="1y">Last 1 year</option><option value="all">All historical data</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>ON ERROR</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      {id:'retry',l:'Retry with backoff',d:'Auto-retry transient failures with exponential backoff up to 5 attempts.'},
                      {id:'quarantine',l:'Quarantine the row',d:'Park failing rows in a quarantine table; let the rest of the batch continue.'},
                      {id:'alert',l:'Page on-call',d:'Open an incident and notify the on-call rotation. Pipeline keeps running.'},
                      {id:'stop',l:'Stop the pipeline',d:'Halt the entire pipeline on first error. Use for high-stakes critical sources.'},
                    ].map(o => {
                      const isOn=onError===o.id
                      return <button key={o.id} onClick={()=>setOnError(o.id)} style={{ textAlign:'left', padding:'11px 13px', border:`1px solid ${isOn?C.green:C.line}`, borderRadius:8, background: isOn?C.greenFill:C.panel, cursor:'pointer', fontFamily:'inherit' }}>
                        <div style={{ fontSize:13, fontWeight:500, color:C.ink, marginBottom:4 }}>{o.l}</div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, lineHeight:1.45 }}>{o.d}</div>
                      </button>
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP S_REVIEW: Review ── */}
            {step===S_REVIEW && connectorDef && (
              <div style={{ maxWidth:680, display:'flex', flexDirection:'column', gap:18 }}>
                <div style={{ border:`1px solid ${C.line}`, borderRadius:10, padding:20, background:C.panel }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <ConnLogo c={connectorDef} size={36} />
                    <div>
                      <div style={{ fontSize:15, fontWeight:600, color:C.ink }}>{connectorDef.name} → {targetNode?targetNode.label:'?'}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3, marginTop:3, letterSpacing:'0.4px', textTransform:'uppercase' }}>{paradigm} · {syncStrategy} · {syncFrequency}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:'8px 14px', fontSize:12 }}>
                    <span style={{ color:C.ink3, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.4px' }}>SOURCE</span>
                    <span style={{ color:C.ink }}>{paradigm==='structured'?`${selectedObjects.length} objects: ${selectedObjects.slice(0,3).join(', ')}${selectedObjects.length>3?'…':''}`:paradigm==='documents'?`${folderPath} (${fileTypes.join(', ')})`:paradigm==='event'?`topic ${topicName}`:'manual'}</span>
                    {paradigm==='documents' && <>
                      <span style={{ color:C.ink3, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.4px' }}>EXTRACT</span>
                      <span style={{ color:C.ink }}>{extractMethod==='automation'?`automation: ${selAutomation?selAutomation.name:'—'}`:extractAgentId==='__custom'?`custom agent · ${extractionFields.length} fields · ${llmModel}`:`agent: ${selAgent?selAgent.name:'—'}`}</span>
                    </>}
                    <span style={{ color:C.ink3, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.4px' }}>MAPPING</span>
                    <span style={{ color:C.ink }}>{Object.keys(columnMap).length} {paradigm==='documents'?'fields':'columns'} mapped → {targetNode?targetNode.label:'?'}</span>
                    <span style={{ color:C.ink3, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.4px' }}>BACKFILL</span>
                    <span style={{ color:C.ink }}>{backfill==='none'?'no backfill':backfill}</span>
                    <span style={{ color:C.ink3, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.4px' }}>CONFLICTS</span>
                    <span style={{ color:C.ink }}>{conflictHandling}</span>
                  </div>
                </div>
                <div>
                  <label style={lbl}>ON SAVE</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {[{id:true,l:'Activate immediately'},{id:false,l:'Save as draft'}].map(o => {
                      const isOn=activate===o.id
                      return <button key={String(o.id)} onClick={()=>setActivate(o.id)} style={{ padding:'8px 14px', border:`1px solid ${isOn?C.green:C.line}`, borderRadius:7, background: isOn?C.green:C.panel, color: isOn?'#fff':C.ink2, fontSize:12.5, fontFamily:'inherit', cursor:'pointer' }}>{o.l}</button>
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ flexShrink:0, padding:'14px 22px', borderTop:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.panel }}>
          <BtnGhost onClick={()=>{ if(step>1) setStep(s=>s-1) }} disabled={step===1}>← Back</BtnGhost>
          <span style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3 }}>Step {step} of {totalSteps} · {stepNames[step-1]}</span>
          <div style={{ display:'flex', gap:8 }}>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>
            {step<totalSteps
              ? <BtnDark disabled={!canContinue()} onClick={()=>setStep(s=>s+1)}>Continue →</BtnDark>
              : <BtnDark onClick={onClose}>{activate?'Activate source ↵':'Save draft ↵'}</BtnDark>
            }
          </div>
        </div>

      </div>
    </div>
  )
}

export default LinkSourceFlow
