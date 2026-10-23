import { describe, it, expect, vi } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';

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
    const si = managed();
    keysAction(si, d)!.invoke(si);

    expect(d.router.navigate).toHaveBeenCalledWith(
      ['/services', 'service', 'cf-1', 'si-1', 'keys'],
      { queryParams: { breadcrumbs: 'space-services' } },
    );
  });

  it('navigates without a breadcrumbs query param when no key is given (global wall)', () => {
    const d = deps();
    const si = managed();
    keysAction(si, d)!.invoke(si);

    expect(d.router.navigate).toHaveBeenCalledWith(
      ['/services', 'service', 'cf-1', 'si-1', 'keys'],
    );
  });
});

describe('buildServiceInstanceRowActions — Delete failure', () => {
  it('shows the broker detail when the delete fails on the fast path', async () => {
    const httpError = new HttpErrorResponse({
      error: { state: 'FAILED', errors: [{ code: 'cf.v3.10009', message: 'CF-UnableToPerform', detail: 'deprovision could not be completed: instance is busy' }] },
      status: 502, statusText: 'Bad Gateway',
    });
    let confirmed: (() => Promise<void>) | undefined;
    const d = deps({
      confirmDialog: { open: vi.fn((_c: unknown, cb: () => Promise<void>) => { confirmed = cb; }) } as unknown as ServiceInstanceRowActionDeps['confirmDialog'],
      deleteServiceInstance: vi.fn().mockRejectedValue(httpError),
    });
    const si = managed();
    buildServiceInstanceRowActions(si, d).find(a => a.label === 'Delete')!.invoke(si);
    await confirmed!();

    expect(d.snackBar.error).toHaveBeenCalledWith([
      { text: 'Delete failed: deprovision could not be completed: instance is busy', style: 'text' },
    ]);
  });

  it('shows a broker\'s HTML error page as its heading and message', async () => {
    const httpError = new HttpErrorResponse({
      error: { errors: [{ code: 10001, title: 'CF-ServiceBrokerBadResponse', detail: '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>' }] },
      status: 502, statusText: 'Bad Gateway',
    });
    let confirmed: (() => Promise<void>) | undefined;
    const d = deps({
      confirmDialog: { open: vi.fn((_c: unknown, cb: () => Promise<void>) => { confirmed = cb; }) } as unknown as ServiceInstanceRowActionDeps['confirmDialog'],
      deleteServiceInstance: vi.fn().mockRejectedValue(httpError),
    });
    const si = managed();
    buildServiceInstanceRowActions(si, d).find(a => a.label === 'Delete')!.invoke(si);
    await confirmed!();

    expect(d.snackBar.error).toHaveBeenCalledWith([
      { text: 'Delete failed: ', style: 'text' },
      { text: '502 Bad Gateway', style: 'heading' },
      { text: '\nnginx', style: 'text' },
    ]);
  });
});

describe('buildServiceInstanceRowActions — Delete with an unknown result', () => {
  const confirmDelete = async (d: ServiceInstanceRowActionDeps): Promise<void> => {
    let confirmed: (() => Promise<void>) | undefined;
    d.confirmDialog.open = vi.fn((_c: unknown, cb: () => Promise<void>) => { confirmed = cb; }) as never;
    const si = managed();
    buildServiceInstanceRowActions(si, d).find(a => a.label === 'Delete')!.invoke(si);
    await confirmed!();
  };

  it('says the result could not be determined and points at the list', async () => {
    const d = deps({ deleteServiceInstance: vi.fn().mockResolvedValue('unknown') });
    await confirmDelete(d);

    expect(d.snackBar.error).toHaveBeenCalledWith(
      'Delete "my-db": the operation ended, but its result could not be determined. The list shows the current state.',
    );
  });

  it('points at the place the host names', async () => {
    const d = deps({ deleteServiceInstance: vi.fn().mockResolvedValue('unknown'), unknownOutcomeWhere: 'This page' });
    await confirmDelete(d);

    expect(d.snackBar.error).toHaveBeenCalledWith(expect.stringContaining('This page shows the current state.'));
  });

  it('says nothing when the instance was deleted', async () => {
    const d = deps({ deleteServiceInstance: vi.fn().mockResolvedValue('deleted') });
    await confirmDelete(d);

    expect(d.snackBar.error).not.toHaveBeenCalled();
  });
});
