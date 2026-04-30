import { Fragment, useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const LINES = [
  { id: 'line1', title: 'Line 1 — Assembly', status: 'RUNNING', build: 'FG-T800-CL Class 8 Highway Tractor', planned: 12, complete: 7, shift: 'Day Shift ends 3:00 PM' },
  { id: 'line2', title: 'Line 2 — Assembly', status: 'RUNNING', build: 'FG-V900-HD Heavy Duty Vocational', planned: 8, complete: 3, shift: 'Day Shift ends 3:00 PM' },
  { id: 'line3', title: 'Line 3 — Paint & Finish', status: 'IDLE', build: 'None scheduled', planned: 0, complete: 0, shift: 'Day Shift' },
  { id: 'line4', title: 'Line 4 — EV Assembly', status: 'STOPPED', build: 'FG-E300-EV Electric Powertrain Unit', planned: 4, complete: 1, shift: 'Day Shift — STOPPAGE at 10:42 AM' },
];

const WORK_ORDERS = [
  {
    id: 'WO-4421', line: 'Line 1', product: 'Class 8 Highway Tractor', sku: 'FG-T800-CL', planned: 12, complete: 7, progress: 58, parts: 'All Parts Available', partsState: 'ok', start: '6:00 AM', status: 'IN PROGRESS',
    bom: [{ sku: 'CMP-ENG-001', required: 12, available: 412, status: 'AVAILABLE' }, { sku: 'CMP-WRH-004', required: 12, available: 900, status: 'AVAILABLE' }],
  },
  {
    id: 'WO-4422', line: 'Line 2', product: 'Heavy Duty Vocational', sku: 'FG-V900-HD', planned: 8, complete: 3, progress: 37, parts: 'All Parts Available', partsState: 'ok', start: '6:00 AM', status: 'IN PROGRESS',
    bom: [{ sku: 'CMP-AXL-002', required: 8, available: 1100, status: 'AVAILABLE' }, { sku: 'CMP-HYD-008', required: 8, available: 2200, status: 'AVAILABLE' }],
  },
  {
    id: 'WO-4423', line: 'Line 4', product: 'Electric Powertrain Unit', sku: 'FG-E300-EV', planned: 4, complete: 1, progress: 25, parts: 'Parts Shortage — CMP-BAT-009', partsState: 'critical', start: '6:00 AM', status: 'STOPPED',
    bom: [{ sku: 'CMP-BAT-009', required: 400, available: 280, status: 'CRITICAL' }, { sku: 'CMP-INV-006', required: 400, available: 620, status: 'AVAILABLE' }],
  },
  {
    id: 'WO-4424', line: 'Line 1', product: 'Regional Cab-Over Truck', sku: 'FG-R450-CO', planned: 6, complete: 0, progress: 0, parts: 'Parts Shortage — CMP-WRH-004', partsState: 'critical', start: '2:00 PM', status: 'PENDING — SHORTAGE',
    bom: [{ sku: 'CMP-WRH-004', required: 6200, available: 900, status: 'CRITICAL' }, { sku: 'CMP-AXL-002', required: 6, available: 1100, status: 'AVAILABLE' }],
  },
  {
    id: 'WO-4425', line: 'Line 3', product: 'Medium Duty Platform', sku: 'FG-M550-MD', planned: 5, complete: 0, progress: 0, parts: 'Checking inventory', partsState: 'warn', start: '2:00 PM', status: 'SCHEDULED',
    bom: [{ sku: 'CMP-TCM-003', required: 5, available: 8400, status: 'AVAILABLE' }, { sku: 'CMP-CAB-010', required: 5, available: 3200, status: 'SHORT' }],
  },
];

const SHORTAGES = [
  { sku: 'CMP-BAT-009', description: 'EV Battery Pack', workOrder: 'WO-4423', shortQty: 120, daysToStop: 0 },
  { sku: 'CMP-WRH-004', description: 'Wiring Harness', workOrder: 'WO-4424', shortQty: 6200, daysToStop: 0 },
];

const STOPPAGE_REASONS = ['Parts Shortage', 'Equipment Failure', 'Quality Hold', 'Safety Issue', 'Changeover', 'Other'];

function lineStatusClass(status) {
  if (status === 'RUNNING') return 'pill pill--healthy';
  if (status === 'IDLE') return 'pill';
  return 'pill pill--critical';
}

function partsClass(state) {
  if (state === 'ok') return 'pill pill--healthy';
  if (state === 'warn') return 'pill pill--watch';
  return 'pill pill--critical';
}

export function ShopFloorModule({ onComposeEmail }) {
  const { contactDirectory } = useDashboardData();
  const [expandedWo, setExpandedWo] = useState(null);
  const [stoppageModal, setStoppageModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [plannerModal, setPlannerModal] = useState(false);
  const [toast, setToast] = useState('');

  const planner = useMemo(
    () => contactDirectory.find((c) => c.name === 'Marcus Williams') || contactDirectory.find((c) => /Supply Planner/i.test(c.role)),
    [contactDirectory]
  );

  const [stoppageForm, setStoppageForm] = useState({
    reason: STOPPAGE_REASONS[0],
    description: '',
    notifyEmail: contactDirectory[0]?.email || '',
  });

  const totalPlanned = 29;
  const totalComplete = 11;

  return (
    <div className="module-grid">
      {toast && <div className="po-toast">{toast}</div>}
      <section className="panel panel--span3">
        <div className="shopfloor-lines">
          {LINES.map((l) => (
            <article key={l.id} className="shopfloor-line-card">
              <div className="panel__head">
                <h3>{l.title}</h3>
                <span className={lineStatusClass(l.status)}>{l.status}</span>
              </div>
              <p className="panel__lede">{l.build}</p>
              <div className="comms-meta">Units Planned Today: {l.planned}</div>
              <div className="comms-meta">Units Complete: {l.complete}</div>
              <div className="comms-meta">Shift: {l.shift}</div>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setStoppageModal(l);
                    setStoppageForm((f) => ({ ...f, notifyEmail: planner?.email || contactDirectory[0]?.email || '' }));
                  }}
                >
                  Flag Stoppage
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head"><h2>Todays Build Schedule</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Work Order</th><th>Line</th><th>Product</th><th>SKU</th><th>Planned Qty</th><th>Completed Qty</th><th>Progress</th><th>Parts Status</th><th>Start Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              {WORK_ORDERS.map((w) => (
                <Fragment key={w.id}>
                  <tr key={w.id} onClick={() => setExpandedWo((id) => (id === w.id ? null : w.id))} className={w.partsState === 'critical' ? 'data-table__row--shortage' : undefined} style={{ cursor: 'pointer' }}>
                    <td>{w.id}</td><td>{w.line}</td><td>{w.product}</td><td>{w.sku}</td><td>{w.planned}</td><td>{w.complete}</td>
                    <td><div className="shopfloor-progress"><span style={{ width: `${w.progress}%` }} /></div><small>{w.progress}%</small></td>
                    <td><span className={partsClass(w.partsState)}>{w.parts}</span></td>
                    <td>{w.start}</td><td>{w.status}</td>
                  </tr>
                  {expandedWo === w.id && (
                    <tr>
                      <td colSpan={10}>
                        <table className="data-table">
                          <thead><tr><th>Component</th><th>Qty Required</th><th>Qty Available</th><th>Status</th></tr></thead>
                          <tbody>
                            {w.bom.map((b) => (
                              <tr key={`${w.id}-${b.sku}`}>
                                <td>{b.sku}</td><td>{b.required}</td><td>{b.available}</td>
                                <td><span className={b.status === 'AVAILABLE' ? 'pill pill--healthy' : b.status === 'SHORT' ? 'pill pill--watch' : 'pill pill--critical'}>{b.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head"><h2>Active Shortages — Action Required</h2></div>
        <div className="shopfloor-shortages">
          {SHORTAGES.map((s) => (
            <article key={s.sku} className="contacts-card">
              <strong>{s.sku} {s.description}</strong>
              <div className="comms-meta">Work Order: {s.workOrder}</div>
              <div className="comms-meta">Quantity short: {s.shortQty}</div>
              <div className="comms-meta">Days until line stoppage: {s.daysToStop === 0 ? 'line already stopped' : s.daysToStop}</div>
              <div className="po-inline-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setTransferModal(s)}>Request Emergency Transfer</button>
                <button type="button" className="btn btn--green" onClick={() => setPlannerModal(true)}>Contact Planner</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="shopfloor-summary">
          <span>Total Units Planned Today: {totalPlanned}</span>
          <span>Total Units Completed: {totalComplete}</span>
          <span>Overall Line Efficiency: 37.9%</span>
          <span>Active Stoppages: 1</span>
          <span>Open Shortages: 2</span>
        </div>
      </section>

      {stoppageModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>Flag Stoppage</h3>
            <label>Line<input value={stoppageModal.title} readOnly /></label>
            <label>Stoppage reason<select value={stoppageForm.reason} onChange={(e) => setStoppageForm((f) => ({ ...f, reason: e.target.value }))}>{STOPPAGE_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
            <label>Description<textarea rows={3} value={stoppageForm.description} onChange={(e) => setStoppageForm((f) => ({ ...f, description: e.target.value }))} /></label>
            <label>Notify<select value={stoppageForm.notifyEmail} onChange={(e) => setStoppageForm((f) => ({ ...f, notifyEmail: e.target.value }))}>{contactDirectory.map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}</select></label>
            <div className="po-form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setStoppageModal(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn--green"
                onClick={() => {
                  const who = contactDirectory.find((c) => c.email === stoppageForm.notifyEmail);
                  setToast(`Stoppage flagged — ${who?.name || 'team member'} notified`);
                  setStoppageModal(null);
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {transferModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>Emergency Transfer Request</h3>
            <p className="panel__lede mono">{transferModal.sku} · {transferModal.workOrder} · short {transferModal.shortQty}</p>
            <p className="panel__lede">Transfer request draft created for Parts Inventory team.</p>
            <div className="po-form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setTransferModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {plannerModal && planner && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>{planner.name}</h3>
            <p className="panel__lede">{planner.role} · {planner.email}</p>
            <div className="po-inline-actions">
              <button
                type="button"
                className="btn btn--green"
                onClick={() =>
                  onComposeEmail({
                    recipientName: planner.name,
                    recipientEmail: planner.email,
                    subject: 'Shop floor shortage escalation',
                    body: 'Hi Marcus,\n\nShop floor has active shortages requiring immediate planning support:\n- CMP-BAT-009 (WO-4423)\n- CMP-WRH-004 (WO-4424)\n\nPlease advise.\n\nThanks,\nShop Floor',
                  })
                }
              >
                Email
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => window.open(`msteams://l/chat/0/0?users=${planner.teamsHandle}`, '_blank')}>Teams</button>
              <button type="button" className="btn btn--ghost" onClick={() => window.open(`slack://user?team=vectrum&id=${planner.slackHandle}`, '_blank')}>Slack</button>
              <button type="button" className="btn btn--ghost" onClick={() => setPlannerModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
