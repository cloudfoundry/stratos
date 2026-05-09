import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  WritableSignal,
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationService, CloudFoundryService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { AppDetailDataService } from '../../../../app-detail-data.service';
import { AppServiceBindingActionsService } from '../../../../../../shared/services/app-service-binding-actions.service';
import {
  CfAppServiceBindingsSignalConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/cf-app-service-bindings-signal-config.service';
import { ServicesTabComponent } from './services-tab.component';

describe('ServicesTabComponent', () => {
  let component: ServicesTabComponent;
  let fixture: ComponentFixture<ServicesTabComponent>;

  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({})),
  };

  // Spy holders, refreshed per test.
  let refreshScope: ReturnType<typeof vi.fn>;
  let removeServiceBinding: ReturnType<typeof vi.fn>;
  let unbindService: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;
  let routerNavigate: ReturnType<typeof vi.fn>;

  /** Minimal AppDetailDataService stub. */
  const makeDataStub = () => {
    refreshScope = vi.fn(async () => undefined);
    removeServiceBinding = vi.fn();
    return {
      serviceBindings: signal<any[] | null>(null).asReadonly(),
      serviceBindingsCount: signal(0).asReadonly(),
      loading: signal({ serviceBindings: false } as any).asReadonly(),
      refresh: refreshScope,
      removeServiceBinding,
    };
  };

  const makeBindingsActionsStub = () => {
    unbindService = vi.fn(async () => undefined);
    return {
      transitioningBindingGuid: signal<string | null>(null).asReadonly(),
      inFlight: signal(false).asReadonly(),
      unbindService,
    };
  };

  // Tab's signal-list config service stub. Mirrors the public surface
  // the tab consumes (view pipeline, page/sort signals, columns,
  // refresh/clear). The actions column carries an unwrapped invoke that
  // the tab replaces with a confirm-wrapped factory.
  const makeBindingsConfigStub = () => {
    const bindings: WritableSignal<any[]> = signal([]);
    const filtered = computed(() => bindings());
    const view = {
      pagedItems: filtered,
      totalFilteredResults: computed(() => filtered().length),
      totalPages: computed(() => 1),
    };
    const pageIndex: WritableSignal<number> = signal(0);
    const pageSize: WritableSignal<number> = signal(25);
    const nameFilter: WritableSignal<string> = signal('');
    const sort: WritableSignal<any> = signal({ field: 'createdAt', direction: 'desc' });
    const viewMode: WritableSignal<'table' | 'card'> = signal('card');
    return {
      view,
      pageIndex,
      pageSize,
      nameFilter,
      sort,
      viewMode,
      buildColumns: () => [
        { header: 'Name', key: 'name', render: (b: any) => b.serviceInstance?.name ?? '' },
        {
          header: '', key: 'actions', kind: 'actions',
          render: () => '',
          actions: () => [
            { label: 'Unbind', invoke: () => Promise.resolve() },
          ],
        } as any,
      ],
      buildRowActions: () => [],
      refresh: vi.fn(async () => undefined),
      clearFilters: vi.fn(),
    };
  };

  const makeConfirmStub = () => {
    confirmOpen = vi.fn();
    return { open: confirmOpen };
  };

  const makeSnackStub = () => ({ open: vi.fn() });

  beforeEach(async () => {
    routerNavigate = vi.fn(async () => true);
    await TestBed.configureTestingModule({
      imports: [ServicesTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: mockStore },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(ServicesTabComponent, {
        // Replace heavy tab-scoped providers with stubs to avoid booting
        // real services (which would pull in ListStateStore, HttpClient
        // verb wiring, etc.).
        remove: {
          providers: [AppServiceBindingActionsService, CfAppServiceBindingsSignalConfigService],
        },
        add: {
          providers: [
            { provide: AppServiceBindingActionsService, useFactory: makeBindingsActionsStub },
            { provide: CfAppServiceBindingsSignalConfigService, useFactory: makeBindingsConfigStub },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ServicesTabComponent);
    component = fixture.componentInstance;

    // Stub Router.navigate so the Edit action's nav doesn't try to
    // resolve real routes during the action-invoke tests.
    const router = TestBed.inject(Router);
    router.navigate = routerNavigate as any;
  });

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
    if (fixture) {
      try { fixture.destroy(); } catch { /* ignore */ }
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders without throwing', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('triggers an initial serviceBindings fetch on init', () => {
    fixture.detectChanges();
    expect(refreshScope).toHaveBeenCalledWith('serviceBindings');
  });

  it('builds a signal-list config from the bindings config service', () => {
    fixture.detectChanges();
    expect(component.listConfig).toBeTruthy();
    expect(component.listConfig.pagedItems).toBeTruthy();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    expect(actionsCol).toBeTruthy();
    expect(actionsCol!.actions).toBeTruthy();
  });

  it('Unbind row action opens confirm and on confirm calls unbindService + evicts row', async () => {
    fixture.detectChanges();
    const row = { guid: 'bind-1', serviceInstance: { name: 'redis-cache', guid: 'si-1' } };
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions') as any;
    const actions = actionsCol.actions(row);
    const unbindAction = actions.find((a: any) => a.label === 'Unbind');
    expect(unbindAction).toBeTruthy();

    unbindAction.invoke();
    expect(confirmOpen).toHaveBeenCalledTimes(1);
    const [config, onConfirm] = confirmOpen.mock.calls[0];
    expect(config).toBeInstanceOf(ConfirmationDialogConfig);
    await onConfirm();

    expect(unbindService).toHaveBeenCalledWith('bind-1');
    expect(removeServiceBinding).toHaveBeenCalledWith('bind-1');
  });

  it('Edit row action navigates to /services/:type/:cnsi/:siGuid/edit with appId + cancel-url', () => {
    fixture.detectChanges();
    const row = {
      guid: 'bind-1',
      serviceInstance: { name: 'redis-cache', guid: 'si-1', type: 'managed' },
    };
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions') as any;
    const editAction = actionsCol.actions(row).find((a: any) => a.label === 'Edit');
    expect(editAction).toBeTruthy();

    editAction.invoke();
    expect(routerNavigate).toHaveBeenCalledTimes(1);
    const [path, opts] = routerNavigate.mock.calls[0];
    expect(path[0]).toBe('/services');
    // Managed instance → 'service'; UPS would be 'user-service' (not asserted here).
    expect(path[2]).toBe(component['appService'].cfGuid);
    expect(path[3]).toBe('si-1');
    expect(path[4]).toBe('edit');
    expect(opts.queryParams.appId).toBe(component['appService'].appGuid);
  });
});
