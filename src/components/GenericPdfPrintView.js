import { RIVIT_PDF_CONFIDENTIAL_FOOTER } from '../constants/branding';

/**
 * Generic light-theme print report: title block + optional filter line + data table.
 */
export function GenericPdfPrintView({
  documentTitle,
  subtitle,
  generatedAtLabel,
  preparedForName,
  preparedForRole,
  filterLine,
  rows,
}) {
  const keys = rows?.length ? Object.keys(rows[0]) : [];

  return (
    <div className="exec-pdf">
      <header className="exec-pdf__masthead">
        <h1 className="exec-pdf__title">{documentTitle}</h1>
        {subtitle ? <p className="exec-pdf__subtitle">{subtitle}</p> : null}
        <div className="exec-pdf__meta-grid">
          <p>
            <strong>Generated:</strong> {generatedAtLabel}
          </p>
          <p>
            <strong>Prepared for:</strong> {preparedForName} · {preparedForRole}
          </p>
          {filterLine ? (
            <p>
              <strong>Filters:</strong> {filterLine}
            </p>
          ) : null}
        </div>
      </header>

      <section className="exec-pdf__section exec-pdf__section--inventory">
        <table className="exec-pdf__table exec-pdf__table--dense">
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((row, idx) => (
                <tr key={idx}>
                  {keys.map((k) => (
                    <td key={k}>{row[k] ?? ''}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(keys.length, 1)}>No rows to display.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="exec-pdf__footer exec-pdf__footer--compact">
        <p className="exec-pdf__footer-line">{RIVIT_PDF_CONFIDENTIAL_FOOTER}</p>
      </footer>
    </div>
  );
}
