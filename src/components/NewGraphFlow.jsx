import { useState } from 'react'
import '../linkSource.css'

function generateMiniGraph(seed) {
  var s = (seed || 1) | 0;
  function nxt(){ s = (s * 1664525 + 1013904223) | 0; return Math.abs(s); }
  // viewBox is 200×120; safe inset 18 / 18.
  var W = 200, H = 120;
  var nodes = [];
  // 1 hub
  nodes.push({ x: W * 0.5, y: H * 0.5, r: 9 });
  // 3 mid-ring nodes
  var midN = 3;
  for (var i = 0; i < midN; i++) {
    var a = (i / midN) * Math.PI * 2 + (nxt() % 100) / 600;
    var rad = 30 + (nxt() % 6);
    nodes.push({ x: W*0.5 + Math.cos(a) * rad, y: H*0.5 + Math.sin(a) * rad * 0.85, r: 6 + (nxt() % 3) });
  }
  // 7 outer-ring nodes
  var outN = 7;
  for (var j = 0; j < outN; j++) {
    var b = (j / outN) * Math.PI * 2 + Math.PI / outN + (nxt() % 100) / 700;
    var R = 56 + (nxt() % 8);
    var x = W*0.5 + Math.cos(b) * R;
    var y = H*0.5 + Math.sin(b) * R * 0.78;
    // Clamp to safe inset.
    if (x < 22) x = 22; if (x > W - 22) x = W - 22;
    if (y < 18) y = 18; if (y > H - 18) y = H - 18;
    nodes.push({ x: x, y: y, r: 4 + (nxt() % 3) });
  }
  // Edges: hub→mid, each mid→2 outer, plus a few outer→outer.
  var edges = [];
  for (var m = 1; m <= midN; m++) edges.push([0, m]);
  for (var m2 = 1; m2 <= midN; m2++) {
    var o1 = 1 + midN + ((m2 - 1) * 2) % outN;
    var o2 = 1 + midN + ((m2 - 1) * 2 + 1) % outN;
    edges.push([m2, o1]);
    edges.push([m2, o2]);
  }
  for (var k = 0; k < 3; k++) {
    var a1 = 1 + midN + (nxt() % outN);
    var a2 = 1 + midN + (nxt() % outN);
    if (a1 !== a2) edges.push([a1, a2]);
  }
  return { nodes: nodes, edges: edges, W: W, H: H };
}

