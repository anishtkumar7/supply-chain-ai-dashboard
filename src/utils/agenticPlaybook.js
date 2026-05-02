/**
 * Demo agentic playbook proposals — aligned with AIAgentsModule action label vocabulary.
 * Not connected to real ERP execution.
 */

/** Map dashboard agentAlerts.agent string → AIAgentsModule-style agent id */
export function agentDisplayNameToId(name) {
  const m = {
    'Inventory Agent': 'inventory-agent',
    'Supply Planning Agent': 'supply-planning-agent',
    'Fulfillment Agent': 'fulfillment-agent',
    'Supplier Risk Agent': 'supplier-risk-agent',
    'Order Bank Agent': 'order-bank-agent',
    'Forecast Agent': 'forecast-agent',
  };
  return m[name] || 'inventory-agent';
}

/** Mirrors AIAgentsModule.actionOptionsForAgent when alert is present */
export function playbookActionsForAgentId(agentId) {
  const map = {
    'inventory-agent': ['Create Reorder Request', 'Notify Planner', 'View SKU Detail'],
    'supply-planning-agent': ['Draft PO for Approval', 'Expedite Existing PO', 'Notify Buyer'],
    'fulfillment-agent': ['Escalate to Carrier', 'Request Air Freight Quote', 'Notify Customer Service'],
    'supplier-risk-agent': ['Find Alternate Supplier', 'Expedite Current Order', 'Escalate to Procurement Manager'],
    'order-bank-agent': ['Notify Customer of Delay', 'Pull Forward Inventory', 'Escalate to Planner'],
    'forecast-agent': ['Adjust Forecast', 'Flag for Planner Review', 'Update Demand Plan'],
  };
  return map[agentId] || ['Review Alert', 'Notify Owner', 'Open Module Detail'];
}

function ownerForAgentId(agentId) {
  const m = {
    'inventory-agent': 'Materials / Planner',
    'supply-planning-agent': 'Buyer / Planner',
    'fulfillment-agent': 'Logistics',
    'supplier-risk-agent': 'Procurement',
    'order-bank-agent': 'Customer Ops',
    'forecast-agent': 'Demand Planning',
  };
  return m[agentId] || 'Operations';
}

function impactForSeverity(severity) {
  if (severity === 'CRITICAL') return 'Line output / revenue exposure';
  if (severity === 'HIGH') return 'Customer promise or inbound continuity';
  return 'Schedule or cost variance';
}

function riskLabel(severity) {
  if (severity === 'CRITICAL') return 'Critical';
  if (severity === 'HIGH') return 'High';
  if (severity === 'MEDIUM') return 'Medium';
  return 'Low';
}

function evidenceFromAlert(a, skuData, shipmentData, supplierData) {
  const parts = [];
  if (a.affectedSKU) {
    const sku = skuData?.find((s) => s.sku === a.affectedSKU);
    parts.push(`SKU ${a.affectedSKU}${sku ? ` · ${sku.product}` : ''}`);
  }
  const alertLower = (a.alert || '').slice(0, 220);
  if (alertLower) parts.push(`Alert: ${alertLower}${a.alert && a.alert.length > 220 ? '…' : ''}`);

  const shipMatch = (a.alert || '').match(/SHP-\d+/);
  if (shipMatch && shipmentData?.length) {
    const sh = shipmentData.find((s) => s.id === shipMatch[0]);
    if (sh) parts.push(`Shipment ${sh.id} · ${sh.origin}→${sh.destination} · ${sh.status}`);
  }

  const supMatch = (a.alert || '').match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+OTIF/i);
  if (supMatch && supplierData?.length) {
    const sup = supplierData.find((s) => (a.alert || '').includes(s.name.slice(0, 12)));
    if (sup) parts.push(`Supplier ${sup.id} · risk ${sup.risk} · OTIF ${sup.otifPct}%`);
  }

  return parts.filter(Boolean).join(' · ') || (a.alert || '').slice(0, 280);
}

/**
 * Up to 2 proposed actions per qualifying agent alert (demo density).
 * @returns {Array<{ id: string, agentId: string, agentName: string, proposedAction: string, impact: string, risk: string, owner: string, evidence: string }>}
 */
export function buildPlaybookProposals({ agentAlerts, skuData, shipmentData, supplierData }) {
  const rows = [];
  (agentAlerts || [])
    .filter((a) => a.status === 'ALERT' && a.alert)
    .forEach((a) => {
      const agentId = agentDisplayNameToId(a.agent);
      const actions = playbookActionsForAgentId(agentId).slice(0, 2);
      const impact = impactForSeverity(a.severity);
      const risk = riskLabel(a.severity);
      const owner = ownerForAgentId(agentId);
      const evidence = evidenceFromAlert(a, skuData || [], shipmentData || [], supplierData || []);

      actions.forEach((proposedAction, idx) => {
        const id = `pb-${agentId}-${idx}`;
        rows.push({
          id,
          agentId,
          agentName: a.agent,
          proposedAction,
          impact,
          risk,
          owner,
          evidence,
        });
      });
    });

  return rows;
}
