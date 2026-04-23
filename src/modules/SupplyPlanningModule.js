import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { procurementTimeline, supplyPlanningRows } from '../data/sampleData';

const axisStyle = { fill: '#94a3b8', fontSize: 11 };
const gridStroke = '#1e3a5f';

/** On-hand cannot cover exploded net need before the next receipt cycle */
function isShortOnSupply(row) {
  return row.onHand < row.netNeed;
}

export function SupplyPlanningModule() {
  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Procurement execution vs. plan</h2>
          <span className="panel__meta">USD · component buys (MRP run Apr 18)</span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={procurementTimeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="week" tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, '']}
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="plannedSpend" name="Planned spend" stroke="#22c55e" strokeWidth={2.5} dot />
              <Line type="monotone" dataKey="receipts" name="Receipts" stroke="#38bdf8" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Exploded requirements & reorder</h2>
          <span className="panel__meta">Net need from FG forecast explosion · suggested PO dates</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component SKU</th>
                <th>Drives FG</th>
                <th className="num">MOQ</th>
                <th className="num">EOQ</th>
                <th className="num">On hand</th>
                <th className="num col-ldd">LDD</th>
                <th className="num">Net need</th>
                <th>Reorder by</th>
                <th>Primary supplier</th>
              </tr>
            </thead>
            <tbody>
              {supplyPlanningRows.map((row) => (
                <tr
                  key={row.component}
                  className={isShortOnSupply(row) ? 'data-table__row--shortage' : undefined}
                  title={isShortOnSupply(row) ? 'Projected short: on-hand is below net requirement' : undefined}
                >
                  <td className="mono">{row.component}</td>
                  <td className="mono">{row.parentSku}</td>
                  <td className="num">{row.moq.toLocaleString()}</td>
                  <td className="num">{row.eoq.toLocaleString()}</td>
                  <td className="num">{row.onHand.toLocaleString()}</td>
                  <td className="mono num col-ldd">{row.ldd}</td>
                  <td className="num">{row.netNeed.toLocaleString()}</td>
                  <td className="mono">{row.reorderDate}</td>
                  <td>{row.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--span3 kpis">
        <div className="kpi">
          <span className="kpi__label">Planner service level target</span>
          <span className="kpi__value">97.5%</span>
          <span className="kpi__hint">Rolling 12 weeks</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Open PO lines (components)</span>
          <span className="kpi__value">186</span>
          <span className="kpi__hint">$4.2M open value</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Critical path SKU</span>
          <span className="kpi__value kpi__value--mono">FG-HVAC-88</span>
          <span className="kpi__hint">Compressor lead 9 wks</span>
        </div>
      </section>
    </div>
  );
}
