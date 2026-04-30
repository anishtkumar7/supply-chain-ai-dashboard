import { useEffect, useMemo, useState } from 'react';

function toMailto(to, cc, subject, body) {
  const params = new URLSearchParams();
  if (cc) params.set('cc', cc);
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${to}?${params.toString()}`;
}

export function EmailComposeModal({ open, onClose, recipientName, recipientEmail, subject, body }) {
  const [to, setTo] = useState(recipientEmail || '');
  const [cc, setCc] = useState('');
  const [draftSubject, setDraftSubject] = useState(subject || '');
  const [draftBody, setDraftBody] = useState(body || '');

  useEffect(() => {
    if (!open) return;
    setTo(recipientEmail || '');
    setCc('');
    setDraftSubject(subject || '');
    setDraftBody(body || '');
  }, [open, recipientEmail, subject, body]);

  const preview = useMemo(
    () =>
      [
        `To: ${to}`,
        cc ? `CC: ${cc}` : null,
        `Subject: ${draftSubject}`,
        '',
        draftBody,
      ]
        .filter(Boolean)
        .join('\n'),
    [to, cc, draftSubject, draftBody]
  );

  if (!open) return null;

  return (
    <div className="email-compose-backdrop" role="dialog" aria-modal="true" aria-label="Email compose">
      <div className="email-compose-modal">
        <div className="email-compose-head">
          <h3>Email Compose {recipientName ? `· ${recipientName}` : ''}</h3>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
        <label>To<input value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label>CC<input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Optional" /></label>
        <label>Subject<input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} /></label>
        <label>Body<textarea className="email-compose-body" rows={12} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} /></label>
        <div className="po-form-actions">
          <button type="button" className="btn btn--ghost" onClick={async () => navigator.clipboard.writeText(preview)}>Copy to Clipboard</button>
          <button
            type="button"
            className="btn btn--green"
            onClick={() => window.open(toMailto(to, cc, draftSubject, draftBody), '_blank')}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
