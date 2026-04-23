import { useMemo, useState, useCallback } from 'react';
import { SupplierGlobe } from '../components/SupplierGlobe';
import { DelayDetailModal } from '../components/DelayDetailModal';
import { headquarters, suppliers } from '../data/sampleData';

function lanePillClass(status) {
  if (status === 'on_time') return 'lane lane--on';
  if (status === 'delayed') return 'lane lane--late';
  return 'lane lane--stuck';
}

export function SupplierModule() {
  const [focusSupplierId, setFocusSupplierId] = useState(null);
  const [search, setSearch] = useState('');
  const [delayModal, setDelayModal] = useState(null);

  const searchTrim = search.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!searchTrim) return [];
    return suppliers.filter(
      (s) =>
        s.id.toLowerCase().includes(searchTrim) ||
        s.name.toLowerCase().includes(searchTrim) ||
        s.country.toLowerCase().includes(searchTrim) ||
        s.category.toLowerCase().includes(searchTrim)
    );
  }, [searchTrim]);

  const clearFocus = useCallback(() => setFocusSupplierId(null), []);

  const onArcIssueClick = useCallback((payload) => {
    setDelayModal(payload);
  }, []);

  return (
    <div className="module-grid module-grid--globe">
      <section className="panel panel--span3 globe-panel">
        <div className="globe-toolbar">
          <div className="globe-toolbar__search">
            <label htmlFor="supplier-search" className="sr-only">
              Search suppliers
            </label>
            <input
              id="supplier-search"
              type="search"
              className="globe-search"
              placeholder="Search by supplier name, ID, country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {searchTrim && searchMatches.length > 0 && (
              <ul className="globe-typeahead" role="listbox">
                {searchMatches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="globe-typeahead__btn"
                      onClick={() => {
                        setFocusSupplierId(s.id);
                        setSearch('');
                      }}
                    >
                      <span className="mono">{s.id}</span>
                      <span>{s.name}</span>
                      <span className="globe-typeahead__meta">{s.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchTrim && searchMatches.length === 0 && (
              <p className="globe-typeahead globe-typeahead--empty">No matches</p>
            )}
          </div>
        </div>

        <div className="panel__head">
          <h2>Global supplier network</h2>
          <span className="panel__meta">
            Lines converge on {headquarters.city} · green on-time · yellow delayed · red stuck — click yellow/red arcs for detail
          </span>
        </div>
        <div className="lane-legend" aria-hidden>
          <span className="lane lane--on">On time</span>
          <span className="lane lane--late">Delayed</span>
          <span className="lane lane--stuck">Stuck</span>
        </div>
        <p className="panel__lede">
          Click a scorecard row or pick a supplier from search to focus the globe on that lane. Use × to restore the full
          network.
        </p>
        <div className="globe-frame">
          {focusSupplierId && (
            <button
              type="button"
              className="globe-reset-x globe-reset-x--overlay"
              onClick={clearFocus}
              title="Show all suppliers"
              aria-label="Reset globe view"
            >
              ×
            </button>
          )}
          <SupplierGlobe suppliers={suppliers} focusSupplierId={focusSupplierId} onArcIssueClick={onArcIssueClick} />
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Supplier scorecard</h2>
          <span className="panel__meta">YTD spend & inbound lane health</span>
        </div>
        <div className="table-scroll">
          <table className="data-table data-table--click">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Country</th>
                <th>Category</th>
                <th className="num">Lead (d)</th>
                <th className="num">OTIF %</th>
                <th className="num">Spend USD</th>
                <th>Inbound</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className={focusSupplierId === s.id ? 'data-table__row--active' : undefined}
                  onClick={() => setFocusSupplierId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFocusSupplierId(s.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td className="mono">{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.country}</td>
                  <td>{s.category}</td>
                  <td className="num">{s.leadTimeDays}</td>
                  <td className="num">{s.onTimePct.toFixed(1)}</td>
                  <td className="num">${(s.spendYtdUsd / 1000).toFixed(0)}k</td>
                  <td>
                    <span className={lanePillClass(s.inboundLaneStatus)}>
                      {s.inboundLaneStatus === 'on_time' ? 'On time' : s.inboundLaneStatus === 'delayed' ? 'Delayed' : 'Stuck'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill pill--${s.riskScore === 'Low' ? 'healthy' : s.riskScore === 'Medium' ? 'watch' : 'critical'}`}>
                      {s.riskScore}
                    </span>
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
