/** Session flag set before reload so the dashboard can boot into a non-crisis demo. */
export const CLEAN_SAMPLE_SESSION_KEY = 'vectrum_clean_sample_bootstrap_v1';

export function readInitialDemoScenario() {
  if (typeof window === 'undefined') return 'crisis';
  try {
    if (window.sessionStorage.getItem(CLEAN_SAMPLE_SESSION_KEY) === '1') {
      window.sessionStorage.removeItem(CLEAN_SAMPLE_SESSION_KEY);
      return 'clean';
    }
  } catch {
    /* ignore */
  }
  return 'crisis';
}

export function reloadWithCrisisDemoSeed() {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export function reloadWithCleanSample() {
  try {
    window.sessionStorage.setItem(CLEAN_SAMPLE_SESSION_KEY, '1');
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
  window.location.reload();
}
