// Pre-built extraction agents, grouped by document type (reuses the SkillLibrary browser).
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const RAW = [
  {
    cat: 'Contracts & Agreements', icon: 'legal', skills: [
      { name: 'Contract Metadata Extractor', desc: 'Pull parties, effective date, term, and total value from contracts.' },
      { name: 'NDA Term Extractor', desc: 'Extract confidentiality scope, duration, and governing law from NDAs.' },
      { name: 'MSA Clause Extractor', desc: 'Identify liability, indemnity, and termination clauses in master agreements.' },
      { name: 'Renewal Terms Extractor', desc: 'Surface renewal dates, notice periods, and auto-renew flags.' },
      { name: 'SOW Deliverables Extractor', desc: 'Capture deliverables, milestones, and acceptance criteria from SOWs.' },
      { name: 'Lease Agreement Extractor', desc: 'Extract rent, term, parties, and break clauses from leases.' },
      { name: 'Employment Contract Extractor', desc: 'Pull role, compensation, notice period, and non-compete terms.' },
      { name: 'Amendment Tracker', desc: 'Detect what changed across contract amendments and addenda.' },
    ],
  },
  {
    cat: 'Invoices & Receipts', icon: 'finance', skills: [
      { name: 'Invoice Line-Item Extractor', desc: 'Extract vendor, totals, taxes, and itemized lines from invoices.' },
      { name: 'Receipt Digitizer', desc: 'Turn photographed receipts into structured expense records.' },
      { name: 'Purchase Order Parser', desc: 'Read PO number, line items, and quantities from purchase orders.' },
      { name: 'Expense Report Extractor', desc: 'Normalize expense reports into per-category line items.' },
      { name: 'Credit Note Extractor', desc: 'Capture credit amounts, reasons, and references from credit notes.' },
      { name: 'Utility Bill Extractor', desc: 'Pull usage, billing period, and amount due from utility bills.' },
      { name: 'Remittance Advice Parser', desc: 'Match payments to invoices from remittance advice documents.' },
    ],
  },
  {
    cat: 'Resumes & Applications', icon: 'people', skills: [
      { name: 'Resume Parser', desc: 'Extract contact, experience, skills, and education from resumes.' },
      { name: 'Job Application Extractor', desc: 'Capture structured fields from application forms.' },
      { name: 'Offer Letter Extractor', desc: 'Pull role, compensation, start date, and terms from offers.' },
      { name: 'Cover Letter Analyzer', desc: 'Summarize candidate intent and highlights from cover letters.' },
      { name: 'Reference Check Extractor', desc: 'Structure reference details and feedback from forms.' },
      { name: 'Background Check Parser', desc: 'Capture verification results and flags from background reports.' },
    ],
  },
  {
    cat: 'Financial Statements', icon: 'data', skills: [
      { name: 'Balance Sheet Extractor', desc: 'Extract assets, liabilities, and equity line items.' },
      { name: 'P&L Line Extractor', desc: 'Capture revenue, costs, and margins from income statements.' },
      { name: 'Earnings Report Parser', desc: 'Pull headline metrics and guidance from earnings releases.' },
      { name: 'Bank Statement Parser', desc: 'Structure transactions, balances, and dates from statements.' },
      { name: 'Cash Flow Extractor', desc: 'Extract operating, investing, and financing flows.' },
      { name: 'Audit Report Extractor', desc: 'Capture opinion, findings, and adjustments from audit reports.' },
      { name: 'Annual Report Summarizer', desc: 'Pull KPIs and segment results from annual reports.' },
    ],
  },
  {
    cat: 'Forms & Records', icon: 'utility', skills: [
      { name: 'Application Form Reader', desc: 'Read filled fields from standardized application forms.' },
      { name: 'Survey Response Extractor', desc: 'Turn open and structured survey answers into clean rows.' },
      { name: 'Intake Form Extractor', desc: 'Capture patient or customer intake details into a schema.' },
      { name: 'Registration Form Parser', desc: 'Extract registrant details from event or service forms.' },
      { name: 'Consent Form Extractor', desc: 'Capture consent scope, signatures, and dates.' },
      { name: 'Inspection Report Parser', desc: 'Structure checklist results and findings from inspections.' },
    ],
  },
  {
    cat: 'Insurance & Claims', icon: 'ops', skills: [
      { name: 'Claim Form Extractor', desc: 'Extract claimant, incident, and amount fields from claims.' },
      { name: 'Policy Detail Extractor', desc: 'Pull coverage, limits, and effective dates from policies.' },
      { name: 'Loss Report Parser', desc: 'Structure loss type, date, and estimated value from reports.' },
      { name: 'Medical Bill Extractor', desc: 'Capture procedures, codes, and charges from medical bills.' },
      { name: 'Adjuster Note Summarizer', desc: 'Summarize adjuster notes and recommended actions.' },
      { name: 'Quote Comparison Extractor', desc: 'Normalize coverage and premiums across insurance quotes.' },
    ],
  },
  {
    cat: 'Identity & Compliance', icon: 'it', skills: [
      { name: 'ID Document Reader', desc: 'Read name, number, and expiry from IDs and passports.' },
      { name: 'KYC Field Extractor', desc: 'Capture the fields required for KYC verification.' },
      { name: 'Tax Form Extractor', desc: 'Extract W-2 / 1099 fields into structured records.' },
      { name: 'Proof of Address Parser', desc: 'Verify name and address from supporting documents.' },
      { name: 'Sanctions Screening Extractor', desc: 'Structure matches and risk flags from screening results.' },
      { name: 'Certificate Validator', desc: 'Capture issuer, holder, and validity from certificates.' },
    ],
  },
  {
    cat: 'Legal Filings', icon: 'legal', skills: [
      { name: 'Court Filing Extractor', desc: 'Capture case number, parties, and filing type from filings.' },
      { name: 'Patent Claim Extractor', desc: 'Extract claims, inventors, and dates from patent documents.' },
      { name: 'Litigation Summary Extractor', desc: 'Summarize allegations, status, and key dates.' },
      { name: 'Deposition Transcript Parser', desc: 'Structure speakers, topics, and key admissions.' },
      { name: 'Regulatory Filing Extractor', desc: 'Pull required disclosures from regulatory submissions.' },
      { name: 'Subpoena Detail Extractor', desc: 'Capture requested items, deadlines, and parties.' },
    ],
  },
  {
    cat: 'Medical & Healthcare', icon: 'success', skills: [
      { name: 'Clinical Note Extractor', desc: 'Capture diagnosis, medications, and plan from clinical notes.' },
      { name: 'Lab Report Parser', desc: 'Extract test names, values, and reference ranges.' },
      { name: 'Prescription Reader', desc: 'Read drug, dosage, and instructions from prescriptions.' },
      { name: 'Discharge Summary Extractor', desc: 'Capture admission, treatment, and follow-up details.' },
      { name: 'Referral Letter Extractor', desc: 'Structure referral reason, provider, and urgency.' },
      { name: 'Radiology Report Parser', desc: 'Extract findings and impressions from imaging reports.' },
    ],
  },
  {
    cat: 'Shipping & Logistics', icon: 'ops', skills: [
      { name: 'Bill of Lading Extractor', desc: 'Capture shipper, consignee, and goods from BOLs.' },
      { name: 'Packing List Parser', desc: 'Extract items, quantities, and weights from packing lists.' },
      { name: 'Customs Declaration Extractor', desc: 'Pull HS codes, values, and origins for customs.' },
      { name: 'Delivery Note Reader', desc: 'Capture delivery details and proof-of-delivery fields.' },
      { name: 'Air Waybill Extractor', desc: 'Extract routing, weights, and charges from air waybills.' },
      { name: 'Freight Invoice Parser', desc: 'Structure freight charges, surcharges, and lanes.' },
    ],
  },
  {
    cat: 'Real Estate & Property', icon: 'product', skills: [
      { name: 'Property Listing Extractor', desc: 'Capture price, area, beds, and features from listings.' },
      { name: 'Title Deed Extractor', desc: 'Pull owner, parcel, and encumbrances from title deeds.' },
      { name: 'Appraisal Report Parser', desc: 'Extract valuation, comparables, and method from appraisals.' },
      { name: 'Mortgage Document Extractor', desc: 'Capture principal, rate, term, and parties.' },
      { name: 'Rental Agreement Extractor', desc: 'Structure rent, deposit, term, and tenant details.' },
      { name: 'Property Tax Bill Parser', desc: 'Extract assessed value, rate, and amount due.' },
    ],
  },
  {
    cat: 'Tax Documents', icon: 'finance', skills: [
      { name: 'W-2 Extractor', desc: 'Capture wages, withholdings, and employer fields from W-2s.' },
      { name: '1099 Extractor', desc: 'Extract payer, recipient, and amounts from 1099 forms.' },
      { name: 'Tax Return Parser', desc: 'Structure income, deductions, and credits from returns.' },
      { name: 'VAT Invoice Extractor', desc: 'Capture VAT number, rate, and amounts for compliance.' },
      { name: 'Sales Tax Report Parser', desc: 'Extract taxable amounts and liabilities by jurisdiction.' },
      { name: 'K-1 Schedule Extractor', desc: 'Pull partner share of income and deductions from K-1s.' },
    ],
  },
  {
    cat: 'Procurement & Purchasing', icon: 'sales', skills: [
      { name: 'RFP Requirement Extractor', desc: 'Capture requirements, scope, and deadlines from RFPs.' },
      { name: 'Vendor Quote Extractor', desc: 'Normalize pricing and terms across vendor quotes.' },
      { name: 'Supplier Contract Extractor', desc: 'Pull SLAs, pricing, and renewal terms from supplier deals.' },
      { name: 'Goods Receipt Parser', desc: 'Extract received items and quantities against a PO.' },
      { name: 'Catalog Spec Extractor', desc: 'Structure product specs and SKUs from supplier catalogs.' },
      { name: 'Tender Document Extractor', desc: 'Capture bid criteria and submission requirements.' },
    ],
  },
  {
    cat: 'Email & Correspondence', icon: 'marketing', skills: [
      { name: 'Email Action Extractor', desc: 'Pull tasks, owners, and due dates from email threads.' },
      { name: 'Support Ticket Extractor', desc: 'Structure issue, severity, and customer from tickets.' },
      { name: 'Meeting Notes Extractor', desc: 'Capture decisions and action items from notes.' },
      { name: 'Complaint Letter Parser', desc: 'Extract complaint type, sentiment, and requested remedy.' },
      { name: 'Order Confirmation Extractor', desc: 'Capture order, items, and shipping from confirmations.' },
    ],
  },
]

export const AGENT_GROUP_ORDER = ['Document types']
export const AGENT_LIBRARY = RAW.map(c => ({
  ...c, group: 'Document types',
  skills: c.skills.map(s => ({ ...s, id: `agt-${slug(c.cat)}-${slug(s.name)}` })),
}))
