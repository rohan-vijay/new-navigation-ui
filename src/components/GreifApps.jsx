import { useState, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as echarts from 'echarts'
import {
  INK, MUTED, LINE, LINE2, CANVAS, PLATE, HEALTH, BLUE, GREEN, CORAL, PURPLE, GOLD,
  card, mono, serif, fmtK, clamp,
  ECH_FONT, AX_LABEL, TT, catAxis, valAxis,
  Chart, AppHeader, LiveBadge, StatusDot, Spark,
} from './appsKit'

// ─── GREIF OPERATIONS APPLICATIONS ───────────────────────────────────────────
// Four visual applications on the Greif Operations Context Graph — a global
// industrial packaging manufacturer running ~214 plants across Global
// Industrial Packaging (steel / plastic / fibre drums, IBCs, closures,
// reconditioning) and Paper Packaging & Services (containerboard, corrugated,
// URB, tubes & cores).
//
//   'gr_atlas'     → Plant Atlas          — COO · every plant, OEE and safety
//   'gr_pulse'     → Operations Pulse     — COO · OEE, downtime, service, cost
//   'gr_margin'    → Account Profitability— Commercial · margin after freight
//   'gr_orderbook' → Order Book & Service — Sales · backlog, risk, OTIF
//
// Every number below lives in ONE place. Lavonia's 71.2% OEE, Dow's 91.8%
// OTIF, the 128.4 steel index and the $842 network cost per ton appear in all
// four apps because all four read the same module-level tables.

// ─── NETWORK CONSTANTS ───────────────────────────────────────────────────────

const NET = {
  plants: 214,
  oee: 76.4,
  oeeTarget: 80,
  oeeDelta: -1.2,
  downtimeHrs: 41200,
  otif: 94.1,
  otifTarget: 95,
  scrap: 3.4,
  recordableRate: 0.82,
  costPerTon: 842,
  backlogUsd: 412,
  backlogTons: 486000,
  ordersAtRisk: 38,
  leadTimeDays: 12.4,
  runsPerYear: 4800000,
  sources: 15,
}

// Twelve months ending Aug 2026 — the spine every trend in these apps sits on.
const M12 = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const M6 = M12.slice(6)

// ─── SHARED DATA · PLANTS ────────────────────────────────────────────────────
// 30 principal sites of the 214-plant network. `health` bands:
//   good  OEE ≥ 78      watch 74 – 78      bad  < 74 (below intervention target)
const IP = 'Industrial Packaging'
const PP = 'Paper Packaging'

const PLANTS = [
  { id: 'lavonia', name: 'Lavonia', city: 'Lavonia, GA', country: 'United States', lat: 34.4362, lng: -83.1069, bu: IP, oee: 71.2, otif: 89.4, tons: 48200, linesCount: 6, daysSinceRecordable: 12 },
  { id: 'mtvernon', name: 'Mount Vernon', city: 'Mount Vernon, OH', country: 'United States', lat: 40.3934, lng: -82.4857, bu: PP, oee: 79.6, otif: 95.2, tons: 74600, linesCount: 4, daysSinceRecordable: 386 },
  { id: 'riverville', name: 'Riverville Mill', city: 'Riverville, VA', country: 'United States', lat: 37.5876, lng: -79.3078, bu: PP, oee: 81.4, otif: 96.1, tons: 96400, linesCount: 3, daysSinceRecordable: 512 },
  { id: 'chicago', name: 'Chicago', city: 'Chicago, IL', country: 'United States', lat: 41.8781, lng: -87.6298, bu: PP, oee: 78.4, otif: 94.6, tons: 52800, linesCount: 5, daysSinceRecordable: 208 },
  { id: 'houston', name: 'Houston', city: 'Houston, TX', country: 'United States', lat: 29.7604, lng: -95.3698, bu: IP, oee: 80.2, otif: 95.4, tons: 61200, linesCount: 7, daysSinceRecordable: 274 },
  { id: 'laporte', name: 'La Porte', city: 'La Porte, TX', country: 'United States', lat: 29.6658, lng: -95.0191, bu: IP, oee: 82.1, otif: 96.3, tons: 44100, linesCount: 5, daysSinceRecordable: 431 },
  { id: 'baltimore', name: 'Baltimore', city: 'Baltimore, MD', country: 'United States', lat: 39.2904, lng: -76.6122, bu: PP, oee: 75.4, otif: 92.8, tons: 38700, linesCount: 4, daysSinceRecordable: 64 },
  { id: 'toronto', name: 'Toronto', city: 'Toronto, ON', country: 'Canada', lat: 43.6532, lng: -79.3832, bu: IP, oee: 79.1, otif: 94.9, tons: 31400, linesCount: 4, daysSinceRecordable: 322 },
  { id: 'monterrey', name: 'Monterrey', city: 'Monterrey', country: 'Mexico', lat: 25.6866, lng: -100.3161, bu: IP, oee: 75.9, otif: 92.4, tons: 34800, linesCount: 5, daysSinceRecordable: 88 },
  { id: 'diadema', name: 'Diadema', city: 'Diadema, SP', country: 'Brazil', lat: -23.6861, lng: -46.6228, bu: IP, oee: 78.2, otif: 93.6, tons: 29600, linesCount: 4, daysSinceRecordable: 176 },
  { id: 'buenosaires', name: 'Buenos Aires', city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, bu: IP, oee: 76.8, otif: 92.1, tons: 21300, linesCount: 3, daysSinceRecordable: 141 },
  { id: 'rotterdam', name: 'Rotterdam', city: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777, bu: IP, oee: 83.5, otif: 96.8, tons: 68400, linesCount: 8, daysSinceRecordable: 604 },
  { id: 'ede', name: 'Ede', city: 'Ede', country: 'Netherlands', lat: 52.0402, lng: 5.6649, bu: IP, oee: 81.9, otif: 96.2, tons: 42700, linesCount: 5, daysSinceRecordable: 468 },
  { id: 'antwerp', name: 'Antwerp', city: 'Antwerp', country: 'Belgium', lat: 51.2194, lng: 4.4025, bu: IP, oee: 82.4, otif: 96.5, tons: 51900, linesCount: 6, daysSinceRecordable: 392 },
  { id: 'hamburg', name: 'Hamburg', city: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937, bu: IP, oee: 80.8, otif: 95.7, tons: 46300, linesCount: 5, daysSinceRecordable: 358 },
  { id: 'milan', name: 'Milan', city: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900, bu: IP, oee: 79.4, otif: 94.2, tons: 33200, linesCount: 4, daysSinceRecordable: 249 },
  { id: 'barcelona', name: 'Barcelona', city: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686, bu: IP, oee: 78.6, otif: 93.9, tons: 28900, linesCount: 4, daysSinceRecordable: 197 },
  { id: 'manchester', name: 'Manchester', city: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426, bu: PP, oee: 78.9, otif: 94.4, tons: 36100, linesCount: 4, daysSinceRecordable: 233 },
  { id: 'istanbul', name: 'Istanbul', city: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784, bu: IP, oee: 76.3, otif: 92.7, tons: 30700, linesCount: 4, daysSinceRecordable: 97 },
  { id: 'dammam', name: 'Dammam', city: 'Dammam', country: 'Saudi Arabia', lat: 26.4207, lng: 50.0888, bu: IP, oee: 79.8, otif: 94.1, tons: 39800, linesCount: 5, daysSinceRecordable: 288 },
  { id: 'johannesburg', name: 'Johannesburg', city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473, bu: IP, oee: 78.1, otif: 93.2, tons: 26400, linesCount: 4, daysSinceRecordable: 159 },
  { id: 'lagos', name: 'Lagos', city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, bu: IP, oee: 72.6, otif: 88.6, tons: 18600, linesCount: 3, daysSinceRecordable: 41 },
  { id: 'mumbai', name: 'Mumbai', city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, bu: IP, oee: 78.8, otif: 93.8, tons: 35600, linesCount: 5, daysSinceRecordable: 214 },
  { id: 'taicang', name: 'Taicang', city: 'Taicang, Jiangsu', country: 'China', lat: 31.4515, lng: 121.1017, bu: IP, oee: 82.7, otif: 96.6, tons: 57300, linesCount: 7, daysSinceRecordable: 447 },
  { id: 'guangzhou', name: 'Guangzhou', city: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, bu: IP, oee: 81.2, otif: 95.8, tons: 43900, linesCount: 6, daysSinceRecordable: 371 },
  { id: 'kualalumpur', name: 'Kuala Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, bu: IP, oee: 79.3, otif: 94.0, tons: 24800, linesCount: 3, daysSinceRecordable: 262 },
  { id: 'jakarta', name: 'Jakarta', city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, bu: IP, oee: 73.1, otif: 89.9, tons: 22700, linesCount: 3, daysSinceRecordable: 58 },
  { id: 'hochiminh', name: 'Ho Chi Minh City', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297, bu: IP, oee: 73.7, otif: 90.4, tons: 19900, linesCount: 3, daysSinceRecordable: 73 },
  { id: 'osaka', name: 'Osaka', city: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023, bu: IP, oee: 83.1, otif: 97.2, tons: 27600, linesCount: 4, daysSinceRecordable: 688 },
  { id: 'sydney', name: 'Sydney', city: 'Sydney, NSW', country: 'Australia', lat: -33.8688, lng: 151.2093, bu: IP, oee: 80.4, otif: 95.1, tons: 20400, linesCount: 3, daysSinceRecordable: 419 },
]

const oeeHealth = oee => oee >= 78 ? 'good' : oee >= 74 ? 'warn' : 'bad'
// Lost minutes scale with the square of the OEE gap × volume — a big plant with
// a small gap never outranks a small plant that is genuinely broken.
const lostMinutes = p => Math.round(Math.pow(84 - p.oee, 2) * p.tons * 0.028 / 100) * 100
const openMaint = p => Math.round((84 - p.oee) * 1.6 + p.linesCount * 2.4)
const riskAssets = p => Math.round((84 - p.oee) * 1.4 + p.linesCount)

PLANTS.forEach(p => {
  p.health = oeeHealth(p.oee)
  p.lostMin = lostMinutes(p)
  p.maintOpen = openMaint(p)
  p.riskAssets = riskAssets(p)
})

const plantById = id => PLANTS.find(p => p.id === id)
const T_MIN = Math.sqrt(18600), T_MAX = Math.sqrt(96400)
const plantR = t => 6 + ((Math.sqrt(t) - T_MIN) / (T_MAX - T_MIN)) * 16

// ─── SHARED DATA · CUSTOMERS ─────────────────────────────────────────────────
// price / material / conversion / freight are all $ per ton. Revenue, margin
// and cost-to-serve are DERIVED from them so no two apps can disagree.
const CUSTOMERS = [
  { id: 'dow', name: 'Dow Chemical', segment: 'Chemicals', tons: 64200, price: 1124, material: 512, conversion: 268, freight: 198, otif: 91.8, commitTons: 102000, miles: 412, wallet: 268, plants: ['laporte', 'houston', 'lavonia'] },
  { id: 'basf', name: 'BASF Coatings', segment: 'Coatings', tons: 41800, price: 1286, material: 548, conversion: 292, freight: 164, otif: 95.6, commitTons: 60000, miles: 286, wallet: 184, plants: ['rotterdam', 'antwerp', 'hamburg'] },
  { id: 'nutrien', name: 'Nutrien Ag Solutions', segment: 'Agriculture', tons: 58600, price: 968, material: 448, conversion: 236, freight: 216, otif: 93.4, commitTons: 96000, miles: 604, wallet: 212, plants: ['lavonia', 'chicago', 'houston'] },
  { id: 'shell', name: 'Shell Lubricants', segment: 'Lubricants', tons: 37400, price: 1192, material: 524, conversion: 262, freight: 182, otif: 96.2, commitTons: 54000, miles: 348, wallet: 148, plants: ['rotterdam', 'taicang', 'houston'] },
  { id: 'cargill', name: 'Cargill Foods', segment: 'Food', tons: 33100, price: 1048, material: 462, conversion: 274, freight: 194, otif: 94.8, commitTons: 50000, miles: 396, wallet: 126, plants: ['chicago', 'mtvernon', 'riverville'] },
  { id: 'sherwin', name: 'Sherwin-Williams', segment: 'Coatings', tons: 29700, price: 1318, material: 556, conversion: 298, freight: 158, otif: 96.9, commitTons: 42000, miles: 244, wallet: 118, plants: ['baltimore', 'chicago', 'lavonia'] },
  { id: 'exxon', name: 'ExxonMobil Chemical', segment: 'Chemicals', tons: 51300, price: 1092, material: 508, conversion: 264, freight: 186, otif: 94.2, commitTons: 78000, miles: 372, wallet: 224, plants: ['laporte', 'houston', 'baltimore'] },
  { id: 'yara', name: 'Yara International', segment: 'Agriculture', tons: 44900, price: 942, material: 436, conversion: 232, freight: 228, otif: 92.6, commitTons: 72000, miles: 688, wallet: 162, plants: ['rotterdam', 'hamburg', 'antwerp'] },
  { id: 'corteva', name: 'Corteva Agriscience', segment: 'Agriculture', tons: 26800, price: 1014, material: 452, conversion: 248, freight: 236, otif: 93.1, commitTons: 40000, miles: 642, wallet: 96, plants: ['lavonia', 'chicago', 'monterrey'] },
  { id: 'ppg', name: 'PPG Industries', segment: 'Coatings', tons: 24600, price: 1304, material: 552, conversion: 296, freight: 166, otif: 96.4, commitTons: 35000, miles: 268, wallet: 104, plants: ['baltimore', 'milan', 'barcelona'] },
]

const MARGIN_TARGET = 10 // contribution margin % below this is flagged red

CUSTOMERS.forEach(c => {
  c.cm = c.price - c.material - c.conversion - c.freight
  c.marginPct = Math.round((c.cm / c.price) * 1000) / 10
  c.revenue = c.tons * c.price
  c.costPerTon = c.material + c.conversion + c.freight
  c.ytdPct = Math.round((c.tons / c.commitTons) * 1000) / 10
  c.sharePct = Math.round((c.revenue / 1e6 / c.wallet) * 1000) / 10
  c.flagged = c.marginPct < MARGIN_TARGET
  c.health = c.marginPct >= 15 ? 'good' : c.marginPct >= MARGIN_TARGET ? 'warn' : 'bad'
  // 8-month margin trend, landing exactly on the current figure.
  const drift = c.flagged ? 0.34 : -0.12
  c.spark = Array.from({ length: 8 }, (_, i) =>
    Math.round((c.marginPct + drift * (7 - i) + Math.sin(i * 1.9 + c.name.length) * 0.22) * 10) / 10)
})

const custById = id => CUSTOMERS.find(c => c.id === id)
// The customers a plant actually ships, biggest first — used by the atlas panel.
const customersForPlant = id =>
  CUSTOMERS.filter(c => c.plants.includes(id)).sort((a, b) => b.revenue - a.revenue)

// Sourcing corrections the Cost-to-Serve signal has already scored.
const SOURCING_FIX = {
  nutrien: { better: 'Houston TX', from: 'Lavonia GA', milesSaved: 240, saveUsd: 1.9 },
  yara: { better: 'Barcelona ES', from: 'Rotterdam NL', milesSaved: 780, saveUsd: 2.4 },
  corteva: { better: 'Chicago IL', from: 'Lavonia GA', milesSaved: 470, saveUsd: 1.2 },
}

// ─── SHARED DATA · MATERIALS ─────────────────────────────────────────────────
// All series indexed to 100 twelve months ago (Sep 2025 = 100).
const MATERIALS = [
  {
    id: 'steel', name: 'Cold-Rolled Steel Coil G60', short: 'Steel coil', color: BLUE,
    index: 128.4, daysCover: 34, concentration: 62, topSupplier: 'Nucor + Cleveland-Cliffs',
    series: [100, 101.8, 104.2, 106.9, 109.4, 112.6, 115.1, 118.3, 121.0, 123.8, 126.2, 128.4],
  },
  {
    id: 'resin', name: 'HDPE Resin (Blow Grade)', short: 'HDPE resin', color: PURPLE,
    index: 121.7, daysCover: 21, concentration: 58, topSupplier: 'LyondellBasell + Braskem',
    series: [100, 99.4, 101.2, 103.8, 106.1, 108.4, 111.2, 113.6, 116.0, 118.2, 120.1, 121.7],
  },
  {
    id: 'occ', name: 'OCC #11', short: 'OCC #11', color: GREEN,
    index: 96.2, daysCover: 12, concentration: 34, topSupplier: 'Regional recovery network',
    series: [100, 103.2, 105.8, 104.1, 101.6, 99.4, 98.2, 97.6, 96.8, 96.4, 95.8, 96.2],
  },
  {
    id: 'liner', name: 'Kraft Linerboard 42#', short: 'Kraft liner', color: GOLD,
    index: 108.9, daysCover: 26, concentration: 71, topSupplier: 'WestRock + IP',
    series: [100, 100.8, 102.4, 103.6, 104.9, 105.8, 106.4, 107.1, 107.6, 108.2, 108.6, 108.9],
  },
]
const matById = id => MATERIALS.find(m => m.id === id)

// Realized contract price vs the blended input cost it is indexed to. The gap
// between them is the pass-through lag — real money, never recovered.
const COST_INDEX = [100, 100.7, 102.9, 105.5, 107.9, 110.7, 113.4, 116.2, 118.8, 121.3, 123.5, 125.4]
const PRICE_INDEX = [100, 100.4, 101.2, 102.4, 103.8, 105.2, 106.6, 108.4, 110.2, 112.0, 113.6, 115.1]
const LAG_UNRECOVERED = 18.4 // $M year to date

// ─── SHARED DATA · SKUs ──────────────────────────────────────────────────────
const SKUS = [
  { id: 'sku55th', code: 'SKU-55TH-G60', name: '55gal Tight-Head Steel Drum', family: 'Steel drums', material: 'steel' },
  { id: 'sku55pe', code: 'SKU-55PE-BG', name: '55gal HDPE Blow-Moulded Drum', family: 'Plastic drums', material: 'resin' },
  { id: 'skuibc', code: 'SKU-IBC-275C', name: '275gal Composite IBC', family: 'IBCs', material: 'resin' },
  { id: 'sku30fd', code: 'SKU-30FD-KL', name: '30gal Fibre Drum', family: 'Fibre drums', material: 'liner' },
  { id: 'skuurb', code: 'SKU-URB-22C', name: '22in URB Tube Core', family: 'Tubes & cores', material: 'occ' },
  { id: 'skucls', code: 'SKU-CLS-234', name: 'Closure Set 2in / 3/4in NPS', family: 'Closures', material: 'steel' },
]
const skuById = id => SKUS.find(s => s.id === id)

// ─── SHARED DATA · OPERATIONS TRENDS ─────────────────────────────────────────

const OEE_TREND = [78.9, 79.2, 79.0, 78.6, 78.8, 79.1, 78.4, 78.2, 77.6, 77.1, 76.9, 76.4]
const OEE_BY_BU = {
  [IP]: [78.1, 77.9, 77.4, 76.8, 76.5, 76.0],
  [PP]: [79.4, 79.2, 78.9, 78.6, 78.4, 78.1],
}
// hours per month — sums to NET.downtimeHrs
const DOWNTIME_PARETO = [
  ['Mechanical', 14820],
  ['Changeover', 9640],
  ['Material Starvation', 6180],
  ['Electrical', 4520],
  ['Operator', 3410],
  ['Quality Hold', 2630],
]
const RECORDABLES_Q = [['Q3 25', 68], ['Q4 25', 61], ['Q1 26', 57], ['Q2 26', 52], ['Q3 26', 44]]
const DAYS_BY_REGION = [['North America', 64], ['Latin America', 88], ['EMEA', 97], ['Asia Pacific', 41]]
const CO2_INTENSITY = [216, 212, 208, 205, 201, 198, 195, 192, 190, 187, 184, 181]
const RECYCLED_CONTENT = 51.4

// ─── SHARED DATA · ORDER BOOK ────────────────────────────────────────────────

const BACKLOG_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
const BACKLOG_IP = [62.4, 58.1, 54.6, 49.2, 47.8, 45.1]
const BACKLOG_PP = [18.2, 17.4, 16.1, 14.8, 14.2, 13.6]
const BACKLOG_CAP = [94, 91, 88, 82, 79, 76]

const RISK_REASONS = {
  material: { label: 'Material shortage', color: PURPLE, bg: '#f4f1fa', border: '#e0daf0' },
  capacity: { label: 'Capacity', color: CORAL, bg: '#faf1ee', border: '#eddcd5' },
  quality: { label: 'Quality hold', color: GOLD, bg: '#fbf5e8', border: '#efe2c6' },
  carrier: { label: 'Carrier tender reject', color: BLUE, bg: '#eef3fc', border: '#d6e2f6' },
}

// [orderNo, customerId, plantId, skuId, tons, promised, daysLate, reason, note]
const AT_RISK = [
  ['SO-884201', 'dow', 'lavonia', 'sku55th', 1240, 'Sep 4', 6, 'capacity', 'Lavonia seamer #3 — OEE 71.2% vs 80% plan'],
  ['SO-884417', 'nutrien', 'lavonia', 'sku30fd', 860, 'Sep 6', 4, 'capacity', 'Same Lavonia shortfall — winder re-sequenced'],
  ['SO-883960', 'cargill', 'chicago', 'skuurb', 540, 'Sep 2', 3, 'quality', 'NCR-20418 burst strength below spec — 540t on hold'],
  ['SO-884533', 'yara', 'rotterdam', 'skuibc', 1020, 'Sep 9', 5, 'material', 'HDPE resin at 21 days cover — blow-grade allocation'],
  ['SO-884108', 'exxon', 'laporte', 'sku55pe', 780, 'Sep 3', 2, 'carrier', 'Primary carrier rejected 3 tenders on TX→LA lane'],
  ['SO-884672', 'basf', 'antwerp', 'skucls', 310, 'Sep 11', 3, 'material', 'Closure blanks short — steel coil PO slipped 9 days'],
  ['SO-884295', 'corteva', 'monterrey', 'sku55th', 620, 'Sep 5', 7, 'capacity', 'Monterrey at 78% util, line 4 down for changeover'],
  ['SO-884744', 'shell', 'taicang', 'sku55pe', 940, 'Sep 12', 2, 'carrier', 'Ocean booking rolled — 2 sailings out'],
  ['SO-884019', 'ppg', 'baltimore', 'sku30fd', 420, 'Sep 1', 4, 'quality', 'NCR-20402 coating thickness — disposition pending'],
  ['SO-884860', 'sherwin', 'baltimore', 'skucls', 260, 'Sep 14', 3, 'material', 'Closure gasket lot quarantined at supplier'],
]

const FUNNEL = [['Quotes', 1284], ['Qualified', 612], ['Won', 218]]
const WIN_BY_SEGMENT = [['Coatings', 24.8], ['Chemicals', 21.4], ['Lubricants', 19.3], ['Food', 18.6], ['Agriculture', 14.2]]

// Demand vs capacity — utilization of committed capacity for the next 8 weeks.
const UTILIZATION = [
  ['lavonia', 108], ['laporte', 104], ['rotterdam', 97], ['houston', 96], ['chicago', 92],
  ['antwerp', 89], ['taicang', 87], ['baltimore', 84], ['mtvernon', 81], ['monterrey', 78],
]

const ALLOCATION = {
  sku: 'sku55th', plant: 'lavonia', week: 'Week of Sep 1',
  available: 1640, demand: 2100, short: 460,
  claims: [
    { id: 'dow', tons: 1240, note: 'take-or-pay commitment, 13.0% margin' },
    { id: 'nutrien', tons: 860, note: 'spot uplift, 7.0% margin' },
  ],
  recommend: 'Hold 1,240t for Dow against the take-or-pay clause, serve Nutrien 400t from Lavonia and transfer 460t to Houston TX.',
  cost: '+$14/ton freight on the transferred volume — $6.4K, against $180K of take-or-pay exposure.',
}

// ─── SMALL SHARED PIECES (Greif apps only) ───────────────────────────────────

const sect = { fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED, marginBottom: 8 }
const thStyle = { textAlign: 'left', padding: '0 0 7px', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }

const usdM = n => '$' + (n >= 100 ? Math.round(n) : n.toFixed(1)) + 'M'
const tonsFmt = t => fmtK(t) + 't'

function GCard({ title, accent, right, children, style }) {
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: accent || MUTED }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function GKpi({ label, value, delta, good, sub }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 138, padding: '13px 15px' }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>{label}</div>
      <div style={{ ...serif, fontSize: 24, fontWeight: 500, color: INK, letterSpacing: -0.4, margin: '5px 0 3px' }}>{value}</div>
      {delta && <div style={{ ...mono, fontSize: 10.5, color: good ? HEALTH.good : HEALTH.bad }}>{delta}</div>}
      {sub && <div style={{ ...mono, fontSize: 10.5, color: MUTED }}>{sub}</div>}
    </div>
  )
}

