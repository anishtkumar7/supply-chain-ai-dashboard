/**
 * Neutral bootstrap data when Demo Controls → "Clear All Local Data" is used.
 * Crisis narrative remains in sampleData + module seeds; clean boot swaps these via demoScenario.
 */

export const agentAlertsClean = [
  {
    agent: 'Inventory Agent',
    module: 'Inventory Monitoring',
    status: 'ALERT',
    lastRun: '4 minutes ago',
    alert: 'FG-R450-CO at 4 days cover. No confirmed inbound. Reorder recommended immediately.',
    severity: 'CRITICAL',
    affectedSKU: 'FG-R450-CO',
  },
  {
    agent: 'Supply Planning Agent',
    module: 'Supply Planning',
    status: 'ALERT',
    lastRun: '4 minutes ago',
    alert: 'CMP-WRH-004 Wiring Harness reorder date was 2026-04-21. No PO created. FG-R450-CO line stoppage risk in 11 days.',
    severity: 'CRITICAL',
    affectedSKU: 'FG-R450-CO',
  },
  {
    agent: 'Fulfillment Agent',
    module: 'Fulfillment Monitoring',
    status: 'ALERT',
    lastRun: '2 minutes ago',
    alert: 'SHP-30531 stuck in Toronto yard 48hrs. CN Rail mechanical issue. Air freight alternative costs $24,000 vs $3,200 ocean. Recommend wait and escalate.',
    severity: 'HIGH',
    affectedSKU: 'FG-C100-CA',
  },
  {
    agent: 'Supplier Risk Agent',
    module: 'Supplier Tracking',
    status: 'ALERT',
    lastRun: '6 minutes ago',
    alert: 'Shenzhen Precision Components OTIF at 94.2% and has 3 STUCK shipments. CMP-BAT-009 battery packs at 14 days supply. Alternate supplier search initiated.',
    severity: 'HIGH',
    affectedSKU: 'FG-E300-EV',
  },
  {
    agent: 'Order Bank Agent',
    module: 'Order Bank',
    status: 'ALERT',
    lastRun: '8 minutes ago',
    alert: 'CO-8827 Detroit Metro Transit Cab Assembly order due 2026-05-05. Available inventory: 3 units. Order quantity: 8 units. Shortfall of 5 units. Promise date at risk.',
    severity: 'HIGH',
    affectedSKU: 'FG-C100-CA',
  },
  {
    agent: 'Forecast Agent',
    module: 'Demand Forecasting',
    status: 'RUNNING',
    lastRun: '1 minute ago',
    alert: null,
    severity: null,
    affectedSKU: null,
  },
];

/** Component rows: tone down Vectrum crisis SKUs for clean boot. */
export function neutralizeComponentDataForCleanSample(rows) {
  return rows.map((r) => {
    if (r.sku === 'CMP-WHL-DRV') {
      const onHand = 40;
      return {
        ...r,
        onHand,
        extended: onHand * r.unitCost,
        daysSupply: 14,
        health: 'HEALTHY',
        reorderDate: '2026-05-20',
        netNeed: Math.min(r.netNeed ?? 8, 8),
      };
    }
    if (r.sku === 'CMP-WRH-004') {
      return { ...r, daysSupply: 11, health: 'HEALTHY' };
    }
    if (r.sku === 'CMP-FRM-CHX') {
      return { ...r, daysSupply: 10, health: 'WATCH', reorderDate: '2026-05-10' };
    }
    return r;
  });
}

/** Minimal row for generating non-crisis sequenced movement for CMP-WHL-DRV */
export function getNeutralCmpWhlDrvStoryRow(description) {
  return {
    sku: 'CMP-WHL-DRV',
    description,
    drivesFG: 'FG-T800-CL',
    supplier: 'Detroit Wheel Systems',
    onHand: 40,
    sequenced: true,
    inventoryClass: 'A',
  };
}

