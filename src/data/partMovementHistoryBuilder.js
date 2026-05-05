/**
 * Builds partMovementHistory: Record<sku, Entry[]> with reconciled narratives per inventory tier.
 * Entry shape: { id, timestamp, sku, description, type, qty, reason, authorizedBy, flagged }
 */

const AUTHORS = ['J. Martinez', 'S. Patel', 'T. Williams', 'R. Chen', 'K. Johnson'];

const RATIO_CMP = [0.3, 0.3, 0.25, 0.15];
const RATIO_FG = [0.35, 0.3, 0.25, 0.1];

function allocateInt(n, ratios) {
  if (n <= 0) return ratios.map(() => 0);
  const parts = ratios.map((r) => Math.floor(n * r));
  let d = n - parts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (d > 0) {
    parts[i % parts.length] += 1;
    d -= 1;
    i += 1;
  }
  return parts;
}

function hashSku(sku) {
  let h = 0;
  for (let i = 0; i < sku.length; i += 1) h = (Math.imul(31, h) + sku.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function supplierFastener(h, sku) {
  const pool = ['Detroit Fastener Supply', 'North American Bolt Co.', 'Great Lakes Industrial Supply'];
  return pool[h % pool.length];
}

function supplierBrackets(h) {
  return ['Approved Vendor Network', 'Ho Chi Minh Plastics Works', 'Regional Parts Cooperative'][h % 3];
}

function supplierHeavy(h) {
  return ['Detroit Power Systems', 'Stuttgart Drive Systems', 'Rotterdam Industrial Supply'][h % 3];
}

function poRef(h, idx) {
  const n = 4026 + ((h + idx * 13) % 900);
  return `PO-2026-${String(n).padStart(4, '0')}`;
}

/** March–May 2026 spread for chronological realism */
function spreadMarMay2026(seq, n, h) {
  if (n <= 1) {
    return new Date(2026, 3, 10 + (h % 18), 9 + (h % 7), 10 + ((h + seq) % 45), 0, 0);
  }
  const start = new Date(2026, 2, 6);
  const end = new Date(2026, 4, 28);
  const frac = seq / (n - 1);
  const ms =
    start.getTime() +
    frac * (end.getTime() - start.getTime()) +
    (h % 9) * 3600000 +
    (seq % 7) * 540000;
  return new Date(ms);
}

function gcdPair(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function gcdMany(nums) {
  return nums.reduce((acc, n) => gcdPair(acc, n));
}

/** Decompose qty into moves of full cases (pack) plus remainder last — matches SAP partial qty behavior */
function decomposeToPackMoves(qty, pack) {
  const q = Math.max(0, Math.floor(qty));
  const p = Math.max(1, Math.floor(pack));
  const out = [];
  let rem = q;
  while (rem > 0) {
    const take = Math.min(rem, p);
    out.push(take);
    rem -= take;
  }
  return out;
}

/**
 * Case / pallet qty for MB51 lines — prefers Component Warehouse bucket (often one pallet),
 * else GCD of location buckets, else heuristic by volume tier (Class A / B / C).
 */
function resolveCasePack(T, onHand, tier) {
  const [, , , cw] = T;
  const positive = T.filter((x) => x > 0);
  if (!positive.length) return 1;
  const g = gcdMany(positive);
  const minB = Math.min(...positive);

  if (tier === 'class-a') {
    if (g >= 2 && g <= Math.min(500, Math.floor(onHand / 3))) return Math.min(g, 200);
    if (cw >= 15 && cw <= minB * 2 && cw >= Math.floor(minB / 4)) return cw;
    return Math.max(1, Math.min(400, Math.floor(minB / Math.max(2, Math.ceil(minB / 12)))));
  }

  if (g >= 25 && g <= Math.floor(onHand / 2)) return g;
  if (tier === 'c-fastener' && cw >= 100) return cw;
  if (tier === 'b-part') {
    const m = Math.min(...positive);
    return Math.max(10, Math.min(300, m));
  }
  return Math.max(25, Math.min(2000, Math.floor(onHand / Math.max(6, 18 - (onHand % 7)))));
}

function splitGoodsReceiptLines(total, tier, h) {
  const nLines = tier === 'c-fastener' ? 3 : 2;
  const ratios =
    nLines >= 3 ? [0.36, 0.34, 0.3] : nLines === 2 ? [0.52 + (h % 7) / 200, 0.48 - (h % 7) / 200] : [1];
  return allocateInt(total, ratios);
}

function supplierForDockTier(row, tier, h) {
  if (tier === 'c-fastener') return supplierFastener(h, row.sku);
  if (tier === 'b-part') return supplierBrackets(h);
  if (tier === 'class-a') return row.supplier || supplierHeavy(h);
  return supplierHeavy(h);
}

/**
 * SAP-style dock history aligned to **same** location split as Parts Inventory (`allocateInt(onHand, RATIO_CMP)`).
 * Used for **Class A (components), Class B, Class C** — receipts → Receiving Dock; transfers by **case pack** (MvT 101 / 311).
 */
function buildCmpDockStoryCompact(row, tier, h) {
  const onHand = Math.max(0, Math.floor(Number(row.onHand) || 0));
  if (onHand === 0) return [];

  const T = allocateInt(onHand, RATIO_CMP);
  const [, l1, l2, cw] = T;
  const pack = resolveCasePack(T, onHand, tier);
  const sup = supplierForDockTier(row, tier, h);

  const recvLines = splitGoodsReceiptLines(onHand, tier, h);

  const events = [];
  let seq = 0;

  /** Factory sequence: warehouse slot-up first, then supermarket pulls */
  const xferMeta = [
    { qty: cw, labelFrom: 'Receiving Dock', labelTo: 'Component Warehouse', mv: '311' },
    { qty: l1, labelFrom: 'Receiving Dock', labelTo: 'Line 1 — Supermarket', mv: '311' },
    { qty: l2, labelFrom: 'Receiving Dock', labelTo: 'Line 2 — Supermarket', mv: '311' },
  ];

  const nRecv = recvLines.length;
  const nXferMoves = xferMeta.reduce((s, x) => s + decomposeToPackMoves(x.qty, pack).length, 0);
  const budget = Math.max(1, nRecv + nXferMoves);

  recvLines.forEach((qty, i) => {
    const lineCnt = decomposeToPackMoves(qty, pack).length;
    const packNote =
      qty >= pack
        ? `${lineCnt} GR line(s) — reference pack ${pack.toLocaleString()} EA${lineCnt > 1 ? ' (std container)' : ''}`
        : 'non-standard pack / broken case';
    events.push({
      type: 'Goods receipt',
      qty,
      reason: `MB51 — Goods receipt — MvT 101 — +${qty.toLocaleString()} EA — Sloc 0001 Receiving Dock — ${sup} — ${poRef(h, i)} — ${packNote}`,
      authorizedBy: AUTHORS[(h + i) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
  });

    xferMeta.forEach((lane, laneIdx) => {
    const chunks = decomposeToPackMoves(lane.qty, pack);
    chunks.forEach((qOne, j) => {
      const fullCases = qOne === pack;
      const tailNote =
        tier === 'c-fastener'
          ? fullCases
            ? `full case / pallet — ${pack.toLocaleString()} EA`
            : `partial pull — ${qOne.toLocaleString()} EA (remainder lot)`
          : tier === 'class-a'
            ? fullCases
              ? `Class A — STD HU — ${pack.toLocaleString()} EA`
              : `Class A — partial HU — ${qOne.toLocaleString()} EA`
            : `stock transfer lot — ${qOne.toLocaleString()} EA`;
      events.push({
        type: 'Transfer',
        qty: qOne,
        reason: `MB51 — Transfer posting — MvT ${lane.mv} — ${lane.labelFrom} → ${lane.labelTo} — ${qOne.toLocaleString()} EA — ${tailNote} — storage loc confirm`,
        authorizedBy: AUTHORS[(h + laneIdx + j + nRecv) % AUTHORS.length],
        flagged: false,
        at: spreadMarMay2026(seq++, budget, h),
      });
    });
  });

  events.sort((a, b) => new Date(a.at) - new Date(b.at));
  return events;
}

/** Finished goods: 4–6 rows — production, internal transfers, order commitment (ATP) */
function buildFgStory(row, h) {
  const onHand = Math.max(0, Math.floor(Number(row.onHand) || 0));
  if (onHand === 0) return [];
  const committed = Math.max(0, Math.floor(Number(row.committed) || 0));

  const T = allocateInt(onHand, RATIO_FG);
  const [, l2, wa, sd] = T;

  const nProd = onHand >= 25 ? 3 : onHand >= 10 ? 2 : 1;
  const prodParts = allocateInt(onHand, Array.from({ length: nProd }, () => 1 / nProd));

  const events = [];
  let seq = 0;
  const budget = 6;

  prodParts.forEach((qty, i) => {
    events.push({
      type: 'Production Completion',
      qty,
      reason: `Production completion — +${qty.toLocaleString()} units — Final inspection passed — Batch ${poRef(h, i)}`,
      authorizedBy: AUTHORS[(h + i) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
  });

  if (l2 > 0) {
    events.push({
      type: 'Transfer',
      qty: l2,
      reason: `Transfer Line 2 — Assembly to Line 1 — Assembly — ${l2.toLocaleString()} units — merge lane`,
      authorizedBy: AUTHORS[(h + 1) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
  }
  if (wa > 0) {
    events.push({
      type: 'Transfer',
      qty: wa,
      reason: `Transfer Line 1 — Assembly to Warehouse A — ${wa.toLocaleString()} units — FG putaway`,
      authorizedBy: AUTHORS[(h + 2) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
  }
  if (sd > 0) {
    events.push({
      type: 'Transfer',
      qty: sd,
      reason: `Transfer Warehouse A to Shipping Dock — ${sd.toLocaleString()} units — carrier staging`,
      authorizedBy: AUTHORS[(h + 3) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
  }

  if (committed > 0) {
    const cQty = Math.min(committed, Math.max(1, Math.floor(committed * (0.28 + (h % 7) / 100))));
    events.push({
      type: 'Order Commitment',
      qty: -cQty,
      reason: `Customer order allocation — ${cQty} units committed (reduces available to promise)`,
      authorizedBy: AUTHORS[(h + 4) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
  }

  while (events.length > 6) {
    const mergeIdx = events.findIndex((e) => e.type === 'Production Completion');
    if (mergeIdx < 0) break;
    const next = events.findIndex((e, j) => j > mergeIdx && e.type === 'Production Completion');
    if (next < 0) break;
    events[mergeIdx].qty += events[next].qty;
    events[mergeIdx].reason = `Production completion — +${events[mergeIdx].qty.toLocaleString()} units — Final inspection passed — Batch ${poRef(h, mergeIdx)}`;
    events.splice(next, 1);
  }

  while (events.length < 4 && onHand > 0) {
    events.push({
      type: 'Transfer',
      qty: Math.min(onHand, 3),
      reason: 'Transfer Warehouse A to Shipping Dock — expedited staging',
      authorizedBy: AUTHORS[(h + 2) % AUTHORS.length],
      flagged: false,
      at: spreadMarMay2026(seq++, budget, h),
    });
    break;
  }

  events.sort((a, b) => new Date(a.at) - new Date(b.at));
  return events;
}

function buildM6Hardcoded(description) {
  const rows = [];
  let id = 0;
  const push = (isoDate, type, qty, reason, by, flagged = false) => {
    rows.push({
      id: `M6-${++id}`,
      timestamp: `${isoDate}T12:00:00.000Z`,
      sku: 'CMP-M6-HXB',
      description,
      type,
      qty,
      reason,
      authorizedBy: by,
      flagged,
    });
  };

  push('2026-03-28', 'Write On', 12, 'Write On — Cycle count adjustment — +12 units — Component Warehouse', 'R. Chen', false);
  push(
    '2026-04-01',
    'Received from Supplier',
    3500,
    'Received from Supplier — Detroit Fastener Supply — +3,500 units to Receiving Dock — PO-2026-0031',
    'S. Patel',
    false
  );
  push(
    '2026-04-05',
    'Transfer',
    722,
    'Transfer Receiving Dock to Line 1 — Supermarket — 722 units — Line replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-04-08',
    'Transfer',
    701,
    'Transfer Receiving Dock to Line 2 — Supermarket — 701 units — Line replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-04-10',
    'Write Off',
    -45,
    'Write Off — Stripped threads damaged in production — 45 units — Line 1 — Supermarket',
    'T. Williams',
    false
  );
  push(
    '2026-04-11',
    'Received from Supplier',
    4000,
    'Received from Supplier — Detroit Fastener Supply — +4,000 units to Receiving Dock — PO-2026-0040',
    'S. Patel',
    false
  );
  push(
    '2026-04-15',
    'Transfer',
    1500,
    'Transfer Receiving Dock to Line 1 — Supermarket — 1,500 units — Line replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-04-18',
    'Transfer',
    1200,
    'Transfer Receiving Dock to Line 2 — Supermarket — 1,200 units — Line replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-04-22',
    'Received from Supplier',
    4000,
    'Received from Supplier — Detroit Fastener Supply — +4,000 units to Receiving Dock — PO-2026-0039',
    'S. Patel',
    false
  );
  push(
    '2026-04-25',
    'Transfer',
    1500,
    'Transfer Receiving Dock to Line 1 — Supermarket — 1,500 units — Line replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-04-28',
    'Transfer',
    1200,
    'Transfer Receiving Dock to Line 2 — Supermarket — 1,200 units — Line replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-05-01',
    'Transfer',
    1860,
    'Transfer Receiving Dock to Component Warehouse — 1,860 units — Weekly replenishment',
    'J. Martinez',
    false
  );
  push(
    '2026-05-02',
    'Received from Supplier',
    5000,
    'Received from Supplier — Detroit Fastener Supply — +5,000 units to Receiving Dock — PO-2026-0044',
    'S. Patel',
    false
  );

  return rows;
}

function toExportEntries(rawList, sku, description, h) {
  let i = 0;
  return rawList.map((ev) => {
    const at = ev.at instanceof Date ? ev.at : new Date(ev.at);
    return {
      id: `${sku}-PH-${h}-${++i}`,
      timestamp: at.toISOString(),
      sku,
      description,
      type: ev.type,
      qty: ev.qty,
      reason: ev.reason,
      authorizedBy: ev.authorizedBy,
      flagged: Boolean(ev.flagged),
    };
  });
}

/**
 * @param {Array} skuRows skuData
 * @param {Array} componentRows componentData
 * @param {Array} classBCRows classBCData
 * @returns {Record<string, Array>}
 */
export function buildPartMovementHistory(skuRows, componentRows, classBCRows) {
  const out = {};

  for (const row of classBCRows) {
    const h = hashSku(row.sku);
    const desc = row.description;
    if (row.sku === 'CMP-M6-HXB') {
      out[row.sku] = buildM6Hardcoded(desc);
      continue;
    }
    if (row.inventoryClass === 'C') {
      const raw = buildCmpDockStoryCompact(row, 'c-fastener', h);
      out[row.sku] = toExportEntries(raw, row.sku, desc, h);
      continue;
    }
    if (row.inventoryClass === 'B') {
      const raw = buildCmpDockStoryCompact(row, 'b-part', h);
      out[row.sku] = toExportEntries(raw, row.sku, desc, h);
    }
  }

  for (const row of componentRows) {
    const h = hashSku(row.sku);
    const raw = buildCmpDockStoryCompact(row, 'class-a', h);
    out[row.sku] = toExportEntries(raw, row.sku, row.description, h);
  }

  for (const row of skuRows) {
    const h = hashSku(row.sku);
    const raw = buildFgStory(row, h);
    out[row.sku] = toExportEntries(raw, row.sku, row.product, h);
  }

  return out;
}
