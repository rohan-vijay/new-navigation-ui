import { useState, useRef, useEffect, useCallback } from 'react'

/* ════════════════════════════════════════════════════════════════════
   ChargePoint Network Graph — enterprise Context Graph demo
   "The art of the possible": run the core EV-charging business on a graph.
   ════════════════════════════════════════════════════════════════════ */

const CP_ORANGE = '#F4801F'

const CAT = {
  network:  { color: '#2f6fdb', label: 'Network' },
  energy:   { color: '#0f8a5f', label: 'Energy' },
  commerce: { color: '#8a6d1f', label: 'Commerce' },
  service:  { color: '#c2543a', label: 'Service' },
  people:   { color: '#6b7280', label: 'People' },
  derived:  { color: '#7c3aed', label: 'Derived' },
}

/* ── ENTITIES (31) ─────────────────────────────────────────────────── */

const ENTITIES = [
  /* network */
  { id: 'station', label: 'Charging Station', cat: 'network',
    desc: 'A physical charging unit on the network — Level 2 or DC fast. The operational heart of the graph.',
    props: [
      { name: 'station_id', type: 'string', pk: true },
      { name: 'model', type: 'enum · CT4000 / CP6000 / Express 250 / Express Plus' },
      { name: 'serial_no', type: 'string' },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'commissioned_at', type: 'date' },
      { name: 'network_status', type: 'enum · online / degraded / offline' },
      { name: 'last_heartbeat', type: 'timestamp' },
      { name: 'firmware_version', type: 'string' },
      { name: 'connectivity', type: 'enum · cellular / ethernet' },
      { name: 'power_capacity_kw', type: 'number' },
      { name: 'nevi_funded', type: 'boolean' },
    ] },
  { id: 'port', label: 'Charging Port', cat: 'network',
    desc: 'An individually addressable charging position on a station. The unit of uptime accounting.',
    props: [
      { name: 'port_id', type: 'string', pk: true },
      { name: 'station_id', type: 'ref · Charging Station' },
      { name: 'port_number', type: 'int' },
      { name: 'connector_type', type: 'enum · CCS1 / NACS / CHAdeMO / J1772' },
      { name: 'max_kw', type: 'number' },
      { name: 'status', type: 'enum · available / charging / faulted / reserved' },
      { name: 'ocpp_status', type: 'enum · OCPP 1.6-J status notification' },
      { name: 'last_session_at', type: 'timestamp' },
      { name: 'lifetime_kwh', type: 'number' },
      { name: 'error_count_30d', type: 'int' },
    ] },
  { id: 'connector', label: 'Connector', cat: 'network',
    desc: 'The physical cable + plug assembly on a port; tracked for wear and inspection.',
    props: [
      { name: 'connector_id', type: 'string', pk: true },
      { name: 'port_id', type: 'ref · Charging Port' },
      { name: 'standard', type: 'enum · CCS1 / NACS / CHAdeMO / J1772' },
      { name: 'cable_length_m', type: 'number' },
      { name: 'rated_amps', type: 'int' },
      { name: 'insertion_count', type: 'int' },
      { name: 'last_inspected_at', type: 'date' },
    ] },
  { id: 'site', label: 'Site', cat: 'network',
    desc: 'A physical location hosting stations — parking garage, retail lot, fleet depot, highway plaza.',
    props: [
      { name: 'site_id', type: 'string', pk: true },
      { name: 'name', type: 'string' },
      { name: 'address', type: 'string' },
      { name: 'lat', type: 'number' },
      { name: 'lng', type: 'number' },
      { name: 'host_org_id', type: 'ref · Organization' },
      { name: 'access_type', type: 'enum · public / private / fleet' },
      { name: 'stall_count', type: 'int' },
      { name: 'utility_id', type: 'ref · Utility' },
      { name: 'timezone', type: 'string' },
      { name: 'opened_at', type: 'date' },
    ] },
  { id: 'circuit', label: 'Power Circuit', cat: 'network',
    desc: 'Electrical circuit feeding a group of stations; the constraint that load management works against.',
    props: [
      { name: 'circuit_id', type: 'string', pk: true },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'panel_id', type: 'string' },
      { name: 'rated_amps', type: 'int' },
      { name: 'voltage', type: 'int' },
      { name: 'breaker_status', type: 'enum · closed / open / tripped' },
      { name: 'peak_load_kw', type: 'number' },
      { name: 'load_policy_id', type: 'ref · Load Policy' },
    ] },
  { id: 'gateway', label: 'Network Gateway', cat: 'network',
    desc: 'Cellular / ethernet uplink hardware connecting stations to the NOS cloud.',
    props: [
      { name: 'gateway_id', type: 'string', pk: true },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'carrier', type: 'string' },
      { name: 'sim_iccid', type: 'string' },
      { name: 'signal_rssi', type: 'int' },
      { name: 'uptime_pct_30d', type: 'number' },
      { name: 'last_seen', type: 'timestamp' },
    ] },
  { id: 'firmware', label: 'Firmware Build', cat: 'network',
    desc: 'A versioned firmware release; rollout state per model is tracked across the fleet.',
    props: [
      { name: 'build_id', type: 'string', pk: true },
      { name: 'version', type: 'string' },
      { name: 'channel', type: 'enum · stable / beta / canary' },
      { name: 'released_at', type: 'date' },
      { name: 'target_models', type: 'array<string>' },
      { name: 'rollout_pct', type: 'number' },
      { name: 'critical_fix', type: 'boolean' },
      { name: 'known_issue_codes', type: 'array<string>' },
    ] },

  /* energy */
  { id: 'utility', label: 'Utility', cat: 'energy',
    desc: 'The electric utility serving a site; source of tariffs, interconnection and DR programs.',
    props: [
      { name: 'utility_id', type: 'string', pk: true },
      { name: 'name', type: 'string' },
      { name: 'iso_region', type: 'enum · CAISO / ERCOT / PJM / MISO / NYISO' },
      { name: 'service_territory', type: 'string' },
      { name: 'dr_program_available', type: 'boolean' },
      { name: 'interconnection_contact', type: 'string' },
      { name: 'tariff_count', type: 'int' },
    ] },
  { id: 'tariff', label: 'Tariff Plan', cat: 'energy',
    desc: 'A utility rate schedule — TOU windows, demand charges — synced from Genability.',
    props: [
      { name: 'tariff_id', type: 'string', pk: true },
      { name: 'utility_id', type: 'ref · Utility' },
      { name: 'name', type: 'string' },
      { name: 'rate_type', type: 'enum · TOU / tiered / flat' },
      { name: 'peak_rate_kwh', type: 'number' },
      { name: 'offpeak_rate_kwh', type: 'number' },
      { name: 'demand_charge_kw', type: 'number' },
      { name: 'effective_from', type: 'date' },
      { name: 'expires_at', type: 'date' },
    ] },
  { id: 'esession', label: 'Energy Session', cat: 'energy',
    desc: 'The metered energy view of a charging session — meter values, cost, carbon.',
    props: [
      { name: 'energy_session_id', type: 'string', pk: true },
      { name: 'charging_session_id', type: 'ref · Charging Session' },
      { name: 'meter_start_wh', type: 'number' },
      { name: 'meter_end_wh', type: 'number' },
      { name: 'kwh', type: 'number' },
      { name: 'avg_kw', type: 'number' },
      { name: 'peak_kw', type: 'number' },
      { name: 'tariff_id', type: 'ref · Tariff Plan' },
      { name: 'energy_cost_usd', type: 'number' },
      { name: 'carbon_g_per_kwh', type: 'number' },
    ] },
  { id: 'load', label: 'Load Policy', cat: 'energy',
    desc: 'Power-sharing rules across a circuit — caps, schedules, priorities. Rewritten nightly by the optimizer.',
    props: [
      { name: 'policy_id', type: 'string', pk: true },
      { name: 'circuit_id', type: 'ref · Power Circuit' },
      { name: 'mode', type: 'enum · round_robin / first_come / scheduled' },
      { name: 'cap_kw', type: 'number' },
      { name: 'schedule', type: 'json' },
      { name: 'dr_enabled', type: 'boolean' },
      { name: 'priority_rules', type: 'json' },
      { name: 'updated_at', type: 'timestamp' },
    ] },
  { id: 'dr', label: 'Demand Response Event', cat: 'energy',
    desc: 'A grid curtailment call from CAISO / ERCOT — sites shed load, hosts earn incentives.',
    props: [
      { name: 'event_id', type: 'string', pk: true },
      { name: 'iso', type: 'enum · CAISO / ERCOT / PJM' },
      { name: 'program', type: 'string' },
      { name: 'starts_at', type: 'timestamp' },
      { name: 'ends_at', type: 'timestamp' },
      { name: 'curtail_kw', type: 'number' },
      { name: 'incentive_usd', type: 'number' },
      { name: 'status', type: 'enum · scheduled / active / settled' },
      { name: 'sites_enrolled', type: 'int' },
    ] },
  { id: 'meter', label: 'Utility Meter', cat: 'energy',
    desc: 'Revenue-grade meter on a circuit; reconciles NOS energy data with the utility bill.',
    props: [
      { name: 'meter_id', type: 'string', pk: true },
      { name: 'circuit_id', type: 'ref · Power Circuit' },
      { name: 'meter_number', type: 'string' },
      { name: 'utility_id', type: 'ref · Utility' },
      { name: 'read_interval', type: 'enum · 15min / hourly' },
      { name: 'last_read_at', type: 'timestamp' },
      { name: 'last_read_kwh', type: 'number' },
      { name: 'net_metered', type: 'boolean' },
    ] },

  /* commerce */
  { id: 'driver', label: 'Driver', cat: 'commerce',
    desc: 'An EV driver with a ChargePoint account — the demand side of the network.',
    props: [
      { name: 'driver_id', type: 'string', pk: true },
      { name: 'email', type: 'string · PII' },
      { name: 'name', type: 'string · PII' },
      { name: 'home_region', type: 'string' },
      { name: 'joined_at', type: 'date' },
      { name: 'plan', type: 'enum · free / prepaid / fleet' },
      { name: 'sessions_90d', type: 'int' },
      { name: 'lifetime_kwh', type: 'number' },
      { name: 'default_payment_id', type: 'ref · Payment' },
    ] },
  { id: 'vehicle', label: 'Vehicle', cat: 'commerce',
    desc: 'An EV known to the graph — battery size, charge curve, fleet assignment, telematics feed.',
    props: [
      { name: 'vehicle_id', type: 'string', pk: true },
      { name: 'vin', type: 'string' },
      { name: 'make', type: 'string' },
      { name: 'model', type: 'string' },
      { name: 'battery_kwh', type: 'number' },
      { name: 'max_dc_kw', type: 'number' },
      { name: 'max_ac_kw', type: 'number' },
      { name: 'connector', type: 'enum · CCS1 / NACS / CHAdeMO' },
      { name: 'fleet_id', type: 'ref · Fleet Operator' },
      { name: 'telematics_id', type: 'string · Geotab' },
    ] },
  { id: 'fleet', label: 'Fleet Operator', cat: 'commerce',
    desc: 'A commercial fleet charging on managed depots — school buses, delivery vans, municipal fleets.',
    props: [
      { name: 'fleet_id', type: 'string', pk: true },
      { name: 'name', type: 'string' },
      { name: 'org_id', type: 'ref · Organization' },
      { name: 'vehicle_count', type: 'int' },
      { name: 'depot_site_ids', type: 'array<ref · Site>' },
      { name: 'ops_start_hour', type: 'int' },
      { name: 'sla_tier', type: 'enum · standard / assure' },
      { name: 'readiness_target_pct', type: 'number' },
    ] },
  { id: 'org', label: 'Organization', cat: 'commerce',
    desc: 'A B2B customer — site host, workplace, fleet parent. The commercial anchor entity.',
    props: [
      { name: 'org_id', type: 'string', pk: true },
      { name: 'name', type: 'string' },
      { name: 'segment', type: 'enum · workplace / retail / fleet / municipal' },
      { name: 'industry', type: 'string' },
      { name: 'billing_account', type: 'string · NetSuite' },
      { name: 'sites_hosted', type: 'int' },
      { name: 'ae_id', type: 'ref · Account Executive' },
      { name: 'contract_status', type: 'enum · active / renewal / churn_risk' },
      { name: 'arr_usd', type: 'number' },
    ] },
  { id: 'sub', label: 'Subscription', cat: 'commerce',
    desc: 'A recurring software / assure plan an organization pays for — Cloud, Assure, CPaaS.',
    props: [
      { name: 'subscription_id', type: 'string', pk: true },
      { name: 'org_id', type: 'ref · Organization' },
      { name: 'product', type: 'enum · Cloud / Assure / CPaaS' },
      { name: 'seats', type: 'int' },
      { name: 'term_months', type: 'int' },
      { name: 'starts_at', type: 'date' },
      { name: 'renews_at', type: 'date' },
      { name: 'mrr_usd', type: 'number' },
      { name: 'auto_renew', type: 'boolean' },
    ] },
  { id: 'csession', label: 'Charging Session', cat: 'commerce',
    desc: 'One plug-in-to-unplug event: energy, money, driver and hardware meet here. Central hub.',
    props: [
      { name: 'session_id', type: 'string', pk: true },
      { name: 'port_id', type: 'ref · Charging Port' },
      { name: 'driver_id', type: 'ref · Driver' },
      { name: 'vehicle_id', type: 'ref · Vehicle' },
      { name: 'start_at', type: 'timestamp' },
      { name: 'end_at', type: 'timestamp' },
      { name: 'kwh_delivered', type: 'number' },
      { name: 'peak_kw', type: 'number' },
      { name: 'cost_usd', type: 'number' },
      { name: 'payment_status', type: 'enum · captured / pending / failed / refunded' },
      { name: 'stop_reason', type: 'enum · driver / vehicle / fault / remote' },
      { name: 'roaming', type: 'boolean' },
    ] },
  { id: 'payment', label: 'Payment', cat: 'commerce',
    desc: 'A settled charge against a session or subscription, processed through Stripe.',
    props: [
      { name: 'payment_id', type: 'string', pk: true },
      { name: 'session_id', type: 'ref · Charging Session' },
      { name: 'driver_id', type: 'ref · Driver' },
      { name: 'amount_usd', type: 'number' },
      { name: 'method', type: 'enum · card / wallet / rfid / fleet_account' },
      { name: 'processor', type: 'string · Stripe' },
      { name: 'status', type: 'enum · captured / failed / refunded / disputed' },
      { name: 'captured_at', type: 'timestamp' },
      { name: 'refund_amount_usd', type: 'number' },
    ] },
  { id: 'roaming', label: 'Roaming Partner', cat: 'commerce',
    desc: 'An interop network (via Hubject / OCPI) whose drivers charge on ChargePoint hardware.',
    props: [
      { name: 'partner_id', type: 'string', pk: true },
      { name: 'name', type: 'string' },
      { name: 'protocol', type: 'enum · OCPI / OICP' },
      { name: 'country', type: 'string' },
      { name: 'settlement_currency', type: 'string' },
      { name: 'sessions_30d', type: 'int' },
      { name: 'revenue_share_pct', type: 'number' },
      { name: 'contract_ends', type: 'date' },
    ] },
  { id: 'price', label: 'Price Policy', cat: 'commerce',
    desc: 'What drivers pay at a site — per-kWh, per-minute, session fees, idle fees. Set by the host.',
    props: [
      { name: 'price_policy_id', type: 'string', pk: true },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'model', type: 'enum · per_kwh / per_min / session_fee / free' },
      { name: 'kwh_price_usd', type: 'number' },
      { name: 'min_price_usd', type: 'number' },
      { name: 'idle_fee_per_min', type: 'number' },
      { name: 'peak_multiplier', type: 'number' },
      { name: 'set_by_host', type: 'boolean' },
    ] },
  { id: 'waitlist', label: 'Waitlist Entry', cat: 'commerce',
    desc: 'A driver queued for a busy site — raw demand signal for expansion planning.',
    props: [
      { name: 'waitlist_id', type: 'string', pk: true },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'driver_id', type: 'ref · Driver' },
      { name: 'joined_at', type: 'timestamp' },
      { name: 'position', type: 'int' },
      { name: 'est_wait_min', type: 'int' },
      { name: 'converted_to_session', type: 'boolean' },
    ] },

  /* service */
  { id: 'fault', label: 'Fault Alert', cat: 'service',
    desc: 'An OCPP error or telemetry anomaly raised on a port — the trigger of the service loop.',
    props: [
      { name: 'alert_id', type: 'string', pk: true },
      { name: 'port_id', type: 'ref · Charging Port' },
      { name: 'code', type: 'string · OCPP error code' },
      { name: 'severity', type: 'enum · info / degraded / outage' },
      { name: 'raised_at', type: 'timestamp' },
      { name: 'cleared_at', type: 'timestamp' },
      { name: 'occurrences_7d', type: 'int' },
      { name: 'symptom', type: 'string' },
      { name: 'auto_diagnosed', type: 'boolean' },
    ] },
  { id: 'wo', label: 'Work Order', cat: 'service',
    desc: 'A dispatchable repair or maintenance job, mastered in ServiceNow, born in the graph.',
    props: [
      { name: 'work_order_id', type: 'string', pk: true },
      { name: 'alert_id', type: 'ref · Fault Alert' },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'priority', type: 'enum · P1 / P2 / P3 / P4' },
      { name: 'status', type: 'enum · open / scheduled / on_site / resolved' },
      { name: 'created_at', type: 'timestamp' },
      { name: 'sla_due_at', type: 'timestamp' },
      { name: 'technician_id', type: 'ref · Technician' },
      { name: 'parts_required', type: 'array<ref · Spare Part>' },
      { name: 'resolution_code', type: 'string' },
    ] },
  { id: 'tech', label: 'Technician', cat: 'service',
    desc: 'A field engineer (internal or partner) with skills, certifications and a territory.',
    props: [
      { name: 'technician_id', type: 'string', pk: true },
      { name: 'name', type: 'string · PII' },
      { name: 'region', type: 'string' },
      { name: 'certifications', type: 'array<string>' },
      { name: 'skill_tags', type: 'array<string>' },
      { name: 'home_base', type: 'string' },
      { name: 'open_orders', type: 'int' },
      { name: 'avg_fix_time_hrs', type: 'number' },
      { name: 'employer', type: 'enum · internal / partner' },
    ] },
  { id: 'part', label: 'Spare Part', cat: 'service',
    desc: 'Inventory for repairs — power modules, cables, screens — with stock and lead times.',
    props: [
      { name: 'part_id', type: 'string', pk: true },
      { name: 'sku', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'compatible_models', type: 'array<string>' },
      { name: 'stock_qty', type: 'int' },
      { name: 'warehouse', type: 'string' },
      { name: 'unit_cost_usd', type: 'number' },
      { name: 'lead_time_days', type: 'int' },
    ] },
  { id: 'warranty', label: 'Warranty Contract', cat: 'service',
    desc: 'An Assure or standard warranty covering a station — SLAs, response times, parts.',
    props: [
      { name: 'warranty_id', type: 'string', pk: true },
      { name: 'station_id', type: 'ref · Charging Station' },
      { name: 'tier', type: 'enum · Assure / Standard' },
      { name: 'starts_at', type: 'date' },
      { name: 'ends_at', type: 'date' },
      { name: 'sla_uptime_pct', type: 'number' },
      { name: 'response_hours', type: 'int' },
      { name: 'parts_included', type: 'boolean' },
      { name: 'annual_value_usd', type: 'number' },
    ] },
  { id: 'ticket', label: 'Support Ticket', cat: 'service',
    desc: 'A driver-facing issue in Zendesk — usually a failed session, billing dispute, or app problem.',
    props: [
      { name: 'ticket_id', type: 'string', pk: true },
      { name: 'driver_id', type: 'ref · Driver' },
      { name: 'session_id', type: 'ref · Charging Session' },
      { name: 'channel', type: 'enum · app / phone / email / chat' },
      { name: 'category', type: 'enum · failed_session / billing / access / app' },
      { name: 'opened_at', type: 'timestamp' },
      { name: 'status', type: 'enum · open / pending / solved' },
      { name: 'sentiment', type: 'enum · positive / neutral / negative' },
      { name: 'refund_issued', type: 'boolean' },
      { name: 'csat', type: 'int' },
    ] },

  /* people */
  { id: 'ae', label: 'Account Executive', cat: 'people',
    desc: 'The seller who owns the host relationship — quota, pipeline, renewals. Lives in Salesforce.',
    props: [
      { name: 'ae_id', type: 'string', pk: true },
      { name: 'name', type: 'string · PII' },
      { name: 'email', type: 'string · PII' },
      { name: 'territory', type: 'string' },
      { name: 'segment', type: 'enum · enterprise / mid_market / smb' },
      { name: 'quota_usd', type: 'number' },
      { name: 'open_pipeline_usd', type: 'number' },
      { name: 'org_count', type: 'int' },
    ] },
  { id: 'contact', label: 'Site Contact', cat: 'people',
    desc: 'The on-the-ground person at a host site — facilities manager, property ops, depot lead.',
    props: [
      { name: 'contact_id', type: 'string', pk: true },
      { name: 'site_id', type: 'ref · Site' },
      { name: 'name', type: 'string · PII' },
      { name: 'role', type: 'string' },
      { name: 'email', type: 'string · PII' },
      { name: 'phone', type: 'string · PII' },
      { name: 'notify_on', type: 'array · outage / maintenance / dr_event' },
      { name: 'escalation_order', type: 'int' },
    ] },
]