function GraphMiniViz({ seed, color }) {
  var g = generateMiniGraph(seed);
  var gradId = "gradMini_" + seed;
  return (
    <svg width="100%" height="100%" viewBox={"0 0 " + g.W + " " + g.H} preserveAspectRatio="xMidYMid slice" style={{ display:"block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.14" />
          <stop offset="60%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0.10" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={g.W} height={g.H} fill={"url(#" + gradId + ")"} />
      <g stroke={color} strokeOpacity="0.32" strokeWidth="0.8" strokeLinecap="round">
        {g.edges.map(function(e, i){
          var a = g.nodes[e[0]], b = g.nodes[e[1]];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>
      <g>
        {g.nodes.map(function(n, i){
          return (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={n.r + 1.5} fill={color} fillOpacity="0.12" />
              <circle cx={n.x} cy={n.y} r={n.r} fill={color} fillOpacity={i === 0 ? 0.85 : 0.6 + (i%3)*0.08} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW GRAPH FLOW — context-aware graph creation (industry → starting point → …)
// ═══════════════════════════════════════════════════════════════════════════════

var GRAPH_INDUSTRIES = [
  { id:"any",           code:"ANY",  label:"Any / cross-industry",        desc:"Horizontal use case — works across sectors",  accent:"var(--ink-3)" },
  { id:"saas",          code:"SaaS", label:"SaaS / B2B Software",         desc:"Subscriptions, accounts, product telemetry",  accent:"var(--blue)" },
  { id:"fintech",       code:"FIN",  label:"Financial Services",          desc:"Customers, accounts, transactions, risk",     accent:"var(--coral)" },
  { id:"healthcare",    code:"HC",   label:"Healthcare / Life Sciences",  desc:"Patients, providers, claims, encounters",     accent:"var(--purple)" },
  { id:"retail",        code:"RTL",  label:"Retail / eCommerce",          desc:"Customers, orders, products, fulfilment",     accent:"var(--gold)" },
  { id:"manufacturing", code:"MFG",  label:"Manufacturing",               desc:"Supply chain, inventory, BOMs, suppliers",    accent:"var(--green)" },
  { id:"logistics",     code:"LOG",  label:"Logistics & Supply",          desc:"Shipments, routes, warehouses, carriers",     accent:"var(--blue)" },
  { id:"media",         code:"MED",  label:"Media & Entertainment",       desc:"Content, audiences, subscriptions, rights",   accent:"var(--purple)" },
  { id:"professional",  code:"PRO",  label:"Professional Services",       desc:"Clients, engagements, billable hours",        accent:"var(--coral)" },
  { id:"public",        code:"PUB",  label:"Public Sector / Education",   desc:"Citizens, programs, grants, casework",        accent:"var(--gold)" }
];

var GRAPH_FUNCTIONS = [
  { id:"enterprise",    code:"ENT", label:"Entire organisation",      desc:"Cross-functional, enterprise-wide context graph",         enterprise:true, accent:"var(--ink)" },
  { id:"revenue",       code:"REV", label:"Sales & Revenue",          desc:"Pipeline, accounts, opportunities, forecasting",          accent:"var(--green)" },
  { id:"customer",      code:"CS",  label:"Customer Success",         desc:"Health, retention, renewals, escalations",                accent:"var(--coral)" },
  { id:"support",       code:"SUP", label:"Customer Support",         desc:"Tickets, escalations, resolution, CSAT",                  accent:"var(--coral)" },
  { id:"marketing",     code:"MKT", label:"Marketing",                desc:"Campaigns, attribution, audiences, content",              accent:"var(--purple)" },
  { id:"product-mgmt",  code:"PM",  label:"Product Management",       desc:"Roadmap, releases, experiments, adoption",                accent:"var(--blue)" },
  { id:"engineering",   code:"ENG", label:"Engineering",              desc:"Services, incidents, deploys, on-call",                   accent:"var(--blue)" },
  { id:"operations",    code:"OPS", label:"Operations",               desc:"Workflows, capacity, throughput, SLAs",                   accent:"var(--gold)" },
  { id:"supply-chain",  code:"SCM", label:"Supply Chain & Procurement", desc:"Suppliers, POs, inventory, logistics",                  accent:"var(--gold)" },
  { id:"finance",       code:"FIN", label:"Finance",                  desc:"GL, journal, invoicing, payments, controls",              accent:"var(--green)" },
  { id:"people",        code:"HR",  label:"People / HR",              desc:"Employees, roles, teams, comp, tenure",                   accent:"var(--purple)" },
  { id:"legal",         code:"LGL", label:"Legal & Compliance",       desc:"Contracts, obligations, policies, audits",                accent:"var(--ink-2)" },
  { id:"risk",          code:"RSK", label:"Risk & Trust",             desc:"Fraud, KYC, controls, holds, signals",                    accent:"var(--coral)" },
  { id:"it-security",   code:"SEC", label:"IT & Security",            desc:"Identity, access, devices, endpoints, SOC",               accent:"var(--ink-2)" },
  { id:"data-platform", code:"DP",  label:"Data Platform",            desc:"Models, lineage, contracts, observability",               accent:"var(--blue)" },
  { id:"analytics",     code:"BI",  label:"Analytics & BI",           desc:"Dashboards, metrics, semantic layer",                     accent:"var(--blue)" },
  { id:"biz-ops",       code:"BIZ", label:"Strategy & BizOps",        desc:"OKRs, planning, cross-team programs",                     accent:"var(--ink)" },
  { id:"partner",       code:"PRT", label:"Partner & Channel",        desc:"Resellers, alliances, co-sell, ISVs",                     accent:"var(--gold)" },
  { id:"facilities",    code:"FAC", label:"Workplace & Facilities",   desc:"Offices, badges, capacity, real estate",                  accent:"var(--gold)" },
  { id:"comms",         code:"PR",  label:"Communications & PR",      desc:"Stories, audiences, mentions, channels",                  accent:"var(--purple)" }
];

// Per-entity metadata: short description + a few representative properties.
// Property names mirror Microsoft Common Data Model (github.com/microsoft/CDM)
// where the vertical has clean CDM coverage — Sales, Marketing, Customer
// Service, Banking, Healthcare (FHIR-aligned), HR. For verticals where CDM
// is sparse or D365-internal (Manufacturing internals, Retail Commerce
// internals) we keep analyst-friendly names.
var ENTITY_META = {
  // ── CRM Sales (CDM crmCommon/sales) ────────────────────────────────────
  "Account":         { desc:"A buying organisation or company.",               props:["account_id","name","account_number","revenue","industry"] },
  "Contact":         { desc:"A person at an account.",                         props:["contact_id","full_name","email_address","job_title","account_id"] },
  "Lead":            { desc:"An unqualified prospect.",                        props:["lead_id","full_name","company_name","subject","lead_source_code","estimated_amount"] },
  "Opportunity":     { desc:"A potential deal in the pipeline.",               props:["opportunity_id","name","estimated_value","close_probability","estimated_close_date","budget_amount"] },
  "Quote":           { desc:"A formal offer with pricing and terms.",          props:["quote_id","quote_number","name","effective_from","expires_on","discount_amount"] },
  "Subscription":    { desc:"An active product subscription.",                 props:["subscription_id","plan","mrr","status","renews_on"] },
  "Invoice":         { desc:"A billing document issued to a customer.",        props:["invoice_id","invoice_number","due_date","date_delivered","discount_amount","payment_terms_code"] },
  "Usage Event":     { desc:"A product usage signal from an account.",         props:["event_id","feature","timestamp","account_id"] },
  "Competitor":      { desc:"A rival vendor on opportunities.",                props:["competitor_id","name","reporting_category","strengths","weaknesses","web_site_url"] },
  "Price List Item": { desc:"A priced SKU on a quote or order line.",          props:["price_list_item_id","product_id","unit_id","amount","percentage"] },

  // ── Customer Service (CDM crmCommon/service) ───────────────────────────
  "Case":            { desc:"A customer service incident.",                    props:["incident_id","title","case_origin_code","case_type_code","priority_code","customer_satisfaction_code"] },
  "Ticket":          { desc:"A support case (alias of Case).",                 props:["ticket_id","subject","priority","status","opened_at"] },
  "Case Resolution": { desc:"How a case was resolved.",                        props:["subject","time_spent","resolution","incident_id"] },
  "Entitlement":     { desc:"What support a customer is entitled to.",         props:["entitlement_id","name","start_date","end_date","allocation_type_code","remaining_terms"] },
  "Knowledge Article": { desc:"A published help-centre article.",              props:["article_id","title","content","key_words","publish_on","language_locale_id"] },
  "SLA":             { desc:"A service-level agreement.",                      props:["sla_id","name","applicable_from","sla_type","first_response_in_minutes"] },
  "Queue":           { desc:"A routing queue for cases.",                      props:["queue_id","name","queue_type","incoming_email","default_mailbox"] },
  "Service":         { desc:"A bookable service offering.",                    props:["service_id","name","duration","granularity","calendar_id","is_schedulable"] },
  "Task":            { desc:"An activity assigned to an owner.",               props:["task_id","subject","scheduled_start","scheduled_end","priority_code","status"] },
  "Site":            { desc:"A physical service location.",                    props:["site_id","name","address","time_zone","capacity"] },
  "Customer":        { desc:"A person or org you serve.",                      props:["customer_id","name","status","ltv","segment"] },
  "Interaction":     { desc:"Any touchpoint with a customer.",                 props:["interaction_id","channel","sentiment","timestamp"] },
  "Health Score":    { desc:"Composite indicator of account health.",          props:["score","trend","computed_at","drivers"] },
  "Renewal":         { desc:"An upcoming or completed contract renewal.",      props:["renewal_id","arr","stage","decision_by"] },

  // ── Marketing (CDM crmCommon + marketing solutions) ────────────────────
  "Campaign":        { desc:"A marketing initiative.",                         props:["campaign_id","name","code_name","actual_start","budgeted_cost","expected_revenue","objective"] },
  "Marketing List":  { desc:"A targeted list of contacts or leads.",           props:["list_id","list_name","purpose","member_type","member_count","last_used_on"] },
  "Marketing Email": { desc:"A campaign email send.",                          props:["email_id","name","subject","from_email","from_name","reply_to_email"] },
  "Customer Journey":{ desc:"A multi-step marketing journey.",                 props:["journey_id","name","start_datetime","end_datetime","is_recurring","workflow_definition"] },
  "Segment":         { desc:"A defined audience cohort.",                      props:["segment_id","segment_name","segment_type","filter_query","activation_status","member_count"] },
  "Marketing Form":  { desc:"A web form that captures leads.",                 props:["form_id","name","fields","submit_action","double_optin"] },

  // ── Banking / Financial Services (CDM accelerators/financialServices) ──
  "Bank":            { desc:"A banking institution.",                          props:["bank_id","bank_code","bank_name","country","state","telephone_no"] },
  "Branch":          { desc:"A bank branch.",                                  props:["branch_id","branch_code","branch_name","bank_id","branch_manager_id"] },
  "Financial Product": { desc:"A loan, deposit or other product instance.",    props:["product_id","branch_id","available_balance","disbursed_amount","installment_amount","delinquency_status","days_past_due"] },
  "Collateral":      { desc:"Asset pledged against a financial product.",      props:["collateral_id","collateral_type","collateral_value","coverage","date_of_valuation"] },
  "KYC Case":        { desc:"Know-Your-Customer due-diligence case.",          props:["kyc_id","customer_id","status","risk_rating","reviewer","opened_on"] },
  "Mortgage Application":{ desc:"A mortgage loan application.",                props:["application_id","customer_id","property_value","loan_amount","status","submitted_on"] },
  "Transaction":     { desc:"A money-movement event.",                         props:["txn_id","amount","currency","direction","posted_at"] },
  "Risk Signal":     { desc:"A flagged anomaly or risk indicator.",            props:["signal_id","type","severity","detected_at"] },
  "Hold":            { desc:"A regulatory or fraud hold on an account.",       props:["hold_id","reason","placed_on","cleared_on"] },
  "Compliance Case": { desc:"An open regulatory or compliance investigation.", props:["case_id","regulator","status","opened_on"] },

  // ── Healthcare (CDM accelerators/healthCare/EMR, FHIR-aligned) ─────────
  "Patient":         { desc:"An individual receiving care (CDM extends Contact).", props:["patient_id","date_of_birth","gender","mrn","primary_provider_id"] },
  "Provider":        { desc:"A practitioner or facility (CDM PractitionerRole).", props:["practitioner_id","name","npi","specialty","practitioner_role"] },
  "Practitioner Role":{ desc:"A clinician's role at an organisation (CDM FHIR).", props:["role_id","practitioner_id","organisation_id","speciality","active"] },
  "Encounter":       { desc:"A clinical visit or admission.",                  props:["encounter_identifier","encounter_class","encounter_status","period_start","period_end","priority"] },
  "Condition":       { desc:"A clinical condition or diagnosis.",              props:["clinical_status","verification_status","asserted_date","onset_date","abatement_date","subject_type"] },
  "Observation":     { desc:"A measurement, finding or vital sign.",           props:["identifier","status","effective_start","value_quantity_unit","value_range_high","value_range_low"] },
  "Procedure":       { desc:"A procedure performed on a patient.",             props:["procedure_identifier","status","performed_start_date","performed_end_date","not_done","description"] },
  "Medication":      { desc:"A medicinal product.",                            props:["name","amount","is_brand","is_over_the_counter","form"] },
  "Allergy Intolerance":{ desc:"An allergy or intolerance record.",            props:["code","type","criticality","verification_status","name"] },
  "Care Plan":       { desc:"A care plan for a patient.",                      props:["care_plan_id","status","intent","title","period_start","period_end"] },
  "Diagnostic Report":{ desc:"A diagnostic report (labs, imaging, etc.).",     props:["report_id","status","category","effective_date","conclusion"] },
  "Healthcare Service":{ desc:"A service offered by a provider.",              props:["service_id","name","comment","appointment_required","eligibility"] },
  "Claim":           { desc:"A healthcare insurance claim.",                   props:["claim_id","amount","status","filed_on"] },

  // ── Commerce / Retail (clean names — D365 Commerce internals are noisy) ──
  "Order":           { desc:"A customer purchase transaction.",                props:["sales_order_id","order_number","date_fulfilled","ship_to_city","payment_terms_code","shipping_method_code"] },
  "Product":         { desc:"A sellable SKU or service.",                      props:["sku","name","category","price","status"] },
  "Shipment":        { desc:"A fulfilment shipment.",                          props:["shipment_id","carrier","tracking","status","shipped_at"] },
  "Return":          { desc:"A returned order or item.",                       props:["return_id","reason","amount","status"] },
  "Inventory":       { desc:"On-hand stock at a location.",                    props:["sku","location","on_hand","reserved"] },
  "Store":           { desc:"A physical retail location.",                     props:["store_id","name","format","region"] },
  "Loyalty Account": { desc:"A customer loyalty membership.",                  props:["loyalty_id","tier","points","since"] },
  "Promotion":       { desc:"A marketing offer or campaign.",                  props:["promo_id","name","discount","valid_until"] },

  // ── Supply Chain / Manufacturing (analyst-friendly — D365 SCM is internal) ──
  "Supplier":        { desc:"A vendor of materials or services.",              props:["supplier_id","name","tier","status"] },
  "Purchase Order":  { desc:"A procurement contract.",                         props:["po_id","amount","supplier_id","status"] },
  "Item":            { desc:"A material or part SKU.",                         props:["item_id","name","uom","cost"] },
  "BOM":             { desc:"A bill of materials for an assembly.",            props:["bom_id","parent_item","components","revision"] },
  "Plant":           { desc:"A manufacturing facility.",                       props:["plant_id","name","region","capacity"] },

  // ── Finance / Ledger ───────────────────────────────────────────────────
  "GL Account":      { desc:"A general-ledger account.",                       props:["gl_code","name","type","currency"] },
  "Journal Entry":   { desc:"A double-entry ledger posting.",                  props:["je_id","date","debit","credit","memo"] },
  "Payment":         { desc:"A payment instrument settlement.",                props:["payment_id","amount","method","received_at"] },
  "Control":         { desc:"A compliance or audit control.",                  props:["control_id","name","framework","owner"] },
  "Policy":          { desc:"A governance or risk policy.",                    props:["policy_id","name","version","effective"] },

  // ── HR (CDM operationsCommon/HumanResources, "Hcm" prefix) ─────────────
  "Employee":        { desc:"A person on the payroll (CDM HcmWorker).",        props:["personnel_number","name","name_alias","known_as","primary_contact_email","language_id"] },
  "Worker":          { desc:"Any worker (employee or contractor).",            props:["personnel_number","party_number","worker_type","name","primary_contact_email"] },
  "Position":        { desc:"A staffed role at a point in time.",              props:["position_id","title","department","position_type","full_time_equivalent","activation","retirement"] },
  "Job":             { desc:"A job definition.",                               props:["job_id","title","description","job_type","function","maximum_number_of_positions"] },
  "Employment":      { desc:"An employment record.",                           props:["worker","personnel_number","employment_start_date","employment_end_date","legal_entity","worker_type"] },
  "Role":            { desc:"A defined job role.",                             props:["role_id","title","level","department"] },
  "Team":            { desc:"An organisational unit.",                         props:["team_id","name","function","leader_id"] },
  "Department":      { desc:"A top-level organisational division.",            props:["department_id","name","function","head_employee_id"] },
  "Manager Chain":   { desc:"Cached reporting hierarchy.",                     props:["employee_id","chain","depth"] },
  "Compensation":    { desc:"Pay and equity data.",                            props:["base","bonus","equity","effective"] },
  "Pay Cycle":       { desc:"A payroll pay-cycle.",                            props:["pay_cycle_id","name","frequency","starts_on"] },
  "Tenure":          { desc:"Cached service-length facts.",                    props:["employee_id","years","start_date"] },

  // ── Cross-cutting ──────────────────────────────────────────────────────
  "Contract":        { desc:"A binding commercial agreement.",                 props:["contract_id","contract_number","active_on","expires_on","billing_frequency_code","net_price"] },
  "Asset":           { desc:"A managed company asset.",                        props:["asset_id","type","assignee","status"] },
  "Location":        { desc:"A physical or logical place.",                    props:["location_id","name","region","type"] },
  "Device":          { desc:"An issued endpoint or laptop.",                   props:["device_id","model","serial","assignee"] },
  "Access Grant":    { desc:"A system or resource permission.",                props:["grant_id","resource","level","granted_on"] }
};
function entityMeta(name){ return ENTITY_META[name] || { desc:"Custom entity — you can describe it once the graph is live.", props:[] }; }

// Map a CDM module label → the canonical folder URL in microsoft/CDM.
var CDM_REPO_BASE = "https://github.com/microsoft/CDM/tree/master/schemaDocuments";
function cdmLink(module) {
  if (!module) return CDM_REPO_BASE;
  if (/Human Resources/i.test(module))       return CDM_REPO_BASE + "/core/operationsCommon/Entities/HumanResources/HRM";
  if (/Marketing/i.test(module))             return CDM_REPO_BASE + "/core/applicationCommon/foundationCommon/crmCommon";
  if (/CRM Sales|Sales/i.test(module))       return CDM_REPO_BASE + "/core/applicationCommon/foundationCommon/crmCommon/sales";
  if (/Service Accelerator|Service/i.test(module)) return CDM_REPO_BASE + "/core/applicationCommon/foundationCommon/crmCommon/service";
  if (/Financial Services|Banking/i.test(module))  return CDM_REPO_BASE + "/core/applicationCommon/foundationCommon/crmCommon/accelerators/financialServices/banking";
  if (/Healthcare|FHIR/i.test(module))       return CDM_REPO_BASE + "/core/applicationCommon/foundationCommon/crmCommon/accelerators/healthCare/electronicMedicalRecords";
  return CDM_REPO_BASE;
}

// Curated starting points — each suggests entities and edges for an industry+function combo
var GRAPH_STARTING_POINTS = [
  // ── Enterprise-wide / cross-functional ─────────────────────────────────
  { id:"enterprise-core", industry:["any","saas","fintech","retail","manufacturing","professional","media","public","logistics","healthcare"], fn:["enterprise","data-platform"],
    name:"Enterprise Context Graph",
    desc:"The cross-functional spine every team queries — the union of CRM, HR, finance, service, marketing, procurement and governance entities in one model. Built to be the parent context graph that every other graph in this workspace draws from.",
    entities:[
      // People & org
      "Customer","Contact","Account","Lead","Employee","Worker","Team","Department","Role","Position",
      // Revenue
      "Opportunity","Quote","Order","Subscription","Invoice","Payment","Contract","Product",
      // Service
      "Case","Knowledge Article","Entitlement","SLA",
      // Marketing
      "Campaign","Customer Journey","Segment",
      // Assets & places
      "Asset","Device","Location",
      // Procurement & governance
      "Vendor","Purchase Order","Policy","Risk"
    ],
    edges:[
      ["Customer","HAS","Account"],["Account","HAS_CONTACT","Contact"],["Lead","QUALIFIED_AS","Opportunity"],
      ["Account","HAS_OPPORTUNITY","Opportunity"],["Opportunity","QUOTED_AS","Quote"],["Quote","CONVERTS_TO","Order"],
      ["Order","BILLED_AS","Invoice"],["Subscription","BILLED_AS","Invoice"],["Account","SUBSCRIBES_TO","Subscription"],
      ["Account","HOLDS","Contract"],["Contract","BILLED_AS","Invoice"],["Invoice","SETTLED_BY","Payment"],
      ["Account","USES","Product"],["Order","CONTAINS","Product"],
      ["Employee","MEMBER_OF","Team"],["Team","PART_OF","Department"],["Employee","HOLDS","Role"],["Employee","ASSIGNED_TO","Position"],
      ["Worker","ASSIGNED_TO","Position"],["Employee","OWNS","Account"],
      ["Customer","OPENED","Case"],["Case","GOVERNED_BY","SLA"],["Case","REFERENCES","Knowledge Article"],["Account","HOLDS","Entitlement"],["Entitlement","COVERS","Case"],
      ["Campaign","ENROLS_IN","Customer Journey"],["Segment","DEFINES","Campaign"],["Customer Journey","TARGETS","Contact"],
      ["Asset","ASSIGNED_TO","Employee"],["Device","ISSUED_TO","Employee"],["Asset","AT","Location"],
      ["Vendor","FULFILS","Purchase Order"],["Department","RAISED","Purchase Order"],
      ["Policy","GOVERNS","Account"],["Risk","ATTACHED_TO","Account"]
    ],
    accent:"var(--ink)" },
  { id:"retail-enterprise", industry:["retail"], fn:["enterprise"],
    name:"Retail Enterprise Graph", more:12,
    desc:"Stores, staff, customers, orders, products, inventory, loyalty and promotions — the operating model of a retail org connected end-to-end.",
    entities:["Store","Employee","Customer","Order","Product","Inventory","Loyalty Account","Promotion","Shipment"],
    edges:[["Customer","SHOPS_AT","Store"],["Employee","WORKS_AT","Store"],["Customer","PLACED","Order"],["Order","CONTAINS","Product"],["Product","STOCKED_IN","Inventory"],["Inventory","HELD_AT","Store"],["Customer","ENROLLED_IN","Loyalty Account"],["Order","APPLIES","Promotion"],["Order","SHIPPED_AS","Shipment"]],
    accent:"var(--gold)" },
  { id:"employee-360", industry:["any","saas","fintech","retail","manufacturing","professional","media","public","logistics","healthcare"], fn:["enterprise","people"],
    name:"Employee 360 Graph",
    cdm:"D365 Human Resources",
    desc:"Aligned to Microsoft CDM Human Resources (HcmWorker / HcmPosition / HcmEmployment). The full workforce view — employees, jobs, positions, manager chains, compensation, issued devices, access and tenure.",
    entities:["Employee","Worker","Position","Job","Employment","Role","Team","Manager Chain","Compensation","Pay Cycle","Device","Access Grant","Tenure"],
    edges:[["Worker","ASSIGNED_TO","Position"],["Position","INSTANCE_OF","Job"],["Employee","HAS","Employment"],["Employee","HOLDS","Role"],["Employee","MEMBER_OF","Team"],["Employee","REPORTS_TO","Manager Chain"],["Employee","PAID_VIA","Compensation"],["Compensation","ON","Pay Cycle"],["Employee","USES","Device"],["Employee","GRANTED","Access Grant"],["Employee","HAS","Tenure"]],
    accent:"var(--blue)" },

  // ── Function-focused ───────────────────────────────────────────────────
  { id:"marketing-engagement", industry:["any","saas","retail","media","professional","fintech"], fn:["marketing","customer"],
    name:"Marketing Engagement Graph",
    cdm:"D365 Marketing",
    desc:"Aligned to Microsoft CDM marketing solution: Campaign → Marketing List → Lead → Customer Journey → Segment, with email sends and form captures.",
    entities:["Campaign","Marketing List","Lead","Contact","Account","Customer Journey","Segment","Marketing Email","Marketing Form","Interaction"],
    edges:[["Campaign","TARGETS","Marketing List"],["Marketing List","CONTAINS","Lead"],["Marketing List","CONTAINS","Contact"],["Campaign","ENROLS_IN","Customer Journey"],["Customer Journey","SENDS","Marketing Email"],["Segment","DEFINES","Marketing List"],["Marketing Form","CAPTURES","Lead"],["Lead","WORKS_AT","Account"],["Contact","WORKS_AT","Account"],["Customer Journey","TRIGGERS","Interaction"]],
    accent:"var(--purple)" },
  { id:"customer-service-graph", industry:["any","saas","fintech","retail","manufacturing","healthcare","professional"], fn:["support","customer","operations"],
    name:"Customer Service Graph",
    cdm:"CRM Service Accelerator",
    desc:"Aligned to Microsoft CDM service accelerator: Case → SLA → Queue → Knowledge Article, governed by Contract and Entitlement; with bookable Services, Sites and Tasks.",
    entities:["Case","Case Resolution","Contract","Entitlement","Knowledge Article","SLA","Queue","Service","Task","Site","Contact","Account"],
    edges:[["Contact","OPENED","Case"],["Account","REPORTED","Case"],["Case","RESOLVED_AS","Case Resolution"],["Case","GOVERNED_BY","SLA"],["Case","ROUTED_TO","Queue"],["Case","REFERENCES","Knowledge Article"],["Contract","INCLUDES","Entitlement"],["Entitlement","COVERS","Case"],["Case","SPAWNS","Task"],["Case","BOOKS","Service"],["Service","DELIVERED_AT","Site"]],
    accent:"var(--coral)" },
  { id:"saas-revenue",   industry:["saas"],          fn:["revenue","customer"],
    name:"Customer Revenue Graph",
    cdm:"CRM Sales",
    desc:"Aligned to Microsoft CDM CRM/Sales: Account → Contact → Lead → Opportunity → Quote → Order → Invoice. Joins the sales motion to product telemetry.",
    entities:["Account","Contact","Lead","Opportunity","Competitor","Quote","Order","Subscription","Invoice","Price List Item","Usage Event"],
    edges:[["Account","HAS_CONTACT","Contact"],["Lead","QUALIFIED_AS","Opportunity"],["Account","HAS_OPPORTUNITY","Opportunity"],["Opportunity","COMPETES_WITH","Competitor"],["Opportunity","QUOTED_AS","Quote"],["Quote","CONTAINS","Price List Item"],["Quote","CONVERTS_TO","Order"],["Order","CONVERTS_TO","Subscription"],["Subscription","BILLED_AS","Invoice"],["Order","BILLED_AS","Invoice"],["Account","EMITS","Usage Event"]],
    accent:"var(--blue)" },
  { id:"saas-success",   industry:["saas"],          fn:["customer","support","operations"],
    name:"Customer Health Graph",
    cdm:"CRM Service Accelerator",
    desc:"Brings health scores, tickets, NPS and usage trends into one canonical Customer entity. Uses Case, Entitlement, SLA and Queue from the CDM service accelerator.",
    entities:["Account","Customer","Contact","Case","Case Resolution","Entitlement","SLA","Queue","Knowledge Article","Interaction","Health Score","Renewal"],
    edges:[["Account","HAS_CUSTOMER","Customer"],["Customer","IS","Contact"],["Customer","OPENED","Case"],["Case","RESOLVED_AS","Case Resolution"],["Case","GOVERNED_BY","SLA"],["Case","ROUTED_TO","Queue"],["Case","REFERENCES","Knowledge Article"],["Account","HOLDS","Entitlement"],["Customer","HAD","Interaction"],["Customer","SCORED_AS","Health Score"],["Account","RENEWS_AS","Renewal"]],
    accent:"var(--green)" },
  { id:"fintech-risk",   industry:["fintech"],       fn:["risk","operations","it-security"],
    name:"Customer Risk Graph",
    cdm:"Financial Services Accelerator",
    desc:"Aligned to Microsoft CDM banking accelerator: Customer 360 → Account → Financial Product → Transaction, with bank branches, collateral, KYC and regulatory holds.",
    entities:["Customer","Account","Bank","Branch","Financial Product","Transaction","Collateral","KYC Case","Mortgage Application","Risk Signal","Hold","Compliance Case"],
    edges:[["Customer","HOLDS","Account"],["Account","AT","Branch"],["Branch","OF","Bank"],["Account","OF_TYPE","Financial Product"],["Financial Product","SECURED_BY","Collateral"],["Account","RECORDS","Transaction"],["Customer","SUBJECT_TO","KYC Case"],["Customer","SUBMITTED","Mortgage Application"],["Transaction","RAISES","Risk Signal"],["Account","UNDER","Hold"],["Risk Signal","ESCALATES_TO","Compliance Case"]],
    accent:"var(--coral)" },
  { id:"healthcare-ops", industry:["healthcare"],    fn:["operations","customer","support"],
    name:"Patient Journey Graph",
    cdm:"Healthcare Accelerator · FHIR",
    desc:"FHIR-aligned (Microsoft CDM healthcare accelerator): Patient encounters joined with practitioners, conditions, observations, procedures, medications, allergies and care plans.",
    entities:["Patient","Provider","Practitioner Role","Encounter","Condition","Observation","Procedure","Medication","Allergy Intolerance","Care Plan","Diagnostic Report","Healthcare Service","Claim"],
    edges:[["Patient","SEEN_BY","Provider"],["Provider","HAS","Practitioner Role"],["Patient","HAD","Encounter"],["Encounter","DELIVERED_AS","Healthcare Service"],["Encounter","RECORDED","Condition"],["Encounter","RECORDED","Observation"],["Encounter","PERFORMED","Procedure"],["Patient","PRESCRIBED","Medication"],["Patient","HAS","Allergy Intolerance"],["Patient","FOLLOWS","Care Plan"],["Encounter","PRODUCED","Diagnostic Report"],["Encounter","BILLED_VIA","Claim"]],
    accent:"var(--purple)" },
  { id:"retail-commerce",industry:["retail"],        fn:["revenue","operations"],  name:"Order Fulfilment Graph", more:7, desc:"Customer → Order → Product → Shipment → Return, with inventory and pricing linked in.",
    entities:["Customer","Order","Product","Shipment","Return","Inventory"],
    edges:[["Customer","PLACED","Order"],["Order","CONTAINS","Product"],["Order","SHIPPED_AS","Shipment"],["Order","RETURNED_AS","Return"],["Product","STOCKED_IN","Inventory"]],
    accent:"var(--gold)" },
  { id:"manufacturing",  industry:["manufacturing"], fn:["operations"],            name:"Supply Production Graph", more:9, desc:"Suppliers, purchase orders, bills of material and inventory across plants.",
    entities:["Supplier","Purchase Order","Item","BOM","Plant","Inventory"],
    edges:[["Supplier","FULFILS","Purchase Order"],["Purchase Order","CONTAINS","Item"],["Item","COMPONENT_OF","BOM"],["BOM","ASSEMBLED_AT","Plant"],["Plant","HOLDS","Inventory"]],
    accent:"var(--green)" },
  { id:"finance-ledger", industry:["saas","fintech","retail","professional"], fn:["finance"], name:"Finance Ledger Graph", more:8,
    desc:"GL accounts, journal entries, invoices and the policies & controls auditing them.",
    entities:["GL Account","Journal Entry","Invoice","Payment","Control","Policy"],
    edges:[["Journal Entry","POSTS_TO","GL Account"],["Invoice","SETTLED_BY","Payment"],["GL Account","GOVERNED_BY","Control"],["Control","ENFORCES","Policy"]],
    accent:"var(--green)" },
  { id:"people-graph",   industry:["saas","fintech","healthcare","retail","manufacturing","logistics","media","professional","public"], fn:["people"], name:"People Workforce Graph", more:6,
    desc:"Employees, roles, teams, managers and tenure — the org substrate every other graph leans on.",
    entities:["Employee","Role","Team","Manager Chain","Compensation"],
    edges:[["Employee","HOLDS","Role"],["Employee","MEMBER_OF","Team"],["Employee","REPORTS_TO","Manager Chain"],["Employee","PAID_VIA","Compensation"]],
    accent:"var(--blue)" }
];

// Tiny stroke-based glyphs for each function in the dropdown.
// 16×16 viewBox, currentColor strokes — rendered white on the coloured tile.
// Stroke-based glyphs per industry — used by RichDropdown when kind === "industry"
function IndustryIcon({ id, size }) {
  var s = size || 16;
  var p = { width:s, height:s, viewBox:"0 0 16 16", fill:"none", stroke:"currentColor", strokeWidth:"1.4", strokeLinecap:"round", strokeLinejoin:"round" };
  switch (id) {
    case "any":           return <svg {...p}><circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5v11M3.8 4.2c2 2 6.4 2 8.4 0M3.8 11.8c2-2 6.4-2 8.4 0"/></svg>;
    case "saas":          return <svg {...p}><rect x="2" y="3" width="12" height="8" rx="1"/><line x1="6" y1="13.5" x2="10" y2="13.5"/><line x1="8" y1="11" x2="8" y2="13.5"/><circle cx="8" cy="7" r="1.6"/></svg>;
    case "fintech":       return <svg {...p}><rect x="1.5" y="4" width="13" height="8" rx="0.8"/><line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/><circle cx="4" cy="9.5" r="0.6" fill="currentColor"/><line x1="6" y1="9.5" x2="11" y2="9.5"/></svg>;
    case "healthcare":    return <svg {...p}><path d="M8 14 S2 10.5 2 6.5 a3 3 0 0 1 6 -1 a3 3 0 0 1 6 1 c0 4 -6 7.5 -6 7.5z"/><path d="M8 5.5v4M6 7.5h4"/></svg>;
    case "retail":        return <svg {...p}><path d="M3 5h10l-1 8H4z"/><path d="M5.5 5V3.5a2.5 2.5 0 0 1 5 0V5"/></svg>;
    case "manufacturing": return <svg {...p}><path d="M2 13h12V7l-4 2V7l-4 2V7L2 9z"/><line x1="2" y1="13" x2="14" y2="13"/></svg>;
    case "logistics":     return <svg {...p}><rect x="1" y="6" width="8" height="6" rx="0.5"/><path d="M9 7.5h3.5L14.5 10v2H9z"/><circle cx="4" cy="13" r="1.1"/><circle cx="12" cy="13" r="1.1"/></svg>;
    case "media":         return <svg {...p}><rect x="1.5" y="3" width="13" height="9" rx="1"/><polygon points="6.5,6 11,7.5 6.5,9" fill="currentColor" stroke="none"/><line x1="1.5" y1="3" x2="3.5" y2="1"/><line x1="14.5" y1="3" x2="12.5" y2="1"/></svg>;
    case "professional":  return <svg {...p}><rect x="2" y="5" width="12" height="9" rx="0.8"/><path d="M5.5 5V3.5h5V5"/><line x1="2" y1="9" x2="14" y2="9"/></svg>;
    case "public":        return <svg {...p}><line x1="2" y1="13.5" x2="14" y2="13.5"/><polygon points="8,2 14,5 2,5" /><line x1="3.5" y1="6" x2="3.5" y2="13"/><line x1="6.5" y1="6" x2="6.5" y2="13"/><line x1="9.5" y1="6" x2="9.5" y2="13"/><line x1="12.5" y1="6" x2="12.5" y2="13"/></svg>;
    default:              return <svg {...p}><circle cx="8" cy="8" r="5.5"/></svg>;
  }
}

function FunctionIcon({ id, size }) {
  var s = size || 16;
  var p = { width:s, height:s, viewBox:"0 0 16 16", fill:"none", stroke:"currentColor", strokeWidth:"1.4", strokeLinecap:"round", strokeLinejoin:"round" };
  switch (id) {
    case "enterprise":
      return <svg {...p}><rect x="2" y="2" width="5" height="5" rx="0.5"/><rect x="9" y="2" width="5" height="5" rx="0.5"/><rect x="2" y="9" width="5" height="5" rx="0.5"/><rect x="9" y="9" width="5" height="5" rx="0.5"/></svg>;
    case "revenue":
      return <svg {...p}><polyline points="2,12 6,8 9,10 14,4"/><polyline points="10,4 14,4 14,8"/></svg>;
    case "customer":
      return <svg {...p}><path d="M8 13.5 S2.5 10.5 2.5 6.5 a3 3 0 0 1 5.5 -1.5 a3 3 0 0 1 5.5 1.5 c0 4 -5.5 7 -5.5 7 z"/></svg>;
    case "support":
      return <svg {...p}><path d="M3 11 v-2 a5 5 0 0 1 10 0 v2"/><rect x="2" y="10" width="3" height="4" rx="0.7"/><rect x="11" y="10" width="3" height="4" rx="0.7"/><path d="M13 14 v0.5 a1.5 1.5 0 0 1 -1.5 1.5 H9"/></svg>;
    case "marketing":
      return <svg {...p}><path d="M3 6 v4 l8 3 v-10 z"/><path d="M3 6 H1.5 v4 H3"/><path d="M11 5 v6"/></svg>;
    case "product-mgmt":
      return <svg {...p}><path d="M8 2 a4 4 0 0 0 -2.5 7.2 V11 h5 V9.2 A4 4 0 0 0 8 2 z"/><line x1="6" y1="13" x2="10" y2="13"/><line x1="6.5" y1="15" x2="9.5" y2="15"/></svg>;
    case "engineering":
      return <svg {...p}><polyline points="5,4 1.5,8 5,12"/><polyline points="11,4 14.5,8 11,12"/><line x1="9.5" y1="3" x2="6.5" y2="13"/></svg>;
    case "operations":
      return <svg {...p}><circle cx="8" cy="8" r="2.5"/><path d="M8 1 v2 M8 13 v2 M1 8 h2 M13 8 h2 M3.2 3.2 l1.4 1.4 M11.4 11.4 l1.4 1.4 M3.2 12.8 l1.4 -1.4 M11.4 4.6 l1.4 -1.4"/></svg>;
    case "supply-chain":
      return <svg {...p}><rect x="1.5" y="6" width="7" height="6" rx="0.5"/><path d="M8.5 7.5 H12 l2.5 2.5 V12 H8.5 z"/><circle cx="4.5" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/></svg>;
    case "finance":
      return <svg {...p}><path d="M11 4.5 a3 3 0 0 0 -3 -1.5 c-1.7 0 -3 1 -3 2.5 s1.3 2 3 2.5 s3 1 3 2.5 s-1.3 2.5 -3 2.5 a3 3 0 0 1 -3 -1.5"/><line x1="8" y1="1.5" x2="8" y2="14.5"/></svg>;
    case "people":
      return <svg {...p}><circle cx="5.5" cy="5.5" r="2"/><circle cx="11" cy="6.5" r="1.6"/><path d="M2 13 v-1.5 a2.5 2.5 0 0 1 2.5 -2.5 H6.5 a2.5 2.5 0 0 1 2.5 2.5 V13"/><path d="M9.5 13 v-1 a2 2 0 0 1 2 -2 H11.5 a2 2 0 0 1 2 2 V13"/></svg>;
    case "legal":
      return <svg {...p}><line x1="8" y1="2" x2="8" y2="14"/><path d="M4 4 H12 M3 9 L5 4 L7 9 z M9 9 L11 4 L13 9 z"/><line x1="5.5" y1="14" x2="10.5" y2="14"/></svg>;
    case "risk":
      return <svg {...p}><path d="M8 1.5 L13.5 4 V8 c0 3 -2.5 5.5 -5.5 6.5 c-3 -1 -5.5 -3.5 -5.5 -6.5 V4 z"/><line x1="8" y1="6" x2="8" y2="9"/><circle cx="8" cy="11" r="0.4" fill="currentColor"/></svg>;
    case "it-security":
      return <svg {...p}><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7 V4.5 a3 3 0 0 1 6 0 V7"/><circle cx="8" cy="10.5" r="0.8"/></svg>;
    case "data-platform":
      return <svg {...p}><ellipse cx="8" cy="3.5" rx="5" ry="1.6"/><path d="M3 3.5 V7 a5 1.6 0 0 0 10 0 V3.5"/><path d="M3 7 V10.5 a5 1.6 0 0 0 10 0 V7"/><path d="M3 10.5 V13 a5 1.6 0 0 0 10 0 V10.5"/></svg>;
    case "analytics":
      return <svg {...p}><line x1="2" y1="13.5" x2="14" y2="13.5"/><rect x="3" y="8" width="2" height="5"/><rect x="7" y="5" width="2" height="8"/><rect x="11" y="9.5" width="2" height="3.5"/></svg>;
    case "biz-ops":
      return <svg {...p}><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="0.6" fill="currentColor"/></svg>;
    case "partner":
      return <svg {...p}><path d="M3 7 L5.5 4.5 L8 7 L5.5 9.5 z"/><path d="M8 7 L10.5 4.5 L13 7 L10.5 9.5 z"/><path d="M5.5 9.5 V12 M10.5 9.5 V12"/></svg>;
    case "facilities":
      return <svg {...p}><rect x="3" y="5" width="10" height="9"/><line x1="3" y1="5" x2="8" y2="2" /><line x1="13" y1="5" x2="8" y2="2"/><rect x="6.5" y="9" width="3" height="5"/></svg>;
    case "comms":
      return <svg {...p}><path d="M2.5 4 H13.5 v6 H9 L6 13 V10 H2.5 z"/></svg>;
    default:
      return <svg {...p}><circle cx="8" cy="8" r="6"/></svg>;
  }
}

function NewGraphFlow({ onClose, onCreate }) {
  // step / setStep / stepNames / canContinue were retained on the previous redesign
  // to keep diffs small. They're not referenced anywhere live; the dead {false && ...}
  // block in the body still mentions `step` but Babel strips that branch.
  var [industry, setIndustry] = useState(null);
  var [func, setFunc]         = useState(null);
  var [startId, setStartId]   = useState("__blank"); // matches the default "blank" startMode
  var [included, setIncluded] = useState({}); // entity name → boolean
  var [customEntities, setCustomEntities] = useState([]); // [{ name, desc, props:[] }]
  var [userPrompt, setUserPrompt] = useState("");
  var [contextAttachments, setContextAttachments] = useState([]);
  var [addingEntity, setAddingEntity]     = useState(false);
  var [newEntityName, setNewEntityName]   = useState("");
  var [newEntityDesc, setNewEntityDesc]   = useState("");
  var [graphName, setGraphName]       = useState("");
  var [graphDesc, setGraphDesc]       = useState("");
  var [environment, setEnvironment]   = useState("production");
  var [owner, setOwner]               = useState("morgan.lee");
  var [permsRead,  setPermsRead]      = useState([{ kind:"group", id:"everyone",       label:"Everyone in org" }]);
  var [permsWrite, setPermsWrite]     = useState([{ kind:"group", id:"data-platform",  label:"data-platform team" }]);
  var [permsAdmin, setPermsAdmin]     = useState([{ kind:"user",  id:"morgan.lee",     label:"Morgan Lee (you)" }]);

  // (stepNames removed — single-modal redesign doesn't use a stepper.)

  // Industry is the HARD filter when picked (Healthcare must never see Retail-only
  // blueprints). When only a function is picked, function is the hard filter.
  // Function affects RANKING (not visibility) when industry is the active filter.
  var suggestions = GRAPH_STARTING_POINTS.map(function(sp){
    var indMatch  = industry ? sp.industry.indexOf(industry) >= 0 : false;
    var funcMatch = func     ? sp.fn.indexOf(func)           >= 0 : false;
    var indAny    = sp.industry.indexOf("any") >= 0;
    var include;
    if (!industry && !func)      include = true;
    else if (industry)           include = indMatch || indAny;        // industry rules
    else                         include = funcMatch;                 // only function picked
    var score = (indMatch ? 3 : 0) + (funcMatch ? 2 : 0) + (indAny && industry ? 0.5 : 0);
    return include ? Object.assign({}, sp, { _score: score, _exactInd: indMatch, _exactFn: funcMatch }) : null;
  }).filter(Boolean).sort(function(a, b){ return b._score - a._score; });

  var picked = startId === "__blank" ? null : GRAPH_STARTING_POINTS.find(function(s){ return s.id === startId; });
  var includedFromBlueprint = picked ? picked.entities.filter(function(e){ return included[e] !== false; }) : [];
  var entitiesToInclude     = includedFromBlueprint.concat(customEntities.map(function(c){ return c.name; }));

  // (canContinue removed — single-modal redesign uses `canActivate` defined below.)

  function pickStart(id) {
    setStartId(id);
    setCustomEntities([]);
    var sp = GRAPH_STARTING_POINTS.find(function(s){ return s.id === id; });
    if (sp) {
      var inc = {};
      sp.entities.forEach(function(e){ inc[e] = true; });
      setIncluded(inc);
      if (!graphName) setGraphName(sp.name);
      if (!graphDesc) setGraphDesc(sp.desc);
    } else if (id === "__blank") {
      setIncluded({});
      if (!graphName) setGraphName("");
      if (!graphDesc) setGraphDesc("");
    }
  }

  function commitNewEntity() {
    var nm = newEntityName.trim();
    if (!nm) return;
    setCustomEntities(function(arr){ return arr.concat([{ name: nm, desc: newEntityDesc.trim() || "Custom entity added during setup.", props:[] }]); });
    setNewEntityName(""); setNewEntityDesc(""); setAddingEntity(false);
  }

  var inp = { border:"1px solid var(--line)", borderRadius:7, padding:"11px 13px", fontSize:13, fontFamily:"inherit", color:"var(--ink)", background:"var(--panel)", outline:"none", boxSizing:"border-box", width:"100%", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" };
  var lbl = { display:"block", fontFamily:"JetBrains Mono", fontSize:9.5, letterSpacing:"0.6px", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 };

  // Mini SVG preview of the picked starting point's entities + edges
  function StartingPointPreview({ sp }) {
    if (!sp) {
      return (
        <div style={{ padding:"40px 12px", textAlign:"center", color:"var(--ink-3)", fontSize:11.5, fontStyle:"italic" }}>Blank canvas — nothing pre-defined</div>
      );
    }
    var W = 280, H = 180;
    var cx = W/2, cy = H/2;
    var n = sp.entities.length;
    var positioned = sp.entities.map(function(name, i){
      var a = (i / n) * Math.PI * 2 - Math.PI / 2;
      var r = Math.min(W, H) * 0.34;
      return { name: name, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
    var byName = {}; positioned.forEach(function(p){ byName[p.name] = p; });
    return (
      <svg width="100%" height={H} viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid meet">
        <g stroke={sp.accent} strokeOpacity="0.45" strokeWidth="0.8">
          {sp.edges.map(function(e, i){
            var a = byName[e[0]], b = byName[e[2]];
            if (!a || !b) return null;
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
        <g>
          {positioned.map(function(p, i){
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="14" fill={sp.accent} fillOpacity="0.18" stroke={sp.accent} strokeWidth="1.2" />
                <text x={p.x} y={p.y + 26} textAnchor="middle" style={{ fontFamily:"JetBrains Mono", fontSize:"8.5px", fill:"var(--ink-2)" }}>{p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name}</text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  }

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

  function RichDropdown({ value, onChange, options, placeholder, kind }) {
    var [open, setOpen] = useState(false);
    var sel = options.find(function(o){ return o.id === value; });
    function tileBg(o){ return o.accent || (o.enterprise ? "var(--ink)" : "var(--ink-3)"); }
    function tileContent(o, sz){
      if (kind === "function") return <FunctionIcon id={o.id} size={Math.round(sz * 0.55)} />;
      if (kind === "industry") return <IndustryIcon id={o.id} size={Math.round(sz * 0.55)} />;
      return <span style={{ fontFamily:"JetBrains Mono", fontSize: sz <= 28 ? 10 : 11, fontWeight:700, letterSpacing:"0.5px" }}>{o.code}</span>;
    }
    return (
      <div style={{ position:"relative" }}>
        <button onClick={function(){ setOpen(function(o){ return !o; }); }}
          style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 14px", border:"1px solid var(--line)", borderRadius:9, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          {sel ? (
            <>
              <span style={{ width:34, height:34, borderRadius:7, background:tileBg(sel), color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{tileContent(sel, 34)}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{sel.label}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sel.desc}</div>
              </div>
              {sel.enterprise && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"2px 6px", borderRadius:4, background:"var(--ink)", color:"var(--bg-canvas)", fontWeight:700, letterSpacing:"0.5px" }}>ENTERPRISE</span>}
              <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
            </>
          ) : (
            <>
              <span style={{ width:34, height:34, borderRadius:7, background:"var(--chip)", border:"1px dashed var(--line)", color:"var(--ink-4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"JetBrains Mono", fontSize:14, flexShrink:0 }}>+</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, color:"var(--ink-3)" }}>{placeholder}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>Click to choose</div>
              </div>
              <span style={{ color:"var(--ink-3)", fontSize:11, fontFamily:"JetBrains Mono" }}>▾</span>
            </>
          )}
        </button>
        {open && (
          <>
            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setOpen(false); }} />
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:10, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:6, maxHeight:380, overflowY:"auto" }}>
              {options.map(function(o, i){
                var isSel = value === o.id;
                return (
                  <button key={o.id} onClick={function(){ onChange(o.id); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"9px 12px", borderRadius:7, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left", marginBottom: i < options.length-1 ? 2 : 0 }}
                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ width:30, height:30, borderRadius:6, background:tileBg(o), color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{tileContent(o, 30)}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{o.label}</span>
                        {o.enterprise && <span style={{ fontFamily:"JetBrains Mono", fontSize:8.5, padding:"1px 5px", borderRadius:3, background:"var(--ink)", color:"var(--bg-canvas)", fontWeight:700, letterSpacing:"0.5px" }}>ENTERPRISE</span>}
                      </div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", marginTop:2, lineHeight:1.4 }}>{o.desc}</div>
                    </div>
                    {isSel && <span style={{ color:"var(--green)", fontWeight:700, fontSize:13 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Single-modal redesign ───────────────────────────────────────────────────
  // Replaces the previous 3-step stepper. Everything that's needed to spin up
  // a graph lives in one scrollable form: name, description, starting-point
  // choice, and (when "from template" is picked) a search + filters row above
  // the template list.
  // Default to "blank" — the fast path. Users who want a template can toggle and
  // then advance via the "Choose template →" CTA in the footer.
  var [startMode, setStartMode] = useState("blank"); // "blank" | "template"
  var [templateQuery, setTemplateQuery] = useState("");
  // Two-view modal: "form" (name/desc/starting-point) and "template" (picker).
  var [view, setView] = useState("form");

  // Template list — apply text search on top of the industry / function filter
  // already computed in `suggestions`.
  var qLower = templateQuery.trim().toLowerCase();
  var visibleSuggestions = !qLower ? suggestions : suggestions.filter(function(sp){
    if (sp.name.toLowerCase().indexOf(qLower) >= 0) return true;
    if (sp.desc && sp.desc.toLowerCase().indexOf(qLower) >= 0) return true;
    if (sp.entities && sp.entities.some(function(e){ return e.toLowerCase().indexOf(qLower) >= 0; })) return true;
    return false;
  });

  var canActivate = graphName.trim().length >= 2 && (startMode === "blank" || (startId && startId !== "__blank"));

  // Helper — sync startId when toggling start mode so "Create graph" can rely on a
  // single value downstream without re-implementing branch logic.
  function chooseStartMode(m) {
    setStartMode(m);
    if (m === "blank") {
      setStartId("__blank");
      setIncluded({});
    } else if (startId === "__blank") {
      // Coming from blank → un-set so the user has to pick a template
      setStartId(null);
    }
  }

  // Inline dropdown styled like the rest of the form (used for industry + function).
  function FilterDropdown({ value, onChange, options, placeholder, openState }) {
    var [open, setOpen] = useState(false);
    var sel = options.find(function(o){ return o.id === value; });
    return (
      <div style={{ position:"relative" }}>
        <button onClick={function(){ setOpen(function(o){ return !o; }); }}
          style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"9px 12px", border:"1px solid var(--line)", borderRadius:7, background:"var(--panel)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", boxSizing:"border-box", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          <span style={{ flex:1, fontSize:13, color: sel ? "var(--ink)" : "var(--ink-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sel ? sel.label : placeholder}</span>
          {sel && <button onClick={function(e){ e.stopPropagation(); onChange(null); }} style={{ background:"none", border:"none", padding:0, color:"var(--ink-3)", cursor:"pointer", fontSize:14, lineHeight:1, marginRight:2 }}>×</button>}
          <span style={{ color:"var(--ink-3)", fontSize:10, fontFamily:"JetBrains Mono" }}>{open ? "▴" : "▾"}</span>
        </button>
        {open && (
          <>
            <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99 }} onClick={function(){ setOpen(false); }} />
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:"var(--panel)", border:"1px solid var(--line)", borderRadius:9, boxShadow:"0 14px 38px rgba(0,0,0,0.18)", padding:5, maxHeight:340, overflowY:"auto" }}>
              {options.map(function(o){
                var isSel = value === o.id;
                return (
                  <button key={o.id} onClick={function(){ onChange(o.id); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px", borderRadius:6, border:"none", background: isSel ? "var(--bg-canvas)" : "transparent", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}
                    onMouseEnter={function(e){ if (!isSel) e.currentTarget.style.background = "var(--panel-2)"; }}
                    onMouseLeave={function(e){ if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ flex:1, fontSize:12.5, color:"var(--ink)" }}>{o.label}</span>
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

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.42)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={function(e){ if (e.target === e.currentTarget) onClose(); }}>
      {/* Modal sizing: the form view auto-sizes to its content (so the initial state doesn't
          look stranded inside an oversized frame) while the template view locks to a fixed
          height — that way filtering / search results don't reflow the modal under the cursor. */}
      <div style={{ width:"92vw", maxWidth: view === "template" ? 880 : 720, height: view === "template" ? "min(86vh, 760px)" : "auto", maxHeight:"94vh", background:"var(--bg-canvas)", borderRadius:12, border:"1px solid var(--line)", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.32)" }}>

        {/* HEADER */}
        <div style={{ flexShrink:0, padding:"18px 22px 16px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", background:"var(--panel)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {view === "template" && (
              <button onClick={function(){ setView("form"); }} title="Back to details" className="btn-ghost"
                style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"var(--panel)", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:0, cursor:"pointer", color:"var(--ink-2)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <div>
              <div style={{ fontFamily:"Instrument Serif", fontSize:26, color:"var(--ink)", lineHeight:1.1 }}>Create New Graph</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--line)", background:"none", cursor:"pointer", fontSize:15, color:"var(--ink-3)", flexShrink:0 }}>✕</button>
        </div>

        {/* BODY — single column, scrollable. Renders either the form view or the template view. */}
        <div style={{ flex:1, overflowY:"auto", padding:"22px 28px 28px" }}>

          {view === "form" && (
            <>
              {/* NAME + DESCRIPTION */}
              <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:24 }}>
                <div>
                  <label style={lbl}>Graph name</label>
                  <input value={graphName} onChange={function(e){ setGraphName(e.target.value); }} placeholder="e.g. Customer 360 Graph" style={inp} autoFocus />
                </div>
                <div>
                  <label style={lbl}>Description</label>
                  <textarea value={graphDesc} onChange={function(e){ setGraphDesc(e.target.value); }} rows={2} placeholder="A one-line summary that will appear on the graph card" style={Object.assign({}, inp, { resize:"vertical", lineHeight:1.55 })} />
                </div>
              </div>

              {/* STARTING POINT — simple two-tile chooser. Icon, title, description. */}
              <div style={{ marginBottom:6 }}>
                <label style={lbl}>Starting point</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    {
                      id:"blank",
                      title:"Start blank",
                      desc:"Empty canvas — add entities and edges as you go.",
                      tone: { bg:"var(--chip)", fg:"var(--ink-2)" },
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 3 14 8 19 8"/>
                          <line x1="12" y1="13" x2="12" y2="17"/>
                          <line x1="10" y1="15" x2="14" y2="15"/>
                        </svg>
                      )
                    },
                    {
                      id:"template",
                      title:"Choose from template",
                      desc:"Begin from a curated blueprint and customise it.",
                      tone: { bg:"var(--blue-fill)", fg:"var(--blue)" },
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                      )
                    }
                  ].map(function(opt){
                    var isOn = startMode === opt.id;
                    return (
                      <button key={opt.id} onClick={function(){ chooseStartMode(opt.id); }}
                        style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px 18px", borderRadius:9, border:"1px solid " + (isOn ? "var(--ink)" : "var(--line)"), background:"var(--panel)", boxShadow: isOn ? "0 0 0 2px color-mix(in oklab, var(--ink) 7%, transparent)" : "none", textAlign:"left", cursor:"pointer", fontFamily:"inherit" }}>
                        <span style={{ width:36, height:36, borderRadius:8, background: opt.tone.bg, color: opt.tone.fg, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{opt.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14.5, fontWeight:600, color:"var(--ink)" }}>{opt.title}</div>
                          <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:4, lineHeight:1.5 }}>{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TEMPLATE VIEW — search + filters + template list */}
          {view === "template" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Search + industry + function — one row */}
              <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr", gap:10 }}>
                <div style={{ position:"relative" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", pointerEvents:"none" }}>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <input value={templateQuery} onChange={function(e){ setTemplateQuery(e.target.value); }} placeholder="Search templates" style={Object.assign({}, inp, { paddingLeft:32 })} autoFocus />
                </div>
                <FilterDropdown value={industry} onChange={setIndustry} options={GRAPH_INDUSTRIES} placeholder="Any industry" />
                <FilterDropdown value={func}     onChange={setFunc}     options={GRAPH_FUNCTIONS}  placeholder="Any function" />
              </div>

              {/* Templates */}
              {visibleSuggestions.length === 0 ? (
                <div style={{ padding:"24px 20px", border:"1px dashed var(--line)", borderRadius:10, background:"var(--panel-2)", color:"var(--ink-3)", fontSize:12.5, lineHeight:1.55 }}>
                  No templates match these filters. Clear them, or go back and pick <b>Start blank</b>.
                </div>
              ) : visibleSuggestions.map(function(sp){
                var isOn = startId === sp.id;
                return (
                  // position:relative so the selected-state ✓ can be absolutely positioned
                  // — that way toggling selection doesn't take any layout width away from
                  // the entity chip strip and the card height stays constant.
                  <div key={sp.id} onClick={function(){ pickStart(sp.id); }}
                    style={{ position:"relative", display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", paddingRight:36, border:"1px solid " + (isOn ? "var(--ink)" : "var(--line)"), borderRadius:10, background:"var(--panel)", boxShadow: isOn ? "0 0 0 2px color-mix(in oklab, var(--ink) 7%, transparent)" : "none", cursor:"pointer" }}>
                    <span style={{ width:38, height:38, borderRadius:8, background:sp.accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <FunctionIcon id={(sp.fn && sp.fn[0]) || "enterprise"} size={20} />
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{sp.name}</span>
                        {sp.cdm && (
                          <a href={cdmLink(sp.cdm)} target="_blank" rel="noopener noreferrer"
                            title={"View Microsoft CDM — " + sp.cdm + " (opens GitHub)"}
                            onClick={function(e){ e.stopPropagation(); }}
                            style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:"JetBrains Mono", fontSize:9, padding:"1.5px 7px 1.5px 6px", borderRadius:3, background:"transparent", color:"var(--ink-3)", border:"1px solid var(--line-2)", fontWeight:600, letterSpacing:"0.4px", textDecoration:"none" }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" style={{ opacity:0.7 }}><rect x="0" y="0" width="4" height="4"/><rect x="6" y="0" width="4" height="4"/><rect x="0" y="6" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/></svg>
                            {"CDM · " + sp.cdm}
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize:12.5, color:"var(--ink-3)", lineHeight:1.5, marginTop:4 }}>{sp.desc}</div>
                      {(function(){
                        var CAP = 10;
                        var shown = sp.entities.slice(0, CAP);
                        var overflow = sp.entities.length - shown.length;
                        return (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8, alignItems:"center" }}>
                            {shown.map(function(e){
                              return <span key={e} style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"3px 8px", borderRadius:4, background:"var(--chip)", border:"1px solid var(--line-2)", color:"var(--ink-2)" }}>{e}</span>;
                            })}
                            {overflow > 0 && (
                              <span style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"3px 8px", borderRadius:4, background:"transparent", border:"1px dashed var(--line)", color:"var(--ink-3)", fontWeight:600 }}>{"+" + overflow + " more"}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {isOn && <span style={{ position:"absolute", top:14, right:14, color:"var(--green)", fontWeight:700, fontSize:14, lineHeight:1, pointerEvents:"none" }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* legacy step-2 block removed — its contents (industry / function pickers,
              AI tailor textarea, template list) are merged inline above into the
              single-modal redesign. The compile-only wrapper below is kept on the
              `{false}` guard so any orphaned closing tokens still balance. */}
          {false && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Prompt strip — slim composer; merge intent surfaces only when relevant */}
                {(function(){
                  var blankSelected = startId === "__blank";
                  var hasPrompt = userPrompt.trim().length > 0;
                  var attachments = (typeof contextAttachments !== "undefined" && contextAttachments) ? contextAttachments : [];
                  var mergeHint = hasPrompt
                    ? (picked ? "Tailoring " + picked.name + " to your context" : (blankSelected ? "Building from your context only" : "Will tailor whichever template you pick below"))
                    : null;
                  return (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:7, fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", letterSpacing:"0.6px", textTransform:"uppercase" }}>
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, padding:"1px 5px", borderRadius:3, background:"var(--ink)", color:"var(--bg-canvas)", fontWeight:700, letterSpacing:"0.5px" }}>AI</span>
                          Tailor the template <span style={{ color:"var(--ink-4)", textTransform:"none", letterSpacing:0 }}>— tell us your business so we can shape entities, fields, and edges around you</span>
                        </div>
                        {hasPrompt && (
                          <button onClick={function(){ setUserPrompt(""); }} style={{ background:"none", border:"none", padding:0, fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-3)", cursor:"pointer", letterSpacing:"0.4px" }}>Clear</button>
                        )}
                      </div>

                      <div style={{ position:"relative", border:"1px solid " + (hasPrompt ? "var(--ink-3)" : "var(--line)"), borderRadius:10, background:"var(--panel)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(40,40,20,0.02)" }}>
                        <textarea
                          value={userPrompt}
                          onChange={function(e){ setUserPrompt(e.target.value); }}
                          rows={5}
                          placeholder="e.g. We're a retail enterprise — focus on store-level inventory, loyalty members, and the in-store ↔ online order journey. Skip procurement entities. Treat each fulfilment as a node, not a property."
                          style={{ width:"100%", padding:"14px 14px 6px", fontSize:13.5, fontFamily:"inherit", color:"var(--ink)", background:"transparent", border:"none", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.55, minHeight:110 }}
                        />

                        {attachments.length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"4px 12px 6px" }}>
                            {attachments.map(function(att, i){
                              return (
                                <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 8px 4px 6px", borderRadius:6, background:"var(--chip)", border:"1px solid var(--line-2)", fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-2)" }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  {att.name}
                                  <button onClick={function(){ setContextAttachments(function(a){ return a.filter(function(_, j){ return j !== i; }); }); }} style={{ background:"none", border:"none", padding:0, marginLeft:2, color:"var(--ink-3)", cursor:"pointer", fontSize:12, lineHeight:1 }}>×</button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px 9px 10px", borderTop:"1px solid var(--line-2)", background:"var(--panel-2)", borderRadius:"0 0 9px 9px" }}>
                          <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 9px", borderRadius:6, border:"1px solid var(--line)", background:"var(--panel)", color:"var(--ink-2)", cursor:"pointer", fontFamily:"JetBrains Mono", fontSize:10.5, letterSpacing:"0.3px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            Attach
                            <input type="file" multiple onChange={function(e){
                              var picked = Array.from(e.target.files || []).map(function(f){ return { name: f.name, size: f.size }; });
                              setContextAttachments(function(a){ return a.concat(picked); });
                              e.target.value = "";
                            }} style={{ display:"none" }} />
                          </label>
                          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>
                            {attachments.length > 0
                              ? attachments.length + " file" + (attachments.length === 1 ? "" : "s") + " attached"
                              : "Drop a data dictionary, ERD, or onboarding doc"}
                          </span>
                        </div>
                      </div>

                      {mergeHint && (
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:"var(--ink-4)" }}>{mergeHint}</div>
                      )}
                    </div>
                  );
                })()}

                {suggestions.length === 0 && (
                  <div style={{ padding:"24px 20px", border:"1px dashed var(--line)", borderRadius:10, background:"var(--panel-2)", color:"var(--ink-3)", fontSize:12.5, lineHeight:1.55 }}>
                    No curated starting points for this combination yet — pick "Blank canvas" above and build from scratch.
                  </div>
                )}

                {suggestions.map(function(sp){
                  var isOn = startId === sp.id;
                  return (
                    <div key={sp.id} onClick={function(){ pickStart(sp.id); }}
                      style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", border:"1px solid " + (isOn ? "var(--ink)" : "var(--line)"), borderRadius:10, background: isOn ? "var(--bg-canvas)" : "var(--panel)", boxShadow: isOn ? "0 0 0 2px color-mix(in oklab, var(--ink) 7%, transparent)" : "none", cursor:"pointer" }}>
                      <span style={{ width:42, height:42, borderRadius:8, background:sp.accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <FunctionIcon id={(sp.fn && sp.fn[0]) || "enterprise"} size={22} />
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                          <span style={{ fontSize:14, fontWeight:600, color:"var(--ink)" }}>{sp.name}</span>
                          {sp.cdm && (
                            <a href={cdmLink(sp.cdm)} target="_blank" rel="noopener noreferrer"
                              title={"View Microsoft CDM — " + sp.cdm + " (opens GitHub)"}
                              onClick={function(e){ e.stopPropagation(); }}
                              style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:"JetBrains Mono", fontSize:9, padding:"1.5px 7px 1.5px 6px", borderRadius:3, background:"transparent", color:"var(--ink-3)", border:"1px solid var(--line-2)", fontWeight:600, letterSpacing:"0.4px", textDecoration:"none", cursor:"pointer", transition:"color 100ms, border-color 100ms" }}
                              onMouseEnter={function(e){ e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.borderColor = "var(--ink-3)"; }}
                              onMouseLeave={function(e){ e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}>
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" style={{ opacity:0.7 }}><rect x="0" y="0" width="4" height="4"/><rect x="6" y="0" width="4" height="4"/><rect x="0" y="6" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/></svg>
                              {"CDM · " + sp.cdm}
                              <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ opacity:0.5, marginLeft:1 }}><path d="M3 1 H9 V7 M9 1 L1 9"/></svg>
                            </a>
                          )}
                        </div>
                        <div style={{ fontSize:12.5, color:"var(--ink-3)", lineHeight:1.5, marginTop:5, maxWidth:620 }}>{sp.desc}</div>

                        {(function(){
                          var CAP = 12;
                          var shown = sp.entities.slice(0, CAP);
                          var overflow = sp.entities.length - shown.length;
                          return (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:10, alignItems:"center" }}>
                              {shown.map(function(e){
                                return <span key={e} style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"3px 8px", borderRadius:4, background:"var(--chip)", border:"1px solid var(--line-2)", color:"var(--ink-2)" }}>{e}</span>;
                              })}
                              {overflow > 0 && (
                                <span title={"Plus " + overflow + " more — see the Entities step"} style={{ fontFamily:"JetBrains Mono", fontSize:10.5, padding:"3px 8px", borderRadius:4, background:"transparent", border:"1px dashed var(--line)", color:"var(--ink-3)", fontWeight:600 }}>{"+" + overflow + " more"}</span>
                              )}
                            </div>
                          );
                        })()}

                      </div>
                      {isOn && <span style={{ color:"var(--green)", fontWeight:700, fontSize:14 }}>✓</span>}
                    </div>
                  );
                })}

                <div style={{ fontFamily:"JetBrains Mono", fontSize:10.5, color:"var(--ink-3)", marginTop:8, lineHeight:1.5, padding:"10px 14px", background:"var(--panel-2)", border:"1px dashed var(--line-2)", borderRadius:7 }}>
                  Need more entities than the blueprint provides? You'll be able to add custom ones in the next step.
                </div>
              </div>
            )}

          {/* legacy step-3 block dropped — name + description are inline at the top of the
              redesigned modal; no separate review step. */}

        </div>
        {/* ↑ closes body wrapper */}

        {/* FOOTER — CTA changes by view + start mode:
             form view, blank mode    → "Create graph"     (creates immediately)
             form view, template mode → "Choose template"  (advances to template view)
             template view            → "Create graph"     (creates once a template is picked) */}
        <div style={{ flexShrink:0, padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"flex-end", gap:8, background:"var(--panel)" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          {view === "form" && startMode === "template" ? (
            <button className="btn-dark" disabled={graphName.trim().length < 2} onClick={function(){ setView("template"); }} style={{ opacity: graphName.trim().length >= 2 ? 1 : 0.45 }}>Choose template →</button>
          ) : (
            <button className="btn-dark" disabled={!canActivate} onClick={function(){ if (onCreate) onCreate({ name: graphName, entities: entitiesToInclude, templateId: startId }); onClose(); }} style={{ opacity: canActivate ? 1 : 0.45 }}>Create graph ↵</button>
          )}
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW EDGE FLOW — create a new edge type (relationship) in the schema

export { NewGraphFlow }
