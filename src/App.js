import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import './App.css';
import './dashboardPrint.css';
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
import { AttentionQueueModule } from './modules/AttentionQueueModule';
import { AgenticPlaybookModule } from './modules/AgenticPlaybookModule';
import { useDashboardData } from './context/DashboardDataContext';
import {
  computeTradeRiskRows,
  exportForActiveView,
  purchaseOrderTrackerRows,
  supplierScorecardRows,
  tradeRiskTariffRowsFromComputed,
} from './utils/exportUtils';
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
  ATTENTION_QUEUE_ID,
  AGENTIC_PLAYBOOK_ID,
} from './config/roleNavConfig';
import { RoleLogin } from './components/RoleLogin';
import { RivitLogo } from './components/RivitLogo';
import { RIVIT_BROWSER_TITLE, RIVIT_PLATFORM_SUBTITLE } from './constants/branding';
import { GlobalCommunicationsHub } from './components/GlobalCommunicationsHub';
import { EmailComposeModal } from './components/EmailComposeModal';
import { ExecutivePdfPrintView } from './components/ExecutivePdfPrintView';
import { GenericPdfPrintView } from './components/GenericPdfPrintView';
import { SyncHealthStrip } from './components/SyncHealthStrip';
import { useExportRegistrationContext } from './context/ExportRegistrationContext';

const RIVIT_AI_OPENING =
  'Hello! I am your RIVIT Intelligence Assistant. I have full visibility into your Vectrum Manufacturing operations data. You can ask me things like:\n• Which SKUs are at risk of stockout this week?\n• What is my total tariff exposure?\n• Which supplier is causing the most delays?\n• What should I reorder today?\n• Summarize my critical alerts';

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
  if (active === ATTENTION_QUEUE_ID) return 'attention-queue';
  if (active === AGENTIC_PLAYBOOK_ID) return 'agentic-playbook';
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

const DENSITY_STORAGE_KEY = 'sc-ui-density';

