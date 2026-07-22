import { describe, it, expect, vi } from 'vitest';

import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';
import { buildServiceInstanceRowActions, ServiceInstanceRowActionDeps } from './service-instance-row-actions';

// A managed instance so the gated "Service Keys" action is present.
const managed = (): StServiceInstance => ({
  guid: 'si-1',
  cnsiGuid: 'cf-1',
  name: 'my-db',
  type: 'managed',
} as StServiceInstance);

function deps(overrides: Partial<ServiceInstanceRowActionDeps> = {}): ServiceInstanceRowActionDeps {
  return {
    router: { navigate: vi.fn() } as unknown as ServiceInstanceRowActionDeps['router'],
    confirmDialog: { open: vi.fn() } as unknown as ServiceInstanceRowActionDeps['confirmDialog'],
    snackBar: { error: vi.fn() } as unknown as ServiceInstanceRowActionDeps['snackBar'],
    deleteServiceInstance: vi.fn(),
    isOfferingBindable: () => true,
    ...overrides,
  };
}

const keysAction = (si: StServiceInstance, d: ServiceInstanceRowActionDeps) =>
  buildServiceInstanceRowActions(si, d).find(a => a.label === 'Service Keys');

describe('buildServiceInstanceRowActions — Service Keys breadcrumb context', () => {
  it('tags the keys nav with ?breadcrumbs=<key> when a breadcrumbKey is given', () => {
    const d = deps({ breadcrumbKey: 'space-services' });
    keysAction(managed(), d)!.invoke();

    expect(d.router.navigate).toHaveBeenCalledWith(
      ['/services', 'service', 'cf-1', 'si-1', 'keys'],
      { queryParams: { breadcrumbs: 'space-services' } },
    );
  });

  it('navigates without a breadcrumbs query param when no key is given (global wall)', () => {
    const d = deps();
    keysAction(managed(), d)!.invoke();

    expect(d.router.navigate).toHaveBeenCalledWith(
      ['/services', 'service', 'cf-1', 'si-1', 'keys'],
    );
  });
});
