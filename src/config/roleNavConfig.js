import { inventoryNavIds, inventoryNavGroup, topNavItems, navItems } from './navRegistry';

export const PRODUCTION_PLANNING_ID = 'production-planning';
export const PURCHASE_ORDERS_ID = 'purchase-orders';
export const CONTACTS_ID = 'contacts';
export const RECEIVING_ID = 'receiving';
export const SHOP_FLOOR_ID = 'shop-floor';
export const ATTENTION_QUEUE_ID = 'attention-queue';
export const AGENTIC_PLAYBOOK_ID = 'agentic-playbook';

const byId = new Map([
  ...topNavItems.map((x) => [x.id, x]),
  ...navItems.map((x) => [x.id, x]),
  ...inventoryNavGroup.children.map((x) => [x.id, x]),
  [
    PRODUCTION_PLANNING_ID,
    { id: PRODUCTION_PLANNING_ID, label: 'Production Planning', shortLabel: 'Mfg' },
  ],
  [
    PURCHASE_ORDERS_ID,
    { id: PURCHASE_ORDERS_ID, label: 'Purchase Orders', shortLabel: 'POs' },
  ],
  [
    CONTACTS_ID,
    { id: CONTACTS_ID, label: 'Contacts', shortLabel: 'Contacts' },
  ],
  [
    RECEIVING_ID,
    { id: RECEIVING_ID, label: 'Receiving', shortLabel: 'Recv' },
  ],
  [
    SHOP_FLOOR_ID,
    { id: SHOP_FLOOR_ID, label: 'Shop Floor', shortLabel: 'Floor' },
  ],
  [
    ATTENTION_QUEUE_ID,
    { id: ATTENTION_QUEUE_ID, label: 'Attention queue', shortLabel: 'Queue' },
  ],
  [
    AGENTIC_PLAYBOOK_ID,
    { id: AGENTIC_PLAYBOOK_ID, label: 'Agentic playbook', shortLabel: 'Play' },
  ],
]);

export function getNavMeta(id) {
  return byId.get(id) || { id, label: id, shortLabel: id };
}

function invChildrenForKeys(keys) {
  return keys
    .map((k) => {
      const id =
        k === 'fg' ? inventoryNavIds.fg : k === 'components' ? inventoryNavIds.components : inventoryNavIds.parts;
      return inventoryNavGroup.children.find((c) => c.id === id);
    })
    .filter(Boolean);
}

/**
 * @typedef {{ type: 'item', id: string } | { type: 'inventory', keys: string[] } | { type: 'planning-group', parentId: string, children: string[] } | { type: 'fulfillment-group', parentId: string, children: string[] }} Segment
 */

