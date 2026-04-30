export const topNavItems = [
  { id: 'executive', label: 'Executive Command Center', shortLabel: 'Exec' },
  { id: 'orderbank', label: 'Order Bank', shortLabel: 'Orders' },
  { id: 'customer-orders', label: 'Customer Orders', shortLabel: 'Cust' },
];

export const navItems = [
  { id: 'suppliers', label: 'Supplier Tracking', shortLabel: 'Suppliers' },
  { id: 'trade-risk', label: 'Trade Risk', shortLabel: 'Trade' },
  { id: 'fulfillment', label: 'Fulfillment Monitoring', shortLabel: 'Fulfillment' },
  { id: 'demand', label: 'Demand Forecasting', shortLabel: 'Demand' },
  { id: 'planning', label: 'Supply Planning', shortLabel: 'Planning' },
  { id: 'agents', label: 'AI Agents', shortLabel: 'Agents' },
  { id: 'data-sync', label: 'Data Sync', shortLabel: 'Sync' },
];

export const inventoryNavIds = {
  fg: 'inventory-fg',
  components: 'inventory-components',
  parts: 'inventory-parts',
};

export const inventoryNavGroup = {
  label: 'Inventory Monitoring',
  shortLabel: 'Inventory',
  children: [
    { id: inventoryNavIds.fg, label: 'Finished Goods', shortLabel: 'FG' },
    { id: inventoryNavIds.components, label: 'Components (Class A)', shortLabel: 'Class A' },
    { id: inventoryNavIds.parts, label: 'Parts Inventory', shortLabel: 'Parts' },
  ],
};
