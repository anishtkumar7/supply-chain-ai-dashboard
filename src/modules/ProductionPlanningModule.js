import { Fragment, useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const WEEKLY_WORK_ORDERS = [
  { id: 'WO-4421', product: 'Class 8 Highway Tractor', sku: 'FG-T800-CL', line: 'Line 1', start: 'Mon Apr 28', end: 'Mon Apr 28', plannedQty: 12, status: 'IN PROGRESS' },
  { id: 'WO-4422', product: 'Heavy Duty Vocational', sku: 'FG-V900-HD', line: 'Line 2', start: 'Mon Apr 28', end: 'Tue Apr 29', plannedQty: 8, status: 'IN PROGRESS' },
  { id: 'WO-4423', product: 'Electric Powertrain Unit', sku: 'FG-E300-EV', line: 'Line 4', start: 'Mon Apr 28', end: 'Mon Apr 28', plannedQty: 4, status: 'STOPPED' },
  { id: 'WO-4424', product: 'Regional Cab-Over Truck', sku: 'FG-R450-CO', line: 'Line 1', start: 'Mon Apr 28', end: 'Tue Apr 29', plannedQty: 6, status: 'PENDING SHORTAGE' },
  { id: 'WO-4425', product: 'Medium Duty Platform', sku: 'FG-M550-MD', line: 'Line 3', start: 'Tue Apr 29', end: 'Tue Apr 29', plannedQty: 5, status: 'SCHEDULED' },
  { id: 'WO-4426', product: 'Specialty Work Vehicle', sku: 'FG-S200-SV', line: 'Line 2', start: 'Wed Apr 30', end: 'Wed Apr 30', plannedQty: 10, status: 'SCHEDULED' },
  { id: 'WO-4427', product: 'Cab Assembly Unit', sku: 'FG-C100-CA', line: 'Line 1', start: 'Thu May 1', end: 'Thu May 1', plannedQty: 4, status: 'SCHEDULED' },
  { id: 'WO-4428', product: 'Class 8 Highway Tractor', sku: 'FG-T800-CL', line: 'Line 1', start: 'Fri May 2', end: 'Fri May 2', plannedQty: 14, status: 'SCHEDULED' },
];

const WORK_ORDER_BOM = {
  'WO-4421': [
    { sku: 'CMP-ENG-001', description: 'Diesel Engine Assembly', required: 12, available: 412, status: 'AVAILABLE' },
    { sku: 'CMP-WRH-004', description: 'Wiring Harness', required: 12, available: 900, status: 'AVAILABLE' },
  ],
  'WO-4422': [
    { sku: 'CMP-AXL-002', description: 'Front Axle Assembly', required: 8, available: 1100, status: 'AVAILABLE' },
    { sku: 'CMP-HYD-008', description: 'Hydraulic Pump Module', required: 8, available: 2200, status: 'AVAILABLE' },
  ],
  'WO-4423': [
    { sku: 'CMP-BAT-009', description: 'EV Battery Pack', required: 400, available: 280, status: 'CRITICAL' },
    { sku: 'CMP-INV-006', description: 'Power Inverter', required: 400, available: 620, status: 'AVAILABLE' },
  ],
  'WO-4424': [
    { sku: 'CMP-WRH-004', description: 'Wiring Harness', required: 6200, available: 900, status: 'CRITICAL' },
    { sku: 'CMP-AXL-002', description: 'Front Axle Assembly', required: 6, available: 1100, status: 'AVAILABLE' },
  ],
};

const CAPACITY_ROWS = [
  { line: 'Line 1 Assembly', planned: 76, available: 80, utilization: 95, health: 'green' },
  { line: 'Line 2 Assembly', planned: 52, available: 80, utilization: 65, health: 'green' },
  { line: 'Line 3 Paint and Finish', planned: 24, available: 80, utilization: 30, health: 'yellow' },
  { line: 'Line 4 EV Assembly', planned: 18, available: 80, utilization: 22, health: 'red' },
];

const ENGINEERING_ALERTS = [
  'WO-4423 STOPPED: EV Battery Pack shortage. 120 units short. Line 4 idle. Contact: Rachel Torres',
  'WO-4424 AT RISK: Wiring Harness critically low. 6200 units short. Will impact Line 1 by May 1',
  'BOM Change Notice: FG-T800-CL Bill of Materials updated April 25. Review required before next build run',
];

function statusClass(status) {
  if (status === 'IN PROGRESS') return 'pill pill--healthy';
  if (status === 'STOPPED') return 'pill pill--critical';
  if (status === 'PENDING SHORTAGE') return 'pill pill--watch';
  return 'pill';
}

function bomStatusClass(status) {
  if (status === 'AVAILABLE') return 'pill pill--healthy';
  if (status === 'SHORT') return 'pill pill--watch';
  return 'pill pill--critical';
}

export function ProductionPlanningModule({ onComposeEmail }) {
  const { contactDirectory } = useDashboardData();
  const [expandedWo, setExpandedWo] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const rachel = useMemo(
    () => contactDirectory.find((c) => c.name === 'Rachel Torres') || contactDirectory.find((c) => /Manufacturing Engineer/i.test(c.role)),
    [contactDirectory]
  );

  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="po-kpi-grid">
          <article className="po-kpi"><span>Work Orders This Week</span><strong>18</strong></article>
          <article className="po-kpi"><span>On Time Completion Rate</span><strong>87.3%</strong></article>
          <article className="po-kpi"><span>Lines Running</span><strong>2 of 4</strong></article>
          <article className="po-kpi"><span>Units Produced Today</span><strong>11 of 29 planned</strong></article>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Weekly Build Plan — Week of April 28 2026</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Work Order</th><th>Product</th><th>SKU</th><th>Line</th><th>Planned Start</th><th>Planned End</th><th>Planned Qty</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_WORK_ORDERS.map((wo) => (
                <Fragment key={wo.id}>
                  <tr key={wo.id} onClick={() => setExpandedWo((id) => (id === wo.id ? null : wo.id))} style={{ cursor: 'pointer' }}>
                    <td>{wo.id}</td><td>{wo.product}</td><td>{wo.sku}</td><td>{wo.line}</td><td>{wo.start}</td><td>{wo.end}</td><td>{wo.plannedQty}</td>
                    <td><span className={statusClass(wo.status)}>{wo.status}</span></td>
                  </tr>
                  {expandedWo === wo.id && (
                    <tr>
                      <td colSpan={8}>
                        <table className="data-table">
                          <thead>
                            <tr><th>Component SKU</th><th>Description</th><th>Required Qty</th><th>Available Qty</th><th>Status</th></tr>
                          </thead>
                          <tbody>
                            {(WORK_ORDER_BOM[wo.id] || []).map((row) => (
                              <tr key={`${wo.id}-${row.sku}`}>
                                <td>{row.sku}</td>
                                <td>{row.description}</td>
                                <td>{row.required}</td>
                                <td>{row.available}</td>
                                <td><span className={bomStatusClass(row.status)}>{row.status}</span></td>
                              </tr>
                            ))}
                            {!WORK_ORDER_BOM[wo.id]?.length && (
                              <tr><td colSpan={5} className="po-empty">BOM check not published yet for this work order.</td></tr>
                            )}
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
        <div className="panel__head"><h2>Line Capacity — This Week</h2></div>
        <div style={{ display: 'grid', gap: 10 }}>
          {CAPACITY_ROWS.map((row) => (
            <div key={row.line}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{row.line}: {row.planned} of {row.available} hours planned</span>
                <span>{row.utilization}% utilized</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: 'rgba(30, 58, 95, 0.75)', overflow: 'hidden' }}>
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${row.utilization}%`,
                    background: row.health === 'red' ? '#ef4444' : row.health === 'yellow' ? '#f59e0b' : '#22c55e',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Engineering Alerts</h2>
          <span className="panel__meta">Review and escalation</span>
        </div>
        <div className="contacts-grid">
          {ENGINEERING_ALERTS.map((alert) => (
            <article className="contacts-card" key={alert}>
              <p className="panel__lede" style={{ marginBottom: 10 }}>{alert}</p>
              <button type="button" className="btn btn--green" onClick={() => setContactModalOpen(true)}>
                Contact Engineer
              </button>
            </article>
          ))}
        </div>
      </section>

      {contactModalOpen && rachel && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Contact engineer">
          <div className="modal-card">
            <div className="modal-card__head">
              <h3>{rachel.name}</h3>
              <button type="button" className="modal-card__close" onClick={() => setContactModalOpen(false)} aria-label="Close">×</button>
            </div>
            <p className="modal-card__sub">{rachel.role}</p>
            <p className="modal-card__body">{rachel.email}</p>
            <div className="po-inline-actions">
              <button
                type="button"
                className="btn btn--green"
                onClick={() =>
                  onComposeEmail?.({
                    recipientName: rachel.name,
                    recipientEmail: rachel.email,
                    subject: 'Production Planning Alert Follow Up',
                    body: 'Hi Rachel,\n\nPlease review the current production planning alerts and advise on required engineering actions.\n\nThanks,\nRIVIT',
                  })
                }
              >
                Email
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => window.open(`msteams://l/chat/0/0?users=${encodeURIComponent(rachel.teamsHandle)}`, '_blank')}>Teams</button>
              <button type="button" className="btn btn--ghost" onClick={() => window.open(`slack://user?team=vectrum&id=${encodeURIComponent(rachel.slackHandle)}`, '_blank')}>Slack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
