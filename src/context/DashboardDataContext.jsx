import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  skuData as initSku,
  componentData as initComponent,
  classBCData as initClassBc,
  supplierData as initSupplier,
  shipmentData as initShipment,
  orderHistory as initOrderHistory,
  customerOrderData as initCustomerOrder,
  agentAlerts as initAgentAlerts,
  contactDirectory as initContactDirectory,
} from '../data/sampleData';
import { RIVIT_ADJUSTMENTS_KEY } from '../constants/demoStorageKeys';
import { buildPartsMovementSeedHistory } from '../data/partsMovementHistorySeed';

const clone = (v) => JSON.parse(JSON.stringify(v));

/** Frozen snapshots for computing inventory patches vs sample data */
const INIT_SKU_SNAPSHOT = clone(initSku);
const INIT_COMP_SNAPSHOT = clone(initComponent);
const INIT_CLASS_BC_SNAPSHOT = clone(initClassBc);

function applyClassBcPatches(baseRows, patches) {
  const withExt = (row, onHand) => ({
    ...row,
    onHand,
    extended: onHand * row.unitCost,
  });
  if (!patches || typeof patches !== 'object') {
    return baseRows.map((row) => withExt(row, row.onHand));
  }
  return baseRows.map((row) => {
    const p = patches[row.sku];
    if (!p) return withExt(row, row.onHand);
    const nextOn = p.onHand != null ? p.onHand : row.onHand;
    return withExt({ ...row, ...p }, nextOn);
  });
}

