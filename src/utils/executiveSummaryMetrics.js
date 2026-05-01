/** Shared metrics for Executive Command Center dashboard and PDF export. */

import { computeWeightedFillRatePercent, daysCoverFromWks } from './coverageDisplay';

export function formatUsd(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function severityRank(severity) {
  if (severity === 'CRITICAL') return 3;
  if (severity === 'HIGH') return 2;
  if (severity === 'MEDIUM') return 1;
  return 0;
}

export function computeExecutiveSummary({
  skuData,
  shipmentData,
  supplierData,
  componentData,
  agentAlerts,
}) {
  const totalInventoryValue = skuData.reduce((sum, sku) => sum + sku.onHand * sku.unitValue, 0);
  const avgBias = skuData.length
    ? skuData.reduce((sum, sku) => sum + Math.abs(sku.forecastBias), 0) / skuData.length
    : 0;
  const forecastAccuracy = Math.max(0, 100 - avgBias);
  const shipmentsAtRisk = shipmentData.filter((s) => s.status === 'DELAYED' || s.status === 'STUCK').length;
  const supplierRiskAlerts = supplierData.filter((s) => s.risk === 'MEDIUM' || s.risk === 'HIGH').length;
  const fillRate = computeWeightedFillRatePercent(skuData);

  const plannedSpend = componentData.reduce((sum, c) => sum + c.netNeed * c.unitCost, 0);
  const receipts = componentData.reduce((sum, c) => sum + Math.min(c.onHand, c.netNeed) * c.unitCost, 0);
  const spendDelta = receipts - plannedSpend;

  const criticalPathSku = skuData.length ? [...skuData].sort((a, b) => a.wksCover - b.wksCover)[0] : null;

  const exceptionFeed = [...agentAlerts]
    .filter((a) => a.status === 'ALERT' && a.alert)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);

  return {
    totalInventoryValue,
    totalInventoryValueFormatted: formatUsd(totalInventoryValue),
    fillRate,
    forecastAccuracy,
    shipmentsAtRisk,
    supplierRiskAlerts,
    plannedSpend,
    plannedSpendFormatted: formatUsd(plannedSpend),
    receipts,
    receiptsFormatted: formatUsd(receipts),
    spendDelta,
    spendDeltaFormatted: formatUsd(Math.abs(spendDelta)),
    spendDeltaPositive: spendDelta >= 0,
    criticalPathSku: criticalPathSku?.sku ?? '—',
    exceptionFeed,
    inventoryRows: skuData.map((sku) => ({
      sku: sku.sku,
      wksCover: sku.wksCover,
      daysCover: daysCoverFromWks(sku.wksCover),
      status: sku.status,
    })),
  };
}
