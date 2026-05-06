import { useMemo, useState } from 'react';
import {
  RIVIT_MC_REPLENISHMENT_QUEUE_KEY,
  RIVIT_MY_WORK_STATION_STATE_KEY,
} from '../constants/demoStorageKeys';
import { MY_WORKSTATION_PARTS_CLEAN, MY_WORKSTATION_REQUESTS_CLEAN } from '../data/demoCleanSample';
import { useDashboardData } from '../context/DashboardDataContext';

const STATION_ID = 'Line 1 — Station 4';

const SHIFT_KPIS = [
  { label: 'Current Work Order', value: 'WO-4421' },
  { label: 'Building', value: 'Class 8 Highway Tractor FG-T800-CL' },
  { label: 'Line', value: 'Line 1 — Assembly' },
  { label: 'Shift', value: 'Day Shift — ends 3:00 PM' },
];

const INITIAL_PARTS = [
  { sku: 'CMP-M8-HXB', description: 'M8 x 25mm Hex Bolt', inventoryClass: 'C', qtyAtStation: 145, minQty: 50, status: 'HEALTHY' },
  { sku: 'CMP-M10-FLN', description: 'M10 Flange Nut', inventoryClass: 'C', qtyAtStation: 38, minQty: 50, status: 'LOW' },
  { sku: 'CMP-RBR-GRM-12', description: 'Rubber Grommet 1/2 inch', inventoryClass: 'C', qtyAtStation: 12, minQty: 30, status: 'CRITICAL' },
  { sku: 'CMP-WHL-DRV', description: 'Drive Axle Wheel and Tire Assembly 11R22.5', inventoryClass: 'A', qtyAtStation: 2, minQty: 4, status: 'CRITICAL' },
  { sku: 'CMP-WRH-004', description: 'Wiring Harness Complete', inventoryClass: 'A', qtyAtStation: 3, minQty: 3, status: 'WATCH' },
  { sku: 'CMP-ENG-001', description: 'Diesel Engine Assembly', inventoryClass: 'A', qtyAtStation: 1, minQty: 2, status: 'CRITICAL' },
  { sku: 'CMP-SHC-M8', description: 'Socket Head Cap Screw M8', inventoryClass: 'C', qtyAtStation: 89, minQty: 40, status: 'HEALTHY' },
  { sku: 'CMP-THR-LCK-M', description: 'Threadlocker Medium Strength', inventoryClass: 'C', qtyAtStation: 6, minQty: 10, status: 'LOW' },
];

const INITIAL_REQUESTS = [
  {
    id: 'REQ-WHLDRV-1',
    sku: 'CMP-WHL-DRV',
    description: 'Drive Axle Wheel Assembly',
    requestedQty: 8,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    stationId: STATION_ID,
    estDelivery: 'Pending MC acknowledgment',
    urgency: 'URGENT',
    notes: 'Only 2 remaining at station, need 4 minimum for next 2 work orders',
  },
  {
    id: 'REQ-CBL-1',
    sku: 'CMP-CBL-TIE',
    description: 'Cable Tie 200mm',
    requestedQty: 200,
    status: 'DISPATCHED',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    stationId: STATION_ID,
    estDelivery: '10 min',
    urgency: 'URGENT',
  },
  {
    id: 'REQ-WSH-1',
    sku: 'CMP-WSH-M8',
    description: 'M8 Flat Washer',
    requestedQty: 500,
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stationId: STATION_ID,
    estDelivery: 'Completed',
    urgency: 'NORMAL',
  },
];

