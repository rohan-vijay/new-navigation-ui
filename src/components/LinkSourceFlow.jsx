import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import '../linkSource.css'

// ── stubs for globals the original used (no node context in this app) ──
const STUB_NODES = []
const STUB_PROPS = []
const STUB_PROPS_BY_NODE = {}
const stubGenerateProps = () => []
const stubColorForNode = () => '#16341f'
function StubListGlyph() { return null }

// prop-source-flows.jsx — Enterprise Property & Source wizards
// Design: one field per line · dropdowns for >3 options · no scattered grids


// ─── DATA ─────────────────────────────────────────────────────────────────────

// Connector catalog. `slug` is a Simple Icons slug used to render the real brand
// logo (https://cdn.simpleicons.org/<slug>/<hex>); `icon` is the text fallback.
// `kind` splits the catalog into structured systems vs unstructured sources.
const SOURCE_SYSTEMS = [
  // ── Structured systems (databases, warehouses, apps with records) ──
  { id: "salesforce", cat: "CRM & Marketing", domain: "salesforce.com",  name: "Salesforce",            tag: "CRM",          kind: "structured",   status: "healthy",  icon: "S",   slug: "salesforce",          color: "#00A1E0", desc: "Accounts, contacts, opportunities and custom objects." },
  { id: "hubspot", cat: "CRM & Marketing", domain: "hubspot.com",     name: "HubSpot",               tag: "Marketing",    kind: "structured",   status: "healthy",  icon: "H",   slug: "hubspot",             color: "#FF7A59", desc: "Contacts, deals, companies and marketing events." },
  { id: "snowflake", cat: "Data Warehouse", domain: "snowflake.com",   name: "Snowflake",             tag: "Warehouse",    kind: "structured",   status: "healthy",  icon: "❄",  slug: "snowflake",           color: "#29B5E8", desc: "Cloud data-warehouse tables and views." },
  { id: "bigquery", cat: "Data Warehouse", domain: "cloud.google.com",    name: "Google BigQuery",       tag: "Warehouse",    kind: "structured",   status: "healthy",  icon: "BQ",  slug: "googlebigquery",      color: "#669DF6", desc: "Serverless warehouse datasets and tables." },
  { id: "databricks", cat: "Data Warehouse", domain: "databricks.com",  name: "Databricks",            tag: "Lakehouse",    kind: "structured",   status: "healthy",  icon: "DB",  slug: "databricks",          color: "#FF3621", desc: "Delta tables and Unity Catalog assets." },
  { id: "redshift", cat: "Data Warehouse", domain: "aws.amazon.com",    name: "Amazon Redshift",       tag: "Warehouse",    kind: "structured",   status: "healthy",  icon: "RS",  slug: "amazonredshift",      color: "#8C4FFF", desc: "Columnar warehouse schemas and tables." },
  { id: "postgres", cat: "Databases", domain: "postgresql.org",    name: "PostgreSQL",            tag: "Database",     kind: "structured",   status: "healthy",  icon: "PG",  slug: "postgresql",          color: "#4169E1", desc: "Relational tables, views and materialised views." },
  { id: "mysql", cat: "Databases", domain: "mysql.com",       name: "MySQL",                 tag: "Database",     kind: "structured",   status: "healthy",  icon: "My",  slug: "mysql",               color: "#4479A1", desc: "Relational tables from a MySQL instance." },
  { id: "sqlserver", cat: "Databases", domain: "microsoft.com",   name: "Microsoft SQL Server",  tag: "Database",     kind: "structured",   status: "healthy",  icon: "MS",  slug: "microsoftsqlserver",  color: "#CC2927", desc: "Tables, views and stored procedures." },
  { id: "oracle", cat: "Databases", domain: "oracle.com",      name: "Oracle Database",       tag: "Database",     kind: "structured",   status: "healthy",  icon: "Or",  slug: "oracle",              color: "#F80000", desc: "Enterprise relational schemas." },
  { id: "mongodb", cat: "Databases", domain: "mongodb.com",     name: "MongoDB",               tag: "NoSQL",        kind: "structured",   status: "healthy",  icon: "Mo",  slug: "mongodb",             color: "#47A248", desc: "Document collections and embedded records." },
  { id: "netsuite", cat: "ERP & Finance", domain: "netsuite.com",    name: "NetSuite ERP",          tag: "ERP",          kind: "structured",   status: "healthy",  icon: "N",   slug: "",                    color: "#1F7A3D", desc: "Invoices, agreements and financial records." },
  { id: "sap", cat: "ERP & Finance", domain: "sap.com",         name: "SAP",                   tag: "ERP",          kind: "structured",   status: "healthy",  icon: "SAP", slug: "sap",                 color: "#0FAAFF", desc: "ERP modules, materials and finance documents." },
  { id: "stripe", cat: "ERP & Finance", domain: "stripe.com",      name: "Stripe",                tag: "Billing",      kind: "structured",   status: "healthy",  icon: "$",   slug: "stripe",              color: "#635BFF", desc: "Customers, subscriptions, invoices and payouts." },
  { id: "shopify", cat: "ERP & Finance", domain: "shopify.com",     name: "Shopify",               tag: "Commerce",     kind: "structured",   status: "healthy",  icon: "Sh",  slug: "shopify",             color: "#7AB55C", desc: "Orders, products, customers and inventory." },
  { id: "airtable", cat: "Databases", domain: "airtable.com",    name: "Airtable",              tag: "Database",     kind: "structured",   status: "healthy",  icon: "At",  slug: "airtable",            color: "#18BFFF", desc: "Bases, tables and linked records." },
  { id: "googlesheets", cat: "Files & Storage", domain: "google.com",name: "Google Sheets",         tag: "Spreadsheet",  kind: "structured",   status: "healthy",  icon: "GS",  slug: "googlesheets",        color: "#34A853", desc: "Spreadsheet rows as structured records." },
  { id: "segment", cat: "Identity & Events", domain: "segment.com",     name: "Segment",               tag: "CDP",          kind: "structured",   status: "healthy",  icon: "Sg",  slug: "segment",             color: "#52BD94", desc: "Event streams and identity profiles." },
  { id: "okta", cat: "Identity & Events", domain: "okta.com",        name: "Okta",                  tag: "Identity",     kind: "structured",   status: "healthy",  icon: "O",   slug: "okta",                color: "#007DC1", desc: "Users, groups and identity mappings." },
  { id: "kafka", cat: "Identity & Events", domain: "apache.org",       name: "Apache Kafka",          tag: "Streaming",    kind: "structured",   status: "healthy",  icon: "K",   slug: "apachekafka",         color: "#231F20", desc: "Event topics consumed as a stream." },
  { id: "jira", cat: "Project & Support", domain: "atlassian.com",        name: "Jira",                  tag: "Issues",       kind: "structured",   status: "healthy",  icon: "Jr",  slug: "jira",                color: "#0052CC", desc: "Issues, sprints and project tracking." },
  { id: "zendesk", cat: "Project & Support", domain: "zendesk.com",     name: "Zendesk",               tag: "Support",      kind: "structured",   status: "healthy",  icon: "Z",   slug: "zendesk",             color: "#03363D", desc: "Tickets, macros and help-center articles." },
  { id: "asana", cat: "Project & Support", domain: "asana.com",       name: "Asana",                 tag: "Tasks",        kind: "structured",   status: "healthy",  icon: "As",  slug: "asana",               color: "#F06A6A", desc: "Projects, tasks and portfolios." },
  { id: "linear", cat: "Project & Support", domain: "linear.app",      name: "Linear",                tag: "Issues",       kind: "structured",   status: "healthy",  icon: "Ln",  slug: "linear",              color: "#5E6AD2", desc: "Issues, cycles and project updates." },
  // ── Unstructured sources (docs, files, messages, wikis) ──
  { id: "googledrive", cat: "Files & Storage", domain: "google.com", name: "Google Drive",          tag: "Files",        kind: "unstructured", status: "healthy",  icon: "GD",  slug: "googledrive",         color: "#1FA463", desc: "Docs, Sheets, Slides and stored files." },
  { id: "slack", cat: "Messaging & Email", domain: "slack.com",       name: "Slack",                 tag: "Messaging",    kind: "unstructured", status: "healthy",  icon: "Sl",  slug: "slack",               color: "#4A154B", desc: "Channels, threads and message history." },
  { id: "confluence", cat: "Docs & Wikis", domain: "atlassian.com",  name: "Confluence",            tag: "Wiki",         kind: "unstructured", status: "healthy",  icon: "Cf",  slug: "confluence",          color: "#172B4D", desc: "Spaces, pages and knowledge bases." },
  { id: "notion", cat: "Docs & Wikis", domain: "notion.so",      name: "Notion",                tag: "Wiki",         kind: "unstructured", status: "healthy",  icon: "No",  slug: "notion",              color: "#000000", desc: "Pages, wikis and databases." },
  { id: "sharepoint", cat: "Files & Storage", domain: "microsoft.com",  name: "SharePoint",            tag: "Files",        kind: "unstructured", status: "healthy",  icon: "SP",  slug: "microsoftsharepoint", color: "#0078D4", desc: "Document libraries and team sites." },
  { id: "onedrive", cat: "Files & Storage", domain: "microsoft.com",    name: "OneDrive",              tag: "Files",        kind: "unstructured", status: "healthy",  icon: "OD",  slug: "microsoftonedrive",   color: "#0078D4", desc: "Personal and shared cloud files." },
  { id: "dropbox", cat: "Files & Storage", domain: "dropbox.com",     name: "Dropbox",               tag: "Files",        kind: "unstructured", status: "healthy",  icon: "Dx",  slug: "dropbox",             color: "#0061FF", desc: "Synced files, folders and content." },
  { id: "box", cat: "Files & Storage", domain: "box.com",         name: "Box",                   tag: "Files",        kind: "unstructured", status: "healthy",  icon: "Bx",  slug: "box",                 color: "#0061D5", desc: "Enterprise content and shared files." },
  { id: "s3", cat: "Files & Storage", domain: "aws.amazon.com",          name: "Amazon S3",             tag: "Object store", kind: "unstructured", status: "healthy",  icon: "S3",  slug: "amazons3",            color: "#569A31", desc: "Objects and files in S3 buckets." },
  { id: "gcs", cat: "Files & Storage", domain: "cloud.google.com",         name: "Google Cloud Storage",  tag: "Object store", kind: "unstructured", status: "healthy",  icon: "GCS", slug: "googlecloud",         color: "#4285F4", desc: "Objects and files in GCS buckets." },
  { id: "gmail", cat: "Messaging & Email", domain: "google.com",       name: "Gmail",                 tag: "Email",        kind: "unstructured", status: "healthy",  icon: "GM",  slug: "gmail",               color: "#EA4335", desc: "Email threads, messages and attachments." },
  { id: "outlook", cat: "Messaging & Email", domain: "outlook.com",     name: "Outlook",               tag: "Email",        kind: "unstructured", status: "healthy",  icon: "Ol",  slug: "microsoftoutlook",    color: "#0078D4", desc: "Mailboxes, threads and calendar items." },
  { id: "github", cat: "Dev & Code", domain: "github.com",      name: "GitHub",                tag: "Code",         kind: "unstructured", status: "healthy",  icon: "GH",  slug: "github",              color: "#181717", desc: "Repos, pull requests, issues and READMEs." },
  { id: "gitlab", cat: "Dev & Code", domain: "gitlab.com",      name: "GitLab",                tag: "Code",         kind: "unstructured", status: "healthy",  icon: "GL",  slug: "gitlab",              color: "#FC6D26", desc: "Repositories, merge requests and CI." },
  { id: "intercom", cat: "Project & Support", domain: "intercom.com",    name: "Intercom",              tag: "Support",      kind: "unstructured", status: "healthy",  icon: "Ic",  slug: "intercom",            color: "#1F8DED", desc: "Conversations and help articles." },
  { id: "figma", cat: "Design", domain: "figma.com",       name: "Figma",                 tag: "Design",       kind: "unstructured", status: "healthy",  icon: "Fg",  slug: "figma",               color: "#F24E1E", desc: "Design files, frames and comments." },
  { id: "zoom", cat: "Messaging & Email", domain: "zoom.us",        name: "Zoom",                  tag: "Meetings",     kind: "unstructured", status: "healthy",  icon: "Zm",  slug: "zoom",                color: "#0B5CFF", desc: "Recordings and meeting transcripts." },
  { id: "custom", cat: "Custom",      name: "Custom connector",      tag: "Custom",       kind: "structured",   status: null,       icon: "+",   slug: "",                    color: "#A09E88", desc: "Bring your own REST, JDBC, gRPC or file source." },
];

// Connector category dropdown options for the picker (step 1).
const SRC_CATEGORIES = ["CRM & Marketing", "ERP & Finance", "Data Warehouse", "Databases", "Files & Storage", "Docs & Wikis", "Messaging & Email", "Dev & Code", "Project & Support", "Identity & Events", "Design"];

// Existing connections per source system (step 2). Falls back to a single default.
const CONNECTIONS_BY_SYS = {
  snowflake:  [
    { id: "sf-prod", name: "Production warehouse",  detail: "acme.us-east-1 · ANALYTICS_WH", auth: "Key-pair",        status: "healthy", lastUsed: "2h ago" },
    { id: "sf-stg",  name: "Staging warehouse",     detail: "acme.us-east-1 · STAGING_WH",   auth: "Key-pair",        status: "healthy", lastUsed: "3d ago" },
  ],
  salesforce: [
    { id: "sfdc-prod", name: "Production org",       detail: "acme.my.salesforce.com",                  auth: "OAuth2", status: "healthy", lastUsed: "1h ago" },
    { id: "sfdc-sbx",  name: "Sandbox",              detail: "acme--dev.sandbox.my.salesforce.com",     auth: "OAuth2", status: "degraded", lastUsed: "5d ago" },
  ],
  postgres:   [
    { id: "pg-rep",   name: "Primary read-replica",  detail: "db.acme.internal:5432 · prod",  auth: "Password",  status: "healthy", lastUsed: "12m ago" },
  ],
  hubspot:    [
    { id: "hs-mkt",   name: "Marketing hub",         detail: "portal 4821990",                auth: "OAuth2",    status: "healthy", lastUsed: "6h ago" },
  ],
};
function getConnections(sysId, sel) {
  if (CONNECTIONS_BY_SYS[sysId]) return CONNECTIONS_BY_SYS[sysId];
  if (!sel) return [];
  return [{ id: sysId + "-default", name: "Default connection", detail: sel.name + " · workspace", auth: "OAuth2", status: "healthy", lastUsed: "recently" }];
}

// Discoverable objects per source system (step 3). Falls back to generic tables.
const OBJECTS_BY_SYS = {
  salesforce: [
    { name: "Account",     type: "Object", rows: "2.8K", cols: 42 },
    { name: "Contact",     type: "Object", rows: "18K",  cols: 38 },
    { name: "Opportunity", type: "Object", rows: "6.2K", cols: 51 },
    { name: "Lead",        type: "Object", rows: "24K",  cols: 33 },
    { name: "Case",        type: "Object", rows: "142K", cols: 29 },
    { name: "Campaign",    type: "Object", rows: "320",  cols: 22 },
    { name: "Task",        type: "Object", rows: "410K", cols: 18 },
    { name: "User",        type: "Object", rows: "1.2K", cols: 44 },
    { name: "Product2",    type: "Object", rows: "180",  cols: 26 },
    { name: "Quote",       type: "Object", rows: "3.1K", cols: 35 },
  ],
  snowflake: [
    { name: "ANALYTICS.ACCOUNTS",         type: "Table", rows: "2.8K", cols: 18 },
    { name: "ANALYTICS.SUBSCRIPTIONS",    type: "Table", rows: "2.8K", cols: 11 },
    { name: "ANALYTICS.INVOICES",         type: "Table", rows: "12K",  cols: 13 },
    { name: "ANALYTICS.USAGE_EVENTS",     type: "Table", rows: "25M",  cols: 9  },
    { name: "ANALYTICS.ACCOUNT_HEALTH_V", type: "View",  rows: "2.8K", cols: 7  },
    { name: "RAW.SFDC_ACCOUNT",           type: "Table", rows: "2.8K", cols: 42 },
  ],
  postgres: [
    { name: "public.accounts",      type: "Table", rows: "2.8K", cols: 18 },
    { name: "public.users",         type: "Table", rows: "1.2K", cols: 14 },
    { name: "public.orders",        type: "Table", rows: "12K",  cols: 16 },
    { name: "public.order_items",   type: "Table", rows: "48K",  cols: 9  },
    { name: "billing.invoices",     type: "Table", rows: "12K",  cols: 13 },
  ],
  stripe: [
    { name: "customers",      type: "Object", rows: "2.8K", cols: 24 },
    { name: "subscriptions",  type: "Object", rows: "2.8K", cols: 31 },
    { name: "invoices",       type: "Object", rows: "12K",  cols: 28 },
    { name: "charges",        type: "Object", rows: "96K",  cols: 22 },
  ],
};
function getSourceObjects(sysId, sel) {
  if (OBJECTS_BY_SYS[sysId]) return OBJECTS_BY_SYS[sysId];
  return [
    { name: "accounts", type: "Table", rows: "2.8K", cols: 18 },
    { name: "contacts", type: "Table", rows: "18K",  cols: 14 },
    { name: "orders",   type: "Table", rows: "12K",  cols: 13 },
    { name: "events",   type: "Table", rows: "124K", cols: 9  },
    { name: "users",    type: "Table", rows: "1.2K", cols: 12 },
  ];
}

const DATA_TYPES = [
  { id: "string",    label: "string",    group: "Primitive", desc: "UTF-8 text, variable length" },
  { id: "int",       label: "int",       group: "Primitive", desc: "64-bit signed integer" },
  { id: "float",     label: "float",     group: "Primitive", desc: "64-bit IEEE 754 double" },
  { id: "decimal",   label: "decimal",   group: "Primitive", desc: "Arbitrary precision — safe for money" },
  { id: "bool",      label: "bool",      group: "Primitive", desc: "true / false" },
  { id: "timestamp", label: "timestamp", group: "Temporal",  desc: "UTC nanosecond epoch" },
  { id: "date",      label: "date",      group: "Temporal",  desc: "Calendar date, no time component" },
  { id: "uuid",      label: "uuid",      group: "Identity",  desc: "RFC 4122 UUID v4" },
  { id: "json",      label: "json",      group: "Complex",   desc: "Schemaless JSON document" },
  { id: "enum",      label: "enum(…)",   group: "Complex",   desc: "Closed value set — define members next" },
  { id: "array",     label: "array<T>",  group: "Complex",   desc: "Ordered list of a single type" },
  { id: "struct",    label: "struct",    group: "Complex",   desc: "Typed key-value nested object" },
  { id: "fk",        label: "fk(Node)", group: "Relation",  desc: "Foreign key reference to another node type" },
];

