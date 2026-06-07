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

  const PLATE = { background:'#FEFDFB', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', flex:1, minWidth:0 }

  return (
    <div style={PLATE}>
      {/* ── Header ── */}
      <div style={{ padding:'18px 26px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
          <h1 style={{ fontFamily:'var(--serif)', fontSize:27, fontWeight:500, color:'#1a1a1a', letterSpacing:-0.3, flex:1 }}>
            Records
          </h1>
          <div style={{ display:'flex', gap:34, marginRight:22 }}>
            {[['NODES', String(entityNodes.length)], ['RECORDS', filteredRecords.length.toLocaleString()], ['PROPS', String(props.length)]].map(([l,v]) => (
              <div key={l} style={{ textAlign:'left' }}>
                <div style={{ fontFamily:'var(--sans)', fontSize:10.5, color:'#9ca3af', fontWeight:500, letterSpacing:0.8, marginBottom:3, textTransform:'uppercase' }}>{l}</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:600, color:'#111827' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <GhostBtn>Export CSV</GhostBtn>
            <DarkBtn>+ Add record</DarkBtn>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:14 }}>
          {/* Node type dropdown */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setDropOpen(o => !o)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', border:`1px solid ${C.line}`, borderRadius:8, background: dropOpen ? C.canvas : '#fff', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, color:C.ink, minWidth:240 }}>
              <NodeGlyph n={selectedNodeObj} size={16} />
              <span style={{ fontWeight:500 }}>{selectedNodeObj.label}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, marginLeft:4 }}>{records.length} records</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ marginLeft:'auto', transition:'transform 120ms', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {dropOpen && (
              <>
                <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={() => setDropOpen(false)} />
                <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:100, background:'#fff', border:`1px solid ${C.line}`, borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.12)', padding:6, minWidth:280, maxHeight:420, overflowY:'auto' }}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.7px', color:C.ink4, textTransform:'uppercase', padding:'8px 10px 6px' }}>Select node type</div>
                  {entityNodes.map(n => {
                    const isOn = nodeFilter === n.id
                    return (
                      <button key={n.id}
                        onClick={() => { setNodeFilter(n.id); setDropOpen(false); setSearch('') }}
                        style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:6, border:'none', background: isOn ? C.canvas : 'transparent', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, color:C.ink, textAlign:'left' }}
                        onMouseEnter={e => { if (!isOn) e.currentTarget.style.background=C.canvas }}
                        onMouseLeave={e => { if (!isOn) e.currentTarget.style.background='transparent' }}>
                        <NodeGlyph n={n} size={14} />
                        <span style={{ fontWeight: isOn?600:400, flex:1 }}>{n.label}</span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3 }}>12</span>
                        {isOn && <span style={{ fontFamily:'var(--mono)', color:C.ink, fontSize:11, marginLeft:4 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div style={{ position:'relative', flex:'0 0 280px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${selectedNodeObj.label.toLowerCase()} records…`}
              style={{ width:'100%', padding:'7px 10px 7px 30px', border:`1px solid ${C.line}`, borderRadius:8, fontFamily:'var(--sans)', fontSize:12.5, color:C.ink, background:'#fff', outline:'none', transition:'border-color .15s' }}
              onFocus={e => e.target.style.borderColor=C.ink3}
              onBlur={e => e.target.style.borderColor=C.line}
            />
          </div>

          <div style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:11, color:C.ink3 }}>
            {filteredRecords.length}{search ? ` of ${records.length}` : ''} records · {props.length} properties
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 18px 18px' }}>
        <div style={{ background:'#fff', border:`1px solid ${C.line}`, borderRadius:12, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:12, padding:'10px 18px', background:C.canvas, borderBottom:`1px solid ${C.line}`, fontFamily:'var(--mono)', fontSize:9.5, color:C.ink3, letterSpacing:'0.6px', textTransform:'uppercase', alignItems:'center' }}>
            {columns.map(p => (
              <div key={p.name} style={{ display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
                {p.pk  && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 4px', borderRadius:3, background:C.ink, color:'#fff', fontWeight:700, letterSpacing:0 }}>PK</span>}
                {p.pii && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 4px', borderRadius:3, background:C.coralFill, color:C.coral, fontWeight:700, letterSpacing:0 }}>PII</span>}
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:8.5, color:C.ink4, textTransform:'none', letterSpacing:0 }}>{p.type}</span>
              </div>
            ))}
            <div>Updated</div>
            <div>Status</div>
          </div>

          {/* Rows */}
          {filteredRecords.map((r,i) => (
            <div key={r.id}
              onClick={() => onOpenRecord(r, selectedNodeObj)}
              style={{ display:'grid', gridTemplateColumns:gridCols, gap:12, padding:'12px 18px', borderBottom: i < filteredRecords.length-1 ? `1px solid ${C.line2}` : 'none', cursor:'pointer', alignItems:'center', transition:'background 80ms' }}
              onMouseEnter={e => e.currentTarget.style.background=C.canvas}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {columns.map((p,ci) => {
                const val = r[p.name]
                const displayVal = val == null ? '—' : String(val)
                return (
                  <div key={p.name} style={{ fontFamily:'var(--mono)', fontSize:ci===0?11.5:11, color:ci===0?C.blue:C.ink2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayVal}</div>
                )
              })}
              <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink4 }}>{r._updatedAgo}</div>
              <div><StatusPill status={r.status} /></div>
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div style={{ padding:'40px 18px', textAlign:'center', color:C.ink3, fontSize:13, fontFamily:'var(--sans)' }}>
              No {selectedNodeObj.label.toLowerCase()} records match <b>{search}</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── RecordDetailView ─────────────────────────────────────────────────────────
function RecordDetailView({ record, node, onBack, onNavigate }) {
  const [tab, setTab]               = useState('Overview')
  const [twoHop, setTwoHop]         = useState(false)
  const [hoverNode, setHoverNode]   = useState(null)
  const [inspected, setInspected]   = useState(null) // a related record rr object | null = centre
  const [graphPan, setGraphPan]     = useState({ x:0, y:0 })
  const graphDrag = useRef(null)

  const props   = generateProps(node)
  const col     = colorForNode(node)
  const tabs    = ['Overview','Graph','Provenance','Activity']
  const related = generateRelatedRecords(record, node)
  const totalRelated = related.reduce((s,r) => s + r.count, 0)

  // Provenance per prop
  const provenance = props.map((p,i) => {
    const s = node.id.charCodeAt(0)*7 + i*17 + record.id.length*3
    const conf = parseFloat((0.70+(Math.abs(s)%28)/100).toFixed(2))
    const sources = ['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin','Snowflake Warehouse']
    const src = p.computed ? 'computed' : sources[Math.abs(s)%4]
    const ages = ['2m','18m','1h','4h','12h','1d','3d']
    const hasConflict = !p.computed && !p.pk && (Math.abs(s)%7 === 0)
    return {
      prop: p,
      value: record[p.name] ?? generateValueForProp(p,s),
      source: src, conf, age: ages[Math.abs(s)%7],
      conflict: hasConflict ? { loser: sources[(Math.abs(s)+1)%4], loserValue: generateValueForProp(p,s+1000), resolution: 'source_priority strategy' } : null
    }
  })

  // Group by source for source contributions card
  const grouped = {}
  provenance.forEach(pv => { if (!grouped[pv.source]) grouped[pv.source]=[]; grouped[pv.source].push(pv) })

  // Activity
  const activity = [
    { when:'2m ago',  who:'Salesforce CRM',   action:'updated',   what:'name, owner_id',            kind:'sync'     },
    { when:'1h ago',  who:'agent:enrich_v3',  action:'computed',  what:'tier, risk_score',           kind:'agent'    },
    { when:'4h ago',  who:'HubSpot Marketing',action:'merged',    what:'industry, region',           kind:'merge'    },
    { when:'1d ago',  who:'morgan.lee',        action:'edited',    what:'billing_address (override)', kind:'manual'   },
    { when:'3d ago',  who:'schema-bot',        action:'validated', what:'all 18 properties · 0 fails',kind:'validate' },
    { when:'12d ago', who:'Salesforce CRM',   action:'created',   what:'initial record',             kind:'create'   },
  ]

  function navigateTo(recId, nodeId) {
    if (!onNavigate) return
    const targetNode   = NODES.find(n => n.id === nodeId)
    if (!targetNode) return
    const targetRecord = buildRecordFromId(recId, targetNode)
    onNavigate(targetRecord, targetNode)
  }

  function buildSecondHop(parentNodeObj, parentSeed) {
    const childEdges = [...EDGES.filter(e=>e.s===parentNodeObj.id).slice(0,2), ...EDGES.filter(e=>e.t===parentNodeObj.id).slice(0,1)]
    return childEdges.slice(0,2).map((e,ci) => {
      const isOut = e.s === parentNodeObj.id
      const grandId = isOut ? e.t : e.s
      const grand = NODES.find(n => n.id === grandId)
      if (!grand || grand.id === node.id) return null
      const seed = parentSeed + ci*41 + 17
      const gp = generateProps(grand)
      const nameProp = gp.find(p => ['name','title','company_name'].includes(p.name)) || gp[1] || gp[0]
      return { id: grand.id+'-'+(100000+Math.abs(seed*1597)%899999), label:grand.label, nodeId:grand.id, keyName:nameProp?.name||'id', keyValue:nameProp?generateValueForProp(nameProp,seed):'—', edgeLabel:e.label, kind:e.kind, isOut }
    }).filter(Boolean)
  }

  const CARD = { background:'#fff', border:`1px solid ${C.line}`, borderRadius:12, overflow:'hidden' }
  const CARD_HEAD = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:`1px solid ${C.line}`, fontFamily:'var(--sans)', fontSize:13.5, fontWeight:500, color:C.ink, background:C.canvas }

  return (
    <div style={{ background:'#FEFDFB', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', flex:1, minWidth:0, height:'100%' }}>
      {/* ── Detail header ── */}
      <div style={{ padding:'16px 26px 0', flexShrink:0 }}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, fontFamily:'var(--sans)', fontSize:12.5, color:C.ink3 }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:C.ink3, padding:0, fontSize:12.5, fontFamily:'var(--sans)' }}
            onMouseOver={e=>e.currentTarget.style.color=C.ink}
            onMouseOut={e=>e.currentTarget.style.color=C.ink3}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            Records
          </button>
          <span>/</span>
          <span style={{ color:C.ink2 }}>{node.label}</span>
          <span>/</span>
          <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink2 }}>{record.id}</span>
        </div>

        {/* Title row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
          <div style={{ flexShrink:0, marginTop:4 }}><NodeGlyph n={node} size={36} /></div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:600, color:C.ink, marginBottom:6 }}>{record.id}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, padding:'3px 8px', borderRadius:4, background:C.canvas, color:C.ink3, letterSpacing:'0.5px' }}>{node.label.toUpperCase()}</span>
              <StatusPill status={record.status} />
              <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink4 }}>created {record._createdAgo} · updated {record._updatedAgo}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <GhostBtn>Open in source ↗</GhostBtn>
            <GhostBtn>Copy ID</GhostBtn>
            <DarkBtn>Edit record</DarkBtn>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:1, borderRadius:10, overflow:'hidden', border:`1px solid ${C.line}`, marginBottom:14 }}>
          {[
            ['Properties', String(props.length), null],
            ['Completeness', record._completeness+'%', record._completeness>=90?C.green:C.gold],
            ['Confidence',   record._confidence+'%',   record._confidence>=90?C.green:C.gold],
            ['Sources',      String(Object.keys(grouped).length), null],
            ['Related',      String(totalRelated), null],
            ['Conflicts',    String(provenance.filter(p=>p.conflict).length), provenance.filter(p=>p.conflict).length?C.gold:null],
          ].map(([lbl,val,col2]) => (
            <div key={lbl} style={{ padding:'10px 14px', background:'#fff', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:10.5, color:C.ink4, letterSpacing:0.5, textTransform:'uppercase', marginBottom:3 }}>{lbl}</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:600, color: col2||C.ink }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.line}` }}>
          {tabs.map(t => {
            const n2 = t==='Overview'?props.length : t==='Graph'?totalRelated : t==='Provenance'?provenance.filter(x=>x.conflict).length||null : activity.length
            const isOn = tab === t
            return (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'10px 18px', border:'none', borderBottom: isOn?`2px solid ${C.ink}`:'2px solid transparent', background:'transparent', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13.5, fontWeight:isOn?600:400, color:isOn?C.ink:C.ink3, display:'flex', alignItems:'center', gap:6, transition:'color .12s' }}>
                {t}
                {n2!=null && <span style={{ fontFamily:'var(--mono)', fontSize:10, padding:'1px 6px', borderRadius:10, background:isOn?C.ink:C.canvas, color:isOn?'#fff':C.ink3 }}>{n2}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 26px 26px' }}>

        {/* ─ Overview ─ */}
        {tab === 'Overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) minmax(280px,1fr)', gap:18 }}>
            {/* Left — property values */}
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={CARD}>
                <div style={CARD_HEAD}>
                  <span>Property values <span style={{ fontWeight:400, color:C.ink3, fontSize:12.5 }}>{props.length} fields · {record._source} system of record</span></span>
                  <div style={{ display:'flex', gap:6 }}>
                    <GhostBtn style={{ height:28, fontSize:11.5 }}>Show nulls</GhostBtn>
                    <GhostBtn style={{ height:28, fontSize:11.5 }}>Export JSON</GhostBtn>
                  </div>
                </div>
                <div>
                  {provenance.map((pv,i) => {
                    const p = pv.prop
                    return (
                      <div key={p.name} style={{ display:'grid', gridTemplateColumns:'180px 1fr auto auto', alignItems:'center', gap:14, padding:'11px 18px', borderBottom: i<provenance.length-1 ? `1px solid ${C.line2}` : 'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
                          {p.pk && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'1px 4px', borderRadius:3, background:C.ink, color:'#fff', fontWeight:700 }}>PK</span>}
                          <code style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink, fontWeight:p.pk?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</code>
                        </div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:12.5, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(pv.value)}</div>
                        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.ink3 }}>{p.type}</span>
                        <div style={{ display:'flex', gap:3 }}>
                          {p.pii      && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.coralFill,  color:C.coral,  fontWeight:700 }}>PII</span>}
                          {p.required && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.canvas,      color:C.ink3,   fontWeight:700 }}>REQ</span>}
                          {p.computed && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.purpleFill,  color:C.purple, fontWeight:700 }}>FX</span>}
                          {pv.conflict && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:C.goldFill, color:C.gold, fontWeight:700 }}>⚠</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right — connections + sources */}
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={CARD}>
                <div style={CARD_HEAD}>
                  <span>Connections <span style={{ fontWeight:400, color:C.ink3, fontSize:12.5 }}>{totalRelated} across {related.length} edge types</span></span>
                  <GhostBtn style={{ height:28, fontSize:11.5 }} onClick={() => setTab('Graph')}>See in graph →</GhostBtn>
                </div>
                <div style={{ maxHeight:520, overflowY:'auto' }}>
                  {related.map((r,i) => (
                    <div key={i} style={{ padding:'10px 16px', borderBottom: i<related.length-1 ? `1px solid ${C.line2}` : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.ink3 }}>{r.isOut?'→':'←'}</span>
                        <code style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink2, fontWeight:600 }}>:{r.edge.label}</code>
                        <NodeGlyph n={r.otherNode} size={12} />
                        <span style={{ fontSize:11.5, color:C.ink2, fontFamily:'var(--sans)' }}>{r.otherNode.label}</span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'1px 5px', borderRadius:3, background: r.edge.kind==='inferred'?C.goldFill : r.edge.kind==='agent'?C.purpleFill : C.canvas, color: r.edge.kind==='inferred'?C.gold : r.edge.kind==='agent'?C.purple : C.ink3, textTransform:'uppercase', letterSpacing:'0.4px', fontWeight:700 }}>{r.edge.kind}</span>
                        <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:C.ink4 }}>{r.count}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        {r.related.map((rr,j) => (
                          <div key={j}
                            onClick={() => navigateTo(rr.id, rr.nodeId)}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 6px', cursor:'pointer', borderRadius:5, transition:'background 80ms' }}
                            onMouseEnter={e => e.currentTarget.style.background=C.canvas}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <code style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.blue, flexShrink:0 }}>{rr.id}</code>
                            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{rr.keyValue}</span>
                            <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:9.5, color:C.ink4, flexShrink:0 }}>{rr.since}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={CARD}>
                <div style={CARD_HEAD}>Source contributions</div>
                <div>
                  {Object.keys(grouped).map((src,i,arr) => {
                    const fields = grouped[src]
                    const pct    = Math.round(fields.length / provenance.length * 100)
                    const avgConf= (fields.reduce((s,f)=>s+f.conf,0)/fields.length).toFixed(2)
                    return (
                      <div key={src} style={{ padding:'12px 18px', borderBottom: i<arr.length-1?`1px solid ${C.line2}`:'none' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink2, fontWeight:600 }}>{src}</span>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink4 }}>{fields.length} fields · conf {avgConf}</span>
                        </div>
                        <div style={{ height:4, background:C.canvas, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:pct+'%', background: src==='computed'?C.purple:C.blue, borderRadius:3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─ Graph ─ */}
        {tab === 'Graph' && (
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(320px,0.7fr)', gap:18, height:'calc(100vh - 370px)', minHeight:520 }}>
            <div style={{ ...CARD, padding:0, display:'flex', flexDirection:'column' }}>
              <div style={CARD_HEAD}>
                <span>Relationship graph</span>
                <button onClick={() => setTwoHop(v=>!v)}
                  style={{ background:'none', border:`1px solid ${C.line}`, borderRadius:7, padding:'4px 12px', cursor:'pointer', fontFamily:'var(--sans)', fontSize:12, color:C.ink2 }}>
                  {twoHop ? 'Collapse to 1-hop' : 'Expand 2-hop'}
                </button>
              </div>
              <div
                onMouseDown={e => { if (e.target.tagName==='circle') return; graphDrag.current={startX:e.clientX,startY:e.clientY,origX:graphPan.x,origY:graphPan.y,moved:false}; e.currentTarget.style.cursor='grabbing' }}
                onMouseMove={e => { const d=graphDrag.current; if(!d)return; const dx=e.clientX-d.startX, dy=e.clientY-d.startY; if(!d.moved&&Math.hypot(dx,dy)>3)d.moved=true; if(d.moved)setGraphPan({x:d.origX+dx,y:d.origY+dy}) }}
                onMouseUp={e => { graphDrag.current=null; e.currentTarget.style.cursor='grab' }}
                onMouseLeave={e => { graphDrag.current=null; e.currentTarget.style.cursor='grab' }}
                onDoubleClick={() => setGraphPan({x:0,y:0})}
                style={{ flex:1, background:C.canvas, overflow:'hidden', cursor:'grab', position:'relative', userSelect:'none' }}>
                {(() => {
                  const W=1100, H=760, cx=W/2, cy=H/2, r1=280, r2=540
                  const flat = []
                  related.forEach((r,ri) => r.related.forEach(rr => flat.push({ rr, parentIdx:ri, isOut:r.isOut })))
                  const nFlat = flat.length || 1
                  flat.forEach((f,i) => { const a=(i/nFlat)*Math.PI*2-Math.PI/2; f.x=cx+Math.cos(a)*r1; f.y=cy+Math.sin(a)*r1; f.angle=a })
                  const hops = []
                  if (twoHop) {
                    flat.forEach((f,i) => {
                      const parentNodeObj = NODES.find(n => n.id === f.rr.nodeId)
                      if (!parentNodeObj) return
                      const pSeed = f.rr.id.length*31 + i*13
                      const kids = buildSecondHop(parentNodeObj, pSeed)
                      kids.forEach((kid,ki) => {
                        const offset = kids.length>1 ? ((ki-(kids.length-1)/2)/(kids.length-1))*(Math.PI/7) : 0
                        const ang = f.angle + offset
                        hops.push({ rr:kid, parent:f, x:cx+Math.cos(ang)*r2, y:cy+Math.sin(ang)*r2 })
                      })
                    })
                  }
                  return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
                      <defs>
                        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={C.ink3}/></marker>
                        <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={C.ink4}/></marker>
                      </defs>
                      <g transform={`translate(${graphPan.x},${graphPan.y})`}>
                        {hops.map((h,i) => {
                          const [px,py]=[h.parent.x,h.parent.y], dx=h.x-px, dy=h.y-py, len=Math.sqrt(dx*dx+dy*dy), ux=dx/len, uy=dy/len
                          return <g key={'he'+i}><line x1={px+ux*28} y1={py+uy*28} x2={h.x-ux*28} y2={h.y-uy*28} stroke={C.ink4} strokeWidth="0.9" opacity="0.45" markerEnd="url(#arr2)"/><g transform={`translate(${(px+h.x)/2} ${(py+h.y)/2})`}><rect x="-32" y="-7" width="64" height="13" rx="2.5" fill="#fff" stroke={C.line}/><text textAnchor="middle" y="2.5" style={{ fontFamily:'var(--mono)', fontSize:'8px', fill:C.ink3 }}>{':'+h.rr.edgeLabel}</text></g></g>
                        })}
                        {flat.map((f,i) => {
                          const dx=f.x-cx, dy=f.y-cy, len=Math.sqrt(dx*dx+dy*dy), ux=dx/len, uy=dy/len
                          return <g key={'e'+i}><line x1={cx+ux*40} y1={cy+uy*40} x2={f.x-ux*28} y2={f.y-uy*28} stroke={C.ink3} strokeWidth="1.3" opacity="0.6" strokeDasharray={f.rr.kind==='inferred'?'4,3':'none'} markerEnd="url(#arr)"/><g transform={`translate(${(cx+f.x)/2} ${(cy+f.y)/2})`}><rect x="-44" y="-9" width="88" height="18" rx="3" fill="#fff" stroke={C.line}/><text textAnchor="middle" y="3.5" style={{ fontFamily:'var(--mono)', fontSize:'9.5px', fill:C.ink2 }}>{':'+f.rr.edgeLabel}</text></g></g>
                        })}
                        {hops.map((h,i) => {
                          const nodeObj = NODES.find(n=>n.id===h.rr.nodeId)
                          const hc = colorForNode(nodeObj)
                          const isH = hoverNode===h.rr.id, isI = inspected?.id===h.rr.id
                          return <g key={'hn'+i} opacity={isH||isI?1:0.92} style={{ cursor:'pointer' }} onClick={()=>{ if(graphDrag.current?.moved)return; setInspected(h.rr) }} onMouseEnter={()=>setHoverNode(h.rr.id)} onMouseLeave={()=>setHoverNode(null)}><circle cx={h.x} cy={h.y} r={isI?30:isH?28:26} fill={hc.fill} stroke={isI||isH?C.ink:hc.stroke} strokeWidth={isI?3:isH?2.6:1.8}/><text x={h.x} y={h.y-34} textAnchor="middle" style={{ fontFamily:'var(--mono)', fontSize:'11.5px', fontWeight:600, fill:isH||isI?C.ink:C.ink2, pointerEvents:'none' }}>{h.rr.id}</text><text x={h.x} y={h.y+42} textAnchor="middle" style={{ fontFamily:'var(--mono)', fontSize:'10.5px', fill:C.ink3, pointerEvents:'none' }}>{String(h.rr.keyValue).slice(0,18)}</text></g>
                        })}
                        <g style={{ cursor:'pointer' }} onClick={()=>{ if(graphDrag.current?.moved)return; setInspected(null) }}>
                          <circle cx={cx} cy={cy} r="38" fill={col.fill} stroke={inspected===null?C.ink:col.stroke} strokeWidth={inspected===null?3.6:2.8}/>
                          <text x={cx} y={cy-50} textAnchor="middle" style={{ fontFamily:'var(--mono)', fontSize:'12px', fontWeight:600, fill:C.ink, pointerEvents:'none' }}>{record.id}</text>
                          <text x={cx} y={cy+60} textAnchor="middle" style={{ fontFamily:'var(--mono)', fontSize:'11px', fill:C.ink3, pointerEvents:'none' }}>{record[Object.keys(record).find(k=>k==='name'||k==='company_name'||k==='title')] || node.label}</text>
                        </g>
                        {flat.map((f,i) => {
                          const otherCol = colorForNode(NODES.find(n=>n.id===f.rr.nodeId))
                          const isH = hoverNode===f.rr.id, isI = inspected?.id===f.rr.id
                          return <g key={'n'+i} style={{ cursor:'pointer' }} onClick={()=>{ if(graphDrag.current?.moved)return; setInspected(f.rr) }} onMouseEnter={()=>setHoverNode(f.rr.id)} onMouseLeave={()=>setHoverNode(null)}><circle cx={f.x} cy={f.y} r={isI?30:isH?28:26} fill={otherCol.fill} stroke={isI||isH?C.ink:otherCol.stroke} strokeWidth={isI?3:isH?2.6:1.8}/><text x={f.x} y={f.y-34} textAnchor="middle" style={{ fontFamily:'var(--mono)', fontSize:'11.5px', fontWeight:600, fill:C.ink, pointerEvents:'none' }}>{f.rr.id}</text><text x={f.x} y={f.y+42} textAnchor="middle" style={{ fontFamily:'var(--mono)', fontSize:'10.5px', fill:C.ink3, pointerEvents:'none' }}>{f.rr.keyName+': '+String(f.rr.keyValue).slice(0,20)}</text></g>
                        })}
                      </g>
                    </svg>
                  )
                })()}
              </div>
            </div>

            {/* Right — inspector */}
            <div style={{ ...CARD, display:'flex', flexDirection:'column', overflowY:'auto' }}>
              <div style={CARD_HEAD}>{inspected ? inspected.label+' '+inspected.id : 'Current record'}</div>
              {inspected ? (
                <div style={{ flex:1, overflowY:'auto' }}>
                  {(() => {
                    const iNode = NODES.find(n=>n.id===inspected.nodeId)
                    const iRec  = buildRecordFromId(inspected.id, iNode)
                    const iProps = generateProps(iNode)
                    return iProps.slice(0,8).map((p,i) => (
                      <div key={p.name} style={{ display:'grid', gridTemplateColumns:'140px 1fr', alignItems:'center', gap:10, padding:'10px 16px', borderBottom: i<7?`1px solid ${C.line2}`:'none' }}>
                        <code style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</code>
                        <div style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(iRec[p.name]??generateValueForProp(p,iRec.id?.length??42))}</div>
                      </div>
                    ))
                  })()}
                  <div style={{ padding:'12px 16px' }}>
                    <button onClick={() => navigateTo(inspected.id, inspected.nodeId)}
                      style={{ width:'100%', background:C.canvas, border:`1px solid ${C.line}`, borderRadius:8, padding:'8px 12px', cursor:'pointer', fontFamily:'var(--sans)', fontSize:12.5, color:C.ink2 }}
                      onMouseOver={e=>e.currentTarget.style.background=C.line2}
                      onMouseOut={e=>e.currentTarget.style.background=C.canvas}>
                      Open full record →
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
                  {[['Status', record.status], ['Completeness', record._completeness+'%'], ['Confidence', record._confidence+'%'], ['Source', record._source], ['Created', record._createdAgo], ['Updated', record._updatedAgo]].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${C.line2}` }}>
                      <span style={{ fontFamily:'var(--sans)', fontSize:12.5, color:C.ink3 }}>{k}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink2 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontFamily:'var(--sans)', fontSize:12, color:C.ink3, marginBottom:8 }}>Click any node to inspect it</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─ Provenance ─ */}
        {tab === 'Provenance' && (
          <div style={CARD}>
            <div style={CARD_HEAD}>
              <span>Field provenance <span style={{ fontWeight:400, color:C.ink3, fontSize:12.5 }}>{props.length} fields traced</span></span>
            </div>
            <div>
              {provenance.map((pv,i) => (
                <div key={pv.prop.name} style={{ display:'grid', gridTemplateColumns:'180px 1fr 120px 90px 80px', alignItems:'center', gap:14, padding:'12px 18px', borderBottom: i<provenance.length-1?`1px solid ${C.line2}`:'none' }}>
                  <code style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:pv.prop.pk?600:400 }}>
                    {pv.prop.pk && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 4px', borderRadius:3, background:C.ink, color:'#fff', fontWeight:700, marginRight:5 }}>PK</span>}
                    {pv.prop.name}
                  </code>
                  <div style={{ fontFamily:'var(--mono)', fontSize:12, color: pv.conflict ? C.gold : C.ink2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {String(pv.value)}
                    {pv.conflict && <span style={{ marginLeft:8, fontFamily:'var(--mono)', fontSize:9, padding:'1px 5px', borderRadius:3, background:C.goldFill, color:C.gold }}>conflict</span>}
                  </div>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pv.source}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink3 }}>{pv.age} ago</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color: pv.conf>=0.9?C.green:pv.conf>=0.75?C.gold:C.coral }}>{(pv.conf*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ Activity ─ */}
        {tab === 'Activity' && (
          <div style={CARD}>
            <div style={CARD_HEAD}>Activity log <span style={{ fontWeight:400, color:C.ink3, fontSize:12.5 }}>{activity.length} events</span></div>
            <div>
              {activity.map((a,i) => {
                const kindCol = { sync:C.blue, agent:C.purple, merge:C.gold, manual:C.ink3, validate:C.green, create:C.green }[a.kind] || C.ink3
                const kindFill = { sync:C.blueFill, agent:C.purpleFill, merge:C.goldFill, manual:C.canvas, validate:C.greenFill, create:C.greenFill }[a.kind] || C.canvas
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'90px 1fr 100px', alignItems:'start', gap:14, padding:'13px 18px', borderBottom: i<activity.length-1?`1px solid ${C.line2}`:'none' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.ink4, paddingTop:2 }}>{a.when}</span>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.ink2, fontWeight:600 }}>{a.who}</span>
                        <span style={{ fontFamily:'var(--sans)', fontSize:12, color:C.ink3 }}>{a.action}</span>
                      </div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.ink3 }}>{a.what}</div>
                    </div>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, padding:'2px 8px', borderRadius:4, background:kindFill, color:kindCol, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', justifySelf:'end', marginTop:2 }}>{a.kind}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
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
