import { useState, useCallback } from 'react';
import { FulfillmentGlobe } from '../components/FulfillmentGlobe';
import { DelayDetailModal } from '../components/DelayDetailModal';
import { useDashboardData } from '../context/DashboardDataContext';

function routePillClass(status) {
  if (status === 'on_time' || status === 'at_sea' || status === 'in_transit') return 'lane lane--on';
  if (status === 'delayed' || status === 'transshipment') return 'lane lane--late';
  return 'lane lane--stuck';
}

export function FulfillmentModule() {
  const { shipmentData } = useDashboardData();
  const [focusShipmentId, setFocusShipmentId] = useState(null);
  const [delayModal, setDelayModal] = useState(null);

  const clearFocus = useCallback(() => setFocusShipmentId(null), []);
  const onArcIssueClick = useCallback((payload) => setDelayModal(payload), []);

  return (
    <div className="module-grid module-grid--globe">
      <section className="panel panel--span3 globe-panel">
        <div className="panel__head">
          <h2>Active shipment routes</h2>
          <span className="panel__meta">
            Green on-time · yellow delayed · red stuck — click yellow/red arcs for why
          </span>
        </div>
        <div className="lane-legend" aria-hidden>
          <span className="lane lane--on">On time</span>
          <span className="lane lane--late">Delayed</span>
          <span className="lane lane--stuck">Stuck</span>
        </div>
        <p className="panel__lede">
          Click a row below to isolate a lane on the globe. × restores all animated routes.
        </p>
        <div className="globe-frame">
          {focusShipmentId && (
            <button
              type="button"
              className="globe-reset-x globe-reset-x--overlay"
              onClick={clearFocus}
              title="Show all routes"
              aria-label="Reset globe view"
            >
              ×
            </button>
          )}
          <FulfillmentGlobe
            shipments={shipmentData}
            focusShipmentId={focusShipmentId}
            onArcIssueClick={onArcIssueClick}
          />
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>In-transit detail</h2>
          <span className="panel__meta">{shipmentData.length} active shipments</span>
        </div>
        <div className="table-scroll">
          <table className="data-table data-table--click">
            <thead>
              <tr>
                <th>Shipment</th>
                <th>SKU</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Mode</th>
                <th>Carrier</th>
                <th className="num">ETA (d)</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipmentData.map((s) => (
                <tr
                  key={s.id}
                  className={focusShipmentId === s.id ? 'data-table__row--active' : undefined}
                  onClick={() => setFocusShipmentId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFocusShipmentId(s.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td className="mono">{s.id}</td>
                  <td className="mono">{s.sku}</td>
                  <td>{s.origin}</td>
                  <td>{s.destination}</td>
                  <td>{s.mode}</td>
                  <td>{s.carrier}</td>
                  <td className="num">{s.etaDays}</td>
                  <td>
                    <span className={routePillClass(s.routeStatus.toLowerCase().replace(' ', '_'))}>
                      {s.status === 'ON TIME' ? 'On time' : s.status === 'DELAYED' ? 'Delayed' : 'Stuck'}
                    </span>
                  </td>
                  <td>
                    <span className="pill pill--route">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DelayDetailModal
        open={Boolean(delayModal)}
        onClose={() => setDelayModal(null)}
        title={delayModal?.title}
        status={delayModal?.status}
        reason={delayModal?.reason}
      />
    </div>
  );
}