const PII_TIERS = [
  { id: "none",         label: "None",         color: "var(--ink-3)",  desc: "No personal data" },
  { id: "pseudonymous", label: "Pseudonymous", color: "#b8923a",       desc: "Indirect identifier; reversible with key" },
  { id: "personal",     label: "Personal",     color: "#b8923a",       desc: "Directly identifies a natural person" },
  { id: "sensitive",    label: "Sensitive",    color: "var(--coral)",  desc: "Health, finance, religion — GDPR Art. 9" },
  { id: "restricted",   label: "Restricted",   color: "#b14a3c",       desc: "Highest risk — encrypted at rest, access logged" },
];

const MASKING_RULES = [
  { id: "none",      label: "No masking",         desc: "Value returned in full" },
  { id: "partial",   label: "Partial (last 4)",   desc: "e.g. ****4242" },
  { id: "hash",      label: "Deterministic hash", desc: "SHA-256 — consistent across joins" },
  { id: "redact",    label: "Full redaction",      desc: "[REDACTED] for non-privileged roles" },
  { id: "tokenise",  label: "Tokenise (vault)",   desc: "Vault token; only privileged roles get raw value" },
];

const RETENTION_OPTS = [
  { id: "inherit",  label: "Inherit from node type" },
  { id: "30d",      label: "30 days" },
  { id: "90d",      label: "90 days" },
  { id: "1y",       label: "1 year" },
  { id: "7y",       label: "7 years (regulatory)" },
  { id: "forever",  label: "No expiry" },
];

const ROLES = ["acct_admin","fin_ops","cs_platform","governance","data_platform","applied_ml","read_all"];
const GOV_TAGS = ["pii","billing","sensitive","analytics","slo:24h","experimental","deprecated-candidate","audit-required"];