function readRivitAdjustmentsPayload() {
  try {
    const raw = window.localStorage.getItem(RIVIT_ADJUSTMENTS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}

function applySkuPatches(baseRows, patches) {
  if (!patches || typeof patches !== 'object') return baseRows;
  return baseRows.map((row) => {
    const p = patches[row.sku];
    return p ? { ...row, ...p } : row;
  });
}

function applyComponentPatches(baseRows, patches) {
  if (!patches || typeof patches !== 'object') return baseRows;
  return baseRows.map((row) => {
    const p = patches[row.sku];
    return p ? { ...row, ...p } : row;
  });
}

function reviveAdjustmentHistory(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((h) => ({
    ...h,
    at: h.at ? new Date(h.at) : new Date(),
  }));
}

const DashboardDataContext = createContext(null);

export const MODULE_IDS = {
  executive: 'executive',
  orderbank: 'orderbank',
  customerOrders: 'customer-orders',
  inventoryFg: 'inventory-fg',
  inventoryComponents: 'inventory-components',
  inventoryParts: 'inventory-parts',
  suppliers: 'suppliers',
  tradeRisk: 'trade-risk',
  fulfillment: 'fulfillment',
  demand: 'demand',
  planning: 'planning',
  agents: 'agents',
  dataSync: 'data-sync',
  receiving: 'receiving',
  shopFloor: 'shop-floor',
};

export function DashboardDataProvider({ children }) {
  const adjPayload = readRivitAdjustmentsPayload();

  const [skuData, setSkuData] = useState(() =>
    applySkuPatches(clone(initSku), adjPayload?.skuPatches)
  );
  const [componentData, setComponentData] = useState(() =>
    applyComponentPatches(clone(initComponent), adjPayload?.componentPatches)
  );
  const [classBcPartsData, setClassBcPartsData] = useState(() =>
    applyClassBcPatches(clone(initClassBc), adjPayload?.classBcPatches)
  );
  const [supplierData, setSupplierData] = useState(() => clone(initSupplier));
  const [shipmentData, setShipmentData] = useState(() => clone(initShipment));
  const [orderHistory, setOrderHistory] = useState(() => clone(initOrderHistory));
  const [customerOrderData, setCustomerOrderData] = useState(() => clone(initCustomerOrder));
  const [agentAlerts, setAgentAlerts] = useState(() => clone(initAgentAlerts));
  const [contactDirectory] = useState(() => clone(initContactDirectory));
  const [dirtyModules, setDirtyModules] = useState(() => new Set());
  const [adjustmentHistory, setAdjustmentHistory] = useState(() =>
    adjPayload?.adjustmentHistory?.length
      ? reviveAdjustmentHistory(adjPayload.adjustmentHistory)
      : buildPartsMovementSeedHistory()
  );
  const [lastManualUpload, setLastManualUpload] = useState({
    message: 'Using sample data',
    isSample: true,
    at: null,
  });
  const [syncLog, setSyncLog] = useState(() => {
    const now = Date.now();
    return [
      {
        id: 'l1',
        time: 'Today 9:42am',
        atMs: now - 3 * 3600000,
        type: 'Manual Upload',
        details: 'Finished Goods CSV',
        records: 7,
        status: 'SUCCESS',
      },
      {
        id: 'l2',
        time: 'Today 9:40am',
        atMs: now - 5 * 3600000,
        type: 'Manual Upload',
        details: 'Component CSV',
        records: 10,
        status: 'SUCCESS',
      },
      {
        id: 'l3',
        time: 'Yesterday 11:30pm',
        atMs: now - 12 * 3600000,
        type: 'Auto Sync Attempt',
        details: 'ERP not connected',
        records: 0,
        status: 'FAILED',
      },
      {
        id: 'l4',
        time: 'Yesterday 6:00pm',
        atMs: now - 20 * 3600000,
        type: 'Manual Upload',
        details: 'Supplier List',
        records: 9,
        status: 'SUCCESS',
      },
      {
        id: 'l5',
        time: 'Yesterday 2:15pm',
        atMs: now - 28 * 3600000,
        type: 'Google Sheets Sync',
        details: 'Demand Forecast tab',
        records: 7,
        status: 'SUCCESS',
      },
    ];
  });

  const markModuleDirty = useCallback((moduleId) => {
    if (!moduleId) return;
    setDirtyModules((s) => new Set(s).add(moduleId));
  }, []);

  const clearModuleDirty = useCallback((moduleId) => {
    setDirtyModules((s) => {
      const n = new Set(s);
      n.delete(moduleId);
      return n;
    });
  }, []);

  const saveAllChanges = useCallback(() => {
    setDirtyModules(new Set());
  }, []);

  const isModuleDirty = useCallback(
    (moduleId) => dirtyModules.has(moduleId),
    [dirtyModules]
  );

  const addSyncLogEntry = useCallback((entry) => {
    const time = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    setSyncLog((rows) => [
      { id: `l-${Date.now()}`, time, ...entry, atMs: entry.atMs ?? Date.now() },
      ...rows,
    ]);
  }, []);

  const addAdjustmentHistory = useCallback((entry) => {
    const now = new Date();
    setAdjustmentHistory((rows) => [
      {
        id: entry.id || `A${Date.now()}`,
        timeLabel: entry.timeLabel || now.toLocaleString(),
        at: entry.at || now,
        flagged: false,
        ...entry,
      },
      ...rows,
    ]);
  }, []);

  useEffect(() => {
    const skuPatches = {};
    skuData.forEach((row) => {
      const init = INIT_SKU_SNAPSHOT.find((x) => x.sku === row.sku);
      if (!init) return;
      if (row.onHand !== init.onHand || row.available !== init.available) {
        skuPatches[row.sku] = { onHand: row.onHand, available: row.available };
      }
    });
    const componentPatches = {};
    componentData.forEach((row) => {
      const init = INIT_COMP_SNAPSHOT.find((x) => x.sku === row.sku);
      if (!init) return;
      if (row.onHand !== init.onHand || row.extended !== init.extended) {
        componentPatches[row.sku] = { onHand: row.onHand, extended: row.extended };
      }
    });
    const classBcPatches = {};
    classBcPartsData.forEach((row) => {
      const init = INIT_CLASS_BC_SNAPSHOT.find((x) => x.sku === row.sku);
      if (!init) return;
      const nextExt = row.onHand * row.unitCost;
      if (row.onHand !== init.onHand || nextExt !== init.onHand * init.unitCost) {
        classBcPatches[row.sku] = { onHand: row.onHand, extended: nextExt };
      }
    });
    const adjustmentPayload = adjustmentHistory.map((h) => ({
      ...h,
      at: h.at instanceof Date ? h.at.toISOString() : h.at,
    }));
    try {
      window.localStorage.setItem(
        RIVIT_ADJUSTMENTS_KEY,
        JSON.stringify({
          skuPatches,
          componentPatches,
          classBcPatches,
          adjustmentHistory: adjustmentPayload,
        })
      );
    } catch {
      /* ignore quota */
    }
  }, [skuData, componentData, classBcPartsData, adjustmentHistory]);

  const value = useMemo(
    () => ({
      skuData,
      setSkuData,
      componentData,
      setComponentData,
      classBcPartsData,
      setClassBcPartsData,
      supplierData,
      setSupplierData,
      shipmentData,
      setShipmentData,
      orderHistory,
      setOrderHistory,
      customerOrderData,
      setCustomerOrderData,
      agentAlerts,
      setAgentAlerts,
      contactDirectory,
      markModuleDirty,
      clearModuleDirty,
      saveAllChanges,
      isModuleDirty,
      dirtyModules,
      lastManualUpload,
      setLastManualUpload,
      syncLog,
      addSyncLogEntry,
      MODULE_IDS,
      adjustmentHistory,
      setAdjustmentHistory,
      addAdjustmentHistory,
    }),
    [
      skuData,
      componentData,
      classBcPartsData,
      supplierData,
      shipmentData,
      orderHistory,
      customerOrderData,
      agentAlerts,
      contactDirectory,
      markModuleDirty,
      clearModuleDirty,
      saveAllChanges,
      isModuleDirty,
      dirtyModules,
      lastManualUpload,
      syncLog,
      addSyncLogEntry,
      adjustmentHistory,
      addAdjustmentHistory,
    ]
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return ctx;
}
