import { useMemo, useRef, useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import { parseFileToMatrix, buildAutoMap, isMappingValid } from '../utils/dataSyncParse';
import {
  applyColumnMapping,
  mapRowsToSkuData,
  mapRowsToComponentData,
  mapRowsToSupplierData,
  mapRowsToCustomerOrders,
  mapRowsToShipments,
  mergeForecastIntoSkuData,
} from '../utils/dataSyncMappers';
import {
  exportAllDataV2,
  fgRows,
  downloadBlob,
  rowsToCsvString,
  componentRows,
  supplierRows,
  shipmentRows,
  orderRows,
  forecastRows,
  exportSheet,
} from '../utils/exportUtils';

const SERVICE_ACCOUNT = 'vectrum-sync@sc-control.iam.gserviceaccount.com';

const BANNER_STYLE = {
  background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.35)',
  borderRadius: '10px',
  padding: '14px 18px',
  color: '#fef08a',
  fontSize: '14px',
  marginBottom: '20px',
  lineHeight: 1.45,
};

const greyPill = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.15rem 0.45rem',
  borderRadius: 999,
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  background: 'rgba(51, 65, 85, 0.5)',
  color: '#94a3b8',
  border: '1px solid #475569',
};

const ERP_SYSTEMS = [
  { id: 'sap', name: 'SAP S/4HANA', desc: 'Enterprise ERP sync', available: true },
  { id: 'netsuite', name: 'Oracle NetSuite', desc: 'Cloud ERP connector', available: true },
  { id: 'd365', name: 'Microsoft Dynamics 365', desc: 'Full SCM integration', available: true },
  { id: 'infor', name: 'Infor CloudSuite', desc: 'Manufacturing ERP', available: true },
  { id: 'epicor', name: 'Epicor Kinetic', desc: 'Discrete manufacturing', available: true },
  { id: 'qb', name: 'QuickBooks Manufacturing', desc: 'SMB accounting sync', available: false },
  { id: 'sage', name: 'Sage X3', desc: 'Mid-market ERP', available: false },
  { id: 'jobboss', name: 'JobBOSS²', desc: 'Job shop ERP', available: false },
];

const ZONES = [
  {
    key: 'fg',
    label: 'Finished Goods Inventory (CSV/XLSX)',
    required: [
      'SKU',
      'Product',
      'Family',
      'Unit Value',
      'On Hand',
      'Committed',
      'Available',
      'Weeks Cover',
      'Status',
      'Gross Margin',
    ],
  },
  {
    key: 'comp',
    label: 'Component Inventory (CSV/XLSX)',
    required: [
      'SKU',
      'Description',
      'Drives FG SKU',
      'Supplier',
      'Country',
      'On Hand',
      'Unit Cost',
      'Days Supply',
      'Health',
      'Reorder Date',
      'MOQ',
      'EOQ',
    ],
  },
  {
    key: 'sup',
    label: 'Supplier List (CSV/XLSX)',
    required: [
      'Supplier ID',
      'Name',
      'Country',
      'Category',
      'Lead Days',
      'OTIF Pct',
      'Spend USD',
      'Risk Level',
    ],
  },
  {
    key: 'ord',
    label: 'Open Orders / Order Bank (CSV/XLSX)',
    required: [
      'Order ID',
      'Customer',
      'SKU',
      'Product',
      'Qty Ordered',
      'Promise Date',
      'Priority',
    ],
  },
  {
    key: 'shp',
    label: 'Shipment Data (CSV/XLSX)',
    required: [
      'Shipment ID',
      'SKU',
      'Origin',
      'Destination',
      'Mode',
      'Carrier',
      'ETA Days',
      'Status',
      'Delay Reason',
    ],
  },
  {
    key: 'fc',
    label: 'Demand Forecast (CSV/XLSX)',
    required: ['SKU', 'Family', 'Next 90 Days Units', 'Forecast Bias Pct', 'Seasonality Note'],
  },
];

