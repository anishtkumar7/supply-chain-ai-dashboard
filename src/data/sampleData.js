/** Central headquarters (distribution & planning hub) */
export const headquarters = {
  name: 'HQ — Aurora Logistics Center',
  city: 'Chicago, IL',
  lat: 41.8369,
  lng: -87.6847,
};

/** Inbound lane health toward HQ: on_time = green, delayed = yellow, stuck = red */
export const suppliers = [
  {
    id: 'SUP-901',
    name: 'Shenzhen Precision Components',
    country: 'China',
    category: 'Electronics',
    lat: 22.5431,
    lng: 114.0579,
    leadTimeDays: 42,
    onTimePct: 94.2,
    spendYtdUsd: 1840000,
    riskScore: 'Medium',
    inboundLaneStatus: 'stuck',
    delayReason:
      'Shipment held at customs — missing HS reclassification docs for revised PCB stack-up. Broker filing ETA 48h.',
  },
  {
    id: 'SUP-412',
    name: 'Ho Chi Minh Plastics Works',
    country: 'Vietnam',
    category: 'Packaging',
    lat: 10.8231,
    lng: 106.6297,
    leadTimeDays: 28,
    onTimePct: 97.8,
    spendYtdUsd: 612000,
    riskScore: 'Low',
    inboundLaneStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SUP-773',
    name: 'Monterrey Metal Forming',
    country: 'Mexico',
    category: 'Sheet metal',
    lat: 25.6866,
    lng: -100.3161,
    leadTimeDays: 11,
    onTimePct: 91.5,
    spendYtdUsd: 928000,
    riskScore: 'Low',
    inboundLaneStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SUP-228',
    name: 'Rotterdam Chemical Supply',
    country: 'Netherlands',
    category: 'Chemicals',
    lat: 51.9244,
    lng: 4.4777,
    leadTimeDays: 35,
    onTimePct: 98.9,
    spendYtdUsd: 445000,
    riskScore: 'Low',
    inboundLaneStatus: 'delayed',
    delayReason:
      'Vessel bunching at Rotterdam — berth window slipped 6 days. Co-loaders prioritized; our container rolled to next sailing.',
  },
  {
    id: 'SUP-551',
    name: 'Chennai Cable & Harness',
    country: 'India',
    category: 'Wire harness',
    lat: 13.0827,
    lng: 80.2707,
    leadTimeDays: 38,
    onTimePct: 89.4,
    spendYtdUsd: 731000,
    riskScore: 'Medium',
    inboundLaneStatus: 'delayed',
    delayReason:
      'Monsoon-related airport ground handling slowdown — airfreight pallet not tendered until D+3 vs. booked cut.',
  },
  {
    id: 'SUP-664',
    name: 'Stuttgart Drive Systems',
    country: 'Germany',
    category: 'Motors',
    lat: 48.7758,
    lng: 9.1829,
    leadTimeDays: 22,
    onTimePct: 99.1,
    spendYtdUsd: 1205000,
    riskScore: 'Low',
    inboundLaneStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SUP-119',
    name: 'Penang PCB Assembly',
    country: 'Malaysia',
    category: 'PCB',
    lat: 5.4141,
    lng: 100.3288,
    leadTimeDays: 31,
    onTimePct: 96.0,
    spendYtdUsd: 887000,
    riskScore: 'Low',
    inboundLaneStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SUP-337',
    name: 'Toronto Cold-Chain Packaging',
    country: 'Canada',
    category: 'Insulated packaging',
    lat: 43.6532,
    lng: -79.3832,
    leadTimeDays: 6,
    onTimePct: 99.4,
    spendYtdUsd: 214000,
    riskScore: 'Low',
    inboundLaneStatus: 'stuck',
    delayReason:
      'Cross-border inspection — CFIA hold on foam lot traceability; awaiting mill cert upload from sub-supplier.',
  },
];

const LANE_COLORS = {
  on_time: '#22c55e',
  delayed: '#eab308',
  stuck: '#ef4444',
};

export function supplierArcColor(status) {
  return LANE_COLORS[status] || LANE_COLORS.on_time;
}

