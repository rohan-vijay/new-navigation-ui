import { useState, useRef, useMemo } from 'react'

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  green:  '#2f6f43', greenBg: '#eef4ee', greenBd: '#d6e6d8',
  gold:   '#b07a20', goldBg:  '#f9f0de', goldBd:  '#e7dcc1',
  coral:  '#c0492f', coralBg: '#fbe6e6', coralBd: '#f5c6c6',
  blue:   '#3b6fd4', blueBg:  '#e6edfa', blueBd:  '#c4d5f5',
  purple: '#7c3aed', purpleBg:'#ede9fc', purpleBd:'#d4c9f8',
  teal:   '#0d9488', tealBg:  '#ccfbf1', tealBd:  '#99f6e4',
  gray:   '#6b7280', grayBg:  '#f3f4f6', grayBd:  '#e5e7eb',
  ink:    '#1a1a1a', ink2:    '#5b5547', ink3:    '#9097a0',
}

const CAT_STYLE = {
  core:    { color: C.blue,   bg: C.blueBg,   border: C.blueBd,   label: 'Core' },
  sales:   { color: C.green,  bg: C.greenBg,  border: C.greenBd,  label: 'Sales' },
  delivery:{ color: C.gold,   bg: C.goldBg,   border: C.goldBd,   label: 'Delivery' },
  support: { color: C.coral,  bg: C.coralBg,  border: C.coralBd,  label: 'Support' },
  people:  { color: C.gray,   bg: C.grayBg,   border: C.grayBd,   label: 'People' },
  derived: { color: C.purple, bg: C.purpleBg, border: C.purpleBd, label: 'Derived' },
  source:  { color: C.teal,   bg: C.tealBg,   border: C.tealBd,   label: 'Source' },
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ENTITIES = [
  { id:'account', label:'Account', cat:'core', definition:'The central company/organization node. Aggregates ARR, health, risk, and all downstream relationships.', sources:['HubSpot','NetSuite','Apollo'],
    props:[
      { name:'account_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Legal or trading name' },
      { name:'domain', type:'string', desc:'Root domain for identity resolution' },
      { name:'industry', type:'enum', desc:'Vertical classification' },
      { name:'region', type:'enum', desc:'Geographic region' },
      { name:'tier', type:'enum', desc:'Customer tier (Enterprise / Mid-Market / SMB)' },
      { name:'arr_usd', type:'decimal', desc:'Annual Recurring Revenue in USD' },
      { name:'health_score', type:'float', desc:'Computed composite health (0–100)', computed:true },
      { name:'churn_probability', type:'float', desc:'ML-derived churn probability', computed:true },
      { name:'lifecycle_stage', type:'enum', desc:'Prospect / Customer / Churned' },
      { name:'owner_id', type:'string', desc:'CSM / AE owner reference' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'contact', label:'Contact', cat:'core', definition:'An individual person at an account. Holds PII fields, role, and computed lead / engagement scores.', sources:['HubSpot','Apollo'],
    props:[
      { name:'contact_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Full name' },
      { name:'email', type:'string', desc:'Business email (PII)', pii:true },
      { name:'title', type:'string', desc:'Job title' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'lead_score', type:'float', desc:'Computed engagement/fit score', computed:true },
      { name:'decision_role', type:'enum', desc:'Champion / Economic Buyer / Influencer / End User' },
      { name:'phone', type:'string', desc:'Business phone (PII)', pii:true },
      { name:'owner_id', type:'string', desc:'Sales rep owner' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'lead', label:'Lead', cat:'core', definition:'An unqualified prospect. Transitions to Contact/Opportunity upon qualification via fit and intent signals.', sources:['HubSpot','Apollo','Web'],
    props:[
      { name:'lead_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Lead name' },
      { name:'email', type:'string', desc:'Contact email (PII)', pii:true },
      { name:'company', type:'string', desc:'Company name' },
      { name:'source', type:'enum', desc:'Acquisition channel' },
      { name:'fit_score', type:'float', desc:'ICP fit score (computed)', computed:true },
      { name:'intent_score', type:'float', desc:'Buying intent score (computed)', computed:true },
      { name:'status', type:'enum', desc:'New / MQL / SQL / Disqualified' },
      { name:'owner_id', type:'string', desc:'SDR owner' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'opportunity', label:'Opportunity', cat:'core', definition:'A potential revenue event. Tracks pipeline stage, amount, close date, and AI-computed deal health and win probability.', sources:['HubSpot'],
    props:[
      { name:'opportunity_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Deal name' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'stage', type:'enum', desc:'CEP stage (1–11)' },
      { name:'amount', type:'decimal', desc:'Deal value (USD)' },
      { name:'close_date', type:'date', desc:'Expected close date' },
      { name:'win_probability', type:'float', desc:'AI win probability (0–1)', computed:true },
      { name:'deal_health', type:'string', desc:'Green / Amber / Red (computed)', computed:true },
      { name:'competitor_ids', type:'string[]', desc:'Competing vendors' },
      { name:'owner_id', type:'string', desc:'AE owner' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'subscription', label:'Subscription', cat:'core', definition:'An active recurring revenue contract. Tracks MRR, seats, status, and renewal risk.', sources:['NetSuite','HubSpot'],
    props:[
      { name:'subscription_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'plan', type:'string', desc:'Product plan name' },
      { name:'status', type:'enum', desc:'Active / Trial / Suspended / Cancelled' },
      { name:'seats', type:'int', desc:'Number of licensed seats' },
      { name:'mrr', type:'decimal', desc:'Monthly Recurring Revenue' },
      { name:'arr_usd', type:'decimal', desc:'Annual Recurring Revenue' },
      { name:'start_date', type:'date', desc:'Subscription start' },
      { name:'renewal_date', type:'date', desc:'Next renewal date' },
      { name:'risk', type:'string', desc:'Renewal risk flag (computed)', computed:true },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'contract', label:'Contract', cat:'core', definition:'A legally executed agreement. Parsed from DocuSign and Google Drive; risk flags are AI-extracted.', sources:['DocuSign','Google Drive'],
    props:[
      { name:'contract_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'type', type:'enum', desc:'MSA / NDA / Order Form / Amendment' },
      { name:'status', type:'enum', desc:'Draft / Executed / Expired / Terminated' },
      { name:'amount', type:'decimal', desc:'Total contract value' },
      { name:'start_date', type:'date', desc:'Contract effective date' },
      { name:'end_date', type:'date', desc:'Contract expiry date' },
      { name:'auto_renewal', type:'bool', desc:'Auto-renews if not cancelled' },
      { name:'governing_law', type:'string', desc:'Jurisdiction' },
      { name:'risk_flags', type:'string[]', desc:'AI-extracted risk clauses', computed:true },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'sow', label:'SOW', cat:'core', definition:'Statement of Work — scopes professional services engagements, milestones, and budgets.', sources:['Google Drive','DocuSign'],
    props:[
      { name:'sow_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'title', type:'string', desc:'SOW title' },
      { name:'status', type:'enum', desc:'Draft / Signed / In Progress / Closed' },
      { name:'total_value', type:'decimal', desc:'Total services value' },
      { name:'start_date', type:'date', desc:'Engagement start' },
      { name:'end_date', type:'date', desc:'Engagement end' },
      { name:'deliverables', type:'string[]', desc:'List of deliverables' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'proposal', label:'Proposal', cat:'core', definition:'A commercial proposal document shared with the prospect during evaluation.', sources:['Google Drive','HubSpot'],
    props:[
      { name:'proposal_id', type:'uuid', desc:'Primary key' },
      { name:'opportunity_id', type:'uuid', desc:'FK → Opportunity', fk:true },
      { name:'version', type:'int', desc:'Proposal version number' },
      { name:'status', type:'enum', desc:'Draft / Sent / Viewed / Accepted / Rejected' },
      { name:'amount', type:'decimal', desc:'Proposed value' },
      { name:'sent_at', type:'timestamp', desc:'Date sent to prospect' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'invoice', label:'Invoice', cat:'core', definition:'A billing document generated per subscription cycle or one-time charge.', sources:['NetSuite'],
    props:[
      { name:'invoice_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'subscription_id', type:'uuid', desc:'FK → Subscription', fk:true },
      { name:'amount', type:'decimal', desc:'Invoice total' },
      { name:'status', type:'enum', desc:'Draft / Sent / Paid / Overdue / Void' },
      { name:'due_date', type:'date', desc:'Payment due date' },
      { name:'issued_at', type:'timestamp', desc:'Issue timestamp' },
      { name:'currency', type:'string', desc:'ISO 4217 currency code' },
      { name:'external_ref', type:'string', desc:'ERP reference number' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'payment', label:'Payment', cat:'core', definition:'A recorded cash or credit receipt against an invoice.', sources:['NetSuite'],
    props:[
      { name:'payment_id', type:'uuid', desc:'Primary key' },
      { name:'invoice_id', type:'uuid', desc:'FK → Invoice', fk:true },
      { name:'amount', type:'decimal', desc:'Payment amount' },
      { name:'method', type:'enum', desc:'ACH / Wire / Card / Check' },
      { name:'status', type:'enum', desc:'Pending / Settled / Failed / Refunded' },
      { name:'received_at', type:'timestamp', desc:'Receipt timestamp' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'order', label:'Order', cat:'core', definition:'A purchase order or order form tied to a commercial transaction.', sources:['NetSuite'],
    props:[
      { name:'order_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'items', type:'string[]', desc:'Line items' },
      { name:'total', type:'decimal', desc:'Order total' },
      { name:'status', type:'enum', desc:'Pending / Confirmed / Fulfilled / Cancelled' },
      { name:'ordered_at', type:'timestamp', desc:'Order placement date' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'renewal', label:'Renewal', cat:'core', definition:'A renewal opportunity tracking upcoming subscription renewals with risk and expansion signals.', sources:['HubSpot','NetSuite'],
    props:[
      { name:'renewal_id', type:'uuid', desc:'Primary key' },
      { name:'subscription_id', type:'uuid', desc:'FK → Subscription', fk:true },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'renewal_date', type:'date', desc:'Expected renewal date' },
      { name:'arr_at_risk', type:'decimal', desc:'ARR at risk of churn' },
      { name:'status', type:'enum', desc:'Open / Won / Lost / Deferred' },
      { name:'expansion_signal', type:'string', desc:'Expansion signal (computed)', computed:true },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'interaction', label:'Interaction', cat:'core', definition:'Any customer touchpoint — email, call, meeting, or Slack thread. AI summarizes and extracts sentiment, risk, and next actions.', sources:['Gmail','Google Calendar','Slack'],
    props:[
      { name:'interaction_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'contact_id', type:'uuid', desc:'FK → Contact', fk:true },
      { name:'type', type:'enum', desc:'Email / Call / Meeting / Slack' },
      { name:'channel', type:'enum', desc:'Gmail / GCal / Slack / Phone' },
      { name:'summary', type:'string', desc:'AI-generated summary', computed:true },
      { name:'sentiment', type:'string', desc:'Positive / Neutral / Negative (computed)', computed:true },
      { name:'buyer_risk', type:'string', desc:'Champion / Ghost / Churn Risk (computed)', computed:true },
      { name:'next_action', type:'string', desc:'AI-extracted next step', computed:true },
      { name:'occurred_at', type:'timestamp', desc:'Interaction timestamp' },
    ]},
  { id:'ticket', label:'Ticket', cat:'support', definition:'A customer support request. Tracks priority, status, sentiment, and churn risk derived from ticket content.', sources:['Support Portal'],
    props:[
      { name:'ticket_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'contact_id', type:'uuid', desc:'FK → Contact', fk:true },
      { name:'title', type:'string', desc:'Ticket summary' },
      { name:'status', type:'enum', desc:'Open / In Progress / Resolved / Closed' },
      { name:'priority', type:'enum', desc:'P1 / P2 / P3 / P4' },
      { name:'type', type:'enum', desc:'Bug / Feature / Question / Billing' },
      { name:'sentiment', type:'string', desc:'Customer sentiment (AI)', computed:true },
      { name:'churn_risk', type:'string', desc:'Churn risk indicator (computed)', computed:true },
      { name:'resolved_at', type:'timestamp', desc:'Resolution timestamp' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'incident', label:'Incident', cat:'support', definition:'A production incident or service disruption. Tracked for impact, resolution time, and customer exposure.', sources:['Support Portal','Monday'],
    props:[
      { name:'incident_id', type:'uuid', desc:'Primary key' },
      { name:'severity', type:'enum', desc:'SEV1 / SEV2 / SEV3' },
      { name:'title', type:'string', desc:'Incident description' },
      { name:'status', type:'enum', desc:'Investigating / Identified / Monitoring / Resolved' },
      { name:'affected_accounts', type:'string[]', desc:'Impacted account IDs' },
      { name:'started_at', type:'timestamp', desc:'Incident start' },
      { name:'resolved_at', type:'timestamp', desc:'Resolution timestamp' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'issue', label:'Issue', cat:'support', definition:'A tracked engineering or product issue linked to customer tickets and incidents.', sources:['Monday'],
    props:[
      { name:'issue_id', type:'uuid', desc:'Primary key' },
      { name:'title', type:'string', desc:'Issue title' },
      { name:'status', type:'enum', desc:'Open / In Progress / Done / Wont Fix' },
      { name:'priority', type:'enum', desc:'Critical / High / Medium / Low' },
      { name:'assignee_id', type:'string', desc:'Assigned engineer' },
      { name:'ticket_ids', type:'string[]', desc:'Linked ticket references' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'knowledge_article', label:'Knowledge Article', cat:'support', definition:'A support knowledge base article. Used to resolve tickets and train AI agents.', sources:['Support Portal','Product Docs'],
    props:[
      { name:'article_id', type:'uuid', desc:'Primary key' },
      { name:'title', type:'string', desc:'Article title' },
      { name:'status', type:'enum', desc:'Draft / Published / Archived' },
      { name:'category', type:'string', desc:'Article category' },
      { name:'views', type:'int', desc:'View count' },
      { name:'helpful_pct', type:'float', desc:'Helpful vote percentage' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'project', label:'Project', cat:'delivery', definition:'A professional services delivery project tied to an SOW. Tracks health, timeline, and budget.', sources:['Monday'],
    props:[
      { name:'project_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'sow_id', type:'uuid', desc:'FK → SOW', fk:true },
      { name:'name', type:'string', desc:'Project name' },
      { name:'status', type:'enum', desc:'Planning / In Progress / At Risk / Complete' },
      { name:'health', type:'string', desc:'Project health (AI computed)', computed:true },
      { name:'start_date', type:'date', desc:'Project start' },
      { name:'go_live_date', type:'date', desc:'Target go-live date' },
      { name:'owner_id', type:'string', desc:'Delivery owner' },
      { name:'budget', type:'decimal', desc:'Budget allocation' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'task', label:'Task', cat:'delivery', definition:'An atomic unit of work within a project. Tracks assignee, due date, and status.', sources:['Monday'],
    props:[
      { name:'task_id', type:'uuid', desc:'Primary key' },
      { name:'project_id', type:'uuid', desc:'FK → Project', fk:true },
      { name:'title', type:'string', desc:'Task description' },
      { name:'status', type:'enum', desc:'To Do / In Progress / Done / Blocked' },
      { name:'assignee_id', type:'string', desc:'Assigned team member' },
      { name:'due_date', type:'date', desc:'Task due date' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'milestone', label:'Milestone', cat:'delivery', definition:'A key delivery checkpoint within a project (e.g., kickoff, go-live, sign-off).', sources:['Monday'],
    props:[
      { name:'milestone_id', type:'uuid', desc:'Primary key' },
      { name:'project_id', type:'uuid', desc:'FK → Project', fk:true },
      { name:'name', type:'string', desc:'Milestone name' },
      { name:'target_date', type:'date', desc:'Target completion date' },
      { name:'status', type:'enum', desc:'Upcoming / At Risk / Complete / Missed' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'success_plan', label:'Success Plan', cat:'delivery', definition:'A structured customer success plan with objectives, KPIs, and progress tracking.', sources:['Google Drive'],
    props:[
      { name:'plan_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'objectives', type:'string[]', desc:'Customer objectives' },
      { name:'kpis', type:'string[]', desc:'Key performance indicators' },
      { name:'review_cadence', type:'enum', desc:'Monthly / Quarterly / Bi-annual' },
      { name:'health', type:'string', desc:'Plan health (computed)', computed:true },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'campaign', label:'Campaign', cat:'sales', definition:'A marketing campaign generating leads, tracking attribution, and measuring pipeline impact.', sources:['HubSpot'],
    props:[
      { name:'campaign_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Campaign name' },
      { name:'type', type:'enum', desc:'Email / Event / Paid / Content / Outbound' },
      { name:'status', type:'enum', desc:'Draft / Active / Paused / Completed' },
      { name:'budget', type:'decimal', desc:'Campaign budget' },
      { name:'leads_generated', type:'int', desc:'Total leads created' },
      { name:'pipeline_influenced', type:'decimal', desc:'Pipeline value influenced' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'competitor', label:'Competitor', cat:'sales', definition:'A competing vendor tracked across opportunities, win/loss analysis, and market signals.', sources:['Web','HubSpot'],
    props:[
      { name:'competitor_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Competitor name' },
      { name:'website', type:'string', desc:'Competitor domain' },
      { name:'win_rate_vs', type:'float', desc:'Our win rate when facing this competitor', computed:true },
      { name:'key_differentiators', type:'string[]', desc:'AI-extracted differentiators', computed:true },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  { id:'employee', label:'Employee', cat:'people', definition:'An internal team member — AE, CSM, SE, or delivery resource. Links to owned records and workload.', sources:['HubSpot'],
    props:[
      { name:'employee_id', type:'uuid', desc:'Primary key' },
      { name:'name', type:'string', desc:'Employee name' },
      { name:'email', type:'string', desc:'Work email', pii:true },
      { name:'role', type:'enum', desc:'AE / CSM / SE / Delivery / Support' },
      { name:'department', type:'string', desc:'Department name' },
      { name:'region', type:'enum', desc:'Geographic territory' },
      { name:'created_at', type:'timestamp', desc:'Record creation timestamp' },
    ]},
  // ── Derived nodes ──────────────────────────────────────────────────────────
  { id:'signal', label:'Signal', cat:'derived', definition:'A raw behavioral event from product usage, web, or engagement data. Feeds ML models and alert rules.', sources:['Product Usage','Apollo','Slack'],
    props:[
      { name:'signal_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'type', type:'enum', desc:'Usage / Intent / Engagement / Risk' },
      { name:'value', type:'float', desc:'Signal magnitude' },
      { name:'occurred_at', type:'timestamp', desc:'Event timestamp' },
    ]},
  { id:'risk', label:'Risk', cat:'derived', definition:'A computed risk record flagging churn, payment, or delivery risk for an account.', sources:[],
    props:[
      { name:'risk_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'type', type:'enum', desc:'Churn / Payment / Delivery / Engagement' },
      { name:'severity', type:'enum', desc:'High / Medium / Low' },
      { name:'reason', type:'string', desc:'AI-generated risk rationale', computed:true },
      { name:'detected_at', type:'timestamp', desc:'Detection timestamp' },
    ]},
  { id:'alert', label:'Alert', cat:'derived', definition:'A triggered notification based on a risk, SLO breach, or threshold crossing.', sources:[],
    props:[
      { name:'alert_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'type', type:'enum', desc:'Churn / Payment / Incident / Renewal' },
      { name:'message', type:'string', desc:'Alert message' },
      { name:'channel', type:'string', desc:'Delivery channel (Slack, email)' },
      { name:'triggered_at', type:'timestamp', desc:'Trigger timestamp' },
    ]},
  { id:'health_score', label:'Health Score', cat:'derived', definition:'A composite account health metric (0–100) computed from usage, engagement, support, and financial signals.', sources:[],
    props:[
      { name:'score_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'overall', type:'float', desc:'Overall health (0–100)' },
      { name:'usage_score', type:'float', desc:'Usage dimension score' },
      { name:'engagement_score', type:'float', desc:'Engagement dimension score' },
      { name:'support_score', type:'float', desc:'Support dimension score' },
      { name:'financial_score', type:'float', desc:'Financial dimension score' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'lead_score', label:'Lead Score', cat:'derived', definition:'A fit + intent composite score for a Lead, combining ICP match, firmographic signals, and behavioral intent data.', sources:[],
    props:[
      { name:'score_id', type:'uuid', desc:'Primary key' },
      { name:'lead_id', type:'uuid', desc:'FK → Lead', fk:true },
      { name:'fit_score', type:'float', desc:'ICP fit dimension' },
      { name:'intent_score', type:'float', desc:'Behavioral intent dimension' },
      { name:'combined_score', type:'float', desc:'Weighted composite' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'forecast', label:'Forecast', cat:'derived', definition:'An AI-generated revenue forecast for a time period, synthesizing pipeline stage, deal health, and historical win rates.', sources:[],
    props:[
      { name:'forecast_id', type:'uuid', desc:'Primary key' },
      { name:'period', type:'string', desc:'Forecast period (Q1 2026, etc.)' },
      { name:'committed', type:'decimal', desc:'Committed forecast' },
      { name:'best_case', type:'decimal', desc:'Best-case forecast' },
      { name:'ai_prediction', type:'decimal', desc:'AI model prediction' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'churn_prediction', label:'Churn Prediction', cat:'derived', definition:'An ML model output predicting probability and timing of customer churn for a given account.', sources:[],
    props:[
      { name:'prediction_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'probability', type:'float', desc:'Churn probability (0–1)' },
      { name:'predicted_churn_date', type:'date', desc:'Estimated churn date' },
      { name:'top_signals', type:'string[]', desc:'Top contributing signals' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'expansion_opportunity', label:'Expansion Opportunity', cat:'derived', definition:'A derived record identifying upsell or cross-sell potential for an existing customer.', sources:[],
    props:[
      { name:'expansion_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'type', type:'enum', desc:'Upsell / Cross-sell / Seat Expansion' },
      { name:'estimated_arr', type:'decimal', desc:'Estimated expansion ARR' },
      { name:'confidence', type:'float', desc:'Model confidence (0–1)' },
      { name:'top_signals', type:'string[]', desc:'Supporting signals' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'sentiment', label:'Sentiment', cat:'derived', definition:'Aggregated sentiment score across all interactions for an account over a rolling time window.', sources:[],
    props:[
      { name:'sentiment_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'score', type:'float', desc:'Sentiment score (-1 to +1)' },
      { name:'trend', type:'enum', desc:'Improving / Stable / Declining' },
      { name:'sample_size', type:'int', desc:'Number of interactions analyzed' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'insight', label:'Insight', cat:'derived', definition:'A natural language insight generated by an AI agent, surfacing patterns and recommendations from the graph.', sources:[],
    props:[
      { name:'insight_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'type', type:'enum', desc:'Risk / Opportunity / Anomaly / Trend' },
      { name:'text', type:'string', desc:'Human-readable insight' },
      { name:'confidence', type:'float', desc:'Model confidence' },
      { name:'generated_at', type:'timestamp', desc:'Generation timestamp' },
    ]},
  { id:'battlecard', label:'Battlecard', cat:'derived', definition:'AI-synthesized competitive battlecard for a specific opportunity and competitor combination.', sources:[],
    props:[
      { name:'battlecard_id', type:'uuid', desc:'Primary key' },
      { name:'opportunity_id', type:'uuid', desc:'FK → Opportunity', fk:true },
      { name:'competitor_id', type:'uuid', desc:'FK → Competitor', fk:true },
      { name:'strengths', type:'string[]', desc:'Our differentiators' },
      { name:'objections', type:'string[]', desc:'Expected objections + rebuttals' },
      { name:'generated_at', type:'timestamp', desc:'Generation timestamp' },
    ]},
  { id:'win_probability', label:'Win Probability', cat:'derived', definition:'ML-computed probability of winning an opportunity, factoring stage, engagement, and historical data.', sources:[],
    props:[
      { name:'wp_id', type:'uuid', desc:'Primary key' },
      { name:'opportunity_id', type:'uuid', desc:'FK → Opportunity', fk:true },
      { name:'probability', type:'float', desc:'Win probability (0–1)' },
      { name:'confidence', type:'float', desc:'Model confidence' },
      { name:'key_factors', type:'string[]', desc:'Top contributing factors' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
  { id:'lifetime_value', label:'Lifetime Value', cat:'derived', definition:'Predicted customer lifetime value combining expansion signals, historical ARR, and churn probability.', sources:[],
    props:[
      { name:'ltv_id', type:'uuid', desc:'Primary key' },
      { name:'account_id', type:'uuid', desc:'FK → Account', fk:true },
      { name:'predicted_ltv', type:'decimal', desc:'Predicted lifetime value (USD)' },
      { name:'current_arr', type:'decimal', desc:'Current ARR baseline' },
      { name:'expansion_potential', type:'decimal', desc:'Estimated expansion' },
      { name:'computed_at', type:'timestamp', desc:'Computation timestamp' },
    ]},
]

const SOURCES_DATA = [
  { id:'hubspot',     label:'HubSpot',         color:C.teal, description:'CRM of record for leads, contacts, accounts, opportunities, and marketing campaigns. Streams events via webhooks in real time.', feeds:['Account','Contact','Lead','Opportunity','Campaign','Renewal','Proposal'], writesBack:true, syncFreq:'Streaming' },
  { id:'netsuite',    label:'NetSuite ERP',     color:C.gold, description:'Financial system of record for billing, subscriptions, payments, and orders. Incremental sync on 1-hour cadence.', feeds:['Invoice','Payment','Subscription','Renewal','Order'], writesBack:false, syncFreq:'Hourly' },
  { id:'monday',      label:'Monday.com',       color:C.coral, description:'Delivery and project management platform. Tracks projects, tasks, milestones, issues, and incidents.', feeds:['Project','Task','Milestone','Issue','Incident'], writesBack:true, syncFreq:'Every 30m' },
  { id:'googledrive', label:'Google Drive',     color:C.blue, description:'Document store for contracts, SOWs, proposals, policies, and case studies. AI agents extract structured data from unstructured docs.', feeds:['Contract','SOW','Proposal','Knowledge Article','Success Plan'], writesBack:false, syncFreq:'Every 6h' },
  { id:'support',     label:'Support Portal',   color:C.coral, description:'Proprietary support portal for ticket and incident management. Streams new tickets and resolution events in real time.', feeds:['Ticket','Incident','Knowledge Article'], writesBack:true, syncFreq:'Streaming' },
  { id:'gmail',       label:'Gmail',            color:C.coral, description:'Sales and success email threads. AI extracts summaries, sentiment, risk signals, and next actions from each thread.', feeds:['Interaction'], writesBack:false, syncFreq:'Every 1h' },
  { id:'gcal',        label:'Google Calendar',  color:C.blue, description:'Meeting and QBR events. AI processes calendar event metadata and agenda notes into structured Interaction records.', feeds:['Interaction'], writesBack:false, syncFreq:'Every 1h' },
  { id:'slack',       label:'Slack',            color:C.purple, description:'Internal team comms. AI monitors designated channels for decisions, incidents, alerts, and deal signals in real time.', feeds:['Interaction','Signal','Alert'], writesBack:true, syncFreq:'Streaming' },
  { id:'productusage',label:'Product Usage DB', color:C.green, description:'PostgreSQL analytics DB capturing feature adoption, session data, and account-level signals. Feeds churn and expansion models.', feeds:['Signal','Interaction'], writesBack:false, syncFreq:'Streaming' },
  { id:'productdocs', label:'Product Docs',     color:C.teal, description:'Product documentation site. AI indexes articles to power deflection and train KB agents.', feeds:['Knowledge Article'], writesBack:false, syncFreq:'Daily' },
  { id:'apollo',      label:'Apollo',           color:C.blue, description:'Sales intelligence platform for account enrichment, contact data, and intent signals from third-party data.', feeds:['Account','Contact','Lead','Signal'], writesBack:false, syncFreq:'Daily' },
  { id:'web',         label:'Web / Market Intel',color:C.gray, description:'Web crawler ingesting competitor pages, news articles, and market signals for competitive intelligence.', feeds:['Competitor','Signal'], writesBack:false, syncFreq:'Daily' },
  { id:'docusign',    label:'DocuSign',         color:C.blue, description:'eSignature platform. Contract execution events trigger real-time updates to Contract status and extract risk flags via AI.', feeds:['Contract'], writesBack:false, syncFreq:'Real time' },
]

const EDGES_DATA = [
  { s:'account',    t:'contact',            label:'HAS_CONTACT',         kind:'direct',   stage:'All', description:'An account has many contacts at various roles.' },
  { s:'account',    t:'opportunity',        label:'HAS_OPPORTUNITY',     kind:'direct',   stage:'3–8', description:'Open deals tied to this account.' },
  { s:'account',    t:'subscription',       label:'OWNS',                kind:'direct',   stage:'9–11', description:'Active subscription records under this account.' },
  { s:'account',    t:'contract',           label:'SIGNED',              kind:'direct',   stage:'8–9', description:'Executed legal contracts.' },
  { s:'account',    t:'invoice',            label:'BILLED_VIA',          kind:'direct',   stage:'9–11', description:'Billing invoices issued to the account.' },
  { s:'account',    t:'ticket',             label:'RAISED',              kind:'direct',   stage:'All', description:'Support tickets raised by this account.' },
  { s:'account',    t:'interaction',        label:'TOUCHED_BY',          kind:'direct',   stage:'All', description:'All touchpoints associated with this account.' },
  { s:'account',    t:'health_score',       label:'SCORED_BY',           kind:'inferred', stage:'All', description:'Composite health score computed for this account.' },
  { s:'account',    t:'churn_prediction',   label:'HAS_CHURN_PREDICTION',kind:'inferred', stage:'All', description:'ML-computed churn probability.' },
  { s:'account',    t:'risk',               label:'HAS_RISK',            kind:'inferred', stage:'All', description:'Active risk records flagging this account.' },
  { s:'account',    t:'expansion_opportunity',label:'HAS_EXPANSION',    kind:'inferred', stage:'10–11', description:'Identified upsell/cross-sell opportunities.' },
  { s:'account',    t:'lifetime_value',     label:'HAS_LTV',             kind:'inferred', stage:'All', description:'Predicted customer lifetime value.' },
  { s:'account',    t:'sentiment',          label:'HAS_SENTIMENT',       kind:'inferred', stage:'All', description:'Aggregated sentiment across all interactions.' },
  { s:'account',    t:'insight',            label:'HAS_INSIGHT',         kind:'inferred', stage:'All', description:'AI-generated insights surfaced for this account.' },
  { s:'contact',    t:'opportunity',        label:'DECIDES_ON',          kind:'direct',   stage:'3–8', description:'A contact plays a role in the buying decision.' },
  { s:'contact',    t:'interaction',        label:'PARTICIPATED_IN',     kind:'direct',   stage:'All', description:'Interactions this contact was part of.' },
  { s:'contact',    t:'lead_score',         label:'HAS_LEAD_SCORE',      kind:'inferred', stage:'1–3', description:'Computed lead/engagement score for this contact.' },
  { s:'lead',       t:'opportunity',        label:'BECOMES',             kind:'direct',   stage:'2–3', description:'A qualified lead converts into an opportunity.' },
  { s:'lead',       t:'lead_score',         label:'SCORED_BY',           kind:'inferred', stage:'1–2', description:'Fit + intent score computed for this lead.' },
  { s:'opportunity',t:'contract',           label:'RESULTS_IN',          kind:'direct',   stage:'8',   description:'A won opportunity results in a signed contract.' },
  { s:'opportunity',t:'proposal',           label:'INCLUDES',            kind:'direct',   stage:'4–7', description:'Proposals sent as part of this opportunity.' },
  { s:'opportunity',t:'win_probability',    label:'HAS_WIN_PROB',        kind:'inferred', stage:'4–8', description:'AI-computed win probability.' },
  { s:'opportunity',t:'battlecard',         label:'HAS_BATTLECARD',      kind:'inferred', stage:'5–7', description:'AI-generated competitive battlecard.' },
  { s:'opportunity',t:'competitor',         label:'COMPETES_WITH',       kind:'direct',   stage:'4–8', description:'Competitors identified in this deal.' },
  { s:'subscription',t:'invoice',           label:'BILLED_BY',           kind:'direct',   stage:'9–11', description:'Invoices generated for this subscription cycle.' },
  { s:'subscription',t:'renewal',           label:'HAS_RENEWAL',         kind:'direct',   stage:'11',  description:'Upcoming renewal event for this subscription.' },
  { s:'contract',   t:'subscription',       label:'GOVERNS',             kind:'direct',   stage:'9',   description:'A contract governs the terms of a subscription.' },
  { s:'contract',   t:'sow',                label:'INCLUDES_SOW',        kind:'direct',   stage:'9',   description:'A professional services SOW attached to contract.' },
  { s:'invoice',    t:'payment',            label:'SETTLED_BY',          kind:'direct',   stage:'9–11', description:'Payment records settling this invoice.' },
  { s:'renewal',    t:'subscription',       label:'RENEWS',              kind:'direct',   stage:'11',  description:'A renewal event extends this subscription.' },
  { s:'renewal',    t:'expansion_opportunity',label:'MAY_EXPAND',        kind:'inferred', stage:'11',  description:'Renewal may include expansion upsell.' },
  { s:'ticket',     t:'incident',           label:'ESCALATES_TO',        kind:'direct',   stage:'All', description:'A ticket escalates into a production incident.' },
  { s:'ticket',     t:'knowledge_article',  label:'RESOLVED_BY',         kind:'direct',   stage:'All', description:'A ticket is resolved using a KB article.' },
  { s:'knowledge_article',t:'ticket',       label:'RESOLVES',            kind:'direct',   stage:'All', description:'An article is applied to resolve a ticket.' },
  { s:'issue',      t:'incident',           label:'LINKED_TO',           kind:'direct',   stage:'All', description:'An engineering issue is linked to an incident.' },
  { s:'project',    t:'task',               label:'HAS_TASK',            kind:'direct',   stage:'10',  description:'A project has many granular tasks.' },
  { s:'project',    t:'milestone',          label:'HAS_MILESTONE',       kind:'direct',   stage:'10',  description:'A project has key delivery milestones.' },
  { s:'project',    t:'sow',                label:'DELIVERS_ON',         kind:'direct',   stage:'9–10', description:'Project executes the scope defined in an SOW.' },
  { s:'interaction',t:'opportunity',        label:'INFORMS',             kind:'agent',    stage:'3–8', description:'AI extracts deal signals from this interaction.' },
  { s:'interaction',t:'risk',               label:'TRIGGERS_RISK',       kind:'inferred', stage:'All', description:'A negative interaction triggers a risk record.' },
  { s:'interaction',t:'sentiment',          label:'CONTRIBUTES_TO',      kind:'inferred', stage:'All', description:'Each interaction contributes to account sentiment.' },
  { s:'employee',   t:'opportunity',        label:'OWNS_DEAL',           kind:'direct',   stage:'3–11', description:'An AE owns and drives this opportunity.' },
  { s:'employee',   t:'project',            label:'STAFFS',              kind:'direct',   stage:'10',  description:'An employee is staffed on a delivery project.' },
  { s:'employee',   t:'account',            label:'MANAGES',             kind:'direct',   stage:'All', description:'A CSM manages this account relationship.' },
  { s:'signal',     t:'account',            label:'OBSERVED_ON',         kind:'direct',   stage:'All', description:'A behavioral signal observed for this account.' },
  { s:'signal',     t:'churn_prediction',   label:'FEEDS_CHURN_MODEL',   kind:'inferred', stage:'All', description:'Signal feeds the churn prediction model.' },
  { s:'signal',     t:'expansion_opportunity',label:'FEEDS_EXPANSION',   kind:'inferred', stage:'All', description:'Signal feeds the expansion opportunity model.' },
  { s:'campaign',   t:'lead',               label:'GENERATES',           kind:'direct',   stage:'1–2', description:'A campaign generates leads into the funnel.' },
  { s:'competitor', t:'opportunity',        label:'COMPETES_IN',         kind:'direct',   stage:'4–8', description:'A competitor appears in this deal.' },
  { s:'health_score',t:'alert',             label:'TRIGGERS_ALERT',      kind:'inferred', stage:'All', description:'A low health score triggers a risk alert.' },
  { s:'risk',       t:'alert',              label:'GENERATES_ALERT',     kind:'inferred', stage:'All', description:'A risk record generates a notification alert.' },
]

const DERIVED_DATA = [
  {
    id:'health_score', label:'Health Score', cat:'derived',
    definition:'Composite 0–100 score combining product usage (30%), engagement quality (25%), support ticket load (20%), financial health (15%), and NPS proxy (10%).',
    inputs:['Signal (usage)','Ticket','Interaction','Invoice','Subscription'],
    outputs:['Account.health_score','Alert (low health)','Risk'],
    fields:[
      { name:'overall', type:'float', desc:'Composite health (0–100)' },
      { name:'usage_score', type:'float', desc:'Product usage dimension' },
      { name:'engagement_score', type:'float', desc:'Interaction quality dimension' },
      { name:'support_score', type:'float', desc:'Support load dimension' },
      { name:'financial_score', type:'float', desc:'Payment/ARR dimension' },
    ]
  },
  {
    id:'churn_prediction', label:'Churn Prediction', cat:'derived',
    definition:'Gradient-boosted model predicting churn probability within 90 days, trained on historical churned accounts. Updates nightly.',
    inputs:['Signal','Health Score','Ticket','Interaction','Subscription'],
    outputs:['Account.churn_probability','Risk (churn)','Alert'],
    fields:[
      { name:'probability', type:'float', desc:'Churn probability (0–1)' },
      { name:'predicted_churn_date', type:'date', desc:'Estimated churn date' },
      { name:'top_signals', type:'string[]', desc:'Key contributing signals' },
      { name:'model_version', type:'string', desc:'Model version tag' },
    ]
  },
  {
    id:'lead_score', label:'Lead Score', cat:'derived',
    definition:'Weighted combination of ICP fit (firmographic match) and behavioral intent (third-party signals, web activity, email engagement).',
    inputs:['Lead','Signal (intent)','Account (firmographic)'],
    outputs:['Lead.fit_score','Lead.intent_score','Contact.lead_score'],
    fields:[
      { name:'fit_score', type:'float', desc:'ICP fit dimension' },
      { name:'intent_score', type:'float', desc:'Buying intent dimension' },
      { name:'combined_score', type:'float', desc:'Weighted composite' },
    ]
  },
  {
    id:'win_probability', label:'Win Probability', cat:'derived',
    definition:'Logistic regression model predicting deal win probability from stage velocity, engagement depth, champion presence, and competitive landscape.',
    inputs:['Opportunity','Interaction','Contact','Competitor'],
    outputs:['Opportunity.win_probability','Forecast'],
    fields:[
      { name:'probability', type:'float', desc:'Win probability (0–1)' },
      { name:'confidence', type:'float', desc:'Model confidence' },
      { name:'key_factors', type:'string[]', desc:'Top contributing factors' },
    ]
  },
  {
    id:'forecast', label:'Forecast', cat:'derived',
    definition:'Revenue forecast synthesizing pipeline coverage, stage-weighted win rates, and AI deal health to produce committed and best-case scenarios.',
    inputs:['Opportunity','Win Probability','Subscription','Renewal'],
    outputs:['Forecast record','Dashboard KPIs'],
    fields:[
      { name:'committed', type:'decimal', desc:'Committed forecast' },
      { name:'best_case', type:'decimal', desc:'Best-case scenario' },
      { name:'ai_prediction', type:'decimal', desc:'AI model prediction' },
      { name:'pipeline_coverage', type:'float', desc:'Coverage ratio' },
    ]
  },
  {
    id:'expansion_opportunity', label:'Expansion Opportunity', cat:'derived',
    definition:'Identifies upsell and cross-sell potential using seat utilization, feature adoption gaps, and peer benchmarking signals.',
    inputs:['Signal (usage)','Subscription','Account','Interaction'],
    outputs:['Expansion Opportunity record','Account.expansion_signal','Alert'],
    fields:[
      { name:'type', type:'enum', desc:'Upsell / Cross-sell / Seat Expansion' },
      { name:'estimated_arr', type:'decimal', desc:'Estimated incremental ARR' },
      { name:'confidence', type:'float', desc:'Model confidence' },
      { name:'top_signals', type:'string[]', desc:'Supporting evidence' },
    ]
  },
  {
    id:'sentiment', label:'Sentiment', cat:'derived',
    definition:'Rolling 30-day sentiment aggregation across all Interaction records for an account. Uses BERT-based classifier fine-tuned on B2B SaaS comms.',
    inputs:['Interaction (email/meeting/Slack)'],
    outputs:['Account.sentiment','Risk (negative trend)','Health Score'],
    fields:[
      { name:'score', type:'float', desc:'Sentiment score (-1 to +1)' },
      { name:'trend', type:'enum', desc:'Improving / Stable / Declining' },
      { name:'sample_size', type:'int', desc:'Interactions analyzed' },
    ]
  },
  {
    id:'risk', label:'Risk', cat:'derived',
    definition:'Synthesized risk record combining churn model output, payment delinquency, low engagement, and escalated ticket patterns.',
    inputs:['Churn Prediction','Invoice','Ticket','Sentiment','Signal'],
    outputs:['Alert','Account.risk_tier','Insight'],
    fields:[
      { name:'type', type:'enum', desc:'Churn / Payment / Delivery / Engagement' },
      { name:'severity', type:'enum', desc:'High / Medium / Low' },
      { name:'reason', type:'string', desc:'AI-generated rationale' },
    ]
  },
  {
    id:'alert', label:'Alert', cat:'derived',
    definition:'Event-driven notification triggered by risk records, SLO breaches, or threshold crossings. Delivered to Slack, email, or in-app.',
    inputs:['Risk','Health Score','Renewal','Incident'],
    outputs:['Slack notification','Email digest','In-app alert'],
    fields:[
      { name:'type', type:'enum', desc:'Churn / Payment / Incident / Renewal' },
      { name:'message', type:'string', desc:'Alert message body' },
      { name:'channel', type:'string', desc:'Delivery channel' },
    ]
  },
  {
    id:'insight', label:'Insight', cat:'derived',
    definition:'Natural language insight generated by an LLM agent summarizing patterns, risks, and opportunities detected across the graph.',
    inputs:['Risk','Expansion Opportunity','Sentiment','Interaction','Signal'],
    outputs:['Account insight feed','Weekly digest','Deal briefs'],
    fields:[
      { name:'type', type:'enum', desc:'Risk / Opportunity / Anomaly / Trend' },
      { name:'text', type:'string', desc:'Human-readable insight' },
      { name:'confidence', type:'float', desc:'Model confidence' },
    ]
  },
  {
    id:'battlecard', label:'Battlecard', cat:'derived',
    definition:'AI-synthesized competitive battlecard for a specific opportunity and competitor, pulling from web intel, win/loss data, and interaction notes.',
    inputs:['Competitor','Interaction','Opportunity','Knowledge Article'],
    outputs:['Opportunity.battlecard','Sales rep briefing'],
    fields:[
      { name:'strengths', type:'string[]', desc:'Our differentiators' },
      { name:'objections', type:'string[]', desc:'Objections + rebuttals' },
      { name:'proof_points', type:'string[]', desc:'Customer proof points' },
    ]
  },
  {
    id:'lifetime_value', label:'Lifetime Value', cat:'derived',
    definition:'Predicted customer LTV combining current ARR, expected expansion, tenure probability, and churn risk discount.',
    inputs:['Account','Subscription','Expansion Opportunity','Churn Prediction'],
    outputs:['Account.predicted_ltv','Segmentation','Prioritization'],
    fields:[
      { name:'predicted_ltv', type:'decimal', desc:'Predicted LTV (USD)' },
      { name:'current_arr', type:'decimal', desc:'Baseline ARR' },
      { name:'expansion_potential', type:'decimal', desc:'Estimated expansion' },
      { name:'discount_rate', type:'float', desc:'Churn-risk discount' },
    ]
  },
  {
    id:'signal', label:'Signal', cat:'derived',
    definition:'Raw behavioral events from product usage, third-party intent, web crawls, and Slack patterns. Foundation for all ML models.',
    inputs:['Product Usage DB','Apollo','Web','Slack'],
    outputs:['Churn Prediction','Lead Score','Expansion Opportunity','Health Score'],
    fields:[
      { name:'type', type:'enum', desc:'Usage / Intent / Engagement / Risk' },
      { name:'value', type:'float', desc:'Signal magnitude' },
      { name:'source', type:'string', desc:'Originating system' },
    ]
  },
]

const CEP_STAGES = [
  { id:1,  name:'Educate',        color:'#6366f1', description:'Create awareness through content marketing, thought leadership, and outbound. Populate the top of funnel with qualified leads.', entities:['Campaign','Lead','Signal','Competitor'], useCases:[
    { title:'ICP Lead Scoring', badge:'RUN', desc:'Auto-score inbound leads against ICP criteria using Apollo firmographic data and product usage signals.' },
    { title:'Content Attribution', badge:'ACT', desc:'Attribute pipeline to campaigns by linking Lead.source to Opportunity records.' },
    { title:'Competitive Intel Brief', badge:'THINK', desc:'AI generates a competitor brief when a lead mentions a rival in their first interaction.' },
  ]},
  { id:2,  name:'Engage',         color:'#8b5cf6', description:'Outbound and inbound qualification touchpoints. SDR cadences, LinkedIn outreach, and first discovery calls.', entities:['Lead','Contact','Interaction','Signal','Campaign'], useCases:[
    { title:'SDR Outreach Prioritization', badge:'RUN', desc:'Rank leads by combined fit + intent score to focus SDR time on the highest-probability targets.' },
    { title:'Engagement Sentiment Tracking', badge:'THINK', desc:'Monitor email reply sentiment to detect champion engagement vs. ghosting risk.' },
    { title:'Auto-Sequence Trigger', badge:'ACT', desc:'Trigger outreach sequence when a lead shows high intent signal from product docs visit.' },
  ]},
  { id:3,  name:'Learn / Define', color:'#7c3aed', description:'Discovery calls to understand the customer problem, buying process, and success criteria.', entities:['Opportunity','Contact','Interaction','Account'], useCases:[
    { title:'Discovery Brief Auto-Draft', badge:'THINK', desc:'AI drafts a discovery brief from LinkedIn + Apollo data before the first call.' },
    { title:'Stakeholder Map', badge:'THINK', desc:'Generate a stakeholder map from Interaction and Contact records, flagging missing economic buyer.' },
    { title:'MEDDPICC Capture', badge:'ACT', desc:'Extract MEDDPICC fields from call notes and email summaries into Opportunity properties.' },
  ]},
  { id:4,  name:'Show / Evaluate',color:'#2563eb', description:'Product demonstrations and hands-on evaluation. POC/pilot scoping and evaluation criteria alignment.', entities:['Opportunity','Interaction','Competitor','Proposal','Signal'], useCases:[
    { title:'Demo Customization Brief', badge:'THINK', desc:'Generate a tailored demo script combining buyer persona, use case, and product usage gap data.' },
    { title:'Battlecard Trigger', badge:'ACT', desc:'Auto-generate a competitive battlecard when a competitor is logged on an opportunity.' },
    { title:'POC Success Criteria Tracker', badge:'ACT', desc:'Track POC criteria completion and flag risks to SE and AE teams.' },
  ]},
  { id:5,  name:'Align',          color:'#0284c7', description:'Align on solution, success criteria, and stakeholder consensus. Multi-threaded engagement with economic buyer.', entities:['Opportunity','Contact','Interaction','Proposal','Win Probability'], useCases:[
    { title:'Champion Health Monitor', badge:'THINK', desc:'Track champion engagement frequency and sentiment to detect ghosting risk.' },
    { title:'Executive Alignment Prompt', badge:'ACT', desc:'Trigger exec-to-exec outreach when economic buyer engagement drops below threshold.' },
    { title:'Success Criteria Alignment Doc', badge:'THINK', desc:'AI drafts success criteria alignment document from discovery and evaluation interactions.' },
  ]},
  { id:6,  name:'Technical Win',  color:'#0369a1', description:'Achieve sign-off from technical stakeholders, security, and IT. Complete security reviews and integration scoping.', entities:['Opportunity','Interaction','Employee','Contract','Proposal'], useCases:[
    { title:'Security Review Tracker', badge:'ACT', desc:'Track security questionnaire status and auto-escalate blockers to SE leadership.' },
    { title:'Integration Scope Brief', badge:'THINK', desc:'AI synthesizes integration requirements from technical call notes into a scope summary.' },
    { title:'Technical Champion Risk Alert', badge:'RUN', desc:'Alert when technical champion changes role or leaves the account.' },
  ]},
  { id:7,  name:'Business Win',   color:'#1e40af', description:'Achieve business-level approval and budget confirmation. Navigate legal and procurement.', entities:['Opportunity','Contact','Proposal','Contract','Interaction','Forecast'], useCases:[
    { title:'Forecast Risk Monitor', badge:'RUN', desc:'Flag opportunities where close date has slipped 2+ weeks without stage progression.' },
    { title:'Procurement Navigator', badge:'THINK', desc:'AI surfaces procurement process history for the account from past contract interactions.' },
    { title:'Business Case Auto-Draft', badge:'ACT', desc:'Generate a business case document from ROI model, use cases, and success criteria data.' },
  ]},
  { id:8,  name:'Paper Win',      color:'#1d4ed8', description:'Legal, procurement, and signature finalization. Contract negotiation and order form execution.', entities:['Contract','SOW','Proposal','DocuSign','Opportunity','Employee'], useCases:[
    { title:'Contract Risk Flagging', badge:'RUN', desc:'AI reviews contract against standard terms and flags non-standard clauses for legal review.' },
    { title:'Signature Status Tracker', badge:'ACT', desc:'Real-time DocuSign event tracking with auto-nudge when signature is pending > 48h.' },
    { title:'Redline Summarizer', badge:'THINK', desc:'Summarize contract redlines from legal review into plain-language executive summary.' },
  ]},
  { id:9,  name:'Closed Won',     color:'#2f6f43', description:'Deal closed. Transition from sales to delivery and success. Kickoff scheduling and onboarding initiation.', entities:['Account','Subscription','Contract','Invoice','Project','SOW','Employee'], useCases:[
    { title:'Kickoff Auto-Scheduler', badge:'RUN', desc:'Auto-create kickoff meeting and assign delivery team when Opportunity stage hits Closed Won.' },
    { title:'Success Plan Generator', badge:'THINK', desc:'AI drafts initial success plan from deal notes, SOW, and customer use case data.' },
    { title:'Handoff Brief', badge:'THINK', desc:'Generate AE-to-CSM handoff brief from all Interaction records and deal data.' },
  ]},
  { id:10, name:'Deliver',        color:'#b07a20', description:'Professional services delivery and product onboarding. Go-live execution, training, and adoption driving.', entities:['Project','Task','Milestone','SOW','Employee','Success Plan','Ticket'], useCases:[
    { title:'Project Health Monitor', badge:'RUN', desc:'Flag projects at risk based on milestone completion rate, budget burn, and ticket escalations.' },
    { title:'Go-Live Readiness Checklist', badge:'ACT', desc:'AI generates go-live readiness checklist from SOW deliverables and open task status.' },
    { title:'Adoption Signal Tracker', badge:'RUN', desc:'Track feature adoption signals from Product Usage DB against success plan KPIs.' },
  ]},
  { id:11, name:'Grow',           color:'#0d9488', description:'Customer growth through renewal, upsell, and expansion. QBR execution, health monitoring, and advocacy development.', entities:['Renewal','Subscription','Expansion Opportunity','Health Score','Interaction','Account'], useCases:[
    { title:'Renewal Risk Early Warning', badge:'RUN', desc:'Alert CSM 90 days pre-renewal when churn probability exceeds 30%.' },
    { title:'QBR Auto-Deck', badge:'THINK', desc:'AI generates QBR slide deck from usage, health, milestone, and ROI data.' },
    { title:'Expansion Signal to Pipeline', badge:'ACT', desc:'Auto-create Renewal/Expansion Opportunity when seat utilization > 85% and health > 70.' },
    { title:'Advocacy Identifier', badge:'THINK', desc:'Identify high-health champions as candidates for case studies, G2 reviews, and references.' },
  ]},
]

// ─── Graph layout helpers ─────────────────────────────────────────────────────
const PI2 = Math.PI * 2

function ringPos(cx, cy, r, total, i, offset = 0) {
  const angle = (PI2 / total) * i + offset - Math.PI / 2
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

const GRAPH_LAYOUT = (() => {
  const CX = 1100, CY = 720
  const sourceNames = SOURCES_DATA.map(s => s.id)
  const sourceNodes = sourceNames.map((id, i) => {
    const x = 100 + (2000 / (sourceNames.length - 1)) * i
    return { id, x, y: 80, r: 0, w: 130, h: 34, isSource: true }
  })

  const inner = ['contact','opportunity','subscription','contract','invoice','lead','interaction']
  const middle = ['ticket','project','sow','proposal','payment','order','renewal','campaign','employee','competitor','issue']
  const outer = ['task','milestone','knowledge_article','incident','success_plan','battlecard','health_score','signal','risk']

  const coreNodes = [
    { id:'account', x:CX, y:CY, r:50, isAccount:true },
    ...inner.map((id,i) => { const p = ringPos(CX,CY,230,inner.length,i); return { id, x:p.x, y:p.y, r:24 } }),
    ...middle.map((id,i) => { const p = ringPos(CX,CY,410,middle.length,i,-0.3); return { id, x:p.x, y:p.y, r:20 } }),
    ...outer.map((id,i) => { const p = ringPos(CX,CY,580,outer.length,i,0.2); return { id, x:p.x, y:p.y, r:17 } }),
  ]

  const derivedIds = ['alert','churn_prediction','expansion_opportunity','forecast','win_probability','sentiment','insight','lead_score','lifetime_value']
  const derivedNodes = derivedIds.map((id, i) => {
    const x = 100 + (2000 / (derivedIds.length - 1)) * i
    return { id, x, y: 1330, r: 22 }
  })

  const allNodes = [...sourceNodes, ...coreNodes, ...derivedNodes]
  const nodeMap = {}
  allNodes.forEach(n => { nodeMap[n.id] = n })
  return { allNodes, nodeMap, CX, CY }
})()

// ─── Sub-components ───────────────────────────────────────────────────────────
function CatBadge({ cat, small }) {
  const s = CAT_STYLE[cat] || CAT_STYLE.core
  return (
    <span style={{ fontFamily:'var(--mono)', fontSize: small ? 10 : 11.5, color: s.color, border:`1px solid ${s.border}`, background: s.bg, padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

function Chip({ label, color, bg, border }) {
  return (
    <span style={{ fontFamily:'var(--mono)', fontSize:11, color: color||C.ink2, background: bg||'#f3f4f6', border:`1px solid ${border||'#e5e7eb'}`, padding:'2px 8px', borderRadius:5, whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function Badge({ label, type }) {
  const styles = {
    THINK: { color:'#7c3aed', bg:'#ede9fc', border:'#d4c9f8' },
    ACT:   { color:'#3b6fd4', bg:'#e6edfa', border:'#c4d5f5' },
    RUN:   { color:'#2f6f43', bg:'#eef4ee', border:'#d6e6d8' },
  }
  const s = styles[type] || styles.THINK
  return (
    <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:s.color, background:s.bg, border:`1px solid ${s.border}`, padding:'2px 7px', borderRadius:4 }}>
      {label}
    </span>
  )
}

// ─── Graph Tab ────────────────────────────────────────────────────────────────
function GraphTab() {
  const svgRef = useRef(null)
  const dragRef = useRef({ active:false, startX:0, startY:0, ox:0, oy:0 })
  const [vp, setVp] = useState({ x:0, y:0, scale:0.48 })
  const [hoveredNode, setHoveredNode] = useState(null)
  const [showSources, setShowSources] = useState(true)

  const entityMap = useMemo(() => {
    const m = {}
    ENTITIES.forEach(e => { m[e.id] = e })
    return m
  }, [])

  function onMouseDown(e) {
    if (e.button !== 0) return
    dragRef.current = { active:true, startX:e.clientX, startY:e.clientY, ox:vp.x, oy:vp.y }
    e.currentTarget.style.cursor = 'grabbing'
  }
  function onMouseMove(e) {
    const d = dragRef.current
    if (!d.active) return
    setVp(v => ({ ...v, x: d.ox + (e.clientX - d.startX), y: d.oy + (e.clientY - d.startY) }))
  }
  function onMouseUp(e) {
    dragRef.current.active = false
    e.currentTarget.style.cursor = 'grab'
  }
  function onWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setVp(v => ({ ...v, scale: Math.max(0.15, Math.min(3, v.scale * delta)) }))
  }
  function onDblClick() {
    setVp({ x:0, y:0, scale:0.48 })
  }

  const { allNodes, nodeMap, CX, CY } = GRAPH_LAYOUT

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={{ padding:'8px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #efece6', background:'#FEFDFB' }}>
        <span style={{ fontSize:12, color:C.ink3 }}>Drag to pan · Scroll to zoom · Double-click to reset</span>
        <div style={{ flex:1 }} />
        <button onClick={() => setShowSources(s=>!s)} style={{ fontFamily:'var(--sans)', fontSize:12, padding:'4px 12px', borderRadius:7, border:'1px solid #e3ddd1', background:'#fff', cursor:'pointer', color:C.ink2, transition:'background .15s' }}
          onMouseOver={e=>e.currentTarget.style.background='#faf8f3'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
          {showSources ? 'Hide Sources' : 'Show Sources'}
        </button>
      </div>
      <div ref={svgRef} style={{ flex:1, overflow:'hidden', cursor:'grab', background:'#fcfbf7', position:'relative' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel} onDoubleClick={onDblClick}>
        <svg width="100%" height="100%" viewBox={`0 0 2200 1440`} preserveAspectRatio="xMidYMid meet"
          style={{ transform:`translate(${vp.x}px,${vp.y}px) scale(${vp.scale})`, transformOrigin:'center center', transition:'transform 0.05s linear', userSelect:'none', display:'block' }}>
          <defs>
            <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#c4bfb4" />
            </marker>
            <marker id="arrow-purple" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill={C.purple} opacity="0.4" />
            </marker>
            <marker id="arrow-teal" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill={C.teal} opacity="0.5" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Source → entity edges */}
          {showSources && SOURCES_DATA.map(src => {
            const sn = nodeMap[src.id]
            if (!sn) return null
            return src.feeds.map(fed => {
              const feedId = fed.toLowerCase().replace(/\s+/g,'_')
              const tn = nodeMap[feedId]
              if (!tn) return null
              return (
                <line key={`${src.id}-${feedId}`}
                  x1={sn.x} y1={sn.y + 17} x2={tn.x} y2={tn.y - (tn.r||20)}
                  stroke={C.teal} strokeWidth="1.2" strokeDasharray="5,4" opacity="0.4" markerEnd="url(#arrow-teal)" />
              )
            })
          })}

          {/* Entity → entity edges */}
          {EDGES_DATA.slice(0,30).map((e,i) => {
            const sn = nodeMap[e.s], tn = nodeMap[e.t]
            if (!sn || !tn || sn.isSource || tn.isSource) return null
            const derived = (entityMap[e.s]?.cat === 'derived' || entityMap[e.t]?.cat === 'derived')
            return (
              <line key={i} x1={sn.x} y1={sn.y} x2={tn.x} y2={tn.y}
                stroke={derived ? C.purple : '#c4bfb4'} strokeWidth={derived ? '1.2':'1'}
                strokeDasharray={derived ? '4,4':'none'} opacity={derived ? 0.45 : 0.6}
                markerEnd={derived ? 'url(#arrow-purple)':'url(#arrow)'} />
            )
          })}

          {/* Source nodes */}
          {showSources && SOURCES_DATA.map(src => {
            const n = nodeMap[src.id]
            if (!n) return null
            const cat = CAT_STYLE.source
            const hov = hoveredNode === src.id
            return (
              <g key={src.id} onMouseEnter={()=>setHoveredNode(src.id)} onMouseLeave={()=>setHoveredNode(null)} style={{ cursor:'pointer' }}>
                <rect x={n.x - 65} y={n.y - 17} width={130} height={34} rx={6}
                  fill={hov ? C.tealBg : '#fff'} stroke={hov ? C.teal : C.tealBd} strokeWidth={hov?1.5:1} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fill={C.teal} fontFamily="var(--mono)" fontSize={11} fontWeight={600}>{src.label}</text>
              </g>
            )
          })}

          {/* Account hub */}
          {(() => {
            const n = nodeMap['account']
            if (!n) return null
            const hov = hoveredNode === 'account'
            return (
              <g key="account" onMouseEnter={()=>setHoveredNode('account')} onMouseLeave={()=>setHoveredNode(null)} style={{ cursor:'pointer' }}>
                <circle cx={n.x} cy={n.y} r={hov ? 54 : 50} fill={hov?C.blueBg:'#e8f0ff'} stroke={C.blue} strokeWidth={2.5} filter={hov?'url(#glow)':''} />
                <text x={n.x} y={n.y - 4} textAnchor="middle" fill={C.blue} fontFamily="var(--serif)" fontSize={13} fontWeight={600}>Account</text>
                <text x={n.x} y={n.y + 12} textAnchor="middle" fill={C.blue} fontFamily="var(--mono)" fontSize={9} opacity={0.7}>47 entities</text>
              </g>
            )
          })()}

          {/* Entity nodes */}
          {allNodes.filter(n => !n.isSource && n.id !== 'account').map(n => {
            const ent = entityMap[n.id]
            if (!ent) return null
            const cat = CAT_STYLE[ent.cat] || CAT_STYLE.core
            const hov = hoveredNode === n.id
            const r = n.r || 20
            return (
              <g key={n.id} onMouseEnter={()=>setHoveredNode(n.id)} onMouseLeave={()=>setHoveredNode(null)} style={{ cursor:'pointer' }}>
                <circle cx={n.x} cy={n.y} r={hov ? r+3 : r} fill={hov ? cat.bg : '#fff'} stroke={cat.color} strokeWidth={hov?2:1.5} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fill={cat.color} fontFamily="var(--mono)" fontSize={Math.min(10, 80/ent.label.length + 4)} fontWeight={600}>
                  {ent.label.length > 10 ? ent.label.slice(0,9)+'…' : ent.label}
                </text>
              </g>
            )
          })}

          {/* Derived nodes row at bottom */}
          {DERIVED_DATA.map((d, i) => {
            const n = nodeMap[d.id]
            if (!n) return null
            const hov = hoveredNode === d.id
            return (
              <g key={d.id} onMouseEnter={()=>setHoveredNode(d.id)} onMouseLeave={()=>setHoveredNode(null)} style={{ cursor:'pointer' }}>
                <circle cx={n.x} cy={n.y} r={hov?25:22} fill={hov?C.purpleBg:'#f5f3ff'} stroke={C.purple} strokeWidth={hov?2:1.5} />
                <text x={n.x} y={n.y+4} textAnchor="middle" fill={C.purple} fontFamily="var(--mono)" fontSize={9} fontWeight={600}>
                  {d.label.length > 11 ? d.label.slice(0,10)+'…' : d.label}
                </text>
              </g>
            )
          })}

          {/* Legend */}
          {[
            { color:C.blue, label:'Core entities' },
            { color:C.green, label:'Sales' },
            { color:C.gold, label:'Delivery' },
            { color:C.coral, label:'Support' },
            { color:C.purple, label:'Derived / AI' },
            { color:C.teal, label:'Sources' },
          ].map((l,i) => (
            <g key={i} transform={`translate(${30+i*180}, 1400)`}>
              <circle r={6} cx={0} cy={0} fill={l.color} opacity={0.8} />
              <text x={12} y={4} fill={C.ink2} fontFamily="var(--sans)" fontSize={12}>{l.label}</text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredNode && (() => {
          const ent = ENTITIES.find(e=>e.id===hoveredNode) || SOURCES_DATA.find(s=>s.id===hoveredNode) || DERIVED_DATA.find(d=>d.id===hoveredNode)
          if (!ent) return null
          return (
            <div style={{ position:'absolute', bottom:16, left:16, background:'#fff', border:'1px solid #e3ddd1', borderRadius:10, padding:'10px 14px', maxWidth:280, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', pointerEvents:'none', zIndex:10 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:C.ink, marginBottom:4 }}>{ent.label}</div>
              <div style={{ fontSize:12, color:C.ink2, lineHeight:1.5 }}>{ent.definition || ent.description}</div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Entities Tab ─────────────────────────────────────────────────────────────
function EntitiesTab() {
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const cats = ['All','core','sales','delivery','support','people','derived','source']
  const rows = useMemo(() => ENTITIES.filter(e =>
    (catFilter==='All' || e.cat===catFilter) &&
    e.label.toLowerCase().includes(search.toLowerCase())
  ), [search, catFilter])

  const thStyle = { textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', color:'#9a948a', borderBottom:'1px solid #eaecea', whiteSpace:'nowrap' }
  const tdStyle = (last) => ({ padding:'11px 16px', verticalAlign:'middle', borderBottom: last ? 'none':'1px solid #f1f2f1' })

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fcfbf7', padding:'16px 26px 40px' }} className="dark-scroll">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:C.ink, flex:1 }}>Entities <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'#a89e88' }}>{rows.length}</span></span>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={()=>setCatFilter(c)} style={{ fontFamily:'var(--mono)', fontSize:11, padding:'3px 10px', borderRadius:6, border:`1px solid ${catFilter===c?'#1a1a1a':'#e3ddd1'}`, background:catFilter===c?'#1a1a1a':'#fff', color:catFilter===c?'#fff':C.ink2, cursor:'pointer', transition:'all .12s' }}>
              {c==='All'?'All':CAT_STYLE[c]?.label||c}
            </button>
          ))}
        </div>
        <div style={{ position:'relative' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search entities" style={{ border:'1px solid #e3e6e3', borderRadius:8, padding:'6px 12px 6px 28px', fontSize:13, color:'#374151', outline:'none', width:180, height:32, boxSizing:'border-box' }} />
        </div>
      </div>
      <div style={{ border:'1px solid #ececea', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <thead>
            <tr style={{ background:'#F7F5F3' }}>
              <th style={{ ...thStyle, width:'18%' }}>Entity</th>
              <th style={{ ...thStyle, width:'10%' }}>Category</th>
              <th style={{ ...thStyle, width:'30%' }}>Definition</th>
              <th style={{ ...thStyle, width:'20%' }}>Primary Sources</th>
              <th style={{ ...thStyle, width:'9%' }}>Props</th>
              <th style={{ ...thStyle, width:'13%' }}>Key Properties</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ent, i) => {
              const isExp = expanded === ent.id
              const last = i === rows.length-1
              return [
                <tr key={ent.id} onClick={()=>setExpanded(isExp?null:ent.id)} style={{ background:'#fff', cursor:'pointer', transition:'background .12s' }}
                  onMouseOver={e=>{e.currentTarget.style.background='#f7f6f3'}} onMouseOut={e=>{e.currentTarget.style.background='#fff'}}>
                  <td style={tdStyle(false)}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, transition:'transform .15s', transform:isExp?'rotate(90deg)':'none' }}><path d="M5 3l4 4-4 4" stroke={C.ink3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ fontFamily:'var(--mono)', fontSize:12.5, fontWeight:600, color:C.ink }}>{ent.label}</span>
                    </div>
                  </td>
                  <td style={tdStyle(false)}><CatBadge cat={ent.cat} /></td>
                  <td style={{ ...tdStyle(false), fontSize:12.5, color:C.ink2, lineHeight:1.45 }}>{ent.definition}</td>
                  <td style={tdStyle(false)}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {ent.sources.slice(0,3).map(s=><Chip key={s} label={s} color={C.teal} bg={C.tealBg} border={C.tealBd} />)}
                      {ent.sources.length>3 && <Chip label={`+${ent.sources.length-3}`} />}
                      {ent.sources.length===0 && <span style={{ fontSize:12, color:C.ink3 }}>Computed</span>}
                    </div>
                  </td>
                  <td style={{ ...tdStyle(false), fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:C.ink }}>
                    {ent.props.length}
                  </td>
                  <td style={tdStyle(!isExp && last)}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {ent.props.slice(0,3).map(p=>(
                        <span key={p.name} style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'#5b5547', background:'#f3f0ea', border:'1px solid #e3ddd1', padding:'1px 6px', borderRadius:4 }}>{p.name}</span>
                      ))}
                    </div>
                  </td>
                </tr>,
                isExp && (
                  <tr key={ent.id+'-expanded'} style={{ background:'#f9f7f3' }}>
                    <td colSpan={6} style={{ padding:'0 16px 16px 48px', borderBottom: last ? 'none':'1px solid #f1f2f1' }}>
                      <div style={{ marginTop:12, border:'1px solid #eee7da', borderRadius:8, overflow:'hidden' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                          <thead>
                            <tr style={{ background:'#f7f5f2' }}>
                              <th style={{ ...thStyle, width:'22%', fontSize:10 }}>Property</th>
                              <th style={{ ...thStyle, width:'14%', fontSize:10 }}>Type</th>
                              <th style={{ ...thStyle, width:'44%', fontSize:10 }}>Description</th>
                              <th style={{ ...thStyle, width:'20%', fontSize:10 }}>Flags</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ent.props.map((p, pi) => (
                              <tr key={p.name} style={{ background:'#fff' }}>
                                <td style={{ ...tdStyle(pi===ent.props.length-1), fontFamily:'var(--mono)', fontSize:12, fontWeight:600, color:C.ink }}>{p.name}</td>
                                <td style={{ ...tdStyle(pi===ent.props.length-1), fontFamily:'var(--mono)', fontSize:11, color:C.blue }}>{p.type}</td>
                                <td style={{ ...tdStyle(pi===ent.props.length-1), fontSize:12.5, color:C.ink2 }}>{p.desc}</td>
                                <td style={tdStyle(pi===ent.props.length-1)}>
                                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                    {p.pii && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.coral, background:C.coralBg, border:`1px solid ${C.coralBd}`, padding:'1px 6px', borderRadius:4 }}>PII</span>}
                                    {p.fk && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.blue, background:C.blueBg, border:`1px solid ${C.blueBd}`, padding:'1px 6px', borderRadius:4 }}>FK</span>}
                                    {p.computed && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.purple, background:C.purpleBg, border:`1px solid ${C.purpleBd}`, padding:'1px 6px', borderRadius:4 }}>Computed</span>}
                                    {p.name.endsWith('_id') && !p.fk && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.green, background:C.greenBg, border:`1px solid ${C.greenBd}`, padding:'1px 6px', borderRadius:4 }}>PK</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )
              ]
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Sources Tab ──────────────────────────────────────────────────────────────
function SourcesTab() {
  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fcfbf7', padding:'16px 26px 40px' }} className="dark-scroll">
      <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:16 }}>
        <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:C.ink }}>Sources</span>
        <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'#a89e88' }}>{SOURCES_DATA.length}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:16 }}>
        {SOURCES_DATA.map(src => (
          <div key={src.id} style={{ background:'#fff', border:'1px solid #e3ddd1', borderRadius:12, padding:'16px 18px', transition:'box-shadow .15s' }}
            onMouseOver={e=>e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,0.08)'} onMouseOut={e=>e.currentTarget.style.boxShadow='none'}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:C.tealBg, border:`1px solid ${C.tealBd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:C.teal }}>{src.label.charAt(0)}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:13.5, fontWeight:700, color:C.ink }}>{src.label}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                  <span style={{ fontSize:11.5, color:C.teal, fontFamily:'var(--mono)' }}>{src.syncFreq}</span>
                  {src.writesBack && (
                    <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.purple, background:C.purpleBg, border:`1px solid ${C.purpleBd}`, padding:'1px 6px', borderRadius:4 }}>Writes back</span>
                  )}
                </div>
              </div>
            </div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.5, margin:'0 0 12px' }}>{src.description}</p>
            <div style={{ borderTop:'1px solid #f0ede8', paddingTop:10 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.4, textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>Feeds entities</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {src.feeds.map(f=>(
                  <Chip key={f} label={f} color={C.blue} bg={C.blueBg} border={C.blueBd} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Edges Tab ────────────────────────────────────────────────────────────────
function EdgesTab() {
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('All')

  const kinds = ['All','direct','inferred','agent']
  const entityMap = useMemo(()=>{ const m={}; ENTITIES.forEach(e=>{m[e.id]=e}); return m },[])
  const rows = useMemo(()=>EDGES_DATA.filter(e=>
    (kindFilter==='All'||e.kind===kindFilter) &&
    (e.label.toLowerCase().includes(search.toLowerCase())||e.s.includes(search.toLowerCase())||e.t.includes(search.toLowerCase()))
  ),[search,kindFilter])

  const thStyle = { textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', color:'#9a948a', borderBottom:'1px solid #eaecea', whiteSpace:'nowrap' }
  const tdStyle = (last) => ({ padding:'11px 16px', verticalAlign:'middle', borderBottom: last?'none':'1px solid #f1f2f1' })

  const kindTag = { direct:{color:C.green,bg:C.greenBg,bd:C.greenBd,label:'Direct'}, inferred:{color:C.purple,bg:C.purpleBg,bd:C.purpleBd,label:'Inferred'}, agent:{color:C.gold,bg:C.goldBg,bd:C.goldBd,label:'Agent'} }

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fcfbf7', padding:'16px 26px 40px' }} className="dark-scroll">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:C.ink, flex:1 }}>Edges <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'#a89e88' }}>{rows.length}</span></span>
        <div style={{ display:'flex', gap:6 }}>
          {kinds.map(k=>(
            <button key={k} onClick={()=>setKindFilter(k)} style={{ fontFamily:'var(--mono)', fontSize:11, padding:'3px 10px', borderRadius:6, border:`1px solid ${kindFilter===k?'#1a1a1a':'#e3ddd1'}`, background:kindFilter===k?'#1a1a1a':'#fff', color:kindFilter===k?'#fff':C.ink2, cursor:'pointer', transition:'all .12s' }}>
              {k==='All'?'All kinds':kindTag[k]?.label||k}
            </button>
          ))}
        </div>
        <div style={{ position:'relative' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search edges" style={{ border:'1px solid #e3e6e3', borderRadius:8, padding:'6px 12px 6px 28px', fontSize:13, color:'#374151', outline:'none', width:180, height:32, boxSizing:'border-box' }} />
        </div>
      </div>
      <div style={{ border:'1px solid #ececea', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <thead>
            <tr style={{ background:'#F7F5F3' }}>
              <th style={{ ...thStyle, width:'13%' }}>From</th>
              <th style={{ ...thStyle, width:'5%' }}>→</th>
              <th style={{ ...thStyle, width:'13%' }}>To</th>
              <th style={{ ...thStyle, width:'20%' }}>Edge Label</th>
              <th style={{ ...thStyle, width:'10%' }}>Kind</th>
              <th style={{ ...thStyle, width:'8%' }}>Stage</th>
              <th style={{ ...thStyle, width:'31%' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e,i)=>{
              const last = i===rows.length-1
              const k = kindTag[e.kind]||kindTag.direct
              return (
                <tr key={i} style={{ background:'#fff', transition:'background .12s' }}
                  onMouseOver={ev=>ev.currentTarget.style.background='#f7f6f3'} onMouseOut={ev=>ev.currentTarget.style.background='#fff'}>
                  <td style={{ ...tdStyle(last), fontFamily:'var(--mono)', fontSize:12, fontWeight:600, color:C.blue }}>{e.s}</td>
                  <td style={{ ...tdStyle(last), textAlign:'center', color:C.ink3, fontSize:15 }}>→</td>
                  <td style={{ ...tdStyle(last), fontFamily:'var(--mono)', fontSize:12, fontWeight:600, color:C.blue }}>{e.t}</td>
                  <td style={tdStyle(last)}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:12, color:C.ink2, fontWeight:500 }}>:{e.label}</span>
                  </td>
                  <td style={tdStyle(last)}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:k.color, background:k.bg, border:`1px solid ${k.bd}`, padding:'2px 7px', borderRadius:5 }}>{k.label}</span>
                  </td>
                  <td style={{ ...tdStyle(last), fontFamily:'var(--mono)', fontSize:11, color:C.ink3 }}>{e.stage}</td>
                  <td style={{ ...tdStyle(last), fontSize:12.5, color:C.ink2, lineHeight:1.4 }}>{e.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Derived Intelligence Tab ─────────────────────────────────────────────────
function DerivedTab() {
  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fcfbf7', padding:'16px 26px 40px' }} className="dark-scroll">
      <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:16 }}>
        <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:C.ink }}>Derived Intelligence</span>
        <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'#a89e88' }}>{DERIVED_DATA.length} computed nodes</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
        {DERIVED_DATA.map(d=>(
          <div key={d.id} style={{ background:'#fff', border:'1px solid #e3ddd1', borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', gap:12, transition:'box-shadow .15s' }}
            onMouseOver={e=>e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,0.08)'} onMouseOut={e=>e.currentTarget.style.boxShadow='none'}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:13.5, fontWeight:700, color:C.ink, flex:1 }}>{d.label}</div>
              <CatBadge cat={d.cat} small />
            </div>
            <p style={{ fontSize:12.5, color:C.ink2, lineHeight:1.5, margin:0 }}>{d.definition}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, borderTop:'1px solid #f0ede8', paddingTop:10 }}>
              <div>
                <div style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4, color:C.ink3, marginBottom:5 }}>Inputs</div>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  {d.inputs.map(inp=>(
                    <span key={inp} style={{ fontSize:12, color:C.green, fontFamily:'var(--mono)', display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, display:'inline-block', flexShrink:0 }} />
                      {inp}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4, color:C.ink3, marginBottom:5 }}>Outputs</div>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  {d.outputs.map(out=>(
                    <span key={out} style={{ fontSize:12, color:C.purple, fontFamily:'var(--mono)', display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:C.purple, display:'inline-block', flexShrink:0 }} />
                      {out}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ borderTop:'1px solid #f0ede8', paddingTop:10 }}>
              <div style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4, color:C.ink3, marginBottom:6 }}>Key Fields</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {d.fields.map(f=>(
                  <div key={f.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:600, color:C.ink, minWidth:120 }}>{f.name}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.blue }}>{f.type}</span>
                    <span style={{ fontSize:11, color:C.ink3, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Use Cases Tab ────────────────────────────────────────────────────────────
function UseCasesTab() {
  const [openStage, setOpenStage] = useState(null)

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fcfbf7', padding:'16px 26px 40px' }} className="dark-scroll">
      <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:16 }}>
        <span style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:500, color:C.ink }}>Use Cases by CEP Stage</span>
        <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'#a89e88' }}>100+ use cases across 11 stages</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {CEP_STAGES.map(stage=>{
          const isOpen = openStage === stage.id
          return (
            <div key={stage.id} style={{ background:'#fff', border:'1px solid #e3ddd1', borderRadius:12, overflow:'hidden', transition:'box-shadow .15s' }}
              onMouseOver={e=>{ if(!isOpen) e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)' }} onMouseOut={e=>e.currentTarget.style.boxShadow='none'}>
              <button onClick={()=>setOpenStage(isOpen?null:stage.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:stage.color+'18', border:`1.5px solid ${stage.color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:stage.color }}>{stage.id}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13.5, fontWeight:700, color:C.ink }}>Stage {stage.id}: {stage.name}</div>
                  <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>{stage.useCases.length} use cases</div>
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', maxWidth:420 }}>
                  {stage.entities.slice(0,4).map(e=><Chip key={e} label={e} />)}
                  {stage.entities.length>4 && <Chip label={`+${stage.entities.length-4}`} />}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, transition:'transform .18s', transform:isOpen?'rotate(90deg)':'none' }}>
                  <path d="M6 3.5L10.5 8 6 12.5" stroke={C.ink3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <div style={{ borderTop:'1px solid #f0ede8', padding:'0 18px 16px' }}>
                  <p style={{ fontSize:13, color:C.ink2, lineHeight:1.5, margin:'12px 0 14px' }}>{stage.description}</p>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
                    {stage.entities.map(e=><Chip key={e} label={e} color={C.blue} bg={C.blueBg} border={C.blueBd} />)}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {stage.useCases.map((uc,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', background:'#f9f7f4', borderRadius:8, border:'1px solid #eee7da' }}>
                        <Badge label={uc.badge} type={uc.badge} />
                        <div>
                          <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:C.ink, marginBottom:3 }}>{uc.title}</div>
                          <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.45 }}>{uc.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ECGDetailPage ────────────────────────────────────────────────────────
const ECG_TABS = ['Graph','Entities','Sources','Edges','Derived Intelligence','Use Cases']

export default function ECGDetailPage({ onBack }) {
  const [tab, setTab] = useState('Graph')
  const [iconHovered, setIconHovered] = useState(false)

  return (
    <div style={{ flex:1, overflowY:'auto', backgroundColor:'#fcfbf7' }} className="dark-scroll">
      {/* Header */}
      <div style={{ margin:0 }}>
        {/* Breadcrumb */}
        <div style={{ background:'#FEFDFB', padding:'8px 26px 0', borderBottom:'none' }}>
          <span style={{ fontFamily:'var(--sans)', fontSize:12, color:C.ink3 }}>Records</span>
          <span style={{ fontFamily:'var(--sans)', fontSize:12, color:C.ink3, margin:'0 6px' }}>/</span>
          <span style={{ fontFamily:'var(--sans)', fontSize:12, color:C.ink2, fontWeight:500 }}>Enterprise Context Graph</span>
        </div>

        {/* Title zone */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'#FEFDFB', padding:'12px 26px 14px' }}>
          <span
            onClick={iconHovered ? onBack : undefined}
            onMouseEnter={()=>setIconHovered(true)}
            onMouseLeave={()=>setIconHovered(false)}
            title={iconHovered ? 'Back to nodes list' : undefined}
            style={{ width:36, height:36, borderRadius:9, background:iconHovered?'#f2f0eb':'#fff', border:'1px solid #eee7da', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:iconHovered?'pointer':'default', transition:'background .15s' }}>
            {iconHovered
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6b6b5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
              : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.8l2.25 4.5L16 8.4l-3.5 3.4.82 4.8L9 14.3l-4.32 2.3.82-4.8L2 8.4l4.75-1.1L9 2.8z" fill={C.purple} opacity="0.85" /></svg>}
          </span>

          <span style={{ fontFamily:'var(--serif)', fontSize:24, fontWeight:500, color:C.ink, letterSpacing:-0.3, marginLeft:-2 }}>Enterprise Context Graph</span>
          <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.purple, border:`1px solid ${C.purpleBd}`, background:C.purpleBg, padding:'3px 9px', borderRadius:6 }}>47 entities</span>
          <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.teal, border:`1px solid ${C.tealBd}`, background:C.tealBg, padding:'3px 9px', borderRadius:6 }}>13 sources</span>
          <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.gold, border:`1px solid ${C.goldBd}`, background:C.goldBg, padding:'3px 9px', borderRadius:6 }}>23 derived</span>
          <div style={{ flex:1 }} />
        </div>

        {/* KPI strip */}
        <div style={{ display:'flex', background:'#FEFDFB', borderTop:'1px solid #f1ede6', borderBottom:'1px solid #f1ede6', padding:'0 26px' }}>
          {[
            { label:'Entities', value:'47' },
            { label:'Sources', value:'13' },
            { label:'Edges', value:'60+' },
            { label:'Derived', value:'23' },
            { label:'CEP Stages', value:'11' },
            { label:'Use Cases', value:'100+' },
          ].map((kpi,i)=>(
            <div key={i} style={{ flex:1, padding:'10px 0', display:'flex', flexDirection:'column', alignItems:'center', borderRight: i<5?'1px solid #f1ede6':'none' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:C.ink, lineHeight:1 }}>{kpi.value}</span>
              <span style={{ fontFamily:'var(--sans)', fontSize:11, color:C.ink3, marginTop:3 }}>{kpi.label}</span>
            </div>
          ))}
        </div>

        {/* Tab rail */}
        <div style={{ background:'#FEFDFB', borderBottom:'1px solid #efece6', padding:'0 26px' }}>
          <div style={{ display:'flex' }}>
            {ECG_TABS.map(t => {
              const on = tab===t
              return (
                <button key={t} onClick={()=>setTab(t)} style={{
                  position:'relative', cursor:'pointer', border:'none', background:'none',
                  padding:'11px 18px 13px', fontSize:13,
                  fontWeight: on?600:500, color: on?C.ink:'#5b5547',
                  transition:'color .15s', whiteSpace:'nowrap',
                  display:'inline-flex', alignItems:'center', gap:6,
                }}
                  onMouseOver={e=>{if(!on)e.currentTarget.style.color=C.ink}}
                  onMouseOut={e=>{if(!on)e.currentTarget.style.color='#5b5547'}}>
                  {t}
                  <span style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:-1, width:on?'100%':0, maxWidth:'calc(100% - 16px)', height:2, borderRadius:2, background:'#1a1a1a', transition:'width .18s ease' }} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab body — must fill remaining space */}
      <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 260px)' }}>
        {tab==='Graph' && <GraphTab />}
        {tab==='Entities' && <EntitiesTab />}
        {tab==='Sources' && <SourcesTab />}
        {tab==='Edges' && <EdgesTab />}
        {tab==='Derived Intelligence' && <DerivedTab />}
        {tab==='Use Cases' && <UseCasesTab />}
      </div>
    </div>
  )
}