const E_BY_ID = Object.fromEntries(ENTITIES.map(e => [e.id, e]))
const LBL2ID = Object.fromEntries(ENTITIES.map(e => [e.label, e.id]))

/* ── SOURCES (14) ──────────────────────────────────────────────────── */

const SOURCES = [
  { id: 'nos', name: 'NOS Telemetry', vendor: 'ChargePoint NOS', kind: 'Streaming telemetry',
    objects: ['Charging Station', 'Charging Port', 'Charging Session', 'Energy Session', 'Fault Alert', 'Network Gateway'],
    freq: 'Streaming · OCPP', writesBack: false,
    desc: 'Heartbeats, meter values, status notifications and error codes from every port on the network, in real time.' },
  { id: 'sfdc', name: 'Salesforce', vendor: 'Salesforce', kind: 'CRM',
    objects: ['Organization', 'Account Executive', 'Site Contact', 'Subscription'],
    freq: 'Every 5 min', writesBack: true,
    desc: 'Accounts, opportunities, owners and contacts. Agents write proposals and renewal tasks back.' },
  { id: 'netsuite', name: 'NetSuite', vendor: 'Oracle NetSuite', kind: 'ERP & invoicing',
    objects: ['Organization', 'Subscription', 'Payment'],
    freq: 'Hourly', writesBack: false,
    desc: 'Billing accounts, invoices and revenue schedules reconciled against session-level payments.' },
  { id: 'stripe', name: 'Stripe', vendor: 'Stripe', kind: 'Payments',
    objects: ['Payment', 'Driver'],
    freq: 'Every 5 min', writesBack: true,
    desc: 'Driver payment captures, failures, disputes and refunds. Agents issue refunds through the API.' },
  { id: 'snow', name: 'ServiceNow', vendor: 'ServiceNow', kind: 'Field service',
    objects: ['Work Order', 'Technician', 'Spare Part', 'Fault Alert'],
    freq: 'Every 5 min', writesBack: true,
    desc: 'Work orders, dispatch state and parts logistics. The primary write-back target of the service agents.' },
  { id: 'zendesk', name: 'Zendesk', vendor: 'Zendesk', kind: 'Driver support',
    objects: ['Support Ticket', 'Driver'],
    freq: 'Every 5 min', writesBack: true,
    desc: 'Driver tickets and CSAT. Driver Care Agent drafts responses and resolves with full graph context.' },
  { id: 'hubject', name: 'Hubject', vendor: 'Hubject', kind: 'Roaming interop',
    objects: ['Roaming Partner', 'Charging Session'],
    freq: 'Hourly', writesBack: false,
    desc: 'OCPI roaming sessions and partner settlement records from the eRoaming platform.' },
  { id: 'genability', name: 'Genability', vendor: 'Arcadia Genability', kind: 'Utility tariff data',
    objects: ['Utility', 'Tariff Plan'],
    freq: 'Daily', writesBack: false,
    desc: 'Structured tariff schedules — TOU windows, demand charges — for every utility territory we operate in.' },
  { id: 'snowflake', name: 'Snowflake', vendor: 'Snowflake', kind: 'Analytics warehouse',
    objects: ['Charging Session', 'Energy Session', 'Waitlist Entry'],
    freq: 'Hourly', writesBack: false,
    desc: 'Historical sessions and demand aggregates feeding forecasting and expansion models.' },
  { id: 'workday', name: 'Workday', vendor: 'Workday', kind: 'HR / workforce',
    objects: ['Technician'],
    freq: 'Daily', writesBack: false,
    desc: 'Technician roster, certifications and territories for dispatch matching.' },
  { id: 'ota', name: 'Firmware OTA Registry', vendor: 'ChargePoint internal', kind: 'Release registry',
    objects: ['Firmware Build', 'Charging Station'],
    freq: 'Hourly', writesBack: false,
    desc: 'Build catalog and per-station rollout state for over-the-air firmware campaigns.' },
  { id: 'weather', name: 'Weather API', vendor: 'Tomorrow.io', kind: 'Environmental',
    objects: ['Site'],
    freq: 'Hourly', writesBack: false,
    desc: 'Site-level forecasts — heat, ice, storms — that shift both demand and hardware failure rates.' },
  { id: 'geotab', name: 'Fleet Telematics', vendor: 'Geotab', kind: 'Vehicle telematics',
    objects: ['Vehicle', 'Fleet Operator'],
    freq: 'Every 5 min', writesBack: false,
    desc: 'State-of-charge, odometer and route data for managed fleet vehicles.' },
  { id: 'grid', name: 'Grid Signals', vendor: 'CAISO / ERCOT', kind: 'Demand response',
    objects: ['Demand Response Event', 'Utility'],
    freq: 'Streaming', writesBack: false,
    desc: 'ISO market signals and DR event dispatches that trigger load curtailment across enrolled sites.' },
]

