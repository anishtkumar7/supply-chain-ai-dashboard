import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';

const axisStyle = { fill: '#94a3b8', fontSize: 11 };
const gridStroke = '#1e3a5f';

export function DemandForecastModule() {
  const { skuData } = useDashboardData();
  const demandForecastSeries = [
    { month: 'Jan', actual: 118000, forecast: 115000, confidenceLow: 108000, confidenceHigh: 122000 },
    { month: 'Feb', actual: 122400, forecast: 120500, confidenceLow: 113000, confidenceHigh: 128000 },
    { month: 'Mar', actual: 126800, forecast: 124200, confidenceLow: 117000, confidenceHigh: 131000 },
    { month: 'Apr', actual: null, forecast: 128900, confidenceLow: 121000, confidenceHigh: 136000 },
    { month: 'May', actual: null, forecast: 131200, confidenceLow: 123000, confidenceHigh: 139000 },
    { month: 'Jun', actual: null, forecast: 133500, confidenceLow: 125000, confidenceHigh: 142000 },
  ];
  const skuDemandDetail = skuData.map((s) => ({
    sku: s.sku,
    family: s.family,
    next90d: s.forecastNext90,
    biasPct: s.forecastBias,
    seasonality: s.seasonalityNote,
  }));

  return (
    <div className="module-grid">
      <section className="panel panel--span2">
        <div className="panel__head">
          <h2>Finished goods demand — baseline forecast</h2>
          <span className="panel__meta">Units sold (000s) · ML blend + planner overrides</span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={demandForecastSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value, name) => [value != null ? `${(value / 1000).toFixed(1)}k units` : '—', name]}
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Line
                type="monotone"
                dataKey="confidenceHigh"
                name="P80 upper"
                stroke="#166534"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="confidenceLow"
                name="P20 lower"
                stroke="#166534"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="actual" name="Actuals" stroke="#38bdf8" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>SKU-level next 90 days</h2>
          <span className="panel__meta">Demand bias vs. prior cycle</span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skuDemandDetail} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="sku" width={108} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${(value / 1000).toFixed(1)}k units`, 'Next 90d']}
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
              />
              <Bar dataKey="next90d" name="Next 90d" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Forecast detail by SKU</h2>
          <span className="panel__meta">Bias = (forecast − naive) / naive</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Family</th>
                <th className="num">Next 90d (units)</th>
                <th className="num">Bias %</th>
                <th>Seasonality note</th>
              </tr>
            </thead>
            <tbody>
              {skuDemandDetail.map((row) => (
                <tr key={row.sku}>
                  <td className="mono">{row.sku}</td>
                  <td>{row.family}</td>
                  <td className="num">{row.next90d.toLocaleString()}</td>
                  <td className={`num ${row.biasPct >= 0 ? 'text-pos' : 'text-neg'}`}>
                    {row.biasPct > 0 ? '+' : ''}
                    {row.biasPct.toFixed(1)}%
                  </td>
                  <td>{row.seasonality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
