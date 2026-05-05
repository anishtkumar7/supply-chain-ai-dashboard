import { partMovementHistory } from './sampleData';

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

/** Fallback rows when persisted adjustmentHistory does not contain this SKU (legacy / cleared partial saves). */
export function getAdjustmentRowsForSku(sku) {
  const entries = partMovementHistory[sku];
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
export function buildPartsMovementSeedHistory() {
  const out = [];
  let seq = 0;

  for (const sku of Object.keys(partMovementHistory)) {
    const entries = partMovementHistory[sku];
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
