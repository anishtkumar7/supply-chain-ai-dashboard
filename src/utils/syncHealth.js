const MS_24H = 24 * 60 * 60 * 1000;

function newestSuccessRow(syncLog) {
  const rows = syncLog || [];
  let best = null;
  for (const r of rows) {
    if (r.status !== 'SUCCESS' || typeof r.atMs !== 'number') continue;
    if (!best || r.atMs > best.atMs) best = r;
  }
  return best;
}

export function getLastFailureSummary(syncLog) {
  const fail = (syncLog || []).find((r) => r.status === 'FAILED');
  if (!fail) return null;
  const msg =
    [fail.details, fail.type].filter(Boolean).join(' — ') ||
    fail.type ||
    'Sync failed';
  return { message: msg, time: fail.time };
}

/**
 * Trust-layer readout from syncLog + lastManualUpload (isSample, message).
 */
export function getSyncHealthReadout({ syncLog, lastManualUpload }) {
  const newestOk = newestSuccessRow(syncLog);
  const lastFail = getLastFailureSummary(syncLog);
  const isSample = !!lastManualUpload?.isSample;

  const lastSuccessAtMs = newestOk?.atMs ?? null;
  const lastSuccessLabel = newestOk?.time ?? null;

  const isStale =
    lastSuccessAtMs != null && Date.now() - lastSuccessAtMs > MS_24H;

  return {
    lastSuccessAtMs,
    lastSuccessLabel,
    lastFailure: lastFail,
    isSample,
    manualMessage: lastManualUpload?.message ?? '',
    isStale,
    hasSuccessfulSync: lastSuccessAtMs != null,
  };
}
