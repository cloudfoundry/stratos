import type { StServiceInstance } from '../../services/endpoint-data/stratos-types';

// Shared "Dashboard" cell for the service-instance lists. Restores the
// v4.9.3 external-link cell (launch icon + "View", new tab) that the
// signal-list migration dropped — see GH #5490. Pair with a
// `kind: 'link'` column whose `externalLink` is dashboardLink and whose
// `render` is renderDashboard. Managed instances with a dashboard_url
// render the link; everything else (UPS, or managed with no dashboard)
// renders "None".

// External dashboard URL, or null when absent — the signal-list renders
// null as plain text (the "None" from renderDashboard).
export function dashboardLink(si: StServiceInstance): string | null {
  return si.dashboardUrl || null;
}

export function renderDashboard(si: StServiceInstance): string {
  return si.dashboardUrl ? 'View' : 'None';
}
