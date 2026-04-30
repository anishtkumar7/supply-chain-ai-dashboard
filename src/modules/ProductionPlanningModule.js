export function ProductionPlanningModule() {
  return (
    <div className="module-grid">
      <section className="panel panel--span3">
        <div className="panel__head">
          <h2>Production Planning</h2>
          <span className="panel__meta">Vectrum MFG · work orders &amp; BOM</span>
        </div>
        <div className="coming-soon-panel" role="status" aria-label="Module coming soon">
          <span className="coming-soon-panel__badge">Upcoming</span>
          <h3>Coming soon</h3>
          <p>Production plans, work order orchestration, and line-level capacity will open here; use Supply Planning and
            inventory from the sidebar in the meantime.</p>
        </div>
      </section>
    </div>
  );
}