/* ── EDGES (~75) ───────────────────────────────────────────────────── */
/* s / t are entity ids (or intelligence ids for derived edges).        */

const EDGES = [
  /* structural */
  { s: 'site', t: 'station', label: 'HAS', card: '1:N', kind: 'structural' },
  { s: 'station', t: 'port', label: 'HAS', card: '1:N', kind: 'structural' },
  { s: 'port', t: 'connector', label: 'HAS', card: '1:1', kind: 'structural' },
  { s: 'org', t: 'site', label: 'HOSTS', card: '1:N', kind: 'structural' },
  { s: 'site', t: 'circuit', label: 'FED_BY', card: 'N:1', kind: 'structural' },
  { s: 'station', t: 'circuit', label: 'DRAWS_FROM', card: 'N:1', kind: 'structural' },
  { s: 'utility', t: 'site', label: 'SERVES', card: '1:N', kind: 'structural' },
  { s: 'utility', t: 'tariff', label: 'PUBLISHES', card: '1:N', kind: 'structural' },
  { s: 'gateway', t: 'station', label: 'UPLINKS', card: '1:N', kind: 'structural' },
  { s: 'firmware', t: 'station', label: 'RUNS_ON', card: '1:N', kind: 'structural' },
  { s: 'warranty', t: 'station', label: 'COVERS', card: '1:1', kind: 'structural' },
  { s: 'load', t: 'circuit', label: 'GOVERNS', card: '1:N', kind: 'structural' },
  { s: 'meter', t: 'circuit', label: 'METERS', card: '1:1', kind: 'structural' },
  { s: 'meter', t: 'utility', label: 'BILLED_BY', card: 'N:1', kind: 'structural' },
  { s: 'fleet', t: 'vehicle', label: 'OPERATES', card: '1:N', kind: 'structural' },
  { s: 'fleet', t: 'org', label: 'BELONGS_TO', card: 'N:1', kind: 'structural' },
  { s: 'sub', t: 'org', label: 'ENTITLES', card: 'N:1', kind: 'structural' },
  { s: 'price', t: 'site', label: 'APPLIES_TO', card: '1:N', kind: 'structural' },
  { s: 'price', t: 'tariff', label: 'DERIVED_FROM', card: 'N:1', kind: 'structural' },
  { s: 'ae', t: 'org', label: 'OWNS', card: '1:N', kind: 'structural' },
  { s: 'contact', t: 'site', label: 'REPRESENTS', card: '1:N', kind: 'structural' },
  { s: 'vehicle', t: 'driver', label: 'REGISTERED_TO', card: 'N:1', kind: 'structural' },
  { s: 'driver', t: 'org', label: 'MEMBER_OF', card: 'N:1', kind: 'structural' },
  { s: 'roaming', t: 'org', label: 'INTERCONNECTS', card: 'N:M', kind: 'structural' },
  { s: 'part', t: 'station', label: 'FITS', card: 'N:M', kind: 'structural' },
  { s: 'tech', t: 'site', label: 'COVERS_REGION', card: 'N:M', kind: 'structural' },
  { s: 'warranty', t: 'sub', label: 'SOLD_UNDER', card: 'N:1', kind: 'structural' },
  { s: 'waitlist', t: 'site', label: 'QUEUED_AT', card: 'N:1', kind: 'structural' },
  { s: 'tariff', t: 'esession', label: 'PRICES', card: '1:N', kind: 'structural' },
  { s: 'dr', t: 'utility', label: 'ISSUED_BY', card: 'N:1', kind: 'structural' },
  { s: 'csession', t: 'site', label: 'OCCURRED_AT', card: 'N:1', kind: 'structural' },
  { s: 'fleet', t: 'site', label: 'DEPOTS_AT', card: 'N:M', kind: 'structural' },

  /* behavioral */
  { s: 'port', t: 'csession', label: 'DELIVERED', card: '1:N', kind: 'behavioral' },
  { s: 'driver', t: 'csession', label: 'STARTED', card: '1:N', kind: 'behavioral' },
  { s: 'vehicle', t: 'csession', label: 'CHARGED_IN', card: '1:N', kind: 'behavioral' },
  { s: 'csession', t: 'esession', label: 'METERED_AS', card: '1:1', kind: 'behavioral' },
  { s: 'payment', t: 'csession', label: 'SETTLES', card: '1:1', kind: 'behavioral' },
  { s: 'driver', t: 'payment', label: 'MADE', card: '1:N', kind: 'behavioral' },
  { s: 'roaming', t: 'csession', label: 'ORIGINATED', card: '1:N', kind: 'behavioral' },
  { s: 'fault', t: 'port', label: 'RAISED_ON', card: 'N:1', kind: 'behavioral' },
  { s: 'wo', t: 'fault', label: 'RESOLVES', card: '1:1', kind: 'behavioral' },
  { s: 'tech', t: 'wo', label: 'ASSIGNED_TO', card: 'N:M', kind: 'behavioral' },
  { s: 'part', t: 'wo', label: 'CONSUMED_BY', card: 'N:M', kind: 'behavioral' },
  { s: 'wo', t: 'site', label: 'PERFORMED_AT', card: 'N:1', kind: 'behavioral' },
  { s: 'wo', t: 'warranty', label: 'CLAIMED_UNDER', card: 'N:1', kind: 'behavioral' },
  { s: 'ticket', t: 'csession', label: 'ABOUT', card: 'N:1', kind: 'behavioral' },
  { s: 'ticket', t: 'driver', label: 'OPENED_BY', card: 'N:1', kind: 'behavioral' },
  { s: 'ticket', t: 'fault', label: 'LINKED_TO', card: 'N:1', kind: 'behavioral' },
  { s: 'dr', t: 'load', label: 'CURTAILS', card: '1:N', kind: 'behavioral' },
  { s: 'dr', t: 'site', label: 'TARGETED', card: '1:N', kind: 'behavioral' },
  { s: 'esession', t: 'circuit', label: 'DRAWN_FROM', card: 'N:1', kind: 'behavioral' },
  { s: 'esession', t: 'dr', label: 'CURTAILED_BY', card: 'N:1', kind: 'behavioral' },
  { s: 'driver', t: 'waitlist', label: 'JOINED', card: '1:N', kind: 'behavioral' },
  { s: 'waitlist', t: 'csession', label: 'CONVERTED_TO', card: '1:1', kind: 'behavioral' },
  { s: 'station', t: 'gateway', label: 'HEARTBEATS_VIA', card: 'N:1', kind: 'behavioral' },
  { s: 'payment', t: 'org', label: 'INVOICED_TO', card: 'N:1', kind: 'behavioral' },
  { s: 'contact', t: 'fault', label: 'NOTIFIED_OF', card: 'N:M', kind: 'behavioral' },
  { s: 'ae', t: 'sub', label: 'RENEWED', card: '1:N', kind: 'behavioral' },

  /* derived — written by intelligence nodes */
  { s: 'i_health', t: 'station', label: 'SCORES', card: '1:1', kind: 'derived' },
  { s: 'i_pfr', t: 'port', label: 'PREDICTS_FAILURE', card: '1:1', kind: 'derived' },
  { s: 'i_pfr', t: 'part', label: 'PRE_STAGES', card: '1:N', kind: 'derived' },
  { s: 'i_uptime', t: 'station', label: 'TRACKS', card: '1:N', kind: 'derived' },
  { s: 'i_uptime', t: 'warranty', label: 'AUDITS', card: '1:N', kind: 'derived' },
  { s: 'i_util', t: 'site', label: 'FORECASTS', card: '1:1', kind: 'derived' },
  { s: 'i_churn', t: 'driver', label: 'SCORES', card: '1:1', kind: 'derived' },
  { s: 'i_churn', t: 'ticket', label: 'WATCHES', card: '1:N', kind: 'derived' },
  { s: 'i_expand', t: 'site', label: 'RANKS_NEXT', card: '1:N', kind: 'derived' },
  { s: 'i_expand', t: 'waitlist', label: 'MINES', card: '1:N', kind: 'derived' },
  { s: 'i_energy', t: 'load', label: 'REWRITES', card: '1:N', kind: 'derived' },
  { s: 'i_energy', t: 'tariff', label: 'OPTIMIZES_AGAINST', card: '1:N', kind: 'derived' },
  { s: 'i_dispatch', t: 'wo', label: 'PRIORITIZES', card: '1:N', kind: 'derived' },
  { s: 'i_dispatch', t: 'tech', label: 'ROUTES', card: '1:N', kind: 'derived' },
  { s: 'i_revenue', t: 'payment', label: 'FLAGS', card: '1:N', kind: 'derived' },
  { s: 'i_revenue', t: 'roaming', label: 'AUDITS', card: '1:N', kind: 'derived' },
  { s: 'i_fleetrdy', t: 'fleet', label: 'SCORES', card: '1:1', kind: 'derived' },
  { s: 'i_fleetrdy', t: 'vehicle', label: 'CHECKS', card: '1:N', kind: 'derived' },
]

