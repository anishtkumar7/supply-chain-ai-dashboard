import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';
import { computeExecutiveSummary } from '../utils/executiveSummaryMetrics';
import { daysCoverFromWks } from '../utils/coverageDisplay';

function skuPillClass(status) {
  if (status === 'HEALTHY') return 'pill pill--healthy';
  if (status === 'WATCH') return 'pill pill--watch';
  return 'pill pill--critical';
}

export function ExecutiveCommandCenterModule() {
  const { skuData, shipmentData, supplierData, componentData, agentAlerts } = useDashboardData();
  const summary = computeExecutiveSummary({
    skuData,
    shipmentData,
    supplierData,
    componentData,
    agentAlerts,
  });
  const fillRate = (() => {
    const healthyCount = skuData.filter((s) => s.status === 'HEALTHY').length;
    const watchCount = skuData.filter((s) => s.status === 'WATCH').length;
    const criticalCount = skuData.filter((s) => s.status === 'CRITICAL').length;
    const total = skuData.length;
    if (!total) return 0;
    return parseFloat(
      (((healthyCount * 1.0) + (watchCount * 0.85) + (criticalCount * 0.40)) / total * 100).toFixed(1)
    );
  })();

  const {
    totalInventoryValue,
    totalInventoryValueFormatted,
    forecastAccuracy,
    shipmentsAtRisk,
    supplierRiskAlerts,
    plannedSpendFormatted,
    receiptsFormatted,
    spendDeltaFormatted,
    spendDeltaPositive,
    criticalPathSku,
    exceptionFeed,
  } = summary;

  const projectedPriorInventoryValue = skuData.reduce(
    (sum, sku) => sum + Math.max(0, sku.onHand - sku.committed) * sku.unitValue,
    0
  );
  const inventoryWowPct = projectedPriorInventoryValue
    ? ((totalInventoryValue - projectedPriorInventoryValue) / projectedPriorInventoryValue) * 100
    : 0;
  const sparklineData = skuData.map((sku) => ({
    sku: sku.sku,
    wksCover: sku.wksCover,
    bias: sku.forecastBias,
    status: sku.status,
  }));

  const statusDot = ({ cx, cy, payload }) => {
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    const st = payload?.status;
    const fill = st === 'HEALTHY' ? '#22c55e' : st === 'WATCH' ? '#f59e0b' : '#ef4444';
    return <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke="#0f172a" strokeWidth={1} />;
  };

  return (
    <div className="module-grid">
      <section className="panel panel--span3 inv-kpis">
        <div className="inv-kpi">
          <span className="inv-kpi__label">Total Inventory Value</span>
          <span className="inv-kpi__value">{totalInventoryValueFormatted}</span>
          <span className={`inv-kpi__hint ${inventoryWowPct >= 0 ? 'text-pos' : 'text-neg'}`}>
            {inventoryWowPct >= 0 ? '▲' : '▼'} {Math.abs(inventoryWowPct).toFixed(1)}% WoW
          </span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Overall Fill Rate</span>
          <span className="inv-kpi__value">{fillRate.toFixed(1)}%</span>
          <span className="inv-kpi__hint">Weighted average across all FG SKUs</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Shipments At Risk</span>
          <span className="inv-kpi__value inv-kpi__value--warn">{shipmentsAtRisk}</span>
          <span className="inv-kpi__hint">DELAYED + STUCK routes</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Supplier Risk Alerts</span>
          <span className="inv-kpi__value inv-kpi__value--warn">{supplierRiskAlerts}</span>
          <span className="inv-kpi__hint">MEDIUM + HIGH risk suppliers</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Forecast Accuracy</span>
          <span className="inv-kpi__value">{forecastAccuracy.toFixed(1)}%</span>
          <span className="inv-kpi__hint">100 - average absolute bias</span>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Coverage Trend Strip</h2>
          <span className="panel__meta">Compact sparkline · days cover by SKU (from wks × 7)</span>
        </div>
        <div className="chart-box chart-box--coverage-strip">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 4, right: 6, left: 6, bottom: 2 }}>
              <Tooltip
                formatter={(v, n) =>
                  n === 'wksCover'
                    ? [`${Math.round(Number(v) * 7)} days`, 'Days cover']
                    : [`${Number(v).toFixed(1)}%`, 'Forecast bias']
                }
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="wksCover" stroke="#22c55e" strokeWidth={2} dot={statusDot} />
              <Line type="monotone" dataKey="bias" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Inventory Health Summary</h2>
          <span className="panel__meta">Finished goods traffic light status</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th className="num">Days cover</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {skuData.map((sku) => (
                <tr key={sku.sku}>
                  <td className="mono">{sku.sku}</td>
                  <td className="num">{daysCoverFromWks(sku.wksCover)}</td>
                  <td>
                    <span className={skuPillClass(sku.status)}>{sku.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Active Exceptions Feed</h2>
          <span className="panel__meta">Top 5 urgent issues across modules</span>
        </div>
        <ul className="fact-list">
          {exceptionFeed.map((item) => (
            <li key={`${item.agent}-${item.lastRun}`}>
              <span className={`pill pill--${item.severity === 'CRITICAL' ? 'critical' : item.severity === 'HIGH' ? 'watch' : 'healthy'}`}>
                {item.severity}
              </span>
              <span className="fact-list__k">{item.module}</span>
              <span className="fact-list__v" style={{ textAlign: 'left', maxWidth: '100%' }}>
                {item.alert}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Forecast vs Plan Snapshot</h2>
          <span className="panel__meta">This week planned spend vs receipts</span>
        </div>
        <ul className="fact-list">
          <li>
            <span className="fact-list__k">Planned spend</span>
            <span className="fact-list__v">{plannedSpendFormatted}</span>
          </li>
          <li>
            <span className="fact-list__k">Actual receipts</span>
            <span className="fact-list__v">{receiptsFormatted}</span>
          </li>
          <li>
            <span className="fact-list__k">Variance</span>
            <span className={`fact-list__v ${spendDeltaPositive ? 'text-pos' : 'text-neg'}`}>
              {spendDeltaPositive ? '+' : '-'}
              {spendDeltaFormatted}
            </span>
          </li>
          <li>
            <span className="fact-list__k">Critical path SKU</span>
            <span className="fact-list__v mono">{criticalPathSku}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
