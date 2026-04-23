export function DelayDetailModal({ open, onClose, title, status, reason }) {
  if (!open) return null;
  const label = status === 'stuck' ? 'Stuck / blocked' : 'Delayed';
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delay-modal-title">
      <div className="modal-card">
        <div className="modal-card__head">
          <h3 id="delay-modal-title">{label}</h3>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="modal-card__sub mono">{title}</p>
        <p className="modal-card__body">{reason}</p>
        <button type="button" className="modal-card__action" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
