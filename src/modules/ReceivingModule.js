import { useMemo, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const INBOUND_QUEUE = [
  { shipmentId: 'SHP-30481', poNumber: 'PO-2026-0040', sku: 'CMP-ENG-001', supplier: 'Detroit Power Systems', origin: 'Port of Shanghai', carrier: 'Maersk', etaDays: 9, status: 'AT SEA', expectedQty: 200 },
  { shipmentId: 'SHP-30503', poNumber: 'PO-2026-0038', sku: 'CMP-AXL-002', supplier: 'Stuttgart Drive Systems', origin: 'Busan', carrier: 'ONE', etaDays: 14, status: 'AT SEA', expectedQty: 2400 },
  { shipmentId: 'SHP-30524', poNumber: 'PO-2026-0041', sku: 'CMP-STL-005', supplier: 'Monterrey Metal Forming', origin: 'Guadalajara', carrier: 'J.B. Hunt', etaDays: 2, status: 'IN TRANSIT', expectedQty: 45000 },
  { shipmentId: 'SHP-30531', poNumber: 'PO-2026-0036', sku: 'CMP-WRH-004', supplier: 'Chennai Cable & Harness', origin: 'Toronto', carrier: 'CN Rail', etaDays: 1, status: 'IN YARD — STUCK', expectedQty: 8000, stuck: true },
];

const INITIAL_HISTORY = [
  { date: 'Apr 25', shipmentId: 'SHP-30470', poNumber: 'PO-2026-0033', sku: 'CMP-HYD-008', supplier: 'Rotterdam Industrial', expectedQty: 4000, receivedQty: 4000, variance: 0, condition: 'Good', receivedBy: 'J. Martinez', status: 'COMPLETE' },
  { date: 'Apr 22', shipmentId: 'SHP-30465', poNumber: 'PO-2026-0031', sku: 'CMP-ECU-007', supplier: 'Penang PCB', expectedQty: 16000, receivedQty: 15840, variance: -160, condition: 'Good — short ship', receivedBy: 'J. Martinez', status: 'DISCREPANCY' },
  { date: 'Apr 18', shipmentId: 'SHP-30458', poNumber: 'PO-2026-0029', sku: 'CMP-STL-005', supplier: 'Monterrey Metal', expectedQty: 45000, receivedQty: 45000, variance: 0, condition: 'Good', receivedBy: 'P. Patel', status: 'COMPLETE' },
  { date: 'Apr 15', shipmentId: 'SHP-30451', poNumber: 'PO-2026-0027', sku: 'CMP-CAB-010', supplier: 'Ho Chi Minh Plastics', expectedQty: 8000, receivedQty: 7200, variance: -800, condition: 'Damaged partial accept', receivedBy: 'J. Martinez', status: 'DISCREPANCY' },
  { date: 'Apr 10', shipmentId: 'SHP-30444', poNumber: 'PO-2026-0025', sku: 'CMP-TCM-003', supplier: 'Penang PCB', expectedQty: 12000, receivedQty: 12000, variance: 0, condition: 'Good', receivedBy: 'S. Patel', status: 'COMPLETE' },
];

const CONDITIONS = ['Good', 'Damaged', 'Short Ship'];
const RESOLUTIONS = ['Supplier Credit Requested', 'Return to Supplier', 'Write Off', 'Under Investigation'];

function fmtDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function ReceivingModule({ loggedInName, onComposeEmail }) {
  const { shipmentData, setShipmentData, componentData, setComponentData, supplierData } = useDashboardData();
  const [queue, setQueue] = useState(INBOUND_QUEUE);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [receiptModal, setReceiptModal] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [toast, setToast] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAction, setResolveAction] = useState(RESOLUTIONS[0]);

  const expectedToday = shipmentData.filter((s) => s.etaDays <= 1).length;
  const pendingReceiving = queue.filter((q) => q.status !== 'RECEIVED').length;
  const discrepanciesThisWeek = history.filter((h) => h.status === 'DISCREPANCY').length;
  const onTimeRate = '94.2%';

  const openDiscrepancies = useMemo(
    () => history.filter((h) => h.variance !== 0 && h.status === 'DISCREPANCY'),
    [history]
  );

  const submitReceipt = () => {
    if (!receiptModal) return;
    const variance = Number(receiptModal.receivedQty) - Number(receiptModal.expectedQty);
    const isDiscrepancy = variance !== 0;

    setQueue((rows) => rows.map((r) => (r.shipmentId === receiptModal.shipmentId ? { ...r, status: 'RECEIVED' } : r)));
    setShipmentData((rows) => rows.map((s) => (s.id === receiptModal.shipmentId ? { ...s, status: 'RECEIVED', routeStatus: 'RECEIVED' } : s)));
    setComponentData((rows) =>
      rows.map((c) =>
        c.sku === receiptModal.sku
          ? { ...c, onHand: c.onHand + Number(receiptModal.receivedQty), extended: (c.onHand + Number(receiptModal.receivedQty)) * c.unitCost }
          : c
      )
    );
    setHistory((rows) => [
      {
        date: fmtDate(receiptModal.dateReceived),
        shipmentId: receiptModal.shipmentId,
        poNumber: receiptModal.poNumber,
        sku: receiptModal.sku,
        supplier: receiptModal.supplier,
        expectedQty: Number(receiptModal.expectedQty),
        receivedQty: Number(receiptModal.receivedQty),
        variance,
        condition: receiptModal.condition,
        receivedBy: receiptModal.receivedBy,
        status: isDiscrepancy ? 'DISCREPANCY' : 'COMPLETE',
      },
      ...rows,
    ]);
    setToast(
      isDiscrepancy
        ? 'Receipt confirmed with discrepancy — Buyer has been notified. Adjustment logged.'
        : `Receipt confirmed — ${receiptModal.receivedQty} units of ${receiptModal.sku} received. Inventory updated.`
    );
    setReceiptModal(null);
  };

  return (
    <div className="module-grid">
      {toast && <div className="po-toast">{toast}</div>}
      <section className="panel panel--span3">
        <div className="po-kpi-grid">
          <article className="po-kpi"><span>Expected Today</span><strong>{expectedToday}</strong></article>
          <article className="po-kpi"><span>Pending Receiving</span><strong>{pendingReceiving}</strong></article>
          <article className="po-kpi"><span>Discrepancies This Week</span><strong>{discrepanciesThisWeek}</strong></article>
          <article className="po-kpi"><span>On Time Receipt Rate</span><strong>{onTimeRate}</strong></article>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Inbound Shipments — Pending Receipt Confirmation</h2>
          <span className="panel__meta">Shipments arrived or arriving within 48 hours requiring receiving confirmation</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Shipment ID</th><th>PO Number</th><th>Component/SKU</th><th>Supplier</th><th>Origin</th><th>Carrier</th><th>ETA</th><th>Status</th><th>Expected Qty</th><th>Action</th></tr>
            </thead>
            <tbody>
              {queue.map((r) => (
                <tr key={r.shipmentId} className={r.stuck ? 'data-table__row--shortage' : undefined}>
                  <td>{r.stuck ? '⚠ ' : ''}{r.shipmentId}</td>
                  <td>{r.poNumber}</td>
                  <td>{r.sku}</td>
                  <td>{r.supplier}</td>
                  <td>{r.origin}</td>
                  <td>{r.carrier}</td>
                  <td>Today +{r.etaDays} days</td>
                  <td>{r.status}</td>
                  <td>{r.expectedQty.toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--green"
                      onClick={() =>
                        setReceiptModal({
                          ...r,
                          receivedQty: r.expectedQty,
                          condition: CONDITIONS[0],
                          receivedBy: loggedInName || 'User',
                          dateReceived: new Date().toISOString().slice(0, 10),
                        })
                      }
                    >
                      Receive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head"><h2>Receipt History — Last 30 Days</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Shipment ID</th><th>PO Number</th><th>SKU</th><th>Supplier</th><th>Expected Qty</th><th>Received Qty</th><th>Variance</th><th>Condition</th><th>Received By</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.map((h, idx) => (
                <tr key={`${h.shipmentId}-${idx}`}>
                  <td>{h.date}</td><td>{h.shipmentId}</td><td>{h.poNumber}</td><td>{h.sku}</td><td>{h.supplier}</td>
                  <td>{h.expectedQty.toLocaleString()}</td><td>{h.receivedQty.toLocaleString()}</td><td>{h.variance}</td><td>{h.condition}</td><td>{h.receivedBy}</td>
                  <td><span className={h.status === 'COMPLETE' ? 'pill pill--healthy' : 'pill pill--watch'}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head"><h2>Open Discrepancies</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Shipment</th><th>PO</th><th>SKU</th><th>Supplier</th><th>Variance</th><th>Action</th></tr>
            </thead>
            <tbody>
              {openDiscrepancies.map((d, idx) => (
                <tr key={`${d.shipmentId}-${idx}`}>
                  <td>{d.shipmentId}</td><td>{d.poNumber}</td><td>{d.sku}</td><td>{d.supplier}</td><td>{d.variance}</td>
                  <td><button type="button" className="btn btn--ghost" onClick={() => setResolveModal(d)}>Resolve</button></td>
                </tr>
              ))}
              {openDiscrepancies.length === 0 && <tr><td colSpan={6} className="po-empty">No open discrepancies.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {receiptModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>Receiving Confirmation</h3>
            <div className="po-form-grid">
              <label>Shipment ID<input value={receiptModal.shipmentId} readOnly /></label>
              <label>PO Number<input value={receiptModal.poNumber} readOnly /></label>
              <label>Supplier<input value={receiptModal.supplier} readOnly /></label>
              <label>Component<input value={receiptModal.sku} readOnly /></label>
              <label>Expected Quantity<input value={receiptModal.expectedQty} readOnly style={{ color: '#94a3b8' }} /></label>
              <label>Received Quantity<input type="number" value={receiptModal.receivedQty} onChange={(e) => setReceiptModal((m) => ({ ...m, receivedQty: Number(e.target.value) }))} /></label>
              <label>Condition<select value={receiptModal.condition} onChange={(e) => setReceiptModal((m) => ({ ...m, condition: e.target.value }))}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label>Received By<input value={receiptModal.receivedBy} onChange={(e) => setReceiptModal((m) => ({ ...m, receivedBy: e.target.value }))} /></label>
              <label>Date Received<input type="date" value={receiptModal.dateReceived} onChange={(e) => setReceiptModal((m) => ({ ...m, dateReceived: e.target.value }))} /></label>
            </div>
            {Number(receiptModal.receivedQty) !== Number(receiptModal.expectedQty) && (
              <div className="receiving-discrepancy">
                Discrepancy detected — Expected {receiptModal.expectedQty.toLocaleString()} units, Receiving {Number(receiptModal.receivedQty).toLocaleString()} units. {Number(receiptModal.receivedQty) < Number(receiptModal.expectedQty) ? `Shortfall of ${(Number(receiptModal.expectedQty) - Number(receiptModal.receivedQty)).toLocaleString()}` : `Overage of ${(Number(receiptModal.receivedQty) - Number(receiptModal.expectedQty)).toLocaleString()}`}. This will be flagged for buyer review.
              </div>
            )}
            <div className="po-form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setReceiptModal(null)}>Cancel</button>
              <button type="button" className="btn btn--green" onClick={submitReceipt}>Confirm Receipt</button>
            </div>
          </div>
        </div>
      )}

      {resolveModal && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>Resolve Discrepancy</h3>
            <p className="panel__lede mono">{resolveModal.shipmentId} · {resolveModal.poNumber} · {resolveModal.sku} · variance {resolveModal.variance}</p>
            <label>Resolution
              <select value={resolveAction} onChange={(e) => setResolveAction(e.target.value)}>{RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <label>Notes<textarea rows={4} value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} /></label>
            <div className="po-form-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setHistory((rows) =>
                    rows.map((r) =>
                      r.shipmentId === resolveModal.shipmentId && r.poNumber === resolveModal.poNumber
                        ? {
                            ...r,
                            status: 'RESOLVED',
                            resolutionType: resolveAction,
                            resolutionNotes: resolveNotes || '',
                          }
                        : r
                    )
                  );
                  setToast('Discrepancy resolved and removed from open list.');
                  setResolveModal(null);
                  setResolveAction(RESOLUTIONS[0]);
                  setResolveNotes('');
                }}
              >
                Submit Resolution
              </button>
              <button
                type="button"
                className="btn btn--green"
                onClick={() => {
                  const sup = supplierData.find((s) => resolveModal.supplier.includes(s.name) || s.name.includes(resolveModal.supplier));
                  onComposeEmail({
                    recipientName: sup?.primaryContact?.name || resolveModal.supplier,
                    recipientEmail: sup?.primaryContact?.email || 'supplier@example.com',
                    subject: `Discrepancy follow up — ${resolveModal.poNumber} / ${resolveModal.sku}`,
                    body: `Hello,\n\nWe logged a receiving discrepancy for shipment ${resolveModal.shipmentId} and PO ${resolveModal.poNumber}.\nVariance: ${resolveModal.variance}.\nProposed resolution: ${resolveAction}.\nNotes: ${resolveNotes || 'N/A'}.\n\nPlease confirm next steps.\n\nRegards,\nVectrum Receiving`,
                  });
                }}
              >
                Contact Supplier
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setResolveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