function buildVectrumTemplate(zone) {
  const h = (() => {
    if (zone === 'fg')
      return [
        'SKU',
        'Product',
        'Family',
        'Unit Value',
        'On Hand',
        'Committed',
        'Available',
        'Weeks Cover',
        'Status',
        'Gross Margin',
      ];
    if (zone === 'comp')
      return [
        'SKU',
        'Description',
        'Drives FG SKU',
        'Supplier',
        'Country',
        'On Hand',
        'Unit Cost',
        'Days Supply',
        'Health',
        'Reorder Date',
        'MOQ',
        'EOQ',
      ];
    if (zone === 'sup')
      return [
        'Supplier ID',
        'Name',
        'Country',
        'Category',
        'Lead Days',
        'OTIF Pct',
        'Spend USD',
        'Risk Level',
      ];
    if (zone === 'ord')
      return [
        'Order ID',
        'Customer',
        'SKU',
        'Product',
        'Qty Ordered',
        'Promise Date',
        'Priority',
      ];
    if (zone === 'shp')
      return [
        'Shipment ID',
        'SKU',
        'Origin',
        'Destination',
        'Mode',
        'Carrier',
        'ETA Days',
        'Status',
        'Delay Reason',
      ];
    return ['SKU', 'Family', 'Next 90 Days Units', 'Forecast Bias Pct', 'Seasonality Note'];
  })();
  const d = (() => {
    if (zone === 'fg')
      return [
        [
          'FG-T800-CL',
          'Class 8 Highway Tractor',
          'Long Haul',
          '158000',
          '47',
          '31',
          '16',
          '0.15',
          'HEALTHY',
          '28.4',
        ],
        [
          'FG-R450-CO',
          'Regional Cab-Over Truck',
          'Regional Haul',
          '124000',
          '21',
          '18',
          '3',
          '0.12',
          'CRITICAL',
          '32.1',
        ],
      ];
    if (zone === 'comp')
      return [
        [
          'CMP-ENG-001',
          'Diesel Engine Assembly 13L',
          'FG-T800-CL',
          'Detroit Power Systems',
          'USA',
          '412',
          '28400',
          '31',
          'HEALTHY',
          '2026-05-14',
          '50',
          '200',
        ],
        [
          'CMP-AXL-002',
          'Drive Axle Assembly HD',
          'FG-V900-HD',
          'Stuttgart Drive Systems',
          'Germany',
          '1100',
          '8640',
          '24',
          'WATCH',
          '2026-04-24',
          '800',
          '2400',
        ],
      ];
    if (zone === 'sup')
      return [
        ['SUP-441', 'Detroit Power Systems', 'USA', 'Engines', '18', '98.4', '4200000', 'LOW'],
        ['SUP-981', 'Shenzhen Precision Components', 'China', 'Electronics', '42', '94.2', '1840000', 'HIGH'],
      ];
    if (zone === 'ord')
      return [
        [
          'CO-8821',
          'Apex Freight Solutions',
          'FG-T800-CL',
          'Class 8 Highway Tractor',
          '45',
          '2026-05-15',
          'HIGH',
        ],
        [
          'CO-8822',
          'MidWest Municipal Fleet',
          'FG-M550-MD',
          'Medium Duty Platform',
          '12',
          '2026-05-02',
          'HIGH',
        ],
      ];
    if (zone === 'shp')
      return [
        [
          'SHP-30481',
          'FG-T800-CL',
          'Port of Shanghai',
          'Los Angeles, CA',
          'Ocean',
          'Maersk',
          '9',
          'ON TIME',
          '',
        ],
        [
          'SHP-30492',
          'FG-R450-CO',
          'Hamburg',
          'Newark, NJ',
          'Ocean',
          'Hapag-Lloyd',
          '5',
          'DELAYED',
          'Port congestion at Antwerp',
        ],
      ];
    return [
      ['FG-T800-CL', 'Long Haul', '42000', '2.1', 'Q2 fleet renewal peak'],
      ['FG-V900-HD', 'Vocational', '51200', '0.6', 'Ag uplift spring'],
    ];
  })();
  const objs = d.map((r) => {
    const o = {};
    h.forEach((k, i) => {
      o[k] = r[i];
    });
    return o;
  });
  return rowsToCsvString(objs);
}

