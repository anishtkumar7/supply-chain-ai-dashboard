import { useEffect, useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const PLANNER_ESCALATIONS_KEY = 'sc-planner-escalations';

function daysUntil(dateIso) {
  const now = new Date('2026-04-28T12:00:00Z');
  const target = new Date(`${dateIso}T12:00:00Z`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((target - now) / msPerDay));
}

function addDays(dateIso, days) {
  const d = new Date(`${dateIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function atpStatusClass(status) {
  if (status === 'CONFIRMED') return 'pill pill--healthy';
  if (status === 'AT RISK') return 'pill pill--watch';
  return 'pill pill--critical';
}

export function CustomerOrdersModule({ onComposeEmail }) {
  const { customerOrderData, skuData } = useDashboardData();
  const [activeOrder, setActiveOrder] = useState(null);
  const [plannerEscalations, setPlannerEscalations] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLANNER_ESCALATIONS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setPlannerEscalations(parsed);
    } catch {
      // Ignore storage parsing errors in demo mode.
    }
  }, []);

  const orders = useMemo(() => {
    return customerOrderData.map((o) => {
      const sku = skuData.find((s) => s.sku === o.sku);
      const available = sku?.available ?? 0;
      const shortfall = Math.max(0, o.qtyOrdered - available);
      const dueInDays = daysUntil(o.promiseDate);
      let atpStatus = 'CONFIRMED';
      if (shortfall > 0 && dueInDays <= 7) atpStatus = 'BREACHED';
      else if (shortfall > 0) atpStatus = 'AT RISK';
      const reason =
        atpStatus === 'CONFIRMED'
          ? 'Available inventory covers quantity'
          : `Shortfall ${shortfall} units vs available ${available}`;
      return { ...o, available, shortfall, dueInDays, atpStatus, reason };
    });
  }, [customerOrderData, skuData]);

  const openCount = orders.length;
  const onTimePct = (orders.filter((o) => o.atpStatus === 'CONFIRMED').length / orders.length) * 100;
  const atRiskCount = orders.filter((o) => o.atpStatus !== 'CONFIRMED').length;
  const shortfallValue = orders
    .filter((o) => o.atpStatus === 'AT RISK' || o.atpStatus === 'BREACHED')
    .reduce((sum, o) => {
      const sku = skuData.find((s) => s.sku === o.sku);
      return sum + o.shortfall * (sku?.unitValue || 0);
    }, 0);

  const selected = activeOrder ? orders.find((o) => o.id === activeOrder) : null;

  return (
    <div className="module-grid">
      <section className="panel panel--span3 inv-kpis">
        <div className="inv-kpi">
          <span className="inv-kpi__label">Open Customer Orders</span>
          <span className="inv-kpi__value">{openCount}</span>
          <span className="inv-kpi__hint">Active open order lines</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Orders On Time %</span>
          <span className={`inv-kpi__value ${onTimePct < 50 ? 'inv-kpi__value--warn' : ''}`}>{onTimePct.toFixed(1)}%</span>
          <span className="inv-kpi__hint">ATP confirmed — 3 of 8 orders fully covered</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Orders At Risk</span>
          <span className="inv-kpi__value inv-kpi__value--warn">{atRiskCount}</span>
          <span className="inv-kpi__hint">AT RISK + BREACHED</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Inventory Shortfall Value</span>
          <span className="inv-kpi__value inv-kpi__value--warn">${(shortfallValue / 1e6).toFixed(2)}M</span>
          <span className="inv-kpi__hint">Value of short units across AT RISK + BREACHED orders</span>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Customer Orders ATP View</h2>
          <span className="panel__meta">Availability-to-promise based on current SKU availability</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer name</th>
                <th>Order number</th>
                <th>SKU ordered</th>
                <th className="num">Quantity</th>
                <th>Promise date</th>
                <th>ATP status</th>
                <th>Reason</th>
                <th>Action</th>
                <th>Contact Customer</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer}</td>
                  <td className="mono">{o.id}</td>
                  <td className="mono">{o.sku}</td>
                  <td className="num">{o.qtyOrdered}</td>
                  <td className="mono">{o.promiseDate}</td>
                  <td>
                    <span className={atpStatusClass(o.atpStatus)}>{o.atpStatus}</span>
                  </td>
                  <td>{o.reason}</td>
                  <td>
                    <button type="button" className="nav-btn nav-btn--active" onClick={() => setActiveOrder(o.id)}>
                      Take Action
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        onComposeEmail({
                          recipientName: o.customer,
                          recipientEmail: `${o.customer.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@customer.example.com`,
                          subject: `Your Order ${o.id} — Status Update from Vectrum Manufacturing`,
                          body: `Dear ${o.customer},\n\nWe wanted to provide you with an update on your order for ${o.product} ${o.qtyOrdered} units.\n\nStatus: ${o.atpStatus}. ${o.reason}.\n\nPlease do not hesitate to reach out with any questions.\n\nRegards,\nVectrum Manufacturing`,
                        })
                      }
                    >
                      Contact Customer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="customer-order-action-title">
          <div className="modal-card">
            <div className="modal-card__head">
              <h3 id="customer-order-action-title">Order Action Options</h3>
              <button type="button" className="modal-card__close" onClick={() => setActiveOrder(null)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="modal-card__sub mono">{selected.id} · {selected.customer} · {selected.sku}</p>
            <p className="modal-card__body">
              {selected.atpStatus === 'CONFIRMED'
                ? 'Order is currently confirmed. You can still notify or escalate proactively.'
                : `Order is ${selected.atpStatus}. ${selected.reason}.`}
            </p>
            <button
              type="button"
              className="modal-card__action"
              onClick={() => {
                const newDate = addDays(selected.promiseDate, selected.atpStatus === 'BREACHED' ? 5 : 3);
                const draft = `Draft email to ${selected.customer}: We are experiencing a fulfillment delay on order ${selected.id} (${selected.sku}) due to ${selected.reason.toLowerCase()}. Updated estimated delivery date: ${newDate}.`;
                setToast(`Delay notification draft generated — ${draft}`);
                setActiveOrder(null);
              }}
            >
              Send Delay Notification
            </button>
            <button
              type="button"
              className="modal-card__action"
              onClick={() => {
                setPlannerEscalations((prev) => {
                  const next = [...prev, selected.id];
                  window.localStorage.setItem(PLANNER_ESCALATIONS_KEY, JSON.stringify(next));
                  window.dispatchEvent(new CustomEvent('planner-escalations-updated', { detail: next }));
                  return next;
                });
                setToast(`Escalated to planner — ${selected.id} added to Supply Planning exceptions`);
                setActiveOrder(null);
              }}
            >
              Escalate to Planner
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: '#0f1f36',
            border: '1px solid #1e3a5f',
            color: '#e2e8f0',
            borderRadius: 8,
            padding: '10px 14px',
            zIndex: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            maxWidth: 520,
          }}
        >
          {toast}
        </div>
      )}

      {plannerEscalations.length > 0 && (
        <section className="panel panel--span3">
          <div className="panel__head">
            <h2>Supply Planning Exceptions (Session)</h2>
            <span className="panel__meta">Escalated from Customer Orders actions</span>
          </div>
          <p className="panel__lede mono">{plannerEscalations.join(', ')}</p>
        </section>
      )}
    </div>
  );
}
