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
import { Router, provideRouter } from '@angular/router';
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

import { AppDetailDataService } from '../../../../../app-detail-data.service';
import { AppApplicationActionsService } from '../../../../../../../shared/services/application-actions.service';
import { AppInstanceActionsService } from '../../../../../../../shared/services/app-instance-actions.service';
import { CfAppInstancesSignalConfigService } from '../../../../../../../shared/signal-list-configs/app-instance/cf-app-instances-signal-config.service';
import { InstancesAccordionComponent } from './instances-accordion.component';

describe('InstancesAccordionComponent', () => {
  let component: InstancesAccordionComponent;
  let fixture: ComponentFixture<InstancesAccordionComponent>;
  let dataService: AppDetailDataService;

  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({})),
  };

  // Spy holders, refreshed per test.
  let killInstance: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;

  // Writable signals shared with the data stub so tests can drive
  // running/desired counts and SSH gate fields.
  const appDetailSig: WritableSignal<any> = signal(undefined);
  const spaceSig: WritableSignal<any> = signal(undefined);
  const appSig: WritableSignal<any> = signal(undefined);
  const statsSig: WritableSignal<any[]> = signal([]);

  const makeDataStub = () => ({
    app: appSig.asReadonly(),
    summary: signal<any>(undefined).asReadonly(),
    stats: statsSig.asReadonly(),
    state: computed(() => ({ label: '', indicator: null, actions: {} })),
    lastPolledAt: signal<Date | null>(null).asReadonly(),
    statsFetchedAt: signal<Date | null>(null).asReadonly(),
    usageHistory: signal(new Map()).asReadonly(),
    loading: signal({ stats: false } as any).asReadonly(),
    running: signal(false).asReadonly(),
    // Real-ish implementations so the lifecycle tests can spy on them.
    raiseFocusPriority: vi.fn(() => vi.fn()),
    setStatsPollMs: vi.fn(),
    appDetail: appDetailSig.asReadonly(),
    space: spaceSig.asReadonly(),
    cnsiGuid: 'cnsi-1',
    appGuid: 'app-1',
  });

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

  const makeInstancesConfigStub = () => {
    const stats: WritableSignal<any[]> = signal([]);
    const filtered = computed(() => stats());
    const view = {
      pagedItems: filtered,
      totalFilteredResults: computed(() => filtered().length),
      totalPages: computed(() => 1),
    };
    return {
      view,
      pageIndex: signal(0),
      pageSize: signal(25),
      nameFilter: signal(''),
      sort: signal({ field: 'index', direction: 'asc' }),
      viewMode: signal('table'),
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

  const makeSnackStub = () => ({ open: vi.fn(), error: vi.fn() });

  beforeEach(async () => {
    appDetailSig.set(undefined);
    spaceSig.set(undefined);
    appSig.set(undefined);
    statsSig.set([]);

    await TestBed.configureTestingModule({
      imports: [InstancesAccordionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: mockStore },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: AppApplicationActionsService, useFactory: makeActionsStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(InstancesAccordionComponent, {
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

    fixture = TestBed.createComponent(InstancesAccordionComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(AppDetailDataService);
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

  it('is collapsed by default', () => {
    expect(component.open()).toBe(false);
  });

  it('builds a signal-list config from the wave-2 service', () => {
    fixture.detectChanges();
    expect(component.listConfig).toBeTruthy();
    expect(component.listConfig.pagedItems).toBeTruthy();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    expect(actionsCol).toBeTruthy();
    expect(actionsCol!.actions).toBeTruthy();
  });

  it('expanding raises stats focus; collapsing releases it', () => {
    const release = vi.fn();
    const raise = vi.spyOn(dataService, 'raiseFocusPriority').mockReturnValue(release);
    component.toggle();
    expect(component.open()).toBe(true);
    expect(raise).toHaveBeenCalledWith('stats');
    component.toggle();
    expect(component.open()).toBe(false);
    expect(release).toHaveBeenCalled();
  });

  it('destroy releases focus even while open', () => {
    const release = vi.fn();
    vi.spyOn(dataService, 'raiseFocusPriority').mockReturnValue(release);
    component.toggle();
    fixture.destroy();
    expect(release).toHaveBeenCalled();
  });

  it('changing interval calls setStatsPollMs', () => {
    const spy = vi.spyOn(dataService, 'setStatsPollMs');
    component.setSampleInterval(10000);
    expect(component.intervalMs()).toBe(10000);
    expect(spy).toHaveBeenCalledWith(10000);
  });

  it('degraded() is true when running < desired', () => {
    appSig.set({ entity: { instances: 3 } });
    statsSig.set([{ index: 0, state: 'RUNNING' }]);
    expect(component.running()).toBe(1);
    expect(component.desired()).toBe(3);
    expect(component.degraded()).toBe(true);
  });

  it('degraded() is false when running >= desired', () => {
    appSig.set({ entity: { instances: 2 } });
    statsSig.set([
      { index: 0, state: 'RUNNING' },
      { index: 1, state: 'RUNNING' },
    ]);
    expect(component.degraded()).toBe(false);
  });

  it('opens a confirmation dialog before killing an instance, and only kills on confirm', async () => {
    fixture.detectChanges();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    const rowActions = actionsCol!.actions!({ index: 2 } as any);
    const killAction = rowActions[0];
    expect(killAction.label).toBe('Terminate');

    killAction.invoke({ index: 2 } as any);

    expect(confirmOpen).toHaveBeenCalledTimes(1);
    const [config, onConfirm] = confirmOpen.mock.calls[0];
    expect(config).toBeInstanceOf(ConfirmationDialogConfig);
    expect((config as ConfirmationDialogConfig).message).toContain('instance 2');

    expect(killInstance).not.toHaveBeenCalled();
    await onConfirm();
    expect(killInstance).toHaveBeenCalledWith(2);
  });

  describe('SSH row action', () => {
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

    it('shows SSH enabled when both flags on and row is RUNNING', () => {
      fixture.detectChanges();
      appDetailSig.set({ sshEnabled: true });
      spaceSig.set({ allowSsh: true });
      const actions = rowActionsAt({ index: 0, state: 'RUNNING' });
      const ssh = actions.find(a => a.label === 'SSH');
      expect(ssh).toBeTruthy();
      expect(ssh!.disabled).toBeFalsy();
    });

    it('SSH invoke navigates to the legacy ssh route with cfGuid/appGuid/index', () => {
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