const VALIDATION_PRESETS = [
  { id: "none",    label: "None" },
  { id: "email",   label: "Email address",   pattern: "^[^@]+@[^@]+\\.[^@]+$" },
  { id: "url",     label: "URL (http/https)", pattern: "^https?://.+" },
  { id: "uuid",    label: "UUID v4",          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}…" },
  { id: "isodate", label: "ISO 8601 date" },
  { id: "phone",   label: "E.164 phone",      pattern: "^\\+[1-9]\\d{6,14}$" },
  { id: "slug",    label: "URL slug",          pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
];

const SOURCE_COLS_MOCK = {
  salesforce: [
    { col: "Id",                  type: "string",    sample: "0015g00000AbCdE" },
    { col: "Name",                type: "string",    sample: "Acme Corp" },
    { col: "Industry",            type: "string",    sample: "Technology" },
    { col: "AnnualRevenue",       type: "decimal",   sample: "24500000.00" },
    { col: "BillingCountry",      type: "string",    sample: "US" },
    { col: "OwnerId",             type: "string",    sample: "0055g00000XyZaB" },
    { col: "CreatedDate",         type: "timestamp", sample: "2024-01-12T09:14:00Z" },
    { col: "LastModifiedDate",    type: "timestamp", sample: "2026-04-02T14:22:11Z" },
    { col: "IsDeleted",           type: "bool",      sample: "false" },
    { col: "CustomerPriority__c", type: "string",    sample: "High" },
    { col: "ContractEndDate__c",  type: "date",      sample: "2027-06-30" },
  ],
  netsuite: [
    { col: "internal_id",   type: "int",       sample: "10284" },
    { col: "company_name",  type: "string",    sample: "Acme Corp" },
    { col: "subsidiary",    type: "string",    sample: "US Entity" },
    { col: "currency",      type: "string",    sample: "USD" },
    { col: "balance",       type: "decimal",   sample: "12400.00" },
    { col: "date_created",  type: "timestamp", sample: "2024-01-15T00:00:00Z" },
  ],
  snowflake: [
    { col: "account_key",  type: "uuid",      sample: "7f3b4a…" },
    { col: "domain",       type: "string",    sample: "acme.com" },
    { col: "dau_30d",      type: "int",       sample: "1240" },
    { col: "arr_usd",      type: "decimal",   sample: "48200.00" },
    { col: "churn_score",  type: "float",     sample: "0.14" },
    { col: "last_login_at",type: "timestamp", sample: "2026-05-21T11:04:22Z" },
  ],
};

function getSourceCols(id) {
  return SOURCE_COLS_MOCK[id] || [
    { col: "id",         type: "string",    sample: "abc123" },
    { col: "name",       type: "string",    sample: "Example" },
    { col: "created_at", type: "timestamp", sample: "2026-01-01T00:00:00Z" },
    { col: "updated_at", type: "timestamp", sample: "2026-05-01T00:00:00Z" },
  ];
}

// Per-object columns — used by the multi-object column-mapping step so each
// selected object can be mapped independently.
const OBJECT_COLS_BY_NAME = {
  accounts: [
    { col: "id",             type: "string",    sample: "acc_8f3" },
    { col: "name",           type: "string",    sample: "Acme Corp" },
    { col: "domain",         type: "string",    sample: "acme.com" },
    { col: "industry",       type: "string",    sample: "Technology" },
    { col: "annual_revenue", type: "decimal",   sample: "24500000.00" },
    { col: "country",        type: "string",    sample: "US" },
    { col: "owner_id",       type: "string",    sample: "usr_55x" },
    { col: "created_at",     type: "timestamp", sample: "2024-01-12T09:14:00Z" },
    { col: "updated_at",     type: "timestamp", sample: "2026-04-02T14:22:11Z" },
  ],
  contacts: [
    { col: "id",         type: "string",    sample: "ctc_1a2" },
    { col: "first_name", type: "string",    sample: "Jane" },
    { col: "last_name",  type: "string",    sample: "Doe" },
    { col: "email",      type: "string",    sample: "jane@acme.com" },
    { col: "phone",      type: "string",    sample: "+14155550100" },
    { col: "account_id", type: "string",    sample: "acc_8f3" },
    { col: "title",      type: "string",    sample: "VP Eng" },
    { col: "created_at", type: "timestamp", sample: "2024-02-01T00:00:00Z" },
  ],
  orders: [
    { col: "id",         type: "string",    sample: "ord_77c" },
    { col: "account_id", type: "string",    sample: "acc_8f3" },
    { col: "amount_usd", type: "decimal",   sample: "1299.00" },
    { col: "currency",   type: "string",    sample: "USD" },
    { col: "status",     type: "string",    sample: "paid" },
    { col: "placed_at",  type: "timestamp", sample: "2026-03-10T12:00:00Z" },
  ],
  events: [
    { col: "id",          type: "string",    sample: "evt_9z" },
    { col: "event_type",  type: "string",    sample: "login" },
    { col: "account_id",  type: "string",    sample: "acc_8f3" },
    { col: "user_id",     type: "string",    sample: "usr_3k" },
    { col: "occurred_at", type: "timestamp", sample: "2026-05-21T11:04:22Z" },
  ],
  users: [
    { col: "id",            type: "string",    sample: "usr_3k" },
    { col: "name",          type: "string",    sample: "Sam Lee" },
    { col: "email",         type: "string",    sample: "sam@acme.com" },
    { col: "role",          type: "string",    sample: "admin" },
    { col: "last_login_at", type: "timestamp", sample: "2026-05-20T08:00:00Z" },
  ],
};
function getObjectCols(obj) {
  if (!obj) return [];
  const key = String(obj.name || "").toLowerCase().replace(/^.*[.]/, "");
  const hit = OBJECT_COLS_BY_NAME[key] || OBJECT_COLS_BY_NAME[key + "s"] || OBJECT_COLS_BY_NAME[key.replace(/s$/, "")];
  if (hit) return hit;
  // Generic fallback sized to the object's declared column count.
  const n = Math.max(4, Math.min(obj.cols || 6, 12));
  const base = [
    { col: "id",         type: "string",    sample: "id_001" },
    { col: "name",       type: "string",    sample: "—" },
    { col: "status",     type: "string",    sample: "active" },
    { col: "amount",     type: "decimal",   sample: "0.00" },
    { col: "owner_id",   type: "string",    sample: "usr_1" },
    { col: "created_at", type: "timestamp", sample: "2026-01-01T00:00:00Z" },
    { col: "updated_at", type: "timestamp", sample: "2026-06-01T00:00:00Z" },
  ];
  const out = base.slice(0, n);
  for (let i = out.length; i < n; i++) out.push({ col: "field_" + (i + 1), type: "string", sample: "—" });
  return out;
}

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────

function useOutsideClick(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
}

// Single full-width form row
function FormRow({ label, required, optional, children, hint, last }) {
  return (
    <div className={"wfr" + (last ? " wfr-last" : "")}>
      <div className="wfr-label">
        {label}
        {required && <span className="wfr-req">REQUIRED</span>}
        {optional && <span className="wfr-opt">OPTIONAL</span>}
      </div>
      <div className="wfr-body">{children}</div>
      {hint && <div className="wfr-hint">{hint}</div>}
    </div>
  );
}

// Grouped dropdown (types, PII, masking, etc.)
function CustomSelect({ value, onChange, options, placeholder = "—", renderTrigger, renderOption, grouped, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, open, () => setOpen(false));

  const allOptions = grouped ? options.flatMap(g => g.items) : options;
  const sel = allOptions.find(o => (o.id || o) === value);

  return (
    <div className={"csel" + (className ? " " + className : "")} ref={ref}>
      <button className={"csel-trigger" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
        <span className="csel-val">
          {sel ? (renderTrigger ? renderTrigger(sel) : sel.label || sel.name || sel) : <span className="csel-ph">{placeholder}</span>}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={"csel-chevron" + (open ? " up" : "")}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="csel-menu">
          {grouped ? options.map(g => (
            <div key={g.label}>
              <div className="csel-group">{g.label}</div>
              {g.items.map(o => (
                <button key={o.id} className={"csel-opt" + (value === o.id ? " on" : "")} onClick={() => { onChange(o.id); setOpen(false); }}>
                  {renderOption ? renderOption(o) : <><span className="csel-opt-label">{o.label}</span>{o.desc && <span className="csel-opt-sub">{o.desc}</span>}</>}
                  {value === o.id && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="csel-tick"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
              ))}
            </div>
          )) : options.map(o => {
            const id = o.id || o;
            const label = o.label || o.name || o;
            return (
              <button key={id} className={"csel-opt" + (value === id ? " on" : "")} onClick={() => { onChange(id); setOpen(false); }}>
                {renderOption ? renderOption(o) : <><span className="csel-opt-label">{label}</span>{o.desc && <span className="csel-opt-sub">{o.desc}</span>}</>}
                {value === id && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="csel-tick"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Grouped type select
function TypeSelect({ value, onChange }) {
  const GROUPS = [
    { label: "Primitive", items: DATA_TYPES.filter(t => t.group === "Primitive") },
    { label: "Temporal",  items: DATA_TYPES.filter(t => t.group === "Temporal") },
    { label: "Identity",  items: DATA_TYPES.filter(t => t.group === "Identity") },
    { label: "Complex",   items: DATA_TYPES.filter(t => t.group === "Complex") },
    { label: "Relation",  items: DATA_TYPES.filter(t => t.group === "Relation") },
  ];
  const sel = DATA_TYPES.find(t => t.id === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={GROUPS} grouped
      placeholder="pick a type"
      renderTrigger={t => <><code className="csel-code">{t.label}</code><span className="csel-val-sub">{t.desc}</span></>}
      renderOption={t => <><code className="csel-code">{t.label}</code><span className="csel-opt-sub">{t.desc}</span></>}
    />
  );
}

// Source system select with icon + health
function SysSelect({ value, onChange }) {
  const sel = SOURCE_SYSTEMS.find(s => s.id === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={SOURCE_SYSTEMS} placeholder="— choose connector —"
      renderTrigger={s => (
        <span className="csel-sys-val">
          <span className="csel-sys-icon" style={{ background: s.color + "1a", color: s.color }}>{s.icon}</span>
          <span>{s.name}</span>
          <span className={"csel-sys-dot " + (s.status || "custom")} />
        </span>
      )}
      renderOption={s => (
        <span className="csel-sys-val" style={{ width: "100%" }}>
          <span className="csel-sys-icon" style={{ background: s.color + "1a", color: s.color }}>{s.icon}</span>
          <span className="csel-opt-label">{s.name}</span>
          <span className="csel-opt-sub csel-sys-tag">{s.tag}</span>
          <span className={"csel-sys-dot " + (s.status || "custom")} />
        </span>
      )}
    />
  );
}

// Column select (discovered columns)
function ColSelect({ cols, value, onChange, placeholder = "— pick column —" }) {
  const sel = cols.find(c => c.col === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={cols.map(c => ({ id: c.col, label: c.col, type: c.type, sample: c.sample }))}
      placeholder={placeholder}
      renderTrigger={c => <><code className="csel-code">{c.label}</code><span className="csel-val-sub">{c.id !== value ? "" : (cols.find(x=>x.col===value)?.type || "")}</span></>}
      renderOption={c => (
        <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <code className="csel-code" style={{ minWidth: 130 }}>{c.label}</code>
          <span className="csel-opt-sub" style={{ minWidth: 70 }}>{c.type}</span>
          <span className="csel-opt-sub" style={{ marginLeft: "auto", opacity: 0.6 }}>{c.sample}</span>
        </span>
      )}
    />
  );
}

// PII select with color swatch
function PIISelect({ value, onChange }) {
  const sel = PII_TIERS.find(t => t.id === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={PII_TIERS}
      placeholder="— classify —"
      renderTrigger={t => (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
          <span style={{ color: t.color, fontWeight: 500 }}>{t.label}</span>
          <span className="csel-val-sub">{t.desc}</span>
        </span>
      )}
      renderOption={t => (
        <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
          <span className="csel-opt-label" style={{ color: t.color }}>{t.label}</span>
          <span className="csel-opt-sub">{t.desc}</span>
        </span>
      )}
    />
  );
}

// Compact radio list — for source kind, load strategy, error policy (4 options)
function RadioList({ options, value, onChange }) {
  return (
    <div className="wrl">
      {options.map(o => (
        <button key={o.id} className={"wrl-item" + (value === o.id ? " on" : "")} onClick={() => onChange(o.id)}>
          <span className={"wrl-radio" + (value === o.id ? " on" : "")} />
          <div className="wrl-body">
            <span className="wrl-label">{o.label}</span>
            {o.tag && <span className={"wrl-tag wrl-tag-" + o.id}>{o.tag}</span>}
            {o.desc && <span className="wrl-desc">{o.desc}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

// Segmented control — 2-3 options only
function Seg({ options, value, onChange, risk }) {
  return (
    <div className="seg">
      {options.map(o => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? o : o.label;
        const riskClass = risk && value === id ? " risk-" + id.toLowerCase() : "";
        return (
          <button key={id} className={"seg-opt" + (value === id ? " on" + riskClass : "")} onClick={() => onChange(id)}>{label}</button>
        );
      })}
    </div>
  );
}

// Multi-token select (roles, tags)
function MultiToken({ options, value, onChange, placeholder = "add…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, open, () => setOpen(false));
  const available = options.filter(o => !value.includes(o));

  return (
    <div className="wmt" ref={ref}>
      <div className={"wmt-field" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
        {value.map(v => (
          <span key={v} className="wmt-token">
            {v}
            <button className="wmt-x" onClick={e => { e.stopPropagation(); onChange(value.filter(x => x !== v)); }}>×</button>
          </span>
        ))}
        <span className="wmt-ph">{value.length === 0 ? placeholder : "add…"}</span>
      </div>
      {open && available.length > 0 && (
        <div className="wmt-menu">
          {available.map(o => (
            <button key={o} className="wmt-opt" onClick={() => onChange([...value, o])}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline flag checkboxes
function FlagsRow({ flags, values, onChange }) {
  return (
    <div className="wflag-row">
      {flags.map(f => (
        <label key={f.key} className={"wflag" + (values[f.key] ? " on" : "")}>
          <input type="checkbox" checked={values[f.key]} onChange={e => onChange({ ...values, [f.key]: e.target.checked })} />
          <span>{f.label}</span>
        </label>
      ))}
    </div>
  );
}

// Enum token editor
function EnumEditor({ values, onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !values.includes(v)) { onChange([...values, v]); setInput(""); } };
  return (
    <div className="wenum">
      <div className="wenum-tokens">
        {values.map((v, i) => (
          <span key={i} className="wmt-token">{v}<button className="wmt-x" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button></span>
        ))}
        <input className="wenum-input" placeholder="type value, press Enter" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
      </div>
    </div>
  );
}

// Slider row
function SliderRow({ value, onChange, min = 0, max = 100, step = 1, fmt }) {
  return (
    <div className="wslider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="wslider-input" />
      <span className="wslider-val">{fmt ? fmt(value) : value}</span>
    </div>
  );
}

// Backfill banner
function BackfillBanner({ backfill, onChange, estimate }) {
  return (
    <div className={"wbf" + (backfill ? " on" : "")}>
      <div className="wbf-left">
        <span className="wbf-tag">BACKFILL</span>
        <div>
          <div className="wbf-title">{backfill ? "Historical data will be replayed" : "Backfill disabled"}</div>
          {estimate && <div className="wbf-sub">{estimate}</div>}
        </div>
      </div>
      <label className="switch"><input type="checkbox" checked={backfill} onChange={e => onChange(e.target.checked)} /><span className="switch-track" /></label>
    </div>
  );
}

// ─── FLOW SHELL (shared wrapper) ──────────────────────────────────────────────

function WizardShell({ eyebrow, plainTitle, titleFrom, titleTo, titleLabel, titleType, stage, steps, step, setStep, onClose, rightPane, children, canNext, onNext, onPublish, hideKeymap, hideFootHelp, hideStage, overlay, fullScreen }) {
  return (
    <div className={"flow-overlay" + (fullScreen ? " flow-overlay-full" : "")} onClick={onClose}>
      <div className="flow-shell" onClick={e => e.stopPropagation()}>
        <div className="flow-head">
          <div className="flow-head-left">
            {plainTitle ? (
              <div className="flow-title">{plainTitle}</div>
            ) : (
              <>
                <div className="flow-eyebrow">{eyebrow}</div>
                <div className="flow-title">
                  {titleFrom}
                  {titleLabel && <><span className="flow-title-arrow">·</span><span className="flow-title-label">{titleLabel}</span></>}
                  {titleType && <span className="flow-title-type">{titleType}</span>}
                  {titleTo && <><span className="flow-title-arrow">→</span>{titleTo}</>}
                </div>
              </>
            )}
          </div>
          <div className="flow-head-right">
            {!hideStage && <span className="flow-stage-pill">target · <b>{stage}</b></span>}
            <button className="flow-close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
        <div className="flow-body" style={!rightPane ? { gridTemplateColumns: "240px minmax(0, 1fr)" } : undefined}>
          <aside className="flow-steps">
            {steps.map((s, i) => (
              <Fragment key={i}>
                <button className={"flow-step" + (i === step ? " on" : "") + (i < step ? " done" : "")} onClick={() => setStep(i)}>
                  <span className="flow-step-n">{i < step ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg> : i + 1}</span>
                  <div className="flow-step-text">
                    <div className="flow-step-label">{s.label}</div>
                    <div className="flow-step-hint">{s.hint}</div>
                  </div>
                </button>
                {i === step && s.subItems && s.subItems.length > 0 && (
                  <div style={{ margin: "4px 0 6px 26px", display: "flex", flexDirection: "column", gap: 3, borderLeft: "1px solid var(--line)", paddingLeft: 10 }}>
                    {s.subItems.map(si => {
                      const on = si.id === s.activeSub;
                      const total = si.total != null ? si.total : 0;
                      const mapped = si.mapped != null ? si.mapped : 0;
                      const rich = si.total != null;
                      const complete = total > 0 && mapped >= total;
                      const frac = total > 0 ? Math.min(1, mapped / total) : 0;
                      const R = 9, C = 2 * Math.PI * R;
                      const ringColor = complete ? "var(--green)" : "var(--ink)";
                      const initials = (si.label || "").replace(/^.*[.]/, "").slice(0, 2).toUpperCase();
                      if (!rich) {
                        return (
                          <button key={si.id} onClick={() => s.onSub && s.onSub(si.id)}
                            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 7, border: "none", background: on ? "var(--bg-canvas)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel)"; }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: on ? "var(--ink)" : (si.done ? "var(--green)" : "var(--line)") }} />
                            <span style={{ flex: 1, minWidth: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: on ? 600 : 500, color: on ? "var(--ink)" : "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{si.label}</span>
                          </button>
                        );
                      }
                      return (
                        <button key={si.id} onClick={() => s.onSub && s.onSub(si.id)}
                          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: on ? "var(--chip)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 100ms" }}
                          onMouseEnter={e => { if (!on) e.currentTarget.style.background = "#f1ecdd"; }}
                          onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                          {/* progress ring + monogram */}
                          <span style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
                            <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: "rotate(-90deg)", display: "block" }}>
                              <circle cx="13" cy="13" r={R} fill="none" stroke="var(--line)" strokeWidth="2.4" />
                              {mapped > 0 && <circle cx="13" cy="13" r={R} fill="none" stroke={ringColor} strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} />}
                            </svg>
                            {complete && (
                              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="var(--green)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg>
                              </span>
                            )}
                          </span>
                          {/* name + sub */}
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? "var(--ink)" : "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>{si.label}</span>
                            <span style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: complete ? "var(--green)" : (mapped > 0 ? "var(--ink-3)" : "var(--ink-4)"), marginTop: 2 }}>{mapped + " / " + total}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Fragment>
            ))}
            {!hideKeymap && (
              <div className="flow-steps-foot">
                <div className="flow-keymap">
                  <span className="kbd">⌘↵</span><span>Publish</span>
                  <span className="kbd">⌘S</span><span>Draft</span>
                </div>
              </div>
            )}
          </aside>
          <main className="flow-main">{children}</main>
          {rightPane && <aside className="flow-preview">{rightPane}</aside>}
        </div>
        <div className="flow-foot">
          <div className="flow-foot-left">
            <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</button>
            {!hideFootHelp && <span className="flow-foot-help">Step {step + 1} of {steps.length} · <b>{steps[step].label}</b></span>}
          </div>
          <div className="flow-foot-right">
            <button className="btn-ghost">Save draft</button>
            {step < steps.length - 1
              ? <button className="btn-dark" onClick={onNext} disabled={!canNext}>Continue →</button>
              : <button className="btn-dark" onClick={onPublish}>{hideStage ? "Publish ↵" : "Publish to " + stage + " ↵"}</button>
            }
          </div>
        </div>
        {overlay}
      </div>
    </div>
  );
}

// Step wrapper
function StepWrap({ eyebrow, title, desc, children, wide }) {
  return (
    <div className={"wstep" + (wide ? " wstep-wide" : "")}>
      <div className="wstep-head">
        {eyebrow && <div className="step-eyebrow">{eyebrow}</div>}
        <div className="wstep-title">{title}</div>
        {desc && <div className="wstep-desc">{desc}</div>}
      </div>
      <div className="wstep-body">{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ADD PROPERTY WIZARD
// ════════════════════════════════════════════════════════════════════════════

const PROP_STEPS = [
  { label: "Basics",     hint: "Name, type, flags" },
  { label: "Source",     hint: "Where the value comes from" },
  { label: "Validation", hint: "Rules and format" },
  { label: "Governance", hint: "PII, access, retention" },
  { label: "Review",     hint: "Migration diff & publish" },
];

const SOURCE_KIND_OPTS = [
  { id: "direct",   label: "Direct source column",  tag: "DIRECT",   desc: "Value loaded from a source-system column or stream." },
  { id: "computed", label: "Computed expression",   tag: "COMPUTED", desc: "Derived from a formula over other properties at write time." },
  { id: "agent",    label: "Agent-written",          tag: "AGENT",    desc: "An agent emits this value as an output of its reasoning." },
  { id: "constant", label: "Constant / seed",        tag: "CONSTANT", desc: "Set once at creation and never overwritten by a sync." },
];

function AddPropertyFlow({ node, onClose }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    name: "", description: "", type: "string", enumValues: [],
    arrayItemType: "string", fkNode: "",
    defaultValue: "", exampleValue: "",
    required: false, indexed: false, unique: false, nullable: true,
    sourceKind: "direct", sourceSystem: "salesforce", sourceTable: "",
    sourceCol: "", coercion: "auto", expression: "", agentId: "",
    agentField: "", agentConfidence: 80, constantValue: "", constantBehaviour: "on_create",
    validationPreset: "none", customRegex: "", minVal: "", maxVal: "",
    nullPolicy: "allow", validationMode: "log",
    piiTier: "none", maskingRule: "none", retention: "inherit",
    accessRoles: ["read_all"], tags: [], changeRisk: "LOW",
    stage: "draft", backfill: true,
  });

  const set = patch => setP(v => ({ ...v, ...patch }));
  const nameCleaned = p.name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  const nameValid = nameCleaned.length >= 2;
  const canNext = step === 0 ? (nameValid && !!p.type) : true;
  const agents = (STUB_NODES || []).filter(n => n.type === "agent");
  const srcCols = getSourceCols(p.sourceSystem);

  const flags = { required: p.required, indexed: p.indexed, unique: p.unique, nullable: p.nullable };

  const titleFrom = (
    <span className="flow-title-from">
      {node && StubListGlyph && <StubListGlyph node={node} size={18} />}
      {node?.label}
    </span>
  );

  return (
    <WizardShell
      eyebrow={`SCHEMA · ${node?.label?.toUpperCase()} · ADD PROPERTY`}
      titleFrom={titleFrom}
      titleLabel={nameCleaned ? "." + nameCleaned : null}
      titleType={p.type && nameCleaned ? p.type : null}
      stage={p.stage}
      steps={PROP_STEPS} step={step} setStep={setStep}
      canNext={canNext}
      onNext={() => setStep(s => s + 1)}
      onPublish={onClose}
      onClose={onClose}
      rightPane={<PropPreview p={p} node={node} nameCleaned={nameCleaned} />}
    >
      {step === 0 && <PropBasics p={p} set={set} nameCleaned={nameCleaned} nameValid={nameValid} flags={flags} agents={agents} />}
      {step === 1 && <PropSource p={p} set={set} node={node} agents={agents} srcCols={srcCols} />}
      {step === 2 && <PropValidation p={p} set={set} />}
      {step === 3 && <PropGovernance p={p} set={set} />}
      {step === 4 && <PropReview p={p} set={set} node={node} nameCleaned={nameCleaned} onClose={onClose} />}
    </WizardShell>
  );
}

// ── Step 1: Basics ────────────────────────────────────────────────────────────

function PropBasics({ p, set, nameCleaned, nameValid, flags }) {
  const [nameTouched, setNameTouched] = useState(false);
  const nodeOpts = (STUB_NODES || []).filter(n => n.type === "entity");

  return (
    <StepWrap eyebrow="STEP 1 · BASICS" title="Name and type this property" desc="Property names become part of the schema's public API — once published, agents and queries will reference this name.">
      <FormRow label="Property name" required hint={nameCleaned && nameValid ? `✓  .${nameCleaned} is available` : "lowercase_snake_case · letters, digits, underscores"}>
        <div className="wfr-prefix-input">
          <span className="wfr-prefix">.</span>
          <input
            className={"winput winput-mono winput-xl" + (nameTouched && !nameValid ? " winput-err" : "")}
            placeholder="annual_revenue_usd"
            value={p.name}
            onChange={e => { set({ name: e.target.value }); setNameTouched(true); }}
            autoFocus
          />
        </div>
      </FormRow>

      <FormRow label="Data type" required hint={DATA_TYPES.find(t => t.id === p.type)?.desc}>
        <TypeSelect value={p.type} onChange={v => set({ type: v })} />
      </FormRow>

      {p.type === "enum" && (
        <FormRow label="Enum values" hint="Press Enter to add. Unknown values policy is set in Validation.">
          <EnumEditor values={p.enumValues} onChange={v => set({ enumValues: v })} />
        </FormRow>
      )}

      {p.type === "array" && (
        <FormRow label="Array item type">
          <CustomSelect value={p.arrayItemType} onChange={v => set({ arrayItemType: v })}
            options={DATA_TYPES.filter(t => !["array","struct","fk"].includes(t.id)).map(t => ({ id: t.id, label: t.label, desc: t.desc }))} />
        </FormRow>
      )}

      {p.type === "fk" && (
        <FormRow label="References node type">
          <CustomSelect value={p.fkNode} onChange={v => set({ fkNode: v })}
            placeholder="— pick node type —"
            options={(STUB_NODES || []).filter(n => n.type === "entity").map(n => ({ id: n.id, label: n.label }))} />
        </FormRow>
      )}

      <FormRow label="Description" optional>
        <textarea className="winput winput-textarea" rows="2" placeholder="What does this property represent? What business concept does it encode?" value={p.description} onChange={e => set({ description: e.target.value })} />
      </FormRow>

      <FormRow label="Default value" optional>
        <input className="winput winput-mono" placeholder={p.type === "bool" ? "false" : p.type === "int" ? "0" : "null"} value={p.defaultValue} onChange={e => set({ defaultValue: e.target.value })} />
      </FormRow>

      <FormRow label="Example value" optional hint="Shown in documentation and tooltips.">
        <input className="winput winput-mono" placeholder="acme.com" value={p.exampleValue} onChange={e => set({ exampleValue: e.target.value })} />
      </FormRow>

      <FormRow label="Flags" last hint="Required: write fails if absent · Indexed: B-tree lookup · Unique: enforces uniqueness · Nullable: allows null">
        <FlagsRow
          flags={[
            { key: "required", label: "Required" },
            { key: "indexed",  label: "Indexed" },
            { key: "unique",   label: "Unique" },
            { key: "nullable", label: "Nullable" },
          ]}
          values={flags}
          onChange={v => set(v)}
        />
      </FormRow>
    </StepWrap>
  );
}

// ── Step 2: Source ────────────────────────────────────────────────────────────

function PropSource({ p, set, node, agents, srcCols }) {
  return (
    <StepWrap eyebrow="STEP 2 · SOURCE" title="Where does the value come from?" desc="Every property needs a system of record. Lineage and freshness SLOs are derived from this choice.">
      <FormRow label="Source kind" required>
        <RadioList value={p.sourceKind} onChange={v => set({ sourceKind: v })} options={SOURCE_KIND_OPTS} />
      </FormRow>

      {p.sourceKind === "direct" && <>
        <FormRow label="Source system" required>
          <SysSelect value={p.sourceSystem} onChange={v => set({ sourceSystem: v, sourceCol: "" })} />
        </FormRow>
        <FormRow label="Source table / topic">
          <input className="winput winput-mono" placeholder="accounts" value={p.sourceTable} onChange={e => set({ sourceTable: e.target.value })} />
        </FormRow>
        <FormRow label="Source column" required hint={srcCols.length + " columns discovered from " + p.sourceSystem}>
          <ColSelect cols={srcCols} value={p.sourceCol} onChange={v => set({ sourceCol: v })} />
        </FormRow>
        <FormRow label="Type coercion">
          <Seg options={["auto","strict","custom"]} value={p.coercion} onChange={v => set({ coercion: v })} />
        </FormRow>
        <FormRow label="Update cadence" last>
          <Seg options={["streaming","5min","hourly","daily"]} value={p.schedule || "5min"} onChange={v => set({ schedule: v })} />
        </FormRow>
      </>}

      {p.sourceKind === "computed" && <>
        <FormRow label="Expression" hint="Reference other properties by name. Supports CASE, COALESCE, arithmetic, string functions.">
          <textarea className="winput winput-mono winput-code" rows="7" placeholder={"CASE\n  WHEN arr_usd >= 100000 THEN 'ENT'\n  WHEN arr_usd >= 10000  THEN 'MM'\n  ELSE 'SMB'\nEND"} value={p.expression} onChange={e => set({ expression: e.target.value })} />
        </FormRow>
        <FormRow label="Re-evaluate on">
          <Seg options={["any_change","schedule","manual"]} value={p.reeval || "any_change"} onChange={v => set({ reeval: v })} />
        </FormRow>
        <FormRow label="Fallback if expression fails" last>
          <CustomSelect value={p.fallback || "null"} onChange={v => set({ fallback: v })} options={[
            { id: "null",    label: "null",          desc: "Store null silently" },
            { id: "default", label: "Use default",   desc: "Fall back to the defined default value" },
            { id: "error",   label: "Surface error", desc: "Write fails; shows in quality dashboard" },
          ]} />
        </FormRow>
      </>}

      {p.sourceKind === "agent" && <>
        <FormRow label="Authoring agent">
          <CustomSelect value={p.agentId} onChange={v => set({ agentId: v })} placeholder="— pick agent —"
            options={agents.map(a => ({ id: a.id, label: a.label, desc: a.desc }))} />
        </FormRow>
        <FormRow label="Output field name" hint="The key in the agent's output JSON that maps to this property.">
          <input className="winput winput-mono" placeholder="score_value" value={p.agentField} onChange={e => set({ agentField: e.target.value })} />
        </FormRow>
        <FormRow label={`Confidence threshold · ${p.agentConfidence}%`} hint="Values below threshold are stored as null with a :proposed annotation." last>
          <SliderRow value={p.agentConfidence} onChange={v => set({ agentConfidence: v })} fmt={v => "≥ " + (v/100).toFixed(2)} />
        </FormRow>
      </>}

      {p.sourceKind === "constant" && <>
        <FormRow label="Constant value">
          <input className="winput winput-mono" placeholder="e.g. true, 0, SMB" value={p.constantValue} onChange={e => set({ constantValue: e.target.value })} />
        </FormRow>
        <FormRow label="Set behaviour" last>
          <CustomSelect value={p.constantBehaviour} onChange={v => set({ constantBehaviour: v })} options={[
            { id: "on_create", label: "On create only", desc: "Set once at first write, never overwritten" },
            { id: "always",    label: "Always",          desc: "Overwrite on every sync" },
            { id: "if_null",   label: "If null only",    desc: "Only sets when the current value is null" },
          ]} />
        </FormRow>
      </>}

      <BackfillBanner backfill={p.backfill} onChange={v => set({ backfill: v })} estimate="~12,400 rows · ~3.2 min in staging" />
    </StepWrap>
  );
}

// ── Step 3: Validation ────────────────────────────────────────────────────────

function PropValidation({ p, set }) {
  const isNumeric = ["int","float","decimal"].includes(p.type);
  const isString  = ["string","uuid"].includes(p.type);

  return (
    <StepWrap eyebrow="STEP 3 · VALIDATION" title="Define validation rules" desc="Rules run at write time. Violations appear in the Quality dashboard and daily drift reports.">
      {isString && (
        <FormRow label="Format preset">
          <CustomSelect value={p.validationPreset} onChange={v => set({ validationPreset: v })}
            options={VALIDATION_PRESETS.map(vp => ({ id: vp.id, label: vp.label, desc: vp.pattern ? vp.pattern.slice(0,40) + "…" : "" }))} />
        </FormRow>
      )}

      {isString && (
        <FormRow label="Custom regex" optional hint="Applied after format preset. Failed rows are flagged, not rejected, unless mode is strict.">
          <div className="wfr-prefix-input">
            <span className="wfr-prefix">/</span>
            <input className="winput winput-mono" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }} placeholder="^[A-Z]{2,3}-\d{4}$" value={p.customRegex} onChange={e => set({ customRegex: e.target.value })} />
            <span className="wfr-prefix wfr-suffix">/i</span>
          </div>
        </FormRow>
      )}

      {isNumeric && (
        <FormRow label="Value range" hint="Both bounds are inclusive. Leave blank for no constraint.">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="winput winput-mono" placeholder="min" style={{ width: 120 }} value={p.minVal} onChange={e => set({ minVal: e.target.value })} />
            <span style={{ color: "var(--ink-3)", fontFamily: "JetBrains Mono", fontSize: 13 }}>to</span>
            <input className="winput winput-mono" placeholder="max" style={{ width: 120 }} value={p.maxVal} onChange={e => set({ maxVal: e.target.value })} />
          </div>
        </FormRow>
      )}

      {p.type === "enum" && (
        <FormRow label="On unknown enum value">
          <CustomSelect value={p.enumUnknown || "reject"} onChange={v => set({ enumUnknown: v })} options={[
            { id: "reject",     label: "Reject",     desc: "Write fails for any unlisted value" },
            { id: "null",       label: "Null",        desc: "Store null; behavior is preserved" },
            { id: "quarantine", label: "Quarantine",  desc: "Proposed state pending enum expansion review" },
            { id: "allow_new",  label: "Allow new",  desc: "Enum auto-expands; triggers drift notification" },
          ]} />
        </FormRow>
      )}

      <FormRow label="Null policy">
        <Seg options={["allow","warn","reject"]} value={p.nullPolicy} onChange={v => set({ nullPolicy: v })} />
      </FormRow>

      <FormRow label="Validation mode" hint={
        p.validationMode === "log" ? "Violations surface in reporting but don't block writes." :
        p.validationMode === "warn" ? "Violations create warning events consumers can filter on." :
        "Any violation causes the entire write to fail."
      } last>
        <Seg options={["log","warn","strict"]} value={p.validationMode} onChange={v => set({ validationMode: v })} />
      </FormRow>
    </StepWrap>
  );
}

// ── Step 4: Governance ────────────────────────────────────────────────────────

function PropGovernance({ p, set }) {
  return (
    <StepWrap eyebrow="STEP 4 · GOVERNANCE" title="PII classification, access, and retention" desc="These settings follow this property across every system that reads it. Retrofitting PII classification is expensive — get it right now.">
      <FormRow label="PII classification" required hint={PII_TIERS.find(t => t.id === p.piiTier)?.desc}>
        <PIISelect value={p.piiTier} onChange={v => set({ piiTier: v })} />
      </FormRow>

      <FormRow label="Masking rule" hint={MASKING_RULES.find(m => m.id === p.maskingRule)?.desc}>
        <CustomSelect value={p.maskingRule} onChange={v => set({ maskingRule: v })}
          options={MASKING_RULES} />
      </FormRow>

      <FormRow label="Retention policy">
        <CustomSelect value={p.retention} onChange={v => set({ retention: v })}
          options={RETENTION_OPTS} />
      </FormRow>

      <FormRow label="Access roles" hint="Who can read this property value.">
        <MultiToken options={ROLES} value={p.accessRoles} onChange={v => set({ accessRoles: v })} placeholder="add roles…" />
      </FormRow>

      <FormRow label="Tags">
        <MultiToken options={GOV_TAGS} value={p.tags} onChange={v => set({ tags: v })} placeholder="add tags…" />
      </FormRow>

      <FormRow label="Change risk" hint={
        p.changeRisk === "LOW" ? "Self-approval. Lands on next deploy." :
        p.changeRisk === "MEDIUM" ? "1 reviewer from owner team required." :
        "2 reviewers (owner + governance) + staging soak ≥ 24 h."
      } last>
        <Seg risk options={[{id:"LOW",label:"LOW"},{id:"MEDIUM",label:"MEDIUM"},{id:"HIGH",label:"HIGH"}]} value={p.changeRisk} onChange={v => set({ changeRisk: v })} />
      </FormRow>
    </StepWrap>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function PropReview({ p, set, node, nameCleaned, onClose }) {
  const piiTier = ({ none:"None", pseudonymous:"Pseudonymous", personal:"Personal", sensitive:"Sensitive", restricted:"Restricted" })[p.piiTier];
  const approvers = p.changeRisk === "HIGH"
    ? [{ who: "morgan.lee", team: "data-platform" }, { who: "ramin.k", team: "governance" }]
    : p.changeRisk === "MEDIUM" ? [{ who: "morgan.lee", team: "data-platform" }] : [];

  const cypher = `ALTER NODE TYPE :${node?.label?.replace(/\s/g,"") || "Node"}
  ADD PROPERTY ${nameCleaned || "new_property"} ${p.type.toUpperCase()}${p.required ? " NOT NULL" : ""}${p.defaultValue ? ` DEFAULT ${p.defaultValue}` : ""};
${p.indexed ? `CREATE INDEX ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned});` : ""}
${p.piiTier !== "none" ? `TAG PROPERTY :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) AS PII TIER ${p.piiTier.toUpperCase()};` : ""}
${p.maskingRule !== "none" ? `SET MASKING ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) = "${p.maskingRule}";` : ""}
GRANT READ ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) TO ROLES (${p.accessRoles.join(", ")});
${p.retention !== "inherit" ? `SET RETENTION ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) = "${p.retention}";` : ""}
${p.backfill ? `BACKFILL :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) FROM SOURCE "${p.sourceSystem}" COLUMN "${p.sourceCol || "?"}";` : ""}`;

  return (
    <StepWrap eyebrow="STEP 5 · REVIEW & PUBLISH" title="Last look before this lands in the schema" desc="Once published the property appears in the next schema version with a full audit trail.">
      <div className="review-col">
        <section className="card">
          <div className="card-head">Summary</div>
          <ul className="rev-list">
            {[
              ["Name",      <code>.{nameCleaned || "?"}</code>],
              ["Type",      p.type],
              ["Flags",     [p.required && "required", p.indexed && "indexed", p.unique && "unique"].filter(Boolean).join(" · ") || "—"],
              ["Source",    p.sourceKind + (p.sourceCol ? " · " + p.sourceCol : "")],
              ["PII tier",  piiTier],
              ["Masking",   MASKING_RULES.find(m => m.id === p.maskingRule)?.label],
              ["Retention", p.retention],
              ["Access",    p.accessRoles.join(", ") || "—"],
              ["Risk",      <span className={"nv-change nv-change-" + p.changeRisk.toLowerCase()}>{p.changeRisk}</span>],
              ["Backfill",  p.backfill ? "on" : "off"],
            ].map(([k, v], i) => <li key={i}><span className="rev-k">{k}</span><span className="rev-v">{v}</span></li>)}
          </ul>
        </section>

        <section className="card">
          <div className="card-head">Approvers</div>
          {approvers.length === 0
            ? <div className="card-body" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Low risk · self-approve.</div>
            : <ul className="approver-list">{approvers.map((a, i) => (
              <li key={i} className="approver-row">
                <span className="appr-avatar">{a.who[0].toUpperCase()}</span>
                <div><div className="appr-who">{a.who}</div><div className="appr-team">{a.team}</div></div>
                <span className="appr-status">awaiting</span>
              </li>
            ))}</ul>
          }
        </section>

        <section className="card">
          <div className="card-head">Target stage</div>
          <div className="card-body" style={{ padding: "14px 18px" }}>
            <Seg options={["draft","staging","live"]} value={p.stage} onChange={v => set({ stage: v })} />
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)", fontFamily: "JetBrains Mono" }}>
              {p.stage === "draft" ? "Working branch — no consumers see it yet." :
               p.stage === "staging" ? "Runs in staging graph — safe for agent test runs." :
               "Production — all consumers gain this property now."}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head card-head-row">
            <div>Migration <span className="card-head-sub">cypher diff</span></div>
            <div className="card-head-actions"><button className="btn-ghost">Copy</button></div>
          </div>
          <pre className="cypher-block">{cypher}</pre>
        </section>
      </div>
    </StepWrap>
  );
}

// ── Prop Preview ──────────────────────────────────────────────────────────────

function PropPreview({ p, node, nameCleaned }) {
  const piiTier = PII_TIERS.find(t => t.id === p.piiTier);
  return (
    <div className="preview-stack">
      <div className="preview-block">
        <div className="preview-head">Property preview</div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <code style={{ fontFamily: "JetBrains Mono", fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>.{nameCleaned || "property_name"}</code>
            <span className="ppc-type">{p.type}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {p.required && <span className="snap-tag">req</span>}
            {p.indexed   && <span className="snap-tag snap-idx">idx</span>}
            {p.unique    && <span className="snap-tag snap-idx">unique</span>}
            {p.piiTier !== "none" && <span className="snap-tag snap-pii">PII · {p.piiTier}</span>}
            {p.sourceKind === "computed" && <span className="snap-tag snap-comp">fx</span>}
            {p.sourceKind === "agent"    && <span className="snap-tag snap-comp">agent</span>}
          </div>
          {p.description && <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>{p.description}</div>}
          {p.exampleValue && <div style={{ marginTop: 6, fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--ink-3)" }}>e.g. <code style={{ background: "var(--chip)", padding: "1px 5px", borderRadius: 3, color: "var(--ink)" }}>{p.exampleValue}</code></div>}
        </div>
      </div>
      <div className="preview-block">
        <div className="preview-head">Validation</div>
        <ul className="preview-checks">
          {[
            [nameCleaned.length >= 2, "Name is valid"],
            [!!p.type, "Type selected"],
            [!!p.piiTier, "PII tier set"],
            [p.accessRoles.length > 0, "Access roles assigned"],
          ].map(([ok, label], i) => (
            <li key={i} className={"check " + (ok ? "check-ok" : "check-pend")}><span className="check-dot" /> {label}</li>
          ))}
          {p.piiTier !== "none" && <li className="check check-info"><span className="check-dot" /> PII — change risk auto-elevated</li>}
        </ul>
      </div>
      <div className="preview-block">
        <div className="preview-head">Schema snippet</div>
        <pre className="preview-code">{`(:${node?.label?.replace(/\s/g,"") || "Node"} {
  ${nameCleaned || "property_name"}: ${p.type}${p.required ? " // required" : ""}${p.piiTier !== "none" ? "\n  // PII: " + p.piiTier : ""}
})`}</pre>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  LINK SOURCE WIZARD
// ════════════════════════════════════════════════════════════════════════════

const SRC_STEPS = [
  { label: "Source system", hint: "Pick connector from catalog" },
  { label: "Connection",    hint: "Pick or add a connection"   },
  { label: "Object",        hint: "Choose what to read"        },
  { label: "Column mapping",hint: "Map source → node props"    },
  { label: "Settings",      hint: "Pipeline, ingestion, tier"  },
  { label: "Review",        hint: "Config & publish"          },
];

const LOAD_STRATEGIES = [
  { id: "incremental", label: "Incremental", tag: "INCR",     desc: "Read rows where updated_at > last watermark. Fast; requires a reliable timestamp." },
  { id: "cdc",         label: "CDC",          tag: "CDC",      desc: "Capture database change events. Near-zero lag; requires Debezium/connector support." },
  { id: "full",        label: "Full load",    tag: "FULL",     desc: "Replace the entire object on every run. Safe but expensive; for small reference tables." },
];

const ERROR_POLICIES = [
  { id: "alert",       label: "Alert + continue",   desc: "Notify and continue processing remaining rows." },
  { id: "quarantine",  label: "Quarantine row",     desc: "Move failing rows to quarantine table for manual review." },
  { id: "rollback",    label: "Rollback batch",     desc: "Roll back entire batch on any error. Safest, slowest." },
  { id: "dead_letter", label: "Dead-letter queue",  desc: "Route errors to DLQ; on-call paged after threshold." },
];

// ── Unstructured "what to read" config ────────────────────────────────────────
// Container/item nouns + the source-provided metadata filters + example document
// sets, tuned per connector. Everything falls back to a sensible file/folder model.
const READ_CONFIGS = {
  _default: {
    container: "folders", item: "files",
    linkPh: "Paste a link or path…",
    filters: [
      { key: "fileTypes",     label: "File types",     type: "chips", options: ["PDF", "DOCX", "DOC", "TXT", "RTF", "PPTX", "XLSX", "CSV", "MD", "HTML"] },
      { key: "owner",         label: "Owner / author", type: "text",  ph: "name or email" },
      { key: "modifiedAfter", label: "Modified after", type: "date" },
      { key: "addedAfter",    label: "Added after",    type: "date" },
      { key: "nameContains",  label: "Name contains",  type: "text",  ph: "e.g. MSA, contract" },
    ],
    starts: ["Contracts", "MSAs", "NDAs", "SOWs", "Invoices", "Policies", "Reports"],
  },
  googledrive: { linkPh: "https://drive.google.com/drive/folders/…" },
  sharepoint:  { container: "libraries", linkPh: "https://acme.sharepoint.com/sites/Legal/…" },
  onedrive:    { linkPh: "https://acme-my.sharepoint.com/personal/…" },
  dropbox:     { linkPh: "https://www.dropbox.com/home/…" },
  box:         { linkPh: "https://app.box.com/folder/…" },
  s3: {
    container: "buckets / prefixes", item: "objects", linkPh: "s3://acme-legal/contracts/",
    filters: [
      { key: "fileTypes",     label: "File types",     type: "chips", options: ["PDF", "DOCX", "TXT", "CSV", "JSON", "PARQUET", "HTML", "EML"] },
      { key: "prefix",        label: "Key prefix",     type: "text",  ph: "contracts/2024/" },
      { key: "modifiedAfter", label: "Modified after", type: "date" },
      { key: "minSize",       label: "Min object size", type: "select", options: ["Any", "> 10 KB", "> 100 KB", "> 1 MB"] },
    ],
    starts: ["Contracts", "Invoices", "Statements", "Reports", "Logs"],
  },
  gcs: {
    container: "buckets / prefixes", item: "objects", linkPh: "gs://acme-legal/contracts/",
    filters: [
      { key: "fileTypes",     label: "File types",     type: "chips", options: ["PDF", "DOCX", "TXT", "CSV", "JSON", "PARQUET", "HTML"] },
      { key: "prefix",        label: "Key prefix",     type: "text",  ph: "contracts/2024/" },
      { key: "modifiedAfter", label: "Modified after", type: "date" },
    ],
    starts: ["Contracts", "Invoices", "Statements", "Reports"],
  },
  slack: {
    container: "channels", item: "messages", linkPh: "#channel-name or channel link",
    filters: [
      { key: "fromUser", label: "From user",     type: "text",  ph: "@user" },
      { key: "after",    label: "After",         type: "date" },
      { key: "kind",     label: "Message kind",  type: "chips", options: ["Any", "With files", "Threads only", "Pinned"] },
      { key: "contains", label: "Text contains", type: "text" },
    ],
    starts: ["Incidents", "Decisions", "Announcements", "Support threads"],
  },
  gmail: {
    container: "labels", item: "emails", linkPh: "Label name…",
    filters: [
      { key: "from",      label: "From",             type: "text",  ph: "sender@…" },
      { key: "subject",   label: "Subject contains", type: "text" },
      { key: "after",     label: "After",            type: "date" },
      { key: "hasAttach", label: "Has attachment",   type: "chips", options: ["Any", "With attachments"] },
      { key: "fileTypes", label: "Attachment types", type: "chips", options: ["PDF", "DOCX", "XLSX", "CSV"] },
    ],
    starts: ["Invoices", "Contracts", "Receipts", "Statements"],
  },
  outlook: {
    container: "folders", item: "emails", linkPh: "Folder name…",
    filters: [
      { key: "from",      label: "From",             type: "text",  ph: "sender@…" },
      { key: "subject",   label: "Subject contains", type: "text" },
      { key: "after",     label: "After",            type: "date" },
      { key: "hasAttach", label: "Has attachment",   type: "chips", options: ["Any", "With attachments"] },
    ],
    starts: ["Invoices", "Contracts", "Receipts", "Statements"],
  },
  confluence: {
    container: "spaces", item: "pages", linkPh: "Space key or page link",
    filters: [
      { key: "space",        label: "Space",         type: "text" },
      { key: "labelTag",     label: "Label",         type: "text" },
      { key: "author",       label: "Author",        type: "text" },
      { key: "updatedAfter", label: "Updated after", type: "date" },
    ],
    starts: ["Runbooks", "Policies", "Design docs", "Specs"],
  },
  notion: {
    container: "databases", item: "pages", linkPh: "Notion page or database link",
    filters: [
      { key: "author",       label: "Created by",    type: "text" },
      { key: "updatedAfter", label: "Updated after", type: "date" },
      { key: "nameContains", label: "Title contains", type: "text" },
    ],
    starts: ["Wikis", "Specs", "Notes", "Trackers"],
  },
  github: {
    container: "repositories", item: "files", linkPh: "org/repo or repo URL",
    filters: [
      { key: "branch",       label: "Branch",        type: "text",  ph: "main" },
      { key: "pathGlob",     label: "Path glob",     type: "text",  ph: "docs/**/*.md" },
      { key: "fileTypes",    label: "File types",    type: "chips", options: ["MD", "TXT", "PY", "TS", "JSON", "YAML"] },
      { key: "updatedAfter", label: "Updated after", type: "date" },
    ],
    starts: ["READMEs", "Docs", "ADRs", "Changelogs"],
  },
  gitlab: {
    container: "repositories", item: "files", linkPh: "group/project or repo URL",
    filters: [
      { key: "branch",    label: "Branch",     type: "text",  ph: "main" },
      { key: "pathGlob",  label: "Path glob",  type: "text",  ph: "docs/**/*.md" },
      { key: "fileTypes", label: "File types", type: "chips", options: ["MD", "TXT", "PY", "TS", "JSON", "YAML"] },
    ],
    starts: ["READMEs", "Docs", "ADRs"],
  },
  intercom: { container: "inboxes", item: "conversations", linkPh: "Inbox name…", starts: ["Resolved", "Escalations", "Billing", "Onboarding"] },
  zoom:     { container: "folders", item: "recordings",    linkPh: "Recording folder…", starts: ["All-hands", "Customer calls", "Interviews"] },
  figma:    { container: "projects", item: "files",        linkPh: "Project or file link", starts: ["Specs", "Flows", "Components"] },
};
function getReadConfig(sel) {
  return Object.assign({}, READ_CONFIGS._default, (sel && READ_CONFIGS[sel.id]) || {});
}
const EXTRACT_AGENTS = ["Contract Analyst", "Document Extractor", "Risk Reviewer", "Invoice Parser", "Resume Screener"];
const EXTRACT_AUTOMATIONS = ["PDF Form Parser", "Regex Extractor", "Apache Tika Pipeline", "AWS Textract Pipeline", "Layout Parser"];
const EXTRACT_TYPES = ["string", "date", "number", "boolean", "enum", "list", "json"];
// Auto-captured file/object metadata available to map for any unstructured source.
const UNSTRUCTURED_META_COLS = [
  { col: "file_id",     type: "uuid",      sample: "1aF3kq…",          meta: true },
  { col: "file_name",   type: "string",    sample: "MSA_Acme.pdf",     meta: true },
  { col: "file_type",   type: "string",    sample: "pdf",              meta: true },
  { col: "source_url",  type: "string",    sample: "drive://…/MSA…",   meta: true },
  { col: "owner",       type: "string",    sample: "legal@acme.com",   meta: true },
  { col: "created_at",  type: "timestamp", sample: "2024-01-12",       meta: true },
  { col: "modified_at", type: "timestamp", sample: "2024-06-01",       meta: true },
  { col: "size_bytes",  type: "int",       sample: "284913",           meta: true },
];

function LinkSourceFlow({ node, existingSources, onClose }) {
  const [step, setStep] = useState(0);
  const [mapOpenCol, setMapOpenCol] = useState("");
  const [mapActiveObj, setMapActiveObj] = useState("");
  const [s, setS] = useState({
    system: "", customName: "", connection: "", newConnName: "", newConnHost: "", newConnAuth: "OAuth2",
    table: "", tables: [], query: "", inputMode: "table",
    pkCol: "", joinCol: "", incrementalCol: "updated_at",
    loadStrategy: "incremental", mapping: {}, transforms: {}, recordFilters: {}, transformedFields: {}, unmappedPolicy: "ignore",
    cadence: "5min", freshnessSLO: "30m", batchWindow: "15m",
    retryCount: 3, retryDelay: "5m", onError: "alert",
    alertChannel: "#schema-alerts", owner: "data-platform",
    stage: "staging", backfill: true, backfillWindow: "30d", tags: [],
    // Unstructured-source flow state
    readScope: "", readLocations: [], readFilters: {}, readStarts: [],
    extractMethod: "", extractAgent: "", extractAutomation: "", extractFields: [],
  });

  const set = patch => setS(v => ({ ...v, ...patch }));
  const sel = SOURCE_SYSTEMS.find(x => x.id === s.system);
  const srcCols = s.system ? getSourceCols(s.system) : [];
  const rawNodeProps = node ? (stubGenerateProps ? stubGenerateProps(node) : (STUB_PROPS_BY_NODE?.[node.id] || [])) : [];
  const nodeProps = rawNodeProps.map(p => ({ id: p.name, label: p.name, type: p.type }));
  const unstructured = !!(sel && sel.kind === "unstructured");
  const readCfg = getReadConfig(sel);
  const readLocs = s.readLocations || [];
  const extractFields = s.extractFields || [];
  // For unstructured Map: the source "columns" are the auto-captured file metadata
  // plus the user-defined extracted fields. These get mapped to node properties.
  const unstructuredCols = unstructured ? UNSTRUCTURED_META_COLS.concat(
    extractFields.filter(f => f.name).map(f => ({ col: f.name, type: f.type || "string", sample: f.description || "extracted", extracted: true }))
  ) : [];
  // Mapping groups — one per selected object (structured) or a single captured-fields
  // group (unstructured). Each group's columns are mapped independently; mapping keys
  // are namespaced as "<object>::<col>" so identically-named columns don't collide.
  const allObjects = sel && !unstructured ? getSourceObjects(sel.id, sel) : [];
  const selectedTables = s.tables || [];
  const mapGroups = unstructured
    ? [{ name: (node && node.label) || "Document", type: "Extracted fields", rows: "", cols: unstructuredCols }]
    : selectedTables.map(nm => { const o = allObjects.find(x => x.name === nm) || { name: nm }; return { name: nm, type: o.type, rows: o.rows, cols: getObjectCols(o) }; });
  const mapKeys = mapGroups.reduce((acc, g) => acc.concat(g.cols.map(c => g.name + "::" + c.col)), []);
  const mappedCount = mapKeys.filter(k => (s.mapping || {})[k]).length;
  const totalMapCols = mapKeys.length;
  // Active object for the per-object mapping sub-navigation.
  const activeMapObj = (mapActiveObj && mapGroups.some(g => g.name === mapActiveObj)) ? mapActiveObj : (mapGroups[0] ? mapGroups[0].name : "");
  const mapSubItems = mapGroups.length > 1 ? mapGroups.map(g => {
    const gm = g.cols.filter(c => (s.mapping || {})[g.name + "::" + c.col]).length;
    return { id: g.name, label: g.name, mapped: gm, total: g.cols.length, type: g.type, done: gm > 0 };
  }) : null;
  const settingsHint = (s.pipelineType === "scheduled" ? "Scheduled" : "Real Time") + " · " + (s.resourceTier || "Small");
  const canNext = step === 0 ? !!s.system
    : step === 1 ? !!s.connection
    : step === 2 ? (unstructured ? (s.readScope === "all" || ((s.readScope === "folders" || s.readScope === "files") && readLocs.length > 0)) : (selectedTables.length > 0 || !!s.query))
    : true;

  // Sidebar hints reflect the live selections, not static copy.
  const conns = sel ? getConnections(sel.id, sel) : [];
  const connLabel = s.connection === "__new__" ? "New connection" : (conns.find(c => c.id === s.connection)?.name || "Pick or add a connection");
  const readHint = !s.readScope
    ? "Choose what to read"
    : s.readScope === "all"
    ? "All " + readCfg.item
    : readLocs.length ? readLocs.length + " " + (readLocs.length === 1 ? readCfg.container.replace(/s$/, "") : readCfg.container)
    : "Pick " + readCfg.container;
  const extractHint = extractFields.length ? extractFields.length + " field" + (extractFields.length === 1 ? "" : "s") : "Optional";
  const mapHint = mappedCount ? `${mappedCount} mapped` : "Map fields → node props";
  const objectHint = selectedTables.length ? selectedTables.length + " object" + (selectedTables.length === 1 ? "" : "s") : (s.query ? "Custom SQL" : "Choose what to read");
  const objAgents = s.objectAgents || {};
  const agentsAssigned = selectedTables.filter(t => objAgents[t]).length;
  const agentsHint = agentsAssigned ? agentsAssigned + " of " + selectedTables.length + " assigned" : "Optional";
  const colMapHint = totalMapCols ? `${mappedCount}/${totalMapCols} fields mapped` : "Map source → node props";
  const srcSteps = unstructured ? [
    { label: "Source system", hint: sel ? sel.name : "Pick connector from catalog" },
    { label: "Connection",    hint: connLabel },
    { label: "Scope",         hint: readHint },
    { label: "Extract",       hint: extractHint },
    { label: "Map",           hint: mapHint },
    { label: "Settings",      hint: settingsHint },
  ] : [
    { label: "Source system",  hint: sel ? sel.name : "Pick connector from catalog" },
    { label: "Connection",     hint: connLabel },
    { label: "Objects",        hint: objectHint },
    { label: "Column mapping", hint: colMapHint, subItems: mapSubItems, activeSub: activeMapObj, onSub: setMapActiveObj },
    { label: "Settings", hint: settingsHint },
  ];

  const titleFrom = sel ? (
    <span className="flow-title-from">
      <span className="csel-sys-icon" style={{ background: sel.color + "1a", color: sel.color, borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{sel.icon}</span>
      {sel.name}
    </span>
  ) : <span className="flow-title-empty">choose source</span>;

  const titleTo = (
    <span className="flow-title-to">
      {node && StubListGlyph && <StubListGlyph node={node} size={18} />}
      {node?.label}
    </span>
  );

  return (
    <WizardShell
      plainTitle="Add Data Sources" fullScreen
      stage={s.stage} hideStage hideKeymap hideFootHelp
      steps={srcSteps} step={step} setStep={setStep}
      canNext={canNext}
      onNext={() => setStep(x => x + 1)}
      onPublish={onClose}
      onClose={onClose}
      rightPane={null}
      overlay={mapOpenCol ? (function(){
        const ix = mapOpenCol.indexOf("::");
        const objName = ix >= 0 ? mapOpenCol.slice(0, ix) : "";
        const colName = ix >= 0 ? mapOpenCol.slice(ix + 2) : mapOpenCol;
        // "+ Transformed field" opens the same drawer in new-field mode.
        if (colName === "__newtf__") {
          const grp = mapGroups.find(g => g.name === objName);
          return <SrcTransformDrawer newField cols={grp ? grp.cols : []} objName={objName} sel={sel}
            onSave={tf => { const cur = s.transformedFields || {}; const arr = (cur[objName] || []).concat([Object.assign({ id: "tf-" + Date.now() }, tf)]); set({ transformedFields: Object.assign({}, cur, (function(){ var o = {}; o[objName] = arr; return o; })()) }); setMapOpenCol(""); }}
            onClose={() => setMapOpenCol("")} />;
        }
        let colType = "string";
        for (let gi = 0; gi < mapGroups.length; gi++) { const c = mapGroups[gi].cols.find(x => x.col === colName); if (c) { colType = c.type; break; } }
        return <SrcTransformDrawer col={colName} type={colType} sel={sel} list={(s.transforms || {})[mapOpenCol] || []} onChange={arr => set({ transforms: Object.assign({}, s.transforms, (function(){ var o = {}; o[mapOpenCol] = arr; return o; })()) })} onClose={() => setMapOpenCol("")} />;
      })() : null}
    >
      {step === 0 && <SrcSystem s={s} set={set} />}
      {step === 1 && <SrcConnection s={s} set={set} sel={sel} />}
      {unstructured ? (
        <>
          {step === 2 && <SrcRead s={s} set={set} sel={sel} />}
          {step === 3 && <SrcExtract s={s} set={set} node={node} />}
          {step === 4 && <SrcMapping s={s} set={set} groups={mapGroups} nodeProps={nodeProps} node={node} sel={sel} openCol={mapOpenCol} setOpenCol={setMapOpenCol} singleGroup
            title={`Map ${sel ? sel.name : "source"} fields to ${node?.label || "the node"}`} />}
          {step === 5 && <SrcSchedule s={s} set={set} srcCols={srcCols} />}
        </>
      ) : (
        <>
          {step === 2 && <SrcObject s={s} set={set} sel={sel} />}
          {step === 3 && <SrcMapping s={s} set={set} groups={mapGroups} activeObj={activeMapObj} nodeProps={nodeProps} node={node} sel={sel} openCol={mapOpenCol} setOpenCol={setMapOpenCol} />}
          {step === 4 && <SrcSchedule s={s} set={set} srcCols={srcCols} />}
        </>
      )}
    </WizardShell>
  );
}

// ── Src Step 1: System ────────────────────────────────────────────────────────

// Logo with a graceful fallback chain: Simple Icons brand mark → the brand's
// favicon (covers logos removed from Simple Icons, e.g. Salesforce, Slack,
// Microsoft & AWS products) → a coloured text glyph.
function SrcConnectorLogo({ c, size }) {
  size = size || 22;
  const box = size + 12;
  const simple = c.slug ? "https://cdn.simpleicons.org/" + c.slug + "/" + c.color.replace("#", "") : "";
  const favicon = c.domain ? "https://www.google.com/s2/favicons?sz=64&domain=" + c.domain : "";
  const [src, setSrc] = useState(simple || favicon);
  const [failed, setFailed] = useState(!simple && !favicon);
  const onErr = () => {
    if (src === simple && favicon) setSrc(favicon);
    else setFailed(true);
  };
  return (
    <span style={{ width: box, height: box, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#fff", border: "1px solid var(--line)", overflow: "hidden" }}>
      {!failed && src
        ? <img src={src} width={size} height={size} alt="" style={{ display: "block", objectFit: "contain" }} onError={onErr} />
        : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: c.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: size > 20 ? 12 : 10 }}>{c.icon}</span>}
    </span>
  );
}

// Sticky bar pinned to the top of a long list so the current selection stays visible.
// A quiet selected-state chip that lives inline within the sticky list meta row —
// integrated rather than a forced bordered banner on top of the list.
function SrcSelectedChip({ c, name, sub }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "60%" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-4)", flexShrink: 0 }}>Selected</span>
      {c ? <SrcConnectorLogo c={c} size={15} /> : null}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      {sub ? <span style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1 }}>{"· " + sub}</span> : null}
      <span style={{ flexShrink: 0, color: "var(--green)", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>
    </span>
  );
}

// Sticky meta row: list count on the left, the (optional) quiet selected chip on the right.
function SrcListMeta({ count, noun, chip }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 6, background: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 2px", marginBottom: 4, borderBottom: chip ? "1px solid var(--line-2)" : "none" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.5px", color: "var(--ink-3)", textTransform: "uppercase", flexShrink: 0 }}>{count} {noun}</span>
      {chip}
    </div>
  );
}

function SrcSystem({ s, set }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const sel = SOURCE_SYSTEMS.find(x => x.id === s.system);
  const catOptions = [{ id: "all", label: "All categories" }].concat(SRC_CATEGORIES.map(c => ({ id: c, label: c })));
  const list = SOURCE_SYSTEMS.filter(c => c.id !== "custom").filter(c => {
    if (cat !== "all" && c.cat !== cat) return false;
    if (q && (c.name + " " + (c.desc || "")).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    return true;
  });
  return (
    <StepWrap wide title="Pick a source connector">
      {/* search + category dropdown */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          </span>
          <input className="winput" style={{ paddingLeft: 36 }} placeholder="Search connectors…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
        <div style={{ width: 230, flexShrink: 0 }}>
          <CustomSelect value={cat} onChange={setCat} options={catOptions} />
        </div>
      </div>

      <SrcListMeta count={list.length} noun="connectors" chip={sel ? <SrcSelectedChip c={sel} name={sel.name} sub={sel.tag} /> : null} />

      <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
        {list.map((c, i) => {
          const on = s.system === c.id;
          return (
            <button key={c.id} onClick={() => set({ system: c.id })}
              style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", padding: "12px 14px", border: "none", borderTop: i ? "1px solid var(--line-2)" : "none", background: on ? "var(--bg-canvas)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel-2)"; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <SrcConnectorLogo c={c} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c.name}</span>
                  {c.status === "degraded" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--gold)" }}>● degraded</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</div>
              </div>
              {on
                ? <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</span>
                : <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: "5px 12px", borderRadius: 7, border: "1px solid var(--line)" }}>Select</span>}
            </button>
          );
        })}
        {list.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No connectors match “{q}”.</div>}
      </div>
    </StepWrap>
  );
}

// ── Src Step 2: Connection ────────────────────────────────────────────────────

function SrcConnStatusDot({ status }) {
  const col = status === "healthy" ? "var(--green)" : status === "degraded" ? "var(--gold)" : "var(--ink-3)";
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />;
}

function SrcConnection({ s, set, sel }) {
  const conns = sel ? getConnections(sel.id, sel) : [];
  const addingNew = s.connection === "__new__";
  const hostLabel = sel?.id === "salesforce" ? "Instance URL"
    : sel?.cat === "Data Warehouse" || sel?.cat === "Databases" ? "Host / account"
    : sel?.cat === "Files & Storage" ? "Bucket / site"
    : "Endpoint";
  return (
    <StepWrap wide title={sel ? `Connect to ${sel.name}` : "Pick a connection"}>
      {conns.length > 0 && (
        <>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.5px", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8 }}>Your connections</div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
            {conns.map((cn, i) => {
              const on = s.connection === cn.id;
              return (
                <button key={cn.id} onClick={() => set({ connection: cn.id })}
                  style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", padding: "13px 14px", border: "none", borderTop: i ? "1px solid var(--line-2)" : "none", background: on ? "var(--panel)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel-2)"; }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                  {sel && <SrcConnectorLogo c={sel} size={20} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <SrcConnStatusDot status={cn.status} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{cn.name}</span>
                      {cn.status === "degraded" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--gold)" }}>degraded</span>}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cn.detail}</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0, textAlign: "right" }}>{cn.auth}<br />used {cn.lastUsed}</span>
                  {on
                    ? <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</span>
                    : <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: "5px 12px", borderRadius: 7, border: "1px solid var(--line)" }}>Use</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button onClick={() => set({ connection: "__new__" })}
        style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 14px", borderRadius: 10, borderWidth: 1, borderStyle: addingNew ? "solid" : "dashed", borderColor: addingNew ? "var(--ink)" : "var(--line)", background: addingNew ? "var(--bg-canvas)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", boxShadow: addingNew ? "0 0 0 2px color-mix(in oklab, var(--ink) 12%, transparent)" : "none" }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--chip)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-2)", flexShrink: 0 }}>+</span>
        <span style={{ fontWeight: 600 }}>Add a new connection</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>{sel ? "to " + sel.name : ""}</span>
      </button>

      {addingNew && (
        <div style={{ marginTop: 14, padding: "16px", border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", display: "grid", gap: 12 }}>
          <FormRow label="Connection name" required>
            <input className="winput" placeholder={sel ? sel.name + " — production" : "My connection"} value={s.newConnName} onChange={e => set({ newConnName: e.target.value })} autoFocus />
          </FormRow>
          <FormRow label={hostLabel} required>
            <input className="winput winput-mono" placeholder={sel?.id === "salesforce" ? "acme.my.salesforce.com" : sel?.cat === "Files & Storage" ? "s3://acme-bucket" : "host.acme.internal"} value={s.newConnHost} onChange={e => set({ newConnHost: e.target.value })} />
          </FormRow>
          <FormRow label="Authentication" last>
            <CustomSelect value={s.newConnAuth} onChange={v => set({ newConnAuth: v })} options={["OAuth2", "API key", "Key-pair", "Username / password", "Service account"].map(t => ({ id: t, label: t }))} />
          </FormRow>
          <div style={{ fontSize: 11.5, color: "var(--ink-4)", lineHeight: 1.5 }}>You'll be redirected to authorize. Credentials are stored encrypted and reused across pipelines.</div>
        </div>
      )}
    </StepWrap>
  );
}

// ── Src Step 3: Object ────────────────────────────────────────────────────────

function SrcObject({ s, set, sel }) {
  const [q, setQ] = useState("");
  const objects = sel ? getSourceObjects(sel.id, sel) : [];
  const list = objects.filter(o => !q || o.name.toLowerCase().indexOf(q.toLowerCase()) >= 0);
  const selected = s.tables || [];
  const toggle = name => set({ tables: selected.indexOf(name) >= 0 ? selected.filter(x => x !== name) : selected.concat([name]), query: "" });
  const allListed = list.length > 0 && list.every(o => selected.indexOf(o.name) >= 0);
  const toggleAll = () => set({ tables: allListed ? selected.filter(n => list.every(o => o.name !== n)) : Array.from(new Set(selected.concat(list.map(o => o.name)))), query: "" });
  return (
    <StepWrap wide title="Select the objects to read">
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        </span>
        <input className="winput" style={{ paddingLeft: 40, height: 44 }} placeholder="Search objects…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
      </div>
      <SrcListMeta count={list.length} noun="objects" chip={
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {selected.length > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-2)", fontWeight: 600 }}>{selected.length} selected</span>}
          <button onClick={toggleAll} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>{allListed ? "Clear all" : "Select all"}</button>
        </span>
      } />
      <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
        {list.map((o, i) => {
          const on = selected.indexOf(o.name) >= 0;
          return (
            <button key={o.name} onClick={() => toggle(o.name)}
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", border: "none", borderTop: i ? "1px solid var(--line-2)" : "none", background: on ? "var(--bg-canvas)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel-2)"; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: "solid", borderColor: on ? "var(--ink)" : "var(--line)", background: on ? "var(--ink)" : "transparent", color: "var(--bg-canvas)" }}>
                {on && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg>}
              </span>
              {sel ? <SrcConnectorLogo c={sel} size={20} /> : <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--chip)", border: "1px solid var(--line)", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{o.name}</code>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>{o.type} · {o.cols} columns</div>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "var(--ink-3)", flexShrink: 0 }}>{o.rows} rows</span>
            </button>
          );
        })}
        {list.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No objects match “{q}”.</div>}
      </div>
    </StepWrap>
  );
}

// ── Shared bits for the unstructured Read / Extract steps ─────────────────────
const SRC_SUBLBL = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 7 };
const SRC_REMOVE_BTN = { width: 26, height: 26, flexShrink: 0, borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: "var(--line)", background: "var(--panel-2)", color: "var(--ink-3)", cursor: "pointer", fontSize: 14, lineHeight: 1, justifySelf: "center" };
function SrcChipRow({ options, selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map(opt => {
        const on = selected.indexOf(opt) >= 0;
        return (
          <button key={opt} onClick={() => onToggle(opt)}
            style={{ padding: "6px 12px", borderRadius: 20, borderWidth: 1, borderStyle: "solid", borderColor: on ? "var(--ink)" : "var(--line)", background: on ? "var(--ink)" : "var(--panel)", color: on ? "var(--bg-canvas)" : "var(--ink-2)", fontSize: 12.5, fontWeight: on ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
function srcToggle(arr, val) { return arr.indexOf(val) >= 0 ? arr.filter(x => x !== val) : arr.concat([val]); }
function srcCap(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; }

// Rich single-select that mirrors the "Pick a type" control: icon box + title +
// sub line + chevron. options = [{ id, title, desc, icon }]. Empty shows a dashed +.
function SrcRichSelect({ value, onChange, options, emptyLabel }) {
  const iconBox = (content, dashed) => (
    <span style={{ width: 34, height: 34, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chip)", borderWidth: 1, borderStyle: dashed ? "dashed" : "solid", borderColor: "var(--line)", color: "var(--ink-3)" }}>{content}</span>
  );
  const body = (icon, title, sub, ghost) => (
    <span style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", minWidth: 0 }}>
      {icon}
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 1 }}>
        <span style={{ fontSize: 14, fontWeight: ghost ? 400 : 600, color: ghost ? "var(--ink-3)" : "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
      </span>
    </span>
  );
  return (
    <CustomSelect
      value={value} onChange={onChange} options={options}
      placeholder={body(iconBox("+", true), emptyLabel || "Choose…", "Click to choose", true)}
      renderTrigger={o => body(iconBox(o.icon), o.title, o.desc)}
      renderOption={o => body(iconBox(o.icon), o.title, o.desc)}
    />
  );
}
const SRC_SCOPE_ICONS = {
  all: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 12 15 2 8.5 12 2" /><polyline points="2 15.5 12 22 22 15.5" /></svg>,
  folders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  files: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></svg>,
};
const SRC_METHOD_ICONS = {
  agent: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><circle cx="18" cy="17" r="1.4" /><circle cx="6" cy="16" r="1.1" /></svg>,
  automation: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

// ── Src Step 3 (unstructured): Read ───────────────────────────────────────────
function SrcRead({ s, set, sel }) {
  const cfg = getReadConfig(sel);
  const scope = s.readScope || "";
  const locs = s.readLocations || [];
  const filters = s.readFilters || {};
  const [link, setLink] = useState("");
  const specific = scope === "folders" || scope === "files";
  const setFilter = (k, val) => set({ readFilters: Object.assign({}, filters, (function () { const o = {}; o[k] = val; return o; })()) });
  const addLink = () => { const t = link.trim(); if (!t) return; set({ readLocations: locs.concat([{ id: "loc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), label: t }]) }); setLink(""); };
  const removeLoc = id => set({ readLocations: locs.filter(x => x.id !== id) });
  const folderIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
  const fileIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></svg>;

  return (
    <StepWrap wide title={`What to read from ${sel.name}`}>
      <FormRow label="Scope" hint="How much of the connection should we index?" last={!scope}>
        <SrcRichSelect value={scope} onChange={v => set({ readScope: v })} emptyLabel="Pick a scope"
          options={[
            { id: "all", title: "All " + cfg.item, desc: "Index every " + cfg.item.replace(/s$/, "") + " reachable from this connection.", icon: SRC_SCOPE_ICONS.all },
            { id: "folders", title: "Specific " + cfg.container, desc: "Pick " + cfg.container + "; everything inside is indexed and kept in sync.", icon: SRC_SCOPE_ICONS.folders },
            { id: "files", title: "Specific " + cfg.item, desc: "Pick individual " + cfg.item + " to index.", icon: SRC_SCOPE_ICONS.files },
          ]} />
      </FormRow>

      {specific && (
        <FormRow label={(scope === "folders" ? srcCap(cfg.container) : srcCap(cfg.item)) + " to index"} required hint={locs.length ? locs.length + " added" : "Paste a link or path, then press Add (or Enter)."}>
          {locs.length > 0 && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "var(--panel)" }}>
              {locs.map((l, i) => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: i ? "1px solid var(--line-2)" : "none" }}>
                  <span style={{ flexShrink: 0, color: "var(--ink-3)", display: "flex" }}>{scope === "folders" ? folderIcon : fileIcon}</span>
                  <code style={{ flex: 1, minWidth: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</code>
                  <button onClick={() => removeLoc(l.id)} style={SRC_REMOVE_BTN}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input className="winput winput-mono" style={{ flex: 1 }} placeholder={cfg.linkPh} value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} />
            <button onClick={addLink} style={{ flexShrink: 0, padding: "0 18px", borderRadius: 9, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--bg-canvas)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-4)" }}>Or <button style={{ background: "none", border: "none", padding: 0, color: "var(--ink-2)", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5 }}>browse {sel.name}</button> to pick visually.</div>
        </FormRow>
      )}

      {scope && (
        <FormRow label="Filters" optional hint={"Only index " + cfg.item + " matching the " + sel.name + " metadata below. Leave blank to include everything."} last>
          <div style={{ display: "grid", gap: 14 }}>
            {cfg.filters.map(f => (
              <div key={f.key}>
                <div style={SRC_SUBLBL}>{f.label}</div>
                {f.key === "fileTypes" ? <CustomSelect value={filters[f.key] || "all"} onChange={v => setFilter(f.key, v)} options={[{ id: "all", label: "All file types" }].concat(f.options.map(x => ({ id: x, label: x })))} />
                  : f.type === "chips" ? <SrcChipRow options={f.options} selected={filters[f.key] || []} onToggle={opt => setFilter(f.key, srcToggle(filters[f.key] || [], opt))} />
                    : f.type === "select" ? <CustomSelect value={filters[f.key] || f.options[0]} onChange={v => setFilter(f.key, v)} options={f.options.map(x => ({ id: x, label: x }))} />
                      : f.type === "date" ? <input className="winput" type="date" value={filters[f.key] || ""} onChange={e => setFilter(f.key, e.target.value)} />
                        : <input className="winput" placeholder={f.ph || ""} value={filters[f.key] || ""} onChange={e => setFilter(f.key, e.target.value)} />}
              </div>
            ))}
          </div>
        </FormRow>
      )}
    </StepWrap>
  );
}

// ── Src Step 4 (unstructured): Extract ────────────────────────────────────────
function SrcExtract({ s, set, node }) {
  const method = s.extractMethod || "";
  const fields = s.extractFields || [];
  const updateField = (id, k, val) => set({ extractFields: fields.map(f => f.id === id ? Object.assign({}, f, (function () { const o = {}; o[k] = val; return o; })()) : f) });
  const removeField = id => set({ extractFields: fields.filter(f => f.id !== id) });
  const addField = () => set({ extractFields: fields.concat([{ id: "f-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), name: "", type: "string", description: "" }]) });
  const GRID = "minmax(150px,1fr) 116px minmax(200px,1.7fr) 30px";
  return (
    <StepWrap wide title="Extract fields from file contents">
      <FormRow label="Extraction method" hint="How values are read from inside each document." last>
        <SrcRichSelect value={method} onChange={v => set({ extractMethod: v })} emptyLabel="Pick a method"
          options={[
            { id: "agent", title: "Agent", desc: "An LLM agent reads each document and extracts the schema below.", icon: SRC_METHOD_ICONS.agent },
            { id: "automation", title: "Automation", desc: "A deterministic automation / parser extracts the schema below.", icon: SRC_METHOD_ICONS.automation },
          ]} />
        {method && (
          <div style={{ marginTop: 12 }}>
            <div style={SRC_SUBLBL}>{method === "agent" ? "Agent" : "Automation"}</div>
            {method === "agent"
              ? <CustomSelect value={s.extractAgent} placeholder="Select an agent…" onChange={v => set({ extractAgent: v })} options={EXTRACT_AGENTS.map(x => ({ id: x, label: x }))} />
              : <CustomSelect value={s.extractAutomation} placeholder="Select an automation…" onChange={v => set({ extractAutomation: v })} options={EXTRACT_AUTOMATIONS.map(x => ({ id: x, label: x }))} />}
          </div>
        )}
      </FormRow>

      {/* Output schema — hidden for now per request (kept for reference)
      {method && (
      <FormRow label="Output schema" optional hint="The fields to extract from each document. The name + description tell the agent what to pull." last>
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
          <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, padding: "9px 14px", background: "var(--panel-2)", borderBottom: "1px solid var(--line-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", color: "var(--ink-3)", textTransform: "uppercase" }}>
            <span>Field name</span><span>Type</span><span>Description</span><span />
          </div>
          {fields.map((f, i) => (
            <div key={f.id} style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, padding: "9px 14px", borderTop: i ? "1px solid var(--line-2)" : "none", alignItems: "center" }}>
              <input className="winput winput-mono" style={{ padding: "7px 9px", fontSize: 12 }} placeholder="contract_start_date" value={f.name} onChange={e => updateField(f.id, "name", e.target.value)} />
              <CustomSelect value={f.type || "string"} onChange={v => updateField(f.id, "type", v)} options={EXTRACT_TYPES.map(x => ({ id: x, label: x }))} />
              <input className="winput" style={{ padding: "7px 9px", fontSize: 12 }} placeholder="When the contract term begins." value={f.description} onChange={e => updateField(f.id, "description", e.target.value)} />
              <button onClick={() => removeField(f.id)} style={SRC_REMOVE_BTN}>×</button>
            </div>
          ))}
          {fields.length === 0 && (
            <div style={{ padding: "30px 14px", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>No fields yet — add the values you want pulled from each document.</div>
          )}
        </div>
        <button onClick={addField} style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", borderRadius: 9, border: "1px dashed var(--line)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink-2)" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add field</button>
      </FormRow>
      )}
      */}
    </StepWrap>
  );
}

// ── Src Step 4: Column Mapping ────────────────────────────────────────────────

// Transformation functions available per mapped field (matches the connector catalog).
// Each function declares its dependent config fields (rendered below the picker).
const TRANSFORM_FUNCTIONS = [
  { id: "cast",       label: "Cast",             glyph: "⇲",   fields: [{ key: "to", label: "Cast to", type: "select", options: ["string", "integer", "float", "boolean", "date", "timestamp", "json"], required: true }] },
  { id: "extract",    label: "Extract Text",     glyph: "</>", fields: [{ key: "pattern", label: "Pattern (regex)", type: "text", placeholder: "e.g. \\d{3}-\\d{4}", hint: "The first capture group becomes the value." }] },
  { id: "flatten",    label: "Flatten JSON",     glyph: "{}",  fields: [{ key: "depth", label: "Max depth", type: "select", options: ["1", "2", "3", "Unlimited"] }] },
  { id: "hash",       label: "Hash",             glyph: "#",   fields: [{ key: "algo", label: "Algorithm", type: "select", options: ["MD5", "SHA-1", "SHA-256", "SHA-512"], required: true }] },
  { id: "mask",       label: "Mask",             glyph: "•••", fields: [{ key: "keep", label: "Keep last N chars", type: "text", placeholder: "4" }, { key: "char", label: "Mask character", type: "text", placeholder: "*" }] },
  { id: "replace",    label: "Replace Value",    glyph: "⇄",   fields: [{ key: "find", label: "Find", type: "text", placeholder: "value to match" }, { key: "replace", label: "Replace with", type: "text", placeholder: "replacement value" }] },
  { id: "lower",      label: "To Lowercase",     glyph: "a",   fields: [] },
  { id: "upper",      label: "To Uppercase",     glyph: "A",   fields: [] },
  { id: "b64enc",     label: "Base64 Encode",    glyph: "64",  fields: [] },
  { id: "b64dec",     label: "Base64 Decode",    glyph: "64",  fields: [] },
  { id: "aes_enc",    label: "AES Encryption",   glyph: "🔒",  fields: [{ key: "conn", label: "AES connection", type: "select", options: ["Vault — prod", "Vault — staging", "KMS key — primary"], required: true, placeholder: "Select connection" }] },
  { id: "aes_dec",    label: "AES Decryption",   glyph: "🔓",  fields: [{ key: "conn", label: "AES connection", type: "select", options: ["Vault — prod", "Vault — staging", "KMS key — primary"], required: true, placeholder: "Select connection" }] },
  { id: "duplicate",  label: "Duplicate Field",  glyph: "⧉",   fields: [], alwaysSaveNew: true },
  { id: "dl_s3",      label: "Download from S3",  glyph: "↓",  fields: [{ key: "conn", label: "S3 connection", type: "select", options: ["s3-prod", "s3-archive"], placeholder: "Select connection" }, { key: "path", label: "Path / key", type: "text", placeholder: "bucket/prefix/" }] },
  { id: "ul_s3",      label: "Upload to S3",      glyph: "↑",  fields: [{ key: "conn", label: "S3 connection", type: "select", options: ["s3-prod", "s3-archive"], placeholder: "Select connection" }, { key: "path", label: "Path / key", type: "text", placeholder: "bucket/prefix/" }] },
];
function tfDef(id){ return TRANSFORM_FUNCTIONS.find(f => f.id === id) || null; }
function tfLabel(id){ return (tfDef(id) || {}).label || ""; }

const MAP_TYPE_GLYPH = {
  string: { g: "T", c: "var(--blue)" }, "string[]": { g: "[T]", c: "var(--blue)" },
  int: { g: "#", c: "var(--gold)" }, float: { g: ".5", c: "var(--gold)" }, decimal: { g: "#", c: "var(--gold)" },
  bool: { g: "01", c: "var(--coral)" }, timestamp: { g: "TS", c: "var(--green)" }, date: { g: "DT", c: "var(--green)" },
  datetime: { g: "DT", c: "var(--green)" }, uuid: { g: "ID", c: "var(--purple)" }, json: { g: "{}", c: "var(--ink-3)" },
  enum: { g: "E", c: "var(--purple)" }, fk: { g: "FK", c: "var(--purple)" },
};
function MapTypeGlyph({ type, size }) {
  const m = MAP_TYPE_GLYPH[type] || { g: "T", c: "var(--ink-3)" };
  size = size || 26;
  return <span style={{ width: size, height: size, borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg-canvas)", color: m.c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{m.g}</span>;
}
function MapBadge({ children, tone }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", padding: "1px 5px", borderRadius: 4, color: tone || "var(--ink-3)", border: "1px solid var(--line)", background: "var(--bg-canvas)" }}>{children}</span>;
}

// Per-field transformation chain editor — a focused right-side drawer.
// Add one or many functions, applied top to bottom, before the value is written.
function SrcTransformDrawer({ col, type, sel, list: propList, onChange: propOnChange, onClose, newField, cols, objName, onSave }) {
  const isNew = !!newField;
  const [draftList, setDraftList] = useState([]);
  const [nfName, setNfName] = useState("");
  const [nfSource, setNfSource] = useState("");
  const list = isNew ? draftList : (propList || []);
  const onChange = isNew ? setDraftList : propOnChange;
  const srcCol = isNew ? (cols || []).find(c => c.col === nfSource) : null;
  const effType = isNew ? (srcCol ? srcCol.type : "string") : type;
  const canSaveNew = isNew && nfName.trim() && nfSource;
  const add = () => onChange(list.concat([{ fn: "", cfg: {}, saveNew: false, newField: "" }]));
  const setFn = (i, fn) => onChange(list.map((t, j) => j === i ? { fn: fn, cfg: {}, saveNew: !!(tfDef(fn) || {}).alwaysSaveNew, newField: t.newField || "" } : t));
  const setCfg = (i, key, val) => onChange(list.map((t, j) => j === i ? { ...t, cfg: { ...(t.cfg || {}), [key]: val } } : t));
  const setItem = (i, patch) => onChange(list.map((t, j) => j === i ? { ...t, ...patch } : t));
  const remove = i => onChange(list.filter((_, j) => j !== i));
  const fnGlyph = id => (tfDef(id) || {}).glyph;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 60, display: "flex", justifyContent: "flex-end", animation: "flow-fade-in 140ms ease-out" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "80%", height: "100%", background: "var(--panel)", borderLeft: "1px solid var(--line)", boxShadow: "-24px 0 60px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column" }}>
        {/* header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-canvas)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9M20 17l-3-3M20 17l-3 3" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>{isNew ? "New transformed field" : "Transformations"}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
              {isNew
                ? (nfSource ? <><MapTypeGlyph type={effType} size={18} /> <code>{nfName || "new_field"}</code> <span style={{ color: "var(--ink-4)" }}>· from {nfSource}</span></> : <span style={{ color: "var(--ink-4)" }}>Derive a new field from a source column</span>)
                : <><MapTypeGlyph type={type} size={18} /> <code>{col}</code> {sel ? "· " + sel.name : ""}</>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "none", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, fontSize: 13 }}>✕</button>
        </div>
        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {isNew && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--line-2)" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Field name</label>
                <input className="winput winput-mono" placeholder="e.g. full_name" value={nfName} onChange={e => setNfName(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Source field</label>
                <CustomSelect value={nfSource} onChange={setNfSource} placeholder="Pick a source field"
                  options={(cols || []).map(c => ({ id: c.col, label: c.col, type: c.type }))}
                  renderTrigger={o => o.id ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)" }}>{o.label}</span></span> : <span style={{ color: "var(--ink-4)" }}>Pick a source field</span>}
                  renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={18} />{o.label}</span>} />
              </div>
            </div>
          )}
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 16 }}>{isNew ? "Chain functions to compute the new field's value from the source. They run top to bottom." : "Functions run top to bottom on the source value before it's written to the destination field. Drag-free reorder by removing and re-adding."}</div>
          {list.map((t, i) => {
            const def = tfDef(t.fn);
            const cfg = t.cfg || {};
            const forceSave = def && def.alwaysSaveNew;
            const showNewField = forceSave || t.saveNew;
            return (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg-canvas)", marginBottom: 12 }}>
                {/* header: step + function picker + remove */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: def ? "1px solid var(--line-2)" : "none" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CustomSelect value={t.fn} onChange={v => setFn(i, v)} placeholder="Select a function"
                      options={TRANSFORM_FUNCTIONS.map(f => ({ id: f.id, label: f.label }))}
                      renderTrigger={o => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-2)" }}>{fnGlyph(o.id)}</span>{o.label}</span>}
                      renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-2)" }}>{fnGlyph(o.id)}</span>{o.label}</span>} />
                  </div>
                  <button onClick={() => remove(i)} title="Remove" style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
                  </button>
                </div>
                {/* dependent config */}
                {def && (
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {def.fields.map(f => (
                      <div key={f.key}>
                        <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>{f.label}{f.required && <span style={{ color: "var(--coral)" }}> *</span>}</label>
                        {f.type === "select"
                          ? <CustomSelect value={cfg[f.key] || ""} onChange={v => setCfg(i, f.key, v)} placeholder={f.placeholder || "Select…"} options={f.options.map(o => ({ id: o, label: o }))} />
                          : <input className="winput" placeholder={f.placeholder || ""} value={cfg[f.key] || ""} onChange={e => setCfg(i, f.key, e.target.value)} />}
                        {f.hint && <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 5 }}>{f.hint}</div>}
                      </div>
                    ))}
                    {/* save output in new field */}
                    <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: forceSave ? "default" : "pointer", opacity: forceSave ? 0.7 : 1 }}>
                      <input type="checkbox" checked={showNewField} disabled={forceSave} onChange={e => setItem(i, { saveNew: e.target.checked })} style={{ accentColor: "var(--ink)", width: 15, height: 15 }} />
                      <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Save output in a new field{forceSave ? " (required)" : ""}</span>
                    </label>
                    {showNewField && (
                      <div>
                        <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Transformed field name <span style={{ color: "var(--coral)" }}>*</span></label>
                        <input className="winput winput-mono" placeholder={col + "_transformed"} value={t.newField || ""} onChange={e => setItem(i, { newField: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", border: "1px dashed var(--line)", borderRadius: 9, background: "var(--bg-canvas)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink-2)", marginTop: 2, width: "100%", justifyContent: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add transformation
          </button>
        </div>
        {/* footer */}
        <div style={{ flexShrink: 0, padding: "14px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel-2)" }}>
          {isNew ? (
            <>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={() => onSave && onSave({ name: nfName.trim(), source: nfSource, chain: list })} className="btn-dark" disabled={!canSaveNew} style={{ opacity: canSaveNew ? 1 : 0.45 }}>Add field</button>
            </>
          ) : (
            <>
              <button onClick={() => onChange([])} disabled={!list.length} className="btn-ghost" style={{ opacity: list.length ? 1 : 0.4 }}>Clear all</button>
              <button onClick={onClose} className="btn-dark">Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Record-level ingest filter — conditions evaluated against source rows so only
// matching records are pulled into the node. Distinct from the field-view filter.
const RECORD_FILTER_OPS = [
  { id: "contains",     label: "Contains" },
  { id: "not_contains", label: "Does not contain" },
  { id: "equals",       label: "Equals" },
  { id: "not_equals",   label: "Does not equal" },
  { id: "starts_with",  label: "Starts with" },
  { id: "gt",           label: "Greater than" },
  { id: "lt",           label: "Less than" },
  { id: "is_empty",     label: "Is empty" },
  { id: "is_not_empty", label: "Is not empty" },
];
function opNeedsValue(op) { return op !== "is_empty" && op !== "is_not_empty"; }
function opLabel(op) { const o = RECORD_FILTER_OPS.find(x => x.id === op); return o ? o.label : op; }

// Popover condition-builder for the record ingest filter.
function FilterRecordsPopover({ cols, initial, objName, onApply, onClear, onClose }) {
  const blank = () => ({ field: "", op: "contains", value: "" });
  const [rows, setRows] = useState((initial && initial.length) ? initial.map(r => Object.assign({}, r)) : [blank()]);
  const setRow = (i, patch) => setRows(rs => rs.map((r, j) => j === i ? Object.assign({}, r, patch) : r));
  const addRow = () => setRows(rs => rs.concat([blank()]));
  const removeRow = i => setRows(rs => (rs.length <= 1 ? [blank()] : rs.filter((_, j) => j !== i)));
  const valid = rows.filter(r => r.field && (opNeedsValue(r.op) ? String(r.value || "").length > 0 : true));
  const fieldOpts = cols.map(c => ({ id: c.col, label: c.col, type: c.type }));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 41, width: 600, maxWidth: "82vw", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 18px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Filter records</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.4 }}>Only ingest {objName} records that match <b style={{ color: "var(--ink-2)" }}>all</b> of these conditions.</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--line)", background: "none", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, fontSize: 12 }}>✕</button>
        </div>
        <div style={{ padding: "13px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 42, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{i === 0 ? "Where" : "And"}</span>
              <div style={{ width: 168, flexShrink: 0 }}>
                <CustomSelect value={r.field} onChange={v => setRow(i, { field: v })} placeholder="Field" options={fieldOpts}
                  renderTrigger={o => o.id ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span></span> : <span style={{ color: "var(--ink-4)" }}>Field</span>}
                  renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapTypeGlyph type={o.type} size={18} />{o.label}</span>} />
              </div>
              <div style={{ width: 156, flexShrink: 0 }}>
                <CustomSelect value={r.op} onChange={v => setRow(i, { op: v })} options={RECORD_FILTER_OPS} />
              </div>
              {opNeedsValue(r.op)
                ? <input className="winput" style={{ flex: 1, minWidth: 0 }} placeholder="Value" value={r.value || ""} onChange={e => setRow(i, { value: e.target.value })} />
                : <div style={{ flex: 1 }} />}
              <button onClick={() => removeRow(i)} title="Remove" style={{ width: 34, height: 36, borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addRow} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", border: "1px dashed var(--line)", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add condition
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--line-2)", background: "var(--panel-2)", borderRadius: "0 0 12px 12px" }}>
          <button onClick={() => { setRows([blank()]); onClear(); }} className="btn-ghost">Clear all</button>
          <button onClick={() => onApply(valid)} className="btn-dark" disabled={valid.length === 0} style={{ opacity: valid.length ? 1 : 0.45 }}>Apply{valid.length ? " · " + valid.length : ""}</button>
        </div>
      </div>
    </>
  );
}

// ── Src Step (structured): Per-object agents ─────────────────────────────────
// For each object selected in the Objects step, optionally run an agent that
// reads every record and emits additional fields (available in Column mapping).
const OBJECT_AGENTS = [
  { id: "enrich_company", name: "Company Enricher",    desc: "Appends firmographics from external data providers.", outputs: ["industry", "employee_count", "annual_revenue", "hq_country"] },
  { id: "lead_score",     name: "Lead Scorer",         desc: "Scores each record on fit and intent signals.",       outputs: ["fit_score", "intent_score", "priority_tier"] },
  { id: "dedupe",         name: "Duplicate Detector",  desc: "Flags likely duplicates and proposes a survivor.",     outputs: ["dup_cluster_id", "is_survivor", "match_confidence"] },
  { id: "sentiment",      name: "Sentiment Classifier",desc: "Reads notes & activity to gauge health.",              outputs: ["sentiment", "health_score"] },
  { id: "summarize",      name: "Record Summarizer",   desc: "Generates a one-line summary per record.",             outputs: ["summary"] },
  { id: "geocode",        name: "Address Geocoder",    desc: "Normalizes addresses and adds lat/long.",              outputs: ["lat", "lng", "normalized_address", "timezone"] },
];

function SrcObjectAgents({ s, set, groups, sel }) {
  const assigned = s.objectAgents || {};
  const setAgent = (obj, id) => set({ objectAgents: Object.assign({}, assigned, (function () { var o = {}; o[obj] = id; return o; })()) });
  const agentOpts = [{ id: "", label: "No agent", desc: "Skip enrichment for this object." }].concat(OBJECT_AGENTS.map(a => ({ id: a.id, label: a.name, desc: a.desc })));
  return (
    <StepWrap wide title="Run agents on each object">
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16, lineHeight: 1.55, maxWidth: 760 }}>Optionally assign an agent to each object you selected. The agent reads every record and produces additional fields — these become available to map in the next step.</div>
      {groups.length === 0 && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", padding: "40px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No objects selected — go back to the Objects step and pick at least one.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map(g => {
          const agId = assigned[g.name] || "";
          const ag = OBJECT_AGENTS.find(a => a.id === agId);
          return (
            <div key={g.name} style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", borderBottom: "1px solid var(--line-2)", background: "var(--panel-2)" }}>
                {sel && <SrcConnectorLogo c={sel} size={18} />}
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{g.name}</code>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{(g.type || "Object") + " · " + g.cols.length + " columns"}</span>
                {ag && <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", color: "var(--purple)", background: "color-mix(in oklab, var(--purple) 12%, transparent)", padding: "3px 8px", borderRadius: 5 }}>＋{ag.outputs.length} FIELDS</span>}
              </div>
              <div style={{ padding: "13px 16px" }}>
                <div style={{ maxWidth: 420 }}>
                  <CustomSelect value={agId} onChange={v => setAgent(g.name, v)} placeholder="Select an agent…" options={agentOpts}
                    renderTrigger={o => o.id
                      ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><AgentGlyph /><span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{o.label}</span></span>
                      : <span style={{ color: "var(--ink-4)" }}>No agent — skip enrichment</span>} />
                </div>
                {ag && (
                  <div style={{ marginTop: 13 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>Outputs added to {g.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ag.outputs.map(f => (
                        <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--chip)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                          <span style={{ width: 14, height: 14, borderRadius: 3, background: "color-mix(in oklab, var(--purple) 14%, transparent)", color: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>FX</span>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </StepWrap>
  );
}

// Small agent avatar glyph reused in the per-object agent picker.
function AgentGlyph() {
  return <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: "color-mix(in oklab, var(--purple) 13%, transparent)", border: "1px solid color-mix(in oklab, var(--purple) 28%, var(--line))", color: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6" /><path d="M12 2.2v1.2" /></svg>
  </span>;
}

function SrcMapping({ s, set, groups, activeObj, nodeProps, node, sel, openCol, setOpenCol, eyebrow, title, desc, singleGroup }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const mapping = s.mapping || {};
  const transforms = s.transforms || {};
  const groupList = groups || [];
  const mk = (g, c) => g + "::" + c;
  const updateMap = (key, propId) => set({ mapping: Object.assign({}, mapping, (function () { var o = {}; o[key] = propId; return o; })()) });
  const GRID = "minmax(180px,1.3fr) minmax(190px,1.2fr) 34px minmax(190px,1.3fr)";

  // Map ONE object at a time — the active object is driven by the sidebar sub-nav.
  const current = (activeObj && groupList.find(g => g.name === activeObj)) || groupList[0] || null;
  const curCols = current ? current.cols : [];
  const curKeys = curCols.map(c => mk(current.name, c.col));
  const total = curKeys.length;
  const mappedCount = curKeys.filter(k => mapping[k]).length;
  const recordFilters = s.recordFilters || {};
  const activeFilters = current ? (recordFilters[current.name] || []) : [];
  const tfields = current ? ((s.transformedFields || {})[current.name] || []) : [];
  const removeTf = id => { const cur = s.transformedFields || {}; const arr = (cur[current.name] || []).filter(t => t.id !== id); set({ transformedFields: Object.assign({}, cur, (function () { var o = {}; o[current.name] = arr; return o; })()) }); };
  const colVisible = (c) => {
    const key = mk(current.name, c.col);
    if (q && c.col.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    if (tab === "mapped") return !!mapping[key];
    if (tab === "unmapped") return !mapping[key];
    return true;
  };

  function renderRow(g, col, i, last) {
    const key = mk(g.name, col.col);
    const mapped = mapping[key];
    const tlist = transforms[key] || [];
    const isOpen = openCol === key;
    return (
      <div key={key} style={{ borderTop: i ? "1px solid var(--line-2)" : "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "12px 16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MapTypeGlyph type={col.type} />
            <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.col}</code>
            {col.col === "id" && <MapBadge tone="var(--green)">PK</MapBadge>}
          </div>
          <button onClick={() => setOpenCol(key)}
            style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%", padding: "7px 10px", borderRadius: 8, borderWidth: 1, borderStyle: tlist.length || isOpen ? "solid" : "dashed", borderColor: isOpen ? "var(--ink)" : tlist.length ? "var(--line)" : "transparent", background: isOpen ? "var(--bg-canvas)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 34 }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--panel-2)"; if (!tlist.length && !isOpen) e.currentTarget.style.borderColor = "var(--line)"; }}
            onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; if (!tlist.length && !isOpen) e.currentTarget.style.borderColor = "transparent"; }}>
            {tlist.length === 0
              ? <span style={{ fontSize: 12, color: "var(--ink-4)" }}>+ Add transformation</span>
              : tlist.map((t, j) => <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "var(--chip)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>{t.fn ? tfLabel(t.fn) : "function…"}</span>)}
            <span style={{ marginLeft: "auto", color: "var(--ink-3)", flexShrink: 0, display: "flex" }} title="Edit transformations">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
            </span>
          </button>
          <div style={{ textAlign: "center", color: mapped ? "var(--green)" : "var(--ink-4)", fontSize: 15 }}>→</div>
          <CustomSelect value={mapped || ""} onChange={v => updateMap(key, v)} placeholder="Select field"
            options={nodeProps.map(p => ({ id: p.id, label: p.id, type: p.type })).concat([{ id: "__new__", label: "+ New property…" }])}
            renderTrigger={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={22} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)" }}>{o.label}</span>{o.id === "id" && <><MapBadge tone="var(--green)">PK</MapBadge><MapBadge>UK</MapBadge></>}</span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-4)" }}>{o.label || "Select field"}</span>}
            renderOption={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} />{o.label}</span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-3)" }}>{o.label}</span>} />
        </div>
      </div>
    );
  }

  function tableHeader(round) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "10px 16px", background: "var(--panel-2)", borderBottom: "1px solid var(--line-2)", borderRadius: round ? "11px 11px 0 0" : "0", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)" }}>
        <div>Source fields</div><div>Transformations</div><div></div><div>Destination fields</div>
      </div>
    );
  }

  // Derived "transformed fields" created via the toolbar render as extra mappable rows.
  function renderTfRow(tf) {
    const key = mk(current.name, tf.name);
    const mapped = mapping[key];
    const srcCol = curCols.find(c => c.col === tf.source);
    const tfType = srcCol ? srcCol.type : "string";
    const chain = (tf.chain || []).filter(t => t.fn);
    return (
      <div key={tf.id} style={{ borderTop: "1px solid var(--line-2)", background: "color-mix(in oklab, var(--purple) 4%, transparent)" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "12px 16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MapTypeGlyph type={tfType} />
            <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tf.name}</code>
            <MapBadge tone="var(--purple)">FX</MapBadge>
            <button onClick={() => removeTf(tf.id)} title="Remove field" style={{ marginLeft: 2, width: 22, height: 22, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <button onClick={() => setOpenCol(current.name + "::__newtf__")} title="Transformed via" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 34 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-4)" }}>from {tf.source}</span>
            {chain.map((t, j) => <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "var(--chip)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>{tfLabel(t.fn)}</span>)}
            {chain.length === 0 && <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>passthrough</span>}
          </button>
          <div style={{ textAlign: "center", color: mapped ? "var(--green)" : "var(--ink-4)", fontSize: 15 }}>→</div>
          <CustomSelect value={mapped || ""} onChange={v => updateMap(key, v)} placeholder="Select field"
            options={nodeProps.map(p => ({ id: p.id, label: p.id, type: p.type })).concat([{ id: "__new__", label: "+ New property…" }])}
            renderTrigger={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={22} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)" }}>{o.label}</span></span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-4)" }}>{o.label || "Select field"}</span>}
            renderOption={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} />{o.label}</span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-3)" }}>{o.label}</span>} />
        </div>
      </div>
    );
  }

  const multiObj = groupList.length > 1;
  const objName = current ? current.name : "";
  const stepTitle = title || (multiObj && objName
    ? `Map ${objName} fields to ${node?.label || "the node"}`
    : `Map ${sel ? sel.name : "source"} fields to ${node?.label || "the node"}`);

  return (
    <StepWrap wide title={stepTitle}>
      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {/* field-view dropdown (defaults to All fields; width hugs its text) */}
        <CustomSelect className="csel-auto" value={tab} onChange={setTab}
          options={[
            { id: "all",      label: "All fields", count: total },
            { id: "mapped",   label: "Mapped",     count: mappedCount },
            { id: "unmapped", label: "Unmapped",   count: total - mappedCount },
          ]}
          renderTrigger={o => <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{o.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--chip)", color: "var(--ink-3)" }}>{o.count}</span>
          </span>}
          renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <span style={{ flex: 1 }}>{o.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--chip)", color: "var(--ink-3)" }}>{o.count}</span>
          </span>} />

        {/* filter records */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setFilterOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 13px", height: 40, borderRadius: 9, border: "1px solid " + (filterOpen || activeFilters.length ? "var(--ink)" : "var(--line)"), background: filterOpen ? "var(--bg-canvas)" : "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
            Filter records
            {activeFilters.length > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, minWidth: 18, textAlign: "center", padding: "1px 6px", borderRadius: 10, background: "var(--ink)", color: "var(--panel)" }}>{activeFilters.length}</span>}
          </button>
          {filterOpen && current && (
            <FilterRecordsPopover key={current.name} cols={curCols} initial={activeFilters} objName={current.name}
              onApply={rows => { set({ recordFilters: Object.assign({}, recordFilters, (function () { var o = {}; o[current.name] = rows; return o; })()) }); setFilterOpen(false); }}
              onClear={() => { set({ recordFilters: Object.assign({}, recordFilters, (function () { var o = {}; o[current.name] = []; return o; })()) }); setFilterOpen(false); }}
              onClose={() => setFilterOpen(false)} />
          )}
        </div>

        {/* add a derived field via the transformation panel */}
        <button onClick={() => current && setOpenCol(current.name + "::__newtf__")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 13px", height: 40, borderRadius: 9, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 400, color: "var(--ink-3)", lineHeight: 1 }}>+</span>
          Transformed field
        </button>

        <div style={{ position: "relative", marginLeft: "auto", width: 240 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          </span>
          <input className="winput" style={{ paddingLeft: 34 }} placeholder="Search fields…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {/* active record-filter summary */}
      {activeFilters.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12, padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--bg-canvas)" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", flexShrink: 0 }}>Ingesting only where</span>
          {activeFilters.map((f, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
              {i > 0 && <span style={{ color: "var(--ink-4)" }}>and</span>}
              <b style={{ color: "var(--ink)", fontWeight: 600 }}>{f.field}</b>
              <span style={{ color: "var(--ink-3)" }}>{opLabel(f.op).toLowerCase()}</span>
              {opNeedsValue(f.op) && <b style={{ color: "var(--ink)", fontWeight: 600 }}>{f.value}</b>}
            </span>
          ))}
          <button onClick={() => setFilterOpen(true)} className="btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px", fontSize: 12 }}>Edit</button>
        </div>
      )}

      {!current && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", padding: "40px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No objects selected — go back to the Objects step and pick at least one.</div>
      )}

      {current && (function () {
        const visible = curCols.filter(colVisible);
        return (
          <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", overflow: "hidden" }}>
            {/* active object caption */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
              {!singleGroup && sel && <SrcConnectorLogo c={sel} size={18} />}
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{current.name}</code>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{(current.type || "Object") + " · " + current.cols.length + " columns"}</span>
              <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, color: mappedCount ? "var(--green)" : "var(--ink-3)" }}>{mappedCount + "/" + total + " mapped"}</span>
            </div>
            {tableHeader(false)}
            {visible.map((col, i) => renderRow(current, col, i, i === visible.length - 1))}
            {tab !== "mapped" && tfields.map(tf => renderTfRow(tf))}
            {visible.length === 0 && tfields.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>No fields match the current filter.</div>}
          </div>
        );
      })()}
    </StepWrap>
  );
}

// ── Src Step 4: Schedule ──────────────────────────────────────────────────────

// Selectable radio card used across settings.
function SetCard({ on, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 15px", borderRadius: 10, borderWidth: 1, borderStyle: "solid", borderColor: on ? "color-mix(in oklab, var(--ink) 22%, var(--line))" : "var(--line)", background: on ? "var(--panel)" : "transparent", cursor: "pointer", fontFamily: "inherit", boxShadow: on ? "0 1px 2px rgba(40,40,20,0.06)" : "none", marginBottom: 10 }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: "1px solid " + (on ? "var(--ink)" : "var(--line)"), background: on ? "var(--ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--bg-canvas)" }} />}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>{title}</span>
        <span style={{ fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</span>
      </span>
    </button>
  );
}

const SET_ICONS = {
  bolt: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 4 14 11 14 10 22 19 10 12 10 13 2" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 12 15 2 8.5 12 2" /><polyline points="2 15.5 12 22 22 15.5" /></svg>,
  live: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9" /></svg>,
  archive: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><line x1="10" y1="12" x2="14" y2="12" /></svg>,
  cursor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l6 18 2-7 7-2z" /></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>,
};
function SrcSchedule({ s, set, srcCols, eyebrow }) {
  const v = (k, d) => (s[k] !== undefined ? s[k] : d);
  const pType = v("pipelineType", "realtime");
  const schedType = v("schedType", "interval");
  const ingMode = v("ingestMode", "hist_live");
  const schemaMethod = v("schemaMethod", "manual");
  const lbl2 = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 7 };
  return (
    <StepWrap wide title="Pipeline settings">
      <FormRow label="Pipeline Type" hint="Select the type of pipeline">
        <SrcRichSelect value={pType} onChange={x => set({ pipelineType: x })}
          options={[
            { id: "realtime", title: "Real Time", desc: "Ingests, transforms and loads data to destination in real-time.", icon: SET_ICONS.bolt },
            { id: "scheduled", title: "Scheduled", desc: "Pipeline operates at a recurring schedule.", icon: SET_ICONS.clock },
          ]} />
        {pType === "scheduled" && (
          <div style={{ marginTop: 14 }}>
            <div style={lbl2}>Schedule type *</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["interval", "Interval"], ["cron", "Cron Expression"]].map(o => { const on = schedType === o[0]; return (
                <button key={o[0]} onClick={() => set({ schedType: o[0] })} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 9, borderWidth: 1, borderStyle: "solid", borderColor: on ? "var(--ink)" : "var(--line)", background: on ? "var(--bg-canvas)" : "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: on ? 600 : 500, color: "var(--ink)", boxShadow: on ? "0 0 0 2px color-mix(in oklab, var(--ink) 9%, transparent)" : "none" }}>
                  <span style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid " + (on ? "var(--ink)" : "var(--line)"), background: on ? "var(--ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--bg-canvas)" }} />}</span>{o[1]}
                </button>
              ); })}
            </div>
            {schedType === "interval" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
                  <div><div style={lbl2}>Trigger every *</div><input className="winput" value={v("triggerEvery", "15")} onChange={e => set({ triggerEvery: e.target.value })} /></div>
                  <div><div style={lbl2}>Frequency *</div><CustomSelect value={v("frequency", "Minutes")} onChange={x => set({ frequency: x })} options={["Minutes", "Hours", "Days", "Weeks"].map(x => ({ id: x, label: x }))} /></div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginBottom: 14 }}>Define repeating schedule. Enter whole numbers only.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><div style={lbl2}>Starting at *</div><input className="winput" type="datetime-local" value={v("startAt", "")} onChange={e => set({ startAt: e.target.value })} /></div>
                  <div><div style={lbl2}>Ending at</div><input className="winput" type="datetime-local" value={v("endAt", "")} onChange={e => set({ endAt: e.target.value })} /></div>
                </div>
              </>
            ) : (
              <div><div style={lbl2}>Cron expression *</div><input className="winput winput-mono" placeholder="*/15 * * * *" value={v("cron", "")} onChange={e => set({ cron: e.target.value })} /></div>
            )}
          </div>
        )}
      </FormRow>

      <FormRow label="Ingestion Mode" hint="Select the ingestion mode for your data pipeline">
        <SrcRichSelect value={ingMode} onChange={x => set({ ingestMode: x })}
          options={[
            { id: "hist_live", title: "Historical and Live", desc: "Ingest all historical data and process new data in real-time.", icon: SET_ICONS.layers },
            { id: "live", title: "Live only", desc: "Only process new data from connection time onward.", icon: SET_ICONS.live },
            { id: "hist", title: "Historical only", desc: "Backfill existing data once, with no live updates.", icon: SET_ICONS.archive },
          ]} />
      </FormRow>

      <FormRow label="Ingestion Order" optional hint="Sets ingestion order for source objects">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 9, background: "var(--gold-fill)", border: "1px solid var(--gold-soft)", marginBottom: 12 }}>
          <span style={{ color: "var(--gold)", flexShrink: 0, fontSize: 15 }}>⚠</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Applicable for historic data only.</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>(0/3)</div>
        <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 9, border: "1px dashed var(--line)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink-2)" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add Source Objects</button>
      </FormRow>

      <FormRow label="Capture Raw Records" optional hint="Records with the selected status will be captured in logs.">
        <div style={lbl2}>Status</div>
        <CustomSelect value={v("captureStatus", "Failed")} onChange={x => set({ captureStatus: x })} options={["None", "Failed", "Success", "All"].map(x => ({ id: x, label: x }))} />
      </FormRow>

      <FormRow label="Avoid Duplicate Operations" optional hint="Enable duplicate operations prevention in your destination">
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={!!s.avoidDup} onChange={e => set({ avoidDup: e.target.checked })} style={{ accentColor: "var(--ink)", width: 15, height: 15, marginTop: 2 }} />
          <span><span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Avoid Duplicate Operations</span><span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.5 }}>Avoid duplicate operations and cyclical writes between pipelines. Checks existing record hashes to ensure one-way data flow.</span></span>
        </label>
      </FormRow>

      <FormRow label="Schema Mapping Method" hint="How destination objects are created or matched">
        <SrcRichSelect value={schemaMethod} onChange={x => set({ schemaMethod: x })}
          options={[
            { id: "manual", title: "Map Manually", desc: "Map selected source objects to existing destination objects.", icon: SET_ICONS.cursor },
            { id: "replicate", title: "Replicate Source", desc: "Creates an exact replica of selected source objects in destination.", icon: SET_ICONS.copy },
          ]} />
      </FormRow>

      <FormRow label="Resource Tier" hint="Select resource tier for pipeline resources" last>
        <CustomSelect value={v("resourceTier", "Small")} onChange={x => set({ resourceTier: x })} options={["Small", "Medium", "Large", "X-Large"].map(x => ({ id: x, label: x }))} />
      </FormRow>
    </StepWrap>
  );
}

// ── Src Step 5: Review ────────────────────────────────────────────────────────

function SrcReview({ s, set, node, sel, mapGroups, mappedCount, totalMapCols, unstructured, readCfg, eyebrow, onClose }) {
  mapGroups = mapGroups || [];
  totalMapCols = totalMapCols != null ? totalMapCols : mapGroups.reduce((a, g) => a + g.cols.length, 0);
  const selectedTables = s.tables || [];
  const readLocs = s.readLocations || [];
  const readFilters = s.readFilters || {};
  const activeFilters = Object.keys(readFilters).filter(k => { const v = readFilters[k]; return Array.isArray(v) ? v.length : (!!v && v !== "all"); });
  const extractFields = s.extractFields || [];
  const readScopeLabel = (s.readScope || "all") === "all" ? "all " + (readCfg ? readCfg.item : "files")
    : (s.readScope === "folders" ? readLocs.length + " " + (readCfg ? readCfg.container : "folders") : readLocs.length + " " + (readCfg ? readCfg.item : "files"));
  const unstructuredYaml = `name: ${node?.id || "node"}_from_${s.system || "source"}
source:
  connector: ${s.system || "?"}
  read:
    scope: ${s.readScope || "all"}
${readLocs.length ? "    locations:\n" + readLocs.map(l => "      - " + l.label).join("\n") + "\n" : ""}${activeFilters.length ? "    filters:\n" + activeFilters.map(k => "      " + k + ": " + (Array.isArray(readFilters[k]) ? "[" + readFilters[k].join(", ") + "]" : readFilters[k])).join("\n") + "\n" : ""}${(s.readStarts || []).length ? "    starting_points: [" + s.readStarts.join(", ") + "]\n" : ""}extract:
  method: ${s.extractMethod || "(skipped)"}
  ${s.extractMethod === "automation" ? "automation: " + (s.extractAutomation || "(none)") : "agent: " + (s.extractAgent || "(none)")}
  output_schema:
${extractFields.length ? extractFields.map(f => "    - name: " + (f.name || "untitled") + "\n      type: " + (f.type || "string") + "\n      description: " + (f.description || "")).join("\n") : "    # (no fields defined)"}
target:
  node_type: ${node?.label?.replace(/\s/g, "") || "Node"}
schedule:`;
  const structuredYaml = `name: ${node?.id || "node"}_from_${s.system || "source"}
source:
  connector: ${s.system || "?"}
  objects: [${selectedTables.join(", ") || "(custom query)"}]
  load_strategy: ${s.loadStrategy}${s.loadStrategy === "incremental" ? "\n  watermark_column: " + s.incrementalCol : ""}
target:
  node_type: ${node?.label?.replace(/\s/g,"") || "Node"}
mapping:
${mapGroups.map(g => "  " + g.name + ":\n" + (g.cols.filter(c => s.mapping[g.name + "::" + c.col]).map(c => "    " + c.col + ": " + s.mapping[g.name + "::" + c.col]).join("\n") || "    # (none mapped)")).join("\n") || "  # (no objects selected)"}
  unmapped_columns: ${s.unmappedPolicy}
schedule:`;
  const yamlHead = unstructured ? unstructuredYaml : structuredYaml;
  const yaml = `${yamlHead}
  cadence: ${s.cadence}
  freshness_slo: ${s.freshnessSLO}
  retry: { count: ${s.retryCount}, delay: ${s.retryDelay} }
  on_error: ${s.onError}
  alert_channel: ${s.alertChannel}
${s.backfill ? `backfill:\n  window: ${s.backfillWindow}` : "# backfill: disabled"}
owner: ${s.owner}`;

  return (
    <StepWrap wide eyebrow={eyebrow || "STEP 6 · REVIEW & PUBLISH"} title="Review pipeline configuration" desc="Once published this pipeline appears in the Sources tab and begins syncing on the configured schedule.">
      <div className="review-grid">
        <section className="card review-summary">
          <div className="card-head">Summary</div>
          <ul className="rev-list">
            {(unstructured ? [
              ["Source",     sel?.name || s.customName],
              ["Scope",      readScopeLabel],
              ["Filters",    activeFilters.length ? activeFilters.length + " active" : "none"],
              ["Extract",    !s.extractMethod ? "skipped" : (s.extractMethod === "automation" ? "Automation" : "Agent") + (s.extractMethod === "automation" ? (s.extractAutomation ? " · " + s.extractAutomation : "") : (s.extractAgent ? " · " + s.extractAgent : ""))],
              ["Schema",     extractFields.length + " field" + (extractFields.length === 1 ? "" : "s")],
              ["Mapped",     mappedCount + " of " + totalMapCols + " fields"],
              ["Settings",   (s.pipelineType === "scheduled" ? "Scheduled" : "Real Time") + " · " + (s.resourceTier || "Small")],
              ["Owner",      s.owner],
            ] : [
              ["Source",    sel?.name || s.customName],
              ["Objects",   selectedTables.length ? selectedTables.length + " · " + selectedTables.join(", ") : "(query)"],
              ["Strategy",  s.loadStrategy + (s.loadStrategy === "incremental" ? " · " + s.incrementalCol : "")],
              ["Mapped",    mappedCount + " of " + totalMapCols + " columns"],
              ["Cadence",   s.cadence],
              ["SLO",       s.freshnessSLO],
              ["On error",  s.onError],
              ["Backfill",  s.backfill ? "on · " + s.backfillWindow : "off"],
              ["Owner",     s.owner],
            ]).map(([k, v], i) => <li key={i}><span className="rev-k">{k}</span><span className="rev-v">{v}</span></li>)}
          </ul>
        </section>

        <section className="card review-target">
          <div className="card-head">Target stage</div>
          <div className="card-body" style={{ padding: "14px 18px" }}>
            <Seg options={["draft","staging","live"]} value={s.stage} onChange={v => set({ stage: v })} />
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)", fontFamily: "JetBrains Mono" }}>
              {s.stage === "draft" ? "Config stored — pipeline not started." :
               s.stage === "staging" ? "Runs against staging graph + staging source." :
               "Production source + production graph."}
            </div>
          </div>
        </section>

        <section className="card review-cypher" style={{ gridColumn: "1/-1" }}>
          <div className="card-head card-head-row">
            <div>Pipeline config <span className="card-head-sub">YAML</span></div>
            <div className="card-head-actions"><button className="btn-ghost">Copy</button></div>
          </div>
          <pre className="cypher-block">{yaml}</pre>
        </section>
      </div>
    </StepWrap>
  );
}

// ── Src Preview ───────────────────────────────────────────────────────────────

function SrcPreview({ s, sel, node, srcCols, nodeProps, mappedCount }) {
  const nc = node ? (stubColorForNode?.(node) || { fill: "var(--blue-fill)", stroke: "var(--blue)" }) : { fill: "var(--chip)", stroke: "var(--line)" };
  return (
    <div className="preview-stack">
      <div className="preview-block">
        <div className="preview-head">Validation</div>
        <ul className="preview-checks">
          {[
            [!!s.system, "Source system selected"],
            [!!(s.table || s.query), "Object configured"],
            [!!s.pkCol, "Primary key set"],
            [mappedCount > 0, "At least 1 column mapped"],
            [!!s.freshnessSLO, "Freshness SLO defined"],
          ].map(([ok, label], i) => (
            <li key={i} className={"check " + (ok ? "check-ok" : "check-pend")}><span className="check-dot" /> {label}</li>
          ))}
        </ul>
      </div>
      <div className="preview-block">
        <div className="preview-head">Coverage</div>
        <div className="preview-impact">
          <span className="big-n" style={{ fontSize: 32 }}>{mappedCount}</span>
          <div className="big-n-text">of {srcCols.length} columns mapped<br /><span className="big-n-sub">{srcCols.length - mappedCount} will be ignored</span></div>
        </div>
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ height: 5, background: "var(--line-2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: (srcCols.length > 0 ? mappedCount/srcCols.length*100 : 0) + "%", background: "var(--green)", transition: "width 200ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export { LinkSourceFlow, SOURCE_SYSTEMS }
