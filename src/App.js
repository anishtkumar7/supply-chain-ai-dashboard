import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { InventoryModule } from './modules/InventoryModule';
import { SupplierModule } from './modules/SupplierModule';
import { FulfillmentModule } from './modules/FulfillmentModule';
import { DemandForecastModule } from './modules/DemandForecastModule';
import { SupplyPlanningModule } from './modules/SupplyPlanningModule';
import { OrderBankModule } from './modules/OrderBankModule';
import { ExecutiveCommandCenterModule } from './modules/ExecutiveCommandCenterModule';
import { AIAgentsModule } from './modules/AIAgentsModule';
import { CustomerOrdersModule } from './modules/CustomerOrdersModule';
import { TradeRiskModule } from './modules/TradeRiskModule';
import { DataSyncModule } from './modules/DataSyncModule';
import { useDashboardData } from './context/DashboardDataContext';
import { exportForActiveView } from './utils/exportUtils';

const topNavItems = [
  { id: 'executive', label: 'Executive Command Center', shortLabel: 'Exec' },
  { id: 'orderbank', label: 'Order Bank', shortLabel: 'Orders' },
  { id: 'customer-orders', label: 'Customer Orders', shortLabel: 'Cust' },
];

const navItems = [
  { id: 'suppliers', label: 'Supplier Tracking', shortLabel: 'Suppliers' },
  { id: 'trade-risk', label: 'Trade Risk', shortLabel: 'Trade' },
  { id: 'fulfillment', label: 'Fulfillment Monitoring', shortLabel: 'Fulfillment' },
  { id: 'demand', label: 'Demand Forecasting', shortLabel: 'Demand' },
  { id: 'planning', label: 'Supply Planning', shortLabel: 'Planning' },
  { id: 'agents', label: 'AI Agents', shortLabel: 'Agents' },
  { id: 'data-sync', label: 'Data Sync', shortLabel: 'Sync' },
];

const inventoryNavIds = {
  fg: 'inventory-fg',
  components: 'inventory-components',
};

const inventoryNavGroup = {
  label: 'Inventory Monitoring',
  shortLabel: 'Inventory',
  children: [
    { id: inventoryNavIds.fg, label: 'Finished goods', shortLabel: 'FG' },
    { id: inventoryNavIds.components, label: 'Components (Class A)', shortLabel: 'Class A' },
  ],
};

const views = {
  executive: ExecutiveCommandCenterModule,
  orderBank: OrderBankModule,
  customerOrders: CustomerOrdersModule,
  suppliers: SupplierModule,
  tradeRisk: TradeRiskModule,
  fulfillment: FulfillmentModule,
  demand: DemandForecastModule,
  planning: SupplyPlanningModule,
  agents: AIAgentsModule,
  dataSync: DataSyncModule,
};

function isInventoryActive(id) {
  return id === inventoryNavIds.fg || id === inventoryNavIds.components;
}

function activeToModuleId(active) {
  if (active === inventoryNavIds.fg) return 'inventory-fg';
  if (active === inventoryNavIds.components) return 'inventory-components';
  const m = {
    executive: 'executive',
    orderbank: 'orderbank',
    'customer-orders': 'customer-orders',
    suppliers: 'suppliers',
    'trade-risk': 'trade-risk',
    fulfillment: 'fulfillment',
    demand: 'demand',
    planning: 'planning',
    agents: 'agents',
    'data-sync': 'data-sync',
  };
  return m[active] || 'executive';
}

function UnsavedMark({ on }) {
  if (!on) return null;
  return (
    <span style={{ color: '#fb923c', fontSize: 9, marginLeft: 4, verticalAlign: 'super' }} title="Unsaved changes" aria-label="Unsaved">●</span>
  );
}

