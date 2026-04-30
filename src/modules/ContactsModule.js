import { useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

function openTeams(handle) {
  window.open(`msteams://l/chat/0/0?users=${encodeURIComponent(handle)}`, '_blank');
}

function openSlack(handle) {
  window.open(`slack://user?team=vectrum&id=${encodeURIComponent(handle)}`, '_blank');
}

export function ContactsModule({ onComposeEmail }) {
  const { contactDirectory, supplierData } = useDashboardData();
  const [phoneModal, setPhoneModal] = useState(null);

  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Internal Team</h2>
          <span className="panel__meta">Procurement, planning, operations, management</span>
        </div>
        <div className="contacts-grid">
          {contactDirectory.map((c) => (
            <article key={c.email} className="contacts-card">
              <strong>{c.name}</strong>
              <div className="comms-meta">{c.role} · {c.department}</div>
              <div className="comms-meta">{c.email}</div>
              <div className="po-inline-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Email"
                  onClick={() => onComposeEmail({ recipientName: c.name, recipientEmail: c.email, subject: `Internal sync — ${c.department}`, body: `Hi ${c.name},\n\nCan we sync on current supply priorities?\n\nThanks.` })}
                >
                  ✉️
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => openTeams(c.teamsHandle)}>Teams</button>
                <button type="button" className="btn btn--ghost" onClick={() => openSlack(c.slackHandle)}>Slack</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Supplier Contacts</h2>
          <span className="panel__meta">Primary external supplier contacts</span>
        </div>
        <div className="contacts-grid">
          {supplierData.filter((s) => s.primaryContact).map((s) => (
            <article key={s.id} className="contacts-card">
              <strong>{s.primaryContact.name}</strong>
              <div className="comms-meta">{s.name}</div>
              <div className="comms-meta">{s.primaryContact.email}</div>
              <div className="comms-meta">{s.primaryContact.phone}</div>
              <div className="po-inline-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title={`Show phone ${s.primaryContact.phone}`}
                  aria-label="Show supplier phone"
                  onClick={() =>
                    setPhoneModal({
                      label: s.name,
                      phone: s.primaryContact.phone,
                    })
                  }
                >
                  📞
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Email"
                  onClick={() => onComposeEmail({ recipientName: s.primaryContact.name, recipientEmail: s.primaryContact.email, subject: `Vectrum Manufacturing — Supplier Follow Up — ${s.name}`, body: `Dear ${s.primaryContact.name},\n\nPlease share delivery schedule updates for current open orders with Vectrum Manufacturing.\n\nRegards,\nVectrum Supply Chain` })}
                >
                  ✉️
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {phoneModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Phone number">
          <div className="modal-card" style={{ maxWidth: 380 }}>
            <div className="modal-card__head">
              <h3>Phone Number</h3>
              <button type="button" className="modal-card__close" onClick={() => setPhoneModal(null)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="modal-card__sub">{phoneModal.label}</p>
            <p className="modal-card__body mono">{phoneModal.phone}</p>
          </div>
        </div>
      )}
    </div>
  );
}