/** @returns {'compact' | 'comfortable' | null} */
function readStoredDensity() {
  try {
    const v = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    if (v === 'compact' || v === 'comfortable') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function defaultDensityForRole(roleId) {
  if (roleId === 'buyer-planner') return 'compact';
  if (roleId === 'management') return 'comfortable';
  return 'comfortable';
}

function getInitialDensity(roleId) {
  return readStoredDensity() ?? defaultDensityForRole(roleId);
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
  const { getSnapshot } = useExportRegistrationContext();
  const role = getRoleConfig(roleId);
  const { segments, label: roleLabel, defaultActive } = role;
  const invIdSet = useMemo(() => allInventoryChildIdsForRole(segments), [segments]);
  const [active, setActive] = useState(() => defaultActive);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [density, setDensity] = useState(() => getInitialDensity(roleId));
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [planningOpen, setPlanningOpen] = useState(true);
  const [fulfillmentOpen, setFulfillmentOpen] = useState(true);
  const [commsOpen, setCommsOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mrpOpen, setMrpOpen] = useState(false);
  const [mrpStepIndex, setMrpStepIndex] = useState(0);
  const [mrpComplete, setMrpComplete] = useState(false);
  const [mrpCompletedAt, setMrpCompletedAt] = useState(null);
  const [mrpNotified, setMrpNotified] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState(() => [{ role: 'assistant', content: RIVIT_AI_OPENING }]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportToast, setExportToast] = useState('');
  const [execPdfGeneratedAtLabel, setExecPdfGeneratedAtLabel] = useState('');
  const [genericPdf, setGenericPdf] = useState(null);
  const exportRef = useRef(null);
  const notificationsPanelRef = useRef(null);
  const aiPanelRef = useRef(null);
  const mrpTimeoutRef = useRef(null);

  const {
    skuData,
    componentData,
    supplierData,
    shipmentData,
    orderHistory,
    customerOrderData,
    agentAlerts,
    contactDirectory,
    adjustmentHistory,
    syncLog,
    lastManualUpload,
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
      adjustmentHistory,
      syncLog,
      lastManualUpload,
    }),
    [
      skuData,
      componentData,
      supplierData,
      shipmentData,
      orderHistory,
      customerOrderData,
      agentAlerts,
      adjustmentHistory,
      syncLog,
      lastManualUpload,
    ]
  );

  const activeModuleId = useMemo(() => activeToModuleId(active), [active]);
  const hasUnsaved = isModuleDirty(activeModuleId);
  const displayName = (name && name.trim()) || roleLabel;
  const welcome = `Welcome back, ${displayName} · ${roleLabel}`;

  const [notifications, setNotifications] = useState(() => {
    const seeded = [
      ...defaultNotificationsFromAgents(agentAlerts),
      { id: 'n1', severity: 'CRITICAL', title: 'FG-R450-CO Stock Critical', body: '4 days cover. No inbound confirmed.', moduleLabel: 'Inventory', moduleId: inventoryNavIds.fg, category: 'inventory', timeAgo: '4 min ago', read: false },
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
    try {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density]);

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

  useEffect(() => {
    if (!mrpOpen) {
      if (mrpTimeoutRef.current) {
        window.clearTimeout(mrpTimeoutRef.current);
        mrpTimeoutRef.current = null;
      }
      return undefined;
    }

    if (mrpComplete) return undefined;

    const stepDurations = [500, 500, 1000, 1000, 500, 1000, 500];
    if (mrpStepIndex >= stepDurations.length) {
      setMrpComplete(true);
      setMrpCompletedAt(new Date());
      return undefined;
    }

    mrpTimeoutRef.current = window.setTimeout(() => {
      setMrpStepIndex((s) => s + 1);
    }, stepDurations[mrpStepIndex]);

    return () => {
      if (mrpTimeoutRef.current) {
        window.clearTimeout(mrpTimeoutRef.current);
        mrpTimeoutRef.current = null;
      }
    };
  }, [mrpOpen, mrpStepIndex, mrpComplete]);

  const runMrp = useCallback(() => {
    setMrpStepIndex(0);
    setMrpComplete(false);
    setMrpCompletedAt(null);
    setMrpNotified(false);
    setMrpOpen(true);
  }, []);

  const closeMrp = useCallback(() => {
    if (mrpComplete && !mrpNotified) {
      setNotifications((rows) => [
        {
          id: `mrp-${Date.now()}`,
          severity: 'INFO',
          title: 'MRP Run Complete — 10 suggestions generated',
          body: 'Nightly MRP completed and refreshed purchase planning outputs.',
          moduleLabel: 'Supply Planning',
          moduleId: PURCHASE_ORDERS_ID,
          category: 'planning',
          timeAgo: 'just now',
          read: false,
        },
        ...rows,
      ]);
      setMrpNotified(true);
    }
    setMrpOpen(false);
  }, [mrpComplete, mrpNotified]);

  useEffect(() => {
    if (!aiOpen) return undefined;
    const close = (e) => {
      if (aiPanelRef.current && !aiPanelRef.current.contains(e.target)) {
        setAiOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [aiOpen]);

  useEffect(() => {
    if (!exportToast) return undefined;
    const t = window.setTimeout(() => setExportToast(''), 4000);
    return () => window.clearTimeout(t);
  }, [exportToast]);

  const doExport = useCallback(
    async (format) => {
      setExportOpen(false);
      setExportBusy(true);
      await new Promise((r) => setTimeout(r, 380));
      try {
        const snap = getSnapshot(active);
        exportForActiveView(active, dataBundle, format, snap);
        setExportToast('Export complete — file downloaded');
      } finally {
        setExportBusy(false);
      }
    },
    [active, dataBundle, getSnapshot]
  );

  const stampAndPrint = useCallback((setup) => {
    const label = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
    flushSync(() => {
      setExecPdfGeneratedAtLabel(label);
      setup(label);
    });
    const onAfter = () => {
      window.removeEventListener('afterprint', onAfter);
      setGenericPdf(null);
    };
    window.addEventListener('afterprint', onAfter);
    window.print();
  }, []);

  const exportExecutivePdf = useCallback(() => {
    stampAndPrint(() => {
      setGenericPdf(null);
    });
  }, [stampAndPrint]);

  const exportSupplierPdf = useCallback(() => {
    const snap = getSnapshot('suppliers');
    const rows = snap?.pdfModel?.rows ?? supplierScorecardRows(supplierData);
    const filterLine = snap?.pdfModel?.filterLine ?? snap?.filterNote ?? 'None';
    stampAndPrint((label) =>
      setGenericPdf({
        documentTitle: 'RIVIT · Vectrum Manufacturing — Supplier scorecard',
        subtitle: 'North America Hub',
        generatedAtLabel: label,
        preparedForName: displayName,
        preparedForRole: roleLabel,
        filterLine,
        rows,
      })
    );
  }, [displayName, getSnapshot, roleLabel, stampAndPrint, supplierData]);

  const exportPurchaseOrdersPdf = useCallback(() => {
    const snap = getSnapshot(PURCHASE_ORDERS_ID);
    const map = new Map(componentData.map((c) => [c.sku, c]));
    let rows =
      snap?.pdfModel?.rows ??
      (snap?.rows?.length ? snap.rows : purchaseOrderTrackerRows([], map));
    if (!rows.length) {
      rows = [
        {
          Message:
            'No rows to print — open Purchase Orders so the PO tracker can register export data, or widen filters.',
        },
      ];
    }
    const filterLine = snap?.pdfModel?.filterLine ?? snap?.filterNote ?? 'None';
    stampAndPrint((label) =>
      setGenericPdf({
        documentTitle: 'RIVIT · Vectrum Manufacturing — Open purchase orders',
        subtitle: 'PO tracker — finance review',
        generatedAtLabel: label,
        preparedForName: displayName,
        preparedForRole: roleLabel,
        filterLine,
        rows,
      })
    );
  }, [componentData, displayName, getSnapshot, roleLabel, stampAndPrint]);

  const exportTradeRiskPdf = useCallback(() => {
    const snap = getSnapshot('trade-risk');
    const rows =
      snap?.pdfModel?.rows ??
      tradeRiskTariffRowsFromComputed(computeTradeRiskRows(componentData, supplierData));
    const filterLine = snap?.pdfModel?.filterLine ?? snap?.filterNote ?? 'None';
    stampAndPrint((label) =>
      setGenericPdf({
        documentTitle: 'RIVIT · Vectrum Manufacturing — Tariff exposure report',
        subtitle: 'Executive review',
        generatedAtLabel: label,
        preparedForName: displayName,
        preparedForRole: roleLabel,
        filterLine,
        rows,
      })
    );
  }, [componentData, displayName, getSnapshot, roleLabel, stampAndPrint, supplierData]);

  const openCompose = useCallback((draft) => setEmailDraft(draft), []);

  const sendAiMessage = useCallback(async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;

    const nextMessages = [...aiMessages, { role: 'user', content: text }];
    setAiMessages(nextMessages);
    setAiInput('');
    setAiLoading(true);

    const systemPrompt =
      `You are the RIVIT Intelligence Assistant, an intelligent manufacturing operations assistant for Vectrum Manufacturing. ` +
      `You have access to the following live manufacturing operations data and should answer questions concisely and helpfully based on this data. ` +
      `Always be specific and reference actual SKUs, suppliers, quantities and dates from the data. ` +
      `Data: ${JSON.stringify({
        skuData,
        componentData,
        supplierData,
        shipmentData,
        orderHistory,
        customerOrderData,
        agentAlerts,
      })}`;

    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Missing REACT_APP_ANTHROPIC_API_KEY');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error ${response.status}`);
      }

      const data = await response.json();
      const aiText = data?.content?.[0]?.text || 'No response returned.';
      setAiMessages((rows) => [...rows, { role: 'assistant', content: aiText }]);
    } catch (err) {
      setAiMessages((rows) => [
        ...rows,
        { role: 'assistant', content: `AI request failed: ${err.message}. Please verify API key and try again.` },
      ]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMessages, skuData, componentData, supplierData, shipmentData, orderHistory, customerOrderData, agentAlerts]);

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

  const navigateFromAttention = useCallback(
    (navId) => {
      if (access.allowedIds.has(navId)) {
        setActive(navId);
        return;
      }
      if (access.allowedIds.has('agents')) {
        setActive('agents');
      }
    },
    [access.allowedIds]
  );

  const ActiveView = useMemo(() => {
    if (active === ATTENTION_QUEUE_ID) return () => <AttentionQueueModule onNavigate={navigateFromAttention} />;
    if (active === AGENTIC_PLAYBOOK_ID) return () => <AgenticPlaybookModule />;
    if (active === 'executive') return () => <ExecutiveCommandCenterModule />;
    if (active === 'orderbank') return () => <OrderBankModule />;
    if (active === 'customer-orders') return () => <CustomerOrdersModule onComposeEmail={openCompose} />;
    if (active === 'trade-risk') return () => <TradeRiskModule />;
    if (active === 'data-sync') return () => <DataSyncModule />;
    if (active === 'suppliers') return () => <SupplierModule onComposeEmail={openCompose} />;
    if (active === 'fulfillment') return () => <FulfillmentModule onComposeEmail={openCompose} />;
    if (active === 'agents') return () => <AIAgentsModule onComposeEmail={openCompose} />;
    if (active === PRODUCTION_PLANNING_ID) return () => <ProductionPlanningModule onComposeEmail={openCompose} />;
    if (active === PURCHASE_ORDERS_ID) return () => <PurchaseOrdersModule onComposeEmail={openCompose} />;
    if (active === RECEIVING_ID) return () => <ReceivingModule loggedInName={displayName} onComposeEmail={openCompose} />;
    if (active === SHOP_FLOOR_ID) return () => <ShopFloorModule onComposeEmail={openCompose} />;
    if (active === CONTACTS_ID) return () => <ContactsModule onComposeEmail={openCompose} />;
    if (active === inventoryNavIds.fg) return () => <InventoryModule variant="fg" currentRoleId={roleId} currentUserName={displayName} />;
    if (active === inventoryNavIds.components) return () => <InventoryModule variant="components" currentRoleId={roleId} currentUserName={displayName} />;
    if (active === inventoryNavIds.parts) return () => <PartsInventoryModule />;
    const Comp = views[active];
    return Comp ? () => <Comp /> : () => <InventoryModule variant="fg" />;
  }, [active, navigateFromAttention, openCompose, displayName, roleId]);

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

  const topSectionItems = ['executive', ATTENTION_QUEUE_ID, AGENTIC_PLAYBOOK_ID, 'orderbank', 'customer-orders'].filter(
    (id) => access.allowedIds.has(id)
  );
  const showProductionSection = [PRODUCTION_PLANNING_ID, SHOP_FLOOR_ID].some((id) => access.allowedIds.has(id));
  const showProcurementSection = ['suppliers', 'trade-risk'].some((id) => access.allowedIds.has(id)) || showPlanningGroup;
  const showDemandSection = access.allowedIds.has('demand');
  const showToolsSection = ['agents', CONTACTS_ID, 'data-sync'].some((id) => access.allowedIds.has(id));

  useEffect(() => {
    if (!access.allowedIds.has(active)) {
      setActive(defaultActive);
    }
  }, [access.allowedIds, active, defaultActive]);

  useEffect(() => {
    if (active !== 'executive') return;
    setExecPdfGeneratedAtLabel(
      new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date())
    );
  }, [active]);

  return (
    <>
    <div
      className={`app-shell print-exec-skip ${sidebarCollapsed ? 'app-shell--collapsed' : ''} ${
        density === 'compact' ? 'density-compact' : 'density-comfortable'
      }`}
    >
      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__brand">
          <RivitLogo variant={sidebarCollapsed ? 'icon' : 'sidebar'} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1
                className="top-header__title top-header__title-stack"
                aria-label={`RIVIT — ${RIVIT_PLATFORM_SUBTITLE}`}
              >
                <span>RIVIT</span>
                <span className="top-header__product-sub">{RIVIT_PLATFORM_SUBTITLE}</span>
              </h1>
              {hasUnsaved && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(234, 88, 12, 0.2)',
                    color: '#fb923c',
                    border: '1px solid rgba(251, 146, 60, 0.4)',
                  }}
                >
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="top-header__sub top-header__welcome">{welcome}</p>
            <p className="top-header__sub top-header__sub--meta">North America hub · live sample dataset</p>
            <SyncHealthStrip syncLog={syncLog} lastManualUpload={lastManualUpload} />
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
            <div className="density-toggle" role="group" aria-label="Display density">
              <button
                type="button"
                className={`tag tag--switch density-toggle__btn ${density === 'comfortable' ? 'density-toggle__btn--active' : ''}`}
                onClick={() => setDensity('comfortable')}
                aria-pressed={density === 'comfortable'}
              >
                Comfortable
              </button>
              <button
                type="button"
                className={`tag tag--switch density-toggle__btn ${density === 'compact' ? 'density-toggle__btn--active' : ''}`}
                onClick={() => setDensity('compact')}
                aria-pressed={density === 'compact'}
              >
                Compact
              </button>
            </div>
            <button type="button" className="tag tag--switch" onClick={runMrp}>MRP Nightly</button>
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
            <button
              type="button"
              className={`tag ${aiOpen ? 'tag--accent' : ''}`}
              onClick={() => setAiOpen((v) => !v)}
            >
              AI Assist {aiOpen ? 'ON' : 'OFF'}
            </button>
            {hasUnsaved && (
              <button type="button" className="tag" style={{ border: '1px solid #fb923c', color: '#fb923c' }} onClick={saveAllChanges}>
                Save changes
              </button>
            )}
            <div ref={exportRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="tag"
                disabled={exportBusy}
                onClick={() => setExportOpen((o) => !o)}
                style={{ cursor: exportBusy ? 'wait' : 'pointer' }}
                aria-haspopup
              >
                {exportBusy ? 'Exporting…' : 'Export ▾'}
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
                      disabled={exportBusy}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e2e8f0', padding: 6, cursor: 'pointer' }}
                      onClick={() => {
                        void doExport('csv');
                      }}
                    >Export as CSV
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      disabled={exportBusy}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e2e8f0', padding: 6, cursor: 'pointer' }}
                      onClick={() => {
                        void doExport('xlsx');
                      }}
                    >Export as Excel
                    </button>
                  </li>
                </ul>
              )}
            </div>
            {active === 'executive' && (
              <button type="button" className="tag tag--print-pdf" onClick={exportExecutivePdf}>
                Export PDF
              </button>
            )}
            {active === 'suppliers' && (
              <button type="button" className="tag tag--print-pdf" onClick={exportSupplierPdf}>
                Export PDF
              </button>
            )}
            {active === PURCHASE_ORDERS_ID && (
              <button type="button" className="tag tag--print-pdf" onClick={exportPurchaseOrdersPdf}>
                Export PDF
              </button>
            )}
            {active === 'trade-risk' && (
              <button type="button" className="tag tag--print-pdf" onClick={exportTradeRiskPdf}>
                Export PDF
              </button>
            )}
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
      {aiOpen && (
        <div className="notif-overlay">
          <aside className="ai-panel" ref={aiPanelRef}>
            <div className="ai-panel__head">
              <div>
                <h3>RIVIT Intelligence Assistant</h3>
                <p>Ask anything about your manufacturing operations data</p>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  setAiMessages([
                    {
                      role: 'assistant',
                      content:
                        RIVIT_AI_OPENING,
                    },
                  ])
                }
              >
                Clear Conversation
              </button>
            </div>
            <div className="ai-chat-history">
              {aiMessages.map((m, idx) => (
                <article key={`${m.role}-${idx}`} className={`ai-msg ai-msg--${m.role}`}>
                  <pre>{m.content}</pre>
                </article>
              ))}
              {aiLoading && (
                <article className="ai-msg ai-msg--assistant">
                  <pre>RIVIT Intelligence Assistant is typing…</pre>
                </article>
              )}
            </div>
            <div className="ai-chat-input">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask about SKUs, suppliers, risks, reorder recommendations..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendAiMessage();
                }}
              />
              <button type="button" className="btn btn--green" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>
                Send
              </button>
            </div>
          </aside>
        </div>
      )}
      {mrpOpen && (
        <div className="po-modal-backdrop">
          <div className="po-modal mrp-modal">
            <h3>MRP Run — RIVIT · Vectrum Manufacturing</h3>
            {!mrpComplete ? (
              <div className="mrp-steps">
                {[
                  'Connecting to data source...',
                  'Loading demand forecast...',
                  'Exploding Bills of Materials...',
                  'Calculating net requirements...',
                  'Applying supplier lead times...',
                  'Generating purchase order suggestions...',
                  'Updating reorder dates...',
                ].map((step, idx) => (
                  <div key={step} className={`mrp-step ${idx < mrpStepIndex ? 'mrp-step--done' : idx === mrpStepIndex ? 'mrp-step--active' : ''}`}>
                    <span>{idx < mrpStepIndex ? '✅' : idx === mrpStepIndex ? '⏳' : '•'}</span>
                    <span>{step}</span>
                  </div>
                ))}
                {mrpStepIndex >= 7 && <div className="mrp-complete">✅ Complete!</div>}
              </div>
            ) : (
              <div>
                <div className="mrp-complete">✅ Complete!</div>
                <div className="contacts-card" style={{ marginTop: 10 }}>
                  <strong>
                    MRP Run Complete — April 30 2026 at {mrpCompletedAt ? mrpCompletedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                  </strong>
                  <div className="comms-meta">10 reorder suggestions generated</div>
                  <div className="comms-meta">3 CRITICAL components flagged</div>
                  <div className="comms-meta">2 POs past due date identified</div>
                  <div className="comms-meta">Next scheduled run: Tonight at 11:00 PM</div>
                </div>
              </div>
            )}
            <div className="po-form-actions">
              <button
                type="button"
                className="btn btn--green"
                disabled={!mrpComplete}
                onClick={() => {
                  setActive(PURCHASE_ORDERS_ID);
                  closeMrp();
                }}
              >
                View Suggestions
              </button>
              <button type="button" className="btn btn--ghost" onClick={closeMrp}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {exportToast && (
      <div
        className="export-toast"
        role="status"
        style={{
          position: 'fixed',
          bottom: 22,
          right: 22,
          zIndex: 3000,
          padding: '10px 14px',
          borderRadius: 10,
          background: '#0f172a',
          border: '1px solid #22c55e',
          color: '#e2e8f0',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        }}
      >
        {exportToast}
      </div>
    )}
    {genericPdf && (
      <div className="vectrum-print-root" aria-hidden="true">
        <GenericPdfPrintView {...genericPdf} />
      </div>
    )}
    {active === 'executive' && (
      <div className="vectrum-print-root print-exec-report" aria-hidden="true">
        <ExecutivePdfPrintView
          skuData={skuData}
          shipmentData={shipmentData}
          supplierData={supplierData}
          componentData={componentData}
          agentAlerts={agentAlerts}
          preparedForName={displayName}
          preparedForRole={roleLabel}
          generatedAtLabel={execPdfGeneratedAtLabel}
        />
      </div>
    )}
    </>
  );
}

export default function App() {
  const [session, setSession] = useState({
    onDashboard: false,
    name: '',
    roleId: null,
  });
  const [viewKey, setViewKey] = useState(0);

  useEffect(() => {
    document.title = RIVIT_BROWSER_TITLE;
  }, []);

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
