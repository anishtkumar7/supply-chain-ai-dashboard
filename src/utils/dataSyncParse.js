import * as XLSX from 'xlsx';

/**
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: object[] }>}
 */
export async function parseFileToMatrix(file) {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const name = wb.SheetNames[0];
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  if (!rows.length) {
    return { headers: [], rows: [] };
  }
  const headers = Object.keys(rows[0] || {});
  return { headers, rows };
}

export function normalizeHeader(h) {
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** @param {string[]} fileHeaders @param {string[]} required - canonical keys */
export function buildAutoMap(fileHeaders, required) {
  const norm = (a) => normalizeHeader(a);
  const map = {};
  const fileNorm = new Map(fileHeaders.map((h) => [norm(h), h]));
  for (const r of required) {
    const n = norm(r);
    if (fileHeaders.includes(r)) {
      map[r] = r;
      continue;
    }
    if (fileNorm.has(n)) {
      map[r] = fileNorm.get(n);
    }
  }
  return map;
}

export function isMappingValid(fileHeaders, required, mapping) {
  for (const r of required) {
    const col = mapping[r] || r;
    if (!col || !fileHeaders.includes(col)) return false;
  }
  return true;
}

/** Coerce to number, strip currency */
export function toNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v).replace(/[$,]/g, '').replace(/%$/, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function toStr(v) {
  if (v == null) return '';
  return String(v).trim();
}
