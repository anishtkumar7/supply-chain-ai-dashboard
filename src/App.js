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
import { PartsInventoryModule } from './modules/PartsInventoryModule';
import { ProductionPlanningModule } from './modules/ProductionPlanningModule';
import { PurchaseOrdersModule } from './modules/PurchaseOrdersModule';
import { ContactsModule } from './modules/ContactsModule';
import { ReceivingModule } from './modules/ReceivingModule';
import { ShopFloorModule } from './modules/ShopFloorModule';
import { useDashboardData } from './context/DashboardDataContext';
import { exportForActiveView } from './utils/exportUtils';
import { inventoryNavGroup, inventoryNavIds } from './config/navRegistry';
import {
  getRoleConfig,
  getNavMeta,
  invChildrenForKeys,
  PRODUCTION_PLANNING_ID,
  PURCHASE_ORDERS_ID,
  CONTACTS_ID,
  RECEIVING_ID,
  SHOP_FLOOR_ID,
} from './config/roleNavConfig';
import { RoleLogin } from './components/RoleLogin';
import { GlobalCommunicationsHub } from './components/GlobalCommunicationsHub';
import { EmailComposeModal } from './components/EmailComposeModal';

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

function activeToModuleId(active) {
  if (active === inventoryNavIds.fg) return 'inventory-fg';
  if (active === inventoryNavIds.components) return 'inventory-components';
  if (active === inventoryNavIds.parts) return 'inventory-parts';
  if (active === PRODUCTION_PLANNING_ID) return 'production-planning';
  if (active === PURCHASE_ORDERS_ID) return 'purchase-orders';
  if (active === CONTACTS_ID) return 'contacts';
  if (active === RECEIVING_ID) return 'receiving';
  if (active === SHOP_FLOOR_ID) return 'shop-floor';
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

function isInventoryGroupActiveForChildren(active, children) {
  return children.some((c) => active === c.id);
}

function allInventoryChildIdsForRole(segments) {
  const ids = [];
  for (const s of segments) {
    if (s.type === 'inventory') {
      const ch = invChildrenForKeys(s.keys);
      ch.forEach((c) => ids.push(c.id));
    }
  }
  return new Set(ids);
}

function UnsavedMark({ on }) {
  if (!on) return null;
  return (
    <span style={{ color: '#fb923c', fontSize: 9, marginLeft: 4, verticalAlign: 'super' }} title="Unsaved changes" aria-label="Unsaved">●</span>
  );
}

function moduleLabelToMeta(label) {
  const m = {
    Inventory: { moduleId: inventoryNavIds.fg, category: 'inventory' },
    'Inventory Monitoring': { moduleId: inventoryNavIds.fg, category: 'inventory' },
    'Purchase Orders': { moduleId: PURCHASE_ORDERS_ID, category: 'purchase' },
    Fulfillment: { moduleId: 'fulfillment', category: 'fulfillment' },
    'Fulfillment Monitoring': { moduleId: 'fulfillment', category: 'fulfillment' },
    'Supplier Tracking': { moduleId: 'suppliers', category: 'supplier' },
    'Customer Orders': { moduleId: 'customer-orders', category: 'customer' },
    'Demand Forecasting': { moduleId: 'demand', category: 'demand' },
    'Trade Risk': { moduleId: 'trade-risk', category: 'trade' },
    'Supply Planning': { moduleId: 'planning', category: 'planning' },
    'Order Bank': { moduleId: 'orderbank', category: 'customer' },
  };
  return m[label] || { moduleId: 'executive', category: 'info' };
}

function allowedCategoriesForRole(roleId) {
  if (roleId === 'admin' || roleId === 'management') return null;
  if (roleId === 'material-coordinator') return new Set(['inventory']);
  if (roleId === 'buyer-planner') return new Set(['purchase', 'supplier', 'inventory', 'demand']);
  if (roleId === 'warehouse') return new Set(['fulfillment']);
  if (roleId === 'mfg-engineer') return new Set(['planning', 'inventory']);
  if (roleId === 'shop-supervisor') return new Set(['inventory', 'fulfillment']);
  return null;
}

function defaultNotificationsFromAgents(agentAlerts) {
  return agentAlerts
    .filter((a) => a.alert)
    .map((a, idx) => {
      const meta = moduleLabelToMeta(a.module);
      return {
        id: `agent-${idx}-${a.agent}`,
        severity: a.severity || 'INFO',
        title: a.agent,
        body: a.alert,
        moduleLabel: a.module,
        moduleId: meta.moduleId,
        category: meta.category,
        timeAgo: a.lastRun || 'just now',
        read: false,
      };
    });
}

function DashboardApp({ name, roleId, onSwitchRole }) {
  const role = getRoleConfig(roleId);
  const { segments, label: roleLabel, defaultActive } = role;
  const invIdSet = useMemo(() => allInventoryChildIdsForRole(segments), [segments]);
  const [active, setActive] = useState(() => defaultActive);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [planningOpen, setPlanningOpen] = useState(true);
  const [fulfillmentOpen, setFulfillmentOpen] = useState(true);
  const [commsOpen, setCommsOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const notificationsPanelRef = useRef(null);

  const {
    skuData,
    componentData,
    supplierData,
    shipmentData,
    orderHistory,
    customerOrderData,
    agentAlerts,
    contactDirectory,
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
  const displayName = (name && name.trim()) || 'User';
  const welcome = `Welcome back, ${displayName} · ${roleLabel}`;

  const [notifications, setNotifications] = useState(() => {
    const seeded = [
      ...defaultNotificationsFromAgents(agentAlerts),
      { id: 'n1', severity: 'CRITICAL', title: 'FG-R450-CO Stock Critical', body: '0.6 weeks cover remaining. No inbound confirmed.', moduleLabel: 'Inventory', moduleId: inventoryNavIds.fg, category: 'inventory', timeAgo: '4 min ago', read: false },
      { id: 'n2', severity: 'CRITICAL', title: 'Wiring Harness PO Overdue', body: 'PO-2026-0036 past due date. Chennai Cable not acknowledged.', moduleLabel: 'Purchase Orders', moduleId: PURCHASE_ORDERS_ID, category: 'purchase', timeAgo: '12 min ago', read: false },
      { id: 'n3', severity: 'HIGH', title: 'Shipment SHP-30531 Stuck', body: 'CN Rail mechanical issue. Toronto yard. 48hr delay.', moduleLabel: 'Fulfillment', moduleId: 'fulfillment', category: 'fulfillment', timeAgo: '2 min ago', read: false },
      { id: 'n4', severity: 'HIGH', title: 'Shenzhen Supplier Risk', body: 'OTIF dropped to 94.2%. 3 stuck shipments. Battery packs at 14 days.', moduleLabel: 'Supplier Tracking', moduleId: 'suppliers', category: 'supplier', timeAgo: '6 min ago', read: false },
      { id: 'n5', severity: 'HIGH', title: 'Detroit Metro Transit Order at Risk', body: 'CO-8827 due May 5. Only 3 units available, need 8.', moduleLabel: 'Customer Orders', moduleId: 'customer-orders', category: 'customer', timeAgo: '8 min ago', read: false },
      { id: 'n6', severity: 'MEDIUM', title: 'FG-M550-MD Forecast Bias', body: 'Plus 3.8% bias for 3 consecutive weeks.', moduleLabel: 'Demand Forecasting', moduleId: 'demand', category: 'demand', timeAgo: '1 hr ago', read: false },
      { id: 'n7', severity: 'MEDIUM', title: 'Tariff Exposure Alert', body: 'CMP-BAT-009 exposed to 145% China tariff. $16.4M PO at risk.', moduleLabel: 'Trade Risk', moduleId: 'trade-risk', category: 'trade', timeAgo: '2 hrs ago', read: false },
      { id: 'n8', severity: 'INFO', title: 'MRP Run Complete', body: 'Nightly MRP completed successfully. 10 reorder suggestions generated.', moduleLabel: 'Supply Planning', moduleId: 'planning', category: 'planning', timeAgo: '6 hrs ago', read: false },
    ];
    return seeded;
  });

  useEffect(() => {
    const generated = defaultNotificationsFromAgents(agentAlerts);
    setNotifications((prev) => {
      const existing = new Set(prev.map((n) => `${n.title}|${n.body}`));
      const fresh = generated.filter((n) => !existing.has(`${n.title}|${n.body}`));
      if (!fresh.length) return prev;
      return [...fresh, ...prev];
    });
  }, [agentAlerts]);

  const allowedCats = useMemo(() => allowedCategoriesForRole(roleId), [roleId]);
  const visibleNotifications = useMemo(
    () => (allowedCats ? notifications.filter((n) => allowedCats.has(n.category)) : notifications),
    [allowedCats, notifications]
  );
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (invIdSet.has(active)) {
      setInventoryOpen(true);
    }
  }, [active, invIdSet]);

  useEffect(() => {
    const close = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const close = (e) => {
      if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notificationsOpen]);

  const doExport = useCallback(
    (format) => {
      exportForActiveView(active, dataBundle, format);
      setExportOpen(false);
    },
    [active, dataBundle]
  );

  const openCompose = useCallback((draft) => setEmailDraft(draft), []);

  const ActiveView = useMemo(() => {
    if (active === 'executive') return () => <ExecutiveCommandCenterModule />;
    if (active === 'orderbank') return () => <OrderBankModule />;
    if (active === 'customer-orders') return () => <CustomerOrdersModule onComposeEmail={openCompose} />;
    if (active === 'trade-risk') return () => <TradeRiskModule />;
    if (active === 'data-sync') return () => <DataSyncModule />;
    if (active === 'suppliers') return () => <SupplierModule onComposeEmail={openCompose} />;
    if (active === 'fulfillment') return () => <FulfillmentModule onComposeEmail={openCompose} />;
    if (active === 'agents') return () => <AIAgentsModule onComposeEmail={openCompose} />;
    if (active === PRODUCTION_PLANNING_ID) return () => <ProductionPlanningModule />;
    if (active === PURCHASE_ORDERS_ID) return () => <PurchaseOrdersModule onComposeEmail={openCompose} />;
    if (active === RECEIVING_ID) return () => <ReceivingModule loggedInName={displayName} onComposeEmail={openCompose} />;
    if (active === SHOP_FLOOR_ID) return () => <ShopFloorModule onComposeEmail={openCompose} />;
    if (active === CONTACTS_ID) return () => <ContactsModule onComposeEmail={openCompose} />;
    if (active === inventoryNavIds.fg) return () => <InventoryModule variant="fg" />;
    if (active === inventoryNavIds.components) return () => <InventoryModule variant="components" />;
    if (active === inventoryNavIds.parts) return () => <PartsInventoryModule />;
    const Comp = views[active];
    return Comp ? () => <Comp /> : () => <InventoryModule variant="fg" />;
  }, [active, openCompose, displayName]);

  const selectInventoryChild = useCallback(
    (id) => {
      setActive(id);
      setInventoryOpen(true);
    },
    []
  );

  const access = useMemo(() => {
    const allowedIds = new Set();
    const inventoryChildren = new Set();
    for (const seg of segments) {
      if (seg.type === 'item') {
        allowedIds.add(seg.id);
        if (seg.id === inventoryNavIds.fg || seg.id === inventoryNavIds.components || seg.id === inventoryNavIds.parts) {
          inventoryChildren.add(seg.id);
        }
      } else if (seg.type === 'inventory') {
        invChildrenForKeys(seg.keys).forEach((c) => {
          allowedIds.add(c.id);
          inventoryChildren.add(c.id);
        });
      } else if (seg.type === 'planning-group') {
        allowedIds.add(seg.parentId);
        seg.children.forEach((id) => {
          allowedIds.add(id);
        });
      } else if (seg.type === 'fulfillment-group') {
        allowedIds.add(seg.parentId);
        seg.children.forEach((id) => {
          allowedIds.add(id);
        });
      }
    }
    return { allowedIds, inventoryChildren };
  }, [segments]);

  const renderNavItem = useCallback(
    (id, key) => {
      const item = getNavMeta(id);
      return (
        <button
          key={key || `i-${item.id}`}
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
      );
    },
    [active, isModuleDirty, sidebarCollapsed]
  );

  const inventoryChildren = inventoryNavGroup.children.filter((c) => access.allowedIds.has(c.id));
  const showInventorySection = inventoryChildren.length > 0;
  const planningChildren = [PURCHASE_ORDERS_ID].filter((id) => access.allowedIds.has(id));
  const showPlanningGroup = access.allowedIds.has('planning') || planningChildren.length > 0;
  const logisticsChildren = [RECEIVING_ID].filter((id) => access.allowedIds.has(id));
  const showLogisticsGroup = access.allowedIds.has('fulfillment') || logisticsChildren.length > 0;

  const topSectionItems = ['executive', 'orderbank', 'customer-orders'].filter((id) => access.allowedIds.has(id));
  const showProductionSection = [PRODUCTION_PLANNING_ID, SHOP_FLOOR_ID].some((id) => access.allowedIds.has(id));
  const showProcurementSection = ['suppliers', 'trade-risk'].some((id) => access.allowedIds.has(id)) || showPlanningGroup;
  const showDemandSection = access.allowedIds.has('demand');
  const showToolsSection = ['agents', CONTACTS_ID, 'data-sync'].some((id) => access.allowedIds.has(id));

  useEffect(() => {
    if (!access.allowedIds.has(active)) {
      setActive(defaultActive);
    }
  }, [access.allowedIds, active, defaultActive]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden />
          {!sidebarCollapsed && <span className="sidebar__title">SC Control</span>}
        </div>
        <nav className="sidebar__nav">
          {topSectionItems.map((id) => renderNavItem(id))}

          {showInventorySection && !sidebarCollapsed && <div className="nav-section-label">Inventory</div>}
          {showInventorySection && (
            <div className="nav-group">
              {!sidebarCollapsed ? (
                <>
                  <button
                    type="button"
                    className={`nav-group__header ${isInventoryGroupActiveForChildren(active, inventoryChildren) ? 'nav-group__header--active' : ''}`}
                    onClick={() => setInventoryOpen((o) => !o)}
                    aria-expanded={inventoryOpen}
                  >
                    <span>
                      {inventoryNavGroup.label}
                      {inventoryChildren.some((c) => isModuleDirty(c.id)) && <span style={{ color: '#fb923c' }}> ●</span>}
                    </span>
                    <span className="nav-group__chev" aria-hidden>{inventoryOpen ? '▾' : '▸'}</span>
                  </button>
                  {inventoryOpen && (
                    <div className="nav-group__subs">
                      {inventoryChildren.map((child) => (
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
                </>
              ) : (
                <div className="nav-group nav-group--collapsed-icons">
                  {inventoryChildren.map((child) => (
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
            </div>
          )}

          {showProductionSection && !sidebarCollapsed && <div className="nav-section-label">Production</div>}
          {showProductionSection && access.allowedIds.has(PRODUCTION_PLANNING_ID) && renderNavItem(PRODUCTION_PLANNING_ID)}
          {showProductionSection && access.allowedIds.has(SHOP_FLOOR_ID) && renderNavItem(SHOP_FLOOR_ID)}

          {showProcurementSection && !sidebarCollapsed && <div className="nav-section-label">Procurement</div>}
          {showProcurementSection && access.allowedIds.has('suppliers') && renderNavItem('suppliers')}
          {showProcurementSection && access.allowedIds.has('trade-risk') && renderNavItem('trade-risk')}
          {showProcurementSection && showPlanningGroup && (
            <div className="nav-group">
              {!sidebarCollapsed ? (
                <>
                  <button
                    type="button"
                    className={`nav-group__header ${active === 'planning' || planningChildren.some((id) => id === active) ? 'nav-group__header--active' : ''}`}
                    onClick={() => {
                      setPlanningOpen((o) => !o);
                      setActive('planning');
                    }}
                    aria-expanded={planningOpen}
                  >
                    <span>
                      {getNavMeta('planning').label}
                      {(isModuleDirty(activeToModuleId('planning')) || planningChildren.some((id) => isModuleDirty(activeToModuleId(id)))) && <span style={{ color: '#fb923c' }}> ●</span>}
                    </span>
                    <span className="nav-group__chev" aria-hidden>{planningOpen ? '▾' : '▸'}</span>
                  </button>
                  {planningOpen && (
                    <div className="nav-group__subs">
                      {planningChildren.map((id) => {
                        const child = getNavMeta(id);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={`nav-sub ${active === child.id ? 'nav-sub--active' : ''}`}
                            onClick={() => setActive(child.id)}
                          >
                            <span className="nav-sub__bar" aria-hidden />
                            {child.label}
                            <UnsavedMark on={isModuleDirty(activeToModuleId(child.id))} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="nav-group nav-group--collapsed-icons">
                  <button
                    type="button"
                    className={`nav-btn nav-btn--compact ${active === 'planning' ? 'nav-btn--active' : ''}`}
                    onClick={() => setActive('planning')}
                    title={getNavMeta('planning').label}
                  >
                    <span className="nav-btn__text">{getNavMeta('planning').shortLabel}</span>
                  </button>
                  {planningChildren.map((id) => {
                    const child = getNavMeta(id);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        className={`nav-btn nav-btn--compact ${active === child.id ? 'nav-btn--active' : ''}`}
                        onClick={() => setActive(child.id)}
                        title={child.label}
                      >
                        <span className="nav-btn__text">{child.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showLogisticsGroup && !sidebarCollapsed && <div className="nav-section-label">Logistics</div>}
          {showLogisticsGroup && (
            <div className="nav-group">
              {!sidebarCollapsed ? (
                <>
                  <button
                    type="button"
                    className={`nav-group__header ${active === 'fulfillment' || logisticsChildren.some((id) => id === active) ? 'nav-group__header--active' : ''}`}
                    onClick={() => {
                      setFulfillmentOpen((o) => !o);
                      setActive('fulfillment');
                    }}
                    aria-expanded={fulfillmentOpen}
                  >
                    <span>
                      {getNavMeta('fulfillment').label}
                      {(isModuleDirty(activeToModuleId('fulfillment')) || logisticsChildren.some((id) => isModuleDirty(activeToModuleId(id)))) && <span style={{ color: '#fb923c' }}> ●</span>}
                    </span>
                    <span className="nav-group__chev" aria-hidden>{fulfillmentOpen ? '▾' : '▸'}</span>
                  </button>
                  {fulfillmentOpen && (
                    <div className="nav-group__subs">
                      {logisticsChildren.map((id) => {
                        const child = getNavMeta(id);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={`nav-sub ${active === child.id ? 'nav-sub--active' : ''}`}
                            onClick={() => setActive(child.id)}
                          >
                            <span className="nav-sub__bar" aria-hidden />
                            {child.label}
                            <UnsavedMark on={isModuleDirty(activeToModuleId(child.id))} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="nav-group nav-group--collapsed-icons">
                  <button
                    type="button"
                    className={`nav-btn nav-btn--compact ${active === 'fulfillment' ? 'nav-btn--active' : ''}`}
                    onClick={() => setActive('fulfillment')}
                    title={getNavMeta('fulfillment').label}
                  >
                    <span className="nav-btn__text">{getNavMeta('fulfillment').shortLabel}</span>
                  </button>
                  {logisticsChildren.map((id) => {
                    const child = getNavMeta(id);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        className={`nav-btn nav-btn--compact ${active === child.id ? 'nav-btn--active' : ''}`}
                        onClick={() => setActive(child.id)}
                        title={child.label}
                      >
                        <span className="nav-btn__text">{child.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showDemandSection && !sidebarCollapsed && <div className="nav-section-label">Demand</div>}
          {showDemandSection && renderNavItem('demand')}

          {showToolsSection && !sidebarCollapsed && <div className="nav-section-label">Tools</div>}
          {showToolsSection && access.allowedIds.has('agents') && renderNavItem('agents')}
          {showToolsSection && access.allowedIds.has(CONTACTS_ID) && renderNavItem(CONTACTS_ID)}
          {showToolsSection && access.allowedIds.has('data-sync') && renderNavItem('data-sync')}
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
            <p className="top-header__sub top-header__welcome">{welcome}</p>
            <p className="top-header__sub top-header__sub--meta">North America hub · live sample dataset</p>
          </div>
          <div
            className="top-header__tags"
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
          >
            <button
              type="button"
              className="notif-bell"
              onClick={() => setNotificationsOpen((o) => !o)}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="notif-bell__badge">{unreadCount}</span>}
            </button>
            <span className="tag">MRP nightly</span>
            <button
              type="button"
              className="tag tag--switch"
              onClick={onSwitchRole}
            >
              Switch Role
            </button>
            <button
              type="button"
              className="tag tag--switch"
              onClick={() => setCommsOpen(true)}
            >
              Communications
            </button>
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
      <GlobalCommunicationsHub
        open={commsOpen}
        onClose={() => setCommsOpen(false)}
        contactDirectory={contactDirectory}
        supplierData={supplierData}
        onComposeEmail={openCompose}
      />
      <EmailComposeModal
        open={Boolean(emailDraft)}
        onClose={() => setEmailDraft(null)}
        recipientName={emailDraft?.recipientName}
        recipientEmail={emailDraft?.recipientEmail}
        subject={emailDraft?.subject}
        body={emailDraft?.body}
      />
      {notificationsOpen && (
        <div className="notif-overlay">
          <aside className="notif-panel" ref={notificationsPanelRef}>
            <div className="notif-panel__head">
              <div>
                <h3>Notifications</h3>
                <p>{unreadCount} unread</p>
              </div>
              <div className="po-inline-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setNotifications((rows) => rows.map((n) => ({ ...n, read: true })))}>
                  Mark All Read
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setNotifications([])}>
                  Clear All
                </button>
              </div>
            </div>
            <div className="notif-list">
              {visibleNotifications.map((n) => (
                <article
                  key={n.id}
                  className={`notif-card ${n.read ? '' : 'notif-card--unread'} notif-card--${n.severity.toLowerCase()}`}
                >
                  <div className="notif-card__top">
                    <span className={`notif-icon notif-icon--${n.severity.toLowerCase()}`} aria-hidden />
                    <strong>{n.title}</strong>
                  </div>
                  <p>{n.body}</p>
                  <div className="notif-card__meta">
                    <span className="pill">{n.moduleLabel}</span>
                    <span>{n.timeAgo}</span>
                  </div>
                  <div className="po-inline-actions">
                    <button
                      type="button"
                      className="btn btn--green"
                      onClick={() => {
                        setActive(n.moduleId);
                        setNotificationsOpen(false);
                        setNotifications((rows) => rows.map((r) => (r.id === n.id ? { ...r, read: true } : r)));
                      }}
                    >
                      View
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => setNotifications((rows) => rows.filter((r) => r.id !== n.id))}>
                      Dismiss
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState({
    onDashboard: false,
    name: '',
    roleId: null,
  });
  const [viewKey, setViewKey] = useState(0);

  const handleEnter = (userName, roleId) => {
    setSession({ onDashboard: true, name: userName, roleId });
    setViewKey((k) => k + 1);
  };

  const handleSwitchRole = () => {
    setSession((s) => ({ ...s, onDashboard: false }));
  };

  return (
    <div className="app-root">
      {!session.onDashboard ? (
        <div className="app-fade" key="login">
          <RoleLogin initialName={session.name} initialRoleId={session.roleId} onEnter={handleEnter} />
        </div>
      ) : (
        <div className="app-fade" key="dash">
          {session.roleId && <DashboardApp key={viewKey} name={session.name} roleId={session.roleId} onSwitchRole={handleSwitchRole} />}
        </div>
      )}
    </div>
  );
}
