import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const SHORT_CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const UNIT_COST_INPUT_FMT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const STATUS_COLORS = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#3b82f6',
  ACKNOWLEDGED: '#22c55e',
  RECEIVED: '#15803d',
  OVERDUE: '#ef4444',
  CANCELLED: '#6b7280',
};

const SHIP_TO_OPTIONS = [
  'Vectrum Manufacturing — Detroit Plant',
  'Vectrum Manufacturing — Chicago Warehouse',
];

const PAYMENT_TERMS = ['Net 30', 'Net 45', 'Net 60', 'COD'];
const MONTHLY_PO_VOLUME = [
  { label: 'Nov', count: 8 },
  { label: 'Dec', count: 11 },
  { label: 'Jan', count: 14 },
  { label: 'Feb', count: 9 },
  { label: 'Mar', count: 16 },
  { label: 'Apr', count: 12 },
];

const INITIAL_POS = [
  {
    poNumber: 'PO-2026-0036',
    componentSku: 'CMP-WRH-004',
    supplier: 'Chennai Cable & Harness',
    qty: 8000,
    poValue: 9440000,
    requiredBy: '2026-05-01',
    status: 'OVERDUE',
    supplierAcknowledgment: 'Not acknowledged',
    createdAt: '2026-04-06',
  },
  {
    poNumber: 'PO-2026-0037',
    componentSku: 'CMP-BAT-009',
    supplier: 'Shenzhen Precision Components',
    qty: 400,
    poValue: 16480000,
    requiredBy: '2026-05-10',
    status: 'SUBMITTED',
    supplierAcknowledgment: 'Not acknowledged',
    createdAt: '2026-04-10',
  },
  {
    poNumber: 'PO-2026-0038',
    componentSku: 'CMP-AXL-002',
    supplier: 'Stuttgart Drive Systems',
    qty: 2400,
    poValue: 20740000,
    requiredBy: '2026-05-20',
    status: 'ACKNOWLEDGED',
    supplierAcknowledgment: 'Confirmed 2026-04-22',
    createdAt: '2026-04-12',
  },
  {
    poNumber: 'PO-2026-0039',
    componentSku: 'CMP-INV-006',
    supplier: 'Shenzhen Precision Components',
    qty: 2000,
    poValue: 4480000,
    requiredBy: '2026-05-15',
    status: 'SUBMITTED',
    supplierAcknowledgment: 'Not acknowledged',
    createdAt: '2026-04-14',
  },
  {
    poNumber: 'PO-2026-0040',
    componentSku: 'CMP-ENG-001',
    supplier: 'Detroit Power Systems',
    qty: 200,
    poValue: 5680000,
    requiredBy: '2026-06-01',
    status: 'ACKNOWLEDGED',
    supplierAcknowledgment: 'Confirmed 2026-04-25',
    createdAt: '2026-04-18',
  },
  {
    poNumber: 'PO-2026-0041',
    componentSku: 'CMP-STL-005',
    supplier: 'Monterrey Metal Forming',
    qty: 45000,
    poValue: 837000,
    requiredBy: '2026-05-30',
    status: 'DRAFT',
    supplierAcknowledgment: '—',
    createdAt: '2026-04-20',
  },
];

function ymd(date) {
  const iso = new Date(date);
  return Number.isNaN(iso.getTime()) ? '' : iso.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function toDate(s) {
  return new Date(`${s}T00:00:00`);
}

function urgencyForReorderDate(reorderDate, today) {
  const diffMs = toDate(reorderDate).getTime() - toDate(today).getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return 'CRITICAL';
  if (diffDays <= 7) return 'HIGH';
  return 'MEDIUM';
}

function fallbackSupplierEmail(name) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const domain = normalized.replace(/\s+/g, '');
  const first = normalized.split(/\s+/)[0] || 'orders';
  return `${first}.orders@${domain}.com`;
}

function statusBadge(status) {
  return (
    <span className="po-status-badge" style={{ borderColor: STATUS_COLORS[status] || '#64748b', color: STATUS_COLORS[status] || '#64748b' }}>
      {status}
    </span>
  );
}

