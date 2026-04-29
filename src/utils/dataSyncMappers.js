import { toNum, toStr } from './dataSyncParse';

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k];
  }
  return undefined;
}

export function mapRowsToSkuData(mappedRows, previous) {
  const bySku = new Map(previous.map((s) => [s.sku, s]));
  return mappedRows.map((r) => {
    const sku = toStr(pick(r, ['SKU', 'sku']));
    const prev = bySku.get(sku) || {};
    return {
      sku,
      product: toStr(pick(r, ['Product', 'product']) ?? prev.product),
      family: toStr(pick(r, ['Family', 'family']) ?? prev.family),
      unitValue: toNum(pick(r, ['Unit Value', 'UnitValue', 'unitValue'])),
      onHand: toNum(pick(r, ['On Hand', 'OnHand', 'onHand'])),
      committed: toNum(pick(r, ['Committed', 'committed'])),
      available: toNum(pick(r, ['Available', 'available'])),
      wksCover: toNum(pick(r, ['Weeks Cover', 'WeeksCover', 'wksCover'])),
      status: toStr(pick(r, ['Status', 'status']) || 'HEALTHY'),
      grossMargin: toNum(pick(r, ['Gross Margin', 'GrossMargin', 'grossMargin'])),
      ordersInBank: prev.ordersInBank ?? 0,
      ordersInProcess: prev.ordersInProcess ?? 0,
      forecastNext90: prev.forecastNext90 ?? 0,
      forecastBias: prev.forecastBias ?? 0,
      seasonalityNote: prev.seasonalityNote ?? '',
      customerSegment: prev.customerSegment ?? '',
    };
  });
}

export function mapRowsToComponentData(mappedRows, previous) {
  const bySku = new Map(previous.map((c) => [c.sku, c]));
  return mappedRows.map((r) => {
    const sku = toStr(pick(r, ['SKU', 'sku']));
    const prev = bySku.get(sku) || {};
    const onHand = toNum(pick(r, ['On Hand', 'OnHand', 'onHand']));
    const unitCost = toNum(pick(r, ['Unit Cost', 'UnitCost', 'unitCost']));
    return {
      sku,
      description: toStr(pick(r, ['Description', 'description']) ?? prev.description),
      drivesFG: toStr(
        pick(r, ['Drives FG SKU', 'Drives FG', 'DrivesFG', 'drivesFG']) ?? prev.drivesFG
      ),
      supplier: toStr(pick(r, ['Supplier', 'supplier']) ?? prev.supplier),
      supplierID: toStr(pick(r, ['Supplier ID', 'SupplierID', 'supplierID']) ?? prev.supplierID),
      country: toStr(pick(r, ['Country', 'country']) ?? prev.country),
      onHand,
      unitCost,
      extended: onHand * unitCost,
      daysSupply: toNum(pick(r, ['Days Supply', 'DaysSupply', 'daysSupply'])),
      health: toStr(pick(r, ['Health', 'health']) || 'HEALTHY'),
      reorderDate: toStr(pick(r, ['Reorder Date', 'ReorderDate', 'reorderDate']) ?? prev.reorderDate),
      moq: toNum(pick(r, ['MOQ', 'moq'])),
      eoq: toNum(pick(r, ['EOQ', 'eoq'])),
      netNeed: prev.netNeed ?? 0,
      tariffRate: prev.tariffRate ?? 0,
    };
  });
}

