import { useEffect, useMemo, useState } from 'react';
import { RIVIT_PART_LOCATIONS_STATE_KEY } from '../constants/demoStorageKeys';

const STORAGE_KEY = RIVIT_PART_LOCATIONS_STATE_KEY;

const LINE_TABS = [
  'All Lines',
  'Line 1 — Assembly',
  'Line 2 — Assembly',
  'Line 3 — Paint and Finish',
  'Line 4 — EV Assembly',
];

const INITIAL_ROWS = [
  { sku: 'CMP-M8-HXB', description: 'M8 x 16mm Hex Bolt', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 4 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-M10-FLN', description: 'M10 Flange Nut', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 4 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-RBR-GRM-12', description: 'Rubber Grommet 1/2 inch', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 4 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-THR-LCK-M', description: 'Threadlocker Medium Strength', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 4 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-CBL-TIE', description: 'Cable Tie 200mm', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 3 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-WSH-M8', description: 'M8 Flat Washer', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 4 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-SHC-M8', description: 'Socket Head Cap Screw M8', classCode: 'Class C', line: 'Line 1 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 3 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-WHL-DRV', description: 'Drive Axle Wheel Assembly 11R22.5', classCode: 'Class A', line: 'Line 1 — Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 1 Rack A', stageScanLocation: 'Rack A-02', lastScannedAt: '2026-05-04T08:30:00-04:00', lastScannedBy: 'J. Martinez' },
  { sku: 'CMP-WHL-STR', description: 'Steer Axle Wheel Assembly', classCode: 'Class A', line: 'Line 1 — Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 1 Rack A', stageScanLocation: 'Rack A-04', lastScannedAt: '2026-05-04T06:15:00-04:00', lastScannedBy: 'J. Martinez' },
  { sku: 'CMP-ENG-001', description: 'Diesel Engine Assembly 13L', classCode: 'Class A', line: 'Line 1 — Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 1 Rack B', stageScanLocation: 'Rack B-01', lastScannedAt: '2026-05-04T09:45:00-04:00', lastScannedBy: 'J. Martinez' },
  { sku: 'CMP-AXL-002', description: 'Drive Axle Assembly HD', classCode: 'Class A', line: 'Line 1 — Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 1 Rack B', stageScanLocation: 'Rack B-03', lastScannedAt: '2026-05-04T07:30:00-04:00', lastScannedBy: 'J. Martinez' },
  { sku: 'CMP-WRH-004', description: 'Wiring Harness Complete', classCode: 'Class A', line: 'Line 1 — Assembly', containerType: 'Large Container', assignedLocation: 'Line 1 Rack C', stageScanLocation: 'Rack C-01', lastScannedAt: '2026-05-04T10:15:00-04:00', lastScannedBy: 'J. Martinez' },
  { sku: 'CMP-FRM-CHX', description: 'Chassis Frame Rail Assembly', classCode: 'Class A', line: 'Line 1 — Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 1 Rack B', stageScanLocation: 'Rack B-05', lastScannedAt: '2026-05-03T15:20:00-04:00', lastScannedBy: 'J. Martinez' },
  { sku: 'CMP-HYD-SLK', description: 'Hydraulic Seal Kit', classCode: 'Class B', line: 'Line 1 — Assembly', containerType: 'Large Container', assignedLocation: 'Line 1 Rack C', stageScanLocation: 'Rack C-04', lastScannedAt: '2026-05-03T13:45:00-04:00', lastScannedBy: 'T. Williams' },
  { sku: 'CMP-AIR-FLT', description: 'Air Filter Assembly', classCode: 'Class B', line: 'Line 1 — Assembly', containerType: 'Large Container', assignedLocation: 'Line 1 Rack C', stageScanLocation: 'Rack C-06', lastScannedAt: '2026-05-03T11:30:00-04:00', lastScannedBy: 'T. Williams' },
  { sku: 'CMP-M8-HXB', description: 'M8 x 16mm Hex Bolt', classCode: 'Class C', line: 'Line 2 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 2 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-M10-FLN', description: 'M10 Flange Nut', classCode: 'Class C', line: 'Line 2 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 2 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-CBL-TIE', description: 'Cable Tie 200mm', classCode: 'Class C', line: 'Line 2 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 2 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-WSH-M10', description: 'M10 Flat Washer', classCode: 'Class C', line: 'Line 2 — Assembly', containerType: 'Small Tote', assignedLocation: 'Station 2 Workstation', stageScanLocation: null, lastScannedAt: null, lastScannedBy: null },
  { sku: 'CMP-WHL-TRL', description: 'Trailer Wheel Assembly Dual', classCode: 'Class A', line: 'Line 2 — Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 2 Rack A', stageScanLocation: 'Rack A-01', lastScannedAt: '2026-05-04T07:00:00-04:00', lastScannedBy: 'T. Williams' },
  { sku: 'CMP-HYD-008', description: 'Hydraulic Pump Assembly', classCode: 'Class B', line: 'Line 2 — Assembly', containerType: 'Large Container', assignedLocation: 'Line 2 Rack B', stageScanLocation: 'Rack B-02', lastScannedAt: '2026-05-03T16:00:00-04:00', lastScannedBy: 'T. Williams' },
  { sku: 'CMP-COL-HOS', description: 'Coolant Hose Assembly', classCode: 'Class B', line: 'Line 2 — Assembly', containerType: 'Large Container', assignedLocation: 'Line 2 Rack B', stageScanLocation: 'Rack B-04', lastScannedAt: '2026-05-03T14:30:00-04:00', lastScannedBy: 'T. Williams' },
  { sku: 'CMP-BAT-009', description: 'EV Battery Pack 320kWh', classCode: 'Class A', line: 'Line 4 — EV Assembly', containerType: 'Individual Unit', assignedLocation: 'Line 4 Rack D', stageScanLocation: 'Rack D-01', lastScannedAt: '2026-05-04T06:00:00-04:00', lastScannedBy: 'R. Chen' },
  { sku: 'CMP-INV-006', description: 'Power Inverter Stack EV', classCode: 'Class A', line: 'Line 4 — EV Assembly', containerType: 'Large Container', assignedLocation: 'Line 4 Rack D', stageScanLocation: 'Rack D-03', lastScannedAt: '2026-05-04T06:45:00-04:00', lastScannedBy: 'R. Chen' },
  { sku: 'CMP-TCM-003', description: 'Transmission Control Module', classCode: 'Class B', line: 'Line 4 — EV Assembly', containerType: 'Large Container', assignedLocation: 'Line 4 Rack E', stageScanLocation: 'Rack E-02', lastScannedAt: '2026-05-03T15:00:00-04:00', lastScannedBy: 'R. Chen' },
];

function formatScanTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${month} ${day} ${year} ${hours}:${mins}${suffix}`;
}

function isSameLocalDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function readInitialRows() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_ROWS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ROWS;
  } catch {
    return INITIAL_ROWS;
  }
}

export function PartLocationsModule() {
  const [activeLine, setActiveLine] = useState('All Lines');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(readInitialRows);
  const [scanModal, setScanModal] = useState(null);
  const [newRack, setNewRack] = useState('');
  const [scannedBy, setScannedBy] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (activeLine !== 'All Lines' && r.line !== activeLine) return false;
      if (!q) return true;
      return (
        r.sku.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.assignedLocation.toLowerCase().includes(q) ||
        (r.stageScanLocation || '').toLowerCase().includes(q)
      );
    });
  }, [activeLine, query, rows]);

  const totalAssignedLocations = rows.length;
  const stageScannedToday = useMemo(() => {
    const now = new Date();
    return rows.filter((r) => r.lastScannedAt && isSameLocalDate(new Date(r.lastScannedAt), now)).length;
  }, [rows]);

  const lastScanRow = useMemo(() => {
    return rows
      .filter((r) => r.lastScannedAt)
      .sort((a, b) => new Date(b.lastScannedAt) - new Date(a.lastScannedAt))[0];
  }, [rows]);

  const submitScan = () => {
    if (!scanModal) return;
    if (!newRack.trim() || !scannedBy.trim()) return;
    const nextRows = rows.map((r) =>
      r.sku === scanModal.sku && r.line === scanModal.line
        ? {
            ...r,
            stageScanLocation: newRack.trim(),
            lastScannedAt: scanModal.scannedAtIso,
            lastScannedBy: scannedBy.trim(),
          }
        : r
    );
    setRows(nextRows);
    setToast(`${scanModal.sku} updated to ${newRack.trim()}`);
    setScanModal(null);
    setNewRack('');
    setScannedBy('');
  };

  return (
    <div className="module-grid">
      {toast && <div className="po-toast">{toast}</div>}

      <section className="panel panel--span3">
        <div className="po-kpi-grid">
          <article className="po-kpi"><span>Total Assigned Locations</span><strong>{totalAssignedLocations}</strong></article>
          <article className="po-kpi"><span>Stage Scanned Today</span><strong>{stageScannedToday}</strong></article>
          <article className="po-kpi">
            <span>Last Scan</span>
            <strong style={{ fontSize: 14 }}>
              {lastScanRow ? `${formatScanTimestamp(lastScanRow.lastScannedAt)} · ${lastScanRow.sku}` : '—'}
            </strong>
          </article>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Part Locations</h2>
          <span className="panel__meta">Reference view for assigned locations and latest stage scans</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {LINE_TABS.map((line) => (
            <button
              key={line}
              type="button"
              className={`tag tag--switch density-toggle__btn ${activeLine === line ? 'density-toggle__btn--active' : ''}`}
              onClick={() => setActiveLine(line)}
            >
              {line}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            type="search"
            className="parts-inv__search"
            placeholder="Search SKU, description, or rack location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part SKU</th>
                <th>Description</th>
                <th>Class</th>
                <th>Line</th>
                <th>Container Type</th>
                <th>Assigned Location</th>
                <th>Stage Scan Location</th>
                <th>Last Scanned</th>
                <th>Last Scanned By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={`${r.line}-${r.sku}-${r.assignedLocation}`}>
                  <td className="mono">{r.sku}</td>
                  <td>{r.description}</td>
                  <td>{r.classCode}</td>
                  <td>{r.line}</td>
                  <td>{r.containerType}</td>
                  <td>{r.assignedLocation}</td>
                  <td className="mono" style={!r.stageScanLocation ? { color: '#94a3b8' } : undefined}>{r.stageScanLocation || '—'}</td>
                  <td>{formatScanTimestamp(r.lastScannedAt)}</td>
                  <td>{r.lastScannedBy || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td>
                    {r.stageScanLocation ? (
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          const now = new Date();
                          setScanModal({ ...r, scannedAtIso: now.toISOString() });
                          setNewRack('');
                          setScannedBy('');
                        }}
                      >
                        Update Location
                      </button>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {scanModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>Update Stage Scan Location</h3>
            <label>Part SKU<input value={scanModal.sku} readOnly /></label>
            <label>Description<input value={scanModal.description} readOnly /></label>
            <label>Current Rack Location<input value={scanModal.stageScanLocation || '—'} readOnly /></label>
            <label>
              New Rack Location
              <input value={newRack} onChange={(e) => setNewRack(e.target.value)} placeholder="Rack X-00" />
            </label>
            <label>Scanned By<input value={scannedBy} onChange={(e) => setScannedBy(e.target.value)} /></label>
            <label>Timestamp<input value={formatScanTimestamp(scanModal.scannedAtIso)} readOnly /></label>
            <div className="po-form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setScanModal(null)}>Cancel</button>
              <button type="button" className="btn btn--green" onClick={submitScan}>Submit Scan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
