import { useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import { buildAttentionQueueRows } from '../utils/attentionQueue';
import { getSyncHealthReadout } from '../utils/syncHealth';

function pillClass(severity) {
  if (severity === 'CRITICAL') return 'pill pill--critical';
  if (severity === 'HIGH') return 'pill pill--critical';
  if (severity === 'MEDIUM') return 'pill pill--watch';
  return 'pill pill--healthy';
}

function compareRows(a, b, sortKey, dir) {
  const mul = dir === 'asc' ? 1 : -1;
  if (sortKey === 'severity') {
    const rank = (s) =>
      s === 'CRITICAL' ? 4 : s === 'HIGH' ? 3 : s === 'MEDIUM' ? 2 : s === 'LOW' ? 1 : 0;
    return (rank(a.severity) - rank(b.severity)) * mul;
  }
  if (sortKey === 'title') {
    return String(a.title).localeCompare(String(b.title)) * mul;
  }
  if (sortKey === 'source') {
    return String(a.source).localeCompare(String(b.source)) * mul;
  }
  if (sortKey === 'time') {
    return String(a.timeLabel).localeCompare(String(b.timeLabel)) * mul;
  }
  return 0;
}

export function AttentionQueueModule({ onNavigate }) {
  const { agentAlerts, shipmentData, supplierData, syncLog, lastManualUpload } = useDashboardData();
  const syncHealth = useMemo(
    () => getSyncHealthReadout({ syncLog, lastManualUpload }),
    [syncLog, lastManualUpload]
  );
  const baseRows = useMemo(
    () => buildAttentionQueueRows({ agentAlerts, shipmentData, supplierData }),
    [agentAlerts, shipmentData, supplierData]
  );

  const [sortKey, setSortKey] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const copy = [...baseRows];
    copy.sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return copy;
  }, [baseRows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'severity' ? 'desc' : 'asc');
    }
  };

  const sortIndicator = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Attention queue</h2>
          <span className="panel__meta">
            Agent alerts, delayed/stuck shipments, and elevated supplier risk — same signals as Executive / Agents modules
          </span>
        </div>
        <p className="panel__lede">
          Click a row to open the linked module. Sort columns via headers.
        </p>
        {syncHealth.isStale && (
          <div className="sync-stale-banner" role="status">
            Last successful integration sync was over 24 hours ago
            {syncHealth.lastSuccessLabel ? ` (${syncHealth.lastSuccessLabel})` : ''}. Verify data freshness before acting.
          </div>
        )}
        <div className="table-scroll">
          <table className="data-table data-table--click">
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('severity')}
                >
                  Severity{sortIndicator('severity')}
                </th>
                <th
                  scope="col"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('title')}
                >
                  Title{sortIndicator('title')}
                </th>
                <th
                  scope="col"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('source')}
                >
                  Source{sortIndicator('source')}
                </th>
                <th scope="col">Detail</th>
                <th
                  scope="col"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('time')}
                >
                  Time{sortIndicator('time')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate?.(r.navId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate?.(r.navId);
                    }
                  }}
                >
                  <td>
                    <span className={pillClass(r.severity)}>{r.severity}</span>
                  </td>
                  <td className="mono">{r.title}</td>
                  <td>{r.source}</td>
                  <td style={{ maxWidth: '28rem' }}>{r.detail}</td>
                  <td className="mono">{r.timeLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
