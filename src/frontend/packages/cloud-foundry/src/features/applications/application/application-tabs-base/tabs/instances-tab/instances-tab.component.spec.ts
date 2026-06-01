import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Signal,
  WritableSignal,
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store';
import { ApplicationService, CloudFoundryService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { AppDetailDataService } from '../../../../app-detail-data.service';
import { AppApplicationActionsService } from '../../../../../../shared/services/application-actions.service';
import { AppInstanceActionsService } from '../../../../../../shared/services/app-instance-actions.service';
import { CfAppInstancesSignalConfigService } from '../../../../../../shared/signal-list-configs/app-instance/cf-app-instances-signal-config.service';
import { InstancesTabComponent } from './instances-tab.component';

describe('InstancesTabComponent', () => {
  let component: InstancesTabComponent;
  let fixture: ComponentFixture<InstancesTabComponent>;

  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({})),
  };

  const mockPmf = {
    create: vi.fn(() => ({
      currentPage$: of([]),
      pagination$: of({}),
      fetchingCurrentPage$: of(false),
      isLoadingPage$: of(false),
    })),
  };

  // Spy holders, refreshed per test.
  let raiseFocusPriority: ReturnType<typeof vi.fn>;
  let releaseFocus: ReturnType<typeof vi.fn>;
  let killInstance: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;

  /** Minimal AppDetailDataService stub. */
  // SSH gate fields (appDetail/space + cnsiGuid/appGuid) are writable here
  // so individual tests can flip sshEnabled / allowSsh and assert
  // visibility / navigation target.
  const appDetailSig: WritableSignal<any> = signal(undefined);
  const spaceSig: WritableSignal<any> = signal(undefined);
  const makeDataStub = () => {
    releaseFocus = vi.fn();
    raiseFocusPriority = vi.fn(() => releaseFocus);
    return {
      app: signal<any>(undefined).asReadonly(),
      summary: signal<any>(undefined).asReadonly(),
      stats: signal<any[]>([]).asReadonly(),
      state: computed(() => ({ label: '', indicator: null, actions: {} })),
      lastPolledAt: signal<Date | null>(null).asReadonly(),
      loading: signal({ stats: false } as any).asReadonly(),
      running: signal(false).asReadonly(),
      raiseFocusPriority,
      appDetail: appDetailSig.asReadonly(),
      space: spaceSig.asReadonly(),
      cnsiGuid: 'cnsi-1',
      appGuid: 'app-1',
    };
  };

  const makeActionsStub = () => ({
    inFlight: signal(false).asReadonly(),
    verb: signal<any>(null).asReadonly(),
    progress: signal<any[] | null>(null).asReadonly(),
  });

  const makeInstanceActionsStub = () => {
    killInstance = vi.fn(async () => undefined);
    return {
      transitioningIndex: signal<number | null>(null).asReadonly(),
      inFlight: signal(false).asReadonly(),
      killInstance,
    };
  };

  // Stub for the tab's signal-list config service. Mirrors the public
  // surface the tab consumes (view pipeline, page/sort signals, columns,
  // refresh/clear). The `actions` column carries an unwrapped invoke that
  // the tab replaces with a confirm-wrapped factory.
  const makeInstancesConfigStub = () => {
    const stats: WritableSignal<any[]> = signal([]);
    const filtered = computed(() => stats());
    const view = {
      pagedItems: filtered,
      totalFilteredResults: computed(() => filtered().length),
      totalPages: computed(() => 1),
    };
    const pageIndex: WritableSignal<number> = signal(0);
    const pageSize: WritableSignal<number> = signal(25);
    const nameFilter: WritableSignal<string> = signal('');
    const sort: WritableSignal<any> = signal({ field: 'index', direction: 'asc' });
    const viewMode: WritableSignal<'table' | 'card'> = signal('table');
    return {
      view,
      pageIndex,
      pageSize,
      nameFilter,
      sort,
      viewMode,
      stats: stats.asReadonly(),
      buildColumns: () => [
        { header: 'Index', key: 'index', render: (r: any) => `${r.index}` },
        {
          header: '', key: 'actions', kind: 'actions',
          render: () => '',
          actions: () => [{ label: 'Kill', invoke: () => Promise.resolve() }],
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
      imports: [InstancesTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: mockStore },
        { provide: PaginationMonitorFactory, useValue: mockPmf },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: AppApplicationActionsService, useFactory: makeActionsStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(InstancesTabComponent, {
        // Replace the heavy tab-scoped providers with stubs so we can
        // observe lifecycle calls without booting the real services
        // (which would pull in HttpClient, ListStateStore, etc.).
        remove: {
          providers: [AppInstanceActionsService, CfAppInstancesSignalConfigService],
        },
        add: {
          providers: [
            { provide: AppInstanceActionsService, useFactory: makeInstanceActionsStub },
            { provide: CfAppInstancesSignalConfigService, useFactory: makeInstancesConfigStub },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InstancesTabComponent);
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

  it('raises focus priority for stats on init and releases on destroy', () => {
    fixture.detectChanges();
    expect(raiseFocusPriority).toHaveBeenCalledWith('stats');
    expect(releaseFocus).not.toHaveBeenCalled();
    fixture.destroy();
    expect(releaseFocus).toHaveBeenCalledTimes(1);
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

  it('opens a confirmation dialog before killing an instance, and only kills on confirm', async () => {
    fixture.detectChanges();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    const rowActions = actionsCol!.actions!({ index: 2 } as any);
    const killAction = rowActions[0];
    expect(killAction.label).toBe('Terminate');

    // Trigger the kebab Kill click.
    killAction.invoke({ index: 2 } as any);

    // ConfirmationDialogService.open(config, onConfirm) — synchronous setup,
    // onConfirm fires when the user accepts.
    expect(confirmOpen).toHaveBeenCalledTimes(1);
    const [config, onConfirm] = confirmOpen.mock.calls[0];
    expect(config).toBeInstanceOf(ConfirmationDialogConfig);
    expect((config as ConfirmationDialogConfig).message).toContain('instance 2');

    // killInstance hasn't been called yet — only the confirm dialog is open.
    expect(killInstance).not.toHaveBeenCalled();

    // Simulate user confirming.
    await onConfirm();
    expect(killInstance).toHaveBeenCalledWith(2);
  });

  describe('SSH row action', () => {
    afterEach(() => {
      appDetailSig.set(undefined);
      spaceSig.set(undefined);
    });

    const rowActionsAt = (row: any) => {
      const col = component.listConfig.columns.find(c => c.key === 'actions');
      return col!.actions!(row);
    };

    it('elides SSH when sshEnabled is false', () => {
      fixture.detectChanges();
      appDetailSig.set({ sshEnabled: false });
      spaceSig.set({ allowSsh: true });
      const actions = rowActionsAt({ index: 0, state: 'RUNNING' });
      expect(actions.find(a => a.label === 'SSH')).toBeUndefined();
    });

    it('elides SSH when allowSsh is false', () => {
      fixture.detectChanges();
      appDetailSig.set({ sshEnabled: true });
      spaceSig.set({ allowSsh: false });
      const actions = rowActionsAt({ index: 0, state: 'RUNNING' });
      expect(actions.find(a => a.label === 'SSH')).toBeUndefined();
    });

    it('shows SSH enabled when both flags on and row is RUNNING', () => {
      fixture.detectChanges();
      appDetailSig.set({ sshEnabled: true });
      spaceSig.set({ allowSsh: true });
      const actions = rowActionsAt({ index: 0, state: 'RUNNING' });
      const ssh = actions.find(a => a.label === 'SSH');
      expect(ssh).toBeTruthy();
      expect(ssh!.disabled).toBeFalsy();
    });

    it('shows SSH disabled when row is not RUNNING', () => {
      fixture.detectChanges();
      appDetailSig.set({ sshEnabled: true });
      spaceSig.set({ allowSsh: true });
      const actions = rowActionsAt({ index: 1, state: 'STARTING' });
      const ssh = actions.find(a => a.label === 'SSH');
      expect(ssh).toBeTruthy();
      expect(ssh!.disabled).toBe(true);
    });

    it('SSH invoke navigates to the legacy ssh route with cfGuid/appGuid/index', async () => {
      fixture.detectChanges();
      appDetailSig.set({ sshEnabled: true });
      spaceSig.set({ allowSsh: true });
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const actions = rowActionsAt({ index: 3, state: 'RUNNING' });
      const ssh = actions.find(a => a.label === 'SSH');
      ssh!.invoke({ index: 3, state: 'RUNNING' } as any);
      expect(navigateSpy).toHaveBeenCalledWith(['/applications', 'cnsi-1', 'app-1', 'ssh', 3]);
    });
  });
});
