/**
 * Unified attention-queue rows: agent alerts + shipment/supplier risk signals.
 * Nav IDs match App.js sidebar `active` keys (setActive).
 */

import { inventoryNavIds } from '../config/navRegistry';

/** Mirrors App.js `moduleLabelToMeta` moduleId targets for navigation. */
export function moduleLabelToNavId(moduleLabel) {
  const m = {
    Inventory: inventoryNavIds.fg,
    'Inventory Monitoring': inventoryNavIds.fg,
    'Purchase Orders': 'purchase-orders',
    Fulfillment: 'fulfillment',
    'Fulfillment Monitoring': 'fulfillment',
    'Supplier Tracking': 'suppliers',
    'Customer Orders': 'customer-orders',
    'Demand Forecasting': 'demand',
    'Trade Risk': 'trade-risk',
    'Supply Planning': 'planning',
    'Order Bank': 'orderbank',
  };
  return m[moduleLabel] || 'executive';
}

function severityRank(sev) {
  if (sev === 'CRITICAL') return 4;
  if (sev === 'HIGH') return 3;
  if (sev === 'MEDIUM') return 2;
  if (sev === 'LOW') return 1;
  return 0;
}

/**
 * @returns {Array<{ id: string, source: string, severity: string, title: string, detail: string, timeLabel: string, navId: string }>}
 */
export function buildAttentionQueueRows({ agentAlerts, shipmentData, supplierData }) {
  const rows = [];

  (agentAlerts || [])
    .filter((a) => a.status === 'ALERT' && a.alert)
    .forEach((a, idx) => {
      rows.push({
        id: `agent-${idx}-${a.agent}`,
        source: 'Agent',
        severity: a.severity || 'INFO',
        title: a.agent,
        detail: a.alert,
        timeLabel: a.lastRun || '—',
        navId: moduleLabelToNavId(a.module),
      });
    });

  (shipmentData || [])
    .filter((s) => s.status === 'DELAYED' || s.status === 'STUCK')
    .forEach((s) => {
      const severity = s.status === 'STUCK' ? 'HIGH' : 'MEDIUM';
      rows.push({
        id: `ship-${s.id}`,
        source: 'Shipment',
        severity,
        title: s.id,
        detail: `${s.origin} → ${s.destination} · ${s.carrier} · ${s.delayReason || s.status}`,
        timeLabel: `ETA ${s.etaDays}d`,
        navId: 'fulfillment',
      });
    });

  (supplierData || [])
    .filter((s) => s.risk === 'MEDIUM' || s.risk === 'HIGH')
    .forEach((s) => {
      rows.push({
        id: `sup-${s.id}`,
        source: 'Supplier',
        severity: s.risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
        title: s.id,
        detail: `${s.name} · OTIF ${s.otifPct}% · inbound ${s.inboundStatus}`,
        timeLabel: `${s.leadDays}d lead`,
        navId: 'suppliers',
      });
    });

  rows.sort((a, b) => {
    const d = severityRank(b.severity) - severityRank(a.severity);
    if (d !== 0) return d;
    return String(a.title).localeCompare(String(b.title));
  });

  return rows;
}