export function mapRowsToSupplierData(mappedRows, previous) {
  const byId = new Map(previous.map((s) => [s.id, s]));
  return mappedRows.map((r) => {
    const id = toStr(pick(r, ['Supplier ID', 'SupplierID', 'id']));
    const prev = byId.get(id) || {};
    return {
      id,
      name: toStr(pick(r, ['Name', 'name']) ?? prev.name),
      country: toStr(pick(r, ['Country', 'country']) ?? prev.country),
      category: toStr(pick(r, ['Category', 'category']) ?? prev.category),
      leadDays: toNum(pick(r, ['Lead Days', 'LeadDays', 'leadDays'])),
      otifPct: toNum(pick(r, ['OTIF Pct', 'OTIF', 'otifPct'])),
      spendUSD: toNum(pick(r, ['Spend USD', 'SpendUSD', 'spendUSD'])),
      inboundStatus: prev.inboundStatus ?? 'ON TIME',
      risk: toStr(pick(r, ['Risk Level', 'Risk', 'risk']) || 'LOW'),
      lat: prev.lat ?? 0,
      lng: prev.lng ?? 0,
      onTimeCount: prev.onTimeCount ?? 0,
      delayedCount: prev.delayedCount ?? 0,
      stuckCount: prev.stuckCount ?? 0,
    };
  });
}

export function mapRowsToCustomerOrders(mappedRows) {
  return mappedRows.map((r) => ({
    id: toStr(pick(r, ['Order ID', 'OrderID', 'id'])),
    customer: toStr(pick(r, ['Customer', 'customer'])),
    sku: toStr(pick(r, ['SKU', 'sku'])),
    product: toStr(pick(r, ['Product', 'product'])),
    qtyOrdered: toNum(pick(r, ['Qty Ordered', 'QtyOrdered', 'qtyOrdered'])),
    promiseDate: toStr(pick(r, ['Promise Date', 'PromiseDate', 'promiseDate'])),
    priority: toStr(pick(r, ['Priority', 'priority']) || 'MEDIUM'),
  }));
}

export function mapRowsToShipments(mappedRows, previous) {
  const byId = new Map(previous.map((s) => [s.id, s]));
  return mappedRows.map((r) => {
    const id = toStr(pick(r, ['Shipment ID', 'ShipmentID', 'id']));
    const prev = byId.get(id) || {};
    return {
      id,
      sku: toStr(pick(r, ['SKU', 'sku'])),
      origin: toStr(pick(r, ['Origin', 'origin'])),
      destination: toStr(pick(r, ['Destination', 'destination'])),
      mode: toStr(pick(r, ['Mode', 'mode'])),
      carrier: toStr(pick(r, ['Carrier', 'carrier'])),
      etaDays: toNum(pick(r, ['ETA Days', 'ETADays', 'etaDays'])),
      status: toStr(pick(r, ['Status', 'status'])),
      routeStatus: toStr(pick(r, ['Route Status', 'RouteStatus', 'routeStatus']) || 'IN TRANSIT'),
      delayReason: pick(r, ['Delay Reason', 'DelayReason', 'delayReason']) || null,
      lat1: prev.lat1 ?? 0,
      lng1: prev.lng1 ?? 0,
      lat2: prev.lat2 ?? 0,
      lng2: prev.lng2 ?? 0,
    };
  });
}

export function mergeForecastIntoSkuData(mappedRows, skuList) {
  const bySku = new Map(mappedRows.map((r) => [toStr(pick(r, ['SKU', 'sku'])), r]));
  return skuList.map((s) => {
    const r = bySku.get(s.sku);
    if (!r) return s;
    return {
      ...s,
      family: toStr(pick(r, ['Family', 'family']) || s.family),
      forecastNext90: toNum(pick(r, ['Next 90 Days Units', 'Next 90', 'forecastNext90']) || s.forecastNext90),
      forecastBias: toNum(pick(r, ['Forecast Bias Pct', 'Forecast Bias', 'forecastBias']) || s.forecastBias),
      seasonalityNote: toStr(
        pick(r, ['Seasonality Note', 'Seasonality', 'seasonalityNote']) || s.seasonalityNote
      ),
    };
  });
}

/**
 * @param {object} row
 * @param {Record<string,string>} mapping - requiredKey -> file column
 * @param {string[]} required
 */
export function applyColumnMapping(row, mapping, required) {
  const o = {};
  for (const req of required) {
    const col = mapping[req] || req;
    o[req] = row[col] !== undefined ? row[col] : '';
  }
  return o;
}