export function buildSupplierArcs(supplierList) {
  return supplierList.map((s) => ({
    supplierId: s.id,
    name: `${s.name} → HQ`,
    startLat: s.lat,
    startLng: s.lng,
    endLat: headquarters.lat,
    endLng: headquarters.lng,
    color: supplierArcColor(s.inboundLaneStatus),
    inboundLaneStatus: s.inboundLaneStatus,
    delayReason: s.delayReason,
  }));
}

export function buildSupplierPoints(supplierList) {
  return [
    {
      id: 'HQ',
      name: headquarters.name,
      lat: headquarters.lat,
      lng: headquarters.lng,
      color: '#fbbf24',
      altitude: 0.12,
      radius: 0.35,
    },
    ...supplierList.map((s) => ({
      id: s.id,
      name: `${s.name} (${s.country})`,
      lat: s.lat,
      lng: s.lng,
      color: supplierArcColor(s.inboundLaneStatus),
      altitude: 0.06,
      radius: 0.22,
    })),
  ];
}

export const activeShipments = [
  {
    id: 'SHP-20481',
    sku: 'FG-AERO-200',
    origin: 'Port of Shanghai',
    dest: 'Los Angeles, CA',
    mode: 'Ocean',
    startLat: 31.2304,
    startLng: 121.4737,
    endLat: 33.7361,
    endLng: -118.2639,
    etaDays: 9,
    status: 'At sea',
    carrier: 'Maersk',
    routeStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SHP-20492',
    sku: 'FG-HVAC-88',
    origin: 'Hamburg',
    dest: 'Newark, NJ',
    mode: 'Ocean',
    startLat: 53.5511,
    startLng: 9.9937,
    endLat: 40.7357,
    endLng: -74.1724,
    etaDays: 5,
    status: 'Transshipment',
    carrier: 'Hapag-Lloyd',
    routeStatus: 'delayed',
    delayReason:
      'Rotterdam transshipment miss — feeder arrived after mother vessel cut-off; automatic roll to next weekly string.',
  },
  {
    id: 'SHP-20503',
    sku: 'FG-PUMP-12',
    origin: 'Busan',
    dest: 'Savannah, GA',
    mode: 'Ocean',
    startLat: 35.1796,
    startLng: 129.0756,
    endLat: 32.0809,
    endLng: -81.0912,
    etaDays: 14,
    status: 'At sea',
    carrier: 'ONE',
    routeStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SHP-20511',
    sku: 'FG-MOTOR-7',
    origin: 'Rotterdam',
    dest: 'Norfolk, VA',
    mode: 'Ocean',
    startLat: 51.9244,
    startLng: 4.4777,
    endLat: 36.8508,
    endLng: -76.2859,
    etaDays: 7,
    status: 'At sea',
    carrier: 'MSC',
    routeStatus: 'stuck',
    delayReason:
      'U.S. CBP manifest hold at Norfolk — random intensive exam queue; container staged in bonded yard awaiting strip.',
  },
  {
    id: 'SHP-20518',
    sku: 'FG-CTRL-301',
    origin: 'Singapore',
    dest: 'Miami, FL',
    mode: 'Ocean',
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: 25.7617,
    endLng: -80.1918,
    etaDays: 18,
    status: 'At sea',
    carrier: 'CMA CGM',
    routeStatus: 'delayed',
    delayReason:
      'Panama Canal transit slot congestion — 4-day slide vs. proforma; updated ETA pushed to planning engine.',
  },
  {
    id: 'SHP-20524',
    sku: 'FG-AERO-200',
    origin: 'Guadalajara',
    dest: headquarters.city,
    mode: 'Truck',
    startLat: 20.6597,
    startLng: -103.3496,
    endLat: headquarters.lat,
    endLng: headquarters.lng,
    etaDays: 2,
    status: 'In transit',
    carrier: 'J.B. Hunt',
    routeStatus: 'on_time',
    delayReason: null,
  },
  {
    id: 'SHP-20531',
    sku: 'FG-HVAC-88',
    origin: 'Toronto',
    dest: headquarters.city,
    mode: 'Rail',
    startLat: 43.6532,
    startLng: -79.3832,
    endLat: headquarters.lat,
    endLng: headquarters.lng,
    etaDays: 1,
    status: 'In yard',
    carrier: 'CN Rail',
    routeStatus: 'stuck',
    delayReason:
      'Customs documentation mismatch on NAFTA preference code — rail held at interchange until commercial invoice amended.',
  },
];

