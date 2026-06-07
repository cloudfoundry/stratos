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
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationService, CloudFoundryService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { AppDetailDataService } from '../../../../../app-detail-data.service';
import { AppRouteActionsService } from '../../../../../../../shared/services/app-route-actions.service';
import { CfAppRoutesSignalConfigService } from '../../../../../../../shared/signal-list-configs/app-route/cf-app-routes-signal-config.service';
import { RoutesTabComponent } from './routes-tab.component';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  const mockPmf = {
    create: vi.fn(() => ({
      currentPage$: of([]),
      pagination$: of({}),
      fetchingCurrentPage$: of(false),
      isLoadingPage$: of(false),
    })),
  };

  // Spy holders, refreshed per test.
  let refreshScope: ReturnType<typeof vi.fn>;
  let removeRoute: ReturnType<typeof vi.fn>;
  let unmapRoute: ReturnType<typeof vi.fn>;
  let deleteRoute: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;

  /** Minimal AppDetailDataService stub. */
  const makeDataStub = () => {
    refreshScope = vi.fn(async () => undefined);
    removeRoute = vi.fn();
    return {
      routes: signal<any[] | null>(null).asReadonly(),
      loading: signal({ routes: false } as any).asReadonly(),
      refresh: refreshScope,
      removeRoute,
    };
  };

  const makeRouteActionsStub = () => {
    unmapRoute = vi.fn(async () => undefined);
    deleteRoute = vi.fn(async () => undefined);
    return {
      transitioningRouteGuid: signal<string | null>(null).asReadonly(),
      inFlight: signal(false).asReadonly(),
      unmapRoute,
      deleteRoute,
    };
  };

  // Stub for the tab's signal-list config service. Mirrors the public
  // surface the tab consumes (view pipeline, page/sort signals, columns,
  // refresh/clear). The `actions` column carries an unwrapped invoke
  // that the tab replaces with a confirm-wrapped factory.
  const makeRoutesConfigStub = () => {
    const routes: WritableSignal<any[]> = signal([]);
    const filtered = computed(() => routes());
    const view = {
      pagedItems: filtered,
      totalItems: computed(() => routes().length),
      totalFilteredResults: computed(() => filtered().length),
      totalPages: computed(() => 1),
    };
    const pageIndex: WritableSignal<number> = signal(0);
    const pageSize: WritableSignal<number> = signal(25);
    const nameFilter: WritableSignal<string> = signal('');
    const sort: WritableSignal<any> = signal({ field: 'createdAt', direction: 'desc' });
    const viewMode: WritableSignal<'table' | 'card'> = signal('table');
    return {
      view,
      pageIndex,
      pageSize,
      nameFilter,
      sort,
      viewMode,
      buildColumns: () => [
        { header: 'Host', key: 'host', render: (r: any) => `${r.host}` },
        {
          header: '', key: 'actions', kind: 'actions',
          render: () => '',
          actions: () => [
            { label: 'Unmap', invoke: () => Promise.resolve() },
            { label: 'Delete', invoke: () => Promise.resolve() },
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

  const makeSnackStub = () => ({
    open: vi.fn(),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(RoutesTabComponent, {
        // Replace the heavy tab-scoped providers with stubs so we can
        // observe lifecycle calls without booting the real services
        // (which would pull in HttpClient, ListStateStore, etc.).
        remove: {
          providers: [AppRouteActionsService, CfAppRoutesSignalConfigService],
        },
        add: {
          providers: [
            { provide: AppRouteActionsService, useFactory: makeRouteActionsStub },
            { provide: CfAppRoutesSignalConfigService, useFactory: makeRoutesConfigStub },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RoutesTabComponent);
    component = fixture.componentInstance;
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders without throwing', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('triggers an initial routes fetch on init', () => {
    fixture.detectChanges();
    expect(refreshScope).toHaveBeenCalledWith('routes');
  });

  it('builds a signal-list config from the wave-2 service', () => {
    fixture.detectChanges();
    expect(component.listConfig).toBeTruthy();
    expect(component.listConfig.pagedItems).toBeTruthy();
    // Actions column carries the tab's confirm-wrapped factory, not the
    // service's no-confirm one.
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    expect(actionsCol).toBeTruthy();
    expect(actionsCol!.actions).toBeTruthy();
  });

  it('opens a confirm dialog before unmapping, evicts row on confirm', async () => {
    fixture.detectChanges();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    const rowActions = actionsCol!.actions!({ guid: 'r1', url: 'foo.example.com' } as any);
    const unmap = rowActions.find(a => a.label === 'Unmap');
    expect(unmap).toBeTruthy();

    unmap!.invoke({ guid: 'r1', url: 'foo.example.com' } as any);

    expect(confirmOpen).toHaveBeenCalledTimes(1);
    const [config, onConfirm] = confirmOpen.mock.calls[0];
    expect(config).toBeInstanceOf(ConfirmationDialogConfig);
    expect((config as ConfirmationDialogConfig).message).toContain('foo.example.com');

    expect(unmapRoute).not.toHaveBeenCalled();

    await onConfirm();
    expect(unmapRoute).toHaveBeenCalledWith('r1');
    expect(removeRoute).toHaveBeenCalledWith('r1');
  });

  it('opens a confirm dialog before deleting, evicts row on confirm', async () => {
    fixture.detectChanges();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    const rowActions = actionsCol!.actions!({ guid: 'r2', url: 'bar.example.com' } as any);
    const del = rowActions.find(a => a.label === 'Delete');
    expect(del).toBeTruthy();

    del!.invoke({ guid: 'r2', url: 'bar.example.com' } as any);

    expect(confirmOpen).toHaveBeenCalledTimes(1);
    const [config, onConfirm] = confirmOpen.mock.calls[0];
    expect(config).toBeInstanceOf(ConfirmationDialogConfig);
    expect((config as ConfirmationDialogConfig).message).toContain('bar.example.com');

    expect(deleteRoute).not.toHaveBeenCalled();

    await onConfirm();
    expect(deleteRoute).toHaveBeenCalledWith('r2');
    expect(removeRoute).toHaveBeenCalledWith('r2');
  });
});
