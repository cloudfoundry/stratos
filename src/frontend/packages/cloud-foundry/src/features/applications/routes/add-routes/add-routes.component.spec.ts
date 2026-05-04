import { CUSTOM_ELEMENTS_SCHEMA, computed, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { ApplicationServiceMock } from '@test-framework/cf';
import { RouterNav } from '@stratosui/store';

import { AddRoutesComponent } from './add-routes.component';
import { ApplicationService } from '../../application.service';
import { AppDetailDataService } from '../../app-detail-data.service';
import { AppRouteActionsService, CreateRouteRequest } from '../../../../shared/services/app-route-actions.service';
import { CfMapRoutesSignalConfigService } from '../../../../shared/components/list/list-types/app-route/cf-map-routes-signal-config.service';
import type { StRoute } from '../../../../services/endpoint-data/stratos-types';

// Spy holders, refreshed per test.
let createAndAttach: ReturnType<typeof vi.fn>;
let attachRoute: ReturnType<typeof vi.fn>;
let addRoute: ReturnType<typeof vi.fn>;
let storeDispatch: ReturnType<typeof vi.fn>;
let mapRefresh: ReturnType<typeof vi.fn>;

let pickerRoutes: WritableSignal<StRoute[]>;
let pickerSelectedKey: WritableSignal<string | null>;

const makeRoute = (overrides: Partial<StRoute> = {}): StRoute => ({
  guid: 'route-1',
  url: 'host1.example.com/path',
  host: 'host1',
  path: '/path',
  domainGuid: 'domain-http',
  spaceGuid: 'mockSpaceGuid',
  cnsiGuid: 'mockCfGuid',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

const makeDataStub = () => {
  addRoute = vi.fn();
  return {
    addRoute,
    routes: signal<any[] | null>([]).asReadonly(),
    appDetail: signal<any>(undefined).asReadonly(),
    cnsiGuid: 'mockCfGuid',
    appGuid: 'mockAppGuid',
  };
};

const makeActionsStub = () => {
  createAndAttach = vi.fn(async (_req: CreateRouteRequest) => makeRoute({ guid: 'created-route' }));
  attachRoute = vi.fn(async (_guid: string) => undefined);
  return {
    createAndAttachRoute: createAndAttach,
    attachRoute,
    inFlight: signal(false).asReadonly(),
    transitioningRouteGuid: signal<string | null>(null).asReadonly(),
  };
};

const makeMapConfigStub = () => {
  pickerRoutes = signal<StRoute[]>([]);
  pickerSelectedKey = signal<string | null>(null);
  const filtered = computed(() => pickerRoutes());
  const view = {
    pagedItems: filtered,
    totalFilteredResults: computed(() => filtered().length),
    totalPages: computed(() => 1),
  };
  mapRefresh = vi.fn(async () => undefined);
  return {
    view,
    routes: pickerRoutes.asReadonly(),
    selectedKey: pickerSelectedKey.asReadonly(),
    pageIndex: signal(0),
    pageSize: signal(25),
    nameFilter: signal(''),
    sort: signal({ field: 'createdAt', direction: 'desc' as const }),
    viewMode: signal<'table' | 'card'>('table'),
    refresh: mapRefresh,
    clearFilters: vi.fn(),
    buildColumns: () => [
      { header: '', key: 'radio', kind: 'radio' as const, render: () => '', radio: { selectedKey: pickerSelectedKey } },
      { header: 'Host', key: 'host', render: (r: StRoute) => r.host ?? '' },
    ],
  };
};

const mockStore = {
  dispatch: vi.fn(),
  select: vi.fn(() => of({})),
  pipe: vi.fn(() => of({})),
};

describe('AddRoutesComponent', () => {
  let component: AddRoutesComponent;
  let fixture: ComponentFixture<AddRoutesComponent>;

  beforeEach(async () => {
    storeDispatch = mockStore.dispatch = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AddRoutesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: Store, useValue: mockStore },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: AppRouteActionsService, useFactory: makeActionsStub },
        { provide: CfMapRoutesSignalConfigService, useFactory: makeMapConfigStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
    if (fixture) {
      try {
        fixture.destroy();
      } catch (_e) {
        // Ignore cleanup errors.
      }
    }
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the create form (Domain dropdown + host/path inputs) by default', () => {
    expect(component.addRouteMode.id).toBe('create');
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('app-select')).toBeTruthy();
    // The host and path appear inside their HTTP form (default selectedDomain undefined → http branch shown).
    expect(html.querySelector('input[formcontrolname="host"]')).toBeTruthy();
    expect(html.querySelector('input[formcontrolname="path"]')).toBeTruthy();
  });

  it('renders <app-signal-list> picker when mode toggles to map', () => {
    component.addRouteMode = component.addRouteModes[1];
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-test="map-routes-picker"]')).toBeTruthy();
    expect(html.querySelector('app-signal-list')).toBeTruthy();
  });

  it('refreshes the picker when toggling into map mode', () => {
    expect(mapRefresh).not.toHaveBeenCalled();
    component.addRouteMode = component.addRouteModes[1];
    expect(mapRefresh).toHaveBeenCalledTimes(1);
  });

  it('submit in HTTP create mode calls createAndAttachRoute with host/path + relationships (no port)', async () => {
    // Wire up the form for an HTTP submission.
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { metadata: { guid: 'domain-http' }, entity: { router_group_type: 'http' } } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'newhost', path: 'subpath' });

    await component.runSubmit();

    expect(createAndAttach).toHaveBeenCalledTimes(1);
    const req = createAndAttach.mock.calls[0][0] as CreateRouteRequest;
    expect(req.host).toBe('newhost');
    expect(req.path).toBe('/subpath');
    expect(req.port).toBeUndefined();
    expect(req.relationships.space.data.guid).toBe('mockSpaceGuid');
    expect(req.relationships.domain.data.guid).toBe('domain-http');
  });

  it('submit in TCP create mode calls createAndAttachRoute with port + relationships (no host/path)', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { metadata: { guid: 'domain-tcp' }, entity: { router_group_type: 'tcp' } } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addTCPRoute.patchValue({ port: '5005', useRandomPort: false });

    await component.runSubmit();

    expect(createAndAttach).toHaveBeenCalledTimes(1);
    const req = createAndAttach.mock.calls[0][0] as CreateRouteRequest;
    expect(req.host).toBeUndefined();
    expect(req.path).toBeUndefined();
    expect(req.port).toBe(5005);
    expect(req.relationships.domain.data.guid).toBe('domain-tcp');
  });

  it('submit in TCP create mode with useRandomPort=true omits port', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { metadata: { guid: 'domain-tcp' }, entity: { router_group_type: 'tcp' } } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addTCPRoute.patchValue({ port: '', useRandomPort: true });

    await component.runSubmit();

    const req = createAndAttach.mock.calls[0][0] as CreateRouteRequest;
    expect(req.port).toBeUndefined();
  });

  it('on createAndAttachRoute success: dataService.addRoute called with returned StRoute, then RouterNav dispatched', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { metadata: { guid: 'domain-http' }, entity: { router_group_type: 'http' } } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'h', path: '' });

    const created = makeRoute({ guid: 'created-1', url: 'h.example.com' });
    createAndAttach.mockResolvedValueOnce(created);

    await component.runSubmit();

    expect(addRoute).toHaveBeenCalledWith(created);
    const dispatched = storeDispatch.mock.calls.find(call => call[0] instanceof RouterNav);
    expect(dispatched).toBeTruthy();
    const nav = dispatched![0] as RouterNav;
    expect(nav.payload.path).toEqual(['/applications', 'mockCfGuid', 'mockAppGuid', 'routes']);
  });

  it('on createAndAttachRoute orphan failure: error propagates with Orphan route message; no RouterNav', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { metadata: { guid: 'domain-http' }, entity: { router_group_type: 'http' } } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'h', path: '' });

    createAndAttach.mockRejectedValueOnce(
      new Error('Route created but attach failed. Orphan route in space: guid=orphan-1 url=orphan.example.com. Original error: 500'),
    );

    await expect(component.runSubmit()).rejects.toThrow(/Orphan route/);

    expect(addRoute).not.toHaveBeenCalled();
    const dispatched = storeDispatch.mock.calls.find(call => call[0] instanceof RouterNav);
    expect(dispatched).toBeUndefined();
  });

  it('submit in map mode: looks up selectedRow, calls attachRoute, then dataService.addRoute then RouterNav', async () => {
    const r1 = makeRoute({ guid: 'pick-1' });
    const r2 = makeRoute({ guid: 'pick-2' });
    pickerRoutes.set([r1, r2]);
    pickerSelectedKey.set('pick-2');

    component.addRouteMode = component.addRouteModes[1];
    await component.runSubmit();

    expect(attachRoute).toHaveBeenCalledWith('pick-2');
    expect(addRoute).toHaveBeenCalledWith(r2);
    const dispatched = storeDispatch.mock.calls.find(call => call[0] instanceof RouterNav);
    expect(dispatched).toBeTruthy();
  });

  it('submit button disabled when form invalid (signalHandle.valid = false)', () => {
    // Default state: no domain selected, no host entered → invalid.
    expect(component.signalHandle.valid()).toBe(false);
  });

  it('signalHandle.valid recomputes when host/domain change in create mode', () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { metadata: { guid: 'domain-http' }, entity: { router_group_type: 'http' } } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'valid', path: '' });
    fixture.detectChanges();
    expect(component.signalHandle.valid()).toBe(true);
  });

  it('signalHandle.valid in map mode tracks selectedKey', () => {
    component.addRouteMode = component.addRouteModes[1];
    fixture.detectChanges();
    expect(component.signalHandle.valid()).toBe(false);
    pickerSelectedKey.set('any');
    fixture.detectChanges();
    expect(component.signalHandle.valid()).toBe(true);
  });
});
