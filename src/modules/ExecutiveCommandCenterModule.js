import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';

function formatUsd(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function severityRank(severity) {
  if (severity === 'CRITICAL') return 3;
  if (severity === 'HIGH') return 2;
  if (severity === 'MEDIUM') return 1;
  return 0;
}

function skuPillClass(status) {
  if (status === 'HEALTHY') return 'pill pill--healthy';
  if (status === 'WATCH') return 'pill pill--watch';
  return 'pill pill--critical';
}

export function ExecutiveCommandCenterModule() {
  const { skuData, shipmentData, supplierData, componentData, agentAlerts } = useDashboardData();
  const totalInventoryValue = skuData.reduce((sum, sku) => sum + sku.onHand * sku.unitValue, 0);
  const avgBias = skuData.reduce((sum, sku) => sum + Math.abs(sku.forecastBias), 0) / skuData.length;
  const forecastAccuracy = Math.max(0, 100 - avgBias);
  const shipmentsAtRisk = shipmentData.filter((s) => s.status === 'DELAYED' || s.status === 'STUCK').length;
  const supplierRiskAlerts = supplierData.filter((s) => s.risk === 'MEDIUM' || s.risk === 'HIGH').length;
  const onTimeShipments = shipmentData.filter((s) => s.status === 'ON TIME').length;
  const fillRate = (onTimeShipments / shipmentData.length) * 100;
  const historicalOnTime = supplierData.reduce((sum, s) => sum + s.onTimeCount, 0);
  const historicalTotal = supplierData.reduce((sum, s) => sum + s.onTimeCount + s.delayedCount + s.stuckCount, 0);
  const baselineFillRate = historicalTotal ? (historicalOnTime / historicalTotal) * 100 : fillRate;

  const projectedPriorInventoryValue = skuData.reduce(
    (sum, sku) => sum + Math.max(0, sku.onHand - sku.committed) * sku.unitValue,
    0
  );
  const inventoryWowPct = projectedPriorInventoryValue
    ? ((totalInventoryValue - projectedPriorInventoryValue) / projectedPriorInventoryValue) * 100
    : 0;

  const fillRateTrend = fillRate >= baselineFillRate ? 'up' : 'down';

  const plannedSpend = componentData.reduce((sum, c) => sum + c.netNeed * c.unitCost, 0);
  const receipts = componentData.reduce((sum, c) => sum + Math.min(c.onHand, c.netNeed) * c.unitCost, 0);
  const spendDelta = receipts - plannedSpend;

  const criticalPathSku = [...skuData].sort((a, b) => a.wksCover - b.wksCover)[0];

  const exceptionFeed = [...agentAlerts]
    .filter((a) => a.status === 'ALERT' && a.alert)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);
  const sparklineData = skuData.map((sku) => ({
    sku: sku.sku,
    wksCover: sku.wksCover,
    bias: sku.forecastBias,
    status: sku.status,
  }));

  const statusDot = ({ cx, cy, payload }) => {
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    const fill =
      payload?.status === 'HEALTHY' ? '#22c55e' : payload?.status === 'WATCH' ? '#f59e0b' : '#ef4444';
    return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="#0f172a" strokeWidth={1} />;
  };

  return (
    <div className="module-grid">
      <section className="panel panel--span3 inv-kpis">
        <div className="inv-kpi">
          <span className="inv-kpi__label">Total Inventory Value</span>
          <span className="inv-kpi__value">{formatUsd(totalInventoryValue)}</span>
          <span className={`inv-kpi__hint ${inventoryWowPct >= 0 ? 'text-pos' : 'text-neg'}`}>
            {inventoryWowPct >= 0 ? '▲' : '▼'} {Math.abs(inventoryWowPct).toFixed(1)}% WoW
          </span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Overall Fill Rate</span>
          <span className="inv-kpi__value">{fillRate.toFixed(1)}%</span>
          <span className={`inv-kpi__hint ${fillRateTrend === 'up' ? 'text-pos' : 'text-neg'}`}>
            {fillRateTrend === 'up' ? '▲ Improving' : '▼ Declining'}
          </span>
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
          <span className="panel__meta">Compact sparkline · weeks cover by SKU</span>
        </div>
        <div className="chart-box chart-box--short">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 6, right: 8, left: 8, bottom: 2 }}>
              <Tooltip
                formatter={(v, n) => [n === 'wksCover' ? `${Number(v).toFixed(2)} weeks` : `${Number(v).toFixed(1)}%`, n === 'wksCover' ? 'Weeks cover' : 'Forecast bias']}
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
                <th className="num">Wks cover</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {skuData.map((sku) => (
                <tr key={sku.sku}>
                  <td className="mono">{sku.sku}</td>
                  <td className="num">{sku.wksCover.toFixed(2)}</td>
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
            <span className="fact-list__v">{formatUsd(plannedSpend)}</span>
          </li>
          <li>
            <span className="fact-list__k">Actual receipts</span>
            <span className="fact-list__v">{formatUsd(receipts)}</span>
          </li>
          <li>
            <span className="fact-list__k">Variance</span>
            <span className={`fact-list__v ${spendDelta >= 0 ? 'text-pos' : 'text-neg'}`}>
              {spendDelta >= 0 ? '+' : '-'}
              {formatUsd(Math.abs(spendDelta))}
            </span>
          </li>
          <li>
            <span className="fact-list__k">Critical path SKU</span>
            <span className="fact-list__v mono">{criticalPathSku.sku}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
