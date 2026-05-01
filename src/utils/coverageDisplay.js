/** Display-only helpers: underlying FG model still stores `wksCover`. */

/** Whole days only: Math.round(wksCover × 7). Do not use toFixed. */
export function daysCoverFromWks(wks) {
  return Math.round(Number(wks) * 7);
}

/** HEALTHY: over 21 days · WATCH: 8–21 days · CRITICAL: under 8 days (rounded day cover). */
export function fgInventoryStatusFromWksCover(wks) {
  const d = daysCoverFromWks(wks);
  if (d > 21) return 'HEALTHY';
  if (d >= 8) return 'WATCH';
  return 'CRITICAL';
}

/** Same weighted formula as Executive Command Center KPI (uses stored `status` on each SKU). */
export function computeWeightedFillRatePercent(skuData) {
  const healthyCount = skuData.filter((s) => s.status === 'HEALTHY').length;
  const watchCount = skuData.filter((s) => s.status === 'WATCH').length;
  const criticalCount = skuData.filter((s) => s.status === 'CRITICAL').length;
  const total = skuData.length;
  if (!total) return 0;
  return parseFloat(
    (((healthyCount * 1.0) + (watchCount * 0.85) + (criticalCount * 0.40)) / total * 100).toFixed(1)
  );
}

/** Low-stock FG threshold: fewer than 8 days cover (aligned with CRITICAL upper bound). */
export function isFgLowStockByDaysCover(wks) {
  return daysCoverFromWks(wks) < 8;
}
