import {
  useMemo,
  useState,
} from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';

const axisStyle = { fill: '#94a3b8', fontSize: 11 };
const gridStroke = '#1e3a5f';

const COUNTRY_TARIFF_RATES = {
  China: 145,
  Vietnam: 46,
  Malaysia: 24,
  Mexico: 0,
  Germany: 10,
  Netherlands: 10,
  India: 26,
  Canada: 0,
};

const LOW_TARIFF_COUNTRIES = new Set(['Mexico', 'Canada', 'Germany', 'Netherlands']);

function formatUsd(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function riskPillClass(rate) {
  if (rate > 25) return 'pill pill--critical';
  if (rate >= 10) return 'pill pill--watch';
  return 'pill pill--healthy';
}

export function TradeRiskModule() {
  const { componentData, supplierData } = useDashboardData();
  const [filterMode, setFilterMode] = useState('all');
  const supplierCountryMap = new Map(supplierData.map((s) => [s.id, s.country]));
  const supplierNameMap = new Map(supplierData.map((s) => [s.id, s.name]));

  const tariffRows = componentData.map((c) => {
    const country = c.country || supplierCountryMap.get(c.supplierID) || 'Unknown';
    const tariffRate = COUNTRY_TARIFF_RATES[country] ?? c.tariffRate ?? 0;
    const annualSpend = c.extended;
    const dutyCost = annualSpend * (tariffRate / 100);
    const alternateAvailable = LOW_TARIFF_COUNTRIES.has(country) ? 'Yes' : 'No';
    const risk = tariffRate > 25 ? 'HIGH' : tariffRate >= 10 ? 'MEDIUM' : 'LOW';
    return {
      componentSku: c.sku,
      supplier: c.supplier || supplierNameMap.get(c.supplierID) || c.supplierID,
      country,
      tariffRate,
      annualSpend,
      dutyCost,
      alternateAvailable,
      risk,
    };
  });

  const filteredRows = useMemo(() => {
    if (filterMode === 'high') return tariffRows.filter((r) => r.tariffRate > 25);
    if (filterMode === 'no-alt') return tariffRows.filter((r) => r.alternateAvailable === 'No');
    return tariffRows;
  }, [filterMode, tariffRows]);

  const allCount = tariffRows.length;
  const highCount = tariffRows.filter((r) => r.tariffRate > 25).length;
  const noAltCount = tariffRows.filter((r) => r.alternateAvailable === 'No').length;

  const totalTariffExposedSpend = filteredRows
    .filter((r) => r.tariffRate > 0)
    .reduce((sum, r) => sum + r.annualSpend, 0);
  const highTariffCountries = new Set(
    filteredRows.filter((r) => r.tariffRate > 25).map((r) => r.country)
  );
  const suppliersInHighTariffCountries = supplierData.filter((s) =>
    highTariffCountries.has(s.country)
  ).length;
  const estimatedAnnualDutyImpact = filteredRows.reduce((sum, r) => sum + r.dutyCost, 0);
  const noLowTariffAlternativeCount = filteredRows.filter((r) => r.alternateAvailable === 'No').length;

  const dutyByCountry = Object.values(
    filteredRows.reduce((acc, row) => {
      if (!acc[row.country]) acc[row.country] = { country: row.country, dutyCost: 0 };
      acc[row.country].dutyCost += row.dutyCost;
      return acc;
    }, {})
  ).sort((a, b) => b.dutyCost - a.dutyCost);

  return (
    <div className="module-grid">
      <section className="panel panel--span3 inv-kpis">
        <div className="inv-kpi">
          <span className="inv-kpi__label">Tariff-exposed spend</span>
          <span className="inv-kpi__value">{formatUsd(totalTariffExposedSpend)}</span>
          <span className="inv-kpi__hint">Spend with non-zero tariff rates</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Suppliers in high-tariff countries</span>
          <span className="inv-kpi__value inv-kpi__value--warn">{suppliersInHighTariffCountries}</span>
          <span className="inv-kpi__hint">Countries above 25% tariff</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">Estimated annual duty impact</span>
          <span className="inv-kpi__value">{formatUsd(estimatedAnnualDutyImpact)}</span>
          <span className="inv-kpi__hint">Duty = annual spend × tariff rate</span>
        </div>
        <div className="inv-kpi">
          <span className="inv-kpi__label">No low-tariff alternative</span>
          <span className="inv-kpi__value inv-kpi__value--warn">{noLowTariffAlternativeCount}</span>
          <span className="inv-kpi__hint">Components not in low-tariff countries</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Duty exposure by country</h2>
          <span className="panel__meta">
            Estimated annual duty cost distribution · {filterMode === 'all' ? 'All components' : filterMode === 'high' ? 'High risk only' : 'No alternate'}
          </span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dutyByCountry} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="country" tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v) => formatUsd(v)}
              />
              <Tooltip
                formatter={(v) => [formatUsd(Number(v)), 'Estimated duty']}
                contentStyle={{ background: '#0f1f36', border: '1px solid #1e3a5f', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="dutyCost" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel panel--span2">
        <div className="panel__head">
          <h2>Tariff exposure detail</h2>
          <span className="panel__meta">Component-level duties and alternate country signals</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            type="button"
            className={`nav-btn ${filterMode === 'all' ? 'nav-btn--active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All ({allCount})
          </button>
          <button
            type="button"
            className={`nav-btn ${filterMode === 'high' ? 'nav-btn--active' : ''}`}
            onClick={() => setFilterMode('high')}
          >
            High risk only ({highCount})
          </button>
          <button
            type="button"
            className={`nav-btn ${filterMode === 'no-alt' ? 'nav-btn--active' : ''}`}
            onClick={() => setFilterMode('no-alt')}
          >
            No alternate ({noAltCount})
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component SKU</th>
                <th>Supplier</th>
                <th>Country</th>
                <th className="num">Tariff %</th>
                <th className="num">Annual spend</th>
                <th className="num">Estimated duty</th>
                <th>Alt country</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.componentSku}>
                  <td className="mono">{row.componentSku}</td>
                  <td>{row.supplier}</td>
                  <td>{row.country}</td>
                  <td className="num">{row.tariffRate}%</td>
                  <td className="num">{formatUsd(row.annualSpend)}</td>
                  <td className="num">{formatUsd(row.dutyCost)}</td>
                  <td>{row.alternateAvailable}</td>
                  <td>
                    <span className={riskPillClass(row.tariffRate)}>{row.risk}</span>
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
