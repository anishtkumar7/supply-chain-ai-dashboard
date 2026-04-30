import * as XLSX from 'xlsx';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sheetFromObjects(rows) {
  if (!rows || !rows.length) return XLSX.utils.aoa_to_sheet([['No data']]);
  const keys = Object.keys(rows[0]);
  const aoa = [keys, ...rows.map((r) => keys.map((k) => r[k] ?? ''))];
  return XLSX.utils.aoa_to_sheet(aoa);
}

function rowsToCsvString(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(','), ...rows.map((r) => keys.map((k) => csvEsc(r[k])).join(','))];
  return lines.join('\n');
}

function csvEsc(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function fgRows(skuData) {
  return skuData.map((s) => ({
    SKU: s.sku,
    Product: s.product,
    Family: s.family,
    'Unit Value': s.unitValue,
    'On Hand': s.onHand,
    Committed: s.committed,
    Available: s.available,
    'Weeks Cover': s.wksCover,
    Status: s.status,
    'Gross Margin %': s.grossMargin,
    'Orders In Bank': s.ordersInBank,
    'Orders In Process': s.ordersInProcess,
    'Forecast Next 90': s.forecastNext90,
    'Forecast Bias %': s.forecastBias,
    'Seasonality Note': s.seasonalityNote,
    'Customer Segment': s.customerSegment,
  }));
}

function componentRows(componentData) {
  return componentData.map((c) => ({
    SKU: c.sku,
    Description: c.description,
    'Drives FG': c.drivesFG,
    'Supplier ID': c.supplierID,
    Supplier: c.supplier,
    Country: c.country,
    'On Hand': c.onHand,
    'Unit Cost': c.unitCost,
    Extended: c.extended,
    'Days Supply': c.daysSupply,
    Health: c.health,
    'Reorder Date': c.reorderDate,
    MOQ: c.moq,
    EOQ: c.eoq,
    'Net Need': c.netNeed,
    'Tariff Rate %': c.tariffRate,
  }));
}

function supplierRows(supplierData) {
  return supplierData.map((s) => ({
    'Supplier ID': s.id,
    Name: s.name,
    Country: s.country,
    Category: s.category,
    'Lead Days': s.leadDays,
    'OTIF Pct': s.otifPct,
    'Spend USD': s.spendUSD,
    'Inbound Status': s.inboundStatus,
    Risk: s.risk,
  }));
}

function shipmentRows(shipmentData) {
  return shipmentData.map((s) => ({
    'Shipment ID': s.id,
    SKU: s.sku,
    Origin: s.origin,
    Destination: s.destination,
    Mode: s.mode,
    Carrier: s.carrier,
    'ETA Days': s.etaDays,
    Status: s.status,
    'Route Status': s.routeStatus,
    'Delay Reason': s.delayReason ?? '',
  }));
}

function orderRows(customerOrderData) {
  return customerOrderData.map((o) => ({
    'Order ID': o.id,
    Customer: o.customer,
    SKU: o.sku,
    Product: o.product,
    'Qty Ordered': o.qtyOrdered,
    'Promise Date': o.promiseDate,
    Priority: o.priority,
  }));
}

function forecastRows(skuData) {
  return skuData.map((s) => ({
    SKU: s.sku,
    Family: s.family,
    'Next 90 Days Units': s.forecastNext90,
    'Forecast Bias Pct': s.forecastBias,
    'Seasonality Note': s.seasonalityNote,
  }));
}

function orderHistoryRows(orderHistory) {
  return orderHistory.map((m) => ({
    Month: m.month,
    y2026: m.y2026 ?? '',
    y2025: m.y2025,
    y2024: m.y2024,
    y2023: m.y2023,
  }));
}

function writeWorkbook(sheets) {
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const safeName = (name.replace(/[^A-Za-z0-9 _-]/g, ' ').trim() || 'Sheet').slice(0, 31);
    const ws = sheetFromObjects(rows);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

export function exportAllDataV2(data, format) {
  if (format === 'xlsx') {
    const sheets = {
      'Finished Goods': fgRows(data.skuData),
      Components: componentRows(data.componentData),
      Suppliers: supplierRows(data.supplierData),
      Shipments: shipmentRows(data.shipmentData),
      'Customer Orders': orderRows(data.customerOrderData),
      'Order History': orderHistoryRows(data.orderHistory),
      Forecast: forecastRows(data.skuData),
    };
    const ab = writeWorkbook(sheets);
    downloadBlob(
      new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'vectrum-dashboard-all.xlsx'
    );
    return;
  }
  const block = [
    'Finished Goods',
    rowsToCsvString(fgRows(data.skuData)),
    '',
    'Components',
    rowsToCsvString(componentRows(data.componentData)),
    '',
    'Suppliers',
    rowsToCsvString(supplierRows(data.supplierData)),
    '',
    'Shipments',
    rowsToCsvString(shipmentRows(data.shipmentData)),
    '',
    'Customer Orders',
    rowsToCsvString(orderRows(data.customerOrderData)),
    '',
    'Order History',
    rowsToCsvString(orderHistoryRows(data.orderHistory)),
    '',
    'Forecast',
    rowsToCsvString(forecastRows(data.skuData)),
  ].join('\n');
  downloadBlob(new Blob([block], { type: 'text/csv;charset=utf-8' }), 'vectrum-dashboard-all.csv');
}

export function exportSheet(rows, filenameBase, format) {
  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = sheetFromObjects(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    downloadBlob(
      new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${filenameBase}.xlsx`
    );
  } else {
    const csv = rowsToCsvString(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filenameBase}.csv`);
  }
}

function agentExportRows(agentAlerts) {
  return agentAlerts.map((a) => ({
    Agent: a.agent,
    Module: a.module,
    Status: a.status,
    Alert: a.alert ?? '',
    Severity: a.severity ?? '',
    'Affected SKU': a.affectedSKU ?? '',
  }));
}

/**
 * @param {string} active — route id from App
 * @param {object} data — { skuData, componentData, ... } from useDashboardData()
 * @param {'csv'|'xlsx'} format
 */
export function exportForActiveView(active, data, format) {
  switch (active) {
    case 'executive':
    case 'data-sync':
      return exportAllDataV2(data, format);
    case 'orderbank': {
      if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheetFromObjects(fgRows(data.skuData)), 'FG Orders');
        XLSX.utils.book_append_sheet(wb, sheetFromObjects(orderHistoryRows(data.orderHistory)), 'Order History');
        const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        downloadBlob(
          new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          'order-bank.xlsx'
        );
        return;
      }
      const block = [
        'Finished Goods (Order Bank)',
        rowsToCsvString(fgRows(data.skuData)),
        '',
        'Order History',
        rowsToCsvString(orderHistoryRows(data.orderHistory)),
      ].join('\n');
      downloadBlob(new Blob([block], { type: 'text/csv;charset=utf-8' }), 'order-bank.csv');
      return;
    }
    case 'customer-orders':
      return exportSheet(orderRows(data.customerOrderData), 'customer-orders', format);
    case 'inventory-fg':
      return exportSheet(fgRows(data.skuData), 'inventory-finished-goods', format);
    case 'inventory-components':
      return exportSheet(componentRows(data.componentData), 'inventory-components', format);
    case 'inventory-parts': {
      const partsRows = [
        ...data.skuData.map((s) => ({
          Type: 'FG',
          SKU: s.sku,
          Description: s.product,
          Family: s.family,
          'On Hand': s.onHand,
          Committed: s.committed,
          Available: s.available,
        })),
        ...data.componentData.map((c) => ({
          Type: 'Component',
          SKU: c.sku,
          Description: c.description,
          'Drives FG': c.drivesFG,
          'On Hand': c.onHand,
        })),
      ];
      return exportSheet(partsRows, 'parts-inventory-lookup', format);
    }
    case 'suppliers':
      return exportSheet(supplierRows(data.supplierData), 'suppliers', format);
    case 'trade-risk':
      return exportSheet(componentRows(data.componentData), 'trade-risk-components', format);
    case 'fulfillment':
      return exportSheet(shipmentRows(data.shipmentData), 'shipments', format);
    case 'demand':
      return exportSheet(forecastRows(data.skuData), 'demand-forecast', format);
    case 'planning':
      return exportSheet(componentRows(data.componentData), 'supply-planning', format);
    case 'purchase-orders':
      return exportSheet(componentRows(data.componentData), 'purchase-orders-components', format);
    case 'production-planning':
    case 'shop-floor':
      return exportAllDataV2(data, format);
    case 'agents':
      return exportSheet(agentExportRows(data.agentAlerts), 'ai-agent-alerts', format);
    default:
      return exportAllDataV2(data, format);
  }
}

export {
  componentRows,
  supplierRows,
  shipmentRows,
  orderRows,
  forecastRows,
  orderHistoryRows,
  writeWorkbook,
  sheetFromObjects,
  downloadBlob,
  rowsToCsvString,
};
