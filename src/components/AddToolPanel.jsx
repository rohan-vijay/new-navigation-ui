import { useState } from 'react'

/* ── real brand logos via Simple Icons CDN, with graceful fallbacks ── */
function ToolGlyph({ slug, name, size = 22, icon = null }) {
  const [err, setErr] = useState(false)
  if (slug === '__builtin') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
        {icon || <path d="M12.5 2.5a4 4 0 00-4.7 5.2l-4.9 4.9a1.6 1.6 0 102.3 2.3l4.9-4.9A4 4 0 1012.5 2.5z" stroke="#8a7648" strokeWidth="1.5" strokeLinejoin="round" />}
      </svg>
    )
  }
  if (slug === 'salesforce') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <path d="M10 7.1a3.4 3.4 0 016.1-1.3 3 3 0 011.5-.4 3.05 3.05 0 011.6 5.6 2.7 2.7 0 01-1.3 5.1 2.7 2.7 0 01-1-.2 3.1 3.1 0 01-5.6.4 3.5 3.5 0 01-1.5.3A3.6 3.6 0 016 17a3.2 3.2 0 01.6-6.3 3.6 3.6 0 013.4-3.6z" fill="#00A1E0" />
      </svg>
    )
  }
  if (slug === 'slack') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <path d="M5.04 15.17a2.53 2.53 0 11-2.52-2.53h2.52v2.53zm1.27 0a2.53 2.53 0 015.05 0v6.31a2.53 2.53 0 01-5.05 0v-6.31z" fill="#E01E5A" />
        <path d="M8.83 5.04a2.53 2.53 0 112.53-2.52v2.52H8.83zm0 1.28a2.53 2.53 0 010 5.05H2.52a2.53 2.53 0 010-5.05h6.31z" fill="#36C5F0" />
        <path d="M18.96 8.83a2.53 2.53 0 112.52 2.53h-2.52V8.83zm-1.28 0a2.53 2.53 0 01-5.04 0V2.52a2.53 2.53 0 015.04 0v6.31z" fill="#2EB67D" />
        <path d="M15.16 18.96a2.53 2.53 0 11-2.52 2.52v-2.52h2.52zm0-1.28a2.53 2.53 0 010-5.04h6.32a2.53 2.53 0 010 5.04h-6.32z" fill="#ECB22E" />
      </svg>
    )
  }
  if (err || !slug) {
    const letter = (name || '?').charAt(0).toUpperCase()
    return <span style={{ width: size, height: size, borderRadius: 5, background: '#eee7da', color: '#7a6f5c', fontSize: size * 0.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{letter}</span>
  }
  return <img src={`https://cdn.simpleicons.org/${slug}`} width={size} height={size} alt="" onError={() => setErr(true)} style={{ display: 'block', objectFit: 'contain' }} />
}

/* ── Built-in tools (no connection / no config — added instantly) ── */
const TS = { fill: 'none', stroke: '#8a7648', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
const TOOLS = [
  { id: 'web-search', name: 'Web Search', desc: 'Search the web for live information', icon: <g {...TS}><circle cx="8.5" cy="8.5" r="5" /><path d="M12.4 12.4l4.1 4.1" /></g> },
  { id: 'fetch-url', name: 'Fetch URL', desc: 'Read the contents of a web page', icon: <g {...TS}><circle cx="10" cy="10" r="7.5" /><path d="M2.5 10h15M10 2.5c2 2.2 2 12.8 0 15M10 2.5c-2 2.2-2 12.8 0 15" /></g> },
  { id: 'pdf-read', name: 'PDF Reader', desc: 'Extract text and tables from PDFs', icon: <g {...TS}><path d="M5 2.5h6L15 6.5V17.5H5z" /><path d="M11 2.5V6.5h4M7.5 11h5M7.5 14h3" /></g> },
  { id: 'pdf-create', name: 'PDF Creator', desc: 'Generate a polished PDF document', icon: <g {...TS}><path d="M5 2.5h6L15 6.5V17.5H5z" /><path d="M11 2.5V6.5h4M10 9.5v4M8 11.5h4" /></g> },
  { id: 'doc-read', name: 'Document Reader', desc: 'Read Word, text, and rich docs', icon: <g {...TS}><rect x="4" y="2.5" width="12" height="15" rx="1.5" /><path d="M7 6.5h6M7 9.5h6M7 12.5h4" /></g> },
  { id: 'sheet-read', name: 'Spreadsheet Reader', desc: 'Read Excel and CSV data', icon: <g {...TS}><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><path d="M2.5 8h15M8 3.5v13" /></g> },
  { id: 'csv', name: 'CSV Parser', desc: 'Parse and transform CSV files', icon: <g {...TS}><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><path d="M2.5 8h15M2.5 12h15M11 3.5v13" /></g> },
  { id: 'code', name: 'Code Interpreter', desc: 'Run Python to compute and analyze', icon: <g {...TS}><path d="M7 6l-3.5 4L7 14M13 6l3.5 4L13 14" /></g> },
  { id: 'calc', name: 'Calculator', desc: 'Evaluate math expressions', icon: <g {...TS}><rect x="4.5" y="2.5" width="11" height="15" rx="1.5" /><path d="M7 6h6M7.5 10h.01M10 10h.01M12.5 10h.01M7.5 13h.01M10 13h.01M12.5 13h.01" /></g> },
  { id: 'ocr', name: 'Image Reader (OCR)', desc: 'Extract text from images', icon: <g {...TS}><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><path d="M2.5 13l4-4 3 3 3-3 4.5 4.5" /><circle cx="7" cy="7.5" r="1.2" /></g> },
  { id: 'img-gen', name: 'Image Generator', desc: 'Create images from a prompt', icon: <g {...TS}><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><path d="M14 3l.6 1.6L16.2 5l-1.6.6L14 7l-.6-1.4L11.8 5l1.6-.4L14 3z" /><path d="M2.5 13l4-4 3 3" /></g> },
  { id: 'summarize', name: 'Summarizer', desc: 'Condense long text into a brief', icon: <g {...TS}><path d="M3.5 4.5h13M3.5 8h13M3.5 11.5h9M3.5 15h6" /></g> },
  { id: 'sentiment', name: 'Sentiment Analyzer', desc: 'Gauge tone and sentiment in text', icon: <g {...TS}><circle cx="10" cy="10" r="7.5" /><path d="M6.8 11.5s1.1 1.6 3.2 1.6 3.2-1.6 3.2-1.6" /><path d="M7.4 7.6h.01M12.6 7.6h.01" /></g> },
  { id: 'json', name: 'JSON Formatter', desc: 'Parse, query, and format JSON', icon: <g {...TS}><path d="M7.5 3.5C5.5 3.5 6 7 4 10c2 3 1.5 6.5 3.5 6.5M12.5 3.5c2 0 1.5 3.5 3.5 6.5-2 3-1.5 6.5-3.5 6.5" /></g> },
  { id: 'regex', name: 'Regex Extractor', desc: 'Extract patterns from text', icon: <g {...TS}><path d="M10 4v6M7.4 5.5l5.2 3M12.6 5.5l-5.2 3M5 15h.01" /></g> },
  { id: 'kb-search', name: 'Knowledge Search', desc: 'Search your knowledge base (RAG)', icon: <g {...TS}><path d="M4 3.5h7a1.5 1.5 0 011.5 1.5v8.5a1.5 1.5 0 00-1.5-1.5H4z" /><circle cx="14" cy="12.5" r="2.4" /><path d="M15.8 14.3l1.7 1.7" /></g> },
  { id: 'vector', name: 'Vector Search', desc: 'Semantic similarity search', icon: <g {...TS}><circle cx="5" cy="5" r="1.8" /><circle cx="15" cy="6" r="1.8" /><circle cx="10" cy="14" r="1.8" /><path d="M6.5 6l7 .5M6 6.5l3 6M13.8 7.4l-3 5.4" /></g> },
  { id: 'file-write', name: 'File Writer', desc: 'Create and save output files', icon: <g {...TS}><path d="M5 2.5h6L15 6.5V17.5H5z" /><path d="M11 2.5V6.5h4M9.5 13l1.5-.4 3-3-1.1-1.1-3 3z" /></g> },
  { id: 'http', name: 'HTTP Request', desc: 'Call an external REST API', icon: <g {...TS}><circle cx="10" cy="10" r="7.5" /><path d="M2.5 10h15M6 6h8M6 14h8" /></g> },
  { id: 'chart', name: 'Chart Generator', desc: 'Render charts from data', icon: <g {...TS}><path d="M3.5 3v13a1 1 0 001 1h12" /><path d="M6.5 13V9M9.5 13V5M12.5 13v-6M15.5 13v-3" /></g> },
]

const APPS = [
  { id: 'gmail', name: 'Gmail', slug: 'gmail', desc: 'Send, read, and search email' },
  { id: 'discord', name: 'Discord', slug: 'discord', desc: 'Post and manage messages' },
  { id: 'telegram', name: 'Telegram', slug: 'telegram', desc: 'Send and receive messages' },
  { id: 'hubspot', name: 'HubSpot', slug: 'hubspot', desc: 'Manage contacts, deals, and marketing' },
  { id: 'pipedrive', name: 'Pipedrive', slug: 'pipedrive', desc: 'Read and update CRM records' },
  { id: 'notion', name: 'Notion', slug: 'notion', desc: 'Read and write pages and databases' },
  { id: 'jira', name: 'Jira', slug: 'jira', desc: 'Manage issues and sprints' },
  { id: 'confluence', name: 'Confluence', slug: 'confluence', desc: 'Read and update wiki pages' },
  { id: 'zendesk', name: 'Zendesk', slug: 'zendesk', desc: 'Create and update support tickets' },
  { id: 'intercom', name: 'Intercom', slug: 'intercom', desc: 'Message and support customers' },
  { id: 'calendly', name: 'Calendly', slug: 'calendly', desc: 'Schedule and manage meetings' },
  { id: 'gdrive', name: 'Google Drive', slug: 'googledrive', desc: 'Find, read, and manage files' },
  { id: 'gcal', name: 'Google Calendar', slug: 'googlecalendar', desc: 'Create and read events' },
  { id: 'gdocs', name: 'Google Docs', slug: 'googledocs', desc: 'Read and edit documents' },
  { id: 'gsheets', name: 'Google Sheets', slug: 'googlesheets', desc: 'Read and write spreadsheet data' },
  { id: 'github', name: 'GitHub', slug: 'github', desc: 'Manage repos, issues, and PRs' },
  { id: 'gitlab', name: 'GitLab', slug: 'gitlab', desc: 'Manage repos and merge requests' },
  { id: 'linear', name: 'Linear', slug: 'linear', desc: 'Create and track issues' },
  { id: 'asana', name: 'Asana', slug: 'asana', desc: 'Manage tasks and projects' },
  { id: 'trello', name: 'Trello', slug: 'trello', desc: 'Manage cards and boards' },
  { id: 'clickup', name: 'ClickUp', slug: 'clickup', desc: 'Manage tasks and docs' },
  { id: 'figma', name: 'Figma', slug: 'figma', desc: 'Read files, comments, and frames' },
  { id: 'dropbox', name: 'Dropbox', slug: 'dropbox', desc: 'Find and share files' },
  { id: 'stripe', name: 'Stripe', slug: 'stripe', desc: 'Read payments and customers' },
  { id: 'zoom', name: 'Zoom', slug: 'zoom', desc: 'Schedule meetings and fetch recordings' },
  { id: 'airtable', name: 'Airtable', slug: 'airtable', desc: 'Read and write base records' },
  { id: 'shopify', name: 'Shopify', slug: 'shopify', desc: 'Manage orders and products' },
  { id: 'mailchimp', name: 'Mailchimp', slug: 'mailchimp', desc: 'Manage campaigns and audiences' },
]

// logical grouping order for actions
const CAT_ORDER = ['Read', 'Write', 'Organize', 'Manage']

const GENERIC_ACTIONS = [
  { id: 'find', cat: 'Read', name: 'Find records', desc: 'Search items by criteria' },
  { id: 'get', cat: 'Read', name: 'Get record', desc: 'Fetch a single item by ID' },
  { id: 'list', cat: 'Read', name: 'List records', desc: 'Return a page of items' },
  { id: 'report', cat: 'Read', name: 'Run report', desc: 'Aggregate items into a summary' },
  { id: 'create', cat: 'Write', name: 'Create record', desc: 'Add a new item' },
  { id: 'update', cat: 'Write', name: 'Update record', desc: 'Modify an existing item' },
  { id: 'upsert', cat: 'Write', name: 'Upsert record', desc: 'Create or update by key' },
  { id: 'bulk', cat: 'Write', name: 'Bulk update', desc: 'Update many items at once' },
  { id: 'tag', cat: 'Organize', name: 'Add tag', desc: 'Tag an item for grouping' },
  { id: 'assign', cat: 'Organize', name: 'Assign owner', desc: 'Set the responsible user' },
  { id: 'delete', cat: 'Manage', name: 'Delete record', desc: 'Remove an item' },
  { id: 'export', cat: 'Manage', name: 'Export data', desc: 'Download items as a file' },
]

const ACTIONS = {
  gmail: [
    { id: 'search', cat: 'Read', name: 'Search emails', desc: 'Find emails matching a query' },
    { id: 'read', cat: 'Read', name: 'Read email', desc: 'Get the body of a message' },
    { id: 'list_threads', cat: 'Read', name: 'List threads', desc: 'Return recent conversation threads' },
    { id: 'get_attach', cat: 'Read', name: 'Get attachment', desc: 'Download a file from a message' },
    { id: 'list_labels', cat: 'Read', name: 'List labels', desc: 'Return all labels in the mailbox' },
    { id: 'send', cat: 'Write', name: 'Send email', desc: 'Compose and send a new email' },
    { id: 'reply', cat: 'Write', name: 'Reply to email', desc: 'Respond within a thread' },
    { id: 'forward', cat: 'Write', name: 'Forward email', desc: 'Send a message on to others' },
    { id: 'draft', cat: 'Write', name: 'Create draft', desc: 'Save a draft without sending' },
    { id: 'send_draft', cat: 'Write', name: 'Send draft', desc: 'Send an existing draft' },
    { id: 'label', cat: 'Organize', name: 'Add label', desc: 'Apply a label to a thread' },
    { id: 'unlabel', cat: 'Organize', name: 'Remove label', desc: 'Strip a label from a thread' },
    { id: 'read_mark', cat: 'Organize', name: 'Mark as read', desc: 'Clear the unread flag' },
    { id: 'star', cat: 'Organize', name: 'Star email', desc: 'Flag a message as important' },
    { id: 'archive', cat: 'Organize', name: 'Archive email', desc: 'Remove from the inbox' },
    { id: 'create_label', cat: 'Manage', name: 'Create label', desc: 'Add a new mailbox label' },
    { id: 'create_filter', cat: 'Manage', name: 'Create filter', desc: 'Auto-sort incoming mail' },
    { id: 'trash', cat: 'Manage', name: 'Move to trash', desc: 'Delete a message' },
  ],
  gcal: [
    { id: 'find_event', cat: 'Read', name: 'Find events', desc: 'List events in a range' },
    { id: 'get_event', cat: 'Read', name: 'Get event', desc: 'Fetch one event by ID' },
    { id: 'free_busy', cat: 'Read', name: 'Check availability', desc: 'Find free/busy time' },
    { id: 'list_cal', cat: 'Read', name: 'List calendars', desc: 'Return all calendars' },
    { id: 'suggest', cat: 'Read', name: 'Suggest a time', desc: 'Find an open slot for attendees' },
    { id: 'create_event', cat: 'Write', name: 'Create event', desc: 'Add an event to a calendar' },
    { id: 'quick_add', cat: 'Write', name: 'Quick add', desc: 'Create an event from text' },
    { id: 'update_event', cat: 'Write', name: 'Update event', desc: 'Change time or details' },
    { id: 'respond', cat: 'Write', name: 'Respond to invite', desc: 'Accept, decline, or tentative' },
    { id: 'add_guest', cat: 'Organize', name: 'Add guest', desc: 'Invite an attendee' },
    { id: 'move_event', cat: 'Organize', name: 'Move event', desc: 'Reassign to another calendar' },
    { id: 'set_remind', cat: 'Organize', name: 'Set reminder', desc: 'Add a notification' },
    { id: 'del_event', cat: 'Manage', name: 'Delete event', desc: 'Remove an event' },
    { id: 'create_cal', cat: 'Manage', name: 'Create calendar', desc: 'Add a new calendar' },
  ],
  slack: [
    { id: 'search_msg', cat: 'Read', name: 'Search messages', desc: 'Find messages by query' },
    { id: 'get_thread', cat: 'Read', name: 'Get thread', desc: 'Read a conversation thread' },
    { id: 'list_ch', cat: 'Read', name: 'List channels', desc: 'Return all channels' },
    { id: 'get_user', cat: 'Read', name: 'Get user', desc: 'Look up a member profile' },
    { id: 'send_msg', cat: 'Write', name: 'Send message', desc: 'Post to a channel' },
    { id: 'dm', cat: 'Write', name: 'Send DM', desc: 'Message a person directly' },
    { id: 'reply_thread', cat: 'Write', name: 'Reply in thread', desc: 'Respond within a thread' },
    { id: 'update_msg', cat: 'Write', name: 'Update message', desc: 'Edit a posted message' },
    { id: 'upload', cat: 'Write', name: 'Upload file', desc: 'Share a file to a channel' },
    { id: 'react', cat: 'Organize', name: 'Add reaction', desc: 'React with an emoji' },
    { id: 'pin', cat: 'Organize', name: 'Pin message', desc: 'Pin to the channel' },
    { id: 'invite', cat: 'Organize', name: 'Invite to channel', desc: 'Add a member' },
    { id: 'create_ch', cat: 'Manage', name: 'Create channel', desc: 'Open a new channel' },
    { id: 'archive_ch', cat: 'Manage', name: 'Archive channel', desc: 'Close a channel' },
    { id: 'del_msg', cat: 'Manage', name: 'Delete message', desc: 'Remove a message' },
  ],
  salesforce: [
    { id: 'soql', cat: 'Read', name: 'Run SOQL query', desc: 'Query records with SOQL' },
    { id: 'get_rec', cat: 'Read', name: 'Get record', desc: 'Fetch a record by ID' },
    { id: 'find_contact', cat: 'Read', name: 'Find contact', desc: 'Search contacts' },
    { id: 'find_opp', cat: 'Read', name: 'Find opportunity', desc: 'Search the pipeline' },
    { id: 'report', cat: 'Read', name: 'Run report', desc: 'Execute a saved report' },
    { id: 'create_lead', cat: 'Write', name: 'Create lead', desc: 'Add a new lead' },
    { id: 'create_opp', cat: 'Write', name: 'Create opportunity', desc: 'Open a new deal' },
    { id: 'update_rec', cat: 'Write', name: 'Update record', desc: 'Modify any object' },
    { id: 'upsert_rec', cat: 'Write', name: 'Upsert record', desc: 'Create or update by key' },
    { id: 'log_activity', cat: 'Write', name: 'Log activity', desc: 'Record a call or task' },
    { id: 'convert_lead', cat: 'Organize', name: 'Convert lead', desc: 'Promote to contact + deal' },
    { id: 'assign_owner', cat: 'Organize', name: 'Assign owner', desc: 'Set the record owner' },
    { id: 'add_campaign', cat: 'Organize', name: 'Add to campaign', desc: 'Link to a campaign' },
    { id: 'del_rec', cat: 'Manage', name: 'Delete record', desc: 'Remove a record' },
    { id: 'bulk_load', cat: 'Manage', name: 'Bulk import', desc: 'Load many records at once' },
  ],
  hubspot: [
    { id: 'find_contact', cat: 'Read', name: 'Find contact', desc: 'Search contacts' },
    { id: 'get_deal', cat: 'Read', name: 'Get deal', desc: 'Fetch a deal by ID' },
    { id: 'list_deals', cat: 'Read', name: 'List deals', desc: 'Return pipeline deals' },
    { id: 'report', cat: 'Read', name: 'Run report', desc: 'Summarize CRM data' },
    { id: 'create_contact', cat: 'Write', name: 'Create contact', desc: 'Add a new contact' },
    { id: 'update_contact', cat: 'Write', name: 'Update contact', desc: 'Edit contact fields' },
    { id: 'create_deal', cat: 'Write', name: 'Create deal', desc: 'Open a new deal' },
    { id: 'update_deal', cat: 'Write', name: 'Update deal', desc: 'Change stage or amount' },
    { id: 'log_note', cat: 'Write', name: 'Log note', desc: 'Add a note to a record' },
    { id: 'enroll', cat: 'Organize', name: 'Enroll in sequence', desc: 'Start an outreach sequence' },
    { id: 'add_list', cat: 'Organize', name: 'Add to list', desc: 'Place in a static list' },
    { id: 'assign', cat: 'Organize', name: 'Assign owner', desc: 'Set the deal owner' },
    { id: 'del', cat: 'Manage', name: 'Delete record', desc: 'Remove a record' },
  ],
  notion: [
    { id: 'query_db', cat: 'Read', name: 'Query database', desc: 'Filter and read database rows' },
    { id: 'get_page', cat: 'Read', name: 'Get page', desc: 'Read a page and its content' },
    { id: 'search', cat: 'Read', name: 'Search workspace', desc: 'Find pages and databases' },
    { id: 'list_users', cat: 'Read', name: 'List members', desc: 'Return workspace members' },
    { id: 'create_page', cat: 'Write', name: 'Create page', desc: 'Add a new page' },
    { id: 'update_page', cat: 'Write', name: 'Update page', desc: 'Edit an existing page' },
    { id: 'append', cat: 'Write', name: 'Append blocks', desc: 'Add content to a page' },
    { id: 'add_row', cat: 'Write', name: 'Add database row', desc: 'Insert a new entry' },
    { id: 'update_props', cat: 'Organize', name: 'Update properties', desc: 'Set status, tags, fields' },
    { id: 'move_page', cat: 'Organize', name: 'Move page', desc: 'Reparent under another page' },
    { id: 'create_db', cat: 'Manage', name: 'Create database', desc: 'Add a new database' },
    { id: 'archive', cat: 'Manage', name: 'Archive page', desc: 'Remove from the workspace' },
  ],
  jira: [
    { id: 'search_issue', cat: 'Read', name: 'Search issues', desc: 'Find issues with JQL' },
    { id: 'get_issue', cat: 'Read', name: 'Get issue', desc: 'Fetch an issue by key' },
    { id: 'list_sprints', cat: 'Read', name: 'List sprints', desc: 'Return board sprints' },
    { id: 'get_board', cat: 'Read', name: 'Get board', desc: 'Read a board and its columns' },
    { id: 'create_issue', cat: 'Write', name: 'Create issue', desc: 'Open a new issue or task' },
    { id: 'update_issue', cat: 'Write', name: 'Update issue', desc: 'Change fields or summary' },
    { id: 'comment', cat: 'Write', name: 'Add comment', desc: 'Comment on an issue' },
    { id: 'log_work', cat: 'Write', name: 'Log work', desc: 'Record time spent' },
    { id: 'transition', cat: 'Organize', name: 'Transition status', desc: 'Move across the workflow' },
    { id: 'assign', cat: 'Organize', name: 'Assign issue', desc: 'Set the assignee' },
    { id: 'add_sprint', cat: 'Organize', name: 'Add to sprint', desc: 'Schedule into a sprint' },
    { id: 'link', cat: 'Organize', name: 'Link issues', desc: 'Connect related issues' },
    { id: 'del_issue', cat: 'Manage', name: 'Delete issue', desc: 'Remove an issue' },
  ],
  github: [
    { id: 'search_repo', cat: 'Read', name: 'Search code', desc: 'Find code across repos' },
    { id: 'get_pr', cat: 'Read', name: 'Get pull request', desc: 'Read a PR and its diff' },
    { id: 'list_issues', cat: 'Read', name: 'List issues', desc: 'Return repo issues' },
    { id: 'get_file', cat: 'Read', name: 'Get file', desc: 'Read a file from a repo' },
    { id: 'create_issue', cat: 'Write', name: 'Create issue', desc: 'Open a new issue' },
    { id: 'create_pr', cat: 'Write', name: 'Create pull request', desc: 'Open a new PR' },
    { id: 'comment_pr', cat: 'Write', name: 'Comment on PR', desc: 'Add a review comment' },
    { id: 'commit', cat: 'Write', name: 'Commit file', desc: 'Create or update a file' },
    { id: 'merge_pr', cat: 'Organize', name: 'Merge pull request', desc: 'Merge an approved PR' },
    { id: 'label_issue', cat: 'Organize', name: 'Label issue', desc: 'Apply labels' },
    { id: 'assign_issue', cat: 'Organize', name: 'Assign issue', desc: 'Set the assignee' },
    { id: 'close_issue', cat: 'Manage', name: 'Close issue', desc: 'Mark an issue resolved' },
    { id: 'create_branch', cat: 'Manage', name: 'Create branch', desc: 'Branch off a ref' },
  ],
  zendesk: [
    { id: 'search', cat: 'Read', name: 'Search tickets', desc: 'Find tickets by query' },
    { id: 'get_ticket', cat: 'Read', name: 'Get ticket', desc: 'Fetch a ticket by ID' },
    { id: 'list_views', cat: 'Read', name: 'List views', desc: 'Return saved views' },
    { id: 'get_user', cat: 'Read', name: 'Get requester', desc: 'Look up a user' },
    { id: 'create', cat: 'Write', name: 'Create ticket', desc: 'Open a new support ticket' },
    { id: 'update', cat: 'Write', name: 'Update ticket', desc: 'Change status or fields' },
    { id: 'comment', cat: 'Write', name: 'Add comment', desc: 'Reply on a ticket' },
    { id: 'macro', cat: 'Write', name: 'Apply macro', desc: 'Run a canned response' },
    { id: 'tag', cat: 'Organize', name: 'Add tags', desc: 'Tag a ticket' },
    { id: 'assign', cat: 'Organize', name: 'Assign agent', desc: 'Route to an agent' },
    { id: 'priority', cat: 'Organize', name: 'Set priority', desc: 'Change urgency' },
    { id: 'merge', cat: 'Manage', name: 'Merge tickets', desc: 'Combine duplicates' },
    { id: 'close', cat: 'Manage', name: 'Close ticket', desc: 'Mark as solved' },
  ],
}

const inputStyle = { width: '100%', height: 40, border: '1px solid #e6ddca', borderRadius: 10, padding: '0 12px', fontSize: 13.5, color: '#3a3a36', background: '#fff', outline: 'none' }

export default function AddToolPanel({ onClose, onAdd }) {
  const [tab, setTab] = useState('tools')      // tools | apps
  const [step, setStep] = useState('app')      // app | action | config (apps tab only)
  const [app, setApp] = useState(null)
  const [action, setAction] = useState(null)
  const [q, setQ] = useState('')
  const [headerHov, setHeaderHov] = useState(false)
  const [picked, setPicked] = useState(() => new Set())

  const inFlow = tab === 'apps' && step !== 'app'   // inside an app's action/config flow
  const tools = TOOLS.filter(t => t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase()))
  const apps = APPS.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))
  const actions = (app ? ACTIONS[app.id] || GENERIC_ACTIONS : []).filter(a => a.name.toLowerCase().includes(q.toLowerCase()))

  const switchTab = (t) => { setTab(t); setStep('app'); setApp(null); setAction(null); setQ('') }
  const pickApp = (a) => { setApp(a); setAction(null); setStep('action'); setQ('') }
  const pickAction = (ac) => { setAction(ac); setStep('config') }
  const addApp = () => { onAdd?.({ app, action }); onClose?.() }
  const toggleTool = (t) => setPicked(p => { const n = new Set(p); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })
  const addPicked = () => { if (!picked.size) return; TOOLS.filter(t => picked.has(t.id)).forEach(t => onAdd?.({ app: { name: 'Built-in tool', slug: '__builtin', icon: t.icon }, action: { name: t.name }, builtin: true })); onClose?.() }

  const title = tab === 'tools' ? 'Add a tool'
    : step === 'app' ? 'Add a tool'
    : step === 'action' ? `Select an action for ${app.name}` : 'Configure tool'

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(28,24,18,0.30)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 520, maxWidth: '94vw', height: '100%', background: '#FEFDFB', borderLeft: '1px solid #ece5d7', boxShadow: '-18px 0 60px rgba(40,32,18,0.22)', display: 'flex', flexDirection: 'column', animation: 'toolSlide .22s cubic-bezier(.4,0,.2,1)' }}>

        {/* Header */}
        <div onMouseEnter={() => setHeaderHov(true)} onMouseLeave={() => setHeaderHov(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid #f2ede3', flexShrink: 0 }}>
          {(() => {
            const showBack = inFlow && headerHov
            return (
              <span onClick={inFlow ? () => { setStep(step === 'config' ? 'action' : 'app'); setQ('') } : undefined}
                title={inFlow ? 'Back' : undefined}
                style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, background: showBack ? '#f5f1e8' : (app ? '#fff' : tab === 'tools' ? '#f3ecdd' : '#fbe9d9'), border: '1px solid', borderColor: showBack ? '#e0d8c6' : (tab === 'tools' ? '#e6dcc4' : '#efe3d2'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: inFlow ? 'pointer' : 'default', transition: 'background .15s, border-color .15s' }}>
                {showBack
                  ? <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="#6b6453" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : app ? <ToolGlyph slug={app.slug} name={app.name} size={22} />
                    : tab === 'tools'
                      ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 2.5a4 4 0 00-4.7 5.2l-4.9 4.9a1.6 1.6 0 102.3 2.3l4.9-4.9A4 4 0 1012.5 2.5z" stroke="#8a7648" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                      : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="#d97b3a" strokeWidth="1.5" /><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="#d97b3a" strokeWidth="1.5" /><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="#d97b3a" strokeWidth="1.5" /><path d="M14.5 12v5M12 14.5h5" stroke="#d97b3a" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </span>
            )
          })()}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {step === 'config' && <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 1 }}>{action.name} · {app.name}</div>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#9a917f', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Tabs — only at the top level (hidden inside an app flow) */}
        {!inFlow && (
          <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', background: '#f2f1ee', borderRadius: 11, padding: 4, gap: 2 }}>
              {[['tools', 'Utilities'], ['apps', 'Applications']].map(([id, label]) => (
                <button key={id} onClick={() => switchTab(id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5,
                  background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#1a1a1a' : '#6b6b66', fontWeight: tab === id ? 500 : 400,
                  boxShadow: tab === id ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' : 'none', transition: 'all .15s',
                }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          {/* search */}
          {step !== 'config' && (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="7" cy="7" r="4.5" stroke="#a89e88" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" /></svg>
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'tools' ? 'Search tools' : step === 'app' ? 'Search apps' : 'Search actions'}
                style={{ width: '100%', height: 42, border: '1px solid #ece5d7', borderRadius: 11, padding: '0 14px 0 36px', fontSize: 13.5, color: '#3a3a36', background: '#faf7f0', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#ece5d7'} />
            </div>
          )}

          {/* TOOLS tab — instant add */}
          {tab === 'tools' && (
            <div style={{ border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
              {tools.map((t, i) => {
                const on = picked.has(t.id)
                return (
                <div key={t.id} onClick={() => toggleTool(t)}
                  onMouseOver={e => { if (!on) e.currentTarget.style.background = '#faf7f0' }} onMouseOut={e => { if (!on) e.currentTarget.style.background = '#fff' }}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px', cursor: 'pointer', borderBottom: i < tools.length - 1 ? '1px solid #f4eee2' : 'none', background: on ? '#f6f2ea' : '#fff', transition: 'background .12s' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">{t.icon}</svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: on ? '#16341f' : '#f1ede4', border: '1px solid', borderColor: on ? '#16341f' : '#e6dfd1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
                    {on
                      ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2l3 3L11.5 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a7d6a" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                  </span>
                </div>
              )})}
              {tools.length === 0 && <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No tools found.</div>}
            </div>
          )}

          {/* APPS tab — app list (flat) */}
          {tab === 'apps' && step === 'app' && (
            <div style={{ border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
              {apps.map((item, i, arr) => (
                <div key={item.id} onClick={() => pickApp(item)}
                  onMouseOver={e => e.currentTarget.style.background = '#faf7f0'} onMouseOut={e => e.currentTarget.style.background = '#fff'}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid #f4eee2' : 'none', transition: 'background .12s' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ToolGlyph slug={item.slug} name={item.name} size={20} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{item.name}</div>
                    <div style={{ fontSize: 12.5, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M6 3.5L10.5 8 6 12.5" stroke="#c9c0ac" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ))}
              {apps.length === 0 && <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No matches found.</div>}
            </div>
          )}

          {/* APPS tab — action list, grouped by category */}
          {tab === 'apps' && step === 'action' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CAT_ORDER.filter(cat => actions.some(a => a.cat === cat)).map(cat => {
                const items = actions.filter(a => a.cat === cat)
                return (
                  <div key={cat}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#a89e88', padding: '0 2px 7px' }}>{cat}</div>
                    <div style={{ border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
                      {items.map((item, i) => (
                        <div key={item.id} onClick={() => pickAction(item)}
                          onMouseOver={e => e.currentTarget.style.background = '#faf7f0'} onMouseOut={e => e.currentTarget.style.background = '#fff'}
                          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 15px', cursor: 'pointer', borderBottom: i < items.length - 1 ? '1px solid #f4eee2' : 'none', transition: 'background .12s' }}>
                          <span style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ToolGlyph slug={app.slug} name={app.name} size={18} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                          </div>
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M6 3.5L10.5 8 6 12.5" stroke="#c9c0ac" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {actions.length === 0 && <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No matches found.</div>}
            </div>
          )}

          {/* Config step (apps) */}
          {tab === 'apps' && step === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ border: '1px solid #eee7da', borderRadius: 12, background: '#faf7f0', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ToolGlyph slug={app.slug} name={app.name} size={18} /></span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2a2620' }}>{action.name}</div>
                  <div style={{ fontSize: 12.5, color: '#8a8170', marginTop: 2, lineHeight: 1.45 }}>{action.desc}. The agent will run this action with the inputs below.</div>
                </div>
              </div>
              <Field label="Connection"><div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8 }}><ToolGlyph slug={app.slug} name={app.name} size={16} /><span style={{ flex: 1 }}>{app.name} · default workspace</span><span style={{ fontSize: 11, color: '#1f7a40', background: '#e9f4ec', padding: '2px 8px', borderRadius: 5 }}>Connected</span></div></Field>
              <Field label="Input"><input placeholder={`What should "${action.name}" use?`} style={inputStyle} /></Field>
            </div>
          )}
        </div>

        {/* Footer — tools multi-select */}
        {tab === 'tools' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: picked.size ? '#3a3a36' : '#9a917f' }}>{picked.size ? `${picked.size} selected` : 'No tools selected'}</span>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            <button onClick={addPicked} disabled={!picked.size} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: picked.size ? 'pointer' : 'default', opacity: picked.size ? 1 : 0.45 }}
              onMouseOver={e => { if (picked.size) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (picked.size) e.currentTarget.style.background = '#16341f' }}>
              {picked.size ? `Add ${picked.size} tool${picked.size > 1 ? 's' : ''}` : 'Add tools'}
            </button>
          </div>
        )}

        {/* Footer (apps config only) */}
        {tab === 'apps' && step === 'config' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <button onClick={() => setStep('action')} style={{ height: 38, padding: '0 16px', background: '#fff', color: '#3a3a36', border: '1px solid #e3ddd1', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Back</button>
            <button onClick={addApp} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>Add tool</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  )
}

export { ToolGlyph }