// Horizontal progress bar with an optional target tick.
function GBar({ pct, color = BLUE, target = null, h = 8, max = 100 }) {
  const P = v => clamp((v / max) * 100, 0, 100)
  return (
    <span style={{ position: 'relative', display: 'block', height: h, borderRadius: h / 2, background: '#f1efe9' }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${P(pct)}%`, background: color, opacity: 0.72, borderRadius: h / 2 }} />
      {target != null && <span style={{ position: 'absolute', left: `${P(target)}%`, top: -2, bottom: -2, width: 1.5, background: CORAL, borderRadius: 1 }} />}
    </span>
  )
}

// OEE completion ring — the number every plant review opens with.
function OeeRing({ oee, target = 80, size = 96 }) {
  const r = size / 2 - 9
  const C = 2 * Math.PI * r
  const frac = clamp(oee / 100, 0, 1)
  const color = HEALTH[oeeHealth(oee)]
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, display: 'block', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1efe9" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${frac * C} ${C}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CORAL} strokeWidth="8" strokeDasharray={`1.4 ${C}`}
        strokeDashoffset={-(target / 100) * C} transform={`rotate(-90 ${size / 2} ${size / 2})`} opacity="0.9" />
      <text x={size / 2} y={size / 2 + 2} textAnchor="middle" style={{ ...mono, fontSize: 17, fontWeight: 600, fill: INK }}>{oee.toFixed(1)}</text>
      <text x={size / 2} y={size / 2 + 15} textAnchor="middle" style={{ ...mono, fontSize: 8, fill: MUTED }}>OEE %</text>
    </svg>
  )
}

function Chip({ label, color, bg, border }) {
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function DerivedCallout({ title = 'Derived signals', rows, note }) {
  return (
    <div style={{ background: '#f7f5fb', border: '1px solid #e5e0f0', borderLeft: `3px solid ${PURPLE}`, borderRadius: 9, padding: '10px 13px' }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: PURPLE, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#4b463d', lineHeight: 1.65 }}>
        {rows.map(([sig, text]) => (
          <div key={sig}><b style={{ color: PURPLE }}>{sig}</b> — {text}</div>
        ))}
      </div>
      {note && <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginTop: 7 }}>{note}</div>}
    </div>
  )
}

// ─── THUMBNAILS ──────────────────────────────────────────────────────────────

// Equirectangular projection into the 240×120 thumbnail box.
const TX = lng => (lng + 180) / 360 * 240
const TY = lat => (90 - lat) / 180 * 120

function AtlasThumbGr() {
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <rect x="2" y="8" width="236" height="104" rx="8" fill="#f6f4ee" stroke="#e6e1d5" strokeWidth="1" />
      {[30, 45, 60, 75, 90].map(y => <line key={y} x1="2" y1={y} x2="238" y2={y} stroke="#e6e1d5" strokeWidth="0.7" />)}
      {[40, 80, 120, 160, 200].map(x => <line key={x} x1={x} y1="8" x2={x} y2="112" stroke="#e6e1d5" strokeWidth="0.7" />)}
      {PLANTS.map(p => (
        <circle key={p.id} cx={TX(p.lng)} cy={TY(p.lat)} r={Math.max(2.6, plantR(p.tons) * 0.38)}
          fill={HEALTH[p.health]} fillOpacity="0.26" stroke={HEALTH[p.health]} strokeWidth="1.3" />
      ))}
    </svg>
  )
}

function PulseThumbGr() {
  const max = DOWNTIME_PARETO[0][1]
  const total = DOWNTIME_PARETO.reduce((s, d) => s + d[1], 0)
  const cum = DOWNTIME_PARETO.map((_, i) =>
    DOWNTIME_PARETO.slice(0, i + 1).reduce((s, d) => s + d[1], 0) / total)
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      {DOWNTIME_PARETO.map(([, v], i) => (
        <rect key={i} x="10" y={12 + i * 17} width={Math.max(4, (v / max) * 196)} height="11" rx="3"
          fill={i === 0 ? CORAL : BLUE} opacity={i === 0 ? 0.7 : 0.42} />
      ))}
      <path d={cum.map((c, i) => `${i ? 'L' : 'M'}${(10 + c * 196).toFixed(1)} ${17.5 + i * 17}`).join(' ')}
        fill="none" stroke={PURPLE} strokeWidth="1.6" strokeLinejoin="round" />
      {cum.map((c, i) => <circle key={i} cx={10 + c * 196} cy={17.5 + i * 17} r="2" fill="#fff" stroke={PURPLE} strokeWidth="1.3" />)}
    </svg>
  )
}

function MarginThumbGr() {
  // Dow's waterfall in miniature — price, three deductions, thin contribution.
  const steps = [[1124, BLUE], [512, '#b9b2a6'], [268, '#b9b2a6'], [198, CORAL], [146, HEALTH.bad]]
  const S = v => (v / 1124) * 84
  let top = 1124
  const bars = steps.map(([v, c], i) => {
    const h = Math.max(3, S(v))
    const y = i === 0 || i === steps.length - 1 ? 104 - h : 104 - S(top)
    if (i > 0 && i < steps.length - 1) top -= v
    return { x: 16 + i * 43, y, h, c }
  })
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <line x1="10" y1="104" x2="230" y2="104" stroke={LINE} strokeWidth="1" />
      {/* connector rails between steps, so it reads as one falling sequence */}
      {bars.slice(0, -1).map((b, i) => (
        <line key={`c${i}`} x1={b.x} y1={i === 0 ? b.y : b.y + b.h} x2={bars[i + 1].x + 30}
          y2={i === 0 ? b.y : b.y + b.h} stroke={LINE2} strokeWidth="0.9" strokeDasharray="3 3" />
      ))}
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width="30" height={b.h} rx="3" fill={b.c} opacity={b.c === '#b9b2a6' ? 0.6 : 0.75} />
      ))}
    </svg>
  )
}

function OrderThumbGr() {
  const max = 82
  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      <line x1="10" y1="104" x2="230" y2="104" stroke={LINE} strokeWidth="1" />
      {BACKLOG_IP.map((ip, i) => {
        const pp = BACKLOG_PP[i]
        const hIp = (ip / max) * 80, hPp = (pp / max) * 80
        const x = 18 + i * 36
        return (
          <g key={i}>
            <rect x={x} y={104 - hIp} width="24" height={hIp} rx="2" fill={BLUE} opacity="0.6" />
            <rect x={x} y={104 - hIp - hPp} width="24" height={hPp} rx="2" fill={GREEN} opacity="0.55" />
          </g>
        )
      })}
      <path d={BACKLOG_CAP.map((c, i) => `${i ? 'L' : 'M'}${30 + i * 36} ${104 - (c / 100) * 88}`).join(' ')}
        fill="none" stroke={CORAL} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

// ─── APP 1 · PLANT ATLAS ─────────────────────────────────────────────────────

const BU_FILTERS = [['all', 'All'], [IP, 'Industrial Packaging'], [PP, 'Paper Packaging']]
const HEALTH_FILTERS = [['good', 'Healthy'], ['warn', 'Watch'], ['bad', 'Below target']]

function pillStyle(active, accent) {
  return {
    border: `1px solid ${active ? accent : LINE2}`, background: active ? '#fff' : 'transparent',
    color: active ? accent : '#6b6455', borderRadius: 20, padding: '4px 11px',
    fontSize: 11.5, fontWeight: active ? 600 : 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
    boxShadow: active ? '0 1px 4px rgba(26,26,26,0.06)' : 'none', whiteSpace: 'nowrap',
  }
}

function AtlasFilters({ bu, setBu, health, setHealth }) {
  const buCount = k => k === 'all' ? PLANTS.length : PLANTS.filter(p => p.bu === k).length
  const hCount = k => PLANTS.filter(p => p.health === k && (bu === 'all' || p.bu === bu)).length
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {BU_FILTERS.map(([k, label]) => (
        <button key={k} onClick={() => setBu(k)} style={pillStyle(bu === k, k === PP ? GREEN : k === IP ? BLUE : INK)}>
          {k !== 'all' && <span style={{ width: 6, height: 6, borderRadius: 2, background: k === PP ? GREEN : BLUE }} />}
          {label}
          <span style={{ ...mono, fontSize: 10, color: bu === k ? (k === PP ? GREEN : k === IP ? BLUE : INK) : MUTED }}>{buCount(k)}</span>
        </button>
      ))}
      <span style={{ width: 1, height: 18, background: LINE, margin: '0 3px' }} />
      {HEALTH_FILTERS.map(([k, label]) => (
        <button key={k} onClick={() => setHealth(health === k ? 'all' : k)} style={pillStyle(health === k, HEALTH[k])}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: HEALTH[k] }} />
          {label}
          <span style={{ ...mono, fontSize: 10, color: health === k ? HEALTH[k] : MUTED }}>{hCount(k)}</span>
        </button>
      ))}
    </div>
  )
}

// Top downtime reasons for a plant. Lavonia is told exactly; everywhere else
// the network Pareto shape is applied to that plant's own lost minutes.
const PLANT_REASONS = {
  lavonia: [['Mechanical · seamer #3 bearing', 96400], ['Changeover · 55gal ↔ 30gal', 52800], ['Material starvation · steel coil', 38200]],
  baltimore: [['Mechanical · winder drive', 34600], ['Quality hold · coating thickness', 21800], ['Changeover', 16400]],
  jakarta: [['Material starvation · HDPE resin', 31200], ['Mechanical · blow-moulder', 24800], ['Operator · certification gap', 9600]],
  lagos: [['Electrical · plant power dip', 28400], ['Mechanical · seamer', 21600], ['Material starvation · steel coil', 10200]],
}
function plantReasons(p) {
  if (PLANT_REASONS[p.id]) return PLANT_REASONS[p.id]
  const third = DOWNTIME_PARETO[2 + (p.name.length % 4)]
  return [
    ['Mechanical', Math.round(p.lostMin * 0.42 / 100) * 100],
    ['Changeover', Math.round(p.lostMin * 0.26 / 100) * 100],
    [third[0], Math.round(p.lostMin * 0.15 / 100) * 100],
  ]
}

// Which raw material this plant is thinnest on — steel/resin for drums, OCC or
// kraft liner for paper. Deterministic, and it always names a real material.
function plantMaterial(p) {
  if (p.bu === PP) return matById(p.name.length % 2 ? 'occ' : 'liner')
  return matById(p.linesCount % 2 ? 'steel' : 'resin')
}

function PlantMap({ plants, selectedId, onSelect }) {
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const el = divRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, {
      center: [22, 12], zoom: 2.2, zoomSnap: 0.2, zoomDelta: 0.6,
      minZoom: 2, scrollWheelZoom: true, zoomControl: false, worldCopyJump: true,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19,
    }).addTo(map)
    const markers = {}
    PLANTS.forEach(p => {
      const mk = L.circleMarker([p.lat, p.lng], {
        radius: plantR(p.tons),
        fillColor: HEALTH[p.health], fillOpacity: 0.28,
        color: HEALTH[p.health], weight: 2,
      })
      mk.bindTooltip(
        `<span style="font-family:var(--serif);font-size:12.5px;font-weight:600;color:${INK}">${p.name}</span><br/>` +
        `<span style="font-family:var(--mono);font-size:10px;color:${MUTED}">${p.bu} · ` +
        `<span style="color:${HEALTH[p.health]}">OEE ${p.oee.toFixed(1)}%</span></span>`,
        { sticky: true, direction: 'top', opacity: 1 },
      )
      mk.on('click', () => onSelectRef.current(p.id))
      mk.addTo(map)
      markers[p.id] = mk
    })
    markersRef.current = markers
    mapRef.current = map
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; markersRef.current = {} }
  }, [])

  // filters → marker visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const shown = new Set(plants.map(p => p.id))
    PLANTS.forEach(p => {
      const mk = markersRef.current[p.id]
      if (!mk) return
      if (shown.has(p.id)) { if (!map.hasLayer(mk)) mk.addTo(map) }
      else if (map.hasLayer(mk)) map.removeLayer(mk)
    })
  }, [plants])

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, mk]) => {
      const sel = id === selectedId
      mk.setStyle({ weight: sel ? 3.5 : 2, fillOpacity: sel ? 0.5 : 0.28 })
      if (sel) mk.bringToFront()
    })
  }, [selectedId])

  return <div ref={divRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
}

function PlantPanel({ plant, onClose }) {
  const reasons = plantReasons(plant)
  const mat = plantMaterial(plant)
  const custs = customersForPlant(plant.id)
  const safeH = plant.daysSinceRecordable >= 240 ? 'good' : plant.daysSinceRecordable >= 90 ? 'warn' : 'bad'
  const maxReason = Math.max(...reasons.map(r => r[1]))
  return (
    <div style={{ width: 340, flexShrink: 0, borderLeft: `1px solid ${LINE}`, background: PLATE, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot health={plant.health} />
            <span style={{ ...serif, fontSize: 18, fontWeight: 500, color: INK }}>{plant.name}</span>
          </div>
          <div style={{ ...mono, fontSize: 11, color: MUTED, marginTop: 4 }}>{plant.city} · {plant.country}</div>
          <div style={{ marginTop: 7 }}>
            <Chip label={plant.bu} color={plant.bu === PP ? GREEN : BLUE}
              bg={plant.bu === PP ? '#f0f8f4' : '#eef3fc'} border={plant.bu === PP ? '#cde7d6' : '#d6e2f6'} />
          </div>
        </div>
        <button onClick={onClose} aria-label="Close panel" style={{
          width: 24, height: 24, borderRadius: '50%', border: `1px solid ${LINE2}`, background: '#fff',
          color: MUTED, cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>×</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px' }}>
        <OeeRing oee={plant.oee} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            ['Lines', String(plant.linesCount)],
            ['Annual tons', plant.tons.toLocaleString()],
            ['OTIF', `${plant.otif.toFixed(1)}%`, HEALTH[plant.otif >= 95 ? 'good' : plant.otif >= 92 ? 'warn' : 'bad']],
            ['Days since recordable', String(plant.daysSinceRecordable), HEALTH[safeH]],
          ].map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 11, color: MUTED }}>{label}</span>
              <span style={{ ...mono, fontSize: 12.5, fontWeight: 600, color: color || INK }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={sect}>Top downtime reasons · lost minutes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reasons.map(([label, min]) => (
            <div key={label}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                <span style={{ flex: 1, fontSize: 12, color: '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: CORAL }}>{min.toLocaleString()}</span>
              </div>
              <GBar pct={min} max={maxReason} color={CORAL} h={6} />
            </div>
          ))}
        </div>
        <div style={{ ...mono, fontSize: 10, color: MUTED, marginTop: 8 }}>
          {plant.lostMin.toLocaleString()} lost minutes this month · {plant.maintOpen} open maintenance orders
        </div>
      </div>

      <div>
        <div style={sect}>Customers served from here</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {custs.length === 0 && <div style={{ fontSize: 12, color: MUTED }}>No key account volume routed through this site.</div>}
          {custs.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < custs.length - 1 ? '1px solid #f4f2ee' : 'none', fontSize: 12.5 }}>
              <StatusDot health={c.health} />
              <span style={{ flex: 1, color: '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{usdM(c.revenue / 1e6)}</span>
              <span style={{ ...mono, fontSize: 10.5, color: HEALTH[c.marginPct >= 15 ? 'good' : c.marginPct >= MARGIN_TARGET ? 'warn' : 'bad'], width: 38, textAlign: 'right' }}>{c.marginPct}%</span>
            </div>
          ))}
        </div>
      </div>

      <DerivedCallout rows={[
        ['Downtime Risk', `${plant.riskAssets} assets scoring > 0.6 over a 30-day horizon`],
        ['Supply Risk', `${mat.short} at ${mat.daysCover} days of cover · index ${mat.index.toFixed(1)}`],
        ['Safety Risk Index', `${plant.daysSinceRecordable} days since recordable · ${safeH === 'bad' ? 'elevated' : safeH === 'warn' ? 'watch' : 'stable'} band`],
      ]} note="Computed nightly in Snowflake from MES runs, PI telemetry drift, Kinaxis cover and Cority incidents." />
    </div>
  )
}

function PlantAtlas({ onBack }) {
  const [bu, setBu] = useState('all')
  const [health, setHealth] = useState('all')
  const [selected, setSelected] = useState(null)

  const visible = useMemo(
    () => PLANTS.filter(p => (bu === 'all' || p.bu === bu) && (health === 'all' || p.health === health)),
    [bu, health])

  const sel = selected ? plantById(selected) : null

  return (
    <>
      <style>{`.leaflet-container{background:${CANVAS};font-family:inherit}
        .leaflet-tooltip{border:1px solid ${LINE2};border-radius:8px;box-shadow:0 2px 8px rgba(26,26,26,0.10);padding:7px 11px}
        .leaflet-control-zoom a{color:#4b463d}`}</style>
      <AppHeader
        onBack={onBack}
        title="Plant Atlas"
        subtitle={`${NET.plants} plants worldwide · ${PLANTS.length} principal sites mapped · live OEE from MES`}
        right={<LiveBadge />}
      />
      <div style={{ padding: '11px 26px', borderBottom: `1px solid ${LINE}`, background: PLATE, flexShrink: 0 }}>
        <AtlasFilters bu={bu} setBu={setBu} health={health} setHealth={setHealth} />
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', background: CANVAS }}>
          <PlantMap plants={visible} selectedId={selected} onSelect={setSelected} />

          {/* KPI micro-strip, top-left */}
          <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 1200, display: 'flex', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 0', boxShadow: '0 2px 8px rgba(26,26,26,0.07)' }}>
            {[
              ['Network OEE', `${NET.oee}%`, HEALTH.warn],
              ['Plants', String(NET.plants), INK],
              ['Unplanned downtime', `${fmtK(NET.downtimeHrs)} hrs/mo`, CORAL],
              ['Recordable rate', NET.recordableRate.toFixed(2), HEALTH.good],
            ].map(([label, val, color], i) => (
              <div key={label} style={{ padding: '0 15px', borderLeft: i ? `1px solid ${LINE}` : 'none' }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
                <div style={{ ...mono, fontSize: 14, fontWeight: 600, color, marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Legend, bottom-left */}
          <div style={{ position: 'absolute', bottom: 14, left: 16, zIndex: 1200, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 8px rgba(26,26,26,0.07)', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[['good', 'Healthy · OEE ≥ 78%'], ['warn', 'Watch · 74 – 78%'], ['bad', 'Below target · < 74%']].map(([h, label]) => (
              <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#4b463d' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: HEALTH[h], opacity: 0.28, border: `1.6px solid ${HEALTH[h]}`, boxSizing: 'border-box' }} />
                {label}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: MUTED, marginTop: 2, paddingTop: 7, borderTop: '1px solid #f4f2ee' }}>
              <svg width="26" height="14" viewBox="0 0 26 14">
                <circle cx="5" cy="7" r="3" fill="none" stroke="#b9b2a6" strokeWidth="1.2" />
                <circle cx="17" cy="7" r="6" fill="none" stroke="#b9b2a6" strokeWidth="1.2" />
              </svg>
              Size = annual tons
            </div>
          </div>

          {!sel && (
            <div style={{ position: 'absolute', bottom: 14, right: 64, zIndex: 1200, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 13px', boxShadow: '0 2px 8px rgba(26,26,26,0.07)', fontSize: 11.5, color: '#6b6455', maxWidth: 240, lineHeight: 1.5 }}>
              Click a plant for OEE, downtime reasons, maintenance load and the accounts it ships.
            </div>
          )}
        </div>

        {sel && <PlantPanel plant={sel} onClose={() => setSelected(null)} />}
      </div>
    </>
  )
}

// ─── APP 2 · OPERATIONS PULSE ────────────────────────────────────────────────

const PULSE_KPIS = [
  { label: 'Network OEE', value: '76.4%', delta: '▼ 1.2 pts vs last quarter', good: false },
  { label: 'Unplanned downtime', value: '41.2K hrs', delta: '▲ 6% vs last quarter', good: false },
  { label: 'OTIF', value: '94.1%', delta: '▲ 0.6 pts vs last quarter', good: true },
  { label: 'Scrap', value: '3.4%', delta: '▼ 0.2 pts vs last quarter', good: true },
  { label: 'Recordable rate', value: '0.82', delta: '▼ 0.11 vs last quarter', good: true },
  { label: 'Cost per ton', value: '$842', delta: '▲ 2.1% vs last quarter', good: false },
]

const OEE_OPTION = {
  grid: { left: 42, right: 18, top: 22, bottom: 26 },
  tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v}%` },
  xAxis: { ...catAxis(M12), boundaryGap: false },
  yAxis: valAxis({ min: 74, max: 82, axisLabel: { ...AX_LABEL, formatter: '{value}%' } }),
  series: [{
    name: 'Network OEE', type: 'line', smooth: true, data: OEE_TREND, showSymbol: false,
    lineStyle: { color: BLUE, width: 2 }, itemStyle: { color: BLUE },
    areaStyle: { color: BLUE, opacity: 0.07 },
    markLine: {
      silent: true, symbol: 'none',
      lineStyle: { color: CORAL, type: 'dashed', width: 1.2 },
      label: { formatter: 'Target 80%', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5 },
      data: [{ yAxis: 80 }],
    },
    markPoint: {
      symbol: 'circle', symbolSize: 9,
      itemStyle: { color: '#fff', borderColor: CORAL, borderWidth: 2 },
      label: { formatter: '76.4% · Lavonia + 3 sites', position: 'bottom', color: CORAL, fontFamily: ECH_FONT, fontSize: 9.5, distance: 8 },
      data: [{ coord: [11, 76.4] }],
    },
  }],
}

const PARETO_TOTAL = DOWNTIME_PARETO.reduce((s, d) => s + d[1], 0)
const PARETO_CUM = (() => { let r = 0; return DOWNTIME_PARETO.map(d => { r += d[1]; return Math.round(r / PARETO_TOTAL * 1000) / 10 }) })()

const DOWNTIME_OPTION = {
  grid: { left: 128, right: 52, top: 14, bottom: 24 },
  tooltip: {
    trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT,
    formatter: ps => {
      const i = ps[0].dataIndex
      return `${DOWNTIME_PARETO[i][0]}<br/><b>${DOWNTIME_PARETO[i][1].toLocaleString()}</b> hrs · cumulative <b>${PARETO_CUM[i]}%</b>`
    },
  },
  xAxis: [valAxis({ show: false }), valAxis({ show: false, min: 0, max: 100 })],
  yAxis: { ...catAxis(DOWNTIME_PARETO.map(d => d[0])), inverse: true, axisLine: { show: false } },
  series: [
    {
      type: 'bar', data: DOWNTIME_PARETO.map(d => d[1]), barWidth: 15,
      label: { show: true, position: 'right', formatter: p => fmtK(p.value), fontFamily: ECH_FONT, fontSize: 10.5, fontWeight: 600, color: CORAL },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: CORAL }, { offset: 1, color: '#dd8f74' },
        ]),
      },
    },
    {
      type: 'line', xAxisIndex: 1, data: PARETO_CUM, symbolSize: 5,
      lineStyle: { color: PURPLE, width: 1.6 }, itemStyle: { color: '#fff', borderColor: PURPLE, borderWidth: 1.6 },
    },
  ],
}

const BU_OPTION = {
  grid: { left: 42, right: 14, top: 30, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => `${v}%` },
  legend: { top: 0, left: 40, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  xAxis: catAxis(M6),
  yAxis: valAxis({ min: 72, max: 82, axisLabel: { ...AX_LABEL, formatter: '{value}%' } }),
  series: [
    { name: IP, type: 'bar', data: OEE_BY_BU[IP], barWidth: '30%', itemStyle: { color: BLUE, opacity: 0.68, borderRadius: [3, 3, 0, 0] } },
    { name: PP, type: 'bar', data: OEE_BY_BU[PP], barWidth: '30%', itemStyle: { color: GREEN, opacity: 0.68, borderRadius: [3, 3, 0, 0] } },
  ],
}

const INDEX_OPTION = {
  grid: { left: 40, right: 16, top: 30, bottom: 26 },
  tooltip: { trigger: 'axis', ...TT },
  legend: { top: 0, left: 34, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  xAxis: { ...catAxis(M12), boundaryGap: false },
  yAxis: valAxis({ min: 92, max: 132 }),
  series: MATERIALS.map(m => ({
    name: m.short, type: 'line', smooth: true, data: m.series, showSymbol: false,
    lineStyle: { color: m.color, width: 1.9 }, itemStyle: { color: m.color },
    endLabel: { show: false },
  })).concat([{
    type: 'line', data: M12.map(() => 100), showSymbol: false, silent: true,
    lineStyle: { color: LINE2, width: 1, type: 'dashed' }, tooltip: { show: false }, name: 'Base 100',
  }]),
}

const SAFETY_OPTION = {
  grid: { left: 34, right: 12, top: 14, bottom: 24 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => `${v} recordables` },
  xAxis: catAxis(RECORDABLES_Q.map(r => r[0])),
  yAxis: valAxis({ max: 76 }),
  series: [{
    type: 'bar', data: RECORDABLES_Q.map(r => r[1]), barWidth: '46%',
    itemStyle: { color: GREEN, opacity: 0.6, borderRadius: [3, 3, 0, 0] },
    label: { show: true, position: 'top', fontFamily: ECH_FONT, fontSize: 10, color: MUTED },
  }],
}

const CO2_OPTION = {
  grid: { left: 40, right: 14, top: 16, bottom: 24 },
  tooltip: { trigger: 'axis', ...TT, valueFormatter: v => `${v} tCO2e / kt` },
  xAxis: { ...catAxis(M12), boundaryGap: false },
  yAxis: valAxis({ min: 172, max: 224 }),
  series: [{
    type: 'line', smooth: true, data: CO2_INTENSITY, showSymbol: false, name: 'Scope 1+2 intensity',
    lineStyle: { color: GREEN, width: 2 }, itemStyle: { color: GREEN }, areaStyle: { color: GREEN, opacity: 0.08 },
  }],
}

const TOP_LOSS = [...PLANTS].sort((a, b) => b.lostMin - a.lostMin).slice(0, 6)

function OperationsPulse({ onBack }) {
  const span2 = { gridColumn: '1 / -1' }
  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Operations Pulse"
        subtitle={`Twelve months to Aug 2026 · ${NET.sources} sources · ${fmtK(NET.runsPerYear)} production runs / yr`}
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {PULSE_KPIS.map(k => <GKpi key={k.label} {...k} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <GCard title="Network OEE vs 80% target · 12 months"
            right={<span style={{ ...mono, fontSize: 10.5, color: HEALTH.bad }}>▼ 2.5 pts since Sep</span>}>
            <Chart option={OEE_OPTION} height={228} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              The slide is concentrated, not broad — four plants (Lavonia, Lagos, Jakarta, Ho Chi Minh) carry 62% of the gap to target.
            </div>
          </GCard>

          <GCard title="Unplanned downtime by reason · hours per month"
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{fmtK(PARETO_TOTAL)} hrs</span>}>
            <Chart option={DOWNTIME_OPTION} height={168} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              Mechanical and changeover together are {PARETO_CUM[1]}% of all lost hours. The Downtime Risk signal has already
              scored {PLANTS.reduce((s, p) => s + p.riskAssets, 0)} assets above 0.6 across the mapped sites.
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ ...sect, margin: '4px 0 8px' }}>Top plants by lost minutes</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {TOP_LOSS.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '5.5px 0', borderBottom: i < TOP_LOSS.length - 1 ? '1px solid #f4f2ee' : 'none', fontSize: 12.5 }}>
                    <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#4b463d' }}>
                      <StatusDot health={p.health} />{p.name}
                    </span>
                    <span style={{ width: 84, textAlign: 'right', ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{p.lostMin.toLocaleString()}</span>
                    <span style={{ width: 60, textAlign: 'right', ...mono, fontSize: 11, color: HEALTH[p.health] }}>{p.oee.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </GCard>

          <GCard title="OEE by business unit · last 6 months">
            <Chart option={BU_OPTION} height={196} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Paper Packaging holds {OEE_BY_BU[PP][5]}% on long containerboard runs. Industrial Packaging carries the
              changeover burden and has fallen to {OEE_BY_BU[IP][5]}%.
            </div>
          </GCard>

          <GCard title="Raw material index · base 100 = Sep 2025" accent={PURPLE}>
            <Chart option={INDEX_OPTION} height={196} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MATERIALS.map(m => (
                <div key={m.id} style={{ flex: '1 1 130px', border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 9px', background: '#fff' }}>
                  <div style={{ fontSize: 10, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.short}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <span style={{ ...mono, fontSize: 13.5, fontWeight: 600, color: m.index >= 100 ? CORAL : GREEN }}>{m.index.toFixed(1)}</span>
                    <span style={{ ...mono, fontSize: 9.5, color: MUTED }}>{m.daysCover}d cover</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: '#4b463d', lineHeight: 1.5, marginTop: 'auto' }}>
              Steel is up <b style={{ color: CORAL }}>28.4%</b> and blow-grade resin <b style={{ color: CORAL }}>21.7%</b> in twelve months,
              while OCC has fallen back below base. This is where the factory hands over to the commercial team —
              contract price realization is only up 15.1% over the same window.
            </div>
          </GCard>

          <GCard title="Safety">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...sect }}>Recordables by quarter</div>
                <Chart option={SAFETY_OPTION} height={150} />
              </div>
              <div style={{ width: 176, flexShrink: 0 }}>
                <div style={{ ...sect }}>Days since recordable</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {DAYS_BY_REGION.map(([region, days]) => (
                    <div key={region}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                        <span style={{ flex: 1, fontSize: 11.5, color: '#4b463d' }}>{region}</span>
                        <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: days >= 90 ? HEALTH.good : days >= 60 ? HEALTH.warn : HEALTH.bad }}>{days}</span>
                      </div>
                      <GBar pct={days} max={120} h={6} color={days >= 90 ? HEALTH.good : days >= 60 ? HEALTH.warn : HEALTH.bad} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Recordable rate {NET.recordableRate} per 200K hours, down from 0.93. Asia Pacific carries the shortest streak —
              Jakarta and Ho Chi Minh are also the two lowest-OEE sites in the region.
            </div>
          </GCard>

          <GCard title="Emissions & circularity">
            <Chart option={CO2_OPTION} height={150} />
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                ['Scope 1+2 intensity', `${CO2_INTENSITY[11]} tCO2e/kt`, `▼ ${Math.round((1 - CO2_INTENSITY[11] / CO2_INTENSITY[0]) * 1000) / 10}% YoY`],
                ['Recycled input', `${RECYCLED_CONTENT}%`, '▲ 3.8 pts YoY'],
              ].map(([label, val, delta]) => (
                <div key={label} style={{ flex: 1, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 12px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
                  <div style={{ ...mono, fontSize: 14, fontWeight: 600, color: INK, marginTop: 3 }}>{val}</div>
                  <div style={{ ...mono, fontSize: 10, color: HEALTH.good, marginTop: 2 }}>{delta}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              74K reconditioning batches returned used drums to service this year. Recycled input tracks OCC availability,
              which is why the index falling back below base helps both cost and Scope 3.
            </div>
          </GCard>

          <div style={span2}>
            <DerivedCallout title="What the graph is telling the COO this month" rows={[
              ['Downtime Risk', 'Lavonia seamer #3 scores 0.81 over 30 days — 96,400 lost minutes already booked against it'],
              ['Supply Risk', 'HDPE blow-grade at 21 days of cover with 58% of spend on two suppliers — the thinnest position in the network'],
              ['Cost-to-Serve', `Freight is the top margin driver on 3 of 10 key accounts — see Account Profitability`],
              ['OTIF', `${NET.ordersAtRisk} orders at risk this month, ${AT_RISK.filter(r => r[2] === 'lavonia').length} of them traceable to the Lavonia shortfall`],
            ]} note="Every signal above is a node in the Greif Operations Context Graph, recomputed nightly from MES, PI Historian, Kinaxis, Blue Yonder and Cority." />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── APP 3 · ACCOUNT PROFITABILITY ───────────────────────────────────────────

function marginWaterfall(c) {
  const after1 = c.price - c.material
  const after2 = after1 - c.conversion
  const after3 = after2 - c.freight
  const cats = ['Price / ton', 'less Material', 'less Conversion', 'less Freight', 'Contribution']
  const base = [0, after1, after2, after3, 0]
  const vals = [c.price, c.material, c.conversion, c.freight, c.cm]
  const colors = [BLUE, '#b9b2a6', '#b9b2a6', CORAL, c.flagged ? HEALTH.bad : HEALTH.good]
  return {
    grid: { left: 46, right: 16, top: 22, bottom: 42 },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT,
      formatter: ps => {
        const i = ps[0].dataIndex
        return `${cats[i]}<br/><b>$${vals[i]}</b> per ton`
      },
    },
    xAxis: { ...catAxis(cats), axisLabel: { ...AX_LABEL, interval: 0, rotate: 18 } },
    yAxis: valAxis({ max: Math.ceil(c.price / 100) * 100, axisLabel: { ...AX_LABEL, formatter: '${value}' } }),
    series: [
      { type: 'bar', stack: 'w', data: base, itemStyle: { color: 'transparent' }, silent: true, barWidth: '46%' },
      {
        type: 'bar', stack: 'w', barWidth: '46%',
        data: vals.map((v, i) => ({ value: v, itemStyle: { color: colors[i], opacity: 0.82, borderRadius: [3, 3, 0, 0] } })),
        label: {
          show: true, position: 'top', formatter: p => `$${p.value}`,
          fontFamily: ECH_FONT, fontSize: 10, fontWeight: 600,
          color: p => colors[p.dataIndex],
        },
      },
    ],
  }
}

const CTS_OPTION = {
  grid: { left: 48, right: 20, top: 20, bottom: 40 },
  tooltip: {
    ...TT, trigger: 'item',
    formatter: p => {
      const c = CUSTOMERS[p.dataIndex]
      return `<b>${c.name}</b><br/>${c.miles} mi avg · $${c.freight}/t freight<br/>${tonsFmt(c.tons)} · margin ${c.marginPct}%`
    },
  },
  xAxis: valAxis({ name: 'Avg shipping distance (mi)', nameLocation: 'middle', nameGap: 26, nameTextStyle: { ...AX_LABEL }, min: 200, max: 740 }),
  yAxis: valAxis({ name: 'Freight $ / ton', nameLocation: 'middle', nameGap: 34, nameTextStyle: { ...AX_LABEL }, min: 140, max: 260 }),
  series: [{
    type: 'scatter',
    data: CUSTOMERS.map(c => [c.miles, c.freight]),
    symbolSize: (_, p) => 10 + Math.sqrt(CUSTOMERS[p.dataIndex].tons) / 12,
    itemStyle: {
      color: p => CUSTOMERS[p.dataIndex].flagged ? CORAL : BLUE,
      opacity: 0.55, borderColor: '#fff', borderWidth: 1.4,
    },
    label: {
      show: true, position: 'right', distance: 6,
      formatter: p => CUSTOMERS[p.dataIndex].flagged ? CUSTOMERS[p.dataIndex].name.split(' ')[0] : '',
      fontFamily: ECH_FONT, fontSize: 9.5, color: CORAL, fontWeight: 600,
    },
    markLine: {
      silent: true, symbol: 'none',
      lineStyle: { color: LINE2, type: 'dashed', width: 1 },
      label: { formatter: 'network avg $194/t', position: 'insideStartTop', color: MUTED, fontFamily: ECH_FONT, fontSize: 9 },
      data: [{ yAxis: 194 }],
    },
  }],
}

const LAG_GAP = COST_INDEX.map((v, i) => Math.round((v - PRICE_INDEX[i]) * 10) / 10)
const LAG_OPTION = {
  grid: { left: 40, right: 18, top: 30, bottom: 26 },
  tooltip: {
    trigger: 'axis', ...TT,
    formatter: ps => {
      const i = ps[0].dataIndex
      return `${M12[i]}<br/>Blended input cost <b>${COST_INDEX[i]}</b><br/>Realized price <b>${PRICE_INDEX[i]}</b><br/>` +
        `<span style="color:${CORAL}">Unrecovered ${LAG_GAP[i]} pts</span>`
    },
  },
  legend: {
    top: 0, left: 34, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14,
    data: ['Blended input cost index', 'Realized price index'],
    textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' },
  },
  xAxis: { ...catAxis(M12), boundaryGap: false },
  yAxis: valAxis({ min: 96, max: 130 }),
  series: [
    { name: '_base', type: 'line', stack: 'gap', data: PRICE_INDEX, lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 }, symbol: 'none', silent: true, z: 1, tooltip: { show: false } },
    { name: '_gap', type: 'line', stack: 'gap', data: LAG_GAP, lineStyle: { opacity: 0 }, areaStyle: { color: CORAL, opacity: 0.15 }, symbol: 'none', silent: true, z: 1, tooltip: { show: false } },
    { name: 'Blended input cost index', type: 'line', smooth: true, data: COST_INDEX, showSymbol: false, lineStyle: { color: CORAL, width: 2 }, itemStyle: { color: CORAL }, z: 3 },
    { name: 'Realized price index', type: 'line', smooth: true, data: PRICE_INDEX, showSymbol: false, lineStyle: { color: BLUE, width: 2 }, itemStyle: { color: BLUE }, z: 3 },
  ],
}

function CustomerTable({ selected, onSelect }) {
  const rows = [...CUSTOMERS].sort((a, b) => b.marginPct - a.marginPct)
  const td = { padding: '8px 0', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: 12.5 }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Account</th>
          <th style={thStyle}>Segment</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Revenue YTD</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Tons</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Margin %</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Freight $/t</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>OTIF</th>
          <th style={{ ...thStyle, textAlign: 'right', width: 92 }}>8-mo trend</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => {
          const isSel = selected === c.id
          const bd = i < rows.length - 1 ? '1px solid #f4f2ee' : 'none'
          return (
            <tr key={c.id} onClick={() => onSelect(c.id)}
              style={{ cursor: 'pointer', background: isSel ? '#f7f6f3' : 'transparent', boxShadow: isSel ? 'inset 3px 0 0 #16341f' : 'none', transition: 'background .12s' }}
              onMouseOver={e => { if (!isSel) e.currentTarget.style.background = '#faf9f6' }}
              onMouseOut={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>
              <td style={{ ...td, borderBottom: bd, paddingLeft: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 500, color: INK }}>
                  <StatusDot health={c.health} />{c.name}
                </span>
              </td>
              <td style={{ ...td, borderBottom: bd, color: '#6b6455', fontSize: 12 }}>{c.segment}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d' }}>{usdM(c.revenue / 1e6)}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d' }}>{c.tons.toLocaleString()}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 12, fontWeight: 600, color: HEALTH[c.health] }}>{c.marginPct}%</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: c.freight >= 210 ? CORAL : '#4b463d' }}>${c.freight}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: c.otif >= NET.otifTarget ? HEALTH.good : HEALTH.warn }}>{c.otif.toFixed(1)}%</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right' }}>
                <span style={{ display: 'inline-block' }}>
                  <Spark values={c.spark} w={86} h={22} color={HEALTH[c.health]} />
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function AccountProfitability({ onBack }) {
  const [selected, setSelected] = useState('nutrien')
  const c = custById(selected)
  const wf = useMemo(() => marginWaterfall(c), [selected])
  const span2 = { gridColumn: '1 / -1' }
  const totalRev = CUSTOMERS.reduce((s, x) => s + x.revenue, 0)
  const totalTons = CUSTOMERS.reduce((s, x) => s + x.tons, 0)
  const blendedMargin = Math.round(CUSTOMERS.reduce((s, x) => s + x.cm * x.tons, 0) / totalRev * 1000) / 10
  const freightSpend = CUSTOMERS.reduce((s, x) => s + x.freight * x.tons, 0)

  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Account Profitability"
        subtitle="Ten key accounts · contribution margin after material, conversion and freight"
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <GKpi label="Revenue YTD" value={usdM(totalRev / 1e6)} sub={`${totalTons.toLocaleString()} tons`} />
          <GKpi label="Blended margin" value={`${blendedMargin}%`} delta="▼ 2.4 pts vs last year" good={false} />
          <GKpi label="Freight spend" value={usdM(freightSpend / 1e6)} sub={`avg $194 / ton`} />
          <GKpi label="Network cost / ton" value={`$${NET.costPerTon}`} delta="▲ 2.1% vs last quarter" good={false} />
          <GKpi label="Below target margin" value={`${CUSTOMERS.filter(x => x.flagged).length} of ${CUSTOMERS.length}`} sub={`target ${MARGIN_TARGET}% contribution`} />
          <GKpi label="Unrecovered cost" value={`$${LAG_UNRECOVERED}M`} delta="pass-through lag YTD" good={false} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <GCard title="Contribution margin by account · click a row" style={span2}
            right={<span style={{ ...mono, fontSize: 10.5, color: MUTED }}>ranked by margin %</span>}>
            <CustomerTable selected={selected} onSelect={setSelected} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              The three agricultural accounts sit below the {MARGIN_TARGET}% target. None of them is priced badly —
              all three are shipping heavy, low-density product a long way from the wrong plant.
            </div>
          </GCard>

          <GCard title={`Margin waterfall · ${c.name} · $ per ton`}
            right={<Chip label={`${c.marginPct}% contribution`} color={HEALTH[c.health]}
              bg={c.flagged ? '#faf1ee' : '#f2faf5'} border={c.flagged ? '#eddcd5' : '#cde7d6'} />}>
            <Chart option={wf} height={252} />
            <div style={{ fontSize: 12, color: '#4b463d', lineHeight: 1.55, marginTop: 'auto' }}>
              {c.flagged
                ? <>Freight alone takes <b style={{ color: CORAL }}>${c.freight}</b> of the <b>${c.price}</b> price —
                  {' '}{Math.round(c.freight / c.price * 1000) / 10}% of revenue, against {Math.round(c.cm / c.price * 1000) / 10}% left as contribution.
                  {' '}Cut the lane and the account is healthy.</>
                : <>Freight is <b>{Math.round(c.freight / c.price * 1000) / 10}%</b> of price here — short lanes from
                  {' '}{c.plants.map(p => plantById(p).name).join(', ')} keep <b style={{ color: HEALTH.good }}>${c.cm}</b> per ton of contribution.</>}
            </div>
          </GCard>

          <GCard title="Cost to serve · freight $/ton vs average distance" accent={PURPLE}>
            <Chart option={CTS_OPTION} height={252} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              {Object.entries(SOURCING_FIX).map(([id, f]) => {
                const cu = custById(id)
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 11.5, lineHeight: 1.5, color: '#4b463d' }}>
                    <Chip label="Re-source" color={PURPLE} bg="#f4f1fa" border="#e0daf0" />
                    <span>
                      <b>{cu.name}</b> is served from {f.from}. {f.better} is {f.milesSaved} mi closer on the same lane —
                      {' '}<b style={{ color: GREEN }}>${f.saveUsd}M/yr</b> of freight.
                    </span>
                  </div>
                )
              })}
            </div>
          </GCard>

          <GCard title="Price realization vs input cost · base 100 = Sep 2025" style={span2} accent={CORAL}>
            <Chart option={LAG_OPTION} height={230} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: '#faf1ee', border: '1px solid #eddcd5', borderRadius: 9, padding: '10px 14px' }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: CORAL }}>Pass-through lag</div>
                <div style={{ ...serif, fontSize: 24, fontWeight: 500, color: '#7a4a3a', marginTop: 3 }}>${LAG_UNRECOVERED}M</div>
                <div style={{ ...mono, fontSize: 10, color: '#a4715f', marginTop: 2 }}>unrecovered input cost YTD</div>
              </div>
              <div style={{ flex: 1, minWidth: 240, fontSize: 12, color: '#4b463d', lineHeight: 1.6 }}>
                Index-linked contracts reset on a quarterly lag. Blended input cost is at <b style={{ color: CORAL }}>{COST_INDEX[11]}</b> while
                realized price sits at <b style={{ color: BLUE }}>{PRICE_INDEX[11]}</b> — a <b>{LAG_GAP[11]} point</b> gap that has been open,
                and widening, for nine consecutive months. Steel-heavy SKUs carry most of it: cold-rolled coil is at {matById('steel').index.toFixed(1)}.
              </div>
            </div>
          </GCard>

          <GCard title="Share of wallet · estimated total spend vs Greif">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...CUSTOMERS].sort((a, b) => b.wallet - a.wallet).map(x => (
                <div key={x.id}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span>
                    <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{usdM(x.wallet)} wallet</span>
                    <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: x.sharePct >= 30 ? HEALTH.good : BLUE, width: 42, textAlign: 'right' }}>{x.sharePct}%</span>
                  </div>
                  <GBar pct={x.sharePct} max={45} color={x.sharePct >= 30 ? GREEN : BLUE} h={7} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Headroom of {usdM(CUSTOMERS.reduce((s, x) => s + x.wallet, 0) - totalRev / 1e6)} across the ten accounts —
              but the three flagged accounts should be re-sourced before more tons are chased into them.
            </div>
          </GCard>

          <GCard title="Volume commitment · contracted tons vs actual YTD">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...CUSTOMERS].sort((a, b) => a.ytdPct - b.ytdPct).map(x => {
                const short = x.ytdPct < 64
                return (
                  <div key={x.id}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#4b463d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span>
                      <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{tonsFmt(x.tons)} / {tonsFmt(x.commitTons)}</span>
                      <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: short ? CORAL : HEALTH.good, width: 42, textAlign: 'right' }}>{x.ytdPct}%</span>
                    </div>
                    <GBar pct={x.ytdPct} target={66.7} color={short ? CORAL : GREEN} h={7} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 11.5, lineHeight: 1.5, color: '#4b463d', marginTop: 'auto' }}>
              <Chip label="Take-or-pay" color={GOLD} bg="#fbf5e8" border="#efe2c6" />
              <span>
                Marker is the 66.7% eight-month pace. {CUSTOMERS.filter(x => x.ytdPct < 64).length} accounts are running behind
                their annual commitment — Dow and Nutrien are the two with take-or-pay clauses, worth
                {' '}<b>$180K</b> and <b>$310K</b> of shortfall billing if the year closes here.
              </span>
            </div>
          </GCard>
        </div>
      </div>
    </>
  )
}

// ─── APP 4 · ORDER BOOK & SERVICE ────────────────────────────────────────────

const BACKLOG_OPTION = {
  grid: { left: 46, right: 46, top: 30, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT },
  legend: { top: 0, left: 40, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { fontFamily: ECH_FONT, fontSize: 10, color: '#4b463d' } },
  xAxis: catAxis(BACKLOG_MONTHS),
  yAxis: [
    valAxis({ max: 90, axisLabel: { ...AX_LABEL, formatter: '${value}M' } }),
    valAxis({ min: 60, max: 105, splitLine: { show: false }, axisLabel: { ...AX_LABEL, formatter: '{value}%' } }),
  ],
  series: [
    { name: IP, type: 'bar', stack: 'b', data: BACKLOG_IP, barWidth: '42%', itemStyle: { color: BLUE, opacity: 0.68 } },
    { name: PP, type: 'bar', stack: 'b', data: BACKLOG_PP, barWidth: '42%', itemStyle: { color: GREEN, opacity: 0.62, borderRadius: [3, 3, 0, 0] } },
    {
      name: 'Booked vs capacity', type: 'line', yAxisIndex: 1, data: BACKLOG_CAP, smooth: true, symbolSize: 5,
      lineStyle: { color: CORAL, width: 2 }, itemStyle: { color: '#fff', borderColor: CORAL, borderWidth: 2 },
      markLine: {
        silent: true, symbol: 'none', lineStyle: { color: CORAL, type: 'dashed', width: 1 },
        label: { formatter: '100% capacity', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9 },
        data: [{ yAxis: 100 }],
      },
    },
  ],
}

const FUNNEL_OPTION = {
  tooltip: { ...TT, trigger: 'item', formatter: p => `${p.name}<br/><b>${p.value.toLocaleString()}</b>` },
  series: [{
    type: 'funnel', left: '8%', right: '8%', top: 8, bottom: 8, minSize: '32%',
    sort: 'descending', gap: 3,
    label: { position: 'inside', formatter: p => `${p.name}  ${p.value.toLocaleString()}`, fontFamily: ECH_FONT, fontSize: 11, fontWeight: 600, color: '#fff' },
    itemStyle: { borderColor: '#fff', borderWidth: 2 },
    data: [
      { name: 'Quotes', value: FUNNEL[0][1], itemStyle: { color: BLUE, opacity: 0.5 } },
      { name: 'Qualified', value: FUNNEL[1][1], itemStyle: { color: BLUE, opacity: 0.72 } },
      { name: 'Won', value: FUNNEL[2][1], itemStyle: { color: GREEN, opacity: 0.85 } },
    ],
  }],
}

const OTIF_OPTION = {
  grid: { left: 132, right: 46, top: 10, bottom: 26 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TT, valueFormatter: v => `${v}% OTIF` },
  xAxis: valAxis({ min: 84, max: 100, axisLabel: { ...AX_LABEL, formatter: '{value}%' } }),
  yAxis: { ...catAxis([...CUSTOMERS].sort((a, b) => a.otif - b.otif).map(c => c.name)), axisLine: { show: false } },
  series: [{
    type: 'bar', barWidth: 12,
    data: [...CUSTOMERS].sort((a, b) => a.otif - b.otif).map(c => ({
      value: c.otif,
      itemStyle: { color: c.otif >= NET.otifTarget ? GREEN : CORAL, opacity: 0.72, borderRadius: [0, 3, 3, 0] },
    })),
    label: { show: true, position: 'right', formatter: p => `${p.value}%`, fontFamily: ECH_FONT, fontSize: 10, color: MUTED },
    markLine: {
      silent: true, symbol: 'none', lineStyle: { color: CORAL, type: 'dashed', width: 1.2 },
      label: { formatter: 'target 95%', position: 'insideEndTop', color: CORAL, fontFamily: ECH_FONT, fontSize: 9 },
      data: [{ xAxis: NET.otifTarget }],
    },
  }],
}

function AtRiskTable() {
  const td = { padding: '8px 0', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: 12.5 }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Order</th>
          <th style={thStyle}>Customer</th>
          <th style={thStyle}>Plant</th>
          <th style={thStyle}>SKU</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Tons</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Promised</th>
          <th style={{ ...thStyle, textAlign: 'right', paddingRight: 14 }}>Risk</th>
          <th style={thStyle}>Reason</th>
        </tr>
      </thead>
      <tbody>
        {AT_RISK.map(([no, cid, pid, sid, tons, promised, late, reason, note], i) => {
          const r = RISK_REASONS[reason]
          const p = plantById(pid)
          const bd = i < AT_RISK.length - 1 ? '1px solid #f4f2ee' : 'none'
          return (
            <tr key={no} title={note}>
              <td style={{ ...td, borderBottom: bd, ...mono, fontSize: 10.5, color: '#8a7340' }}>{no}</td>
              <td style={{ ...td, borderBottom: bd, color: INK, fontWeight: 500 }}>{custById(cid).name}</td>
              <td style={{ ...td, borderBottom: bd }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#4b463d' }}>
                  <StatusDot health={p.health} />{p.name}
                </span>
              </td>
              <td style={{ ...td, borderBottom: bd, color: '#6b6455', fontSize: 12 }}>{skuById(sid).name}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11.5, color: '#4b463d' }}>{tons.toLocaleString()}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', ...mono, fontSize: 11, color: MUTED }}>{promised}</td>
              <td style={{ ...td, borderBottom: bd, textAlign: 'right', paddingRight: 14, ...mono, fontSize: 11.5, fontWeight: 600, color: late >= 5 ? HEALTH.bad : late >= 3 ? HEALTH.warn : MUTED }}>+{late}d</td>
              <td style={{ ...td, borderBottom: bd }}><Chip label={r.label} color={r.color} bg={r.bg} border={r.border} /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function OrderBook({ onBack }) {
  const span2 = { gridColumn: '1 / -1' }
  const alloc = ALLOCATION
  const allocSku = skuById(alloc.sku)
  const allocPlant = plantById(alloc.plant)
  const winRate = Math.round(FUNNEL[2][1] / FUNNEL[0][1] * 1000) / 10

  return (
    <>
      <AppHeader
        onBack={onBack}
        title="Order Book & Service"
        subtitle="Live backlog from SAP S/4HANA · promise dates from Kinaxis · delivery events from project44"
        right={<LiveBadge />}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 26px', background: CANVAS }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <GKpi label="Backlog" value={`$${NET.backlogUsd}M`} sub="next 6 months" />
          <GKpi label="Tons" value={fmtK(NET.backlogTons)} sub="committed volume" />
          <GKpi label="Orders at risk" value={String(NET.ordersAtRisk)} delta="▲ 11 vs last month" good={false} />
          <GKpi label="OTIF" value={`${NET.otif}%`} delta="▲ 0.6 pts · target 95%" good />
          <GKpi label="Avg lead time" value={`${NET.leadTimeDays}d`} delta="▲ 0.9d vs last month" good={false} />
          <GKpi label="Win rate" value={`${winRate}%`} sub={`${FUNNEL[2][1]} of ${FUNNEL[0][1].toLocaleString()} quotes`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <GCard title="Backlog by month · business unit and capacity" style={span2}>
            <Chart option={BACKLOG_OPTION} height={228} />
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
              September is booked to {BACKLOG_CAP[0]}% of committed capacity network-wide, but the load is not evenly spread —
              Lavonia and La Porte are both over 100% while Monterrey sits at 78%.
            </div>
          </GCard>

          <GCard title={`At-risk orders · ${NET.ordersAtRisk} open, 10 largest shown`} style={span2} accent={CORAL}>
            <AtRiskTable />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: MUTED }}>
              {Object.entries(RISK_REASONS).map(([k, r]) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, opacity: 0.75 }} />
                  {r.label} · {AT_RISK.filter(a => a[7] === k).length}
                </span>
              ))}
              <span style={{ marginLeft: 'auto' }}>Hover a row for the traced cause.</span>
            </div>
          </GCard>

          <GCard title="OTIF by customer vs 95% target">
            <Chart option={OTIF_OPTION} height={266} />
            <div style={{ fontSize: 11.5, color: '#4b463d', lineHeight: 1.5, marginTop: 'auto' }}>
              <b>Dow Chemical</b> at {custById('dow').otif}% is the largest account below target. Both of its late orders route
              through Lavonia GA — the same 71.2% OEE that shows up on the Plant Atlas.
            </div>
          </GCard>

          <GCard title="Demand vs capacity · next 8 weeks">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UTILIZATION.map(([pid, util]) => {
                const p = plantById(pid)
                const over = util > 100
                return (
                  <div key={pid}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#4b463d', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <StatusDot health={p.health} />{p.name}
                      </span>
                      <span style={{ ...mono, fontSize: 10, color: MUTED }}>{p.bu === PP ? 'Paper' : 'Industrial'}</span>
                      <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: over ? HEALTH.bad : util >= 92 ? HEALTH.warn : HEALTH.good, width: 42, textAlign: 'right' }}>{util}%</span>
                    </div>
                    <GBar pct={util} max={120} target={100} color={over ? HEALTH.bad : util >= 92 ? HEALTH.warn : GREEN} h={7} />
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              {UTILIZATION.filter(u => u[1] > 100).length} plants are booked beyond committed capacity. Both are Industrial Packaging
              sites on the US Gulf / South-East axis.
            </div>
          </GCard>

          <GCard title="Allocation conflict" accent={GOLD} style={{ background: '#fffdf8', borderLeft: `3px solid ${GOLD}` }}>
            <div style={{ fontSize: 12.5, color: '#4b463d', lineHeight: 1.6 }}>
              <b>{allocSku.name}</b> at <b>{allocPlant.name} ({allocPlant.city.split(', ')[1]})</b> — {alloc.week}.
              Two accounts are claiming the same line time.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['Available', `${alloc.available.toLocaleString()}t`, INK], ['Demand', `${alloc.demand.toLocaleString()}t`, INK], ['Short', `${alloc.short.toLocaleString()}t`, CORAL]].map(([label, val, color]) => (
                <div key={label} style={{ flex: 1, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 12px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>{label}</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 600, color, marginTop: 3 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alloc.claims.map(cl => {
                const cu = custById(cl.id)
                return (
                  <div key={cl.id}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#4b463d' }}>{cu.name}</span>
                      <span style={{ ...mono, fontSize: 10.5, color: MUTED }}>{cl.note}</span>
                      <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: INK }}>{cl.tons.toLocaleString()}t</span>
                    </div>
                    <GBar pct={cl.tons} max={alloc.demand} color={cu.flagged ? CORAL : BLUE} h={7} />
                  </div>
                )
              })}
            </div>
            <div style={{ background: '#f7f5fb', border: '1px solid #e5e0f0', borderLeft: `3px solid ${PURPLE}`, borderRadius: 9, padding: '10px 13px', marginTop: 'auto' }}>
              <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: PURPLE, marginBottom: 6 }}>Recommended split</div>
              <div style={{ fontSize: 12, color: '#4b463d', lineHeight: 1.6 }}>{alloc.recommend}</div>
              <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 6 }}>{alloc.cost}</div>
            </div>
          </GCard>

          <GCard title="Quote pipeline · trailing 12 months">
            <Chart option={FUNNEL_OPTION} height={168} />
            <div>
              <div style={sect}>Win rate by segment</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {WIN_BY_SEGMENT.map(([seg, rate]) => (
                  <div key={seg}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#4b463d' }}>{seg}</span>
                      <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: rate >= winRate ? HEALTH.good : HEALTH.warn }}>{rate}%</span>
                    </div>
                    <GBar pct={rate} max={30} color={rate >= winRate ? GREEN : GOLD} h={6} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 'auto' }}>
              Agriculture wins least and earns least — the same freight-heavy lanes that drag Nutrien, Yara and Corteva
              below the margin target also make those quotes uncompetitive.
            </div>
          </GCard>
        </div>
      </div>
    </>
  )
}

// ─── MANIFEST ────────────────────────────────────────────────────────────────

export const GREIF_APPS = [
  {
    id: 'gr_atlas', name: 'Plant Atlas',
    desc: 'Every plant worldwide, colored by OEE and safety.',
    stats: '214 plants · 76.4% network OEE · 4 below target',
    chips: ['Plant', 'Production Line', 'OEE Score', 'Downtime Risk', 'Safety Risk Index'],
    graph: 'Greif Operations Context Graph',
    Thumb: AtlasThumbGr, View: PlantAtlas,
  },
  {
    id: 'gr_pulse', name: 'Operations Pulse',
    desc: 'Executive view of OEE, downtime, service, safety and input costs.',
    stats: '15 sources · 4.8M runs/yr · $842 cost per ton',
    chips: ['Production Run', 'Downtime Event', 'OEE Score', 'Commodity Index', 'Emissions Record'],
    graph: 'Greif Operations Context Graph',
    Thumb: PulseThumbGr, View: OperationsPulse,
  },
  {
    id: 'gr_margin', name: 'Account Profitability',
    desc: 'Which accounts actually earn money after freight and material pass-through.',
    stats: '10 key accounts · $842 cost/ton · 3 below target margin',
    chips: ['Customer', 'Cost-to-Serve', 'Freight Lane', 'Commodity Index', 'Order Line'],
    graph: 'Greif Operations Context Graph',
    Thumb: MarginThumbGr, View: AccountProfitability,
  },
  {
    id: 'gr_orderbook', name: 'Order Book & Service',
    desc: 'Live backlog, at-risk orders and OTIF by account.',
    stats: '$412M backlog · 94.1% OTIF · 38 orders at risk',
    chips: ['Sales Order', 'Order Line', 'OTIF Score', 'Demand Forecast', 'Outbound Shipment'],
    graph: 'Greif Operations Context Graph',
    Thumb: OrderThumbGr, View: OrderBook,
  },
]