export function shipmentArcColor(status) {
  return LANE_COLORS[status] || LANE_COLORS.on_time;
}

export function buildShipmentArcs(shipments) {
  return shipments.map((s) => ({
    shipmentId: s.id,
    name: `${s.id}: ${s.origin} → ${s.dest}`,
    startLat: s.startLat,
    startLng: s.startLng,
    endLat: s.endLat,
    endLng: s.endLng,
    color: shipmentArcColor(s.routeStatus),
    routeStatus: s.routeStatus,
    delayReason: s.delayReason,
  }));
}

/** Finished goods — unit cost for inventory valuation (USD) */
/** grossMarginPct = trailing gross margin % (revenue − COGS) / revenue, by SKU family */
export const inventoryRows = [
  { sku: 'FG-AERO-200', product: 'AeroCool Pro 200', onHand: 8420, committed: 3100, available: 5320, weeksCover: 4.1, status: 'Healthy', unitCostUsd: 412, grossMarginPct: 28.4 },
  { sku: 'FG-HVAC-88', product: 'ClimateLine 88', onHand: 2140, committed: 1890, available: 250, weeksCover: 0.6, status: 'Critical', unitCostUsd: 689, grossMarginPct: 32.1 },
  { sku: 'FG-PUMP-12', product: 'HydroMax 12', onHand: 15600, committed: 4200, available: 11400, weeksCover: 6.8, status: 'Healthy', unitCostUsd: 198, grossMarginPct: 22.6 },
  { sku: 'FG-MOTOR-7', product: 'SynDrive 7', onHand: 980, committed: 720, available: 260, weeksCover: 1.2, status: 'Watch', unitCostUsd: 1240, grossMarginPct: 38.0 },
  { sku: 'FG-CTRL-301', product: 'LogicMaster 301', onHand: 4320, committed: 2100, available: 2220, weeksCover: 3.4, status: 'Healthy', unitCostUsd: 356, grossMarginPct: 35.2 },
  { sku: 'FG-FILTER-55', product: 'PureFlow 55', onHand: 28800, committed: 12000, available: 16800, weeksCover: 5.2, status: 'Healthy', unitCostUsd: 42, grossMarginPct: 18.9 },
  { sku: 'FG-SENSOR-9', product: 'SenseEdge 9', onHand: 410, committed: 380, available: 30, weeksCover: 0.4, status: 'Critical', unitCostUsd: 88, grossMarginPct: 41.3 },
];

export function computeFgInventoryKpis(rows) {
  const totalSkus = rows.length;
  const skusAtRisk = rows.filter((r) => r.status === 'Critical' || r.status === 'Watch').length;
  const totalValueUsd = rows.reduce((sum, r) => sum + r.onHand * r.unitCostUsd, 0);
  return { totalSkus, skusAtRisk, totalValueUsd };
}

/** Class A (high value) component inventory — small curated set */
export const classAComponents = [
  {
    component: 'CMP-MOTOR-7S',
    description: 'BLDC motor assembly w/ encoder',
    supplier: 'Stuttgart Drive Systems',
    onHand: 1100,
    unitCostUsd: 1860,
    daysSupply: 24,
    status: 'Watch',
    drivesFg: 'FG-MOTOR-7',
  },
  {
    component: 'CMP-PCB-12L',
    description: '12-layer main logic board',
    supplier: 'Penang PCB Assembly',
    onHand: 8400,
    unitCostUsd: 142,
    daysSupply: 31,
    status: 'Healthy',
    drivesFg: 'FG-AERO-200',
  },
  {
    component: 'CMP-SENSOR-S9',
    description: 'MEMS + fusion IMU module',
    supplier: 'Shenzhen Precision Components',
    onHand: 900,
    unitCostUsd: 1180,
    daysSupply: 11,
    status: 'Critical',
    drivesFg: 'FG-SENSOR-9',
  },
  {
    component: 'CMP-INVERT-A2',
    description: 'Power stage IGBT stack',
    supplier: 'Shenzhen Precision Components',
    onHand: 620,
    unitCostUsd: 2240,
    daysSupply: 18,
    status: 'Watch',
    drivesFg: 'FG-HVAC-88',
  },
  {
    component: 'RAW-ALU-5052',
    description: 'Hydroformed housing blank',
    supplier: 'Monterrey Metal Forming',
    onHand: 38000,
    unitCostUsd: 18.6,
    daysSupply: 44,
    status: 'Healthy',
    drivesFg: 'FG-PUMP-12',
  },
  {
    component: 'CMP-CTRL-SOC',
    description: 'ARM + safety MCU SiP',
    supplier: 'Penang PCB Assembly',
    onHand: 4100,
    unitCostUsd: 96,
    daysSupply: 29,
    status: 'Healthy',
    drivesFg: 'FG-CTRL-301',
  },
];

