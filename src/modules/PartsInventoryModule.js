import { useEffect, useMemo, useRef, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const FG_LOCATIONS = [
  'Line 1 — Assembly',
  'Line 2 — Assembly',
  'Warehouse A',
  'Shipping Dock',
];

const CMP_LOCATIONS = [
  'Receiving Dock',
  'Line 1 — Supermarket',
  'Line 2 — Supermarket',
  'Component Warehouse',
];

const RATIO_FG = [0.35, 0.3, 0.25, 0.1];
const RATIO_CMP = [0.3, 0.3, 0.25, 0.15];

const WRITE_ON_REASONS = [
  'Found in warehouse',
  'Return from line',
  'Supplier bonus stock',
  'Cycle count adjustment',
];

const WRITE_OFF_REASONS = [
  'Scrapped — defect',
  'Scrapped — damage',
  'Obsolete',
  'Lost — investigation required',
  'Cycle count adjustment',
];

const fieldFull = { width: '100%', maxWidth: '100%', marginTop: 4, display: 'block' };
const selectBase = { width: '100%', marginTop: 4, background: 'var(--navy-900)', color: 'var(--text)', border: '1px solid var(--navy-600)', borderRadius: 6, padding: 8, fontSize: 13 };

function allocateInt(n, ratios) {
  if (n <= 0) return ratios.map(() => 0);
  const parts = ratios.map((r) => Math.floor(n * r));
  let d = n - parts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (d > 0) {
    parts[i % parts.length] += 1;
    d -= 1;
    i += 1;
  }
  return parts;
}

function rowPillClass(status) {
  if (status === 'HEALTHY') return 'pill pill--healthy';
  if (status === 'WATCH') return 'pill pill--watch';
  if (status === 'CRITICAL' || status === 'EMPTY') return 'pill pill--critical';
  return 'pill pill--route';
}

function buildLocationRows(isFg, onH, com, av) {
  const locs = isFg ? FG_LOCATIONS : CMP_LOCATIONS;
  const r = isFg ? RATIO_FG : RATIO_CMP;
  const onP = allocateInt(Math.max(0, Math.floor(onH)), r);
  const comP = allocateInt(Math.max(0, Math.floor(com)), r);
  const rows = locs.map((location, i) => {
    const o = onP[i];
    const c = Math.min(comP[i], o);
    let a = Math.max(0, o - c);
    return { location, onHand: o, committed: c, available: a, status: 'WATCH' };
  });
  let avSum = rows.reduce((s, x) => s + x.available, 0);
  const targetAv = Math.max(0, Math.floor(av));
  const diff = targetAv - avSum;
  if (rows.length && diff !== 0) {
    const last = rows[rows.length - 1];
    const na = Math.max(0, last.available + diff);
    rows[rows.length - 1] = { ...last, available: na };
  }
  return rows.map((x) => {
    let st = 'HEALTHY';
    if (x.onHand === 0) st = 'EMPTY';
    else if (x.available === 0) st = 'CRITICAL';
    else if (x.available < 2) st = 'WATCH';
    return { ...x, status: st };
  });
}

function partKeyFor(kind, sku) {
  return `${kind}:${sku}`;
}

function isThisMonth(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
}

/** Seeded with relative `at` dates so "this month" KPIs stay meaningful */
function buildInitialHistory() {
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  return [
    {
      id: 'H1',
      timeLabel: '3 days ago',
      at: daysAgo(3),
      part: 'CMP-WRH-004',
      description: 'Wiring Harness',
      type: 'Write Off',
      quantity: 12,
      reason: 'Scrapped — defect',
      authorizedBy: 'J. Martinez',
      flagged: true,
    },
    {
      id: 'H2',
      timeLabel: '5 days ago',
      at: daysAgo(5),
      part: 'FG-T800-CL',
      description: 'Class 8 Highway Tractor',
      type: 'Transfer',
      quantity: 8,
      reason: 'Line 1 to Warehouse A',
      authorizedBy: 'S. Patel',
      flagged: false,
    },
    {
      id: 'H3',
      timeLabel: '7 days ago',
      at: daysAgo(7),
      part: 'CMP-ENG-001',
      description: 'Diesel Engine Assembly',
      type: 'Write On',
      quantity: 5,
      reason: 'Found in warehouse',
      authorizedBy: 'T. Williams',
      flagged: false,
    },
    {
      id: 'H4',
      timeLabel: '10 days ago',
      at: daysAgo(10),
      part: 'CMP-BAT-009',
      description: 'EV Battery Pack',
      type: 'Write Off',
      quantity: 3,
      reason: 'Damage',
      authorizedBy: 'R. Chen',
      flagged: false,
    },
    {
      id: 'H5',
      timeLabel: '14 days ago',
      at: daysAgo(14),
      part: 'FG-R450-CO',
      description: 'Regional Cab-Over Truck',
      type: 'Write Off',
      quantity: 15,
      reason: 'Obsolete',
      authorizedBy: 'K. Johnson',
      flagged: true,
    },
  ];
}

function BlueprintLink({ sku }) {
  const href = `https://drawings.vectrum.com/parts/${encodeURIComponent(sku)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-blueprint">
      {href}
    </a>
  );
}

export function PartsInventoryModule() {
  const { skuData, setSkuData, componentData, setComponentData, markModuleDirty, MODULE_IDS } = useDashboardData();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [locationOverrides, setLocationOverrides] = useState({});
  const [transferOpen, setTransferOpen] = useState(false);
  const [writeOnOpen, setWriteOnOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [reviewBanner, setReviewBanner] = useState(false);
  const [history, setHistory] = useState(buildInitialHistory);

  const [toast, setToast] = useState(null);

  const [tfFrom, setTfFrom] = useState('');
  const [tfTo, setTfTo] = useState('');
  const [tfQty, setTfQty] = useState('');
  const [tfReason, setTfReason] = useState('');
  const [tfBy, setTfBy] = useState('Dashboard User');

  const [wQty, setWQty] = useState('');
  const [wReason, setWReason] = useState(WRITE_ON_REASONS[0]);
  const [wNotes, setWNotes] = useState('');
  const [wBy, setWBy] = useState('');
  const [wFlag, setWFlag] = useState(false);
  const [fQty, setFQty] = useState('');
  const [fReason, setFReason] = useState(WRITE_OFF_REASONS[0]);
  const [fNotes, setFNotes] = useState('');
  const [fBy, setFBy] = useState('');
  const [fFlag, setFFlag] = useState(false);

  const showToast = (msg) => {
    setToast({ msg, id: Date.now() });
    window.setTimeout(() => setToast(null), 4000);
  };

  const totalCatalogCount = useMemo(
    () => (skuData?.length || 0) + (componentData?.length || 0),
    [skuData, componentData]
  );

  const lowStockCount = useMemo(() => {
    const fg = skuData.filter((s) => s.wksCover < 1.5).length;
    const comp = componentData.filter((c) => (c.daysSupply != null && c.daysSupply < 15)).length;
    return fg + comp;
  }, [skuData, componentData]);

  const flaggedThisMonth = useMemo(
    () => history.filter((h) => h.flagged && h.at && isThisMonth(h.at instanceof Date ? h.at : new Date(h.at))).length,
    [history]
  );

  const merged = useMemo(() => {
    const matches = (text, query) => text && text.toLowerCase().includes(query);
    if (!q.trim()) return { fg: [], comp: [] };
    const qy = q.trim().toLowerCase();
    return {
      fg: skuData.filter(
        (s) =>
          matches(s.sku?.toLowerCase(), qy) || matches(s.product?.toLowerCase(), qy) || matches(s.family?.toLowerCase(), qy)
      ),
      comp: componentData.filter(
        (c) =>
          matches(c.sku?.toLowerCase(), qy) ||
          matches(c.description?.toLowerCase(), qy) ||
          matches(c.drivesFG?.toLowerCase(), qy) ||
          matches(c.supplier?.toLowerCase(), qy)
      ),
    };
  }, [q, skuData, componentData]);

  const allMatches = useMemo(
    () => [
      ...merged.fg.map((s) => ({ kind: 'fg', sku: s.sku, title: s.product, family: s.family, onHand: s.onHand })),
      ...merged.comp.map((c) => ({ kind: 'comp', sku: c.sku, title: c.description, family: c.drivesFG || 'Component' })),
    ],
    [merged]
  );

  const record = useMemo(() => {
    if (!selected) return null;
    if (selected.kind === 'fg') return skuData.find((s) => s.sku === selected.sku) || null;
    return componentData.find((c) => c.sku === selected.sku) || null;
  }, [selected, skuData, componentData]);

  const pKey = selected ? partKeyFor(selected.kind, selected.sku) : null;
  const baseRows = useMemo(() => {
    if (!record || !selected) return [];
    const onH = record.onHand;
    if (selected.kind === 'fg') {
      const com = record.committed;
      const av = record.available;
      return buildLocationRows(true, onH, com, av);
    }
    const onH2 = record.onHand;
    return buildLocationRows(false, onH2, 0, onH2);
  }, [record, selected]);

  const prevSig = useRef('');
  useEffect(() => {
    prevSig.current = '';
  }, [pKey]);
  useEffect(() => {
    if (!pKey || !record) return;
    const com = record.committed;
    const av = record.available;
    const sig = `${record.onHand}|${(com ?? 0)}|${(av ?? 0)}`;
    if (prevSig.current === sig) return;
    prevSig.current = sig;
    setLocationOverrides((prev) => {
      const n = { ...prev };
      delete n[pKey];
      return n;
    });
  }, [pKey, record]);

  const locRows = (pKey && locationOverrides[pKey]) || baseRows;
  const isFg = selected?.kind === 'fg';
  const locList = isFg ? FG_LOCATIONS : CMP_LOCATIONS;
  const description = record ? (isFg ? record.product : record.description) : '';
  const totalOnHand = record ? record.onHand : 0;

  const runTransfer = () => {
    if (!selected || !record) return;
    const qty = Math.max(0, Math.floor(Number(tfQty) || 0));
    if (!tfFrom || !tfTo || tfFrom === tfTo || !qty) return;
    const fromRow = locRows.find((r) => r.location === tfFrom);
    if (!fromRow || fromRow.onHand < qty) return;
    const next = locRows.map((r) => {
      if (r.location === tfFrom) {
        return {
          ...r,
          onHand: r.onHand - qty,
          available: Math.max(0, r.onHand - qty - r.committed),
        };
      }
      if (r.location === tfTo) {
        const nh = r.onHand + qty;
        return {
          ...r,
          onHand: nh,
          available: Math.max(0, nh - r.committed),
        };
      }
      return r;
    });
    setLocationOverrides((o) => ({
      ...o,
      [pKey]: next.map((r) => {
        let st = 'HEALTHY';
        if (r.onHand === 0) st = 'EMPTY';
        else if (r.available === 0) st = 'CRITICAL';
        else if (r.available < 2) st = 'WATCH';
        return { ...r, status: st };
      }),
    }));
    setTransferOpen(false);
    showToast(`Transfer submitted — ${qty} units of ${selected.sku} from ${tfFrom} to ${tfTo}`);
    const now = new Date();
    setHistory((h) => [
      {
        id: `T${Date.now()}`,
        timeLabel: now.toLocaleString(),
        at: now,
        part: selected.sku,
        description,
        type: 'Transfer',
        quantity: qty,
        reason: `${tfFrom} to ${tfTo}${tfReason ? ` — ${tfReason}` : ''}`,
        authorizedBy: tfBy,
        flagged: false,
      },
      ...h,
    ]);
    markModuleDirty(MODULE_IDS.inventoryParts);
    setTfFrom('');
    setTfTo('');
    setTfQty('');
    setTfReason('');
  };

  const applyWriteOn = () => {
    if (!selected || !record) return;
    const n = Math.max(0, Math.floor(Number(wQty) || 0));
    if (!n || !wReason) return;
    const rsn = wNotes ? `${wReason} — ${wNotes}` : wReason;
    const by = wBy || '—';
    const wf = wFlag;
    if (selected.kind === 'fg') {
      setSkuData((list) =>
        list.map((s) =>
          s.sku === selected.sku
            ? { ...s, onHand: s.onHand + n, available: s.available + n }
            : s
        )
      );
    } else {
      setComponentData((list) =>
        list.map((c) =>
          c.sku === selected.sku
            ? {
                ...c,
                onHand: c.onHand + n,
                extended: (c.onHand + n) * c.unitCost,
              }
            : c
        )
      );
    }
    setLocationOverrides((o) => {
      const n = { ...o };
      if (pKey) delete n[pKey];
      return n;
    });
    prevSig.current = '';
    setWriteOnOpen(false);
    setWQty('');
    setWReason(WRITE_ON_REASONS[0]);
    setWNotes('');
    setWBy('');
    showToast('Adjustment recorded — inventory updated');
    const nowO = new Date();
    setHistory((h) => [
      {
        id: `O${Date.now()}`,
        timeLabel: nowO.toLocaleString(),
        at: nowO,
        part: selected.sku,
        description,
        type: 'Write On',
        quantity: n,
        reason: rsn,
        authorizedBy: by,
        flagged: wf,
      },
      ...h,
    ]);
    markModuleDirty(MODULE_IDS.inventoryParts);
  };

  const applyWriteOff = () => {
    if (!selected || !record) return;
    const n = Math.max(0, Math.floor(Number(fQty) || 0));
    if (!n || !fReason) return;
    const rsn = fNotes ? `${fReason} — ${fNotes}` : fReason;
    const auth = fBy || '—';
    const wasFlag = n > 10 || fFlag;
    if (selected.kind === 'fg') {
      setSkuData((list) =>
        list.map((s) => {
          if (s.sku !== selected.sku) return s;
          const nextOn = Math.max(0, s.onHand - n);
          const av = Math.max(0, nextOn - s.committed);
          return { ...s, onHand: nextOn, available: av };
        })
      );
    } else {
      setComponentData((list) =>
        list.map((c) => {
          if (c.sku !== selected.sku) return c;
          const nextOn = Math.max(0, c.onHand - n);
          return { ...c, onHand: nextOn, extended: nextOn * c.unitCost };
        })
      );
    }
    if (wasFlag) setReviewBanner(true);
    setLocationOverrides((o) => {
      const n = { ...o };
      if (pKey) delete n[pKey];
      return n;
    });
    prevSig.current = '';
    setWriteOffOpen(false);
    setFQty('');
    setFReason(WRITE_OFF_REASONS[0]);
    setFNotes('');
    setFBy('');
    setFFlag(false);
    showToast('Adjustment recorded — inventory updated');
    const nowF = new Date();
    setHistory((h) => [
      {
        id: `F${Date.now()}`,
        timeLabel: nowF.toLocaleString(),
        at: nowF,
        part: selected.sku,
        description,
        type: 'Write Off',
        quantity: n,
        reason: rsn,
        authorizedBy: auth,
        flagged: wasFlag,
      },
      ...h,
    ]);
    markModuleDirty(MODULE_IDS.inventoryParts);
  };

  useEffect(() => {
    const m = Math.max(0, Math.floor(Number(fQty) || 0));
    if (m > 10) setFFlag(true);
  }, [fQty]);

  const openTransfer = () => {
    if (!locList.length) return;
    setTfFrom(locList[0]);
    setTfTo(locList[1] || locList[0]);
    setTfReason('');
    setTransferOpen(true);
  };

  const toOptions = locList.filter((l) => l !== tfFrom);

  useEffect(() => {
    if (tfFrom && tfTo === tfFrom) {
      const o = locList.find((l) => l !== tfFrom);
      if (o) setTfTo(o);
    }
  }, [tfFrom, locList, tfTo]);

  return (
    <div className="parts-inv module-grid">
      <section className="panel panel--span3 parts-inv__kpi-wrap">
        <div className="parts-inv__kpi-bar">
          <div className="inv-kpi parts-inv__kpi" style={{ borderLeftColor: '#3b82f6' }}>
            <span className="inv-kpi__label">Total parts in catalog</span>
            <span className="inv-kpi__value" style={{ color: '#3b82f6' }}>{totalCatalogCount}</span>
            <span className="inv-kpi__hint">FG + component SKUs (live data)</span>
          </div>
          <div className="inv-kpi parts-inv__kpi" style={{ borderLeftColor: '#f59e0b' }}>
            <span className="inv-kpi__label">Flagged adjustments this month</span>
            <span className="inv-kpi__value" style={{ color: '#f59e0b' }}>{flaggedThisMonth}</span>
            <span className="inv-kpi__hint">From adjustment history (flagged only)</span>
          </div>
          <div className="inv-kpi parts-inv__kpi" style={{ borderLeftColor: '#f87171' }}>
            <span className="inv-kpi__label">Low stock parts</span>
            <span className="inv-kpi__value" style={{ color: '#f87171' }}>{lowStockCount}</span>
            <span className="inv-kpi__hint">FG: wks cover under 1.5 · Components: days supply under 15</span>
          </div>
        </div>
      </section>

      <div className="panel panel--span3 parts-inv__search-wrap" style={{ padding: '1.1rem 1.2rem' }}>
        <label htmlFor="parts-search" className="sr-only">Search parts</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            id="parts-search"
            type="search"
            className="parts-inv__search"
            placeholder="Search by part number, SKU, or description…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            autoComplete="off"
            autoFocus
          />
          {q && (
            <button type="button" className="tag" onClick={() => { setQ(''); setSelected(null); }} style={{ cursor: 'pointer' }}>Clear</button>
          )}
        </div>
        {q.trim() && allMatches.length > 0 && (
          <ul className="parts-inv__match-list" style={{ listStyle: 'none', margin: 0, marginTop: 8, padding: 0, maxHeight: 220, overflow: 'auto' }} role="listbox">
            {allMatches.map((m) => (
              <li key={m.kind + m.sku}>
                <button
                  type="button"
                  onClick={() => { setSelected({ kind: m.kind, sku: m.sku }); }}
                  className="parts-inv__match-btn"
                >
                  <span className="mono">{m.sku}</span>
                  <span>{m.title}</span>
                  <span className="panel__meta" style={{ marginLeft: 8 }}>{m.kind === 'fg' ? 'FG' : 'Component'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.trim() && allMatches.length === 0 && <p className="panel__meta" style={{ margin: '0.5rem 0 0' }}>No parts match that search</p>}
      </div>

      {record && selected && (
        <section className="panel panel--span3" style={{ padding: '1.15rem' }}>
          {reviewBanner && (
            <div style={{ marginBottom: 12, padding: '0.5rem 0.75rem', background: 'rgba(127, 29, 29, 0.35)', border: '1px solid rgba(248, 113, 113, 0.4)', borderRadius: 8, color: '#fecaca', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }} role="status">
              <span>This adjustment has been flagged for management review</span>
              <button type="button" onClick={() => setReviewBanner(false)} style={{ background: 'transparent', border: '1px solid rgba(254, 202, 202, 0.5)', color: '#fecaca', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>Dismiss</button>
            </div>
          )}
          <h2 className="parts-inv__h2" style={{ margin: '0 0 0.4rem' }}>Part details</h2>
          <div className="parts-inv__head-row">
            <div>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.06, color: 'var(--muted)', margin: 0 }}>Part number & description</p>
              <p style={{ margin: 4, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                <span className="mono">{record.sku}</span>
                <span style={{ color: 'var(--muted)', fontWeight: 500, margin: '0 0.4rem' }}>—</span>
                {description}
              </p>
              <p className="panel__meta" style={{ margin: '0.2rem 0' }}>Product family: {isFg ? record.family : `Component · drives ${record.drivesFG || 'n/a'}`}</p>
              <p className="panel__meta" style={{ margin: '0.35rem 0 0' }}>Blueprint / Schematic: <BlueprintLink sku={record.sku} /></p>
            </div>
            <div>
              <p className="panel__meta" style={{ margin: 0 }}>Total factory quantity (on hand)</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.1, color: 'var(--text)' }}>{totalOnHand}</p>
            </div>
          </div>
          <div className="table-scroll" style={{ maxHeight: 280, marginTop: 14, marginBottom: 8 }}>
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Location</th>
                  <th className="num">On hand</th>
                  <th className="num">Committed</th>
                  <th className="num">Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {locRows.map((r) => (
                  <tr key={r.location}>
                    <td>{r.location}</td>
                    <td className="num">{r.onHand.toLocaleString()}</td>
                    <td className="num">{r.committed.toLocaleString()}</td>
                    <td className="num">{r.available.toLocaleString()}</td>
                    <td>
                      <span className={rowPillClass(r.status)}>
                        {r.status === 'HEALTHY' ? 'OK' : r.status === 'EMPTY' ? 'Empty' : r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={openTransfer} className="nav-group__header" style={{ width: 'auto' }}>Transfer stock</button>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              <button type="button" onClick={() => { setWReason(WRITE_ON_REASONS[0]); setWQty(''); setWriteOnOpen(true); setReviewBanner(false); }}>Write on</button>
              <button
                type="button"
                onClick={() => { setFReason(WRITE_OFF_REASONS[0]); setFQty(''); setFFlag(false); setWriteOffOpen(true); setReviewBanner(false); }}
                style={{ border: '1px solid rgba(248, 113, 113, 0.45)' }}
              >Write off
              </button>
            </div>
          </div>
        </section>
      )}

      {(!record || !selected) && !q && (
        <p className="panel__meta" style={{ gridColumn: '1 / -1', textAlign: 'center', margin: 24, fontSize: 14 }}>Start typing a part number, SKU, or description to search the factory catalog.</p>
      )}

      {toast && <div className="parts-toast pill pill--healthy" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, padding: '0.5rem 0.85rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>{toast.msg}</div>}

      {transferOpen && record && (
        <div className="modal-backdrop" onClick={() => setTransferOpen(false)} role="presentation" style={{ zIndex: 1500 }}>
          <div className="modal-card" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Transfer stock</h3>
            <p className="panel__meta" style={{ margin: '0.2rem 0' }}>Part: <span className="mono">{record.sku}</span> — {description}</p>
            <div style={{ margin: '0.5rem 0' }}>
              <div className="panel__meta">From</div>
              <select value={tfFrom} onChange={(e) => setTfFrom(e.target.value)} style={selectBase}>
                {locList.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ margin: '0.5rem 0' }}>
              <div className="panel__meta">To</div>
              <select value={tfTo} onChange={(e) => setTfTo(e.target.value)} style={selectBase}>
                {toOptions.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Quantity
              <input value={tfQty} onChange={(e) => setTfQty(e.target.value)} type="number" min="0" className="globe-search" style={{ width: '100%', maxWidth: '100%', marginTop: 4 }} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Reason for transfer
              <input value={tfReason} onChange={(e) => setTfReason(e.target.value)} className="globe-search" style={{ width: '100%', maxWidth: '100%', marginTop: 4 }} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Requested by
              <input value={tfBy} onChange={(e) => setTfBy(e.target.value)} className="globe-search" style={{ width: '100%', maxWidth: '100%', marginTop: 4 }} />
            </label>
            <button type="button" className="modal-card__action" onClick={runTransfer} style={{ marginTop: 10 }}>Submit transfer</button>
            <button type="button" className="modal-card__action" onClick={() => setTransferOpen(false)} style={{ marginTop: 6, borderColor: 'var(--navy-600)' }}>Cancel</button>
          </div>
        </div>
      )}

      {writeOnOpen && record && (
        <div className="modal-backdrop" onClick={() => setWriteOnOpen(false)} role="presentation" style={{ zIndex: 1500 }}>
          <div className="modal-card" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Write on</h3>
            <p className="panel__meta"><span className="mono" style={{ fontWeight: 600 }}>{record.sku}</span> — {description} (read only)</p>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Quantity
              <input value={wQty} onChange={(e) => setWQty(e.target.value)} type="number" min="0" className="globe-search" style={fieldFull} />
            </label>
            <div className="panel__meta" style={{ marginTop: 6 }}>Reason code</div>
            <select value={wReason} onChange={(e) => setWReason(e.target.value)} style={selectBase}>
              {WRITE_ON_REASONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Notes
              <input value={wNotes} onChange={(e) => setWNotes(e.target.value)} className="globe-search" style={fieldFull} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Authorized by
              <input value={wBy} onChange={(e) => setWBy(e.target.value)} className="globe-search" style={fieldFull} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>
              <input type="checkbox" checked={wFlag} onChange={() => setWFlag((v) => !v)} /> Flag for management review
            </label>
            <button type="button" className="modal-card__action" onClick={applyWriteOn} style={{ marginTop: 10 }}>Submit</button>
            <button type="button" className="modal-card__action" onClick={() => setWriteOnOpen(false)} style={{ marginTop: 6, borderColor: 'var(--navy-600)' }}>Cancel</button>
          </div>
        </div>
      )}

      {writeOffOpen && record && (
        <div className="modal-backdrop" onClick={() => setWriteOffOpen(false)} role="presentation" style={{ zIndex: 1500 }}>
          <div className="modal-card" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Write off</h3>
            <p className="panel__meta"><span className="mono" style={{ fontWeight: 600 }}>{record.sku}</span> — {description} (read only)</p>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Quantity
              <input value={fQty} onChange={(e) => setFQty(e.target.value)} type="number" min="0" className="globe-search" style={fieldFull} />
            </label>
            <div className="panel__meta" style={{ marginTop: 6 }}>Reason code</div>
            <select value={fReason} onChange={(e) => setFReason(e.target.value)} style={selectBase}>
              {WRITE_OFF_REASONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Notes
              <input value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="globe-search" style={fieldFull} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>Authorized by
              <input value={fBy} onChange={(e) => setFBy(e.target.value)} className="globe-search" style={fieldFull} />
            </label>
            <label className="panel__meta" style={{ display: 'block', marginTop: 6 }}>
              <input
                type="checkbox"
                checked={fFlag || Number(fQty) > 10}
                onChange={() => (Number(fQty) <= 10 ? setFFlag((v) => !v) : null)}
                disabled={Number(fQty) > 10}
              />
              {Number(fQty) > 10 ? ' Flag for management review (auto — quantity > 10)' : ' Flag for management review'}
            </label>
            {(fFlag || Number(fQty) > 10) && <div style={{ marginTop: 8, color: '#fecaca', fontSize: 12, fontWeight: 600 }}>This adjustment will be flagged for management review</div>}
            <button type="button" className="modal-card__action" onClick={applyWriteOff} style={{ marginTop: 10, borderColor: 'rgba(248, 113, 113, 0.45)' }}>Submit</button>
            <button type="button" className="modal-card__action" onClick={() => setWriteOffOpen(false)} style={{ marginTop: 6 }}>Cancel</button>
          </div>
        </div>
      )}

      <section className="panel panel--span3" style={{ padding: '0.9rem' }}>
        <h2 style={{ fontSize: 1, margin: 0, marginBottom: 10 }}>Adjustment history — last 30 days</h2>
          <div className="table-scroll" style={{ maxHeight: 360 }}>
            <table className="data-table" style={{ fontSize: 11.5 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Part</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="num">Qty</th>
                  <th>Reason</th>
                  <th>Authorized by</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className={h.flagged ? 'data-table__row--flag' : undefined}>
                    <td>{h.timeLabel}</td>
                    <td className="mono">{h.part}</td>
                    <td>{h.description}</td>
                    <td>{h.type}</td>
                    <td className="num">{h.quantity}</td>
                    <td>{h.reason}</td>
                    <td>{h.authorizedBy}</td>
                    <td>{h.flagged ? '⚠️ Flagged' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
}