export const REPLENISHMENT_SEED_CLEAN = [
  { id: 'rq-1', minsAgo: 8, line: 'Line 1', station: 'Station 4', sku: 'CMP-RBR-GRM-12', description: 'Rubber Grommet 1/2 inch', inventoryClass: 'C', qtyRequested: 200, urgency: 'URGENT', requestedBy: 'Op. Rodriguez', status: 'PENDING' },
  { id: 'rq-2', minsAgo: 12, line: 'Line 1', station: 'Station 4', sku: 'CMP-ENG-001', description: 'Diesel Engine Assembly 13L', inventoryClass: 'A', qtyRequested: 2, urgency: 'URGENT', requestedBy: 'Op. Rodriguez', status: 'PENDING' },
  { id: 'rq-3', minsAgo: 24, line: 'Line 2', station: 'Station 7', sku: 'CMP-M10-FLN', description: 'M10 Flange Nut', inventoryClass: 'C', qtyRequested: 500, urgency: 'NORMAL', requestedBy: 'Op. Chen', status: 'ACKNOWLEDGED' },
  { id: 'rq-4', minsAgo: 45, line: 'Line 1', station: 'Station 4', sku: 'CMP-CBL-TIE', description: 'Cable Tie 200mm', inventoryClass: 'C', qtyRequested: 300, urgency: 'NORMAL', requestedBy: 'Op. Rodriguez', status: 'DISPATCHED' },
  { id: 'rq-5', minsAgo: 60, line: 'Line 3', station: 'Station 2', sku: 'CMP-BRK-CAL', description: 'Brake Caliper Assembly', inventoryClass: 'B', qtyRequested: 4, urgency: 'NORMAL', requestedBy: 'Op. Williams', status: 'DELIVERED' },
];

export const SHOP_FLOAT_STATUS_CLEAN = [
  {
    component: 'Diesel Engine Assembly 13L',
    sku: 'CMP-ENG-001',
    lines: {
      'Line 1': { count: 4, target: 6, status: 'HEALTHY' },
      'Line 2': { count: 2, target: 6, status: 'LOW' },
      'Line 3': null,
      'Line 4': null,
    },
  },
  {
    component: 'Drive Axle Assembly HD',
    sku: 'CMP-AXL-002',
    lines: {
      'Line 1': { count: 3, target: 4, status: 'HEALTHY' },
      'Line 2': { count: 1, target: 4, status: 'CRITICAL' },
      'Line 3': null,
      'Line 4': null,
    },
  },
  {
    component: 'Wiring Harness Complete',
    sku: 'CMP-WRH-004',
    lines: {
      'Line 1': { count: 2, target: 8, status: 'CRITICAL' },
      'Line 2': { count: 5, target: 8, status: 'HEALTHY' },
      'Line 3': null,
      'Line 4': null,
    },
  },
  {
    component: 'EV Battery Pack 320kWh',
    sku: 'CMP-BAT-009',
    lines: {
      'Line 1': null,
      'Line 2': null,
      'Line 3': null,
      'Line 4': { count: 0, target: 3, status: 'CRITICAL' },
    },
  },
  {
    component: 'Power Inverter Stack EV',
    sku: 'CMP-INV-006',
    lines: {
      'Line 1': null,
      'Line 2': null,
      'Line 3': null,
      'Line 4': { count: 1, target: 4, status: 'LOW' },
    },
  },
];

export const SHOP_SHORTAGES_CLEAN = [
  { sku: 'CMP-BAT-009', description: 'EV Battery Pack', workOrder: 'WO-4423', shortQty: 120, daysToStop: 0 },
  { sku: 'CMP-WRH-004', description: 'Wiring Harness', workOrder: 'WO-4424', shortQty: 6200, daysToStop: 0 },
];

export const SHOP_WO_4424_CLEAN = {
  id: 'WO-4424',
  line: 'Line 1',
  product: 'Regional Cab-Over Truck',
  sku: 'FG-R450-CO',
  planned: 6,
  complete: 0,
  progress: 0,
  parts: 'Parts Shortage — CMP-WRH-004',
  partsState: 'critical',
  start: '2:00 PM',
  status: 'PENDING — SHORTAGE',
  bom: [
    { sku: 'CMP-WRH-004', required: 6200, available: 900, status: 'CRITICAL' },
    { sku: 'CMP-AXL-002', required: 6, available: 1100, status: 'AVAILABLE' },
  ],
};