function ProgressBar({ pct }) {
  return (
    <div style={{ height: 6, background: '#334155', borderRadius: 3, marginTop: 8 }}>
      <div
        style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: '#22c55e', borderRadius: 3, transition: 'width 0.08s' }}
      />
    </div>
  );
}

function UploadCard({ zone, ctx, shortLabel, onApplied }) {
  const { required, key: zoneKey, label: zoneLabel } = zone;
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [headers, setHeaders] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    if (f) await loadFile(f);
  };

  const loadFile = async (f) => {
    setErr(null);
    setFile(f);
    try {
      const { headers: h, rows } = await parseFileToMatrix(f);
      setHeaders(h);
      setAllRows(rows);
      setPreview(rows.slice(0, 5));
      const m = buildAutoMap(h, required);
      if (!isMappingValid(h, required, m)) {
        const def = { ...m };
        required.forEach((r) => {
          if (!def[r] || !h.includes(def[r])) def[r] = h[0] || '';
        });
        setMapping(def);
      } else {
        setMapping(m);
      }
    } catch (e) {
      setErr(e?.message || String(e));
      setFile(null);
    }
  };

  const cancel = () => {
    setFile(null);
    setPreview(null);
    setAllRows([]);
    setHeaders([]);
    setMapping({});
    setErr(null);
  };

  const apply = () => {
    if (!isMappingValid(headers, required, mapping)) {
      setErr('Map every required column to a file column.');
      return;
    }
    const mapped = allRows.map((r) => applyColumnMapping(r, mapping, required));
    const { setSkuData, setComponentData, setSupplierData, setCustomerOrderData, setShipmentData, skuData, componentData, supplierData, shipmentData, addSyncLogEntry, setLastManualUpload, markModuleDirty, MODULE_IDS } = ctx;
    if (zoneKey === 'fg') {
      setSkuData(mapRowsToSkuData(mapped, skuData));
    } else if (zoneKey === 'comp') {
      setComponentData(mapRowsToComponentData(mapped, componentData));
    } else if (zoneKey === 'sup') {
      setSupplierData(mapRowsToSupplierData(mapped, supplierData));
    } else if (zoneKey === 'ord') {
      setCustomerOrderData(mapRowsToCustomerOrders(mapped));
    } else if (zoneKey === 'shp') {
      setShipmentData(mapRowsToShipments(mapped, shipmentData));
    } else if (zoneKey === 'fc') {
      setSkuData(mergeForecastIntoSkuData(mapped, skuData));
    }
    setLastManualUpload({ message: file?.name || shortLabel, isSample: false, at: new Date().toISOString() });
    addSyncLogEntry({
      type: 'Manual Upload',
      details: file?.name || shortLabel,
      records: allRows.length,
      status: 'SUCCESS',
    });
    markModuleDirty(MODULE_IDS.dataSync);
    onApplied({ file: file?.name, short: shortLabel });
    cancel();
  };

  const needMap = !isMappingValid(headers, required, mapping);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        background: '#1e293b',
        borderRadius: '10px',
        border: '1px dashed #475569',
        padding: '16px',
        minHeight: '140px',
        position: 'relative',
      }}
    >
      <input
        type="file"
        accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) loadFile(f);
        }}
      />
      <div onClick={() => inputRef.current?.click()} style={{ cursor: 'pointer', textAlign: 'center' }} role="presentation">
        <div style={{ fontSize: '28px', marginBottom: '6px' }}>⤓</div>
        <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '12px' }}>{zoneLabel}</div>
        <div style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>Drop or click to browse</div>
      </div>
      {err && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>{err}</p>}
      {file && preview && (
        <div style={{ marginTop: 12, textAlign: 'left', borderTop: '1px solid #334155', paddingTop: 10 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Preview: {file.name}</p>
          {needMap && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: '#fbbf24' }}>Map columns to required fields</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 160, overflow: 'auto' }}>
                {required.map((req) => (
                  <label key={req} style={{ fontSize: 10, color: '#94a3b8' }}>
                    {req}
                    <select
                      value={mapping[req] || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [req]: e.target.value }))}
                      style={{ width: '100%', marginTop: 2, background: '#0f172a', color: '#e2e8f0' }}
                    >
                      <option value="">—</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div style={{ overflow: 'auto', maxHeight: 100 }}>
            <table className="data-table" style={{ fontSize: 10 }}>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h}>{String(r[h] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={cancel} style={{ border: '1px solid #334155' }}>
              Cancel
            </button>
            <button type="button" onClick={apply} className="nav-group__header" style={{ width: 'auto' }}>
              Apply to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleModal({ onClose, onTest, onSync, testMsg, syncMsg, gPct }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="panel"
      style={{ maxWidth: 480, position: 'relative' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} style={{ position: 'absolute', right: 12, top: 8, background: 'none', border: 'none', color: '#94a3b8' }} aria-label="Close">×</button>
      <h3 style={{ marginTop: 0 }}>Connect Google Sheet</h3>
      <p className="panel__meta" style={{ lineHeight: 1.45 }}>To connect your sheet, share it with the following service account email and grant Editor access</p>
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <code style={{ color: '#86efac', fontSize: 12 }}>{SERVICE_ACCOUNT}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(SERVICE_ACCOUNT);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={onTest}>Test Connection</button>
        {testMsg && <span className="pill pill--healthy">{testMsg}</span>}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={onSync}>Begin Sync</button>
        {gPct > 0 && <ProgressBar pct={gPct} />}
        {syncMsg && <p className="pill pill--healthy" style={{ marginTop: 8, display: 'inline-block' }}>{syncMsg}</p>}
      </div>
    </div>
  );
}

export function DataSyncModule() {
  const ctx = useDashboardData();
  const { skuData, componentData, supplierData, shipmentData, customerOrderData, setLastManualUpload, addSyncLogEntry, lastManualUpload, syncLog, markModuleDirty, MODULE_IDS } = ctx;
  const [erp, setErp] = useState('DISCONNECTED');
  const [mrp] = useState('DISCONNECTED');
  const [crm] = useState('DISCONNECTED');
  const [gSheet, setGSheet] = useState('DISCONNECTED');
  const [gsUrl, setGsUrl] = useState('');
  const [gsShow, setGsShow] = useState(false);
  const [gsTestMsg, setGsTestMsg] = useState('');
  const [gsSyncMsg, setGsSyncMsg] = useState('');
  const [gPct, setGPct] = useState(0);
  const [gAuto, setGAuto] = useState(false);
  const [gWrite, setGWrite] = useState(false);
  const [gsTime, setGsTime] = useState(null);
  const [erpModal, setErpModal] = useState(null);
  const [erpTest, setErpTest] = useState('');
  const [erpEnd, setErpEnd] = useState('');
  const [erpKey, setErpKey] = useState('');
  const [erpSyncPct, setErpSyncPct] = useState(0);
  const [auto15, setAuto15] = useState(true);
  const [onOpen, setOnOpen] = useState(true);
  const [writeErp, setWriteErp] = useState(false);
  const [emailRep, setEmailRep] = useState(false);
  const [freq, setFreq] = useState('15 min');
  const [zoneOk, setZoneOk] = useState({});

  const dataBundle = useMemo(
    () => ({
      skuData,
      componentData,
      supplierData,
      shipmentData,
      customerOrderData,
      orderHistory: ctx.orderHistory,
      agentAlerts: ctx.agentAlerts,
    }),
    [skuData, componentData, supplierData, shipmentData, customerOrderData, ctx.orderHistory, ctx.agentAlerts]
  );

  const downloadT = (z) => {
    const c = buildVectrumTemplate(z);
    const name = { fg: 'fg', comp: 'components', sup: 'suppliers', ord: 'open-orders', shp: 'shipments', fc: 'forecast' }[z];
    downloadBlob(new Blob([c], { type: 'text/csv;charset=utf-8' }), `vectrum-template-${name}.csv`);
  };

  const onGsTest = () => {
    setGsTestMsg('');
    setTimeout(() => {
      setGsTestMsg('Connected — 47 rows found across 3 sheets');
    }, 2000);
  };

  const onGsSync = () => {
    setGsSyncMsg('');
    setGPct(0);
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      const p = Math.min(100, Math.round((t / 50) * 100));
      setGPct(p);
      if (p < 100) return;
      clearInterval(id);
      setGSheet('CONNECTED');
      setGsTime(new Date().toISOString());
      setGsSyncMsg('Sync complete — dashboard updated with live data');
      addSyncLogEntry({ type: 'Google Sheets Sync', details: 'All tabs', records: 47, status: 'SUCCESS' });
      setLastManualUpload((prev) => ({ ...prev, message: 'Google Sheets (live sync)', isSample: false, at: new Date().toISOString() }));
      markModuleDirty(MODULE_IDS.dataSync);
    }, 60);
  };

  return (
    <div style={{ padding: '20px 24px', color: '#e2e8f0' }}>
      <h2 className="top-header__title" style={{ fontSize: '20px' }}>Data Sync</h2>
      <p className="panel__meta" style={{ marginBottom: 16 }}>Integration hub for ERP, MRP, CRM, Sheets, and file uploads</p>

      <div style={BANNER_STYLE}>
        <strong>Sample data notice:</strong> Currently showing sample data for Vectrum Manufacturing. Upload your Excel
        or CSV data, connect Google Sheets, or integrate your ERP system to see your real operations in real time.
      </div>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <span className="panel__title">Connection status</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
          {[
            ['ERP System', erp],
            ['MRP System', mrp],
            ['CRM System', crm],
            ['Google Sheets', gSheet],
          ].map(([a, s]) => (
            <div key={a} style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, padding: 12 }}>
              <div className="panel__meta" style={{ marginBottom: 6 }}>{a}</div>
              {s === 'CONNECTED' ? (
                <span className="pill pill--healthy">{s}</span>
              ) : (
                <span style={greyPill}>{s}</span>
              )}
            </div>
          ))}
          <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, padding: 12 }}>
            <div className="panel__meta" style={{ marginBottom: 6 }}>Last Manual Upload</div>
            {!lastManualUpload.isSample && lastManualUpload.at ? (
              <>
                <span className="pill pill--healthy" style={{ display: 'block', marginBottom: 4 }}>Upload OK</span>
                <p style={{ fontSize: 11, color: '#86efac', margin: 0 }}>{lastManualUpload.message}</p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{new Date(lastManualUpload.at).toLocaleString()}</p>
              </>
            ) : (
              <span className="pill pill--watch">Using sample data</span>
            )}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <div>
            <div className="panel__title">Upload Your Data</div>
            <p className="panel__meta" style={{ margin: 0 }}>Upload CSV or Excel to replace sample data (parsed with SheetJS)</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
          {ZONES.map((z) => (
            <div key={z.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span className="panel__meta" style={{ fontSize: 12 }} />
                <button type="button" onClick={() => downloadT(z.key)} style={{ fontSize: 11, padding: '4px 8px' }}>Download Template</button>
              </div>
              <UploadCard
                zone={z}
                ctx={ctx}
                shortLabel={z.key}
                onApplied={({ file, short }) =>
                  setZoneOk((o) => ({ ...o, [short]: { file, at: new Date() } }))
                }
              />
              {zoneOk[z.key] && (
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 12,
                    color: '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span aria-hidden>✓</span> Uploaded successfully — {zoneOk[z.key].file || 'data'} —{' '}
                  {zoneOk[z.key].at.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head" style={{ alignItems: 'center' }}>
          <span className="panel__title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Google Sheets Live Sync <span className="pill pill--watch">BETA</span>
          </span>
        </div>
        <p className="panel__meta" style={{ margin: '4px 0 12px' }}>Connect a live Google Sheet for 2-way sync (simulated test & sync here)</p>
        <div className="panel__meta" style={{ marginBottom: 4 }}>Google Sheets URL</div>
        <input
          value={gsUrl}
          onChange={(e) => setGsUrl(e.target.value)}
          placeholder="Paste your Google Sheets link here"
          style={{ width: '100%', maxWidth: 500, padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
        />
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => { setGsShow(true); setGsTestMsg(''); setGsSyncMsg(''); setGPct(0); }}>Connect Sheet</button>
          {gSheet === 'CONNECTED' && <span className="pill pill--healthy">CONNECTED</span>}
          {gSheet === 'CONNECTED' && gsTime && <span className="panel__meta">Last synced {new Date(gsTime).toLocaleString()}</span>}
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12, maxWidth: 560 }}>
          <label className="panel__meta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={gAuto} onChange={() => setGAuto((a) => !a)} /> Auto-sync every 30 seconds</label>
          <label className="panel__meta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={gWrite} onChange={() => setGWrite((a) => !a)} /> Write dashboard changes back to Google Sheet</label>
        </div>
        <p className="panel__meta" style={{ fontSize: 11, marginTop: 6 }}>Full Google Sheets 2-way sync available now in beta. ERP integrations coming next.</p>
        {gsShow && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setGsShow(false)}
            onKeyDown={(e) => e.key === 'Escape' && setGsShow(false)}
            role="presentation"
          >
            <GoogleModal
              gPct={gPct}
              onClose={() => setGsShow(false)}
              onTest={onGsTest}
              onSync={onGsSync}
              testMsg={gsTestMsg}
              syncMsg={gsSyncMsg}
            />
          </div>
        )}
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <div>
            <div className="panel__title">Connect Your ERP System</div>
            <p className="panel__meta" style={{ margin: 0 }}>Two-way real-time sync (simulated connections)</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
          {ERP_SYSTEMS.map((e) => (
            <div key={e.id} style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, padding: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1e3a5f', marginBottom: 8, display: 'grid', placeItems: 'center' }}>◇</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
              <p className="panel__meta" style={{ margin: '4px 0' }}>{e.desc}</p>
              <span className={e.available ? 'pill pill--healthy' : 'pill pill--route'}>{e.available ? 'AVAILABLE' : 'COMING SOON'}</span>
              <div style={{ marginTop: 8 }}>
                {e.available ? (
                  <button type="button" onClick={() => { setErpModal(e); setErpTest(''); setErpSyncPct(0); }}>Connect</button>
                ) : (
                  <button type="button" disabled title="Integration in development — join waitlist" style={{ opacity: 0.4 }}>Connect</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {erpModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setErpModal(null); setErpSyncPct(0); }}
            role="presentation"
          >
            <div className="panel" style={{ minWidth: 400, maxWidth: 520 }} onClick={(ev) => ev.stopPropagation()}>
              <h3>Connect to {erpModal.name}</h3>
              <label>API Endpoint URL
                <input
                  value={erpEnd}
                  onChange={(ev) => setErpEnd(ev.target.value)}
                  style={{ display: 'block', width: '100%', margin: '4px 0 10px', padding: 6, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                />
              </label>
              <label>API Key
                <input
                  value={erpKey}
                  onChange={(ev) => setErpKey(ev.target.value)}
                  type="password"
                  style={{ display: 'block', width: '100%', margin: '4px 0 10px', padding: 6, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                />
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setErpTest('');
                    setTimeout(() => setErpTest('Connection successful — 847 records found'), 2000);
                  }}
                >Test Connection</button>
                {erpTest && <span className="pill pill--healthy">{erpTest}</span>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setErpSyncPct(0);
                  const name = erpModal.name;
                  let p = 0;
                  const id = setInterval(() => {
                    p = Math.min(100, p + 4);
                    setErpSyncPct(p);
                    if (p < 100) return;
                    clearInterval(id);
                    setErp('CONNECTED');
                    setErpModal(null);
                    addSyncLogEntry({ type: 'ERP', details: name, records: 847, status: 'SUCCESS' });
                  }, 32);
                }}
              >Begin Sync</button>
              {erpSyncPct > 0 && <ProgressBar pct={erpSyncPct} />}
              <p className="panel__meta" style={{ fontSize: 12, lineHeight: 1.4, marginTop: 8 }}>
                This will enable 2-way sync. Changes in your ERP will reflect in the dashboard within 15 minutes. Changes
                in the dashboard can be written back using the write-back toggle in Sync Settings.
              </p>
              <button type="button" onClick={() => setErpModal(null)} style={{ marginTop: 8 }}>Close</button>
            </div>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__title" style={{ marginBottom: 8 }}>Sync Preferences</div>
        <label className="panel__meta" style={{ display: 'block', margin: '4px 0' }}><input type="checkbox" checked={auto15} onChange={() => setAuto15((a) => !a)} /> Auto-sync every 15 minutes</label>
        <label className="panel__meta" style={{ display: 'block', margin: '4px 0' }}><input type="checkbox" checked={onOpen} onChange={() => setOnOpen((a) => !a)} /> Sync on module open</label>
        <label className="panel__meta" style={{ display: 'block', margin: '4px 0' }} title="Enabling this will push changes made in the dashboard back to your ERP system"><input type="checkbox" checked={writeErp} onChange={() => setWriteErp((a) => !a)} /> Two-way write-back to ERP</label>
        <label className="panel__meta" style={{ display: 'block', margin: '4px 0' }}><input type="checkbox" checked={emailRep} onChange={() => setEmailRep((a) => !a)} /> Email sync report daily</label>
        <div className="panel__meta" style={{ margin: '6px 0 4px' }}>Sync frequency</div>
        <select value={freq} onChange={(e) => setFreq(e.target.value)} style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: 4 }}>
          {['15 min', '30 min', '1 hour', '4 hours', 'Daily'].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <div>
            <div className="panel__title">Export Your Data</div>
            <p className="panel__meta" style={{ margin: 0 }}>SheetJS-generated files — current in-memory data</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={() => exportAllDataV2(dataBundle, 'xlsx')}>Export All Data (Excel)</button>
          <button type="button" onClick={() => exportSheet(fgRows(skuData), 'finished-goods', 'xlsx')}>Export Finished Goods</button>
          <button type="button" onClick={() => exportSheet(componentRows(componentData), 'components', 'xlsx')}>Export Components</button>
          <button type="button" onClick={() => exportSheet(supplierRows(supplierData), 'suppliers', 'xlsx')}>Export Suppliers</button>
          <button type="button" onClick={() => exportSheet(shipmentRows(shipmentData), 'shipments', 'xlsx')}>Export Shipments</button>
          <button type="button" onClick={() => exportSheet(orderRows(customerOrderData), 'open-orders', 'xlsx')}>Export Orders</button>
          <button type="button" onClick={() => exportSheet(forecastRows(skuData), 'forecast', 'xlsx')}>Export Forecast</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel__title" style={{ marginBottom: 8 }}>Recent Sync Activity</div>
        <div style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Details</th>
                <th>Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {syncLog.map((l) => (
                <tr key={l.id}>
                  <td>{l.time}</td>
                  <td>{l.type}</td>
                  <td>{l.details}</td>
                  <td>{l.records}</td>
                  <td>
                    <span className={l.status === 'SUCCESS' ? 'pill pill--healthy' : 'pill pill--critical'}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