/* ── INTELLIGENCE (10 derived nodes) ───────────────────────────────── */

const INTEL = [
  { id: 'i_health', label: 'Station Health Score',
    desc: 'Continuous 0–100 health index per station, blending telemetry drift, error rates, firmware age and weather exposure.',
    inputs: ['NOS Telemetry', 'Fault Alert', 'Firmware Build', 'Weather API'],
    outputs: ['health_score', 'degradation_trend', 'watch_flag'],
    fields: [
      { name: 'health_score', type: 'float 0–100' },
      { name: 'mtbf_days', type: 'float' },
      { name: 'degradation_trend', type: 'enum · stable / declining / critical' },
      { name: 'computed_at', type: 'timestamp' },
    ] },
  { id: 'i_pfr', label: 'Port Failure Risk',
    desc: 'Predictive-maintenance model: probability a port faults in the next 30 days, with the likely component and fix.',
    inputs: ['Fault Alert', 'Charging Session', 'Connector', 'Firmware Build'],
    outputs: ['failure_prob_30d', 'suspect_component', 'recommended_action'],
    fields: [
      { name: 'failure_prob_30d', type: 'float 0–1' },
      { name: 'suspect_component', type: 'enum · power_module / cable / screen / comms' },
      { name: 'recommended_action', type: 'string' },
      { name: 'confidence', type: 'float' },
    ] },
  { id: 'i_uptime', label: 'Uptime Compliance',
    desc: 'Rolling uptime per port against the NEVI 97% federal mandate and Assure SLAs — with time-to-breach projections.',
    inputs: ['Charging Station', 'Fault Alert', 'Work Order', 'Warranty Contract'],
    outputs: ['uptime_pct_rolling', 'nevi_at_risk', 'sla_breach_eta'],
    fields: [
      { name: 'uptime_pct_rolling', type: 'float' },
      { name: 'nevi_at_risk', type: 'boolean' },
      { name: 'sla_breach_eta_hrs', type: 'float' },
      { name: 'excluded_outage_hrs', type: 'float' },
    ] },
  { id: 'i_util', label: 'Utilization Forecast',
    desc: 'Hour-by-hour demand forecast per site for the next 14 days, weather- and event-adjusted.',
    inputs: ['Charging Session', 'Site', 'Weather API', 'Waitlist Entry'],
    outputs: ['expected_sessions', 'expected_kwh', 'saturation_pct'],
    fields: [
      { name: 'expected_sessions', type: 'int[] · hourly' },
      { name: 'expected_kwh', type: 'float[] · hourly' },
      { name: 'saturation_pct', type: 'float' },
      { name: 'horizon_days', type: 'int' },
    ] },
  { id: 'i_churn', label: 'Driver Churn Risk',
    desc: 'Likelihood a driver defects to another network, driven by failed sessions, ticket sentiment and lapsed usage.',
    inputs: ['Charging Session', 'Support Ticket', 'Payment'],
    outputs: ['churn_prob_90d', 'root_cause', 'save_action'],
    fields: [
      { name: 'churn_prob_90d', type: 'float 0–1' },
      { name: 'root_cause', type: 'enum · reliability / price / coverage / billing' },
      { name: 'save_action', type: 'string' },
      { name: 'last_failed_session_at', type: 'timestamp' },
    ] },
  { id: 'i_expand', label: 'Site Expansion Score',
    desc: 'Ranks candidate sites and upsizes by waitlist depth, saturation, host economics and grid capacity.',
    inputs: ['Waitlist Entry', 'Utilization Forecast', 'Organization', 'Tariff Plan'],
    outputs: ['expansion_score', 'recommended_ports', 'payback_months'],
    fields: [
      { name: 'expansion_score', type: 'float 0–100' },
      { name: 'recommended_ports', type: 'int' },
      { name: 'payback_months', type: 'float' },
      { name: 'demand_unserved_kwh', type: 'float' },
    ] },
  { id: 'i_energy', label: 'Energy Cost Optimizer',
    desc: 'Computes the cheapest feasible load shape per circuit against TOU windows, demand charges and DR commitments.',
    inputs: ['Tariff Plan', 'Utilization Forecast', 'Demand Response Event', 'Load Policy'],
    outputs: ['optimal_load_shape', 'projected_savings_usd', 'dr_participation'],
    fields: [
      { name: 'optimal_load_shape', type: 'json · kW by hour' },
      { name: 'projected_savings_usd', type: 'float / month' },
      { name: 'demand_charge_avoided', type: 'float' },
      { name: 'dr_participation', type: 'boolean' },
    ] },
  { id: 'i_dispatch', label: 'Dispatch Priority',
    desc: 'Orders the work-order queue by SLA exposure, NEVI risk, revenue at stake and geographic batching potential.',
    inputs: ['Work Order', 'Warranty Contract', 'Uptime Compliance', 'Technician'],
    outputs: ['priority_rank', 'batch_id', 'sla_dollars_at_risk'],
    fields: [
      { name: 'priority_rank', type: 'int' },
      { name: 'batch_id', type: 'string' },
      { name: 'sla_dollars_at_risk', type: 'float' },
      { name: 'suggested_window', type: 'daterange' },
    ] },
  { id: 'i_revenue', label: 'Revenue Anomaly Detector',
    desc: 'Flags sessions where energy delivered and money captured diverge — meter drift, roaming mispricing, refund abuse.',
    inputs: ['Payment', 'Charging Session', 'Roaming Partner', 'Price Policy'],
    outputs: ['anomaly_flag', 'leakage_estimate_usd', 'anomaly_class'],
    fields: [
      { name: 'anomaly_flag', type: 'boolean' },
      { name: 'anomaly_class', type: 'enum · meter_drift / mispricing / refund_abuse / settlement_gap' },
      { name: 'leakage_estimate_usd', type: 'float' },
      { name: 'evidence_sessions', type: 'array<ref>' },
    ] },
  { id: 'i_fleetrdy', label: 'Fleet Readiness Index',
    desc: 'Per-fleet score: will every vehicle have the state-of-charge its route needs at departure time?',
    inputs: ['Vehicle', 'Fleet Telematics', 'Charging Session', 'Load Policy'],
    outputs: ['readiness_pct', 'at_risk_vehicles', 'charge_plan_delta'],
    fields: [
      { name: 'readiness_pct', type: 'float' },
      { name: 'at_risk_vehicles', type: 'array<ref · Vehicle>' },
      { name: 'charge_plan_delta', type: 'json' },
      { name: 'departure_window', type: 'daterange' },
    ] },
]

