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

  const thStyle = { textAlign:'left', padding:'10px 18px', fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', color:'#9a948a', borderBottom:'1px solid #eaecea', whiteSpace:'nowrap' }
  const cell    = (last) => ({ padding:'16px 18px', verticalAlign:'middle', overflow:'hidden', borderBottom: last ? 'none' : '1px solid #f1f2f1' })

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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft:4, transition:'transform 120ms', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
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
                  onClick={() => onOpenRecord(r, selectedNodeObj)}
                  style={{ background:'#fff', cursor:'pointer', transition:'background .12s, box-shadow .12s' }}
                  onMouseOver={e => { e.currentTarget.style.background='#f7f6f3'; e.currentTarget.style.boxShadow='inset 3px 0 0 #16341f' }}
                  onMouseOut={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.boxShadow='none' }}>
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
  const props   = generateProps(node)
  const related = generateRelatedRecords(record, node)
  const totalRelated = related.reduce((s,r) => s + r.count, 0)

  const provenance = props.map((p,i) => {
    const s = node.id.charCodeAt(0)*7 + i*17 + record.id.length*3
    return { prop: p, value: record[p.name] ?? generateValueForProp(p,s) }
  })

  function navigateTo(recId, nodeId) {
    if (!onNavigate) return
    const targetNode = NODES.find(n => n.id === nodeId)
    if (!targetNode) return
    onNavigate(buildRecordFromId(recId, targetNode), targetNode)
  }

  const CARD     = { background:'#fff', border:'1px solid #ececea', borderRadius:12, overflow:'hidden' }
  const CARD_HEAD = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid #eaecea', fontFamily:'var(--sans)', fontSize:13, fontWeight:600, color:'#1a1a1a', background:'#F7F5F3', letterSpacing:0.1 }

  return (
    <div style={{ flex:1, overflowY:'auto', backgroundColor:'#fcfbf7', padding:'12px 26px 40px' }} className="dark-scroll">
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:20 }}>
        <button onClick={onBack}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#9097a0', padding:'0 12px 0 0', fontFamily:'var(--sans)', fontSize:13 }}
          onMouseOver={e=>e.currentTarget.style.color='#1a1a1a'}
          onMouseOut={e=>e.currentTarget.style.color='#9097a0'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Back
        </button>
        <div style={{ flex:1, display:'flex', alignItems:'baseline', gap:10 }}>
          <span style={{ fontFamily:'var(--serif)', fontSize:23, fontWeight:500, color:'#1a1a1a', letterSpacing:-0.2 }}>{record.id}</span>
          <StatusPill status={record.status} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ background:'#fff', border:'1px solid #d0d5d0', borderRadius:8, padding:'7px 14px', fontSize:13, color:'#374151', cursor:'pointer', fontFamily:'var(--sans)', boxShadow:'0 1px 2px rgba(0,0,0,0.06)' }}
            onMouseOver={e=>e.currentTarget.style.background='#f7f6f3'}
            onMouseOut={e=>e.currentTarget.style.background='#fff'}>Copy ID</button>
          <DarkBtn>Edit record</DarkBtn>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) minmax(280px,1fr)', gap:18, alignItems:'start' }}>

        {/* Left — property values */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <span>Properties <span style={{ fontWeight:400, color:'#9a948a', fontSize:12 }}>{props.length} fields</span></span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {provenance.map((pv,i) => {
                const p = pv.prop
                const last = i === provenance.length - 1
                return (
                  <tr key={p.name} style={{ borderBottom: last ? 'none' : '1px solid #f1f2f1' }}>
                    <td style={{ padding:'11px 18px', width:180, verticalAlign:'middle' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        {p.pk && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 4px', borderRadius:3, background:'#1a1a1a', color:'#fff', fontWeight:700 }}>PK</span>}
                        <code style={{ fontFamily:'var(--mono)', fontSize:12, color:'#374151', fontWeight:p.pk?600:400 }}>{p.name}</code>
                      </div>
                    </td>
                    <td style={{ padding:'11px 18px', verticalAlign:'middle' }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:13, color:'#1a1a1a' }}>{String(pv.value)}</span>
                    </td>
                    <td style={{ padding:'11px 18px', verticalAlign:'middle', textAlign:'right', whiteSpace:'nowrap' }}>
                      <div style={{ display:'inline-flex', gap:4, alignItems:'center' }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'#b8bcb8' }}>{p.type}</span>
                        {p.pii      && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:'#fbe6e6', color:'#c84040', fontWeight:700 }}>PII</span>}
                        {p.computed && <span style={{ fontFamily:'var(--mono)', fontSize:8.5, padding:'1px 5px', borderRadius:3, background:'#ede9fc', color:'#7c3aed', fontWeight:700 }}>FX</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Right — connections */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <span>Connections <span style={{ fontWeight:400, color:'#9a948a', fontSize:12 }}>{totalRelated} across {related.length} edge types</span></span>
          </div>
          <div>
            {related.map((r,i) => (
              <div key={i} style={{ padding:'12px 16px', borderBottom: i<related.length-1 ? '1px solid #f1f2f1' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                  <code style={{ fontFamily:'var(--mono)', fontSize:11, color:'#374151', fontWeight:600 }}>:{r.edge.label}</code>
                  <NodeGlyph n={r.otherNode} size={11} />
                  <span style={{ fontFamily:'var(--sans)', fontSize:12, color:'#374151' }}>{r.otherNode.label}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'1px 5px', borderRadius:3, background: r.edge.kind==='inferred'?'#f9f0de' : r.edge.kind==='agent'?'#ede9fc' : '#f1f3f1', color: r.edge.kind==='inferred'?'#b07a20' : r.edge.kind==='agent'?'#7c3aed' : '#9097a0', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>{r.edge.kind}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  {r.related.map((rr,j) => (
                    <div key={j} onClick={() => navigateTo(rr.id, rr.nodeId)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 6px', cursor:'pointer', borderRadius:6, transition:'background .1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f7f6f3'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <code style={{ fontFamily:'var(--mono)', fontSize:11, color:'#1a1a1a', fontWeight:600, flexShrink:0 }}>{rr.id}</code>
                      <span style={{ fontFamily:'var(--sans)', fontSize:12, color:'#9097a0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{rr.keyValue}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'#b8bcb8', flexShrink:0 }}>{rr.since}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
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
