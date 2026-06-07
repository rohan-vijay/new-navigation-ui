import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
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
const NODES = IS_PS_GRAPH ? PS_NODES : _ENT_NODES;
const EDGES = IS_PS_GRAPH ? PS_EDGES : _ENT_EDGES;

const SIDEBAR_NODES = [...NODES].filter(n => n.type !== "agent").sort((a, b) => a.label.localeCompare(b.label));

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
  const filterHit = (n) => filter === "all" || n.type === filter;
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
                <text
                  textAnchor="middle"
                  y={n.size + 28}
                  fontSize="8.5"
                  letterSpacing="0.6"
                  fill="var(--ink-3)"
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {TYPE_META[n.type].tag}
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

function Legend({ filter, setFilter }) {
  return (
    <div className="legend">
      <button className={"legend-pill" + (filter === "entity" || filter === "all" ? "" : " off")} onClick={() => setFilter(filter === "entity" ? "all" : "entity")}>
        <svg width="14" height="14" viewBox="-12 -12 24 24"><circle r="8.5" fill="var(--blue-fill)" stroke="var(--blue)" strokeWidth="1.4" /></svg>
        Entities
      </button>
      <button className={"legend-pill" + (filter === "source" || filter === "all" ? "" : " off")} onClick={() => setFilter(filter === "source" ? "all" : "source")}>
        <svg width="14" height="14" viewBox="-12 -12 24 24"><rect x="-8" y="-8" width="16" height="16" rx="1.5" fill="var(--green-fill)" stroke="var(--green)" strokeWidth="1.4" /></svg>
        Sources
      </button>
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
      if (filter !== "all" && n.type !== filter) return false;
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
        <span className="sb-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </span>
        <input
          placeholder="Search nodes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="sb-collapse" onClick={onToggle} title="Collapse sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="sb-chips">
        <button className={"chip" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>All <span className="chip-n">{counts.all}</span></button>
        <button className={"chip" + (filter === "entity" ? " on" : "")} onClick={() => setFilter("entity")}>Entities <span className="chip-n">{counts.entity}</span></button>
        <button className={"chip" + (filter === "source" ? " on" : "")} onClick={() => setFilter("source")}>Sources <span className="chip-n">{counts.source}</span></button>
      </div>

      <div className="sb-section-head">
        <span>{filtered.length} NODES</span>
        <span className="sb-section-sort">A–Z</span>
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
              <div className="sb-item-sub">{TYPE_META[n.type].tag}</div>
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
export default function GraphStage() {
  // Agents aren't part of the graph here — drop them and any edges touching them.
  const BASE_NODES = useMemo(() => NODES.filter(n => n.type !== "agent"), [])
  const BASE_EDGES = useMemo(() => {
    const ok = {}; BASE_NODES.forEach(n => { ok[n.id] = true })
    return EDGES.filter(e => ok[e.s] && ok[e.t])
  }, [BASE_NODES])
  const [nodes, setNodes] = useState(BASE_NODES)
  const [edges, setEdges] = useState(BASE_EDGES)
  const [selected, setSelected] = useState(null)
  const [hover, setHover] = useState(null)
  const [filter, setFilter] = useState("all")
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
      <main style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#f5f2ea' }}>
        <Canvas
          nodes={nodes} setNodes={setNodes}
          edges={edges} setEdges={setEdges}
          selected={selected} setSelected={setSelected}
          hover={hover} setHover={setHover}
          filter={filter} query={query} savedView={null}
          viewport={viewport} setViewport={setViewport}
          sidebarOpen={sidebarOpen}
          showInferred showEdgeLabels showCounts
          editMode={editMode}
          cursorMode={cursorMode}
          multiSelected={multiSelected} setMultiSelected={setMultiSelected}
          pushHistory={pushHistory}
          onEditAdd={(wx, wy) => { setPendingAddPos({ x: wx, y: wy }); setAddNodeOpen(true) }}
          onEditConnect={(fromId, toId) => setPendingEdgeFrom({ fromId, toId })}
          onEditOpenNode={id => { setSelected(id) }}
          onEditEdge={idx => { const e = edges[idx]; if (!e) return; setPendingEdgeFrom({ fromId: e.s, toId: e.t, editIdx: idx, initialLabel: e.label || "" }) }}
        />
        <Legend filter={filter} setFilter={setFilter} />
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
  { id:"secondary", code:"SEC",  label:"Secondary entity", color:"var(--green)",  fill:"var(--green-fill)",  desc:"Operational records that support the core — Ticket, Interaction, Task, Note." },
  { id:"derived",   code:"DRV",  label:"Derived entity",   color:"var(--purple)", fill:"var(--purple-fill)", desc:"Computed or analytical entities — Account Health, Forecast, Risk Score." }
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

  const TABS = [`Props · ${properties.length}`, `Edges · ${outgoing.length}`, "Sources"];

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <div className="ih-icon">
          <svg width="34" height="34" viewBox="-22 -22 44 44">
            {node.type === "agent" ? (
              <polygon points={[0,1,2,3,4,5].map(i=>{const a=(Math.PI/3)*i-Math.PI/2;const r=14;return `${(r*Math.cos(a)).toFixed(2)},${(r*Math.sin(a)).toFixed(2)}`}).join(" ")} fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />
            ) : node.type === "source" ? (
              <rect x="-13" y="-13" width="26" height="26" rx="3" fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />
            ) : (
              <circle r="13" fill={c.fill} stroke={c.stroke} strokeWidth="1.6" />
            )}
          </svg>
        </div>
        <div className="ih-text">
          <div className="ih-row">
            <div className="ih-title">{node.label}</div>
            <div className="ih-tag">{TYPE_META[node.type].tag}</div>
          </div>
        </div>
        <button className="ih-close" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--line-2)" }}>
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
            <div className="ih-block-head">Properties <span className="ih-block-sub">{properties.length} total · {piiProps} PII</span></div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", background: "#FEFDFB" }}>
              {properties.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: i < properties.length - 1 ? "1px solid var(--line-2)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                      {p.pk  && <span className="snap-tag snap-pk">PK</span>}
                      {p.pii && <span className="snap-tag snap-pii">PII</span>}
                      <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: p.pk ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="snap-type">{p.type}</span>
                      {p.required && <span className="snap-tag">REQ</span>}
                      {p.indexed  && <span className="snap-tag snap-idx">IDX</span>}
                      {p.computed && <span className="snap-tag snap-comp">FX</span>}
                    </div>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: metricColor(p.fill), fontWeight: 600, flexShrink: 0 }}>{p.fill}%</span>
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

        {tab === "Sources" && (
          <div className="ih-block">
            <div className="ih-block-head">Data sources <span className="ih-block-sub">{sources.length} connected</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.map((s, i) => (
                <div key={i} style={{ border: "1px solid var(--line-2)", borderRadius: 8, padding: "12px 14px", background: "var(--panel-2)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{s.name}</div>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--ink-3)", marginTop: 3 }}>{s.freq}</div>
                    </div>
                    <span className={"src-status src-status-" + s.status} style={{ flexShrink: 0 }}>{s.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="snap-tag">{s.type.toUpperCase()}</span>
                    {s.rows !== "—" && <span style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--ink-3)" }}>{s.rows} rows</span>}
                    {s.errors > 0 && <span style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--coral)", marginLeft: "auto" }}>{s.errors} errors</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{"Step " + step + " of 2 · " + stepNames[step-1]}</span>
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
  // Properties
  var [edgeProps, setEdgeProps]       = useState([]);
  // Governance
  var [owner, setOwner]               = useState("morgan.lee");
  var [permsRead,  setPermsRead]      = useState([{ kind:"group", id:"everyone",      label:"Everyone in org" }]);
  var [permsWrite, setPermsWrite]     = useState([{ kind:"group", id:"data-platform", label:"data-platform team" }]);
  var [permsAdmin, setPermsAdmin]     = useState([{ kind:"user",  id:"morgan.lee",    label:"Morgan Lee (you)" }]);

  var stepNames = ["Basics", "Properties", "Review"];

  // Prefer the live nodes from App state — module-scope NODES wouldn't
  // include nodes the user has just added on the canvas.
  var _allNodes = (liveNodes && liveNodes.length) ? liveNodes : NODES;
  var nodeOptions   = _allNodes.filter(function(n){ return n.type === "entity"; });
  var sourceOptions = _allNodes.filter(function(n){ return n.type === "source"; });
  var agentOptions  = _allNodes.filter(function(n){ return n.type === "agent"; });
  var fromN = nodeOptions.find(function(n){ return n.id === fromId; });
  var toN   = nodeOptions.find(function(n){ return n.id === toId; });

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
    { id:"source", title:"From a data source",   tag:"RECOMMENDED",
      desc:"Join two tables. Pick the system that already has this relationship and tell us which column on each side identifies it.",
      best:"Best when the relationship is already represented as a foreign key in your data (e.g. orders.customer_id → customers.id)." },
    { id:"inferred", title:"Inferred by a rule", tag:"",
      desc:"Create the edge whenever a plain-English condition is met. We translate the rule into a query at sync time.",
      best:"Best when the relationship can be computed from existing properties of the two nodes." },
    { id:"agent", title:"Maintained by an agent", tag:"AGENT",
      desc:"An agent watches your data and adds or removes edges as things change.",
      best:"Best when the relationship needs ongoing judgement — risk attribution, identity resolution, semantic links." },
    { id:"manual", title:"Created manually",      tag:"",
      desc:"Admins and stewards add or remove instances through the catalog UI. The graph holds no automatic logic.",
      best:"Best when the relationship is curated by humans — canonical mappings, golden-record overrides, exception lists." }
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
                      : n === 2 ? (edgeProps.length === 0 ? "None — optional" : edgeProps.length + " propert" + (edgeProps.length === 1 ? "y" : "ies"))
                      : "Publish";
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

                <div>
                  <label style={lbl}>DESCRIPTION <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400 }}>optional</span></label>
                  <textarea value={desc} onChange={function(e){ setDesc(e.target.value); }} rows={2} placeholder="What does this edge represent? Read it both directions out loud — does it work?" style={Object.assign({}, inp, { resize:"vertical", lineHeight:1.55 })} />
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

                <div>
                  <label style={lbl}>FLAGS</label>
                  <div style={{ display:"flex", gap:10 }}>
                    {[
                      { v:requiredAtFrom, set:setRequiredAtFrom, l:"Required at From", d:"Every source instance must have at least one of these edges." },
                      { v:symmetric,      set:setSymmetric,      l:"Symmetric / undirected", d:"Direction doesn't matter — useful for peer relationships." }
                    ].map(function(o, i){
                      return (
                        <label key={i} title={o.d}
                          style={{ flex:1, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", border:"1px solid var(--line)", borderRadius:7, background:"var(--panel)", cursor:"pointer" }}>
                          <input type="checkbox" checked={o.v} onChange={function(){ o.set(!o.v); }} style={{ accentColor:"var(--ink)", width:14, height:14 }} />
                          <div>
                            <div style={{ fontSize:13, fontWeight:500, color:"var(--ink)" }}>{o.l}</div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:2 }}>{o.d}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* HOW IS THIS POPULATED — was its own step */}
                <div>
                  <label style={lbl}>HOW IS THIS POPULATED?</label>
                  <RichSelect
                    value={populationKind || ""}
                    onChange={setPopulationKind}
                    options={populationOptions.map(function(o){ return { value:o.id, label:o.title, sub:o.tag }; })}
                    placeholder="— pick a population mode —"
                  />
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6, lineHeight:1.5 }}>
                    {populationKind ? (populationOptions.find(function(o){ return o.id === populationKind; }) || {}).desc : "From a data source · Inferred by a rule · Maintained by an agent · Computed from a property match."}
                  </div>
                </div>

                {/* OWNER — optional inline (was its own Governance step) */}
                <div>
                  <label style={lbl}>OWNER <span style={{ color:"var(--ink-4)", marginLeft:4, fontWeight:400, textTransform:"none", letterSpacing:0 }}>optional</span></label>
                  <select value={owner} onChange={function(e){ setOwner(e.target.value); }} style={inp}>
                    <option value="morgan.lee">Morgan Lee (you · data-platform)</option>
                    <option value="ramin.k">Ramin K · data-platform</option>
                    <option value="jordan.s">Jordan S · customer-ops</option>
                  </select>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)", marginTop:6, lineHeight:1.5 }}>{"Who gets paged when this edge breaks. Access inherits from the endpoint nodes."}</div>
                </div>
              </div>
            )}


            {/* STEP 2 — Properties */}
            {step === 2 && (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {edgeProps.length === 0 ? (
                  <div style={{ padding:"20px 22px", border:"1px dashed var(--line)", borderRadius:10, background:"var(--panel-2)" }}>
                    <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.55, marginBottom:6 }}>No properties yet — that's fine for most edges.</div>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", lineHeight:1.55 }}>Add a property only if every instance can carry a different value for it.</div>
                  </div>
                ) : (
                  <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
                    <div className="card-head card-head-row" style={{ background:"var(--panel-2)" }}>
                      <span style={{ fontSize:13.5, fontWeight:600 }}>Edge properties</span>
                      <span className="card-head-sub">{edgeProps.length}</span>
                    </div>
                    <div>
                      {edgeProps.map(function(p, i){
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr auto auto", gap:10, padding:"10px 18px", borderBottom: i < edgeProps.length-1 ? "1px solid var(--line-2)" : "none", alignItems:"center" }}>
                            <input value={p.name} onChange={function(e){ updateProp(i, { name: e.target.value }); }} placeholder="property name" style={Object.assign({}, inp, { fontFamily:"JetBrains Mono", fontSize:12 })} />
                            <select value={p.type} onChange={function(e){ updateProp(i, { type: e.target.value }); }} style={inp}>
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="datetime">datetime</option>
                              <option value="json">json</option>
                            </select>
                            <label style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-2)" }}>
                              <input type="checkbox" checked={p.required} onChange={function(){ updateProp(i, { required: !p.required }); }} style={{ accentColor:"var(--ink)", width:14, height:14 }} />
                              REQUIRED
                            </label>
                            <button onClick={function(){ removeProp(i); }} style={{ background:"none", border:"none", color:"var(--ink-3)", cursor:"pointer", fontSize:16 }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9.5, color:"var(--ink-3)", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:10 }}>Quick add — common edge properties</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {EDGE_PROPERTY_TEMPLATES.map(function(t){
                      var already = edgeProps.find(function(p){ return p.name === t.name; });
                      return (
                        <button key={t.name} onClick={function(){ if (!already) addProp(t); }} disabled={!!already}
                          style={{ textAlign:"left", padding:"10px 12px", border:"1px solid var(--line)", borderRadius:7, background: already ? "var(--panel-2)" : "var(--panel)", cursor: already ? "default" : "pointer", fontFamily:"inherit", opacity: already ? 0.5 : 1 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <span style={{ fontFamily:"JetBrains Mono", fontSize:11.5, fontWeight:600, color:"var(--ink)" }}>{t.name}</span>
                            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:"var(--ink-3)" }}>{t.type}</span>
                          </div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:4, lineHeight:1.4 }}>{t.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button onClick={function(){ addProp({ name:"", type:"string" }); }} className="btn-ghost" style={{ alignSelf:"flex-start", padding:"8px 14px" }}>+ Add custom property</button>
              </div>
            )}

            {/* STEP 3 — Review */}
            {step === 3 && (
              <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                <div className="card" style={{ background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
                  <div className="card-head card-head-row" style={{ background:"var(--panel-2)" }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>Summary</span>
                    <span className="card-head-sub">{cardinality + " · " + (populationKind || "no population")}</span>
                  </div>
                  <div>
                    {[
                      { k:"LABEL",       v: label ? <span style={{ fontFamily:"JetBrains Mono" }}>{":" + label}</span> : <span style={{ color:"var(--coral)" }}>not set</span> },
                      { k:"FROM → TO",   v: (fromN && toN) ? (fromN.label + "  —" + cardinality + "→  " + toN.label) : <span style={{ color:"var(--coral)" }}>endpoints missing</span> },
                      { k:"INVERSE",     v: inverseLabel ? <span style={{ fontFamily:"JetBrains Mono" }}>{":" + inverseLabel}</span> : <span style={{ color:"var(--ink-4)" }}>—</span> },
                      { k:"FLAGS",       v: [requiredAtFrom && "Required at From", symmetric && "Symmetric"].filter(Boolean).join(" · ") || <span style={{ color:"var(--ink-4)" }}>none</span> },
                      { k:"POPULATION",  v: populationKind === "source"   ? "From source · " + ((sourceOptions.find(function(s){ return s.id === popSourceId; }) || {}).label || "—") + "  ·  " + popFromColumn + " = " + popToColumn
                                            : populationKind === "inferred" ? "Inferred · " + (popRuleText.length > 80 ? popRuleText.slice(0,80) + "…" : popRuleText)
                                            : populationKind === "agent"    ? "Agent · " + ((agentOptions.find(function(a){ return a.id === popAgentId; }) || {}).label || "—")
                                            : populationKind === "manual"   ? "Manual — managed by stewards"
                                            : <span style={{ color:"var(--coral)" }}>not chosen</span> },
                      { k:"PROPERTIES",  v: edgeProps.length === 0 ? <span style={{ color:"var(--ink-4)" }}>none</span> : edgeProps.map(function(p, i){ return <span key={i} style={{ fontFamily:"JetBrains Mono", fontSize:11, padding:"2px 7px", borderRadius:4, background:"var(--chip)", color:"var(--ink-2)", marginRight:4 }}>{p.name + ":" + p.type}</span>; }) },
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
          <span style={{ fontFamily:"JetBrains Mono", fontSize:11, color:"var(--ink-3)" }}>{"Step " + step + " of 3 · " + stepNames[step-1]}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            {step < 3
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