const I_BY_ID = Object.fromEntries(INTEL.map(n => [n.id, n]))

/* ── AGENTS (6) ────────────────────────────────────────────────────── */

const AGENTS = [
  { id: 'sentinel', name: 'Uptime Sentinel', color: '#c2543a',
    tagline: 'Fixes ports before they fail',
    trigger: 'Port Failure Risk > 0.6, or health score drops 15 pts in 24h',
    reads: ['Port → Fault Alert history → Firmware Build', 'Port → Station → Warranty Contract (SLA terms)', 'Station → Site → Technician coverage'],
    thinks: [
      'Is this pattern a known firmware issue or a hardware failure signature?',
      'What does an outage here cost — NEVI compliance, Assure SLA penalty, lost sessions?',
      'Can the fix ride along with an already-scheduled visit nearby?',
    ],
    acts: [
      { text: 'Create pre-emptive work order with suspect component and fix steps', sys: 'ServiceNow' },
      { text: 'Reserve the spare part from the nearest warehouse', sys: 'ServiceNow' },
      { text: 'Schedule certified technician inside the SLA window', sys: 'ServiceNow' },
    ],
    kpi: 'Protects 98%+ uptime for NEVI compliance and Assure SLAs — failures fixed before drivers ever see them.',
    badges: ['THINK', 'ACT'] },
  { id: 'dispatch', name: 'Dispatch Optimizer', color: '#2f6fdb',
    tagline: 'One truck roll, many fixes',
    trigger: 'Nightly at 02:00, and whenever the open work-order queue changes materially',
    reads: ['Work Order queue → Site geography → Technician skills', 'Work Order → Spare Part stock and lead times', 'Dispatch Priority → SLA dollars at risk'],
    thinks: [
      'Which open orders share a metro, a skill set, and in-stock parts?',
      'Which batch ordering minimizes total SLA exposure, not just drive time?',
      'Should a P3 jump the queue because a P1 tech is already on-site?',
    ],
    acts: [
      { text: 'Re-sequence and batch work orders into route-optimized blocks', sys: 'ServiceNow' },
      { text: 'Assign technicians and book time windows', sys: 'ServiceNow' },
      { text: 'Flag parts shortfalls for expedited transfer', sys: 'ServiceNow' },
    ],
    kpi: 'Cuts truck rolls ~30% and mean-time-to-repair by batching geography, skill and parts availability.',
    badges: ['THINK', 'ACT'] },
  { id: 'energy', name: 'Energy Cost Optimizer', color: '#0f8a5f',
    tagline: 'Reshapes load while the network sleeps',
    trigger: 'Nightly after tariff sync; immediately on a Demand Response event',
    reads: ['Site → Tariff Plan (TOU windows, demand charges)', 'Utilization Forecast → expected load by hour', 'Demand Response Event → curtailment commitments'],
    thinks: [
      'Where will tomorrow’s charging collide with peak-rate windows?',
      'Which circuits can shift load without breaking fleet departure needs?',
      'Is the DR incentive worth the curtailment at each enrolled site?',
    ],
    acts: [
      { text: 'Rewrite Load Policies with new caps and schedules per circuit', sys: 'NOS' },
      { text: 'Enroll qualifying sites in tomorrow’s DR events', sys: 'Grid Signals' },
      { text: 'Send host a savings digest with the applied changes', sys: 'Salesforce' },
    ],
    kpi: 'Saves site hosts thousands per month in demand charges — invisible to drivers, visible on the utility bill.',
    badges: ['THINK', 'ACT'] },
  { id: 'fleetrdy', name: 'Fleet Readiness Agent', color: '#8a6d1f',
    tagline: 'Every route leaves fully charged',
    trigger: 'Every evening at depot close, per managed fleet',
    reads: ['Fleet → Vehicle → state-of-charge (Geotab)', 'Vehicle → tomorrow’s route energy requirement', 'Depot Site → Power Circuit → Load Policy headroom'],
    thinks: [
      'Which vehicles won’t reach required state-of-charge by departure?',
      'Is the constraint a faulted port, load cap, or plug-in miss?',
      'Whose charging priority can be raised without starving another route?',
    ],
    acts: [
      { text: 'Bump charging priority for at-risk vehicles in the depot plan', sys: 'NOS' },
      { text: 'Alert fleet ops with vehicle, cause and ETA-to-ready', sys: 'Zendesk' },
      { text: 'Open a work order if a depot port is the blocker', sys: 'ServiceNow' },
    ],
    kpi: 'Keeps fleet readiness above target — no bus, van or truck misses a morning route for lack of charge.',
    badges: ['THINK', 'ACT'] },
  { id: 'care', name: 'Driver Care Agent', color: '#7c3aed',
    tagline: 'Support that already knows what happened',
    trigger: 'New Zendesk ticket categorized failed_session or billing',
    reads: ['Ticket → Charging Session → Port → Fault Alert at that timestamp', 'Session → Payment status in Stripe', 'Driver → Churn Risk and lifetime value'],
    thinks: [
      'Did the network fail this driver, or did the vehicle end the session?',
      'Is the driver owed a refund, and is it below auto-approve threshold?',
      'Is this a high-churn-risk driver who warrants a goodwill credit?',
    ],
    acts: [
      { text: 'Auto-refund the session when fault-caused and below threshold', sys: 'Stripe' },
      { text: 'Draft a context-rich response for one-click agent approval', sys: 'Zendesk' },
      { text: 'Link the ticket to the fault and open work order', sys: 'Zendesk' },
    ],
    kpi: 'Resolves failed-session tickets in minutes with zero back-and-forth — CSAT up, handle time down.',
    badges: ['THINK', 'ACT'] },
  { id: 'expand', name: 'Expansion Advisor', color: CP_ORANGE,
    tagline: 'Finds the next hundred ports',
    trigger: 'Weekly, and when any site sustains >85% saturation for 14 days',
    reads: ['Site → Waitlist depth and conversion', 'Utilization Forecast → saturation trend', 'Organization → host economics, contract status → Account Executive'],
    thinks: [
      'Where is demand provably outrunning capacity?',
      'Does the host’s circuit have headroom, or does expansion need utility work?',
      'What port count and price policy makes the host’s payback compelling?',
    ],
    acts: [
      { text: 'Score and rank expansion candidates across the portfolio', sys: 'Graph' },
      { text: 'Draft an expansion proposal with sizing and payback math', sys: 'Salesforce' },
      { text: 'Create a task for the owning Account Executive', sys: 'Salesforce' },
    ],
    kpi: 'Turns waitlists and saturation into a qualified expansion pipeline, delivered to the right AE with the math done.',
    badges: ['THINK', 'ACT'] },
]

/* ── GRAPH LAYOUT ──────────────────────────────────────────────────── */

const VB_W = 2200, VB_H = 1440
const NODE_R = 34, HUB_R = 46

const POS = {
  /* energy — top-left */
  utility:  { x: 300,  y: 260 },
  tariff:   { x: 520,  y: 205 },
  esession: { x: 760,  y: 300 },
  dr:       { x: 130,  y: 380 },
  load:     { x: 330,  y: 440 },
  meter:    { x: 545,  y: 375 },
  /* network — left */
  site:     { x: 700,  y: 490 },
  circuit:  { x: 430,  y: 580 },
  gateway:  { x: 240,  y: 700 },
  firmware: { x: 420,  y: 810 },
  connector:{ x: 640,  y: 910 },
  port:     { x: 855,  y: 800 },
  station:  { x: 950,  y: 600, hub: true },
  /* commerce — right */
  csession: { x: 1330, y: 640, hub: true },
  price:    { x: 1380, y: 330 },
  org:      { x: 1600, y: 250 },
  sub:      { x: 1820, y: 305 },
  waitlist: { x: 2010, y: 255 },
  driver:   { x: 1565, y: 480 },
  vehicle:  { x: 1765, y: 590 },
  fleet:    { x: 1985, y: 480 },
  payment:  { x: 1640, y: 770 },
  roaming:  { x: 1955, y: 700 },
  /* service — bottom */
  warranty: { x: 790,  y: 1060 },
  fault:    { x: 1030, y: 985 },
  part:     { x: 1010, y: 1155 },
  wo:       { x: 1240, y: 1080 },
  ticket:   { x: 1455, y: 930 },
  tech:     { x: 1460, y: 1140 },
  /* people — bottom-right */
  ae:       { x: 1810, y: 950 },
  contact:  { x: 1855, y: 1130 },
}

/* sources — small rects in a row across the very top */
const SRC_W = 138, SRC_H = 34
const srcX = i => 66 + i * 149
const SRC_Y = 44

/* intelligence — purple diamonds in a bottom row */
const intelX = i => 205 + i * 199
const INTEL_Y = 1330

/* ════════════════════════════════════════════════════════════════════ */

const TABS = ['Graph', 'Entities', 'Sources', 'Edges', 'Intelligence', 'Agents']

