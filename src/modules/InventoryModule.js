import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ComposedChart,
  BarChart,
} from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';

const axisStyle = { fill: '#94a3b8', fontSize: 11 };
const gridStroke = '#1e3a5f';

function formatUsd(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function InventoryModule({ variant = 'fg' }) {
  const { skuData, setSkuData, componentData, setComponentData, orderHistory, markModuleDirty, MODULE_IDS } = useDashboardData();
  const inventoryRows = skuData.map((sku) => ({
    sku: sku.sku,
    product: sku.product,
    onHand: sku.onHand,
    committed: sku.committed,
    available: sku.available,
    weeksCover: sku.wksCover,
    status: sku.status,
    grossMarginPct: sku.grossMargin,
    unitCostUsd: sku.unitValue,
  }));

  const kpis = {
    totalSkus: inventoryRows.length,
    skusAtRisk: inventoryRows.filter((r) => r.status === 'CRITICAL' || r.status === 'WATCH').length,
    totalValueUsd: inventoryRows.reduce((sum, r) => sum + r.onHand * r.unitCostUsd, 0),
  };

  const inventoryTrend = orderHistory.slice(0, 8).map((row, idx) => ({
    week: `W0${idx + 1}`,
    fillRate: 96 + row.y2025 / 50,
    stockoutEvents: Math.max(0, 8 - Math.round(row.y2025 / 10)),
  }));

  const classAChartData = componentData.map((c) => ({
    ...c,
    component: c.sku,
    status: c.health,
    extValue: c.extended,
    unitCostUsd: c.unitCost,
  }));

  if (variant === 'components') {
    return (
      <div className="module-grid">
        <section className="panel panel--span2">
          <div className="panel__head">
            <h2>Class A component exposure</h2>
            <span className="panel__meta">Extended value at standard cost · top cost drivers only</span>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAChartData} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis
                  type="number"
                  tick={axisStyle}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                  tickFormatter={(v) => formatUsd(v)}
                />
                <YAxis type="category" dataKey="component" width={118} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [formatUsd(v), 'Extended value']}
                  contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                />
                <Bar dataKey="extValue" name="Ext. value" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>ABC snapshot</h2>
            <span className="panel__meta">Class A = ~78% of component spend</span>
          </div>
          <ul className="fact-list">
            <li>
              <span className="fact-list__k">Class A SKUs</span>
              <span className="fact-list__v">{componentData.length}</span>
            </li>
            <li>
              <span className="fact-list__k">On-hand extended</span>
              <span className="fact-list__v">
                {formatUsd(classAChartData.reduce((s, r) => s + r.extValue, 0))}
              </span>
            </li>
            <li>
              <span className="fact-list__k">Critical / watch</span>
              <span className="fact-list__v">
                {componentData.filter((c) => c.health !== 'HEALTHY').length} lanes
              </span>
            </li>
          </ul>
        </section>

        <section className="panel panel--span3">
          <div className="panel__head">
            <h2>Class A supply positions</h2>
            <span className="panel__meta">Highest unit-cost inputs to finished goods</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Description</th>
                  <th>Drives FG</th>
                  <th>Supplier</th>
                  <th className="num">On hand</th>
                  <th className="num">Unit $</th>
                  <th className="num">Extended</th>
                  <th className="num">Days supply</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {classAChartData.map((row, rowIdx) => {
                  const ext = row.extValue;
                  return (
                    <tr key={row.component}>
                      <td className="mono">{row.component}</td>
                      <td>{row.description}</td>
                      <td className="mono">{row.drivesFG}</td>
                      <td>{row.supplier}</td>
                      <td
                        className="num"
                        onClick={(e) => e.stopPropagation()}
                        style={rowIdx === 0 ? { minWidth: 100 } : undefined}
                      >
                        {rowIdx === 0 ? (
                          <input
                            type="number"
                            className="mono"
                            value={row.onHand}
                            min={0}
                            onChange={(e) => {
                              const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                              setComponentData((list) =>
                                list.map((c) =>
                                  c.sku === row.component
                                    ? { ...c, onHand: v, extended: v * c.unitCost }
                                    : c
                                )
                              );
                              markModuleDirty(MODULE_IDS.inventoryComponents);
                            }}
                            style={{ width: 88, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                          />
                        ) : (
                          row.onHand.toLocaleString()
                        )}
                      </td>
                      <td className="num">${row.unitCostUsd.toLocaleString()}</td>
                      <td className="num">{formatUsd(ext)}</td>
                      <td className="num">{row.daysSupply}</td>
                      <td>
                        <span className={`pill pill--${row.status === 'HEALTHY' ? 'healthy' : row.status === 'WATCH' ? 'watch' : 'critical'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="module-grid">
      <section className="panel panel--span3 inv-kpis">
        <div className="inv-kpi">
          <span className="inv-kpi__label">Total SKUs</span>
          <span className="inv-kpi__value">{kpis.totalSkus}</span>
          <span className="inv-kpi__hint">Active FG catalog</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">SKUs at risk</span>
          <span className="inv-kpi__value inv-kpi__value--warn">{kpis.skusAtRisk}</span>
          <span className="inv-kpi__hint">Watch + critical cover</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Inventory value</span>
          <span className="inv-kpi__value">{formatUsd(kpis.totalValueUsd)}</span>
          <span className="inv-kpi__hint">On-hand × standard cost</span>
        </div>
      </section>

      <section className="panel panel--span2">
        <div className="panel__head">
          <h2>Regional fill rate & stockouts</h2>
          <span className="panel__meta">Trailing 8 weeks · NA + EMEA + APAC</span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={inventoryTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="week" tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis yAxisId="left" domain={[94, 100]} tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="fillRate"
                name="Fill rate %"
                stroke="#22c55e"
                fill="url(#invFill)"
                strokeWidth={2}
              />
              <Bar yAxisId="right" dataKey="stockoutEvents" name="Stockout events" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <defs>
                <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Inventory health</h2>
          <span className="panel__meta">Snapshot · units</span>
        </div>
        <div className="chart-box chart-box--short">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={inventoryRows.slice(0, 5)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="sku" tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={48} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="onHand" name="On hand" stroke="#4ade80" fill="#166534" fillOpacity={0.45} strokeWidth={2} />
              <Area type="monotone" dataKey="committed" name="Committed" stroke="#fbbf24" fill="#854d0e" fillOpacity={0.35} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Finished goods positions</h2>
          <span className="panel__meta">
            All DCs · sellable vs. committed · gross margin % (TTM blend by SKU)
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th className="num">On hand</th>
                <th className="num">Committed</th>
                <th className="num">Available</th>
                <th className="num">Wks cover</th>
                <th>Status</th>
                <th className="num">Gross margin</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.map((row, rowIdx) => (
                <tr key={row.sku}>
                  <td className="mono">{row.sku}</td>
                  <td>{row.product}</td>
                  <td className="num">
                    {rowIdx === 0 ? (
                      <input
                        type="number"
                        className="num"
                        min={0}
                        value={row.onHand}
                        onChange={(e) => {
                          const onHand = Math.max(0, Math.floor(Number(e.target.value) || 0));
                          setSkuData((list) =>
                            list.map((s) => {
                              if (s.sku !== row.sku) return s;
                              const forecastWk = s.forecastNext90 ? s.forecastNext90 / 13 : 0;
                              const wksCover = forecastWk ? onHand / forecastWk : 0;
                              const available = Math.max(0, onHand - s.committed);
                              return { ...s, onHand, wksCover, available };
                            })
                          );
                          markModuleDirty(MODULE_IDS.inventoryFg);
                        }}
                        style={{ width: 80, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                      />
                    ) : (
                      row.onHand.toLocaleString()
                    )}
                  </td>
                  <td className="num">{row.committed.toLocaleString()}</td>
                  <td className="num">{row.available.toLocaleString()}</td>
                  <td className="num">{row.weeksCover.toFixed(1)}</td>
                  <td>
                    <span className={`pill pill--${row.status === 'HEALTHY' ? 'healthy' : row.status === 'WATCH' ? 'watch' : 'critical'}`}>{row.status}</span>
                  </td>
                  <td className={`num gross-margin ${row.grossMarginPct >= 35 ? 'gross-margin--strong' : ''}`}>
                    {row.grossMarginPct.toFixed(1)}%
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
