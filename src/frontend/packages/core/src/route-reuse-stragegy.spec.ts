import { describe, it, expect, vi } from 'vitest';
import { ActivatedRouteSnapshot } from '@angular/router';

// The strategy imports DashboardBaseComponent purely for identity
// comparison. Stub it so the spec doesn't pull the whole app template
// tree — we only need a stable class reference.
vi.mock('./features/dashboard/dashboard-base/dashboard-base.component', () => ({
  DashboardBaseComponent: class DashboardBaseComponent {},
}));

import { CustomReuseStrategy } from './route-reuse-stragegy';

// Stand-in for a detail shell keyed by route params (like ApplicationBaseComponent).
class FakeShell {}

function snap(opts: {
  component?: unknown; data?: Record<string, unknown>; params?: Record<string, string>; root?: boolean;
}): ActivatedRouteSnapshot {
  return {
    component: opts.component ?? null,
    data: opts.data ?? {},
    params: opts.params ?? {},
    // Angular gives every node a route config except the root.
    routeConfig: opts.root ? null : {},
  } as unknown as ActivatedRouteSnapshot;
}

describe('CustomReuseStrategy', () => {
  const strat = new CustomReuseStrategy();

  it('reuses a component-keyed shell across tab switches (params unchanged)', () => {
    const curr = snap({ component: FakeShell, data: { reuseRoute: FakeShell }, params: { endpointId: 'cf1', id: 'app1' } });
    const future = snap({ component: FakeShell, data: { reuseRoute: FakeShell }, params: { endpointId: 'cf1', id: 'app1' } });
    expect(strat.shouldReuseRoute(future, curr)).toBe(true);
  });

  it('does NOT reuse a component-keyed shell across different resources (params differ) — #5519', () => {
    const curr = snap({ component: FakeShell, data: { reuseRoute: FakeShell }, params: { endpointId: 'cf1', id: 'app1' } });
    const future = snap({ component: FakeShell, data: { reuseRoute: FakeShell }, params: { endpointId: 'cf1', id: 'app2' } });
    expect(strat.shouldReuseRoute(future, curr)).toBe(false);
  });

  it('does not reuse a component route with no reuseRoute marker', () => {
    const curr = snap({ component: FakeShell, data: {}, params: { id: 'app1' } });
    const future = snap({ component: FakeShell, data: {}, params: { id: 'app1' } });
    expect(strat.shouldReuseRoute(future, curr)).toBe(false);
  });

  it('still reuses a data-only (component-less) reuseRoute:true route', () => {
    const curr = snap({ component: null, data: { reuseRoute: true }, params: {} });
    const future = snap({ component: null, data: { reuseRoute: true }, params: {} });
    expect(strat.shouldReuseRoute(future, curr)).toBe(true);
  });

  // The root snapshot node (and componentless path-group nodes) have
  // component: null and no reuseRoute marker. Returning false there makes
  // Angular recreate the whole ActivatedRoute tree, so every outlet below
  // rebuilds and the reuseRoute markers never get a say — which is exactly
  // how the #5519 fix stayed broken in the running app.
  it('reuses a componentless, unmarked node (root / path group) when params match', () => {
    const curr = snap({ component: null, data: {}, params: {} });
    const future = snap({ component: null, data: {}, params: {} });
    expect(strat.shouldReuseRoute(future, curr)).toBe(true);
  });

  // The router's first state after a page load has a root with no
  // component; the next navigation's root carries AppComponent. Not reusing
  // the root there rebuilt the whole tree, dashboard shell included, on the
  // first in-app navigation after every load.
  it('reuses the root even when only one side carries AppComponent', () => {
    class AppComponent {}
    const curr = snap({ root: true, component: null });
    const future = snap({ root: true, component: AppComponent });
    expect(strat.shouldReuseRoute(future, curr)).toBe(true);
  });

  it('does NOT reuse a componentless, unmarked node when params differ', () => {
    const curr = snap({ component: null, data: {}, params: { endpointId: 'cf1' } });
    const future = snap({ component: null, data: {}, params: { endpointId: 'cf2' } });
    expect(strat.shouldReuseRoute(future, curr)).toBe(false);
  });
});
