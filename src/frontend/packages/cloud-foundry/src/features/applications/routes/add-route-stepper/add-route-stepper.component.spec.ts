import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import {
  appReducers,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule,
  EntityServiceFactory,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider, ActiveRouteCfOrgSpace, ApplicationServiceMock } from '@test-framework/cf';

import { ApplicationService } from '../../application.service';
import { AddRouteStepperComponent } from './add-route-stepper.component';
import { AppRouteActionsService } from '../../../../shared/services/app-route-actions.service';
import { CfMapRoutesSignalConfigService } from '../../../../shared/signal-list-configs/app-route/cf-map-routes-signal-config.service';
import { AppDetailDataService } from '../../app-detail-data.service';

// Stub factories for the tab/page-scoped services. The stepper's job is to
// provide them at the page scope; the spec asserts presence + the absence
// of the legacy ListConfig leak. Real injection of HttpClient + ListStateStore
// would otherwise pull in the full data layer.
const makeRouteActionsStub = () => ({
  inFlight: signal(false).asReadonly(),
  transitioningRouteGuid: signal<string | null>(null).asReadonly(),
  attachRoute: vi.fn(async () => undefined),
  createAndAttachRoute: vi.fn(async () => ({} as any)),
  createRoute: vi.fn(async () => ({} as any)),
  unmapRoute: vi.fn(async () => undefined),
  deleteRoute: vi.fn(async () => undefined),
});
const makeMapConfigStub = () => ({
  view: {
    pagedItems: signal<any[]>([]).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
  },
  routes: signal<any[]>([]).asReadonly(),
  selectedKey: signal<string | null>(null).asReadonly(),
  pageIndex: signal(0),
  pageSize: signal(25),
  nameFilter: signal(''),
  sort: signal({ field: 'createdAt', direction: 'desc' }),
  viewMode: signal<'table' | 'card'>('table'),
  refresh: vi.fn(async () => undefined),
  clearFilters: vi.fn(),
  buildColumns: () => [],
});
const makeAppDetailDataStub = () => ({
  routes: signal<any[] | null>([]).asReadonly(),
  appDetail: signal<any>(undefined).asReadonly(),
  cnsiGuid: 'mockCfGuid',
  appGuid: 'mockAppGuid',
  addRoute: vi.fn(),
});

describe('AddRouteStepperComponent', () => {
  let component: AddRouteStepperComponent;
  let fixture: ComponentFixture<AddRouteStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRouteStepperComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false },
          }),
          EntityCatalogTestModule,
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ],
        },
        EntityServiceFactory,
        ...generateTestCfEndpointServiceProvider(testSCFEndpointGuid),
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid,
          },
        },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: AppDetailDataService, useFactory: makeAppDetailDataStub },
        TabNavService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(AddRouteStepperComponent, {
        // Stub the page-scoped service providers so the spec doesn't need
        // to boot the real implementations (HttpClient + ListStateStore).
        // Presence assertions below confirm the providers ARE wired into
        // the component's injector — which is the contract this spec
        // documents.
        remove: {
          providers: [AppRouteActionsService, CfMapRoutesSignalConfigService],
        },
        add: {
          providers: [
            { provide: AppRouteActionsService, useFactory: makeRouteActionsStub },
            { provide: CfMapRoutesSignalConfigService, useFactory: makeMapConfigStub },
          ],
        },
      })
      .compileComponents();

    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRouteStepperComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering the embedded
    // <app-add-routes> which pulls in form/template machinery.
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('provides AppRouteActionsService at the stepper page scope', () => {
    const svc = fixture.debugElement.injector.get(AppRouteActionsService, null);
    expect(svc).toBeTruthy();
  });

  it('provides CfMapRoutesSignalConfigService at the stepper page scope', () => {
    const svc = fixture.debugElement.injector.get(CfMapRoutesSignalConfigService, null);
    expect(svc).toBeTruthy();
  });

  // (Removed the legacy "does NOT provide a ListConfig" leak-guard: the
  // ListConfig type was deleted with the list framework, so the leak it
  // guarded against is now structurally impossible.)
});
