/**
 * Short escalation hints aligned with manufacturing org reality:
 * buyers own supplier PO recovery; planners own forecast and internal MRP/scheduling narratives.
 */

export function primaryEscalationHintFromAgentAlert(a) {
  const agent = (a.agent || '').toLowerCase();
  const moduleLabel = a.module || '';
  const alert = a.alert || '';
  const alertLc = alert.toLowerCase();

  if (
    moduleLabel === 'Supply Planning' &&
    /mrp\b.*(complete|success)|reorder suggestions generated|purchase planning outputs/i.test(alertLc)
  ) {
    return 'Suggested next step: review MRP outputs with Supply Planner / requirement planning.';
  }

  if (moduleLabel === 'Demand Forecasting' || agent.includes('forecast')) {
    return 'Suggested next step: notify Planner / Demand Planning for forecast alignment.';
  }
  if (moduleLabel === 'Supply Planning' && /escalated customer orders in planning queue/i.test(alert)) {
    return 'Suggested next step: notify Supply Planner for MRP sequencing and planning-queue exceptions.';
  }
  if (moduleLabel.includes('Fulfillment') || agent.includes('fulfillment')) {
    return 'Suggested next step: escalate with Logistics for carrier recovery; notify Buyer if supplier or PO commits are blocking material.';
  }
  return 'Suggested next step: notify Buyer for supplier escalation, overdue POs, shortages, and line-at-risk recovery.';
}

/** @param {{ module?: string, agent?: string, alert?: string }} slice */
export function appendEscalationHint(body, slice) {
  const hint = primaryEscalationHintFromAgentAlert({ ...slice, alert: slice.alert ?? body });
  return `${body}\n\n${hint}`;
}
