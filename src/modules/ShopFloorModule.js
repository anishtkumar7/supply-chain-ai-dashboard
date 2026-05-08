import { Fragment, useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import { SHOP_FLOAT_STATUS_CLEAN, SHOP_SHORTAGES_CLEAN, SHOP_WO_4424_CLEAN } from '../data/demoCleanSample';

const LINES = [
  { id: 'line1', title: 'Line 1 — Assembly', status: 'RUNNING', build: 'FG-T800-CL Class 8 Highway Tractor', planned: 12, complete: 7, shift: 'Day Shift ends 3:00 PM' },
  { id: 'line2', title: 'Line 2 — Assembly', status: 'RUNNING', build: 'FG-V900-HD Heavy Duty Vocational', planned: 8, complete: 3, shift: 'Day Shift ends 3:00 PM' },
  { id: 'line3', title: 'Line 3 — Paint & Finish', status: 'IDLE', build: 'None scheduled', planned: 0, complete: 0, shift: 'Day Shift' },
  { id: 'line4', title: 'Line 4 — EV Assembly', status: 'STOPPED', build: 'FG-E300-EV Electric Powertrain Unit', planned: 4, complete: 1, shift: 'Day Shift — STOPPAGE at 10:42 AM' },
];

const PRODUCTION_SEQUENCES = [
  {
    id: 'SEQ-4421', line: 'Line 1', product: 'Class 8 Highway Tractor', sku: 'FG-T800-CL', planned: 12, complete: 7, progress: 58, parts: 'All Parts Available', partsState: 'ok', start: '6:00 AM', status: 'IN PROGRESS',
    bom: [{ sku: 'CMP-ENG-001', required: 12, available: 412, status: 'AVAILABLE' }, { sku: 'CMP-WRH-004', required: 12, available: 900, status: 'AVAILABLE' }],
  },
  {
    id: 'SEQ-4422', line: 'Line 2', product: 'Heavy Duty Vocational', sku: 'FG-V900-HD', planned: 8, complete: 3, progress: 37, parts: 'All Parts Available', partsState: 'ok', start: '6:00 AM', status: 'IN PROGRESS',
    bom: [{ sku: 'CMP-AXL-002', required: 8, available: 1100, status: 'AVAILABLE' }, { sku: 'CMP-HYD-008', required: 8, available: 2200, status: 'AVAILABLE' }],
  },
  {
    id: 'SEQ-4423', line: 'Line 4', product: 'Electric Powertrain Unit', sku: 'FG-E300-EV', planned: 4, complete: 1, progress: 25, parts: 'Parts Shortage — CMP-BAT-009', partsState: 'critical', start: '6:00 AM', status: 'STOPPED',
    bom: [{ sku: 'CMP-BAT-009', required: 400, available: 280, status: 'CRITICAL' }, { sku: 'CMP-INV-006', required: 400, available: 620, status: 'AVAILABLE' }],
  },
  {
    id: 'SEQ-4424', line: 'Line 1', product: 'Regional Cab-Over Truck', sku: 'FG-R450-CO', planned: 6, complete: 0, progress: 0, parts: 'Parts Shortage — CMP-WHL-DRV', partsState: 'critical', start: '2:00 PM', status: 'PENDING — SHORTAGE',
    bom: [{ sku: 'CMP-WHL-DRV', required: 8, available: 14, status: 'CRITICAL' }, { sku: 'CMP-AXL-002', required: 6, available: 1100, status: 'AVAILABLE' }],
  },
  {
    id: 'SEQ-4425', line: 'Line 3', product: 'Medium Duty Platform', sku: 'FG-M550-MD', planned: 5, complete: 0, progress: 0, parts: 'Checking inventory', partsState: 'warn', start: '2:00 PM', status: 'SCHEDULED',
    bom: [{ sku: 'CMP-TCM-003', required: 5, available: 8400, status: 'AVAILABLE' }, { sku: 'CMP-CAB-010', required: 5, available: 3200, status: 'SHORT' }],
  },
];

const SHORTAGES = [
  { sku: 'CMP-WHL-DRV', description: 'Drive Axle Wheel Assembly', productionSequence: 'SEQ-4424', shortQty: 8, daysToStop: 0 },
  { sku: 'CMP-BAT-009', description: 'EV Battery Pack', productionSequence: 'SEQ-4423', shortQty: 120, daysToStop: 0 },
];

const FLOAT_STATUS_SEED = [
  {
    component: 'Diesel Engine Assembly 13L',
    sku: 'CMP-ENG-001',
    lines: {
      'Line 1': { count: 4, target: 6, status: 'HEALTHY' },
      'Line 2': { count: 2, target: 6, status: 'LOW' },
      'Line 3': null,
      'Line 4': null,
    },
  },
  {
    component: 'Drive Axle Wheel Assembly 11R22.5',
    sku: 'CMP-WHL-DRV',
    lines: {
      'Line 1': { count: 2, target: 4, status: 'CRITICAL' },
      'Line 2': null,
      'Line 3': null,
      'Line 4': null,
    },
  },
  {
    component: 'Wiring Harness Complete',
    sku: 'CMP-WRH-004',
    lines: {
      'Line 1': { count: 2, target: 8, status: 'CRITICAL' },
      'Line 2': { count: 5, target: 8, status: 'HEALTHY' },
      'Line 3': null,
      'Line 4': null,
    },
  },
  {
    component: 'EV Battery Pack 320kWh',
    sku: 'CMP-BAT-009',
    lines: {
      'Line 1': null,
      'Line 2': null,
      'Line 3': null,
      'Line 4': { count: 0, target: 3, status: 'CRITICAL' },
    },
  },
  {
    component: 'Power Inverter Stack EV',
    sku: 'CMP-INV-006',
    lines: {
      'Line 1': null,
      'Line 2': null,
      'Line 3': null,
      'Line 4': { count: 1, target: 4, status: 'LOW' },
    },
  },
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

function floatBadgeClass(status) {
  if (status === 'HEALTHY') return 'pill pill--healthy';
  if (status === 'LOW') return 'pill pill--watch';
  if (status === 'CRITICAL') return 'pill pill--critical';
  return 'pill';
}

function deriveFloatStatus(count, target) {
  const pct = target > 0 ? count / target : 0;
  if (pct > 0.6) return 'HEALTHY';
  if (pct >= 0.3) return 'LOW';
  return 'CRITICAL';
}

function cloneDeep(v) {
  return JSON.parse(JSON.stringify(v));
}

export function ShopFloorModule({ onComposeEmail }) {
  const { contactDirectory, addAdjustmentHistory, demoScenario } = useDashboardData();

  const productionSequences = useMemo(() => {
    if (demoScenario !== 'clean') return PRODUCTION_SEQUENCES;
    return PRODUCTION_SEQUENCES.map((w) => (w.id === 'SEQ-4424' ? { ...SHOP_WO_4424_CLEAN } : w));
  }, [demoScenario]);

  const shortagesForScenario = useMemo(
    () => (demoScenario === 'clean' ? SHOP_SHORTAGES_CLEAN : SHORTAGES),
    [demoScenario]
  );

  const [expandedWo, setExpandedWo] = useState(null);
  const [stoppageModal, setStoppageModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [escalationContactModal, setEscalationContactModal] = useState(null);
  const [floatRows, setFloatRows] = useState(() =>
    demoScenario === 'clean' ? cloneDeep(SHOP_FLOAT_STATUS_CLEAN) : cloneDeep(FLOAT_STATUS_SEED)
  );
  const [floatModal, setFloatModal] = useState(null);
  const [floatNewCount, setFloatNewCount] = useState('');
  const [floatUpdatedBy, setFloatUpdatedBy] = useState('');
  const [toast, setToast] = useState('');

  const planner = useMemo(
    () => contactDirectory.find((c) => c.name === 'Marcus Williams') || contactDirectory.find((c) => /Supply Planner/i.test(c.role)),
    [contactDirectory]
  );
  const buyer = useMemo(
    () => contactDirectory.find((c) => /buyer/i.test(c.role)) || contactDirectory[0],
    [contactDirectory]
  );

  const [stoppageForm, setStoppageForm] = useState({
    reason: STOPPAGE_REASONS[0],
    description: '',
    notifyEmail: contactDirectory[0]?.email || '',
  });

  const totalPlanned = 29;
  const totalComplete = 11;
  const floatCriticalAlerts = useMemo(() => {
    const alerts = [];
    floatRows.forEach((row) => {
      ['Line 1', 'Line 2', 'Line 3', 'Line 4'].forEach((line) => {
        const cell = row.lines[line];
        if (cell?.status === 'CRITICAL') {
          const isDrvWheel = row.sku === 'CMP-WHL-DRV' && line === 'Line 1';
          alerts.push({
            id: `${row.sku}-${line}`,
            text: isDrvWheel
              ? 'CMP-WHL-DRV Drive Axle Wheel Assembly — 2 units remaining at Line 1. Sequenced component — no float buffer. At current build rate line stoppage in approximately 8-10 hours. Immediate escalation required.'
              : `${row.component} float CRITICAL at ${line} — trucker replenishment required immediately`,
          });
        }
      });
    });
    return alerts;
  }, [floatRows]);

  const shortageCards = useMemo(
    () => [
      ...shortagesForScenario.map((s) => ({
        id: s.sku,
        title: `${s.sku} ${s.description}`,
        detail1: `Production Sequence: ${s.productionSequence}`,
        detail2: `Quantity short: ${s.shortQty}`,
        detail3:
          s.sku === 'CMP-WHL-DRV'
            ? 'Sequenced component — no float buffer. At current build rate line stoppage in approximately 8-10 hours.'
            : `Days until line stoppage: ${s.daysToStop === 0 ? 'line already stopped' : s.daysToStop}`,
        sku: s.sku,
        canActions: true,
      })),
      ...floatCriticalAlerts.map((a) => ({
        id: a.id,
        title: a.text,
        detail1: 'Float status alert',
        detail2: 'Trucker replenishment pending',
        detail3: 'Escalate immediately',
        sku: null,
        canActions: false,
      })),
    ],
    [floatCriticalAlerts, shortagesForScenario]
  );

  const openFloatUpdate = (component, line, cell) => {
    setFloatModal({ component, line, cell });
    setFloatNewCount(String(cell.count));
    setFloatUpdatedBy('');
  };

  const submitFloatUpdate = () => {
    if (!floatModal) return;
    const nextCount = Math.max(0, Math.floor(Number(floatNewCount) || 0));
    const who = floatUpdatedBy.trim() || 'Shop Floor Operator';
    const { component, line, cell } = floatModal;
    const nextRows = floatRows.map((r) => {
      if (r.sku !== component.sku) return r;
      const current = r.lines[line];
      if (!current) return r;
      const nextStatus = deriveFloatStatus(nextCount, current.target);
      return {
        ...r,
        lines: {
          ...r.lines,
          [line]: { ...current, count: nextCount, status: nextStatus },
        },
      };
    });
    setFloatRows(nextRows);
    setFloatModal(null);
    setToast(`Float updated — ${component.component} ${line} is now ${nextCount}/${cell.target}`);
    addAdjustmentHistory({
      id: `FLT-${Date.now()}`,
      part: component.sku,
      description: `${component.component} float at ${line}`,
      type: 'Float Update',
      quantity: nextCount,
      reason: `Float count updated at ${line} to ${nextCount}/${cell.target}`,
      authorizedBy: who,
      flagged: false,
    });
  };

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
                    setStoppageForm((f) => ({ ...f, notifyEmail: buyer?.email || contactDirectory[0]?.email || '' }));
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
        <div className="panel__head">
          <h2>Class A Component Float Status</h2>
          <span className="panel__meta">Live float levels at each production line — truckers replenish throughout shift</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Line 1 Float</th>
                <th>Line 2 Float</th>
                <th>Line 3 Float</th>
                <th>Line 4 Float</th>
              </tr>
            </thead>
            <tbody>
              {floatRows.map((row) => (
                <tr key={row.sku}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.component}</div>
                  </td>
                  {['Line 1', 'Line 2', 'Line 3', 'Line 4'].map((line) => {
                    const cell = row.lines[line];
                    if (!cell) {
                      return (
                        <td key={`${row.sku}-${line}`}>
                          <span className="pill" style={{ color: '#94a3b8', borderColor: 'rgba(148,163,184,0.35)' }}>N/A</span>
                        </td>
                      );
                    }
                    return (
                      <td key={`${row.sku}-${line}`}>
                        <div className="shopfloor-float-cell">
                          <span className="mono">{cell.count}/{cell.target}</span>
                          <span className={floatBadgeClass(cell.status)}>{cell.status}</span>
                          {(cell.status === 'LOW' || cell.status === 'CRITICAL') && (
                            <button type="button" className="btn btn--ghost" onClick={() => openFloatUpdate(row, line, cell)}>
                              Update Float
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head"><h2>Todays Build Schedule</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Production Sequence</th><th>Line</th><th>Product</th><th>SKU</th><th>Planned Qty</th><th>Completed Qty</th><th>Progress</th><th>Parts Status</th><th>Start Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              {productionSequences.map((w) => (
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
          {shortageCards.map((s) => (
            <article key={s.id} className="contacts-card">
              <strong>{s.title}</strong>
              <div className="comms-meta">{s.detail1}</div>
              <div className="comms-meta">{s.detail2}</div>
              <div className="comms-meta">{s.detail3}</div>
              <div className="po-inline-actions">
                {s.canActions ? (
                  <>
                    <button type="button" className="btn btn--ghost" onClick={() => setTransferModal({ sku: s.sku, productionSequence: s.detail1.replace('Production Sequence: ', ''), shortQty: s.detail2.replace('Quantity short: ', '') })}>Request Emergency Transfer</button>
                    <button type="button" className="btn btn--green" onClick={() => setEscalationContactModal(buyer || planner)}>
                      Contact Buyer
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={() => setEscalationContactModal(buyer || planner)}>
                    Contact Buyer
                  </button>
                )}
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
            <p className="panel__lede mono">{transferModal.sku} · {transferModal.productionSequence} · short {transferModal.shortQty}</p>
            <p className="panel__lede">Transfer request draft created for Parts Inventory team.</p>
            <div className="po-form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setTransferModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {escalationContactModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>{escalationContactModal.name}</h3>
            <p className="panel__lede">{escalationContactModal.role} · {escalationContactModal.email}</p>
            <div className="po-inline-actions">
              <button
                type="button"
                className="btn btn--green"
                onClick={() =>
                  onComposeEmail({
                    recipientName: escalationContactModal.name,
                    recipientEmail: escalationContactModal.email,
                    subject: 'Shop floor shortage escalation',
                    body:
                      demoScenario === 'clean'
                        ? 'Hi team,\n\nShop floor has active shortages requiring immediate support:\n- CMP-WRH-004 (SEQ-4424)\n- CMP-BAT-009 (SEQ-4423)\n\nPlease advise.\n\nThanks,\nShop Floor'
                        : 'Hi team,\n\nShop floor has active shortages requiring immediate support:\n- CMP-WHL-DRV (SEQ-4424)\n- CMP-BAT-009 (SEQ-4423)\n\nPlease advise.\n\nThanks,\nShop Floor',
                  })
                }
              >
                Email
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => window.open(`msteams://l/chat/0/0?users=${escalationContactModal.teamsHandle}`, '_blank')}>Teams</button>
              <button type="button" className="btn btn--ghost" onClick={() => window.open(`slack://user?team=vectrum&id=${escalationContactModal.slackHandle}`, '_blank')}>Slack</button>
              <button type="button" className="btn btn--ghost" onClick={() => setEscalationContactModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {floatModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>Update Float</h3>
            <label>Component<input value={floatModal.component.component} readOnly /></label>
            <label>Line<input value={floatModal.line} readOnly /></label>
            <label>New count<input type="number" min="0" value={floatNewCount} onChange={(e) => setFloatNewCount(e.target.value)} /></label>
            <label>Updated by<input value={floatUpdatedBy} onChange={(e) => setFloatUpdatedBy(e.target.value)} /></label>
            <div className="po-form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setFloatModal(null)}>Cancel</button>
              <button type="button" className="btn btn--green" onClick={submitFloatUpdate}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