function readState() {
  try {
    const raw = window.localStorage.getItem(RIVIT_MY_WORK_STATION_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function statusClass(status) {
  if (status === 'HEALTHY') return 'pill pill--healthy';
  if (status === 'LOW' || status === 'WATCH') return 'pill pill--watch';
  if (status === 'CRITICAL') return 'pill pill--critical';
  if (status === 'REQUESTED') return 'pill pill--requested';
  return 'pill pill--route';
}

function ageLabel(iso) {
  const d = new Date(iso);
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
}

export function MyWorkStationModule() {
  const { demoScenario } = useDashboardData();
  const seed = readState();
  const [parts, setParts] = useState(() => seed?.parts || (demoScenario === 'clean' ? MY_WORKSTATION_PARTS_CLEAN : INITIAL_PARTS));
  const [requests, setRequests] = useState(() => seed?.requests || (demoScenario === 'clean' ? MY_WORKSTATION_REQUESTS_CLEAN : INITIAL_REQUESTS));
  const [requestModal, setRequestModal] = useState(null);
  const [issueModal, setIssueModal] = useState(null);
  const [toast, setToast] = useState('');

  const [reqQty, setReqQty] = useState('');
  const [reqUrgency, setReqUrgency] = useState('NORMAL');
  const [reqNotes, setReqNotes] = useState('');

  const [issueSku, setIssueSku] = useState(
    () => (demoScenario === 'clean' ? MY_WORKSTATION_PARTS_CLEAN : INITIAL_PARTS)[0].sku
  );
  const [issueDesc, setIssueDesc] = useState('');
  const [issueQty, setIssueQty] = useState('');
  const [issueLoc, setIssueLoc] = useState(STATION_ID);
  const [issueUrgency, setIssueUrgency] = useState('HIGH');
  const [issueNotes, setIssueNotes] = useState('');

  const persist = (nextParts, nextRequests) => {
    try {
      window.localStorage.setItem(
        RIVIT_MY_WORK_STATION_STATE_KEY,
        JSON.stringify({ parts: nextParts, requests: nextRequests })
      );
    } catch {
      /* ignore */
    }
  };

  const openRequestModal = (part) => {
    const urgency = part.status === 'CRITICAL' ? 'URGENT' : 'NORMAL';
    setRequestModal(part);
    setReqQty('');
    setReqUrgency(urgency);
    setReqNotes('');
  };

  const submitRequest = () => {
    if (!requestModal) return;
    const q = Math.max(0, Math.floor(Number(reqQty) || 0));
    if (!q) return;

    const nextParts = parts.map((p) =>
      p.sku === requestModal.sku ? { ...p, status: 'REQUESTED' } : p
    );
    const nextReq = {
      id: `REQ-${Date.now()}`,
      sku: requestModal.sku,
      description: requestModal.description,
      requestedQty: q,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      stationId: STATION_ID,
      estDelivery: '15-30 min',
      urgency: reqUrgency,
      notes: reqNotes.trim() || null,
    };
    const nextRequests = [nextReq, ...requests];
    setParts(nextParts);
    setRequests(nextRequests);
    persist(nextParts, nextRequests);

    try {
      const raw = window.localStorage.getItem(RIVIT_MC_REPLENISHMENT_QUEUE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const queue = Array.isArray(existing) ? existing : [];
      window.localStorage.setItem(
        RIVIT_MC_REPLENISHMENT_QUEUE_KEY,
        JSON.stringify([{ ...nextReq, queueStatus: 'SUBMITTED' }, ...queue])
      );
    } catch {
      /* ignore */
    }

    setRequestModal(null);
    setToast('Replenishment request submitted — Material Coordinator notified');
    window.setTimeout(() => setToast(''), 3500);
  };

  const activeRequests = useMemo(
    () =>
      [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [requests]
  );

  const submitIssue = () => {
    if (!issueModal) return;
    setIssueModal(null);
    setIssueDesc('');
    setIssueQty('');
    setIssueLoc(STATION_ID);
    setIssueUrgency('HIGH');
    setIssueNotes('');
    setToast(
      issueModal === 'quality'
        ? 'Quality issue submitted — Material Coordinator and Line Supervisor notified'
        : issueModal === 'safety'
          ? 'Safety issue submitted — Line Supervisor notified immediately'
          : 'Part not found submitted — Material Coordinator notified and investigation alert created'
    );
    window.setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="my-workstation__kpis">
          {SHIFT_KPIS.map((k) => (
            <div key={k.label} className="my-workstation__kpi-card">
              <span className="panel__meta">{k.label}</span>
              <strong>{k.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Parts At My Station</h2>
          <span className="panel__meta">Current inventory at your workstation — request replenishment when quantity is low</span>
        </div>
        <div className="table-scroll" style={{ maxHeight: 360 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Part SKU</th>
                <th>Description</th>
                <th>Class</th>
                <th className="num">Quantity At Station</th>
                <th className="num">Min Quantity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.sku}>
                  <td className="mono">{p.sku}</td>
                  <td>{p.description}</td>
                  <td><span className={`parts-inv__abc parts-inv__abc--${p.inventoryClass.toLowerCase()}`}>Class {p.inventoryClass}</span></td>
                  <td className="num">{p.qtyAtStation}</td>
                  <td className="num">{p.minQty}</td>
                  <td><span className={statusClass(p.status)}>{p.status}</span></td>
                  <td>
                    {p.status === 'HEALTHY' && (
                      <button type="button" className="btn my-workstation__btn-disabled" disabled>
                        Request
                      </button>
                    )}
                    {(p.status === 'LOW' || p.status === 'WATCH') && (
                      <button type="button" className="btn my-workstation__btn-low" onClick={() => openRequestModal(p)}>
                        Request Replenishment
                      </button>
                    )}
                    {p.status === 'CRITICAL' && (
                      <button type="button" className="btn my-workstation__btn-critical" onClick={() => openRequestModal(p)}>
                        Request URGENT
                      </button>
                    )}
                    {p.status === 'REQUESTED' && (
                      <button type="button" className="btn my-workstation__btn-disabled" disabled>
                        Request Pending
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Active Requests</h2>
        </div>
        <div className="table-scroll" style={{ maxHeight: 280 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Est Delivery</th>
              </tr>
            </thead>
            <tbody>
              {activeRequests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="mono">{r.sku}</span> {r.description}
                    {r.notes ? <div className="panel__meta">{r.notes}</div> : null}
                  </td>
                  <td>{ageLabel(r.createdAt)}</td>
                  <td><span className={statusClass(r.status === 'DELIVERED' ? 'HEALTHY' : 'REQUESTED')}>{r.status}</span></td>
                  <td>{r.estDelivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Flag An Issue</h2>
        </div>
        <div className="my-workstation__issue-row">
          <button type="button" className="btn my-workstation__issue-btn my-workstation__issue-btn--red" onClick={() => setIssueModal('quality')}>
            Flag Quality Issue
          </button>
          <button type="button" className="btn my-workstation__issue-btn my-workstation__issue-btn--orange" onClick={() => setIssueModal('safety')}>
            Flag Safety Issue
          </button>
          <button type="button" className="btn my-workstation__issue-btn my-workstation__issue-btn--yellow" onClick={() => setIssueModal('not-found')}>
            Flag Part Not Found
          </button>
        </div>
      </section>

      {requestModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setRequestModal(null)}>
          <div className="modal-card" style={{ maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Replenishment Request</h3>
            <p className="panel__meta"><span className="mono">{requestModal.sku}</span> — {requestModal.description}</p>
            <p className="panel__meta">Current quantity at station: <strong>{requestModal.qtyAtStation}</strong></p>
            <label className="panel__meta" style={{ display: 'block' }}>Quantity to request
              <input className="globe-search" type="number" min="1" value={reqQty} onChange={(e) => setReqQty(e.target.value)} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>Urgency
              <select value={reqUrgency} onChange={(e) => setReqUrgency(e.target.value)} className="globe-search">
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
              </select>
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>Notes
              <input className="globe-search" value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} />
            </label>
            <p className="panel__meta" style={{ marginTop: 10 }}>Station ID: <strong>{STATION_ID}</strong></p>
            <p className="panel__meta">Typical fulfillment: 15-30 minutes</p>
            <button type="button" className="modal-card__action" onClick={submitRequest}>Submit Request</button>
            <button type="button" className="modal-card__action" style={{ marginTop: 8 }} onClick={() => setRequestModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {issueModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIssueModal(null)}>
          <div className="modal-card" style={{ maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3>
              {issueModal === 'quality'
                ? 'Flag Quality Issue'
                : issueModal === 'safety'
                  ? 'Flag Safety Issue'
                  : 'Flag Part Not Found'}
            </h3>
            {(issueModal === 'quality' || issueModal === 'not-found') && (
              <label className="panel__meta" style={{ display: 'block' }}>Part SKU
                <select className="globe-search" value={issueSku} onChange={(e) => setIssueSku(e.target.value)}>
                  {parts.map((p) => <option key={p.sku} value={p.sku}>{p.sku}</option>)}
                </select>
              </label>
            )}
            <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>
              {issueModal === 'safety' ? 'Description' : 'Description of issue'}
              <input className="globe-search" value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} />
            </label>
            {(issueModal === 'quality' || issueModal === 'not-found') && (
              <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>
                {issueModal === 'quality' ? 'Quantity affected' : 'Expected location'}
                <input className="globe-search" value={issueModal === 'quality' ? issueQty : issueLoc} onChange={(e) => (issueModal === 'quality' ? setIssueQty(e.target.value) : setIssueLoc(e.target.value))} />
              </label>
            )}
            {issueModal === 'safety' && (
              <>
                <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>Location
                  <input className="globe-search" value={issueLoc} onChange={(e) => setIssueLoc(e.target.value)} />
                </label>
                <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>Urgency
                  <select className="globe-search" value={issueUrgency} onChange={(e) => setIssueUrgency(e.target.value)}>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </label>
              </>
            )}
            {issueModal === 'not-found' && (
              <label className="panel__meta" style={{ display: 'block', marginTop: 8 }}>Notes
                <input className="globe-search" value={issueNotes} onChange={(e) => setIssueNotes(e.target.value)} />
              </label>
            )}
            <button type="button" className="modal-card__action" onClick={submitIssue}>Submit</button>
            <button type="button" className="modal-card__action" style={{ marginTop: 8 }} onClick={() => setIssueModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="parts-toast pill pill--healthy" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, padding: '0.5rem 0.85rem' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
