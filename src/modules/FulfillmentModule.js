import { useState, useCallback, useMemo } from 'react';
import { FulfillmentGlobe } from '../components/FulfillmentGlobe';
import { DelayDetailModal } from '../components/DelayDetailModal';
import { useDashboardData } from '../context/DashboardDataContext';
import { useExportRegistration } from '../context/ExportRegistrationContext';
import { fulfillmentShipmentRows } from '../utils/exportUtils';

function routePillClass(status) {
  if (status === 'on_time' || status === 'at_sea' || status === 'in_transit') return 'lane lane--on';
  if (status === 'delayed' || status === 'transshipment') return 'lane lane--late';
  return 'lane lane--stuck';
}

const CARRIER_CONTACTS = {
  Maersk: { email: 'ops@maersk.example.com', phone: '+1-312-555-2001' },
  'Hapag-Lloyd': { email: 'ops@hapaglloyd.example.com', phone: '+49-40-555-2002' },
  ONE: { email: 'ops@one.example.com', phone: '+81-3-555-2003' },
  MSC: { email: 'ops@msc.example.com', phone: '+41-22-555-2004' },
  'CMA CGM': { email: 'ops@cmacgm.example.com', phone: '+33-4-555-2005' },
  'J.B. Hunt': { email: 'ops@jbhunt.example.com', phone: '+1-479-555-2006' },
  'CN Rail': { email: 'ops@cnrail.example.com', phone: '+1-514-555-2007' },
};