export const inventoryTrend = [
  { week: 'W01', fillRate: 97.2, stockoutEvents: 2 },
  { week: 'W02', fillRate: 96.4, stockoutEvents: 4 },
  { week: 'W03', fillRate: 98.1, stockoutEvents: 1 },
  { week: 'W04', fillRate: 97.8, stockoutEvents: 2 },
  { week: 'W05', fillRate: 98.6, stockoutEvents: 0 },
  { week: 'W06', fillRate: 97.0, stockoutEvents: 5 },
  { week: 'W07', fillRate: 98.9, stockoutEvents: 1 },
  { week: 'W08', fillRate: 99.1, stockoutEvents: 0 },
];

export const demandForecastSeries = [
  { month: 'Jan', actual: 118000, forecast: 115000, confidenceLow: 108000, confidenceHigh: 122000 },
  { month: 'Feb', actual: 122400, forecast: 120500, confidenceLow: 113000, confidenceHigh: 128000 },
  { month: 'Mar', actual: 126800, forecast: 124200, confidenceLow: 117000, confidenceHigh: 131000 },
  { month: 'Apr', actual: null, forecast: 128900, confidenceLow: 121000, confidenceHigh: 136000 },
  { month: 'May', actual: null, forecast: 131200, confidenceLow: 123000, confidenceHigh: 139000 },
  { month: 'Jun', actual: null, forecast: 133500, confidenceLow: 125000, confidenceHigh: 142000 },
];

export const skuDemandDetail = [
  { sku: 'FG-AERO-200', family: 'Cooling', next90d: 42000, biasPct: 2.1, seasonality: 'Summer peak' },
  { sku: 'FG-HVAC-88', family: 'Climate', next90d: 18600, biasPct: -1.4, seasonality: 'Stable' },
  { sku: 'FG-PUMP-12', family: 'Fluid', next90d: 51200, biasPct: 0.6, seasonality: 'Ag uplift' },
  { sku: 'FG-MOTOR-7', family: 'Motion', next90d: 9800, biasPct: 3.8, seasonality: 'OEM contracts' },
  { sku: 'FG-CTRL-301', family: 'Controls', next90d: 22400, biasPct: -0.9, seasonality: 'Project-based' },
];

export const supplyPlanningRows = [
  { component: 'CMP-PCB-12L', parentSku: 'FG-AERO-200', moq: 5000, eoq: 12000, onHand: 8400, ldd: '2026-08-14', netNeed: 5600, reorderDate: '2026-04-28', supplier: 'Penang PCB Assembly' },
  { component: 'CMP-MOTOR-7S', parentSku: 'FG-MOTOR-7', moq: 800, eoq: 2400, onHand: 1100, ldd: '2026-05-03', netNeed: 1900, reorderDate: '2026-04-24', supplier: 'Stuttgart Drive Systems' },
  { component: 'PKG-FOAM-A1', parentSku: 'FG-HVAC-88', moq: 10000, eoq: 40000, onHand: 22000, ldd: '2026-05-11', netNeed: 28000, reorderDate: '2026-04-23', supplier: 'Ho Chi Minh Plastics Works' },
  { component: 'CMP-SENSOR-S9', parentSku: 'FG-SENSOR-9', moq: 2000, eoq: 8000, onHand: 900, ldd: '2026-04-26', netNeed: 6200, reorderDate: '2026-04-21', supplier: 'Shenzhen Precision Components' },
  { component: 'RAW-ALU-5052', parentSku: 'FG-PUMP-12', moq: 15000, eoq: 45000, onHand: 38000, ldd: '2026-09-22', netNeed: 12000, reorderDate: '2026-05-02', supplier: 'Monterrey Metal Forming' },
  { component: 'CHEM-COAT-X4', parentSku: 'FG-CTRL-301', moq: 4000, eoq: 16000, onHand: 14200, ldd: '2026-07-19', netNeed: 4800, reorderDate: '2026-04-29', supplier: 'Rotterdam Chemical Supply' },
];

