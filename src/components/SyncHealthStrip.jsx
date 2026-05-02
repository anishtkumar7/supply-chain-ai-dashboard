import { useMemo } from 'react';
import { getSyncHealthReadout } from '../utils/syncHealth';

function truncate(s, max = 52) {
  if (!s || s.length <= max) return s || '';
  return `${s.slice(0, max - 1)}…`;
}

export function SyncHealthStrip({ syncLog, lastManualUpload }) {
  const r = useMemo(
    () => getSyncHealthReadout({ syncLog, lastManualUpload }),
    [syncLog, lastManualUpload]
  );

  return (
    <div className="sync-health-strip" aria-label="Integration sync health">
      <span className="sync-health-strip__label">Sync</span>
      {r.hasSuccessfulSync ? (
        <span className="sync-health-strip__item" title="Most recent successful sync in log">
          Last OK: <strong>{r.lastSuccessLabel}</strong>
        </span>
      ) : (
        <span className="sync-health-strip__item sync-health-strip__item--muted">No successful sync in log</span>
      )}
      {r.lastFailure ? (
        <span
          className="sync-health-strip__item sync-health-strip__item--fail"
          title={r.lastFailure.message}
        >
          Last fail: {truncate(r.lastFailure.message)}
        </span>
      ) : (
        <span className="sync-health-strip__item sync-health-strip__item--muted">No failures logged</span>
      )}
      {r.isSample && (
        <span className="sync-health-strip__badge" title={r.manualMessage || 'Using bundled sample dataset'}>
          Sample data
        </span>
      )}
    </div>
  );
}
