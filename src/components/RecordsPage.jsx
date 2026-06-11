import { useState, useRef, useEffect } from 'react'
import { NodeShape, ListGlyph, ZoomControls, Minimap, colorForNode as canvasColorForNode } from './GraphStage'

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
  { id:'churn_risk',   label:'Churn Risk',         type:'entity', state:'risk',     x:520,  y:-120, size:24, instances:'2K',   instancesN:2027,   props:9,  edges:3,  fill:88, conf:93, fresh:'20m',  pii:0, change:'HIGH',   desc:'Model-flagged churn exposure on an account' },
  { id:'case',         label:'Case',               type:'entity', state:'incident', x:-200, y:430,  size:24, instances:'61K',  instancesN:61049,  props:9,  edges:3,  fill:91, conf:95, fresh:'12m',  pii:1, change:'MEDIUM', desc:'Escalated support case from the support portal' },
  { id:'competitor',   label:'Competitor',         type:'entity', state:'core',     x:560,  y:160,  size:24, instances:'320',  instancesN:320,    props:8,  edges:2,  fill:84, conf:90, fresh:'1h',   pii:0, change:'LOW',    desc:'Competitor detected in deals and conversations' },
  { id:'product',      label:'Product',            type:'entity', state:'core',     x:200,  y:520,  size:24, instances:'24',   instancesN:24,     props:9,  edges:3,  fill:99, conf:99, fresh:'1d',   pii:0, change:'LOW',    desc:'Licensed product from the order form' },
  { id:'opportunity',  label:'Opportunity',        type:'entity', state:'core',     x:-520, y:240,  size:26, instances:'19K',  instancesN:19405,  props:10, edges:4,  fill:95, conf:97, fresh:'25m',  pii:0, change:'HIGH',   desc:'Open pipeline on the account' },
  { id:'health_score', label:'Health Score',       type:'entity', state:'signal',   x:-420, y:-260, size:24, instances:'2.8K', instancesN:2840,   props:8,  edges:3,  fill:97, conf:98, fresh:'15m',  pii:0, change:'MEDIUM', desc:'Composite account health derived by the Customer Health agent' },
  { id:'usage_event',  label:'Usage Event',        type:'entity', state:'signal',   x:380,  y:420,  size:24, instances:'48M',  instancesN:48000000, props:10, edges:4, fill:96, conf:97, fresh:'4m',  pii:0, change:'HIGH',   desc:'Raw product telemetry attributed to an account' },
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
  { s:'ticket',      t:'case',         label:'ESCALATES_TO',      kind:'direct'   },
  { s:'account',     t:'opportunity',  label:'HAS_OPPORTUNITY',   kind:'direct'   },
  { s:'account',     t:'competitor',   label:'COMPETES_WITH',     kind:'inferred' },
  { s:'subscription',t:'product',      label:'FOR_PRODUCT',       kind:'direct'   },
  { s:'churn_risk',  t:'account',      label:'FLAGS',             kind:'inferred' },
  { s:'account',     t:'health_score', label:'HAS_HEALTH',        kind:'direct'   },
  { s:'usage_event', t:'account',      label:'FROM_ACCOUNT',      kind:'inferred' },
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
    { name:'employee_count',       type:'int',       required:false, indexed:false, pii:false, fill:81,  conf:90,  source:'Apollo' },
    { name:'headquarters',         type:'string',    required:false, indexed:false, pii:false, fill:86,  conf:92,  source:'Apollo' },
    { name:'segment',              type:'enum',      required:false, indexed:true,  pii:false, fill:97,  conf:99,  source:'—', computed:'rule:segmentation' },
    { name:'csm_id',               type:'uuid',      required:false, indexed:true,  pii:false, fill:95,  conf:98,  source:'Salesforce' },
    { name:'renewal_date',         type:'date',      required:false, indexed:true,  pii:false, fill:93,  conf:97,  source:'NetSuite ERP' },
    { name:'contract_value_usd',   type:'decimal',   required:false, indexed:false, pii:false, fill:91,  conf:96,  source:'NetSuite ERP' },
    { name:'health_score',         type:'float',     required:false, indexed:true,  pii:false, fill:100, conf:100, source:'—', computed:'agent: cust_health' },
    { name:'nps',                  type:'int',       required:false, indexed:false, pii:false, fill:64,  conf:88,  source:'support_portal' },
    { name:'last_activity_at',     type:'timestamp', required:false, indexed:true,  pii:false, fill:99,  conf:99,  source:'—' },
    { name:'sfdc_url',             type:'string',    required:false, indexed:false, pii:false, fill:100, conf:100, source:'Salesforce' },
    { name:'created_at',           type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Salesforce' },
  ],
  subscription: [
    { name:'subscription_id', type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'plan_tier',       type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'NetSuite ERP' },
    { name:'seats',           type:'int',       required:true,  indexed:false, pii:false, fill:99,  conf:98,  source:'NetSuite ERP' },
    { name:'mrr_usd',         type:'decimal',   required:true,  indexed:true,  pii:false, fill:99,  conf:99,  source:'NetSuite ERP' },
    { name:'currency',        type:'enum',      required:true,  indexed:false, pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'start_date',      type:'date',      required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'renewal_date',    type:'date',      required:false, indexed:true,  pii:false, fill:96,  conf:97,  source:'NetSuite ERP' },
    { name:'status',          type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'NetSuite ERP' },
    { name:'auto_renew',      type:'bool',      required:false, indexed:false, pii:false, fill:94,  conf:98,  source:'—', computed:'agent: doc extraction' },
    { name:'discount_pct',    type:'float',     required:false, indexed:false, pii:false, fill:71,  conf:95,  source:'NetSuite ERP' },
  ],
  invoice: [
    { name:'invoice_id',      type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'amount_due_usd',  type:'decimal',   required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'currency',        type:'enum',      required:true,  indexed:false, pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'issued_at',       type:'date',      required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'due_date',        type:'date',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'NetSuite ERP' },
    { name:'status',          type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'NetSuite ERP' },
    { name:'po_number',       type:'string',    required:false, indexed:true,  pii:false, fill:88,  conf:96,  source:'—', computed:'agent: doc extraction' },
    { name:'payment_terms',   type:'enum',      required:false, indexed:false, pii:false, fill:92,  conf:97,  source:'—', computed:'agent: doc extraction' },
    { name:'balance_usd',     type:'decimal',   required:false, indexed:false, pii:false, fill:97,  conf:99,  source:'—', computed:'rule: amount_due - payments' },
  ],
  agreement: [
    { name:'agreement_id',    type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'DocuSign' },
    { name:'title',           type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'DocuSign' },
    { name:'effective_date',  type:'date',      required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'DocuSign' },
    { name:'end_date',        type:'date',      required:false, indexed:true,  pii:false, fill:95,  conf:98,  source:'DocuSign' },
    { name:'status',          type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'DocuSign' },
    { name:'contract_value_usd', type:'decimal', required:false, indexed:true, pii:false, fill:93,  conf:97,  source:'NetSuite ERP' },
    { name:'signed_by',       type:'string',    required:false, indexed:false, pii:true,  fill:98,  conf:99,  source:'DocuSign' },
  ],
  ticket: [
    { name:'ticket_id',       type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'Support Portal' },
    { name:'subject',         type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:98,  source:'Support Portal' },
    { name:'severity',        type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Support Portal' },
    { name:'status',          type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Support Portal' },
    { name:'opened_at',       type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Support Portal' },
    { name:'sla_due',         type:'timestamp', required:false, indexed:true,  pii:false, fill:97,  conf:98,  source:'—', computed:'rule: opened_at + sla_matrix(severity)' },
    { name:'assignee_id',     type:'uuid',      required:false, indexed:true,  pii:false, fill:94,  conf:97,  source:'Support Portal' },
  ],
  person: [
    { name:'person_id',       type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'Salesforce' },
    { name:'name',            type:'string',    required:true,  indexed:true,  pii:true,  fill:100, conf:99,  source:'Salesforce' },
    { name:'email',           type:'string',    required:true,  indexed:true,  pii:true,  fill:97,  conf:98,  source:'Salesforce' },
    { name:'job_title',       type:'string',    required:false, indexed:false, pii:false, fill:88,  conf:93,  source:'Apollo' },
    { name:'phone',           type:'string',    required:false, indexed:false, pii:true,  fill:71,  conf:95,  source:'Apollo' },
    { name:'linkedin_url',    type:'string',    required:false, indexed:false, pii:true,  fill:64,  conf:92,  source:'Apollo' },
    { name:'status',          type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Salesforce' },
    { name:'last_contacted_at', type:'timestamp', required:false, indexed:true, pii:false, fill:91, conf:96,  source:'—', computed:'rule: max(interaction.occurred_at)' },
  ],
  interaction: [
    { name:'interaction_id',  type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'Gmail' },
    { name:'interaction_type',type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Gmail' },
    { name:'occurred_at',     type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Gmail' },
    { name:'duration_min',    type:'int',       required:false, indexed:false, pii:false, fill:82,  conf:96,  source:'Google Calendar' },
    { name:'sentiment',       type:'enum',      required:false, indexed:false, pii:false, fill:95,  conf:91,  source:'—', computed:'agent: conversation analysis' },
    { name:'summary',         type:'string',    required:false, indexed:false, pii:false, fill:93,  conf:90,  source:'—', computed:'agent: conversation analysis' },
  ],
  churn_risk: [
    { name:'churn_risk_id',   type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'—', computed:'agent: cust_health' },
    { name:'risk_score',      type:'float',     required:true,  indexed:true,  pii:false, fill:100, conf:96,  source:'—', computed:'agent: churn model v4.2' },
    { name:'risk_band',       type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:96,  source:'—', computed:'rule: score_bands(risk_score)' },
    { name:'top_drivers',     type:'string',    required:false, indexed:false, pii:false, fill:97,  conf:92,  source:'—', computed:'agent: churn model v4.2' },
    { name:'usage_trend_30d', type:'string',    required:false, indexed:false, pii:false, fill:99,  conf:97,  source:'—', computed:'rule: delta(usage_events, 30d)' },
    { name:'support_escalations_90d', type:'int', required:false, indexed:false, pii:false, fill:100, conf:99, source:'—', computed:'rule: count(tickets.sev1_2, 90d)' },
    { name:'recommended_action', type:'string', required:false, indexed:false, pii:false, fill:94,  conf:90,  source:'—', computed:'agent: churn model v4.2' },
    { name:'flagged_at',      type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'—', computed:'agent: churn model v4.2' },
  ],
  health_score: [
    { name:'health_score_id', type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'—', computed:'agent: cust_health' },
    { name:'score',           type:'int',       required:true,  indexed:true,  pii:false, fill:100, conf:97,  source:'—', computed:'agent: cust_health' },
    { name:'trend',           type:'enum',      required:true,  indexed:false, pii:false, fill:100, conf:96,  source:'—', computed:'rule: delta(score, 90d)' },
    { name:'usage_subscore',  type:'int',       required:false, indexed:false, pii:false, fill:100, conf:98,  source:'—', computed:'rule: usage_events weighted' },
    { name:'support_subscore',type:'int',       required:false, indexed:false, pii:false, fill:100, conf:98,  source:'—', computed:'rule: ticket volume + csat' },
    { name:'engagement_subscore', type:'int',   required:false, indexed:false, pii:false, fill:100, conf:97,  source:'—', computed:'rule: interactions + nps' },
    { name:'last_computed',   type:'timestamp', required:true,  indexed:false, pii:false, fill:100, conf:100, source:'—', computed:'agent: cust_health' },
  ],
  usage_event: [
    { name:'usage_event_id',  type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'Product Usage DB' },
    { name:'event_type',      type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Product Usage DB' },
    { name:'feature_name',    type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Product Usage DB' },
    { name:'occurred_at',     type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Product Usage DB' },
    { name:'actor_email',     type:'string',    required:false, indexed:true,  pii:true,  fill:98,  conf:99,  source:'Product Usage DB' },
    { name:'platform',        type:'enum',      required:false, indexed:false, pii:false, fill:100, conf:100, source:'Product Usage DB' },
    { name:'event_count_24h', type:'int',       required:false, indexed:false, pii:false, fill:100, conf:99,  source:'—', computed:'rule: rollup(events, 24h)' },
  ],
  case: [
    { name:'case_id',         type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'Support Portal' },
    { name:'subject',         type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:98,  source:'Support Portal' },
    { name:'severity',        type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Support Portal' },
    { name:'status',          type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Support Portal' },
    { name:'opened_at',       type:'timestamp', required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Support Portal' },
    { name:'csat_score',      type:'string',    required:false, indexed:false, pii:false, fill:74,  conf:97,  source:'Support Portal' },
    { name:'root_cause',      type:'string',    required:false, indexed:false, pii:false, fill:90,  conf:89,  source:'—', computed:'agent: case triage' },
    { name:'summary',         type:'string',    required:false, indexed:false, pii:false, fill:95,  conf:90,  source:'—', computed:'agent: case triage' },
  ],
  competitor: [
    { name:'competitor_id',   type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'—', computed:'agent: conversation analysis' },
    { name:'name',            type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:95,  source:'—', computed:'agent: conversation analysis' },
    { name:'threat_level',    type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:91,  source:'—', computed:'agent: conversation analysis' },
    { name:'displacing_product', type:'string', required:false, indexed:false, pii:false, fill:88,  conf:88,  source:'—', computed:'agent: conversation analysis' },
    { name:'mentions_90d',    type:'int',       required:false, indexed:false, pii:false, fill:100, conf:99,  source:'—', computed:'rule: count(interactions.mentions)' },
    { name:'last_mentioned_at', type:'timestamp', required:false, indexed:true, pii:false, fill:100, conf:99, source:'—', computed:'rule: max(interactions.occurred_at)' },
  ],
  product: [
    { name:'product_id',      type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'name',            type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'sku',             type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'NetSuite ERP' },
    { name:'edition',         type:'enum',      required:true,  indexed:false, pii:false, fill:100, conf:99,  source:'NetSuite ERP' },
    { name:'seats_licensed',  type:'int',       required:true,  indexed:false, pii:false, fill:100, conf:99,  source:'—', computed:'agent: doc extraction' },
    { name:'modules',         type:'string[]',  required:false, indexed:false, pii:false, fill:96,  conf:95,  source:'—', computed:'agent: doc extraction' },
    { name:'unit_price_usd',  type:'decimal',   required:false, indexed:false, pii:false, fill:99,  conf:99,  source:'NetSuite ERP' },
  ],
  opportunity: [
    { name:'opportunity_id',  type:'uuid',      required:true,  indexed:true,  pii:false, pk:true, fill:100, conf:100, source:'Salesforce' },
    { name:'name',            type:'string',    required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Salesforce' },
    { name:'stage',           type:'enum',      required:true,  indexed:true,  pii:false, fill:100, conf:99,  source:'Salesforce' },
    { name:'amount_usd',      type:'decimal',   required:true,  indexed:true,  pii:false, fill:98,  conf:98,  source:'Salesforce' },
    { name:'probability',     type:'float',     required:false, indexed:false, pii:false, fill:97,  conf:96,  source:'Salesforce' },
    { name:'close_date',      type:'date',      required:true,  indexed:true,  pii:false, fill:99,  conf:98,  source:'Salesforce' },
    { name:'owner_id',        type:'uuid',      required:true,  indexed:true,  pii:false, fill:100, conf:100, source:'Salesforce' },
    { name:'forecast_category', type:'enum',    required:false, indexed:false, pii:false, fill:100, conf:97,  source:'—', computed:'rule: stage × probability' },
    { name:'next_step',       type:'string',    required:false, indexed:false, pii:false, fill:92,  conf:89,  source:'—', computed:'agent: conversation analysis' },
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
const PERSON_NODES = new Set(['person', 'employee', 'contact'])
// Deal-role labels for people — far more useful on the graph than a generic "Person".
const PERSON_ROLES = ['Champion', 'Economic Buyer', 'Account Executive', 'Customer Success', 'End User', 'Procurement Lead', 'Technical Evaluator', 'Executive Sponsor']
const personRole = recordId => PERSON_ROLES[(String(recordId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % PERSON_ROLES.length]
const PEOPLE_NAMES = ['Priya Sharma','Daniel Kim','Maya Chen','Lucas Bennett','Sofia Alvarez','Ethan Walsh','Aisha Khan','Tom Eriksen','Grace Liu','Marcus Webb','Elena Petrova','Noah Fischer','Tara Singh','Owen Gallagher','Camille Dubois','Victor Osei','Hana Suzuki','Leo Martinez']
function generateValueForProp(p, seed, nodeId) {
  const v = Math.abs(seed * (p.name.charCodeAt(0) + 1))
  if (p.pk) return p.name.replace(/_id$/, '').toUpperCase().slice(0,3) + '-' + (10000 + v % 89999)
  if (['name','label','company_name'].includes(p.name)) {
    // people get human names; organizations get company names
    if (PERSON_NODES.has(nodeId)) return PEOPLE_NAMES[v % PEOPLE_NAMES.length]
    if (nodeId === 'product') return ['Lumen Platform','Lumen Analytics','Lumen Workflows','Lumen API Gateway'][v % 4]
    if (nodeId === 'opportunity') return ['Expansion — 120 seats FY27','Renewal + Analytics add-on','Multi-year enterprise upgrade','API Gateway cross-sell'][v % 4]
    if (nodeId === 'competitor') return ['Atlas Data Cloud','HelioWorks','GridIron Systems','Vantage AI'][v % 4]
    const names = ['Northwind Logistics','Cascade Analytics','Meridian Labs','Horizon Tech','Summit Partners','Apex Global','Quantum Dynamics','Vertex Solutions','Pinnacle Systems','Beacon Industries','Cipher Group','Delphi Networks','Echo Innovations','Forge Systems','Glacier Tech']
    return names[v % names.length]
  }
  if (p.name === 'domain')   return ['northwind.com','cascade.io','meridian.co','horizon.tech','summit.partners','apex.global','quantum.dy','vertex.dev','pinnacle.systems','beacon.io'][v % 10]
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
  if (p.name === 'currency') return ['USD','USD','EUR','GBP'][v % 4]
  if (p.name === 'plan_tier') return ['Enterprise','Growth','Starter'][v % 3]
  if (p.name === 'seats')    return String(50 + (v % 45) * 10)
  if (['mrr_usd','amount_due_usd','contract_value_usd','balance_usd'].includes(p.name)) return ((v % 9000) * 12 + 2400).toLocaleString('en-US', { minimumFractionDigits: 2 })
  if (p.name === 'discount_pct') return (5 + v % 18) + '%'
  if (p.name === 'po_number') return 'PO-' + (10000 + v % 89999)
  if (p.name === 'payment_terms') return ['Net 30','Net 45','Net 60','Due on receipt'][v % 4]
  if (p.name === 'severity') return ['Sev-1','Sev-2','Sev-3'][v % 3]
  if (p.name === 'subject')  return ['API rate limits exceeded on prod','SSO login loop after rollout','Webhook retries failing silently','Data export missing columns','Billing portal shows stale balance'][v % 5]
  if (p.name === 'job_title') return ['VP Operations','Head of Data','Procurement Lead','IT Director','CFO','Solutions Architect'][v % 6]
  if (p.name === 'phone')    return '(415) 555-0' + (100 + v % 899)
  if (p.name === 'linkedin_url') return 'linkedin.com/in/' + ['priyasharma','dkim','mayachen','lbennett','salvarez'][v % 5]
  if (p.name === 'interaction_type') return ['Call','Meeting','Email','QBR'][v % 4]
  if (p.name === 'duration_min') return String(15 + (v % 9) * 5)
  if (p.name === 'sentiment') return ['Positive','Neutral','Negative — escalation risk'][v % 3]
  if (p.name === 'summary')  return ['Discussed renewal pricing and seat expansion','Walked through API migration plan','Reviewed open Sev-2 and agreed on workaround','Quarterly business review — green overall'][v % 4]
  if (p.name === 'signed_by') return ['James Carter','Emily Rodriguez','Olivia Bennett'][v % 3]
  if (p.name === 'title')    return ['Master Services Agreement','Enterprise Order Form','Renewal Amendment No. 2'][v % 3]
  if (p.name === 'risk_band') return ['High','Medium','Watch'][v % 3]
  if (p.name === 'top_drivers') return ['Usage down 23% over 30d · 2 Sev-1 escalations · NPS detractor','Champion left the account · login frequency declining','Seats utilisation at 41% · renewal in 60 days'][v % 3]
  if (p.name === 'usage_trend_30d') return ['-23% WAU','-9% WAU','flat'][v % 3]
  if (p.name === 'support_escalations_90d') return String(v % 5)
  if (p.name === 'recommended_action') return ['Exec sponsor outreach within 7 days','Schedule success review + training','Offer seat right-sizing before renewal'][v % 3]
  if (p.name === 'trend')    return ['Improving','Stable','Declining'][v % 3]
  if (p.name === 'score' || p.name.endsWith('_subscore')) return String(55 + v % 45)
  if (p.name === 'event_type') return ['feature.used','session.start','export.run','api.call'][v % 4]
  if (p.name === 'feature_name') return ['Workflow Builder','Analytics Dashboards','API Gateway','SSO / SCIM'][v % 4]
  if (p.name === 'actor_email') return ['priya.s','daniel.k','maya.c'][v % 3] + '@northwind.com'
  if (p.name === 'platform') return ['web','api','mobile'][v % 3]
  if (p.name === 'event_count_24h') return String(40 + v % 900)
  if (p.name === 'csat_score') return (2 + v % 4) + ' / 5'
  if (p.name === 'root_cause') return ['API rate-limit misconfiguration','Expired SAML certificate','Webhook retry storm after deploy'][v % 3]
  if (p.name === 'threat_level') return ['High','Medium'][v % 2]
  if (p.name === 'displacing_product') return ['Atlas Data Cloud','HelioWorks Suite','GridIron Platform'][v % 3]
  if (p.name === 'mentions_90d') return String(2 + v % 9)
  if (p.name === 'sku')      return 'LUM-' + ['ENT','GRW','STR'][v % 3] + '-00' + (1 + v % 4)
  if (p.name === 'edition')  return ['Enterprise','Growth','Starter'][v % 3]
  if (p.name === 'seats_licensed') return String(50 + (v % 45) * 10)
  if (p.name === 'modules')  return ['Analytics, Workflows, SSO','Workflows, API Gateway','Analytics, SSO, Audit Logs'][v % 3]
  if (p.name === 'unit_price_usd') return (40 + (v % 16) * 5).toFixed(2)
  if (p.name === 'stage')    return ['Discovery','Proposal','Negotiation','Closed Won'][v % 4]
  if (p.name === 'amount_usd') return ((v % 220) * 1000 + 18000).toLocaleString('en-US', { minimumFractionDigits: 2 })
  if (p.name === 'probability') return '0.' + (35 + v % 60)
  if (p.name === 'forecast_category') return ['Commit','Best Case','Pipeline'][v % 3]
  if (p.name === 'next_step') return ['Send revised proposal by Friday','Security review with IT — next Tue','Align exec sponsors on multi-year terms'][v % 3]
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
  const extras = [
    ['status','enum'],['owner_id','uuid'],['type','enum'],['priority','enum'],['amount','decimal'],['currency','string'],
    ['external_ref','string'],['source_system','string'],['stage','enum'],['region','enum'],['segment','enum'],
    ['created_by','uuid'],['updated_at','timestamp'],['resolved_at','timestamp'],['due_date','date'],['score','float'],
    ['is_active','bool'],['tags','string[]'],['notes','string'],['last_synced','timestamp'],['record_url','string'],
  ]
  const n = Math.max(extras.length, node.props - 3)
  for (let i = 0; i < Math.min(n, extras.length); i++) {
    const [name, type] = extras[i]
    out.push({ name, type, required:i<2, indexed:i%2===0, pii:name.includes('owner')||name.includes('ref')||name.includes('url'), fill:70+((seed*i)%30),conf:80+((seed+i)%19),source:'primary' })
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
    props.forEach(p => { rec[p.name] = generateValueForProp(p, s, node.id) })
    syncPkWithId(rec, props)
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
  // relationships that realistically occur once per record
  const SINGLE_EDGES = new Set(['GOVERNED_BY','HAS_SUBSCRIPTION','FLAGS','HAS_HEALTH','OBSERVED_ON','PREVIOUSLY_AT','SCORES','INCIDENT_AFFECTS','AGAINST','TOUCHES','FROM_ACCOUNT','HAS_OPPORTUNITY','COMPETES_WITH','FOR_PRODUCT','ESCALATES_TO'])
  return allEdges.slice(0,14).map((e, idx) => {
    const isOut      = e.s === node.id
    const otherId    = isOut ? e.t : e.s
    const otherNode  = NODES.find(n => n.id === otherId)
    if (!otherNode) return null
    const count = SINGLE_EDGES.has(e.label) ? 1 : ((baseSeed + idx * 3) % 2) + 1
    const otherProps = generateProps(otherNode)
    const nameProp   = otherProps.find(p => ['name','label','title','company_name'].includes(p.name)) || otherProps[1] || otherProps[0]
    const related = []
    for (let i = 0; i < count; i++) {
      const s = baseSeed + idx * 41 + i * 17
      related.push({ id: otherNode.id+'-'+(100000+Math.abs(s*1597)%899999), label: otherNode.label, nodeId: otherNode.id, keyName: nameProp?.name||'id', keyValue: nameProp ? generateValueForProp(nameProp,s,otherNode.id) : '—', edgeLabel: e.label, kind: e.kind, direction: isOut?'out':'in', since: '2026-'+String(1+Math.abs(s)%12).padStart(2,'0')+'-'+String(1+Math.abs(s)%28).padStart(2,'0'), confidence: (0.78+(Math.abs(s)%21)/100).toFixed(2) })
    }
    return { edge: e, otherNode, isOut, count, related }
  }).filter(Boolean)
}

function buildRecordFromId(targetId, targetNode) {
  const existing = generateRecords(targetNode).find(r => r.id === targetId)
  if (existing) return existing
  const seed = targetId.length * 13 + targetId.charCodeAt(targetId.length-1) * 7
  const rec = { id:targetId, nodeType:targetNode.label, nodeId:targetNode.id, status:['active','active','active','review','flagged'][Math.abs(seed)%5], _updatedAgo:['2m ago','14m ago','1h ago','4h ago','1d ago','3d ago'][Math.abs(seed)%6], _createdAgo:['12d ago','34d ago','2mo ago','6mo ago','1y ago','2y ago'][Math.abs(seed)%6], _source:['Salesforce CRM','NetSuite ERP','HubSpot Marketing','Manual / Admin'][Math.abs(seed)%4], _completeness:78+(Math.abs(seed)%22), _confidence:82+(Math.abs(seed)%17) }
  const tProps = generateProps(targetNode)
  tProps.forEach((p,i) => { rec[p.name] = generateValueForProp(p, seed+i*11, targetNode.id) })
  syncPkWithId(rec, tProps)
  return rec
}
// The business key (INV-365102) is derived from the internal record id
// (invoice-365102) so the two always tell the same story.
function syncPkWithId(rec, props) {
  const pk = props.find(p => p.pk)
  if (!pk) return
  const num = (rec.id.match(/(\d+)$/) || [])[1]
  if (num) rec[pk.name] = pk.name.replace(/_id$/, '').toUpperCase().slice(0, 3) + '-' + num
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

// ── RecordGraphView (Records V2) ────────────────────────────────────────────
// Ego-graph for a single record: the record at the centre, every related
// record (across all its edges, in/out) laid out radially and linked with a
// labelled edge. Clicking a related node re-centres the graph on it.
function recordTitle(rec) {
  return rec.name || rec.company_name || rec.title || rec.label || rec.id
}
// What identifies a record of this type: people/orgs go by name, transactional
// records (tickets, agreements, invoices…) go by their business number (PK).
const HUMAN_NAMED_NODES = new Set(['account', 'person', 'employee', 'competitor', 'champion', 'product', 'opportunity'])
function recordDisplay(rec, nd) {
  if (HUMAN_NAMED_NODES.has(nd.id)) return recordTitle(rec)
  const pk = generateProps(nd).find(p => p.pk)
  return (pk && rec[pk.name]) || recordTitle(rec)
}
// Build a 2-hop ego graph: centre record → direct neighbours → their own
// related records, plus cross-links wherever two placed records' node types are
// connected in the schema (so a 2nd-degree record can link back to the centre
// or to a sibling — a real interconnected graph, not a star).
function buildRecordGraph(record, node, W, H) {
  const cx = W / 2, cy = H / 2
  const R1 = 205, R2 = 372
  const nodes = [], edges = []
  const flat = (rec, nd) => generateRelatedRecords(rec, nd).flatMap(g => g.related.map(r => ({ ...r, otherNode: g.otherNode, isOut: g.isOut, edge: g.edge })))

  // people must read as distinct individuals — dedupe repeated names
  const usedNames = new Set()
  const uniqLabel = (label, nd, salt) => {
    if (!PERSON_NODES.has(nd.id)) return label
    if (!usedNames.has(label)) { usedNames.add(label); return label }
    for (let i = 0; i < PEOPLE_NAMES.length; i++) {
      const cand = PEOPLE_NAMES[(salt + i) % PEOPLE_NAMES.length]
      if (!usedNames.has(cand)) { usedNames.add(cand); return cand }
    }
    return label
  }

  nodes.push({ key: 'c', type: node.id, node: { ...node, size: 34 }, label: recordDisplay(record, node), recordId: record.id, hop: 0, x: cx, y: cy })

  let first = flat(record, node).slice(0, 12)
  // symmetry: alternate heavy (many children) and light neighbours around the circle
  const childCount = f => flat(buildRecordFromId(f.id, f.otherNode), f.otherNode).filter(s => s.otherNode.id !== node.id).slice(0, PERSON_NODES.has(f.otherNode.id) ? 1 : 2).length
  const sorted = first.map(f => ({ f, c: childCount(f) })).sort((a, b) => b.c - a.c)
  const interleaved = []
  while (sorted.length) { interleaved.push(sorted.shift().f); if (sorted.length) interleaved.push(sorted.pop().f) }
  first = interleaved
  const n1 = first.length || 1
  first.forEach((f, i) => {
    const ang = -Math.PI / 2 + i * (2 * Math.PI / n1)
    const key = 'f' + i
    nodes.push({ key, type: f.otherNode.id, node: f.otherNode, label: uniqLabel(recordDisplay(buildRecordFromId(f.id, f.otherNode), f.otherNode), f.otherNode, i * 5), recordId: f.id, hop: 1, x: cx + Math.cos(ang) * R1, y: cy + Math.sin(ang) * R1 })
    edges.push({ from: f.isOut ? 'c' : key, to: f.isOut ? key : 'c', label: f.edge.label, kind: f.edge.kind })
    // 2nd hop — expand this neighbour's own relationships (skip looping straight back to the centre's type)
    const second = flat(buildRecordFromId(f.id, f.otherNode), f.otherNode).filter(s => s.otherNode.id !== node.id).slice(0, PERSON_NODES.has(f.otherNode.id) ? 1 : 2)
    const c = second.length
    second.forEach((s, j) => {
      const aChild = ang + (j - (c - 1) / 2) * 0.4
      const ckey = key + 'c' + j
      nodes.push({ key: ckey, type: s.otherNode.id, node: s.otherNode, label: uniqLabel(recordDisplay(buildRecordFromId(s.id, s.otherNode), s.otherNode), s.otherNode, i * 7 + j * 3), recordId: s.id, hop: 2, x: cx + Math.cos(aChild) * R2, y: cy + Math.sin(aChild) * R2 })
      edges.push({ from: s.isOut ? key : ckey, to: s.isOut ? ckey : key, label: s.edge.label, kind: s.edge.kind })
    })
  })

  // Distinct deal roles per person in this graph
  const usedRoles = new Set()
  nodes.forEach(n => {
    if (!PERSON_NODES.has(n.type)) return
    let i = PERSON_ROLES.indexOf(personRole(n.recordId))
    if (usedRoles.size < PERSON_ROLES.length) while (usedRoles.has(PERSON_ROLES[i % PERSON_ROLES.length])) i++
    n.role = PERSON_ROLES[i % PERSON_ROLES.length]
    usedRoles.add(n.role)
  })

  // Collision relaxation — push apart any nodes that landed too close (centre stays put).
  const MIN_D = 86
  for (let iter = 0; iter < 40; iter++) {
    let moved = false
    for (let a = 1; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const na = nodes[a], nb = nodes[b]
        let dx = nb.x - na.x, dy = nb.y - na.y
        let d = Math.hypot(dx, dy)
        if (d >= MIN_D) continue
        if (d < 1) { dx = 1; dy = 0; d = 1 }
        const push = (MIN_D - d) / 2 + 1
        na.x -= (dx / d) * push; na.y -= (dy / d) * push
        nb.x += (dx / d) * push; nb.y += (dy / d) * push
        moved = true
      }
    }
    if (!moved) break
  }

  // Cross-links: schema edges between any two placed records not already linked.
  const linked = new Set(edges.map(e => [e.from, e.to].sort().join('|')))
  const schemaEdge = (a, b) => EDGES.find(e => (e.s === a && e.t === b) || (e.s === b && e.t === a))
  let cross = 0
  for (let a = 0; a < nodes.length && cross < 9; a++) {
    for (let b = a + 1; b < nodes.length && cross < 9; b++) {
      const na = nodes[a], nb = nodes[b]
      if (na.type === nb.type) continue
      const k = [na.key, nb.key].sort().join('|')
      if (linked.has(k)) continue
      const se = schemaEdge(na.type, nb.type)
      if (se) { const dir = se.s === na.type; edges.push({ from: dir ? na.key : nb.key, to: dir ? nb.key : na.key, label: se.label, kind: se.kind, cross: true }); linked.add(k); cross++ }
    }
  }
  return { nodes, edges }
}

function RecordGraphView({ record, node, onBack, onNavigate }) {
  const [iconHovered, setIconHovered] = useState(false)
  const [picked, setPicked] = useState(null)
  const [prov, setProv] = useState(null) // the source document in the middle slot ('source' | 'chunk')
  const [fieldProv, setFieldProv] = useState(null) // field provenance — overlays the properties pane
  const [focusRel, setFocusRel] = useState(null) // edge-row hover/click focus from the Edges tab
  // rich hover card — appears after holding the pointer on a node
  const HOVER_CARD_DELAY = 1000
  const [hoverCard, setHoverCard] = useState(null)
  const hoverTimer = useRef(null)
  const startHover = gn => { clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setHoverCard(gn), HOVER_CARD_DELAY) }
  const endHover = () => { clearTimeout(hoverTimer.current); setHoverCard(null) }
  const W = 1200, H = 860, cx = W / 2, cy = H / 2
  const { nodes, edges } = buildRecordGraph(record, node, W, H)
  const byKey = Object.fromEntries(nodes.map(n => [n.key, n]))
  const totalSat = nodes.length - 1
  const centerNode = byKey['c'].node

  // ── pan + zoom — same viewport model + components as the main canvas ──
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 900, h: 560 })
  const [viewport, setViewport] = useState({ zoom: 0.8, panX: 0, panY: 0 })
  const drag = useRef(null)
  const didDrag = useRef(false)
  const inited = useRef(false)
  const fit = () => {
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
    const gx = (Math.min(...xs) + Math.max(...xs)) / 2, gy = (Math.min(...ys) + Math.max(...ys)) / 2
    const z = 0.8
    setViewport({ zoom: z, panX: -gx * z, panY: -gy * z })
  }
  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    const apply = () => { const r = el.getBoundingClientRect(); setSize({ w: r.width, h: r.height }) }
    apply(); const ro = new ResizeObserver(apply); ro.observe(el); return () => ro.disconnect()
  }, [])
  useEffect(() => { if (inited.current || !size.w) return; inited.current = true; fit() }) // eslint-disable-line
  // open the centre record's pane (and its document, if unstructured) by default
  // When the user selects a node, pan horizontally so it stays in view (the
  // vertical context is preserved). The first selection is handled by the
  // auto-open below, which re-fits once the panes have settled.
  const firstSel = useRef(true)
  useEffect(() => {
    if (!picked || !byKey[picked.key] || !size.w) return
    if (firstSel.current) { firstSel.current = false; return }
    const node = byKey[picked.key]
    setViewport(v => ({ ...v, panX: -node.x * v.zoom }))
  }, [picked && picked.key]) // eslint-disable-line
  const autoPicked = useRef(false)
  useEffect(() => {
    if (autoPicked.current || !byKey['c']) return
    autoPicked.current = true
    setPicked(byKey['c'])
    setProv(isUnstructuredNode(byKey['c'].node) ? { mode: 'source' } : null)
    // re-fit after the default panes open and the canvas resizes
    setTimeout(() => fit(), 110)
  }, []) // eslint-disable-line
  const scx = size.w / 2, scy = size.h / 2
  const onWheel = e => {
    e.preventDefault()
    const r = wrapRef.current.getBoundingClientRect()
    const sx = e.clientX - r.left, sy = e.clientY - r.top
    setViewport(v => {
      const wx = (sx - scx - v.panX) / v.zoom, wy = (sy - scy - v.panY) / v.zoom
      const nz = Math.min(2.4, Math.max(0.35, v.zoom * Math.exp(-e.deltaY * 0.0015)))
      return { zoom: nz, panX: sx - scx - wx * nz, panY: sy - scy - wy * nz }
    })
  }
  const onPointerDown = e => { if (e.button !== 0) return; endHover(); drag.current = { sx: e.clientX, sy: e.clientY, px: viewport.panX, py: viewport.panY }; didDrag.current = false }
  const onPointerMove = e => { if (!drag.current) return; const dx = e.clientX - drag.current.sx, dy = e.clientY - drag.current.sy; if (Math.abs(dx) + Math.abs(dy) > 3) didDrag.current = true; setViewport(v => ({ ...v, panX: drag.current.px + dx, panY: drag.current.py + dy })) }
  const onPointerUp = () => { drag.current = null }

  // viewport-model node/edge sets for the shared ZoomControls + Minimap
  const vpNodes = nodes.map(gn => ({ id: gn.key, x: gn.x, y: gn.y, type: gn.node.type, state: gn.node.state }))
  const vpEdges = edges.map(e => ({ s: e.from, t: e.to }))

  // Edge palette mirrors the main canvas markers exactly.
  const EDGE_COLOR = { direct: 'var(--ink-2)', inferred: 'var(--ink-3)', agent: 'var(--purple)', source: 'var(--green)' }
  // clicking a node selects + highlights it (never re-centres the graph).
  // Unstructured records open their source document by default; structured
  // records just show the fields pane.
  const pick = gn => { if (didDrag.current) return; setPicked(gn); setFocusRel(null); setFieldProv(null); setProv(isUnstructuredNode(gn.node) ? { mode: 'source' } : null) }
  // highlight: the selected node + its directly connected nodes/edges
  // selection highlights the picked node + its edges, but never dims other nodes
  const edgeLit = e => picked && (e.from === picked.key || e.to === picked.key)
  // Edges-tab focus: emphasise one specific edge + the entity it connects
  const focusKey = focusRel ? (nodes.find(n => n.recordId === focusRel && n.key !== (picked && picked.key)) || {}).key : null
  const edgeFocused = e => focusKey && picked && ((e.from === picked.key && e.to === focusKey) || (e.to === picked.key && e.from === focusKey))

  return (
    <div style={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: 'var(--bg-canvas)' }}>
      {/* header — same icon/back interaction as the node detail page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 26px 12px', flexShrink: 0 }}>
        <span
          onClick={iconHovered ? onBack : undefined}
          onMouseEnter={() => setIconHovered(true)}
          onMouseLeave={() => setIconHovered(false)}
          title={iconHovered ? 'Back to records' : undefined}
          style={{ width: 32, height: 32, borderRadius: 8, background: iconHovered ? '#f2f0eb' : '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: iconHovered ? 'pointer' : 'default', transition: 'background .15s' }}>
          {iconHovered
            ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6b6b5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
            : <ListGlyph node={node} size={18} />}
        </span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.2, marginLeft: -2 }}>{recordTitle(record)}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.blue, border: `1px solid ${C.blueFill}`, background: C.blueFill, padding: '2px 8px', borderRadius: 6 }}>{node.label}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* graph canvas — plated, pannable + zoomable, same styling as the main graph */}
      <div ref={wrapRef} onClick={() => { if (!didDrag.current && byKey['c']) pick(byKey['c']) }} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        style={{ flex: 1, minWidth: 220, overflow: 'hidden', position: 'relative', margin: picked ? '0 0 26px 26px' : '0 26px 26px', border: `1px solid ${C.line}`, borderRadius: 14, background: 'var(--bg-canvas)', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}>
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <pattern id="rec-dotgrid" x="0" y="0" width={24 * viewport.zoom} height={24 * viewport.zoom} patternUnits="userSpaceOnUse" patternTransform={`translate(${(viewport.panX + scx) % (24 * viewport.zoom)},${(viewport.panY + scy) % (24 * viewport.zoom)})`}>
              <circle cx={12 * viewport.zoom} cy={12 * viewport.zoom} r="0.7" fill="#c8c0a8" opacity="0.55" />
            </pattern>
            {['direct', 'inferred', 'agent', 'source'].map(k => (
              <marker key={k} id={`rec-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[k]} />
              </marker>
            ))}
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#rec-dotgrid)" />

          <g transform={`translate(${scx + viewport.panX},${scy + viewport.panY}) scale(${viewport.zoom})`} style={{ transition: drag.current ? 'none' : 'transform 320ms cubic-bezier(0.22,0.61,0.36,1)' }}>
          {/* edges (tree links solid, cross-links faint) */}
          {edges.map((e, i) => {
            const a = byKey[e.from], b = byKey[e.to]
            if (!a || !b) return null
            const col = EDGE_COLOR[e.kind] || EDGE_COLOR.direct
            const ux = b.x - a.x, uy = b.y - a.y, len = Math.hypot(ux, uy) || 1
            const x1 = a.x + (ux / len) * a.node.size, y1 = a.y + (uy / len) * a.node.size
            const x2 = b.x - (ux / len) * b.node.size, y2 = b.y - (uy / len) * b.node.size
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
            const baseOp = e.cross ? 0.4 : 0.72
            const focused = edgeFocused(e)
            const op = focusKey ? (focused ? 1 : 0.18) : (picked && edgeLit(e) ? 1 : baseOp)
            return (
              <g key={'e' + i} opacity={op}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={focused ? 'var(--ink)' : col} strokeWidth={focused ? 2.4 : (picked && edgeLit(e) ? 2 : (e.cross ? 1.2 : 1.6))}
                  strokeDasharray={e.kind === 'inferred' || e.cross ? '6 4' : 'none'} markerEnd={`url(#rec-arrow-${e.kind})`} />
                {!e.cross && (
                  <g transform={`translate(${mx},${my})`} style={{ pointerEvents: 'none' }}>
                    <rect x={-e.label.length * 3.2 - 5} y="-9" width={e.label.length * 6.4 + 10} height="14" rx="3" fill="var(--bg-canvas)" opacity="0.85" />
                    <text textAnchor="middle" y="1.5" fontSize="9" fill="var(--ink-3)" fontFamily="JetBrains Mono, monospace" letterSpacing="0.3">{e.label}</text>
                  </g>
                )}
              </g>
            )
          })}

          {/* nodes — main-graph NodeShape; centre drawn last (on top) */}
          {nodes.filter(n => n.key !== 'c').map(gn => {
            const on = picked && picked.key === gn.key
            return (
            <g key={gn.key} transform={`translate(${gn.x},${gn.y})`} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); pick(gn) }} onMouseEnter={() => startHover(gn)} onMouseLeave={endHover}>
              {on && <circle r={gn.node.size + 6} fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.8" />}
              {focusKey === gn.key && <circle r={gn.node.size + 7} fill="none" stroke="var(--ink)" strokeWidth="1.8" opacity="0.85" />}
              <NodeShape node={gn.node} />
              <text textAnchor="middle" y={gn.node.size + 16} fontSize={gn.hop === 2 ? '11' : '12'} fill="var(--ink)" fontFamily="Geist, system-ui" fontWeight="500" style={{ pointerEvents: 'none' }}>{gn.label}</text>
              <text textAnchor="middle" y={gn.node.size + 30} fontSize="9.5" fill="var(--ink-3)" fontFamily="JetBrains Mono, monospace" fontWeight="500" style={{ pointerEvents: 'none' }}>{PERSON_NODES.has(gn.type) ? (gn.role || personRole(gn.recordId)) : gn.node.label}</text>
            </g>
          )})}
          <g transform={`translate(${cx},${cy})`} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); pick(byKey['c']) }} onMouseEnter={() => startHover(byKey['c'])} onMouseLeave={endHover}>
            {picked && picked.key === 'c' && <circle r={centerNode.size + 7} fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.8" />}
            <NodeShape node={centerNode} selected />
            <text textAnchor="middle" y={centerNode.size + 17} fontSize="13" fill="var(--ink)" fontFamily="Geist, system-ui" fontWeight="600" style={{ pointerEvents: 'none' }}>{byKey["c"].label.length > 18 ? byKey["c"].label.slice(0, 17) + "…" : byKey["c"].label}</text>
            <text textAnchor="middle" y={centerNode.size + 31} fontSize="9.5" fill="var(--ink-3)" fontFamily="JetBrains Mono, monospace" fontWeight="500" style={{ pointerEvents: 'none' }}>{node.label}</text>
          </g>
          </g>
        </svg>

        {/* exact same minimap + zoom controls as the main graph */}
        <div className="bottomright" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <Minimap nodes={vpNodes} edges={vpEdges} viewport={viewport} size={size} />
          <ZoomControls viewport={viewport} setViewport={setViewport} nodes={vpNodes} size={size} />
        </div>

        {/* rich hover card — appears after holding the pointer on a node */}
        {hoverCard && (() => {
          const gn = hoverCard
          const hrec = buildRecordFromId(gn.recordId, gn.node)
          const hsrc = recordSource(hrec, gn.node)
          const hUnstructured = isUnstructuredNode(gn.node)
          const hFields = generateProps(gn.node).filter(p => !p.pk && p.name !== 'name').slice(0, 4)
          const sx = scx + viewport.panX + gn.x * viewport.zoom
          const sy = scy + viewport.panY + gn.y * viewport.zoom
          const left = Math.min(Math.max(sx + gn.node.size * viewport.zoom + 14, 10), size.w - 280)
          const top = Math.min(Math.max(sy - 60, 10), size.h - 240)
          return (
            <div style={{ position: 'absolute', left, top, width: 264, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 16px 44px rgba(60,50,30,0.16)', zIndex: 40, pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderBottom: `1px solid ${C.line2}` }}>
                <ListGlyph node={gn.node} size={18} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gn.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: C.ink3, marginTop: 1 }}>{PERSON_NODES.has(gn.type) ? (gn.role || personRole(gn.recordId)) : gn.node.label} · {gn.recordId}</div>
                </div>
              </div>
              {hUnstructured && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderBottom: `1px solid ${C.line2}`, background: C.panel2 }}>
                  <SourceBadge src={hsrc} size={16} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hsrc.docName}</span>
                </div>
              )}
              <div style={{ padding: '7px 13px 10px' }}>
                {hFields.map(p => (
                  <div key={p.name} style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
                    <span style={{ width: 92, flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.3px', textTransform: 'uppercase', color: C.ink4, paddingTop: 1 }}>{p.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(hrec[p.name] ?? '—')}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, paddingTop: 7, borderTop: `1px dashed ${C.line2}`, fontFamily: 'var(--mono)', fontSize: 9.5, color: C.ink4 }}>Click to inspect · {generateRelatedRecords(hrec, gn.node).reduce((a, g) => a + g.related.length, 0)} relationships</div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* middle slot: the source document (stays open while auditing fields) */}
      {prov && picked && <DocumentViewer gnode={picked} prov={prov} onBack={prov.mode === 'chunk' ? () => setProv({ mode: 'source' }) : undefined} onClose={() => setProv(null)} />}

      {/* right slot: properties pane, or the clicked field's provenance overlaying it */}
      {picked && (fieldProv
        ? <FieldProvenancePane gnode={picked} item={fieldProv}
            onOpenChunk={chunk => setProv({ mode: 'chunk', name: fieldProv.name, value: fieldProv.value, chunk })}
            onClose={() => { setFieldProv(null); setProv(isUnstructuredNode(picked.node) ? { mode: 'source' } : null) }} />
        : <RecordSidePane gnode={picked} fieldProv={fieldProv} onOpenProv={it => setFieldProv(it)} focusRel={focusRel} onFocusEdge={id => setFocusRel(f => f === id ? null : id)} onClose={() => { setPicked(null); setProv(null); setFieldProv(null) }} onOpenGraph={onNavigate} />)}
      </div>
    </div>
  )
}

// ── Source / provenance synthesis ───────────────────────────────────────────
// Which kind of system each node type is ingested from.
const NODE_SOURCE_KIND = { agreement: 'file', invoice: 'file', subscription: 'file', contract: 'file', product: 'file', ticket: 'message', case: 'message', incident: 'message', interaction: 'email', account: 'crm', person: 'crm', employee: 'crm', signal: 'crm', churn_risk: 'crm', health_score: 'crm', usage_event: 'crm', competitor: 'crm', opportunity: 'email' }
// Document-backed (unstructured) entities — these open the actual source doc.
const UNSTRUCTURED_NODES = new Set(['agreement', 'contract', 'invoice', 'subscription', 'product', 'ticket', 'case', 'incident', 'interaction', 'opportunity'])
const isUnstructuredNode = nd => UNSTRUCTURED_NODES.has(nd.id)
const SRC_APPS = {
  file: [{ app: 'Google Drive', color: '#1FA463', ext: 'pdf', domain: 'drive.google.com' }, { app: 'SharePoint', color: '#0078D4', ext: 'docx', domain: 'sharepoint.com' }, { app: 'Dropbox', color: '#0061FF', ext: 'pdf', domain: 'dropbox.com' }],
  email: [{ app: 'Gmail', color: '#EA4335', domain: 'gmail.com' }, { app: 'Outlook', color: '#0078D4', domain: 'outlook.com' }],
  message: [{ app: 'Slack', color: '#4A154B', domain: 'slack.com' }],
  crm: [{ app: 'Salesforce', color: '#00A1E0', domain: 'salesforce.com' }, { app: 'HubSpot', color: '#FF7A59', domain: 'hubspot.com' }],
}
function recordSource(rec, nd) {
  const kind = NODE_SOURCE_KIND[nd.id] || 'file'
  const pool = SRC_APPS[kind]
  const seed = rec.id.length * 13 + rec.id.charCodeAt(rec.id.length - 1) * 7
  const app = pool[seed % pool.length]
  const base = (recordTitle(rec) || nd.label).replace(/[^a-z0-9]+/gi, '_')
  const docName = kind === 'file' ? `${base}_${nd.label}.${app.ext}`
    : kind === 'email' ? `Re: ${nd.label} — ${recordTitle(rec)}`
      : kind === 'message' ? `${recordTitle(rec)} thread`
        : `${nd.label} / ${rec.id}`
  const path = kind === 'file' ? `${app.app} › ${nd.label}s › ${docName}`
    : kind === 'email' ? `${app.app} › ${['taylor.j', 'morgan.k', 'jordan.s'][seed % 3]}@northwind.com`
      : kind === 'message' ? `${app.app} › #${nd.label.toLowerCase()}s`
        : `${app.app} › ${nd.label} › ${rec.id}`
  return { kind, app: app.app, color: app.color, domain: app.domain, docName, path, seed }
}
// Fields an extraction agent reads out of the document itself.
const AGENT_FIELDS = {
  agreement: [
    { name: 'termination_clause', value: 'Either party may terminate with 90 days written notice' },
    { name: 'governing_law', value: 'State of Delaware, USA' },
    { name: 'auto_renewal', value: 'Yes — successive 12-month terms' },
    { name: 'liability_cap', value: '12 months of fees paid' },
    { name: 'key_risk', value: 'Uncapped indemnification for IP infringement' },
    { name: 'payment_terms', value: 'Net 30, invoiced annually in advance' },
    { name: 'renewal_notice_period', value: '30 days prior to end of current term' },
    { name: 'price_escalation_cap', value: 'Max 7% increase at renewal' },
    { name: 'sla_uptime', value: '99.9% monthly uptime commitment' },
    { name: 'confidentiality_term', value: '3 years post-termination' },
    { name: 'data_protection', value: 'DPA incorporated; SCCs for cross-border transfers' },
  ],
  invoice: [
    { name: 'payment_terms', value: 'Net 30' },
    { name: 'due_date', value: '2026-07-15' },
    { name: 'late_fee', value: '1.5% per month on overdue balance' },
    { name: 'po_number', value: 'PO-88231' },
    { name: 'tax_treatment', value: 'Reverse charge — VAT not applied' },
  ],
  subscription: [
    { name: 'renewal_terms', value: 'Auto-renews annually unless cancelled 30 days prior' },
    { name: 'seat_count', value: '250 licensed seats' },
    { name: 'usage_tier', value: 'Enterprise' },
    { name: 'overage_policy', value: 'Billed quarterly at $40 / seat' },
  ],
  ticket: [
    { name: 'sentiment', value: 'Negative — escalation risk' },
    { name: 'root_cause', value: 'API rate-limit misconfiguration' },
    { name: 'sla_breach', value: 'Yes — 4h response target missed' },
  ],
  interaction: [
    { name: 'summary', value: 'Customer raised concerns about renewal pricing' },
    { name: 'next_step', value: 'Send revised proposal by Friday' },
    { name: 'topics', value: 'pricing, renewal, expansion' },
  ],
  opportunity: [
    { name: 'buying_committee', value: 'CFO (EB), IT Director, Procurement Lead' },
    { name: 'budget_status', value: 'Confirmed — FY27 expansion budget approved' },
    { name: 'decision_timeline', value: 'Vendor decision by end of quarter' },
    { name: 'competitor_mentioned', value: 'Atlas Data Cloud — evaluated in parallel' },
    { name: 'risks_blockers', value: 'Security review pending; legal redlines on liability cap' },
  ],
}
const NODE_AGENT = { contract: 'agreement', agreement: 'agreement', invoice: 'invoice', subscription: 'subscription', product: 'subscription', ticket: 'ticket', case: 'ticket', incident: 'ticket', interaction: 'interaction', opportunity: 'opportunity' }
function inferType(v) {
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return 'datetime'
  if (/^(yes|no|true|false)\b/i.test(s)) return 'bool'
  if (/^[$£€]?\d[\d,.]*(\s*(MB|GB|KB|%|seats?|people|messages?))?$/i.test(s)) return 'int'
  return 'string'
}
function extractedFields(nd) { return (AGENT_FIELDS[NODE_AGENT[nd.id]] || []).map(f => ({ ...f, origin: 'agent', type: inferType(f.value) })) }
function metaFields(rec, nd, src) {
  const s = src.seed
  const dt = '2026-' + String(1 + s % 12).padStart(2, '0') + '-' + String(1 + s % 28).padStart(2, '0')
  if (src.kind === 'file') return [
    { name: 'file_name', value: src.docName }, { name: 'mime_type', value: src.docName.endsWith('docx') ? 'application/vnd…wordml' : 'application/pdf' },
    { name: 'file_size', value: (1 + s % 18) + '.' + (s % 9) + ' MB' }, { name: 'owner', value: ['James Carter', 'Emily Rodriguez', 'Olivia Bennett'][s % 3] },
    { name: 'last_modified', value: dt }, { name: 'shared_with', value: (2 + s % 8) + ' people' }, { name: 'drive_path', value: src.path },
  ].map(f => ({ ...f, origin: 'meta', type: inferType(f.value) }))
  if (src.kind === 'email') return [
    { name: 'from', value: ['taylor.j', 'morgan.k'][s % 2] + '@northwind.com' }, { name: 'subject', value: src.docName },
    { name: 'sent_at', value: dt }, { name: 'thread_size', value: (2 + s % 6) + ' messages' }, { name: 'has_attachments', value: s % 2 ? 'Yes (1)' : 'No' },
  ].map(f => ({ ...f, origin: 'meta', type: inferType(f.value) }))
  if (src.kind === 'message') return [
    { name: 'channel', value: '#' + nd.label.toLowerCase() + 's' }, { name: 'posted_by', value: ['@taylor', '@morgan'][s % 2] },
    { name: 'posted_at', value: dt }, { name: 'reactions', value: (s % 9) + ' 👍' },
  ].map(f => ({ ...f, origin: 'meta', type: inferType(f.value) }))
  return []
}
function fieldEvidence(name, value, src, nd) {
  const s = src.seed + name.length
  const human = name.replace(/_/g, ' ')
  if (src.kind === 'file') return { quote: `Notwithstanding the foregoing, the ${human} shall be `, value, tail: `, as set forth in this ${nd.label}.`, loc: `Page ${1 + s % 14} · §${1 + s % 9}.${s % 6}` }
  if (src.kind === 'email') return { quote: `Just confirming the ${human} is `, value, tail: ` — let me know if that works for you.`, loc: `Message ${1 + s % 4} of ${2 + s % 4}` }
  if (src.kind === 'message') return { quote: `fyi the ${human} on this one is `, value, tail: ` 🙂`, loc: `#${nd.label.toLowerCase()}s · 12 Jun 2026` }
  return { quote: `${human}: `, value, tail: ``, loc: `${src.app} field` }
}
function SourceBadge({ src, size = 20 }) {
  const [err, setErr] = useState(false)
  const ic = { file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></>, email: <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></>, message: <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />, crm: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></> }[src.kind]
  return (
    <span style={{ width: size, height: size, borderRadius: 5, background: '#fff', border: `1px solid ${C.line}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {!err && src.domain
        ? <img src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`} width={Math.round(size * 0.66)} height={Math.round(size * 0.66)} alt="" style={{ display: 'block', objectFit: 'contain' }} onError={() => setErr(true)} />
        : <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke={src.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ic}</svg>}
    </span>
  )
}
const FIELD_TG = { uuid: { g: 'ID', c: C.purple }, string: { g: 'T', c: C.blue }, 'string[]': { g: '[T]', c: C.blue }, decimal: { g: '#', c: C.gold }, float: { g: '.5', c: C.gold }, int: { g: '#', c: C.gold }, bool: { g: '01', c: C.coral }, timestamp: { g: 'TS', c: C.green }, date: { g: 'DT', c: C.green }, datetime: { g: 'DT', c: C.green }, enum: { g: 'E', c: C.purple } }

// Minimal slide-in pane: every data point of the picked record, grouped by where
// it came from — structured fields, agent-extracted fields, and source metadata.
// Clicking any field opens a provenance drawer that audits it back to the source.
function RecordSidePane({ gnode, fieldProv, onOpenProv, focusRel, onFocusEdge, onClose, onOpenGraph }) {
  const nd = gnode.node
  const rec = buildRecordFromId(gnode.recordId, nd)
  const src = recordSource(rec, nd)
  const unstructured = isUnstructuredNode(nd) // structured records have no source document
  const [tab, setTab] = useState('Properties')
  const rels = generateRelatedRecords(rec, nd)
  const relCount = rels.reduce((a, g) => a + g.related.length, 0)

  // one flat list — structured, agent-extracted and metadata fields together
  const items = []
  const seenNames = new Set()
  ;[
    ...generateProps(nd).map(p => ({ name: p.name, value: String(rec[p.name] ?? '—'), type: p.type, pk: p.pk, origin: 'field', computed: p.computed, sourceSys: p.source })),
    ...extractedFields(nd),
    ...metaFields(rec, nd, src),
  ].forEach(it => { if (!seenNames.has(it.name)) { seenNames.add(it.name); items.push(it) } })

  const glyph = it => {
    const tg = FIELD_TG[it.type] || FIELD_TG.string
    return <span style={{ minWidth: 20, height: 16, padding: '0 4px', borderRadius: 3, background: tg.c, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 8.5, fontWeight: 700 }}>{tg.g}</span>
  }

  return (
      <div style={{ width: 320, flexShrink: 0, minHeight: 0, margin: '0 26px 26px 14px', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 12px 34px rgba(60,50,30,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${C.line2}` }}>
          <ListGlyph node={nd} size={18} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: C.ink, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recordDisplay(rec, nd)}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.ink3, marginTop: 2 }}>{PERSON_NODES.has(nd.id) ? (gnode.role || personRole(rec.id)) : nd.label} · {rec.id}</div>
          </div>
        </div>

        {/* Properties / Edges tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '0 12px', borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
          {[['Properties', items.length], ['Edges', relCount]].map(([t, n]) => {
            const on = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 10px', border: 'none', borderBottom: `2px solid ${on ? C.ink : 'transparent'}`, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? C.ink : C.ink3 }}>
                {t}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '1px 6px', borderRadius: 8, background: C.canvas, color: C.ink3 }}>{n}</span>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {tab === 'Properties' ? items.map((it, i) => (
            <button key={it.name} onClick={() => onOpenProv(it)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', border: 'none', borderTop: i ? `1px solid ${C.line2}` : 'none', background: '#fff', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.4px', textTransform: 'uppercase', color: C.ink3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                {it.pk && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3, background: C.greenFill, color: C.green, fontWeight: 700 }}>PK</span>}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: C.ink, wordBreak: 'break-word', lineHeight: 1.45 }}>{it.value}</div>
            </button>
          )) : rels.flatMap((g, gi) => g.related.map((r, ri) => {
            const other = buildRecordFromId(r.id, g.otherNode)
            const focused = focusRel === r.id
            return (
              <button key={g.edge.label + r.id} onClick={() => onFocusEdge && onFocusEdge(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', borderTop: gi + ri ? `1px solid ${C.line2}` : 'none', background: focused ? C.canvas : '#fff', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = focused ? C.canvas : '#fff'}>
                <ListGlyph node={g.otherNode} size={17} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recordDisplay(other, g.otherNode)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontFamily: 'var(--mono)', fontSize: 10, color: C.ink3 }}>
                    <span>{g.isOut ? '→' : '←'}</span>
                    <span>:{g.edge.label}</span>
                    <span style={{ color: C.ink4 }}>·</span>
                    <span>{g.otherNode.label}</span>
                  </div>
                </div>
                {focused && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.ink2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="4 12 9 17 20 6" /></svg>}
              </button>
            )
          }))}
        </div>

        {onOpenGraph && gnode.key !== 'c' && (
          <button onClick={() => onOpenGraph(rec, nd)} style={{ flexShrink: 0, height: 42, border: 'none', borderTop: `1px solid ${C.line2}`, background: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 500, color: C.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
            Open this record's graph
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
  )
}

// ── Mock source documents ───────────────────────────────────────────────────
// Highlight every occurrence of `value` inside a text string (case-insensitive).
function hi(text, value, color) {
  if (!value || !text) return text
  const idx = text.toLowerCase().indexOf(value.toLowerCase())
  if (idx < 0) return text
  return [
    text.slice(0, idx),
    <mark key="m" style={{ background: color + '33', color: C.ink, fontWeight: 600, padding: '0 2px', borderRadius: 2, boxShadow: `inset 0 -1px 0 ${color}` }}>{text.slice(idx, idx + value.length)}</mark>,
    text.slice(idx + value.length),
  ]
}
function refAppendix(rec, nd) {
  return generateProps(nd).map(p => ({ k: p.name, v: String(rec[p.name] ?? '—') }))
}
const VENDOR = { name: 'Lumen Systems, Inc.', addr: ['500 Market Street, Suite 1200', 'San Francisco, CA 94105', 'United States'], ein: '83-4192207' }
function custAddress(rec) {
  const s = rec.id.length * 7 + rec.id.charCodeAt(2) + rec.id.charCodeAt(rec.id.length - 1)
  const streets = ['Harbor Boulevard', 'Industrial Parkway', 'Commerce Way', 'Lakeshore Drive', 'Wacker Drive', 'Congress Avenue']
  const cities = ['Chicago, IL 60601', 'Austin, TX 78701', 'Denver, CO 80202', 'Seattle, WA 98101', 'Atlanta, GA 30303', 'Boston, MA 02110']
  return [`${100 + s % 8900} ${streets[s % streets.length]}, Suite ${100 + s % 800}`, cities[s % cities.length], 'United States']
}
const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function buildMockDoc(rec, nd, src) {
  const cust = ['product', 'subscription', 'agreement', 'invoice', 'contract'].includes(nd.id) ? 'Northwind Logistics' : recordTitle(rec)
  const addr = custAddress(rec)
  const ag = AGENT_FIELDS[NODE_AGENT[nd.id]] || []
  const v = name => (ag.find(f => f.name === name) || {}).value
  const date = (rec.created_at || '2026-01-01').slice(0, 10)
  const dt = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (nd.id === 'agreement' || nd.id === 'contract') return {
    kind: 'doc', font: 'serif', pages: [
      [
        { t: 'title', text: 'MASTER SERVICES AGREEMENT', sub: `Agreement No. ${rec.agreement_id || rec.id} · Effective ${dt}` },
        { t: 'p', text: `This Master Services Agreement (this "Agreement") is made and entered into as of ${dt} (the "Effective Date") by and between ${VENDOR.name}, a Delaware corporation with its principal place of business at ${VENDOR.addr[0]}, ${VENDOR.addr[1]} ("Provider"), and ${cust}, with offices at ${addr[0]}, ${addr[1]} ("Customer"). Provider and Customer are each referred to herein as a "Party" and collectively as the "Parties."` },
        { t: 'p', text: `WHEREAS, Provider offers a cloud-based software platform and related services; and WHEREAS, Customer desires to access and use such platform and services subject to the terms and conditions set forth herein; NOW, THEREFORE, in consideration of the mutual covenants contained herein, the Parties agree as follows:` },
        { t: 'h2', text: '1. Definitions' },
        { t: 'p', text: `"Services" means the cloud software, support, and professional services described in one or more Order Forms executed under this Agreement. "Customer Data" means any data, content, or materials submitted by or on behalf of Customer to the Services. "Confidential Information" means any non-public information disclosed by one Party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.` },
        { t: 'h2', text: '2. Services & Order Forms' },
        { t: 'p', text: `Provider shall make the Services available to Customer pursuant to this Agreement and the applicable Order Form(s). Each Order Form is incorporated into and governed by this Agreement. In the event of a conflict between an Order Form and this Agreement, the Order Form shall control solely with respect to the subject matter therein.` },
        { t: 'h2', text: '3. Term & Renewal' },
        { t: 'p', text: `The initial term of this Agreement commences on the Effective Date and continues for twelve (12) months (the "Initial Term"). Renewal: ${v('auto_renewal') || 'Yes — successive 12-month terms'}. Either Party may elect not to renew by providing written notice no later than thirty (30) days prior to the end of the then-current term.` },
      ],
      [
        { t: 'h2', text: '4. Fees & Payment' },
        { t: 'p', text: `Customer shall pay all fees set forth in the applicable Order Form. Except as otherwise specified, fees are invoiced annually in advance and are due within thirty (30) days of the invoice date. All fees are non-cancelable and non-refundable except as expressly provided herein. Overdue amounts may accrue interest at the lesser of 1.5% per month or the maximum rate permitted by law.` },
        { t: 'h2', text: '5. Termination' },
        { t: 'p', text: `${v('termination_clause') || 'Either party may terminate with 90 days written notice'}. Either Party may terminate this Agreement for cause upon a material breach by the other Party that remains uncured thirty (30) days after written notice. Upon any termination or expiration, Customer shall pay all outstanding fees accrued through the effective date of termination, and each Party shall return or destroy the other Party's Confidential Information.` },
        { t: 'h2', text: '6. Confidentiality' },
        { t: 'p', text: `Each Party agrees to protect the other Party's Confidential Information using the same degree of care it uses to protect its own confidential information of like kind, but in no event less than reasonable care, and to use such Confidential Information solely to perform its obligations under this Agreement.` },
        { t: 'h2', text: '7. Data Protection & Security' },
        { t: 'p', text: `Provider shall maintain administrative, physical, and technical safeguards designed to protect the security, confidentiality, and integrity of Customer Data, consistent with the Data Processing Addendum attached hereto as Exhibit B and applicable data protection laws including, where applicable, the GDPR and CCPA.` },
      ],
      [
        { t: 'h2', text: '8. Warranties & Disclaimers' },
        { t: 'p', text: `Each Party represents and warrants that it has the full corporate power and authority to enter into this Agreement. Provider warrants that the Services will perform materially in accordance with the applicable documentation. EXCEPT AS EXPRESSLY SET FORTH HEREIN, THE SERVICES ARE PROVIDED "AS IS" AND PROVIDER DISCLAIMS ALL OTHER WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY.` },
        { t: 'h2', text: '9. Limitation of Liability' },
        { t: 'p', text: `EXCEPT FOR breaches of confidentiality or a Party's indemnification obligations, each Party's aggregate liability arising out of or related to this Agreement shall not exceed ${v('liability_cap') || '12 months of fees paid'}. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS OR DATA.` },
        { t: 'h2', text: '10. Indemnification' },
        { t: 'p', text: `Customer acknowledges and agrees to ${v('key_risk') || 'Uncapped indemnification for IP infringement'} arising from Customer-provided materials. Provider shall defend Customer against any third-party claim alleging that the Services, as provided and used in accordance with this Agreement, infringe such third party's intellectual property rights.` },
        { t: 'h2', text: '11. Governing Law & Disputes' },
        { t: 'p', text: `This Agreement shall be governed by and construed in accordance with the laws of the ${v('governing_law') || 'State of Delaware, USA'}, without regard to its conflict-of-laws principles. The Parties consent to the exclusive jurisdiction of the state and federal courts located therein for any dispute arising hereunder.` },
        { t: 'h2', text: '12. General' },
        { t: 'p', text: `This Agreement, together with all Order Forms and Exhibits, constitutes the entire agreement between the Parties and supersedes all prior or contemporaneous understandings. No modification shall be effective unless in writing and signed by authorized representatives of both Parties. If any provision is held unenforceable, the remaining provisions shall remain in full force and effect.` },
      ],
      [
        { t: 'p', text: `IN WITNESS WHEREOF, the Parties have caused this Agreement to be executed by their duly authorized representatives as of the Effective Date.` },
        { t: 'spacer', h: 28 },
        { t: 'sign', cols: [[VENDOR.name, 'James Carter', 'VP, Revenue Operations'], [cust, 'Authorized Signatory', '—']] },
        { t: 'spacer', h: 34 },
        { t: 'h2', text: 'Exhibit A — Record Reference' },
        { t: 'kv', rows: refAppendix(rec, nd).map(a => [a.k, a.v]) },
      ],
    ],
  }

  if (nd.id === 'invoice') {
    const s = src.seed
    const plat = 36000 + (s % 9) * 2000, supp = 6000 + (s % 4) * 500, onb = 4500
    const sub = plat + supp + onb, tax = Math.round(sub * 0.0), total = sub + tax
    return {
      kind: 'doc', font: 'sans', pages: [[
        { t: 'invhead', heading: 'INVOICE', number: rec.invoice_id || rec.id, issued: dt, due: v('due_date') || '2026-07-15', from: [VENDOR.name, ...VENDOR.addr], to: [cust, ...addr] },
        { t: 'table', head: ['Description', 'Qty', 'Unit price', 'Amount'], right: [false, true, true, true], rows: [
          ['Platform subscription — annual (Enterprise)', '1', usd(plat), usd(plat)],
          ['Premium support & SLA', '1', usd(supp), usd(supp)],
          ['Onboarding & implementation services', '1', usd(onb), usd(onb)],
        ] },
        { t: 'totals', rows: [['Subtotal', usd(sub), false], ['Tax (0.0%)', usd(tax), false], ['Total due', usd(total), true]] },
        { t: 'spacer', h: 14 },
        { t: 'h2', text: 'Payment terms' },
        { t: 'kv', rows: [['Payment terms', v('payment_terms') || 'Net 30'], ['Due date', v('due_date') || '2026-07-15'], ['Late fee', v('late_fee') || '1.5% per month on overdue balance'], ['PO number', v('po_number') || 'PO-88231'], ['Tax treatment', v('tax_treatment') || 'Reverse charge — VAT not applied']] },
        { t: 'note', text: `Please remit payment to ${VENDOR.name}, ACH routing 021000021, account ending ${1000 + s % 8999}. Reference invoice ${rec.invoice_id || rec.id} with your remittance. Questions: billing@lumensystems.com.` },
      ]],
    }
  }

  if (nd.id === 'subscription' || nd.id === 'product') return {
    kind: 'doc', font: 'sans', pages: [
      [
        { t: 'title', text: 'SUBSCRIPTION ORDER FORM', sub: `Order ${rec.subscription_id || rec.id} · ${dt}` },
        { t: 'p', text: `This Order Form is entered into between ${VENDOR.name} ("Provider") and ${cust} ("Customer") and is governed by the Master Services Agreement between the Parties dated ${dt}.` },
        { t: 'h2', text: 'Subscription details' },
        { t: 'table', head: ['Item', 'Detail'], right: [false, false], rows: [
          ['Plan tier', v('usage_tier') || 'Enterprise'],
          ['Licensed capacity', v('seat_count') || '250 licensed seats'],
          ['Billing frequency', 'Annual, in advance'],
          ['Subscription term', '12 months'],
          ['Start date', dt],
        ] },
        { t: 'h2', text: 'Renewal' },
        { t: 'p', text: `${v('renewal_terms') || 'Auto-renews annually unless cancelled 30 days prior'}. Renewal pricing shall not increase by more than 7% over the prior term unless otherwise agreed in writing.` },
      ],
      [
        { t: 'h2', text: 'Overage & usage' },
        { t: 'p', text: `${v('overage_policy') || 'Billed quarterly at $40 / seat'}. Usage is measured against the licensed capacity set forth above. Provider will notify Customer when usage exceeds 90% of licensed capacity.` },
        { t: 'h2', text: 'Support' },
        { t: 'p', text: `Customer is entitled to 24×7 Priority Support with a four (4) hour response target for Severity-1 incidents and a designated Customer Success Manager.` },
        { t: 'spacer', h: 24 },
        { t: 'sign', cols: [[VENDOR.name, 'Emily Rodriguez', 'Account Director'], [cust, 'Authorized Signatory', '—']] },
        { t: 'spacer', h: 28 },
        { t: 'h2', text: 'Record reference' },
        { t: 'kv', rows: refAppendix(rec, nd).map(a => [a.k, a.v]) },
      ],
    ],
  }

  if (src.kind === 'email' && nd.id === 'opportunity') {
    const from = metaFields(rec, nd, src).find(m => m.name === 'from')?.value || 'taylor.morgan@northwind.com'
    return {
      kind: 'email', font: 'sans', from, to: 'sales@lumensystems.com', date: dt, subject: src.docName, pages: [[
        { t: 'emailhead', from, to: `${VENDOR.name} <sales@lumensystems.com>`, date: dt, subject: src.docName },
        { t: 'p', text: `Hi Emily,` },
        { t: 'p', text: `Following up on last week's call — we'd like to move ahead with the evaluation. ${v('budget_status') || 'Confirmed — FY27 expansion budget approved'}, so the funding side is settled.` },
        { t: 'p', text: `On our end the buying committee is ${v('buying_committee') || 'CFO (EB), IT Director, Procurement Lead'}. ${v('decision_timeline') || 'Vendor decision by end of quarter'} — please make sure your proposal lands before then.` },
        { t: 'p', text: `Transparency note: ${v('competitor_mentioned') || 'Atlas Data Cloud — evaluated in parallel'}. The main open items on our side are: ${v('risks_blockers') || 'Security review pending; legal redlines on liability cap'}.` },
        { t: 'p', text: `Next step from your side: ${v('next_step') || 'Send revised proposal by Friday'}.` },
        { t: 'p', text: `Best,\nTaylor Jordan\nIT Director, Northwind Logistics` },
      ]],
    }
  }

  if (src.kind === 'email') {
    const from = metaFields(rec, nd, src).find(m => m.name === 'from')?.value || 'taylor.morgan@lumensystems.com'
    return {
      kind: 'email', font: 'sans', from, to: `success@${(addr ? cust.toLowerCase().replace(/[^a-z]/g, '') : 'customer')}.com`, date: dt, subject: src.docName, pages: [[
        { t: 'emailhead', from, to: `${cust} <success@${cust.toLowerCase().replace(/[^a-z]/g, '')}.com>`, date: dt, subject: src.docName },
        { t: 'p', text: `Hi team,` },
        { t: 'p', text: v('summary') || 'Following up on our call earlier this week regarding the upcoming renewal.' },
        { t: 'p', text: `A couple of action items from my side: ${v('next_step') || 'Send revised proposal by Friday'}. I'll also loop in our solutions engineer to walk through the integration questions that came up.` },
        { t: 'p', text: `Topics we covered: ${v('topics') || 'pricing, renewal, expansion'}. Let me know if I missed anything and we can pick it up on the next sync.` },
        { t: 'p', text: `Best,\nTaylor Morgan\nAccount Executive, ${VENDOR.name}\n(415) 555-0142` },
      ]],
    }
  }

  if (src.kind === 'message') return {
    kind: 'slack', font: 'sans', channel: `#${nd.label.toLowerCase()}s`, pages: [[
      { t: 'slackhead', channel: `#${nd.label.toLowerCase()}s`, sub: `${cust} · ${dt}` },
      { t: 'msg', u: 'Taylor Morgan', h: 'TM', t2: '9:14 AM', text: `New ${nd.label.toLowerCase()} flagged on ${cust} — taking a look now. Sentiment from the latest call: ${v('sentiment') || 'Negative — escalation risk'}.` },
      { t: 'msg', u: 'Morgan Lee', h: 'ML', t2: '9:20 AM', text: `Pulled the logs. Root cause looks like ${v('root_cause') || 'API rate-limit misconfiguration'} on their side. Pushing a config fix to staging.` },
      { t: 'msg', u: 'Taylor Morgan', h: 'TM', t2: '9:31 AM', text: `Heads up — ${v('sla_breach') || 'Yes — 4h response target missed'}. Escalating to the on-call EM and notifying the CSM so they can get ahead of it with ${cust}.` },
      { t: 'msg', u: 'Jordan Smith', h: 'JS', t2: '9:38 AM', text: `On it. I'll join the bridge and post updates here every 15 min until we're green.` },
    ]],
  }

  return { kind: 'crm', font: 'sans', pages: [[{ t: 'title', text: `${nd.label} record`, sub: rec.id }, { t: 'kv', rows: refAppendix(rec, nd).map(a => [a.k, a.v]) }]] }
}

// ── Field provenance ────────────────────────────────────────────────────────
// Every retrieved chunk the extraction considered for a field — scanned from
// the actual rendered document so clicking one lands on real text.
function buildFieldChunks(rec, nd, src, item) {
  if (!isUnstructuredNode(nd)) return []
  const doc = buildMockDoc(rec, nd, src)
  const val = String(item.value || '')
  const chunks = []
  const push = (page, text, match, primary) => { if (text && !chunks.some(c => c.text === text)) chunks.push({ page, text, match, primary }) }
  // primary chunks — passages that literally contain the value
  doc.pages.forEach((blocks, pi) => blocks.forEach(b => {
    const texts = []
    if (typeof b.text === 'string') texts.push(b.text)
    if (b.rows) b.rows.forEach(r => texts.push(Array.isArray(r) ? r.join(' — ') : String(r)))
    if (b.t === 'msg') texts.push(b.text)
    texts.forEach(t => { if (val && String(t).toLowerCase().includes(val.toLowerCase())) push(pi, String(t), val, true) })
  }))
  // supporting chunks — passages mentioning the field's keywords
  const words = item.name.split('_').filter(w => w.length > 3)
  doc.pages.forEach((blocks, pi) => blocks.forEach(b => {
    if (typeof b.text !== 'string') return
    const w = words.find(w => b.text.toLowerCase().includes(w.toLowerCase()))
    if (w) push(pi, b.text, w, false)
  }))
  // generic context passages — the rest of the retrieval set the extraction
  // considered, so agent fields always show a comprehensive chunk list
  if (item.origin === 'agent') {
    const paras = []
    doc.pages.forEach((blocks, pi) => blocks.forEach(b => { if (b.t === 'p' && typeof b.text === 'string' && b.text.length > 90) paras.push({ pi, text: b.text }) }))
    for (let i = 0; i < paras.length && chunks.length < 4; i++) {
      const p = paras[(src.seed + i * 5) % paras.length]
      push(p.pi, p.text, p.text.split(' ').slice(0, 5).join(' '), false)
    }
  }
  return chunks.slice(0, 4).map((c, i) => ({ ...c, score: (0.97 - i * 0.09 - (src.seed % 5) / 100).toFixed(2) }))
}
// How a field's value came to be — the EXACT upstream record, the per-field
// transformation/agent/rule, optional survivorship, then the graph property.
function upstreamRef(rec, nd, sourceSys) {
  const sys = (sourceSys && sourceSys !== '—' && sourceSys !== 'manual') ? sourceSys : (rec._source || 'Salesforce CRM')
  const num = (rec.id.match(/(\d+)$/) || [])[1] || '10042'
  const REF = {
    'Salesforce': ['Salesforce', `${nd.label} 006${String(num).slice(0, 4)}Q${String(num).slice(-2)}`],
    'Salesforce CRM': ['Salesforce', `${nd.label} 006${String(num).slice(0, 4)}Q${String(num).slice(-2)}`],
    'NetSuite ERP': ['NetSuite', `${nd.label} NS-${num}`],
    'HubSpot Marketing': ['HubSpot', `${nd.label} ${num}`],
    'DocuSign': ['DocuSign', `Envelope ${String(num).slice(0, 3)}-${String(num).slice(-3)}`],
    'Support Portal': ['Support Portal', `Case #${num}`],
    'Gmail': ['Gmail', `Thread ${String(num).slice(-5)}`],
    'Google Calendar': ['Google Calendar', `Event ${String(num).slice(-5)}`],
    'Apollo': ['Apollo', `Enrichment profile ${String(num).slice(-5)}`],
    'Manual / Admin': ['Manual entry', `by James Carter`],
  }
  const [app, ref] = REF[sys] || REF['Salesforce CRM']
  return { app, ref }
}
function fieldTransform(item) {
  const t = item.type || 'string', n = item.name
  if (/usd|amount|mrr|value|balance/.test(n)) return 'FX_NORMALIZE(USD) · ROUND(2)'
  if (t === 'timestamp' || t === 'datetime' || /(_at|_date|date_)/.test(n)) return 'PARSE_DATETIME · → UTC'
  if (t === 'enum' && /status|stage|tier/.test(n)) return "MAP_VALUES('In Flight' → 'active')"
  if (/email/.test(n)) return 'LOWERCASE · VALIDATE_EMAIL'
  if (/phone/.test(n)) return 'E164_NORMALIZE'
  if (t === 'uuid' || /_id$/.test(n)) return 'DEDUP_KEY · STABLE_HASH'
  if (t === 'string') return 'TRIM_WHITESPACE'
  return null
}
function fieldLineage(item, rec, nd, src) {
  const s = src.seed + item.name.length
  const conf = 88 + (s % 11)
  const synced = ['2m ago', '14m ago', '1h ago', '4h ago'][s % 4]
  const propStep = { k: 'field', title: `${nd.label}.${item.name}`, sub: `Property on ${nd.label} · fill ${conf}%` }

  // agent-extracted from the source document
  if (item.origin === 'agent') return [
    { k: 'src', title: src.docName, sub: `${src.app} · the exact ${src.kind === 'file' ? 'document' : src.kind} this was read from` },
    { k: 'agent', title: 'Entity Extractor Agent', sub: `claude-sonnet-4.6 · ran ${synced} · confidence ${conf}% · ${1 + s % 3} chunks considered` },
    propStep,
  ]
  // file/email metadata captured at ingest
  if (item.origin === 'meta') return [
    { k: 'src', title: src.docName, sub: `${src.app} · captured with the file at ingest` },
    { k: 'pipe', title: `${src.app} metadata sync`, sub: `No transformation · synced ${synced}` },
    propStep,
  ]
  // computed by a rule or an agent (tier, risk_score, sla_due, balance…)
  if (item.computed) {
    const isAgent = item.computed.startsWith('agent')
    const what = item.computed.replace(/^(agent|rule):\s*/, '')
    const AGENTS = { cust_health: 'Customer Health Agent', rev_fore: 'Revenue Forecaster Agent', 'doc extraction': 'Entity Extractor Agent', 'conversation analysis': 'Conversation Insights Agent' }
    return [
      { k: 'src', title: isAgent ? 'Upstream graph data' : `Inputs on ${nd.label}`, sub: isAgent ? 'Interactions, signals & usage linked to this record' : `Reads sibling properties on this record` },
      isAgent
        ? { k: 'agent', title: AGENTS[what] || 'Agent', sub: `Recomputed ${synced} · confidence ${conf}%` }
        : { k: 'pipe', title: `Rule: ${what}`, sub: `Computed at sync · recomputed ${synced}` },
      propStep,
    ]
  }
  // Apollo-style enrichment appended during source creation
  if (item.sourceSys === 'Apollo') {
    const up = upstreamRef(rec, nd, 'Apollo')
    return [
      { k: 'src', title: up.ref, sub: 'Apollo · matched by company domain + name' },
      { k: 'agent', title: 'Company Enricher Agent', sub: `Appended during source enrichment · verified ${synced}` },
      propStep,
    ]
  }
  // manual entry
  if (item.sourceSys === 'manual') return [
    { k: 'src', title: 'Manual entry', sub: 'Set by James Carter in the workspace' },
    propStep,
  ]
  // plain structured sync — exact upstream record + per-field transformation,
  // with survivorship when two systems disagreed
  const up = upstreamRef(rec, nd, item.sourceSys)
  const tf = fieldTransform(item)
  const steps = [
    { k: 'src', title: up.ref, sub: `${up.app} · the exact record this value was read from` },
    { k: 'pipe', title: `${up.app} → ${nd.label} pipeline`, sub: `${up.app}.${item.name} → ${item.name}${tf ? ' · ' + tf : ''} · synced ${synced}` },
  ]
  if (s % 4 === 0) steps.push({ k: 'merge', title: 'Survivorship — freshest wins', sub: `${up.app} value chosen over ${up.app === 'NetSuite' ? 'Salesforce' : 'NetSuite'} (updated ${synced})` })
  steps.push(propStep)
  return steps
}
const LIN_ICON = {
  src: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></>,
  agent: <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />,
  pipe: <><circle cx="5" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /><line x1="7.2" y1="12" x2="16.8" y2="12" /></>,
  merge: <><path d="M7 4v6a4 4 0 0 0 4 4h6" /><polyline points="13 10 17 14 13 18" /><path d="M17 4v3" /></>,
  field: <><rect x="4" y="5" width="16" height="14" rx="2" /><line x1="4" y1="10" x2="20" y2="10" /></>,
}

// Provenance pane: how the clicked field was derived — its lineage, and (for
// document-backed fields) every retrieved chunk, clickable into the source.
function FieldProvenancePane({ gnode, item, onOpenChunk, onClose }) {
  const nd = gnode.node
  const rec = buildRecordFromId(gnode.recordId, nd)
  const src = recordSource(rec, nd)
  const steps = fieldLineage(item, rec, nd, src)
  const chunks = buildFieldChunks(rec, nd, src, item)
  const [ptab, setPtab] = useState('Provenance')
  const tg = FIELD_TG[item.type] || FIELD_TG.string
  const trimAround = (text, match) => {
    if (text.length <= 190) return text
    const i = Math.max(0, text.toLowerCase().indexOf(String(match).toLowerCase()))
    const start = Math.max(0, i - 70)
    return (start > 0 ? '…' : '') + text.slice(start, start + 185) + '…'
  }
  return (
    <div style={{ width: 320, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', margin: '0 26px 26px 14px', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 34px rgba(60,50,30,0.08)' }}>
      {/* header — back returns to the properties pane */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px 11px 10px', borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
        <button onClick={onClose} title="Back to properties" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.4px', textTransform: 'uppercase', color: C.ink2, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.ink3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recordDisplay(rec, nd)} · {nd.label}</div>
        </div>
        <button onClick={onClose} title="Close" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.ink3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Provenance / Chunks tabs — only when there is evidence to show */}
      {chunks.length > 0 && (
        <div style={{ display: 'flex', gap: 2, padding: '0 12px', borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
          {[['Provenance', null], ['Chunks', chunks.length]].map(([t, n]) => {
            const on = ptab === t
            return (
              <button key={t} onClick={() => setPtab(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 10px', border: 'none', borderBottom: `2px solid ${on ? C.ink : 'transparent'}`, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? C.ink : C.ink3 }}>
                {t}
                {n != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '1px 6px', borderRadius: 8, background: C.canvas, color: C.ink3 }}>{n}</span>}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {(chunks.length === 0 || ptab === 'Provenance') && <>
        {/* current value */}
        <div style={{ padding: '13px 16px', borderBottom: `1px solid ${C.line2}` }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.5px', textTransform: 'uppercase', color: C.ink4, marginBottom: 5 }}>Current value</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, color: C.ink, fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word' }}>{item.value}</div>
        </div>

        {/* lineage */}
        <div style={{ padding: '13px 16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.5px', textTransform: 'uppercase', color: C.ink4, marginBottom: 10 }}>How this value was derived</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: 14, bottom: 14, width: 1, background: C.line, pointerEvents: 'none' }} />
            {steps.map((st, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, padding: '6px 0', position: 'relative' }}>
                <span style={{ width: 27, height: 27, borderRadius: 8, background: st.k === 'agent' ? C.purpleFill : C.canvas, color: st.k === 'agent' ? C.purple : C.ink2, border: `1px solid ${st.k === 'agent' ? C.purple + '44' : C.line}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={st.k === 'agent' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{LIN_ICON[st.k] || LIN_ICON.field}</svg>
                </span>
                <div style={{ minWidth: 0, paddingTop: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.title}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.ink3, marginTop: 2, lineHeight: 1.5 }}>{st.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>}

        {/* evidence chunks */}
        {chunks.length > 0 && ptab === 'Chunks' && (
          <div style={{ padding: '13px 16px' }}>
            {chunks.map((c, i) => (
              <button key={i} onClick={() => onOpenChunk(c)} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 9, padding: '11px 12px', border: `1px solid ${C.line}`, borderLeft: `3px solid ${c.primary ? src.color : C.line}`, borderRadius: 9, background: '#fff', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = C.panel2} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55 }}>
                  “{hi(trimAround(c.text, c.match), c.match, src.color)}”
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontFamily: 'var(--mono)', fontSize: 9.5, color: C.ink3 }}>
                  <SourceBadge src={src} size={14} />
                  <span>Page {c.page + 1}</span>
                  <span style={{ color: C.ink4 }}>·</span>
                  <span>match {c.score}</span>
                  {c.primary && <span style={{ padding: '1px 6px', borderRadius: 4, background: src.color + '1a', color: src.color, fontWeight: 700 }}>PRIMARY</span>}
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, color: C.ink2 }}>View in document
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Full-size source viewer: renders the mock document with the audited value
// highlighted in context. The document is the focus and takes the main area.
function DocumentViewer({ gnode, prov, onClose, onBack }) {
  const nd = gnode.node
  const rec = buildRecordFromId(gnode.recordId, nd)
  const src = recordSource(rec, nd)
  const doc = buildMockDoc(rec, nd, src)
  const hv = prov.mode === 'chunk' ? prov.chunk.match : (prov.mode === 'field' ? prov.value : null)
  const col = src.color
  const H = (t) => hi(t, hv, col)
  const [zoom, setZoom] = useState(1)
  const pageCount = doc.pages.length
  const pageHasValue = pg => hv && JSON.stringify(pg).toLowerCase().includes(String(hv).toLowerCase())
  const [pgi, setPgi] = useState(0)
  const pageRefs = useRef([])
  const scrollToPage = i => { setPgi(i); const el = pageRefs.current[i]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  useEffect(() => {
    const target = prov.chunk ? prov.chunk.page : (hv ? Math.max(0, doc.pages.findIndex(pageHasValue)) : 0)
    setPgi(target)
    requestAnimationFrame(() => { const el = pageRefs.current[target]; if (el) el.scrollIntoView({ block: 'start' }) })
  }, [prov.name, prov.mode, prov.chunk && prov.chunk.page]) // eslint-disable-line
  const onDocScroll = e => { const ct = e.currentTarget.getBoundingClientRect().top; let cur = 0; pageRefs.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top - ct <= 90) cur = i }); if (cur !== pgi) setPgi(cur) }
  const serif = doc.font === 'serif'
  const iconBtn = { width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.ink2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  const renderBlock = (b, i) => {
    switch (b.t) {
      case 'title': return <div key={i} style={{ textAlign: 'center', borderBottom: `2px solid ${C.ink}`, paddingBottom: 14, marginBottom: 22 }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, letterSpacing: '0.5px' }}>{b.text}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.ink3, marginTop: 6 }}>{b.sub}</div></div>
      case 'h2': return <div key={i} style={{ fontFamily: serif ? 'Georgia, serif' : 'var(--sans)', fontWeight: 700, fontSize: 14, margin: '18px 0 6px' }}>{H(b.text)}</div>
      case 'p': return <p key={i} style={{ fontFamily: serif ? 'Georgia, serif' : 'var(--sans)', fontSize: 13.5, lineHeight: 1.7, textAlign: serif ? 'justify' : 'left', margin: '0 0 11px', whiteSpace: 'pre-line' }}>{H(b.text)}</p>
      case 'spacer': return <div key={i} style={{ height: b.h }} />
      case 'note': return <p key={i} style={{ fontSize: 11.5, color: C.ink3, lineHeight: 1.55, margin: '16px 0 0', fontFamily: 'var(--sans)' }}>{H(b.text)}</p>
      case 'kv': return <div key={i} style={{ margin: '4px 0' }}>{b.rows.map((r, j) => <div key={j} style={{ display: 'flex', gap: 14, padding: '6px 0', borderTop: j ? `1px solid ${C.line2}` : 'none' }}><span style={{ width: 150, flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.3px', color: C.ink3 }}>{r[0]}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: C.ink, wordBreak: 'break-word' }}>{H(String(r[1]))}</span></div>)}</div>
      case 'table': return <table key={i} style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 4px', fontSize: 13 }}><thead><tr style={{ borderBottom: `2px solid ${C.line}` }}>{b.head.map((h, j) => <th key={j} style={{ textAlign: b.right && b.right[j] ? 'right' : 'left', padding: '8px 0', fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.4px', color: C.ink3 }}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, j) => <tr key={j} style={{ borderBottom: `1px solid ${C.line2}` }}>{r.map((c, k) => <td key={k} style={{ padding: '9px 0', textAlign: b.right && b.right[k] ? 'right' : 'left', fontFamily: b.right && b.right[k] ? 'var(--mono)' : 'var(--sans)' }}>{H(String(c))}</td>)}</tr>)}</tbody></table>
      case 'totals': return <div key={i} style={{ marginTop: 8, marginLeft: 'auto', width: 250 }}>{b.rows.map((r, j) => <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: r[2] ? `2px solid ${C.ink}` : 'none', fontSize: 13, fontWeight: r[2] ? 700 : 400 }}><span style={{ color: r[2] ? C.ink : C.ink2 }}>{r[0]}</span><span style={{ fontFamily: 'var(--mono)' }}>{H(String(r[1]))}</span></div>)}</div>
      case 'sign': return <div key={i} style={{ display: 'flex', gap: 36 }}>{b.cols.map((c, j) => <div key={j} style={{ flex: 1 }}><div style={{ borderBottom: `1px solid ${C.ink}`, height: 28 }} /><div style={{ fontSize: 12, marginTop: 5, fontFamily: serif ? 'Georgia, serif' : 'var(--sans)' }}>{c[0]}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.ink3 }}>By: {c[1]} · {c[2]}</div></div>)}</div>
      case 'invhead': return (<div key={i}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, letterSpacing: '1px' }}>{b.heading}</div><span style={{ width: 42, height: 42, borderRadius: 10, background: col + '1a', border: `1px solid ${col}44` }} /></div><div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 16, fontSize: 12.5 }}><div><div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', color: C.ink3, marginBottom: 4 }}>From</div>{b.from.map((l, j) => <div key={j} style={{ color: j ? C.ink3 : C.ink, fontWeight: j ? 400 : 600 }}>{l}</div>)}</div><div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', color: C.ink3, marginBottom: 4 }}>Bill to</div>{b.to.map((l, j) => <div key={j} style={{ color: j ? C.ink3 : C.ink, fontWeight: j ? 400 : 600 }}>{H(l)}</div>)}</div></div><div style={{ display: 'flex', gap: 16, paddingBottom: 14, borderBottom: `2px solid ${C.line}`, fontFamily: 'var(--mono)', fontSize: 11, color: C.ink2 }}><span>Invoice {b.number}</span><span style={{ color: C.ink4 }}>·</span><span>Issued {b.issued}</span><span style={{ color: C.ink4 }}>·</span><span>Due {H(b.due)}</span></div></div>)
      case 'emailhead': return (<div key={i} style={{ marginBottom: 18 }}><div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{H(b.subject)}</div><div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingBottom: 12, borderBottom: `1px solid ${C.line2}` }}><span style={{ width: 38, height: 38, borderRadius: '50%', background: col + '1a', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--mono)' }}>{b.from[0].toUpperCase()}</span><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{H(b.from)}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.ink3 }}>to {b.to} · {b.date}</div></div></div></div>)
      case 'slackhead': return <div key={i} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.line2}` }}><div style={{ fontSize: 15, fontWeight: 700 }}>{b.channel}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.ink3, marginTop: 2 }}>{b.sub}</div></div>
      case 'msg': return <div key={i} style={{ display: 'flex', gap: 11, marginBottom: 15 }}><span style={{ width: 36, height: 36, borderRadius: 8, background: col + '1a', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 11.5, flexShrink: 0 }}>{b.h}</span><div><div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 13.5, fontWeight: 700 }}>{b.u}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.ink3 }}>{b.t2}</span></div><div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 2 }}>{H(b.text)}</div></div></div>
      default: return null
    }
  }

  return (
    <div style={{ width: 540, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', margin: '0 0 26px 14px', border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', background: C.canvas }}>
      {/* viewer toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px', background: '#fff', borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
        <SourceBadge src={src} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.docName}</div>
        </div>
        <button title="Download" style={iconBtn} onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        </button>
        <button title="Open in new tab" style={iconBtn} onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
        </button>
        <div style={{ width: 1, height: 18, background: C.line, margin: '0 2px' }} />
        <button onClick={onClose} title="Close" style={iconBtn} onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* PDF-style controls — page nav + zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: C.panel2, borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
        {onBack && (
          <>
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 9px', borderRadius: 7, border: `1px solid ${C.line}`, background: '#fff', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3px', color: C.ink2, flexShrink: 0 }}
              onMouseOver={e => e.currentTarget.style.background = C.canvas} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              {prov.name}
            </button>
            <div style={{ width: 1, height: 18, background: C.line, margin: '0 2px' }} />
          </>
        )}
        <button style={{ ...iconBtn, opacity: pgi === 0 ? 0.35 : 1 }} title="Previous page" disabled={pgi === 0} onClick={() => scrollToPage(Math.max(0, pgi - 1))} onMouseOver={e => { if (pgi) e.currentTarget.style.background = '#fff' }} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.ink2 }}>{pgi + 1} <span style={{ color: C.ink4 }}>/ {pageCount}</span></span>
        <button style={{ ...iconBtn, opacity: pgi === pageCount - 1 ? 0.35 : 1 }} title="Next page" disabled={pgi === pageCount - 1} onClick={() => scrollToPage(Math.min(pageCount - 1, pgi + 1))} onMouseOver={e => { if (pgi < pageCount - 1) e.currentTarget.style.background = '#fff' }} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <div style={{ width: 1, height: 18, background: C.line, margin: '0 4px' }} />
        <button style={iconBtn} title="Zoom out" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.1).toFixed(2)))} onMouseOver={e => e.currentTarget.style.background = '#fff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.ink2, minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button style={iconBtn} title="Zoom in" onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))} onMouseOver={e => e.currentTarget.style.background = '#fff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <button style={{ ...iconBtn, width: 'auto', padding: '0 9px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.4px' }} title="Reset zoom" onClick={() => setZoom(1)} onMouseOver={e => e.currentTarget.style.background = '#fff'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>FIT</button>
      </div>

      {/* document — all pages stacked, continuously scrollable */}
      <div onScroll={onDocScroll} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '20px 18px' }}>
        {doc.pages.map((pgBlocks, pi) => (
          <div key={pi} ref={el => pageRefs.current[pi] = el} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 100ms', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: '0 8px 30px rgba(60,50,30,0.07)', padding: '38px 40px', minHeight: 600, color: C.ink, position: 'relative', marginBottom: 18 }}>
            {pgBlocks.map(renderBlock)}
            <div style={{ position: 'absolute', bottom: 14, right: 18, fontFamily: 'var(--mono)', fontSize: 9, color: C.ink4 }}>{src.docName} · p.{pi + 1}/{pageCount}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RecordsPage({ disableDetail }) {
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedNode,   setSelectedNode]   = useState(null)

  if (selectedRecord && selectedNode) {
    const nav = (rec, node) => { setSelectedRecord(rec); setSelectedNode(node) }
    const back = () => { setSelectedRecord(null); setSelectedNode(null) }
    return disableDetail
      ? <RecordGraphView record={selectedRecord} node={selectedNode} onBack={back} onNavigate={nav} />
      : <RecordDetailView record={selectedRecord} node={selectedNode} onBack={back} onNavigate={nav} />
  }

  return (
    <RecordsView
      onOpenRecord={(rec, node) => { setSelectedRecord(rec); setSelectedNode(node) }}
    />
  )
}