export const procurementTimeline = [
  { week: 'W09', plannedSpend: 420000, receipts: 380000 },
  { week: 'W10', plannedSpend: 510000, receipts: 495000 },
  { week: 'W11', plannedSpend: 465000, receipts: 450000 },
  { week: 'W12', plannedSpend: 602000, receipts: 520000 },
  { week: 'W13', plannedSpend: 488000, receipts: 500000 },
  { week: 'W14', plannedSpend: 530000, receipts: 540000 },
];

/** Top-level nav (non-inventory). Inventory uses grouped sidebar control. */
export const navItems = [
  { id: 'suppliers', label: 'Supplier Tracking', shortLabel: 'Suppliers' },
  { id: 'fulfillment', label: 'Fulfillment Monitoring', shortLabel: 'Fulfillment' },
  { id: 'demand', label: 'Demand Forecasting', shortLabel: 'Demand' },
  { id: 'planning', label: 'Supply Planning', shortLabel: 'Planning' },
];

export const inventoryNavIds = {
  fg: 'inventory-fg',
  components: 'inventory-components',
};

export const inventoryNavGroup = {
  label: 'Inventory Monitoring',
  shortLabel: 'Inventory',
  children: [
    { id: inventoryNavIds.fg, label: 'Finished goods', shortLabel: 'FG' },
    { id: inventoryNavIds.components, label: 'Components (Class A)', shortLabel: 'Class A' },
  ],
};
export const orderBankData = [
  { sku: 'FG-AERO-200', product: 'AeroCool Pro 200', inProcess: 12, inBank: 28, unitValue: 145000 },
  { sku: 'FG-HVAC-88', product: 'ClimateLine 88', inProcess: 8, inBank: 19, unitValue: 162000 },
  { sku: 'FG-PUMP-12', product: 'HydroMax 12', inProcess: 22, inBank: 41, unitValue: 98000 },
  { sku: 'FG-MOTOR-7', product: 'SynDrive 7', inProcess: 15, inBank: 33, unitValue: 112000 },
  { sku: 'FG-CTRL-301', product: 'LogicMaster 301', inProcess: 30, inBank: 55, unitValue: 78000 },
  { sku: 'FG-FILTER-55', product: 'PureFlow 55', inProcess: 18, inBank: 47, unitValue: 85000 },
  { sku: 'FG-SENSOR-9', product: 'SenseEdge 9', inProcess: 9, inBank: 22, unitValue: 134000 },
];

export const orderBankHistory = [
  { month: 'Jan', y2026: 38, y2025: 32, y2024: 27, y2023: 24 },
  { month: 'Feb', y2026: 42, y2025: 35, y2024: 30, y2023: 26 },
  { month: 'Mar', y2026: 55, y2025: 44, y2024: 38, y2023: 31 },
  { month: 'Apr', y2026: 61, y2025: 50, y2024: 42, y2023: 35 },
  { month: 'May', y2026: null, y2025: 58, y2024: 47, y2023: 39 },
  { month: 'Jun', y2026: null, y2025: 62, y2024: 51, y2023: 42 },
  { month: 'Jul', y2026: null, y2025: 54, y2024: 46, y2023: 38 },
  { month: 'Aug', y2026: null, y2025: 48, y2024: 41, y2023: 34 },
  { month: 'Sep', y2026: null, y2025: 53, y2024: 45, y2023: 37 },
  { month: 'Oct', y2026: null, y2025: 60, y2024: 49, y2023: 40 },
  { month: 'Nov', y2026: null, y2025: 65, y2024: 54, y2023: 44 },
  { month: 'Dec', y2026: null, y2025: 70, y2024: 58, y2023: 47 },
];