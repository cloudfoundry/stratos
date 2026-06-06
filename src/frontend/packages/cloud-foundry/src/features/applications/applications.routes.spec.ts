import { Route } from '@angular/router';

import { APPLICATIONS_ROUTES } from './applications.routes';

// Locate the app-detail tab children: APPLICATIONS_ROUTES → empty-path entry
// (children) → ':endpointId/:id' entry (children) → empty-path
// ApplicationTabsBaseComponent entry (children) holds the per-tab routes.
function getAppDetailTabChildren(): Route[] {
  const root = APPLICATIONS_ROUTES.find(r => r.path === '' && !!r.children);
  const detail = root?.children?.find(r => r.path === ':endpointId/:id');
  const tabsBase = detail?.children?.find(r => r.path === '' && !!r.children);
  return tabsBase?.children ?? [];
}

describe('APPLICATIONS_ROUTES', () => {
  it('legacy instances route redirects to summary', () => {
    const children = getAppDetailTabChildren();
    const route = children.find(r => r.path === 'instances');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('summary');
    expect(route?.pathMatch).toBe('full');
  });

  it('summary remains a real sibling route', () => {
    const children = getAppDetailTabChildren();
    const summary = children.find(r => r.path === 'summary');
    expect(summary).toBeDefined();
    expect(summary?.component).toBeDefined();
  });
});
