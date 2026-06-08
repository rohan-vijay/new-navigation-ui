import { useState, useRef, useEffect } from 'react'

// ── Color palette (New UI tokens) ──────────────────────────────────────────
const C = {
  ink:     '#1a1a1a',
  ink2:    '#374151',
  ink3:    '#9097a0',
  ink4:    '#9ca3af',
  panel:   '#FEFDFB',
  panel2:  '#f8f9f8',
  canvas:  '#f1f3f1',
  line:    '#e3e6e3',
  line2:   '#f1f3f1',
  chip:    '#f0f8f2',
  green:   '#2d7a47', greenFill:  '#e3f4e7',
  gold:    '#b07a20', goldFill:   '#f9f0de',
  blue:    '#3b6fd4', blueFill:   '#e6edfa',
  purple:  '#7c3aed', purpleFill: '#ede9fc',
  coral:   '#c84040', coralFill:  '#fbe6e6',
}

// Detail tab icons (same line-icon family as the node detail page)
const _ric = { fill:'none', stroke:'currentColor', strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' }
const REC_TAB_ICON = {
  Graph: <svg width="14" height="14" viewBox="0 0 24 24" {..._ric}><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><line x1="8.2" y1="11" x2="15.8" y2="7"/><line x1="8.2" y1="13" x2="15.8" y2="17"/></svg>,
  Overview: <svg width="14" height="14" viewBox="0 0 24 24" {..._ric}><rect x="4" y="5" width="16" height="14" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="9.5" y1="10" x2="9.5" y2="19"/></svg>,
  Provenance: <svg width="14" height="14" viewBox="0 0 24 24" {..._ric}><circle cx="6.5" cy="6" r="2"/><circle cx="6.5" cy="18" r="2"/><circle cx="17.5" cy="12" r="2"/><path d="M8.5 6.5c1 3.5 3 5 7 5.4M8.5 17.5c1-3.5 3-5 7-5.4"/></svg>,
  Quality: <svg width="14" height="14" viewBox="0 0 24 24" {..._ric}><path d="M12 3l8 4v6c0 4.5-3.5 7.5-8 8-4.5-.5-8-3.5-8-8V7z"/><polyline points="9 12 11 14 15 9.5"/></svg>,
  History: <svg width="14" height="14" viewBox="0 0 24 24" {..._ric}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 4 3 8 7 8"/><polyline points="12 8 12 12 15 14"/></svg>,
  Activity: <svg width="14" height="14" viewBox="0 0 24 24" {..._ric}><polyline points="3 12 8 12 10 6 14 18 16 12 21 12"/></svg>,
}

// ── Data ────────────────────────────────────────────────────────────────────
const NODES = [
  { id:'account',      label:'Account',            type:'entity', state:'core',     x:0,    y:60,   size:34, instances:'2.8K', instancesN:2840,   props:18, edges:12, fill:94, conf:97, fresh:'24m',  pii:4, change:'HIGH',   desc:'Customer or prospect organization' },
  { id:'person',       label:'Person',             type:'entity', state:'core',     x:-240, y:-10,  size:30, instances:'18K',  instancesN:18420,  props:14, edges:8,  fill:81, conf:92, fresh:'1.2h', pii:4, change:'MEDIUM', desc:'Individual contact across the customer lifecycle' },
  { id:'subscription', label:'Subscription',       type:'entity', state:'core',     x:60,   y:270,  size:28, instances:'2.8K', instancesN:2840,   props:11, edges:6,  fill:99, conf:99, fresh:'12m',  pii:0, change:'LOW',    desc:'Recurring product license tied to an account' },
  { id:'agreement',    label:'Agreement',          type:'entity', state:'core',     x:320,  y:230,  size:28, instances:'3.1K', instancesN:3120,   props:16, edges:5,  fill:96, conf:98, fresh:'18m',  pii:1, change:'LOW',    desc:'Signed contract governing one or more subscriptions' },
  { id:'interaction',  label:'Interaction',        type:'entity', state:'core',     x:-290, y:220,  size:26, instances:'124K', instancesN:124000, props:9,  edges:4,  fill:78, conf:84, fresh:'24m',  pii:0, change:'HIGH',   desc:'Logged touchpoint between a Person and an Account' },
  { id:'invoice',      label:'Invoice',            type:'entity', state:'core',     x:380,  y:-130, size:26, instances:'12K',  instancesN:12040,  props:13, edges:4,  fill:92, conf:95, fresh:'36m',  pii:0, change:'MEDIUM', desc:'Billing record drawn from a subscription cycle' },
  { id:'employee',     label:'Employee',           type:'entity', state:'core',     x:-460, y:110,  size:24, instances:'1.2K', instancesN:1240,   props:12, edges:3,  fill:88, conf:94, fresh:'4h',   pii:2, change:'LOW',    desc:'Internal staff member' },
  { id:'ticket',       label:'Ticket',             type:'entity', state:'incident', x:-150, y:360,  size:28, instances:'142K', instancesN:142000, props:10, edges:5,  fill:91, conf:96, fresh:'18m',  pii:1, change:'MEDIUM', desc:'Support case raised by a Person against an Account' },
  { id:'incident',     label:'Incident',           type:'entity', state:'incident', x:80,   y:460,  size:26, instances:'412',  instancesN:412,    props:14, edges:4,  fill:88, conf:91, fresh:'6m',   pii:0, change:'HIGH',   desc:'Operational outage affecting subscriptions' },
  { id:'signal',       label:'Signal',             type:'entity', state:'signal',   x:240,  y:-240, size:24, instances:'25K',  instancesN:25400,  props:7,  edges:3,  fill:88, conf:95, fresh:'6m',   pii:0, change:'HIGH',   desc:'Derived behavioural event from product telemetry' },
  { id:'risk',         label:'Risk',               type:'entity', state:'risk',     x:440,  y:-200, size:24, instances:'184',  instancesN:184,    props:11, edges:4,  fill:94, conf:99, fresh:'6m',   pii:0, change:'MEDIUM', desc:'Open exposure attached to an account or contract' },
  { id:'rev_fore',     label:'Revenue Forecaster', type:'agent',  state:'core',     x:540,  y:40,   size:30, instances:'—',    instancesN:0,      props:9,  edges:5,  fill:86, conf:92, fresh:'15m',  pii:0, change:'MEDIUM', desc:'Predicts ARR roll-forward from subscription + signal data' },
  { id:'comp_aud',     label:'Compliance Auditor', type:'agent',  state:'core',     x:600,  y:280,  size:28, instances:'—',    instancesN:0,      props:7,  edges:4,  fill:92, conf:96, fresh:'1h',   pii:0, change:'LOW',    desc:'Scans agreements and tickets for policy breaches' },
  { id:'cust_health',  label:'Customer Health',    type:'agent',  state:'core',     x:-340, y:-180, size:28, instances:'—',    instancesN:0,      props:8,  edges:5,  fill:89, conf:94, fresh:'30m',  pii:0, change:'MEDIUM', desc:'Blends interaction + signal data into a health score' },
  { id:'netsuite',     label:'NetSuite ERP',       type:'source', state:'core',     x:470,  y:-340, size:26, instances:'—',    instancesN:0,      props:22, edges:3,  fill:99, conf:100,fresh:'5m',   pii:1, change:'LOW',    desc:'System of record for invoices and agreements' },
  { id:'okta',         label:'Okta Identity',      type:'source', state:'core',     x:-560, y:-100, size:24, instances:'—',    instancesN:0,      props:14, edges:2,  fill:100,conf:100,fresh:'2m',   pii:6, change:'LOW',    desc:'Identity provider mapping Person to Employee' },
  { id:'snowflake',    label:'Snowflake Warehouse',type:'source', state:'core',     x:-120, y:540,  size:28, instances:'—',    instancesN:0,      props:36, edges:5,  fill:96, conf:98, fresh:'12h',  pii:0, change:'MEDIUM', desc:'Warehouse landing zone for product telemetry' },
]

const EDGES = [
  { s:'person',      t:'account',      label:'WORKS_AT',         kind:'direct'   },
  { s:'person',      t:'account',      label:'PREVIOUSLY_AT',    kind:'inferred' },
  { s:'account',     t:'subscription', label:'HAS_SUBSCRIPTION',  kind:'direct'   },
  { s:'account',     t:'agreement',    label:'GOVERNED_BY',       kind:'direct'   },
  { s:'subscription',t:'invoice',      label:'BILLS',             kind:'direct'   },
  { s:'agreement',   t:'invoice',      label:'ITEMIZES',          kind:'inferred' },
  { s:'person',      t:'interaction',  label:'INVOLVED_IN',       kind:'direct'   },
  { s:'interaction', t:'account',      label:'TOUCHES',           kind:'inferred' },
  { s:'person',      t:'ticket',       label:'RAISES',            kind:'direct'   },
  { s:'ticket',      t:'account',      label:'AGAINST',           kind:'direct'   },
  { s:'incident',    t:'subscription', label:'INCIDENT_AFFECTS',  kind:'direct'   },
  { s:'signal',      t:'account',      label:'OBSERVED_ON',       kind:'direct'   },
  { s:'risk',        t:'agreement',    label:'EXPOSES',           kind:'direct'   },
  { s:'risk',        t:'account',      label:'ATTACHED_TO',       kind:'inferred' },
  { s:'rev_fore',    t:'subscription', label:'READS',             kind:'agent'    },
  { s:'cust_health', t:'interaction',  label:'READS',             kind:'agent'    },
  { s:'cust_health', t:'person',       label:'SCORES',            kind:'agent'    },
]

const PROPS_BY_NODE = {
  account: [
    { name:'account_id',           type:'uuid',      required:true,  indexed:true,  pii:false, pk:true,  fill:100,conf:100, source:'Salesforce' },
    { name:'name',                 type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Salesforce' },
    { name:'domain',               type:'string',    required:true,  indexed:true,  pii:false, fill:96,  conf:98,  source:'Salesforce' },
    { name:'industry',             type:'enum(28)',  required:false, indexed:false, pii:false, fill:88,  conf:94,  source:'Salesforce' },
    { name:'tier',                 type:'enum',      required:true,  indexed:true,  pii:false, fill:99,  conf:100, source:'—', computed:'from arr (rule:tier_buckets)' },
    { name:'region',               type:'enum(6)',   required:true,  indexed:false, pii:false, fill:97,  conf:98,  source:'Salesforce' },
    { name:'arr_usd',              type:'decimal',   required:false, indexed:false, pii:false, fill:94,  conf:99,  source:'NetSuite ERP' },
    { name:'primary_contact_email',type:'string',    required:false, indexed:true,  pii:true,  fill:92,  conf:96,  source:'Salesforce' },
    { name:'tax_id',               type:'string',    required:false, indexed:false, pii:true,  fill:64,  conf:94,  source:'NetSuite ERP' },
    { name:'risk_score',           type:'float',     required:false, indexed:true,  pii:false, fill:100, conf:100, source:'—', computed:'agent: cust_health' },
    { name:'churn_probability',    type:'float',     required:false, indexed:false, pii:false, fill:100, conf:100, source:'—', computed:'agent: rev_fore' },
    { name:'is_lighthouse',        type:'bool',      required:false, indexed:false, pii:false, fill:100, conf:100, source:'manual' },
    { name:'tags',                 type:'string[]',  required:false, indexed:false, pii:false, fill:73,  conf:100, source:'manual' },
    { name:'created_at',           type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Salesforce' },
  ],
}

// ── Colour helpers ──────────────────────────────────────────────────────────
function colorForNode(n) {
  if (!n) return { stroke: C.ink3, fill: C.canvas }
  if (n.type === 'agent')  return { stroke: C.purple, fill: C.purpleFill }
  if (n.type === 'source') return { stroke: C.green,  fill: C.greenFill  }
  if (n.state === 'incident') return { stroke: C.coral,  fill: C.coralFill  }
  if (n.state === 'signal')   return { stroke: C.gold,   fill: C.goldFill   }
  if (n.state === 'risk')     return { stroke: C.gold,   fill: C.goldFill   }
  return { stroke: C.blue, fill: C.blueFill }
}

// ── Data generators ─────────────────────────────────────────────────────────
function generateValueForProp(p, seed) {
  const v = Math.abs(seed * (p.name.charCodeAt(0) + 1))
  if (p.pk) return p.name.replace(/_id$/, '').toUpperCase().slice(0,3) + '-' + (10000 + v % 89999)
  if (['name','label','title','company_name'].includes(p.name)) {
    const names = ['Acme Corp','Cascade Analytics','Meridian Labs','Horizon Tech','Summit Partners','Apex Global','Quantum Dynamics','Vertex Solutions','Pinnacle Systems','Beacon Industries','Cipher Group','Delphi Networks','Echo Innovations','Forge Systems','Glacier Tech']
    return names[v % names.length]
  }
  if (p.name === 'domain')   return ['acme.com','cascade.io','meridian.co','horizon.tech','summit.partners','apex.global','quantum.dy','vertex.dev','pinnacle.systems','beacon.io'][v % 10]
  if (p.name === 'email' || p.name === 'primary_contact_email') return ['taylor.j','morgan.k','jordan.s','alex.r','casey.m'][v % 5] + '@' + ['acme.com','horizon.tech','summit.io','vertex.dev'][v % 4]
  if (p.name === 'industry') return ['SaaS','Fintech','Healthcare','Manufacturing','Retail','Logistics','EdTech'][v % 7]
  if (p.name === 'region')   return ['NA-East','NA-West','EMEA','APAC','LATAM'][v % 5]
  if (p.name === 'tier')     return ['SMB','MM','ENT','Strategic'][v % 4]
  if (p.name === 'status' || p.name === 'state') return ['active','pending','review','closed'][v % 4]
  if (p.name === 'priority') return ['P0','P1','P2','P3'][v % 4]
  if (p.name.endsWith('_id') || p.name === 'owner_id') return 'EMP-' + (1000 + v % 8999)
  if (p.name === 'arr_usd')  return ((v % 990000) + 10000).toFixed(2)
  if (p.name === 'risk_score' || p.name === 'churn_probability') return (0.1 + (v % 89) / 100).toFixed(2)
  if (p.name === 'is_lighthouse') return v % 3 !== 0 ? 'true' : 'false'
  if (p.name === 'tags')     return ['enterprise','strategic','at-risk','healthy','churned'][v % 5]
  if (p.name === 'tax_id')   return 'TX-' + (10000000 + v % 89999999)
  if (p.type === 'decimal' || p.type === 'float') return ((v % 99000) + 1000).toFixed(2)
  if (p.type === 'bool')      return v % 3 !== 0 ? 'true' : 'false'
  if (p.type === 'timestamp') return '2026-' + String(1+v%12).padStart(2,'0') + '-' + String(1+v%28).padStart(2,'0') + 'T' + String(v%24).padStart(2,'0') + ':' + String(v%60).padStart(2,'0') + ':00Z'
  if (p.type === 'date')      return '2026-' + String(1+v%12).padStart(2,'0') + '-' + String(1+v%28).padStart(2,'0')
  if (p.type === 'uuid')      return 'uuid-' + ((v * 7) % 999999).toString(16)
  if (p.type.startsWith('enum')) return ['alpha','beta','gamma','delta'][v % 4]
  return p.name.replace(/_/g,'-') + '-' + ((v * 3) % 9999)
}

function generateProps(node) {
  if (PROPS_BY_NODE[node.id]) return PROPS_BY_NODE[node.id]
  const out = []
  const seed = node.id.charCodeAt(0) + node.id.length
  out.push({ name:node.id+'_id',   type:'uuid',      required:true,  indexed:true,  pii:false, pk:true,  fill:100,conf:100,source:'primary' })
  out.push({ name:'name',          type:'string',    required:true,  indexed:true,  pii:false, fill:99-(seed%4),conf:98-(seed%5),source:'primary' })
  out.push({ name:'created_at',    type:'timestamp', required:true,  indexed:true,  pii:false, fill:100,conf:100,source:'primary' })
  const extras = ['status','owner_id','type','priority','amount','external_ref','resolved_at']
  for (let i = 0; i < Math.min(node.props - 3, extras.length); i++) {
    const e = extras[i]
    out.push({ name:e, type:i%3===0?'enum':i%3===1?'string':'timestamp', required:i<2, indexed:i%2===0, pii:e.includes('owner')||e.includes('ref'), fill:70+((seed*i)%30),conf:80+((seed+i)%19),source:'primary' })
  }
  return out
}

function generateRecords(node) {
  const seed = node.id.charCodeAt(0) * 7 + node.id.length * 13
  const props = generateProps(node)
  const records = []
  for (let i = 0; i < 12; i++) {
    const s = seed + i * 31
    const rec = { id: node.id + '-' + (100000 + (s * 1597) % 899999), nodeType: node.label, nodeId: node.id, status: ['active','active','active','active','review','flagged'][s%6] }
    props.forEach(p => { rec[p.name] = generateValueForProp(p, s) })
    rec._updatedAgo = ['2m ago','14m ago','1h ago','4h ago','1d ago','3d ago'][s%6]
    rec._createdAgo = ['12d ago','34d ago','2mo ago','6mo ago','1y ago','2y ago'][s%6]
    rec._source     = ['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin'][s%4]
    rec._completeness = 78 + (s % 22)
    rec._confidence   = 82 + (s % 17)
    records.push(rec)
  }
  return records
}

function generateRelatedRecords(record, node) {
  const outgoing = EDGES.filter(e => e.s === node.id)
  const incoming = EDGES.filter(e => e.t === node.id)
  const allEdges  = [...outgoing, ...incoming]
  const baseSeed  = record.id.length * 7 + record.id.charCodeAt(record.id.length-1)
  return allEdges.slice(0,6).map((e, idx) => {
    const isOut      = e.s === node.id
    const otherId    = isOut ? e.t : e.s
    const otherNode  = NODES.find(n => n.id === otherId)
    if (!otherNode) return null
    const count = ((baseSeed + idx * 3) % 3) + 1
    const otherProps = generateProps(otherNode)
    const nameProp   = otherProps.find(p => ['name','label','title','company_name'].includes(p.name)) || otherProps[1] || otherProps[0]
    const related = []
    for (let i = 0; i < count; i++) {
      const s = baseSeed + idx * 41 + i * 17
      related.push({ id: otherNode.id+'-'+(100000+Math.abs(s*1597)%899999), label: otherNode.label, nodeId: otherNode.id, keyName: nameProp?.name||'id', keyValue: nameProp ? generateValueForProp(nameProp,s) : '—', edgeLabel: e.label, kind: e.kind, direction: isOut?'out':'in', since: '2026-'+String(1+Math.abs(s)%12).padStart(2,'0')+'-'+String(1+Math.abs(s)%28).padStart(2,'0'), confidence: (0.78+(Math.abs(s)%21)/100).toFixed(2) })
    }
    return { edge: e, otherNode, isOut, count, related }
  }).filter(Boolean)
}

function buildRecordFromId(targetId, targetNode) {
  const existing = generateRecords(targetNode).find(r => r.id === targetId)
  if (existing) return existing
  const seed = targetId.length * 13 + targetId.charCodeAt(targetId.length-1) * 7
  const rec = { id:targetId, nodeType:targetNode.label, nodeId:targetNode.id, status:['active','active','active','review','flagged'][Math.abs(seed)%5], _updatedAgo:['2m ago','14m ago','1h ago','4h ago','1d ago','3d ago'][Math.abs(seed)%6], _createdAgo:['12d ago','34d ago','2mo ago','6mo ago','1y ago','2y ago'][Math.abs(seed)%6], _source:['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin'][Math.abs(seed)%4], _completeness:78+(Math.abs(seed)%22), _confidence:82+(Math.abs(seed)%17) }
  generateProps(targetNode).forEach((p,i) => { rec[p.name] = generateValueForProp(p, seed+i*11) })
  return rec
}

// ── Shared micro-components ─────────────────────────────────────────────────
function NodeGlyph({ n, size = 14 }) {
  const col = colorForNode(n)
  const r = size/2 - 1
  const vs = `-${size/2} -${size/2} ${size} ${size}`
  return (
    <svg width={size} height={size} viewBox={vs} style={{ flexShrink:0 }}>
      {n.type === 'agent'
        ? <polygon points={[0,1,2,3,4,5].map(i => { const a=(Math.PI/3)*i-Math.PI/2; return r*Math.cos(a).toFixed(1)+','+r*Math.sin(a).toFixed(1) }).join(' ')} fill={col.fill} stroke={col.stroke} strokeWidth="1.3"/>
        : n.type === 'source'
          ? <rect x={-r} y={-r} width={2*r} height={2*r} rx="2" fill={col.fill} stroke={col.stroke} strokeWidth="1.3"/>
          : <circle r={r} fill={col.fill} stroke={col.stroke} strokeWidth="1.3"/>}
    </svg>
  )
}

function StatusPill({ status }) {
  const bg  = status === 'active'  ? C.greenFill  : status === 'review' ? C.goldFill  : C.coralFill
  const col = status === 'active'  ? C.green      : status === 'review' ? C.gold      : C.coral
  return <span style={{ fontFamily:'var(--mono)', fontSize:10, padding:'3px 8px', borderRadius:5, background:bg, color:col, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>{status}</span>
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ background:'#fff', border:`1px solid ${C.line}`, borderRadius:8, padding:'0 13px', height:32, fontSize:12.5, color:C.ink2, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'var(--sans)', ...style }}
      onMouseOver={e => e.currentTarget.style.background=C.canvas}
      onMouseOut={e => e.currentTarget.style.background='#fff'}>{children}</button>
  )
}

function DarkBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ background:'var(--green-btn)', color:'#fff', border:'none', borderRadius:9, padding:'0 16px', height:34, fontSize:13.5, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'var(--sans)', transition:'background .15s' }}
      onMouseOver={e => e.currentTarget.style.background='#1d4228'}
      onMouseOut={e => e.currentTarget.style.background='#16341f'}>{children}</button>
  )
}

