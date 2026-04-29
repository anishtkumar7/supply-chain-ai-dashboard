import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  skuData as initSku,
  componentData as initComponent,
  supplierData as initSupplier,
  shipmentData as initShipment,
  orderHistory as initOrderHistory,
  customerOrderData as initCustomerOrder,
  agentAlerts as initAgentAlerts,
} from '../data/sampleData';

const clone = (v) => JSON.parse(JSON.stringify(v));

const DashboardDataContext = createContext(null);

export const MODULE_IDS = {
  executive: 'executive',
  orderbank: 'orderbank',
  customerOrders: 'customer-orders',
  inventoryFg: 'inventory-fg',
  inventoryComponents: 'inventory-components',
  suppliers: 'suppliers',
  tradeRisk: 'trade-risk',
  fulfillment: 'fulfillment',
  demand: 'demand',
  planning: 'planning',
  agents: 'agents',
  dataSync: 'data-sync',
};

export function DashboardDataProvider({ children }) {
  const [skuData, setSkuData] = useState(() => clone(initSku));
  const [componentData, setComponentData] = useState(() => clone(initComponent));
  const [supplierData, setSupplierData] = useState(() => clone(initSupplier));
  const [shipmentData, setShipmentData] = useState(() => clone(initShipment));
  const [orderHistory, setOrderHistory] = useState(() => clone(initOrderHistory));
  const [customerOrderData, setCustomerOrderData] = useState(() => clone(initCustomerOrder));
  const [agentAlerts, setAgentAlerts] = useState(() => clone(initAgentAlerts));
  const [dirtyModules, setDirtyModules] = useState(() => new Set());
  const [lastManualUpload, setLastManualUpload] = useState({
    message: 'Using sample data',
    isSample: true,
    at: null,
  });
  const [syncLog, setSyncLog] = useState(() => [
    {
      id: 'l1',
      time: 'Today 9:42am',
      type: 'Manual Upload',
      details: 'Finished Goods CSV',
      records: 7,
      status: 'SUCCESS',
    },
    {
      id: 'l2',
      time: 'Today 9:40am',
      type: 'Manual Upload',
      details: 'Component CSV',
      records: 10,
      status: 'SUCCESS',
    },
    {
      id: 'l3',
      time: 'Yesterday 11:30pm',
      type: 'Auto Sync Attempt',
      details: 'ERP not connected',
      records: 0,
      status: 'FAILED',
    },
    {
      id: 'l4',
      time: 'Yesterday 6:00pm',
      type: 'Manual Upload',
      details: 'Supplier List',
      records: 9,
      status: 'SUCCESS',
    },
    {
      id: 'l5',
      time: 'Yesterday 2:15pm',
      type: 'Google Sheets Sync',
      details: 'Demand Forecast tab',
      records: 7,
      status: 'SUCCESS',
    },
  ]);

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
      { id: `l-${Date.now()}`, time, ...entry },
      ...rows,
    ]);
  }, []);

  const value = useMemo(
    () => ({
      skuData,
      setSkuData,
      componentData,
      setComponentData,
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
    }),
    [
      skuData,
      componentData,
      supplierData,
      shipmentData,
      orderHistory,
      customerOrderData,
      agentAlerts,
      markModuleDirty,
      clearModuleDirty,
      saveAllChanges,
      isModuleDirty,
      dirtyModules,
      lastManualUpload,
      syncLog,
      addSyncLogEntry,
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