export const ROLES = {
  admin: {
    id: 'admin',
    label: 'Admin',
    segments: [
      { type: 'item', id: 'executive' },
      { type: 'item', id: ATTENTION_QUEUE_ID },
      { type: 'item', id: AGENTIC_PLAYBOOK_ID },
      { type: 'item', id: 'orderbank' },
      { type: 'item', id: 'customer-orders' },
      { type: 'item', id: PRODUCTION_PLANNING_ID },
      { type: 'inventory', keys: ['fg', 'components', 'parts'] },
      { type: 'item', id: 'suppliers' },
      { type: 'item', id: 'trade-risk' },
      { type: 'fulfillment-group', parentId: 'fulfillment', children: [RECEIVING_ID, SHOP_FLOOR_ID] },
      { type: 'item', id: 'demand' },
      { type: 'planning-group', parentId: 'planning', children: [PURCHASE_ORDERS_ID] },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
      { type: 'item', id: 'data-sync' },
    ],
    defaultActive: 'executive',
  },
  'material-coordinator': {
    id: 'material-coordinator',
    label: 'Material Coordinator',
    segments: [
      { type: 'item', id: ATTENTION_QUEUE_ID },
      { type: 'item', id: AGENTIC_PLAYBOOK_ID },
      { type: 'item', id: inventoryNavIds.parts },
      { type: 'inventory', keys: ['components'] },
      { type: 'item', id: PRODUCTION_PLANNING_ID },
      { type: 'item', id: SHOP_FLOOR_ID },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
    ],
    defaultActive: inventoryNavIds.parts,
  },
  'buyer-planner': {
    id: 'buyer-planner',
    label: 'Buyer / Planner',
    segments: [
      { type: 'item', id: 'orderbank' },
      { type: 'item', id: ATTENTION_QUEUE_ID },
      { type: 'item', id: AGENTIC_PLAYBOOK_ID },
      { type: 'item', id: 'customer-orders' },
      { type: 'inventory', keys: ['fg', 'components'] },
      { type: 'item', id: 'suppliers' },
      { type: 'item', id: 'trade-risk' },
      { type: 'planning-group', parentId: 'planning', children: [PURCHASE_ORDERS_ID] },
      { type: 'item', id: PRODUCTION_PLANNING_ID },
      { type: 'item', id: SHOP_FLOOR_ID },
      { type: 'item', id: 'fulfillment' },
      { type: 'item', id: 'demand' },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
      { type: 'item', id: 'data-sync' },
    ],
    defaultActive: 'orderbank',
  },
  'mfg-engineer': {
    id: 'mfg-engineer',
    label: 'Manufacturing Engineer',
    segments: [
      { type: 'item', id: PRODUCTION_PLANNING_ID },
      { type: 'item', id: SHOP_FLOOR_ID },
      { type: 'item', id: 'planning' },
      { type: 'inventory', keys: ['fg', 'components', 'parts'] },
      { type: 'item', id: 'demand' },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
    ],
    defaultActive: PRODUCTION_PLANNING_ID,
  },
  warehouse: {
    id: 'warehouse',
    label: 'Warehouse / Receiving',
    segments: [
      { type: 'fulfillment-group', parentId: 'fulfillment', children: [RECEIVING_ID] },
      { type: 'item', id: inventoryNavIds.parts },
      { type: 'inventory', keys: ['fg'] },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
    ],
    defaultActive: RECEIVING_ID,
  },
  management: {
    id: 'management',
    label: 'Management',
    segments: [
      { type: 'item', id: 'executive' },
      { type: 'item', id: ATTENTION_QUEUE_ID },
      { type: 'item', id: AGENTIC_PLAYBOOK_ID },
      { type: 'item', id: 'orderbank' },
      { type: 'item', id: 'customer-orders' },
      { type: 'inventory', keys: ['fg'] },
      { type: 'item', id: 'trade-risk' },
      { type: 'item', id: 'suppliers' },
      { type: 'planning-group', parentId: 'planning', children: [PURCHASE_ORDERS_ID] },
      { type: 'item', id: PRODUCTION_PLANNING_ID },
      { type: 'item', id: SHOP_FLOOR_ID },
      { type: 'item', id: 'fulfillment' },
      { type: 'item', id: 'demand' },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
      { type: 'item', id: 'data-sync' },
    ],
    // Executive Command Center stays the landing module for portfolio KPIs; Planning / Floor are one click away.
    defaultActive: 'executive',
  },
  'shop-supervisor': {
    id: 'shop-supervisor',
    label: 'Shop Floor Supervisor',
    segments: [
      { type: 'item', id: inventoryNavIds.parts },
      { type: 'inventory', keys: ['fg'] },
      { type: 'item', id: PRODUCTION_PLANNING_ID },
      { type: 'item', id: SHOP_FLOOR_ID },
      { type: 'item', id: 'fulfillment' },
      { type: 'item', id: 'agents' },
      { type: 'item', id: CONTACTS_ID },
    ],
    defaultActive: SHOP_FLOOR_ID,
  },
};

export const ROLE_CARDS = [
  {
    id: 'admin',
    icon: '🛡️',
    title: 'Admin',
    description: 'Full dashboard access across all modules',
  },
  {
    id: 'material-coordinator',
    icon: '🏭',
    title: 'Material Coordinator',
    description: 'Parts lookup, transfers, inventory adjustments',
  },
  {
    id: 'buyer-planner',
    icon: '📋',
    title: 'Buyer / Planner',
    description: 'Purchase orders, forecasting, supplier management',
  },
  {
    id: 'mfg-engineer',
    icon: '⚙️',
    title: 'Manufacturing Engineer',
    description: 'Production planning, work orders, BOM',
  },
  {
    id: 'warehouse',
    icon: '📦',
    title: 'Warehouse / Receiving',
    description: 'Inbound receiving, shipment confirmation, discrepancies',
  },
  {
    id: 'management',
    icon: '📊',
    title: 'Management',
    description: 'Executive overview, KPIs, order bank',
  },
  {
    id: 'shop-supervisor',
    icon: '🔧',
    title: 'Shop Floor Supervisor',
    description: 'Line status, work orders, shortage flags',
  },
];

export function getRoleConfig(roleId) {
  return ROLES[roleId] || ROLES.management;
}

export { invChildrenForKeys };
