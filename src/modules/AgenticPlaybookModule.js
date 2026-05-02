import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import { buildPlaybookProposals } from '../utils/agenticPlaybook';
import { getSyncHealthReadout } from '../utils/syncHealth';

const STATUS_KEY = 'sc-agentic-playbook-status';
const CONSTRAINTS_KEY = 'sc-agentic-playbook-constraints';
const AUDIT_KEY = 'sc-agentic-playbook-audit';
const AUDIT_ACTOR = 'User';

function loadJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    return p ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, val) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore quota */
  }
}

function riskPillClass(risk) {
  if (risk === 'Critical') return 'pill pill--critical';
  if (risk === 'High') return 'pill pill--critical';
  if (risk === 'Medium') return 'pill pill--watch';
  return 'pill pill--healthy';
}

export function AgenticPlaybookModule() {
  const { agentAlerts, skuData, shipmentData, supplierData, syncLog, lastManualUpload } = useDashboardData();
  const syncHealth = useMemo(
    () => getSyncHealthReadout({ syncLog, lastManualUpload }),
    [syncLog, lastManualUpload]
  );

  const proposals = useMemo(
    () => buildPlaybookProposals({ agentAlerts, skuData, shipmentData, supplierData }),
    [agentAlerts, skuData, shipmentData, supplierData]
  );

  const [statusById, setStatusById] = useState(() => loadJson(STATUS_KEY, {}));
  const [constraintsById, setConstraintsById] = useState(() => loadJson(CONSTRAINTS_KEY, {}));
  const [audit, setAudit] = useState(() => loadJson(AUDIT_KEY, []));
  const [constraintsEditId, setConstraintsEditId] = useState(null);
  const [constraintsDraft, setConstraintsDraft] = useState('');

  useEffect(() => {
    saveJson(STATUS_KEY, statusById);
  }, [statusById]);

  useEffect(() => {
    saveJson(CONSTRAINTS_KEY, constraintsById);
  }, [constraintsById]);

  useEffect(() => {
    saveJson(AUDIT_KEY, audit);
  }, [audit]);

  const appendAudit = useCallback((verb, rowId, note) => {
    const entry = {
      t: Date.now(),
      actor: AUDIT_ACTOR,
      verb,
      rowId,
      ...(note ? { note } : {}),
    };
    setAudit((prev) => [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 100));
  }, []);

  const statusFor = useCallback(
    (id) => statusById[id] || 'open',
    [statusById]
  );

  const handleApprove = useCallback(
    (row) => {
      setStatusById((s) => ({ ...s, [row.id]: 'approved' }));
      appendAudit('approved', row.id);
    },
    [appendAudit]
  );

  const handleDismiss = useCallback(
    (row) => {
      setStatusById((s) => ({ ...s, [row.id]: 'dismissed' }));
      appendAudit('dismissed', row.id);
      setConstraintsEditId(null);
    },
    [appendAudit]
  );

  const openConstraints = useCallback((row) => {
    setConstraintsEditId(row.id);
    setConstraintsDraft(constraintsById[row.id] || '');
  }, [constraintsById]);

  const saveConstraints = useCallback(
    (row) => {
      const note = constraintsDraft.trim();
      setConstraintsById((c) => ({ ...c, [row.id]: note }));
      setStatusById((s) => ({ ...s, [row.id]: 'constraints-set' }));
      appendAudit('constraints_updated', row.id, note || '(empty)');
      setConstraintsEditId(null);
    },
    [appendAudit, constraintsDraft]
  );

  const visibleRows = useMemo(
    () => proposals.filter((r) => statusFor(r.id) !== 'dismissed'),
    [proposals, statusFor]
  );

  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Agentic playbook</h2>
          <span className="panel__meta">Demo workflow · proposed moves only · no ERP execution</span>
        </div>
        <p className="panel__lede" style={{ borderLeft: '3px solid rgba(96, 165, 250, 0.5)', paddingLeft: '0.65rem' }}>
          <strong>Demonstration only:</strong> Approvals and constraints are saved in this browser (localStorage). They do not
          trigger real purchase orders, transfers, or messages to external systems.
        </p>
        {syncHealth.isStale && (
          <div className="sync-stale-banner" role="status">
            Last successful integration sync was over 24 hours ago
            {syncHealth.lastSuccessLabel ? ` (${syncHealth.lastSuccessLabel})` : ''}. Verify data freshness before approving moves.
          </div>
        )}

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Proposed action</th>
                <th>Impact</th>
                <th>Risk</th>
                <th>Owner</th>
                <th>Evidence</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const st = statusFor(row.id);
                const editing = constraintsEditId === row.id;
                return (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.proposedAction}</div>
                      <div className="panel__meta" style={{ marginTop: 4 }}>
                        {row.agentName}
                      </div>
                    </td>
                    <td style={{ maxWidth: '11rem' }}>{row.impact}</td>
                    <td>
                      <span className={riskPillClass(row.risk)}>{row.risk}</span>
                    </td>
                    <td>{row.owner}</td>
                    <td style={{ maxWidth: '22rem', fontSize: '0.82rem', color: 'var(--muted, #94a3b8)' }}>
                      {row.evidence}
                    </td>
                    <td>
                      {st === 'approved' && <span className="pill pill--healthy">Approved</span>}
                      {st === 'constraints-set' && <span className="pill pill--watch">Constraints set</span>}
                      {st === 'open' && <span className="pill pill--route">Open</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <button type="button" className="btn btn--green" disabled={st === 'approved'} onClick={() => handleApprove(row)}>
                          Approve
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => openConstraints(row)}>
                          Edit constraints
                        </button>
                        <button type="button" className="btn btn--danger" onClick={() => handleDismiss(row)}>
                          Dismiss
                        </button>
                      </div>
                      {editing && (
                        <div style={{ marginTop: 8 }}>
                          <textarea
                            rows={3}
                            style={{ width: '100%', maxWidth: 280, fontSize: '0.82rem' }}
                            placeholder="Constraints / guardrails (demo notes)"
                            value={constraintsDraft}
                            onChange={(e) => setConstraintsDraft(e.target.value)}
                          />
                          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                            <button type="button" className="btn btn--green" onClick={() => saveConstraints(row)}>
                              Save constraints
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={() => setConstraintsEditId(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleRows.length === 0 && (
          <p className="panel__meta" style={{ padding: '1rem 0' }}>
            No open playbook items — add alerts in sample data or reset dismissed rows in browser storage.
          </p>
        )}

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--navy-600, #1e3a5f)' }}>
          <h3 className="panel__head" style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            Audit trail (this browser session + persisted)
          </h3>
          <ul className="fact-list" style={{ fontSize: '0.82rem' }}>
            {audit.slice(0, 25).map((e, i) => (
              <li key={`${e.t}-${i}`}>
                <span className="fact-list__k mono">{new Date(e.t).toLocaleString()}</span>
                <span className="fact-list__v" style={{ textAlign: 'left' }}>
                  <strong>{e.actor}</strong> · {e.verb}
                  {e.rowId ? ` · ${e.rowId}` : ''}
                  {e.note ? ` · ${e.note}` : ''}
                </span>
              </li>
            ))}
            {audit.length === 0 && <li className="panel__meta">No actions yet.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
