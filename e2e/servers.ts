/**
 * Where the e2e run's console is. playwright.config.ts starts its servers on
 * these ports and uses BASE_URL as every project's baseURL; fixtures and hooks
 * that reach the console outside a test's own `baseURL` (worker-scoped
 * contexts, beforeAll hooks) read the same values, so a run on other ports
 * never logs into a server it did not start.
 *
 *   E2E_BASE_URL       a deployed console to test instead; no local servers start
 *   E2E_FRONTEND_PORT  e2e frontend port (default 5540)
 *   E2E_BACKEND_PORT   e2e backend port (default 5543)
 *
 * The E2E_ prefix keeps them apart from the dev servers' FRONTEND_PORT and
 * BACKEND_PORT (Makefile, proxy.conf.cjs).
 *
 * No imports, so scripts/tests can load it directly.
 */
export function e2eServers(env: Record<string, string | undefined> = process.env) {
  // FRONTEND_PORT and BACKEND_PORT are the names before E2E_; remove this
  // fallback after the next release.
  const backendPort = env.E2E_BACKEND_PORT || env.BACKEND_PORT || '5543';
  const frontendPort = env.E2E_FRONTEND_PORT || env.FRONTEND_PORT || '5540';
  return {
    backendPort,
    frontendPort,
    baseURL: env.E2E_BASE_URL || `https://localhost:${frontendPort}`,
  };
}

export const { backendPort: BACKEND_PORT, frontendPort: FRONTEND_PORT, baseURL: BASE_URL } = e2eServers();