export const MY_WORKSTATION_PARTS_CLEAN = [
  { sku: 'CMP-M8-HXB', description: 'M8 x 25mm Hex Bolt', inventoryClass: 'C', qtyAtStation: 145, minQty: 50, status: 'HEALTHY' },
  { sku: 'CMP-M10-FLN', description: 'M10 Flange Nut', inventoryClass: 'C', qtyAtStation: 38, minQty: 50, status: 'LOW' },
  { sku: 'CMP-RBR-GRM-12', description: 'Rubber Grommet 1/2 inch', inventoryClass: 'C', qtyAtStation: 12, minQty: 30, status: 'CRITICAL' },
  { sku: 'CMP-WRH-004', description: 'Wiring Harness Complete', inventoryClass: 'A', qtyAtStation: 2, minQty: 3, status: 'LOW' },
  { sku: 'CMP-ENG-001', description: 'Diesel Engine Assembly', inventoryClass: 'A', qtyAtStation: 1, minQty: 2, status: 'CRITICAL' },
  { sku: 'CMP-SHC-M8', description: 'Socket Head Cap Screw M8', inventoryClass: 'C', qtyAtStation: 89, minQty: 40, status: 'HEALTHY' },
  { sku: 'CMP-THR-LCK-M', description: 'Threadlocker Medium Strength', inventoryClass: 'C', qtyAtStation: 6, minQty: 10, status: 'LOW' },
];

export const MY_WORKSTATION_REQUESTS_CLEAN = [
  {
    id: 'REQ-CBL-1',
    sku: 'CMP-CBL-TIE',
    description: 'Cable Tie 200mm',
    requestedQty: 200,
    status: 'DISPATCHED',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    stationId: 'Line 1 — Station 4',
    estDelivery: '10 min',
    urgency: 'URGENT',
  },
  {
    id: 'REQ-WSH-1',
    sku: 'CMP-WSH-M8',
    description: 'M8 Flat Washer',
    requestedQty: 500,
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stationId: 'Line 1 — Station 4',
    estDelivery: 'Completed',
    urgency: 'NORMAL',
  },
];

export const RECEIVING_HISTORY_CLEAN = [
  { date: 'Apr 25', shipmentId: 'SHP-30470', poNumber: 'PO-2026-0033', sku: 'CMP-HYD-008', supplier: 'Rotterdam Industrial', expectedQty: 4000, receivedQty: 4000, variance: 0, condition: 'Good', receivedBy: 'J. Martinez', status: 'COMPLETE' },
  { date: 'Apr 22', shipmentId: 'SHP-30465', poNumber: 'PO-2026-0031', sku: 'CMP-ECU-007', supplier: 'Penang PCB', expectedQty: 16000, receivedQty: 15840, variance: -160, condition: 'Good — short ship', receivedBy: 'J. Martinez', status: 'DISCREPANCY' },
  { date: 'Apr 18', shipmentId: 'SHP-30458', poNumber: 'PO-2026-0029', sku: 'CMP-STL-005', supplier: 'Monterrey Metal', expectedQty: 45000, receivedQty: 45000, variance: 0, condition: 'Good', receivedBy: 'P. Patel', status: 'COMPLETE' },
  { date: 'Apr 15', shipmentId: 'SHP-30451', poNumber: 'PO-2026-0027', sku: 'CMP-CAB-010', supplier: 'Ho Chi Minh Plastics', expectedQty: 8000, receivedQty: 7200, variance: -800, condition: 'Damaged partial accept', receivedBy: 'J. Martinez', status: 'DISCREPANCY' },
  { date: 'Apr 10', shipmentId: 'SHP-30444', poNumber: 'PO-2026-0025', sku: 'CMP-TCM-003', supplier: 'Penang PCB', expectedQty: 12000, receivedQty: 12000, variance: 0, condition: 'Good', receivedBy: 'S. Patel', status: 'COMPLETE' },
];

export const PO_NUMBERS_CRISIS_ONLY = new Set(['PO-2026-0043']);