export default function App() {
  const [active, setActive] = useState('executive');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  const {
    skuData,
    componentData,
    supplierData,
    shipmentData,
    orderHistory,
    customerOrderData,
    agentAlerts,
    isModuleDirty,
    saveAllChanges,
  } = useDashboardData();

  const dataBundle = useMemo(
    () => ({
      skuData,
      componentData,
      supplierData,
      shipmentData,
      orderHistory,
      customerOrderData,
      agentAlerts,
    }),
    [skuData, componentData, supplierData, shipmentData, orderHistory, customerOrderData, agentAlerts]
  );

  const activeModuleId = useMemo(() => activeToModuleId(active), [active]);
  const hasUnsaved = isModuleDirty(activeModuleId);

  useEffect(() => {
    const close = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doExport = useCallback(
    (format) => {
      exportForActiveView(active, dataBundle, format);
      setExportOpen(false);
    },
    [active, dataBundle]
  );

  const ActiveView = useMemo(() => {
    if (active === 'executive') return () => <ExecutiveCommandCenterModule />;
    if (active === 'orderbank') return () => <OrderBankModule />;
    if (active === 'customer-orders') return () => <CustomerOrdersModule />;
    if (active === 'trade-risk') return () => <TradeRiskModule />;
    if (active === 'data-sync') return () => <DataSyncModule />;
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
          {topNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${active === item.id ? 'nav-btn--active' : ''}`}
              onClick={() => setActive(item.id)}
              title={item.label}
            >
              <span className="nav-btn__dot" aria-hidden />
              <span className="nav-btn__text">
                {sidebarCollapsed ? item.shortLabel : item.label}
                <UnsavedMark on={isModuleDirty(activeToModuleId(item.id))} />
              </span>
            </button>
          ))}

          {!sidebarCollapsed ? (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group__header ${isInventoryActive(active) ? 'nav-group__header--active' : ''}`}
                onClick={() => setInventoryOpen((o) => !o)}
                aria-expanded={inventoryOpen}
              >
                <span>
                  {inventoryNavGroup.label}
                  {(isModuleDirty('inventory-fg') || isModuleDirty('inventory-components')) && (
                    <span style={{ color: '#fb923c' }}> ●</span>
                  )}
                </span>
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
                      <UnsavedMark on={isModuleDirty(child.id)} />
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
              <span className="nav-btn__text">
                {sidebarCollapsed ? item.shortLabel : item.label}
                <UnsavedMark on={isModuleDirty(activeToModuleId(item.id))} />
              </span>
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
            <h1 className="top-header__title">
              Supply Chain Dashboard
              {hasUnsaved && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginLeft: 12,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    verticalAlign: 'middle',
                    background: 'rgba(234, 88, 12, 0.2)',
                    color: '#fb923c',
                    border: '1px solid rgba(251, 146, 60, 0.4)',
                  }}
                >
                  Unsaved changes
                </span>
              )}
            </h1>
            <p className="top-header__sub">North America hub · live sample dataset</p>
          </div>
          <div
            className="top-header__tags"
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
          >
            <span className="tag">MRP nightly</span>
            <span className="tag tag--accent">AI assist on</span>
            {hasUnsaved && (
              <button type="button" className="tag" style={{ border: '1px solid #fb923c', color: '#fb923c' }} onClick={saveAllChanges}>
                Save changes
              </button>
            )}
            <div ref={exportRef} style={{ position: 'relative' }}>
              <button type="button" className="tag" onClick={() => setExportOpen((o) => !o)} style={{ cursor: 'pointer' }} aria-haspopup>
                Export ▾
              </button>
              {exportOpen && (
                <ul
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    margin: '4px 0 0 0',
                    padding: 8,
                    listStyle: 'none',
                    background: '#0f172a',
                    border: '1px solid #1e3a5f',
                    borderRadius: 8,
                    zIndex: 20,
                    minWidth: 160,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                  }}
                >
                  <li>
                    <button
                      type="button"
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e2e8f0', padding: 6, cursor: 'pointer' }}
                      onClick={() => doExport('csv')}
                    >Export as CSV
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e2e8f0', padding: 6, cursor: 'pointer' }}
                      onClick={() => doExport('xlsx')}
                    >Export as Excel
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