export function FulfillmentModule({ onComposeEmail }) {
  const { shipmentData } = useDashboardData();
  const [focusShipmentId, setFocusShipmentId] = useState(null);
  const [delayModal, setDelayModal] = useState(null);
  const [phoneModal, setPhoneModal] = useState(null);
  const [contactShipmentId, setContactShipmentId] = useState(null);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('All');
  const [shipmentModeFilter, setShipmentModeFilter] = useState('All');

  const shipmentQ = shipmentSearch.trim().toLowerCase();
  const filteredShipments = useMemo(() => {
    return shipmentData.filter((s) => {
      if (shipmentStatusFilter !== 'All' && s.status !== shipmentStatusFilter) return false;
      if (shipmentModeFilter !== 'All' && s.mode !== shipmentModeFilter) return false;
      if (!shipmentQ) return true;
      const hay = `${s.id} ${s.sku} ${s.carrier}`.toLowerCase();
      return hay.includes(shipmentQ);
    });
  }, [shipmentData, shipmentModeFilter, shipmentQ, shipmentStatusFilter]);

  const shipmentExportFilterNote = useMemo(() => {
    const parts = [];
    if (shipmentSearch.trim()) parts.push(`search="${shipmentSearch.trim()}"`);
    if (shipmentStatusFilter !== 'All') parts.push(`status=${shipmentStatusFilter}`);
    if (shipmentModeFilter !== 'All') parts.push(`mode=${shipmentModeFilter}`);
    return parts.length ? parts.join('; ') : null;
  }, [shipmentSearch, shipmentStatusFilter, shipmentModeFilter]);

  const shipmentExportRows = useMemo(
    () => fulfillmentShipmentRows(filteredShipments),
    [filteredShipments]
  );

  useExportRegistration('fulfillment', () => ({
    rows: shipmentExportRows,
    filterNote: shipmentExportFilterNote,
  }));

  const clearShipmentFilters = () => {
    setShipmentSearch('');
    setShipmentStatusFilter('All');
    setShipmentModeFilter('All');
  };

  const clearFocus = useCallback(() => setFocusShipmentId(null), []);
  const onArcIssueClick = useCallback((payload) => setDelayModal(payload), []);

  return (
    <div className="module-grid module-grid--globe">
      <section className="panel panel--span3 globe-panel">
        <div className="panel__head">
          <h2>Active shipment routes</h2>
          <span className="panel__meta">
            Green on-time · yellow delayed · red stuck — click yellow/red arcs for why
          </span>
        </div>
        <div className="lane-legend" aria-hidden>
          <span className="lane lane--on">On time</span>
          <span className="lane lane--late">Delayed</span>
          <span className="lane lane--stuck">Stuck</span>
        </div>
        <p className="panel__lede">
          Click a row below to isolate a lane on the globe. × restores all animated routes.
        </p>
        <div className="globe-frame">
          {focusShipmentId && (
            <button
              type="button"
              className="globe-reset-x globe-reset-x--overlay"
              onClick={clearFocus}
              title="Show all routes"
              aria-label="Reset globe view"
            >
              ×
            </button>
          )}
          <FulfillmentGlobe
            shipments={shipmentData}
            focusShipmentId={focusShipmentId}
            onArcIssueClick={onArcIssueClick}
          />
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>In-transit detail</h2>
          <span className="panel__meta">{shipmentData.length} active shipments</span>
        </div>
        <div className="table-filters">
          <div className="table-filters__row">
            <input
              type="search"
              className="globe-search"
              placeholder="Search by shipment ID, SKU, or carrier…"
              value={shipmentSearch}
              onChange={(e) => setShipmentSearch(e.target.value)}
              autoComplete="off"
            />
            <select
              className="table-filters__select"
              value={shipmentStatusFilter}
              onChange={(e) => setShipmentStatusFilter(e.target.value)}
              aria-label="Filter by shipment status"
            >
              <option value="All">All</option>
              <option value="ON TIME">On Time</option>
              <option value="DELAYED">Delayed</option>
              <option value="STUCK">Stuck</option>
            </select>
            <select
              className="table-filters__select"
              value={shipmentModeFilter}
              onChange={(e) => setShipmentModeFilter(e.target.value)}
              aria-label="Filter by transport mode"
            >
              <option value="All">All</option>
              <option value="Ocean">Ocean</option>
              <option value="Truck">Truck</option>
              <option value="Rail">Rail</option>
              <option value="Air">Air</option>
            </select>
            <button type="button" className="btn btn--ghost" onClick={clearShipmentFilters}>
              Clear Filters
            </button>
          </div>
          <p className="table-filters__count">
            Showing {filteredShipments.length} of {shipmentData.length} results
          </p>
        </div>
        <div className="table-scroll">
          <table className="data-table data-table--click">
            <thead>
              <tr>
                <th>Shipment</th>
                <th>SKU</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Mode</th>
                <th>Carrier</th>
                <th className="num">ETA (d)</th>
                <th>Route</th>
                <th>Status</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s) => (
                <tr
                  key={s.id}
                  className={focusShipmentId === s.id ? 'data-table__row--active' : undefined}
                  onClick={() => setFocusShipmentId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFocusShipmentId(s.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td className="mono">{s.id}</td>
                  <td className="mono">{s.sku}</td>
                  <td>{s.origin}</td>
                  <td>{s.destination}</td>
                  <td>{s.mode}</td>
                  <td>{s.carrier}</td>
                  <td className="num">{s.etaDays}</td>
                  <td>
                    <span className={routePillClass(s.routeStatus.toLowerCase().replace(' ', '_'))}>
                      {s.status === 'ON TIME' ? 'On time' : s.status === 'DELAYED' ? 'Delayed' : 'Stuck'}
                    </span>
                  </td>
                  <td>
                    <span className="pill pill--route">{s.status}</span>
                  </td>
                  <td>
                    <div className="icon-action-row">
                      <button
                        type="button"
                        className="icon-btn"
                        title={`Show phone ${CARRIER_CONTACTS[s.carrier]?.phone || 'carrier ops'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhoneModal({
                            label: s.carrier,
                            phone: CARRIER_CONTACTS[s.carrier]?.phone || 'No phone listed',
                          });
                        }}
                        aria-label="Show carrier phone number"
                      >
                        📞
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Email carrier"
                        onClick={(e) => {
                          e.stopPropagation();
                          onComposeEmail({
                            recipientName: s.carrier,
                            recipientEmail: CARRIER_CONTACTS[s.carrier]?.email || `${s.carrier.toLowerCase().replace(/[^a-z0-9]+/g, '')}@carrier.example.com`,
                            subject: `Shipment ${s.id} Follow Up — ${s.carrier}`,
                            body: `Hello ${s.carrier} team,\n\nPlease provide a status update for shipment ${s.id} (${s.sku}) from ${s.origin} to ${s.destination}. Current dashboard status: ${s.status} / ${s.routeStatus}.\nPrimary phone contact: ${CARRIER_CONTACTS[s.carrier]?.phone || 'N/A'}.\n\nThank you,\nVectrum Logistics`,
                          });
                        }}
                        aria-label="Email carrier"
                      >
                        ✉️
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        title={CARRIER_CONTACTS[s.carrier]?.phone || 'No direct phone listed'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactShipmentId((id) => (id === s.id ? null : s.id));
                        }}
                      >
                        Contact Carrier
                      </button>
                    </div>
                    {contactShipmentId === s.id && (
                      <div className="contact-pop">
                        <div className="contact-pop__title">{s.carrier}</div>
                        <div className="contact-pop__meta">{CARRIER_CONTACTS[s.carrier]?.phone || 'No phone listed'}</div>
                        <div className="po-inline-actions">
                          <button
                            type="button"
                            className="btn btn--green"
                            onClick={(e) => {
                              e.stopPropagation();
                              onComposeEmail({
                                recipientName: s.carrier,
                                recipientEmail: CARRIER_CONTACTS[s.carrier]?.email || `${s.carrier.toLowerCase().replace(/[^a-z0-9]+/g, '')}@carrier.example.com`,
                                subject: `Shipment ${s.id} Follow Up — ${s.carrier}`,
                                body: `Hello ${s.carrier} team,\n\nPlease provide a status update for shipment ${s.id} (${s.sku}) from ${s.origin} to ${s.destination}. Current dashboard status: ${s.status} / ${s.routeStatus}.\nPrimary phone contact: ${CARRIER_CONTACTS[s.carrier]?.phone || 'N/A'}.\n\nThank you,\nVectrum Logistics`,
                              });
                            }}
                          >
                            Send Email
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhoneModal({
                                label: s.carrier,
                                phone: CARRIER_CONTACTS[s.carrier]?.phone || 'No phone listed',
                              });
                            }}
                          >
                            Phone Number
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={10} className="po-empty">No shipments match the current filters.</td>
                </tr>
              )}
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
