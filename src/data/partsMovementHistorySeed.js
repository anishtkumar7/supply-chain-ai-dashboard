import { componentData, partMovementHistory } from './sampleData';
import { exportedEntriesForSequencedRow, hashSku } from './partMovementHistoryBuilder';
import { getNeutralCmpWhlDrvStoryRow } from './demoCleanSample';

function timeLabelAt(at) {
  const d = at instanceof Date ? at : new Date(at);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function entriesForSkuInScenario(sku, demoScenario = 'crisis') {
  if (demoScenario === 'clean' && sku === 'CMP-WHL-DRV') {
    const desc =
      componentData.find((c) => c.sku === 'CMP-WHL-DRV')?.description || 'Drive Axle Wheel & Tire Assembly 11R22.5';
    return exportedEntriesForSequencedRow(getNeutralCmpWhlDrvStoryRow(desc), hashSku('CMP-WHL-DRV'));
  }
  return partMovementHistory[sku];
}

/** Fallback rows when persisted adjustmentHistory does not contain this SKU (legacy / cleared partial saves). */
export function getAdjustmentRowsForSku(sku, demoScenario = 'crisis') {
  const entries = entriesForSkuInScenario(sku, demoScenario);
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries
    .map((entry, i) => {
      const at = entry.timestamp ? new Date(entry.timestamp) : new Date();
      return {
        id: entry.id || `seed-${sku}-${i}`,
        part: entry.sku,
        description: entry.description,
        type: entry.type,
        quantity: entry.qty,
        reason: entry.reason,
        authorizedBy: entry.authorizedBy,
        flagged: Boolean(entry.flagged),
        at,
        timeLabel: timeLabelAt(at),
      };
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

/** Flatten `partMovementHistory` into legacy adjustment rows for Parts Inventory (part, quantity, at, …). */
export function buildPartsMovementSeedHistory(demoScenario = 'crisis') {
  const out = [];
  let seq = 0;

  for (const sku of Object.keys(partMovementHistory)) {
    const entries = entriesForSkuInScenario(sku, demoScenario);
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const at = entry.timestamp ? new Date(entry.timestamp) : new Date();
      out.push({
        id: entry.id || `MV-${++seq}`,
        part: entry.sku,
        description: entry.description,
        type: entry.type,
        quantity: entry.qty,
        reason: entry.reason,
        authorizedBy: entry.authorizedBy,
        flagged: Boolean(entry.flagged),
        at,
        timeLabel: timeLabelAt(at),
      });
    }
  }

  out.sort((a, b) => new Date(b.at) - new Date(a.at));
  return out;
}