const KPIS = [
  ['Stations', '312,441'],
  ['Ports', '588,102'],
  ['Uptime', '98.61%'],
  ['Sessions / day', '1.4M'],
  ['Energy / day', '9.8 GWh'],
  ['Managed Fleets', '2,300'],
]

const eyebrow = { fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.7, color: '#9a948a', fontWeight: 500 }
const monoChip = { fontFamily: 'var(--mono)', fontSize: 10, color: '#57534e', background: '#f4f1ea', border: '1px solid #e7e2d6', padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap' }

export default function ChargePointGraphPage({ onBack }) {
  const [tab, setTab] = useState('Graph')

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 26px 14px', flexShrink: 0 }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: '50%', border: '1px solid #e3ddd1', background: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
          onMouseOver={e => e.currentTarget.style.background = '#faf8f4'}
          onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3.5L5.5 8 10 12.5" stroke="#5b6066" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {/* brand icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 11, background: CP_ORANGE, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(244,128,31,0.28)',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M12.5 2L5 12.5h4.5L8.5 20 16 9.5h-4.5L12.5 2z" fill="#fff" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 25, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.3, lineHeight: 1.1 }}>
            ChargePoint Network Graph
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#9a948a', marginTop: 3 }}>
            <span>v2.4.0</span><Dot /><span>31 entities</span><Dot /><span>74 edge types</span><Dot /><span>14 sources</span><Dot />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2e7d46' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb863' }} />Live
            </span>
          </div>
        </div>

        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: CP_ORANGE, border: `1px solid ${CP_ORANGE}44`, background: `${CP_ORANGE}0d`, padding: '4px 10px', borderRadius: 6, letterSpacing: 0.6, whiteSpace: 'nowrap' }}>
          DEMO · ART OF THE POSSIBLE
        </span>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'flex', borderTop: '1px solid #ececea', borderBottom: '1px solid #ececea', flexShrink: 0 }}>
        {KPIS.map(([label, value], i) => (
          <div key={label} style={{
            flex: 1, padding: '12px 22px', borderRight: i < KPIS.length - 1 ? '1px solid #ececea' : 'none', minWidth: 0,
          }}>
            <div style={{ ...eyebrow, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 21, fontWeight: 600, color: '#1a1a1a', letterSpacing: -0.3, whiteSpace: 'nowrap' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Tab rail ── */}
      <div style={{ display: 'flex', gap: 26, padding: '0 26px', borderBottom: '1px solid #ececea', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '12px 2px 10px', fontSize: 13.5,
            color: tab === t ? '#1a1a1a' : '#8a857c', fontWeight: tab === t ? 600 : 400,
            borderBottom: tab === t ? '2px solid #1a1a1a' : '2px solid transparent', marginBottom: -1,
            transition: 'color .15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Body ── */}
      {tab === 'Graph' && <GraphTab />}
      {tab === 'Entities' && <EntitiesTab />}
      {tab === 'Sources' && <SourcesTab />}
      {tab === 'Edges' && <EdgesTab />}
      {tab === 'Intelligence' && <IntelligenceTab />}
      {tab === 'Agents' && <AgentsTab />}
    </div>
  )
}

function Dot() {
  return <span style={{ color: '#d6d0c4' }}>·</span>
}

/* ════════════════════════════════════════════════════════════════════
   TAB 1 — GRAPH
   ════════════════════════════════════════════════════════════════════ */

function GraphTab() {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const drag = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const onWheel = useCallback(e => {
    e.preventDefault()
    setZoom(z => Math.min(3, Math.max(0.4, z * (e.deltaY > 0 ? 0.93 : 1.07))))
  }, [])
  useEffect(() => {
    const el = svgRef.current
    if (el) el.addEventListener('wheel', onWheel, { passive: false })
    return () => el && el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const md = e => { drag.current = true; last.current = { x: e.clientX, y: e.clientY } }
  const mm = e => {
    if (!drag.current) return
    setPan(p => ({ x: p.x + e.clientX - last.current.x, y: p.y + e.clientY - last.current.y }))
    last.current = { x: e.clientX, y: e.clientY }
  }
  const mu = () => { drag.current = false }

  /* entity-to-entity edges with both endpoints positioned */
  const drawnEdges = EDGES.filter(e => POS[e.s] && POS[e.t])

  /* derived edges from intel diamonds to entities */
  const intelEdges = []
  INTEL.forEach((n, i) => {
    const ix = intelX(i), iy = INTEL_Y
    EDGES.filter(e => e.s === n.id && POS[e.t]).forEach(e => {
      intelEdges.push({ x1: ix, y1: iy - 26, x2: POS[e.t].x, y2: POS[e.t].y + (POS[e.t].hub ? HUB_R : NODE_R) })
    })
  })

  /* source feed lines: source rect → entities it hydrates */
  const srcEdges = []
  SOURCES.forEach((s, i) => {
    const sx = srcX(i) + SRC_W / 2, sy = SRC_Y + SRC_H
    s.objects.forEach(obj => {
      const id = LBL2ID[obj]
      if (id && POS[id]) srcEdges.push({ x1: sx, y1: sy, x2: POS[id].x, y2: POS[id].y - (POS[id].hub ? HUB_R : NODE_R) })
    })
  })

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fcfbf7' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet"
        style={{ cursor: drag.current ? 'grabbing' : 'grab', userSelect: 'none', display: 'block' }}
        onMouseDown={md} onMouseMove={mm} onMouseUp={mu} onMouseLeave={mu}>
        <defs>
          <pattern id="cpdots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="1.2" fill="#e9e5da" />
          </pattern>
        </defs>
        <rect width={VB_W} height={VB_H} fill="url(#cpdots)" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

          {/* ── source feed lines (dashed) ── */}
          {srcEdges.map((e, i) => (
            <line key={`se${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="#b6b0a3" strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.38" />
          ))}

          {/* ── intelligence input lines (dashed purple) ── */}
          {intelEdges.map((e, i) => (
            <line key={`ie${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={CAT.derived.color} strokeWidth="1.1" strokeDasharray="4 5" strokeOpacity="0.3" />
          ))}

          {/* ── entity-to-entity edges ── */}
          {drawnEdges.map((e, i) => {
            const a = POS[e.s], b = POS[e.t]
            const srcEnt = E_BY_ID[e.s]
            const col = srcEnt ? CAT[srcEnt.cat].color : CAT.derived.color
            return (
              <line key={`ee${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={col} strokeWidth={1.3} strokeOpacity={0.22}
                strokeDasharray={e.kind === 'derived' ? '5 4' : 'none'} />
            )
          })}

          {/* ── source rects ── */}
          {SOURCES.map((s, i) => (
            <g key={s.id}>
              <rect x={srcX(i)} y={SRC_Y} width={SRC_W} height={SRC_H} rx="8"
                fill="#fff" stroke="#e3ddd1" strokeWidth="1.2" />
              <circle cx={srcX(i) + 15} cy={SRC_Y + SRC_H / 2} r="3.5"
                fill={s.writesBack ? CP_ORANGE : '#b6b0a3'} />
              <text x={srcX(i) + 27} y={SRC_Y + SRC_H / 2 + 3.5} fontFamily="var(--mono)" fontSize="11"
                fill="#57534e" letterSpacing="0.2">{s.name.length > 15 ? s.name.slice(0, 14) + '…' : s.name}</text>
            </g>
          ))}
          <text x={srcX(0)} y={SRC_Y - 12} fontFamily="var(--mono)" fontSize="11" fill="#9a948a" letterSpacing="1">
            SOURCES — 14 SYSTEMS OF RECORD
          </text>

          {/* ── entity nodes ── */}
          {ENTITIES.map(ent => {
            const p = POS[ent.id]
            if (!p) return null
            const r = p.hub ? HUB_R : NODE_R
            const col = CAT[ent.cat].color
            return (
              <g key={ent.id}>
                {p.hub && <circle cx={p.x} cy={p.y} r={r + 9} fill={col} fillOpacity="0.06" />}
                <circle cx={p.x} cy={p.y} r={r} fill={col} fillOpacity="0.09" stroke={col} strokeWidth={p.hub ? 2.4 : 1.7} />
                <CatGlyph cat={ent.cat} cx={p.x} cy={p.y} col={col} s={p.hub ? 15 : 11} />
                <text x={p.x} y={p.y + r + 19} textAnchor="middle" fontFamily="var(--mono)"
                  fontSize={p.hub ? 13 : 11.5} fontWeight={p.hub ? 600 : 400}
                  fill="#44403a" letterSpacing="0.3">{ent.label}</text>
              </g>
            )
          })}

          {/* ── intelligence diamonds ── */}
          {INTEL.map((n, i) => {
            const x = intelX(i), y = INTEL_Y, d = 26
            const col = CAT.derived.color
            return (
              <g key={n.id}>
                <path d={`M${x},${y - d} L${x + d},${y} L${x},${y + d} L${x - d},${y} Z`}
                  fill={col} fillOpacity="0.1" stroke={col} strokeWidth="1.6" />
                <path d={`M${x},${y - 9} L${x + 9},${y} L${x},${y + 9} L${x - 9},${y} Z`} fill={col} fillOpacity="0.75" />
                <text x={x} y={y + d + 17} textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5"
                  fill="#6d5a9e" letterSpacing="0.2">{n.label}</text>
              </g>
            )
          })}
          <text x={intelX(0) - 26} y={INTEL_Y + 62} fontFamily="var(--mono)" fontSize="11" fill="#9a948a" letterSpacing="1">
            INTELLIGENCE — DERIVED FROM THE GRAPH, WRITTEN BACK TO IT
          </text>
        </g>
      </svg>

      {/* legend — top-left */}
      <div style={{
        position: 'absolute', top: 14, left: 16, background: '#ffffffee', border: '1px solid #e3ddd1',
        borderRadius: 10, padding: '10px 14px', boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
      }}>
        <div style={{ ...eyebrow, marginBottom: 8 }}>Categories</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px' }}>
          {Object.entries(CAT).map(([k, c]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 9, height: 9, flexShrink: 0,
                borderRadius: k === 'derived' ? 2 : '50%',
                transform: k === 'derived' ? 'rotate(45deg)' : 'none',
                background: c.color,
              }} />
              <span style={{ fontSize: 11.5, color: '#57534e' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* zoom controls — bottom-right */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column',
        background: '#fff', border: '1px solid #e3ddd1', borderRadius: 9, overflow: 'hidden',
        boxShadow: '0 1px 5px rgba(0,0,0,0.06)',
      }}>
        <button onClick={() => setZoom(z => Math.min(3, z * 1.15))} style={zoomBtn}>+</button>
        <div style={{ ...zoomBtn, fontSize: 9.5, color: '#9a948a', cursor: 'default', fontFamily: 'var(--mono)' }}>{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom(z => Math.max(0.4, z * 0.87))} style={zoomBtn}>−</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          style={{ ...zoomBtn, fontSize: 9, color: '#9a948a', fontFamily: 'var(--mono)', borderBottom: 'none' }}>RESET</button>
      </div>

      {/* hint — bottom-left */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, fontFamily: 'var(--mono)', fontSize: 10,
        color: '#9a948a', background: '#ffffffdd', border: '1px solid #ececea', borderRadius: 7, padding: '5px 10px',
      }}>
        drag to pan · scroll or buttons to zoom
      </div>
    </div>
  )
}

const zoomBtn = {
  width: 34, height: 30, background: '#fff', border: 'none', borderBottom: '1px solid #ececea',
  color: '#57534e', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function CatGlyph({ cat, cx, cy, col, s }) {
  switch (cat) {
    case 'network': /* four-node cluster */
      return (
        <g>
          <circle cx={cx} cy={cy - s * 0.7} r={s * 0.26} fill={col} />
          <circle cx={cx - s * 0.7} cy={cy + s * 0.45} r={s * 0.26} fill={col} />
          <circle cx={cx + s * 0.7} cy={cy + s * 0.45} r={s * 0.26} fill={col} />
          <path d={`M${cx},${cy - s * 0.7} L${cx - s * 0.7},${cy + s * 0.45} M${cx},${cy - s * 0.7} L${cx + s * 0.7},${cy + s * 0.45} M${cx - s * 0.7},${cy + s * 0.45} L${cx + s * 0.7},${cy + s * 0.45}`}
            stroke={col} strokeWidth="1.3" />
        </g>
      )
    case 'energy': /* bolt */
      return <path d={`M${cx + s * 0.25},${cy - s} L${cx - s * 0.55},${cy + s * 0.15} h${s * 0.55} L${cx - s * 0.25},${cy + s} L${cx + s * 0.55},${cy - s * 0.15} h${-s * 0.55} Z`} fill={col} />
    case 'commerce': /* dollar-ish square */
      return (
        <g>
          <rect x={cx - s * 0.75} y={cy - s * 0.75} width={s * 1.5} height={s * 1.5} rx={s * 0.3} fill="none" stroke={col} strokeWidth="1.6" />
          <path d={`M${cx},${cy - s * 0.45} v${s * 0.9} M${cx - s * 0.35},${cy + s * 0.25} h${s * 0.55} M${cx - s * 0.2},${cy - s * 0.25} h${s * 0.55}`}
            stroke={col} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )
    case 'service': /* wrench-ish triangle w/ bang */
      return (
        <g>
          <path d={`M${cx},${cy - s * 0.9} L${cx + s * 0.95},${cy + s * 0.75} L${cx - s * 0.95},${cy + s * 0.75} Z`} fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round" />
          <line x1={cx} y1={cy - s * 0.25} x2={cx} y2={cy + s * 0.25} stroke={col} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx={cx} cy={cy + s * 0.5} r={1.4} fill={col} />
        </g>
      )
    case 'people': /* person */
      return (
        <g>
          <circle cx={cx} cy={cy - s * 0.4} r={s * 0.36} fill="none" stroke={col} strokeWidth="1.6" />
          <path d={`M${cx - s * 0.7},${cy + s * 0.85} a${s * 0.7},${s * 0.6} 0 0 1 ${s * 1.4},0`} fill="none" stroke={col} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )
    default: /* derived sparkle */
      return <path d={`M${cx},${cy - s} L${cx + s * 0.3},${cy - s * 0.3} L${cx + s},${cy} L${cx + s * 0.3},${cy + s * 0.3} L${cx},${cy + s} L${cx - s * 0.3},${cy + s * 0.3} L${cx - s},${cy} L${cx - s * 0.3},${cy - s * 0.3} Z`} fill={col} />
  }
}

/* ════════════════════════════════════════════════════════════════════
   TAB 2 — ENTITIES
   ════════════════════════════════════════════════════════════════════ */

function EntitiesTab() {
  const [catFilter, setCatFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const counts = ENTITIES.reduce((m, e) => { m[e.cat] = (m[e.cat] || 0) + 1; return m }, {})
  const chips = ['All', ...Object.keys(CAT).filter(k => counts[k])]

  const rows = ENTITIES
    .filter(e => catFilter === 'All' || e.cat === catFilter)
    .filter(e => e.label.toLowerCase().includes(search.toLowerCase()) || e.desc.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 26px 14px', flexWrap: 'wrap' }}>
        {chips.map(c => {
          const active = catFilter === c
          const col = c === 'All' ? '#1a1a1a' : CAT[c].color
          const n = c === 'All' ? ENTITIES.length : counts[c]
          return (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 8,
              border: active ? `1.5px solid ${col}` : '1px solid #e3ddd1', cursor: 'pointer', fontSize: 12.5,
              background: active ? `${col}0e` : '#fff', color: active ? col : '#6b6659',
              fontWeight: active ? 600 : 400, transition: 'all .15s',
            }}>
              {c !== 'All' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT[c].color }} />}
              {c === 'All' ? 'All' : CAT[c].label}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: active ? col : '#9a948a' }}>{n}</span>
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entities"
            style={{ border: '1px solid #e3ddd1', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 220, background: '#fff' }}
            onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3ddd1'} />
        </div>
      </div>

      {/* table */}
      <div style={{ padding: '0 26px 26px' }}>
        <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {[['Entity', '22%'], ['Category', '13%'], ['Properties', '10%'], ['Primary Key', '16%'], ['Description', '39%']].map(([l, w]) => (
                  <th key={l} style={{
                    width: w, textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600,
                    letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a',
                    borderBottom: '1px solid #eaecea', background: '#F7F5F3', whiteSpace: 'nowrap',
                  }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((ent, i) => {
                const isOpen = expanded === ent.id
                const pk = ent.props.find(p => p.pk)
                const last = i === rows.length - 1 && !isOpen
                const cell = { padding: '11px 18px', verticalAlign: 'middle', borderBottom: last ? 'none' : '1px solid #f1f2f1', overflow: 'hidden' }
                return (
                  <FragmentRow key={ent.id}>
                    <tr onClick={() => setExpanded(isOpen ? null : ent.id)}
                      style={{ cursor: 'pointer', background: isOpen ? '#faf8f4' : '#fff', transition: 'background .12s' }}
                      onMouseOver={e => { if (!isOpen) e.currentTarget.style.background = '#faf9f6' }}
                      onMouseOut={e => { if (!isOpen) e.currentTarget.style.background = '#fff' }}>
                      <td style={cell}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
                            <path d="M3 1.5L7 5 3 8.5" stroke="#b8b2a6" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: 14.5, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ent.label}</span>
                        </span>
                      </td>
                      <td style={cell}><CatBadge cat={ent.cat} /></td>
                      <td style={cell}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#57534e' }}>{ent.props.length}</span>
                      </td>
                      <td style={cell}>
                        {pk && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#8a7340', border: '1px solid #e7dcc1', background: '#faf5ea', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{pk.name}</span>}
                      </td>
                      <td style={{ ...cell, fontSize: 12.5, color: '#6b6659', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ent.desc}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0, borderBottom: i === rows.length - 1 ? 'none' : '1px solid #f1f2f1', background: '#faf8f4' }}>
                          <div style={{ padding: '4px 18px 16px 42px' }}>
                            <div style={{ ...eyebrow, margin: '8px 0 8px' }}>Properties · {ent.props.length}</div>
                            <div style={{ border: '1px solid #e9e4d8', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {ent.props.map((p, pi) => (
                                    <tr key={p.name} style={{ borderBottom: pi === ent.props.length - 1 ? 'none' : '1px solid #f4f1ea' }}>
                                      <td style={{ padding: '7px 14px', width: '30%' }}>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#1a1a1a' }}>{p.name}</span>
                                      </td>
                                      <td style={{ padding: '7px 14px', fontSize: 12, color: '#8a857c' }}>{p.type}</td>
                                      <td style={{ padding: '7px 14px', width: 70, textAlign: 'right' }}>
                                        {p.pk && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: CP_ORANGE, border: `1px solid ${CP_ORANGE}55`, background: `${CP_ORANGE}0d`, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>PK</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div style={{ padding: '50px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No entities match.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function FragmentRow({ children }) {
  return <>{children}</>
}

function CatBadge({ cat }) {
  const c = CAT[cat]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10,
      color: c.color, border: `1px solid ${c.color}44`, background: `${c.color}0c`,
      padding: '3px 9px', borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TAB 3 — SOURCES
   ════════════════════════════════════════════════════════════════════ */

function SourcesTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ padding: '18px 26px 8px', fontSize: 13, color: '#6b6659' }}>
        Fourteen systems of record hydrate the graph. Four accept writes back from agents.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: '10px 26px 26px' }}>
        {SOURCES.map(s => (
          <div key={s.id} style={{
            border: '1px solid #ececea', borderRadius: 12, background: '#fff',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 16.5, fontWeight: 500, color: '#1a1a1a' }}>{s.name}</span>
                <span style={{ ...eyebrow, fontSize: 9 }}>{s.kind}</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9a948a', marginBottom: 9 }}>{s.vendor}</div>
              <div style={{ fontSize: 12.5, color: '#57534e', lineHeight: 1.5, marginBottom: 11 }}>{s.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {s.objects.map(o => <span key={o} style={monoChip}>{o}</span>)}
              </div>
            </div>
            <div style={{
              marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderTop: '1px solid #f1efe9', background: '#faf8f4',
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v6M6 7L3.5 4.5M6 7l2.5-2.5" stroke="#9a948a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 5)" />
                <circle cx="6" cy="10" r="1" fill="#9a948a" />
              </svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#6b6659' }}>{s.freq}</span>
              <div style={{ flex: 1 }} />
              {s.writesBack && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 9.5,
                  color: CP_ORANGE, border: `1px solid ${CP_ORANGE}55`, background: `${CP_ORANGE}0d`,
                  padding: '3px 8px', borderRadius: 5, letterSpacing: 0.4,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 5h7M5.5 2L8.5 5 5.5 8" stroke={CP_ORANGE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  WRITES BACK
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TAB 4 — EDGES
   ════════════════════════════════════════════════════════════════════ */

const KIND_STYLE = {
  structural: { color: '#2f6fdb', label: 'structural' },
  behavioral: { color: '#0f8a5f', label: 'behavioral' },
  derived: { color: '#7c3aed', label: 'derived' },
}

function nodeLabel(id) {
  return E_BY_ID[id]?.label || I_BY_ID[id]?.label || id
}

function EdgesTab() {
  const [kindFilter, setKindFilter] = useState('All')
  const [search, setSearch] = useState('')

  const counts = EDGES.reduce((m, e) => { m[e.kind] = (m[e.kind] || 0) + 1; return m }, {})

  const rows = EDGES
    .filter(e => kindFilter === 'All' || e.kind === kindFilter)
    .filter(e => {
      const q = search.toLowerCase()
      return !q || e.label.toLowerCase().includes(q) || nodeLabel(e.s).toLowerCase().includes(q) || nodeLabel(e.t).toLowerCase().includes(q)
    })

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 26px 14px' }}>
        {['All', 'structural', 'behavioral', 'derived'].map(k => {
          const active = kindFilter === k
          const col = k === 'All' ? '#1a1a1a' : KIND_STYLE[k].color
          const n = k === 'All' ? EDGES.length : counts[k]
          return (
            <button key={k} onClick={() => setKindFilter(k)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 8,
              border: active ? `1.5px solid ${col}` : '1px solid #e3ddd1', cursor: 'pointer', fontSize: 12.5,
              background: active ? `${col}0e` : '#fff', color: active ? col : '#6b6659',
              fontWeight: active ? 600 : 400, transition: 'all .15s', textTransform: k === 'All' ? 'none' : 'capitalize',
            }}>
              {k === 'All' ? 'All' : KIND_STYLE[k].label}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: active ? col : '#9a948a' }}>{n}</span>
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search edges"
            style={{ border: '1px solid #e3ddd1', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', outline: 'none', width: 220, background: '#fff' }}
            onFocus={e => e.target.style.borderColor = '#9298a0'} onBlur={e => e.target.style.borderColor = '#e3ddd1'} />
        </div>
      </div>

      <div style={{ padding: '0 26px 26px' }}>
        <div style={{ border: '1px solid #ececea', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {[['Source', '24%'], ['Edge', '24%'], ['Target', '24%'], ['Cardinality', '13%'], ['Kind', '15%']].map(([l, w]) => (
                  <th key={l} style={{
                    width: w, textAlign: 'left', padding: '10px 18px', fontSize: 11, fontWeight: 600,
                    letterSpacing: 0.5, textTransform: 'uppercase', color: '#9a948a',
                    borderBottom: '1px solid #eaecea', background: '#F7F5F3', whiteSpace: 'nowrap',
                  }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const last = i === rows.length - 1
                const cell = { padding: '10px 18px', verticalAlign: 'middle', borderBottom: last ? 'none' : '1px solid #f1f2f1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
                const sEnt = E_BY_ID[e.s]
                const ks = KIND_STYLE[e.kind]
                return (
                  <tr key={`${e.s}-${e.label}-${e.t}-${i}`} style={{ background: '#fff', transition: 'background .12s' }}
                    onMouseOver={ev => ev.currentTarget.style.background = '#faf9f6'}
                    onMouseOut={ev => ev.currentTarget.style.background = '#fff'}>
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 8, height: 8, flexShrink: 0,
                          borderRadius: sEnt ? '50%' : 2,
                          transform: sEnt ? 'none' : 'rotate(45deg)',
                          background: sEnt ? CAT[sEnt.cat].color : CAT.derived.color,
                        }} />
                        <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{nodeLabel(e.s)}</span>
                      </span>
                    </td>
                    <td style={cell}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#8a7340', border: '1px solid #e7dcc1', background: '#faf5ea', padding: '2px 8px', borderRadius: 6 }}>:{e.label}</span>
                        <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M1 6.5h10M7.5 3l3.5 3.5L7.5 10" stroke="#b8b2a6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    </td>
                    <td style={{ ...cell, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{nodeLabel(e.t)}</td>
                    <td style={cell}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#6b6659' }}>{e.card}</span>
                    </td>
                    <td style={cell}>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, color: ks.color, border: `1px solid ${ks.color}44`,
                        background: `${ks.color}0c`, padding: '3px 9px', borderRadius: 6, letterSpacing: 0.4,
                      }}>{ks.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div style={{ padding: '50px 0', textAlign: 'center', color: '#9097a0', fontSize: 14 }}>No edges match.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TAB 5 — INTELLIGENCE
   ════════════════════════════════════════════════════════════════════ */

function IntelligenceTab() {
  const purple = CAT.derived.color
  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ padding: '18px 26px 8px', fontSize: 13, color: '#6b6659' }}>
        Derived nodes computed continuously from the graph — and written back into it, so every agent and every query sees them.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, padding: '10px 26px 26px' }}>
        {INTEL.map(n => (
          <div key={n.id} style={{
            border: '1px solid #ececea', borderTop: `3px solid ${purple}`, borderRadius: 12,
            background: '#fff', padding: '15px 18px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, background: purple, transform: 'rotate(45deg)', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>{n.label}</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#57534e', lineHeight: 1.55, marginBottom: 13 }}>{n.desc}</div>

            <div style={{ ...eyebrow, marginBottom: 6 }}>Inputs</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {n.inputs.map(x => <span key={x} style={monoChip}>{x}</span>)}
            </div>

            <div style={{ ...eyebrow, marginBottom: 6 }}>Outputs</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 13 }}>
              {n.outputs.map(x => (
                <span key={x} style={{ ...monoChip, color: purple, background: `${purple}0a`, border: `1px solid ${purple}33` }}>{x}</span>
              ))}
            </div>

            <div style={{ border: '1px solid #f1efe9', borderRadius: 8, background: '#faf8f4', padding: '4px 0' }}>
              {n.fields.map((f, fi) => (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'baseline', gap: 12, padding: '5px 13px',
                  borderBottom: fi === n.fields.length - 1 ? 'none' : '1px solid #f1efe9',
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#1a1a1a', minWidth: 170 }}>{f.name}</span>
                  <span style={{ fontSize: 11.5, color: '#8a857c' }}>{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TAB 6 — AGENTS
   ════════════════════════════════════════════════════════════════════ */

function AgentsTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ padding: '18px 26px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 13.5, color: '#44403a' }}>
          Agents read the graph for context, decide, then act in the systems of record.
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9a948a' }}>6 ACTIVE</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, padding: '10px 26px 26px' }}>
        {AGENTS.map(a => <AgentCard key={a.id} agent={a} />)}
      </div>
    </div>
  )
}

function AgentCard({ agent: a }) {
  return (
    <div style={{ border: '1px solid #ececea', borderRadius: 12, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 12px', borderBottom: '1px solid #f1efe9' }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: `0 0 0 3px ${a.color}22` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17.5, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.15 }}>{a.name}</div>
          <div style={{ fontSize: 12, color: '#8a857c', marginTop: 1 }}>{a.tagline}</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {a.badges.map(b => (
            <span key={b} style={{
              fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: 0.8, padding: '3px 8px', borderRadius: 20,
              color: b === 'ACT' ? CP_ORANGE : '#57534e',
              border: b === 'ACT' ? `1px solid ${CP_ORANGE}66` : '1px solid #e3ddd1',
              background: b === 'ACT' ? `${CP_ORANGE}0d` : '#faf8f4',
            }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '13px 18px 15px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* trigger */}
        <div>
          <div style={{ ...eyebrow, marginBottom: 5 }}>Trigger</div>
          <div style={{ fontSize: 12.5, color: '#44403a', lineHeight: 1.45 }}>{a.trigger}</div>
        </div>

        {/* reads */}
        <div>
          <div style={{ ...eyebrow, marginBottom: 6 }}>Reads · graph traversal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {a.reads.map(r => (
              <div key={r} style={{
                fontFamily: 'var(--mono)', fontSize: 10.5, color: '#57534e', background: '#faf8f4',
                border: '1px solid #f1efe9', borderRadius: 6, padding: '5px 10px', lineHeight: 1.4,
              }}>{r}</div>
            ))}
          </div>
        </div>

        {/* thinks */}
        <div>
          <div style={{ ...eyebrow, marginBottom: 6 }}>Thinks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {a.thinks.map(t => (
              <div key={t} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#57534e', lineHeight: 1.45 }}>
                <span style={{ color: a.color, flexShrink: 0, marginTop: 1 }}>—</span>{t}
              </div>
            ))}
          </div>
        </div>

        {/* acts */}
        <div>
          <div style={{ ...eyebrow, marginBottom: 6 }}>Acts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {a.acts.map(act => (
              <div key={act.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1.5 6h8M6.5 2.5L10 6l-3.5 3.5" stroke={a.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ flex: 1, fontSize: 12, color: '#44403a', lineHeight: 1.4 }}>{act.text}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9, color: '#6b6659', border: '1px solid #e3ddd1',
                  background: '#faf8f4', padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap', flexShrink: 0,
                }}>{act.sys}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* kpi footer */}
      <div style={{
        padding: '10px 18px', borderTop: '1px solid #f1efe9',
        background: `linear-gradient(0deg, ${a.color}0a, ${a.color}0a)`,
        display: 'flex', gap: 9, alignItems: 'flex-start',
      }}>
        <span style={{ ...eyebrow, color: a.color, marginTop: 2, flexShrink: 0 }}>KPI</span>
        <span style={{ fontSize: 12, color: '#44403a', lineHeight: 1.5, fontWeight: 500 }}>{a.kpi}</span>
      </div>
    </div>
  )
}