// ── RecordsView ─────────────────────────────────────────────────────────────
function RecordsView({ onOpenRecord }) {
  const entityNodes = NODES.filter(n => n.type === 'entity')
  const [nodeFilter, setNodeFilter] = useState(entityNodes[0]?.id || 'account')
  const [dropOpen, setDropOpen]     = useState(false)
  const [search, setSearch]         = useState('')

  const selectedNodeObj  = NODES.find(n => n.id === nodeFilter) || entityNodes[0]
  const records          = generateRecords(selectedNodeObj)
  const filteredRecords  = search ? records.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : records

  const props       = generateProps(selectedNodeObj)
  const pkProp      = props.find(p => p.pk) || props[0]
  const displayProps = props.filter(p => p !== pkProp && p.name !== 'status')
    .sort((a,b) => {
      const aw = (a.required?4:0) + (a.indexed?2:0) + (a.pii?-1:0)
      const bw = (b.required?4:0) + (b.indexed?2:0) + (b.pii?-1:0)
      return bw - aw
    }).slice(0,5)
  const columns    = [pkProp, ...displayProps]
  const gridCols   = `1.4fr ${displayProps.map(()=>'1.1fr').join(' ')} 110px 90px`

  const thStyle = { textAlign:'left', padding:'10px 18px', fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', color:'#9a948a', borderBottom:'1px solid #eaecea', whiteSpace:'nowrap' }
  const cell    = (last) => ({ padding:'12px 18px', verticalAlign:'middle', overflow:'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' })

  return (
    <div style={{ flex:1, overflowY:'auto', backgroundColor:'#fcfbf7', padding:'12px 26px 40px' }} className="dark-scroll">
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
        <div style={{ flex:1, display:'flex', alignItems:'baseline', gap:9 }}>
          <span style={{ fontFamily:'var(--serif)', fontSize:23, fontWeight:500, color:'#1a1a1a', letterSpacing:-0.2 }}>Records</span>
          <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'#a89e88' }}>{filteredRecords.length}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Node type dropdown */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setDropOpen(o => !o)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 14px', border:'1px solid #e3e6e3', borderRadius:8, background: dropOpen ? '#f1f3f1' : '#fff', cursor:'pointer', fontFamily:'var(--sans)', fontSize:15, fontWeight:600, color:'#1a1a1a', minWidth:200 }}>
              <NodeGlyph n={selectedNodeObj} size={18} />
              <span style={{ fontWeight:600 }}>{selectedNodeObj.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft:'auto', color:'#9a917d', transition:'transform 120ms', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {dropOpen && (
              <>
                <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={() => setDropOpen(false)} />
                <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:100, background:'#fff', border:'1px solid #e3e6e3', borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.12)', padding:6, minWidth:240, maxHeight:380, overflowY:'auto' }}>
                  {entityNodes.map(n => {
                    const isOn = nodeFilter === n.id
                    return (
                      <button key={n.id}
                        onClick={() => { setNodeFilter(n.id); setDropOpen(false); setSearch('') }}
                        style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'7px 10px', borderRadius:6, border:'none', background: isOn ? '#f1f3f1' : 'transparent', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, color:'#1a1a1a', textAlign:'left' }}
                        onMouseEnter={e => { if (!isOn) e.currentTarget.style.background='#f7f6f3' }}
                        onMouseLeave={e => { if (!isOn) e.currentTarget.style.background='transparent' }}>
                        <NodeGlyph n={n} size={13} />
                        <span style={{ fontWeight: isOn?600:400, flex:1 }}>{n.label}</span>
                        {isOn && <span style={{ color:'#16341f', fontSize:12 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${selectedNodeObj.label.toLowerCase()} records…`}
              style={{ width:240, padding:'7px 10px 7px 30px', border:'1px solid #e3e6e3', borderRadius:8, fontFamily:'var(--sans)', fontSize:13, color:'#1a1a1a', background:'#fff', outline:'none' }}
              onFocus={e => e.target.style.borderColor='#9097a0'}
              onBlur={e => e.target.style.borderColor='#e3e6e3'}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ border:'1px solid #ececea', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <thead>
            <tr style={{ background:'#F7F5F3' }}>
              {columns.map(p => (
                <th key={p.name} style={thStyle}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                    {p.pk  && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 4px', borderRadius:3, background:'#1a1a1a', color:'#fff', fontWeight:700, letterSpacing:0 }}>PK</span>}
                    {p.pii && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 4px', borderRadius:3, background:'#fbe6e6', color:'#c84040', fontWeight:700, letterSpacing:0 }}>PII</span>}
                    <span>{p.name}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#b8bcb8', fontWeight:400, letterSpacing:0, textTransform:'none' }}>{p.type}</span>
                  </span>
                </th>
              ))}
              <th style={thStyle}>Updated</th>
              <th style={thStyle}>Status</th>
              <th style={{ width:48, borderBottom:'1px solid #eaecea' }} />
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r,i) => {
              const last = i === filteredRecords.length - 1
              return (
                <tr key={r.id}
                  onClick={() => onOpenRecord?.(r, selectedNodeObj)}
                  style={{ background:'#fff', transition:'background .12s', cursor:'pointer' }}
                  onMouseOver={e => { e.currentTarget.style.background='#faf9f6' }}
                  onMouseOut={e => { e.currentTarget.style.background='#fff' }}>
                  {columns.map((p,ci) => {
                    const val = r[p.name]
                    const displayVal = val == null ? '—' : String(val)
                    return (
                      <td key={p.name} style={{ ...cell(last), fontFamily: ci===0 ? 'var(--mono)' : 'var(--sans)', fontSize: ci===0 ? 13 : 13, color: ci===0 ? '#1a1a1a' : '#374151', fontWeight: ci===0 ? 600 : 400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{displayVal}</td>
                    )
                  })}
                  <td style={{ ...cell(last), fontSize:13, color:'#9097a0', whiteSpace:'nowrap' }}>{r._updatedAgo}</td>
                  <td style={cell(last)}><StatusPill status={r.status} /></td>
                  <td style={{ ...cell(last), textAlign:'center' }}>
                    <button style={{ border:'none', background:'none', cursor:'pointer', padding:4 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#b8bcb8"/><circle cx="8" cy="8" r="1.2" fill="#b8bcb8"/><circle cx="8" cy="12.5" r="1.2" fill="#b8bcb8"/></svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div style={{ padding:'40px 18px', textAlign:'center', color:'#9097a0', fontSize:13, fontFamily:'var(--sans)' }}>
            No {selectedNodeObj.label.toLowerCase()} records match <b>{search}</b>.
          </div>
        )}
      </div>
    </div>
  )
}

// ── RecordDetailView ─────────────────────────────────────────────────────────
function RecordDetailView({ record, node, onBack, onNavigate }) {
  const [tab, setTab]                   = useState('Graph')
  const [expandedProp, setExpandedProp] = useState(null)
  const [twoHop, setTwoHop]             = useState(false)
  const [hoverNode, setHoverNode]       = useState(null)
  const [inspectedNode, setInspectedNode] = useState(null)
  const [graphFullscreen, setGraphFullscreen] = useState(false)
  const [graphPan, setGraphPan]         = useState({ x:0, y:0 })
  const [graphZoom, setGraphZoom]       = useState(1)
  const [iconHovered, setIconHovered]   = useState(false)
  const graphDrag = useRef(null)

  const props        = generateProps(node)
  const c            = colorForNode(node)
  const tabs         = ['Graph','Overview','Provenance','Quality','History','Activity']
  const related      = generateRelatedRecords(record, node)
  const totalRelated = related.reduce((s,r) => s + r.count, 0)

  const provenance = props.map((p,i) => {
    const s = node.id.charCodeAt(0)*7 + i*17 + record.id.length*3
    const conf = parseFloat((0.70 + (Math.abs(s)%28)/100).toFixed(2))
    const sources = ['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin','Snowflake Warehouse']
    const src = p.computed ? 'computed' : sources[Math.abs(s)%4]
    const ages = ['2m','18m','1h','4h','12h','1d','3d']
    const hasConflict = !p.computed && !p.pk && (Math.abs(s)%7 === 0)
    return {
      prop: p,
      value: record[p.name] != null ? record[p.name] : generateValueForProp(p,s),
      source: src, conf, age: ages[Math.abs(s)%7],
      rule: p.computed ? 'Computed via rule' : p.required ? 'NOT NULL constraint' : p.pii ? 'PII access gate' : null,
      conflict: hasConflict ? { loser: sources[(Math.abs(s)+1)%4], loserValue: generateValueForProp(p,s+1000), resolution: 'source_priority strategy' } : null
    }
  })

  const activity = [
    { when:'2m ago',  who:'Salesforce CRM',    action:'updated',   what:'name, owner_id',                            kind:'sync'     },
    { when:'1h ago',  who:'agent:enrich_v3',   action:'computed',  what:'tier, risk_score',                          kind:'agent'    },
    { when:'4h ago',  who:'HubSpot Marketing', action:'merged',    what:'industry, region',                          kind:'merge'    },
    { when:'1d ago',  who:'morgan.lee',         action:'edited',    what:'billing_address (manual override)',          kind:'manual'   },
    { when:'3d ago',  who:'schema-bot',         action:'validated', what:'all '+props.length+' properties · 0 violations', kind:'validate' },
    { when:'12d ago', who:'Salesforce CRM',    action:'created',   what:'initial record',                            kind:'create'   },
  ]

  const grouped = {}
  provenance.forEach(pv => { if (!grouped[pv.source]) grouped[pv.source] = []; grouped[pv.source].push(pv) })
  const conflictCount = provenance.filter(p => p.conflict).length

  function navigateTo(recId, nodeId) {
    if (!onNavigate) return
    const targetNode = NODES.find(n => n.id === nodeId)
    if (!targetNode) return
    setTab('Overview'); setHoverNode(null); setExpandedProp(null); setInspectedNode(null)
    onNavigate(buildRecordFromId(recId, targetNode), targetNode)
  }

  function buildSecondHop(parentRec, parentNodeObj, parentSeed) {
    const outE = EDGES.filter(e => e.s === parentNodeObj.id).slice(0,2)
    const inE  = EDGES.filter(e => e.t === parentNodeObj.id).slice(0,1)
    return [...outE, ...inE].slice(0,2).map((e, ci) => {
      const isOut = e.s === parentNodeObj.id
      const grandId = isOut ? e.t : e.s
      const grand = NODES.find(n => n.id === grandId)
      if (!grand || grand.id === node.id) return null
      const seed = parentSeed + ci*41 + 17
      const gp = generateProps(grand)
      const nameProp = gp.find(p => ['name','title','company_name'].includes(p.name)) || gp[1] || gp[0]
      return { id: grand.id+'-'+(100000+Math.abs(seed*1597)%899999), label: grand.label, nodeId: grand.id, keyName: nameProp?.name||'id', keyValue: nameProp ? generateValueForProp(nameProp,seed) : '—', edgeLabel: e.label, kind: e.kind, isOut }
    }).filter(Boolean)
  }

  // ── shared tag helpers ──
  function statusPill(status) {
    const bg  = status==='active'?C.greenFill : status==='review'?C.goldFill : C.coralFill
    const col = status==='active'?C.green     : status==='review'?C.gold     : C.coral
    return <span style={{ fontFamily:'var(--mono)', fontSize:10, padding:'3px 8px', borderRadius:4, background:bg, color:col, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>{status}</span>
  }
  function kindChip(kind) {
    const bg  = kind==='inferred'?C.goldFill   : kind==='agent'?C.purpleFill : '#f1f2f1'
    const col = kind==='inferred'?C.gold       : kind==='agent'?C.purple     : C.ink3
    return <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'1px 5px', borderRadius:3, background:bg, color:col, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>{kind}</span>
  }

  const CARD     = { background:'#fff', border:'1px solid #e6e0d4', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(60,50,30,0.03)' }
  const CARD_HEAD_ROW = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid #eaecea', fontFamily:'var(--sans)', fontSize:13, fontWeight:600, color:'#1a1a1a', background:'#F7F5F3' }
  const ghostBtn = (label, onClick) => (
    <button onClick={onClick} style={{ background:'#fff', border:'1px solid #e3ddd1', borderRadius:8, padding:'5px 11px', fontSize:12, color:C.ink2, cursor:'pointer', fontFamily:'var(--sans)' }}
      onMouseOver={e=>e.currentTarget.style.background='#f7f5f0'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>{label}</button>
  )

  // ─────────────────────────────────────────────────────────────────────────
  //  GRAPH TAB helpers
  // ─────────────────────────────────────────────────────────────────────────
  function buildFlat() {
    const flat = []
    related.forEach((r, ri) => r.related.forEach(rr => flat.push({ rr, parentIdx:ri, isOut:r.isOut })))
    const nFlat = flat.length || 1
    flat.forEach((f,i) => { const a=(i/nFlat)*Math.PI*2-Math.PI/2; f.x=550+Math.cos(a)*280; f.y=380+Math.sin(a)*280; f.angle=a })
    return flat
  }
  function buildHops(flat) {
    const hops = []
    flat.forEach((f,i) => {
      const parentNodeObj = NODES.find(n => n.id === f.rr.nodeId)
      if (!parentNodeObj) return
      const kids = buildSecondHop(f.rr, parentNodeObj, f.rr.id.length*31+i*13)
      const arcSpan = Math.PI/7
      kids.forEach((kid,ki) => {
        const offset = kids.length>1 ? ((ki-(kids.length-1)/2)/(kids.length-1))*arcSpan : 0
        const ang = f.angle+offset
        hops.push({ rr:kid, parent:f, x:550+Math.cos(ang)*520, y:380+Math.sin(ang)*520 })
      })
    })
    return hops
  }

  function GraphSVG({ fullscreen }) {
    const W=1100, H=760, cx=550, cy=380
    const flat = buildFlat()
    const hops = twoHop ? buildHops(flat) : []
    const pan = graphPan, zoom = fullscreen ? graphZoom : 1
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
        <defs>
          <marker id="rec-arr"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6"  markerHeight="6"  orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={C.ink3}/></marker>
          <marker id="rec-arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5"  markerHeight="5"  orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#c8c0b4"/></marker>
        </defs>
        <g transform={`translate(${pan.x},${pan.y}) translate(${cx},${cy}) scale(${zoom}) translate(${-cx},${-cy})`}>
          {/* 2-hop edges */}
          {hops.map((h,i) => {
            const dx=h.x-h.parent.x, dy=h.y-h.parent.y, len=Math.sqrt(dx*dx+dy*dy)
            const ux=dx/len, uy=dy/len
            const sx=h.parent.x+ux*26, sy=h.parent.y+uy*26, tx=h.x-ux*26, ty=h.y-uy*26
            return <g key={'h-e'+i}><line x1={sx} y1={sy} x2={tx} y2={ty} stroke="#d8d0c4" strokeWidth="0.9" opacity="0.5" strokeDasharray="3,2" markerEnd="url(#rec-arr2)"/><g transform={`translate(${(sx+tx)/2} ${(sy+ty)/2})`} style={{pointerEvents:'none'}}><rect x="-32" y="-7" width="64" height="13" rx="2.5" fill="#FEFDFB" stroke="#eae4d8"/><text textAnchor="middle" y="2.5" style={{fontFamily:'var(--mono)',fontSize:'8px',fill:C.ink3}}>{':'+h.rr.edgeLabel}</text></g></g>
          })}
          {/* 1-hop edges */}
          {flat.map((f,i) => {
            const dx=f.x-cx, dy=f.y-cy, len=Math.sqrt(dx*dx+dy*dy), ux=dx/len, uy=dy/len
            const sx=cx+ux*40, sy=cy+uy*40, tx=f.x-ux*26, ty=f.y-uy*26
            return <g key={'e'+i}><line x1={sx} y1={sy} x2={tx} y2={ty} stroke={C.ink3} strokeWidth="1.3" opacity="0.6" strokeDasharray={f.rr.kind==='inferred'?'4,3':'none'} markerEnd="url(#rec-arr)"/><g transform={`translate(${(cx+f.x)/2} ${(cy+f.y)/2})`} style={{pointerEvents:'none'}}><rect x="-44" y="-9" width="88" height="18" rx="3" fill="#FEFDFB" stroke="#eae4d8"/><text textAnchor="middle" y="3.5" style={{fontFamily:'var(--mono)',fontSize:'9.5px',fill:C.ink2}}>{':'+f.rr.edgeLabel}</text></g></g>
          })}
          {/* 2-hop nodes */}
          {hops.map((h,i) => {
            const nObj = NODES.find(n => n.id === h.rr.nodeId)
            const col  = colorForNode(nObj)
            const isInsp = inspectedNode?.id === h.rr.id
            const isHov  = hoverNode === h.rr.id
            return <g key={'h-n'+i} style={{cursor:'pointer'}} onClick={()=>{ if(graphDrag.current?.moved) return; setInspectedNode(h.rr) }} onMouseEnter={()=>setHoverNode(h.rr.id)} onMouseLeave={()=>setHoverNode(null)}>
              <circle cx={h.x} cy={h.y} r={isInsp?30:isHov?28:26} fill={col.fill} stroke={isInsp||isHov?C.ink:col.stroke} strokeWidth={isInsp?3:isHov?2.6:1.8}/>
              <text x={h.x} y={h.y-34} textAnchor="middle" style={{fontFamily:'var(--mono)',fontSize:'11.5px',fontWeight:600,fill:C.ink,pointerEvents:'none'}}>{h.rr.id}</text>
              <text x={h.x} y={h.y+42} textAnchor="middle" style={{fontFamily:'var(--mono)',fontSize:'10.5px',fill:C.ink3,pointerEvents:'none'}}>{String(h.rr.keyValue).slice(0,18)}</text>
            </g>
          })}
          {/* Centre node */}
          <g style={{cursor:'pointer'}} onClick={()=>{ if(graphDrag.current?.moved) return; setInspectedNode(null) }}>
            <circle cx={cx} cy={cy} r={38} fill={c.fill} stroke={inspectedNode===null?C.ink:c.stroke} strokeWidth={inspectedNode===null?3.6:2.8}/>
            <text x={cx} y={cy-50} textAnchor="middle" style={{fontFamily:'var(--mono)',fontSize:'12px',fontWeight:600,fill:C.ink,pointerEvents:'none'}}>{record.id}</text>
            <text x={cx} y={cy+60} textAnchor="middle" style={{fontFamily:'var(--mono)',fontSize:'11px',fill:C.ink3,pointerEvents:'none'}}>{record[Object.keys(record).find(k=>k==='name'||k==='company_name'||k==='title')]||node.label}</text>
          </g>
          {/* 1-hop nodes */}
          {flat.map((f,i) => {
            const otherCol = colorForNode(NODES.find(n => n.id === f.rr.nodeId))
            const isInsp = inspectedNode?.id === f.rr.id
            const isHov  = hoverNode === f.rr.id
            return <g key={'n'+i} style={{cursor:'pointer'}} onClick={()=>{ if(graphDrag.current?.moved) return; setInspectedNode(f.rr) }} onMouseEnter={()=>setHoverNode(f.rr.id)} onMouseLeave={()=>setHoverNode(null)}>
              <circle cx={f.x} cy={f.y} r={isInsp?30:isHov?28:26} fill={otherCol.fill} stroke={isInsp||isHov?C.ink:otherCol.stroke} strokeWidth={isInsp?3:isHov?2.6:1.8}/>
              <text x={f.x} y={f.y-34} textAnchor="middle" style={{fontFamily:'var(--mono)',fontSize:'11.5px',fontWeight:600,fill:C.ink,pointerEvents:'none'}}>{f.rr.id}</text>
              <text x={f.x} y={f.y+42} textAnchor="middle" style={{fontFamily:'var(--mono)',fontSize:'10.5px',fill:C.ink3,pointerEvents:'none'}}>{f.rr.keyName+': '+String(f.rr.keyValue).slice(0,20)}</text>
            </g>
          })}
        </g>
      </svg>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  GRAPH inspector pane
  // ─────────────────────────────────────────────────────────────────────────
  function InspectorPane() {
    let insp
    if (inspectedNode === null) {
      insp = { isCentre:true, headerId:record.id, headerLabel: record[Object.keys(record).find(k=>k==='name'||k==='company_name'||k==='title')]||node.label, headerNode:node, edgeBadge:null, status:record.status, propsList:provenance.map(pv=>({name:pv.prop.name,value:pv.value,pii:pv.prop.pii,pk:pv.prop.pk,computed:pv.prop.computed,type:pv.prop.type,source:pv.source,age:pv.age,conf:pv.conf})), relatedCount:totalRelated, completeness:record._completeness, confidence:record._confidence, sourceLabel:record._source, updatedAgo:record._updatedAgo, createdAgo:record._createdAgo, targetRecordId:record.id, targetNodeId:node.id }
    } else {
      const nObj = NODES.find(n => n.id === inspectedNode.nodeId)||node
      const inspProps = generateProps(nObj)
      const inspSeed  = inspectedNode.id.length*13 + inspectedNode.id.charCodeAt(inspectedNode.id.length-1)*7
      insp = { isCentre:false, headerId:inspectedNode.id, headerLabel:inspectedNode.keyValue, headerNode:nObj, edgeBadge:{ dir:inspectedNode.isOut?'out':'in', label:inspectedNode.edgeLabel, kind:inspectedNode.kind, fromLabel:node.label, toLabel:nObj.label }, status:['active','active','review','active','flagged'][Math.abs(inspSeed)%5], propsList:inspProps.map((p,idx)=>({ name:p.name, value:generateValueForProp(p,inspSeed+idx*11), pii:p.pii, pk:p.pk, computed:p.computed, type:p.type, source:['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin'][(inspSeed+idx)%4], age:['2m','18m','1h','4h','12h','1d'][(inspSeed+idx)%6], conf:0.78+((Math.abs(inspSeed+idx)%20)/100) })), relatedCount:1+(Math.abs(inspSeed)%5), completeness:78+(Math.abs(inspSeed)%22), confidence:82+(Math.abs(inspSeed)%17), sourceLabel:['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin'][Math.abs(inspSeed)%4], updatedAgo:['2m ago','14m ago','1h ago','4h ago','1d ago','3d ago'][Math.abs(inspSeed)%6], createdAgo:['12d ago','34d ago','2mo ago','6mo ago','1y ago','2y ago'][Math.abs(inspSeed)%6], targetRecordId:inspectedNode.id, targetNodeId:inspectedNode.nodeId }
    }
    const inspCol  = colorForNode(insp.headerNode)
    const compColor = insp.completeness>=90?C.green:insp.completeness>=75?C.gold:C.coral
    return (
      <div style={{ ...CARD, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* header */}
        <div style={{ padding:'16px 18px 14px', borderBottom:'1px solid #eae4d8', background:'#f7f5f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:10 }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.6px', color:C.ink3, textTransform:'uppercase' }}>{insp.isCentre?'This record':'Inspecting'}</span>
            {!insp.isCentre && <button onClick={()=>setInspectedNode(null)} style={{ background:'none', border:'none', padding:0, color:C.ink3, cursor:'pointer', fontFamily:'var(--mono)', fontSize:10 }}>Clear ✕</button>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ width:44, height:44, borderRadius:'50%', background:inspCol.fill, border:'1.5px solid '+inspCol.stroke, flexShrink:0 }} />
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:15, fontWeight:600, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{insp.headerId}</div>
              <div style={{ fontSize:12.5, color:C.ink2, marginTop:3 }}>{insp.headerLabel}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:3, background:'#f1f0ec', color:C.ink3, letterSpacing:'0.5px', fontWeight:700, textTransform:'uppercase' }}>{insp.headerNode.label}</span>
                {statusPill(insp.status)}
                <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>· updated {insp.updatedAgo}</span>
              </div>
            </div>
          </div>
          {insp.edgeBadge && (
            <div style={{ marginTop:12, padding:'7px 10px', borderRadius:7, background:'#fff', border:'1px solid #eae4d8', display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>{insp.edgeBadge.dir==='out'?insp.edgeBadge.fromLabel+' →':insp.edgeBadge.fromLabel+' ←'}</span>
              <code style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink2, fontWeight:600 }}>:{insp.edgeBadge.label}</code>
              {kindChip(insp.edgeBadge.kind)}
              <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>→ {insp.edgeBadge.toLabel}</span>
            </div>
          )}
        </div>
        {/* mini KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid #eae4d8' }}>
          {[{ lbl:'PROPERTIES', v:insp.propsList.length, color:C.ink },{ lbl:'COMPLETENESS', v:insp.completeness+'%', color:compColor },{ lbl:'RELATED', v:insp.relatedCount, color:C.ink }].map((k,i,a)=>(
            <div key={k.lbl} style={{ padding:'11px 14px', borderRight:i<a.length-1?'1px solid #eae4d8':'none' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.5px', color:C.ink3 }}>{k.lbl}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:15, color:k.color, fontWeight:700, marginTop:3 }}>{k.v}</div>
            </div>
          ))}
        </div>
        {/* scrollable props */}
        <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
          <div style={{ padding:'10px 18px 5px', fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.5px', color:C.ink3, textTransform:'uppercase', display:'flex', justifyContent:'space-between' }}>
            <span>Properties</span><span>{insp.propsList.length+' fields · '+insp.sourceLabel}</span>
          </div>
          {insp.propsList.map((pv,i)=>(
            <div key={pv.name} style={{ display:'grid', gridTemplateColumns:'130px 1fr auto', gap:10, padding:'7px 18px', alignItems:'center', borderBottom:i<insp.propsList.length-1?'1px solid #f1f0ec':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, minWidth:0 }}>
                {pv.pk && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.ink, color:'#fff', fontWeight:700 }}>PK</span>}
                <code style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={pv.name}>{pv.name}</code>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(pv.value)}</span>
              <span style={{ display:'flex', gap:3, alignItems:'center' }}>
                {pv.pii      && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.coralFill, color:C.coral, fontWeight:700 }}>PII</span>}
                {pv.computed && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.purpleFill, color:C.purple, fontWeight:700 }}>FX</span>}
              </span>
            </div>
          ))}
        </div>
        {/* footer */}
        <div style={{ padding:'10px 16px', borderTop:'1px solid #eae4d8', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, background:'#f7f5f0' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>created {insp.createdAgo}</span>
          {!insp.isCentre && <button className="btn-dark" style={{ fontSize:11.5, padding:'6px 12px' }} onClick={()=>navigateTo(insp.targetRecordId, insp.targetNodeId)}>Open full record →</button>}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const tabBadge = { Graph:totalRelated, Overview:props.length, Provenance:conflictCount||null, Quality:null, History:null, Activity:activity.length }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', backgroundColor:'#fcfbf7' }} className="dark-scroll">

      {/* ── Header (matches NodeDetailPage) ── */}
      <div style={{ flexShrink:0 }}>
        {/* title zone — icon + name + chip, actions on the right */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#FEFDFB', padding:'14px 26px 12px' }}>
          <span
            onMouseEnter={()=>setIconHovered(true)}
            onMouseLeave={()=>setIconHovered(false)}
            onClick={iconHovered ? onBack : undefined}
            title={iconHovered?'Back to records':undefined}
            style={{ width:32, height:32, borderRadius:8, background:iconHovered?'#f2f0eb':'#fff', border:'1px solid #eee7da', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:iconHovered?'pointer':'default', transition:'background .15s' }}>
            {iconHovered
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6b6b5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13"/></svg>
              : <NodeGlyph n={node} size={18} />}
          </span>
          <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:'#1a1a1a', letterSpacing:-0.2 }}>{record.id}</span>
          <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'#6b7280', border:'1px solid #e3ddd1', background:'#f5f3ef', padding:'2px 8px', borderRadius:6 }}>{node.label.toUpperCase()}</span>
          <div style={{ flex:1 }} />
          {ghostBtn('Open in source ↗')}
          {ghostBtn('Copy ID')}
          <button className="btn-dark" style={{ height:32, padding:'0 14px', fontSize:13 }}>Edit record</button>
        </div>

        {/* tab rail — same component as the node detail page */}
        <div style={{ background:'#FEFDFB', borderTop:'1px solid #f1ede6', borderBottom:'1px solid #efece6', padding:'0 26px' }}>
          <div style={{ display:'flex' }}>
            {tabs.map(t => {
              const on = tab===t
              const count = tabBadge[t]
              return (
                <button key={t} onClick={()=>setTab(t)} style={{ position:'relative', flex:1, minWidth:0, cursor:'pointer', border:'none', background:'none', padding:'11px 8px 13px', fontSize:13, fontWeight:on?600:500, color:on?'#1a1a1a':'#5b5547', transition:'color .15s', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}
                  onMouseOver={e=>{ if(!on) e.currentTarget.style.color='#1a1a1a' }} onMouseOut={e=>{ if(!on) e.currentTarget.style.color='#5b5547' }}>
                  <span style={{ display:'inline-flex', color:on?'#6b6453':'#8a8378', transition:'color .15s' }}>{REC_TAB_ICON[t]}</span>
                  {t}
                  {count != null && count > 0 && <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:600, color:'#6b6453', background:on?'rgba(40,32,18,0.07)':'#efe9dd', borderRadius:5, padding:'1px 5px' }}>{count}</span>}
                  <span style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:-1, width:on?'100%':0, maxWidth:'calc(100% - 16px)', height:2, borderRadius:2, background:'#2a2620', transition:'width .18s ease' }} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab body ── */}
      <div style={{ flex:1, padding:'18px 26px 20px', overflowY:'auto', minHeight:0 }}>

        {/* ── GRAPH ── */}
        {tab==='Graph' && (
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(340px,.7fr)', gap:18, height:'100%', minHeight:460 }}>
            <div style={{ ...CARD, padding:0, display:'flex', flexDirection:'column' }}>
              <div style={CARD_HEAD_ROW}>
                <span>Relationship graph</span>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {ghostBtn(twoHop?'Collapse to 1-hop':'Expand 2-hop', ()=>setTwoHop(v=>!v))}
                  <button onClick={()=>setGraphFullscreen(true)} title="Expand" style={{ width:30, height:30, borderRadius:6, border:'1px solid #e3ddd1', background:'#fff', color:C.ink2, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                  </button>
                </div>
              </div>
              <div
                onMouseDown={e=>{ if(e.target.tagName==='circle') return; graphDrag.current={startX:e.clientX,startY:e.clientY,origX:graphPan.x,origY:graphPan.y,moved:false}; e.currentTarget.style.cursor='grabbing' }}
                onMouseMove={e=>{ const d=graphDrag.current; if(!d) return; const dx=e.clientX-d.startX,dy=e.clientY-d.startY; if(!d.moved&&Math.hypot(dx,dy)>3) d.moved=true; if(d.moved) setGraphPan({x:d.origX+dx,y:d.origY+dy}) }}
                onMouseUp={e=>{ graphDrag.current=null; e.currentTarget.style.cursor='grab' }}
                onMouseLeave={e=>{ graphDrag.current=null; e.currentTarget.style.cursor='grab' }}
                onDoubleClick={()=>setGraphPan({x:0,y:0})}
                style={{ flex:1, minHeight:0, background:'#fbf9f3', backgroundImage:'radial-gradient(#ece7db 0.8px, transparent 0.8px)', backgroundSize:'18px 18px', overflow:'hidden', cursor:'grab', userSelect:'none', position:'relative' }}>
                <GraphSVG fullscreen={false}/>
              </div>
            </div>
            <InspectorPane/>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab==='Overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) minmax(280px,1fr)', gap:18 }}>
            {/* left — property values */}
            <div style={CARD}>
              <div style={CARD_HEAD_ROW}>
                <span>Property values <span style={{ fontWeight:400, fontSize:12, color:C.ink3 }}>{props.length} fields · {record._source}</span></span>
                <div style={{ display:'flex', gap:6 }}>
                  {ghostBtn('Show nulls')}
                  {ghostBtn('Export JSON')}
                </div>
              </div>
              <div>
                {provenance.map((pv,i)=>{
                  const p=pv.prop
                  return (
                    <div key={p.name} style={{ display:'grid', gridTemplateColumns:'180px 1fr auto auto', alignItems:'center', gap:14, padding:'11px 18px', borderBottom:i<provenance.length-1?'1px solid #f1f0ec':'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
                        {p.pk && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'1px 4px', borderRadius:3, background:C.ink, color:'#fff', fontWeight:700 }}>PK</span>}
                        <code style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink, fontWeight:p.pk?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</code>
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:12.5, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(pv.value)}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>{p.type}</span>
                      <div style={{ display:'flex', gap:3 }}>
                        {p.pii      && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.coralFill, color:C.coral, fontWeight:700 }}>PII</span>}
                        {p.required && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:'#f1f0ec', color:C.ink3, fontWeight:700 }}>REQ</span>}
                        {p.computed && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.purpleFill, color:C.purple, fontWeight:700 }}>FX</span>}
                        {pv.conflict && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.goldFill, color:C.gold, fontWeight:700 }}>⚠</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* right */}
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={CARD}>
                <div style={CARD_HEAD_ROW}>
                  <span>Connections <span style={{ fontWeight:400, fontSize:12, color:C.ink3 }}>{totalRelated} across {related.length} edge types</span></span>
                  <button style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)', fontSize:12, color:C.blue }} onClick={()=>setTab('Graph')}>See in graph →</button>
                </div>
                <div style={{ maxHeight:520, overflowY:'auto' }}>
                  {related.map((r,i)=>(
                    <div key={i} style={{ padding:'10px 16px', borderBottom:i<related.length-1?'1px solid #f1f0ec':'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.ink3 }}>{r.isOut?'→':'←'}</span>
                        <code style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink2, fontWeight:600 }}>:{r.edge.label}</code>
                        <NodeGlyph n={r.otherNode} size={12}/>
                        <span style={{ fontSize:11.5, color:C.ink2 }}>{r.otherNode.label}</span>
                        {kindChip(r.edge.kind)}
                        <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>{r.count}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        {r.related.map((rr,j)=>(
                          <div key={j} onClick={()=>navigateTo(rr.id,rr.nodeId)}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 6px', cursor:'pointer', borderRadius:5, transition:'background 80ms' }}
                            onMouseEnter={e=>e.currentTarget.style.background='#f7f5f0'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <code style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.blue, flexShrink:0 }}>{rr.id}</code>
                            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{rr.keyValue}</span>
                            <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:9.5, color:C.ink3, flexShrink:0 }}>{rr.since}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={CARD}>
                <div style={CARD_HEAD_ROW}>Source contributions</div>
                <div>
                  {Object.keys(grouped).map((src,i,arr)=>{
                    const fields=grouped[src]
                    const pct=Math.round(fields.length/provenance.length*100)
                    const avgConf=(fields.reduce((s,f)=>s+f.conf,0)/fields.length).toFixed(2)
                    return (
                      <div key={src} style={{ padding:'12px 18px', borderBottom:i<arr.length-1?'1px solid #f1f0ec':'none' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink2, fontWeight:600 }}>{src}</span>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3 }}>{fields.length+' fields · conf '+avgConf}</span>
                        </div>
                        <div style={{ height:5, borderRadius:3, background:'#f0eeeb', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:3, width:pct+'%', background:src==='computed'?C.purple:C.blue, transition:'width .3s' }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROVENANCE ── */}
        {tab==='Provenance' && (
          <div style={CARD}>
            <div style={CARD_HEAD_ROW}>
              <span>How each value was built <span style={{ fontWeight:400, fontSize:12, color:C.ink3 }}>source · timestamp · confidence · rule applied</span></span>
            </div>
            <div>
              {provenance.map((pv,i)=>{
                const confColor = pv.conf>=0.9?C.green:pv.conf>=0.75?C.gold:C.coral
                return (
                  <div key={pv.prop.name} style={{ padding:'14px 18px', borderBottom:i<provenance.length-1?'1px solid #f1f0ec':'none' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr 140px 90px 80px', gap:14, alignItems:'center' }}>
                      <code style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink, fontWeight:pv.prop.pk?600:400 }}>{pv.prop.name}</code>
                      <div style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(pv.value)}</div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11, color:pv.source==='computed'?C.purple:C.ink2 }}>{pv.source}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3 }}>{pv.age+' ago'}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:confColor, textAlign:'right' }}>{pv.conf}</span>
                    </div>
                    {(pv.rule||pv.conflict) && (
                      <div style={{ marginTop:8, marginLeft:194, display:'flex', flexDirection:'column', gap:6 }}>
                        {pv.rule && <div style={{ fontSize:11, color:C.ink3, fontFamily:'var(--mono)' }}>↳ rule: <span style={{ color:C.ink2 }}>{pv.rule}</span></div>}
                        {pv.conflict && (
                          <div style={{ padding:'7px 10px', background:C.goldFill, borderRadius:5, fontSize:11, color:C.ink2 }}>
                            <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:C.gold }}>⚠ CONFLICT</span> · {pv.conflict.loser} sent <code style={{ fontFamily:'var(--mono)', background:'rgba(255,255,255,0.5)', padding:'1px 5px', borderRadius:3 }}>{String(pv.conflict.loserValue)}</code> · resolved by <b>{pv.conflict.resolution}</b>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {(tab==='Quality' || tab==='History') && (
          <div style={{ ...CARD, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'80px 24px', minHeight:380 }}>
            <span style={{ width:46, height:46, borderRadius:11, background:'#f4f1ea', border:'1px solid #e6e0d4', color:C.ink3, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
              <span style={{ transform:'scale(1.6)', display:'inline-flex' }}>{REC_TAB_ICON[tab]}</span>
            </span>
            <div style={{ fontFamily:'var(--serif)', fontSize:18, color:'#1a1a1a', marginBottom:6 }}>{tab==='Quality'?'Data quality':'Version history'}</div>
            <div style={{ fontSize:13, color:C.ink3, maxWidth:380, lineHeight:1.5 }}>{tab==='Quality'
              ? 'Quality checks, validation rules and violations for this record will appear here.'
              : 'A full timeline of changes, who made them, and prior values will appear here.'}</div>
          </div>
        )}

        {tab==='Activity' && (
          <div style={CARD}>
            <div style={CARD_HEAD_ROW}>Change history <span style={{ fontWeight:400, fontSize:12, color:C.ink3 }}>last 30 days</span></div>
            <div>
              {activity.map((a,i)=>{
                const dotColor = a.kind==='create'?C.green:a.kind==='sync'?C.blue:a.kind==='agent'?C.purple:a.kind==='manual'?C.coral:a.kind==='merge'?C.gold:C.ink3
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'100px 12px 1fr', gap:14, alignItems:'center', padding:'12px 18px', borderBottom:i<activity.length-1?'1px solid #f1f0ec':'none' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3 }}>{a.when}</span>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:dotColor, justifySelf:'center' }}/>
                    <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink2, fontWeight:600 }}>{a.who}</span>
                      <span style={{ fontSize:12, color:C.ink3 }}>{a.action}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink }}>{a.what}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen graph modal ── */}
      {graphFullscreen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:240, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{ if(e.target===e.currentTarget) setGraphFullscreen(false) }}>
          <div style={{ width:'96vw', height:'94vh', background:'#faf8f4', borderRadius:14, border:'1px solid #e3ddd1', boxShadow:'0 32px 80px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ flexShrink:0, padding:'14px 22px', borderBottom:'1px solid #e3ddd1', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FEFDFB' }}>
              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.7px', color:C.ink3, textTransform:'uppercase' }}>{node.label} · {record.id}</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:22, color:C.ink, marginTop:2 }}>Relationship graph</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3 }}>{buildFlat().length} direct · drag to pan · scroll to zoom</span>
                {ghostBtn('Close ✕', ()=>setGraphFullscreen(false))}
              </div>
            </div>
            <div
              onMouseDown={e=>{ if(e.target.tagName==='circle') return; graphDrag.current={startX:e.clientX,startY:e.clientY,origX:graphPan.x,origY:graphPan.y,moved:false}; e.currentTarget.style.cursor='grabbing' }}
              onMouseMove={e=>{ const d=graphDrag.current; if(!d) return; const dx=e.clientX-d.startX,dy=e.clientY-d.startY; if(!d.moved&&Math.hypot(dx,dy)>3) d.moved=true; if(d.moved) setGraphPan({x:d.origX+dx,y:d.origY+dy}) }}
              onMouseUp={e=>{ graphDrag.current=null; e.currentTarget.style.cursor='grab' }}
              onMouseLeave={e=>{ graphDrag.current=null; e.currentTarget.style.cursor='grab' }}
              onDoubleClick={()=>{ setGraphPan({x:0,y:0}); setGraphZoom(1) }}
              onWheel={e=>{ e.preventDefault(); setGraphZoom(z=>Math.max(0.3,Math.min(3,z*(e.deltaY<0?1.12:1/1.12)))) }}
              style={{ flex:1, background:'#faf8f4', overflow:'hidden', cursor:'grab', userSelect:'none', position:'relative' }}>
              <GraphSVG fullscreen={true}/>
              {/* zoom controls */}
              <div style={{ position:'absolute', left:18, bottom:18, display:'flex', flexDirection:'column', background:'#fff', border:'1px solid #e3ddd1', borderRadius:8, overflow:'hidden' }}
                onMouseDown={e=>e.stopPropagation()} onDoubleClick={e=>e.stopPropagation()}>
                <button onClick={()=>setGraphZoom(z=>Math.min(3,z*1.2))} style={{ width:34, height:32, border:'none', borderBottom:'1px solid #eae4d8', background:'transparent', cursor:'pointer', fontSize:16, color:C.ink2 }}>+</button>
                <div style={{ width:34, padding:'4px 0', fontFamily:'var(--mono)', fontSize:10, color:C.ink3, textAlign:'center', borderBottom:'1px solid #eae4d8' }}>{Math.round(graphZoom*100)+'%'}</div>
                <button onClick={()=>setGraphZoom(z=>Math.max(0.3,z/1.2))} style={{ width:34, height:32, border:'none', borderBottom:'1px solid #eae4d8', background:'transparent', cursor:'pointer', fontSize:16, color:C.ink2 }}>−</button>
                <button onClick={()=>{ setGraphZoom(1); setGraphPan({x:0,y:0}) }} style={{ width:34, height:30, border:'none', background:'transparent', cursor:'pointer', color:C.ink2, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 4 20 10 20"/><polyline points="20 10 20 4 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedNode,   setSelectedNode]   = useState(null)

  if (selectedRecord && selectedNode) {
    return (
      <RecordDetailView
        record={selectedRecord}
        node={selectedNode}
        onBack={() => { setSelectedRecord(null); setSelectedNode(null) }}
        onNavigate={(rec, node) => { setSelectedRecord(rec); setSelectedNode(node) }}
      />
    )
  }

  return (
    <RecordsView
      onOpenRecord={(rec, node) => { setSelectedRecord(rec); setSelectedNode(node) }}
    />
  )
}
