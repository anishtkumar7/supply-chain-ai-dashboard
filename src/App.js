import { useState, useMemo, useCallback } from 'react';
import './App.css';
import { navItems, inventoryNavGroup, inventoryNavIds } from './data/sampleData';
import { InventoryModule } from './modules/InventoryModule';
import { SupplierModule } from './modules/SupplierModule';
import { FulfillmentModule } from './modules/FulfillmentModule';
import { DemandForecastModule } from './modules/DemandForecastModule';
import { SupplyPlanningModule } from './modules/SupplyPlanningModule';

const views = {
  suppliers: SupplierModule,
  fulfillment: FulfillmentModule,
  demand: DemandForecastModule,
  planning: SupplyPlanningModule,
};

function isInventoryActive(id) {
  return id === inventoryNavIds.fg || id === inventoryNavIds.components;
}

function App() {
  const [active, setActive] = useState(inventoryNavIds.fg);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(true);

  const ActiveView = useMemo(() => {
    if (active === inventoryNavIds.fg) return () => <InventoryModule variant="fg" />;
    if (active === inventoryNavIds.components) return () => <InventoryModule variant="components" />;
    const Comp = views[active];
    return Comp ? () => <Comp /> : () => <InventoryModule variant="fg" />;
  }, [active]);

  const selectInventoryChild = useCallback((id) => {
    setActive(id);
    setInventoryOpen(true);
  }, []);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden />
          {!sidebarCollapsed && <span className="sidebar__title">SC Control</span>}
        </div>
        <nav className="sidebar__nav">
          {!sidebarCollapsed ? (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group__header ${isInventoryActive(active) ? 'nav-group__header--active' : ''}`}
                onClick={() => setInventoryOpen((o) => !o)}
                aria-expanded={inventoryOpen}
              >
                <span>{inventoryNavGroup.label}</span>
                <span className="nav-group__chev" aria-hidden>
                  {inventoryOpen ? '▾' : '▸'}
                </span>
              </button>
              {inventoryOpen && (
                <div className="nav-group__subs">
                  {inventoryNavGroup.children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className={`nav-sub ${active === child.id ? 'nav-sub--active' : ''}`}
                      onClick={() => selectInventoryChild(child.id)}
                    >
                      <span className="nav-sub__bar" aria-hidden />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="nav-group nav-group--collapsed-icons">
              {inventoryNavGroup.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={`nav-btn nav-btn--compact ${active === child.id ? 'nav-btn--active' : ''}`}
                  onClick={() => selectInventoryChild(child.id)}
                  title={child.label}
                >
                  <span className="nav-btn__text">{child.shortLabel}</span>
                </button>
              ))}
            </div>
          )}

          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${active === item.id ? 'nav-btn--active' : ''}`}
              onClick={() => setActive(item.id)}
              title={item.label}
            >
              <span className="nav-btn__dot" aria-hidden />
              <span className="nav-btn__text">{sidebarCollapsed ? item.shortLabel : item.label}</span>
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="sidebar__collapse"
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? '→' : '← Collapse'}
        </button>
      </aside>

      <div className="app-main">
        <header className="top-header">
          <div>
            <h1 className="top-header__title">Supply Chain Dashboard</h1>
            <p className="top-header__sub">North America hub · live sample dataset</p>
          </div>
          <div className="top-header__tags">
            <span className="tag">MRP nightly</span>
            <span className="tag tag--accent">AI assist on</span>
          </div>
        </header>

        <main className="content">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}

export default App;
