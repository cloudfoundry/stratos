import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CfAppServiceBindingsSignalConfigService } from './cf-app-service-bindings-signal-config.service';
import { AppDetailDataService } from '../../../features/applications/app-detail-data.service';
import { AppServiceBindingActionsService } from '../../services/app-service-binding-actions.service';
import type { StServiceCredentialBinding } from '../../../services/endpoint-data/stratos-types';

function makeBinding(overrides: Partial<StServiceCredentialBinding> = {}): StServiceCredentialBinding {
  return {
    guid: 'bind-1',
    cnsiGuid: 'cnsi-1',
    type: 'app',
    serviceInstance: { guid: 'si-1', name: 'redis-cache', type: 'managed' } as any,
    app: { guid: 'app-1', name: 'my-app' } as any,
    serviceOffering: { guid: 'svc-1', name: 'redis' } as any,
    servicePlan: { guid: 'plan-1', name: 'small' } as any,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

function makeDataServiceStub(initial: StServiceCredentialBinding[] | null = []) {
  const serviceBindings = signal<StServiceCredentialBinding[] | null>(initial);
  return {
    serviceBindings,
    refresh: vi.fn(async (_kind?: string) => undefined),
    removeServiceBinding: vi.fn(),
  };
}

function makeActionsServiceStub() {
  return {
    transitioningBindingGuid: signal<string | null>(null),
    inFlight: signal(false),
    unbindService: vi.fn(async (_guid: string) => undefined),
  };
}

function configure(opts?: {
  initialBindings?: StServiceCredentialBinding[] | null;
  data?: ReturnType<typeof makeDataServiceStub>;
  actions?: ReturnType<typeof makeActionsServiceStub>;
}): {
  svc: CfAppServiceBindingsSignalConfigService;
  data: ReturnType<typeof makeDataServiceStub>;
  actions: ReturnType<typeof makeActionsServiceStub>;
} {
  TestBed.resetTestingModule();
  const data = opts?.data ?? makeDataServiceStub(opts?.initialBindings ?? []);
  const actions = opts?.actions ?? makeActionsServiceStub();

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      CfAppServiceBindingsSignalConfigService,
      { provide: AppDetailDataService, useValue: data },
      { provide: AppServiceBindingActionsService, useValue: actions },
    ],
  });
  const svc = TestBed.inject(CfAppServiceBindingsSignalConfigService);
  return { svc, data, actions };
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfAppServiceBindingsSignalConfigService', () => {
  it('constructs without throwing', () => {
    expect(() => configure()).not.toThrow();
  });

  it('exposes filter, sort, pageSize, pageIndex, nameFilter, viewMode signals', () => {
    const { svc } = configure();
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.nameFilter).toBeDefined();
    expect(svc.viewMode).toBeDefined();
  });

  it('builds a ViewPipeline driven by serviceBindings()', () => {
    const { svc } = configure();
    expect(svc.view).toBeDefined();
    TestBed.tick();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  it('flows serviceBindings() through the source signal', () => {
    const data = makeDataServiceStub([
      makeBinding({ guid: 'b1' }),
      makeBinding({ guid: 'b2' }),
    ]);
    const { svc } = configure({ data });
    TestBed.tick();
    expect(svc.view.pagedItems().length).toBe(2);
  });

  it('treats null serviceBindings as empty (pre-first-fetch)', () => {
    const data = makeDataServiceStub(null);
    const { svc } = configure({ data });
    TestBed.tick();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  it('nameFilter filters by service instance name (substring, case-insensitive)', () => {
    const data = makeDataServiceStub([
      makeBinding({ guid: 'b1', serviceInstance: { guid: 'si-1', name: 'redis-cache', type: 'managed' } as any }),
      makeBinding({ guid: 'b2', serviceInstance: { guid: 'si-2', name: 'postgres-main', type: 'managed' } as any }),
    ]);
    const { svc } = configure({ data });
    TestBed.tick();
    svc.nameFilter.set('REDIS');
    TestBed.tick();
    const visible = svc.view.pagedItems();
    expect(visible.length).toBe(1);
    expect(visible[0].guid).toBe('b1');
  });

  it('clearFilters resets nameFilter, sort, pageIndex', () => {
    const { svc } = configure();
    svc.nameFilter.set('foo');
    svc.pageIndex.set(2);
    svc.sort.set({ field: 'name', direction: 'asc' });
    svc.clearFilters();
    expect(svc.nameFilter()).toBe('');
    expect(svc.pageIndex()).toBe(0);
    expect(svc.sort()).toEqual({ field: 'createdAt', direction: 'desc' });
  });

  it('refresh calls dataService.refresh("serviceBindings")', async () => {
    const { svc, data } = configure();
    await svc.refresh();
    expect(data.refresh).toHaveBeenCalledWith('serviceBindings');
  });

  it('buildColumns returns Name + Service + Plan + Binding Date + Actions', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const keys = cols.map(c => c.key);
    expect(keys).toEqual(['name', 'service', 'plan', 'createdAt', 'actions']);
  });

  it('Service column renders "User Provided" for UPS bindings', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const serviceCol = cols.find(c => c.key === 'service')!;
    const ups = makeBinding({
      serviceInstance: { guid: 'si-1', name: 'creds', type: 'user-provided' } as any,
      serviceOffering: undefined,
    });
    expect(serviceCol.render(ups)).toBe('User Provided');
  });

  it('Service column renders the offering name for managed bindings', () => {
    const { svc } = configure();
    const cols = svc.buildColumns();
    const serviceCol = cols.find(c => c.key === 'service')!;
    const managed = makeBinding({
      serviceInstance: { guid: 'si-1', name: 'cache', type: 'managed' } as any,
      serviceOffering: { guid: 'svc-1', name: 'redis-cluster' } as any,
    });
    expect(serviceCol.render(managed)).toBe('redis-cluster');
  });

  it('default buildRowActions wires Unbind to actionsService.unbindService', () => {
    const { svc, actions } = configure();
    const row = makeBinding({ guid: 'b-7' });
    const acts = svc.buildRowActions(row);
    const unbind = acts.find(a => a.label === 'Unbind')!;
    unbind.invoke();
    expect(actions.unbindService).toHaveBeenCalledWith('b-7');
  });
});
