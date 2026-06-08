import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Dropdown } from './SkillsPage'
import '../linkSource.css'

// ── data + node/edge meta ──
const _ENT_NODES = [
  // ENTITIES (circle, blue)
  { id: "account",      label: "Account",       type: "entity", state: "core",     cat: "core",    x: 0,    y: 60,   size: 34, instances: "2.8K", instancesN: 2840,  props: 18, edges: 12, fill: 94, conf: 97, fresh: "24m", pii: 4, change: "HIGH",   desc: "Customer or prospect organization" },
  { id: "person",       label: "Person",        type: "entity", state: "core",     cat: "core",    x: -240, y: -10,  size: 30, instances: "18K",  instancesN: 18420, props: 14, edges: 8,  fill: 81, conf: 92, fresh: "1.2h", pii: 4, change: "MEDIUM", desc: "Individual contact across the customer lifecycle" },
  { id: "subscription", label: "Subscription",  type: "entity", state: "core",     cat: "core",    x: 60,   y: 270,  size: 28, instances: "2.8K", instancesN: 2840,  props: 11, edges: 6,  fill: 99, conf: 99, fresh: "12m", pii: 0, change: "LOW",    desc: "Recurring product license tied to an account" },
  { id: "agreement",    label: "Agreement",     type: "entity", state: "core",     cat: "core",    x: 320,  y: 230,  size: 28, instances: "3.1K", instancesN: 3120,  props: 16, edges: 5,  fill: 96, conf: 98, fresh: "18m", pii: 1, change: "LOW",    desc: "Signed contract governing one or more subscriptions" },
  { id: "interaction",  label: "Interaction",   type: "entity", state: "core",     cat: "support", x: -290, y: 220,  size: 26, instances: "124K", instancesN: 124000,props: 9,  edges: 4,  fill: 78, conf: 84, fresh: "24m", pii: 0, change: "HIGH",   desc: "Logged touchpoint between a Person and an Account" },
  { id: "invoice",      label: "Invoice",       type: "entity", state: "core",     cat: "core",    x: 380,  y: -130, size: 26, instances: "12K",  instancesN: 12040, props: 13, edges: 4,  fill: 92, conf: 95, fresh: "36m", pii: 0, change: "MEDIUM", desc: "Billing record drawn from a subscription cycle" },
  { id: "employee",     label: "Employee",      type: "entity", state: "core",     cat: "core",    x: -460, y: 110,  size: 24, instances: "1.2K", instancesN: 1240,  props: 12, edges: 3,  fill: 88, conf: 94, fresh: "4h",  pii: 2, change: "LOW",    desc: "Internal staff member" },

  // STATE-COLORED ENTITIES
  { id: "ticket",       label: "Ticket",        type: "entity", state: "incident", cat: "support", x: -150, y: 360,  size: 28, instances: "142K", instancesN: 142000,props: 10, edges: 5,  fill: 91, conf: 96, fresh: "18m", pii: 1, change: "MEDIUM", desc: "Support case raised by a Person against an Account" },
  { id: "incident",     label: "Incident",      type: "entity", state: "incident", cat: "support", x: 80,   y: 460,  size: 26, instances: "412",  instancesN: 412,   props: 14, edges: 4,  fill: 88, conf: 91, fresh: "6m",  pii: 0, change: "HIGH",   desc: "Operational outage affecting subscriptions" },

  { id: "signal",       label: "Signal",        type: "entity", state: "signal",   cat: "derived", x: 240,  y: -240, size: 24, instances: "25K",  instancesN: 25400, props: 7,  edges: 3,  fill: 88, conf: 95, fresh: "6m",  pii: 0, change: "HIGH",   desc: "Derived behavioural event from product telemetry" },
  { id: "risk",         label: "Risk",          type: "entity", state: "risk",     cat: "derived", x: 440,  y: -200, size: 24, instances: "184",  instancesN: 184,   props: 11, edges: 4,  fill: 94, conf: 99, fresh: "6m",  pii: 0, change: "MEDIUM", desc: "Open exposure attached to an account or contract" },

  // AGENTS (hexagon, purple)
  { id: "rev_fore",     label: "Revenue Forecaster",   type: "agent", state: "core", cat: "derived", x: 540,  y: 40,   size: 30, instances: "—", instancesN: 0, props: 9, edges: 5, fill: 86, conf: 92, fresh: "15m", pii: 0, change: "MEDIUM", desc: "Agent: predicts ARR roll-forward from subscription + signal data" },
  { id: "comp_aud",     label: "Compliance Auditor",   type: "agent", state: "core", cat: "derived", x: 600,  y: 280,  size: 28, instances: "—", instancesN: 0, props: 7, edges: 4, fill: 92, conf: 96, fresh: "1h",  pii: 0, change: "LOW",    desc: "Agent: scans agreements and tickets for policy breaches" },
  { id: "cust_health",  label: "Customer Health",      type: "agent", state: "core", cat: "derived", x: -340, y: -180, size: 28, instances: "—", instancesN: 0, props: 8, edges: 5, fill: 89, conf: 94, fresh: "30m", pii: 0, change: "MEDIUM", desc: "Agent: blends interaction + signal data into a health score" },
  { id: "insight_syn",  label: "Insight Synthesizer",  type: "agent", state: "core", cat: "derived", x: 220,  y: 380,  size: 26, instances: "—", instancesN: 0, props: 6, edges: 4, fill: 76, conf: 88, fresh: "6h",  pii: 0, change: "LOW",    desc: "Agent: weekly narrative summaries across accounts" },

  // DATA SOURCES (square, green)
  { id: "netsuite",     label: "NetSuite ERP",         type: "source", state: "core", cat: "source", x: 470,  y: -340, size: 26, instances: "—", instancesN: 0, props: 22, edges: 3, fill: 99, conf: 100, fresh: "5m",  pii: 1, change: "LOW",    desc: "System of record for invoices and agreements" },
  { id: "okta",         label: "Okta Identity",        type: "source", state: "core", cat: "source", x: -560, y: -100, size: 24, instances: "—", instancesN: 0, props: 14, edges: 2, fill: 100, conf: 100, fresh: "2m", pii: 6, change: "LOW",    desc: "Identity provider mapping Person → Employee" },
  { id: "snowflake",    label: "Snowflake Warehouse",  type: "source", state: "core", cat: "source", x: -120, y: 540,  size: 28, instances: "—", instancesN: 0, props: 36, edges: 5, fill: 96, conf: 98, fresh: "12h", pii: 0, change: "MEDIUM", desc: "Warehouse landing zone for product telemetry" },
];

const _ENT_EDGES = [
  // direct edges
  { s: "person",       t: "account",      label: "WORKS_AT",        kind: "direct" },
  { s: "person",       t: "account",      label: "PREVIOUSLY_AT",   kind: "inferred", curve: -36 },
  { s: "account",      t: "subscription", label: "HAS_SUBSCRIPTION", kind: "direct" },
  { s: "account",      t: "agreement",    label: "GOVERNED_BY",     kind: "direct" },
  { s: "subscription", t: "invoice",      label: "BILLS",           kind: "direct" },
  { s: "agreement",    t: "invoice",      label: "ITEMIZES",        kind: "inferred" },
  { s: "person",       t: "interaction",  label: "INVOLVED_IN",     kind: "direct" },
  { s: "interaction",  t: "account",      label: "TOUCHES",         kind: "inferred", curve: 28 },
  { s: "person",       t: "ticket",       label: "RAISES",          kind: "direct" },
  { s: "ticket",       t: "account",      label: "AGAINST",         kind: "direct" },
  { s: "incident",     t: "subscription", label: "INCIDENT_AFFECTS", kind: "direct" },
  { s: "incident",     t: "ticket",       label: "ROLLS_UP",        kind: "inferred" },
  { s: "signal",       t: "account",      label: "OBSERVED_ON",     kind: "direct" },
  { s: "risk",         t: "agreement",    label: "EXPOSES",         kind: "direct" },
  { s: "risk",         t: "account",      label: "ATTACHED_TO",     kind: "inferred", curve: -22 },

  // agent edges
  { s: "rev_fore",     t: "subscription", label: "READS",           kind: "agent" },
  { s: "rev_fore",     t: "signal",       label: "READS",           kind: "agent" },
  { s: "cust_health",  t: "interaction",  label: "READS",           kind: "agent" },
  { s: "cust_health",  t: "person",       label: "SCORES",          kind: "agent" },
  { s: "comp_aud",     t: "agreement",    label: "AUDITS",          kind: "agent" },
  { s: "comp_aud",     t: "ticket",       label: "AUDITS",          kind: "agent" },
  { s: "insight_syn",  t: "incident",     label: "SUMMARIZES",      kind: "agent" },
  { s: "insight_syn",  t: "account",      label: "WRITES_TO",       kind: "agent" },

  // source edges
  { s: "netsuite",     t: "invoice",      label: "SOURCES",         kind: "source" },
  { s: "netsuite",     t: "agreement",    label: "SOURCES",         kind: "source" },
  { s: "okta",         t: "person",       label: "SOURCES",         kind: "source" },
  { s: "okta",         t: "employee",     label: "SOURCES",         kind: "source" },
  { s: "snowflake",    t: "signal",       label: "SOURCES",         kind: "source" },
  { s: "snowflake",    t: "interaction",  label: "SOURCES",         kind: "source" },
];

// ─── PRODUCT SPECIALIST GRAPH ───────────────────────────────────────────────

const PS_NODES = [
  // ENTITIES
  { id: "dealer",       label: "Dealer",       type: "entity", state: "core",   cat: "core",    x: -220, y: 0,    size: 32, instances: "840",  instancesN: 840,   props: 16, edges: 8,  fill: 92, conf: 96, fresh: "30m", pii: 2, change: "LOW",    desc: "Dealership organization — the customer being onboarded or supported by the PS team" },
  { id: "project",      label: "Project",      type: "entity", state: "core",   cat: "core",    x: 0,    y: 0,    size: 34, instances: "1.2K", instancesN: 1200,  props: 22, edges: 14, fill: 88, conf: 94, fresh: "15m", pii: 0, change: "MEDIUM", desc: "PS delivery project tracking the full engagement lifecycle from SOW through go-live" },
  { id: "workorder",    label: "Work Order",   type: "entity", state: "core",   cat: "core",    x: 200,  y: -80,  size: 30, instances: "8.4K", instancesN: 8400,  props: 18, edges: 10, fill: 91, conf: 95, fresh: "10m", pii: 0, change: "HIGH",   desc: "Atomic unit of PS delivery — a scoped configuration or implementation task" },
  { id: "pem",          label: "PEM",          type: "entity", state: "core",   cat: "core",    x: -80,  y: -200, size: 26, instances: "126",  instancesN: 126,   props: 12, edges: 6,  fill: 86, conf: 92, fresh: "1h",  pii: 3, change: "LOW",    desc: "Project Engagement Manager — PS lead accountable for delivery outcomes" },
  { id: "bsa",          label: "BSA",          type: "entity", state: "core",   cat: "core",    x: 120,  y: -200, size: 26, instances: "84",   instancesN: 84,    props: 11, edges: 5,  fill: 84, conf: 90, fresh: "1h",  pii: 3, change: "LOW",    desc: "Business Solutions Architect — technical design lead for the engagement" },
  { id: "champion",     label: "Champion",     type: "entity", state: "core",   cat: "core",    x: -380, y: -100, size: 24, instances: "920",  instancesN: 920,   props: 10, edges: 4,  fill: 78, conf: 88, fresh: "2h",  pii: 2, change: "LOW",    desc: "Customer champion and internal advocate at the dealership" },
  { id: "resource",     label: "Resource",     type: "entity", state: "core",   cat: "core",    x: 300,  y: -200, size: 24, instances: "340",  instancesN: 340,   props: 14, edges: 5,  fill: 82, conf: 91, fresh: "4h",  pii: 2, change: "LOW",    desc: "PS team member assigned to one or more work orders" },
  { id: "milestone",    label: "Milestone",    type: "entity", state: "signal", cat: "core",    x: 60,   y: -340, size: 24, instances: "4.8K", instancesN: 4800,  props: 9,  edges: 5,  fill: 94, conf: 97, fresh: "30m", pii: 0, change: "MEDIUM", desc: "Delivery milestone gating phase completion and go-live readiness" },
  { id: "sow",          label: "SOW",          type: "entity", state: "core",   cat: "core",    x: -200, y: 180,  size: 26, instances: "1.2K", instancesN: 1200,  props: 15, edges: 5,  fill: 96, conf: 99, fresh: "1d",  pii: 0, change: "LOW",    desc: "Statement of Work — commercial contract scoping the engagement" },
  { id: "sdd",          label: "SDD",          type: "entity", state: "core",   cat: "derived", x: 200,  y: 160,  size: 24, instances: "980",  instancesN: 980,   props: 13, edges: 4,  fill: 85, conf: 93, fresh: "1d",  pii: 0, change: "MEDIUM", desc: "Solution Design Document — technical blueprint authored by the BSA" },
  { id: "raid",         label: "RAID",         type: "entity", state: "risk",   cat: "derived", x: 360,  y: 0,    size: 24, instances: "3.2K", instancesN: 3200,  props: 16, edges: 5,  fill: 80, conf: 87, fresh: "1h",  pii: 0, change: "HIGH",   desc: "Risks, Assumptions, Issues and Dependencies log for the project" },
  { id: "signal",       label: "Signal",       type: "entity", state: "signal", cat: "derived", x: 440,  y: -160, size: 24, instances: "28K",  instancesN: 28000, props: 8,  edges: 5,  fill: 88, conf: 94, fresh: "6m",  pii: 0, change: "HIGH",   desc: "Health and quality signal derived from delivery activity and TOC platform data" },

  // DATA SOURCES
  { id: "salesforce",   label: "Salesforce",   type: "source", state: "core",   cat: "source",  x: -480, y: -260, size: 26, instances: "—", instancesN: 0, props: 28, edges: 4, fill: 98, conf: 99, fresh: "5m",  pii: 4, change: "LOW",    desc: "CRM — dealer accounts, PS contacts, opportunities, and cases" },
  { id: "apc",          label: "APC 2.0",      type: "source", state: "core",   cat: "source",  x: -60,  y: -440, size: 24, instances: "—", instancesN: 0, props: 22, edges: 2, fill: 96, conf: 98, fresh: "10m", pii: 0, change: "LOW",    desc: "PS project management platform — projects and work order lifecycle" },
  { id: "arc",          label: "ARC Platform", type: "source", state: "core",   cat: "source",  x: 560,  y: 80,   size: 24, instances: "—", instancesN: 0, props: 18, edges: 2, fill: 94, conf: 97, fresh: "15m", pii: 0, change: "LOW",    desc: "Tekion delivery platform — milestone tracking and RAID logs" },
  { id: "toc_im",       label: "TOC: IM",      type: "source", state: "core",   cat: "source",  x: 520,  y: -280, size: 22, instances: "—", instancesN: 0, props: 14, edges: 1, fill: 92, conf: 96, fresh: "2m",  pii: 0, change: "MEDIUM", desc: "TOC Incident Management — incidents feeding delivery health signals" },
  { id: "toc_st",       label: "TOC: Tickets", type: "source", state: "core",   cat: "source",  x: 520,  y: -100, size: 22, instances: "—", instancesN: 0, props: 16, edges: 2, fill: 90, conf: 95, fresh: "5m",  pii: 0, change: "MEDIUM", desc: "TOC Service Tickets — open issues and blockers tied to work orders" },
  { id: "toc_forms",    label: "TOC: Forms",   type: "source", state: "core",   cat: "source",  x: -260, y: 360,  size: 22, instances: "—", instancesN: 0, props: 12, edges: 1, fill: 88, conf: 94, fresh: "30m", pii: 0, change: "LOW",    desc: "TOC Forms — structured configuration capture for work order completion" },
  { id: "toc_support",  label: "TOC: Support", type: "source", state: "core",   cat: "source",  x: -480, y: 200,  size: 22, instances: "—", instancesN: 0, props: 10, edges: 1, fill: 86, conf: 93, fresh: "15m", pii: 0, change: "LOW",    desc: "TOC Support Portal — dealer-submitted requests and engagement feedback" },
  { id: "toc_prism",    label: "TOC: PRISM",   type: "source", state: "core",   cat: "source",  x: 380,  y: 280,  size: 22, instances: "—", instancesN: 0, props: 20, edges: 1, fill: 92, conf: 96, fresh: "1h",  pii: 0, change: "LOW",    desc: "TOC PRISM — project readiness and implementation scoring" },
  { id: "toc_acctmgmt", label: "TOC: Acct Mgmt", type: "source", state: "core", cat: "source", x: -560, y: 80,   size: 22, instances: "—", instancesN: 0, props: 14, edges: 1, fill: 88, conf: 94, fresh: "1h",  pii: 2, change: "LOW",    desc: "TOC Account Management (LUS) — dealer onboarding and account status" },
  { id: "skilljar",     label: "Skilljar",     type: "source", state: "core",   cat: "source",  x: 200,  y: 380,  size: 22, instances: "—", instancesN: 0, props: 12, edges: 2, fill: 94, conf: 97, fresh: "1d",  pii: 1, change: "LOW",    desc: "Training platform — resource certifications and dealer training completion" },
  { id: "chronicleai",  label: "ChronicleAI",  type: "source", state: "core",   cat: "source",  x: 580,  y: -200, size: 22, instances: "—", instancesN: 0, props: 16, edges: 1, fill: 90, conf: 95, fresh: "30m", pii: 0, change: "MEDIUM", desc: "AI-native platform providing behavioral signals and delivery quality insights" },
];

const PS_EDGES = [
  // Entity relationships
  { s: "dealer",       t: "project",   label: "HAS_PROJECT",   kind: "direct" },
  { s: "project",      t: "workorder", label: "INCLUDES",      kind: "direct" },
  { s: "project",      t: "sow",       label: "GOVERNED_BY",   kind: "direct" },
  { s: "project",      t: "sdd",       label: "DOCUMENTED_IN", kind: "direct" },
  { s: "project",      t: "raid",      label: "TRACKED_IN",    kind: "direct" },
  { s: "project",      t: "milestone", label: "HAS_MILESTONE", kind: "direct" },
  { s: "pem",          t: "project",   label: "MANAGES",       kind: "direct" },
  { s: "bsa",          t: "project",   label: "DESIGNS",       kind: "direct" },
  { s: "workorder",    t: "resource",  label: "ASSIGNED_TO",   kind: "direct" },
  { s: "workorder",    t: "milestone", label: "DELIVERS",      kind: "direct" },
  { s: "champion",     t: "dealer",    label: "REPRESENTS",    kind: "direct" },
  { s: "signal",       t: "workorder", label: "OBSERVED_ON",   kind: "direct" },
  { s: "signal",       t: "project",   label: "MEASURED_FOR",  kind: "inferred" },
  { s: "sow",          t: "sdd",       label: "INFORMS",       kind: "inferred" },
  { s: "pem",          t: "workorder", label: "OWNS",          kind: "inferred", curve: -40 },
  // Source → entity
  { s: "salesforce",   t: "dealer",    label: "SOURCES", kind: "source" },
  { s: "salesforce",   t: "pem",       label: "SOURCES", kind: "source" },
  { s: "salesforce",   t: "sow",       label: "SOURCES", kind: "source" },
  { s: "salesforce",   t: "champion",  label: "SOURCES", kind: "source" },
  { s: "apc",          t: "project",   label: "SOURCES", kind: "source" },
  { s: "apc",          t: "workorder", label: "SOURCES", kind: "source" },
  { s: "arc",          t: "milestone", label: "SOURCES", kind: "source" },
  { s: "arc",          t: "raid",      label: "SOURCES", kind: "source" },
  { s: "toc_im",       t: "signal",    label: "SOURCES", kind: "source" },
  { s: "toc_st",       t: "signal",    label: "SOURCES", kind: "source" },
  { s: "toc_st",       t: "workorder", label: "SOURCES", kind: "source" },
  { s: "toc_forms",    t: "workorder", label: "SOURCES", kind: "source" },
  { s: "toc_support",  t: "dealer",    label: "SOURCES", kind: "source" },
  { s: "toc_prism",    t: "workorder", label: "SOURCES", kind: "source" },
  { s: "toc_acctmgmt", t: "dealer",    label: "SOURCES", kind: "source" },
  { s: "skilljar",     t: "resource",  label: "SOURCES", kind: "source" },
  { s: "skilljar",     t: "pem",       label: "SOURCES", kind: "source" },
  { s: "chronicleai",  t: "signal",    label: "SOURCES", kind: "source" },
];

const IS_PS_GRAPH = false;
// ── Enterprise Context Graph: realistic customer-engagement dataset ──────────
// 34 entities + 13 sources = 47 nodes, ~64 edges. Positioned in lifecycle
// clusters (marketing / sales / product / success / finance) with sources on an
// outer ring. Synthetic but stable stats per node.
function buildECG() {
  const CL = { marketing:[-480,-260], sales:[-30,30], product:[420,-200], success:[-330,350], finance:[470,300] };
  // [label, cluster, state, size]
  const ENTS = [
    ["Account","sales","core",34],["Contact","sales","core",28],["Lead","marketing","core",26],["Opportunity","sales","core",30],
    ["Campaign","marketing","core",26],["Channel","marketing","core",20],["Email","marketing","core",22],["Webinar","marketing","core",18],
    ["Form","marketing","core",18],["Audience","marketing","signal",22],["Persona","marketing","signal",20],
    ["Quote","sales","core",22],["Proposal","sales","core",22],["Competitor","sales","risk",20],["Meeting","sales","core",22],["Call","sales","core",22],
    ["Product","product","core",28],["Feature","product","core",22],["Subscription","product","core",28],["Usage Event","product","signal",24],["Entitlement","product","core",20],["Signal","product","signal",24],
    ["Ticket","success","incident",24],["Case","success","incident",22],["Health Score","success","signal",22],["NPS Response","success","core",18],["Renewal","success","core",24],["Churn Risk","success","risk",22],["Interaction","success","core",26],["Activity","success","core",18],
    ["Invoice","finance","core",26],["Payment","finance","core",22],["Contract","finance","core",24],["Order","finance","core",24],
  ];
  const SRCS = ["HubSpot","NetSuite ERP","Monday.com","Support Portal","Product Usage DB","Apollo","DocuSign","Google Drive","Gmail","Google Calendar","Slack","Product Docs","Web / Market Intel"];
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  const fmtK = n => n >= 1000 ? (n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,"")+"K" : String(n);
  const counts = {}; ENTS.forEach(e => { counts[e[1]] = (counts[e[1]]||0)+1; });
  const idx = {};
  const nodes = [];
  ENTS.forEach((e, i) => {
    const [label, cl, state, size] = e;
    const k = (idx[cl] = (idx[cl]||0)); idx[cl]++;
    const tot = counts[cl];
    const R = 78 + Math.min(tot,7)*13;
    const a = (k/Math.max(tot,1))*Math.PI*2 + (cl.length*0.7);
    const seed = label.length*7 + i*13;
    const inst = ((seed*1287)%180000) + 200;
    nodes.push({
      id: slug(label), label, type:"entity", state, cat: state==="core"?"core":state==="signal"?"derived":"support",
      x: Math.round(CL[cl][0] + Math.cos(a)*R), y: Math.round(CL[cl][1] + Math.sin(a)*R), size,
      instances: fmtK(inst), instancesN: inst, props: 8 + (seed%14), edges: 0,
      fill: 72 + (seed%27), conf: 80 + (seed%19), fresh: ["6m","12m","24m","1h","4h","1d"][seed%6],
      pii: (label==="Contact"||label==="Account"||label==="NPS Response"||label==="Payment")?(2+(seed%3)):0,
      change: ["LOW","MEDIUM","HIGH"][seed%3], desc: label+" entity in the customer engagement graph",
    });
  });
  SRCS.forEach((label, i) => {
    const a = (i/SRCS.length)*Math.PI*2 - Math.PI/2;
    const seed = label.length*5 + i*11;
    nodes.push({
      id: slug(label), label, type:"source", state:"core", cat:"source",
      x: Math.round(Math.cos(a)*820), y: Math.round(Math.sin(a)*640), size:24,
      instances:"—", instancesN:0, props: 12 + (seed%24), edges:0,
      fill: 96 + (seed%4), conf: 98 + (seed%2), fresh: ["2m","5m","12m","1h"][seed%4],
      pii: (label==="Apollo"||label==="Gmail"||label==="Support Portal")?(3+(seed%4)):0,
      change:"LOW", desc: label+" connected source system",
    });
  });
  const E = [
    ["contact","account","WORKS_AT","direct"],["account","contact","HAS_CONTACT","direct"],["lead","contact","CONVERTS_TO","direct"],
    ["account","opportunity","HAS_OPPORTUNITY","direct"],["opportunity","account","FOR_ACCOUNT","inferred"],["campaign","lead","GENERATES","direct"],
    ["campaign","channel","USES","direct"],["email","campaign","PART_OF","direct"],["webinar","campaign","PART_OF","direct"],["form","lead","CAPTURES","direct"],
    ["audience","contact","CONTAINS","inferred"],["persona","contact","DESCRIBES","inferred"],["opportunity","quote","HAS_QUOTE","direct"],["quote","proposal","BECOMES","direct"],
    ["opportunity","competitor","AGAINST","inferred"],["meeting","opportunity","ABOUT","direct"],["call","account","LOGGED_ON","direct"],
    ["account","subscription","SUBSCRIBES_TO","direct"],["subscription","product","FOR_PRODUCT","direct"],["product","feature","HAS_FEATURE","direct"],
    ["subscription","entitlement","GRANTS","direct"],["usage_event","feature","ON_FEATURE","direct"],["usage_event","account","FROM_ACCOUNT","inferred"],
    ["signal","account","OBSERVED_ON","direct"],["signal","usage_event","DERIVED_FROM","inferred"],["account","ticket","RAISES","direct"],["ticket","case","ESCALATES_TO","direct"],
    ["account","health_score","HAS_HEALTH","direct"],["health_score","signal","INPUTS","inferred"],["nps_response","contact","FROM_CONTACT","direct"],
    ["account","renewal","UP_FOR","direct"],["renewal","churn_risk","RISKS","inferred"],["churn_risk","account","FLAGS","inferred"],
    ["interaction","account","TOUCHES","inferred"],["interaction","contact","INVOLVES","direct"],["account","invoice","BILLED_BY","direct"],
    ["invoice","payment","PAID_BY","direct"],["account","contract","GOVERNED_BY","direct"],["subscription","contract","UNDER","direct"],
    ["order","subscription","FULFILLS","direct"],["activity","opportunity","ON","direct"],
    ["hubspot","account","SOURCES","source"],["hubspot","opportunity","SOURCES","source"],["hubspot","lead","SOURCES","source"],["hubspot","campaign","SOURCES","source"],
    ["apollo","contact","SOURCES","source"],["apollo","lead","SOURCES","source"],
    ["gmail","email","SOURCES","source"],["gmail","interaction","SOURCES","source"],
    ["google_calendar","meeting","SOURCES","source"],["google_calendar","call","SOURCES","source"],
    ["slack","interaction","SOURCES","source"],["slack","activity","SOURCES","source"],
    ["monday_com","activity","SOURCES","source"],["monday_com","meeting","SOURCES","source"],
    ["google_drive","proposal","SOURCES","source"],["google_drive","quote","SOURCES","source"],
    ["docusign","contract","SOURCES","source"],
    ["netsuite_erp","invoice","SOURCES","source"],["netsuite_erp","order","SOURCES","source"],["netsuite_erp","payment","SOURCES","source"],["netsuite_erp","subscription","SOURCES","source"],
    ["support_portal","ticket","SOURCES","source"],["support_portal","case","SOURCES","source"],["support_portal","nps_response","SOURCES","source"],["support_portal","renewal","SOURCES","source"],
    ["product_usage_db","usage_event","SOURCES","source"],["product_usage_db","signal","SOURCES","source"],["product_usage_db","feature","SOURCES","source"],["product_usage_db","entitlement","SOURCES","source"],["product_usage_db","health_score","SOURCES","source"],["product_usage_db","churn_risk","SOURCES","source"],
    ["product_docs","feature","SOURCES","source"],
    ["web_market_intel","competitor","SOURCES","source"],["web_market_intel","audience","SOURCES","source"],["web_market_intel","persona","SOURCES","source"],
  ];
  const ids = {}; nodes.forEach(n => { ids[n.id] = n; });
  const edges = E.filter(e => ids[e[0]] && ids[e[1]]).map(e => ({ s:e[0], t:e[1], label:e[2], kind:e[3] }));
  edges.forEach(e => { ids[e.s].edges++; ids[e.t].edges++; });
  return { nodes, edges };
}
const _ECG = buildECG();
const NODES = _ECG.nodes;
const EDGES = _ECG.edges;

const SIDEBAR_NODES = [...NODES].filter(n => n.type !== "agent" && n.type !== "source").sort((a, b) => a.label.localeCompare(b.label));

// ---------- HELPERS ---------------------------------------------------------

const TYPE_META = {
  entity: { tag: "ENTITY",      legend: "Entities" },
  agent:  { tag: "AGENT",       legend: "Agents" },
  source: { tag: "DATA SOURCE", legend: "Data Sources" },
};

const STATE_COLORS = {
  core:     { stroke: "var(--blue)",   fill: "var(--blue-fill)",   soft: "var(--blue-soft)"   },
  signal:   { stroke: "var(--gold)",   fill: "var(--gold-fill)",   soft: "var(--gold-soft)"   },
  risk:     { stroke: "var(--gold)",   fill: "var(--gold-fill)",   soft: "var(--gold-soft)"   },
  incident: { stroke: "var(--coral)",  fill: "var(--coral-fill)",  soft: "var(--coral-soft)"  },
};

// ── node glyphs + colors ──
var NODE_GLYPHS = (function(){
  function S(c){ return { fill:"none", stroke:c.stroke, strokeWidth:0.5, strokeLinecap:"round", strokeLinejoin:"round" }; }
  function dot(c, x, y, r){ return <circle cx={x} cy={y} r={r || 0.4} fill={c.stroke} stroke="none" />; }
  return [
    // ── PEOPLE & ORG ─────────────────────────────────────────────────────
    { id:"account",      label:"Account",      aliases:"account customer organization company business client", render:function(c){ return <g {...S(c)}><rect x="-3.2" y="-3" width="6.4" height="6" rx="0.6"/><line x1="-3.2" y1="-1.2" x2="3.2" y2="-1.2"/><circle cx="0" cy="0.6" r="1"/><line x1="-1.6" y1="2.4" x2="1.6" y2="2.4"/></g>; } },
    { id:"person",       label:"Person",       aliases:"person user profile head individual", render:function(c){ return <g {...S(c)}><circle cx="0" cy="-1.4" r="1.5"/><path d="M -2.8 3.2 a 2.8 2.8 0 0 1 5.6 0"/></g>; } },
    { id:"team",         label:"Team",         aliases:"team group people two users members", render:function(c){ return <g {...S(c)}><circle cx="-1.6" cy="-1.4" r="1.2"/><circle cx="1.6" cy="-1.4" r="1.2"/><path d="M -3.6 3.2 a 2 2 0 0 1 4 0"/><path d="M -0.4 3.2 a 2 2 0 0 1 4 0"/></g>; } },
    { id:"contact",      label:"Contact",      aliases:"contact address book card", render:function(c){ return <g {...S(c)}><rect x="-3.2" y="-2.4" width="6.4" height="4.8" rx="0.5"/><circle cx="-1.2" cy="-0.4" r="0.9"/><path d="M -2.4 1.7 a 1.6 1.6 0 0 1 2.4 0"/><line x1="1" y1="-0.6" x2="2.6" y2="-0.6"/><line x1="1" y1="0.4" x2="2.6" y2="0.4"/></g>; } },
    { id:"employee",     label:"Employee",     aliases:"employee staff worker badge id", render:function(c){ return <g {...S(c)}><rect x="-2.6" y="-3" width="5.2" height="6" rx="0.6"/><line x1="-1" y1="-3" x2="1" y2="-3"/><circle cx="0" cy="-0.6" r="1.1"/><path d="M -1.8 2.2 a 1.8 1.8 0 0 1 3.6 0"/></g>; } },
    { id:"organization", label:"Organization", aliases:"organization building company office hq", render:function(c){ return <g {...S(c)}><rect x="-3" y="-2.8" width="6" height="5.8" rx="0.4"/><line x1="-3" y1="0" x2="3" y2="0"/><rect x="-2" y="-2" width="1" height="1"/><rect x="-0.5" y="-2" width="1" height="1"/><rect x="1" y="-2" width="1" height="1"/><rect x="-2" y="0.8" width="1" height="1"/><rect x="-0.5" y="0.8" width="1.4" height="2.2"/><rect x="1.4" y="0.8" width="1" height="1"/></g>; } },
    // ── DOCUMENTS ────────────────────────────────────────────────────────
    { id:"document",     label:"Document",     aliases:"document file page text", render:function(c){ return <g {...S(c)}><path d="M -2.2 -3.2 H 1 L 2.6 -1.6 V 3.2 H -2.2 Z"/><path d="M 1 -3.2 V -1.6 H 2.6"/><line x1="-1.2" y1="-0.3" x2="1.6" y2="-0.3"/><line x1="-1.2" y1="1" x2="1.6" y2="1"/><line x1="-1.2" y1="2.2" x2="0.6" y2="2.2"/></g>; } },
    { id:"contract",     label:"Contract",     aliases:"contract document signed legal terms", render:function(c){ return <g {...S(c)}><path d="M -2.2 -3.2 H 1 L 2.6 -1.6 V 3.2 H -2.2 Z"/><path d="M 1 -3.2 V -1.6 H 2.6"/><line x1="-1.2" y1="0.4" x2="1.6" y2="0.4"/><line x1="-1.2" y1="1.8" x2="0.6" y2="1.8"/></g>; } },
    { id:"agreement",    label:"Agreement",    aliases:"agreement deal pact mou folded", render:function(c){ return <g {...S(c)}><path d="M -3.4 -0.6 L -1.6 -2.4 L 0 -0.8 L 1.6 -2.4 L 3.4 -0.6"/><path d="M -3.4 -0.6 V 1.4 L -1.6 3 L 0 1.4"/><path d="M 3.4 -0.6 V 1.4 L 1.6 3 L 0 1.4"/></g>; } },
    { id:"sow",          label:"SOW",          aliases:"sow statement work checklist scope", render:function(c){ return <g {...S(c)}><rect x="-2.6" y="-3.2" width="5.2" height="6.4" rx="0.5"/><polyline points="-1.6,-1.2 -1,-0.6 0,-1.8"/><line x1="0.6" y1="-1" x2="1.8" y2="-1"/><polyline points="-1.6,0.8 -1,1.4 0,0.2"/><line x1="0.6" y1="1" x2="1.8" y2="1"/></g>; } },
    { id:"invoice",      label:"Invoice",      aliases:"invoice bill receipt zigzag", render:function(c){ return <g {...S(c)}><path d="M -2.2 -3.2 H 2.2 V 3.2 L 1.4 2.4 L 0.6 3.2 L -0.2 2.4 L -1 3.2 L -1.8 2.4 L -2.2 3 Z"/><line x1="-1.2" y1="-1.6" x2="1.2" y2="-1.6"/><line x1="-1.2" y1="-0.3" x2="1.2" y2="-0.3"/><line x1="-1.2" y1="1" x2="0.4" y2="1"/></g>; } },
    { id:"receipt",      label:"Receipt",      aliases:"receipt invoice purchase", render:function(c){ return <g {...S(c)}><path d="M -2 -3.2 H 2 V 3.2 L 1.2 2.6 L 0 3.2 L -1.2 2.6 L -2 3.2 Z"/><line x1="-1" y1="-1.6" x2="1" y2="-1.6"/><line x1="-1" y1="-0.4" x2="1" y2="-0.4"/><line x1="-1" y1="0.8" x2="0.4" y2="0.8"/></g>; } },
    { id:"report",       label:"Report",       aliases:"report analytics chart pdf", render:function(c){ return <g {...S(c)}><path d="M -2.2 -3.2 H 1 L 2.6 -1.6 V 3.2 H -2.2 Z"/><path d="M 1 -3.2 V -1.6 H 2.6"/><line x1="-1.4" y1="1.8" x2="-1.4" y2="1"/><line x1="-0.3" y1="1.8" x2="-0.3" y2="-0.2"/><line x1="0.8" y1="1.8" x2="0.8" y2="0.4"/></g>; } },
    { id:"license",      label:"License",      aliases:"license certificate award medal", render:function(c){ return <g {...S(c)}><circle cx="0" cy="-0.8" r="1.7"/><path d="M -1.2 0.6 L -1.6 3 L 0 2 L 1.6 3 L 1.2 0.6"/><circle cx="0" cy="-0.8" r="0.7"/></g>; } },
    { id:"note",         label:"Note",         aliases:"note sticky memo postit", render:function(c){ return <g {...S(c)}><path d="M -2.6 -2.6 H 1.4 L 2.6 -1.4 V 2.6 H -2.6 Z"/><path d="M 1.4 -2.6 V -1.4 H 2.6"/><line x1="-1.6" y1="0.4" x2="1.4" y2="0.4"/><line x1="-1.6" y1="1.6" x2="0.4" y2="1.6"/></g>; } },
    // ── COMMERCE ─────────────────────────────────────────────────────────
    { id:"order",        label:"Order",        aliases:"order purchase bag", render:function(c){ return <g {...S(c)}><path d="M -2.6 -1.2 L -2.2 3.2 H 2.2 L 2.6 -1.2 Z"/><path d="M -1.4 -1.2 V -1.8 a 1.4 1.4 0 0 1 2.8 0 V -1.2"/></g>; } },
    { id:"cart",         label:"Cart",         aliases:"cart shopping basket buy", render:function(c){ return <g {...S(c)}><polyline points="-3,-2 -1.8,-2 -1,1.4 2,1.4 2.8,-0.8 -1.4,-0.8"/>{dot(c,-0.6,2.6,0.5)}{dot(c,1.8,2.6,0.5)}</g>; } },
    { id:"payment",      label:"Payment",      aliases:"payment money cash bill banknote", render:function(c){ return <g {...S(c)}><rect x="-3.4" y="-2.2" width="6.8" height="4.4" rx="0.5"/><circle cx="0" cy="0" r="1.1"/><line x1="-2.6" y1="-1.4" x2="-2.6" y2="1.4"/><line x1="2.6" y1="-1.4" x2="2.6" y2="1.4"/></g>; } },
    { id:"card",         label:"Card",         aliases:"card credit debit visa stripe", render:function(c){ return <g {...S(c)}><rect x="-3.2" y="-2.2" width="6.4" height="4.4" rx="0.5"/><line x1="-3.2" y1="-0.8" x2="3.2" y2="-0.8"/><line x1="-2.4" y1="1.2" x2="-0.6" y2="1.2"/><line x1="0.6" y1="1.2" x2="2" y2="1.2"/></g>; } },
    { id:"subscription", label:"Subscription", aliases:"subscription recurring renewal cycle refresh", render:function(c){ return <g {...S(c)}><path d="M 3 0 a 3 3 0 1 1 -0.9 -2.1"/><polyline points="3,-2.6 3,-0.4 0.8,-0.4"/></g>; } },
    { id:"coupon",       label:"Coupon",       aliases:"coupon discount voucher promo", render:function(c){ return <g {...S(c)}><path d="M -3 -1.6 H 3 V -0.4 a 0.8 0.8 0 0 0 0 1.6 V 2 H -3 V 1.2 a 0.8 0.8 0 0 0 0 -1.6 Z"/>{dot(c,-1,0.4,0.4)}<line x1="0.4" y1="-0.4" x2="2" y2="-0.4"/><line x1="0.4" y1="1.2" x2="2" y2="1.2"/></g>; } },
    { id:"refund",       label:"Refund",       aliases:"refund return reverse money back", render:function(c){ return <g {...S(c)}><path d="M -3 0 a 3 3 0 1 0 0.9 -2.1"/><polyline points="-3,-2.6 -3,-0.4 -0.8,-0.4"/></g>; } },
    // ── RISK & GOVERNANCE ────────────────────────────────────────────────
    { id:"ticket",       label:"Ticket",       aliases:"ticket support issue zendesk", render:function(c){ return <g {...S(c)}><path d="M -3.2 -2 H 3.2 V -0.6 a 0.7 0.7 0 0 0 0 1.4 V 2 H -3.2 V 0.8 a 0.7 0.7 0 0 0 0 -1.4 Z"/><line x1="-0.4" y1="-1" x2="-0.4" y2="1" strokeDasharray="0.5 0.5"/></g>; } },
    { id:"incident",     label:"Incident",     aliases:"incident alert warning triangle", render:function(c){ return <g {...S(c)}><path d="M 0 -3.2 L 3.4 2.8 H -3.4 Z"/><line x1="0" y1="-0.8" x2="0" y2="1.1"/>{dot(c,0,2.1,0.4)}</g>; } },
    { id:"risk",         label:"Risk",         aliases:"risk threat hazard shield warning", render:function(c){ return <g {...S(c)}><path d="M 0 -3.2 L 3 -2 V 0.8 Q 3 2.6 0 3.2 Q -3 2.6 -3 0.8 V -2 Z"/><line x1="0" y1="-1.2" x2="0" y2="0.6"/>{dot(c,0,1.6,0.4)}</g>; } },
    { id:"flag",         label:"Flag",         aliases:"flag mark important pin", render:function(c){ return <g {...S(c)}><line x1="-2.4" y1="-3.2" x2="-2.4" y2="3.2"/><path d="M -2.4 -2.6 L 2.6 -2.6 L 1.4 -0.8 L 2.6 1 L -2.4 1"/></g>; } },
    { id:"policy",       label:"Policy",       aliases:"policy compliance shield check verified", render:function(c){ return <g {...S(c)}><path d="M 0 -3.2 L 3 -2 V 0.8 Q 3 2.6 0 3.2 Q -3 2.6 -3 0.8 V -2 Z"/><polyline points="-1.2,0.2 -0.2,1.2 1.4,-0.6"/></g>; } },
    { id:"lock",         label:"Lock",         aliases:"lock secure private security key", render:function(c){ return <g {...S(c)}><rect x="-2.4" y="-0.4" width="4.8" height="3.6" rx="0.4"/><path d="M -1.6 -0.4 V -1.6 a 1.6 1.6 0 0 1 3.2 0 V -0.4"/><line x1="0" y1="1" x2="0" y2="2"/></g>; } },
    { id:"shield",       label:"Shield",       aliases:"shield protect security defend", render:function(c){ return <g {...S(c)}><path d="M 0 -3.2 L 3 -2 V 0.8 Q 3 2.6 0 3.2 Q -3 2.6 -3 0.8 V -2 Z"/></g>; } },
    { id:"audit",        label:"Audit",        aliases:"audit log history magnifying review", render:function(c){ return <g {...S(c)}><circle cx="-0.4" cy="-0.4" r="2.2"/><line x1="1.2" y1="1.2" x2="3" y2="3"/><line x1="-1.6" y1="-0.4" x2="0.8" y2="-0.4"/><line x1="-0.4" y1="-1.6" x2="-0.4" y2="0.8"/></g>; } },
    // ── DATA & INFRA ─────────────────────────────────────────────────────
    { id:"database",     label:"Database",     aliases:"database db storage data table", render:function(c){ return <g {...S(c)}><ellipse cx="0" cy="-2.2" rx="2.8" ry="0.9"/><path d="M -2.8 -2.2 V 2.2 Q 0 3.2 2.8 2.2 V -2.2"/><path d="M -2.8 0 Q 0 1 2.8 0"/></g>; } },
    { id:"server",       label:"Server",       aliases:"server compute rack instance", render:function(c){ return <g {...S(c)}><rect x="-2.8" y="-2.6" width="5.6" height="2.4" rx="0.4"/><rect x="-2.8" y="0.2" width="5.6" height="2.4" rx="0.4"/>{dot(c,-1.8,-1.4,0.3)}{dot(c,-1.8,1.4,0.3)}<line x1="0" y1="-1.4" x2="1.6" y2="-1.4"/><line x1="0" y1="1.4" x2="1.6" y2="1.4"/></g>; } },
    { id:"cloud",        label:"Cloud",        aliases:"cloud storage aws gcp azure", render:function(c){ return <g {...S(c)}><path d="M -2.6 1.8 a 1.6 1.6 0 0 1 0 -3 a 2 2 0 0 1 3.8 -0.6 a 1.5 1.5 0 0 1 1 3.6 Z"/></g>; } },
    { id:"file",         label:"File",         aliases:"file document attachment paper", render:function(c){ return <g {...S(c)}><path d="M -2 -3.2 H 1 L 2.6 -1.6 V 3.2 H -2 Z"/><path d="M 1 -3.2 V -1.6 H 2.6"/></g>; } },
    { id:"folder",       label:"Folder",       aliases:"folder directory group", render:function(c){ return <g {...S(c)}><path d="M -3 -2 H -0.4 L 0.6 -1 H 3 V 2.6 H -3 Z"/></g>; } },
    { id:"archive",      label:"Archive",      aliases:"archive store box cold", render:function(c){ return <g {...S(c)}><rect x="-3" y="-2.6" width="6" height="1.6" rx="0.3"/><path d="M -2.6 -1 H 2.6 V 2.6 H -2.6 Z"/><line x1="-1" y1="0.4" x2="1" y2="0.4"/></g>; } },
    { id:"api",          label:"API",          aliases:"api endpoint braces code", render:function(c){ return <g {...S(c)}><path d="M -1.2 -2.6 H -2 a 0.6 0.6 0 0 0 -0.6 0.6 V -0.6 a 0.6 0.6 0 0 1 -0.6 0.6 a 0.6 0.6 0 0 1 0.6 0.6 V 2 a 0.6 0.6 0 0 0 0.6 0.6 H -1.2"/><path d="M 1.2 -2.6 H 2 a 0.6 0.6 0 0 1 0.6 0.6 V -0.6 a 0.6 0.6 0 0 0 0.6 0.6 a 0.6 0.6 0 0 0 -0.6 0.6 V 2 a 0.6 0.6 0 0 1 -0.6 0.6 H 1.2"/></g>; } },
    { id:"webhook",      label:"Webhook",      aliases:"webhook callback trigger event", render:function(c){ return <g {...S(c)}><circle cx="0" cy="-1" r="1.2"/><path d="M -0.6 -0.2 L -2.4 2.4"/><path d="M 0.6 -0.2 L 2.4 2.4"/><circle cx="-2.4" cy="2.4" r="0.7"/><circle cx="2.4" cy="2.4" r="0.7"/></g>; } },
    { id:"sync",         label:"Sync",         aliases:"sync refresh reload repeat update", render:function(c){ return <g {...S(c)}><path d="M 2.8 -1 a 3 3 0 0 0 -5.6 0.4"/><polyline points="-2.8,-2.2 -2.8,-0.8 -1.4,-0.8"/><path d="M -2.8 1 a 3 3 0 0 0 5.6 -0.4"/><polyline points="2.8,2.2 2.8,0.8 1.4,0.8"/></g>; } },
    // ── COMMS ────────────────────────────────────────────────────────────
    { id:"email",        label:"Email",        aliases:"email mail message envelope", render:function(c){ return <g {...S(c)}><rect x="-3" y="-2.2" width="6" height="4.4" rx="0.5"/><polyline points="-3,-2 0,0.4 3,-2"/></g>; } },
    { id:"chat",         label:"Chat",         aliases:"chat message bubble conversation", render:function(c){ return <g {...S(c)}><path d="M -3 -2.2 H 3 V 1.6 H 0.8 L -1 3 V 1.6 H -3 Z"/>{dot(c,-1.2,-0.3,0.4)}{dot(c,0,-0.3,0.4)}{dot(c,1.2,-0.3,0.4)}</g>; } },
    { id:"message",      label:"Message",      aliases:"message dm direct notification", render:function(c){ return <g {...S(c)}><path d="M -3 -2.2 H 3 V 1.6 H -0.4 L -1.4 2.6 L -1.4 1.6 H -3 Z"/></g>; } },
    { id:"bell",         label:"Bell",         aliases:"bell notification alert ping", render:function(c){ return <g {...S(c)}><path d="M -2.2 1.6 H 2.2 L 1.6 0.8 V -1 a 1.6 1.6 0 0 0 -3.2 0 V 0.8 Z"/><path d="M -0.6 2.6 a 1.2 1.2 0 0 0 2.4 0"/></g>; } },
    { id:"phone",        label:"Phone",        aliases:"phone call ring telephone", render:function(c){ return <g {...S(c)}><path d="M -2.6 -2.6 L -1 -1 L -1.6 0 a 4 4 0 0 0 1.6 1.6 L 1 1 L 2.6 2.6 a 1 1 0 0 1 -1 1 a 5 5 0 0 1 -4.6 -4.6 a 1 1 0 0 1 1 -1 Z"/></g>; } },
    // ── AUTOMATION & AI ──────────────────────────────────────────────────
    { id:"agent",        label:"Agent",        aliases:"agent bot ai assistant robot", render:function(c){ return <g {...S(c)}><rect x="-2.6" y="-1.6" width="5.2" height="4.4" rx="1"/><line x1="0" y1="-3.4" x2="0" y2="-1.6"/>{dot(c,0,-3.4,0.4)}{dot(c,-1.1,0.4,0.45)}{dot(c,1.1,0.4,0.45)}<line x1="-1" y1="1.8" x2="1" y2="1.8"/></g>; } },
    { id:"automation",   label:"Automation",   aliases:"automation zap bolt trigger workflow", render:function(c){ return <g {...S(c)}><path d="M 0.8 -3.2 L -1.8 0.4 L 0 0.4 L -0.6 3.2 L 2 -0.2 L 0.2 -0.2 Z"/></g>; } },
    { id:"workflow",     label:"Workflow",     aliases:"workflow dag pipeline graph nodes", render:function(c){ return <g {...S(c)}><circle cx="-2.4" cy="-1.8" r="1"/><circle cx="2.4" cy="-1.8" r="1"/><circle cx="0" cy="2.2" r="1"/><line x1="-1.6" y1="-1" x2="-0.6" y2="1.4"/><line x1="1.6" y1="-1" x2="0.6" y2="1.4"/><line x1="-1.4" y1="-1.8" x2="1.4" y2="-1.8"/></g>; } },
    { id:"settings",     label:"Settings",     aliases:"settings cog gear config preferences", render:function(c){ return <g {...S(c)}><circle r="1.2"/><path d="M 0 -3 V -2 M 0 2 V 3 M -3 0 H -2 M 2 0 H 3 M -2.1 -2.1 L -1.4 -1.4 M 1.4 -1.4 L 2.1 -2.1 M -2.1 2.1 L -1.4 1.4 M 1.4 1.4 L 2.1 2.1"/></g>; } },
    { id:"schedule",     label:"Schedule",     aliases:"schedule clock time cron timer", render:function(c){ return <g {...S(c)}><circle r="3"/><polyline points="0,-1.8 0,0 1.6,0.8"/></g>; } },
    { id:"trigger",      label:"Trigger",      aliases:"trigger lightning bolt event flash", render:function(c){ return <g {...S(c)}><path d="M 1 -3 L -1.6 0.2 H 0.2 L -1 3 L 1.8 0 H 0 Z"/></g>; } },
    // ── PROJECT & EVENT ──────────────────────────────────────────────────
    { id:"project",      label:"Project",      aliases:"project initiative epic workstream", render:function(c){ return <g {...S(c)}><rect x="-3" y="-2.4" width="6" height="5" rx="0.4"/><line x1="-3" y1="-0.8" x2="3" y2="-0.8"/><line x1="-2" y1="0.4" x2="-0.4" y2="0.4"/><line x1="-2" y1="1.4" x2="1.4" y2="1.4"/></g>; } },
    { id:"task",         label:"Task",         aliases:"task todo checkbox done", render:function(c){ return <g {...S(c)}><rect x="-3" y="-3" width="6" height="6" rx="0.5"/><polyline points="-1.6,0 -0.4,1.2 1.6,-1"/></g>; } },
    { id:"milestone",    label:"Milestone",    aliases:"milestone goal flag pin diamond", render:function(c){ return <g {...S(c)}><line x1="-2.4" y1="-3" x2="-2.4" y2="3"/><polygon points="-2.4,-2.4 2.4,-1.8 1,-0.4 2.4,1 -2.4,0.4"/></g>; } },
    { id:"event",        label:"Event",        aliases:"event calendar date meeting", render:function(c){ return <g {...S(c)}><rect x="-2.8" y="-2.4" width="5.6" height="5.4" rx="0.5"/><line x1="-2.8" y1="-0.6" x2="2.8" y2="-0.6"/><line x1="-1.4" y1="-3.2" x2="-1.4" y2="-1.6"/><line x1="1.4" y1="-3.2" x2="1.4" y2="-1.6"/>{dot(c,-1,1.4,0.4)}{dot(c,1,1.4,0.4)}</g>; } },
    // ── ANALYTICS ────────────────────────────────────────────────────────
    { id:"metric",       label:"Metric",       aliases:"metric chart bar stats analytics", render:function(c){ return <g {...S(c)}><line x1="-3" y1="3" x2="3" y2="3"/><line x1="-2" y1="3" x2="-2" y2="1"/><line x1="0" y1="3" x2="0" y2="-0.5"/><line x1="2" y1="3" x2="2" y2="-2"/></g>; } },
    { id:"trend",        label:"Trend",        aliases:"trend up arrow growth increase", render:function(c){ return <g {...S(c)}><polyline points="-3,2 -1.4,0 0.4,1.2 2.6,-1.6"/><polyline points="2.6,-1.6 2.6,-0.4 1.4,-0.4"/></g>; } },
    { id:"pie",          label:"Pie chart",    aliases:"pie chart distribution share", render:function(c){ return <g {...S(c)}><circle r="2.8"/><line x1="0" y1="0" x2="0" y2="-2.8"/><line x1="0" y1="0" x2="2.4" y2="1.4"/></g>; } },
    { id:"funnel",       label:"Funnel",       aliases:"funnel pipeline conversion stages", render:function(c){ return <g {...S(c)}><path d="M -3 -2.4 H 3 L 1.2 0.4 V 2.8 H -1.2 V 0.4 Z"/></g>; } },
    { id:"dashboard",    label:"Dashboard",    aliases:"dashboard panel widgets layout", render:function(c){ return <g {...S(c)}><rect x="-3" y="-2.4" width="6" height="5" rx="0.4"/><line x1="-3" y1="-0.4" x2="3" y2="-0.4"/><line x1="0" y1="-0.4" x2="0" y2="2.6"/></g>; } },
    { id:"target",       label:"Target",       aliases:"target goal kpi bullseye lead", render:function(c){ return <g {...S(c)}><circle r="3"/><circle r="1.6"/>{dot(c,0,0,0.5)}</g>; } },
    // ── STATUS ───────────────────────────────────────────────────────────
    { id:"star",         label:"Star",         aliases:"star favorite featured rating", render:function(c){ return <g {...S(c)}><polygon points="0,-3 0.9,-0.9 3,-0.6 1.4,0.8 1.8,3 0,1.9 -1.8,3 -1.4,0.8 -3,-0.6 -0.9,-0.9"/></g>; } },
    { id:"heart",        label:"Heart",        aliases:"heart like love favorite", render:function(c){ return <g {...S(c)}><path d="M 0 3 C -3 1.4 -3 -0.8 -1.6 -1.8 a 1.6 1.6 0 0 1 1.6 0.6 a 1.6 1.6 0 0 1 1.6 -0.6 C 3 -0.8 3 1.4 0 3 Z"/></g>; } },
    { id:"bookmark",     label:"Bookmark",     aliases:"bookmark save ribbon mark", render:function(c){ return <g {...S(c)}><path d="M -1.8 -3 H 1.8 V 3 L 0 1.6 L -1.8 3 Z"/></g>; } },
    { id:"pin",          label:"Pin",          aliases:"pin tack pushpin attach", render:function(c){ return <g {...S(c)}><path d="M 1 -3 L 3 -1 L 2 0 L 0.4 -0.4 L -1.6 2.6 L -2.4 1.8 L 0.6 0 L 0 -1.6 Z"/></g>; } },
    { id:"tag",          label:"Tag",          aliases:"tag label category badge", render:function(c){ return <g {...S(c)}><path d="M -3 -2.4 H 0.6 L 3.2 0.2 L 0.4 3 L -3 -0.4 Z"/><circle cx="-1.6" cy="-1" r="0.5"/></g>; } },
    { id:"check",        label:"Check",        aliases:"check done complete tick approved", render:function(c){ return <g {...S(c)}><circle r="3"/><polyline points="-1.4,0 -0.2,1.2 1.6,-1"/></g>; } },
    // ── LOCATION ─────────────────────────────────────────────────────────
    { id:"location",     label:"Location",     aliases:"location pin place address marker", render:function(c){ return <g {...S(c)}><path d="M 0 3.4 C -2.4 1 -2.8 -0.4 -2.8 -1.2 a 2.8 2.8 0 0 1 5.6 0 C 2.8 -0.4 2.4 1 0 3.4 Z"/><circle cx="0" cy="-1.2" r="0.8"/></g>; } },
    { id:"globe",        label:"Globe",        aliases:"globe earth world planet", render:function(c){ return <g {...S(c)}><circle r="3"/><ellipse cx="0" cy="0" rx="1.2" ry="3"/><line x1="-3" y1="0" x2="3" y2="0"/></g>; } },
    { id:"map",          label:"Map",          aliases:"map territory region area", render:function(c){ return <g {...S(c)}><path d="M -3 -2 L -1 -2.6 L 1 -2 L 3 -2.6 V 2.6 L 1 3.2 L -1 2.6 L -3 3.2 Z"/><line x1="-1" y1="-2.6" x2="-1" y2="2.6"/><line x1="1" y1="-2" x2="1" y2="3.2"/></g>; } },
    // ── MISC ─────────────────────────────────────────────────────────────
    { id:"idea",         label:"Idea",         aliases:"idea lightbulb insight inspiration", render:function(c){ return <g {...S(c)}><path d="M 0 -3 a 2.4 2.4 0 0 1 1.6 4.2 V 1.6 H -1.6 V 1.2 A 2.4 2.4 0 0 1 0 -3 Z"/><line x1="-1.2" y1="2.4" x2="1.2" y2="2.4"/><line x1="-0.8" y1="3.2" x2="0.8" y2="3.2"/></g>; } },
    { id:"eye",          label:"Eye",          aliases:"eye view watch visibility see", render:function(c){ return <g {...S(c)}><path d="M -3 0 C -1.4 -2 1.4 -2 3 0 C 1.4 2 -1.4 2 -3 0 Z"/><circle r="1"/></g>; } },
    { id:"search",       label:"Search",       aliases:"search find query magnifier", render:function(c){ return <g {...S(c)}><circle cx="-0.6" cy="-0.6" r="2"/><line x1="0.8" y1="0.8" x2="2.8" y2="2.8"/></g>; } },
    { id:"briefcase",    label:"Briefcase",    aliases:"briefcase work job business case",  render:function(c){ return <g {...S(c)}><rect x="-3" y="-1.4" width="6" height="4.4" rx="0.4"/><path d="M -1.4 -1.4 V -2 a 0.6 0.6 0 0 1 0.6 -0.6 H 0.8 a 0.6 0.6 0 0 1 0.6 0.6 V -1.4"/><line x1="-3" y1="0.4" x2="3" y2="0.4"/></g>; } },
    { id:"channel",      label:"Channel",      aliases:"channel hashtag tag slack room",     render:function(c){ return <g {...S(c)}><line x1="-1.4" y1="-3" x2="-2" y2="3"/><line x1="2" y1="-3" x2="1.4" y2="3"/><line x1="-3" y1="-1" x2="3" y2="-1"/><line x1="-3" y1="1.2" x2="3" y2="1.2"/></g>; } },
    { id:"integration",  label:"Integration",  aliases:"integration link plug connect chain", render:function(c){ return <g {...S(c)}><path d="M -2.6 -0.6 a 1.2 1.2 0 0 1 0 -1.7 l 0.9 -0.9 a 1.2 1.2 0 0 1 1.7 0 l 0.6 0.6"/><path d="M 2.6 0.6 a 1.2 1.2 0 0 1 0 1.7 l -0.9 0.9 a 1.2 1.2 0 0 1 -1.7 0 l -0.6 -0.6"/><line x1="-1" y1="1" x2="1" y2="-1"/></g>; } },
    { id:"bug",          label:"Bug",          aliases:"bug defect issue error",              render:function(c){ return <g {...S(c)}><ellipse cx="0" cy="0.4" rx="1.8" ry="2.4"/><line x1="-1.8" y1="-1.4" x2="-2.8" y2="-2.4"/><line x1="1.8" y1="-1.4" x2="2.8" y2="-2.4"/><line x1="-1.8" y1="0.4" x2="-3" y2="0.4"/><line x1="1.8" y1="0.4" x2="3" y2="0.4"/><line x1="-1.8" y1="2" x2="-2.8" y2="2.8"/><line x1="1.8" y1="2" x2="2.8" y2="2.8"/></g>; } },
    { id:"help",         label:"Help",         aliases:"help question support faq",           render:function(c){ return <g {...S(c)}><circle r="2.8"/><path d="M -1 -0.6 a 1 1 0 0 1 2 0 c 0 0.7 -1 0.8 -1 1.5"/>{dot(c,0,2.2,0.4)}</g>; } },
  ];
})();
function colorForNode(n) {
  if (n.type === "agent")  return { stroke: "var(--purple)", fill: "var(--purple-fill)", soft: "var(--purple-soft)" };
  if (n.type === "source") return { stroke: "var(--green)",  fill: "var(--green-fill)",  soft: "var(--green-soft)"  };
  return STATE_COLORS[n.state] || STATE_COLORS.core;
}

// ---------- ICONS (small inline SVG glyphs inside list items) ---------------

// Semantic glyph library — comprehensive enterprise icon set covering the
// node types users actually model: people, documents, commerce, risk,
// data, comms, automation, analytics, status, location.
//
// Design rules (consistent across the library):
//   - Pure outline. Filled accent dots only.
//   - Single stroke weight (0.5 in user space) — light, consistent with
//     the cream/paper aesthetic.
//   - strokeLinecap + strokeLinejoin: round.
//   - All glyphs drawn in the [-4..4] coordinate space.
//   - Each entry carries `aliases` for searchability.

// ── ListGlyph ──
function ListGlyph({ node, size = 18 }) {
  const c = colorForNode(node);
  // inner glyph based on node state/type (matches canvas)
  let inner = null;
  // If the node has an explicit picked glyph, use that — overrides default heuristics.
  if (node.glyph) {
    var g = glyphById(node.glyph);
    if (g) inner = g.render(c);
  }
  if (inner === null) {
  if (node.state === "signal") {
    inner = <polygon points="0,-3.6 3.6,0 0,3.6 -3.6,0" fill={c.stroke} />;
  } else if (node.state === "risk") {
    inner = <polygon points="0,-3.4 3.2,2.6 -3.2,2.6" fill="none" stroke={c.stroke} strokeWidth="1.1" />;
  } else if (node.state === "incident") {
    inner = <g><line x1="0" y1="-2.4" x2="0" y2="1.2" stroke={c.stroke} strokeWidth="1.3" strokeLinecap="round" /><circle cx="0" cy="2.6" r="0.7" fill={c.stroke} /></g>;
  } else if (node.id === "account") {
    inner = <polygon points="0,-3.2 3.2,0 0,3.2 -3.2,0" fill="none" stroke={c.stroke} strokeWidth="1.1" />;
  } else if (node.id === "person" || node.id === "employee") {
    inner = <circle r="3" fill="none" stroke={c.stroke} strokeWidth="1" />;
  } else if (node.id === "subscription") {
    inner = <rect x="-3.6" y="-1" width="7.2" height="2" rx="1" fill="none" stroke={c.stroke} strokeWidth="1" />;
  } else if (node.id === "agreement" || node.id === "invoice") {
    inner = <rect x="-3" y="-3.6" width="6" height="7.2" rx="0.6" fill="none" stroke={c.stroke} strokeWidth="1" />;
  } else if (node.id === "interaction") {
    inner = <g><path d="M -4 0 q 1.5 -2.4 3 0 t 3 0" fill="none" stroke={c.stroke} strokeWidth="1.1" /><path d="M 3 -1.5 L 4.5 0 L 3 1.5" fill="none" stroke={c.stroke} strokeWidth="1.1" strokeLinejoin="round" /></g>;
  } else if (node.id === "ticket") {
    inner = <g><circle r="3.4" fill="none" stroke={c.stroke} strokeWidth="1" /><path d="M 0 -3.4 A 3.4 3.4 0 0 1 0 3.4 Z" fill={c.stroke} /></g>;
  } else if (node.type === "agent") {
    inner = <polygon points="0,-3.4 2.4,0 0,3.4 -2.4,0" fill="none" stroke={c.stroke} strokeWidth="1" />;
  } else if (node.type === "source") {
    inner = <g><rect x="-3" y="-3" width="3" height="3" fill="none" stroke={c.stroke} strokeWidth="0.9" /><rect x="0" y="-3" width="3" height="3" fill="none" stroke={c.stroke} strokeWidth="0.9" /><rect x="-3" y="0" width="3" height="3" fill="none" stroke={c.stroke} strokeWidth="0.9" /><rect x="0" y="0" width="3" height="3" fill="none" stroke={c.stroke} strokeWidth="0.9" /></g>;
  } else {
    inner = <circle r="1.6" fill={c.stroke} />;
  }
  } // end of fallback heuristics — only runs when node.glyph wasn't supplied

  // outer shape — match canvas (circle/hex/square)
  let outer;
  if (node.type === "agent") {
    outer = <polygon points="-9.5,0 -4.75,-8.2 4.75,-8.2 9.5,0 4.75,8.2 -4.75,8.2" fill={c.fill} stroke={c.stroke} strokeWidth="1.3" />;
  } else if (node.type === "source") {
    outer = <rect x="-8.5" y="-8.5" width="17" height="17" rx="1.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.3" />;
  } else {
    outer = <circle r="9" fill={c.fill} stroke={c.stroke} strokeWidth="1.3" />;
  }

  // If the node carries an uploaded image, drop it into the body using
  // foreignObject so we can render the HTML <img> with object-fit centred.
  if (node.glyphImage) {
    return (
      <svg width={size} height={size} viewBox="-12 -12 24 24" style={{ flexShrink: 0 }}>
        {outer}
        <foreignObject x="-7" y="-7" width="14" height="14">
          <img src={node.glyphImage} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
        </foreignObject>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" style={{ flexShrink: 0 }}>
      {outer}
      {inner}
    </svg>
  );
}

// ── Canvas ──
function Canvas({ nodes, setNodes, edges, setEdges, selected, setSelected, hover, setHover, filter, query, savedView, viewport, setViewport, sidebarOpen, showInferred, showEdgeLabels, showCounts, editMode, cursorMode, multiSelected, setMultiSelected, pushHistory, onEditAdd, onEditConnect, onEditOpenNode, onEditEdge }) {
  // Defaults if props omitted by older callers.
  if (showInferred === undefined)  showInferred  = true;
  if (showEdgeLabels === undefined) showEdgeLabels = true;
  if (showCounts === undefined)    showCounts    = true;
  // Fall back to module EDGES if no caller passes an explicit edges array.
  // (Older code paths read EDGES directly — keeping the fallback here preserves
  // that behaviour and lets edit-mode swap in a stateful list.)
  if (!edges) edges = EDGES;
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null); // {kind:'node'|'pan'|'link', id?, startX, startY, origX, origY}
  const [linkCursor, setLinkCursor] = useState(null); // {x,y} in world coords while drawing a new edge
  const [linkTarget, setLinkTarget] = useState(null); // id of the node currently under cursor during a link drag
  // Angle (radians) of the cursor relative to the hovered node centre — drives
  // where the connector handle pops out. Default 0 = east.
  const [hoverAngle, setHoverAngle] = useState(0);
  // Whether the cursor is currently inside the connector handle's hit ring —
  // used to grow the handle a touch on hover for affordance.
  const [handleHover, setHandleHover] = useState(false);
  // Marquee selection rectangle in world coords (set while dragging in select cursorMode).
  const [marquee, setMarquee] = useState(null); // { x0, y0, x1, y1 }
  // Defaults if optional props omitted.
  if (!multiSelected) multiSelected = [];
  const inMulti = (id) => multiSelected.indexOf(id) >= 0;
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const r = svgRef.current.getBoundingClientRect();
        setSize({ w: r.width, h: r.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, [sidebarOpen]);

  // filter / dim logic
  const queryHit = (n) => !query || n.label.toLowerCase().includes(query.toLowerCase());
  const filterHit = (n) => filter === "all" || (n.cat === "support" ? "secondary" : n.cat) === filter;
  const visible = useMemo(() => new Set(nodes.filter(n => filterHit(n) && queryHit(n)).map(n => n.id)), [nodes, filter, query]);

  // saved-view dim sets
  const savedViewSet = useMemo(() => {
    if (IS_PS_GRAPH) return null;
    if (savedView === "Sales flow")    return new Set(["account","person","subscription","agreement","invoice","netsuite"]);
    if (savedView === "Health inputs") return new Set(["account","interaction","signal","ticket","incident","snowflake"]);
    if (savedView === "PII surfaces")  return new Set(["person","employee","okta","account"]);
    return null;
  }, [savedView]);

  const isVisible = (id) => visible.has(id) && (!savedViewSet || savedViewSet.has(id));

  // viewport transform
  const { zoom, panX, panY } = viewport;
  const cx = size.w / 2;
  const cy = size.h / 2;
  const toScreen = (x, y) => [cx + panX + x * zoom, cy + panY + y * zoom];
  const toWorld = (sx, sy) => [(sx - cx - panX) / zoom, (sy - cy - panY) / zoom];

  // edge highlighting based on hover/selected
  const highlightId = hover || selected;
  const edgeIsLit = (e) => highlightId && (e.s === highlightId || e.t === highlightId);
  const nodeIsLit = (id) => {
    if (!highlightId) return false;
    if (id === highlightId) return true;
    return edges.some(e => (e.s === highlightId && e.t === id) || (e.t === highlightId && e.s === id));
  };
  const nodeIsDim = (id) => {
    if (!highlightId) return false;
    return !nodeIsLit(id);
  };

  // pointer handlers
  const onPointerDown = (e, nodeId, linkHandle, angle) => {
    const pt = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - pt.left;
    const sy = e.clientY - pt.top;
    if (linkHandle && nodeId) {
      // Drag from a node's connector handle → start linking. Capture the angle
      // so the line originates from the side the user grabbed.
      setDrag({ kind: "link", id: nodeId, startX: sx, startY: sy, moved: false, angle: angle != null ? angle : 0 });
      e.target.setPointerCapture?.(e.pointerId);
      return;
    }
    if (nodeId) {
      const n = nodes.find(n => n.id === nodeId);
      // Capture each multi-selected node's origin so we can move them together.
      const multiOrigins = (multiSelected && multiSelected.length > 0 && multiSelected.indexOf(nodeId) >= 0)
        ? multiSelected.map(function(id){ var nn = nodes.find(function(x){ return x.id === id; }); return nn ? { id: id, x: nn.x, y: nn.y } : null; }).filter(Boolean)
        : null;
      setDrag({ kind: "node", id: nodeId, startX: sx, startY: sy, origX: n.x, origY: n.y, moved: false, multiOrigins: multiOrigins });
      e.target.setPointerCapture?.(e.pointerId);
    } else if (editMode && cursorMode === "select" && e.shiftKey) {
      // Shift + drag in select cursor mode → marquee multi-select.
      const [wx, wy] = toWorld(sx, sy);
      setDrag({ kind: "marquee", startX: sx, startY: sy, wx0: wx, wy0: wy, moved: false });
      setMarquee({ x0: wx, y0: wy, x1: wx, y1: wy });
    } else {
      // Default drag on empty canvas → pan (works in view and edit mode).
      setDrag({ kind: "pan", startX: sx, startY: sy, origPanX: panX, origPanY: panY });
    }
  };
  const onPointerMove = (e) => {
    // Edit-mode hover detection with a virtual buffer ring around each node.
    // When the cursor is within (node.size + 28) of a node, treat it as still
    // hovering — keeps the cursor as "grab" until the user really moves into
    // empty space, then it transitions to the canvas/drop cursor.
    if (editMode && !drag) {
      const pt0 = svgRef.current.getBoundingClientRect();
      const sx0 = e.clientX - pt0.left;
      const sy0 = e.clientY - pt0.top;
      const [wx0, wy0] = toWorld(sx0, sy0);
      let nearestId = null;
      let nearestDist = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const cn = nodes[i];
        const dx = wx0 - cn.x, dy = wy0 - cn.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const buffer = (cn.size || 22) + 28;
        if (d < buffer && d < nearestDist) { nearestId = cn.id; nearestDist = d; }
      }
      if (nearestId) {
        if (hover !== nearestId) setHover(nearestId);
        const nrn = nodes.find(n => n.id === nearestId);
        if (nrn) {
          const a = Math.atan2(wy0 - nrn.y, wx0 - nrn.x);
          const snapped = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
          if (snapped !== hoverAngle) setHoverAngle(snapped);
        }
      } else if (hover) {
        setHover(null);
        setHandleHover(false);
      }
    }
    if (!drag) return;
    const pt = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - pt.left;
    const sy = e.clientY - pt.top;
    if (drag.kind === "node") {
      const dx = (sx - drag.startX) / zoom;
      const dy = (sy - drag.startY) / zoom;
      if (Math.abs(dx) + Math.abs(dy) > 1) {
        if (!drag.moved && pushHistory) pushHistory();
        drag.moved = true;
      }
      if (drag.multiOrigins) {
        const origMap = {};
        drag.multiOrigins.forEach(function(o){ origMap[o.id] = o; });
        setNodes(ns => ns.map(n => origMap[n.id] ? { ...n, x: origMap[n.id].x + dx, y: origMap[n.id].y + dy } : n));
      } else {
        setNodes(ns => ns.map(n => n.id === drag.id ? { ...n, x: drag.origX + dx, y: drag.origY + dy } : n));
      }
    } else if (drag.kind === "marquee") {
      const [wx, wy] = toWorld(sx, sy);
      drag.moved = true;
      setMarquee({ x0: drag.wx0, y0: drag.wy0, x1: wx, y1: wy });
    } else if (drag.kind === "pan") {
      setViewport(v => ({ ...v, panX: drag.origPanX + (sx - drag.startX), panY: drag.origPanY + (sy - drag.startY) }));
    } else if (drag.kind === "link") {
      drag.moved = true;
      const [wx, wy] = toWorld(sx, sy);
      setLinkCursor({ x: wx, y: wy });
      // Find a candidate target under the cursor so we can glow-ring it.
      let target = null;
      for (let i = 0; i < nodes.length; i++) {
        const cn = nodes[i];
        const r = (cn.size || 22) + 6;
        if (cn.id !== drag.id && (wx - cn.x) * (wx - cn.x) + (wy - cn.y) * (wy - cn.y) < r * r) { target = cn.id; break; }
      }
      setLinkTarget(target);
    }
  };
  const onPointerUp = (e, nodeId) => {
    if (drag?.kind === "link") {
      // If we dropped over a different node, fire connect; else cancel.
      if (linkTarget && onEditConnect) onEditConnect(drag.id, linkTarget);
      setLinkCursor(null);
      setLinkTarget(null);
      setDrag(null);
      return;
    }
    if (drag?.kind === "marquee") {
      // Commit marquee → compute which nodes fall inside the box.
      if (marquee && setMultiSelected) {
        const x0 = Math.min(marquee.x0, marquee.x1);
        const x1 = Math.max(marquee.x0, marquee.x1);
        const y0 = Math.min(marquee.y0, marquee.y1);
        const y1 = Math.max(marquee.y0, marquee.y1);
        const picked = nodes.filter(function(n){ return n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1; }).map(function(n){ return n.id; });
        setMultiSelected(picked);
        if (picked.length === 0) setSelected(null);
      }
      setMarquee(null);
      setDrag(null);
      return;
    }
    if (drag?.kind === "node" && !drag.moved && nodeId) {
      // Clicking a node opens the right-side Inspector in both view and edit
      // mode — same affordance, no surprise full-page transition.
      setSelected(nodeId);
      if (setMultiSelected) setMultiSelected([nodeId]);
    } else if (drag?.kind === "pan") {
      const pt = svgRef.current.getBoundingClientRect();
      const dx = Math.abs(e.clientX - pt.left - drag.startX);
      const dy = Math.abs(e.clientY - pt.top - drag.startY);
      if (dx + dy < 3) {
        if (editMode && cursorMode === "add" && onEditAdd) {
          // Add-cursor mode: click on empty canvas → add a node here.
          const sx = e.clientX - pt.left;
          const sy = e.clientY - pt.top;
          const [wx, wy] = toWorld(sx, sy);
          onEditAdd(wx, wy);
        } else {
          // Click empty canvas → clear selection (single and multi).
          setSelected(null);
          if (setMultiSelected) setMultiSelected([]);
        }
      }
    }
    setDrag(null);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const pt = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - pt.left;
    const sy = e.clientY - pt.top;
    const [wx, wy] = toWorld(sx, sy);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newZoom = Math.min(2.4, Math.max(0.35, zoom * factor));
    // keep cursor world position fixed
    const newPanX = sx - cx - wx * newZoom;
    const newPanY = sy - cy - wy * newZoom;
    setViewport({ zoom: newZoom, panX: newPanX, panY: newPanY });
  };

  // edge geometry
  function edgePath(e) {
    const s = nodes.find(n => n.id === e.s);
    const t = nodes.find(n => n.id === e.t);
    if (!s || !t) return null;
    const [sx, sy] = [s.x, s.y];
    const [tx, ty] = [t.x, t.y];
    if (e.curve) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nxn = -dy / len;
      const nyn = dx / len;
      const c1x = mx + nxn * e.curve;
      const c1y = my + nyn * e.curve;
      return `M ${sx} ${sy} Q ${c1x} ${c1y} ${tx} ${ty}`;
    }
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  // edge label position (midpoint along path)
  function edgeMid(e) {
    const s = nodes.find(n => n.id === e.s);
    const t = nodes.find(n => n.id === e.t);
    if (!s || !t) return [0, 0];
    if (e.curve) {
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      return [mx - dy / len * (e.curve / 2), my + dx / len * (e.curve / 2)];
    }
    return [(s.x + t.x) / 2, (s.y + t.y) / 2];
  }

  // arrow markers per edge kind
  const markers = {
    direct:   { color: "var(--ink-2)" },
    inferred: { color: "var(--ink-3)" },
    agent:    { color: "var(--purple)" },
    source:   { color: "var(--green)" },
  };

  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        className="canvas"
        onPointerMove={onPointerMove}
        onPointerUp={e => onPointerUp(e)}
        onPointerDown={e => onPointerDown(e)}
        onWheel={onWheel}
        style={{ cursor: drag?.kind === "link" ? "crosshair" : drag?.kind === "pan" ? "grabbing" : (editMode
          ? (hover
              ? "grab"  /* near a node (within buffer) — stay in grab mode */
              : (cursorMode === "select"
                  ? "grab"  /* select mode — plain pointer / grab on empty canvas */
                  : "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><circle cx='22' cy='22' r='15' fill='%23f3ede0' stroke='%23bdb39a' stroke-width='1.2' stroke-dasharray='3 3'/><line x1='22' y1='15' x2='22' y2='29' stroke='%23645d4d' stroke-width='1.6' stroke-linecap='round'/><line x1='15' y1='22' x2='29' y2='22' stroke='%23645d4d' stroke-width='1.6' stroke-linecap='round'/></svg>\") 22 22, copy"))
          : "grab") }}
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse" patternTransform={`translate(${(panX + cx) % (24 * zoom)},${(panY + cy) % (24 * zoom)})`}>
            <circle cx={12 * zoom} cy={12 * zoom} r="0.7" fill="#c8c0a8" opacity="0.55" />
          </pattern>
          {Object.entries(markers).map(([k, m]) => (
            <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={m.color} />
            </marker>
          ))}
          <style>{"@keyframes ecgFadeIn { from { opacity: 0 } to { opacity: 1 } }"}</style>
        </defs>

        <rect x="0" y="0" width={size.w} height={size.h} fill="url(#dotgrid)" />

        <g transform={`translate(${cx + panX} ${cy + panY}) scale(${zoom})`}>
          {/* edges */}
          {edges.map((e, i) => {
            if (!showInferred && e.kind === "inferred") return null;
            const visEdge = isVisible(e.s) && isVisible(e.t);
            const lit = edgeIsLit(e);
            const dim = highlightId && !lit;
            const path = edgePath(e);
            if (!path) return null;
            const baseColor = markers[e.kind].color;
            return (
              <g key={i} opacity={lit ? 1 : (highlightId ? (visEdge ? 0.12 : 0.04) : (visEdge ? 0.7 : 0.06))}>
                {/* Edit-mode invisible wide hit target — makes thin edges easy to click */}
                {editMode && (
                  <path d={path} fill="none" stroke="transparent" strokeWidth={Math.max(12 / zoom, 8)}
                    style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    onClick={(ev) => { ev.stopPropagation(); if (onEditEdge) onEditEdge(i); }}
                    onPointerDown={(ev) => ev.stopPropagation()} />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke={baseColor}
                  strokeWidth={(lit ? 1.6 : 0.9) / zoom * Math.max(zoom, 0.6)}
                  strokeDasharray={e.kind === "inferred" ? `${6/Math.max(zoom,0.6)} ${4/Math.max(zoom,0.6)}` : "none"}
                  markerEnd={`url(#arrow-${e.kind})`}
                  opacity={lit ? 1 : 0.7}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}

          {/* edge labels — only render at decent zoom or when lit */}
          {showEdgeLabels && edges.map((e, i) => {
            if (!showInferred && e.kind === "inferred") return null;
            const visEdge = isVisible(e.s) && isVisible(e.t);
            const lit = edgeIsLit(e);
            if (!visEdge && !lit) return null;
            if (zoom < 0.85 && !lit) return null;
            const [mx, my] = edgeMid(e);
            return (
              <g key={"l" + i} transform={`translate(${mx} ${my})`} style={{ pointerEvents: "none" }}>
                <rect x={-e.label.length * 3.2 - 5} y="-9" width={e.label.length * 6.4 + 10} height="14" rx="3" fill="var(--bg-canvas)" opacity={lit ? 0.95 : 0.78} />
                <text textAnchor="middle" y="1.5" fontSize="9" fill={lit ? "var(--ink)" : "var(--ink-3)"} fontFamily="JetBrains Mono, monospace" fontWeight={lit ? 600 : 400} letterSpacing="0.3">
                  :{e.label}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {nodes.map(n => {
            const vis = isVisible(n.id);
            const lit = nodeIsLit(n.id);
            const dim = !lit && (!vis || nodeIsDim(n.id));
            const isSel = selected === n.id;
            const isHov = hover === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                style={{ cursor: drag?.kind === "node" && drag.id === n.id ? "grabbing" : (editMode ? "grab" : "pointer") }}
                onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, n.id); }}
                onPointerUp={(e) => { e.stopPropagation(); onPointerUp(e, n.id); }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onMouseMove={editMode ? (e) => {
                  // Track the cursor's quadrant relative to this node and snap
                  // the handle to one of the four cardinal points (N / E / S / W).
                  const pt = svgRef.current.getBoundingClientRect();
                  const sx = e.clientX - pt.left;
                  const sy = e.clientY - pt.top;
                  const [wx, wy] = toWorld(sx, sy);
                  const dx = wx - n.x, dy = wy - n.y;
                  if (dx * dx + dy * dy < 4) return;
                  const a = Math.atan2(dy, dx);
                  // Snap to nearest π/2 — gives E=0, S=π/2, W=±π, N=-π/2.
                  const snapped = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
                  if (snapped !== hoverAngle) setHoverAngle(snapped);
                } : undefined}
                opacity={lit ? 1 : (highlightId ? (vis ? 0.18 : 0.06) : (vis ? 1 : 0.22))}
              >
                <NodeShape node={n} selected={isSel} highlighted={lit || isHov} dimmed={dim} />
                <text
                  textAnchor="middle"
                  y={n.size + 16}
                  fontSize={Math.max(11, 12 - (1 - zoom) * 2)}
                  fill={dim ? "var(--ink-4)" : "var(--ink)"}
                  fontFamily="Geist, system-ui"
                  fontWeight="500"
                  style={{ pointerEvents: "none" }}
                >
                  {n.label}
                </text>
                {showCounts && n.instances !== "—" && (
                  <text
                    textAnchor="middle"
                    y={-n.size - 8}
                    fontSize="9.5"
                    fill="var(--ink-3)"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="500"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.instances}
                  </text>
                )}
                {/* Edit-mode connector — morphs onto the node's edge.
                    The handle's centre sits exactly on the node's circumference,
                    so half is inside the body and half pokes out — feels like a
                    port that belongs to the node rather than a chip pasted on
                    top. Its palette mirrors the node's own fill + stroke.
                    Hidden while the user is moving a node — repositioning isn't
                    an edge-creation moment. */}
                {editMode && drag?.kind !== "node" && (isHov || (drag?.kind === "link" && drag.id === n.id)) && (function(){
                  var isLinking = drag?.kind === "link" && drag.id === n.id;
                  var angle = isLinking && drag.angle != null ? drag.angle : hoverAngle;
                  // Centre the handle on the node's circumference.
                  var R = n.size;
                  var hx = Math.cos(angle) * R;
                  var hy = Math.sin(angle) * R;
                  var nc = colorForNode(n);
                  // Grow the disc when the user hovers the handle itself — clear
                  // affordance that this is a target to grab.
                  var dotR = isLinking ? 9 : (handleHover ? 10 : 7);
                  var glyphR = isLinking ? 3.6 : (handleHover ? 4 : 3);
                  var glyphW = handleHover || isLinking ? 1.6 : 1.4;
                  return (
                    <g style={{ cursor: isLinking ? "crosshair" : "grab", animation:"ecgFadeIn 180ms ease-out both" }}>
                      {/* Generous invisible hit ring — also tracks handle hover */}
                      <circle cx={hx} cy={hy} r="20" fill="transparent" pointerEvents="all"
                        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, n.id, true, angle); }}
                        onMouseEnter={() => setHandleHover(true)}
                        onMouseLeave={() => setHandleHover(false)} />
                      {/* Breathing halo in the node's stroke color */}
                      {!isLinking && (
                        <circle cx={hx} cy={hy} r="11" fill="none" stroke={nc.stroke} strokeWidth="0.7" opacity={handleHover ? 0.7 : 0.45} style={{ pointerEvents:"none", transition:"opacity 140ms ease-out" }}>
                          <animate attributeName="r" values={handleHover ? "12;14.5;12" : "10;13;10"} dur="1.4s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values={handleHover ? "0.7;0.25;0.7" : "0.5;0.1;0.5"} dur="1.4s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* The dot — same fill + stroke as the node body. Grows on hover. */}
                      <circle cx={hx} cy={hy} r={dotR}
                        fill={nc.fill} stroke={nc.stroke} strokeWidth="1.4"
                        style={{ pointerEvents:"none", transition:"r 140ms cubic-bezier(0.34,1.56,0.64,1)" }} />
                      {/* + glyph in the node's stroke color */}
                      <line x1={hx - glyphR} y1={hy} x2={hx + glyphR} y2={hy} stroke={nc.stroke} strokeWidth={glyphW} strokeLinecap="round" style={{ pointerEvents:"none", transition:"all 140ms ease-out" }} />
                      <line x1={hx} y1={hy - glyphR} x2={hx} y2={hy + glyphR} stroke={nc.stroke} strokeWidth={glyphW} strokeLinecap="round" style={{ pointerEvents:"none", transition:"all 140ms ease-out" }} />
                    </g>
                  );
                })()}
              </g>
            );
          })}
          {/* Multi-select rings — soft green dashed circle around each selected node */}
          {multiSelected && multiSelected.length > 0 && multiSelected.map(function(id){
            var nn = nodes.find(function(x){ return x.id === id; });
            if (!nn) return null;
            return <circle key={"ms-" + id} cx={nn.x} cy={nn.y} r={(nn.size || 22) + 6} fill="none" stroke="var(--green)" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.85" style={{ pointerEvents:"none" }} />;
          })}
          {/* Marquee selection rectangle */}
          {marquee && (function(){
            var x0 = Math.min(marquee.x0, marquee.x1);
            var y0 = Math.min(marquee.y0, marquee.y1);
            var w = Math.abs(marquee.x1 - marquee.x0);
            var h = Math.abs(marquee.y1 - marquee.y0);
            return <rect x={x0} y={y0} width={w} height={h} fill="var(--ink-2)" fillOpacity="0.06" stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" style={{ pointerEvents:"none" }} />;
          })()}
          {/* Rubber-band edge while linking from a node handle.
              Uses a smooth quadratic curve that bows slightly, plus a halo
              ring around the target node when the cursor finds one. */}
          {drag?.kind === "link" && linkCursor && (function(){
            var from = nodes.find(function(x){ return x.id === drag.id; });
            if (!from) return null;
            // Origin matches the handle position — on the node's circumference.
            var R = (from.size || 22);
            var a = drag.angle != null ? drag.angle : 0;
            var sx = from.x + Math.cos(a) * R;
            var sy = from.y + Math.sin(a) * R;
            var fromC = colorForNode(from);
            var ex = linkCursor.x;
            var ey = linkCursor.y;
            var dx = ex - sx, dy = ey - sy;
            var len = Math.sqrt(dx*dx + dy*dy) || 1;
            // Control point: midpoint pulled perpendicular for a gentle arc.
            var mx = (sx + ex) / 2 + (-dy / len) * Math.min(len * 0.18, 36);
            var my = (sy + ey) / 2 + ( dx / len) * Math.min(len * 0.18, 36);
            var t = nodes.find(function(n){ return n.id === linkTarget; });
            return (
              <g style={{ pointerEvents:"none" }}>
                {/* Target glow rings — only when the cursor is over a candidate */}
                {t && (
                  <g>
                    <circle cx={t.x} cy={t.y} r={(t.size || 22) + 11} fill="none" stroke="var(--green)" strokeWidth="1" opacity="0.35" />
                    <circle cx={t.x} cy={t.y} r={(t.size || 22) + 5}  fill="none" stroke="var(--green)" strokeWidth="1.4" opacity="0.85" />
                  </g>
                )}
                {/* The connecting line — uses the source node's stroke color so
                    it reads as an extension of the node. Turns green when over a target. */}
                <path d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                      fill="none" stroke={t ? "var(--green)" : fromC.stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
                {/* Arrival dot at the cursor */}
                <circle cx={ex} cy={ey} r="3.2" fill={t ? "var(--green)" : fromC.stroke} />
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
}

// ---------- ZOOM CONTROLS + MINIMAP ----------------------------------------


// ── ZoomControls / Minimap / Legend ──
function ZoomControls({ viewport, setViewport, nodes, size }) {
  const setZoom = (factor) => setViewport(v => ({ ...v, zoom: Math.min(2.4, Math.max(0.35, v.zoom * factor)) }));
  const fit = () => { const xs=nodes.map(n=>n.x), ys=nodes.map(n=>n.y); const cx=(Math.min(...xs)+Math.max(...xs))/2, cy=(Math.min(...ys)+Math.max(...ys))/2; const z=0.8; setViewport({ zoom:z, panX:-cx*z, panY:-cy*z }); };
  return (
    <div className="zoomctl">
      <button onClick={() => setZoom(1.2)} title="Zoom in">+</button>
      <div className="zoomctl-v">{Math.round(viewport.zoom * 100)}%</div>
      <button onClick={() => setZoom(1 / 1.2)} title="Zoom out">−</button>
      <button onClick={fit} title="Fit"><span className="zoomctl-fit">FIT</span></button>
    </div>
  );
}

function Minimap({ nodes, viewport, size }) {
  // compute bounding box
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - 60, maxX = Math.max(...xs) + 60;
  const minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 60;
  // Height matched to the zoom column (4 × 34px buttons + borders = 138px outer;
  // 6px padding above and below leaves 124px for the svg).
  // Sized so the total minimap height (border + padding + svg + padding +
  // border = 1+6+H+6+1) matches the zoom-control column on the right,
  // which stacks 3 × 34px buttons + 1 × ~21px value chip + 2 × 1px border.
  const W = 152, H = 111;
  const sx = W / (maxX - minX);
  const sy = H / (maxY - minY);
  const s = Math.min(sx, sy);
  const ox = (W - (maxX - minX) * s) / 2;
  const oy = (H - (maxY - minY) * s) / 2;

  // visible viewport rectangle in world coords
  const vw = size.w / viewport.zoom;
  const vh = size.h / viewport.zoom;
  const vx0 = -viewport.panX / viewport.zoom - vw / 2;
  const vy0 = -viewport.panY / viewport.zoom - vh / 2;

  const mapX = (x) => ox + (x - minX) * s;
  const mapY = (y) => oy + (y - minY) * s;

  return (
    <div className="minimap">
      <svg width={W} height={H}>
        <rect x="0" y="0" width={W} height={H} fill="var(--bg-canvas)" />
        {EDGES.map((e, i) => {
          const a = nodes.find(n => n.id === e.s);
          const b = nodes.find(n => n.id === e.t);
          if (!a || !b) return null;
          return <line key={i} x1={mapX(a.x)} y1={mapY(a.y)} x2={mapX(b.x)} y2={mapY(b.y)} stroke="var(--line)" strokeWidth="0.5" />;
        })}
        {nodes.map(n => {
          const c = colorForNode(n);
          return <circle key={n.id} cx={mapX(n.x)} cy={mapY(n.y)} r="2" fill={c.stroke} />;
        })}
        {/* Soft viewport indicator — a low-opacity ink tint that picks
            up the warm-brown ink colour used across the rest of the app
            instead of introducing a new accent. Same selection semantic,
            much lower visual weight than the original solid black outline. */}
        <rect
          x={Math.max(0, mapX(vx0))}
          y={Math.max(0, mapY(vy0))}
          width={Math.min(W, vw * s)}
          height={Math.min(H, vh * s)}
          fill="var(--ink)"
          fillOpacity="0.05"
          stroke="var(--ink)"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

// ---------- BOTTOM LEGEND ---------------------------------------------------

function Legend({ filter, setFilter, showCounts, setShowCounts }) {
  const cats = [
    { id: "core",      label: "Core",      stroke: "var(--blue)",   fill: "var(--blue-fill)" },
    { id: "secondary", label: "Secondary", stroke: "var(--purple)", fill: "var(--purple-fill)" },
    { id: "derived",   label: "Derived",   stroke: "var(--gold)",   fill: "var(--gold-fill)" },
  ];
  return (
    <div className="legend">
      {cats.map(c => (
        <button key={c.id} className={"legend-pill" + (filter === c.id || filter === "all" ? "" : " off")} onClick={() => setFilter(filter === c.id ? "all" : c.id)}>
          <svg width="14" height="14" viewBox="-12 -12 24 24"><circle r="8.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.4" /></svg>
          {c.label}
        </button>
      ))}
      {setShowCounts && (
        <>
          <span className="legend-div" />
          <button className={"legend-pill" + (showCounts ? "" : " off")} onClick={() => setShowCounts(v => !v)} title="Toggle instance counts on nodes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="4" y2="13" /><line x1="10" y1="20" x2="10" y2="8" /><line x1="16" y1="20" x2="16" y2="4" /><line x1="22" y1="20" x2="22" y2="11" /></svg>
          Counts
          </button>
        </>
      )}
    </div>
  );
}

// ---------- DETAIL VIEW DATA ------------------------------------------------

const PROPS_BY_NODE = {
  account: [
    { name: "account_id",         type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "Salesforce",   computed: null },
    { name: "name",               type: "string",    required: true,  indexed: true,  pii: false, fill: 100, conf: 99, source: "Salesforce" },
    { name: "domain",             type: "string",    required: true,  indexed: true,  pii: false, fill: 96,  conf: 98, source: "Salesforce" },
    { name: "industry",           type: "enum(28)",  required: false, indexed: false, pii: false, fill: 88,  conf: 94, source: "Salesforce" },
    { name: "tier",               type: "enum",      required: true,  indexed: true,  pii: false, fill: 99,  conf: 100, source: "—", computed: "from arr (rule:tier_buckets)" },
    { name: "region",             type: "enum(6)",   required: true,  indexed: false, pii: false, fill: 97,  conf: 98, source: "Salesforce" },
    { name: "arr_usd",            type: "decimal",   required: false, indexed: false, pii: false, fill: 94,  conf: 99, source: "NetSuite ERP" },
    { name: "csm_id",             type: "fk Employee", required: false, indexed: true, pii: false, fill: 81, conf: 95, source: "Salesforce" },
    { name: "parent_account_id",  type: "fk self",   required: false, indexed: false, pii: false, fill: 31,  conf: 100, source: "Salesforce" },
    { name: "primary_contact_email", type: "string", required: false, indexed: true,  pii: true,  fill: 92,  conf: 96, source: "Salesforce" },
    { name: "billing_address",    type: "struct",    required: false, indexed: false, pii: true,  fill: 87,  conf: 91, source: "NetSuite ERP",
      children: [
        { name: "street",      type: "string", required: false, indexed: false, pii: true,  fill: 89, conf: 94, source: "NetSuite ERP" },
        { name: "city",        type: "string", required: false, indexed: true,  pii: false, fill: 91, conf: 96, source: "NetSuite ERP" },
        { name: "state",       type: "enum",   required: false, indexed: true,  pii: false, fill: 90, conf: 99, source: "NetSuite ERP" },
        { name: "postal_code", type: "string", required: false, indexed: true,  pii: false, fill: 88, conf: 97, source: "NetSuite ERP" },
        { name: "country",     type: "enum",   required: false, indexed: true,  pii: false, fill: 95, conf: 99, source: "NetSuite ERP" },
      ]
    },
    { name: "tax_id",             type: "string",    required: false, indexed: false, pii: true,  fill: 64,  conf: 94, source: "NetSuite ERP" },
    { name: "fiscal_year_end",    type: "date",      required: false, indexed: false, pii: false, fill: 78,  conf: 99, source: "NetSuite ERP" },
    { name: "is_lighthouse",      type: "bool",      required: false, indexed: false, pii: false, fill: 100, conf: 100, source: "manual" },
    { name: "risk_score",         type: "float",     required: false, indexed: true,  pii: false, fill: 100, conf: 100, source: "—", computed: "agent: cust_health" },
    { name: "churn_probability",  type: "float",     required: false, indexed: false, pii: false, fill: 100, conf: 100, source: "—", computed: "agent: rev_fore" },
    { name: "tags",               type: "string[]",  required: false, indexed: false, pii: false, fill: 73,  conf: 100, source: "manual" },
    { name: "created_at",         type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Salesforce" },
  ],
  person: [
    { name: "person_id",           type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "HubSpot" },
    { name: "name",                type: "string",    required: true,  indexed: true,  pii: true,  fill: 99,  conf: 99,  source: "HubSpot" },
    { name: "first_name",          type: "string",    required: false, indexed: false, pii: true,  fill: 97,  conf: 99,  source: "HubSpot" },
    { name: "last_name",           type: "string",    required: false, indexed: false, pii: true,  fill: 97,  conf: 99,  source: "HubSpot" },
    { name: "email",               type: "string",    required: true,  indexed: true,  pii: true,  fill: 96,  conf: 98,  source: "HubSpot" },
    { name: "phone",               type: "string",    required: false, indexed: false, pii: true,  fill: 74,  conf: 93,  source: "HubSpot" },
    { name: "title",               type: "string",    required: false, indexed: false, pii: false, fill: 81,  conf: 94,  source: "HubSpot" },
    { name: "account_id",          type: "fk Account",required: false, indexed: true,  pii: false, fill: 94,  conf: 97,  source: "HubSpot" },
    { name: "owner_id",            type: "fk Employee",required: false,indexed: true,  pii: false, fill: 88,  conf: 96,  source: "HubSpot" },
    { name: "status",              type: "enum",      required: false, indexed: true,  pii: false, fill: 92,  conf: 97,  source: "HubSpot" },
    { name: "lead_score",          type: "int",       required: false, indexed: false, pii: false, fill: 78,  conf: 93,  source: "—", computed: "agent: lead_score" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 89,  conf: 96,  source: "HubSpot" },
    { name: "tags",                type: "string[]",  required: false, indexed: false, pii: false, fill: 62,  conf: 95,  source: "manual" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "HubSpot" },
  ],
  subscription: [
    { name: "subscription_id",     type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "account_id",          type: "fk Account",required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "name",                type: "string",    required: false, indexed: false, pii: false, fill: 94,  conf: 98,  source: "NetSuite ERP" },
    { name: "plan",                type: "enum",      required: true,  indexed: true,  pii: false, fill: 99,  conf: 100, source: "NetSuite ERP" },
    { name: "status",              type: "enum",      required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "seats",               type: "int",       required: false, indexed: false, pii: false, fill: 96,  conf: 99,  source: "NetSuite ERP" },
    { name: "mrr",                 type: "decimal",   required: false, indexed: false, pii: false, fill: 98,  conf: 100, source: "NetSuite ERP" },
    { name: "arr_usd",             type: "decimal",   required: false, indexed: false, pii: false, fill: 98,  conf: 100, source: "NetSuite ERP" },
    { name: "amount",              type: "decimal",   required: false, indexed: false, pii: false, fill: 98,  conf: 99,  source: "NetSuite ERP" },
    { name: "start_date",          type: "date",      required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "renewal_date",        type: "date",      required: false, indexed: true,  pii: false, fill: 97,  conf: 99,  source: "NetSuite ERP" },
    { name: "risk",                type: "enum",      required: false, indexed: false, pii: false, fill: 100, conf: 100, source: "—", computed: "agent: renewal_risk" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 88,  conf: 96,  source: "NetSuite ERP" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
  ],
  agreement: [
    { name: "agreement_id",        type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "HubSpot" },
    { name: "name",                type: "string",    required: true,  indexed: true,  pii: false, fill: 98,  conf: 99,  source: "HubSpot" },
    { name: "account_id",          type: "fk Account",required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "HubSpot" },
    { name: "owner_id",            type: "fk Employee",required: false,indexed: true,  pii: false, fill: 91,  conf: 97,  source: "HubSpot" },
    { name: "status",              type: "enum",      required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "HubSpot" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 94,  conf: 98,  source: "HubSpot" },
    { name: "amount",              type: "decimal",   required: false, indexed: false, pii: false, fill: 96,  conf: 99,  source: "HubSpot" },
    { name: "arr_usd",             type: "decimal",   required: false, indexed: false, pii: false, fill: 94,  conf: 99,  source: "NetSuite ERP" },
    { name: "start_date",          type: "date",      required: false, indexed: true,  pii: false, fill: 92,  conf: 98,  source: "HubSpot" },
    { name: "end_date",            type: "date",      required: false, indexed: true,  pii: false, fill: 90,  conf: 97,  source: "HubSpot" },
    { name: "probability",         type: "float",     required: false, indexed: false, pii: false, fill: 84,  conf: 94,  source: "—", computed: "agent: deal_intelligence" },
    { name: "stage",               type: "enum",      required: false, indexed: true,  pii: false, fill: 97,  conf: 99,  source: "HubSpot" },
    { name: "close_date",          type: "date",      required: false, indexed: true,  pii: false, fill: 88,  conf: 96,  source: "HubSpot" },
    { name: "external_ref",        type: "struct",    required: false, indexed: false, pii: false, fill: 86,  conf: 97,  source: "HubSpot" },
    { name: "metadata",            type: "struct",    required: false, indexed: false, pii: false, fill: 82,  conf: 95,  source: "HubSpot" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "HubSpot" },
  ],
  interaction: [
    { name: "interaction_id",      type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "HubSpot" },
    { name: "name",                type: "string",    required: false, indexed: false, pii: false, fill: 88,  conf: 95,  source: "HubSpot" },
    { name: "account_id",          type: "fk Account",required: false, indexed: true,  pii: false, fill: 94,  conf: 98,  source: "HubSpot" },
    { name: "person_id",           type: "fk Person", required: false, indexed: true,  pii: false, fill: 86,  conf: 94,  source: "HubSpot" },
    { name: "owner_id",            type: "fk Employee",required: false,indexed: true,  pii: false, fill: 84,  conf: 95,  source: "HubSpot" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 92,  conf: 97,  source: "HubSpot" },
    { name: "status",              type: "enum",      required: false, indexed: true,  pii: false, fill: 90,  conf: 96,  source: "HubSpot" },
    { name: "priority",            type: "enum",      required: false, indexed: false, pii: false, fill: 78,  conf: 93,  source: "HubSpot" },
    { name: "sentiment",           type: "enum",      required: false, indexed: false, pii: false, fill: 100, conf: 100, source: "—", computed: "agent: sentiment" },
    { name: "metadata",            type: "struct",    required: false, indexed: false, pii: false, fill: 80,  conf: 94,  source: "HubSpot" },
    { name: "external_ref",        type: "struct",    required: false, indexed: false, pii: false, fill: 76,  conf: 93,  source: "HubSpot" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "HubSpot" },
  ],
  invoice: [
    { name: "invoice_id",          type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "account_id",          type: "fk Account",required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "name",                type: "string",    required: false, indexed: false, pii: false, fill: 90,  conf: 97,  source: "NetSuite ERP" },
    { name: "amount",              type: "decimal",   required: true,  indexed: false, pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "arr_usd",             type: "decimal",   required: false, indexed: false, pii: false, fill: 96,  conf: 99,  source: "NetSuite ERP" },
    { name: "status",              type: "enum",      required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 88,  conf: 96,  source: "NetSuite ERP" },
    { name: "currency",            type: "enum",      required: false, indexed: false, pii: false, fill: 98,  conf: 100, source: "NetSuite ERP" },
    { name: "due_date",            type: "date",      required: false, indexed: true,  pii: false, fill: 97,  conf: 99,  source: "NetSuite ERP" },
    { name: "issued_at",           type: "timestamp", required: false, indexed: true,  pii: false, fill: 99,  conf: 100, source: "NetSuite ERP" },
    { name: "external_ref",        type: "struct",    required: false, indexed: false, pii: false, fill: 84,  conf: 96,  source: "NetSuite ERP" },
    { name: "metadata",            type: "struct",    required: false, indexed: false, pii: false, fill: 79,  conf: 94,  source: "NetSuite ERP" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "NetSuite ERP" },
  ],
  ticket: [
    { name: "ticket_id",           type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "Support Portal" },
    { name: "name",                type: "string",    required: false, indexed: false, pii: false, fill: 92,  conf: 97,  source: "Support Portal" },
    { name: "account_id",          type: "fk Account",required: false, indexed: true,  pii: false, fill: 94,  conf: 98,  source: "Support Portal" },
    { name: "person_id",           type: "fk Person", required: false, indexed: true,  pii: false, fill: 88,  conf: 95,  source: "Support Portal" },
    { name: "owner_id",            type: "fk Employee",required: false,indexed: true,  pii: false, fill: 82,  conf: 94,  source: "Support Portal" },
    { name: "status",              type: "enum",      required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Support Portal" },
    { name: "priority",            type: "enum",      required: true,  indexed: true,  pii: false, fill: 98,  conf: 99,  source: "Support Portal" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 90,  conf: 97,  source: "Support Portal" },
    { name: "resolved_at",         type: "timestamp", required: false, indexed: true,  pii: false, fill: 88,  conf: 96,  source: "Support Portal" },
    { name: "sentiment",           type: "enum",      required: false, indexed: false, pii: false, fill: 100, conf: 100, source: "—", computed: "agent: sentiment" },
    { name: "churn_risk",          type: "float",     required: false, indexed: false, pii: false, fill: 100, conf: 100, source: "—", computed: "agent: ticket_intelligence" },
    { name: "tags",                type: "string[]",  required: false, indexed: false, pii: false, fill: 68,  conf: 94,  source: "manual" },
    { name: "external_ref",        type: "struct",    required: false, indexed: false, pii: false, fill: 84,  conf: 96,  source: "Support Portal" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Support Portal" },
  ],
  incident: [
    { name: "incident_id",         type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "Monday" },
    { name: "name",                type: "string",    required: true,  indexed: true,  pii: false, fill: 98,  conf: 99,  source: "Monday" },
    { name: "account_id",          type: "fk Account",required: false, indexed: true,  pii: false, fill: 86,  conf: 94,  source: "Monday" },
    { name: "owner_id",            type: "fk Employee",required: false,indexed: true,  pii: false, fill: 84,  conf: 95,  source: "Monday" },
    { name: "status",              type: "enum",      required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Monday" },
    { name: "severity",            type: "enum",      required: true,  indexed: true,  pii: false, fill: 98,  conf: 99,  source: "Monday" },
    { name: "priority",            type: "enum",      required: false, indexed: true,  pii: false, fill: 90,  conf: 97,  source: "Monday" },
    { name: "type",                type: "enum",      required: false, indexed: true,  pii: false, fill: 86,  conf: 95,  source: "Monday" },
    { name: "resolved_at",         type: "timestamp", required: false, indexed: true,  pii: false, fill: 82,  conf: 94,  source: "Monday" },
    { name: "metadata",            type: "struct",    required: false, indexed: false, pii: false, fill: 74,  conf: 93,  source: "Monday" },
    { name: "external_ref",        type: "struct",    required: false, indexed: false, pii: false, fill: 78,  conf: 94,  source: "Monday" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Monday" },
  ],
  signal: [
    { name: "signal_id",           type: "uuid",      required: true,  indexed: true,  pii: false, pk: true,  fill: 100, conf: 100, source: "Product Usage" },
    { name: "account_id",          type: "fk Account",required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Product Usage" },
    { name: "name",                type: "string",    required: false, indexed: false, pii: false, fill: 88,  conf: 95,  source: "Product Usage" },
    { name: "type",                type: "enum",      required: true,  indexed: true,  pii: false, fill: 98,  conf: 99,  source: "Product Usage" },
    { name: "status",              type: "enum",      required: false, indexed: true,  pii: false, fill: 90,  conf: 96,  source: "Product Usage" },
    { name: "amount",              type: "decimal",   required: false, indexed: false, pii: false, fill: 78,  conf: 93,  source: "Product Usage" },
    { name: "metadata",            type: "struct",    required: false, indexed: false, pii: false, fill: 82,  conf: 95,  source: "Product Usage" },
    { name: "external_ref",        type: "struct",    required: false, indexed: false, pii: false, fill: 74,  conf: 93,  source: "Product Usage" },
    { name: "tags",                type: "string[]",  required: false, indexed: false, pii: false, fill: 60,  conf: 92,  source: "manual" },
    { name: "created_at",          type: "timestamp", required: true,  indexed: true,  pii: false, fill: 100, conf: 100, source: "Product Usage" },
  ],
};


// ── ViewEditToggle ──
function ViewEditToggle({ editMode, onEnter, onExit, cursorMode, setCursorMode, canUndo, canRedo, onUndo, onRedo, onDuplicate, canDuplicate, onDelete, canDelete }) {
  var seg = function(active){ return {
    display:"inline-flex", alignItems:"center", gap:7,
    padding:"7px 16px", borderRadius:999, border:"none",
    background: active ? "var(--panel)" : "transparent",
    color: active ? "var(--ink-2)" : "var(--ink-4)",
    fontFamily:"JetBrains Mono", fontSize:11, cursor:"pointer",
    letterSpacing:"0.6px", textTransform:"uppercase",
    boxShadow: active ? "0 1px 3px rgba(40,40,20,0.16), 0 0 0 1px var(--line)" : "none",
    fontWeight: active ? 700 : 500,
    transition:"all 160ms ease-out"
  }; };
  var iconSeg = function(active){ return {
    display:"inline-flex", alignItems:"center", justifyContent:"center",
    width:34, height:30, padding:0, borderRadius:999, border:"none",
    background: active ? "var(--panel)" : "transparent",
    color: active ? "var(--ink-2)" : "var(--ink-4)",
    cursor:"pointer",
    boxShadow: active ? "0 1px 3px rgba(40,40,20,0.16), 0 0 0 1px var(--line)" : "none",
    transition:"all 160ms ease-out"
  }; };
  var pill = { display:"inline-flex", padding:3, borderRadius:999, background:"var(--panel-2)", border:"1px solid var(--line)", boxShadow:"0 6px 24px rgba(40,40,20,0.10), 0 1px 2px rgba(40,40,20,0.05)" };
  return (
    <div style={{ position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)", zIndex:10, display:"inline-flex", gap:8, alignItems:"center" }}>
      {/* View / Edit pill */}
      <div style={pill}>
        <button onClick={onExit} style={seg(!editMode)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View
        </button>
        <button onClick={onEnter} style={seg(editMode)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
          Edit
        </button>
      </div>
      {/* Cursor mode toggle — only in edit mode */}
      {editMode && (
        <div style={pill}>
          <button onClick={function(){ setCursorMode("select"); }} style={iconSeg(cursorMode === "select")} title="Select cursor — click empty canvas to deselect / pan / marquee">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3 L19 11 L13 13 L11 19 Z"/>
            </svg>
          </button>
          <button onClick={function(){ setCursorMode("add"); }} style={iconSeg(cursorMode === "add")} title="Add-node cursor — click empty canvas to drop a node">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="12" cy="12" r="8" strokeDasharray="3 3"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </button>
        </div>
      )}
      {/* Undo / Redo / Duplicate — only in edit mode */}
      {editMode && (
        <div style={pill}>
          <button onClick={onUndo} disabled={!canUndo} style={Object.assign({}, iconSeg(false), { opacity: canUndo ? 1 : 0.35, cursor: canUndo ? "pointer" : "not-allowed" })} title="Undo (⌘Z)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4"/>
              <path d="M4 9h11a5 5 0 0 1 0 10h-3"/>
            </svg>
          </button>
          <button onClick={onRedo} disabled={!canRedo} style={Object.assign({}, iconSeg(false), { opacity: canRedo ? 1 : 0.35, cursor: canRedo ? "pointer" : "not-allowed" })} title="Redo (⌘⇧Z)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 14 20 9 15 4"/>
              <path d="M20 9H9a5 5 0 0 0 0 10h3"/>
            </svg>
          </button>
          <button onClick={onDuplicate} disabled={!canDuplicate} style={Object.assign({}, iconSeg(false), { opacity: canDuplicate ? 1 : 0.35, cursor: canDuplicate ? "pointer" : "not-allowed" })} title={canDuplicate ? "Duplicate selected (⌘D)" : "Select a node to duplicate"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="12" rx="2"/>
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
            </svg>
          </button>
          <button onClick={onDelete} disabled={!canDelete}
            style={Object.assign({}, iconSeg(false), { opacity: canDelete ? 1 : 0.35, cursor: canDelete ? "pointer" : "not-allowed" })}
            title={canDelete ? "Delete selected (Delete)" : "Select a node to delete"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1.2 13.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// Small confirmation dialog used by edit-mode deletes and the dirty-exit prompt.


// ── NodeShape ──
function NodeShape({ node, selected, highlighted, dimmed, hover }) {
  const c = colorForNode(node);
  const r = node.size;
  const stroke = c.stroke;
  const strokeW = selected ? 2.2 : highlighted ? 1.8 : 1.3;
  const opacity = dimmed ? 0.28 : 1;
  const shadow = selected ? "drop-shadow(0 0 0.5px rgba(0,0,0,.25))" : "none";

  const common = { fill: c.fill, stroke, strokeWidth: strokeW, style: { filter: shadow, transition: "stroke-width 120ms" }, opacity };

  let inner = null;
  // Uploaded image trumps everything else.
  if (node.glyphImage) {
    const imgR = r * 0.62;
    inner = <foreignObject x={-imgR} y={-imgR} width={imgR * 2} height={imgR * 2}>
      <img src={node.glyphImage} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
    </foreignObject>;
  }
  // Picked glyph wins over heuristics — scaled to sit comfortably inside the
  // node body without filling it edge-to-edge.
  else if (node.glyph) {
    var gDef = glyphById(node.glyph);
    if (gDef) inner = <g transform={`scale(${(r * 0.42) / 3.4})`}>{gDef.render(c)}</g>;
  }
  if (inner) { /* already set */ }
  else if (node.state === "signal") {
    inner = <polygon points="0,-7 7,0 0,7 -7,0" fill={c.stroke} opacity="0.85" />;
  } else if (node.state === "risk") {
    inner = <polygon points="0,-7 6.5,5 -6.5,5" fill="none" stroke={c.stroke} strokeWidth="1.4" />;
  } else if (node.state === "incident") {
    inner = (
      <g>
        <line x1="0" y1="-5" x2="0" y2="2" stroke={c.stroke} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="5" r="1" fill={c.stroke} />
      </g>
    );
  } else if (node.type === "entity") {
    inner = <circle r={r * 0.18} fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.55" />;
  } else if (node.type === "agent") {
    inner = <path d="M -4 0 L 0 -5 L 4 0 L 0 5 Z" fill="none" stroke={c.stroke} strokeWidth="1.1" opacity="0.75" />;
  } else if (node.type === "source") {
    inner = <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.7" />;
  }

  let shape;
  if (node.type === "agent") {
    // hexagon
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
    }
    shape = <polygon points={pts.join(" ")} {...common} />;
  } else if (node.type === "source") {
    shape = <rect x={-r} y={-r} width={r * 2} height={r * 2} rx="3" {...common} />;
  } else {
    shape = <circle r={r} {...common} />;
  }

  return (
    <g opacity={opacity}>
      {(selected || highlighted) && (
        node.type === "agent" ? (
          <polygon
            points={[0,1,2,3,4,5].map(i => {
              const a = (Math.PI / 3) * i - Math.PI / 2;
              const rr = r + 7;
              return `${(rr * Math.cos(a)).toFixed(2)},${(rr * Math.sin(a)).toFixed(2)}`;
            }).join(" ")}
            fill="none" stroke={c.stroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.55"
          />
        ) : node.type === "source" ? (
          <rect x={-r - 7} y={-r - 7} width={(r + 7) * 2} height={(r + 7) * 2} rx="5" fill="none" stroke={c.stroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
        ) : (
          <circle r={r + 7} fill="none" stroke={c.stroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
        )
      )}
      {shape}
      {inner}
    </g>
  );
}

// ---------- HEADER ----------------------------------------------------------

const TABS = ["Graph", "Nodes", "Edges", "Knowledge", "Sources", "Records", "Violations", "Governance"];




// ── Sidebar (node list) ──
function Sidebar({ open, onToggle, filter, setFilter, query, setQuery, selected, onSelect, hover, setHover, savedView, setSavedView }) {
  const filtered = useMemo(() => {
    return SIDEBAR_NODES.filter(n => {
      if (filter !== "all" && (n.cat === "support" ? "secondary" : n.cat) !== filter) return false;
      if (query && !n.label.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [filter, query]);

  const counts = useMemo(() => ({
    all: SIDEBAR_NODES.length,
    entity: SIDEBAR_NODES.filter(n => n.type === "entity").length,
    agent:  SIDEBAR_NODES.filter(n => n.type === "agent").length,
    source: SIDEBAR_NODES.filter(n => n.type === "source").length,
  }), []);

  return (
    <aside className={"sb" + (open ? "" : " closed")}>
      {!open && (
        <button className="sb-reopen" onClick={onToggle} title="Open sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
      <div className="sb-search">
        <input
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="sb-collapse" onClick={onToggle} title="Collapse sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="sb-section-head">
        <span>{filtered.length} NODES</span>
      </div>

      <div className="sb-list">
        {filtered.map(n => (
          <button
            key={n.id}
            className={"sb-item" + (selected === n.id ? " on" : "") + (hover === n.id ? " hover" : "")}
            onClick={() => onSelect(n.id)}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
          >
            <ListGlyph node={n} />
            <div className="sb-item-text">
              <div className="sb-item-label">{n.label}</div>
            </div>
            <svg className="sb-item-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="sb-empty">No nodes match.</div>
        )}
      </div>

    </aside>
  );
}

// ---------- INSPECTOR (right panel) ----------------------------------------


// ── Stage 1 host: provides graph state + view/edit toggle, renders the canvas ──
export { SIDEBAR_NODES, EDGES as GRAPH_EDGES, ListGlyph, colorForNode, AddNodeFlow, NewEdgeFlow, generateProps, generateRules }

export default function GraphStage() {
  // Agents aren't part of the graph here — drop them and any edges touching them.
  const BASE_NODES = useMemo(() => NODES.filter(n => n.type !== "agent" && n.type !== "source"), [])
  const BASE_EDGES = useMemo(() => {
    const ok = {}; BASE_NODES.forEach(n => { ok[n.id] = true })
    return EDGES.filter(e => ok[e.s] && ok[e.t])
  }, [BASE_NODES])
  const [nodes, setNodes] = useState(BASE_NODES)
  const [edges, setEdges] = useState(BASE_EDGES)
  const [selected, setSelected] = useState(null)
  const [hover, setHover] = useState(null)
  const [filter, setFilter] = useState("all")
  const [showCounts, setShowCounts] = useState(true)
  const initView = useMemo(() => {
    const xs = BASE_NODES.map(n => n.x), ys = BASE_NODES.map(n => n.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const zoom = 0.8
    return { zoom, panX: -cx * zoom, panY: -cy * zoom }
  }, [])
  const [viewport, setViewport] = useState(initView)
  const [editMode, setEditMode] = useState(false)
  const [cursorMode, setCursorMode] = useState("select")
  const [multiSelected, setMultiSelected] = useState([])
  const [query, setQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── edit-mode modal state ──
  const [addNodeOpen, setAddNodeOpen] = useState(false)
  const [pendingAddPos, setPendingAddPos] = useState(null)   // { x, y } world coords
  const [pendingEdgeFrom, setPendingEdgeFrom] = useState(null) // { fromId, toId, editIdx?, initialLabel? }
  const [pendingDelete, setPendingDelete] = useState(null)   // { ids: [...] }

  const selectedNode = useMemo(() => nodes.find(n => n.id === selected) || null, [nodes, selected])

  // ── undo / redo history ──
  const historyRef = useRef({ past: [], future: [] })
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])
  const [, setHistoryTick] = useState(0)

  const pushHistory = useCallback(() => {
    historyRef.current.past.push({
      nodes: nodesRef.current.map(n => Object.assign({}, n)),
      edges: edgesRef.current.map(e => Object.assign({}, e)),
    })
    if (historyRef.current.past.length > 60) historyRef.current.past.shift()
    historyRef.current.future = []
    setHistoryTick(t => t + 1)
  }, [])
  const undo = useCallback(() => {
    const past = historyRef.current.past
    if (!past.length) return
    historyRef.current.future.push({ nodes: nodesRef.current.map(n => Object.assign({}, n)), edges: edgesRef.current.map(e => Object.assign({}, e)) })
    const snap = past.pop(); setNodes(snap.nodes); setEdges(snap.edges); setHistoryTick(t => t + 1)
  }, [])
  const redo = useCallback(() => {
    const future = historyRef.current.future
    if (!future.length) return
    historyRef.current.past.push({ nodes: nodesRef.current.map(n => Object.assign({}, n)), edges: edgesRef.current.map(e => Object.assign({}, e)) })
    const snap = future.pop(); setNodes(snap.nodes); setEdges(snap.edges); setHistoryTick(t => t + 1)
  }, [])

  const duplicateSelected = useCallback(() => {
    const ids = multiSelected.length ? multiSelected : (selected ? [selected] : [])
    if (!ids.length) return
    pushHistory()
    const newIds = []
    setNodes(ns => {
      const existing = ns.map(n => n.id)
      const out = ns.slice()
      ids.forEach(id => {
        const src = ns.find(n => n.id === id); if (!src) return
        const base = src.id + "-copy"; let nid = base, k = 2
        while (existing.indexOf(nid) >= 0) { nid = base + k; k++ }
        existing.push(nid)
        out.push(Object.assign({}, src, { id: nid, x: (src.x || 0) + 40, y: (src.y || 0) + 40 }))
        newIds.push(nid)
      })
      return out
    })
    setMultiSelected(newIds)
  }, [multiSelected, selected, pushHistory])

  const deleteSelected = useCallback(() => {
    const ids = multiSelected.length ? multiSelected : (selected ? [selected] : [])
    if (!ids.length) return
    setPendingDelete({ ids: ids.slice() })
  }, [multiSelected, selected])

  const commitDelete = useCallback(ids => {
    pushHistory()
    const idSet = {}; ids.forEach(id => { idSet[id] = true })
    setNodes(ns => ns.filter(n => !idSet[n.id]))
    setEdges(es => es.filter(e => !idSet[e.s] && !idSet[e.t]))
    setMultiSelected([])
    if (selected && idSet[selected]) setSelected(null)
    setPendingDelete(null)
  }, [pushHistory, selected])

  // edit-mode keyboard shortcuts
  useEffect(() => {
    if (!editMode) return
    function onKey(e) {
      const tag = e.target && e.target.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (meta && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo() }
      else if (meta && (e.key === "d" || e.key === "D")) { e.preventDefault(); duplicateSelected() }
      else if (e.key === "Delete" || e.key === "Backspace") { if (multiSelected.length || selected) { e.preventDefault(); deleteSelected() } }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [editMode, multiSelected, selected, undo, redo, duplicateSelected, deleteSelected])

  const enterEditMode = () => { setEditMode(true); setSelected(null); setSidebarOpen(false) }
  const exitEditMode = () => { setEditMode(false); setMultiSelected([]); setSidebarOpen(true) }

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%', overflow: 'hidden', display: 'flex' }}>
      <Sidebar
        open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)}
        filter={filter} setFilter={setFilter}
        query={query} setQuery={setQuery}
        selected={selected} onSelect={setSelected}
        hover={hover} setHover={setHover}
        savedView={null} setSavedView={() => {}}
      />
      <main style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#fbf9f3' }}>
        <Canvas
          nodes={nodes} setNodes={setNodes}
          edges={edges} setEdges={setEdges}
          selected={selected} setSelected={setSelected}
          hover={hover} setHover={setHover}
          filter={filter} query={query} savedView={null}
          viewport={viewport} setViewport={setViewport}
          sidebarOpen={sidebarOpen}
          showInferred showEdgeLabels showCounts={showCounts}
          editMode={editMode}
          cursorMode={cursorMode}
          multiSelected={multiSelected} setMultiSelected={setMultiSelected}
          pushHistory={pushHistory}
          onEditAdd={(wx, wy) => { setPendingAddPos({ x: wx, y: wy }); setAddNodeOpen(true) }}
          onEditConnect={(fromId, toId) => setPendingEdgeFrom({ fromId, toId })}
          onEditOpenNode={id => { setSelected(id) }}
          onEditEdge={idx => { const e = edges[idx]; if (!e) return; setPendingEdgeFrom({ fromId: e.s, toId: e.t, editIdx: idx, initialLabel: e.label || "" }) }}
        />
        <Legend filter={filter} setFilter={setFilter} showCounts={showCounts} setShowCounts={setShowCounts} />
        <div className="bottomright">
          <Minimap nodes={nodes} viewport={viewport} size={{ w: 1100, h: 700 }} />
          <ZoomControls viewport={viewport} setViewport={setViewport} nodes={nodes} size={{ w: 1100, h: 700 }} />
        </div>
        <ViewEditToggle
          editMode={editMode}
          onEnter={enterEditMode} onExit={exitEditMode}
          cursorMode={cursorMode} setCursorMode={setCursorMode}
          canUndo={historyRef.current.past.length > 0}
          canRedo={historyRef.current.future.length > 0}
          onUndo={undo} onRedo={redo}
          onDuplicate={duplicateSelected} canDuplicate={multiSelected.length > 0 || !!selected}
          onDelete={deleteSelected} canDelete={multiSelected.length > 0 || !!selected}
        />
      </main>

      {!editMode && selectedNode && (
        <Inspector
          node={selectedNode} edges={edges} nodes={nodes}
          onClose={() => setSelected(null)}
          onViewDetails={() => { setEditMode(true); setSidebarOpen(false) }}
          onEditSchema={() => { setEditMode(true); setSidebarOpen(false) }}
        />
      )}

      {addNodeOpen && (
        <AddNodeFlow
          onClose={() => { setAddNodeOpen(false); setPendingAddPos(null) }}
          onCreate={spec => {
            pushHistory()
            const slug = (spec.name || "node").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "node"
            let px, py
            if (pendingAddPos) { px = pendingAddPos.x; py = pendingAddPos.y }
            else { const j = nodes.length * 80; px = (j % 400) - 200; py = Math.floor(j / 400) * 120 - 60 }
            const userProps = (spec.properties && spec.properties.length) ? spec.properties.slice() : []
            const catMap = { core: "core", secondary: "support", derived: "derived" }
            const newNode = {
              id: slug + "-" + (nodes.length + 1),
              label: spec.name || "New node",
              type: spec.shape || "entity",
              cat: catMap[spec.category] || "core",
              x: px, y: py,
              props: userProps.length, edges: 0,
              glyph: spec.glyph || null, glyphImage: spec.glyphImage || null, size: 22,
              _userProps: userProps, _description: spec.description || "",
              instances: "—", instancesN: 0, fill: 0, conf: 0, pii: 0, fresh: "—", change: "LOW",
            }
            setNodes(ns => ns.concat([newNode]))
            setSelected(newNode.id)
            setAddNodeOpen(false); setPendingAddPos(null)
          }}
        />
      )}

      {pendingEdgeFrom && (
        <NewEdgeFlow
          nodes={nodes}
          fromNode={nodes.find(n => n.id === pendingEdgeFrom.fromId)}
          toNode={nodes.find(n => n.id === pendingEdgeFrom.toId)}
          initialLabel={pendingEdgeFrom.initialLabel || ""}
          onClose={() => setPendingEdgeFrom(null)}
          onCreate={spec => {
            const s = spec && spec.from && spec.from.id
            const t = spec && spec.to && spec.to.id
            const lbl = (spec.label || "RELATES").toUpperCase()
            const editIdx = pendingEdgeFrom.editIdx
            if (s && t) {
              pushHistory()
              if (editIdx !== undefined && editIdx !== null) setEdges(es => es.map((edge, i) => i === editIdx ? Object.assign({}, edge, { s, t, label: lbl }) : edge))
              else setEdges(es => es.concat([{ s, t, label: lbl, kind: "direct" }]))
            }
            setPendingEdgeFrom(null)
          }}
        />
      )}

      {pendingDelete && (
        <DeleteImpactDialog
          ids={pendingDelete.ids} nodes={nodes} edges={edges}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => commitDelete(pendingDelete.ids)}
        />
      )}
    </div>
  )
}

/* ════════ STAGE 2: EDIT + INSPECTOR (ported from ECG) ════════ */
// URL persistence shim — wizard works without query-param sync.
function useUrlFlow(key, defaultVal){ return useState(defaultVal); }
function glyphById(id){ for (var i=0;i<NODE_GLYPHS.length;i++) if (NODE_GLYPHS[i].id===id) return NODE_GLYPHS[i]; return null; }
function _identityInitials(label){ return (label || '').split(/\s+/).map(function(p){ return p[0]; }).filter(Boolean).slice(0,2).join('').toUpperCase(); }

// — identity directory (PermRow picker) —
var IDENTITY_DIRECTORY = {
  special: { kind:"group", id:"everyone", label:"Everyone in org", desc:"All users in the workspace", count:482 },
  groups: [
    { kind:"group", id:"data-platform", label:"data-platform team", count:12 },
    { kind:"group", id:"engineering",   label:"engineering team",   count:40 },
    { kind:"group", id:"customer-ops",  label:"customer-ops team",  count:24 },
    { kind:"group", id:"finance-ops",   label:"finance-ops team",   count:8  },
    { kind:"group", id:"security",      label:"security team",      count:6  },
    { kind:"group", id:"legal",         label:"legal team",         count:4  },
    { kind:"group", id:"people-ops",    label:"people-ops team",    count:5  },
    { kind:"group", id:"marketing",     label:"marketing team",     count:10 },
    { kind:"group", id:"sales",         label:"sales team",         count:32 },
    { kind:"group", id:"support",       label:"support team",       count:18 },
    { kind:"group", id:"product",       label:"product team",       count:15 },
    { kind:"group", id:"compliance",    label:"compliance team",    count:7  }
  ],
  users: [
    { kind:"user", id:"morgan.lee", label:"Morgan Lee",     email:"morgan.lee@workspace", title:"Data Platform Lead",   team:"data-platform" },
    { kind:"user", id:"ramin.k",    label:"Ramin Khan",     email:"ramin.k@workspace",    title:"Senior Engineer",      team:"engineering"   },
    { kind:"user", id:"jordan.s",   label:"Jordan Singh",   email:"jordan.s@workspace",   title:"Customer Ops Manager", team:"customer-ops"  },
    { kind:"user", id:"priya.n",    label:"Priya Nair",     email:"priya.n@workspace",    title:"Security Engineer",    team:"security"      },
    { kind:"user", id:"diego.r",    label:"Diego Ramos",    email:"diego.r@workspace",    title:"Compliance Analyst",   team:"legal"         },
    { kind:"user", id:"sam.t",      label:"Sam Tan",        email:"sam.t@workspace",      title:"Finance Manager",      team:"finance-ops"   },
    { kind:"user", id:"avery.l",    label:"Avery Lopez",    email:"avery.l@workspace",    title:"Product Manager",      team:"product"       },
    { kind:"user", id:"lin.h",      label:"Lin Hayashi",    email:"lin.h@workspace",      title:"Sales Director",       team:"sales"         },
    { kind:"user", id:"kai.p",      label:"Kai Patel",      email:"kai.p@workspace",      title:"Support Engineer",     team:"support"       },
    { kind:"user", id:"noor.f",     label:"Noor Faraz",     email:"noor.f@workspace",     title:"People Ops Partner",   team:"people-ops"    },
    { kind:"user", id:"riley.b",    label:"Riley Brooks",   email:"riley.b@workspace",    title:"Staff Engineer",       team:"engineering"   },
    { kind:"user", id:"sasha.m",    label:"Sasha Mehra",    email:"sasha.m@workspace",    title:"Marketing Lead",       team:"marketing"     }
  ]
};
/* ===== Stage 2 edit + Inspector — ported from ECG ecg.jsx ===== */

// — wizard step hook + RichSelect primitive —
function useWizardStep(key, initial) {
  initial = initial || 1;
  var [raw, setRaw] = useUrlFlow(key, String(initial));
  var step = Number(raw) || initial;
  var setStep = useCallback(function(next) {
    setRaw(function(prevRaw) {
      var prev = Number(prevRaw) || initial;
      var v = typeof next === "function" ? next(prev) : next;
      return String(v);
    });
  }, [key]);
  return [step, setStep];
}


function RichSelect({ value, onChange, options, placeholder, leadingColor, accent, mono, disabled, ariaLabel }) {
  var [open, setOpen] = React.useState(false);
  var btnRef = React.useRef(null);
  var [coords, setCoords] = React.useState({ top:0, left:0, width:0 });
  var selected = options.find(function(o){ return o.value === value; });
  var fontFamily = mono ? "JetBrains Mono" : "inherit";
  function toggle(){
    if (disabled) return;
    if (!open && btnRef.current) {
      var r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(function(o){ return !o; });
  }
  return (
    <div style={{ position:"relative", width:"100%" }}>
      <button ref={btnRef} type="button" onClick={toggle} aria-label={ariaLabel} disabled={disabled}
        style={{
          display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 11px 7px 11px",
          border:"1px solid " + (open ? "var(--ink-2)" : "var(--line)"), borderRadius:7,
          background: disabled ? "var(--panel-2)" : "var(--panel)", color: accent || "var(--ink)",
          cursor: disabled ? "not-allowed" : "pointer", fontFamily:fontFamily, textAlign:"left",
          boxShadow: open ? "0 0 0 2px color-mix(in oklab, var(--ink) 7%, transparent), inset 0 1px 0 rgba(255,255,255,0.6)" : "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(40,40,20,0.02)",
          fontSize: 12.5, minHeight:34, transition:"border-color 100ms, box-shadow 100ms"
        }}>
        {(leadingColor || (selected && selected.color)) && (
          <span style={{ width:8, height:8, borderRadius:"50%", background: leadingColor || selected.color, flexShrink:0 }} />
        )}
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color: accent || (selected ? "var(--ink)" : "var(--ink-4)") }}>
          {selected ? selected.label : (placeholder || "—")}
        </span>
        {selected && selected.sub && (
          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", flexShrink:0 }}>{selected.sub}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:"var(--ink-3)", flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition:"transform 120ms ease" }}>
          <polyline points="3,5 6,8 9,5"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={function(){ setOpen(false); }} style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:299 }} />
          <div style={{
            position:"fixed", top:coords.top, left:coords.left, minWidth:coords.width, maxWidth: Math.max(coords.width, 280),
            zIndex:300, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:9,
            boxShadow:"0 18px 44px rgba(0,0,0,0.18), 0 0 0 1px rgba(40,40,20,0.02)", padding:5,
            maxHeight:300, overflowY:"auto"
          }}>
            {options.map(function(opt){
              var isSel = opt.value === value;
              return (
                <button key={String(opt.value)} type="button" onClick={function(){ onChange(opt.value); setOpen(false); }}
                  style={{
                    display:"flex", alignItems:"center", gap:9, width:"100%", padding:"7px 9px",
                    borderRadius:6, border:"none", textAlign:"left", cursor:"pointer", fontFamily:fontFamily,
                    background: isSel ? "var(--chip)" : "transparent", color:"var(--ink)"
                  }}
                  onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                  onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                  {opt.color && <span style={{ width:8, height:8, borderRadius:"50%", background: opt.color, flexShrink:0 }} />}
                  <span style={{ flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize: 12.5 }}>{opt.label}</span>
                  {opt.sub && <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>{opt.sub}</span>}
                  {isSel && <span style={{ color:"var(--ink)", fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Brand-styled SVG glyphs for source systems ───────────────────────────────
// Tasteful stylised marks (not literal trademarked assets) — Snowflake's
// snowflake, Salesforce's cloud, HubSpot's sprocket, etc. Used in the Sources
// catalog and the connector picker so the rows feel less monotone.

// — data generators —
function generateProps(node) {
  // User-defined properties (from the Add Node flow) take precedence over
  // anything synthesized — that's what makes the new node feel real.
  if (node._userProps && node._userProps.length) {
    return node._userProps.map(function(p, i){
      return Object.assign({ fill: 100, conf: 100, source: "primary" }, p);
    });
  }
  if (PROPS_BY_NODE[node.id]) return PROPS_BY_NODE[node.id];
  const out = [];
  const seed = node.id.charCodeAt(0) + node.id.length;
  out.push({ name: node.id + "_id", type: "uuid", required: true, indexed: true, pii: false, pk: true, fill: 100, conf: 100, source: "primary" });
  out.push({ name: "name", type: "string", required: true, indexed: true, pii: false, fill: 99 - (seed%4), conf: 98 - (seed%5), source: "primary" });
  out.push({ name: "created_at", type: "timestamp", required: true, indexed: true, pii: false, fill: 100, conf: 100, source: "primary" });
  const extras = ["status","owner_id","type","priority","metadata","amount","external_ref","resolved_at"];
  for (let i = 0; i < Math.min(node.props - 3, extras.length); i++) {
    const e = extras[i];
    var row = { name: e, type: i%3===0?"enum":i%3===1?"string":"timestamp", required: i<2, indexed: i%2===0, pii: e.includes("owner")||e.includes("ref"), fill: 70+((seed*i)%30), conf: 80+((seed+i)%19), source: "primary" };
    if (e === "metadata") {
      row.type = "struct";
      row.children = [
        { name: "source_system", type: "enum",      required: false, indexed: false, pii: false, fill: 92, conf: 98, source: "primary" },
        { name: "ingested_at",   type: "timestamp", required: false, indexed: true,  pii: false, fill: 100,conf: 100,source: "primary" },
        { name: "version",       type: "int",       required: false, indexed: false, pii: false, fill: 84, conf: 96, source: "primary" },
        { name: "tags",          type: "string[]",  required: false, indexed: false, pii: false, fill: 71, conf: 95, source: "primary" },
      ];
    }
    if (e === "external_ref") {
      row.type = "struct";
      row.children = [
        { name: "system", type: "enum",   required: false, indexed: false, pii: false, fill: 96, conf: 99, source: "primary" },
        { name: "ref_id", type: "string", required: false, indexed: true,  pii: false, fill: 94, conf: 99, source: "primary" },
        { name: "url",    type: "struct", required: false, indexed: false, pii: false, fill: 62, conf: 92, source: "primary",
          children: [
            { name: "host",   type: "string", required: false, indexed: false, pii: false, fill: 62, conf: 92, source: "primary" },
            { name: "path",   type: "string", required: false, indexed: false, pii: false, fill: 60, conf: 91, source: "primary" },
            { name: "scheme", type: "enum",   required: false, indexed: false, pii: false, fill: 62, conf: 99, source: "primary" },
          ]
        },
      ];
    }
    out.push(row);
  }
  return out;
}

const SOURCES_BY_NODE = {
  account: [
    { name: "Salesforce CRM",    type: "Primary",   freq: "Streaming",    last: "12s ago",  status: "healthy",  rows: "2,840",  errors: 0 },
    { name: "NetSuite ERP",      type: "Financial", freq: "Hourly",       last: "18m ago",  status: "healthy",  rows: "2,684",  errors: 0 },
    { name: "HubSpot Marketing", type: "Enrichment",freq: "Daily 02:00",  last: "6h ago",   status: "degraded", rows: "1,902",  errors: 14 },
    { name: "Manual / Admin UI", type: "Override",  freq: "On change",    last: "2d ago",   status: "healthy",  rows: "42",     errors: 0 },
  ],
};

function generateSources(node) {
  if (SOURCES_BY_NODE[node.id]) return SOURCES_BY_NODE[node.id];
  if (node.type === "agent")  return [{ name: "Computed by agent", type: "Agent", freq: "Triggered", last: "live", status: "healthy", rows: "—", errors: 0 }];
  if (node.type === "source") return [{ name: "Self (system of record)", type: "Source", freq: "Streaming", last: "live", status: "healthy", rows: "—", errors: 0 }];
  return [
    { name: "Snowflake Warehouse", type: "Primary", freq: "Streaming", last: "1m ago", status: "healthy", rows: node.instances, errors: 0 },
    { name: "Manual / Admin UI",   type: "Override",freq: "On change", last: "1d ago", status: "healthy", rows: "—",         errors: 0 },
  ];
}

const RULES_BY_NODE = {
  account: {
    quality: [
      { kind: "VALIDATE", id: "arr_nonneg",    title: "ARR is non-negative",                  expr: "arr_usd >= 0",                                label: "arr_usd ≥ 0",                          severity: "ERROR", violations: 0,  compliance: 100, on: true, last: "0 fails / 24h" },
      { kind: "VALIDATE", id: "domain_format", title: "Domain format is valid",                expr: 'domain ~ /^[a-z0-9-.]+$/',                   label: "domain matches /^[a-z0-9-.]+$/",      severity: "WARN",  violations: 12, compliance: 99,  on: true, last: "12 violations" },
      { kind: "COMPUTE",  id: "tier_buckets",  title: "Tier derived from ARR bands",           expr: "tier := arr_usd → {SMB, MM, ENT}",           label: "tier := arr_usd → {SMB,MM,ENT}",       severity: "ERROR", violations: 0,  compliance: 100, on: true, last: "2,840 evaluated" },
      { kind: "COMPUTE",  id: "risk_score",    title: "Risk score from Customer Health agent", expr: "risk_score := agent:cust_health.score",      label: "risk_score from cust_health agent",   severity: "WARN",  violations: 0,  compliance: 100, on: true, last: "2,712 written" },
      { kind: "ACCESS",   id: "pii_role",      title: "PII fields require acct_admin role",   expr: "fields(pii=true) → require role:acct_admin", label: "PII fields gated on role:acct_admin", severity: "ERROR", violations: 0,  compliance: 100, on: true, last: "audit logged" },
      { kind: "SLO",      id: "freshness_30m", title: "Freshness p95 under 30 minutes",        expr: "p95(ingest_lag) < 30m",                      label: "freshness p95 < 30m",                  severity: "WARN",  violations: 0,  compliance: 100, on: true, last: "OK (p95 = 4m 12s)" },
      { kind: "INFER",    id: "previously_at", title: "Infer past employer relationships",     expr: "Person :PREVIOUSLY_AT Account",              label: "Person :PREVIOUSLY_AT Account",        severity: "INFO",  violations: 0,  compliance: 100, on: true, last: "18 inferred today" },
    ],
    match: [
      { id: "domain_match",   title: "Domain-based company match",   signals: [{field:"domain",strategy:"normalized_domain",weight:0.50},{field:"company_name",strategy:"fuzzy_name",weight:0.35},{field:"billing_city",strategy:"exact",weight:0.15}], threshold_auto:0.92, threshold_review:0.75, candidates:7,  auto_resolved:24, on:true, last:"7 pending review" },
      { id: "tax_id_match",   title: "Tax ID exact match",           signals: [{field:"tax_id",strategy:"exact",weight:1.0}],                                                                                                                              threshold_auto:1.00, threshold_review:0.95, candidates:2,  auto_resolved:8,  on:true, last:"2 pending review" },
      { id: "topology_match", title: "Shared subscription topology", signals: [{field:"HAS_SUBSCRIPTION",strategy:"common_neighbor",weight:0.60},{field:"company_name",strategy:"fuzzy_name",weight:0.40}],                                               threshold_auto:0.88, threshold_review:0.70, candidates:3,  auto_resolved:2,  on:true, last:"3 pending review" },
    ],
    survivorship: [
      { id: "srv_arr",     title: "ARR: ERP wins over CRM",              property:"arr_usd",         strategy:"source_priority",  sources:["NetSuite ERP","Salesforce CRM","HubSpot Marketing"],  conflicts:0, evaluated:2840, on:true, last:"0 conflicts" },
      { id: "srv_domain",  title: "Domain: most complete value wins",    property:"domain",           strategy:"completeness",     sources:["Salesforce CRM","HubSpot Marketing","Manual / Admin"], conflicts:3, evaluated:2840, on:true, last:"3 conflicts" },
      { id: "srv_name",    title: "Company name: recency with CRM bias", property:"company_name",     strategy:"recency_weighted", sources:["Salesforce CRM","HubSpot Marketing","NetSuite ERP"],   conflicts:0, evaluated:2840, on:true, last:"0 conflicts" },
      { id: "srv_billing", title: "Billing address: trust tier",         property:"billing_address",  strategy:"source_trust",     sources:["NetSuite ERP","Salesforce CRM","Manual / Admin"],       conflicts:1, evaluated:2840, on:true, last:"1 conflict" },
    ],
  },
};

function generateRules(node) {
  if (RULES_BY_NODE[node.id]) return RULES_BY_NODE[node.id];
  const missing = 100 - node.fill;
  return {
    quality: [
      { kind: "VALIDATE", id: node.id+"_id_unique", title: node.label+" ID is unique",     expr: node.id+"_id IS UNIQUE",               label: node.id+"_id is unique",      severity: "ERROR", violations: 0,      compliance: 100,      on: true, last: "0 fails / 24h" },
      { kind: "SLO",      id: "freshness",          title: "Freshness SLO",                expr: "p95(ingest_lag) < "+node.fresh,        label: "freshness p95 < "+node.fresh, severity: "WARN",  violations: 0,      compliance: 100,      on: true, last: node.fresh },
      { kind: "VALIDATE", id: "required_fields",    title: "Required fields are present",  expr: "required_fields IS NOT NULL",         label: "required fields present",    severity: "ERROR", violations: missing, compliance: node.fill, on: true, last: missing+"% missing" },
    ],
    match: [
      { id: node.id+"_name_match", title: node.label+" name match", signals: [{field:"name",strategy:"fuzzy_name",weight:1.0}], threshold_auto:0.95, threshold_review:0.80, candidates:0, auto_resolved:0, on:false, last:"not configured" },
    ],
    survivorship: [
      { id: "srv_"+node.id+"_name", title: "Name: most recent source wins", property:"name", strategy:"recency", sources:[], conflicts:0, evaluated:node.instancesN, on:true, last:"0 conflicts" },
    ],
  };
}

function metricColor(v) {
  if (v >= 92) return "var(--green)";
  if (v >= 80) return "var(--gold)";
  return "var(--coral)";
}

// — node template + property config data —
var NODE_CATEGORIES_CONFIG = [
  { id:"core",      code:"CORE", label:"Core entity",      color:"var(--blue)",   fill:"var(--blue-fill)",   desc:"A first-class business object that other entities relate to — Account, Customer, Product." },
  { id:"secondary", code:"SEC",  label:"Secondary entity", color:"var(--purple)", fill:"var(--purple-fill)", desc:"Operational records that support the core — Ticket, Interaction, Task, Note." },
  { id:"derived",   code:"DRV",  label:"Derived entity",   color:"var(--gold)",   fill:"var(--gold-fill)",   desc:"Computed or analytical entities — Account Health, Forecast, Risk Score." }
];

// Department groups for the template picker — order = display order.
var NODE_TEMPLATE_DEPARTMENTS = [
  { id:"sales",         label:"Sales & Revenue",   color:"var(--green)"  },
  { id:"customer",      label:"Customer & CRM",    color:"var(--gold)"   },
  { id:"support",       label:"Service & Support", color:"var(--coral)"  },
  { id:"finance",       label:"Finance & Billing", color:"var(--green)"  },
  { id:"people",        label:"People & HR",       color:"var(--purple)" },
  { id:"product",       label:"Product & Catalog", color:"var(--blue)"   },
  { id:"marketing",     label:"Marketing",         color:"var(--purple)" },
  { id:"operations",    label:"Operations",        color:"var(--gold)"   },
  { id:"governance",    label:"Governance & Risk", color:"var(--coral)"  },
  { id:"healthcare",    label:"Healthcare",        color:"var(--purple)" },
  { id:"financial-svc", label:"Financial Services",color:"var(--blue)"   }
];

// Maps each template to a built-in NODE_GLYPHS line icon (drawn in [-4..4] space).
var TEMPLATE_GLYPH = {
  contract:"contract", customer:"person", ticket:"ticket", invoice:"invoice", product:"tag",
  employee:"employee", opportunity:"target", interaction:"message", account:"account", lead:"funnel",
  quote:"document", subscription:"subscription", contact:"contact", "case":"briefcase", entitlement:"license",
  knowledge_article:"idea", sla:"shield", payment:"payment", journal_entry:"report", expense:"receipt",
  worker:"person", position:"briefcase", team:"team", asset:"archive", inventory:"database",
  campaign:"trend", marketing_list:"bookmark", segment:"pie", vendor:"organization", purchase_order:"order",
  task:"task", policy:"policy", risk:"risk", compliance_case:"audit", patient:"heart",
  encounter:"schedule", bank_account:"card", transaction:"sync", kyc_case:"shield"
};
function templateGlyphSvg(t, size) {
  var gd = glyphById(TEMPLATE_GLYPH[t.id] || "document");
  if (!gd) return (t.icon || t.name.slice(0, 2).toUpperCase());
  return <svg width={size} height={size} viewBox="-4 -4 8 8" style={{ display:"block" }}>{gd.render({ fill:"none", stroke:"var(--ink-3)" })}</svg>;
}

// Pre-built property templates by node archetype
var NODE_TEMPLATES = [
  {
    id:"contract",     name:"Contract",     icon:"CT", brief:"Legal agreement between parties",
    category:"core",   department:"sales",
    properties:[
      { name:"contract_id",      type:"uuid",      required:true,  indexed:true,  pii:false, pk:true },
      { name:"title",            type:"string",    required:true,  indexed:true,  pii:false },
      { name:"parties",          type:"string[]",  required:true,  indexed:false, pii:false },
      { name:"effective_date",   type:"date",      required:true,  indexed:true,  pii:false },
      { name:"termination_date", type:"date",      required:false, indexed:true,  pii:false },
      { name:"total_value_usd",  type:"decimal",   required:false, indexed:false, pii:false },
      { name:"renewal_clause",   type:"bool",      required:false, indexed:false, pii:false },
      { name:"jurisdiction",     type:"string",    required:false, indexed:false, pii:false },
      { name:"status",           type:"enum",      required:true,  indexed:true,  pii:false }
    ]
  },
  {
    id:"customer",     name:"Customer",     icon:"CU", brief:"End user or buyer record",
    category:"core",   department:"customer",
    properties:[
      { name:"customer_id",  type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
      { name:"first_name",   type:"string", required:true,  indexed:true,  pii:true },
      { name:"last_name",    type:"string", required:true,  indexed:true,  pii:true },
      { name:"email",        type:"string", required:true,  indexed:true,  pii:true },
      { name:"phone",        type:"string", required:false, indexed:false, pii:true },
      { name:"created_at",   type:"timestamp", required:true, indexed:true, pii:false },
      { name:"lifetime_value", type:"decimal", required:false, indexed:false, pii:false }
    ]
  },
  {
    id:"ticket",       name:"Ticket",       icon:"TK", brief:"Support request or work item",
    category:"support",department:"support",
    properties:[
      { name:"ticket_id",  type:"uuid",      required:true,  indexed:true,  pii:false, pk:true },
      { name:"subject",    type:"string",    required:true,  indexed:false, pii:false },
      { name:"description",type:"string",    required:false, indexed:false, pii:false },
      { name:"priority",   type:"enum",      required:true,  indexed:true,  pii:false },
      { name:"status",     type:"enum",      required:true,  indexed:true,  pii:false },
      { name:"created_at", type:"timestamp", required:true,  indexed:true,  pii:false },
      { name:"resolved_at",type:"timestamp", required:false, indexed:false, pii:false },
      { name:"assignee_id",type:"string",    required:false, indexed:true,  pii:false }
    ]
  },
  {
    id:"invoice",      name:"Invoice",      icon:"IN", brief:"Billing document",
    category:"core",   department:"finance",
    properties:[
      { name:"invoice_id",  type:"uuid",      required:true,  indexed:true,  pii:false, pk:true },
      { name:"invoice_number", type:"string", required:true,  indexed:true,  pii:false },
      { name:"amount_usd",  type:"decimal",   required:true,  indexed:false, pii:false },
      { name:"currency",    type:"enum",      required:true,  indexed:false, pii:false },
      { name:"issued_at",   type:"date",      required:true,  indexed:true,  pii:false },
      { name:"due_date",    type:"date",      required:true,  indexed:true,  pii:false },
      { name:"paid_at",     type:"timestamp", required:false, indexed:false, pii:false },
      { name:"status",      type:"enum",      required:true,  indexed:true,  pii:false }
    ]
  },
  {
    id:"product",      name:"Product",      icon:"PR", brief:"Sellable item or SKU",
    category:"core",   department:"product",
    properties:[
      { name:"product_id", type:"uuid",    required:true,  indexed:true,  pii:false, pk:true },
      { name:"sku",        type:"string",  required:true,  indexed:true,  pii:false },
      { name:"name",       type:"string",  required:true,  indexed:true,  pii:false },
      { name:"category",   type:"enum",    required:true,  indexed:true,  pii:false },
      { name:"price_usd",  type:"decimal", required:true,  indexed:false, pii:false },
      { name:"in_stock",   type:"bool",    required:true,  indexed:false, pii:false }
    ]
  },
  {
    id:"employee",     name:"Employee",     icon:"EM", brief:"Workforce member",
    category:"core",   department:"people",
    properties:[
      { name:"employee_id",   type:"uuid",      required:true,  indexed:true,  pii:false, pk:true },
      { name:"first_name",    type:"string",    required:true,  indexed:true,  pii:true },
      { name:"last_name",     type:"string",    required:true,  indexed:true,  pii:true },
      { name:"email",         type:"string",    required:true,  indexed:true,  pii:true },
      { name:"manager_id",    type:"string",    required:false, indexed:true,  pii:false },
      { name:"department",    type:"enum",      required:true,  indexed:true,  pii:false },
      { name:"hire_date",     type:"date",      required:true,  indexed:true,  pii:false }
    ]
  },
  {
    id:"opportunity",  name:"Opportunity",  icon:"OP", brief:"Sales pipeline deal",
    category:"core",   department:"sales",
    properties:[
      { name:"opportunity_id", type:"uuid",      required:true,  indexed:true,  pii:false, pk:true },
      { name:"name",           type:"string",    required:true,  indexed:true,  pii:false },
      { name:"stage",          type:"enum",      required:true,  indexed:true,  pii:false },
      { name:"amount_usd",     type:"decimal",   required:false, indexed:false, pii:false },
      { name:"close_date",     type:"date",      required:false, indexed:true,  pii:false },
      { name:"probability",    type:"decimal",   required:false, indexed:false, pii:false },
      { name:"owner_id",       type:"string",    required:true,  indexed:true,  pii:false }
    ]
  },
  {
    id:"interaction",  name:"Interaction",  icon:"IX", brief:"Customer touchpoint event",
    category:"support",department:"support",
    properties:[
      { name:"interaction_id", type:"uuid",      required:true,  indexed:true,  pii:false, pk:true },
      { name:"channel",        type:"enum",      required:true,  indexed:true,  pii:false },
      { name:"occurred_at",    type:"timestamp", required:true,  indexed:true,  pii:false },
      { name:"duration_sec",   type:"decimal",   required:false, indexed:false, pii:false },
      { name:"summary",        type:"string",    required:false, indexed:false, pii:false },
      { name:"sentiment",      type:"enum",      required:false, indexed:false, pii:false }
    ]
  },

  // ── Sales & Revenue ─────────────────────────────────────────────────────
  { id:"account", name:"Account", icon:"AC", brief:"Buying organisation or company", category:"core", department:"sales", properties:[
    { name:"account_id",  type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",        type:"string", required:true,  indexed:true,  pii:false },
    { name:"industry",    type:"enum",   required:false, indexed:true,  pii:false },
    { name:"arr",         type:"decimal",required:false, indexed:false, pii:false },
    { name:"tier",        type:"enum",   required:false, indexed:true,  pii:false },
    { name:"owner_id",    type:"string", required:true,  indexed:true,  pii:false }
  ]},
  { id:"lead", name:"Lead", icon:"LD", brief:"Unqualified sales prospect", category:"core", department:"sales", properties:[
    { name:"lead_id",       type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"full_name",     type:"string", required:true,  indexed:true,  pii:true },
    { name:"company_name",  type:"string", required:false, indexed:true,  pii:false },
    { name:"email",         type:"string", required:false, indexed:true,  pii:true },
    { name:"source_channel",type:"enum",   required:false, indexed:true,  pii:false },
    { name:"score",         type:"decimal",required:false, indexed:false, pii:false }
  ]},
  { id:"quote", name:"Quote", icon:"QT", brief:"Formal offer with pricing & terms", category:"secondary", department:"sales", properties:[
    { name:"quote_id",        type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"quote_number",    type:"string", required:true,  indexed:true,  pii:false },
    { name:"effective_from",  type:"date",   required:true,  indexed:false, pii:false },
    { name:"expires_on",      type:"date",   required:true,  indexed:true,  pii:false },
    { name:"discount_amount", type:"decimal",required:false, indexed:false, pii:false }
  ]},
  { id:"subscription", name:"Subscription", icon:"SB", brief:"Active recurring product license", category:"core", department:"sales", properties:[
    { name:"subscription_id", type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"plan",            type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"mrr",             type:"decimal",required:true,  indexed:false, pii:false },
    { name:"status",          type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"renews_on",       type:"date",   required:true,  indexed:true,  pii:false }
  ]},

  // ── Customer & CRM ──────────────────────────────────────────────────────
  { id:"contact", name:"Contact", icon:"CN", brief:"Person at an account", category:"core", department:"customer", properties:[
    { name:"contact_id",  type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"full_name",   type:"string", required:true,  indexed:true,  pii:true },
    { name:"email",       type:"string", required:true,  indexed:true,  pii:true },
    { name:"phone",       type:"string", required:false, indexed:false, pii:true },
    { name:"job_title",   type:"string", required:false, indexed:false, pii:false },
    { name:"account_id",  type:"string", required:true,  indexed:true,  pii:false }
  ]},

  // ── Service & Support ───────────────────────────────────────────────────
  { id:"case", name:"Case", icon:"CS", brief:"Customer service incident", category:"support", department:"support", properties:[
    { name:"incident_id",          type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"title",                type:"string", required:true,  indexed:true,  pii:false },
    { name:"case_origin_code",     type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"priority_code",        type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"customer_satisfaction",type:"enum",   required:false, indexed:false, pii:false }
  ]},
  { id:"entitlement", name:"Entitlement", icon:"EN", brief:"Support coverage attached to a customer", category:"secondary", department:"support", properties:[
    { name:"entitlement_id",  type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",            type:"string", required:true,  indexed:true,  pii:false },
    { name:"start_date",      type:"date",   required:true,  indexed:false, pii:false },
    { name:"end_date",        type:"date",   required:true,  indexed:true,  pii:false },
    { name:"remaining_terms", type:"decimal",required:false, indexed:false, pii:false }
  ]},
  { id:"knowledge_article", name:"Knowledge Article", icon:"KA", brief:"Published help-centre article", category:"secondary", department:"support", properties:[
    { name:"article_id",        type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"title",             type:"string", required:true,  indexed:true,  pii:false },
    { name:"content",           type:"string", required:true,  indexed:false, pii:false },
    { name:"key_words",         type:"string[]",required:false,indexed:true,  pii:false },
    { name:"publish_on",        type:"date",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"sla", name:"SLA", icon:"SL", brief:"Service-level agreement target", category:"secondary", department:"support", properties:[
    { name:"sla_id",                 type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",                   type:"string", required:true,  indexed:false, pii:false },
    { name:"first_response_minutes", type:"decimal",required:true,  indexed:false, pii:false },
    { name:"applicable_from",        type:"date",   required:true,  indexed:false, pii:false }
  ]},

  // ── Finance & Billing ───────────────────────────────────────────────────
  { id:"payment", name:"Payment", icon:"PY", brief:"Settled payment instrument", category:"core", department:"finance", properties:[
    { name:"payment_id",  type:"uuid",     required:true,  indexed:true,  pii:false, pk:true },
    { name:"amount",      type:"decimal",  required:true,  indexed:false, pii:false },
    { name:"method",      type:"enum",     required:true,  indexed:true,  pii:false },
    { name:"received_at", type:"timestamp",required:true,  indexed:true,  pii:false }
  ]},
  { id:"journal_entry", name:"Journal Entry", icon:"JE", brief:"Double-entry ledger posting", category:"secondary", department:"finance", properties:[
    { name:"je_id",   type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"date",    type:"date",   required:true,  indexed:true,  pii:false },
    { name:"debit",   type:"decimal",required:true,  indexed:false, pii:false },
    { name:"credit",  type:"decimal",required:true,  indexed:false, pii:false },
    { name:"memo",    type:"string", required:false, indexed:false, pii:false }
  ]},
  { id:"expense", name:"Expense", icon:"EX", brief:"Reimbursable employee expense", category:"secondary", department:"finance", properties:[
    { name:"expense_id",    type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"employee_id",   type:"string", required:true,  indexed:true,  pii:false },
    { name:"amount",        type:"decimal",required:true,  indexed:false, pii:false },
    { name:"category",      type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"submitted_on",  type:"date",   required:true,  indexed:true,  pii:false }
  ]},

  // ── People & HR ─────────────────────────────────────────────────────────
  { id:"worker", name:"Worker", icon:"WK", brief:"Employee or contractor", category:"core", department:"people", properties:[
    { name:"personnel_number",     type:"string", required:true,  indexed:true,  pii:true,  pk:true },
    { name:"name",                 type:"string", required:true,  indexed:true,  pii:true },
    { name:"worker_type",          type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"primary_contact_email",type:"string", required:true,  indexed:true,  pii:true }
  ]},
  { id:"position", name:"Position", icon:"PS", brief:"Staffed role at a point in time", category:"core", department:"people", properties:[
    { name:"position_id",         type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"title",               type:"string", required:true,  indexed:true,  pii:false },
    { name:"department",          type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"full_time_equivalent",type:"decimal",required:true,  indexed:false, pii:false },
    { name:"activation",          type:"date",   required:true,  indexed:false, pii:false }
  ]},
  { id:"team", name:"Team", icon:"TM", brief:"Organisational unit", category:"core", department:"people", properties:[
    { name:"team_id",   type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",      type:"string", required:true,  indexed:true,  pii:false },
    { name:"function",  type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"leader_id", type:"string", required:false, indexed:true,  pii:false }
  ]},

  // ── Product & Catalog ───────────────────────────────────────────────────
  { id:"asset", name:"Asset", icon:"AS", brief:"Managed company asset", category:"core", department:"product", properties:[
    { name:"asset_id",  type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"type",      type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"assignee",  type:"string", required:false, indexed:true,  pii:false },
    { name:"status",    type:"enum",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"inventory", name:"Inventory", icon:"IV", brief:"On-hand stock at a location", category:"secondary", department:"product", properties:[
    { name:"sku",       type:"string", required:true,  indexed:true,  pii:false, pk:true },
    { name:"location",  type:"string", required:true,  indexed:true,  pii:false },
    { name:"on_hand",   type:"decimal",required:true,  indexed:false, pii:false },
    { name:"reserved",  type:"decimal",required:false, indexed:false, pii:false }
  ]},

  // ── Marketing ───────────────────────────────────────────────────────────
  { id:"campaign", name:"Campaign", icon:"CP", brief:"Marketing initiative", category:"core", department:"marketing", properties:[
    { name:"campaign_id",   type:"uuid",     required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",          type:"string",   required:true,  indexed:true,  pii:false },
    { name:"actual_start",  type:"date",     required:true,  indexed:true,  pii:false },
    { name:"budgeted_cost", type:"decimal",  required:false, indexed:false, pii:false },
    { name:"objective",     type:"enum",     required:false, indexed:true,  pii:false }
  ]},
  { id:"marketing_list", name:"Marketing List", icon:"ML", brief:"Targeted audience list", category:"secondary", department:"marketing", properties:[
    { name:"list_id",       type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"list_name",     type:"string", required:true,  indexed:true,  pii:false },
    { name:"member_type",   type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"member_count",  type:"decimal",required:false, indexed:false, pii:false }
  ]},
  { id:"segment", name:"Segment", icon:"SG", brief:"Defined audience cohort", category:"derived", department:"marketing", properties:[
    { name:"segment_id",       type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"segment_name",     type:"string", required:true,  indexed:true,  pii:false },
    { name:"filter_query",     type:"string", required:true,  indexed:false, pii:false },
    { name:"activation_status",type:"enum",   required:true,  indexed:true,  pii:false }
  ]},

  // ── Operations ──────────────────────────────────────────────────────────
  { id:"vendor", name:"Vendor", icon:"VD", brief:"Supplier of materials or services", category:"core", department:"operations", properties:[
    { name:"vendor_id", type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",      type:"string", required:true,  indexed:true,  pii:false },
    { name:"tier",      type:"enum",   required:false, indexed:true,  pii:false },
    { name:"status",    type:"enum",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"purchase_order", name:"Purchase Order", icon:"PO", brief:"Procurement document", category:"secondary", department:"operations", properties:[
    { name:"po_id",      type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"amount",     type:"decimal",required:true,  indexed:false, pii:false },
    { name:"vendor_id",  type:"string", required:true,  indexed:true,  pii:false },
    { name:"status",     type:"enum",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"task", name:"Task", icon:"TS", brief:"Assigned activity with owner", category:"secondary", department:"operations", properties:[
    { name:"task_id",         type:"uuid",     required:true,  indexed:true,  pii:false, pk:true },
    { name:"subject",         type:"string",   required:true,  indexed:false, pii:false },
    { name:"scheduled_start", type:"timestamp",required:true,  indexed:true,  pii:false },
    { name:"priority_code",   type:"enum",     required:true,  indexed:true,  pii:false },
    { name:"status",          type:"enum",     required:true,  indexed:true,  pii:false }
  ]},

  // ── Governance & Risk ───────────────────────────────────────────────────
  { id:"policy", name:"Policy", icon:"PL", brief:"Governance or risk policy", category:"derived", department:"governance", properties:[
    { name:"policy_id",  type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"name",       type:"string", required:true,  indexed:true,  pii:false },
    { name:"version",    type:"string", required:true,  indexed:false, pii:false },
    { name:"effective",  type:"date",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"risk", name:"Risk", icon:"RK", brief:"Identified open risk", category:"derived", department:"governance", properties:[
    { name:"risk_id",    type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"severity",   type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"category",   type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"status",     type:"enum",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"compliance_case", name:"Compliance Case", icon:"CC", brief:"Open regulatory investigation", category:"secondary", department:"governance", properties:[
    { name:"case_id",   type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"regulator", type:"string", required:true,  indexed:true,  pii:false },
    { name:"status",    type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"opened_on", type:"date",   required:true,  indexed:true,  pii:false }
  ]},

  // ── Healthcare (FHIR-aligned) ───────────────────────────────────────────
  { id:"patient", name:"Patient", icon:"PT", brief:"Individual receiving care", category:"core", department:"healthcare", properties:[
    { name:"patient_id",         type:"uuid",   required:true,  indexed:true,  pii:true,  pk:true },
    { name:"date_of_birth",      type:"date",   required:true,  indexed:true,  pii:true },
    { name:"gender",             type:"enum",   required:false, indexed:false, pii:true },
    { name:"mrn",                type:"string", required:true,  indexed:true,  pii:true },
    { name:"primary_provider_id",type:"string", required:false, indexed:true,  pii:false }
  ]},
  { id:"encounter", name:"Encounter", icon:"EC", brief:"Clinical visit or admission", category:"core", department:"healthcare", properties:[
    { name:"encounter_identifier",type:"uuid",     required:true,  indexed:true,  pii:false, pk:true },
    { name:"encounter_class",     type:"enum",     required:true,  indexed:true,  pii:false },
    { name:"encounter_status",    type:"enum",     required:true,  indexed:true,  pii:false },
    { name:"period_start",        type:"timestamp",required:true,  indexed:true,  pii:false },
    { name:"period_end",          type:"timestamp",required:false, indexed:false, pii:false }
  ]},

  // ── Financial Services (Banking) ────────────────────────────────────────
  { id:"bank_account", name:"Bank Account", icon:"BA", brief:"Customer banking account", category:"core", department:"financial-svc", properties:[
    { name:"account_id",        type:"uuid",   required:true,  indexed:true,  pii:true,  pk:true },
    { name:"account_number",    type:"string", required:true,  indexed:true,  pii:true },
    { name:"available_balance", type:"decimal",required:true,  indexed:false, pii:false },
    { name:"branch_id",         type:"string", required:true,  indexed:true,  pii:false },
    { name:"product_type",      type:"enum",   required:true,  indexed:true,  pii:false }
  ]},
  { id:"transaction", name:"Transaction", icon:"TX", brief:"Money-movement event", category:"core", department:"financial-svc", properties:[
    { name:"txn_id",    type:"uuid",     required:true,  indexed:true,  pii:false, pk:true },
    { name:"amount",    type:"decimal",  required:true,  indexed:false, pii:false },
    { name:"currency",  type:"enum",     required:true,  indexed:false, pii:false },
    { name:"direction", type:"enum",     required:true,  indexed:true,  pii:false },
    { name:"posted_at", type:"timestamp",required:true,  indexed:true,  pii:false }
  ]},
  { id:"kyc_case", name:"KYC Case", icon:"KC", brief:"Know-Your-Customer review", category:"secondary", department:"financial-svc", properties:[
    { name:"kyc_id",      type:"uuid",   required:true,  indexed:true,  pii:false, pk:true },
    { name:"customer_id", type:"string", required:true,  indexed:true,  pii:true },
    { name:"status",      type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"risk_rating", type:"enum",   required:true,  indexed:true,  pii:false },
    { name:"opened_on",   type:"date",   required:true,  indexed:true,  pii:false }
  ]}
];

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED IDENTITY DIRECTORY + AccessRow (formerly PermRow)
// Enterprise-grade access picker used everywhere — Read/Write/Admin rows across
// AddNodeFlow, NewGraphFlow, NewEdgeFlow. Sticky search, sectioned results
// (Everyone / Teams / People), member counts on teams, titles on users.
// ═══════════════════════════════════════════════════════════════════════════════


var PROP_TYPE_META = {
  "uuid":      { color:"var(--purple)", glyph:"ID"  },
  "string":    { color:"var(--blue)",   glyph:"T"   },
  "string[]":  { color:"var(--blue)",   glyph:"[T]" },
  "decimal":   { color:"var(--gold)",   glyph:"#"   },
  "float":     { color:"var(--gold)",   glyph:".5"  },
  "bool":      { color:"var(--coral)",  glyph:"01"  },
  "timestamp": { color:"var(--green)",  glyph:"TS"  },
  "date":      { color:"var(--green)",  glyph:"DT"  },
  "datetime":  { color:"var(--green)",  glyph:"DT"  },
  "enum":      { color:"var(--purple)", glyph:"E"   },
  "struct":    { color:"var(--ink-3)",  glyph:"{}"  },
  "array":     { color:"var(--blue)",   glyph:"[ ]" },
  "object":    { color:"var(--ink-3)",  glyph:"{ }" }
};
var PROP_TYPE_OPTIONS = ["uuid", "string", "string[]", "decimal", "float", "bool", "timestamp", "date", "datetime", "enum", "array", "object", "struct"];
// Types that can carry nested child properties (a child schema).
var PROP_NESTABLE = { array: true, object: true, struct: true };

// Reusable design-system type picker (icon glyph + full PROP_TYPE_OPTIONS list).
function PropTypeSelect({ value, onChange }) {
  var [open, setOpen] = React.useState(false);
  var btnRef = React.useRef(null);
  var meta = PROP_TYPE_META[value] || PROP_TYPE_META.string;
  var menuPos;
  if (open && btnRef.current) {
    var r = btnRef.current.getBoundingClientRect();
    var GAP = 4, FOOTER_SAFE = 96, TOP_SAFE = 16, DESIRED = 280;
    var below = window.innerHeight - r.bottom - FOOTER_SAFE;
    var above = r.top - TOP_SAFE;
    var up = below < Math.min(DESIRED, 200) && above > below;
    var mh = Math.max(160, Math.min(DESIRED, (up ? above : below) - GAP));
    menuPos = { position:"fixed", left:r.left, minWidth:Math.max(150, r.width), top: up ? Math.max(TOP_SAFE, r.top - GAP - mh) : r.bottom + GAP, maxHeight:mh, zIndex:1000 };
  } else {
    menuPos = { position:"absolute", top:"calc(100% + 4px)", left:0, minWidth:150, maxHeight:280, zIndex:1000 };
  }
  return (
    <div style={{ position:"relative" }}>
      <button ref={btnRef} onClick={function(){ setOpen(function(o){ return !o; }); }}
        style={{ display:"flex", alignItems:"center", gap:7, width:"100%", padding:"7px 10px", border:"1px solid var(--line)", borderRadius:7, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
        <span style={{ minWidth:22, height:18, padding:"0 5px", borderRadius:4, background:meta.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.3px", flexShrink:0 }}>{meta.glyph}</span>
        <span style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink-2)" }}>{value}</span>
        <span style={{ color:"var(--ink-3)", fontSize:9, fontFamily:"JetBrains Mono" }}>▾</span>
      </button>
      {open && (
        <>
          <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999 }} onClick={function(){ setOpen(false); }} />
          <div style={Object.assign({ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:8, boxShadow:"0 10px 28px rgba(0,0,0,0.14)", padding:4, overflowY:"auto" }, menuPos)}>
            {PROP_TYPE_OPTIONS.map(function(t){
              var m = PROP_TYPE_META[t] || PROP_TYPE_META.string;
              var isSel = value === t;
              return (
                <button key={t} onClick={function(){ onChange(t); setOpen(false); }}
                  style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"6px 8px", borderRadius:5, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                  onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                  onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ minWidth:24, height:18, padding:"0 5px", borderRadius:4, background:m.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, flexShrink:0 }}>{m.glyph}</span>
                  <span style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink-2)" }}>{t}</span>
                  {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:11 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


// — PermRow —
function PermRow({ k, label, list, setList, tone, desc }) {
  var [open, setOpen] = useState(false);
  var [query, setQuery] = useState("");
  var [pos, setPos] = useState({ top:0, right:0, maxH:460 });
  var triggerRef = useRef(null);

  function openPicker(){
    if (triggerRef.current){
      var r = triggerRef.current.getBoundingClientRect();
      var available = window.innerHeight - r.bottom - 24;
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right, maxH: Math.max(280, Math.min(460, available)) });
    }
    setOpen(true);
    setQuery("");
  }

  function isSel(entry){
    return !!list.find(function(x){ return x.kind === entry.kind && x.id === entry.id; });
  }
  function toggle(entry){
    setList(function(arr){
      var exists = arr.find(function(x){ return x.kind === entry.kind && x.id === entry.id; });
      if (exists) return arr.filter(function(x){ return !(x.kind === entry.kind && x.id === entry.id); });
      return arr.concat([entry]);
    });
  }
  function removeOne(entry){
    setList(function(arr){ return arr.filter(function(x){ return !(x.kind === entry.kind && x.id === entry.id); }); });
  }

  var q = query.trim().toLowerCase();
  var matchSpecial = !q || IDENTITY_DIRECTORY.special.label.toLowerCase().indexOf(q) >= 0;
  var matchGroups  = IDENTITY_DIRECTORY.groups.filter(function(g){ return !q || g.label.toLowerCase().indexOf(q) >= 0; });
  var matchUsers   = IDENTITY_DIRECTORY.users.filter(function(u){
    if (!q) return true;
    return [u.label, u.email, u.title, u.team].some(function(f){ return (f || "").toLowerCase().indexOf(q) >= 0; });
  });
  var totalShown = (matchSpecial ? 1 : 0) + matchGroups.length + matchUsers.length;

  return (
    <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--line-2)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"2px 7px", borderRadius:4, background:tone.bg, color:tone.fg, fontWeight:700, letterSpacing:"0.5px" }}>{k.toUpperCase()}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{label}</span>
          </div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3 }}>{desc}</div>
        </div>
        <div style={{ position:"relative" }}>
          <button ref={triggerRef} onClick={function(){ if (open) setOpen(false); else openPicker(); }} className="btn-ghost" style={{ fontSize:11.5, display:"inline-flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:13, lineHeight:1, color:"var(--ink-2)" }}>+</span> Add people or teams
          </button>
          {open && (
            <>
              <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:299 }} onClick={function(){ setOpen(false); }} />
              <div style={{ position:"fixed", top:pos.top, right:pos.right, zIndex:300, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.22)", width:360, maxHeight:pos.maxH, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                {/* SEARCH */}
                <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--line-2)", background:"var(--panel-2)" }}>
                  <div style={{ position:"relative" }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                      <circle cx="6.5" cy="6.5" r="4.5" />
                      <line x1="10" y1="10" x2="14" y2="14" />
                    </svg>
                    <input type="text" value={query} onChange={function(e){ setQuery(e.target.value); }} placeholder="Search teams, people, titles…" autoFocus
                      style={{ width:"100%", padding:"7px 11px 7px 28px", fontSize:12.5, fontFamily:"inherit", color:"var(--ink)", background:"var(--panel)", border:"1px solid var(--line)", borderRadius:6, outline:"none", boxSizing:"border-box" }} />
                  </div>
                </div>
                {/* RESULTS */}
                <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
                  {/* Everyone (special) */}
                  {matchSpecial && (function(){
                    var entry = IDENTITY_DIRECTORY.special;
                    var sel = isSel(entry);
                    return (
                      <button onClick={function(){ toggle(entry); }}
                        style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 12px", background: sel ? "var(--bg-canvas)" : "transparent", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left", borderBottom:"1px dashed var(--line-2)", marginBottom:4 }}
                        onMouseEnter={function(e){ if (!sel) e.currentTarget.style.background = "var(--panel-2)"; }}
                        onMouseLeave={function(e){ if (!sel) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ width:24, height:24, borderRadius:"50%", background:"var(--ink)", color:"var(--bg-canvas)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <circle cx="8" cy="8" r="6" />
                            <path d="M2 8 H14" />
                            <path d="M8 2 c2.5 1.5 2.5 10.5 0 12 M8 2 c-2.5 1.5 -2.5 10.5 0 12" />
                          </svg>
                        </span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{entry.label}</div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", marginTop:1 }}>{entry.count + " members · grants access org-wide"}</div>
                        </div>
                        {sel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:14 }}>✓</span>}
                      </button>
                    );
                  })()}
                  {/* Teams */}
                  {matchGroups.length > 0 && (
                    <div style={{ padding:"4px 0" }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"4px 14px", color:"var(--ink-4)", letterSpacing:"0.7px", textTransform:"uppercase" }}>{"Teams · " + matchGroups.length}</div>
                      {matchGroups.map(function(g){
                        var sel = isSel(g);
                        return (
                          <button key={g.id} onClick={function(){ toggle(g); }}
                            style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"6px 12px", background: sel ? "var(--bg-canvas)" : "transparent", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                            onMouseEnter={function(e){ if (!sel) e.currentTarget.style.background = "var(--panel-2)"; }}
                            onMouseLeave={function(e){ if (!sel) e.currentTarget.style.background = "transparent"; }}>
                            <span style={{ width:22, height:22, borderRadius:4, background:"var(--ink-3)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="6" r="2" /><circle cx="11" cy="6" r="2" /><path d="M1 13.5 c0.5 -2 2 -3 4 -3 c2 0 3.5 1 4 3 z" /><path d="M7 13.5 c0.5 -2 2 -3 4 -3 c2 0 3.5 1 4 3 z" /></svg>
                            </span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12.5, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{g.label}</div>
                            </div>
                            <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", marginRight:4 }}>{g.count}</span>
                            {sel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Users */}
                  {matchUsers.length > 0 && (
                    <div style={{ padding:"4px 0" }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"4px 14px", color:"var(--ink-4)", letterSpacing:"0.7px", textTransform:"uppercase" }}>{"People · " + matchUsers.length}</div>
                      {matchUsers.map(function(u){
                        var sel = isSel(u);
                        return (
                          <button key={u.id} onClick={function(){ toggle(u); }}
                            style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"6px 12px", background: sel ? "var(--bg-canvas)" : "transparent", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                            onMouseEnter={function(e){ if (!sel) e.currentTarget.style.background = "var(--panel-2)"; }}
                            onMouseLeave={function(e){ if (!sel) e.currentTarget.style.background = "transparent"; }}>
                            <span style={{ width:22, height:22, borderRadius:"50%", background:"var(--ink-2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:8.5, fontWeight:700, flexShrink:0 }}>{_identityInitials(u.label)}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12.5, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.label}</div>
                              <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.title + " · " + u.team}</div>
                            </div>
                            {sel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Empty */}
                  {totalShown === 0 && (
                    <div style={{ padding:"36px 14px", textAlign:"center", color:"var(--ink-3)", fontSize:12 }}>
                      <div>No matches for "{query}"</div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:4 }}>Try a team, person, or title</div>
                    </div>
                  )}
                </div>
                {/* FOOTER */}
                <div style={{ padding:"8px 12px", borderTop:"1px solid var(--line-2)", background:"var(--panel-2)", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)" }}>
                  <span>{list.length + (list.length === 1 ? " grant" : " grants")} on this row</span>
                  <button onClick={function(){ setOpen(false); }} className="btn-ghost" style={{ fontSize:11 }}>Done</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Selected chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 5px" }}>
        {list.length === 0 && <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", fontStyle:"italic" }}>nobody</span>}
        {list.map(function(e){
          return (
            <span key={e.kind + "_" + e.id} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 5px 3px 7px", borderRadius:5, background:"var(--chip)", border:"1px solid var(--line-2)", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-2)" }}>
              <span style={{ width:13, height:13, borderRadius: e.kind === "user" ? "50%" : 3, background: e.kind === "user" ? "var(--ink-2)" : "var(--ink-3)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize: e.kind === "user" ? 7.5 : 8, fontWeight:700 }}>{e.kind === "user" ? _identityInitials(e.label) : (e.id === "everyone" ? "★" : "G")}</span>
              {e.label}
              <button onClick={function(){ removeOne(e); }} style={{ background:"none", border:"none", color:"var(--ink-3)", cursor:"pointer", padding:0, fontSize:12, lineHeight:1 }}>×</button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Property type → colour + short glyph. Used by the Review & edit fields
// table so each row reads at a glance.

// — Inspector (third pane) + Meter —
function Inspector({ node, onClose, onViewDetails, onEditSchema, edges: liveEdges, nodes: liveNodes }) {
  const [tab, setTab] = useState("Props");
  if (!node) return null;
  const c = colorForNode(node);
  // Fall back to the module-scope EDGES when the caller doesn't pass live state.
  const _edges = liveEdges || EDGES;
  const incoming = _edges.filter(e => e.t === node.id);
  const outgoing = _edges.filter(e => e.s === node.id);
  const properties = generateProps(node);
  const sources = generateSources(node);
  const rules = generateRules(node);

  // synthesized quality numbers based on node id so they're stable
  const seed = node.id.charCodeAt(0) + node.id.length;
  const complete = 88 + (seed % 11);
  const fresh = 75 + ((seed * 3) % 22);
  const valid = 91 + (seed % 8);

  const reqProps = properties.filter(p => p.required).length;
  const compProps = properties.filter(p => p.computed).length;
  const idxProps = properties.filter(p => p.indexed).length;
  const piiProps = properties.filter(p => p.pii).length;

  const TABS = [`Props · ${properties.length}`, `Edges · ${outgoing.length}`];

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <div className="ih-icon">
          <ListGlyph node={node} size={34} />
        </div>
        <div className="ih-text">
          <div className="ih-row">
            <div className="ih-title">{node.label}</div>
          </div>
        </div>
        <button className="ih-close" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "4px 14px 14px", borderBottom: "1px solid var(--line-2)" }}>
        <button onClick={onViewDetails}
          style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 500, fontFamily: "var(--sans)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s, border-color .15s" }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--panel-2)"; e.currentTarget.style.borderColor = "var(--ink-4)" }}
          onMouseOut={e => { e.currentTarget.style.background = "var(--panel)"; e.currentTarget.style.borderColor = "var(--line)" }}>
          View full details
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={onEditSchema}
          style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 500, fontFamily: "var(--sans)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s, border-color .15s" }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--panel-2)"; e.currentTarget.style.borderColor = "var(--ink-4)" }}
          onMouseOut={e => { e.currentTarget.style.background = "var(--panel)"; e.currentTarget.style.borderColor = "var(--line)" }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.8l2.7 2.7L4.8 11.9 1.5 12.5l.6-3.3 7.4-7.4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          Edit schema
        </button>
      </div>

      <div className="ih-stats">
        <div><div className="ih-stat-label">Records</div><div className="ih-stat-v">{node.instances}</div></div>
        <div><div className="ih-stat-label">Properties</div><div className="ih-stat-v">{properties.length}</div></div>
        <div><div className="ih-stat-label">Edge types</div><div className="ih-stat-v">{outgoing.length}</div></div>
      </div>

      <div className="ih-tabs">
        {TABS.map(t => {
          const name = t.split(" · ")[0];
          return <button key={name} className={"ih-tab" + (tab === name ? " on" : "")} onClick={() => setTab(name)}>{t}</button>;
        })}
      </div>

      <div className="ih-body">
        {tab === "Overview" && (
          <>
            <div className="ih-block">
              <div className="ih-block-head">At a glance</div>
              <div className="ih-grid">
                <div className="ih-card"><div className="ih-card-lbl">Required</div><div className="ih-card-v"><b>{reqProps}</b><span>/ {properties.length}</span></div></div>
                <div className="ih-card"><div className="ih-card-lbl">Computed</div><div className="ih-card-v" style={{color:"var(--green)"}}><b>{compProps}</b><span>/ {properties.length}</span></div></div>
                <div className="ih-card"><div className="ih-card-lbl">Indexed</div><div className="ih-card-v"><b>{idxProps}</b><span>/ {properties.length}</span></div></div>
                <div className="ih-card"><div className="ih-card-lbl">PII fields</div><div className="ih-card-v" style={{color: piiProps > 0 ? "var(--coral)" : "inherit"}}><b>{piiProps}</b><span>/ {properties.length}</span></div></div>
              </div>
            </div>

            <div className="ih-block">
              <div className="ih-block-head">Data quality <span className="ih-block-sub">Last 24h</span></div>
              <div className="ih-meters">
                <Meter label="Completeness" v={complete} tail={`${100-complete}% missing`} tone="ok" />
                <Meter label="Freshness"    v={fresh}    tail={`p95 = ${Math.round(60-fresh/2)}m ${(seed*7)%60}s`} tone="warn" />
                <Meter label="Validity"     v={valid}    tail={`${(seed*3)%14} violations`} tone="ok" />
                <Meter label="Identity match" v={91-(seed%6)} tail={`${(seed*5)%50} in queue`} tone="warn" />
              </div>
            </div>

            <div className="ih-block">
              <div className="ih-block-head">Lineage <span className="ih-block-sub">Where this node comes from</span></div>
              <div className="ih-rows">
                <div className="ih-row2"><span>Direct sources</span><b>{Math.max(1, Math.round(incoming.length/2))}</b></div>
                <div className="ih-row2"><span>Inferred edges</span><b>{incoming.filter(e=>e.kind==='inferred').length} in · {outgoing.filter(e=>e.kind==='inferred').length} out</b></div>
                <div className="ih-row2"><span>Computed properties</span><b>{compProps}</b></div>
              </div>
            </div>

            <div className="ih-block">
              <div className="ih-block-head">Top edges</div>
              <div className="ih-edges">
                {[...outgoing, ...incoming].slice(0, 6).map((e, i) => {
                  const other = NODES.find(n => n.id === (e.s === node.id ? e.t : e.s));
                  if (!other) return null;
                  const direction = e.s === node.id ? "→" : "←";
                  return (
                    <div key={i} className={"ih-edge ih-edge-" + e.kind}>
                      <span className="ih-edge-lbl">:{e.label}</span>
                      <span className="ih-edge-dir">{direction}</span>
                      <span className="ih-edge-other"><ListGlyph node={other} size={14} /> {other.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "Props" && (
          <div className="ih-block">
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "#FEFDFB" }}>
              {properties.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: i < properties.length - 1 ? "1px solid var(--line-2)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: p.pk ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 1 }}>{p.name}</div>
                    <span className="snap-type">{p.type}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {p.pk  && <span className="snap-tag snap-pk">PK</span>}
                    {p.pii && <span className="snap-tag snap-pii">PII</span>}
                    {p.required && <span className="snap-tag">REQ</span>}
                    {p.indexed  && <span className="snap-tag snap-idx">IDX</span>}
                    {p.computed && <span className="snap-tag snap-comp">FX</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Edges" && (
          <>
            {outgoing.length > 0 && (
              <div className="ih-block">
                <div className="ih-block-head">Outgoing <span className="ih-block-sub">{outgoing.length} edge types</span></div>
                <div className="ih-edges">
                  {outgoing.map((e, i) => {
                    const target = NODES.find(n => n.id === e.t);
                    if (!target) return null;
                    const card = (seed + i * 11) % 100 < 70 ? "1:N" : "N:N";
                    const inst = ((seed + i * 17) % 800) + 50;
                    return (
                      <div key={i} className={"ih-edge ih-edge-" + e.kind}>
                        <span className="ih-edge-lbl">:{e.label}</span>
                        <span className="ih-edge-dir">→</span>
                        <span className="ih-edge-other"><ListGlyph node={target} size={14} />{target.label}</span>
                        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--ink-3)" }}>
                          <span>{card}</span><span>{inst.toLocaleString()}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {incoming.length > 0 && (
              <div className="ih-block">
                <div className="ih-block-head">Incoming <span className="ih-block-sub">{incoming.length} edge types</span></div>
                <div className="ih-edges">
                  {incoming.map((e, i) => {
                    const src = NODES.find(n => n.id === e.s);
                    if (!src) return null;
                    const card = (seed + i * 13) % 100 < 70 ? "N:1" : "N:N";
                    const inst = ((seed + i * 19) % 600) + 30;
                    return (
                      <div key={i} className={"ih-edge ih-edge-" + e.kind}>
                        <span className="ih-edge-lbl">:{e.label}</span>
                        <span className="ih-edge-dir">←</span>
                        <span className="ih-edge-other"><ListGlyph node={src} size={14} />{src.label}</span>
                        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--ink-3)" }}>
                          <span>{card}</span><span>{inst.toLocaleString()}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "Rules" && (
          <div className="ih-block">
            <div className="ih-block-head">Rules <span className="ih-block-sub">{rules.quality.length} quality · {rules.match.length} match · {rules.survivorship.length} surv</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {rules.quality.map((r, i) => (
                <div key={i} style={{ border: "1px solid var(--line-2)", borderRadius: 8, padding: "10px", background: "var(--panel-2)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className={"rule-kind rule-kind-" + r.kind.toLowerCase()} style={{ alignSelf: "flex-start" }}>{r.kind}</span>
                  <span style={{ fontSize: 12, color: "var(--ink)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{r.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.on ? "var(--green)" : "var(--coral)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 9.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.last}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Meter({ label, v, tail, tone }) {
  const color = tone === "warn" ? "var(--gold)" : "var(--green)";
  return (
    <div className="meter">
      <div className="meter-top"><span>{label}</span><span className="meter-tail">{tail}</span><b>{v}%</b></div>
      <div className="meter-bar"><div className="meter-fill" style={{ width: v + "%", background: color }} /></div>
    </div>
  );
}

// ---------- CANVAS (graph) --------------------------------------------------


// — AddNodeFlow —
function AddNodeFlow({ onClose, onCreate }) {
  var [step, setStep] = useWizardStep("astep", 1);

  // Step 1
  var [name, setName] = useState("");
  var [category, setCategory] = useState(null);
  var [description, setDescription] = useState("");
  var [shape, setShape] = useState("entity"); // entity / agent / source — kept for downstream code
  var [catOpen, setCatOpen] = useState(false);
  // Icon (glyph) the user picks for this node type — surfaces in the node list view.
  // glyph: id of a built-in NODE_GLYPHS entry, or null for the empty/placeholder state.
  // glyphImage retained on the data model only — uploads are no longer surfaced
  // in the picker. Future surface (custom org library) will reintroduce it.
  var [glyph, setGlyph] = useState(null);
  var [glyphImage] = useState(null);
  var [glyphOpen, setGlyphOpen] = useState(false);
  var [glyphQuery, setGlyphQuery] = useState("");

  // Step 2 - properties + creation mode
  var [propMode, setPropMode] = useState(null); // manual / spreadsheet / sample / template
  var [propModeOpen, setPropModeOpen] = useState(false);
  // Auto-open the method picker the first time the user lands on Step 2 with
  // nothing chosen — same affordance as if they'd clicked the trigger.
  useEffect(function(){
    if (step === 2 && !propMode) setPropModeOpen(true);
  }, [step]);
  var [properties, setProperties] = useState([]);
  var [selectedTemplate, setSelectedTemplate] = useState(null);
  var [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  var [templateQuery, setTemplateQuery] = useState("");
  var [templateCat, setTemplateCat] = useState("all"); // active department in the two-pane picker
  var templateBtnRef = React.useRef(null);

  // Inline type picker for the Review & edit fields table. Per-row open state
  // is kept locally so each pill manages its own popover.
  function TypePicker({ value, onChange }) {
    var [open, setOpen] = useState(false);
    var btnRef = React.useRef(null);
    var meta = PROP_TYPE_META[value] || PROP_TYPE_META.string;
    // Fixed-positioned menu anchored to the trigger so it escapes the modal clip
    // and flips upward near the bottom — never tucks behind the modal footer.
    var menuPos;
    if (open && btnRef.current) {
      var r = btnRef.current.getBoundingClientRect();
      var GAP = 4, FOOTER_SAFE = 96, TOP_SAFE = 16, DESIRED = 280;
      var below = window.innerHeight - r.bottom - FOOTER_SAFE;
      var above = r.top - TOP_SAFE;
      var up = below < Math.min(DESIRED, 200) && above > below;
      var mh = Math.max(160, Math.min(DESIRED, (up ? above : below) - GAP));
      menuPos = { position:"fixed", left:r.left, minWidth:Math.max(150, r.width), top: up ? Math.max(TOP_SAFE, r.top - GAP - mh) : r.bottom + GAP, maxHeight:mh, zIndex:1000 };
    } else {
      menuPos = { position:"absolute", top:"calc(100% + 4px)", left:0, minWidth:150, maxHeight:280, zIndex:1000 };
    }
    return (
      <div style={{ position:"relative" }}>
        <button ref={btnRef} onClick={function(){ setOpen(function(o){ return !o; }); }}
          style={{ display:"flex", alignItems:"center", gap:7, width:"100%", padding:"5px 8px", border:"1px solid var(--line)", borderRadius:6, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5)" }}>
          <span style={{ minWidth:22, height:18, padding:"0 5px", borderRadius:4, background:meta.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.3px", flexShrink:0 }}>{meta.glyph}</span>
          <span style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)" }}>{value}</span>
          <span style={{ color:"var(--ink-3)", fontSize:9, fontFamily:"JetBrains Mono" }}>▾</span>
        </button>
        {open && (
          <>
            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999 }} onClick={function(){ setOpen(false); }} />
            <div style={Object.assign({ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:8, boxShadow:"0 10px 28px rgba(0,0,0,0.14)", padding:4, overflowY:"auto" }, menuPos)}>
              {PROP_TYPE_OPTIONS.map(function(t){
                var m = PROP_TYPE_META[t] || PROP_TYPE_META.string;
                var isSel = value === t;
                return (
                  <button key={t} onClick={function(){ onChange(t); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"5px 8px", borderRadius:5, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ minWidth:24, height:18, padding:"0 5px", borderRadius:4, background:m.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, flexShrink:0 }}>{m.glyph}</span>
                    <span style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)" }}>{t}</span>
                    {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:11 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }
  var [uploadedFileName, setUploadedFileName] = useState("");
  var [parseStatus, setParseStatus] = useState("idle"); // idle / parsing / done
  var [parseModel, setParseModel] = useState("claude-3.5-sonnet");

  // Step 3 - identity
  var [pkField, setPkField] = useState("");
  var [advancedPropPath, setAdvancedPropPath] = useState(null);
  var [hoverKey, setHoverKey] = useState("");
  var [expandedRows, setExpandedRows] = useState({});
  function toggleExpand(key){ setExpandedRows(function(m){ var n = Object.assign({}, m); n[key] = !n[key]; return n; }); }
  function pathKey(path){ return path.join("."); }
  function getByPath(path){ var arr = properties, node = null; for (var k = 0; k < path.length; k++){ node = arr[path[k]]; if (!node) return null; arr = node.children || []; } return node; }
  function mutateAt(arr, path, fn){ var idx = path[0]; return arr.map(function(n, i){ if (i !== idx) return n; if (path.length === 1) return fn(n); var nn = Object.assign({}, n); nn.children = mutateAt(n.children || [], path.slice(1), fn); return nn; }); }
  function updatePath(path, key, val){ setProperties(function(arr){ return mutateAt(arr, path, function(n){ var nn = Object.assign({}, n); nn[key] = val; return nn; }); }); }
  function removePath(path){ setProperties(function(arr){ if (path.length === 1){ var p = arr[path[0]]; if (p && pkField === p.name) setPkField(""); return arr.filter(function(_, i){ return i !== path[0]; }); } return mutateAt(arr, path.slice(0, -1), function(n){ var nn = Object.assign({}, n); nn.children = (n.children || []).filter(function(_, j){ return j !== path[path.length - 1]; }); return nn; }); }); }
  function addChildPath(path){ setProperties(function(arr){ return mutateAt(arr, path, function(n){ var nn = Object.assign({}, n); nn.children = (n.children || []).concat([{ name: "new_field", type: "string" }]); return nn; }); }); setExpandedRows(function(m){ var n = Object.assign({}, m); n[pathKey(path)] = true; return n; }); }
  // Recursive property row — renders identically at any depth (name · type · PK/REQ/IDX/PII · settings · delete).
  function renderPropRow(p, path, depth){
    var key = pathKey(path);
    var isPk = depth === 0 ? (p.name === pkField) : !!p.pk;
    var advCount = ["nestUnder","unique","hashing","secure","display","search","sort","filter"].filter(function(k){ return !!p[k]; }).length;
    var nestable = !!PROP_NESTABLE[p.type];
    var kids = p.children || [];
    var expanded = !!expandedRows[key];
    return (
      <div key={key} onMouseEnter={function(){ setHoverKey(key); }} onMouseLeave={function(){ setHoverKey(function(h){ return h === key ? "" : h; }); }}
        style={{ borderBottom: depth === 0 ? "1px solid var(--line-2)" : "none", background: depth === 0 ? (path[0] % 2 === 1 ? "transparent" : "var(--bg-canvas)") : "transparent" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.7fr 150px 40px 40px 40px 40px 24px 32px", gap:8, padding:"8px 18px", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, paddingLeft: depth * 18 }}>
            {kids.length > 0
              ? <button onClick={function(){ toggleExpand(key); }} title={expanded ? "Collapse" : "Expand"} style={{ width:18, height:18, flexShrink:0, border:"none", background:"none", cursor:"pointer", color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(90deg)" : "none", transition:"transform 120ms" }}><path d="M9 6l6 6-6 6"/></svg>
                </button>
              : <span style={{ width:18, flexShrink:0 }} />}
            {depth > 0 && <span style={{ color:"var(--ink-4)", fontFamily:"JetBrains Mono", fontSize:11, flexShrink:0 }}>└</span>}
            <input value={p.name} onChange={function(e){ updatePath(path, "name", e.target.value); }} style={Object.assign({}, inp, { padding:"6px 9px", fontSize:12, fontFamily:"JetBrains Mono", maxWidth: depth > 0 ? Math.max(150, 420 - (depth - 1) * 64) : undefined })} />
            {nestable && <button onClick={function(){ addChildPath(path); }} title="Add a child field"
              style={{ width:20, height:20, flexShrink:0, borderRadius:5, border:"1px dashed var(--line)", background:"var(--panel-2)", color:"var(--ink-3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13, lineHeight:1 }}
              onMouseEnter={function(e){ e.currentTarget.style.background = "var(--chip)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={function(e){ e.currentTarget.style.background = "var(--panel-2)"; e.currentTarget.style.color = "var(--ink-3)"; }}>+</button>}
            {p.detectedFrom && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:"var(--ink-4)", flexShrink:0 }} title={p.detectedFrom}>↩</span>}
          </div>
          <TypePicker value={p.type} onChange={function(v){ updatePath(path, "type", v); }} />
          <input type="checkbox" checked={isPk} onChange={function(e){ if (depth === 0){ if (e.target.checked) setPkField(p.name); else if (isPk) setPkField(""); } else { updatePath(path, "pk", e.target.checked); } }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
          <input type="checkbox" checked={p.required || false} onChange={function(e){ updatePath(path, "required", e.target.checked); }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
          <input type="checkbox" checked={p.indexed || false} onChange={function(e){ updatePath(path, "indexed", e.target.checked); }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
          <input type="checkbox" checked={p.pii || false} onChange={function(e){ updatePath(path, "pii", e.target.checked); }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
          <button onClick={function(){ setAdvancedPropPath(path); }} title={advCount > 0 ? "Advanced settings (" + advCount + " active)" : "Advanced settings"}
            style={{ width:22, height:22, borderRadius:5, border:"none", background:"transparent", color: advCount > 0 ? "var(--ink-2)" : "var(--ink-4)", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:0, position:"relative", justifySelf:"center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {advCount > 0 && <span style={{ position:"absolute", top:-2, right:-2, width:6, height:6, borderRadius:3, background:"var(--blue)" }} />}
          </button>
          <button onClick={function(){ removePath(path); }} style={{ width:24, height:24, borderRadius:5, border:"1px solid var(--line)", background:"var(--panel-2)", color:"var(--ink-3)", cursor:"pointer", justifySelf:"center" }}>×</button>
        </div>
        {nestable && expanded && kids.map(function(c, ci){ return renderPropRow(c, path.concat(ci), depth + 1); })}
      </div>
    );
  }
  var [naturalKeys, setNaturalKeys] = useState([]);
  var [dedupStrategy, setDedupStrategy] = useState("on_natural_key"); // none / on_pk / on_natural_key / probabilistic

  // Step 3 - governance
  var CURRENT_USER = { id:"morgan.lee", label:"Morgan Lee", initials:"ML", team:"data-platform" };
  var [owner, setOwner] = useState(CURRENT_USER.id); // defaults to current user
  var [retentionPolicy, setRetentionPolicy] = useState("7y");
  var [complianceTags, setComplianceTags] = useState(["SOC2"]);
  var [tagsDropOpen, setTagsDropOpen] = useState(false);

  // Permissions — read / write / admin, each with users + groups
  var [permsRead, setPermsRead]   = useState([{ kind:"group", id:"everyone", label:"Everyone in org" }]);
  var [permsWrite, setPermsWrite] = useState([{ kind:"group", id:"data-platform", label:"data-platform team" }]);
  var [permsAdmin, setPermsAdmin] = useState([{ kind:"user",  id:CURRENT_USER.id, label:CURRENT_USER.label + " (you)" }]);
  var [permPickerOpen, setPermPickerOpen] = useState(null); // "read" | "write" | "admin" | null

  var DIRECTORY = [
    { kind:"group", id:"everyone",        label:"Everyone in org" },
    { kind:"group", id:"data-platform",   label:"data-platform team" },
    { kind:"group", id:"customer-ops",    label:"customer-ops team" },
    { kind:"group", id:"finance-ops",     label:"finance-ops team" },
    { kind:"group", id:"legal-ops",       label:"legal-ops team" },
    { kind:"group", id:"engineering",     label:"engineering team" },
    { kind:"group", id:"security",        label:"security team" },
    { kind:"group", id:"data-stewards",   label:"data-stewards group" },
    { kind:"user",  id:"morgan.lee",      label:"Morgan Lee" },
    { kind:"user",  id:"ramin.k",         label:"Ramin K" },
    { kind:"user",  id:"jordan.s",        label:"Jordan S" },
    { kind:"user",  id:"alex.r",          label:"Alex R" },
    { kind:"user",  id:"casey.m",         label:"Casey M" },
    { kind:"user",  id:"taylor.j",        label:"Taylor J" }
  ];

  // Step 6
  var [activate, setActivate] = useState(true);

  // Live lookup of the selected category. When nothing is picked yet (initial
  // state) we hand back a neutral placeholder so unguarded reads of catDef.fill
  // / .color / .label downstream don't blow up.
  var catDef = NODE_CATEGORIES_CONFIG.find(function(c){ return c.id === category; })
            || { id:null, label:"—", code:"", color:"var(--ink-3)", fill:"var(--chip)", desc:"" };
  var nameOk = name.trim().length >= 2 && /^[A-Z]/.test(name.trim());

  function canContinue() {
    if (step === 1) return nameOk && !!category;
    if (step === 2) return propMode === "skip" || (properties.length >= 1 && !!pkField);
    // Step 3 = Governance. Step 4 = Review.
    return true;
  }

  function addManualProp() {
    setProperties(function(arr){ return arr.concat([{ name:"new_field", type:"string", required:false, indexed:false, pii:false }]); });
  }
  function removeProp(idx) {
    setProperties(function(arr){
      var p = arr[idx];
      if (p && pkField === p.name) setPkField("");
      return arr.filter(function(_, i){ return i !== idx; });
    });
  }
  function updateProp(idx, key, val) {
    setProperties(function(arr){ return arr.map(function(p, i){
      if (i !== idx) return p;
      var n = {}; Object.keys(p).forEach(function(k){ n[k] = p[k]; });
      n[key] = val;
      if (key === "pk" && val === true) { setPkField(p.name); }
      return n;
    }); });
  }
  // Nested child properties (for array / object / struct types).
  function addChild(idx) {
    setProperties(function(arr){ return arr.map(function(p, i){
      if (i !== idx) return p;
      var n = Object.assign({}, p);
      n.children = (p.children || []).concat([{ name: "item", type: "string" }]);
      return n;
    }); });
    setExpandedRows(function(m){ var n = Object.assign({}, m); n[idx] = true; return n; });
  }
  function updateChild(idx, ci, key, val) {
    setProperties(function(arr){ return arr.map(function(p, i){
      if (i !== idx) return p;
      var n = Object.assign({}, p);
      n.children = (p.children || []).map(function(c, j){ if (j !== ci) return c; var cc = Object.assign({}, c); cc[key] = val; return cc; });
      return n;
    }); });
  }
  function removeChild(idx, ci) {
    setProperties(function(arr){ return arr.map(function(p, i){
      if (i !== idx) return p;
      var n = Object.assign({}, p);
      n.children = (p.children || []).filter(function(_, j){ return j !== ci; });
      return n;
    }); });
  }

  function applyTemplate(tplId) {
    var t = NODE_TEMPLATES.find(function(x){ return x.id === tplId; });
    if (!t) return;
    setSelectedTemplate(tplId);
    setProperties(t.properties.map(function(p){ return Object.assign({}, p); }));
    if (!name) setName(t.name);
    var pk = t.properties.find(function(p){ return p.pk; });
    if (pk) setPkField(pk.name);
  }

  function simulateUpload() {
    setUploadedFileName("customers_2025.xlsx");
    setProperties([
      { name:"id",            type:"uuid",      required:true,  indexed:true,  pii:false, pk:true,  detectedFrom:"col A" },
      { name:"name",          type:"string",    required:true,  indexed:true,  pii:true,  detectedFrom:"col B" },
      { name:"email",         type:"string",    required:true,  indexed:true,  pii:true,  detectedFrom:"col C" },
      { name:"signup_date",   type:"date",      required:true,  indexed:true,  pii:false, detectedFrom:"col D" },
      { name:"plan",          type:"enum",      required:true,  indexed:true,  pii:false, detectedFrom:"col E" },
      { name:"mrr_usd",       type:"decimal",   required:false, indexed:false, pii:false, detectedFrom:"col F" },
      { name:"last_login",    type:"timestamp", required:false, indexed:false, pii:false, detectedFrom:"col G" }
    ]);
    setPkField("id");
  }

  function simulateParse() {
    setUploadedFileName("acme_msa_sample.pdf");
    setParseStatus("parsing");
    setTimeout(function(){
      setProperties([
        { name:"contract_id",     type:"uuid",     required:true,  indexed:true,  pii:false, pk:true,  inferred:true, confidence:0.99 },
        { name:"counterparty",    type:"string",   required:true,  indexed:true,  pii:false, inferred:true, confidence:0.96 },
        { name:"effective_date",  type:"date",     required:true,  indexed:true,  pii:false, inferred:true, confidence:0.94 },
        { name:"term_months",     type:"decimal",  required:true,  indexed:false, pii:false, inferred:true, confidence:0.91 },
        { name:"total_value_usd", type:"decimal",  required:true,  indexed:false, pii:false, inferred:true, confidence:0.97 },
        { name:"auto_renews",     type:"bool",     required:false, indexed:false, pii:false, inferred:true, confidence:0.88 },
        { name:"governing_law",   type:"string",   required:false, indexed:false, pii:false, inferred:true, confidence:0.83 },
        { name:"signed_by",       type:"string[]", required:true,  indexed:false, pii:true,  inferred:true, confidence:0.86 }
      ]);
      setPkField("contract_id");
      setParseStatus("done");
    }, 600);
  }

  var inp = { border:"1px solid var(--line)", borderRadius:7, padding:"11px 13px", fontSize:13, fontFamily:"inherit", color:"var(--ink)", background:"var(--panel)", outline:"none", boxSizing:"border-box", width:"100%", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(40,40,20,0.02)" };
  var lbl = { display:"block", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.6px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 };

  var stepNames = ["Identity", "Properties"];

  function NodePreview({ size }) {
    size = size || 36;
    var r = size/2 - 2;
    // Picked glyph (if any) renders inside the shape using the same colours as the body.
    var gDef = glyph ? glyphById(glyph) : null;
    var glyphScale = (r * 0.55) / 3.4;
    var glyphC = { fill: catDef.fill, stroke: catDef.color };
    var imgSize = r * 1.2;
    return (
      <span style={{ display:"inline-flex", position:"relative", width:size, height:size, alignItems:"center", justifyContent:"center" }}>
        <svg width={size} height={size} viewBox={"-"+(size/2)+" -"+(size/2)+" "+size+" "+size}>
          {shape === "agent" ? <polygon points={[0,1,2,3,4,5].map(function(i){ var a=(Math.PI/3)*i-Math.PI/2; return (r*Math.cos(a)).toFixed(1)+","+(r*Math.sin(a)).toFixed(1); }).join(" ")} fill={catDef.fill} stroke={catDef.color} strokeWidth="1.6"/>
           : shape === "source" ? <rect x={-r} y={-r} width={2*r} height={2*r} rx="2.5" fill={catDef.fill} stroke={catDef.color} strokeWidth="1.6"/>
           : <circle r={r} fill={catDef.fill} stroke={catDef.color} strokeWidth="1.6"/>}
          {!glyphImage && gDef && <g transform={"scale(" + glyphScale + ")"}>{gDef.render(glyphC)}</g>}
        </svg>
        {glyphImage && (
          <img src={glyphImage} alt="" style={{ position:"absolute", width:imgSize, height:imgSize, objectFit:"contain" }} />
        )}
      </span>
    );
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.42)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"92vw", maxWidth:1180, height:"94vh", background:"var(--bg-canvas)", borderRadius:12, border:"1px solid var(--line)", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.32)" }}>

        {/* HEADER */}
        <div style={{ flexShrink:0, height:56, borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", background:"var(--panel)" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <NodePreview size={22} />
              <span style={{ fontFamily:"Instrument Serif", fontSize:20, color:"var(--ink)" }}>{name || "Untitled node"}</span>
              {category && <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"2px 7px", borderRadius:4, background:catDef.fill, color:catDef.color, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase" }}>{catDef.label}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:15, color:"var(--ink-3)" }}>✕</button>
        </div>

        <div style={{ flex:1, display:"grid", gridTemplateColumns:"240px minmax(0, 1fr)", minHeight:0 }}>

          {/* SIDEBAR */}
          <div style={{ background:"var(--panel-2)", borderRight:"1px solid var(--line)", padding:"20px 14px", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
            {stepNames.map(function(nm, i) {
              var n = i + 1;
              var isOn = step === n;
              var isDone = step > n;
              var sub = n === 1 ? (name || "Name & category")
                      : n === 2 ? (properties.length + " " + (properties.length === 1 ? "field" : "fields") + (propMode && propMode !== "manual" ? " · " + propMode : ""))
                      : (activate ? "Activate" : "Draft");
              return (
                <button key={n} onClick={function(){ if (n < step || canContinue()) setStep(n); }}
                  style={{ display:"flex", gap:12, padding:"10px 12px", borderRadius:7, border: isOn ? "1px solid var(--line)" : "1px solid transparent", background: isOn ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", alignItems:"center" }}>
                  <span style={{ width:28, height:28, borderRadius:"50%", border:"1px solid " + (isDone ? "var(--green)" : isOn ? "var(--ink)" : "var(--line)"), background: isDone ? "var(--green)" : isOn ? "var(--ink)" : "var(--bg-canvas)", color: isDone || isOn ? "var(--bg-canvas)" : "var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize: 12, fontWeight:700, flexShrink:0, lineHeight:1 }}>{isDone ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg> : n}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, color:"var(--ink)", fontWeight: isOn ? 500 : 400, lineHeight:1.2 }}>{nm}</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER */}
          <div style={{ padding:"24px 32px 28px", overflowY:"auto" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.8px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:5 }}>{"STEP " + step + " / 2"}</div>
              <div style={{ fontFamily:"Instrument Serif", fontSize:26, color:"var(--ink)", lineHeight:1.1, marginBottom:8 }}>{stepNames[step-1]}</div>
              <div style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.55, maxWidth:680 }}>
                {step === 1 && "Name the node type and pick its category. Use a singular capitalised noun — Account, Contract, Ticket."}
                {step === 2 && "Define the properties this node carries. You can enter them by hand, upload a spreadsheet to auto-detect columns, parse a sample document, or start from a template."}
                {step === 3 && "Review the full schema. Activate immediately or save as a draft pending approval. Edges to other node types can be drawn later on the canvas."}
              </div>
            </div>

            {/* ── STEP 1: Identity ── */}
            {step === 1 && (function(){
              var sel = NODE_CATEGORIES_CONFIG.find(function(c){ return c.id === category; });
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                  {/* Icon + Name as one composable row. The icon picker on the left
                      lets users choose the glyph that shows up next to the node name
                      in the Nodes list and on the canvas. */}
                  <div>
                    <label style={lbl}>ICON & NAME</label>
                    <div style={{ display:"flex", gap:8, alignItems:"stretch", position:"relative" }}>
                      {(function(){
                        // Picker preview uses neutral colors regardless of node type — the
                        // user only picks the glyph shape here; the actual node colour
                        // comes from its category later.
                        var previewC = { fill: "var(--panel-2)", stroke: "var(--ink-3)" };
                        var gDef = glyph ? glyphById(glyph) : null;
                        return (
                          <div style={{ position:"relative" }}>
                            <button type="button" onClick={function(){ setGlyphOpen(function(o){ return !o; }); }}
                              style={{ width:48, height:48, alignSelf:"center", borderRadius:"50%", border:"1px solid var(--line)", background:"var(--panel)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)", outline:"none" }}
                              aria-label="Pick icon">
                              {glyphImage ? (
                                <img src={glyphImage} alt="" style={{ width:28, height:28, objectFit:"contain", borderRadius:"50%" }} />
                              ) : gDef ? (
                                // Picked glyph renders at the same light ink-4 stroke as the
                                // placeholder — the trigger is a quiet preview, not a badge.
                                <svg width="32" height="32" viewBox="-5 -5 10 10">
                                  {gDef.render({ fill: "none", stroke: "var(--ink-4)" })}
                                </svg>
                              ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.4" strokeLinecap="round">
                                  <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                                  <line x1="12" y1="9" x2="12" y2="15" />
                                  <line x1="9" y1="12" x2="15" y2="12" />
                                </svg>
                              )}
                            </button>
                            {glyphOpen && (
                              <>
                                <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setGlyphOpen(false); }} />
                                <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:12, width:588 }}>
                                  {/* Search — type to filter by name or aliases */}
                                  <div style={{ position:"relative", marginBottom:8 }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.8" strokeLinecap="round" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                                      <circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/>
                                    </svg>
                                    <input
                                      autoFocus
                                      value={glyphQuery}
                                      onChange={function(e){ setGlyphQuery(e.target.value); }}
                                      placeholder="Search"
                                      style={{ width:"100%", padding:"6px 10px 6px 26px", fontSize:11.5, fontFamily:"JetBrains Mono", border:"1px solid var(--line)", borderRadius:6, background:"var(--bg-canvas)", color:"var(--ink-2)", outline:"none", boxSizing:"border-box" }}
                                    />
                                  </div>
                                  {(function(){
                                    var q = glyphQuery.trim().toLowerCase();
                                    var filtered = q ? NODE_GLYPHS.filter(function(g){
                                      return g.label.toLowerCase().indexOf(q) >= 0 || (g.aliases || "").toLowerCase().indexOf(q) >= 0;
                                    }) : NODE_GLYPHS;
                                    // Placeholder (clears icon) is always shown first.
                                    var slots = [{ id: null, label: "No icon", placeholder: true }].concat(filtered);
                                    if (slots.length === 1 && q) {
                                      return <div style={{ padding:"24px 8px", textAlign:"center", color:"var(--ink-4)", fontFamily:"JetBrains Mono", fontSize:11 }}>No icons match "{glyphQuery}"</div>;
                                    }
                                    return (
                                      <div style={{ display:"grid", gridTemplateColumns:"repeat(13, 40px)", gap:4, justifyContent:"start" }}>
                                        {slots.map(function(gOpt){
                                          var isSel = glyph === gOpt.id || (gOpt.placeholder && glyph === null);
                                          function onClick(){ setGlyph(gOpt.id); setGlyphOpen(false); setGlyphQuery(""); }
                                          return (
                                            <button key={gOpt.id || "none"} type="button" onClick={onClick} title={gOpt.label}
                                              style={{ width:40, height:40, borderRadius:8, border:"1px solid " + (isSel ? "var(--ink-3)" : "var(--line-2)"), background: isSel ? "var(--bg-canvas)" : "var(--panel)", cursor:"pointer", padding:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"background 120ms ease-out, border-color 120ms ease-out" }}
                                              onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                                              onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel)"; }}>
                                              {gOpt.placeholder ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.3" strokeLinecap="round">
                                                  <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                                                  <line x1="12" y1="9" x2="12" y2="15" />
                                                  <line x1="9" y1="12" x2="15" y2="12" />
                                                </svg>
                                              ) : (
                                                /* Same 32px svg + same -5..5 viewBox as the trigger button — glyphs render
                                                   identically inside the tile and the trigger circle. */
                                                <svg width="32" height="32" viewBox="-5 -5 10 10" style={{ display:"block" }}>
                                                  {gOpt.render({ fill: "none", stroke: "var(--ink-4)" })}
                                                </svg>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                      <input value={name} onChange={function(e){ setName(e.target.value); }} placeholder="e.g. Contract" style={Object.assign({}, inp, { flex:1 })} />
                    </div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color: name && !nameOk ? "var(--coral)" : "var(--ink-4)", marginTop:6 }}>
                      {name && !nameOk ? "Must start with a capital letter and be ≥ 2 chars" : "Singular noun. Will appear in :Cypher patterns and the catalog."}
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>DESCRIPTION <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400, textTransform:"none", letterSpacing:0 }}>optional</span></label>
                    <textarea value={description} onChange={function(e){ setDescription(e.target.value); }} rows={3} placeholder="What does this node represent? When is a new instance created?" style={Object.assign({}, inp, { resize:"vertical", lineHeight:1.55 })} />
                  </div>

                  <div>
                    <label style={lbl}>CATEGORY</label>
                    <div style={{ position:"relative" }}>
                      <button onClick={function(){ setCatOpen(function(o){ return !o; }); }}
                        style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                        {sel ? (
                          <>
                            <span style={{ width:34, height:34, borderRadius:7, background:sel.fill, color:sel.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <span style={{ width:10, height:10, borderRadius:"50%", background:sel.color }} />
                            </span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{sel.label}</div>
                              <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sel.desc}</div>
                            </div>
                            <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                          </>
                        ) : (
                          <>
                            <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:14, color:"var(--ink-3)" }}>Pick a category</div>
                              <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Click to choose</div>
                            </div>
                            <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                          </>
                        )}
                      </button>
                      {catOpen && (
                        <>
                          <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setCatOpen(false); }} />
                          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:380, overflowY:"auto" }}>
                            {NODE_CATEGORIES_CONFIG.map(function(o, i){
                              var isSel = category === o.id;
                              return (
                                <button key={o.id} onClick={function(){ setCategory(o.id); setCatOpen(false); }}
                                  style={{ display:"flex", alignItems:"flex-start", gap:12, width:"100%", padding:"10px 12px", borderRadius:7, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < NODE_CATEGORIES_CONFIG.length-1 ? 2 : 0 }}
                                  onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                                  onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                  <span style={{ width:32, height:32, borderRadius:6, background:o.fill, color:o.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                                    <span style={{ width:9, height:9, borderRadius:"50%", background:o.color }} />
                                  </span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{o.label}</div>
                                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{o.desc}</div>
                                  </div>
                                  {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 2: Properties ── */}
            {step === 2 && (function(){
              var PROP_MODES = [
                { id:"template",    label:"From template",    color:"var(--blue)",   desc:"Start with a pre-built schema from the catalog (Contract, Customer, Ticket and more).",
                  icon:(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>) },
                { id:"sample",      label:"Parse a document", color:"var(--purple)", desc:"Upload a sample (PDF, DOCX, TXT). An LLM infers the schema and you review the fields.",
                  icon:(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3 H7 a2 2 0 0 0 -2 2 v14 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2 -2 V8 z"/><polyline points="14 3 14 8 19 8"/><path d="M12 13 L13 15 L15 16 L13 17 L12 19 L11 17 L9 16 L11 15 z"/></svg>) },
                { id:"spreadsheet", label:"From spreadsheet", color:"var(--green)",  desc:"Drop a CSV or Excel file. We auto-detect columns and their types as your property list.",
                  icon:(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="1.5"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/></svg>) },
                { id:"manual",      label:"Define manually",  color:"var(--coral)",  desc:"Type each field by hand. Best when you know the exact shape you want.",
                  icon:(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4 L20 8 L9 19 L4 20 L5 15 z"/><line x1="14" y1="6" x2="18" y2="10"/></svg>) },
                { id:"skip",        label:"Skip for now",     color:"var(--ink-3)",  desc:"Create the node without properties — add them later from the node page.",
                  icon:(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>) }
              ];
              var selectedMode = PROP_MODES.find(function(m){ return m.id === propMode; });
              return (
              <div style={{ display:"flex", flexDirection:"column", gap:18, maxWidth:960 }}>
                {/* Mode picker — rich dropdown, same shape as Industry / Department */}
                <div>
                  <label style={lbl}>HOW DO YOU WANT TO DEFINE PROPERTIES?</label>
                  <div style={{ position:"relative" }}>
                    <button onClick={function(){ setPropModeOpen(function(o){ return !o; }); }}
                      style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                      {selectedMode ? (
                        <>
                          <span style={{ width:34, height:34, borderRadius:7, background:"color-mix(in oklab, " + selectedMode.color + " 16%, transparent)", color:selectedMode.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{selectedMode.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{selectedMode.label}</div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{selectedMode.desc}</div>
                          </div>
                          <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                        </>
                      ) : (
                        <>
                          <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, color:"var(--ink-3)" }}>Pick a method</div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Click to choose</div>
                          </div>
                          <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                        </>
                      )}
                    </button>
                    {propModeOpen && (
                      <>
                        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setPropModeOpen(false); }} />
                        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:420, overflowY:"auto" }}>
                          {PROP_MODES.map(function(o, i){
                            var isSel = propMode === o.id;
                            return (
                              <button key={o.id} onClick={function(){ setPropMode(o.id); setPropModeOpen(false); if (o.id === "skip") { setProperties([]); setUploadedFileName(""); } }}
                                style={{ display:"flex", alignItems:"flex-start", gap:12, width:"100%", padding:"10px 12px", borderRadius:7, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < PROP_MODES.length-1 ? 2 : 0 }}
                                onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                                onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                <span style={{ width:32, height:32, borderRadius:6, background:o.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{o.icon}</span>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{o.label}</div>
                                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{o.desc}</div>
                                </div>
                                {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* TEMPLATE MODE — custom rich dropdown */}
                {propMode === "template" && (function(){
                  var selT = NODE_TEMPLATES.find(function(t){ return t.id === selectedTemplate; });
                  return (
                    <div>
                      <label style={lbl}>TEMPLATE</label>
                      <div style={{ position:"relative" }}>
                        <button ref={templateBtnRef} onClick={function(){ setTemplatePickerOpen(function(o){ return !o; }); }}
                          style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                          {selT ? (
                            <>
                              <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px solid var(--line-2)", color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{templateGlyphSvg(selT, 19)}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{selT.name}</div>
                                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{selT.brief}</div>
                              </div>
                              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 7px", borderRadius:4, background:"var(--green-fill)", color:"var(--green)", fontWeight:700, letterSpacing:"0.4px" }}>{selT.properties.length + " FIELDS"}</span>
                              <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                            </>
                          ) : (
                            <>
                              <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:14, color:"var(--ink-3)" }}>Pick a template</div>
                                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Start with a curated schema</div>
                              </div>
                              <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                            </>
                          )}
                        </button>
                        {templatePickerOpen && (function(){
                          var q = templateQuery.trim().toLowerCase();
                          var matchQ = function(t){
                            return !q || t.name.toLowerCase().indexOf(q) >= 0
                              || t.brief.toLowerCase().indexOf(q) >= 0
                              || (t.department || "").indexOf(q) >= 0
                              || t.properties.some(function(p){ return p.name.indexOf(q) >= 0; });
                          };
                          var qMatches = NODE_TEMPLATES.filter(matchQ);
                          // When searching, results span all categories; otherwise the active category drives the right pane.
                          var leftActive = q ? "all" : templateCat;
                          var rightItems = q ? qMatches : (templateCat === "all" ? NODE_TEMPLATES : NODE_TEMPLATES.filter(function(t){ return t.department === templateCat; }));
                          var deptById = function(id){ return NODE_TEMPLATE_DEPARTMENTS.find(function(d){ return d.id === id; }); };
                          var catCount = function(id){ var base = q ? qMatches : NODE_TEMPLATES; return id === "all" ? base.length : base.filter(function(t){ return t.department === id; }).length; };
                          // Split the left nav into functional departments vs. industry verticals.
                          var INDUSTRY_DEPTS = { healthcare:true, "financial-svc":true };
                          var visibleDepts = NODE_TEMPLATE_DEPARTMENTS.filter(function(d){ return !q || catCount(d.id) > 0; });
                          var funcDepts = visibleDepts.filter(function(d){ return !INDUSTRY_DEPTS[d.id]; });
                          var industryDepts = visibleDepts.filter(function(d){ return INDUSTRY_DEPTS[d.id]; });
                          // Anchor with fixed positioning so the panel escapes the modal clip and is
                          // height-capped to never tuck behind the modal footer. Opens up if there's
                          // more room above the trigger.
                          var rect = templateBtnRef.current ? templateBtnRef.current.getBoundingClientRect() : null;
                          var GAP = 6, FOOTER_SAFE = 120, TOP_SAFE = 16;
                          var pos;
                          if (rect) {
                            var spaceBelow = window.innerHeight - rect.bottom - FOOTER_SAFE;
                            var spaceAbove = rect.top - TOP_SAFE;
                            var openUp = spaceBelow < 300 && spaceAbove > spaceBelow;
                            // Fixed height (not max) so the panel doesn't shrink when few/no results match.
                            var maxH = Math.max(260, Math.min(560, (openUp ? spaceAbove : spaceBelow) - GAP));
                            pos = { position:"fixed", left:rect.left, width:rect.width, top: openUp ? Math.max(TOP_SAFE, rect.top - GAP - maxH) : rect.bottom + GAP, height:maxH, zIndex:1000 };
                          } else {
                            pos = { position:"absolute", top:"calc(100% + 6px)", left:0, right:0, height:540, zIndex:1000 };
                          }
                          return (
                          <>
                            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999 }} onClick={function(){ setTemplatePickerOpen(false); }} />
                            <div style={Object.assign({ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", display:"flex", flexDirection:"column", overflow:"hidden" }, pos)}>
                              {/* GLOBAL SEARCH HEADER */}
                              <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--line-2)", background:"var(--panel-2)" }}>
                                <div style={{ position:"relative" }}>
                                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                                    <circle cx="6.5" cy="6.5" r="4.5" />
                                    <line x1="10" y1="10" x2="14" y2="14" />
                                  </svg>
                                  <input type="text" value={templateQuery} onChange={function(e){ setTemplateQuery(e.target.value); }} placeholder="Search…" autoFocus
                                    style={{ width:"100%", padding:"7px 11px 7px 28px", fontSize:12.5, fontFamily:"inherit", color:"var(--ink)", background:"var(--panel)", border:"1px solid var(--line)", borderRadius:6, outline:"none", boxSizing:"border-box" }} />
                                </div>
                              </div>
                              {/* TWO-PANE BODY */}
                              <div style={{ flex:1, display:"flex", minHeight:0 }}>
                                {/* LEFT — CATEGORIES (All · Departments · Industry) */}
                                {(function(){
                                  function catBtn(d){
                                    var on = leftActive === d.id;
                                    var cnt = catCount(d.id);
                                    return (
                                      <button key={d.id} onClick={function(){ setTemplateCat(d.id); setTemplateQuery(""); }}
                                        style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"8px 14px", border:"none", borderLeft:"2px solid " + (on ? "var(--ink)" : "transparent"), background: on ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                                        onMouseEnter={function(e){ if (!on) e.currentTarget.style.background = "var(--panel)"; }}
                                        onMouseLeave={function(e){ if (!on) e.currentTarget.style.background = "transparent"; }}>
                                        <span style={{ flex:1, minWidth:0, fontSize:12.5, fontWeight: on ? 600 : 500, color: on ? "var(--ink)" : "var(--ink-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.label}</span>
                                        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:600, color: on ? "var(--ink-2)" : "var(--ink-4)", flexShrink:0 }}>{cnt}</span>
                                      </button>
                                    );
                                  }
                                  var hdr = { padding:"12px 14px 4px", fontFamily:"JetBrains Mono", fontSize:8.5, letterSpacing:"0.9px", textTransform:"uppercase", color:"var(--ink-4)", fontWeight:600 };
                                  return (
                                    <div style={{ width:212, flexShrink:0, borderRight:"1px solid var(--line-2)", background:"var(--panel-2)", overflowY:"auto", padding:"6px 0" }}>
                                      {catBtn({ id:"all", label:"All templates" })}
                                      {funcDepts.length > 0 && <div style={hdr}>Departments</div>}
                                      {funcDepts.map(catBtn)}
                                      {industryDepts.length > 0 && <div style={hdr}>Industry</div>}
                                      {industryDepts.map(catBtn)}
                                    </div>
                                  );
                                })()}
                                {/* RIGHT — TEMPLATES WITH FIELDS */}
                                <div style={{ flex:1, minWidth:0, overflowY:"auto", padding:"6px 0", display:"flex", flexDirection:"column" }}>
                                  {rightItems.map(function(t){
                                    var isSel = selectedTemplate === t.id;
                                    var dept = deptById(t.department) || { color:"var(--ink-3)" };
                                    var fieldNames = t.properties.map(function(p){ return p.name; });
                                    var shown = fieldNames.slice(0, 6);
                                    return (
                                      <button key={t.id} onClick={function(){ applyTemplate(t.id); setTemplatePickerOpen(false); setTemplateQuery(""); }}
                                        style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"11px 16px", border:"none", borderBottom:"1px solid var(--line-2)", background: isSel ? "var(--bg-canvas)" : "transparent", boxShadow: isSel ? "inset 3px 0 0 var(--ink)" : "none", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                                        onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                                        onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                        <span style={{ width:30, height:30, borderRadius:6, background:"var(--chip)", border:"1px solid var(--line-2)", color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, alignSelf:"flex-start" }}>{templateGlyphSvg(t, 17)}</span>
                                        <div style={{ flex:1, minWidth:0 }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                            <span style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{t.name}</span>
                                            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"1.5px 6px", borderRadius:3, background:"var(--chip)", color:"var(--ink-3)", fontWeight:600, letterSpacing:"0.3px" }}>{t.properties.length + " FIELDS"}</span>
                                          </div>
                                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{t.brief}</div>
                                          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:7 }}>
                                            {shown.map(function(fn){ return (
                                              <span key={fn} style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"1.5px 6px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)", border:"1px solid var(--line-2)" }}>{fn}</span>
                                            ); })}
                                            {fieldNames.length > shown.length && (
                                              <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"1.5px 6px", borderRadius:4, color:"var(--ink-4)" }}>{"+" + (fieldNames.length - shown.length) + " more"}</span>
                                            )}
                                          </div>
                                        </div>
                                        {/* Circular selection indicator */}
                                        <span style={{ flexShrink:0, width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: isSel ? "var(--ink)" : "transparent", border: "1.5px solid " + (isSel ? "var(--ink)" : "var(--line)"), color:"var(--bg-canvas)" }}>
                                          {isSel && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg>}
                                        </span>
                                      </button>
                                    );
                                  })}
                                  {rightItems.length === 0 && (
                                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"24px" }}>
                                      <span style={{ width:46, height:46, borderRadius:"50%", background:"var(--chip)", border:"1px solid var(--line-2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, color:"var(--ink-4)" }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                      </span>
                                      <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink-2)" }}>No matches for “{templateQuery}”</div>
                                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:5, maxWidth:230, lineHeight:1.55 }}>Try a department, field, or entity name.</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* FOOTER */}
                              <div style={{ padding:"8px 12px", borderTop:"1px solid var(--line-2)", background:"var(--panel-2)", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)" }}>
                                <span>{rightItems.length + (q ? " matching" : (leftActive === "all" ? "" : " in " + ((deptById(leftActive) || {}).label || ""))) + " · " + NODE_TEMPLATES.length + " templates across " + NODE_TEMPLATE_DEPARTMENTS.length + " departments"}</span>
                                <button onClick={function(){ setTemplatePickerOpen(false); setTemplateQuery(""); }} className="btn-ghost" style={{ fontSize:11 }}>Done</button>
                              </div>
                            </div>
                          </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* SAMPLE PARSE MODE */}
                {propMode === "sample" && (
                  <div>
                    <label style={lbl}>UPLOAD A SAMPLE DOCUMENT</label>
                    {!uploadedFileName ? (
                      <div onClick={simulateParse}
                        style={{ border:"2px dashed var(--line)", borderRadius:10, padding:"36px 20px", textAlign:"center", cursor:"pointer", background:"var(--panel)" }}>
                        <div style={{ width:42, height:42, borderRadius:10, background:"var(--chip)", color:"var(--ink-2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:18, fontWeight:700, margin:"0 auto 10px" }}>D</div>
                        <div style={{ fontSize:14, color:"var(--ink)", fontWeight:500, marginBottom:5 }}>Drop a sample document or click to upload</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", lineHeight:1.6 }}>PDF, DOCX, TXT · max 10MB · we'll use an LLM to infer the schema</div>
                      </div>
                    ) : parseStatus === "parsing" ? (
                      <div style={{ padding:"24px", border:"1px solid var(--line)", borderRadius:10, background:"var(--panel)", textAlign:"center" }}>
                        <div style={{ fontSize:14, color:"var(--ink)" }}>Parsing <code style={{ fontFamily:"JetBrains Mono" }}>{uploadedFileName}</code> with {parseModel}…</div>
                      </div>
                    ) : (
                      <div style={{ padding:"14px 16px", border:"1px solid var(--green-soft)", borderRadius:10, background:"var(--green-fill)", display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>✓</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>Parsed <code style={{ fontFamily:"JetBrains Mono", fontSize:11 }}>{uploadedFileName}</code></div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--green)", marginTop:3 }}>{properties.length + " fields inferred · review and edit below"}</div>
                        </div>
                        <button onClick={function(){ setUploadedFileName(""); setParseStatus("idle"); setProperties([]); }} style={{ background:"none", border:"none", color:"var(--green)", cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:11, textDecoration:"underline" }}>upload another</button>
                      </div>
                    )}
                    {!uploadedFileName && (
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
                        <label style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)" }}>MODEL</label>
                        <select value={parseModel} onChange={function(e){ setParseModel(e.target.value); }} style={Object.assign({}, inp, { maxWidth:260, padding:"5px 8px", fontSize:12 })}>
                          <option value="claude-3.5-sonnet">Claude 3.5 Sonnet · best quality</option>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* SPREADSHEET MODE */}
                {propMode === "spreadsheet" && (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <label style={Object.assign({}, lbl, { marginBottom:0 })}>UPLOAD A SPREADSHEET</label>
                      <button onClick={function(){
                        var csv = "field_name,type,required,indexed,pii,description\n" +
                                  "id,uuid,true,true,false,Primary identifier\n" +
                                  "name,string,true,true,false,Display name\n" +
                                  "email,string,true,false,true,Primary contact email\n" +
                                  "status,enum,false,false,false,Status code (active|inactive)\n" +
                                  "created_at,datetime,true,true,false,Record creation timestamp\n" +
                                  "amount,decimal,false,false,false,Monetary amount\n";
                        var blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement("a");
                        a.href = url; a.download = "node-property-template.csv";
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        setTimeout(function(){ URL.revokeObjectURL(url); }, 100);
                      }} className="btn-ghost" style={{ fontSize:11, display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px" }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 V11" /><polyline points="5 8 8 11 11 8" /><line x1="3" y1="14" x2="13" y2="14" /></svg>
                        Download template
                      </button>
                    </div>
                    {!uploadedFileName ? (
                      <div onClick={simulateUpload}
                        style={{ border:"2px dashed var(--line)", borderRadius:10, padding:"36px 20px", textAlign:"center", cursor:"pointer", background:"var(--panel)" }}>
                        <div style={{ width:42, height:42, borderRadius:10, background:"var(--green-fill)", color:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="1.5"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/></svg>
                        </div>
                        <div style={{ fontSize:14, color:"var(--ink)", fontWeight:500, marginBottom:5 }}>Drop a CSV or Excel file</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", lineHeight:1.6 }}>We'll read the header row and a sample of values to auto-detect types</div>
                      </div>
                    ) : (
                      <div style={{ padding:"14px 16px", border:"1px solid var(--green-soft)", borderRadius:10, background:"var(--green-fill)", display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>✓</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>Read <code style={{ fontFamily:"JetBrains Mono", fontSize:11 }}>{uploadedFileName}</code></div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--green)", marginTop:3 }}>{properties.length + " columns detected · types inferred from sample"}</div>
                        </div>
                        <button onClick={function(){ setUploadedFileName(""); setProperties([]); }} style={{ background:"none", border:"none", color:"var(--green)", cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:11, textDecoration:"underline" }}>upload another</button>
                      </div>
                    )}
                  </div>
                )}

                {/* SKIP MODE — no fields now, add later */}
                {propMode === "skip" && (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"16px 18px", borderRadius:10, border:"1px dashed var(--line)", background:"var(--panel-2)" }}>
                    <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                    </span>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>No properties for now</div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", marginTop:3, lineHeight:1.5 }}>The node will be created empty. You can add properties anytime from its Properties tab.</div>
                    </div>
                  </div>
                )}

                {/* SHARED PROPERTIES TABLE — prominent card, stands out from background */}
                {((properties.length > 0 || propMode === "manual") && propMode !== "skip") && (
                  <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 1px 0 var(--line-2), 0 4px 14px rgba(40,40,20,0.04)", overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid var(--line-2)", background:"var(--panel-2)" }}>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{propMode === "manual" ? "Properties" : "Review & edit fields"}</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3 }}>{properties.length + " " + (properties.length === 1 ? "field" : "fields") + (pkField ? " · PK: " + pkField : " · no PK yet")}</div>
                      </div>
                      <button onClick={addManualProp} className="btn-ghost" style={{ fontSize:12 }}>+ Add field</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1.7fr 150px 40px 40px 40px 40px 24px 32px", gap:8, padding:"9px 18px", background:"var(--panel-2)", borderBottom:"1px solid var(--line-2)", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase" }}>
                      <div>Name</div><div>Type</div><div title="Primary key" style={{ textAlign:"center" }}>PK</div><div title="Required" style={{ textAlign:"center" }}>REQ</div><div title="Indexed" style={{ textAlign:"center" }}>IDX</div><div title="PII" style={{ textAlign:"center" }}>PII</div><div/><div/>
                    </div>
                    {properties.length === 0 && (
                      <div style={{ padding:"50px 18px", textAlign:"center", color:"var(--ink-3)", fontSize:13 }}>
                        No fields yet. Click <b>+ Add field</b> to start.
                      </div>
                    )}
                    {properties.map(function(p, i) { return renderPropRow(p, [i], 0); })}
                  </div>
                )}
              </div>
              );
            })()}

            {/* ── STEP 3: Governance ── */}
            {false && step === 99 && (function(){
              // Governance step removed from Add Node flow — collapsed to Identity → Properties → Review.
              // Owner, retention, tags, and permissions are configured later from the node-detail page.
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:820 }}>
                  {/* OWNER + RETENTION row */}
                  <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14 }}>
                    <div>
                      <label style={lbl}>OWNER</label>
                      <select value={owner} onChange={function(e){ setOwner(e.target.value); }} style={inp}>
                        <option value={CURRENT_USER.id}>{CURRENT_USER.label + " (you · " + CURRENT_USER.team + ")"}</option>
                        {DIRECTORY.filter(function(d){ return d.kind === "user" && d.id !== CURRENT_USER.id; }).map(function(d){ return <option key={d.id} value={d.id}>{d.label}</option>; })}
                      </select>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6 }}>The owner is the single point of accountability for this node type.</div>
                    </div>
                    <div>
                      <label style={lbl}>RETENTION POLICY</label>
                      <select value={retentionPolicy} onChange={function(e){ setRetentionPolicy(e.target.value); }} style={inp}>
                        <option value="forever">Keep forever</option>
                        <option value="7y">7 years</option>
                        <option value="3y">3 years</option>
                        <option value="1y">1 year</option>
                        <option value="90d">90 days</option>
                      </select>
                    </div>
                  </div>

                  {/* TAGS — open multi-select with grouped suggestions */}
                  <div style={{ position:"relative" }}>
                    <label style={lbl}>TAGS</label>
                    <button onClick={function(){ setTagsDropOpen(function(o){ return !o; }); }}
                      style={Object.assign({}, inp, { display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", textAlign:"left", padding:"9px 12px", minHeight:42 })}>
                      <span style={{ display:"flex", flexWrap:"wrap", gap:5, flex:1, alignItems:"center" }}>
                        {complianceTags.length === 0 && <span style={{ color:"var(--ink-4)", fontSize:13 }}>Add tags — compliance, domain, lifecycle…</span>}
                        {complianceTags.map(function(t){
                          var tone = /SOC|GDPR|HIPAA|ISO|CCPA|PCI/.test(t) ? { bg:"var(--coral-fill)", fg:"var(--coral)" }
                                   : /CORE|SHARED|GOLDEN|DRAFT|DEPRECATED/.test(t) ? { bg:"var(--gold-fill)", fg:"var(--gold)" }
                                   : { bg:"var(--blue-fill)", fg:"var(--blue)" };
                          return (
                            <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:"JetBrains Mono", fontSize:10.5, padding:"3px 5px 3px 8px", borderRadius:4, background:tone.bg, color:tone.fg, fontWeight:600, letterSpacing:"0.3px" }}>
                              {t}
                              <button onClick={function(e){ e.stopPropagation(); setComplianceTags(function(arr){ return arr.filter(function(x){ return x !== t; }); }); }} style={{ background:"none", border:"none", color:"currentColor", cursor:"pointer", padding:0, fontSize:12, lineHeight:1, opacity:0.6 }}>×</button>
                            </span>
                          );
                        })}
                      </span>
                      <span style={{ color:"var(--ink-3)", marginLeft:8, fontFamily:"JetBrains Mono", fontSize:11 }}>▾</span>
                    </button>
                    {tagsDropOpen && (
                      <>
                        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setTagsDropOpen(false); }} />
                        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:380, overflowY:"auto" }}>
                          {[
                            { group:"Compliance", tone:{ bg:"var(--coral-fill)", fg:"var(--coral)" }, items:["SOC2","GDPR","HIPAA","ISO27001","CCPA","PCI-DSS"] },
                            { group:"Domain",     tone:{ bg:"var(--blue-fill)",  fg:"var(--blue)"  }, items:["Customer","Finance","Product","Sales","Support","Marketing","HR"] },
                            { group:"Lifecycle",  tone:{ bg:"var(--gold-fill)",  fg:"var(--gold)"  }, items:["Core","Shared","Golden record","Draft","Deprecated"] }
                          ].map(function(grp){
                            return (
                              <div key={grp.group} style={{ marginBottom:4 }}>
                                <div style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"6px 10px 4px", color:"var(--ink-4)", letterSpacing:"0.7px", textTransform:"uppercase" }}>{grp.group}</div>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"0 8px 6px" }}>
                                  {grp.items.map(function(t){
                                    var isOn = complianceTags.indexOf(t) >= 0;
                                    return (
                                      <button key={t} onClick={function(){
                                        setComplianceTags(function(arr){ return isOn ? arr.filter(function(x){ return x !== t; }) : arr.concat([t]); });
                                      }} style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:"JetBrains Mono", fontSize:10.5, padding:"4px 8px", borderRadius:4, background: isOn ? grp.tone.bg : "transparent", color: isOn ? grp.tone.fg : "var(--ink-2)", border:"1px solid " + (isOn ? grp.tone.fg + "55" : "var(--line)"), fontWeight: isOn ? 700 : 500, cursor:"pointer", letterSpacing:"0.3px" }}>
                                        {isOn && <span style={{ fontWeight:700 }}>✓</span>}
                                        {t}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6, lineHeight:1.5 }}>Surface this node for the right audience — compliance frameworks, business domain, lifecycle stage.</div>
                  </div>

                  {/* PERMISSIONS */}
                  <div>
                    <label style={lbl}>WHO CAN ACCESS THIS NODE?</label>
                    <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 1px 0 var(--line-2), 0 4px 14px rgba(40,40,20,0.04)", overflow:"hidden" }}>
                      <PermRow k="read"  label="Read"  list={permsRead}  setList={setPermsRead}  tone={{ bg:"var(--blue-fill)",   fg:"var(--blue)"   }} desc="Can query records and view the schema." />
                      <PermRow k="write" label="Write" list={permsWrite} setList={setPermsWrite} tone={{ bg:"var(--green-fill)",  fg:"var(--green)"  }} desc="Can create, update, or delete records of this type." />
                      <PermRow k="admin" label="Admin" list={permsAdmin} setList={setPermsAdmin} tone={{ bg:"var(--coral-fill)",  fg:"var(--coral)"  }} desc="Can edit the schema, add rules, and manage permissions." />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 3: Review — comprehensive, dashed summary rows like enterprise tools ── */}
            {step === 3 && (
              <div style={{ display:"flex", flexDirection:"column", gap:22, maxWidth:880 }}>
                {/* SUMMARY CARD — dashed-row table */}
                <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 1px 0 var(--line-2), 0 4px 14px rgba(40,40,20,0.04)", overflow:"hidden" }}>
                  <div className="card-head card-head-row" style={{ background:"var(--panel-2)" }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>Summary</span>
                    <span className="card-head-sub">{(catDef.label || "—") + " · " + properties.length + " fields"}</span>
                  </div>
                  <div style={{ padding:"4px 0" }}>
                    {[
                      { k:"LABEL",       v: <span style={{ fontFamily:"JetBrains Mono", fontSize:11.5, padding:"3px 8px", background:"var(--chip)", borderRadius:5, color:"var(--ink)" }}>{":" + (name || "Untitled")}</span> },
                      { k:"KIND",        v: shape === "agent" ? "Agent" : shape === "source" ? "Source" : "Entity" },
                      { k:"CATEGORY",    v: catDef.label.toLowerCase() },
                      { k:"DESCRIPTION", v: description || <span style={{ color:"var(--ink-4)" }}>—</span> },
                      { k:"PRIMARY KEY", v: pkField ? <span><code style={{ fontFamily:"JetBrains Mono", color:"var(--ink)" }}>{pkField}</code> <span style={{ color:"var(--ink-4)", fontFamily:"JetBrains Mono", fontSize:10.5 }}>: {(properties.find(function(p){ return p.name === pkField; }) || {}).type || "uuid"}</span></span> : <span style={{ color:"var(--coral)" }}>not set</span> },
                      { k:"NATURAL KEYS", v: naturalKeys.length ? naturalKeys.map(function(n){ return <code key={n} style={{ fontFamily:"JetBrains Mono", fontSize:11, padding:"2px 7px", background:"var(--chip)", borderRadius:4, color:"var(--ink-2)", marginRight:5 }}>{n}</code>; }) : <span style={{ color:"var(--ink-4)" }}>none</span> },
                      { k:"PROPERTIES",  v: properties.length + " total · " + properties.filter(function(p){ return p.required; }).length + " required · " + properties.filter(function(p){ return p.indexed; }).length + " indexed · " + properties.filter(function(p){ return p.pii; }).length + " PII" },
                      { k:"DEDUP",       v: dedupStrategy.replace(/_/g," ") }
                    ].map(function(row, i, arr){
                      return (
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:16, padding:"10px 22px", borderBottom: i < arr.length-1 ? "1px dashed var(--line-2)" : "none", alignItems:"baseline" }}>
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase" }}>{row.k}</span>
                          <span style={{ fontSize:13, color:"var(--ink)", textAlign:"right" }}>{row.v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* INITIAL PROPERTIES CARD — full list */}
                {properties.length > 0 && (
                  <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 1px 0 var(--line-2), 0 4px 14px rgba(40,40,20,0.04)", overflow:"hidden" }}>
                    <div className="card-head card-head-row" style={{ background:"var(--panel-2)" }}>
                      <span style={{ fontSize:14, fontWeight:600 }}>Initial properties</span>
                      <span className="card-head-sub">{properties.length + " total"}</span>
                    </div>
                    <div>
                      {properties.map(function(p, i, arr) {
                        return (
                          <div key={p.name} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, padding:"9px 22px", borderBottom: i < arr.length-1 ? "1px dashed var(--line-2)" : "none", alignItems:"center" }}>
                            {/* Left: name + type */}
                            <div style={{ display:"flex", alignItems:"baseline", gap:10, minWidth:0 }}>
                              <code style={{ fontFamily:"JetBrains Mono", fontSize:12.5, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</code>
                              <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{p.type}</span>
                            </div>
                            {/* Right: pinned tags */}
                            <div style={{ display:"flex", alignItems:"center", gap:5, justifySelf:"end" }}>
                              {p.name === pkField && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"1px 5px", borderRadius:3, background:"var(--ink)", color:"var(--bg-canvas)", fontWeight:700 }}>PK</span>}
                              {p.required && p.name !== pkField && <span className="snap-tag" style={{ fontSize:9, padding:"1px 5px" }}>REQ</span>}
                              {p.indexed && <span className="snap-tag snap-idx" style={{ fontSize:9, padding:"1px 5px" }}>IDX</span>}
                              {p.pii && <span className="snap-tag snap-pii" style={{ fontSize:9, padding:"1px 5px" }}>PII</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ON SAVE selector */}
                <div>
                  <label style={lbl}>ON SAVE</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {[{ id:true, l:"Activate immediately" },{ id:false, l:"Save as draft" }].map(function(o){
                      var isOn = activate === o.id;
                      return <button key={String(o.id)} onClick={function(){ setActivate(o.id); }} style={{ padding:"9px 16px", border:"1px solid " + (isOn ? "var(--ink)" : "var(--line)"), borderRadius:7, background: isOn ? "var(--ink)" : "var(--panel)", color: isOn ? "var(--bg-canvas)" : "var(--ink-2)", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight: isOn ? 500 : 400 }}>{o.l}</button>;
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* FOOTER */}
        <div style={{ flexShrink:0, padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <button className="btn-ghost" onClick={function(){ if (step > 1) setStep(function(s){ return s - 1; }); }} disabled={step === 1} style={{ opacity: step === 1 ? 0.4 : 1 }}>← Back</button>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            {step < 2
              ? <button className="btn-dark" disabled={!canContinue()} onClick={function(){ setStep(function(s){ return s + 1; }); }} style={{ opacity: canContinue() ? 1 : 0.45 }}>Continue →</button>
              : <button className="btn-dark" disabled={!canContinue()} onClick={function(){ if (!canContinue()) return; if (onCreate) onCreate({ name: name, category: category, properties: properties, shape: shape, description: description, glyph: glyph, glyphImage: glyphImage }); onClose(); }} style={{ opacity: canContinue() ? 1 : 0.45 }}>{activate ? "Create node type ↵" : "Save draft ↵"}</button>
            }
          </div>
        </div>

      </div>

      {/* ADVANCED SETTINGS — popup-over-modal for a single property */}
      {advancedPropPath !== null && getByPath(advancedPropPath) && (function(){
        var p = getByPath(advancedPropPath);
        var i = advancedPropPath;
        var updateProp = function(_p, key, val){ updatePath(advancedPropPath, key, val); };
        var close = function(){ setAdvancedPropPath(null); };
        return (
          <div onClick={close} style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.32)", zIndex:260, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div onClick={function(e){ e.stopPropagation(); }} style={{ width:520, maxHeight:"82vh", display:"flex", flexDirection:"column", background:"var(--panel)", border:"1px solid var(--line)", borderRadius:12, boxShadow:"0 24px 60px rgba(0,0,0,0.25)", overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--line-2)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.7px", textTransform:"uppercase", marginBottom:4 }}>Advanced settings</div>
                  <div style={{ fontSize:14.5, color:"var(--ink)", fontWeight:500, fontFamily:"JetBrains Mono" }}>{p.name || "untitled"}</div>
                </div>
                <button onClick={close} style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--line)", background:"var(--panel-2)", color:"var(--ink-3)", cursor:"pointer", fontSize:14, lineHeight:1 }}>×</button>
              </div>

              <div style={{ padding:"18px 20px", overflowY:"auto", display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={Object.assign({}, lbl, { marginBottom:6 })}>NEST UNDER</label>
                  <select value={p.nestUnder || ""} onChange={function(e){ updateProp(i, "nestUnder", e.target.value); }} style={Object.assign({}, inp, { padding:"7px 10px", fontSize:12 })}>
                    <option value="">— top level —</option>
                    {properties.filter(function(other){ return other !== p && (other.type === "struct" || other.type === "object"); }).map(function(other){ return <option key={other.name} value={other.name}>{other.name}</option>; })}
                  </select>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-4)", marginTop:5, lineHeight:1.5 }}>Group this field inside a struct property.</div>
                </div>

                <div>
                  <label style={Object.assign({}, lbl, { marginBottom:6 })}>UNIQUE KEY</label>
                  <label style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"9px 11px", border:"1px solid " + (p.unique ? "var(--ink-2)" : "var(--line)"), borderRadius:7, background: p.unique ? "var(--bg-canvas)" : "var(--panel-2)", cursor:"pointer" }}>
                    <input type="checkbox" checked={p.unique || false} onChange={function(e){ updateProp(i, "unique", e.target.checked); }} style={{ accentColor:"var(--ink)", width:14, height:14, marginTop:2 }} />
                    <div>
                      <div style={{ fontSize:12.5, color:"var(--ink)", fontWeight:500 }}>Enforce unique values</div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", marginTop:2 }}>No two records may share this value.</div>
                    </div>
                  </label>
                </div>

                <div>
                  <label style={Object.assign({}, lbl, { marginBottom:6 })}>STORAGE &amp; INDEXING</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      { id:"hashing",  l:"Enable hashing",    d:"Hash the value before storing (one-way)." },
                      { id:"secure",   l:"Secure field",      d:"Encrypt at rest. Reads require an audit log entry." },
                      { id:"display",  l:"Display name",      d:"Surface this value in related records." },
                      { id:"search",   l:"Enable search",     d:"Index for free-text lookup." },
                      { id:"sort",     l:"Enable sorting",    d:"Allow records to sort by this field." },
                      { id:"filter",   l:"Enable filtering",  d:"Allow records to filter by this field." }
                    ].map(function(opt){
                      var on = !!p[opt.id];
                      return (
                        <label key={opt.id} style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"9px 11px", border:"1px solid " + (on ? "var(--ink-2)" : "var(--line)"), borderRadius:7, background: on ? "var(--bg-canvas)" : "var(--panel-2)", cursor:"pointer" }}>
                          <input type="checkbox" checked={on} onChange={function(e){ updateProp(i, opt.id, e.target.checked); }} style={{ accentColor:"var(--ink)", width:14, height:14, marginTop:2 }} />
                          <div>
                            <div style={{ fontSize:12.5, color:"var(--ink)", fontWeight:500 }}>{opt.l}</div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", marginTop:2 }}>{opt.d}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ padding:"12px 20px", borderTop:"1px solid var(--line-2)", display:"flex", justifyContent:"flex-end", background:"var(--panel-2)" }}>
                <button onClick={close} className="btn-dark" style={{ fontSize:12, padding:"7px 16px" }}>Done</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT GRAPHS LANDING — workspace-style picker of every graph in the org
// ═══════════════════════════════════════════════════════════════════════════════


// — NewEdgeFlow —
function NewEdgeFlow({ onClose, onCreate, fromNode, toNode, initialLabel, nodes: liveNodes }) {
  var [step, setStep]                 = useWizardStep("estep", 1);
  var [label, setLabel]               = useState(initialLabel || "");
  var [desc, setDesc]                 = useState("");
  var [fromId, setFromId]             = useState(fromNode ? fromNode.id : null);
  var [toId, setToId]                 = useState(toNode ? toNode.id : null);
  var [cardinality, setCardinality]   = useState("1:N");
  var [inverseLabel, setInverseLabel] = useState("");
  var [requiredAtFrom, setRequiredAtFrom] = useState(false);
  var [symmetric, setSymmetric]       = useState(false);
  // Population
  var [populationKind, setPopulationKind] = useState(null);
  var [popSourceId, setPopSourceId]   = useState(null);
  var [popFromColumn, setPopFromColumn] = useState("");
  var [popToColumn, setPopToColumn]   = useState("");
  var [popRuleText, setPopRuleText]   = useState("");
  var [popAgentId, setPopAgentId]     = useState(null);
  var [popObjectId, setPopObjectId]   = useState(null);
  var [popAutomationId, setPopAutomationId] = useState(null);
  // Properties
  var [edgeProps, setEdgeProps]       = useState([]);
  // Governance
  var [owner, setOwner]               = useState("morgan.lee");
  var [permsRead,  setPermsRead]      = useState([{ kind:"group", id:"everyone",      label:"Everyone in org" }]);
  var [permsWrite, setPermsWrite]     = useState([{ kind:"group", id:"data-platform", label:"data-platform team" }]);
  var [permsAdmin, setPermsAdmin]     = useState([{ kind:"user",  id:"morgan.lee",    label:"Morgan Lee (you)" }]);

  var stepNames = ["Basics", "Attributes"];

  // Prefer the live nodes from App state — module-scope NODES wouldn't
  // include nodes the user has just added on the canvas.
  var _allNodes = (liveNodes && liveNodes.length) ? liveNodes : NODES;
  var nodeOptions   = _allNodes.filter(function(n){ return n.type === "entity"; });
  var sourceOptions = _allNodes.filter(function(n){ return n.type === "source"; });
  var agentOptions  = _allNodes.filter(function(n){ return n.type === "agent"; });
  var fromN = nodeOptions.find(function(n){ return n.id === fromId; });
  var toN   = nodeOptions.find(function(n){ return n.id === toId; });

  // ── Source schema (synthesized): each source exposes a few relationship
  //    tables; each table has key columns + attribute columns. This is what an
  //    edge type joins on and pulls attribute values from. ──
  function _slug(s){ return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
  var _fk = (fromN ? _slug(fromN.label) : "from") + "_id";
  var _tk = (toN ? _slug(toN.label) : "to") + "_id";
  function objectsForSource(srcNode){
    if (!srcNode) return [];
    var s = _slug(srcNode.label).split("_")[0];
    return [
      { id: s + "_rel",    name: s + ".relationships", columns: [_fk, _tk, "created_at", "updated_at", "status", "role", "start_date", "end_date", "is_primary", "amount", "external_ref", "owner_id"] },
      { id: s + "_link",   name: s + ".link_table",    columns: [_fk, _tk, "linked_at", "source_system", "confidence", "last_seen"] },
      { id: s + "_events", name: s + ".event_log",     columns: [_fk, _tk, "event_time", "event_type", "channel", "score"] },
    ];
  }
  var popSourceNode = sourceOptions.find(function(s){ return s.id === popSourceId; });
  var popObjects    = objectsForSource(popSourceNode);
  var popObject     = popObjects.find(function(o){ return o.id === popObjectId; });
  var popColumns    = popObject ? popObject.columns : [];

  // Automations + agents also produce edges; each exposes output fields that
  // attribute values can be mapped from (same as source columns).
  var AUTOMATIONS = [
    { id:"fk_sync",        label:"Foreign-key sync",         outputs:["matched_at", "match_score", "source_table", "rule_id", "status"] },
    { id:"identity_merge", label:"Identity match & merge",   outputs:["merged_at", "confidence", "survivor_id", "cluster_id"] },
    { id:"nightly_rollup", label:"Nightly relationship rollup", outputs:["computed_at", "window", "value", "prev_value"] },
    { id:"event_linker",   label:"Event-stream linker",      outputs:["event_time", "event_type", "channel", "weight", "last_seen"] },
  ];
  var popAutomation = AUTOMATIONS.find(function(a){ return a.id === popAutomationId; });
  var popAgentNode  = agentOptions.find(function(a){ return a.id === popAgentId; });
  function agentOutputsFor(agentNode){ return agentNode ? ["score", "confidence", "label", "reason", "last_run", "model"] : []; }
  // Unified output fields the chosen mechanism exposes — every attribute maps to one of these.
  var popOutputs = populationKind === "source"     ? popColumns.filter(function(c){ return c !== popFromColumn && c !== popToColumn; })
                 : populationKind === "automation" ? (popAutomation ? popAutomation.outputs : [])
                 : populationKind === "agent"      ? agentOutputsFor(popAgentNode)
                 : [];
  var popReady = populationKind === "source" ? !!popObject : populationKind === "automation" ? !!popAutomation : populationKind === "agent" ? !!popAgentNode : false;
  var popOutputNoun = populationKind === "source" ? "column" : "field";
  var miniSel ={ border:"1px solid var(--line)", borderRadius:6, padding:"6px 8px", fontSize:12, fontFamily:"JetBrains Mono", color:"var(--ink)", background:"var(--panel)", outline:"none", boxSizing:"border-box", width:"100%" };

  function canContinue() {
    if (step === 1) return label.trim().length >= 3 && /^[A-Z_]+$/.test(label.trim()) && !!fromId && !!toId;
    return true;
  }

  var inp = { border:"1px solid var(--line)", borderRadius:7, padding:"11px 13px", fontSize:13, fontFamily:"inherit", color:"var(--ink)", background:"var(--panel)", outline:"none", boxSizing:"border-box", width:"100%", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" };
  var lbl = { display:"block", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.6px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 };

  var DIRECTORY = [
    { kind:"group", id:"everyone",        label:"Everyone in org" },
    { kind:"group", id:"data-platform",   label:"data-platform team" },
    { kind:"group", id:"customer-ops",    label:"customer-ops team" },
    { kind:"group", id:"finance-ops",     label:"finance-ops team" },
    { kind:"group", id:"engineering",     label:"engineering team" },
    { kind:"group", id:"security",        label:"security team" },
    { kind:"user",  id:"morgan.lee",      label:"Morgan Lee" },
    { kind:"user",  id:"ramin.k",         label:"Ramin K" },
    { kind:"user",  id:"jordan.s",        label:"Jordan S" }
  ];

  // Local node-picker: shows label + state colour. Used for From / To.
  function NodePicker({ value, onChange, placeholder, disabled }) {
    var [open, setOpen] = useState(false);
    var sel = nodeOptions.find(function(n){ return n.id === value; });
    function dot(n){ var c = n.state === "incident" ? "var(--coral)" : n.state === "risk" ? "var(--gold)" : n.state === "signal" ? "var(--purple)" : "var(--blue)"; return c; }
    return (
      <div style={{ position:"relative" }}>
        <button disabled={disabled} onClick={function(){ if (!disabled) setOpen(function(o){ return !o; }); }}
          style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", border:"1px solid " + (sel ? "var(--ink-2)" : "var(--line)"), borderRadius:8, background: disabled ? "var(--panel-2)" : sel ? "var(--bg-canvas)" : "var(--panel)", cursor: disabled ? "default" : "pointer", fontFamily:"inherit", textAlign:"left", opacity: disabled ? 0.85 : 1 }}>
          {sel ? (
            <>
              <span style={{ width:10, height:10, borderRadius:"50%", background: dot(sel), flexShrink:0 }} />
              <span style={{ flex:1, fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{sel.label}</span>
              {disabled && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--chip)", color:"var(--ink-3)", letterSpacing:"0.5px" }}>LOCKED</span>}
              {!disabled && <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>}
            </>
          ) : (
            <>
              <span style={{ flex:1, fontSize:13.5, color:"var(--ink-3)" }}>{placeholder}</span>
              <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
            </>
          )}
        </button>
        {open && (
          <>
            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setOpen(false); }} />
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:9, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:5, maxHeight:300, overflowY:"auto" }}>
              {nodeOptions.map(function(n){
                var isSel = n.id === value;
                return (
                  <button key={n.id} onClick={function(){ onChange(n.id); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 10px", borderRadius:6, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", fontSize:13, color:"var(--ink)" }}
                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ width:10, height:10, borderRadius:"50%", background: dot(n), flexShrink:0 }} />
                    <span style={{ flex:1 }}>{n.label}</span>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>{n.instances}</span>
                    {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:12 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Permission row (same RBAC pattern as NewGraphFlow)
  // ── POPULATION OPTIONS ────────────────────────────────────────────────
  var populationOptions = [
    { id:"source", title:"From a data source",  tag:"RECOMMENDED",
      desc:"Join a table from a connected system. Pick the relationship table, then map each attribute to one of its columns." },
    { id:"automation", title:"By automation",   tag:"",
      desc:"An automation produces the edges. Pick the automation, then map each attribute to one of its output fields." },
    { id:"agent", title:"By agent",             tag:"AGENT",
      desc:"An agent produces the edges. Pick the agent, then map each attribute to one of its output fields." }
  ];

  // ── COMMON EDGE PROPERTY EXAMPLES ─────────────────────────────────────
  var EDGE_PROPERTY_TEMPLATES = [
    { name:"weight",         type:"number",   hint:"Strength of the relationship (0–1)" },
    { name:"confidence",     type:"number",   hint:"How sure the source/agent is" },
    { name:"since",          type:"datetime", hint:"When the relationship started" },
    { name:"until",          type:"datetime", hint:"When the relationship ended (null = active)" },
    { name:"source_system",  type:"string",   hint:"Which system asserted the edge" },
    { name:"is_primary",     type:"boolean",  hint:"Is this the canonical/primary link" }
  ];

  function addProp(template){
    setEdgeProps(function(arr){ return arr.concat([{ name: template.name, type: template.type, required: false }]); });
  }
  function updateProp(idx, patch){
    setEdgeProps(function(arr){ return arr.map(function(p, i){ return i === idx ? Object.assign({}, p, patch) : p; }); });
  }
  function removeProp(idx){
    setEdgeProps(function(arr){ return arr.filter(function(_, i){ return i !== idx; }); });
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.42)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"92vw", maxWidth:1180, height:"94vh", background:"var(--bg-canvas)", borderRadius:12, border:"1px solid var(--line)", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.32)" }}>

        {/* HEADER */}
        <div style={{ flexShrink:0, height:56, borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", background:"var(--panel)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontFamily:"Instrument Serif", fontSize:20, color:"var(--ink)" }}>{label ? ":" + label : "New edge type"}</div>
            {fromN && toN && (
              <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>
                <span>{fromN.label}</span>
                <span style={{ color:"var(--ink-4)" }}>—{cardinality}→</span>
                <span>{toN.label}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:15, color:"var(--ink-3)" }}>✕</button>
        </div>

        <div style={{ flex:1, display:"grid", gridTemplateColumns:"240px minmax(0, 1fr)", minHeight:0 }}>

          {/* SIDEBAR */}
          <div style={{ background:"var(--panel-2)", borderRight:"1px solid var(--line)", padding:"20px 14px", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
            {stepNames.map(function(nm, i){
              var n = i + 1;
              var isOn = step === n;
              var isDone = step > n;
              var sub = n === 1 ? (label && fromN && toN ? ":" + label + (populationKind ? " · " + (populationOptions.find(function(o){return o.id===populationKind;}) || {}).title : "") : "Label, endpoints & population")
                      : n === 2 ? (edgeProps.length === 0 ? "None — optional" : edgeProps.length + " attribute" + (edgeProps.length === 1 ? "" : "s"))
                      : "Publish";
              return (
                <button key={n} onClick={function(){ setStep(n); }}
                  style={{ display:"flex", gap:12, padding:"10px 12px", borderRadius:7, border: isOn ? "1px solid var(--line)" : "1px solid transparent", background: isOn ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", alignItems:"center" }}>
                  <span style={{ width:28, height:28, borderRadius:"50%", border:"1px solid " + (isDone ? "var(--green)" : isOn ? "var(--ink)" : "var(--line)"), background: isDone ? "var(--green)" : isOn ? "var(--ink)" : "var(--bg-canvas)", color: isDone || isOn ? "var(--bg-canvas)" : "var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize: 12, fontWeight:700, flexShrink:0, lineHeight:1 }}>{isDone ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg> : n}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, color:"var(--ink)", fontWeight: isOn ? 500 : 400, lineHeight:1.2 }}>{nm}</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER */}
          <div style={{ padding:"24px 32px 28px", overflowY:"auto" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.8px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:5 }}>{"STEP " + step + " / 3"}</div>
              <div style={{ fontFamily:"Instrument Serif", fontSize:28, color:"var(--ink)", lineHeight:1.1, marginBottom:8 }}>{stepNames[step-1]}</div>
              <div style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.55 }}>
                {step === 1 && "Name the relationship, pick the two node types it connects, and decide how instances are populated. The label reads like a verb — :WORKS_AT, :BILLED_AS, :OWNS."}
                {step === 2 && "Optional. Add properties that vary per edge — like a weight, a confidence score, or when the relationship started. Skip if every instance is identical."}
                {step === 3 && "Last look before this edge type becomes available to agents, queries and the schema."}
              </div>
            </div>

            {/* STEP 1 — Basics */}
            {step === 1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={lbl}>LABEL <span style={{ color:"var(--coral)", marginLeft:4 }}>required</span></label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontFamily:"JetBrains Mono", fontSize:13, color:"var(--ink-4)", pointerEvents:"none" }}>:</span>
                      <input value={label} onChange={function(e){ setLabel(e.target.value.toUpperCase().replace(/[^A-Z_]/g, "")); }} placeholder="WORKS_AT" style={Object.assign({}, inp, { paddingLeft:22, fontFamily:"JetBrains Mono" })} autoFocus />
                    </div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:5 }}>UPPER_SNAKE_CASE · 3–32 chars</div>
                  </div>
                  <div>
                    <label style={lbl}>CARDINALITY</label>
                    <div style={{ display:"flex", gap:6 }}>
                      {[
                        { v:"1:1", h:"One on each side" },
                        { v:"1:N", h:"One source, many targets" },
                        { v:"N:1", h:"Many sources, one target" },
                        { v:"N:M", h:"Many on each side" }
                      ].map(function(o){
                        var isOn = cardinality === o.v;
                        return <button key={o.v} title={o.h} onClick={function(){ setCardinality(o.v); }}
                          style={{ flex:1, padding:"8px 0", border:"1px solid " + (isOn ? "var(--ink)" : "var(--line)"), borderRadius:7, background: isOn ? "var(--ink)" : "var(--panel)", color: isOn ? "var(--bg-canvas)" : "var(--ink-2)", fontSize:12, fontFamily:"JetBrains Mono", cursor:"pointer", fontWeight:600 }}>{o.v}</button>;
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 1fr", gap:12, alignItems:"end" }}>
                  <div>
                    <label style={lbl}>FROM <span style={{ color:"var(--coral)", marginLeft:4 }}>required</span></label>
                    <NodePicker value={fromId} onChange={setFromId} placeholder="— pick the source node —" />
                  </div>
                  <div style={{ paddingBottom:10, textAlign:"center", fontFamily:"JetBrains Mono", fontSize:14, color:"var(--ink-3)" }}>—{cardinality}→</div>
                  <div>
                    <label style={lbl}>TO <span style={{ color:"var(--coral)", marginLeft:4 }}>required</span></label>
                    <NodePicker value={toId} onChange={setToId} placeholder="— pick the target node —" />
                  </div>
                </div>

                <div>
                  <label style={lbl}>INVERSE LABEL <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400 }}>optional</span></label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontFamily:"JetBrains Mono", fontSize:13, color:"var(--ink-4)", pointerEvents:"none" }}>:</span>
                    <input value={inverseLabel} onChange={function(e){ setInverseLabel(e.target.value.toUpperCase().replace(/[^A-Z_]/g, "")); }} placeholder="HAS_EMPLOYEE" style={Object.assign({}, inp, { paddingLeft:22, fontFamily:"JetBrains Mono", maxWidth:340 })} />
                  </div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:5 }}>Lets queries traverse the reverse direction by name without recomputing.</div>
                </div>

              </div>
            )}


            {/* STEP 2 — Attributes */}
            {step === 2 && (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {edgeProps.length === 0 ? (
                  <div style={{ padding:"20px 22px", border:"1px dashed var(--line)", borderRadius:10, background:"var(--panel-2)" }}>
                    <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.55, marginBottom:6 }}>No attributes yet — that's fine for most edges.</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", lineHeight:1.55 }}>Add an attribute only if every instance can carry a different value for it.</div>
                  </div>
                ) : (
                  <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
                    <div>
                      {edgeProps.map(function(p, i){
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr 28px", gap:10, padding:"10px 18px", borderBottom: i < edgeProps.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                            <input value={p.name} onChange={function(e){ updateProp(i, { name: e.target.value }); }} placeholder="attribute name" style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12 })} />
                            <PropTypeSelect value={p.type} onChange={function(v){ updateProp(i, { type: v }); }} />
                            <button onClick={function(){ removeProp(i); }} title="Remove attribute" style={{ background:"none", border:"none", color:"var(--ink-3)", cursor:"pointer", fontSize:16, justifySelf:"center" }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={function(){ addProp({ name:"", type:"string" }); }} className="btn-ghost" style={{ alignSelf:"flex-start", padding:"8px 14px" }}>+ Add attribute</button>
              </div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
                  <div className="card-head card-head-row" style={{ background:"var(--panel-2)" }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>Summary</span>
                    <span className="card-head-sub">{cardinality}</span>
                  </div>
                  <div>
                    {[
                      { k:"LABEL",       v: label ? <span style={{ fontFamily:"JetBrains Mono" }}>{":" + label}</span> : <span style={{ color:"var(--coral)" }}>not set</span> },
                      { k:"FROM → TO",   v: (fromN && toN) ? (fromN.label + "  —" + cardinality + "→  " + toN.label) : <span style={{ color:"var(--coral)" }}>endpoints missing</span> },
                      { k:"INVERSE",     v: inverseLabel ? <span style={{ fontFamily:"JetBrains Mono" }}>{":" + inverseLabel}</span> : <span style={{ color:"var(--ink-4)" }}>—</span> },
                      { k:"ATTRIBUTES",  v: edgeProps.length === 0 ? <span style={{ color:"var(--ink-4)" }}>none</span> : edgeProps.map(function(p, i){ return <span key={i} style={{ fontFamily:"JetBrains Mono", fontSize:11, padding:"2px 7px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)", marginRight:4 }}>{p.name + ":" + p.type}</span>; }) },
                      { k:"DESCRIPTION", v: desc || <span style={{ color:"var(--ink-4)" }}>—</span> },
                      { k:"OWNER",       v: owner }
                    ].map(function(row, i, arr){
                      return (
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"170px 1fr", gap:14, padding:"10px 22px", borderBottom: i < arr.length-1 ? "1px dashed var(--line-2)" : "none", alignItems:"baseline" }}>
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase" }}>{row.k}</span>
                          <span style={{ fontSize:13, color:"var(--ink)", textAlign:"right" }}>{row.v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div style={{ flexShrink:0, padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <button className="btn-ghost" onClick={function(){ if (step > 1) setStep(function(s){ return s - 1; }); }} disabled={step === 1} style={{ opacity: step === 1 ? 0.4 : 1 }}>← Back</button>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            {step < 2
              ? <button className="btn-dark" disabled={!canContinue()} onClick={function(){ setStep(function(s){ return s + 1; }); }} style={{ opacity: canContinue() ? 1 : 0.45 }}>Continue →</button>
              : <button className="btn-dark" disabled={!canContinue()} onClick={function(){ if (onCreate) onCreate({ label: label, from: fromN, to: toN }); onClose(); }} style={{ opacity: canContinue() ? 1 : 0.45 }}>Create edge type ↵</button>
            }
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPH LANDING — EMPTY STATE
// Shown when a workspace has no graphs yet (or via the E keyboard shortcut on
// the landing). A quiet, ambient node constellation behind a serif hero +
// description + "Create" CTA. Press B to return to the populated view.
// ═══════════════════════════════════════════════════════════════════════════════


// — DeleteImpactDialog —
function DeleteImpactDialog({ ids, nodes, edges, onCancel, onConfirm }) {
  var idSet = {}; ids.forEach(function(id){ idSet[id] = true; });
  var targetNodes = nodes.filter(function(n){ return idSet[n.id]; });
  var affectedEdges = edges.filter(function(e){ return idSet[e.s] || idSet[e.t]; });
  // Neighbour nodes that will lose at least one connection (not the targets themselves)
  var neighbourIds = {};
  affectedEdges.forEach(function(e){
    if (idSet[e.s] && !idSet[e.t]) neighbourIds[e.t] = true;
    if (idSet[e.t] && !idSet[e.s]) neighbourIds[e.s] = true;
  });
  var neighbours = nodes.filter(function(n){ return neighbourIds[n.id]; });
  // Sum of records (instancesN) that get unreachable from this graph
  var totalRecords = targetNodes.reduce(function(acc, n){ return acc + (n.instancesN || 0); }, 0);
  // Sum of property fields across all targets
  var totalProps = targetNodes.reduce(function(acc, n){ return acc + (n.props || 0); }, 0);
  var multi = ids.length > 1;

  // Confirmation phrase: node name for single, "DELETE" for multi.
  var requiredPhrase = multi ? "DELETE" : (targetNodes[0] ? targetNodes[0].label : "DELETE");
  var [step, setStep] = useState(1);
  var [typed, setTyped] = useState("");
  var [ack, setAck] = useState(false);
  var canContinue = step === 1 ? ack : (typed.trim() === requiredPhrase);

  function fmtNum(n){ return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K" : String(n); }

  return (
    <div onClick={function(e){ if (e.target === e.currentTarget) onCancel(); }}
      style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.45)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"min(94vw, 580px)", maxHeight:"88vh", overflow:"auto", background:"var(--bg-canvas)", borderRadius:14, border:"1px solid var(--line)", boxShadow:"0 32px 80px rgba(0,0,0,0.32)" }}>
        {/* Header */}
        <div style={{ padding:"24px 26px 4px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 9px", borderRadius:4, background:"var(--coral-fill)", color:"var(--coral)", fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 16H3l9-16z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>
              Destructive action
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase" }}>Step {step} of 2 · {step === 1 ? "Review impact" : "Confirm"}</div>
          </div>
          <div style={{ fontFamily:"'Instrument Serif', serif", fontSize:28, color:"var(--ink)", lineHeight:1.1, marginBottom:8 }}>
            {multi ? ("Delete " + ids.length + " nodes?") : (
              targetNodes[0] ? <>Delete <strong>{targetNodes[0].label}</strong>?</> : "Delete node?"
            )}
          </div>
          <div style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.55 }}>
            This will remove {multi ? "these nodes" : "this node"} from the schema along with every edge connected to {multi ? "them" : "it"}. Downstream computations and rules that reference {multi ? "these" : "this"} entity types will break.
          </div>
        </div>

        {step === 1 && (<>
          {/* Impact summary — 4 KPI cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:0, margin:"18px 26px 0", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden", background:"var(--panel)" }}>
            {[
              { k:"NODES",      v: ids.length },
              { k:"EDGES",      v: affectedEdges.length },
              { k:"PROPERTIES", v: totalProps },
              { k:"RECORDS",    v: fmtNum(totalRecords) }
            ].map(function(cell, i, arr){
              return (
                <div key={i} style={{ padding:"12px 14px", borderRight: i < arr.length-1 ? "1px solid var(--line-2)" : "none" }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:4 }}>{cell.k}</div>
                  <div style={{ fontFamily:"'Instrument Serif', serif", fontSize:22, color:"var(--ink)", lineHeight:1 }}>{cell.v}</div>
                </div>
              );
            })}
          </div>

          {/* Affected nodes list (multi) */}
          {multi && targetNodes.length > 0 && (
            <div style={{ margin:"18px 26px 0" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:8 }}>Nodes being deleted</div>
              <div style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:8, padding:"4px 0", maxHeight:140, overflow:"auto" }}>
                {targetNodes.map(function(n, i, arr){
                  return (
                    <div key={n.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 14px", borderBottom: i < arr.length-1 ? "1px dashed var(--line-2)" : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                        <ListGlyph node={n} size={14} />
                        <span style={{ fontSize:12.5, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.label}</span>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-4)", textTransform:"uppercase" }}>{n.type}</span>
                      </div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)" }}>{n.instances || "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edges being severed */}
          {affectedEdges.length > 0 && (
            <div style={{ margin:"18px 26px 0" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:8 }}>Edges severed ({affectedEdges.length})</div>
              <div style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:8, padding:"4px 0", maxHeight:160, overflow:"auto" }}>
                {affectedEdges.slice(0, 8).map(function(e, i, arr){
                  var s = nodes.find(function(n){ return n.id === e.s; });
                  var t = nodes.find(function(n){ return n.id === e.t; });
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderBottom: i < Math.min(arr.length, 8) - 1 ? "1px dashed var(--line-2)" : "none", fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-2)" }}>
                      <span style={{ color: idSet[e.s] ? "var(--coral)" : "var(--ink-3)" }}>{s ? s.label : e.s}</span>
                      <span style={{ color:"var(--ink-4)" }}>:{e.label}</span>
                      <span style={{ color:"var(--ink-3)" }}>→</span>
                      <span style={{ color: idSet[e.t] ? "var(--coral)" : "var(--ink-3)" }}>{t ? t.label : e.t}</span>
                    </div>
                  );
                })}
                {affectedEdges.length > 8 && (
                  <div style={{ padding:"7px 14px", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)" }}>+ {affectedEdges.length - 8} more</div>
                )}
              </div>
            </div>
          )}

          {/* Neighbour nodes that lose at least one connection */}
          {neighbours.length > 0 && (
            <div style={{ margin:"18px 26px 0" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:8 }}>Connected nodes affected ({neighbours.length})</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {neighbours.map(function(n){
                  return (
                    <span key={n.id} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:999, background:"var(--panel)", border:"1px solid var(--line-2)", fontSize:11.5, color:"var(--ink-2)" }}>
                      <ListGlyph node={n} size={12} />
                      {n.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acknowledgement checkbox */}
          <label style={{ display:"flex", alignItems:"flex-start", gap:10, margin:"18px 26px 0", padding:"12px 14px", border:"1px solid " + (ack ? "var(--coral)" : "var(--line)"), borderRadius:9, background: ack ? "var(--coral-fill)" : "var(--panel)", cursor:"pointer", transition:"all 140ms ease-out" }}>
            <input type="checkbox" checked={ack} onChange={function(e){ setAck(e.target.checked); }} style={{ marginTop:2, accentColor:"var(--coral)", width:14, height:14 }} />
            <span style={{ fontSize:12.5, color:"var(--ink-2)", lineHeight:1.5 }}>
              I understand this severs <strong>{affectedEdges.length}</strong> edge{affectedEdges.length === 1 ? "" : "s"}{neighbours.length > 0 ? <>, affects <strong>{neighbours.length}</strong> connected node{neighbours.length === 1 ? "" : "s"}</> : ""}, and may break downstream computations and rules.
            </span>
          </label>

          {/* Footnote — undoable assurance */}
          <div style={{ margin:"12px 26px 0", padding:"10px 12px", border:"1px dashed var(--line)", borderRadius:8, background:"var(--panel-2)", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", lineHeight:1.45 }}>
            You can undo this with <strong style={{ color:"var(--ink-2)" }}>⌘Z</strong> within this session — but downstream rules and computations that referenced the deleted entities will need to be revisited before publishing.
          </div>
        </>)}

        {step === 2 && (
          <div style={{ margin:"22px 26px 0" }}>
            {/* Compact recap pill */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", padding:"10px 14px", background:"var(--panel)", border:"1px solid var(--line)", borderRadius:9, marginBottom:18, fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>
              <span style={{ color:"var(--coral)", fontWeight:700 }}>{ids.length}</span><span>node{ids.length === 1 ? "" : "s"}</span>
              <span style={{ color:"var(--ink-4)" }}>·</span>
              <span style={{ color:"var(--coral)", fontWeight:700 }}>{affectedEdges.length}</span><span>edge{affectedEdges.length === 1 ? "" : "s"}</span>
              <span style={{ color:"var(--ink-4)" }}>·</span>
              <span style={{ color:"var(--coral)", fontWeight:700 }}>{totalProps}</span><span>field{totalProps === 1 ? "" : "s"}</span>
              <span style={{ color:"var(--ink-4)" }}>·</span>
              <span style={{ color:"var(--coral)", fontWeight:700 }}>{fmtNum(totalRecords)}</span><span>record{totalRecords === 1 ? "" : "s"}</span>
            </div>

            <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 }}>Type to confirm</div>
            <div style={{ fontSize:13, color:"var(--ink-2)", lineHeight:1.5, marginBottom:10 }}>
              {multi ? (
                <>Type <code style={{ fontFamily:"JetBrains Mono", padding:"2px 6px", background:"var(--coral-fill)", color:"var(--coral)", borderRadius:4, fontWeight:700 }}>DELETE</code> below to confirm this destructive action.</>
              ) : (
                <>Type the node name <code style={{ fontFamily:"JetBrains Mono", padding:"2px 6px", background:"var(--coral-fill)", color:"var(--coral)", borderRadius:4, fontWeight:700 }}>{requiredPhrase}</code> below to confirm.</>
              )}
            </div>
            <input
              autoFocus
              value={typed}
              onChange={function(e){ setTyped(e.target.value); }}
              placeholder={requiredPhrase}
              style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"JetBrains Mono", border:"1.5px solid " + (typed && typed.trim() !== requiredPhrase ? "var(--coral)" : "var(--line)"), borderRadius:9, background:"var(--panel)", color:"var(--ink)", outline:"none", boxSizing:"border-box", letterSpacing:"0.3px" }}
            />
            {typed && typed.trim() !== requiredPhrase && (
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--coral)", marginTop:6 }}>Doesn't match — type "{requiredPhrase}" exactly.</div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, padding:"22px 26px 22px", marginTop:18 }}>
          <button onClick={step === 2 ? function(){ setStep(1); } : onCancel} className="btn-ghost">
            {step === 2 ? "← Back" : "Cancel"}
          </button>
          <div style={{ display:"flex", gap:8 }}>
            {step === 2 && <button onClick={onCancel} className="btn-ghost">Cancel</button>}
            {step === 1 ? (
              <button onClick={function(){ if (ack) setStep(2); }} disabled={!ack}
                className="btn-dark"
                style={{ background: ack ? "var(--coral)" : "transparent", borderColor: ack ? "var(--coral)" : "var(--line)", color: ack ? "var(--bg-canvas)" : "var(--ink-4)", opacity: ack ? 1 : 0.6, cursor: ack ? "pointer" : "not-allowed" }}>
                Continue →
              </button>
            ) : (
              <button onClick={function(){ if (canContinue) onConfirm(); }} disabled={!canContinue}
                className="btn-dark"
                style={{ background: canContinue ? "var(--coral)" : "transparent", borderColor: canContinue ? "var(--coral)" : "var(--line)", color: canContinue ? "var(--bg-canvas)" : "var(--ink-4)", opacity: canContinue ? 1 : 0.6, cursor: canContinue ? "pointer" : "not-allowed" }}>
                Delete {ids.length > 1 ? (ids.length + " nodes") : "node"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODE — View / Edit segmented toggle + cursor-mode toggle ──────────
// Floats at the bottom-center of the canvas. View/Edit pill on the left; in
// edit mode, a second smaller pill appears to the right with two cursor
// options: "add" (dashed-plus drop cursor, click adds a node) and "select"
// (plain grab, click empty canvas just deselects).

/* ════════ PROPERTY TABLE + ADD-PROPERTY FLOW (ported from ECG) ════════ */
function PropertyDetailView({ node, property, properties, onBack }) {
  var [tab, setTab] = useState("Overview");
  var p = property;
  var c = colorForNode(node);
  var seed = node.id.charCodeAt(0) + p.name.length * 11;

  // Synthesised facts about this property
  var nulls = p.required ? 0 : Math.floor((100 - p.fill) / 100 * (node.instancesN || 1000));
  var violations = Math.max(0, 100 - p.conf);
  var distinctRatio = p.pk ? 100 : p.type === "bool" ? 0.0 : p.type.indexOf("enum") === 0 ? Math.min(100, 0.5 + (seed % 12)) : Math.min(100, 80 + (seed % 18));
  var distinct = Math.max(1, Math.floor((node.instancesN || 1000) * (distinctRatio / 100)));
  var since = "v" + (1 + (seed % 3)) + "." + ((seed * 7) % 10) + ".0";
  var addedBy = ["morgan.lee","ramin.k","data-platform","schema-bot"][seed % 4];

  var description = p.name === "account_id" ? "Primary identifier for an account. UUID v4, auto-generated at creation time. Stable for the lifetime of the record and used as the join key across all downstream systems."
                  : p.computed ? "Derived value. Recomputed automatically when any of its input fields change. Source: " + p.computed + "."
                  : p.pii      ? "Contains personal data. Encrypted at rest; raw values exposed only to roles holding " + (p.name.indexOf("email") >= 0 ? "comms_admin" : "acct_admin") + ". All access is audit-logged."
                  : "Stores the " + p.name.replace(/_/g, " ") + " value for each " + node.label + " record. Set at ingest time from upstream source systems and reconciled per the active survivorship rules.";

  var exampleValues = (function(){
    if (p.pk) return [(node.id.slice(0,3).toUpperCase() + "-" + (10000 + (seed * 13) % 89999)), (node.id.slice(0,3).toUpperCase() + "-" + (10000 + (seed * 17) % 89999)), (node.id.slice(0,3).toUpperCase() + "-" + (10000 + (seed * 19) % 89999))];
    if (p.name === "name" || p.name === "company_name") return ["Acme Corp", "Quantum Dynamics", "Cascade Analytics", "Horizon Tech", "Summit Partners"];
    if (p.name === "domain") return ["acme.com", "quantum.dy", "cascade.io", "horizon.tech", "summit.partners"];
    if (p.name === "email")  return ["taylor.j@acme.com", "morgan.k@horizon.tech", "jordan.s@cascade.io"];
    if (p.name === "industry") return ["SaaS", "Fintech", "Healthcare", "Manufacturing", "Logistics"];
    if (p.name === "tier")     return ["SMB", "MM", "ENT", "Strategic"];
    if (p.name === "region")   return ["NA-East", "NA-West", "EMEA", "APAC"];
    if (p.name === "status")   return ["active", "pending", "review"];
    if (p.type === "decimal" || p.type === "float") return ["1,240.50", "48,200.00", "127,840.75"];
    if (p.type === "bool")      return ["true", "false"];
    if (p.type === "timestamp") return ["2026-05-24T08:14:00Z", "2026-05-23T16:42:18Z"];
    if (p.type === "date")      return ["2026-05-24", "2025-12-01"];
    if (p.type.indexOf("enum") === 0) return ["alpha","beta","gamma","delta"];
    return [p.name + "-1240", p.name + "-9871", p.name + "-3344"];
  })();

  // Top values distribution (for enums, strings; bars for numerics)
  var topValuesDistribution = exampleValues.slice(0, 5).map(function(v, i){
    var pct = i === 0 ? (35 + (seed % 25)) : Math.max(2, 30 - i * 6 + (seed % 5));
    return { value: v, count: Math.floor((node.instancesN || 1000) * pct / 100), pct: pct };
  });

  // Rules touching this property
  var allRules = generateRules(node);
  var touchingRules = []
    .concat((allRules.quality || []).filter(function(r){ return (r.expr || "").indexOf(p.name) >= 0 || (r.label || "").indexOf(p.name) >= 0 || (r.id || "").indexOf(p.name) >= 0; }))
    .concat((allRules.match   || []).filter(function(r){ return r.signals && r.signals.some(function(s){ return s.field === p.name; }); }).map(function(r){ return Object.assign({}, r, { kind:"MATCH" }); }))
    .concat((allRules.survivorship || []).filter(function(r){ return r.property === p.name; }).map(function(r){ return Object.assign({}, r, { kind:"SURV" }); }));

  // Sources contributing to this property
  var sources = generateSources(node);
  var sourceShares = sources.slice(0, 4).map(function(s, i){
    var share = i === 0 ? (40 + (seed % 18)) : i === 1 ? (25 + (seed % 12)) : Math.max(5, 20 - i * 4);
    return { name: s.name, share: share, conf: (0.78 + ((seed + i * 7) % 21) / 100).toFixed(2) };
  });

  // Activity timeline for the property
  var activity = [
    { t:"now",     who:"runtime",   what:"evaluating on every write", color:"var(--green)" },
    { t:"32m ago", who:"runtime",   what: violations > 0 ? Math.round(violations * 0.4) + " new violations" : "0 violations in last hour", color: violations > 0 ? "var(--gold)" : "var(--green)" },
    { t:"2d ago",  who:"morgan.lee",what:"updated description",       color:"var(--blue)" },
    { t:"6d ago",  who:"schema-bot",what:"baseline distribution recomputed", color:"var(--ink-4)" },
    { t:since.indexOf("v") === 0 ? "added in " + since : "1mo ago", who:addedBy, what:"property created", color:"var(--purple)" }
  ];

  function NodeGlyph({ size }) {
    return (
      <svg width={size} height={size} viewBox={"-"+(size/2)+" -"+(size/2)+" "+size+" "+size} style={{ flexShrink:0 }}>
        {node.type === "agent" ? <polygon points={[0,1,2,3,4,5].map(function(i){ var a=(Math.PI/3)*i-Math.PI/2; var r=size/2-1; return (r*Math.cos(a)).toFixed(1)+","+(r*Math.sin(a)).toFixed(1); }).join(" ")} fill={c.fill} stroke={c.stroke} strokeWidth="1.3"/>
         : node.type === "source" ? <rect x={-(size/2-1)} y={-(size/2-1)} width={size-2} height={size-2} rx="2" fill={c.fill} stroke={c.stroke} strokeWidth="1.3"/>
         : <circle r={size/2-1} fill={c.fill} stroke={c.stroke} strokeWidth="1.3"/>}
      </svg>
    );
  }

  var tabs = ["Overview", "Distribution", "Lineage", "Rules", "Activity"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* HEADER */}
      <div className="card">
        <div className="card-body" style={{ padding:"18px 22px 14px" }}>
          <div className="detail-crumb" style={{ marginBottom:10 }}>
            <button className="crumb-back" onClick={onBack}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              Properties
            </button>
            <span className="crumb-sep">/</span>
            <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-2)" }}>{p.name}</code>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <span style={{ width:38, height:38, borderRadius:9, background:"var(--chip)", color:"var(--ink)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, fontFamily:"JetBrains Mono", flexShrink:0 }}>{p.type === "uuid" ? "ID" : p.type === "decimal" || p.type === "float" || p.type === "int" ? "#" : p.type === "bool" ? "✓" : p.type === "timestamp" || p.type === "date" ? "◷" : p.type.indexOf("enum") === 0 ? "≡" : p.type === "struct" ? "{}" : "T"}</span>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                  <code style={{ fontFamily:"JetBrains Mono", fontSize:22, fontWeight:600, color:"var(--ink)" }}>{p.name}</code>
                  {p.pk && <span style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 7px", borderRadius:4, background:"var(--ink)", color:"var(--bg-canvas)", fontWeight:700, letterSpacing:"0.5px" }}>PK</span>}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:11, padding:"3px 8px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)", letterSpacing:"0.3px" }}>{p.type}</span>
                  {p.required && <span className="snap-tag" style={{ fontSize:10, padding:"2px 7px" }}>REQ</span>}
                  {p.indexed  && <span className="snap-tag snap-idx" style={{ fontSize:10, padding:"2px 7px" }}>IDX</span>}
                  {p.pii      && <span className="snap-tag snap-pii" style={{ fontSize:10, padding:"2px 7px" }}>PII</span>}
                  {p.computed && <span className="snap-tag snap-comp" style={{ fontSize:10, padding:"2px 7px" }}>FX</span>}
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)" }}>· on</span>
                  <NodeGlyph size={14} />
                  <span style={{ fontSize:12, color:"var(--ink-2)" }}>{node.label}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-ghost">View as JSON</button>
              <button className="btn-ghost" style={{ color:"var(--coral)" }}>Deprecate…</button>
              <button className="btn-dark">Edit property</button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="detail-kpis" style={{ gridTemplateColumns:"repeat(6, 1fr)", marginTop:16, marginBottom:0 }}>
            <div className="kpi">
              <div className="kpi-lbl">Fill rate</div>
              <div className="kpi-v" style={{ color: metricColor(p.fill) }}>{p.fill + "%"}</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Conformance</div>
              <div className="kpi-v" style={{ color: metricColor(p.conf) }}>{p.conf + "%"}</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Null count</div>
              <div className="kpi-v" style={{ color: nulls > 0 ? "var(--gold)" : "var(--ink)" }}>{nulls.toLocaleString()}</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Distinct</div>
              <div className="kpi-v">{distinct.toLocaleString()}</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Violations · 24h</div>
              <div className="kpi-v" style={{ color: violations > 0 ? "var(--coral)" : "var(--ink)" }}>{violations}</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Rules attached</div>
              <div className="kpi-v">{touchingRules.length}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs" style={{ margin:0, padding:"0 22px", borderTop:"1px solid var(--line-2)" }}>
          {tabs.map(function(t) {
            return <button key={t} className={"detail-tab" + (tab === t ? " on" : "")} onClick={function(){ setTab(t); }}>{t}</button>;
          })}
        </div>
      </div>

      {/* TAB BODIES */}
      {tab === "Overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1.6fr) minmax(280px, 1fr)", gap:18 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div className="card">
              <div className="card-head">About this property</div>
              <div className="card-body" style={{ fontSize:13, color:"var(--ink-2)", lineHeight:1.6 }}>{description}</div>
            </div>

            <div className="card">
              <div className="card-head">Example values</div>
              <div className="card-body">
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {exampleValues.map(function(v, i){
                    return <code key={i} style={{ fontFamily:"JetBrains Mono", fontSize:12, padding:"5px 10px", background:"var(--chip)", color:"var(--ink-2)", borderRadius:5 }}>{String(v)}</code>;
                  })}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">Top values <span className="card-head-sub">distribution over {node.instancesN ? node.instancesN.toLocaleString() : "all"} records</span></div>
              <div>
                {topValuesDistribution.map(function(v, i, arr){
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"180px 1fr 80px 80px", gap:14, padding:"10px 18px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                      <code style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{String(v.value)}</code>
                      <div className="nv-bar"><div className="nv-bar-fill" style={{ width: v.pct + "%", background:"var(--blue)" }} /></div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-2)", textAlign:"right" }}>{v.count.toLocaleString()}</span>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", textAlign:"right" }}>{v.pct + "%"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div className="card">
              <div className="card-head">Schema</div>
              <div className="card-body">
                <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:"7px 12px", fontSize:12 }}>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>TYPE</span>
                  <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink)" }}>{p.type}</code>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>REQUIRED</span>
                  <span style={{ color:"var(--ink)" }}>{p.required ? "yes" : "no"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>INDEXED</span>
                  <span style={{ color:"var(--ink)" }}>{p.indexed ? "yes" : "no"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>DEFAULT</span>
                  <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-2)" }}>{p.pk ? "auto()" : p.type === "bool" ? "false" : "null"}</code>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>PK</span>
                  <span style={{ color: p.pk ? "var(--green)" : "var(--ink-3)" }}>{p.pk ? "yes — primary key" : "no"}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">Governance</div>
              <div className="card-body">
                <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:"7px 12px", fontSize:12 }}>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>PII TIER</span>
                  <span style={{ color: p.pii ? "var(--coral)" : "var(--ink-3)", fontWeight: p.pii ? 600 : 400 }}>{p.pii ? "personal data" : "not PII"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>MASKING</span>
                  <span style={{ color:"var(--ink-2)" }}>{p.pii ? "hashed for non-priv roles" : "none"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>READ ROLES</span>
                  <span style={{ color:"var(--ink-2)", fontFamily:"JetBrains Mono", fontSize:11 }}>{p.pii ? "acct_admin, security" : "all"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>RETENTION</span>
                  <span style={{ color:"var(--ink-2)" }}>{p.pii ? "7 years (regulatory)" : "inherit"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>AUDIT</span>
                  <span style={{ color:"var(--ink-2)" }}>{p.pii ? "all reads logged" : "writes logged"}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">Lineage</div>
              <div className="card-body">
                <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:"7px 12px", fontSize:12 }}>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>SOURCE</span>
                  <span style={{ color:"var(--ink-2)" }}>{p.computed ? "computed — " + p.computed : p.source || "primary"}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>ADDED IN</span>
                  <span style={{ color:"var(--ink-2)", fontFamily:"JetBrains Mono", fontSize:11 }}>{since + " · " + addedBy}</span>
                  <span style={{ color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.4px" }}>LAST MODIFIED</span>
                  <span style={{ color:"var(--ink-2)" }}>2d ago by morgan.lee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISTRIBUTION TAB */}
      {tab === "Distribution" && (
        <div className="card">
          <div className="card-head card-head-row">
            <span>Value distribution <span className="card-head-sub">{distinct.toLocaleString() + " distinct values across " + (node.instancesN || 1000).toLocaleString() + " records"}</span></span>
            <button className="btn-ghost" style={{ fontSize:11.5 }}>Refresh</button>
          </div>
          <div>
            {topValuesDistribution.concat([{ value: "… all others", count: Math.max(0, (node.instancesN || 1000) - topValuesDistribution.reduce(function(s,v){ return s+v.count; },0)), pct: Math.max(0, 100 - topValuesDistribution.reduce(function(s,v){ return s+v.pct; },0)) }]).filter(function(v){ return v.pct > 0; }).map(function(v, i, arr){
              return (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"220px 1fr 80px 60px", gap:14, padding:"10px 18px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                  <code style={{ fontFamily:"JetBrains Mono", fontSize:12, color: v.value === "… all others" ? "var(--ink-4)" : "var(--ink-2)", fontStyle: v.value === "… all others" ? "italic" : "normal", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{String(v.value)}</code>
                  <div className="nv-bar" style={{ height:8 }}><div className="nv-bar-fill" style={{ width: v.pct + "%", background: v.value === "… all others" ? "var(--ink-4)" : "var(--blue)" }} /></div>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)", textAlign:"right" }}>{v.count.toLocaleString()}</span>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-3)", textAlign:"right" }}>{v.pct.toFixed(1) + "%"}</span>
                </div>
              );
            })}
            {nulls > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"220px 1fr 80px 60px", gap:14, padding:"10px 18px", borderTop:"1px dashed var(--line-2)", background:"var(--gold-fill)", alignItems:"center" }}>
                <code style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--gold)", fontWeight:700 }}>NULL</code>
                <div className="nv-bar" style={{ height:8 }}><div className="nv-bar-fill" style={{ width: (100 - p.fill) + "%", background:"var(--gold)" }} /></div>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--gold)", textAlign:"right", fontWeight:700 }}>{nulls.toLocaleString()}</span>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--gold)", textAlign:"right", fontWeight:700 }}>{(100 - p.fill) + "%"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LINEAGE TAB — sources contributing this property */}
      {tab === "Lineage" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div className="card">
            <div className="card-head">Source contributions <span className="card-head-sub">how each source system contributes values for {p.name}</span></div>
            <div>
              {sourceShares.map(function(s, i, arr){
                return (
                  <div key={i} style={{ padding:"14px 18px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink-2)", fontWeight:600 }}>{s.name}</span>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)" }}>{s.share + "% of values · avg conf " + s.conf}</span>
                    </div>
                    <div className="nv-bar" style={{ height:6, maxWidth:"100%" }}>
                      <div className="nv-bar-fill" style={{ width: s.share + "%", background:"var(--blue)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {p.computed && (
            <div className="card">
              <div className="card-head">Compute expression</div>
              <div className="card-body">
                <pre style={{ fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--purple)", margin:0, padding:"10px 12px", background:"var(--bg-canvas)", border:"1px solid var(--line-2)", borderRadius:6, whiteSpace:"pre-wrap" }}>{p.name + " := " + p.computed}</pre>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:8 }}>Recomputed on every input change. Last full recompute 2h ago.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RULES TAB */}
      {tab === "Rules" && (
        <div className="card">
          <div className="card-head card-head-row">
            <span>Rules referencing {p.name} <span className="card-head-sub">{touchingRules.length + " rule" + (touchingRules.length !== 1 ? "s" : "")}</span></span>
            <button className="btn-dark">+ New rule on this property</button>
          </div>
          {touchingRules.length === 0 ? (
            <div style={{ padding:"40px 18px", textAlign:"center", color:"var(--ink-3)", fontSize:13 }}>No rules currently reference this property.</div>
          ) : (
            <div>
              {touchingRules.map(function(r, i, arr){
                var kc = r.kind === "VALIDATE" ? "var(--blue)" : r.kind === "COMPUTE" ? "var(--green)" : r.kind === "SLO" ? "var(--gold)" : r.kind === "ACCESS" ? "var(--ink-2)" : r.kind === "MATCH" ? "var(--purple)" : "var(--coral)";
                return (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"80px 1fr 100px 90px", gap:14, padding:"13px 18px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, color:kc, letterSpacing:"0.5px", padding:"2px 7px", borderRadius:4, background: kc + "1a", textAlign:"center" }}>{r.kind}</span>
                    <div>
                      <div style={{ fontSize:13, color:"var(--ink)", marginBottom:3 }}>{r.title || r.label || r.id}</div>
                      <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{r.expr || (r.signals ? r.signals.map(function(sg){ return sg.field + "×" + sg.weight; }).join(" + ") : "—")}</code>
                    </div>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{r.severity || (r.strategy || "")}</span>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", textAlign:"right" }}>{r.last || "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === "Activity" && (
        <div className="card">
          <div className="card-head">Recent activity</div>
          <div>
            {activity.map(function(a, i, arr){
              return (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"100px 12px 1fr", gap:14, padding:"12px 18px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{a.t}</span>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:a.color, justifySelf:"center" }} />
                  <div style={{ fontSize:12.5, color:"var(--ink-2)" }}>
                    <span style={{ fontFamily:"JetBrains Mono", color:"var(--ink)", fontWeight:600 }}>{a.who}</span>
                    {" " + a.what}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CODE SNIPPET LIBRARY + TYPE INFERENCE ──────────────────────────────────
// Bundled snippets that come with the workspace. Names are concrete and
// memorable so users can recognise the shape they're after at a glance.
var SNIPPET_LIBRARY = [
  { id:"sf_account",          name:"salesforce_account",        lang:"JSON", tags:["CRM","SaaS"],
    body: '{\n  "Id": "0015g00000abcdef",\n  "Name": "Acme Corporation",\n  "AccountNumber": "AC-29104",\n  "Industry": "Manufacturing",\n  "AnnualRevenue": 48200000,\n  "NumberOfEmployees": 1240,\n  "Website": "https://acme.com",\n  "BillingCity": "Boston",\n  "BillingCountry": "USA",\n  "IsActive": true,\n  "CreatedDate": "2024-03-12T09:14:00Z",\n  "OwnerId": "00558000000aBcDE"\n}' },
  { id:"invoice_payload",     name:"invoice_payload",           lang:"JSON", tags:["Finance","NetSuite"],
    body: '{\n  "invoice_id": "INV-2025-00482",\n  "issued_at": "2025-08-14T12:00:00Z",\n  "due_date": "2025-09-13",\n  "vendor_name": "Northwind Logistics",\n  "currency": "USD",\n  "subtotal": 18420.50,\n  "tax_amount": 1473.64,\n  "total_amount": 19894.14,\n  "is_paid": false,\n  "po_number": "PO-77441"\n}' },
  { id:"support_ticket",      name:"support_ticket",            lang:"JSON", tags:["Support","Zendesk"],
    body: '{\n  "ticket_id": "ZD-118420",\n  "subject": "Cannot connect to API endpoint",\n  "priority": "high",\n  "status": "open",\n  "requester_email": "lia.bryan@northwind.com",\n  "assignee_id": "agt_4421",\n  "created_at": "2026-04-08T15:42:00Z",\n  "updated_at": "2026-04-08T16:14:00Z",\n  "tags": ["api", "auth", "p1"],\n  "satisfaction_score": null\n}' },
  { id:"employee_profile",    name:"employee_profile",          lang:"JSON", tags:["HR","Workday"],
    body: '{\n  "employee_id": "E-9921",\n  "first_name": "Morgan",\n  "last_name": "Lee",\n  "work_email": "morgan.lee@acme.com",\n  "department": "Data Platform",\n  "manager_id": "E-8814",\n  "hire_date": "2022-06-01",\n  "is_remote": true,\n  "annual_salary_usd": 168000,\n  "skills": ["python", "snowflake", "dbt"]\n}' },
  { id:"subscription_event",  name:"subscription_event",        lang:"JSON", tags:["Billing","Stripe"],
    body: '{\n  "event_id": "evt_1NaB2Cdef",\n  "event_type": "customer.subscription.updated",\n  "occurred_at": "2026-05-22T08:11:42Z",\n  "customer_id": "cus_R29YzZ",\n  "subscription_id": "sub_R49uvT",\n  "plan_code": "ENTERPRISE_PRO_MONTHLY",\n  "mrr_usd": 4200.00,\n  "seats": 42,\n  "is_trial": false\n}' },
  { id:"meeting_attendee",    name:"meeting_attendee",          lang:"JSON", tags:["Calendar","Ops"],
    body: '{\n  "meeting_id": "mtg_2026_q2_review",\n  "attendee_email": "ramin.k@acme.com",\n  "attendee_name": "Ramin Kazemi",\n  "response_status": "accepted",\n  "joined_at": "2026-05-15T14:02:18Z",\n  "left_at": "2026-05-15T14:58:04Z",\n  "is_organizer": false,\n  "device": "web"\n}' },
  { id:"payment_event",       name:"payment_event",             lang:"JSON", tags:["Finance","Stripe"],
    body: '{\n  "payment_id": "ch_3OvB9Z2eZv",\n  "amount_cents": 199414,\n  "currency": "USD",\n  "captured_at": "2025-09-13T10:08:00Z",\n  "card_brand": "visa",\n  "card_last4": "4242",\n  "is_refunded": false,\n  "customer_email": "ap@northwind.com"\n}' },
  { id:"incident_alert",      name:"incident_alert",            lang:"JSON", tags:["Ops","PagerDuty"],
    body: '{\n  "incident_id": "INC-998421",\n  "service": "snowflake-warehouse",\n  "severity": "SEV2",\n  "opened_at": "2026-05-19T03:14:00Z",\n  "acknowledged_at": "2026-05-19T03:16:42Z",\n  "resolved_at": null,\n  "page_count": 3,\n  "is_business_hours": false\n}' },
  { id:"contract_terms",      name:"contract_terms",            lang:"JSON", tags:["Legal","CLM"],
    body: '{\n  "contract_id": "MSA-2024-001",\n  "party_a": "Acme Corp",\n  "party_b": "Globex Industries",\n  "effective_date": "2024-04-01",\n  "expiry_date": "2027-03-31",\n  "total_value_usd": 1240000,\n  "auto_renews": true,\n  "governing_law": "Delaware",\n  "is_signed": true\n}' },
  { id:"product_catalog_xml", name:"product_catalog",           lang:"XML",  tags:["Commerce"],
    body: '<product>\n  <sku>SKU-90421</sku>\n  <name>Aero Pro 14"</name>\n  <category>Laptops</category>\n  <price_usd>1899.00</price_usd>\n  <weight_kg>1.4</weight_kg>\n  <in_stock>true</in_stock>\n  <released_at>2025-11-04</released_at>\n</product>' },
  { id:"purchase_order_xsd",  name:"purchase_order_schema",     lang:"XSD",  tags:["B2B","Procurement"],
    body: '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n  <xs:element name="purchase_order">\n    <xs:complexType>\n      <xs:sequence>\n        <xs:element name="po_number" type="xs:string"/>\n        <xs:element name="vendor_id" type="xs:string"/>\n        <xs:element name="order_date" type="xs:date"/>\n        <xs:element name="line_total" type="xs:decimal"/>\n        <xs:element name="is_approved" type="xs:boolean"/>\n      </xs:sequence>\n    </xs:complexType>\n  </xs:element>\n</xs:schema>' }
];

// Infer a property type from a JS value (post-JSON.parse).
function inferTypeFromValue(v, key) {
  if (v === null || v === undefined) return "string";
  if (typeof v === "boolean") return "bool";
  if (typeof v === "number") return Number.isInteger(v) ? "int" : "decimal";
  if (Array.isArray(v)) return "string[]";
  if (typeof v === "object") return "struct";
  if (typeof v === "string") {
    // Light heuristics: ISO timestamp / date / email / uuid
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return "timestamp";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return "date";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return "uuid";
    var lk = (key || "").toLowerCase();
    if (lk.endsWith("_id") || lk === "id") return "string"; // keep as string, mark PK candidate elsewhere
    return "string";
  }
  return "string";
}

// Strip // line comments and /* … */ block comments from a JSON-ish string
// while preserving strings. Lets the snippet editor accept commented JSON,
// which is how the 'from scratch' template teaches the schema.
function stripJsonComments(s) {
  var out = "";
  var i = 0, inStr = false, strCh = null;
  while (i < s.length) {
    var c = s[i], n = s[i+1];
    if (inStr) {
      if (c === '\\' && i+1 < s.length) { out += c + n; i += 2; continue; }
      if (c === strCh) inStr = false;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i+1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

// Strip JSON trailing commas (legal in commented templates, not in JSON.parse)
function stripTrailingCommas(s) { return s.replace(/,(\s*[\]}])/g, "$1"); }

// Extract a flat list of typed fields from a snippet body in any of the
// three supported languages. Returns [] when the parse fails; in that case
// the modal surfaces a parse error instead of pretending to find fields.
// JSON accepts two shapes:
//   - flat object → infer property name + type from each key/value pair
//   - array of objects with at least a {name, type} → use the rich schema
//     (so 'Start from scratch' templates can declare required, pk, pii, etc.)
function parseSnippetFields(body, lang) {
  var out = [];
  if (!body) return { fields:[], error:null };
  try {
    if (lang === "JSON") {
      var cleaned = stripTrailingCommas(stripJsonComments(body));
      var parsed = JSON.parse(cleaned);
      // Rich form: an array of explicit property definitions.
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return { fields:[], error:"Array is empty" };
        var bad = parsed.find(function(p){ return !p || typeof p !== "object" || !p.name; });
        if (bad) return { fields:[], error:"Each item needs at least a 'name' field" };
        parsed.forEach(function(p){
          // `name` is the human-readable label; `key` is the snake_case
          // identifier used in queries. If the snippet only gives one, we
          // derive the other so the preview always has both to show.
          var derivedKey = String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
          var key  = p.key  || derivedKey;
          var name = p.name || key;
          out.push({
            name:     name,
            key:      key,
            type:     p.type || "string",
            required: !!p.required,
            indexed:  !!p.indexed,
            unique:   !!p.unique,
            pii:      !!p.pii,
            pk:       !!p.pk,
            sample:   p.example != null ? String(p.example) : (p.description || "")
          });
        });
        return { fields:out, error:null };
      }
      // Flat object form: keys become property names, types inferred from values.
      if (!parsed || typeof parsed !== "object") {
        return { fields:[], error:"Top-level must be an object or array" };
      }
      Object.keys(parsed).forEach(function(k){
        var t = inferTypeFromValue(parsed[k], k);
        var sample = parsed[k];
        if (sample !== null && typeof sample === "object") sample = Array.isArray(sample) ? "[" + sample.length + " items]" : "{…}";
        out.push({ name:k, type:t, sample: sample === null ? "null" : String(sample) });
      });
      return { fields:out, error:null };
    }
    if (lang === "XML") {
      // Strip XML comments so the scratch template's annotation doesn't
      // confuse the element regex.
      var cleaned = body.replace(/<!--[\s\S]*?-->/g, "");
      var rootMatch = cleaned.match(/<([a-z_][\w-]*)[^>]*>([\s\S]*)<\/\1>/i);
      if (!rootMatch) return { fields:[], error:"No root element" };
      var rootName = rootMatch[1];
      var inner = rootMatch[2];
      // Helper: pull an attribute value out of an attribute string.
      function attr(s, k) {
        var m = s.match(new RegExp(k + '\\s*=\\s*"([^"]*)"', "i"));
        return m ? m[1] : null;
      }
      // Rich form: <properties><property name="…" key="…" type="…" …>desc</property></properties>
      if (/^properties$/i.test(rootName)) {
        var pRe = /<property\b([^>]*?)(?:\/>|>([\s\S]*?)<\/property>)/gi;
        var pm;
        while ((pm = pRe.exec(inner)) !== null) {
          var a = pm[1];
          var inside = (pm[2] || "").trim();
          var nm = attr(a, "name") || attr(a, "key") || "";
          var key = attr(a, "key") || nm.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
          var typ = attr(a, "type") || "string";
          out.push({
            name: nm,
            key:  key,
            type: typ,
            required: attr(a, "required") === "true",
            indexed:  attr(a, "indexed")  === "true",
            unique:   attr(a, "unique")   === "true",
            pii:      attr(a, "pii")      === "true",
            pk:       attr(a, "pk")       === "true",
            sample:   attr(a, "example") || (inside.length > 60 ? inside.slice(0, 60) + "…" : inside)
          });
        }
        if (out.length === 0) return { fields:[], error:"No <property> elements" };
        return { fields:out, error:null };
      }
      // Existing flat form — each child of root is a field, type inferred from inner text.
      var re = /<([a-z_][\w-]*)[^>]*>([\s\S]*?)<\/\1>/gi;
      var m;
      while ((m = re.exec(inner)) !== null) {
        var name = m[1];
        var text = m[2].trim();
        var t = "string";
        if (/^(true|false)$/i.test(text)) t = "bool";
        else if (/^-?\d+$/.test(text)) t = "int";
        else if (/^-?\d+\.\d+$/.test(text)) t = "decimal";
        else if (/^\d{4}-\d{2}-\d{2}T/.test(text)) t = "timestamp";
        else if (/^\d{4}-\d{2}-\d{2}$/.test(text)) t = "date";
        out.push({ name:name, type:t, sample:text.length > 30 ? text.slice(0, 30) + "…" : text });
      }
      return { fields:out, error: out.length === 0 ? "No child elements" : null };
    }
    if (lang === "XSD") {
      var cleanedXsd = body.replace(/<!--[\s\S]*?-->/g, "");
      // Capture each <xs:element …/> or <xs:element …>…</xs:element>
      // along with its attribute string so we can pull our custom metadata
      // attributes out alongside the standard name/type.
      var elRe = /<xs:element\b([^>]*?)(?:\/>|>([\s\S]*?)<\/xs:element>)/gi;
      var em;
      var mapType = { string:"string", int:"int", integer:"int", long:"int", decimal:"decimal", float:"float", double:"decimal", boolean:"bool", date:"date", datetime:"timestamp", time:"timestamp", anyuri:"string", "id":"uuid" };
      function xattr(s, k) {
        var m = s.match(new RegExp(k + '\\s*=\\s*"([^"]*)"', "i"));
        return m ? m[1] : null;
      }
      while ((em = elRe.exec(cleanedXsd)) !== null) {
        var atrs = em[1];
        var nestedRaw = em[2] || "";
        var key = xattr(atrs, "name");
        if (!key) continue;
        var tyRaw = xattr(atrs, "type");
        // Skip the container element that just declares the complex type
        // structure with no concrete xs: type and contains nested elements.
        if (!tyRaw && /<xs:(complexType|sequence|element)\b/.test(nestedRaw)) continue;
        var ty = (tyRaw || "string").replace(/^xs:/i, "").toLowerCase();
        var docMatch = nestedRaw.match(/<xs:documentation>([\s\S]*?)<\/xs:documentation>/i);
        out.push({
          name: xattr(atrs, "label") || key,
          key:  key,
          type: mapType[ty] || "string",
          required: xattr(atrs, "required") === "true",
          indexed:  xattr(atrs, "indexed")  === "true",
          unique:   xattr(atrs, "unique")   === "true",
          pii:      xattr(atrs, "pii")      === "true",
          pk:       xattr(atrs, "pk")       === "true",
          sample:   docMatch ? docMatch[1].trim() : ""
        });
      }
      return { fields:out, error: out.length === 0 ? "No <xs:element> nodes found" : null };
    }
  } catch (e) {
    return { fields:[], error: (e && e.message) || "Parse error" };
  }
  return { fields:[], error:null };
}

// JSON template shown when starting from scratch. Kept short on purpose:
// just the common fields, with optional ones listed in a one-line comment.
// name = human-readable label, key = snake_case identifier used in queries.
var SCRATCH_JSON_TEMPLATE = '// One object per property. Optional: unique, pk, default, format.\n\n[\n  {\n    "name": "Customer Email",\n    "key": "customer_email",\n    "type": "string",\n    "description": "Primary email used for transactional messages.",\n    "required": true,\n    "indexed": true,\n    "pii": true\n  }\n]';
// XML schema-declaration template. Each <property> is one field.
// Optional attrs (added inline) carry the same metadata as the JSON form.
var SCRATCH_XML_TEMPLATE = '<!-- One <property> per field. Optional attrs: unique, pk, default, format, example. -->\n<properties>\n  <property name="Customer Email"\n            key="customer_email"\n            type="string"\n            required="true"\n            indexed="true"\n            pii="true">\n    Primary email used for transactional messages.\n  </property>\n</properties>';

// XSD template. Each <xs:element> is one field. Custom attrs (label,
// required, indexed, pii) carry the workspace's metadata alongside
// the standard XSD type attribute. <xs:documentation> holds the
// description.
var SCRATCH_XSD_TEMPLATE = '<!-- One <xs:element> per property. Use the label attr for the display\n     name; required / indexed / pii / unique / pk for flags. -->\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n  <xs:element name="customer_email"\n              type="xs:string"\n              label="Customer Email"\n              required="true"\n              indexed="true"\n              pii="true">\n    <xs:annotation>\n      <xs:documentation>Primary email used for transactional messages.</xs:documentation>\n    </xs:annotation>\n  </xs:element>\n</xs:schema>';

function CodeSnippetFlow({ node, onClose }) {
  var [pickedId, setPickedId]   = useState(null);             // null → "from scratch"
  var [body, setBody]           = useState(SCRATCH_JSON_TEMPLATE);
  var [lang, setLang]           = useState("JSON");
  var [search, setSearch]       = useState("");
  var [saveAs, setSaveAs]       = useState(false);
  var [saveName, setSaveName]   = useState("");
  var [langOpen, setLangOpen]   = useState(false);

  var TYPE_GLYPH = { uuid:{ g:"ID", c:"#8a7340" }, string:{ g:"T", c:"var(--blue)" }, "string[]":{ g:"[T]", c:"var(--blue)" }, decimal:{ g:"#", c:"var(--gold)" }, float:{ g:".5", c:"var(--gold)" }, bool:{ g:"01", c:"var(--coral)" }, timestamp:{ g:"TS", c:"var(--green)" }, date:{ g:"DT", c:"var(--green)" }, datetime:{ g:"DT", c:"var(--green)" }, enum:{ g:"E", c:"#8a7340" }, struct:{ g:"{}", c:"var(--ink-3)" }, int:{ g:"#", c:"var(--gold)" } };

  function templateFor(L) {
    if (L === "JSON") return SCRATCH_JSON_TEMPLATE;
    if (L === "XML")  return SCRATCH_XML_TEMPLATE;
    return SCRATCH_XSD_TEMPLATE;
  }

  function pickSnippet(s) {
    setPickedId(s.id);
    setBody(s.body);
    setLang(s.lang);
  }
  function startFresh() {
    setPickedId(null);
    setBody(templateFor("JSON"));
    setLang("JSON");
  }

  var parsed = parseSnippetFields(body, lang);
  var fields = parsed.fields;
  var parseError = parsed.error;
  var picked = SNIPPET_LIBRARY.find(function(s){ return s.id === pickedId; });
  var docTitle = picked ? picked.name : "New snippet";
  var lineCount = (body.match(/\n/g) || []).length + 1;
  var lineNumbers = [];
  for (var i = 1; i <= lineCount; i++) lineNumbers.push(i);

  var filteredLib = SNIPPET_LIBRARY.filter(function(s){
    if (!search) return true;
    var hay = (s.name + " " + s.tags.join(" ")).toLowerCase();
    return hay.indexOf(search.toLowerCase()) >= 0;
  });

  // Soft syntax highlight using a placeholder pipeline: tokenize the
  // escaped source into segments with assigned classes, then render. This
  // avoids the trap of re-matching span attributes we just inserted.
  function highlight(text, language) {
    var esc = function(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
    var src = text || "";
    var tokens = [];
    function push(t, color) { tokens.push({ t:t, c:color || null }); }
    var i = 0;
    if (language === "JSON") {
      // very small JSON tokenizer
      var re = /"(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?/g;
      var m, last = 0;
      while ((m = re.exec(src)) !== null) {
        if (m.index > last) push(src.slice(last, m.index), null);
        var tok = m[0];
        var color = null;
        if (tok[0] === '"') {
          // Is this a key (followed by colon) or a value?
          var rest = src.slice(m.index + tok.length).match(/^\s*:/);
          color = rest ? "#7048a3" : "#137333";
        } else if (/^(true|false|null)$/.test(tok)) {
          color = "#b3261e";
        } else {
          color = "#137333";
        }
        push(tok, color);
        last = m.index + tok.length;
      }
      if (last < src.length) push(src.slice(last), null);
    } else if (language === "XML" || language === "XSD") {
      // Walk the string, recognising tag-name tokens after < or </
      var re2 = /(&lt;\/?)|([a-z_][\w:-]*)|("[^"]*")|([=>])|(\s+)|([^\s<>=&]+)/gi;
      // Simpler: split into runs and color tag names, strings, equals
      var pos = 0;
      // Use a state machine: inside-tag vs outside-tag
      var inTag = false;
      var seenTagName = false;
      var re3 = /<\/?|>|"(?:[^"\\]|\\.)*"|[a-zA-Z_][\w:-]*|=|\s+|[^<>="\s]+/g;
      var mm;
      while ((mm = re3.exec(src)) !== null) {
        var tt = mm[0];
        var color2 = null;
        if (tt === "<" || tt === "</") { inTag = true; seenTagName = false; color2 = null; }
        else if (tt === ">") { inTag = false; seenTagName = false; color2 = null; }
        else if (inTag && /^[a-zA-Z_][\w:-]*$/.test(tt)) {
          if (!seenTagName) { color2 = "#7048a3"; seenTagName = true; }
          else { color2 = "#b3261e"; } // attribute name
        }
        else if (inTag && tt[0] === '"') { color2 = "#137333"; }
        push(tt, color2);
      }
    } else {
      push(src, null);
    }
    return tokens.map(function(tok){
      var safe = esc(tok.t);
      return tok.c ? '<span style="color:' + tok.c + '">' + safe + '</span>' : safe;
    }).join("");
  }

  var canUse = fields.length > 0 && !parseError;

  // The 100% wide editor needs both a textarea (for input) and a div
  // overlay (for the syntax-highlight rendering). Both share the same
  // metrics so the caret aligns with the rendered characters.
  var editorFont = '"JetBrains Mono", monospace';
  var editorSize = 12.5;
  var editorLine = 1.55;

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.42)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"94vw", maxWidth:1240, height:"86vh", background:"var(--bg-canvas)", borderRadius:14, border:"1px solid var(--line)", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.32)" }}>

        {/* HEADER */}
        <div style={{ flexShrink:0, padding:"16px 22px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ width:34, height:34, borderRadius:8, background:"var(--chip)", color:"#8a7340", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700 }}>{"{ }"}</span>
            <div style={{ fontFamily:"Instrument Serif", fontSize:22, color:"var(--ink)" }}>Use code snippet</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:15, color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* BODY — 3 columns: library | editor | preview */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"260px minmax(0, 1fr) 320px", minHeight:0 }}>

          {/* LIBRARY */}
          <div style={{ background:"var(--panel-2)", borderRight:"1px solid var(--line)", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
            <button onClick={startFresh}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, fontFamily:"inherit", textAlign:"left", cursor:"pointer",
                       border:"1px solid " + (pickedId === null ? "#8a7340" : "var(--line)"),
                       background: pickedId === null ? "var(--chip)" : "var(--panel)",
                       color: pickedId === null ? "#8a7340" : "var(--ink)" }}>
              <span style={{ width:22, height:22, borderRadius:5, background: pickedId === null ? "#8a7340" : "var(--chip)", color: pickedId === null ? "#fff" : "var(--ink-2)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </span>
              <div style={{ fontSize:13, fontWeight:600 }}>Start from scratch</div>
            </button>

            <div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.6px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:8, padding:"0 2px" }}>Use existing snippet</div>
              <div style={{ position:"relative", marginBottom:8 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", pointerEvents:"none" }}>
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input value={search} onChange={function(e){ setSearch(e.target.value); }} placeholder="Search" style={{ width:"100%", boxSizing:"border-box", padding:"7px 10px 7px 28px", border:"1px solid var(--line)", borderRadius:7, fontFamily:"inherit", fontSize:12.5, color:"var(--ink)", background:"var(--panel)", outline:"none" }} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                {filteredLib.map(function(s){
                  var on = pickedId === s.id;
                  return (
                    <button key={s.id} onClick={function(){ pickSnippet(s); }}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:6, fontFamily:"inherit", textAlign:"left", cursor:"pointer", border:"1px solid " + (on ? "var(--line)" : "transparent"), background: on ? "var(--panel)" : "transparent" }}
                      onMouseEnter={function(e){ if (!on) e.currentTarget.style.background = "var(--panel)"; }}
                      onMouseLeave={function(e){ if (!on) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink)", fontWeight: on ? 600 : 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                      </div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:4, background: s.lang === "JSON" ? "var(--chip)" : s.lang === "XML" ? "var(--blue-fill)" : "var(--gold-fill)", color: s.lang === "JSON" ? "#8a7340" : s.lang === "XML" ? "var(--blue)" : "var(--gold)", fontWeight:700, letterSpacing:"0.5px", flexShrink:0 }}>{s.lang}</span>
                    </button>
                  );
                })}
                {filteredLib.length === 0 && (
                  <div style={{ padding:"16px 8px", textAlign:"center", color:"var(--ink-4)", fontSize:11.5, fontFamily:"JetBrains Mono" }}>No matches</div>
                )}
              </div>
            </div>
          </div>

          {/* EDITOR */}
          <div style={{ display:"flex", flexDirection:"column", minWidth:0, padding:"18px 22px", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <span style={{ fontFamily:"Instrument Serif", fontSize:20, color:"var(--ink)" }}>{docTitle}</span>
                {picked && <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase" }}>FROM LIBRARY</span>}
              </div>
              {/* Language pill — segmented, click to switch */}
              <div style={{ display:"flex", gap:2, padding:2, border:"1px solid var(--line)", borderRadius:7, background:"var(--panel)" }}>
                {["JSON","XML","XSD"].map(function(L){
                  var on = lang === L;
                  return (
                    <button key={L} onClick={function(){ setLang(L); if (!picked) { setBody(templateFor(L)); } }}
                      style={{ padding:"4px 11px", border:"none", borderRadius:5, fontFamily:"JetBrains Mono", fontSize:11, fontWeight:600, cursor:"pointer",
                               background: on ? "var(--ink)" : "transparent",
                               color: on ? "var(--bg-canvas)" : "var(--ink-2)" }}>{L}</button>
                  );
                })}
              </div>
            </div>

            {/* Code editor */}
            <div style={{ flex:1, minHeight:0, position:"relative", border:"1px solid var(--line)", borderRadius:10, background:"var(--panel)", boxShadow:"0 1px 0 var(--line-2)", overflow:"hidden", display:"flex" }}>
              {/* gutter */}
              <div aria-hidden="true" style={{ flexShrink:0, width:44, padding:"12px 0", background:"var(--panel-2)", borderRight:"1px solid var(--line-2)", fontFamily:editorFont, fontSize:editorSize, lineHeight:editorLine, color:"var(--ink-4)", textAlign:"right", userSelect:"none" }}>
                {lineNumbers.map(function(n){ return <div key={n} style={{ padding:"0 10px 0 0" }}>{n}</div>; })}
              </div>
              {/* code area: highlight overlay + invisible textarea */}
              <div style={{ flex:1, minWidth:0, position:"relative", overflow:"auto" }}>
                <pre aria-hidden="true"
                  style={{ position:"absolute", top:0, left:0, right:0, bottom:0, margin:0, padding:"12px 14px", fontFamily:editorFont, fontSize:editorSize, lineHeight:editorLine, color:"var(--ink)", pointerEvents:"none", whiteSpace:"pre-wrap", wordBreak:"break-word" }}
                  dangerouslySetInnerHTML={{ __html: highlight(body, lang) + "\n" }} />
                <textarea
                  value={body}
                  onChange={function(e){ setBody(e.target.value); }}
                  spellCheck={false}
                  style={{ position:"relative", display:"block", width:"100%", minHeight:"100%", padding:"12px 14px", boxSizing:"border-box", border:"none", outline:"none", resize:"none", background:"transparent", color:"transparent", caretColor:"var(--ink)", fontFamily:editorFont, fontSize:editorSize, lineHeight:editorLine, whiteSpace:"pre-wrap", wordBreak:"break-word", overflow:"hidden" }} />
              </div>
            </div>

            {/* Save-as toggle */}
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)" }}>
              <label style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer", flexShrink:0 }}>
                <input type="checkbox" checked={saveAs} onChange={function(e){ setSaveAs(e.target.checked); }} style={{ width:15, height:15, accentColor:"#8a7340" }} />
                <div>
                  <div style={{ fontSize:12.5, color:"var(--ink)", fontWeight:500 }}>Save as a new snippet</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:2 }}>Save this {lang} snippet to the library for re-use</div>
                </div>
              </label>
              <input
                value={saveName}
                onChange={function(e){ setSaveName(e.target.value); }}
                disabled={!saveAs}
                placeholder="snippet_name"
                style={{ marginLeft:"auto", width:280, padding:"7px 10px", border:"1px solid var(--line)", borderRadius:6, fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink)", background: saveAs ? "var(--panel)" : "var(--chip)", outline:"none", opacity: saveAs ? 1 : 0.5 }} />
            </div>
          </div>

          {/* PREVIEW */}
          <div style={{ background:"var(--panel-2)", borderLeft:"1px solid var(--line)", padding:"18px 16px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
            <div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.6px", color:"var(--ink-3)", textTransform:"uppercase" }}>Will create</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:7, marginTop:2 }}>
                <span style={{ fontFamily:"Instrument Serif", fontSize:30, color: fields.length > 0 ? "var(--ink)" : "var(--ink-4)", lineHeight:1 }}>{fields.length}</span>
                <span style={{ fontSize:13, color:"var(--ink-3)" }}>{fields.length === 1 ? "property" : "properties"}</span>
              </div>
            </div>

            {parseError && (
              <div style={{ padding:"10px 11px", border:"1px solid var(--coral)", background:"var(--coral-fill)", borderRadius:7 }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", textTransform:"uppercase", color:"var(--coral)", fontWeight:700 }}>Parse error</div>
                <div style={{ fontSize:11.5, color:"var(--coral)", marginTop:3 }}>{parseError}</div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:4 }}>
              {fields.map(function(f, i){
                var tg = TYPE_GLYPH[f.type] || TYPE_GLYPH.string;
                function flagPill(label, color, bg) {
                  return <span key={label} title={label} style={{ fontFamily:"JetBrains Mono", fontSize:8, padding:"1px 4px", borderRadius:3, background:bg, color:color, fontWeight:700, letterSpacing:"0.4px", lineHeight:1.3 }}>{label}</span>;
                }
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", border:"1px solid var(--line-2)", borderRadius:7, background:"var(--panel)" }}>
                    <span style={{ minWidth:22, height:16, padding:"0 5px", borderRadius:3, background:tg.c, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, letterSpacing:"0.3px", flexShrink:0 }}>{tg.g}</span>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                        <span style={{ fontSize:11.5, color:"var(--ink)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                        {f.key && f.key !== f.name && (
                          <code style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"1px 5px", borderRadius:3, background:"var(--chip)", color:"var(--ink-3)", lineHeight:1.3 }}>{f.key}</code>
                        )}
                        {f.pk       && flagPill("PK",  "var(--green)",  "var(--green-fill)")}
                        {f.required && flagPill("REQ", "var(--coral)",  "var(--coral-fill)")}
                        {f.indexed  && flagPill("IDX", "var(--blue)",   "var(--blue-fill)")}
                        {f.unique   && flagPill("UNQ", "#8a7340", "var(--chip)")}
                        {f.pii      && flagPill("PII", "var(--ink-2)",  "var(--chip)")}
                      </div>
                      {f.sample && <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-4)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.sample}</div>}
                    </div>
                  </div>
                );
              })}
              {fields.length === 0 && !parseError && (
                <div style={{ padding:"22px 10px", textAlign:"center", color:"var(--ink-4)", fontSize:11.5, fontFamily:"JetBrains Mono", lineHeight:1.5 }}>Properties detected from the snippet will show up here.</div>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{ flexShrink:0, padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>
            {parseError ? <span style={{ color:"var(--coral)" }}>{parseError}</span> : (fields.length > 0 ? fields.length + " " + (fields.length === 1 ? "property" : "properties") + " will be added" : "Pick or paste a snippet to begin")}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-dark" disabled={!canUse} onClick={onClose} style={{ opacity: canUse ? 1 : 0.45 }}>{canUse ? "Add " + fields.length + " " + (fields.length === 1 ? "property" : "properties") + " ↵" : "Use"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROPERTIES SETTINGS DRAWER ─────────────────────────────────────────────
// Right-side drawer with object-level settings: storage / retention,
// automatic + custom indices, monitoring toggles, access control, versioning.

// Small reusable toggle switch — pill with sliding knob.
function ToggleSwitch({ on, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={function(){ if (!disabled && onToggle) onToggle(!on); }}
      role="switch"
      aria-checked={on}
      disabled={disabled}
      style={{
        flexShrink:0,
        width:36, height:20, padding:0, border:"none",
        borderRadius:999,
        position:"relative",
        cursor: disabled ? "not-allowed" : "pointer",
        background: on ? "var(--ink)" : "var(--line)",
        opacity: disabled ? 0.4 : 1,
        transition:"background 140ms ease"
      }}
    >
      <span aria-hidden="true" style={{
        position:"absolute", top:2, left: on ? 18 : 2,
        width:16, height:16, borderRadius:"50%",
        background:"#fff",
        boxShadow:"0 1px 2px rgba(0,0,0,0.22)",
        transition:"left 140ms ease"
      }} />
    </button>
  );
}

// Row used inside a setting card: label + description on the left,
// control on the right. Multiple of these stack inside one card with a
// hairline separator between them.
function SettingRow({ label, hint, control, last }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:18, padding:"14px 16px", borderBottom: last ? "none" : "1px solid var(--line-2)" }}>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontSize:13.5, color:"var(--ink)", fontWeight:500 }}>{label}</div>
        {hint && <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{control}</div>
    </div>
  );
}

// Section header above a setting card.
function SettingSection({ title, hint, children, action }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14, padding:"0 2px" }}>
        <div>
          <div style={{ fontSize:14, color:"var(--ink)", fontWeight:600 }}>{title}</div>
          {hint && <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:3, lineHeight:1.5, maxWidth:520 }}>{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddCustomIndexDialog({ node, fieldOptions, onCancel, onSave, initial }) {
  var [name, setName]     = useState((initial && initial.name) || "index_1");
  var [fields, setFields] = useState((initial && initial.fields && initial.fields.length) ? initial.fields : [{ field:"", dir:"desc" }, { field:"", dir:"desc" }]);

  function update(i, key, value) {
    setFields(function(arr){ return arr.map(function(f, idx){ if (idx !== i) return f; var n = Object.assign({}, f); n[key] = value; return n; }); });
  }
  function add() { setFields(function(arr){ return arr.concat([{ field:"", dir:"desc" }]); }); }
  function remove(i) { setFields(function(arr){ return arr.filter(function(_, idx){ return idx !== i; }); }); }

  var canSave = !!name.trim() && fields.some(function(f){ return f.field; });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.42)", zIndex:260, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ width:520, maxWidth:"94vw", background:"var(--bg-canvas)", border:"1px solid var(--line)", borderRadius:12, boxShadow:"0 28px 70px rgba(0,0,0,0.28)", overflow:"hidden" }}>
        <div style={{ padding:"18px 22px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <span style={{ width:32, height:32, borderRadius:7, background:"var(--purple-fill)", color:"var(--purple)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="m13.5 16.5 2 2"/></svg>
            </span>
            <div style={{ fontSize:16, fontWeight:600, color:"var(--ink)" }}>{initial ? "Edit Custom Index" : "Add Custom Index"}</div>
          </div>
          <button onClick={onCancel} style={{ width:28, height:28, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:13, color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"20px 22px 18px", display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <label style={{ display:"block", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:7 }}>Index Name <span style={{ color:"var(--coral)" }}>*</span></label>
            <input value={name} onChange={function(e){ setName(e.target.value); }}
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px", border:"1px solid var(--line)", borderRadius:8, fontFamily:"JetBrains Mono", fontSize:13, color:"var(--ink)", background:"var(--panel)", outline:"none", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}
              onFocus={function(e){ e.currentTarget.style.borderColor = "var(--ink)"; }}
              onBlur={function(e){ e.currentTarget.style.borderColor = "var(--line)"; }} />
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <label style={{ display:"block", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase" }}>Fields <span style={{ color:"var(--coral)" }}>*</span></label>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>{fields.filter(function(f){ return f.field; }).length} of {fields.length} set</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {fields.map(function(f, i){
                return (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"18px 1fr 150px 30px", gap:8, alignItems:"center" }}>
                    <span aria-hidden="true" title="Drag to reorder" style={{ color:"var(--ink-4)", cursor:"grab", display:"inline-flex", justifyContent:"center" }}>
                      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="2" cy="3" r="1"/><circle cx="8" cy="3" r="1"/><circle cx="2" cy="7" r="1"/><circle cx="8" cy="7" r="1"/><circle cx="2" cy="11" r="1"/><circle cx="8" cy="11" r="1"/></svg>
                    </span>
                    <RichSelect
                      value={f.field}
                      onChange={function(v){ update(i, "field", v); }}
                      options={[{ value:"", label:"Select field" }].concat(fieldOptions.map(function(o){ return { value:o, label:o }; }))}
                      placeholder="Select field"
                      mono
                    />
                    <RichSelect
                      value={f.dir}
                      onChange={function(v){ update(i, "dir", v); }}
                      options={[{ value:"asc", label:"Ascending" }, { value:"desc", label:"Descending" }]}
                      placeholder="Order"
                    />
                    <button onClick={function(){ remove(i); }} disabled={fields.length === 1}
                      style={{ width:30, height:30, padding:0, border:"1px solid transparent", borderRadius:6, background:"transparent", color:"var(--ink-3)", cursor: fields.length === 1 ? "not-allowed" : "pointer", opacity: fields.length === 1 ? 0.3 : 0.8, display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"background 100ms" }}
                      onMouseEnter={function(e){ if (fields.length > 1) { e.currentTarget.style.background = "var(--chip)"; e.currentTarget.style.color = "var(--coral)"; } }}
                      onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-3)"; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={add} style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, padding:"7px 12px", border:"1px dashed var(--line)", borderRadius:7, background:"transparent", color:"var(--ink-2)", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:500 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add field
            </button>
          </div>
        </div>

        <div style={{ padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", justifyContent:"flex-end", gap:9, background:"var(--panel)" }}>
          <button onClick={onCancel} style={{ padding:"8px 18px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)", color:"var(--ink)", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:500 }}>Cancel</button>
          <button onClick={function(){ if (canSave) onSave({ name: name.trim(), fields: fields.filter(function(f){ return f.field; }) }); }} disabled={!canSave}
            style={{ padding:"8px 20px", border:"none", borderRadius:8, background: canSave ? "var(--purple)" : "var(--line)", color: canSave ? "#fff" : "var(--ink-3)", cursor: canSave ? "pointer" : "not-allowed", fontSize:13, fontFamily:"inherit", fontWeight:600 }}>
            {initial ? "Save Index" : "Add Index"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── PROPERTIES SETTINGS MODAL ──────────────────────────────────────────────
// Centered modal with a left-rail nav for jumping between sections. Each
// section is shaped around its actual use-case instead of stacking toggle
// rows together.
function PropertiesSettingsModal({ node, properties, onClose }) {
  // STORAGE / LIFECYCLE — storage backend is fixed at object-creation time
  // (changing engines on a live table is destructive), so it's view-only.
  var storage = "json";
  var [retention, setRetention]   = useState("90d");
  var [customRetention, setCustomRetention] = useState({ amount:"180", unit:"days" });

  // PERFORMANCE / INDICES — auto indices derive live from PK/UNQ fields,
  // custom indices live in local state and merge into one display table.
  var autoIndices = (properties || [])
    .filter(function(p){ return p.pk || p.unique; })
    .map(function(p){ return { name: (p.pk ? "PK_" : "UNQ_") + p.name, kind: p.pk ? "Primary" : "Unique", fields:[{ field:p.name, dir:"asc" }] }; });
  if (autoIndices.length === 0) autoIndices = [{ name:"PK_id", kind:"Primary", fields:[{ field:"id", dir:"asc" }] }];
  var [customIndices, setCustomIndices] = useState([]);
  var [addIndexOpen, setAddIndexOpen]   = useState(false);
  var [editIndex, setEditIndex]         = useState(null);

  // OBSERVABILITY
  var [audit, setAudit]         = useState(false);
  var [activity, setActivity]   = useState(true);
  var [reporting, setReporting] = useState(false);

  // INTEGRATIONS & QUERY
  var [webhook, setWebhook]             = useState(false);
  var [webhookUrl, setWebhookUrl]       = useState("");
  var [webhookEvents, setWebhookEvents] = useState({ create:true, update:true, delete:false });
  var [distinctFilter, setDistinctFilter] = useState(false);

  // ACCESS
  var [externalAccess, setExternalAccess] = useState(false);
  var [globalAccess, setGlobalAccess]     = useState(false);

  // VERSIONING
  var [versioning, setVersioning] = useState(true);
  var [deployable, setDeployable] = useState(false);

  // Section nav
  var [section, setSection] = useState("storage");

  var fieldOptions = (properties || []).map(function(p){ return p.name; });

  var sectionCounts = {
    storage:       (retention !== "indefinite" ? 1 : 0),
    performance:   customIndices.length,
    observability: (audit ? 1 : 0) + (activity ? 1 : 0) + (reporting ? 1 : 0),
    integrations:  (webhook ? 1 : 0) + (distinctFilter ? 1 : 0),
    access:        (externalAccess ? 1 : 0) + (globalAccess ? 1 : 0),
    versioning:    (versioning ? 1 : 0) + (deployable ? 1 : 0)
  };

  var SECTIONS = [
    { id:"storage",       title:"Storage",       desc:"Where data lives and how long it's kept",
      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg> },
    { id:"performance",   title:"Performance",   desc:"Indices that speed up queries",
      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/></svg> },
    { id:"observability", title:"Observability", desc:"Audit, activity, reporting",
      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id:"integrations",  title:"Integrations",  desc:"Webhook and query options",
      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { id:"access",        title:"Access",        desc:"Who can see and use this object",
      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { id:"versioning",    title:"Versioning",    desc:"History and deployable copies",
      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="10"/></svg> }
  ];

  var inp = { width:"100%", boxSizing:"border-box", padding:"9px 12px", border:"1px solid var(--line)", borderRadius:8, fontSize:13, color:"var(--ink)", background:"var(--panel)", outline:"none", fontFamily:"inherit" };

  function SettingItem({ title, desc, control, expansion, warn }) {
    return (
      <div style={{ border:"1px solid var(--line)", borderRadius:10, background:"var(--panel)", boxShadow:"0 1px 0 var(--line-2)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"15px 16px" }}>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{title}</div>
            {desc && <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:4, lineHeight:1.5 }}>{desc}</div>}
          </div>
          <div style={{ flexShrink:0, marginTop:2 }}>{control}</div>
        </div>
        {warn && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"10px 16px", background:"var(--gold-fill)", borderTop:"1px solid var(--line-2)" }}>
            <span style={{ width:18, height:18, borderRadius:4, background:"var(--gold)", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none"/></svg>
            </span>
            <div style={{ fontSize:11.5, color:"var(--ink-2)", lineHeight:1.5 }}>{warn}</div>
          </div>
        )}
        {expansion && (
          <div style={{ padding:"14px 16px 16px 16px", borderTop:"1px solid var(--line-2)", background:"var(--panel-2)" }}>
            {expansion}
          </div>
        )}
      </div>
    );
  }

  var STORAGE_TILES = [
    { id:"json",       l:"JSON Store",         d:"Schemaless. Best for evolving shapes and small to medium volumes." },
    { id:"columnar",   l:"Columnar (Parquet)", d:"Best for analytical scans across many records." },
    { id:"timeseries", l:"Time-series",        d:"Optimised for append-heavy, time-ordered workloads." },
    { id:"object",     l:"Object (Blob)",      d:"For large binary records; metadata indexed separately." }
  ];
  var RETENTION_PRESETS = [
    { v:"7d",   l:"7 days"   },
    { v:"30d",  l:"30 days"  },
    { v:"90d",  l:"90 days"  },
    { v:"365d", l:"1 year"   },
    { v:"indefinite", l:"Forever" },
    { v:"custom", l:"Custom" }
  ];


  function renderSection() {
    if (section === "storage") {
      var activeTile = STORAGE_TILES.find(function(t){ return t.id === storage; });
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:11.5, fontWeight:600, color:"var(--ink-3)", letterSpacing:"0.4px", textTransform:"uppercase", fontFamily:"JetBrains Mono" }}>Storage backend</div>
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", color:"var(--ink-3)", padding:"3px 8px", borderRadius:4, background:"var(--chip)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                View only
              </span>
            </div>
            <div style={{ border:"1px solid var(--line)", borderRadius:10, background:"var(--panel)", padding:"14px 16px", boxShadow:"0 1px 0 var(--line-2)", display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ width:38, height:38, borderRadius:8, background:"var(--purple-fill)", color:"var(--purple)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg>
              </span>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{activeTile.l}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.5 }}>{activeTile.d}</div>
              </div>
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6, lineHeight:1.5 }}>Storage backend is fixed when the node is created. Migrate via a new node if a different engine is needed.</div>
          </div>
          <div>
            <div style={{ fontSize:11.5, fontWeight:600, color:"var(--ink-3)", letterSpacing:"0.4px", textTransform:"uppercase", marginBottom:10, fontFamily:"JetBrains Mono" }}>Retention</div>
            <div style={{ border:"1px solid var(--line)", borderRadius:10, background:"var(--panel)", padding:"14px 16px", boxShadow:"0 1px 0 var(--line-2)" }}>
              <div style={{ fontSize:13, color:"var(--ink)", fontWeight:500, marginBottom:4 }}>How long should records be kept?</div>
              <div style={{ fontSize:11.5, color:"var(--ink-3)", marginBottom:11, lineHeight:1.5 }}>Records past this age are archived to cold storage and removed from the live object.</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {RETENTION_PRESETS.map(function(r){
                  var on = retention === r.v;
                  return (
                    <button key={r.v} onClick={function(){ setRetention(r.v); }} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid " + (on ? "var(--ink)" : "var(--line)"), background: on ? "var(--ink)" : "var(--panel)", color: on ? "var(--bg-canvas)" : "var(--ink-2)", fontFamily:"JetBrains Mono", fontSize:11.5, fontWeight:600, cursor:"pointer" }}>{r.l}</button>
                  );
                })}
              </div>
              {retention === "custom" && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:"1px dashed var(--line-2)" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--ink-2)", marginBottom:8 }}>Custom retention</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                    <input value={customRetention.amount} onChange={function(e){ setCustomRetention(Object.assign({}, customRetention, { amount:e.target.value })); }} placeholder="180"
                      style={{ width:120, padding:"8px 11px", border:"1px solid var(--line)", borderRadius:7, fontFamily:"JetBrains Mono", fontSize:13, color:"var(--ink)", background:"var(--panel)", outline:"none", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)", boxSizing:"border-box" }} />
                    <div style={{ width:170 }}>
                      <RichSelect
                        value={customRetention.unit}
                        onChange={function(v){ setCustomRetention(Object.assign({}, customRetention, { unit:v })); }}
                        options={[
                          { value:"hours", label:"Hours" },
                          { value:"days", label:"Days" },
                          { value:"weeks", label:"Weeks" },
                          { value:"months", label:"Months" },
                          { value:"years", label:"Years" }
                        ]}
                      />
                    </div>
                  </div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", lineHeight:1.5 }}>Tip: use the rule editor on Governance for conditional rules — e.g. keep records longer when status = "open".</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (section === "performance") {
      var rows = autoIndices.map(function(ix){ return { source:"auto",   name:ix.name, kind:ix.kind, fields:ix.fields }; })
                 .concat(customIndices.map(function(ix){ return { source:"custom", name:ix.name, kind:"Custom",  fields:ix.fields }; }));
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"11px 13px", background:"var(--purple-fill)", borderRadius:8 }}>
            <span style={{ width:18, height:18, borderRadius:4, background:"var(--purple)", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none"/></svg>
            </span>
            <div style={{ fontSize:12, color:"var(--ink-2)", lineHeight:1.5 }}>Primary and unique fields are indexed automatically. Add custom indices for the queries you run often — composite filters, sort-and-paginate, range scans.</div>
          </div>
          <div style={{ border:"1px solid var(--line)", borderRadius:10, background:"var(--panel)", overflow:"hidden", boxShadow:"0 1px 0 var(--line-2)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1.4fr 36px", gap:0, background:"var(--panel-2)", padding:"9px 14px", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.55px", color:"var(--ink-3)", textTransform:"uppercase", borderBottom:"1px solid var(--line-2)" }}>
              <div>Name</div><div>Type</div><div>Fields</div><div/>
            </div>
            {rows.map(function(ix, i){
              var typeColor = ix.kind === "Primary" ? "var(--green)" : ix.kind === "Unique" ? "var(--blue)" : "var(--purple)";
              var typeBg    = ix.kind === "Primary" ? "var(--green-fill)" : ix.kind === "Unique" ? "var(--blue-fill)" : "var(--purple-fill)";
              return (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 1.4fr 36px", gap:0, padding:"11px 14px", alignItems:"center", borderBottom: i < rows.length - 1 ? "1px solid var(--line-2)" : "none", cursor: ix.source === "custom" ? "pointer" : "default" }}
                  onClick={ix.source === "custom" ? function(){ var cIdx = customIndices.findIndex(function(c){ return c.name === ix.name; }); setEditIndex({ idx:cIdx, name:ix.name, fields:ix.fields }); setAddIndexOpen(true); } : undefined}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:12.5, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ix.name}</span>
                    {ix.source === "auto" && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 5px", borderRadius:3, background:"var(--chip)", color:"var(--ink-3)", fontWeight:700, letterSpacing:"0.4px" }}>AUTO</span>}
                  </div>
                  <div><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:5, fontSize:10.5, fontWeight:600, background:typeBg, color:typeColor }}>{ix.kind}</span></div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {ix.fields.map(function(f, j){
                      var name = typeof f === "string" ? f : f.field;
                      var dir = typeof f === "object" ? f.dir : null;
                      return <span key={j} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 7px", borderRadius:4, background:"var(--chip)", border:"1px solid var(--line-2)", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-2)" }}>{name}{dir && <span style={{ color:"var(--ink-4)", fontSize:9 }}>{dir.toUpperCase()}</span>}</span>;
                    })}
                  </div>
                  {ix.source === "custom" ? (
                    <button onClick={function(e){ e.stopPropagation(); setCustomIndices(function(arr){ return arr.filter(function(c){ return c.name !== ix.name; }); }); }} style={{ width:28, height:28, padding:0, border:"none", background:"transparent", color:"var(--ink-3)", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  ) : <span title="Auto-managed" style={{ color:"var(--ink-4)", display:"inline-flex", justifyContent:"center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>}
                </div>
              );
            })}
            <button onClick={function(){ setEditIndex(null); setAddIndexOpen(true); }}
              style={{ width:"100%", padding:"12px", border:"none", borderTop:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink-2)", cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:500, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add custom index
            </button>
          </div>
        </div>
      );
    }

    if (section === "observability") {
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SettingItem
            title="Audit trail"
            desc="Capture every change to schema and records — who, what, when. Used by compliance reviews."
            control={<ToggleSwitch on={audit} onToggle={setAudit} />}
          />
          <SettingItem
            title="Activity tracking"
            desc="Surface a feed of record-level activity on the node and in dashboards."
            control={<ToggleSwitch on={activity} onToggle={setActivity} />}
          />
          <SettingItem
            title="Reporting"
            desc="Make this object queryable from the reporting layer — appears in dashboards and exports."
            control={<ToggleSwitch on={reporting} onToggle={setReporting} />}
          />
        </div>
      );
    }

    if (section === "integrations") {
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SettingItem
            title="Webhook"
            desc="POST a JSON payload to your endpoint when records change."
            control={<ToggleSwitch on={webhook} onToggle={setWebhook} />}
            expansion={webhook && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--ink-2)", marginBottom:6 }}>Endpoint URL</label>
                  <input value={webhookUrl} onChange={function(e){ setWebhookUrl(e.target.value); }} placeholder="https://api.example.com/hooks/object" style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12 })} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--ink-2)", marginBottom:8 }}>Trigger on</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {[["create","Create"],["update","Update"],["delete","Delete"]].map(function(o){
                      var on = webhookEvents[o[0]];
                      return <button key={o[0]} onClick={function(){ setWebhookEvents(function(prev){ var n = Object.assign({}, prev); n[o[0]] = !n[o[0]]; return n; }); }}
                        style={{ padding:"6px 14px", borderRadius:6, border:"1px solid " + (on ? "var(--ink)" : "var(--line)"), background: on ? "var(--ink)" : "var(--panel)", color: on ? "var(--bg-canvas)" : "var(--ink-2)", fontSize:12, fontFamily:"inherit", fontWeight:500, cursor:"pointer" }}>{o[1]}</button>;
                    })}
                  </div>
                </div>
              </div>
            )}
          />
          <SettingItem
            title="Distinct value filtering"
            desc="Let queries return unique values for a chosen field. Useful for typeahead and faceted filters."
            control={<ToggleSwitch on={distinctFilter} onToggle={setDistinctFilter} />}
          />
        </div>
      );
    }

    if (section === "access") {
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SettingItem
            title="External access"
            desc="Expose this object through the public REST and GraphQL APIs. Requires an API token."
            control={<ToggleSwitch on={externalAccess} onToggle={setExternalAccess} />}
          />
          <SettingItem
            title="Global access"
            desc="Records are visible to every workspace by default. Workspace-level overrides still apply."
            control={<ToggleSwitch on={globalAccess} onToggle={setGlobalAccess} />}
            warn={globalAccess ? "Every workspace in the org will see records from this object. Use scoped access instead if you only need to share with a subset." : null}
          />
        </div>
      );
    }

    if (section === "versioning") {
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SettingItem
            title="Node versioning"
            desc="Store full schema and record history. Restore or compare any prior version."
            control={<ToggleSwitch on={versioning} onToggle={setVersioning} />}
          />
          <SettingItem
            title="Deployable versioning"
            desc="Pin a version as 'deployed' so consumers can pull a stable copy while you iterate on the next."
            control={<ToggleSwitch on={deployable} onToggle={setDeployable} disabled={!versioning} />}
          />
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.42)", zIndex:230, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"94vw", maxWidth:1120, height:"86vh", background:"var(--bg-canvas)", borderRadius:14, border:"1px solid var(--line)", boxShadow:"0 32px 80px rgba(0,0,0,0.32)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* HEADER */}
        <div style={{ flexShrink:0, padding:"16px 22px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ width:34, height:34, borderRadius:8, background:"var(--purple-fill)", color:"var(--purple)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.7px", color:"var(--ink-3)", textTransform:"uppercase" }}>{node ? node.label + " · SETTINGS" : "SETTINGS"}</div>
              <div style={{ fontFamily:"Instrument Serif", fontSize:22, color:"var(--ink)", marginTop:2, lineHeight:1.1 }}>Node settings</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:15, color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"232px minmax(0, 1fr)", minHeight:0 }}>
          {/* LEFT RAIL */}
          <div style={{ background:"var(--panel-2)", borderRight:"1px solid var(--line)", padding:"16px 12px", overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
            {SECTIONS.map(function(s){
              var on = section === s.id;
              var count = sectionCounts[s.id];
              return (
                <button key={s.id} onClick={function(){ setSection(s.id); }}
                  style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 12px", borderRadius:8, border: on ? "1px solid var(--line)" : "1px solid transparent", background: on ? "var(--panel)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                  <span style={{ width:26, height:26, borderRadius:6, background: on ? "var(--ink)" : "var(--chip)", color: on ? "var(--bg-canvas)" : "var(--ink-2)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.icon}</span>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:13, color:"var(--ink)", fontWeight: on ? 600 : 500, lineHeight:1.2 }}>{s.title}</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", marginTop:2, lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.desc}</div>
                  </div>
                  {count > 0 && (
                    <span style={{ flexShrink:0, fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color: on ? "var(--ink-2)" : "var(--ink-3)", background: on ? "var(--chip)" : "transparent", padding:"2px 6px", borderRadius:4 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CONTENT */}
          <div style={{ padding:"22px 28px", overflowY:"auto" }}>
            {(function(){
              var s = SECTIONS.find(function(x){ return x.id === section; });
              return (
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontFamily:"Instrument Serif", fontSize:26, color:"var(--ink)", lineHeight:1.1 }}>{s.title}</div>
                  <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:6, lineHeight:1.55, maxWidth:620 }}>{s.desc}.</div>
                </div>
              );
            })()}
            {renderSection()}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ flexShrink:0, padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{node ? node.label : "Node"} · these settings apply only to this node</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{ padding:"8px 18px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)", color:"var(--ink)", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:500 }}>Cancel</button>
            <button onClick={onClose} style={{ padding:"8px 20px", border:"none", borderRadius:8, background:"var(--ink)", color:"var(--bg-canvas)", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:600 }}>Save changes</button>
          </div>
        </div>
      </div>

      {addIndexOpen && (
        <AddCustomIndexDialog
          node={node}
          fieldOptions={fieldOptions}
          initial={editIndex}
          onCancel={function(){ setAddIndexOpen(false); setEditIndex(null); }}
          onSave={function(spec){
            setCustomIndices(function(arr){
              if (editIndex && typeof editIndex.idx === "number" && editIndex.idx >= 0) {
                return arr.map(function(ix, i){ return i === editIndex.idx ? spec : ix; });
              }
              return arr.concat([spec]);
            });
            setAddIndexOpen(false);
            setEditIndex(null);
          }}
        />
      )}
    </div>
  );
}

function PropertiesPane({ node, properties }) {
  // Property-add flow open-state + mode in one URL param ("" = closed).
  const [propFlowMode, setPropFlowMode] = useUrlFlow("prop", ""); // "manual" | "spreadsheet" | "document" | "template" | "snippet"
  const propFlowOpen = propFlowMode !== "" && propFlowMode != null;
  const setPropFlowOpen = function(open){ if (!open) setPropFlowMode(""); };
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ col: "name", dir: "asc" });
  const [selectedProp, setSelectedProp] = useState(null);
  const [propEditRow, setPropEditRow]   = useState(null); // when set, AddPropertyFlow opens in edit mode pre-filled
  const [propFlowParent, setPropFlowParent] = useState(""); // when set, Add Property opens with this parent pre-nested
  const [hoverRowKey, setHoverRowKey]   = useState(null);   // path key of the row being hovered (for the inline "+ child")
  // Track which struct properties are expanded to reveal their nested fields inline.
  const [expandedNested, setExpandedNested] = useState({});
  // Global override: when true, every nested struct is expanded regardless of
  // individual state. Toggled from a subtle icon button next to the search.
  const [expandAll, setExpandAll] = useState(false);
  // Object-level settings drawer (storage, indices, monitoring, etc.).
  const [settingsOpen, setSettingsOpen] = useState(false);
  const AddPropertyFlow = AddPropertyFlowModal;

  const FILTERS = [
    { id: "all",      label: "All",       count: properties.length },
    { id: "required", label: "Required",  count: properties.filter(p=>p.required).length },
    { id: "indexed",  label: "Indexed",   count: properties.filter(p=>p.indexed).length },
    { id: "pii",      label: "PII",       count: properties.filter(p=>p.pii).length },
  ];

  const filtered = useMemo(() => {
    let rows = [...properties];
    if (filter === "required") rows = rows.filter(p => p.required);
    if (filter === "indexed")  rows = rows.filter(p => p.indexed);
    if (filter === "pii")      rows = rows.filter(p => p.pii);
    if (search) rows = rows.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.type||"").toLowerCase().includes(search.toLowerCase()));
    rows.sort((a, b) => {
      let va = a[sort.col] ?? "", vb = b[sort.col] ?? "";
      if (typeof va === "number") return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return rows;
  }, [properties, filter, search, sort]);

  const onSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
  const sortIcon = col => sort.col === col ? (sort.dir === "asc" ? " ↑" : " ↓") : "";

  // Extra detail per property (synthesized)
  const seed = node.id.charCodeAt(0) + node.id.length;
  function propDetail(p, i) {
    const s = seed + i * 11;
    return {
      description: p.name === "account_id" ? "Primary identifier — UUID v4, auto-generated at creation time." :
                   p.computed ? "Derived value. Recomputed on every change to its inputs." :
                   p.pii ? "Contains personal data. Masked for most roles; raw only for acct_admin." :
                   `Stores the ${p.name.replace(/_/g, " ")} value for this node instance.`,
      defaultVal:  p.type === "bool" ? "false" : p.type === "int" ? "0" : p.pk ? "auto()" : "null",
      example:     p.name === "name" ? "Acme Corp" : p.name === "domain" ? "acme.com" : p.type === "timestamp" ? "2026-01-12T09:14:00Z" : p.type === "decimal" ? "48200.00" : p.type === "bool" ? "true" : `val-${(s*17)%999}`,
      retention:   p.pii ? "7 years (regulatory)" : "inherit",
      since:       `v${1 + (s%3)}.${(s*7)%10}.0`,
      addedBy:     ["morgan.lee","ramin.k","data-platform","schema-bot"][s%4],
      nulls:       p.required ? 0 : Math.floor((100 - p.fill) / 100 * (node.instancesN || 100)),
      validRule:   p.name.includes("email") ? "email format" : p.name.includes("id") ? "uuid v4" : p.type === "decimal" ? "≥ 0" : "none",
    };
  }

  // Property click now opens a slim drawer (third pane) instead of navigating to the full detail page.
  var drawerProp = selectedProp ? properties.find(function(p){ return p.name === selectedProp; }) : null;

  return (
    <div className="props-pane">
      {/* Single card wrapping toolbar + table */}
      <div className="card">
        <div className="card-head card-head-row">
          <div style={{ display:"flex", gap:4 }}>
            <Dropdown
              value={(FILTERS.find(f => f.id === filter) || FILTERS[0]).label === "All" ? "All properties" : (FILTERS.find(f => f.id === filter)).label}
              options={["All properties", "Required", "Indexed", "PII"]}
              onChange={lbl => { const map = { "All properties": "all", Required: "required", Indexed: "indexed", PII: "pii" }; setFilter(map[lbl] || "all"); }}
              icon="filter" />
          </div>
          <div className="card-head-actions">
            {/* Global expand/collapse toggle. Subtle by default — only the
                icon outlined; on-state earns a chip-tinted background so it
                reads as active without shouting. */}
            <button
              type="button"
              onClick={function(){ setExpandAll(function(v){ return !v; }); }}
              title={expandAll ? "Collapse nested fields" : "Expand all nested fields"}
              aria-pressed={expandAll}
              style={{
                width:30, height:30, padding:0,
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                border:"1px solid var(--line)", borderRadius:7,
                background: expandAll ? "var(--chip)" : "#fff",
                color: expandAll ? "var(--ink)" : "var(--ink-3)",
                cursor:"pointer",
                transition:"color 100ms ease, background 100ms ease"
              }}
              onMouseEnter={function(e){ if (!expandAll) { e.currentTarget.style.color = "var(--ink-2)"; } }}
              onMouseLeave={function(e){ if (!expandAll) { e.currentTarget.style.color = "var(--ink-3)"; } }}
            >
              {/* Two icons swapped by state. Off = "unfold" (arrows out);
                  On = "fold" (arrows in). Mirrors the action it would take
                  if clicked, which keeps the affordance predictable. */}
              {expandAll ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7 20 12 15 17 20"/>
                  <polyline points="7 4 12 9 17 4"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7 15 12 20 17 15"/>
                  <polyline points="7 9 12 4 17 9"/>
                </svg>
              )}
            </button>
            {/* Object settings — opens a right-side drawer with storage,
                indices, monitoring, access control, and versioning controls. */}
            <button
              type="button"
              onClick={function(){ setSettingsOpen(true); }}
              title="Object settings"
              style={{
                width:30, height:30, padding:0,
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                border:"1px solid var(--line)", borderRadius:7,
                background:"#fff", color:"var(--ink-3)",
                cursor:"pointer",
                transition:"color 100ms ease, background 100ms ease"
              }}
              onMouseEnter={function(e){ e.currentTarget.style.color = "var(--ink-2)"; e.currentTarget.style.background = "var(--chip)"; }}
              onMouseLeave={function(e){ e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "#fff"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <div style={{ position: "relative" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--ink-3)",pointerEvents:"none" }}>
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input className="sample-search" placeholder="Search properties…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ position:"relative" }}>
              <button onClick={() => setAddMenuOpen(o => !o)}
                style={{ display:"inline-flex", alignItems:"center", gap:7, height:32, padding:"0 13px", background:"#fff", color:"#3a3a36", border:"1px solid #e3ddd1", borderRadius:8, fontSize:13, fontWeight:500, fontFamily:"var(--sans)", cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 1px 2px rgba(60,50,30,0.04)", transition:"background .15s" }}
                onMouseOver={e => e.currentTarget.style.background = "#faf8f3"} onMouseOut={e => e.currentTarget.style.background = "#fff"}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#3a3a36" strokeWidth="1.6" strokeLinecap="round" /></svg>
                Add property
              </button>
              {addMenuOpen && (
                <>
                  <div onClick={() => setAddMenuOpen(false)} style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:199 }} />
                  <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:200, width:280, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 18px 44px rgba(0,0,0,0.18)", padding:6 }}>
                    {[
                      { id:"manual",      l:"Add manually",        d:"Define one property with full governance.",       svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> },
                      { id:"snippet",     l:"Use a code snippet",  d:"Paste JSON / XML / XSD; auto-infer typed fields.", svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
                      { id:"spreadsheet", l:"Upload spreadsheet",  d:"Auto-detect columns from a CSV or Excel file.",   svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
                      { id:"document",    l:"Parse a document",    d:"Extract fields from a PDF, contract or doc.",     svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                      { id:"template",    l:"From a template",     d:"Pick a curated property set for this entity.",    svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
                    ].map(function(opt){
                      return (
                        <button key={opt.id} onClick={() => { setPropFlowMode(opt.id); setPropFlowOpen(true); setAddMenuOpen(false); }}
                          style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 11px", borderRadius:7, width:"100%", border:"none", background:"transparent", textAlign:"left", cursor:"pointer", fontFamily:"inherit" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--chip)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ width:24, height:24, borderRadius:5, background:"var(--chip)", color:"var(--ink-2)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{opt.svg}</span>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:13, color:"var(--ink)", fontWeight:500, lineHeight:1.25 }}>{opt.l}</div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, lineHeight:1.4 }}>{opt.d}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="props-table">
          {/* Columns: Name | Key | Type | Fill | Conformance | Flags | chevron.
              All headers are left-aligned (including the numeric Fill / Conformance),
              so the column label sits flush with where the data starts reading. */}
          <div className="props-head" style={{ gridTemplateColumns:"1.6fr 1.2fr 1.2fr 1fr 1fr 0.8fr 30px" }}>
            <button className="props-th" onClick={() => onSort("name")}>Name{sortIcon("name")}</button>
            <button className="props-th" onClick={() => onSort("name")}>Key{sortIcon("name")}</button>
            <button className="props-th" onClick={() => onSort("type")}>Type{sortIcon("type")}</button>
            <button className="props-th" onClick={() => onSort("fill")} style={{ textAlign:"left" }}>Fill{sortIcon("fill")}</button>
            <button className="props-th" onClick={() => onSort("conf")} style={{ textAlign:"left" }}>Conformance{sortIcon("conf")}</button>
            <div className="props-th">Flags</div>
            <div className="props-th props-th-action"></div>
          </div>

          {(function renderRows(){
            // Recursive renderer for nested struct properties. Children of a
            // parent are wrapped in a relative container so their connecting
            // rail can run continuously — no breaks across row borders. The
            // pattern recurses, so a third level of nesting just gets its own
            // rail at a deeper indent.
            var TYPE_GLYPH = { uuid:{ g:"ID", c:"var(--purple)" }, string:{ g:"T",  c:"var(--blue)"   }, "string[]":{ g:"[T]", c:"var(--blue)" }, decimal:{ g:"#",  c:"var(--gold)"   }, float:{ g:".5", c:"var(--gold)"   }, bool:{ g:"01", c:"var(--coral)"  }, timestamp:{ g:"TS", c:"var(--green)" }, date:{ g:"DT", c:"var(--green)" }, datetime:{ g:"DT", c:"var(--green)" }, enum:{ g:"E",  c:"var(--purple)" }, struct:{ g:"{}", c:"var(--ink-3)" }, int:{ g:"#", c:"var(--gold)" } };
            var REQ_ICON = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="13"/><circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>;
            var IDX_ICON = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/></svg>;
            var PII_ICON = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
            var UNQ_ICON = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="14" r="3"/><path d="M10 12l9-9 2 2-9 9"/><path d="M16 6l3 3"/></svg>;
            function FlagPill({ tone, title, label }) {
              return (
                <span title={title} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", height:18, padding:"0 6px", borderRadius:4, background:tone.bg, color:tone.fg, fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.4px", flexShrink:0 }}>{label}</span>
              );
            }
            function renderRow(p, depth, parentKey) {
              var keyId = (parentKey ? parentKey + "." : "") + p.name;
              var hasChildren = !!(p.children && p.children.length);
              var isOpen = expandAll || !!expandedNested[keyId];
              var tg = TYPE_GLYPH[p.type] || TYPE_GLYPH.string;
              var fillC = metricColor(p.fill);
              var confC = metricColor(p.conf);
              var displayName = p.name.replace(/_/g, " ").replace(/\b\w/g, function(m){ return m.toUpperCase(); }).replace(/\bId\b/g, "ID").replace(/\bUrl\b/g, "URL");
              // Disclosure: same 18px slot at every depth so the column lines
              // up vertically even across levels. Empty placeholder when the
              // row has no children.
              var disclosure = hasChildren ? (
                <button
                  onClick={function(e){
                    e.stopPropagation();
                    setExpandedNested(function(prev){
                      var next = Object.assign({}, prev);
                      if (next[keyId]) delete next[keyId]; else next[keyId] = true;
                      return next;
                    });
                  }}
                  title={isOpen ? "Collapse nested fields" : "Expand nested fields"}
                  style={{ width:18, height:18, padding:0, border:"none", background:"transparent", display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--ink-2)", borderRadius:4, flexShrink:0 }}
                  onMouseEnter={function(e){ e.currentTarget.style.background = "var(--chip)"; }}
                  onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 120ms ease" }}>
                    <polyline points="9 6 15 12 9 18"/>
                  </svg>
                </button>
              ) : (
                <span style={{ width:18, height:18, display:"inline-flex", flexShrink:0 }} />
              );
              // Per-level indent. The chevron for depth D sits at the row's
              // own padding-left (18) + D * INDENT + chevron half-width (9),
              // which is exactly where the next-deeper rail will be drawn.
              // That alignment is what makes URL's children's rail sit
              // directly under URL's chevron rather than offset to the left.
              var INDENT = 14;
              var namePadLeft = depth > 0 ? (depth * INDENT) : undefined;
              var nestable = p.type === "struct" || p.type === "array" || p.type === "object";
              var rowHovered = hoverRowKey === keyId;
              return (
                <div key={keyId} className="props-row" style={{ gridTemplateColumns:"1.6fr 1.2fr 1.2fr 1fr 1fr 0.8fr 30px", position:"relative" }}
                  onMouseEnter={function(){ setHoverRowKey(keyId); }}
                  onMouseLeave={function(){ setHoverRowKey(function(k){ return k === keyId ? null : k; }); }}
                  onClick={function(){ setPropEditRow(p); setPropFlowParent(""); setPropFlowMode("manual"); setPropFlowOpen(true); }}>
                  <div className="props-cell props-name-cell" style={{ paddingLeft: namePadLeft }}>
                    {disclosure}
                    <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500 }}>{displayName}</span>
                    {p.pk && <span className="snap-tag snap-pk">PK</span>}
                    {hasChildren && <span title={p.children.length + " nested fields"} style={{ display:"inline-flex", alignItems:"center", padding:"1px 6px", borderRadius:4, background:"var(--chip)", color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:10, fontWeight:600, flexShrink:0 }}>{p.children.length}</span>}
                    {nestable && (
                      <button
                        title={"Add a child field under " + displayName}
                        onClick={function(e){
                          e.stopPropagation();
                          setPropEditRow(null);
                          setPropFlowParent(keyId);
                          setPropFlowMode("manual");
                          setPropFlowOpen(true);
                        }}
                        style={{ marginLeft:"auto", width:20, height:20, flexShrink:0, padding:0, border:"1px dashed var(--line)", background:"var(--panel-2)", borderRadius:5, display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--ink-3)", fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700, lineHeight:1, opacity: rowHovered ? 1 : 0, transition:"opacity 120ms ease" }}
                        onMouseEnter={function(e){ e.currentTarget.style.background = "var(--chip)"; e.currentTarget.style.color = "var(--ink)"; }}
                        onMouseLeave={function(e){ e.currentTarget.style.background = "var(--panel-2)"; e.currentTarget.style.color = "var(--ink-3)"; }}
                      >+</button>
                    )}
                  </div>
                  <div className="props-cell">
                    <code style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink-2)", background:"var(--chip)", padding:"2px 7px", borderRadius:4 }}>{keyId}</code>
                  </div>
                  <div className="props-cell prop-type">
                    <span style={{ display:"inline-flex", alignItems:"center", gap:7 }}>
                      <span style={{ minWidth:22, height:18, padding:"0 5px", borderRadius:4, background:tg.c, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.3px", flexShrink:0 }}>{tg.g}</span>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink-2)" }}>{p.type}</span>
                    </span>
                  </div>
                  <div className="props-cell">
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ position:"relative", flex:"1 1 70px", maxWidth:80, height:6, background:"var(--line)", borderRadius:3, overflow:"hidden" }}><div style={{ position:"absolute", left:0, top:0, bottom:0, width: p.fill + "%", background: fillC, borderRadius:3 }} /></div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color: fillC, fontWeight:600, minWidth:36 }}>{p.fill}%</span>
                    </div>
                  </div>
                  <div className="props-cell">
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ position:"relative", flex:"1 1 70px", maxWidth:80, height:6, background:"var(--line)", borderRadius:3, overflow:"hidden" }}><div style={{ position:"absolute", left:0, top:0, bottom:0, width: p.conf + "%", background: confC, borderRadius:3 }} /></div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color: confC, fontWeight:600, minWidth:36 }}>{p.conf}%</span>
                    </div>
                  </div>
                  <div className="props-cell" style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {p.required && <FlagPill title="Required"   tone={{ bg:"var(--coral-fill)", fg:"var(--coral)" }} label="REQ" />}
                    {p.indexed  && <FlagPill title="Indexed"    tone={{ bg:"var(--blue-fill)",  fg:"var(--blue)" }}  label="IDX" />}
                    {p.unique   && <FlagPill title="Unique"     tone={{ bg:"var(--chip)",       fg:"#8a7340" }}      label="UNQ" />}
                    {p.pii      && <FlagPill title="PII"        tone={{ bg:"var(--chip)",       fg:"var(--ink-2)" }} label="PII" />}
                    {!p.required && !p.indexed && !p.unique && !p.pii && <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)" }}>—</span>}
                  </div>
                  <div className="props-cell props-chevron">›</div>
                </div>
              );
            }
            // Each open parent wraps its children in a position:relative
            // group container so a single 1px rail can span the full height
            // of its descendants — no gaps across row borders. Nested groups
            // stack their rails at deeper x's, so a grandchild row visually
            // sits under TWO rails (one per ancestor group). The pattern
            // scales to arbitrary depth.
            var INDENT = 14;
            function railXFor(d) { return 18 + (d - 1) * INDENT + 9; }
            function renderNode(p, depth, parentKey) {
              var keyId = (parentKey ? parentKey + "." : "") + p.name;
              var hasChildren = !!(p.children && p.children.length);
              var isOpen = expandAll || !!expandedNested[keyId];
              if (!hasChildren || !isOpen) return renderRow(p, depth, parentKey);
              return (
                <React.Fragment key={keyId}>
                  {renderRow(p, depth, parentKey)}
                  <div style={{ position:"relative" }}>
                    <span aria-hidden="true" style={{ position:"absolute", left: railXFor(depth + 1), top:0, bottom:0, width:1, background:"var(--line)", pointerEvents:"none", zIndex:1 }} />
                    {p.children.map(function(c){ return renderNode(c, depth + 1, keyId); })}
                  </div>
                </React.Fragment>
              );
            }
            return filtered.map(function(p){ return renderNode(p, 0, ""); });
          })()}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            No properties match <b>{filter !== "all" ? filter : search}</b>.
          </div>
        )}
      </div>

      {propFlowOpen && propFlowMode === "snippet"
        ? <CodeSnippetFlow node={node} onClose={() => { setPropFlowOpen(false); setPropFlowMode(null); setPropEditRow(null); setPropFlowParent(""); }} />
        : (propFlowOpen && AddPropertyFlow && <AddPropertyFlow node={node} mode={propFlowMode || "manual"} initialProperty={propEditRow} seedParent={propFlowParent} onClose={() => { setPropFlowOpen(false); setPropFlowMode(null); setPropEditRow(null); setPropFlowParent(""); }} />)
      }

      {settingsOpen && <PropertiesSettingsModal node={node} properties={properties} onClose={function(){ setSettingsOpen(false); }} />}

      {/* Property detail drawer — full creation context surfaced in one pane */}
      {drawerProp && (function(){
        var TYPE_GLYPH = { uuid:{ g:"ID", c:"var(--purple)" }, string:{ g:"T", c:"var(--blue)" }, "string[]":{ g:"[T]", c:"var(--blue)" }, decimal:{ g:"#", c:"var(--gold)" }, float:{ g:".5", c:"var(--gold)" }, bool:{ g:"01", c:"var(--coral)" }, timestamp:{ g:"TS", c:"var(--green)" }, date:{ g:"DT", c:"var(--green)" }, datetime:{ g:"DT", c:"var(--green)" }, enum:{ g:"E", c:"var(--purple)" }, struct:{ g:"{}", c:"var(--ink-3)" }, int:{ g:"#", c:"var(--gold)" } };
        var tg = TYPE_GLYPH[drawerProp.type] || TYPE_GLYPH.string;
        var fillC = metricColor(drawerProp.fill);
        var confC = metricColor(drawerProp.conf);
        var nullCount = Math.floor((100 - drawerProp.fill) / 100 * (node.instancesN || 142000));
        // Deterministic sample values
        var samples = [0,1,2,3,4].map(function(i){
          if (drawerProp.type === "uuid") return node.id.slice(0,3).toUpperCase() + "-" + (10000 + (i * 1337) % 89999);
          if (drawerProp.type === "timestamp" || drawerProp.type === "date" || drawerProp.type === "datetime") return "2026-05-" + (10 + i) + (drawerProp.type === "timestamp" || drawerProp.type === "datetime" ? "T09:" + (12 + i*7) + ":00Z" : "");
          if (drawerProp.type === "decimal" || drawerProp.type === "float" || drawerProp.type === "int") return ((23.5 + i * 117) * (i+1)).toFixed(drawerProp.type === "int" ? 0 : 2);
          if (drawerProp.type === "bool") return i % 2 === 0 ? "true" : "false";
          if (drawerProp.type === "enum") return ["primary","secondary","archived","draft","active"][i];
          return drawerProp.name + "_value_" + (i+1);
        });
        // Synthetic top-distribution
        var dist = [
          { v: drawerProp.type === "enum" ? "primary"   : (drawerProp.type === "bool" ? "true"  : samples[0]), pct: 42 },
          { v: drawerProp.type === "enum" ? "secondary" : (drawerProp.type === "bool" ? "false" : samples[1]), pct: 31 },
          { v: drawerProp.type === "enum" ? "archived"  : samples[2], pct: 18 }
        ];
        var rulesOnProp = 1 + ((drawerProp.name.length) % 3); // synthetic count
        var consumersOnProp = 2 + ((drawerProp.name.length * 3) % 4);
        var lastChange = (drawerProp.name.length * 2) % 18 + " days ago";
        var ownerName = "Morgan Lee · data-platform";
        var classification = drawerProp.pii ? "Confidential" : "Internal";
        var retention = "Inherits from " + node.label;
        var description = drawerProp.pk ? "Unique identifier for each " + node.label.toLowerCase() + " record. Stable across writes." :
                          drawerProp.name === "name" ? "Display name shown in the catalog and downstream tools." :
                          drawerProp.name === "created_at" ? "ISO 8601 timestamp of when the record was first written." :
                          drawerProp.name === "owner_id" ? "Reference to the user account responsible for the record." :
                          drawerProp.name === "status" ? "Lifecycle state. Drives routing, SLA and visibility." :
                          drawerProp.name === "amount" ? "Monetary amount associated with this record, in USD." :
                          drawerProp.name === "external_ref" ? "Identifier of the corresponding record in the source system." :
                          "Property defined on the " + node.label + " node type.";
      return (
        <>
          <div onClick={function(){ setSelectedProp(null); }} style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.32)", zIndex:240 }} />
          <div style={{ position:"fixed", top:0, right:0, bottom:0, width:560, maxWidth:"94vw", background:"var(--bg-canvas)", borderLeft:"1px solid var(--line)", boxShadow:"-24px 0 60px rgba(0,0,0,0.18)", zIndex:241, display:"flex", flexDirection:"column" }}>
            {/* HEADER */}
            <div style={{ flexShrink:0, padding:"16px 22px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", background:"var(--panel)", gap:14 }}>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase" }}>{node.label} · property</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5, flexWrap:"wrap" }}>
                  <span style={{ minWidth:26, height:22, padding:"0 7px", borderRadius:5, background:tg.c, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700 }}>{tg.g}</span>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:18, color:"var(--ink)", fontWeight:600 }}>{drawerProp.name}</span>
                  {drawerProp.pk && <span className="snap-tag snap-pk">PK</span>}
                  {drawerProp.required && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--chip)", color:"var(--ink-2)", fontWeight:700, letterSpacing:"0.4px" }}>REQ</span>}
                  {drawerProp.indexed && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--blue-fill)", color:"var(--blue)", fontWeight:700, letterSpacing:"0.4px" }}>IDX</span>}
                  {drawerProp.unique && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--green-fill)", color:"var(--green)", fontWeight:700, letterSpacing:"0.4px" }}>UNQ</span>}
                  {drawerProp.pii && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--coral-fill)", color:"var(--coral)", fontWeight:700, letterSpacing:"0.4px" }}>PII</span>}
                  {drawerProp.computed && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--gold-fill)", color:"var(--gold)", fontWeight:700, letterSpacing:"0.4px" }}>FX</span>}
                </div>
                <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:8, lineHeight:1.55 }}>{description}</div>
              </div>
              <button onClick={function(){ setSelectedProp(null); }} style={{ width:30, height:30, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", color:"var(--ink-3)", flexShrink:0 }}>✕</button>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"20px 22px", display:"flex", flexDirection:"column", gap:22 }}>

              {/* SHAPE — Kind / Type / Source */}
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8 }}>Shape</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:"var(--line-2)", border:"1px solid var(--line-2)", borderRadius:8, overflow:"hidden" }}>
                  {[
                    { l:"KIND", v: drawerProp.computed ? <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:"var(--gold)" }}/>Computed</span> : <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:"var(--blue)" }}/>Upstream</span> },
                    { l:"TYPE", v: <span style={{ fontFamily:"JetBrains Mono", color:"var(--ink)" }}>{drawerProp.type}</span> },
                    { l:"SOURCE", v: drawerProp.computed ? <span style={{ fontFamily:"JetBrains Mono", color:"var(--gold)" }}>{"fx · " + (drawerProp.computed || "formula")}</span> : <span style={{ fontFamily:"JetBrains Mono", color:"var(--ink-2)" }}>{drawerProp.source}</span> }
                  ].map(function(c){
                    return (
                      <div key={c.l} style={{ padding:"11px 13px", background:"var(--panel)" }}>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:"var(--ink-3)", letterSpacing:"0.5px", marginBottom:5 }}>{c.l}</div>
                        <div style={{ fontSize:12.5, color:"var(--ink)" }}>{c.v}</div>
                      </div>
                    );
                  })}
                </div>
                {drawerProp.computed && (
                  <div style={{ marginTop:8, padding:"10px 12px", border:"1px solid var(--gold-fill)", borderRadius:7, background:"color-mix(in oklab, var(--gold) 5%, var(--panel))" }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:"var(--gold)", letterSpacing:"0.5px", marginBottom:4 }}>COMPUTATION</div>
                    <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink)", lineHeight:1.55 }}>{drawerProp.name} := {drawerProp.computed || "formula here"}</code>
                  </div>
                )}
              </div>

              {/* QUALITY */}
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:10 }}>Quality</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { l:"Fill",        v:drawerProp.fill, c:fillC, sub: nullCount.toLocaleString() + " null" },
                    { l:"Conformance", v:drawerProp.conf, c:confC, sub: drawerProp.conf >= 95 ? "passing" : "below target" }
                  ].map(function(m){
                    return (
                      <div key={m.l} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:12.5, color:"var(--ink-2)", minWidth:96 }}>{m.l}</span>
                        <div style={{ flex:1, height:6, background:"var(--line)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width: m.v + "%", background: m.c }} />
                        </div>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color: m.c, fontWeight:600, minWidth:38, textAlign:"right" }}>{m.v}%</span>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", minWidth:80, textAlign:"right" }}>{m.sub}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GOVERNANCE */}
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:10 }}>Governance</div>
                <div style={{ display:"flex", flexDirection:"column", border:"1px solid var(--line-2)", borderRadius:8, overflow:"hidden", background:"var(--panel)" }}>
                  {[
                    { k:"OWNER",          v: ownerName },
                    { k:"CLASSIFICATION", v: <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"2px 7px", borderRadius:4, background: drawerProp.pii ? "var(--coral-fill)" : "var(--chip)", color: drawerProp.pii ? "var(--coral)" : "var(--ink-2)", textTransform:"uppercase", letterSpacing:"0.4px", fontWeight:700 }}>{classification}</span> },
                    { k:"RETENTION",      v: <span><span style={{ color:"var(--ink-4)" }}>inherits — </span><code style={{ fontFamily:"JetBrains Mono", color:"var(--ink-2)" }}>2 years</code></span> },
                    { k:"ACCESS",         v: <span><span style={{ color:"var(--ink-4)" }}>inherits — </span><code style={{ fontFamily:"JetBrains Mono", color:"var(--ink-2)" }}>all readers of {node.label}</code></span> },
                    { k:"TAGS",           v: <span style={{ display:"inline-flex", flexWrap:"wrap", gap:4 }}>{["Customer","Core"].map(function(t){ return <span key={t} style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 6px", borderRadius:4, background:"var(--blue-fill)", color:"var(--blue)", fontWeight:700, letterSpacing:"0.3px" }}>{t}</span>; })}</span> }
                  ].map(function(row, i, arr){
                    return (
                      <div key={row.k} style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:12, padding:"9px 13px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", letterSpacing:"0.5px" }}>{row.k}</span>
                        <span style={{ fontSize:12.5, color:"var(--ink)" }}>{row.v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VALUE DISTRIBUTION — top values */}
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:10 }}>Top values <span style={{ color:"var(--ink-4)", letterSpacing:0, textTransform:"none" }}>· last 7 days</span></div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {dist.map(function(d, i){
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink)", minWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.v}</code>
                        <div style={{ flex:1, height:5, background:"var(--line)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width: d.pct + "%", background:"var(--ink-2)" }} />
                        </div>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", minWidth:32, textAlign:"right" }}>{d.pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SAMPLE RECORDS */}
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8 }}>Sample values</div>
                <div style={{ border:"1px solid var(--line)", borderRadius:8, overflow:"hidden", background:"var(--panel)" }}>
                  {samples.map(function(v, i){
                    return (
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, padding:"9px 13px", borderBottom: i < samples.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                        <code style={{ fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{String(v)}</code>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>{node.id}_{(10000 + i * 1337).toString(36).toUpperCase().slice(-5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RULES & CONSUMERS — quick context strip */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:"var(--line-2)", border:"1px solid var(--line-2)", borderRadius:8, overflow:"hidden" }}>
                {[
                  { l:"ACTIVE RULES", v: rulesOnProp,                  c:"var(--ink)"   },
                  { l:"CONSUMERS",    v: consumersOnProp,              c:"var(--blue)"  },
                  { l:"LAST CHANGE",  v: lastChange,                   c:"var(--ink-2)" }
                ].map(function(s){
                  return (
                    <div key={s.l} style={{ padding:"11px 13px", background:"var(--panel)" }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:"var(--ink-3)", letterSpacing:"0.5px", marginBottom:5 }}>{s.l}</div>
                      <div style={{ fontFamily:"Instrument Serif", fontSize:18, color:s.c, lineHeight:1 }}>{s.v}</div>
                    </div>
                  );
                })}
              </div>

              {/* DEFAULT VALUE — only when set */}
              {drawerProp.default && (
                <div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8 }}>Default value</div>
                  <code style={{ display:"inline-block", padding:"5px 10px", border:"1px solid var(--line)", borderRadius:6, fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink)", background:"var(--panel)" }}>{drawerProp.default}</code>
                </div>
              )}
            </div>

            <div style={{ flexShrink:0, padding:"12px 22px", borderTop:"1px solid var(--line)", display:"flex", gap:8, justifyContent:"flex-end", background:"var(--panel)" }}>
              <button className="btn-ghost" onClick={function(){ setSelectedProp(null); }} style={{ fontSize:12 }}>Close</button>
              <button className="btn-dark" style={{ fontSize:12 }}>Edit property</button>
            </div>
          </div>
        </>
      );
      })()}
    </div>
  );
}


function FormulaEditor({ editorRef, value, onChange, rePill, propNames, toHtml, baseStyle }){
  // On mount only — initialise with pill HTML. After that, React never touches innerHTML on
  // each keystroke (which would jump the cursor).
  React.useEffect(function(){
    var el = editorRef.current;
    if (!el) return;
    if ((el.textContent || "") === (value || "")) return; // already in sync (typed input)
    el.innerHTML = toHtml(value || "", propNames);
  }, [value, propNames.join("|")]);
  return (
    <div ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={function(e){ onChange(e.currentTarget.textContent || ""); }}
      onBlur={function(){ rePill(); }}
      style={baseStyle}
    />
  );
}

// Custom picker used by AddPropertyFlowModal for "Nest under a parent field".
// Lists every top-level property of the node so the user sees the schema in
// full, with the same type label treatment used in the Properties table.
// Struct rows expand inline (chevron) to reveal nested children; only struct
// rows are selectable as a parent.
function ParentFieldPicker({ value, onChange, properties }) {
  var [open, setOpen]         = useState(false);
  var [expanded, setExpanded] = useState({});
  var [search, setSearch]     = useState("");
  var btnRef = React.useRef(null);
  var searchRef = React.useRef(null);
  var [coords, setCoords] = useState({ top:0, left:0, width:0 });

  function findByPath(path) {
    if (!path) return null;
    var parts = path.split(".");
    var arr = properties || [];
    var found = null;
    for (var i = 0; i < parts.length; i++) {
      found = arr.find(function(p){ return p.name === parts[i]; });
      if (!found) return null;
      arr = found.children || [];
    }
    return found;
  }
  var selected = findByPath(value);

  function toggleOpen() {
    if (!open && btnRef.current) {
      var r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(function(o){ return !o; });
  }
  // Focus the search input as soon as the panel opens.
  React.useEffect(function(){
    if (open && searchRef.current) {
      setTimeout(function(){ try { searchRef.current.focus(); } catch(_e){} }, 0);
    }
    if (!open) setSearch("");
  }, [open]);

  function toggleExpand(key) {
    setExpanded(function(prev){
      var n = Object.assign({}, prev);
      if (n[key]) delete n[key]; else n[key] = true;
      return n;
    });
  }

  // Match against name (case-insensitive). Empty query → always true.
  var q = (search || "").trim().toLowerCase();
  function matchTree(p) {
    if (!q) return true;
    if (p.name && p.name.toLowerCase().indexOf(q) !== -1) return true;
    if (p.children && p.children.length) {
      for (var i = 0; i < p.children.length; i++) if (matchTree(p.children[i])) return true;
    }
    return false;
  }

  // Plain-text type label — same color as everything else; no glyph, no pill.
  function TypeLabel({ type }) {
    return (
      <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", letterSpacing:"0.1px", flexShrink:0 }}>{type}</span>
    );
  }

  // Same display-name transform as the main property table so labels read identically.
  function prettyName(s) {
    return (s || "").replace(/_/g, " ").replace(/\b\w/g, function(m){ return m.toUpperCase(); }).replace(/\bId\b/g, "ID").replace(/\bUrl\b/g, "URL");
  }

  var INDENT = 14;
  // Chevron button is 16px wide, aligned to start of its grid cell. The rail
  // under a parent row sits directly under its chevron's icon center.
  function railXFor(d) { return 12 + (d - 1) * INDENT + 8; }

  function renderRow(p, depth, parentPath) {
    var path = parentPath ? parentPath + "." + p.name : p.name;
    var hasChildren = p.type === "struct" && p.children && p.children.length;
    var isOpen = q ? true : !!expanded[path];
    var isSelectable = p.type === "struct";
    var isSelected = value === path;
    return (
      <div
        key={path}
        title={isSelectable ? "Pick as parent struct" : "Only struct fields can host children"}
        onClick={function(){ if (isSelectable) { onChange(path); setOpen(false); } }}
        style={{
          position:"relative",
          display:"grid",
          gridTemplateColumns:"16px 1fr auto 14px",
          alignItems:"center",
          gap:10,
          padding:"6px 12px 6px " + (12 + depth * INDENT) + "px",
          cursor: isSelectable ? "pointer" : "not-allowed",
          background: isSelected ? "var(--chip)" : "transparent"
        }}
        onMouseEnter={function(e){ if (!isSelected) e.currentTarget.style.background = isSelectable ? "var(--panel-2)" : "color-mix(in oklab, var(--panel-2) 50%, transparent)"; }}
        onMouseLeave={function(e){ if (!isSelected) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Compact disclosure for struct rows. */}
        {hasChildren ? (
          <button
            type="button"
            onClick={function(e){ e.stopPropagation(); toggleExpand(path); }}
            title={isOpen ? "Collapse" : "Expand"}
            style={{ width:16, height:16, padding:0, border:"1px solid var(--line-2)", background:"var(--panel-2)", cursor:"pointer", color:"var(--ink-3)", borderRadius:4, display:"inline-flex", alignItems:"center", justifyContent:"center", zIndex:2, justifySelf:"start" }}
            onMouseEnter={function(e){ e.currentTarget.style.background = "var(--chip)"; e.currentTarget.style.color = "var(--ink-2)"; }}
            onMouseLeave={function(e){ e.currentTarget.style.background = "var(--panel-2)"; e.currentTarget.style.color = "var(--ink-3)"; }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 120ms ease" }}>
              <polyline points="9 6 15 12 9 18"/>
            </svg>
          </button>
        ) : <span />}

        {/* Display name (title-cased), same font/weight as the main property table. */}
        <span style={{ display:"inline-flex", alignItems:"center", gap:7, minWidth:0 }}>
          <span style={{ fontSize:13, color:"var(--ink)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{prettyName(p.name)}</span>
          {hasChildren && (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"1px 5px", borderRadius:3, background:"var(--chip)", color:"var(--ink-3)", fontWeight:600 }}>{p.children.length}</span>
          )}
        </span>

        {/* Type label on the right — plain text, single color. */}
        <TypeLabel type={p.type} />

        {/* Selected check */}
        <span style={{ display:"inline-flex", justifyContent:"flex-end", color:"var(--ink-2)" }}>
          {isSelected && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5"/></svg>}
        </span>
      </div>
    );
  }

  // Group container = continuous vertical rail spanning all descendants of a struct.
  function renderNode(p, depth, parentPath) {
    if (!matchTree(p)) return null;
    var path = parentPath ? parentPath + "." + p.name : p.name;
    var hasChildren = p.type === "struct" && p.children && p.children.length;
    var isOpen = q ? true : !!expanded[path];
    if (!hasChildren || !isOpen) return renderRow(p, depth, parentPath);
    return (
      <React.Fragment key={path}>
        {renderRow(p, depth, parentPath)}
        <div style={{ position:"relative" }}>
          <span aria-hidden="true" style={{ position:"absolute", left: railXFor(depth + 1), top:0, bottom:0, width:1, background:"var(--line)", pointerEvents:"none", zIndex:1 }} />
          {p.children.map(function(c){ return renderNode(c, depth + 1, path); })}
        </div>
      </React.Fragment>
    );
  }

  var visibleTop = (properties || []).filter(matchTree);

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        style={{
          width:"100%", boxSizing:"border-box",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
          padding:"10px 12px",
          border:"1px solid " + (open ? "var(--ink)" : "var(--line)"),
          borderRadius:8,
          background:"var(--panel)",
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)"
        }}
      >
        <span style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          {selected ? (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:13, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</span>
          ) : (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:12.5, color:"var(--ink-3)" }}>Pick a struct field</span>
          )}
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          {selected && <TypeLabel type={selected.type} />}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 120ms ease", color:"var(--ink-3)" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <>
          <div onClick={function(){ setOpen(false); }} style={{ position:"fixed", inset:0, zIndex:300 }} />
          <div style={{ position:"fixed", top:coords.top, left:coords.left, width:coords.width, maxHeight:380, display:"flex", flexDirection:"column", background:"var(--panel)", border:"1px solid var(--line)", borderRadius:8, boxShadow:"0 12px 32px rgba(40,40,20,0.18)", zIndex:301 }}>
            {/* Search */}
            <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--line-2)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", border:"1px solid var(--line)", borderRadius:6, background:"var(--panel-2)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:"var(--ink-3)", flexShrink:0 }}>
                  <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={function(e){ setSearch(e.target.value); }}
                  placeholder="Search properties"
                  style={{ flex:1, minWidth:0, border:"none", outline:"none", background:"transparent", fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink)" }}
                />
                {search && (
                  <button type="button" onClick={function(){ setSearch(""); }} style={{ border:"none", background:"transparent", cursor:"pointer", color:"var(--ink-3)", padding:0, display:"inline-flex" }} title="Clear">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Hint */}
            <div style={{ padding:"7px 12px", borderBottom:"1px solid var(--line-2)", fontSize:11, color:"var(--ink-3)", fontStyle:"italic", flexShrink:0, background:"color-mix(in oklab, var(--chip) 35%, transparent)" }}>
              Only <span style={{ fontFamily:"JetBrains Mono", fontStyle:"normal", color:"var(--ink-2)" }}>struct</span> fields can host children — leaf types are shown for context.
            </div>

            {/* List */}
            <div style={{ overflowY:"auto", padding:"4px 0", flex:1 }}>
              {(properties || []).length === 0 ? (
                <div style={{ padding:"14px 16px", fontSize:12, color:"var(--ink-4)", fontFamily:"JetBrains Mono" }}>This node has no properties yet.</div>
              ) : visibleTop.length === 0 ? (
                <div style={{ padding:"14px 16px", fontSize:12, color:"var(--ink-4)", fontFamily:"JetBrains Mono" }}>No properties match &ldquo;{search}&rdquo;.</div>
              ) : visibleTop.map(function(p){ return renderNode(p, 0, ""); })}

              {!q && (properties || []).length > 0 && (properties || []).every(function(p){ return p.type !== "struct"; }) && (
                <div style={{ padding:"10px 14px", borderTop:"1px dashed var(--line-2)", marginTop:4, fontSize:11, color:"var(--ink-4)", fontFamily:"JetBrains Mono", lineHeight:1.5 }}>
                  No <code style={{ padding:"1px 5px", borderRadius:3, background:"var(--chip)", color:"var(--ink-3)" }}>struct</code> properties exist yet — only struct fields can host children.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddPropertyFlowModal({ node, mode, initialProperty, seedComputed, seedParent, onClose }) {
  mode = mode || "manual";
  // ── Edit mode: pre-fill the form state from an existing property row ──
  var isEditProp = !!initialProperty;
  // ── Computation entry: same flow, but pComputed starts true and the header
  //     reads "New computation" rather than "Add property manually" so it's
  //     contextually correct when invoked from the Computations tab.
  var isComputationEntry = !!seedComputed && !isEditProp;
  const [step, setStep]           = useWizardStep("pstep", 1); // manual: 1=basics, 2=behaviour, 3=governance, 4=review
  const [pName, setPName]         = useState(isEditProp ? (initialProperty.name || "") : "");
  const [pType, setPType]         = useState(isEditProp ? (initialProperty.type || "") : "");
  const [pTypeOpen, setPTypeOpen] = useState(false);
  // Type popover positioning — we use fixed positioning calculated from the trigger's
  // bounding rect so the popover escapes the modal's overflow:hidden clip.
  const pTypeBtnRef = React.useRef(null);
  const [pTypeCoords, setPTypeCoords] = useState({ top:0, left:0, width:0, maxHeight:380, openUp:false });
  function openPTypePicker(){
    if (pTypeOpen){ setPTypeOpen(false); return; }
    var btn = pTypeBtnRef.current;
    if (!btn){ setPTypeOpen(true); return; }
    var r = btn.getBoundingClientRect();
    var MAX_H = 380;
    var GAP = 6;
    var SAFE = 16;
    var spaceBelow = window.innerHeight - r.bottom - SAFE;
    var spaceAbove = r.top - SAFE;
    var openUp = spaceBelow < Math.min(MAX_H, 240) && spaceAbove > spaceBelow;
    var maxH = openUp ? Math.min(MAX_H, spaceAbove - GAP) : Math.min(MAX_H, spaceBelow - GAP);
    var top  = openUp ? Math.max(SAFE, r.top - GAP - maxH) : (r.bottom + GAP);
    setPTypeCoords({ top: top, left: r.left, width: r.width, maxHeight: maxH, openUp: openUp });
    setPTypeOpen(true);
  }
  const [pDesc, setPDesc]         = useState("");
  const [pRequired, setPRequired] = useState(isEditProp ? !!initialProperty.required : false);
  const [pIndexed, setPIndexed]   = useState(isEditProp ? !!initialProperty.indexed  : false);
  const [pPII, setPPII]           = useState(isEditProp ? !!initialProperty.pii      : false);
  const [pUnique, setPUnique]     = useState(isEditProp ? !!initialProperty.unique   : false);
  const [pComputed, setPComputed] = useState(isEditProp ? !!initialProperty.computed : !!seedComputed);
  const [pDefault, setPDefault]   = useState("");
  const [pFormula, setPFormula]   = useState("");
  const [pSource, setPSource]     = useState(isEditProp && initialProperty.source ? initialProperty.source : "Salesforce CRM");
  const [pKind, setPKind]         = useState("upstream"); // upstream | computed
  const [pComputeMode, setPComputeMode] = useState(""); // on_change | daily | manual | schedule | on_read
  const [pComputeKind, setPComputeKind] = useState(""); // formula | agent | sql | lookup
  const [pComputeKindOpen, setPComputeKindOpen] = useState(false);
  const [pComputeModeOpen, setPComputeModeOpen] = useState(false);
  const [pComputeBackfillOpen, setPComputeBackfillOpen] = useState(false);
  const [pComputeOnFailOpen, setPComputeOnFailOpen] = useState(false);
  const [pComputeSchedule, setPComputeSchedule] = useState("0 2 * * *"); // cron expression
  const [pComputeBackfill, setPComputeBackfill] = useState(""); // all | forward | batched
  const [pComputeOnFail, setPComputeOnFail] = useState(""); // raise | default | null | quarantine
  const [pComputeCostCap, setPComputeCostCap] = useState("100"); // monthly USD cap for agent calls
  // SQL/Cypher computation — picks the warehouse system and a specific connection before the query runs.
  const [pSqlSystem, setPSqlSystem]             = useState("");
  const [pSqlConnection, setPSqlConnection]     = useState("");
  // Source picker combines system + connection in a single trigger and a grouped popover.
  const [pSqlSourceOpen, setPSqlSourceOpen]     = useState(false);
  // Keep deprecated open states so any lingering references compile cleanly.
  const [pSqlSystemOpen, setPSqlSystemOpen]     = useState(false);
  const [pSqlConnectionOpen, setPSqlConnectionOpen] = useState(false);
  const [pSqlRunState, setPSqlRunState]         = useState(null); // null | "running" | "ok" | "error"
  // Automation computation — single rich-card dropdown listing all automations across providers.
  const [pAutomation, setPAutomation]           = useState(""); // selected automation id
  const [pAutomationOpen, setPAutomationOpen]   = useState(false);
  // Agent computation — single dropdown listing pre-created agents.
  const [pAgent, setPAgent]                     = useState("");
  const [pAgentOpen, setPAgentOpen]             = useState(false);
  // Formula builder — the editor is a contentEditable div for Formula mode (renders inline property
  // pills) and a plain textarea for SQL/Agent. Both use the same ref + insertion helper.
  const pFormulaTextareaRef = React.useRef(null);
  const [pFmlPropOpen, setPFmlPropOpen] = useState(false);
  const [pFmlFnOpen, setPFmlFnOpen]     = useState(false);
  function escRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function escHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  // Build an HTML string where known property names + function calls are wrapped in styled "pill" spans.
  // Properties get a blue pill; functions get a gold pill so the two are visually distinct.
  function formulaToPillsHtml(text, propNames){
    if (!text) return "";
    var html = escHtml(text);
    var KNOWN_FNS = ["bucket","if","concat","sum","avg","min","max","coalesce","lower","upper","trim","round","lookup"];
    // Function pills first — match name followed by `(`, only pill the name portion
    var fnPattern = new RegExp("\\b(" + KNOWN_FNS.join("|") + ")(?=\\s*\\()", "g");
    html = html.replace(fnPattern, '<span data-fmlfn="1" contenteditable="false" style="display:inline-flex;align-items:center;padding:1px 7px;margin:0 1px;border-radius:5px;background:var(--gold-fill);color:var(--gold);font-weight:700;border:1px solid color-mix(in oklab, var(--gold) 30%, transparent);font-size:11.5px;">$1</span>');
    // Property pills — but don't match tokens already inside a pill span
    if (propNames && propNames.length > 0) {
      var propPattern = new RegExp("\\b(" + propNames.map(escRegex).join("|") + ")\\b", "g");
      // Split on existing spans, only run the property pill replacement on non-span fragments
      html = html.replace(/(<span[^>]*>[\s\S]*?<\/span>)|([^<]+)/g, function(_, span, text){
        if (span) return span;
        return text.replace(propPattern, '<span data-fmlprop="1" contenteditable="false" style="display:inline-flex;align-items:center;padding:1px 8px;margin:0 1px;border-radius:5px;background:var(--blue-fill);color:var(--blue);font-weight:600;border:1px solid color-mix(in oklab, var(--blue) 30%, transparent);font-size:11.5px;">$1</span>');
      });
    }
    return html;
  }
  function placeCursorAtEnd(el){
    if (!el) return;
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  // Re-tokenize the contentEditable, rebuilding pills from the current plain text and placing the
  // cursor at the end. Called on blur and after dropdown insertions.
  function rePillEditor(){
    var el = pFormulaTextareaRef.current;
    if (!el || pComputeKind !== "formula") return;
    var text = el.textContent || "";
    var names = (typeof existingNodeProps !== "undefined" && existingNodeProps) ? existingNodeProps.map(function(p){ return p.name; }) : [];
    el.innerHTML = formulaToPillsHtml(text, names);
    placeCursorAtEnd(el);
  }
  function insertIntoFormula(text){
    var el = pFormulaTextareaRef.current;
    if (!el){ setPFormula(function(prev){ return (prev || "") + text; }); return; }
    if (pComputeKind === "formula"){
      el.focus();
      try { document.execCommand("insertText", false, text); } catch(_e){ el.textContent = (el.textContent || "") + text; }
      var newText = el.textContent || "";
      setPFormula(newText);
      var names = (typeof existingNodeProps !== "undefined" && existingNodeProps) ? existingNodeProps.map(function(p){ return p.name; }) : [];
      el.innerHTML = formulaToPillsHtml(newText, names);
      placeCursorAtEnd(el);
      return;
    }
    var start = typeof el.selectionStart === "number" ? el.selectionStart : (pFormula || "").length;
    var end   = typeof el.selectionEnd   === "number" ? el.selectionEnd   : start;
    var current = pFormula || "";
    var next = current.slice(0, start) + text + current.slice(end);
    setPFormula(next);
    setTimeout(function(){
      try { el.focus(); el.setSelectionRange(start + text.length, start + text.length); } catch(_e){}
    }, 0);
  }
  const [pComputeTestOpen, setPComputeTestOpen] = useState(false);
  // Basics — new fields per redesigned property flow
  const [pDisplayName, setPDisplayName]   = useState(""); // human-readable label, e.g. "ARR (USD)"
  const [pHelpOpen, setPHelpOpen]         = useState(false); // help text textarea expanded
  const [pHelpText, setPHelpText]         = useState("");
  const [pIsPrimary, setPIsPrimary]       = useState(isEditProp ? !!initialProperty.pk : false); // primary key checkbox — implies required + unique + indexed
  // Single / multi select option list (used when pType is "single_select" or "multi_select")
  const [pSelectOptions, setPSelectOptions] = useState(["Option 1", "Option 2"]);
  // Bulk-add options via file upload — opened from a subtle CTA next to the Options label.
  // The CTA triggers a hidden file input that accepts .xlsx / .csv. On select, we
  // parse the values and merge them into the option list.
  const pBulkFileRef = React.useRef(null);
  const [pBulkUploadInfo, setPBulkUploadInfo] = useState(null); // { name, count } after a successful upload
  function handleBulkOptionsFile(e){
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      var text = (ev.target.result || "") + "";
      var parts = [];
      var name = (f.name || "").toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")){
        // Read text, take first column from each row, drop a header if it looks like one
        var rows = text.split(/\r?\n/).map(function(s){ return s.split(/[,\t]/)[0].trim(); }).filter(Boolean);
        if (rows.length && /^(option|name|label|value)s?$/i.test(rows[0])) rows.shift();
        parts = rows;
      } else {
        // .xlsx / .xls — full parse needs a library not loaded in this demo. Pull
        // any printable ASCII runs ≥ 2 chars as a best-effort extraction.
        var runs = (text.match(/[A-Za-z0-9 _\-\/]{2,40}/g) || []).map(function(s){ return s.trim(); });
        var seen = {};
        parts = runs.filter(function(s){
          if (/^(xl|sheet|workbook|docProps|content|relationships|theme|font|style|number|format|application|core|x\d|rId)/i.test(s)) return false;
          if (seen[s]) return false; seen[s] = true; return true;
        }).slice(0, 20);
      }
      // Dedupe against existing
      var existingLC = pSelectOptions.map(function(o){ return o.toLowerCase(); });
      parts = parts.filter(function(p){ return existingLC.indexOf(p.toLowerCase()) < 0; });
      if (parts.length > 0){
        setPSelectOptions(function(arr){
          var isDefault = arr.length === 2 && /^Option \d$/.test(arr[0]) && /^Option \d$/.test(arr[1]);
          return (isDefault ? [] : arr).concat(parts);
        });
        setPBulkUploadInfo({ name: f.name, count: parts.length });
      }
      e.target.value = ""; // reset so the same file can be picked again later
    };
    if ((f.name || "").toLowerCase().endsWith(".csv") || (f.name || "").toLowerCase().endsWith(".tsv") || (f.name || "").toLowerCase().endsWith(".txt")){
      reader.readAsText(f);
    } else {
      reader.readAsBinaryString(f);
    }
  }
  // Nested field — allows defining the property under a parent struct/object field.
  // When on, the property's effective path becomes parent.key (e.g. "address.street").
  const [pIsNested, setPIsNested] = useState(!!seedParent);
  const [pParent, setPParent]     = useState(seedParent || "");
  // Existing properties on this node — used to populate the parent picker.
  // We include any property as a potential parent so users aren't forced to declare
  // a struct upfront; the runtime treats it as path nesting regardless.
  const existingNodeProps = generateProps(node);
  // Advanced settings — secondary behaviour toggles surfaced under Constraints on the Behaviour step.
  const [pAdvHash, setPAdvHash]                 = useState(false);
  const [pAdvSecure, setPAdvSecure]             = useState(false);
  const [pAdvDisplayInRefs, setPAdvDisplayInRefs] = useState(false);
  const [pAdvSearch, setPAdvSearch]             = useState(false);
  const [pAdvSort, setPAdvSort]                 = useState(false);
  const [pAdvFilter, setPAdvFilter]             = useState(false);
  // Whether this property is materialised into the graph (vs. only the backing record store).
  const [pInGraph, setPInGraph]                 = useState(isEditProp ? (initialProperty.inGraph !== false ? !!initialProperty.inGraph : false) : false);
  // Rules step state — replaces Governance.
  // Three slices: data quality (validate/cleanse/enrich), match (this prop as a match signal), survivorship.
  const [pDqRules, setPDqRules]           = useState([]); // [{ id, kind, template, severity }]
  const [pRuleAddOpen, setPRuleAddOpen]   = useState(false);
  const [pRuleDraftKind, setPRuleDraftKind]   = useState("validation");
  const [pRuleDraftTemplate, setPRuleDraftTemplate] = useState("required");
  const [pRuleDraftSeverity, setPRuleDraftSeverity] = useState("ERROR");
  const [pMatchSignal, setPMatchSignal]   = useState(false);
  const [pMatchStrategy, setPMatchStrategy] = useState("exact");
  const [pMatchWeight, setPMatchWeight]   = useState("0.40");
  const [pSurvStrategy, setPSurvStrategy] = useState("inherit"); // inherit | source_priority | recency | completeness | trust_tier | confidence_weighted | manual
  const [pSurvSources, setPSurvSources]   = useState(["NetSuite ERP","Salesforce CRM","HubSpot Marketing"]);
  // Property-level overrides on parent node governance — default null means "inherits"
  const [pTags, setPTags]                 = useState([]);
  const [pTagsOpen, setPTagsOpen]         = useState(false);
  const [pPermsRead, setPPermsRead]       = useState([{ kind:"group", id:"everyone",       label:"Everyone in org" }]);
  const [pPermsWrite, setPPermsWrite]     = useState([{ kind:"group", id:"data-platform",  label:"data-platform team" }]);
  const [pPermsAdmin, setPPermsAdmin]     = useState([{ kind:"user",  id:"morgan.lee",     label:"Morgan Lee (you)" }]);
  const [pOverrideOwner, setPOverrideOwner]                 = useState(false);
  const [pOverrideRetention, setPOverrideRetention]         = useState(false);
  const [pOverrideClassification, setPOverrideClassification] = useState(false);
  const [pOverrideAccess, setPOverrideAccess]               = useState(false);
  const [pOverrideTags, setPOverrideTags]                   = useState(false);
  const [pOverridePerms, setPOverridePerms]                 = useState(false);
  // Parent node's governance defaults (what the property inherits from)
  const PARENT_GOV = {
    owner: "morgan.lee",
    classification: "internal",
    retention: "2 years",
    access: "All readers of " + (node.label || "node"),
    tags: ["Customer","Core"],
    permsRead: ["read_all","fin_ops"],
    permsWrite: ["acct_admin"],
    permsAdmin: ["data_platform"]
  };
  const [advOpen, setAdvOpen]     = useState(false);
  // Governance state (manual mode, step 3)
  const [pOwner, setPOwner]             = useState("morgan.lee");
  const [pRetention, setPRetention]     = useState("7y");
  const [pClassification, setPClassification] = useState("internal");
  const [pAccess, setPAccess]           = useState("inherit");
  // Bulk mode state
  const [bulkStep, setBulkStep]         = useState(1); // 1=input, 2=review, 3=confirm
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkRows, setBulkRows]         = useState([]); // [{name,type,include}]
  const [bulkTemplate, setBulkTemplate] = useState(null);
  const [bulkQuery, setBulkQuery]       = useState("");

  const SOURCES = ["Salesforce CRM","HubSpot Marketing","NetSuite ERP","Manual / Admin","Computed","Okta Identity"];
  // Reuse the property-type colours / glyphs from the AddNode flow.
  const TYPE_META_LOCAL = {
    "uuid":         { color:"var(--purple)", glyph:"ID"  },
    "string":       { color:"var(--blue)",   glyph:"T"   },
    "string[]":     { color:"var(--blue)",   glyph:"[T]" },
    "decimal":      { color:"var(--gold)",   glyph:"#"   },
    "float":        { color:"var(--gold)",   glyph:".5"  },
    "bool":         { color:"var(--coral)",  glyph:"01"  },
    "timestamp":    { color:"var(--green)",  glyph:"TS"  },
    "date":         { color:"var(--green)",  glyph:"DT"  },
    "enum(20)":     { color:"var(--purple)", glyph:"E"   },
    "enum":         { color:"var(--purple)", glyph:"E"   },
    "single_select":{ color:"var(--purple)", glyph:"S"   },
    "multi_select": { color:"var(--purple)", glyph:"M"   },
    "file":         { color:"var(--ink-3)",  glyph:"F"   },
    "struct":       { color:"var(--ink-3)",  glyph:"{}"  },
    "array":        { color:"var(--ink-3)",  glyph:"[ ]" }
  };
  const TYPE_LIST = [
    { id:"string",        label:"String",        desc:"UTF-8 text of arbitrary length." },
    { id:"decimal",       label:"Decimal",       desc:"Exact numeric — monetary values like ARR or spend." },
    { id:"float",         label:"Float",         desc:"Floating-point numeric — scores and ratios." },
    { id:"bool",          label:"Boolean",       desc:"True / false flag." },
    { id:"timestamp",     label:"Timestamp",     desc:"Date and time with timezone (ISO 8601)." },
    { id:"date",          label:"Date",          desc:"Calendar date without time." },
    { id:"uuid",          label:"UUID",          desc:"Universally unique identifier — use for foreign keys." },
    { id:"single_select", label:"Single select", desc:"Pick exactly one value from a defined list of options." },
    { id:"multi_select",  label:"Multi select",  desc:"Pick one or more values from a defined list of options." },
    { id:"file",          label:"File",          desc:"Uploaded document, image, or attachment." },
    { id:"struct",        label:"Struct",        desc:"Nested JSON object for composite values." },
    { id:"array",         label:"Array",         desc:"Ordered list of values." }
  ];

  const inp = { border:"1px solid var(--line)", borderRadius:7, padding:"9px 11px", fontSize:13, fontFamily:"inherit", color:"var(--ink)", background:"var(--panel)", outline:"none", boxSizing:"border-box", width:"100%", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" };
  const lbl = { display:"block", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.6px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 };

  const canSave = pName.trim().length > 0 && !!pType;
  const typeMeta = TYPE_META_LOCAL[pType] || TYPE_META_LOCAL.string;

  const MODE_LABEL = { manual: isComputationEntry ? "New computation" : "Add property manually", spreadsheet:"Upload a spreadsheet", document:"Parse a document", template:"Pick from a template" };
  // Manual flow is 4 steps; when "computed" is toggled on in Behaviour, a
  // Computation step is inserted between Behaviour and Governance.
  const MANUAL_STEP_IDS = pComputed
    ? ["basics","behaviour","computation","review"]
    : ["basics","behaviour","review"];
  const MANUAL_STEPS = pComputed
    ? ["Basics","Behaviour","Computation","Review"]
    : ["Basics","Behaviour","Review"];
  const stepId = MANUAL_STEP_IDS[step - 1] || MANUAL_STEP_IDS[0];
  const includedCount = bulkRows.filter(function(r){ return r.include; }).length;

  // Suggested property templates per common entity shape — used in template mode.
  const TEMPLATE_PACKS = [
    { id:"identity",   l:"Identity & naming",   d:"Core fields every record has.",        fields:[ {name:"id",type:"uuid"},{name:"name",type:"string"},{name:"slug",type:"string"},{name:"created_at",type:"timestamp"},{name:"updated_at",type:"timestamp"} ] },
    { id:"contact",    l:"Contact details",     d:"Email, phone, address.",               fields:[ {name:"email",type:"string"},{name:"phone",type:"string"},{name:"address_line_1",type:"string"},{name:"city",type:"string"},{name:"country",type:"string"} ] },
    { id:"financial",  l:"Financial signals",   d:"Revenue, ARR, billing, plan.",         fields:[ {name:"arr_usd",type:"decimal"},{name:"mrr_usd",type:"decimal"},{name:"plan",type:"enum"},{name:"billing_cycle",type:"enum"},{name:"renewal_date",type:"date"} ] },
    { id:"health",     l:"Health & churn",      d:"Score, risk, last activity.",          fields:[ {name:"health_score",type:"float"},{name:"churn_risk",type:"float"},{name:"last_activity_at",type:"timestamp"},{name:"open_tickets",type:"decimal"} ] },
    { id:"governance", l:"Ownership & policy",  d:"Owner, classification, retention.",    fields:[ {name:"owner",type:"string"},{name:"data_classification",type:"enum"},{name:"retention_days",type:"decimal"},{name:"region",type:"enum"} ] }
  ];

  // Spreadsheet mode — fake a column-detected result when the user "uploads" a file.
  function fakeDetectSpreadsheet(fileName) {
    setBulkFileName(fileName);
    setBulkRows([
      { name:"customer_id",     type:"uuid",      include:true },
      { name:"first_name",      type:"string",    include:true },
      { name:"last_name",       type:"string",    include:true },
      { name:"email",           type:"string",    include:true },
      { name:"signup_date",     type:"date",      include:true },
      { name:"plan_tier",       type:"enum",      include:true },
      { name:"lifetime_value",  type:"decimal",   include:true },
      { name:"is_active",       type:"bool",      include:true },
      { name:"last_login_at",   type:"timestamp", include:false },
      { name:"_raw_payload",    type:"struct",    include:false }
    ]);
    setBulkStep(2);
  }
  function fakeParseDocument(fileName) {
    setBulkFileName(fileName);
    setBulkRows([
      { name:"contract_number",   type:"string",  include:true },
      { name:"counterparty",      type:"string",  include:true },
      { name:"contract_value",    type:"decimal", include:true },
      { name:"effective_date",    type:"date",    include:true },
      { name:"expiry_date",       type:"date",    include:true },
      { name:"auto_renews",       type:"bool",    include:true },
      { name:"renewal_notice_days", type:"decimal", include:true },
      { name:"governing_law",     type:"enum",    include:false }
    ]);
    setBulkStep(2);
  }
  function applyTemplate(tpl) {
    setBulkTemplate(tpl.id);
    setBulkRows(tpl.fields.map(function(f){ return { name:f.name, type:f.type, include:true }; }));
    setBulkStep(2);
  }

  function updateBulkRow(idx, patch) {
    setBulkRows(function(arr){ return arr.map(function(r, i){ return i === idx ? Object.assign({}, r, patch) : r; }); });
  }
  function addBulkRow() {
    setBulkRows(function(arr){ return arr.concat([{ name:"new_field", type:"string", include:true }]); });
  }
  function removeBulkRow(idx) {
    setBulkRows(function(arr){ return arr.filter(function(_, i){ return i !== idx; }); });
  }

  // Inline type picker for the bulk Review & edit fields table — mirrors the
  // TypePicker in AddNodeFlow so the two flows feel like the same component.
  function BulkTypePicker({ value, onChange }) {
    var [open, setOpen] = useState(false);
    var meta = TYPE_META_LOCAL[value] || TYPE_META_LOCAL.string;
    return (
      <div style={{ position:"relative" }}>
        <button onClick={function(){ setOpen(function(o){ return !o; }); }}
          style={{ display:"flex", alignItems:"center", gap:7, width:"100%", padding:"5px 8px", border:"1px solid var(--line)", borderRadius:6, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5)" }}>
          <span style={{ minWidth:22, height:18, padding:"0 5px", borderRadius:4, background:meta.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.3px", flexShrink:0 }}>{meta.glyph}</span>
          <span style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)" }}>{value}</span>
          <span style={{ color:"var(--ink-3)", fontSize:9, fontFamily:"JetBrains Mono" }}>▾</span>
        </button>
        {open && (
          <>
            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setOpen(false); }} />
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:8, boxShadow:"0 10px 28px rgba(0,0,0,0.14)", padding:4, minWidth:170, maxHeight:280, overflowY:"auto" }}>
              {TYPE_LIST.map(function(t){
                var m = TYPE_META_LOCAL[t.id] || TYPE_META_LOCAL.string;
                var isSel = value === t.id;
                return (
                  <button key={t.id} onClick={function(){ onChange(t.id); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"5px 8px", borderRadius:5, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ minWidth:24, height:18, padding:"0 5px", borderRadius:4, background:m.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, flexShrink:0 }}>{m.glyph}</span>
                    <span style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)" }}>{t.id}</span>
                    {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:11 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Footer state
  let footerLeftText = "";
  let primaryDisabled = false;
  let primaryLabel = "Done";
  let onPrimary = onClose;
  let onBack = null;
  if (mode === "manual") {
    var totalManualSteps = MANUAL_STEPS.length;
    footerLeftText = ""; // step indicator removed from the manual flow per request
    if (step === 1) primaryDisabled = !canSave;
    if (step < totalManualSteps) { primaryLabel = "Continue →"; onPrimary = function(){ setStep(step + 1); }; }
    else                          primaryLabel = "Add property ↵";
    if (step > 1)  onBack = function(){ setStep(step - 1); };
  } else {
    footerLeftText = "Step " + bulkStep + " of 3 · " + (bulkStep === 1 ? "Source" : bulkStep === 2 ? "Review" : "Confirm");
    if (bulkStep === 1) { primaryDisabled = bulkRows.length === 0; primaryLabel = "Review →"; onPrimary = function(){ if (bulkRows.length) setBulkStep(2); }; }
    else if (bulkStep === 2) { primaryDisabled = includedCount === 0; primaryLabel = "Add " + includedCount + " " + (includedCount === 1 ? "property" : "properties") + " ↵"; onPrimary = onClose; }
    if (bulkStep > 1)   onBack = function(){ setBulkStep(bulkStep - 1); };
  }

  // Step list + active-step metadata for the sidebar — keeps the AddPropertyFlow
  // visually aligned with AddNodeFlow / NewEdgeFlow.
  var BULK_STEP_NAMES = mode === "template" ? ["Template", "Review", "Confirm"]
                       : mode === "document" ? ["Document", "Review", "Confirm"]
                       : ["Spreadsheet", "Review", "Confirm"];
  var stepListNames = mode === "manual" ? MANUAL_STEPS : BULK_STEP_NAMES;
  var currentStep = mode === "manual" ? step : bulkStep;
  var totalSteps = stepListNames.length;
  var SUBTITLES_BY_ID = mode === "manual"
    ? {
        basics:      "Give the property a key and a display name, and pick its storage type.",
        behaviour:   "Flags shape how the platform stores, indexes, and protects the value.",
        computation: "Define how this value is derived — Formula, SQL Query, Agent or Automation — plus when to recompute, how to backfill, and what to do on failure.",
        review:      "Review every field before adding. The property will appear in the " + node.label + " table immediately."
      }
    : null;
  var SUBTITLES = mode === "manual"
    ? MANUAL_STEP_IDS.reduce(function(acc, id, i){ acc[i+1] = SUBTITLES_BY_ID[id]; return acc; }, {})
    : mode === "spreadsheet"
    ? { 1:"Upload a CSV or Excel — we'll detect column headers and types.", 2:"Adjust each detected column. Include only what you want to add.", 3:"Confirm and add to " + node.label + "." }
    : mode === "document"
    ? { 1:"Upload a PDF, contract, or onboarding doc — we'll extract candidate fields with inferred types.", 2:"Adjust each extracted field. Include only what you want to add.", 3:"Confirm and add to " + node.label + "." }
    : { 1:"Pick a curated property pack tailored to common entity shapes.", 2:"Adjust each field from the pack. Include only what you want to add.", 3:"Confirm and add to " + node.label + "." };

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.42)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"94vw", maxWidth:1080, height:"92vh", maxHeight:820, background:"var(--bg-canvas)", borderRadius:12, border:"1px solid var(--line)", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.32)" }}>

        {/* HEADER */}
        <div style={{ flexShrink:0, height:56, borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", background:"var(--panel)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"Instrument Serif", fontSize:18, color:"var(--ink)" }}>{isEditProp ? ("Edit property · " + (initialProperty.name || "")) : MODE_LABEL[mode]}</span>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", padding:"2px 7px", borderRadius:4, background:"var(--chip)", letterSpacing:"0.4px" }}>{node.label.toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:15, color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ flex:1, display:"grid", gridTemplateColumns:"240px minmax(0, 1fr)", minHeight:0 }}>

          {/* SIDEBAR */}
          <div style={{ background:"var(--panel-2)", borderRight:"1px solid var(--line)", padding:"20px 14px", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
            {stepListNames.map(function(nm, i){
              var n = i + 1;
              var isOn = currentStep === n;
              var isDone = currentStep > n;
              var thisStepId = mode === "manual" ? MANUAL_STEP_IDS[i] : null;
              var sub = mode === "manual"
                ? (thisStepId === "basics"      ? ((pIsNested && pParent ? pParent + "." : "") + (pName.trim() || "Key & type"))
                   : thisStepId === "behaviour"   ? ((pIsPrimary ? "PK · " : "") + ([pRequired&&"req",pIndexed&&"idx",pUnique&&"unq",pPII&&"pii"].filter(Boolean).join(" · ") || "flags & defaults"))
                   : thisStepId === "computation" ? (pComputeKind + (pFormula ? " · expression set" : " · no expression"))
                   : "Add")
                : (n === 1 ? (bulkFileName || (bulkTemplate ? ((TEMPLATE_PACKS.find(function(t){ return t.id === bulkTemplate; }) || NODE_TEMPLATES.find(function(t){ return "node_" + t.id === bulkTemplate; }) || {}).l || (NODE_TEMPLATES.find(function(t){ return "node_" + t.id === bulkTemplate; }) || {}).name) : "pick source"))
                   : n === 2 ? (bulkRows.length ? includedCount + " of " + bulkRows.length + " included" : "—")
                   : "Add " + includedCount);
              var canGoTo = mode === "manual" ? (n < currentStep || n === currentStep || canSave)
                                              : (n < currentStep || (n === 2 && bulkRows.length > 0) || (n === 3 && includedCount > 0));
              return (
                <button key={n} onClick={function(){ if (canGoTo) { if (mode === "manual") setStep(n); else setBulkStep(n); } }}
                  style={{ display:"flex", gap:12, padding:"10px 12px", borderRadius:7, border: isOn ? "1px solid var(--line)" : "1px solid transparent", background: isOn ? "var(--bg-canvas)" : "transparent", cursor: canGoTo ? "pointer" : "default", fontFamily:"inherit", textAlign:"left", alignItems:"center", opacity: canGoTo ? 1 : 0.55 }}>
                  <span style={{ width:28, height:28, borderRadius:"50%", border:"1px solid " + (isDone ? "var(--green)" : isOn ? "var(--ink)" : "var(--line)"), background: isDone ? "var(--green)" : isOn ? "var(--ink)" : "var(--bg-canvas)", color: isDone || isOn ? "var(--bg-canvas)" : "var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:12, fontWeight:700, flexShrink:0, lineHeight:1 }}>{isDone ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg> : n}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, color:"var(--ink)", fontWeight: isOn ? 500 : 400, lineHeight:1.2 }}>{nm}</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER */}
          <div style={{ padding:"24px 32px 28px", overflowY:"auto" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.8px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:5 }}>{"STEP " + currentStep + " / " + totalSteps}</div>
              <div style={{ fontFamily:"Instrument Serif", fontSize:26, color:"var(--ink)", lineHeight:1.1, marginBottom:8 }}>{stepListNames[currentStep-1]}</div>
              <div style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.55, maxWidth:680 }}>{SUBTITLES[currentStep]}</div>
            </div>

          {/* MANUAL · STEP 1 — Basics: Key → Display Name (+ help text) → Type → Default → Primary key */}
          {mode === "manual" && stepId === "basics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
          {/* KEY */}
          <div>
            <label style={lbl}>Key</label>
            <input value={pName} onChange={function(e){ setPName(e.target.value); }}
              placeholder="e.g. arr_usd"
              style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:13 })} autoFocus />
            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:5 }}>snake_case · this is how the property is referenced in queries and APIs. Unique within {node.label}.</div>
          </div>

          {/* DISPLAY NAME — with inline "Add help text" subtle trigger */}
          <div>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
              <label style={Object.assign({}, lbl, { marginBottom:0 })}>Display name</label>
              {!pHelpOpen && (
                <button onClick={function(){ setPHelpOpen(true); }}
                  style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.5px", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                  + Add help text
                </button>
              )}
            </div>
            <input value={pDisplayName} onChange={function(e){ setPDisplayName(e.target.value); }}
              placeholder="e.g. ARR (USD)"
              style={inp} />
            {pHelpOpen && (
              <div style={{ marginTop:22 }}>
                <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
                  <label style={Object.assign({}, lbl, { marginBottom:0 })}>Help text</label>
                  <button onClick={function(){ setPHelpOpen(false); setPHelpText(""); }}
                    style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px" }}>
                    × Remove
                  </button>
                </div>
                <textarea value={pHelpText} onChange={function(e){ setPHelpText(e.target.value); }}
                  rows={2}
                  placeholder="Short explanation shown next to the field in forms and tooltips."
                  style={Object.assign({}, inp, { resize:"vertical", lineHeight:1.55 })} />
              </div>
            )}
          </div>

          {/* TYPE — card-style picker with proper coloured tiles */}
          <div>
            <label style={lbl}>TYPE</label>
            <div style={{ position:"relative" }}>
              <button ref={pTypeBtnRef} onClick={openPTypePicker}
                style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                {pType ? (
                  <>
                    <span style={{ width:34, height:34, borderRadius:7, background:typeMeta.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, letterSpacing:"0.3px", flexShrink:0 }}>{typeMeta.glyph}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)", fontFamily:"JetBrains Mono" }}>{pType}</div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{(TYPE_LIST.find(function(t){ return t.id === pType; }) || {}).desc || "Storage type for this property's values"}</div>
                    </div>
                    <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                  </>
                ) : (
                  <>
                    <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, color:"var(--ink-3)" }}>Pick a type</div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Click to choose</div>
                    </div>
                    <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                  </>
                )}
              </button>
              {pTypeOpen && (
                <>
                  <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:299 }} onClick={function(){ setPTypeOpen(false); }} />
                  {/* Fixed positioning — escapes the modal's overflow:hidden clip.
                      Smart up/down based on viewport space (see openPTypePicker). */}
                  <div style={{ position:"fixed", top: pTypeCoords.top, left: pTypeCoords.left, width: pTypeCoords.width, zIndex:300, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow: pTypeCoords.openUp ? "0 -14px 38px rgba(0,0,0,0.18)" : "0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight: pTypeCoords.maxHeight, overflowY:"auto" }}>
                    {TYPE_LIST.map(function(t, i){
                      var m = TYPE_META_LOCAL[t.id] || TYPE_META_LOCAL.string;
                      var isSel = pType === t.id;
                      return (
                        <button key={t.id} onClick={function(){ setPType(t.id); setPTypeOpen(false); }}
                          style={{ display:"flex", alignItems:"flex-start", gap:12, width:"100%", padding:"10px 12px", borderRadius:7, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < TYPE_LIST.length-1 ? 2 : 0 }}
                          onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                          onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                          <span style={{ width:32, height:32, borderRadius:6, background:m.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 }}>{m.glyph}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)", fontFamily:"JetBrains Mono" }}>{t.id} <span style={{ color:"var(--ink-3)", fontWeight:400 }}>· {t.label}</span></div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{t.desc}</div>
                          </div>
                          {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* OPTIONS — appears between Type and Default value when type is single_select / multi_select.
              Each row: text input + delete button. "+ Add option" button below. */}
          {(pType === "single_select" || pType === "multi_select") && (
            <div>
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
                <label style={Object.assign({}, lbl, { marginBottom:0 })}>Options <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400, textTransform:"none", letterSpacing:0 }}>· {pSelectOptions.length} {pSelectOptions.length === 1 ? "value" : "values"} · {pType === "single_select" ? "users will pick one" : "users will pick any number"}</span></label>
                <button onClick={function(){ if (pBulkFileRef.current) pBulkFileRef.current.click(); }}
                  style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.5px", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                  + Upload in bulk
                </button>
                {/* Hidden file input — accepts xlsx / csv / tsv / txt. First column of each row becomes an option. */}
                <input ref={pBulkFileRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" style={{ display:"none" }} onChange={handleBulkOptionsFile} />
              </div>
              {pBulkUploadInfo && (
                <div style={{ marginBottom:10, padding:"9px 12px", border:"1px dashed var(--line)", borderRadius:8, background:"var(--panel)", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 7px", borderRadius:4, background:"var(--green-fill)", color:"var(--green)", fontWeight:700, letterSpacing:"0.4px", flexShrink:0 }}>UPLOADED</span>
                  <div style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pBulkUploadInfo.name}</div>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", flexShrink:0 }}>{"+ " + pBulkUploadInfo.count + " added"}</span>
                  <button onClick={function(){ setPBulkUploadInfo(null); }}
                    style={{ width:22, height:22, border:"none", background:"none", cursor:"pointer", color:"var(--ink-3)", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:5 }}>×</button>
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {pSelectOptions.map(function(opt, i){
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px 8px 12px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)" }}>
                      <span style={{ width:20, height:20, borderRadius:5, background:"var(--chip)", color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, flexShrink:0 }}>{i + 1}</span>
                      <input value={opt} onChange={function(e){
                        var v = e.target.value;
                        setPSelectOptions(function(arr){ return arr.map(function(x, j){ return j === i ? v : x; }); });
                      }} placeholder={"Option " + (i + 1)}
                        style={{ flex:1, border:"none", background:"transparent", outline:"none", fontSize:13.5, fontFamily:"inherit", color:"var(--ink)", padding:0 }} />
                      <button onClick={function(){ setPSelectOptions(function(arr){ return arr.filter(function(_, j){ return j !== i; }); }); }}
                        disabled={pSelectOptions.length === 1}
                        title={pSelectOptions.length === 1 ? "Need at least one option" : "Remove"}
                        style={{ width:24, height:24, border:"none", background:"none", cursor: pSelectOptions.length === 1 ? "not-allowed" : "pointer", color:"var(--ink-3)", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:5, opacity: pSelectOptions.length === 1 ? 0.3 : 1 }}>×</button>
                    </div>
                  );
                })}
              </div>
              <button onClick={function(){ setPSelectOptions(function(arr){ return arr.concat(["Option " + (arr.length + 1)]); }); }}
                style={{ marginTop:8, padding:"9px 14px", border:"1px dashed var(--line)", borderRadius:8, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", fontSize:12.5, color:"var(--ink-2)", display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, color:"var(--ink-3)" }}>+</span>
                <span>Add option</span>
              </button>
            </div>
          )}

          {/* DEFAULT VALUE — appears right after Type (or after Options for select types). Skipped for bool, struct, file. */}
          {pType && pType !== "bool" && pType !== "struct" && pType !== "file" && (
            <div>
              <label style={lbl}>Default value <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400, textTransform:"none", letterSpacing:0 }}>optional · used when the source omits a value</span></label>
              {pType === "single_select" ? (
                <select value={pDefault} onChange={function(e){ setPDefault(e.target.value); }} style={inp}>
                  <option value="">— no default —</option>
                  {pSelectOptions.filter(function(o){ return o.trim().length > 0; }).map(function(o){ return <option key={o} value={o}>{o}</option>; })}
                </select>
              ) : pType === "multi_select" ? (
                <input value={pDefault} onChange={function(e){ setPDefault(e.target.value); }}
                  placeholder="e.g. Option 1, Option 2 (comma-separated, must match the options above)"
                  style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12.5 })} />
              ) : (
                <input value={pDefault} onChange={function(e){ setPDefault(e.target.value); }}
                  placeholder={pType === "decimal" || pType === "float" || pType === "int" ? "e.g. 0" : pType === "timestamp" || pType === "datetime" ? "e.g. NOW()" : pType === "date" ? "e.g. 2026-01-01" : pType === "uuid" ? "e.g. uuid_v4()" : pType === "enum" ? "e.g. unknown" : "e.g. —"}
                  style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12.5 })} />
              )}
            </div>
          )}

          {/* NESTING — subtle inline trigger at the END of Basics. Matches the help text pattern. */}
          <div>
            {!pIsNested ? (
              <button onClick={function(){ setPIsNested(true); }}
                style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.5px", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                + Nest under a parent field
              </button>
            ) : (
              <div>
                <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
                  <label style={Object.assign({}, lbl, { marginBottom:0 })}>Parent field</label>
                  <button onClick={function(){ setPIsNested(false); setPParent(""); }}
                    style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.5px" }}>
                    × Remove
                  </button>
                </div>
                <ParentFieldPicker
                  value={pParent}
                  onChange={setPParent}
                  properties={existingNodeProps}
                />

                {pParent && pName && (
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
                    <span>Full path:</span>
                    <code style={{ color:"var(--ink-2)", padding:"1px 6px", borderRadius:4, background:"var(--chip)" }}>{pParent + "." + pName}</code>
                  </div>
                )}
              </div>
            )}
          </div>

          </div>
          )}

          {/* MANUAL · STEP 2 — Behaviour: Computed → Identity (PK) → Constraints → Advanced */}
          {mode === "manual" && stepId === "behaviour" && (
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

            {/* IDENTITY — Primary Key checkbox card. Moved from Basics. Same subtle-border treatment. */}
            <div>
              <label style={lbl}>IDENTITY</label>
              <label style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"13px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                <input type="checkbox" checked={pIsPrimary} onChange={function(e){
                  var on = e.target.checked;
                  setPIsPrimary(on);
                  // Primary key implies required + unique + indexed — apply immediately since they live on the same step
                  if (on){ setPRequired(true); setPUnique(true); setPIndexed(true); }
                }} style={{ accentColor:"var(--ink)", width:15, height:15, marginTop:2, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>Primary key</span>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)", fontWeight:700, letterSpacing:"0.4px" }}>PK</span>
                  </div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:4, lineHeight:1.45 }}>This property uniquely identifies a {node.label} record. Marking it PK automatically enables <b style={{ color:"var(--ink-2)" }}>Required</b>, <b style={{ color:"var(--ink-2)" }}>Unique</b>, and <b style={{ color:"var(--ink-2)" }}>Indexed</b> below.</div>
                </div>
              </label>
            </div>

            {/* GRAPH — full-width card deciding whether the property is materialised into the graph. */}
            <div>
              <label style={lbl}>GRAPH</label>
              <label style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"13px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                <input type="checkbox" checked={pInGraph} onChange={function(e){ setPInGraph(e.target.checked); }} style={{ accentColor:"var(--ink)", width:15, height:15, marginTop:2, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>Graph queryable</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:4, lineHeight:1.45 }}>Makes this property usable in graph (Cypher) queries.</div>
                </div>
              </label>
            </div>

            {/* CONSTRAINTS — checkbox + label + description */}
            <div>
              <label style={lbl}>CONSTRAINTS</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { id:"required", val:pRequired, set:setPRequired, l:"Required", d:"Every record must carry a value. Writes without it are rejected." },
                  { id:"indexed",  val:pIndexed,  set:setPIndexed,  l:"Indexed",  d:"Lookups, filters and joins on this field stay fast at scale." },
                  { id:"unique",   val:pUnique,   set:setPUnique,   l:"Unique",   d:"No two records may share the same value for this property." },
                  { id:"pii",      val:pPII,      set:setPPII,      l:"PII",      d:"Tagged as personal data — reads are audited and gated." }
                ].map(function(f){
                  var on = f.val;
                  return (
                    <label key={f.id}
                      style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"13px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)", transition:"all 100ms" }}>
                      <input type="checkbox" checked={on} onChange={function(e){ f.set(e.target.checked); }} style={{ accentColor:"var(--ink)", width:15, height:15, marginTop:2, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{f.l}</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:4, lineHeight:1.45 }}>{f.d}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ADVANCED SETTINGS — secondary toggles for storage and discovery behaviour. */}
            <div>
              <label style={lbl}>Configure additional properties</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { id:"hash",       val:pAdvHash,            set:setPAdvHash,            l:"Enable hashing",            d:"Securely hash the value at write time before storing." },
                  { id:"secure",     val:pAdvSecure,          set:setPAdvSecure,          l:"Secure field",              d:"Store the value in encrypted form, decrypt on authorised read." },
                  { id:"refs",       val:pAdvDisplayInRefs,   set:setPAdvDisplayInRefs,   l:"Display in references",     d:"Show this field's value when this record is referenced from elsewhere." },
                  { id:"search",     val:pAdvSearch,          set:setPAdvSearch,          l:"Enable search",             d:"Include this field in the full-text search index." },
                  { id:"sort",       val:pAdvSort,            set:setPAdvSort,            l:"Enable sorting",            d:"Allow record lists to be sorted by this field." },
                  { id:"filter",     val:pAdvFilter,          set:setPAdvFilter,          l:"Enable filtering",          d:"Allow records to be filtered by this field." }
                ].map(function(f){
                  var on = f.val;
                  return (
                    <label key={f.id}
                      style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"13px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)", transition:"all 100ms" }}>
                      <input type="checkbox" checked={on} onChange={function(e){ f.set(e.target.checked); }} style={{ accentColor:"var(--ink)", width:15, height:15, marginTop:2, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{f.l}</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:4, lineHeight:1.45 }}>{f.d}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* MANUAL · COMPUTATION — only renders when "Computed" was checked on Behaviour */}
          {mode === "manual" && stepId === "computation" && (function(){
            var detectedInputs = [];
            if (pFormula) {
              var matches = pFormula.match(/\b[a-z_][a-z0-9_]+(?=\b)/g) || [];
              var reserved = ["agent","bucket","if","then","else","true","false","null","and","or","not","case","when","end","sum","avg","min","max","count","coalesce","nullif","cast","date","datetime","timestamp","string","decimal","float","bool","uuid","enum","array","struct"];
              detectedInputs = matches.filter(function(m, i, arr){ return reserved.indexOf(m) < 0 && arr.indexOf(m) === i; }).slice(0, 8);
            }
            var usesAgent = /agent:/.test(pFormula);
            var COMPUTE_TYPES = [
              { id:"formula",    l:"Formula",    d:"Derive this value from other properties on the same record.", icon:<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13L13 3"/><circle cx="4" cy="4" r="1.2"/><circle cx="12" cy="12" r="1.2"/></svg>, color:"var(--gold)"   },
              { id:"sql",        l:"SQL/Cypher", d:"Query over graph or warehouse.",           icon:<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="8" cy="4" rx="5" ry="1.5"/><path d="M3 4v4c0 0.8 2.2 1.5 5 1.5s5-0.7 5-1.5V4"/><path d="M3 8v4c0 0.8 2.2 1.5 5 1.5s5-0.7 5-1.5V8"/></svg>, color:"var(--blue)"   },
              { id:"automation", l:"Automation", d:"Run a workflow and map its output.",        icon:<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5l5 3v7l-5 3-5-3v-7z"/><path d="M3.5 5L8 8.5L12.5 5"/><line x1="8" y1="8.5" x2="8" y2="14"/></svg>, color:"var(--purple)" },
              { id:"agent",      l:"Agent",      d:"Invoke a pre-built agent that scores or classifies this record.", icon:<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.5 1.5-4 4-4s4 1.5 4 4"/><line x1="8" y1="2" x2="8" y2="1.5"/><line x1="11.5" y1="3.5" x2="11.8" y2="3.2"/><line x1="4.5" y1="3.5" x2="4.2" y2="3.2"/></svg>, color:"var(--green)"  }
            ];
            var selectedType = COMPUTE_TYPES.find(function(t){ return t.id === pComputeKind; });
            // Progressive disclosure: only reveal Recompute / Backfill / On-failure / Test once the
            // computation source itself is configured. Formula is always considered ready (it's just
            // a textarea); SQL needs system + connection; Automation needs an automation picked;
            // Agent needs an agent picked.
            var pCompPrereqMet = (
              pComputeKind === "formula" ||
              (pComputeKind === "sql" && pSqlSystem && pSqlConnection) ||
              (pComputeKind === "automation" && pAutomation) ||
              (pComputeKind === "agent" && pAgent)
            );
            function renderPropPick(value, onChange, open, setOpen, options, placeholder){
              var sel = options.find(function(o){ return o.id === value; });
              return (
                <div style={{ position:"relative" }}>
                  <button onClick={function(){ setOpen(!open); }}
                    style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    {sel ? (
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{sel.l}</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sel.d}</div>
                      </div>
                    ) : (
                      <>
                        <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, color:"var(--ink-3)" }}>{placeholder || "Pick an option"}</div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Click to choose</div>
                        </div>
                      </>
                    )}
                    <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                  </button>
                  {open && (
                    <>
                      <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setOpen(false); }} />
                      <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:340, overflowY:"auto" }}>
                        {options.map(function(o, i){
                          var isSel = value === o.id;
                          return (
                            <button key={o.id} onClick={function(){ onChange(o.id); setOpen(false); }}
                              style={{ display:"flex", alignItems:"flex-start", gap:12, width:"100%", padding:"10px 12px", borderRadius:7, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < options.length-1 ? 2 : 0 }}
                              onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                              onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{o.l}</div>
                                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{o.d}</div>
                              </div>
                              {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13, marginTop:2 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            }
            return (
            <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:840 }}>
              {/* COMPUTATION TYPE — card-style picker like the Type field in Basics */}
              <div>
                <label style={lbl}>COMPUTATION TYPE</label>
                <div style={{ position:"relative" }}>
                  <button onClick={function(){ setPComputeKindOpen(function(o){ return !o; }); }}
                    style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    {selectedType ? (
                      <>
                        <span style={{ width:34, height:34, borderRadius:7, background:selectedType.color, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{selectedType.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{selectedType.l}</div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{selectedType.d}</div>
                        </div>
                        <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                      </>
                    ) : (
                      <>
                        <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, color:"var(--ink-3)" }}>Pick a computation type</div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Click to choose</div>
                        </div>
                        <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
                      </>
                    )}
                  </button>
                  {pComputeKindOpen && (
                    <>
                      <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setPComputeKindOpen(false); }} />
                      <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:360, overflowY:"auto" }}>
                        {COMPUTE_TYPES.map(function(t, i){
                          var isSel = pComputeKind === t.id;
                          return (
                            <button key={t.id} onClick={function(){ setPComputeKind(t.id); setPComputeKindOpen(false); }}
                              style={{ display:"flex", alignItems:"flex-start", gap:12, width:"100%", padding:"10px 12px", borderRadius:7, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < COMPUTE_TYPES.length-1 ? 2 : 0 }}
                              onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                              onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                              <span style={{ width:32, height:32, borderRadius:6, background:t.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{t.icon}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{t.l}</div>
                                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{t.d}</div>
                              </div>
                              {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Everything below only appears once a computation type is picked */}
              {!selectedType ? null : (<>
              {/* SQL SYSTEM + CONNECTION — only when SQL/Cypher is chosen.
                  System cards are inline (always visible) so the warehouse choice is obvious.
                  Connection list is filtered by system. */}
              {pComputeKind === "sql" && (function(){
                // Each system gets a brand-colored tile with a recognizable mark. Marks are simple
                // abstractions of each brand (stacked layers for the lakehouse, a snowflake for
                // Snowflake, four squares for SQL Server, etc) drawn as inline SVG.
                var ICON_STROKE = "#fff";
                function ico(children, viewBox){
                  return <svg width="16" height="16" viewBox={viewBox || "0 0 16 16"} fill="none">{children}</svg>;
                }
                var SQL_SYSTEMS = [
                  { id:"databricks", l:"Databricks",    color:"#FF3621", d:"Lakehouse · SQL warehouse + notebooks",
                    icon: ico(<g fill="#fff"><path d="M2 11.5l6 3 6-3v-1.5l-6 3-6-3z" opacity="0.55"/><path d="M2 8l6 3 6-3v-1.5l-6 3-6-3z" opacity="0.75"/><path d="M2 4.5l6 3 6-3-6-3z"/></g>) },
                  { id:"snowflake",  l:"Snowflake",     color:"#29B5E8", d:"Cloud data warehouse · ANSI SQL",
                    icon: ico(<g stroke="#fff" strokeWidth="1.3" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="3.6" y1="3.6" x2="12.4" y2="12.4"/><line x1="12.4" y1="3.6" x2="3.6" y2="12.4"/><polyline points="6.5,3 8,1.5 9.5,3" fill="none"/><polyline points="6.5,13 8,14.5 9.5,13" fill="none"/><polyline points="3,6.5 1.5,8 3,9.5" fill="none"/><polyline points="13,6.5 14.5,8 13,9.5" fill="none"/></g>) },
                  { id:"bigquery",   l:"BigQuery",      color:"#4285F4", d:"Google Cloud · serverless warehouse",
                    icon: ico(<g><circle cx="7.5" cy="7.5" r="4.5" fill="none" stroke="#fff" strokeWidth="1.5"/><line x1="10.8" y1="10.8" x2="13.5" y2="13.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/><line x1="6" y1="7.5" x2="9" y2="7.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/><line x1="7.5" y1="6" x2="7.5" y2="9" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></g>) },
                  { id:"redshift",   l:"Redshift",      color:"#C42637", d:"AWS · columnar warehouse",
                    icon: ico(<g fill="#fff"><rect x="2" y="9" width="2.2" height="5" rx="0.4"/><rect x="5.2" y="6" width="2.2" height="8" rx="0.4"/><rect x="8.4" y="3.5" width="2.2" height="10.5" rx="0.4"/><rect x="11.6" y="7" width="2.2" height="7" rx="0.4"/></g>) },
                  { id:"postgres",   l:"PostgreSQL",    color:"#336791", d:"Open-source relational database",
                    icon: ico(<g><ellipse cx="8" cy="3.6" rx="5.4" ry="1.7" fill="none" stroke="#fff" strokeWidth="1.2"/><path d="M2.6 3.6v8.8c0 0.9 2.4 1.7 5.4 1.7s5.4-0.8 5.4-1.7V3.6" fill="none" stroke="#fff" strokeWidth="1.2"/><path d="M2.6 7.6c0 0.9 2.4 1.7 5.4 1.7s5.4-0.8 5.4-1.7" fill="none" stroke="#fff" strokeWidth="1.2"/></g>) },
                  { id:"mysql",      l:"MySQL",         color:"#00758F", d:"Open-source relational database",
                    icon: ico(<g><path d="M2 11.5c2-1.5 4-1 5 0c0.8 0.8 1 1.5 1 2" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/><path d="M3.5 8.5c1.5-1.5 3.5-1.5 5.5 0c1.5 1.2 2 2.5 2 3.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/><path d="M5 5c2-1 5-0.5 6.5 1c1.5 1.5 2 3.5 2 5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/><circle cx="13.6" cy="11.5" r="0.6" fill="#fff"/></g>) },
                  { id:"mssql",      l:"SQL Server",    color:"#A91D22", d:"Microsoft · enterprise SQL",
                    icon: ico(<g fill="#fff"><rect x="2" y="2" width="5.4" height="5.4"/><rect x="8.6" y="2" width="5.4" height="5.4"/><rect x="2" y="8.6" width="5.4" height="5.4"/><rect x="8.6" y="8.6" width="5.4" height="5.4"/></g>) },
                  { id:"oracle",     l:"Oracle",        color:"#F80000", d:"Enterprise relational database",
                    icon: ico(<ellipse cx="8" cy="8" rx="5.6" ry="3.4" fill="none" stroke="#fff" strokeWidth="2"/>) },
                  { id:"clickhouse", l:"ClickHouse",    color:"#FFCC01", d:"Columnar OLAP · sub-second analytics",
                    icon: ico(<g fill="#1f1300"><rect x="2"   y="2" width="2"   height="12"/><rect x="5"   y="2" width="2"   height="12"/><rect x="8"   y="2" width="2"   height="12"/><rect x="11"  y="2" width="2"   height="12"/><rect x="11"  y="7" width="2"   height="2"/></g>) },
                  { id:"duckdb",     l:"DuckDB",        color:"#FFF000", d:"Embedded analytical SQL",
                    icon: ico(<g><circle cx="6.5" cy="7" r="3.5" fill="#1f1300"/><circle cx="7.5" cy="6.3" r="0.6" fill="#FFF000"/><path d="M9.5 7c0.8-0.6 2-0.7 3-0.3l-0.5 1.2c-0.6-0.2-1.4-0.1-2 0.3" fill="#1f1300"/><path d="M3 11c1 1.5 4 2 6.5 1.4c1.5-0.4 2.6-1.2 3-2" fill="none" stroke="#1f1300" strokeWidth="1.2" strokeLinecap="round"/></g>) },
                  { id:"trino",      l:"Trino",         color:"#DD00A1", d:"Federated query engine (formerly Presto)",
                    icon: ico(<g stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none"><circle cx="8" cy="8" r="2.2"/><line x1="8" y1="1.5" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="3.5" y2="8"/><line x1="12.5" y1="8" x2="14.5" y2="8"/><line x1="3.5" y1="3.5" x2="4.9" y2="4.9"/><line x1="11.1" y1="11.1" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="11.1" y2="4.9"/><line x1="4.9" y1="11.1" x2="3.5" y2="12.5"/></g>) },
                  { id:"presto",     l:"Presto",        color:"#5890FF", d:"Distributed SQL query engine",
                    icon: ico(<g stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none"><circle cx="8" cy="8" r="2"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="14"/><line x1="2" y1="8" x2="4" y2="8"/><line x1="12" y1="8" x2="14" y2="8"/></g>) },
                  { id:"mongo",      l:"MongoDB",       color:"#47A248", d:"Document database · Atlas SQL",
                    icon: ico(<g><path d="M8 1.5C8 4 12 6 12 9.5C12 12 10 14 8 14.5C6 14 4 12 4 9.5C4 6 8 4 8 1.5z" fill="#fff"/><line x1="8" y1="1.5" x2="8" y2="14.5" stroke="#47A248" strokeWidth="0.6"/></g>) },
                  { id:"graph",      l:"Graph (Cypher)", color:"#018BFF", d:"Neo4j / Memgraph · Cypher query language",
                    icon: ico(<g stroke="#fff" strokeWidth="1.3"><circle cx="4" cy="4" r="1.6" fill="#fff"/><circle cx="12" cy="4.5" r="1.6" fill="#fff"/><circle cx="8" cy="12" r="1.6" fill="#fff"/><line x1="5.3" y1="4.5" x2="10.7" y2="4.6" strokeLinecap="round"/><line x1="4.4" y1="5.3" x2="7.2" y2="10.6" strokeLinecap="round"/><line x1="11.5" y1="5.7" x2="8.8" y2="10.7" strokeLinecap="round"/></g>) }
                ];
                var selectedSystem = SQL_SYSTEMS.find(function(s){ return s.id === pSqlSystem; });
                var CONNECTIONS_BY_SYSTEM = {
                  databricks: [
                    { id:"dbx-prod",   l:"analytics-warehouse", sub:"prod · us-east-1" },
                    { id:"dbx-dev",    l:"dev-cluster",         sub:"dev · us-east-1" }
                  ],
                  snowflake: [
                    { id:"snw-prod",   l:"ANALYTICS_PROD",     sub:"data-platform · US-WEST-2" },
                    { id:"snw-raw",    l:"RAW_INGEST",         sub:"ingest · US-EAST-1" }
                  ],
                  bigquery: [
                    { id:"bq-metrics", l:"metrics-prod",       sub:"data-platform" },
                    { id:"bq-logs",    l:"logs",               sub:"raw" }
                  ],
                  redshift: [
                    { id:"rs-prod",    l:"warehouse-prod",     sub:"us-east-1" }
                  ],
                  postgres: [
                    { id:"pg-billing", l:"billing-readonly",   sub:"prod" },
                    { id:"pg-ops",     l:"ops-readonly",       sub:"prod" }
                  ],
                  mysql: [
                    { id:"mysql-app",  l:"app-readonly",       sub:"prod · multi-AZ" },
                    { id:"mysql-bi",   l:"bi-replica",         sub:"reporting · read-only" }
                  ],
                  mssql: [
                    { id:"mssql-erp",  l:"erp-readonly",       sub:"prod" }
                  ],
                  oracle: [
                    { id:"ora-fin",    l:"finance-readonly",   sub:"prod" }
                  ],
                  clickhouse: [
                    { id:"ch-events",  l:"events-prod",        sub:"clickhouse-cloud" }
                  ],
                  duckdb: [
                    { id:"duck-local", l:"local-cache",        sub:"motherduck" }
                  ],
                  trino: [
                    { id:"trino-fed",  l:"federated-prod",     sub:"data-platform" }
                  ],
                  presto: [
                    { id:"presto-fed", l:"presto-warehouse",   sub:"legacy" }
                  ],
                  mongo: [
                    { id:"mongo-app",  l:"app-cluster",        sub:"atlas · M40" }
                  ],
                  graph: [
                    { id:"graph-main", l:"main-graph",         sub:"production · neo4j-aura" }
                  ]
                };
                var systemConnections = CONNECTIONS_BY_SYSTEM[pSqlSystem] || [];
                var selectedConn = systemConnections.find(function(c){ return c.id === pSqlConnection; });
                // Compact two-dropdown layout — system on the left, connection on the right.
                // Each is a single-line trigger with a small brand chip, label, and chevron.
                // The connection picker is disabled-styled until a system is chosen.
                var dropBtn = function(extra){ return Object.assign({ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)", fontSize:13, color:"var(--ink)" }, extra || {}); };
                return (
                  <div>
                    <label style={lbl}>Source</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {/* ── SYSTEM ── */}
                      <div style={{ position:"relative" }}>
                        <button type="button" onClick={function(){ setPSqlSystemOpen(function(o){ return !o; }); setPSqlConnectionOpen(false); }} style={dropBtn()}>
                          {selectedSystem ? (
                            <>
                              <span style={{ width:22, height:22, borderRadius:5, background:selectedSystem.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{selectedSystem.icon}</span>
                              <span style={{ flex:1, minWidth:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:500 }}>{selectedSystem.l}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--ink-4)", flexShrink:0 }} />
                              <span style={{ flex:1, minWidth:0, color:"var(--ink-3)" }}>Pick a system</span>
                            </>
                          )}
                          <span style={{ color:"var(--ink-3)", fontSize:10.5, fontFamily:"JetBrains Mono" }}>{pSqlSystemOpen ? "▴" : "▾"}</span>
                        </button>
                        {pSqlSystemOpen && (
                          <>
                            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setPSqlSystemOpen(false); }} />
                            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:400, overflowY:"auto", minWidth:280 }}>
                              {SQL_SYSTEMS.map(function(sys, i){
                                var isSel = pSqlSystem === sys.id;
                                return (
                                  <button key={sys.id} onClick={function(){ setPSqlSystem(sys.id); setPSqlConnection(""); setPSqlRunState(null); setPSqlSystemOpen(false); }}
                                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 10px", borderRadius:6, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < SQL_SYSTEMS.length-1 ? 1 : 0 }}
                                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                    <span style={{ width:22, height:22, borderRadius:5, background:sys.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{sys.icon}</span>
                                    <span style={{ flex:1, minWidth:0, fontSize:13, fontWeight:500, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sys.l}</span>
                                    {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      {/* ── CONNECTION ── */}
                      <div style={{ position:"relative" }}>
                        <button type="button"
                          onClick={function(){ if (pSqlSystem) { setPSqlConnectionOpen(function(o){ return !o; }); setPSqlSystemOpen(false); } }}
                          disabled={!pSqlSystem}
                          style={dropBtn({ background: pSqlSystem ? "var(--panel)" : "var(--chip)", cursor: pSqlSystem ? "pointer" : "not-allowed", opacity: pSqlSystem ? 1 : 0.65 })}>
                          {selectedConn ? (
                            <>
                              <span style={{ width:8, height:8, borderRadius:"50%", background: selectedSystem ? selectedSystem.color : "var(--ink-4)", flexShrink:0 }} />
                              <span style={{ flex:1, minWidth:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:"JetBrains Mono", fontSize:12.5, fontWeight:500 }}>{selectedConn.l}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--ink-4)", flexShrink:0 }} />
                              <span style={{ flex:1, minWidth:0, color:"var(--ink-3)" }}>{pSqlSystem ? "Pick a connection" : "Pick a system first"}</span>
                            </>
                          )}
                          <span style={{ color:"var(--ink-3)", fontSize:10.5, fontFamily:"JetBrains Mono" }}>{pSqlConnectionOpen ? "▴" : "▾"}</span>
                        </button>
                        {pSqlConnectionOpen && pSqlSystem && (
                          <>
                            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setPSqlConnectionOpen(false); }} />
                            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:360, overflowY:"auto", minWidth:240 }}>
                              {systemConnections.length === 0 ? (
                                <div style={{ padding:"12px 14px", fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-4)" }}>No connections configured.</div>
                              ) : systemConnections.map(function(c, i){
                                var isSel = pSqlConnection === c.id;
                                return (
                                  <button key={c.id} onClick={function(){ setPSqlConnection(c.id); setPSqlRunState(null); setPSqlConnectionOpen(false); }}
                                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 10px", borderRadius:6, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < systemConnections.length-1 ? 1 : 0 }}
                                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                    <span style={{ width:8, height:8, borderRadius:"50%", background: selectedSystem ? selectedSystem.color : "var(--ink-4)", flexShrink:0 }} />
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ fontFamily:"JetBrains Mono", fontSize:12.5, fontWeight:500, color:"var(--ink)" }}>{c.l}</div>
                                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:1 }}>{c.sub}</div>
                                    </div>
                                    {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* AUTOMATION — single rich-card dropdown of all available automations across providers.
                  Matches the Type picker visual (+ dashed tile when empty, label + sub when selected). */}
              {pComputeKind === "automation" && (function(){
                // The sub-line under each automation is the short description of what the
                // workflow does — owner / cadence / runtime metadata is one click away in the
                // automation editor, so it shouldn't crowd the picker.
                var AUTOMATIONS = [
                  { id:"wf-customer-tier",   l:"compute_customer_tier",    d:"Bucket accounts into Bronze / Silver / Gold tiers from ARR and engagement signals." },
                  { id:"wf-health-score",    l:"refresh_health_score",     d:"Recalculate the customer health score from usage, support load and renewal posture." },
                  { id:"wf-onboard-status",  l:"onboard_status_check",     d:"Roll up onboarding milestone completion into a single ready / blocked state." },
                  { id:"wk-arr-rollup",      l:"ARR Rollup → Account",     d:"Aggregate active subscription MRR into an account-level ARR figure." },
                  { id:"wk-renewal-stage",   l:"Renewal Stage Sync",       d:"Mirror the renewal-opportunity stage from the CRM onto the account record." },
                  { id:"zp-form-intake",     l:"Form Intake → Ticket",     d:"Convert a submitted intake form into a triaged support ticket." },
                  { id:"zp-notion-sync",     l:"Notion ↔ CRM",             d:"Keep the canonical customer notes in sync between Notion pages and the CRM." },
                  { id:"tr-enrichment-pipe", l:"Enrichment Pipeline",      d:"Enrich the account with firmographics, tech-stack and intent signals from third-party providers." },
                  { id:"n8-anomaly-detect",  l:"Anomaly Detection",        d:"Flag values that fall outside the expected band for this property type." },
                  { id:"af-customer-360",    l:"customer_360_dag",         d:"Materialise the unified customer view from CRM, billing and product sources." },
                  { id:"af-billing-sync",    l:"billing_sync_dag",         d:"Pull invoice and payment state from the billing system into the graph." },
                  { id:"wh-custom-1",        l:"POST /compute/property",   d:"Send the record to a custom HTTP endpoint and use the response as the value." }
                ];
                return (
                  <div>
                    <label style={lbl}>Select automation</label>
                    {renderPropPick(pAutomation, setPAutomation, pAutomationOpen, setPAutomationOpen, AUTOMATIONS, "Select an existing automation")}
                  </div>
                );
              })()}

              {/* AGENT — single rich-card dropdown of pre-created agents.
                  Same renderPropPick treatment as Automation and Recompute When. */}
              {pComputeKind === "agent" && (function(){
                var AGENTS = [
                  { id:"cust_health_scorer",     l:"cust_health.score",          d:"Customer Health Scorer · 0–1 confidence" },
                  { id:"churn_risk_predictor",   l:"churn_risk.predict",         d:"Churn Risk Predictor · 90-day window" },
                  { id:"support_intent",         l:"support_intent.classify",    d:"Support Intent Classifier · 12 intents" },
                  { id:"fraud_detector",         l:"fraud.detect",               d:"Fraud Detector · transaction-level signal" },
                  { id:"next_best_action",       l:"next_best_action.recommend", d:"Next Best Action · ranked recommendation" },
                  { id:"sentiment_analyzer",     l:"sentiment.analyze",          d:"Sentiment Analyzer · 5-band score" },
                  { id:"price_optimizer",        l:"price.optimize",             d:"Price Optimizer · margin-aware suggestion" },
                  { id:"product_recommender",    l:"product.recommend",          d:"Product Recommender · top-5 SKUs" },
                  { id:"doc_summarizer",         l:"doc.summarize",              d:"Document Summarizer · 1-paragraph TL;DR" },
                  { id:"pii_redactor",           l:"pii.redact",                 d:"PII Redactor · regex + LLM hybrid" },
                  { id:"intent_router",          l:"intent.route",               d:"Intent Router · sends to the right queue" },
                  { id:"language_detector",      l:"language.detect",            d:"Language Detector · ISO-639-1 code" }
                ];
                return (
                  <div>
                    <label style={lbl}>Select agent</label>
                    {renderPropPick(pAgent, setPAgent, pAgentOpen, setPAgentOpen, AGENTS, "Select an existing agent")}
                  </div>
                );
              })()}

              {/* EXPRESSION — formula / sql only (automation and agent have their own blocks above).
                  For Formula, subtle "+ Insert property" and "+ Insert function" dropdowns sit next to the
                  label so the textarea stays the hero. For SQL, the query field only appears once both
                  System AND Connection are picked (progressive disclosure). */}
              {pComputeKind !== "automation" && pComputeKind !== "agent" && (pComputeKind !== "sql" || (pSqlSystem && pSqlConnection)) && (function(){
                var FORMULA_FUNCTIONS = [
                  { id:"bucket",   l:"bucket()",   d:"Map a number into named tiers", insert:"bucket(field, [thr1, thr2], ['low', 'mid', 'high'])" },
                  { id:"if",       l:"if()",       d:"Return one value or another based on a condition", insert:"if(condition, then, else)" },
                  { id:"concat",   l:"concat()",   d:"Combine multiple strings into one", insert:"concat(a, ' ', b)" },
                  { id:"sum",      l:"sum()",      d:"Add a list of numbers together", insert:"sum(a, b)" },
                  { id:"avg",      l:"avg()",      d:"Mean of a list of numbers", insert:"avg(a, b)" },
                  { id:"min",      l:"min()",      d:"Smallest value in the list", insert:"min(a, b)" },
                  { id:"max",      l:"max()",      d:"Largest value in the list", insert:"max(a, b)" },
                  { id:"coalesce", l:"coalesce()", d:"First non-null value (or fallback)", insert:"coalesce(a, b, 'default')" },
                  { id:"lower",    l:"lower()",    d:"Convert string to lower case", insert:"lower(field)" },
                  { id:"upper",    l:"upper()",    d:"Convert string to upper case", insert:"upper(field)" },
                  { id:"trim",     l:"trim()",     d:"Strip leading and trailing whitespace", insert:"trim(field)" },
                  { id:"round",    l:"round()",    d:"Round a number to N decimals", insert:"round(field, 2)" },
                  { id:"lookup",   l:"lookup()",   d:"Pick a value from a reference table by key", insert:"lookup('table', key, 'return_field')" },
                  { id:"agent",    l:"agent:",     d:"Delegate to an internal agent", insert:"agent:name.property" }
                ];
                return (
                  <div>
                    <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
                      <label style={Object.assign({}, lbl, { marginBottom:0 })}>{pComputeKind === "sql" ? "SQL / CYPHER QUERY" : pComputeKind === "agent" ? "AGENT CALL" : "Formula"}</label>
                      <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                        {pComputeKind === "formula" && (
                          <>
                            {/* Insert property */}
                            <div style={{ position:"relative" }}>
                              <button onClick={function(){ setPFmlPropOpen(function(o){ return !o; }); setPFmlFnOpen(false); }}
                                style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color: pFmlPropOpen ? "var(--blue)" : "var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.5px", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                                + Insert property
                              </button>
                              {pFmlPropOpen && (
                                <>
                                  <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setPFmlPropOpen(false); }} />
                                  <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, minWidth:260, maxHeight:320, overflowY:"auto" }}>
                                    {existingNodeProps.length === 0 ? (
                                      <div style={{ padding:"10px 12px", fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-4)" }}>No existing properties on this node yet.</div>
                                    ) : existingNodeProps.map(function(p, i){
                                      return (
                                        <button key={p.name} onClick={function(){ insertIntoFormula(p.name); setPFmlPropOpen(false); }}
                                          style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 11px", borderRadius:6, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < existingNodeProps.length-1 ? 1 : 0 }}
                                          onMouseEnter={function(e){ e.currentTarget.style.background = "var(--panel-2)"; }}
                                          onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; }}>
                                          <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--blue)", flexShrink:0 }} />
                                          <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink)", fontWeight:600 }}>{p.name}</span>
                                          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginLeft:"auto" }}>{p.type}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Insert function */}
                            <div style={{ position:"relative" }}>
                              <button onClick={function(){ setPFmlFnOpen(function(o){ return !o; }); setPFmlPropOpen(false); }}
                                style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color: pFmlFnOpen ? "var(--gold)" : "var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.5px", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                                + Insert function
                              </button>
                              {pFmlFnOpen && (
                                <>
                                  <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setPFmlFnOpen(false); }} />
                                  <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, minWidth:300, maxHeight:360, overflowY:"auto" }}>
                                    {FORMULA_FUNCTIONS.map(function(f, i){
                                      return (
                                        <button key={f.id} onClick={function(){ insertIntoFormula(f.insert); setPFmlFnOpen(false); }}
                                          style={{ display:"flex", alignItems:"flex-start", gap:10, width:"100%", padding:"9px 11px", borderRadius:6, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < FORMULA_FUNCTIONS.length-1 ? 1 : 0 }}
                                          onMouseEnter={function(e){ e.currentTarget.style.background = "var(--panel-2)"; }}
                                          onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; }}>
                                          <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontFamily:"JetBrains Mono", fontSize:12, color:"var(--ink)", fontWeight:600 }}>{f.l}</div>
                                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:2 }}>{f.d}</div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                        {pComputeKind === "sql" && pSqlSystem && pSqlConnection && pFormula && (
                          <button onClick={function(){
                            setPSqlRunState("running");
                            setTimeout(function(){ setPSqlRunState("ok"); }, 900);
                          }}
                            style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10, color: pSqlRunState === "running" ? "var(--ink-4)" : "var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.5px", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                            {pSqlRunState === "running" ? "Running…" : pSqlRunState === "ok" ? "✓ Re-run" : "▷ Run query"}
                          </button>
                        )}
                      </div>
                    </div>
                    {pComputeKind === "formula" ? (
                      // Contenteditable editor — known property names render as inline pills.
                      // We use a ref-callback for initial mount + a useEffect to sync external changes
                      // (NOT dangerouslySetInnerHTML, which would re-render on every keystroke and break the cursor).
                      <FormulaEditor
                        editorRef={pFormulaTextareaRef}
                        value={pFormula || ""}
                        onChange={setPFormula}
                        rePill={rePillEditor}
                        propNames={(existingNodeProps || []).map(function(p){ return p.name; })}
                        toHtml={formulaToPillsHtml}
                        baseStyle={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12.5, lineHeight:1.8, minHeight:118, whiteSpace:"pre-wrap", wordBreak:"break-word", cursor:"text" })}
                      />
                    ) : (
                      <textarea ref={pFormulaTextareaRef} value={pFormula} onChange={function(e){ setPFormula(e.target.value); setPSqlRunState(null); }} rows={pComputeKind === "sql" ? 4 : 3}
                        placeholder={
                          pComputeKind === "sql" ? "SELECT SUM(amount) FROM Order WHERE Order.customer_id = :customer_id"
                          : pComputeKind === "agent" ? "agent:cust_health.score(customer_id)"
                          : "Write the expression here."
                        }
                        style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12.5, lineHeight:1.55, resize:"vertical" })} />
                    )}
                    {pComputeKind === "sql" && pSqlRunState === "ok" && (
                      <div style={{ marginTop:6, padding:"8px 11px", borderRadius:7, border:"1px solid var(--green-fill)", background:"var(--green-fill)", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)" }} />
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--green)", fontWeight:700, letterSpacing:"0.3px" }}>QUERY OK</span>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-2)" }}>1 column · returns DECIMAL · 124 ms · 2,840 rows scanned</span>
                      </div>
                    )}
                    <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:8, lineHeight:1.55 }}>
                      {pComputeKind === "formula"
                        ? <span><b style={{ color:"var(--ink-2)" }}>When to use Formula:</b> when the value can be calculated from other properties on the same {node.label} record — math, conditionals, string concatenation, lookups, or agent calls. For values that live in another system, use <b style={{ color:"var(--ink-2)" }}>SQL/Cypher</b>. To run a multi-step workflow, use <b style={{ color:"var(--ink-2)" }}>Automation</b>.</span>
                        : <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>Use <code style={{ color:"var(--ink-2)" }}>:=</code> for assignment. Reference other properties by name, or call an agent with <code style={{ color:"var(--ink-2)" }}>agent:name.property</code>.</span>}
                    </div>
                  </div>
                );
              })()}


              {/* renderPropPick: builds the Type-picker style trigger + popover for a single-value dropdown */}

              {/* Gated block — Recompute / Backfill / On-failure / Test only render once the source is set. */}
              {pCompPrereqMet && (<>
              {/* RECOMPUTE WHEN — card-style picker */}
              <div>
                <label style={lbl}>RECOMPUTE WHEN</label>
                {renderPropPick(pComputeMode, setPComputeMode, pComputeModeOpen, setPComputeModeOpen, [
                  { id:"on_change", l:"On input change", d:"Re-derive whenever a referenced input updates." },
                  { id:"on_read",   l:"On read (lazy)",  d:"Compute at query time. No precomputed cache." },
                  { id:"daily",     l:"Daily batch",     d:"Once per day at the workspace batch window." },
                  { id:"schedule",  l:"Custom schedule", d:"Cron-style schedule, e.g. every 6 hours." },
                  { id:"manual",    l:"Manual trigger",  d:"Only when an admin or pipeline asks for it." }
                ], "Pick a recompute trigger")}
                {pComputeMode === "schedule" && (
                  <div style={{ marginTop:10 }}>
                    <label style={Object.assign({}, lbl, { fontSize:9, marginBottom:5 })}>CRON SCHEDULE</label>
                    <input value={pComputeSchedule} onChange={function(e){ setPComputeSchedule(e.target.value); }}
                      placeholder="0 2 * * *  (daily at 02:00 UTC)"
                      style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12.5, maxWidth:360 })} />
                  </div>
                )}
              </div>

              {/* BACKFILL — card-style picker */}
              <div>
                <label style={lbl}>BACKFILL EXISTING RECORDS</label>
                {renderPropPick(pComputeBackfill, setPComputeBackfill, pComputeBackfillOpen, setPComputeBackfillOpen, [
                  { id:"all",     l:"All existing", d:"Recompute every record now. Slowest, most correct." },
                  { id:"forward", l:"Forward only", d:"Only new / updated records. Existing rows stay null." },
                  { id:"batched", l:"In batches",   d:"Backfill 10k rows per hour to spread load." }
                ], "Pick a backfill strategy")}
              </div>

              {/* ON FAILURE + COST CAP */}
              <div style={{ display:"grid", gridTemplateColumns: usesAgent ? "1.5fr 1fr" : "1fr", gap:14 }}>
                <div>
                  <label style={lbl}>ON COMPUTATION FAILURE</label>
                  {renderPropPick(pComputeOnFail, setPComputeOnFail, pComputeOnFailOpen, setPComputeOnFailOpen, [
                    { id:"raise",      l:"Raise",       d:"Block the write." },
                    { id:"default",    l:"Use default", d:"Fall back to the default value." },
                    { id:"null",       l:"Leave null",  d:"Skip silently." },
                    { id:"quarantine", l:"Quarantine",  d:"Route to steward queue." }
                  ], "Pick a failure behaviour")}
                </div>
                {usesAgent && (
                  <div>
                    <label style={lbl}>MONTHLY COST CAP <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400, textTransform:"none", letterSpacing:0 }}>USD</span></label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontFamily:"JetBrains Mono", fontSize:13, color:"var(--ink-4)" }}>$</span>
                      <input value={pComputeCostCap} onChange={function(e){ setPComputeCostCap(e.target.value); }}
                        placeholder="100" style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:13, paddingLeft:26 })} />
                    </div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6 }}>Pause agent calls if monthly spend exceeds this.</div>
                  </div>
                )}
              </div>

              {/* TEST RUN */}
              <div style={{ border:"1px dashed var(--line)", borderRadius:9, background:"var(--panel-2)", padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:600, color:"var(--ink)" }}>Test on 3 sample records</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3 }}>Dry-run the expression against the most recent {node.label} records to verify the output.</div>
                  </div>
                  <button onClick={function(){ setPComputeTestOpen(function(o){ return !o; }); }}
                    style={{ padding:"7px 13px", borderRadius:7, border:"1px solid var(--ink-2)", background: pComputeTestOpen ? "var(--ink)" : "var(--panel)", color: pComputeTestOpen ? "var(--bg-canvas)" : "var(--ink-2)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:500, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    {pComputeTestOpen ? "Hide results" : "Run test ⏵"}
                  </button>
                </div>
                {pComputeTestOpen && (
                  <div style={{ marginTop:12, borderTop:"1px solid var(--line-2)", paddingTop:12 }}>
                    <div style={{ border:"1px solid var(--line)", borderRadius:7, overflow:"hidden", background:"var(--panel)" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1.6fr 1fr", gap:10, padding:"8px 12px", background:"var(--panel-2)", borderBottom:"1px solid var(--line-2)", fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", letterSpacing:"0.5px", textTransform:"uppercase" }}>
                        <div>Record</div><div>Inputs</div><div>Output</div>
                      </div>
                      {[
                        { id:"REC-2841", inputs: detectedInputs.length ? detectedInputs.slice(0,2).map(function(i, idx){ return i + "=" + (idx === 0 ? "1240000" : "active"); }).join(" · ") : "—", out: pComputeKind === "agent" ? "0.87" : "ENT" },
                        { id:"REC-2840", inputs: detectedInputs.length ? detectedInputs.slice(0,2).map(function(i, idx){ return i + "=" + (idx === 0 ? "48000"   : "active"); }).join(" · ") : "—", out: pComputeKind === "agent" ? "0.41" : "SMB" },
                        { id:"REC-2839", inputs: detectedInputs.length ? detectedInputs.slice(0,2).map(function(i, idx){ return i + "=" + (idx === 0 ? "320000"  : "churn"); }).join(" · ") : "—", out: pComputeKind === "agent" ? "0.62" : "MM"  }
                      ].map(function(r, i, arr){
                        return (
                          <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1.2fr 1.6fr 1fr", gap:10, padding:"9px 12px", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                            <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--blue)" }}>{r.id}</code>
                            <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.inputs}</code>
                            <code style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--green)", fontWeight:600 }}>→ {r.out}</code>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8, fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>
                      <span>Sampled {node.label.toLowerCase()} records · 3 of {(node.instancesN || 142000).toLocaleString()} total</span>
                      <span>Ran in 124ms · 0 errors</span>
                    </div>
                  </div>
                )}
              </div>
              </>)}
              </>)}
            </div>
            );
          })()}

          {/* Rules step intentionally removed — governance inherits from the {node.label} node type. */}
          {false && (function(){
            // Templates per data-quality rule kind. Aligned with the rule categories used in the global flow.
            var DQ_TEMPLATES = {
              validation: [
                { id:"required",     l:"Required",        d:"Reject writes that omit a value." },
                { id:"format_email", l:"Email format",    d:"Must match a standard email pattern." },
                { id:"format_url",   l:"URL format",      d:"Must be a well-formed URL." },
                { id:"format_uuid",  l:"UUID format",     d:"Must match UUID v4 pattern." },
                { id:"range",        l:"Numeric range",   d:"Value must fall within bounds." },
                { id:"enum",         l:"Enum membership", d:"Value must come from an allowed set." },
                { id:"regex",        l:"Custom regex",    d:"Match a custom pattern." }
              ],
              cleansing: [
                { id:"trim",             l:"Trim whitespace",   d:"Strip leading, trailing and excess interior spaces." },
                { id:"lowercase",        l:"Lowercase",         d:"Convert the value to lower case." },
                { id:"title_case",       l:"Title case",        d:"Capitalize the first letter of each word." },
                { id:"normalize_email",  l:"Normalize email",   d:"Lowercase + strip plus / dot aliases." },
                { id:"normalize_phone",  l:"Normalize phone",   d:"Coerce to E.164 international format." },
                { id:"strip_special",    l:"Strip special",     d:"Whitelist allowed characters via regex." }
              ],
              enrichment: [
                { id:"vendor_lookup",   l:"Vendor lookup",     d:"Augment via ZoomInfo / Clearbit / Apollo." },
                { id:"identity_verify", l:"Identity verify",   d:"Aadhaar, DigiLocker, FDIC, OFAC." },
                { id:"geocode",         l:"Geocode address",   d:"Get latitude / longitude + components." },
                { id:"timezone_convert",l:"Timezone convert",  d:"Convert timestamp to a target zone." },
                { id:"currency_convert",l:"Currency convert",  d:"FX-convert at the record timestamp." }
              ]
            };
            var KIND_META = {
              validation: { code:"VAL", color:"var(--blue)",   fill:"var(--blue-fill)",   label:"Validation" },
              cleansing:  { code:"CLN", color:"var(--green)",  fill:"var(--green-fill)",  label:"Cleansing" },
              enrichment: { code:"ENR", color:"var(--gold)",   fill:"var(--gold-fill)",   label:"Enrichment" }
            };
            var SEV_META = {
              ERROR: { color:"var(--coral)", fill:"var(--coral-fill)" },
              WARN:  { color:"var(--gold)",  fill:"var(--gold-fill)" },
              INFO:  { color:"var(--ink-3)", fill:"var(--chip)" }
            };
            var draftKindMeta = KIND_META[pRuleDraftKind];
            var draftTemplates = DQ_TEMPLATES[pRuleDraftKind] || [];

            function saveDraftRule(){
              var tmpl = draftTemplates.find(function(t){ return t.id === pRuleDraftTemplate; });
              setPDqRules(function(arr){ return arr.concat([{ id: "r_" + Date.now(), kind: pRuleDraftKind, template: pRuleDraftTemplate, label: (tmpl && tmpl.l) || pRuleDraftTemplate, desc: (tmpl && tmpl.d) || "", severity: pRuleDraftSeverity }]); });
              setPRuleAddOpen(false);
              setPRuleDraftKind("validation");
              setPRuleDraftTemplate("required");
              setPRuleDraftSeverity("ERROR");
            }

            return (
            <div style={{ display:"flex", flexDirection:"column", gap:28, maxWidth:860 }}>

              {/* Inherited banner — communicates the node-level inheritance model */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px", border:"1px dashed var(--line)", borderRadius:8, background:"transparent" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--ink-3)", marginTop:7, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:12.5, color:"var(--ink-3)", lineHeight:1.55 }}>
                  Access policies, retention, tags and ownership are <b style={{ color:"var(--ink-2)" }}>inherited</b> from the <code style={{ fontFamily:"JetBrains Mono", fontSize:11, padding:"1px 6px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)" }}>{node.label}</code> node type. Define what's unique to this property below.
                </div>
              </div>

              {/* ── DATA QUALITY ────────────────────────────────────────────── */}
              <div>
                <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>Data quality</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, letterSpacing:"0.3px" }}>Validate, cleanse or enrich this property at read &amp; write time.</div>
                  </div>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)" }}>{pDqRules.length + " " + (pDqRules.length === 1 ? "rule" : "rules")}</span>
                </div>

                {/* Existing rule cards */}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {pDqRules.length === 0 && !pRuleAddOpen && (
                    <div style={{ padding:"22px 14px", border:"1px dashed var(--line)", borderRadius:8, fontSize:12.5, color:"var(--ink-3)", textAlign:"center", background:"var(--panel)" }}>
                      No data quality rules yet. Add one below — start with the templates that fit this property's shape.
                    </div>
                  )}
                  {pDqRules.map(function(r){
                    var km = KIND_META[r.kind] || KIND_META.validation;
                    var sm = SEV_META[r.severity] || SEV_META.ERROR;
                    return (
                      <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)" }}>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"2px 7px", borderRadius:4, background:km.fill, color:km.color, fontWeight:700, letterSpacing:"0.4px", flexShrink:0 }}>{km.code}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>{r.label}</div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, lineHeight:1.45 }}>{r.desc}</div>
                        </div>
                        <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, padding:"2px 7px", borderRadius:4, background:sm.fill, color:sm.color, fontWeight:700, letterSpacing:"0.4px", flexShrink:0 }}>{r.severity}</span>
                        <button onClick={function(){ setPDqRules(function(arr){ return arr.filter(function(x){ return x.id !== r.id; }); }); }} title="Remove rule"
                          style={{ width:26, height:26, border:"none", background:"none", cursor:"pointer", color:"var(--ink-3)", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:5 }}>×</button>
                      </div>
                    );
                  })}
                </div>

                {/* Inline rule editor — opens below the list */}
                {pRuleAddOpen ? (
                  <div style={{ marginTop:10, padding:"16px 18px", border:"1px solid " + draftKindMeta.color, borderRadius:10, background:"var(--panel)", boxShadow:"0 0 0 2px color-mix(in oklab, " + draftKindMeta.color + " 12%, transparent)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.6px", textTransform:"uppercase" }}>New rule</div>
                      <button onClick={function(){ setPRuleAddOpen(false); }} style={{ border:"none", background:"none", padding:0, cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>Cancel</button>
                    </div>

                    {/* Kind selector — 3 segmented buttons */}
                    <div style={{ marginBottom:14 }}>
                      <label style={Object.assign({}, lbl, { marginBottom:6 })}>Rule kind</label>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:8 }}>
                        {["validation","cleansing","enrichment"].map(function(k){
                          var m = KIND_META[k]; var on = pRuleDraftKind === k;
                          return (
                            <button key={k} onClick={function(){ setPRuleDraftKind(k); setPRuleDraftTemplate((DQ_TEMPLATES[k] || [])[0] && (DQ_TEMPLATES[k][0]).id); }}
                              style={{ textAlign:"left", padding:"10px 12px", border:"1px solid " + (on ? m.color : "var(--line)"), borderRadius:8, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", boxShadow: on ? "0 0 0 2px color-mix(in oklab, " + m.color + " 14%, transparent)" : "none", display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:4, background:m.fill, color:m.color, fontWeight:700, letterSpacing:"0.4px" }}>{m.code}</span>
                              <span style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Template */}
                    <div style={{ marginBottom:14 }}>
                      <label style={Object.assign({}, lbl, { marginBottom:6 })}>Template</label>
                      <select value={pRuleDraftTemplate} onChange={function(e){ setPRuleDraftTemplate(e.target.value); }} style={inp}>
                        {draftTemplates.map(function(t){ return <option key={t.id} value={t.id}>{t.l + " · " + t.d}</option>; })}
                      </select>
                    </div>

                    {/* Severity */}
                    <div style={{ marginBottom:14 }}>
                      <label style={Object.assign({}, lbl, { marginBottom:6 })}>Severity on violation</label>
                      <div style={{ display:"flex", gap:8 }}>
                        {["ERROR","WARN","INFO"].map(function(s){
                          var m = SEV_META[s]; var on = pRuleDraftSeverity === s;
                          return (
                            <button key={s} onClick={function(){ setPRuleDraftSeverity(s); }}
                              style={{ padding:"8px 14px", border:"1px solid " + (on ? m.color : "var(--line)"), borderRadius:8, background:"var(--panel)", color: on ? m.color : "var(--ink-3)", fontSize:11.5, fontFamily:"JetBrains Mono", fontWeight: on ? 700 : 500, letterSpacing:"0.5px", cursor:"pointer", boxShadow: on ? "0 0 0 2px " + m.color + "22" : "none" }}>{s}</button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end", paddingTop:8, borderTop:"1px dashed var(--line-2)" }}>
                      <button className="btn-ghost" onClick={function(){ setPRuleAddOpen(false); }}>Cancel</button>
                      <button className="btn-dark" onClick={saveDraftRule}>Add rule</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={function(){ setPRuleAddOpen(true); }}
                    style={{ marginTop:10, padding:"10px 14px", border:"1px dashed var(--line)", borderRadius:8, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", fontSize:12.5, color:"var(--ink-2)", display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, color:"var(--ink-3)" }}>+</span>
                    <span>Add data quality rule</span>
                  </button>
                )}
              </div>

              {/* ── MATCH BEHAVIOR ──────────────────────────────────────────── */}
              <div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>Match behavior</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, letterSpacing:"0.3px" }}>How this property contributes when match rules run across {node.label} records.</div>
                </div>
                <label style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"13px 14px", border:"1px solid " + (pMatchSignal ? "var(--purple)" : "var(--line)"), borderRadius:9, background:"var(--panel)", cursor:"pointer", boxShadow: pMatchSignal ? "0 0 0 2px color-mix(in oklab, var(--purple) 14%, transparent)" : "none", transition:"border-color 100ms, box-shadow 100ms" }}>
                  <input type="checkbox" checked={pMatchSignal} onChange={function(e){ setPMatchSignal(e.target.checked); }} style={{ accentColor:"var(--purple)", width:15, height:15, marginTop:2, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>Use this property as a match signal</span>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:4, background:"var(--purple-fill)", color:"var(--purple)", fontWeight:700, letterSpacing:"0.4px" }}>MTC</span>
                    </div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:4, lineHeight:1.45 }}>When match rules run, this property's strategy and weight feed the score that decides auto-merge vs review.</div>
                  </div>
                </label>
                {pMatchSignal && (
                  <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14 }}>
                    <div>
                      <label style={lbl}>Match strategy</label>
                      <select value={pMatchStrategy} onChange={function(e){ setPMatchStrategy(e.target.value); }} style={inp}>
                        <option value="exact">Exact · case-sensitive equality</option>
                        <option value="exact_ci">Exact · case-insensitive</option>
                        <option value="fuzzy_name">Fuzzy name · Jaro-Winkler</option>
                        <option value="fuzzy_token">Fuzzy token · token-set ratio</option>
                        <option value="normalized_email">Normalized email</option>
                        <option value="normalized_domain">Normalized domain</option>
                        <option value="normalized_phone">Normalized phone (E.164)</option>
                        <option value="embedding">Embedding cosine similarity</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Weight · 0–1</label>
                      <input type="number" min="0" max="1" step="0.05" value={pMatchWeight} onChange={function(e){ setPMatchWeight(e.target.value); }} style={inp} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── SURVIVORSHIP ────────────────────────────────────────────── */}
              <div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>Survivorship</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:3, letterSpacing:"0.3px" }}>When sources disagree on this property's value, which one wins?</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:10 }}>
                  {[
                    { id:"inherit",             l:"Inherit from node",  d:"Use the " + node.label + " default policy." },
                    { id:"source_priority",     l:"Source priority",    d:"Pick from a ranked list of sources." },
                    { id:"recency",             l:"Most recent",        d:"Newest updated_at wins." },
                    { id:"completeness",        l:"Most complete",      d:"Longest non-null value wins." },
                    { id:"trust_tier",          l:"Trust tier",          d:"By source trust level." },
                    { id:"confidence_weighted", l:"Confidence weighted", d:"Blend by per-value confidence." }
                  ].map(function(o){
                    var on = pSurvStrategy === o.id;
                    return (
                      <button key={o.id} onClick={function(){ setPSurvStrategy(o.id); }}
                        style={{ textAlign:"left", padding:"12px 14px", border:"1px solid " + (on ? "var(--ink)" : "var(--line)"), borderRadius:8, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", boxShadow: on ? "0 0 0 2px color-mix(in oklab, var(--ink) 10%, transparent)" : "none", transition:"border-color 100ms, box-shadow 100ms" }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{o.l}</div>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:4, lineHeight:1.45 }}>{o.d}</div>
                      </button>
                    );
                  })}
                </div>
                {pSurvStrategy === "source_priority" && (
                  <div style={{ marginTop:14 }}>
                    <label style={lbl}>Source ranking · highest first</label>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {pSurvSources.map(function(src, i){
                        var isTop = i === 0;
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", padding:"10px 14px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)", gap:12 }}>
                            <span style={{ width:22, height:22, borderRadius:"50%", background: isTop ? "var(--ink)" : "var(--chip)", color: isTop ? "var(--panel)" : "var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, flexShrink:0 }}>{i + 1}</span>
                            <span style={{ fontSize:13, color:"var(--ink)", flex:1 }}>{src}</span>
                            <div style={{ display:"flex", gap:2 }}>
                              <button onClick={function(){ if (i > 0) setPSurvSources(function(arr){ var n = arr.slice(); var t = n[i]; n[i] = n[i-1]; n[i-1] = t; return n; }); }} disabled={i === 0} title="Move up" style={{ width:24, height:24, borderRadius:5, border:"1px solid var(--line)", background:"var(--panel)", cursor:"pointer", color:"var(--ink-3)", opacity: i === 0 ? 0.3 : 1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>▲</button>
                              <button onClick={function(){ if (i < pSurvSources.length-1) setPSurvSources(function(arr){ var n = arr.slice(); var t = n[i]; n[i] = n[i+1]; n[i+1] = t; return n; }); }} disabled={i === pSurvSources.length-1} title="Move down" style={{ width:24, height:24, borderRadius:5, border:"1px solid var(--line)", background:"var(--panel)", cursor:"pointer", color:"var(--ink-3)", opacity: i === pSurvSources.length-1 ? 0.3 : 1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>▼</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
            );
          })()}

          {/* MANUAL · STEP 4 — Review */}
          {mode === "manual" && stepId === "review" && (function(){
            // Lookup labels for the various dropdown choices on Computation step
            var RECOMPUTE_LABELS = { on_change:"On input change", on_read:"On read (lazy)", daily:"Daily batch", schedule:"Custom schedule", manual:"Manual trigger" };
            var BACKFILL_LABELS  = { all:"All existing", forward:"Forward only", batched:"In batches" };
            var ONFAIL_LABELS    = { raise:"Raise — block the write", "default":"Use default value", "null":"Leave null — skip silently", quarantine:"Route to steward queue" };
            var SQL_SYS_LABELS   = { databricks:"Databricks", snowflake:"Snowflake", bigquery:"BigQuery", redshift:"Redshift", postgres:"PostgreSQL", mysql:"MySQL", mssql:"SQL Server", oracle:"Oracle", clickhouse:"ClickHouse", duckdb:"DuckDB", trino:"Trino", presto:"Presto", mongo:"MongoDB", graph:"Graph (Cypher)" };
            var CONN_LABELS      = { "dbx-prod":"analytics-warehouse · prod", "dbx-dev":"dev-cluster · dev", "snw-prod":"ANALYTICS_PROD · US-WEST-2", "snw-raw":"RAW_INGEST · US-EAST-1", "bq-metrics":"metrics-prod (data-platform)", "bq-logs":"logs (raw)", "rs-prod":"warehouse-prod · us-east-1", "pg-billing":"billing-readonly · prod", "pg-ops":"ops-readonly · prod", "mysql-app":"app-readonly · prod", "mysql-bi":"bi-replica · reporting", "mssql-erp":"erp-readonly · prod", "ora-fin":"finance-readonly · prod", "ch-events":"events-prod · clickhouse-cloud", "duck-local":"local-cache · motherduck", "trino-fed":"federated-prod", "presto-fed":"presto-warehouse · legacy", "mongo-app":"app-cluster · atlas M40", "graph-main":"main-graph · neo4j-aura" };
            var AUTO_LABELS      = { "wf-customer-tier":"compute_customer_tier (Internal · weekly)", "wf-health-score":"refresh_health_score (Internal · hourly)", "wf-onboard-status":"onboard_status_check (Internal · on-event)", "wk-arr-rollup":"ARR Rollup → Account (Workato · daily)", "wk-renewal-stage":"Renewal Stage Sync (Workato · hourly)", "zp-form-intake":"Form Intake → Ticket (Zapier)", "zp-notion-sync":"Notion ↔ CRM (Zapier)", "tr-enrichment-pipe":"Enrichment Pipeline (Tray.io)", "n8-anomaly-detect":"Anomaly Detection (n8n)", "af-customer-360":"customer_360_dag (Airflow · daily 02:00 UTC)", "af-billing-sync":"billing_sync_dag (Airflow · hourly)", "wh-custom-1":"POST /compute/property (webhook)" };
            var COMPUTE_KIND_LABEL = { formula:"Formula", sql:"SQL/Cypher", automation:"Automation", agent:"Agent" };
            // Build a flat row list for the Summary card
            var summaryRows = [];
            summaryRows.push({ k:"KEY", v:<code style={{ fontFamily:"JetBrains Mono", fontSize:12, padding:"3px 8px", background:"var(--chip)", borderRadius:5, color:"var(--ink)" }}>{(pIsNested && pParent ? pParent + "." : "") + (pName || "untitled")}</code> });
            summaryRows.push({ k:"DISPLAY NAME", v: pDisplayName || <span style={{ color:"var(--ink-4)" }}>— inferred from key</span> });
            if (pIsNested) summaryRows.push({ k:"NESTED UNDER", v: pParent ? <code style={{ fontFamily:"JetBrains Mono", color:"var(--ink-2)" }}>{pParent}</code> : <span style={{ color:"var(--ink-4)" }}>not picked</span> });
            summaryRows.push({ k:"TYPE", v:<span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:24, height:18, padding:"0 6px", borderRadius:4, background:typeMeta.color, color:"#fff", fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700 }}>{typeMeta.glyph}</span><code style={{ fontFamily:"JetBrains Mono" }}>{pType}</code></span> });
            if (pType === "single_select" || pType === "multi_select") summaryRows.push({ k:"OPTIONS", v: <span style={{ display:"inline-flex", flexWrap:"wrap", gap:4, justifyContent:"flex-end" }}>{pSelectOptions.filter(function(o){ return o.trim().length > 0; }).map(function(o){ return <span key={o} style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"2px 7px", borderRadius:4, background:"var(--purple-fill)", color:"var(--purple)", fontWeight:600 }}>{o}</span>; })}</span> });
            summaryRows.push({ k:"DEFAULT", v: pDefault ? <code style={{ fontFamily:"JetBrains Mono", color:"var(--ink)" }}>{pDefault}</code> : <span style={{ color:"var(--ink-4)" }}>—</span> });
            summaryRows.push({ k:"PRIMARY KEY", v: pIsPrimary ? <span style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 7px", borderRadius:4, background:"var(--ink)", color:"var(--panel)", fontWeight:700, letterSpacing:"0.4px" }}>PK</span> : <span style={{ color:"var(--ink-4)" }}>no</span> });
            summaryRows.push({ k:"HELP TEXT", v: pHelpText || <span style={{ color:"var(--ink-4)" }}>—</span> });
            // Flags
            var flagChips = [
              pRequired && { l:"REQUIRED", bg:"var(--chip)",        fg:"var(--ink-2)" },
              pIndexed  && { l:"INDEXED",  bg:"var(--blue-fill)",   fg:"var(--blue)"  },
              pUnique   && { l:"UNIQUE",   bg:"var(--green-fill)",  fg:"var(--green)" },
              pPII      && { l:"PII",      bg:"var(--coral-fill)",  fg:"var(--coral)" }
            ].filter(Boolean);
            summaryRows.push({ k:"FLAGS", v: flagChips.length === 0 ? <span style={{ color:"var(--ink-4)" }}>none</span> : <span style={{ display:"inline-flex", flexWrap:"wrap", gap:4, justifyContent:"flex-end" }}>{flagChips.map(function(f){ return <span key={f.l} style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 7px", borderRadius:4, background:f.bg, color:f.fg, fontWeight:700, letterSpacing:"0.4px" }}>{f.l}</span>; })}</span> });
            // Advanced flags (only enabled ones)
            var advChips = [
              pAdvHash          && "Hashing",
              pAdvSecure        && "Secure field",
              pAdvDisplayInRefs && "Display in refs",
              pAdvSearch        && "Search",
              pAdvSort          && "Sort",
              pAdvFilter        && "Filter"
            ].filter(Boolean);
            summaryRows.push({ k:"ADVANCED", v: advChips.length === 0 ? <span style={{ color:"var(--ink-4)" }}>none</span> : <span style={{ display:"inline-flex", flexWrap:"wrap", gap:4, justifyContent:"flex-end" }}>{advChips.map(function(a){ return <span key={a} style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 7px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)", fontWeight:600 }}>{a}</span>; })}</span> });
            summaryRows.push({ k:"STORAGE", v: pInGraph
              ? <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><span style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 6px", borderRadius:4, background:"var(--ink)", color:"var(--panel)", fontWeight:700, letterSpacing:"0.4px" }}>GRAPH</span><span style={{ color:"var(--ink-3)" }}>+ record store</span></span>
              : <span style={{ color:"var(--ink-3)" }}>Record store only</span> });
            summaryRows.push({ k:"SOURCE", v: pComputed ? <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><span style={{ fontFamily:"JetBrains Mono", fontSize:10, padding:"2px 6px", borderRadius:4, background:"var(--green-fill)", color:"var(--green)", fontWeight:700, letterSpacing:"0.4px" }}>FX</span>{COMPUTE_KIND_LABEL[pComputeKind] || "(not configured)"}</span> : pSource });

            // Build the Computation card rows when computed
            var compRows = [];
            if (pComputed){
              compRows.push({ k:"COMPUTATION TYPE", v: <code style={{ fontFamily:"JetBrains Mono", color:"var(--ink)" }}>{COMPUTE_KIND_LABEL[pComputeKind] || "(not set)"}</code> });
              if (pComputeKind === "formula"){
                compRows.push({ k:"FORMULA", v: pFormula ? <code style={{ fontFamily:"JetBrains Mono", fontSize:11.5, padding:"4px 8px", background:"var(--bg-canvas)", border:"1px solid var(--line-2)", borderRadius:5, color:"var(--ink)", whiteSpace:"pre-wrap", display:"inline-block", maxWidth:"100%", textAlign:"left" }}>{pFormula}</code> : <span style={{ color:"var(--ink-4)" }}>(no expression set)</span> });
              } else if (pComputeKind === "sql"){
                compRows.push({ k:"SYSTEM",     v: SQL_SYS_LABELS[pSqlSystem] || <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
                compRows.push({ k:"CONNECTION", v: CONN_LABELS[pSqlConnection] || <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
                compRows.push({ k:"QUERY", v: pFormula ? <code style={{ fontFamily:"JetBrains Mono", fontSize:11.5, padding:"4px 8px", background:"var(--bg-canvas)", border:"1px solid var(--line-2)", borderRadius:5, color:"var(--ink)", whiteSpace:"pre-wrap", display:"inline-block", maxWidth:"100%", textAlign:"left" }}>{pFormula}</code> : <span style={{ color:"var(--ink-4)" }}>(no query set)</span> });
              } else if (pComputeKind === "automation"){
                compRows.push({ k:"AUTOMATION", v: AUTO_LABELS[pAutomation] || <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
              } else if (pComputeKind === "agent"){
                var AGENT_LABELS = { cust_health_scorer:"cust_health.score (Customer Health Scorer)", churn_risk_predictor:"churn_risk.predict (Churn Risk Predictor)", support_intent:"support_intent.classify (Support Intent Classifier)", fraud_detector:"fraud.detect (Fraud Detector)", next_best_action:"next_best_action.recommend", sentiment_analyzer:"sentiment.analyze", price_optimizer:"price.optimize", product_recommender:"product.recommend", doc_summarizer:"doc.summarize", pii_redactor:"pii.redact", intent_router:"intent.route", language_detector:"language.detect" };
                compRows.push({ k:"AGENT", v: AGENT_LABELS[pAgent] ? <code style={{ fontFamily:"JetBrains Mono" }}>{AGENT_LABELS[pAgent]}</code> : <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
              }
              compRows.push({ k:"RECOMPUTE", v: RECOMPUTE_LABELS[pComputeMode] || <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
              if (pComputeMode === "schedule") compRows.push({ k:"CRON SCHEDULE", v: <code style={{ fontFamily:"JetBrains Mono" }}>{pComputeSchedule}</code> });
              compRows.push({ k:"BACKFILL",  v: BACKFILL_LABELS[pComputeBackfill] || <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
              compRows.push({ k:"ON FAILURE", v: ONFAIL_LABELS[pComputeOnFail] || <span style={{ color:"var(--ink-4)" }}>(not picked)</span> });
            }

            function renderCard(title, sub, rows){
              return (
                <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 1px 0 var(--line-2), 0 4px 14px rgba(40,40,20,0.04)", overflow:"hidden" }}>
                  <div className="card-head card-head-row" style={{ background:"var(--panel-2)" }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>{title}</span>
                    <span className="card-head-sub">{sub}</span>
                  </div>
                  <div style={{ padding:"4px 0" }}>
                    {rows.map(function(row, i, arr){
                      return (
                        <div key={row.k} style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:16, padding:"10px 22px", borderBottom: i < arr.length-1 ? "1px dashed var(--line-2)" : "none", alignItems:"baseline" }}>
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase" }}>{row.k}</span>
                          <span style={{ fontSize:13, color:"var(--ink)", textAlign:"right" }}>{row.v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
          <div style={{ display:"flex", flexDirection:"column", gap:22, maxWidth:760 }}>
            {/* SUMMARY — primary card. No header subtitle: the type +
                flags are already surfaced in the TYPE and FLAGS rows
                below, so repeating them here is just noise. */}
            {renderCard("Summary", null, summaryRows)}
            {pComputed && renderCard("Computation", (COMPUTE_KIND_LABEL[pComputeKind] || "—") + " · " + (RECOMPUTE_LABELS[pComputeMode] || "no trigger"), compRows)}
          </div>
            );
          })()}

          {/* BULK · SPREADSHEET / DOCUMENT — Step 1 */}
          {(mode === "spreadsheet" || mode === "document") && bulkStep === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ padding:"40px 22px", border:"1.5px dashed var(--line)", borderRadius:10, background:"var(--panel)", textAlign:"center", color:"var(--ink-3)" }}>
                <div style={{ width:48, height:48, margin:"0 auto 14px", borderRadius:10, background:"var(--chip)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {mode === "spreadsheet"
                    ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                </div>
                <div style={{ fontSize:14, color:"var(--ink-2)", fontWeight:500, marginBottom:6 }}>{mode === "spreadsheet" ? "Drop a CSV or Excel file here" : "Drop a PDF, contract or onboarding doc"}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)", marginBottom:14 }}>{mode === "spreadsheet" ? "We'll detect column headers and types automatically." : "We'll extract candidate fields with their inferred types."}</div>
                <label style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:7, border:"1px solid var(--line)", background:"var(--panel-2)", cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:11.5, color:"var(--ink-2)" }}>
                  Choose file
                  <input type="file" onChange={function(e){
                    var f = (e.target.files || [])[0];
                    if (!f) return;
                    if (mode === "spreadsheet") fakeDetectSpreadsheet(f.name);
                    else fakeParseDocument(f.name);
                    e.target.value = "";
                  }} style={{ display:"none" }} />
                </label>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:12 }}>or pick a sample to try:</div>
                <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  {(mode === "spreadsheet" ? ["customers.csv","accounts_export.xlsx"] : ["msa_contract.pdf","onboarding_runbook.pdf"]).map(function(fn){
                    return <button key={fn} onClick={function(){ if (mode === "spreadsheet") fakeDetectSpreadsheet(fn); else fakeParseDocument(fn); }} style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"4px 9px", borderRadius:5, border:"1px solid var(--line)", background:"transparent", color:"var(--ink-3)", cursor:"pointer" }}>{fn}</button>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BULK · TEMPLATE — Step 1
              Comprehensive picker that mirrors the new-node template flow:
              the 5 quick property packs sit in their own group at the top,
              followed by every NODE_TEMPLATES entity grouped by department.
              That way a user adding properties to an existing node has the
              same catalog they'd see when creating a brand-new node. */}
          {mode === "template" && bulkStep === 1 && (function(){
            // Normalise NODE_TEMPLATES → same shape applyTemplate expects.
            var entityTemplates = NODE_TEMPLATES.map(function(t){
              return {
                id:        "node_" + t.id,
                l:         t.name,
                d:         t.brief,
                icon:      t.icon,
                department:t.department,
                fields:    t.properties
              };
            });
            var packTemplates = TEMPLATE_PACKS.map(function(t){
              return Object.assign({}, t, { department:"__packs" });
            });
            var allTemplates = packTemplates.concat(entityTemplates);
            var q = (bulkQuery || "").toLowerCase();
            var filtered = q ? allTemplates.filter(function(t){
              if ((t.l + " " + (t.d || "") + " " + (t.fields || []).map(function(f){ return f.name; }).join(" ")).toLowerCase().indexOf(q) >= 0) return true;
              return false;
            }) : allTemplates;
            // Group by department in display order. Property packs go first.
            var DEPT_ORDER = [{ id:"__packs", label:"Property packs", color:"var(--purple)" }].concat(NODE_TEMPLATE_DEPARTMENTS);
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <input value={bulkQuery} onChange={function(e){ setBulkQuery(e.target.value); }} placeholder="Search templates, departments, or fields…" style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12.5 })} />
                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                  {DEPT_ORDER.map(function(dept){
                    var items = filtered.filter(function(t){ return t.department === dept.id; });
                    if (items.length === 0) return null;
                    return (
                      <div key={dept.id}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"0 2px", marginBottom:8 }}>
                          <span style={{ width:7, height:7, borderRadius:"50%", background:dept.color, flexShrink:0 }} />
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, fontWeight:700, letterSpacing:"0.55px", color:"var(--ink-3)", textTransform:"uppercase" }}>{dept.label}</span>
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-4)" }}>· {items.length}</span>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {items.map(function(t){
                            var icon = t.icon || t.l.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
                            return (
                              <button key={t.id} onClick={function(){ applyTemplate(t); }}
                                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", border:"1px solid var(--line)", borderRadius:8, background:"var(--panel)", textAlign:"left", cursor:"pointer", fontFamily:"inherit" }}
                                onMouseEnter={function(e){ e.currentTarget.style.borderColor = "var(--ink-3)"; e.currentTarget.style.background = "var(--bg-canvas)"; }}
                                onMouseLeave={function(e){ e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--panel)"; }}>
                                <span style={{ width:30, height:30, borderRadius:6, background: dept.color + "1f", color: dept.color, display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, flexShrink:0 }}>{icon}</span>
                                <div style={{ minWidth:0, flex:1 }}>
                                  <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                                    <span style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{t.l}</span>
                                    <span style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", padding:"1px 6px", borderRadius:3, background:"var(--chip)", fontWeight:700, letterSpacing:"0.4px" }}>{(t.fields || []).length} FIELDS</span>
                                  </div>
                                  {t.d && <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.d}</div>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--ink-4)", fontSize:12, fontFamily:"JetBrains Mono" }}>No templates match <b style={{ color:"var(--ink-2)" }}>{bulkQuery}</b></div>
                  )}
                </div>
                <div style={{ marginTop:4, fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", textAlign:"right" }}>
                  {filtered.length} of {allTemplates.length} templates across {DEPT_ORDER.filter(function(d){ return allTemplates.some(function(t){ return t.department === d.id; }); }).length} departments
                </div>
              </div>
            );
          })()}

          {/* BULK · STEP 2 — Review & edit fields (mirrors AddNodeFlow Step 2 table) */}
          {(mode === "spreadsheet" || mode === "document" || mode === "template") && bulkStep === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)" }}>
                  {mode === "template" ? "FROM TEMPLATE" : "FROM"} <b style={{ color:"var(--ink-2)" }}>{bulkFileName || ((TEMPLATE_PACKS.find(function(t){ return t.id === bulkTemplate; }) || NODE_TEMPLATES.find(function(t){ return "node_" + t.id === bulkTemplate; }) || {}).l || (NODE_TEMPLATES.find(function(t){ return "node_" + t.id === bulkTemplate; }) || {}).name) || ""}</b>
                </div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)" }}>{includedCount} of {bulkRows.length} included</div>
              </div>

              {/* SHARED PROPERTIES TABLE — matches Create Node "Review & edit fields" */}
              <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 1px 0 var(--line-2), 0 4px 14px rgba(40,40,20,0.04)", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid var(--line-2)", background:"var(--panel-2)" }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>Review & edit fields</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:3 }}>{bulkRows.length + " " + (bulkRows.length === 1 ? "field" : "fields") + " · " + includedCount + " included"}</div>
                  </div>
                  <button onClick={addBulkRow} className="btn-ghost" style={{ fontSize:12 }}>+ Add field</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"32px 1.4fr 130px 1.2fr 40px 40px 40px 32px", gap:8, padding:"9px 18px", background:"var(--panel-2)", borderBottom:"1px solid var(--line-2)", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.5px", color:"var(--ink-3)", textTransform:"uppercase" }}>
                  <div title="Include this field" style={{ textAlign:"center" }}>✓</div>
                  <div>Name</div>
                  <div>Type</div>
                  <div>Description</div>
                  <div title="Required" style={{ textAlign:"center" }}>REQ</div>
                  <div title="Indexed" style={{ textAlign:"center" }}>IDX</div>
                  <div title="PII" style={{ textAlign:"center" }}>PII</div>
                  <div/>
                </div>
                {bulkRows.length === 0 && (
                  <div style={{ padding:"50px 18px", textAlign:"center", color:"var(--ink-3)", fontSize:13 }}>
                    No fields yet. Click <b>+ Add field</b> to start.
                  </div>
                )}
                {bulkRows.map(function(r, i, arr){
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"32px 1.4fr 130px 1.2fr 40px 40px 40px 32px", gap:8, padding:"8px 18px", alignItems:"center", borderBottom: i < arr.length-1 ? "1px solid var(--line-2)" : "none", background: i % 2 === 1 ? "transparent" : "var(--bg-canvas)", opacity: r.include === false ? 0.45 : 1 }}>
                      <input type="checkbox" checked={r.include !== false} onChange={function(e){ updateBulkRow(i, { include: e.target.checked }); }} style={{ accentColor:"var(--ink)", width:16, height:16, justifySelf:"center" }} />
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <input value={r.name} onChange={function(e){ updateBulkRow(i, { name: e.target.value }); }} style={Object.assign({}, inp, { padding:"6px 9px", fontSize:12, fontFamily:"JetBrains Mono" })} />
                        {r.confidence && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color: r.confidence >= 0.9 ? "var(--green)" : "var(--gold)", flexShrink:0, fontWeight:700 }} title={"LLM confidence " + r.confidence}>{Math.round(r.confidence * 100) + "%"}</span>}
                      </div>
                      <BulkTypePicker value={r.type} onChange={function(v){ updateBulkRow(i, { type: v }); }} />
                      <input value={r.description || ""} onChange={function(e){ updateBulkRow(i, { description: e.target.value }); }} placeholder="optional" style={Object.assign({}, inp, { padding:"6px 9px", fontSize:12 })} />
                      <input type="checkbox" checked={r.required || false} onChange={function(e){ updateBulkRow(i, { required: e.target.checked }); }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
                      <input type="checkbox" checked={r.indexed || false} onChange={function(e){ updateBulkRow(i, { indexed: e.target.checked }); }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
                      <input type="checkbox" checked={r.pii || false} onChange={function(e){ updateBulkRow(i, { pii: e.target.checked }); }} style={{ accentColor:"var(--ink)", justifySelf:"center", width:16, height:16 }} />
                      <button onClick={function(){ removeBulkRow(i); }} style={{ width:24, height:24, borderRadius:5, border:"1px solid var(--line)", background:"var(--panel-2)", color:"var(--ink-3)", cursor:"pointer", justifySelf:"center" }}>×</button>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>Uncheck rows to skip them. Names, types, descriptions and flags can be edited here — or tweaked later from the properties table.</div>
            </div>
          )}

          </div>
        </div>

        {/* FOOTER */}
        <div style={{ flexShrink:0, padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--panel)" }}>
          <button className="btn-ghost" onClick={onBack || function(){}} disabled={!onBack} style={{ opacity: onBack ? 0.95 : 0.4 }}>← Back</button>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{footerLeftText}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-dark" disabled={primaryDisabled} onClick={onPrimary} style={{ opacity: primaryDisabled ? 0.45 : 1 }}>{primaryLabel}</button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── ADD EDGE FLOW ────────────────────────────────────────────────────────────

export { PropertiesPane, AddPropertyFlowModal }
