import { computeExecutiveSummary } from '../utils/executiveSummaryMetrics';
import { RIVIT_PDF_CONFIDENTIAL_FOOTER } from '../constants/branding';

export function ExecutivePdfPrintView({
  skuData,
  shipmentData,
  supplierData,
  componentData,
  agentAlerts,
  preparedForName,
  preparedForRole,
  generatedAtLabel,
}) {
  const m = computeExecutiveSummary({
    skuData,
    shipmentData,
    supplierData,
    componentData,
    agentAlerts,
  });

  return (
    <div className="exec-pdf">
      <header className="exec-pdf__masthead">
        <h1 className="exec-pdf__title">RIVIT — Vectrum Manufacturing executive summary</h1>
        <p className="exec-pdf__subtitle">North America Hub · Manufacturing Operations Intelligence Platform</p>
        <div className="exec-pdf__meta-grid">
          <p>
            <strong>Generated:</strong> {generatedAtLabel}
          </p>
          <p>
            <strong>Prepared for:</strong> {preparedForName} · {preparedForRole}
          </p>
        </div>
      </header>

      <section className="exec-pdf__section">
        <h2 className="exec-pdf__section-title">Section 1 — KPI summary</h2>
        <table className="exec-pdf__table">
          <thead>
            <tr>
              <th>Metric</th>
              <th className="exec-pdf__num">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total inventory value</td>
              <td className="exec-pdf__num">{m.totalInventoryValueFormatted}</td>
            </tr>
            <tr>
              <td>Fill rate</td>
              <td className="exec-pdf__num">{m.fillRate.toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Shipments at risk</td>
              <td className="exec-pdf__num">{m.shipmentsAtRisk}</td>
            </tr>
            <tr>
              <td>Supplier risk alerts</td>
              <td className="exec-pdf__num">{m.supplierRiskAlerts}</td>
            </tr>
            <tr>
              <td>Forecast accuracy</td>
              <td className="exec-pdf__num">{m.forecastAccuracy.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="exec-pdf__section">
        <h2 className="exec-pdf__section-title">Section 2 — Inventory health (finished goods)</h2>
        <table className="exec-pdf__table exec-pdf__table--dense">
          <thead>
            <tr>
              <th>SKU</th>
              <th className="exec-pdf__num">Days cover</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {m.inventoryRows.map((row) => (
              <tr key={row.sku}>
                <td className="exec-pdf__mono">{row.sku}</td>
                <td className="exec-pdf__num">{row.daysCover}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="exec-pdf__section">
        <h2 className="exec-pdf__section-title">Section 3 — Active exceptions (top 5)</h2>
        <ul className="exec-pdf__alert-ul">
          {m.exceptionFeed.length === 0 && (
            <li className="exec-pdf__alert-text">No active alerts in the current exceptions feed.</li>
          )}
          {m.exceptionFeed.map((item, idx) => (
            <li key={`${item.agent}-${item.module}-${idx}`}>
              <span className="exec-pdf__alert-sev">{item.severity}</span>
              <span className="exec-pdf__alert-mod">{item.module}</span>
              <span className="exec-pdf__alert-text">{item.alert}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="exec-pdf__section exec-pdf__section--last">
        <h2 className="exec-pdf__section-title">Section 4 — Forecast vs plan (this week)</h2>
        <p className="exec-pdf__lede">Planned spend vs receipts (component-level snapshot).</p>
        <table className="exec-pdf__table">
          <tbody>
            <tr>
              <th scope="row">Planned spend</th>
              <td className="exec-pdf__num">{m.plannedSpendFormatted}</td>
            </tr>
            <tr>
              <th scope="row">Receipts</th>
              <td className="exec-pdf__num">{m.receiptsFormatted}</td>
            </tr>
            <tr>
              <th scope="row">Variance (receipts - planned)</th>
              <td className="exec-pdf__num">
                {m.spendDeltaPositive ? '+' : '-'}
                {m.spendDeltaFormatted}
              </td>
            </tr>
            <tr>
              <th scope="row">Critical path SKU (lowest days cover)</th>
              <td className="exec-pdf__mono exec-pdf__num">{m.criticalPathSku}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="exec-pdf__footer exec-pdf__footer--compact">
        <p className="exec-pdf__footer-line">{RIVIT_PDF_CONFIDENTIAL_FOOTER}</p>
      </footer>
    </div>
  );
}
