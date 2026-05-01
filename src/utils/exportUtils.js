import XLSX from 'xlsx-js-style';
import { computeExecutiveSummary } from './executiveSummaryMetrics';
import { daysCoverFromWks } from './coverageDisplay';
import { RIVIT_EXPORT_META_ORG } from '../constants/branding';

const ATP_ANCHOR = new Date('2026-04-28T12:00:00Z');

const COUNTRY_TARIFF_RATES = {
  China: 145,
  Vietnam: 46,
  Malaysia: 24,
  Mexico: 0,
  Germany: 10,
  Netherlands: 10,
  India: 26,
  Canada: 0,
};
const LOW_TARIFF_COUNTRIES = new Set(['Mexico', 'Canada', 'Germany', 'Netherlands']);

export function computeTradeRiskRows(componentData, supplierData) {
  const supplierCountryMap = new Map(supplierData.map((s) => [s.id, s.country]));
  const supplierNameMap = new Map(supplierData.map((s) => [s.id, s.name]));
  return componentData.map((c) => {
    const country = c.country || supplierCountryMap.get(c.supplierID) || 'Unknown';
    const tariffRate = COUNTRY_TARIFF_RATES[country] ?? c.tariffRate ?? 0;
    const annualSpend = c.extended;
    const dutyCost = annualSpend * (tariffRate / 100);
    const alternateAvailable = LOW_TARIFF_COUNTRIES.has(country) ? 'Yes' : 'No';
    const risk = tariffRate > 25 ? 'HIGH' : tariffRate >= 10 ? 'MEDIUM' : 'LOW';
    return {
      componentSku: c.sku,
      supplier: c.supplier || supplierNameMap.get(c.supplierID) || c.supplierID,
      country,
      tariffRate,
      annualSpend,
      dutyCost,
      alternateAvailable,
      risk,
    };
  });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatExportFileDate(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatExportTimestamp(d = new Date()) {
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export const EXPORT_MODULE_SLUGS = {
  executive: 'ExecutiveCommandCenter',
  orderbank: 'OrderBank',
  'customer-orders': 'CustomerOrders',
  'inventory-fg': 'FinishedGoods',
  'inventory-components': 'ComponentsClassA',
  'inventory-parts': 'PartsInventory',
  suppliers: 'SupplierTracking',
  'trade-risk': 'TradeRisk',
  fulfillment: 'FulfillmentMonitoring',
  demand: 'DemandForecasting',
  planning: 'SupplyPlanning',
  'purchase-orders': 'PurchaseOrders',
  agents: 'AIAgents',
  'data-sync': 'DataSync',
  'production-planning': 'ProductionPlanning',
  'shop-floor': 'ShopFloor',
  contacts: 'Contacts',
  receiving: 'Receiving',
};

export function exportFilenameForActive(active) {
  const slug = EXPORT_MODULE_SLUGS[active] || 'Dashboard';
  return `Vectrum-${slug}-${formatExportFileDate()}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEsc(v) {
  if (v == null || v === '') return '';
  const s = String(v).replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, ' ');
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Plain CSV (no meta block) — used by Data Sync and legacy callers */
export function rowsToCsvString(rows) {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  return [keys.join(','), ...rows.map((r) => keys.map((k) => csvEsc(r[k])).join(','))].join('\n');
}

function buildMetaLines(moduleDisplayName, exportedAt, filterNote) {
  const lines = [RIVIT_EXPORT_META_ORG, moduleDisplayName, `Exported: ${exportedAt}`];
  if (filterNote) lines.push(`Filters: ${filterNote}`);
  return lines;
}

function rowsToCsvWithMeta(metaLines, rows) {
  const keys = rows.length ? Object.keys(rows[0]) : ['Message'];
  const dataRows = rows.length ? rows : [{ Message: 'No data rows' }];
  const metaBlock = metaLines.map((l) => `# ${l}`).join('\n');
  const header = keys.join(',');
  const body = dataRows.map((r) => keys.map((k) => csvEsc(r[k])).join(',')).join('\n');
  return `\uFEFF${metaBlock}\n\n${header}\n${body}`;
}

function cellStyleMeta() {
  return { font: { sz: 10, color: { rgb: '374151' } }, alignment: { vertical: 'center', horizontal: 'left' } };
}

function cellStyleHeader() {
  return {
    font: { bold: true, sz: 10, color: { rgb: '111827' } },
    fill: { fgColor: { rgb: 'F3F4F6' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
      left: { style: 'thin', color: { rgb: 'D1D5DB' } },
      right: { style: 'thin', color: { rgb: 'D1D5DB' } },
    },
  };
}

function cellStyleBody() {
  return {
    font: { sz: 10, color: { rgb: '111827' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  };
}

function encodeCell(r, c) {
  return XLSX.utils.encode_cell({ r, c });
}

function autosizeCols(ws) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const widths = [];
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    let max = 10;
    for (let r = range.s.r; r <= range.e.r; r += 1) {
      const cell = ws[encodeCell(r, c)];
      const len = cell?.v != null ? String(cell.v).length : 0;
      if (len > max) max = len;
    }
    widths.push({ wch: Math.min(max + 2, 52) });
  }
  ws['!cols'] = widths;
}

/**
 * Build worksheet: meta rows, blank row, header row, data rows. Style header row.
 */
function sheetFromObjectsStyled(metaLines, rows) {
  const keys = rows.length ? Object.keys(rows[0]) : ['Message'];
  const data = rows.length ? rows : [{ Message: 'No data rows' }];
  const aoa = [...metaLines.map((l) => [l]), [''], keys, ...data.map((r) => keys.map((k) => r[k] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const headerRow = metaLines.length + 1;
  const colCount = keys.length;
  for (let c = 0; c < colCount; c += 1) {
    const addr = encodeCell(headerRow, c);
    if (ws[addr]) ws[addr].s = cellStyleHeader();
  }
  for (let r = 0; r < metaLines.length; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const addr = encodeCell(r, c);
      if (ws[addr]) ws[addr].s = cellStyleMeta();
    }
  }
  for (let r = headerRow + 1; r <= headerRow + data.length; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const addr = encodeCell(r, c);
      if (ws[addr]) ws[addr].s = cellStyleBody();
    }
  }
  autosizeCols(ws);
  return ws;
}

function daysUntilAtp(dateIso) {
  const target = new Date(`${dateIso}T12:00:00Z`);
  return Math.max(0, Math.round((target - ATP_ANCHOR) / 86400000));
}

/** Legacy shape (no ATP columns) for Data Sync quick exports */
export function orderRows(customerOrderData) {
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

export function customerOrderExportRows(customerOrderData, skuData) {
  return customerOrderData.map((o) => {
    const sku = skuData.find((s) => s.sku === o.sku);
    const available = sku?.available ?? 0;
    const shortfall = Math.max(0, o.qtyOrdered - available);
    const dueInDays = daysUntilAtp(o.promiseDate);
    let atpStatus = 'CONFIRMED';
    if (shortfall > 0 && dueInDays <= 7) atpStatus = 'BREACHED';
    else if (shortfall > 0) atpStatus = 'AT RISK';
    const reason =
      atpStatus === 'CONFIRMED'
        ? 'Available inventory covers quantity'
        : `Shortfall ${shortfall} units vs available ${available}`;
    const shortfallValue = shortfall * (sku?.unitValue || 0);
    return {
      'Order Number': o.id,
      Customer: o.customer,
      SKU: o.sku,
      Product: o.product,
      'Qty Ordered': o.qtyOrdered,
      'Promise Date': o.promiseDate,
      'ATP Status': atpStatus,
      Reason: reason,
      'Inventory Shortfall Value': shortfallValue,
    };
  });
}

export function finishedGoodsPositionRows(skuData) {
  return skuData.map((s) => ({
    SKU: s.sku,
    Product: s.product,
    'On Hand': s.onHand,
    Committed: s.committed,
    Available: s.available,
    'Days Cover': daysCoverFromWks(s.wksCover),
    Status: s.status,
    'Gross Margin': s.grossMargin,
  }));
}

export function componentsClassARows(componentData) {
  return componentData.map((c) => ({
    SKU: c.sku,
    Description: c.description,
    'Drives FG': c.drivesFG,
    Supplier: c.supplier,
    Country: c.country,
    'On Hand': c.onHand,
    'Unit Cost': c.unitCost,
    'Extended Value': c.extended,
    'Days Supply': c.daysSupply,
    Health: c.health,
  }));
}

/** @deprecated Use supplierScorecardRows — alias for legacy callers */
export function supplierRows(supplierData) {
  return supplierScorecardRows(supplierData);
}

export function supplierScorecardRows(supplierData) {
  return supplierData.map((s) => ({
    'Supplier ID': s.id,
    Name: s.name,
    Country: s.country,
    Category: s.category,
    'Lead Days': s.leadDays,
    'OTIF%': s.otifPct,
    'Spend USD': s.spendUSD,
    'Risk Level': s.risk,
    'Inbound Status': s.inboundStatus,
  }));
}

export function shipmentRows(shipmentData) {
  return fulfillmentShipmentRows(shipmentData);
}

export function fulfillmentShipmentRows(shipmentData) {
  return shipmentData.map((s) => ({
    'Shipment ID': s.id,
    SKU: s.sku,
    Origin: s.origin,
    Destination: s.destination,
    Mode: s.mode,
    Carrier: s.carrier,
    'ETA Days': s.etaDays,
    Status: s.status,
    'Delay Reason': s.delayReason ?? '',
  }));
}

export function supplyPlanningReorderRows(componentData) {
  return componentData.map((c) => ({
    'Component SKU': c.sku,
    Description: c.description,
    'Drives FG': c.drivesFG,
    MOQ: c.moq,
    EOQ: c.eoq,
    'On Hand': c.onHand,
    LDD: c.reorderDate,
    'Net Need': c.netNeed,
    'Reorder By': c.reorderDate,
    'Primary Supplier': c.supplier,
  }));
}

export function purchaseOrderTrackerRows(pos, componentBySku) {
  return pos.map((po) => {
    const desc = componentBySku?.get?.(po.componentSku)?.description ?? '';
    return {
      'PO Number': po.poNumber,
      Component: desc ? `${po.componentSku} — ${desc}` : po.componentSku,
      Supplier: po.supplier,
      Qty: po.qty,
      'Unit Cost': po.unitCost ?? '',
      'PO Value': po.poValue,
      'Required By': po.requiredBy,
      Status: po.status,
      'Supplier Acknowledgment': po.supplierAcknowledgment,
    };
  });
}

export function demandForecastTableRows(skuData) {
  return skuData.map((s) => ({
    SKU: s.sku,
    Family: s.family,
    'Next 90 Days Units': s.forecastNext90,
    'Forecast Bias%': s.forecastBias,
    'Seasonality Note': s.seasonalityNote,
  }));
}

/** @deprecated alias for Data Sync — uses legacy column label */
export function forecastRows(skuData) {
  return skuData.map((s) => ({
    SKU: s.sku,
    Family: s.family,
    'Next 90 Days Units': s.forecastNext90,
    'Forecast Bias Pct': s.forecastBias,
    'Seasonality Note': s.seasonalityNote,
  }));
}

export function tradeRiskTariffRowsFromComputed(rows) {
  return rows.map((r) => ({
    'Component SKU': r.componentSku,
    Supplier: r.supplier,
    Country: r.country,
    'Tariff Rate %': r.tariffRate,
    'Annual Spend': r.annualSpend,
    'Estimated Duty Cost': r.dutyCost,
    'Risk Level': r.risk,
  }));
}

export function partsAdjustmentHistoryRows(history) {
  return history.map((h) => ({
    Timestamp: h.timeLabel || (h.at ? new Date(h.at).toLocaleString('en-US') : ''),
    'Part Number': h.part,
    Description: h.description,
    Type: h.type,
    Quantity: h.quantity,
    Reason: h.reason,
    'Authorized By': h.authorizedBy,
    Flag: h.flagged ? 'Yes' : 'No',
  }));
}

export function orderBankOrdersByFinishedGoodRows(orderBankRows) {
  return orderBankRows.map((r) => ({
    SKU: r.sku,
    Product: r.product,
    'In Bank': r.inBank,
    'In Process': r.inProcess,
    'Total Orders': r.inBank + r.inProcess,
    'Unit Value': r.unitValue,
    'Total Value': (r.inBank + r.inProcess) * r.unitValue,
  }));
}

export function orderHistoryExportRows(orderHistory) {
  return orderHistory.map((m) => ({
    Month: m.month,
    '2026': m.y2026 ?? '',
    '2025': m.y2025,
    '2024': m.y2024,
    '2023': m.y2023,
  }));
}

export function agentExportRows(agentAlerts) {
  return agentAlerts.map((a) => ({
    Agent: a.agent,
    Module: a.module,
    Status: a.status,
    Alert: a.alert ?? '',
    Severity: a.severity ?? '',
    'Affected SKU': a.affectedSKU ?? '',
  }));
}

function exportCsv(metaLines, rows, filenameBase) {
  const csv = rowsToCsvWithMeta(metaLines, rows);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filenameBase}.csv`);
}

function exportXlsxSheets(sheetEntries, filenameBase) {
  const wb = XLSX.utils.book_new();
  sheetEntries.forEach(({ name, metaLines, rows }) => {
    const safeName = (name.replace(/[\\/?*[\]:]/g, ' ').trim() || 'Sheet').slice(0, 31);
    const ws = sheetFromObjectsStyled(metaLines, rows);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });
  const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${filenameBase}.xlsx`
  );
}

function exportSingleSheet(moduleDisplayName, rows, format, filenameBase, filterNote) {
  const exportedAt = formatExportTimestamp();
  const meta = buildMetaLines(moduleDisplayName, exportedAt, filterNote);
  if (format === 'csv') {
    exportCsv(meta, rows, filenameBase);
  } else {
    exportXlsxSheets([{ name: 'Export', metaLines: meta, rows }], filenameBase);
  }
}

function executiveSummaryExportSheets(data) {
  const m = computeExecutiveSummary(data);
  const exportedAt = formatExportTimestamp();
  const metaBase = (name) => buildMetaLines(name, exportedAt, null);

  const kpiRows = [
    { Metric: 'Total Inventory Value', Value: m.totalInventoryValueFormatted },
    { Metric: 'Fill Rate', Value: `${m.fillRate.toFixed(1)}%` },
    { Metric: 'Shipments At Risk', Value: m.shipmentsAtRisk },
    { Metric: 'Supplier Risk Alerts', Value: m.supplierRiskAlerts },
    { Metric: 'Forecast Accuracy', Value: `${m.forecastAccuracy.toFixed(1)}%` },
  ];

  const invRows = m.inventoryRows.map((r) => ({
    SKU: r.sku,
    'Days Cover': r.daysCover,
    Status: r.status,
  }));

  const excRows = m.exceptionFeed.map((a) => ({
    Severity: a.severity,
    Module: a.module,
    Agent: a.agent,
    Alert: a.alert,
  }));

  const snapRows = [
    { Metric: 'Planned spend', Value: m.plannedSpendFormatted },
    { Metric: 'Receipts', Value: m.receiptsFormatted },
    {
      Metric: 'Variance (receipts - planned)',
      Value: `${m.spendDeltaPositive ? '+' : '-'}${m.spendDeltaFormatted}`,
    },
    { Metric: 'Critical path SKU', Value: m.criticalPathSku },
  ];

  return [
    { name: 'KPI Summary', metaLines: metaBase('Executive Command Center — KPI Summary'), rows: kpiRows },
    { name: 'Inventory Health', metaLines: metaBase('Executive Command Center — Inventory Health'), rows: invRows },
    { name: 'Exceptions', metaLines: metaBase('Executive Command Center — Exceptions'), rows: excRows },
    { name: 'Forecast Snapshot', metaLines: metaBase('Executive Command Center — Forecast vs Plan'), rows: snapRows },
  ];
}

function dataSyncExportRows(syncLog, lastManualUpload) {
  const status = [
    { Field: 'Data source', Value: lastManualUpload?.message || '' },
    { Field: 'Sample data', Value: lastManualUpload?.isSample ? 'Yes' : 'No' },
  ];
  const logRows = (syncLog || []).map((e) => ({
    Time: e.time,
    Type: e.type,
    Details: e.details,
    Records: e.records,
    Status: e.status,
  }));
  return { status, logRows };
}

/**
 * @param {string} active
 * @param {object} data
 * @param {'csv'|'xlsx'} format
 * @param {object|null} snapshot — from useExportRegistration factory
 */
export function exportForActiveView(active, data, format, snapshot = null) {
  const filenameBase = exportFilenameForActive(active);
  const filterNote = snapshot?.filterNote || null;

  const pickRows = (fallbackFn) =>
    snapshot && Object.prototype.hasOwnProperty.call(snapshot, 'rows') && snapshot.rows != null
      ? snapshot.rows
      : fallbackFn();

  switch (active) {
    case 'executive': {
      if (format === 'csv') {
        const sheets = executiveSummaryExportSheets(data);
        const blocks = sheets.map((s) => `### ${s.name}\n${rowsToCsvWithMeta(s.metaLines, s.rows)}`);
        downloadBlob(new Blob([`\uFEFF${blocks.join('\n\n')}`], { type: 'text/csv;charset=utf-8' }), `${filenameBase}.csv`);
        return;
      }
      const entries = executiveSummaryExportSheets(data).map((s) => ({
        name: s.name,
        metaLines: s.metaLines,
        rows: s.rows,
      }));
      exportXlsxSheets(entries, filenameBase);
      return;
    }

    case 'orderbank': {
      const moduleName = 'Order Bank';
      const mainRows = pickRows(() =>
        orderBankOrdersByFinishedGoodRows(
          data.skuData.map((sku) => ({
            sku: sku.sku,
            product: sku.product,
            inBank: sku.ordersInBank,
            inProcess: sku.ordersInProcess,
            unitValue: sku.unitValue,
          }))
        )
      );
      const hist =
        snapshot?.extraSheets?.['YoY Monthly History'] ?? orderHistoryExportRows(data.orderHistory);
      if (format === 'csv') {
        const exportedAt = formatExportTimestamp();
        const meta = buildMetaLines(moduleName, exportedAt, filterNote);
        const a = rowsToCsvWithMeta(meta, mainRows);
        const b = rowsToCsvWithMeta(
          buildMetaLines(`${moduleName} — YoY Monthly History`, exportedAt, filterNote),
          hist
        );
        downloadBlob(new Blob([`\uFEFF${a}\n\n${b}`], { type: 'text/csv;charset=utf-8' }), `${filenameBase}.csv`);
        return;
      }
      const exportedAt = formatExportTimestamp();
      exportXlsxSheets(
        [
          {
            name: 'Orders by FG',
            metaLines: buildMetaLines(moduleName, exportedAt, filterNote),
            rows: mainRows,
          },
          {
            name: 'YoY History',
            metaLines: buildMetaLines(`${moduleName} — YoY`, exportedAt, filterNote),
            rows: hist,
          },
        ],
        filenameBase
      );
      return;
    }

    case 'customer-orders':
      return exportSingleSheet(
        'Customer Orders',
        pickRows(() => customerOrderExportRows(data.customerOrderData, data.skuData)),
        format,
        filenameBase,
        filterNote
      );

    case 'inventory-fg':
      return exportSingleSheet(
        'Finished Goods',
        pickRows(() => finishedGoodsPositionRows(data.skuData)),
        format,
        filenameBase,
        filterNote
      );

    case 'inventory-components':
      return exportSingleSheet(
        'Components Class A',
        pickRows(() => componentsClassARows(data.componentData)),
        format,
        filenameBase,
        filterNote
      );

    case 'inventory-parts':
      return exportSingleSheet(
        'Parts Inventory — Adjustments',
        pickRows(() => partsAdjustmentHistoryRows(data.adjustmentHistory || [])),
        format,
        filenameBase,
        filterNote
      );

    case 'suppliers':
      return exportSingleSheet(
        'Supplier Tracking',
        pickRows(() => supplierScorecardRows(data.supplierData)),
        format,
        filenameBase,
        filterNote
      );

    case 'trade-risk':
      return exportSingleSheet(
        'Trade Risk',
        pickRows(() =>
          tradeRiskTariffRowsFromComputed(computeTradeRiskRows(data.componentData, data.supplierData))
        ),
        format,
        filenameBase,
        filterNote
      );

    case 'fulfillment':
      return exportSingleSheet(
        'Fulfillment Monitoring',
        pickRows(() => fulfillmentShipmentRows(data.shipmentData)),
        format,
        filenameBase,
        filterNote
      );

    case 'demand':
      return exportSingleSheet(
        'Demand Forecasting',
        pickRows(() => demandForecastTableRows(data.skuData)),
        format,
        filenameBase,
        filterNote
      );

    case 'planning':
      return exportSingleSheet(
        'Supply Planning',
        pickRows(() => supplyPlanningReorderRows(data.componentData)),
        format,
        filenameBase,
        filterNote
      );

    case 'purchase-orders':
      return exportSingleSheet(
        'Purchase Orders — Tracker',
        pickRows(() => [
          {
            Message:
              'No export snapshot — open Purchase Orders and use Export from the header while this screen is active.',
          },
        ]),
        format,
        filenameBase,
        filterNote
      );

    case 'agents':
      return exportSingleSheet('AI Agents', pickRows(() => agentExportRows(data.agentAlerts)), format, filenameBase, filterNote);

    case 'data-sync': {
      const { status, logRows } = dataSyncExportRows(data.syncLog, data.lastManualUpload);
      const exportedAt = formatExportTimestamp();
      if (format === 'csv') {
        const a = rowsToCsvWithMeta(buildMetaLines('Data Sync — Status', exportedAt, filterNote), status);
        const b = rowsToCsvWithMeta(buildMetaLines('Data Sync — Log', exportedAt, filterNote), logRows);
        downloadBlob(new Blob([`\uFEFF${a}\n\n${b}`], { type: 'text/csv;charset=utf-8' }), `${filenameBase}.csv`);
        return;
      }
      exportXlsxSheets(
        [
          { name: 'Status', metaLines: buildMetaLines('Data Sync', exportedAt, filterNote), rows: status },
          { name: 'Sync Log', metaLines: buildMetaLines('Data Sync — Log', exportedAt, filterNote), rows: logRows },
        ],
        filenameBase
      );
      return;
    }

    case 'production-planning':
    case 'shop-floor':
      return exportSingleSheet(
        getNavTitle(active),
        pickRows(() => finishedGoodsPositionRows(data.skuData)),
        format,
        filenameBase,
        filterNote
      );

    case 'contacts':
      return exportSingleSheet(
        'Contacts',
        pickRows(() =>
          (data.contactDirectory || []).map((c) => ({
            Name: c.name,
            Role: c.role,
            Department: c.department,
            Email: c.email,
            Phone: c.phone,
          }))
        ),
        format,
        filenameBase,
        filterNote
      );

    case 'receiving':
      return exportSingleSheet(
        'Receiving',
        pickRows(() => shipmentRowsLegacy(data.shipmentData)),
        format,
        filenameBase,
        filterNote
      );

    default:
      return exportAllDashboardV2(data, format, filenameBase, filterNote);
  }
}

function getNavTitle(active) {
  if (active === 'production-planning') return 'Production Planning';
  if (active === 'shop-floor') return 'Shop Floor';
  return 'Dashboard';
}

function shipmentRowsLegacy(shipmentData) {
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
  }));
}

function exportAllDashboardV2(data, format, filenameBase, filterNote) {
  const exportedAt = formatExportTimestamp();
  const meta = (label) => buildMetaLines(label, exportedAt, filterNote);
  if (format === 'csv') {
    const parts = [
      ['Finished Goods', finishedGoodsPositionRows(data.skuData)],
      ['Components', componentsClassARows(data.componentData)],
      ['Suppliers', supplierScorecardRows(data.supplierData)],
      ['Shipments', fulfillmentShipmentRows(data.shipmentData)],
      ['Customer Orders', customerOrderExportRows(data.customerOrderData, data.skuData)],
      ['Order History', orderHistoryExportRows(data.orderHistory)],
      ['Forecast', demandForecastTableRows(data.skuData)],
    ].map(([label, rows]) => rowsToCsvWithMeta(meta(`Full export — ${label}`), rows));
    downloadBlob(new Blob([`\uFEFF${parts.join('\n\n')}`], { type: 'text/csv;charset=utf-8' }), `${filenameBase}.csv`);
    return;
  }
  exportXlsxSheets(
    [
      { name: 'FG', metaLines: meta('Full export — Finished Goods'), rows: finishedGoodsPositionRows(data.skuData) },
      { name: 'Components', metaLines: meta('Full export — Components'), rows: componentsClassARows(data.componentData) },
      { name: 'Suppliers', metaLines: meta('Full export — Suppliers'), rows: supplierScorecardRows(data.supplierData) },
      { name: 'Shipments', metaLines: meta('Full export — Shipments'), rows: fulfillmentShipmentRows(data.shipmentData) },
      {
        name: 'Cust Orders',
        metaLines: meta('Full export — Customer Orders'),
        rows: customerOrderExportRows(data.customerOrderData, data.skuData),
      },
      { name: 'Ord History', metaLines: meta('Full export — Order History'), rows: orderHistoryExportRows(data.orderHistory) },
      { name: 'Forecast', metaLines: meta('Full export — Forecast'), rows: demandForecastTableRows(data.skuData) },
    ],
    filenameBase
  );
}

/** Legacy sheet builder (no meta / styles) for external callers */
export function sheetFromObjects(rows) {
  if (!rows || !rows.length) return XLSX.utils.aoa_to_sheet([['No data']]);
  const keys = Object.keys(rows[0]);
  const aoa = [keys, ...rows.map((r) => keys.map((k) => r[k] ?? ''))];
  return XLSX.utils.aoa_to_sheet(aoa);
}

export function writeWorkbook(sheets) {
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const safeName = (name.replace(/[^A-Za-z0-9 _-]/g, ' ').trim() || 'Sheet').slice(0, 31);
    const ws = sheetFromObjects(rows);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
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
    'Days Cover': daysCoverFromWks(s.wksCover),
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

export function componentRows(componentData) {
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

/** Legacy helper: meta + Vectrum filename */
export function exportSheet(rows, filenameBase, format) {
  const slug = String(filenameBase || 'export').replace(/\s+/g, '-');
  const full = `Vectrum-${slug}-${formatExportFileDate()}`;
  exportSingleSheet('Data Sync — Manual export', rows, format, full, null);
}

export function exportAllDataV2(data, format) {
  const filenameBase = `Vectrum-FullDashboard-${formatExportFileDate()}`;
  exportAllDashboardV2(data, format, filenameBase, null);
}

export { downloadBlob };
