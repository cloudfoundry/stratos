import { CUSTOM_ELEMENTS_SCHEMA, computed, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationServiceMock } from '@test-framework/cf';

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
let routerNavigate: ReturnType<typeof vi.fn>;
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
  // Tests can drive `pickerRoutes` directly. Available/attached splits read
  // off it through computed signals so test setup mirrors the runtime
  // service shape — including the redesigned single-screen flow's two
  // derived views.
  const myAppGuid = 'mockAppGuid';
  const attachedRoutes = computed(() =>
    pickerRoutes().filter(r => (r.appGuids ?? []).includes(myAppGuid)),
  );
  const availableRoutes = computed(() =>
    pickerRoutes().filter(r => !(r.appGuids ?? []).includes(myAppGuid)),
  );
  const filtered = availableRoutes; // picker view shows only available rows now
  const view = {
    pagedItems: filtered,
    totalFilteredResults: computed(() => filtered().length),
    totalPages: computed(() => 1),
  };
  mapRefresh = vi.fn(async () => undefined);
  return {
    view,
    routes: pickerRoutes.asReadonly(),
    attachedRoutes,
    availableRoutes,
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

describe('AddRoutesComponent', () => {
  let component: AddRoutesComponent;
  let fixture: ComponentFixture<AddRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRoutesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: AppRouteActionsService, useFactory: makeActionsStub },
        { provide: CfMapRoutesSignalConfigService, useFactory: makeMapConfigStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    routerNavigate = vi.spyOn(TestBed.inject(Router), 'navigate')
      .mockImplementation(() => Promise.resolve(true)) as unknown as ReturnType<typeof vi.fn>;

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

  it('renders both lists and the create form on load', () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-test="available-routes"]')).toBeTruthy();
    expect(html.querySelector('[data-test="create-route-form"]')).toBeTruthy();
    // Create-form fields present.
    expect(html.querySelector('app-select')).toBeTruthy();
    expect(html.querySelector('input[formcontrolname="host"]')).toBeTruthy();
    expect(html.querySelector('input[formcontrolname="path"]')).toBeTruthy();
  });

  it('always renders the attached-list accordion (closed when no attached routes)', () => {
    pickerRoutes.set([
      makeRoute({ guid: 'detached-1', appGuids: [] }),
      makeRoute({ guid: 'other-app', appGuids: ['other'] }),
    ]);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    const section = html.querySelector('[data-test="attached-routes"]') as HTMLDetailsElement;
    expect(section).toBeTruthy();
    expect(section.tagName.toLowerCase()).toBe('details');
    expect(section.open).toBe(false);
    expect(component.attachedListOpen()).toBe(false);
  });

  it('opens the accordion by default when 1-3 routes are attached', () => {
    pickerRoutes.set([
      makeRoute({ guid: 'mine-1', appGuids: ['mockAppGuid'] }),
      makeRoute({ guid: 'mine-2', appGuids: ['mockAppGuid'] }),
      makeRoute({ guid: 'mine-3', appGuids: ['mockAppGuid'] }),
    ]);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    const section = html.querySelector('[data-test="attached-routes"]') as HTMLDetailsElement;
    expect(section).toBeTruthy();
    expect(section.tagName.toLowerCase()).toBe('details');
    expect(section.open).toBe(true);
    expect(component.attachedListOpen()).toBe(true);
  });

  it('keeps the accordion closed by default when 4+ routes are attached', () => {
    pickerRoutes.set([
      makeRoute({ guid: 'mine-1', appGuids: ['mockAppGuid'] }),
      makeRoute({ guid: 'mine-2', appGuids: ['mockAppGuid'] }),
      makeRoute({ guid: 'mine-3', appGuids: ['mockAppGuid'] }),
      makeRoute({ guid: 'mine-4', appGuids: ['mockAppGuid'] }),
    ]);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    const section = html.querySelector('[data-test="attached-routes"]') as HTMLDetailsElement;
    expect(section).toBeTruthy();
    expect(section.tagName.toLowerCase()).toBe('details');
    expect(section.open).toBe(false);
    expect(html.querySelector('[data-test="attached-routes"] summary')!.textContent)
      .toContain('Already attached to this app (4)');
    expect(component.attachedListOpen()).toBe(false);
  });

  it('user toggle of the accordion overrides the count-driven default', () => {
    pickerRoutes.set([
      makeRoute({ guid: 'mine-1', appGuids: ['mockAppGuid'] }),
    ]);
    fixture.detectChanges();
    expect(component.attachedListOpen()).toBe(true); // 1-3 routes → open by default
    component.attachedListExpanded.set(false);
    fixture.detectChanges();
    expect(component.attachedListOpen()).toBe(false); // user override wins
  });

  it('eagerly refreshes the picker on init (no radio toggle required)', () => {
    expect(mapRefresh).toHaveBeenCalled();
  });

  it('submit in HTTP create mode calls createAndAttachRoute with host/path + relationships (no port)', async () => {
    // Wire up the form for an HTTP submission.
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
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
    component.selectedDomain = { guid: 'domain-tcp', supportedProtocols: ['tcp'] } as any;
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
    component.selectedDomain = { guid: 'domain-tcp', supportedProtocols: ['tcp'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addTCPRoute.patchValue({ port: '', useRandomPort: true });

    await component.runSubmit();

    const req = createAndAttach.mock.calls[0][0] as CreateRouteRequest;
    expect(req.port).toBeUndefined();
  });

  it('on createAndAttachRoute success: dataService.addRoute called with returned StRoute, then router navigates back to routes list', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'h', path: '' });

    const created = makeRoute({ guid: 'created-1', url: 'h.example.com' });
    createAndAttach.mockResolvedValueOnce(created);

    await component.runSubmit();

    expect(addRoute).toHaveBeenCalledWith(created);
    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications', 'mockCfGuid', 'mockAppGuid', 'routes'],
    );
  });

  it('on createAndAttachRoute orphan failure: error propagates with Orphan route message; no navigation', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'h', path: '' });

    createAndAttach.mockRejectedValueOnce(
      new Error('Route created but attach failed. Orphan route in space: guid=orphan-1 url=orphan.example.com. Original error: 500'),
    );

    await expect(component.runSubmit()).rejects.toThrow(/Orphan route/);

    expect(addRoute).not.toHaveBeenCalled();
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('on 422 RouteHostTaken: surfaces generic name-unavailable message', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'taken', path: '' });

    const httpErr = Object.assign(new Error('Http failure response'), {
      status: 422,
      error: { errors: [{ code: 210003, title: 'CF-RouteHostTaken', detail: 'Host is taken' }] },
    });
    createAndAttach.mockRejectedValueOnce(httpErr);

    await expect(component.runSubmit()).rejects.toThrow(/Route name is unavailable/);
  });

  it('on 422 with non-uniqueness code: passes CF detail through', async () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'invalid', path: '' });

    const httpErr = Object.assign(new Error('Quota exceeded'), {
      status: 422,
      error: { errors: [{ code: 10008, title: 'CF-QuotaExceeded', detail: 'Quota exceeded' }] },
    });
    createAndAttach.mockRejectedValueOnce(httpErr);

    await expect(component.runSubmit()).rejects.toThrow(/Quota exceeded/);
  });

  it('row selected: runSubmit dispatches attach and skips create', async () => {
    const r1 = makeRoute({ guid: 'pick-1', appGuids: [] });
    const r2 = makeRoute({ guid: 'pick-2', appGuids: [] });
    pickerRoutes.set([r1, r2]);
    pickerSelectedKey.set('pick-2');

    await component.runSubmit();

    expect(attachRoute).toHaveBeenCalledWith('pick-2');
    expect(createAndAttach).not.toHaveBeenCalled();
    expect(addRoute).toHaveBeenCalledWith(r2);
    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications', 'mockCfGuid', 'mockAppGuid', 'routes'],
    );
  });

  it('submit gate: invalid form + no selection → not valid', () => {
    expect(component.signalHandle.valid()).toBe(false);
  });

  it('submit gate: valid form + no collision → valid', () => {
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'unique', path: '' });
    fixture.detectChanges();
    expect(component.hostCollision()).toBeNull();
    expect(component.signalHandle.valid()).toBe(true);
  });

  it('submit gate: valid form + collision → not valid', () => {
    pickerRoutes.set([
      makeRoute({ guid: 'taken-1', host: 'taken', path: '', domainGuid: 'domain-http', appGuids: [] }),
    ]);
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'taken', path: '' });
    fixture.detectChanges();
    expect(component.hostCollision()?.guid).toBe('taken-1');
    expect(component.signalHandle.valid()).toBe(false);
  });

  it('submit gate: row selected → valid regardless of form', () => {
    const r = makeRoute({ guid: 'pick-only', appGuids: [] });
    pickerRoutes.set([r]);
    pickerSelectedKey.set('pick-only');
    fixture.detectChanges();
    expect(component.signalHandle.valid()).toBe(true);
  });

  it('TCP collision: detects (domain, port) match', () => {
    pickerRoutes.set([
      makeRoute({ guid: 'tcp-taken', domainGuid: 'domain-tcp', host: '', path: '', port: 5555, appGuids: [] }),
    ]);
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-tcp', supportedProtocols: ['tcp'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addTCPRoute.patchValue({ port: '5555', useRandomPort: false });
    fixture.detectChanges();
    expect(component.hostCollision()?.guid).toBe('tcp-taken');
  });

  it('collision detection ignores routes already attached to this app (those live in the attached list)', () => {
    // A route attached to THIS app would only show in the attached list
    // and shouldn't trigger a "name in use" warning when the user types
    // a host that matches it — they're already using it, after all.
    pickerRoutes.set([
      makeRoute({ guid: 'mine', host: 'myhost', path: '', domainGuid: 'domain-http', appGuids: ['mockAppGuid'] }),
    ]);
    component.spaceGuid = 'mockSpaceGuid';
    component.selectedDomain = { guid: 'domain-http', supportedProtocols: ['http'] } as any;
    component.domainFormGroup.patchValue({ domain: component.selectedDomain });
    component.addHTTPRoute.patchValue({ host: 'myhost', path: '' });
    fixture.detectChanges();
    expect(component.hostCollision()).toBeNull();
  });
});
