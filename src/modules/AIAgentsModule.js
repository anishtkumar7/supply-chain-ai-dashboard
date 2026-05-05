import { useEffect, useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import { daysCoverFromWks } from '../utils/coverageDisplay';
import { RIVIT_DISMISSED_AGENT_ALERTS_KEY } from '../constants/demoStorageKeys';

const PLANNER_ESCALATIONS_KEY = 'sc-planner-escalations';

function loadDismissedAlertIds() {
  try {
    const raw = window.localStorage.getItem(RIVIT_DISMISSED_AGENT_ALERTS_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return {};
    return Object.fromEntries(ids.filter(Boolean).map((id) => [id, true]));
  } catch {
    return {};
  }
}

function minutesAgoLabel(nowMs, runAtMs) {
  const mins = Math.max(0, Math.floor((nowMs - runAtMs) / 60000));
  return mins <= 1 ? '1 minute ago' : `${mins} minutes ago`;
}

function statusPillClass(status) {
  if (status === 'RUNNING') return 'pill pill--healthy';
  if (status === 'ALERT') return 'pill pill--critical';
  return 'pill pill--watch';
}

function severityPillClass(severity) {
  if (severity === 'CRITICAL') return 'pill pill--critical';
  if (severity === 'HIGH') return 'pill pill--watch';
  return 'pill pill--healthy';
}

export function AIAgentsModule({ onComposeEmail }) {
  const { skuData, shipmentData, supplierData, componentData, customerOrderData, contactDirectory } = useDashboardData();
  const [nowMs, setNowMs] = useState(Date.now());
  const [dismissed, setDismissed] = useState(loadDismissedAlertIds);
  const [actions, setActions] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState(null);
  const [plannerEscalations, setPlannerEscalations] = useState([]);
  const [internalContactModal, setInternalContactModal] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    try {
      const ids = Object.keys(dismissed).filter((id) => dismissed[id]);
      window.localStorage.setItem(RIVIT_DISMISSED_AGENT_ALERTS_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [dismissed]);

  useEffect(() => {
    const loadEscalations = () => {
      try {
        const raw = window.localStorage.getItem(PLANNER_ESCALATIONS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setPlannerEscalations(parsed);
      } catch {
        setPlannerEscalations([]);
      }
    };

    loadEscalations();
    const onStorage = (e) => {
      if (e.key === PLANNER_ESCALATIONS_KEY) loadEscalations();
    };
    const onCustom = () => loadEscalations();
    window.addEventListener('storage', onStorage);
    window.addEventListener('planner-escalations-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('planner-escalations-updated', onCustom);
    };
  }, []);

  function actionOptionsForAgent(agent) {
    const map = {
      'inventory-agent': ['Create Reorder Request', 'Notify Planner', 'View SKU Detail'],
      'supply-planning-agent': ['Draft PO for Approval', 'Expedite Existing PO', 'Notify Buyer'],
      'fulfillment-agent': ['Escalate to Carrier', 'Request Air Freight Quote', 'Notify Customer Service'],
      'supplier-risk-agent': ['Find Alternate Supplier', 'Expedite Current Order', 'Escalate to Procurement Manager'],
      'order-bank-agent': ['Notify Customer of Delay', 'Pull Forward Inventory', 'Escalate to Planner'],
      'forecast-agent': ['Adjust Forecast', 'Flag for Planner Review', 'Update Demand Plan'],
    };
    const base = map[agent.id] || ['Review Alert', 'Notify Owner', 'Open Module Detail'];
    // Context-aware: if no active alert, focus on monitoring-oriented actions
    if (!agent.alert) {
      return ['Run Diagnostic Check', 'Open Agent Log', 'Open Module Detail'];
    }
    // Context-aware: prioritize options by severity urgency
    if (agent.severity === 'CRITICAL') {
      return [...base].sort((a, b) => {
        const score = (label) =>
          /(expedite|escalate|reorder|draft po|notify customer of delay)/i.test(label) ? 2 : 1;
        return score(b) - score(a);
      });
    }
    if (agent.severity === 'HIGH') {
      return [...base].sort((a, b) => {
        const score = (label) => (/(escalate|notify|expedite)/i.test(label) ? 2 : 1);
        return score(b) - score(a);
      });
    }
    return base;
  }

  const agents = useMemo(() => {
    const riskyOrders = customerOrderData.filter((o) =>
      skuData.some((s) => s.sku === o.sku && (s.status === 'CRITICAL' || s.status === 'WATCH'))
    );
    const lowCover = skuData.filter((s) => s.status === 'CRITICAL' || s.status === 'WATCH');
    const stuckSuppliers = supplierData.filter((s) => s.inboundStatus === 'STUCK' || s.otifPct < 95);
    const riskyShipments = shipmentData.filter((s) => s.status === 'STUCK' || s.status === 'DELAYED');
    const highBias = skuData.filter((s) => Math.abs(s.forecastBias) > 5);
    const overdueComponents = componentData.filter((c) => c.reorderDate < '2026-04-28' && c.netNeed > 0);

    const byLowCover = lowCover[0];
    const byRiskyShipment = riskyShipments[0];
    const byStuckSupplier = stuckSuppliers[0];
    const byOverdueComp = overdueComponents[0];
    const byRiskyOrder = riskyOrders[0];
    const byBias = highBias[0];

    return [
      {
        id: 'order-bank-agent',
        name: 'Order Bank Agent',
        module: 'Order Bank',
        status: riskyOrders.length ? 'ALERT' : 'IDLE',
        severity: riskyOrders.length ? 'HIGH' : null,
        runAtMs: nowMs - 7 * 60000,
        lastAction: riskyOrders.length ? 'Identified promise-date risk orders' : 'No order exceptions detected',
        alert: riskyOrders.length
          ? `${byRiskyOrder.sku}: ${riskyOrders.length} orders at risk of missing promise date. Expedite recommended.`
          : null,
      },
      {
        id: 'inventory-agent',
        name: 'Inventory Agent',
        module: 'Inventory Monitoring',
        status: lowCover.length ? 'ALERT' : 'RUNNING',
        severity: lowCover.length ? 'CRITICAL' : null,
        runAtMs: nowMs - 4 * 60000,
        lastAction: lowCover.length ? 'Flagged low-cover SKU and checked inbound' : 'Inventory policy thresholds healthy',
        alert: lowCover.length
          ? `${byLowCover.sku} at ${daysCoverFromWks(byLowCover.wksCover)} days cover. No inbound shipment detected. Reorder triggered.`
          : null,
      },
      {
        id: 'supplier-risk-agent',
        name: 'Supplier Risk Agent',
        module: 'Supplier Tracking',
        status: stuckSuppliers.length ? 'ALERT' : 'RUNNING',
        severity: stuckSuppliers.length ? 'HIGH' : null,
        runAtMs: nowMs - 6 * 60000,
        lastAction: stuckSuppliers.length ? 'Evaluated OTIF and inbound risk signals' : 'Supplier lanes stable',
        alert: stuckSuppliers.length
          ? `${byStuckSupplier.name} OTIF at ${byStuckSupplier.otifPct.toFixed(1)}%. Alternate supplier recommended.`
          : null,
      },
      {
        id: 'fulfillment-agent',
        name: 'Fulfillment Agent',
        module: 'Fulfillment Monitoring',
        status: riskyShipments.length ? 'ALERT' : 'RUNNING',
        severity: riskyShipments.length ? 'HIGH' : null,
        runAtMs: nowMs - 3 * 60000,
        lastAction: riskyShipments.length ? 'Generated escalation draft for blocked routes' : 'No at-risk shipments',
        alert: riskyShipments.length
          ? `${byRiskyShipment.id} ${byRiskyShipment.status.toLowerCase()} on ${byRiskyShipment.carrier}. Escalation draft ready.`
          : null,
      },
      {
        id: 'forecast-agent',
        name: 'Forecast Agent',
        module: 'Demand Forecasting',
        status: highBias.length ? 'ALERT' : 'RUNNING',
        severity: highBias.length ? 'MEDIUM' : null,
        runAtMs: nowMs - 1 * 60000,
        lastAction: highBias.length ? 'Detected sustained forecast bias drift' : 'Biases within tolerance',
        alert: highBias.length
          ? `${byBias.sku} bias at ${byBias.forecastBias.toFixed(1)}%. OEM contract uplift may be understated.`
          : null,
      },
      {
        id: 'supply-planning-agent',
        name: 'Supply Planning Agent',
        module: 'Supply Planning',
        status: overdueComponents.length || plannerEscalations.length ? 'ALERT' : 'IDLE',
        severity: overdueComponents.length ? 'CRITICAL' : plannerEscalations.length ? 'HIGH' : null,
        runAtMs: nowMs - 5 * 60000,
        lastAction:
          overdueComponents.length || plannerEscalations.length
            ? 'Updated planning exceptions and PO risk queue'
            : 'No overdue reorder exceptions',
        alert: overdueComponents.length
          ? `${byOverdueComp.sku} reorder date ${byOverdueComp.reorderDate}. No PO created. Line stoppage risk rising.`
          : plannerEscalations.length
            ? `Escalated customer orders in planning queue: ${plannerEscalations.join(', ')}.`
            : null,
      },
    ];
  }, [nowMs, plannerEscalations, skuData, shipmentData, supplierData, componentData, customerOrderData]);

  const plannerContact = contactDirectory.find((c) => /supply planner/i.test(c.role));
  const buyerContact = contactDirectory.find((c) => /buyer/i.test(c.role));

  function isSupplierAlert(agentId) {
    return agentId === 'supplier-risk-agent' || agentId === 'fulfillment-agent';
  }

  function openDeepLink(type, contact) {
    if (!contact) return;
    if (type === 'teams') {
      window.open(`msteams://l/chat/0/0?users=${encodeURIComponent(contact.teamsHandle)}`, '_blank');
    } else {
      window.open(`slack://user?team=vectrum&id=${encodeURIComponent(contact.slackHandle)}`, '_blank');
    }
  }

  return (
    <div className="module-grid">
      {agents.map((agent) => {
        const dismissedAlert = dismissed[agent.id];
        const actionText = actions[agent.id];
        return (
          <section key={agent.id} className="panel">
            <div className="panel__head">
              <h2>{agent.name}</h2>
              <span className="panel__meta">{agent.module}</span>
            </div>
            <ul className="fact-list">
              <li>
                <span className="fact-list__k">Status</span>
                <span className="fact-list__v">
                  <span className={statusPillClass(agent.status)}>{agent.status}</span>
                </span>
              </li>
              <li>
                <span className="fact-list__k">Last run</span>
                <span className="fact-list__v">{minutesAgoLabel(nowMs, agent.runAtMs)}</span>
              </li>
              <li>
                <span className="fact-list__k">Last action</span>
                <span className="fact-list__v" style={{ textAlign: 'left', maxWidth: '100%' }}>
                  {actionText || agent.lastAction}
                </span>
              </li>
            </ul>

            {!dismissedAlert && agent.alert && (
              <div style={{ marginTop: 12, background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className={severityPillClass(agent.severity)}>{agent.severity}</span>
                  <span className="panel__meta">{agent.module}</span>
                </div>
                <div style={{ color: '#e2e8f0', fontSize: 13 }}>{agent.alert}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12, position: 'relative' }}>
              {agent.alert && isSupplierAlert(agent.id) && (
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => {
                    const supplier = supplierData.find((s) => s.risk === 'HIGH') || supplierData[0];
                    if (!supplier?.primaryContact) return;
                    onComposeEmail({
                      recipientName: supplier.primaryContact.name,
                      recipientEmail: supplier.primaryContact.email,
                      subject: `Supplier Alert Follow Up — ${supplier.name}`,
                      body: `Dear ${supplier.primaryContact.name},\n\nOur AI alert requires attention:\n${agent.alert}\n\nPlease provide status and recovery actions for open commitments.\n\nRegards,\nRIVIT`,
                    });
                  }}
                >
                  Contact Supplier
                </button>
              )}
              {agent.alert && !isSupplierAlert(agent.id) && (
                <>
                  <button type="button" className="nav-btn" onClick={() => setInternalContactModal({ contact: plannerContact, agent })}>
                    Contact Planner
                  </button>
                  <button type="button" className="nav-btn" onClick={() => setInternalContactModal({ contact: buyerContact, agent })}>
                    Contact Buyer
                  </button>
                </>
              )}
              <button
                type="button"
                className="nav-btn"
                onClick={() => setDismissed((prev) => ({ ...prev, [agent.id]: true }))}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="nav-btn nav-btn--take-action"
                onClick={() => setOpenMenuId((prev) => (prev === agent.id ? null : agent.id))}
              >
                Take Action
              </button>

              {openMenuId === agent.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: 42,
                    right: 0,
                    minWidth: 240,
                    background: '#0f1f36',
                    border: '1px solid #1e3a5f',
                    borderRadius: 8,
                    padding: 8,
                    zIndex: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  }}
                >
                  {actionOptionsForAgent(agent).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="nav-btn"
                      style={{ width: '100%', marginBottom: 6, justifyContent: 'flex-start' }}
                      onClick={() => {
                        setActions((prev) => ({
                          ...prev,
                          [agent.id]: `${option} initiated at ${new Date(nowMs).toLocaleTimeString()}`,
                        }));
                        setToast(`Action taken — ${option}`);
                        setOpenMenuId(null);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
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
          }}
        >
          {toast}
        </div>
      )}
      {internalContactModal?.contact && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Internal contact">
          <div className="modal-card">
            <div className="modal-card__head">
              <h3>{internalContactModal.contact.name}</h3>
              <button type="button" className="modal-card__close" onClick={() => setInternalContactModal(null)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="modal-card__sub">{internalContactModal.contact.role}</p>
            <p className="modal-card__body">{internalContactModal.contact.email}</p>
            <div className="po-inline-actions">
              <button
                type="button"
                className="btn btn--green"
                onClick={() =>
                  onComposeEmail({
                    recipientName: internalContactModal.contact.name,
                    recipientEmail: internalContactModal.contact.email,
                    subject: `${internalContactModal.agent.module} alert follow-up`,
                    body: `Hi ${internalContactModal.contact.name},\n\nPlease review the following alert:\n${internalContactModal.agent.alert}\n\nThanks,\nRIVIT`,
                  })
                }
              >
                Email
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => openDeepLink('teams', internalContactModal.contact)}>Teams</button>
              <button type="button" className="btn btn--ghost" onClick={() => openDeepLink('slack', internalContactModal.contact)}>Slack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
