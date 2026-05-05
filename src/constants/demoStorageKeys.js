/**
 * localStorage keys used for demo persistence (cleared by "Reset Demo Data" in Data Sync).
 */
export const RIVIT_ADJUSTMENTS_KEY = 'rivit_adjustments';
export const RIVIT_POS_KEY = 'rivit_pos';
export const RIVIT_DISMISSED_AGENT_ALERTS_KEY = 'rivit_dismissed_agent_alerts';

export const SC_AGENTIC_PLAYBOOK_STATUS_KEY = 'sc-agentic-playbook-status';
export const SC_AGENTIC_PLAYBOOK_CONSTRAINTS_KEY = 'sc-agentic-playbook-constraints';
export const SC_AGENTIC_PLAYBOOK_AUDIT_KEY = 'sc-agentic-playbook-audit';

export const SC_UI_DENSITY_KEY = 'sc-ui-density';
export const SC_PLANNER_ESCALATIONS_KEY = 'sc-planner-escalations';

/** All keys removed when resetting demo state between sessions */
export const DEMO_RESET_STORAGE_KEYS = [
  RIVIT_ADJUSTMENTS_KEY,
  RIVIT_POS_KEY,
  RIVIT_DISMISSED_AGENT_ALERTS_KEY,
  SC_AGENTIC_PLAYBOOK_STATUS_KEY,
  SC_AGENTIC_PLAYBOOK_CONSTRAINTS_KEY,
  SC_AGENTIC_PLAYBOOK_AUDIT_KEY,
  SC_UI_DENSITY_KEY,
  SC_PLANNER_ESCALATIONS_KEY,
];

export function clearDemoLocalStorage() {
  DEMO_RESET_STORAGE_KEYS.forEach((k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}
