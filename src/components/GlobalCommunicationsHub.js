import { useMemo, useState } from 'react';

function openTeams(contact) {
  const url = `msteams://l/chat/0/0?users=${encodeURIComponent(contact.teamsHandle || contact.email)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openSlack(contact) {
  const url = `slack://user?team=vectrum&id=${encodeURIComponent(contact.slackHandle)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function GlobalCommunicationsHub({ open, onClose, contactDirectory, supplierData, onComposeEmail }) {
  const [tab, setTab] = useState('internal');
  const [query, setQuery] = useState('');
  const [supplierMessage, setSupplierMessage] = useState('Hello, following up on current POs and delivery milestones for this cycle.');

  const normalized = query.trim().toLowerCase();

  const internalContacts = useMemo(
    () =>
      contactDirectory.filter((c) => {
        if (!normalized) return true;
        return (
          c.name.toLowerCase().includes(normalized) ||
          c.role.toLowerCase().includes(normalized) ||
          c.department.toLowerCase().includes(normalized) ||
          c.email.toLowerCase().includes(normalized)
        );
      }),
    [contactDirectory, normalized]
  );

  const supplierContacts = useMemo(
    () =>
      supplierData.filter((s) => {
        if (!s.primaryContact) return false;
        if (!normalized) return true;
        return (
          s.name.toLowerCase().includes(normalized) ||
          s.primaryContact.name.toLowerCase().includes(normalized) ||
          s.primaryContact.email.toLowerCase().includes(normalized)
        );
      }),
    [supplierData, normalized]
  );

  if (!open) return null;

  return (
    <div className="comms-backdrop" role="dialog" aria-modal="true" aria-label="Global communications hub">
      <div className="comms-modal">
        <div className="comms-head">
          <div>
            <h2>Global Communications</h2>
            <p>Contact internal teams on Microsoft Teams/Slack and suppliers via email without leaving the dashboard.</p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>

        <div className="comms-controls">
          <div className="comms-tabs">
            <button type="button" className={`btn ${tab === 'internal' ? 'btn--green' : 'btn--ghost'}`} onClick={() => setTab('internal')}>Internal Teams</button>
            <button type="button" className={`btn ${tab === 'external' ? 'btn--green' : 'btn--ghost'}`} onClick={() => setTab('external')}>External Suppliers</button>
          </div>
          <input
            className="comms-search"
            placeholder="Search contact, role, supplier..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {tab === 'internal' ? (
          <div className="comms-list">
            {internalContacts.map((c) => (
              <div key={c.email} className="comms-card">
                <div>
                  <strong>{c.name}</strong>
                  <div className="comms-meta">{c.role} · {c.department}</div>
                  <div className="comms-meta">{c.email} · {c.phone}</div>
                </div>
                <div className="po-inline-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => openTeams(c)}>Microsoft Teams</button>
                  <button type="button" className="btn btn--ghost" onClick={() => openSlack(c)}>Slack</button>
                  <button
                    type="button"
                    className="btn btn--green"
                    onClick={() => onComposeEmail({
                      recipientName: c.name,
                      recipientEmail: c.email,
                      subject: `Internal sync — ${c.department}`,
                      body: `Hi ${c.name},\n\nCan we sync on supply chain priorities today?\n\nThanks.`,
                    })}
                  >
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="comms-list">
            <label className="comms-message">
              Supplier Email Message Template
              <textarea rows={3} value={supplierMessage} onChange={(e) => setSupplierMessage(e.target.value)} />
            </label>
            {supplierContacts.map((s) => (
              <div key={s.id} className="comms-card">
                <div>
                  <strong>{s.name}</strong>
                  <div className="comms-meta">{s.primaryContact?.name} · {s.primaryContact?.phone}</div>
                  <div className="comms-meta">{s.primaryContact?.email}</div>
                </div>
                <div className="po-inline-actions">
                  <button
                    type="button"
                    className="btn btn--green"
                    onClick={() => onComposeEmail({
                      recipientName: s.primaryContact.name,
                      recipientEmail: s.primaryContact.email,
                      subject: `Vectrum supplier follow-up — ${s.name}`,
                      body: `Hello ${s.primaryContact.name},\n\n${supplierMessage}\n\nRegards,\nVectrum Supply Chain`,
                    })}
                  >
                    Email Supplier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