function createDraftEmail(po, componentDescription) {
  return [
    `Subject: Purchase Order ${po.poNumber} — Vectrum Manufacturing`,
    '',
    `Dear ${po.supplier} Team,`,
    '',
    'Please find the purchase order details below:',
    `PO Number: ${po.poNumber}`,
    `Component SKU: ${po.componentSku}`,
    `Description: ${componentDescription}`,
    `Order Quantity: ${po.qty}`,
    `Unit Cost: ${CURRENCY.format(po.unitCost)}`,
    `Total PO Value: ${CURRENCY.format(po.poValue)}`,
    `Required By: ${po.requiredBy}`,
    `Ship To: ${po.shipTo}`,
    `Payment Terms: ${po.paymentTerms}`,
    `Notes: ${po.notes || 'N/A'}`,
    '',
    'Please acknowledge receipt and confirm delivery timeline.',
    '',
    'Best regards,',
    'Vectrum Manufacturing Procurement',
  ].join('\n');
}

export function PurchaseOrdersModule({ onComposeEmail }) {
  const { componentData, supplierData } = useDashboardData();
  const today = ymd(new Date());
  const horizonDate = addDays(today, 30);

  const supplierByName = useMemo(
    () => new Map(supplierData.map((s) => [s.name, s])),
    [supplierData]
  );
  const componentBySku = useMemo(
    () => new Map(componentData.map((c) => [c.sku, c])),
    [componentData]
  );

  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);
  const [openPos, setOpenPos] = useState(INITIAL_POS);
  const [toast, setToast] = useState('');
  const [viewModalPo, setViewModalPo] = useState(null);

  const nextPoNumber = useMemo(() => {
    const maxSeq = openPos.reduce((max, po) => {
      const seq = Number(po.poNumber.split('-').pop());
      return Number.isFinite(seq) ? Math.max(max, seq) : max;
    }, 0);
    return `PO-${new Date().getFullYear()}-${String(maxSeq + 1).padStart(4, '0')}`;
  }, [openPos]);

  const [form, setForm] = useState({
    poNumber: nextPoNumber,
    componentSku: componentData[0]?.sku || '',
    shipTo: SHIP_TO_OPTIONS[0],
    qty: componentData[0]?.eoq || 0,
    unitCost: componentData[0]?.unitCost || 0,
    requiredBy: componentData[0]?.reorderDate || today,
    paymentTerms: PAYMENT_TERMS[0],
    notes: '',
  });
  const [unitCostInput, setUnitCostInput] = useState(() =>
    componentData[0]?.unitCost != null ? UNIT_COST_INPUT_FMT.format(componentData[0].unitCost) : ''
  );

  const selectedComponent = componentBySku.get(form.componentSku);
  const componentDescription = selectedComponent?.description || '';
  useEffect(() => {
    if (!selectedComponent) return;
    if (form.unitCost === '' || form.unitCost == null || Number.isNaN(Number(form.unitCost))) {
      setForm((prev) => ({ ...prev, unitCost: selectedComponent.unitCost }));
    }
  }, [selectedComponent, form.unitCost]);
  useEffect(() => {
    const v = Number(form.unitCost);
    if (Number.isFinite(v)) {
      setUnitCostInput(UNIT_COST_INPUT_FMT.format(v));
    }
  }, [form.unitCost]);

  const supplierName = selectedComponent?.supplier || '';
  const supplierPrimary = supplierName ? supplierByName.get(supplierName)?.primaryContact : null;
  const supplierContact = supplierPrimary?.email || (supplierName ? fallbackSupplierEmail(supplierName) : '');
  const totalPoValue = Number(form.qty || 0) * Number(form.unitCost || 0);

  const suggestions = useMemo(() => {
    return componentData
      .filter((c) => c.netNeed > 0 && c.reorderDate <= horizonDate)
      .filter((c) => !dismissedSuggestions.includes(c.sku))
      .map((c) => {
        const supplier = supplierByName.get(c.supplier);
        const expectedDelivery = addDays(c.reorderDate, supplier?.leadDays || 0);
        return {
          id: `suggestion-${c.sku}`,
          sku: c.sku,
          description: c.description,
          drivesFG: c.drivesFG,
          supplier: c.supplier,
          suggestedQty: c.eoq,
          suggestedOrderDate: c.reorderDate,
          expectedDelivery,
          estimatedValue: c.eoq * c.unitCost,
          urgency: urgencyForReorderDate(c.reorderDate, today),
          unitCost: c.unitCost,
        };
      })
      .sort((a, b) => toDate(a.suggestedOrderDate) - toDate(b.suggestedOrderDate));
  }, [componentData, dismissedSuggestions, horizonDate, supplierByName, today]);

  const normalizedRows = useMemo(
    () =>
      openPos.map((po) => {
        const isLate =
          toDate(po.requiredBy) < toDate(today) &&
          !['RECEIVED', 'CANCELLED'].includes(po.status);
        const status = po.status === 'OVERDUE' || isLate ? 'OVERDUE' : po.status;
        return { ...po, status };
      }),
    [openPos, today]
  );

  const stats = useMemo(() => {
    const openRows = normalizedRows.filter((po) => ['DRAFT', 'SUBMITTED'].includes(po.status));
    return {
      openCount: openRows.length,
      pendingAck: normalizedRows.filter((po) => po.status === 'SUBMITTED' && po.supplierAcknowledgment === 'Not acknowledged').length,
      openValue: openRows.reduce((sum, po) => sum + po.poValue, 0),
      overdue: normalizedRows.filter((po) => po.status === 'OVERDUE').length,
    };
  }, [normalizedRows]);

  const supplierSpend = useMemo(() => {
    const totals = new Map();
    normalizedRows.forEach((po) => {
      if (po.status === 'CANCELLED') return;
      totals.set(po.supplier, (totals.get(po.supplier) || 0) + po.poValue);
    });
    return [...totals.entries()]
      .map(([supplier, value]) => ({ supplier, value }))
      .sort((a, b) => b.value - a.value);
  }, [normalizedRows]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map();
    normalizedRows.forEach((po) => {
      counts.set(po.status, (counts.get(po.status) || 0) + 1);
    });
    return [...counts.entries()].map(([status, count]) => ({ status, count }));
  }, [normalizedRows]);

  const monthlyVolume = useMemo(() => MONTHLY_PO_VOLUME, []);

  const resetFormForNext = () => {
    const c = componentData[0];
    setForm({
      poNumber: nextPoNumber,
      componentSku: c?.sku || '',
      shipTo: SHIP_TO_OPTIONS[0],
      qty: c?.eoq || 0,
      unitCost: c?.unitCost || 0,
      requiredBy: c?.reorderDate || today,
      paymentTerms: PAYMENT_TERMS[0],
      notes: '',
    });
  };

  const applySkuDefaults = (sku) => {
    const c = componentBySku.get(sku);
    if (!c) return;
    setForm((prev) => ({
      ...prev,
      componentSku: sku,
      qty: Number(prev.qty) > 0 ? prev.qty : c.eoq,
      unitCost: c.unitCost,
      requiredBy: c.reorderDate,
    }));
    setUnitCostInput(UNIT_COST_INPUT_FMT.format(c.unitCost));
  };

  const prefillFromSuggestion = (s) => {
    setForm((prev) => ({
      ...prev,
      componentSku: s.sku,
      qty: s.suggestedQty,
      unitCost: s.unitCost,
      requiredBy: s.expectedDelivery,
      poNumber: nextPoNumber,
    }));
    setUnitCostInput(UNIT_COST_INPUT_FMT.format(s.unitCost));
  };

  const onUnitCostInputChange = (value) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];
    setUnitCostInput(normalized);
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      setForm((p) => ({ ...p, unitCost: parsed }));
    } else if (normalized === '') {
      setForm((p) => ({ ...p, unitCost: '' }));
    }
  };

  const buildPoPayload = (status) => {
    return {
      poNumber: form.poNumber,
      componentSku: form.componentSku,
      supplier: supplierName,
      supplierEmail: supplierContact,
      qty: Number(form.qty),
      unitCost: Number(form.unitCost),
      poValue: Number(form.qty) * Number(form.unitCost),
      requiredBy: form.requiredBy,
      status,
      supplierAcknowledgment: status === 'DRAFT' ? '—' : 'Not acknowledged',
      shipTo: form.shipTo,
      paymentTerms: form.paymentTerms,
      notes: form.notes,
      createdAt: today,
    };
  };

  const saveDraft = () => {
    const po = buildPoPayload('DRAFT');
    setOpenPos((rows) => [po, ...rows]);
    setToast(`PO ${po.poNumber} saved as draft`);
    resetFormForNext();
  };

  const submitToSupplier = () => {
    const po = buildPoPayload('SUBMITTED');
    setOpenPos((rows) => [po, ...rows]);
    resetFormForNext();
    onComposeEmail({
      recipientName: supplierPrimary?.name || po.supplier,
      recipientEmail: supplierPrimary?.email || po.supplierEmail,
      subject: `Purchase Order ${po.poNumber} — Vectrum Manufacturing`,
      body: createDraftEmail(po, componentDescription),
    });
    setToast(`PO ${po.poNumber} submitted to ${po.supplier} — logged in PO tracker`);
  };

  const openFollowUpEmail = (po) => {
    const c = componentBySku.get(po.componentSku);
    const supplier = supplierByName.get(po.supplier);
    const contact = supplier?.primaryContact;
    const followup = [
      `Subject: Follow up — ${po.poNumber}`,
      '',
      `Hello ${po.supplier} Team,`,
      '',
      `Following up on PO ${po.poNumber} for ${po.componentSku} (${c?.description || 'component'}).`,
      `Required by date: ${po.requiredBy}.`,
      'Please share acknowledgment and shipment timing.',
      '',
      'Thank you,',
      'Vectrum Manufacturing Procurement',
    ].join('\n');
    onComposeEmail({
      recipientName: contact?.name || po.supplier,
      recipientEmail: contact?.email || fallbackSupplierEmail(po.supplier),
      subject: `Follow up — ${po.poNumber}`,
      body: followup,
    });
  };

  const markReceived = (po) => {
    const input = window.prompt(`Enter received quantity for ${po.poNumber}:`, String(po.qty));
    if (input == null) return;
    const receivedQty = Number(input);
    if (!Number.isFinite(receivedQty) || receivedQty < 0) return;
    setOpenPos((rows) =>
      rows.map((r) =>
        r.poNumber === po.poNumber
          ? { ...r, status: 'RECEIVED', supplierAcknowledgment: `Received qty ${receivedQty}` }
          : r
      )
    );
  };

  const cancelPo = (po) => {
    if (!window.confirm(`Cancel ${po.poNumber}?`)) return;
    setOpenPos((rows) => rows.map((r) => (r.poNumber === po.poNumber ? { ...r, status: 'CANCELLED', supplierAcknowledgment: 'Cancelled' } : r)));
  };

  return (
    <div className="module-grid">
      {toast && (
        <div className="po-toast">
          {toast}
          <button type="button" onClick={() => setToast('')} aria-label="Close toast">×</button>
        </div>
      )}

      <section className="panel panel--span3">
        <div className="po-kpi-grid">
          <article className="po-kpi"><span>Open POs</span><strong>{stats.openCount}</strong></article>
          <article className="po-kpi"><span>POs Pending Acknowledgment</span><strong>{stats.pendingAck}</strong></article>
          <article className="po-kpi"><span>Total Open PO Value</span><strong>{SHORT_CURRENCY.format(stats.openValue)}</strong></article>
          <article className="po-kpi"><span>Overdue POs</span><strong>{stats.overdue}</strong></article>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>AI-Suggested Purchase Orders</h2>
          <span className="panel__meta">Generated from MRP explosion, current inventory levels, supplier lead times and 90-day forecast</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th><th>Drives FG</th><th>Supplier</th><th>Suggested Qty</th><th>Order Date</th><th>Expected Delivery</th><th>Estimated Value</th><th>Urgency</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.id}>
                  <td><div>{s.sku}</div><small>{s.description}</small></td>
                  <td>{s.drivesFG}</td>
                  <td>{s.supplier}</td>
                  <td>{s.suggestedQty.toLocaleString()}</td>
                  <td>{s.suggestedOrderDate}</td>
                  <td>{s.expectedDelivery}</td>
                  <td>{SHORT_CURRENCY.format(s.estimatedValue)}</td>
                  <td><span className={`urgency-pill urgency-pill--${s.urgency.toLowerCase()}`}>{s.urgency}</span></td>
                  <td>
                    <div className="po-inline-actions">
                      <button type="button" className="btn btn--green" onClick={() => prefillFromSuggestion(s)}>Create PO</button>
                      <button type="button" className="btn btn--ghost" onClick={() => setDismissedSuggestions((rows) => [...rows, s.sku])}>Dismiss</button>
                    </div>
                  </td>
                </tr>
              ))}
              {suggestions.length === 0 && (
                <tr><td colSpan={9} className="po-empty">No pending AI suggestions in the next 30 days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span2">
        <div className="panel__head"><h2>Create Purchase Order</h2></div>
        <div className="po-form-grid">
          <label>PO Number<input value={form.poNumber} readOnly /></label>
          <label>Component SKU
            <select value={form.componentSku} onChange={(e) => applySkuDefaults(e.target.value)}>
              {componentData.map((c) => <option key={c.sku} value={c.sku}>{c.sku}</option>)}
            </select>
          </label>
          <label>Description<input value={componentDescription} readOnly /></label>
          <label>Supplier<input value={supplierName} readOnly /></label>
          <label>Supplier Contact Email<input value={supplierContact} readOnly /></label>
          <label>Ship To
            <select value={form.shipTo} onChange={(e) => setForm((p) => ({ ...p, shipTo: e.target.value }))}>
              {SHIP_TO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label>Order Quantity<input type="number" min="0" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: Number(e.target.value) }))} /></label>
          <label>Unit Cost
            <input
              type="text"
              inputMode="decimal"
              value={unitCostInput}
              onChange={(e) => onUnitCostInputChange(e.target.value)}
              onBlur={() => {
                const parsed = Number(unitCostInput);
                if (Number.isFinite(parsed)) setUnitCostInput(UNIT_COST_INPUT_FMT.format(parsed));
              }}
            />
          </label>
          <label>Total PO Value<input value={CURRENCY.format(totalPoValue)} readOnly /></label>
          <label>Required By Date<input type="date" value={form.requiredBy} onChange={(e) => setForm((p) => ({ ...p, requiredBy: e.target.value }))} /></label>
          <label>Payment Terms
            <select value={form.paymentTerms} onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))}>
              {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="po-form-span2">Notes<textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></label>
        </div>
        <div className="po-form-actions">
          <button type="button" className="btn btn--ghost" onClick={saveDraft}>Save as Draft</button>
          <button type="button" className="btn btn--green" onClick={submitToSupplier}>Submit to Supplier</button>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head"><h2>Open Purchase Orders</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>PO Number</th><th>Component</th><th>Supplier</th><th>Qty</th><th>PO Value</th><th>Required By</th><th>Status</th><th>Supplier Acknowledgment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {normalizedRows.map((po) => (
                <tr key={po.poNumber}>
                  <td>{po.poNumber}</td>
                  <td>{po.componentSku}</td>
                  <td>{po.supplier}</td>
                  <td>{po.qty.toLocaleString()}</td>
                  <td>{SHORT_CURRENCY.format(po.poValue)}</td>
                  <td>{po.requiredBy}</td>
                  <td>{statusBadge(po.status)}</td>
                  <td>{po.supplierAcknowledgment}</td>
                  <td>
                    <div className="po-inline-actions">
                      <button type="button" className="btn btn--ghost" onClick={() => setViewModalPo(po)}>View</button>
                      <button type="button" className="btn btn--ghost" onClick={() => openFollowUpEmail(po)}>Email Supplier</button>
                      <button type="button" className="btn btn--ghost" onClick={() => markReceived(po)}>Mark Received</button>
                      <button type="button" className="btn btn--danger" onClick={() => cancelPo(po)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head"><h3>Spend by Supplier</h3></div>
        <div className="chart-box" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supplierSpend} layout="vertical" margin={{ top: 8, right: 10, left: 12, bottom: 8 }}>
              <CartesianGrid stroke="#1e3a5f" strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => SHORT_CURRENCY.format(v)} />
              <YAxis dataKey="supplier" type="category" width={130} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip formatter={(v) => CURRENCY.format(v)} />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head"><h3>PO Status Breakdown</h3></div>
        <div className="chart-box" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                {statusBreakdown.map((row) => (
                  <Cell key={row.status} fill={STATUS_COLORS[row.status] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head"><h3>Monthly PO Volume</h3></div>
        <div className="chart-box" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyVolume} margin={{ top: 8, right: 10, left: 10, bottom: 8 }}>
              <CartesianGrid stroke="#1e3a5f" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {viewModalPo && (
        <div className="po-modal-backdrop">
          <div className="po-modal">
            <h3>{viewModalPo.poNumber}</h3>
            <p><strong>Component:</strong> {viewModalPo.componentSku} — {componentBySku.get(viewModalPo.componentSku)?.description || ''}</p>
            <p><strong>Supplier:</strong> {viewModalPo.supplier}</p>
            <p><strong>Qty:</strong> {viewModalPo.qty.toLocaleString()}</p>
            <p><strong>PO Value:</strong> {CURRENCY.format(viewModalPo.poValue)}</p>
            <p><strong>Required By:</strong> {DATE_FMT.format(toDate(viewModalPo.requiredBy))}</p>
            <p><strong>Status:</strong> {viewModalPo.status}</p>
            <button type="button" className="btn btn--ghost" onClick={() => setViewModalPo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
