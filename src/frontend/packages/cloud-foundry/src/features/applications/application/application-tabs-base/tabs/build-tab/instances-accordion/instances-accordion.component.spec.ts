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
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EndpointsDataService } from '@stratosui/store';

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
import { InstanceUsageChartComponent } from '../../../../../../../shared/components/instance-usage-chart/instance-usage-chart.component';
import { InstancesAccordionComponent } from './instances-accordion.component';

describe('InstancesAccordionComponent', () => {
  let component: InstancesAccordionComponent;
  let fixture: ComponentFixture<InstancesAccordionComponent>;
  let dataService: AppDetailDataService;

  // Spy holders, refreshed per test.
  let killInstance: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;

  // Writable signals shared with the data stub so tests can drive
  // running/desired counts and SSH gate fields.
  const appDetailSig: WritableSignal<any> = signal(undefined);
  const spaceSig: WritableSignal<any> = signal(undefined);
  const appSig: WritableSignal<any> = signal(undefined);
  const statsSig: WritableSignal<any[]> = signal([]);
  // metadata.metrics of the app's CF endpoint; undefined = no metrics endpoint.
  const endpointMetricsSig: WritableSignal<string | undefined> = signal(undefined);

  const makeEndpointsStub = () => ({
    whenReady: () => Promise.resolve(),
    endpoints: computed(() => new Map([['cnsi-1', { guid: 'cnsi-1', metadata: { metrics: endpointMetricsSig() } }]])),
  });

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
    endpointMetricsSig.set(undefined);

    await TestBed.configureTestingModule({
      imports: [InstancesAccordionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: AppApplicationActionsService, useFactory: makeActionsStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
        { provide: EndpointsDataService, useFactory: makeEndpointsStub },
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

  it('renders without throwing', async () => {
    await expect(fixture.whenStable()).resolves.not.toThrow();
  });

  it('is collapsed by default', () => {
    expect(component.open()).toBe(false);
  });

  it('builds a signal-list config from the wave-2 service', async () => {
    await fixture.whenStable();
    expect(component.listConfig()).toBeTruthy();
    expect(component.listConfig().pagedItems).toBeTruthy();
    const actionsCol = component.listConfig().columns.find(c => c.key === 'actions');
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

  it('collapse then destroy releases focus exactly once', () => {
    const release = vi.fn();
    vi.spyOn(dataService, 'raiseFocusPriority').mockReturnValue(release);
    component.toggle();   // open (acquire)
    component.toggle();   // close (release #1)
    fixture.destroy();    // must NOT release again
    expect(release).toHaveBeenCalledTimes(1);
  });

  describe('sample interval control', () => {
    it('shows the current sample interval as the selected option', async () => {
      // Regression: a `[value]` binding on a native <select> with Angular-bound
      // <option>s does NOT select the matching option, so the control rendered
      // blank. The fix uses [selected] per option.
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [InstancesAccordionComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ApplicationService, useClass: ApplicationServiceMock },
          { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
          { provide: AppDetailDataService, useFactory: makeDataStub },
          { provide: AppApplicationActionsService, useFactory: makeActionsStub },
          { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
          { provide: TailwindSnackBarService, useFactory: makeSnackStub },
          { provide: EndpointsDataService, useFactory: makeEndpointsStub },
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
        .overrideComponent(InstanceUsageChartComponent, {
          set: { template: '' },
        })
        .compileComponents();

      appSig.set({ entity: { instances: 1 } });
      const localFixture = TestBed.createComponent(InstancesAccordionComponent);
      const localComponent = localFixture.componentInstance;
      localComponent.toggle(); // expand so the interval control renders
      await localFixture.whenStable();

      const select: HTMLSelectElement = localFixture.debugElement.query(By.css('select')).nativeElement;
      // default 5000 → "5s" is the displayed selection, not blank
      expect(select.value).toBe('5000');
      expect(select.options[select.selectedIndex]?.text).toBe('5s');

      // changing the interval updates the displayed selection
      localComponent.setSampleInterval(10000);
      await localFixture.whenStable();
      expect(select.value).toBe('10000');
      expect(select.options[select.selectedIndex]?.text).toBe('10s');

      localFixture.destroy();
    });
  });

  describe('All metrics overlay', () => {
    // Stub the chart template so no canvas renders, but the three
    // <app-instance-usage-chart> still instantiate so ViewChildren resolves
    // their component instances (whose internal hiddenInstances we drive).
    const buildWithChartStub = async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [InstancesAccordionComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ApplicationService, useClass: ApplicationServiceMock },
          { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
          { provide: AppDetailDataService, useFactory: makeDataStub },
          { provide: AppApplicationActionsService, useFactory: makeActionsStub },
          { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
          { provide: TailwindSnackBarService, useFactory: makeSnackStub },
          { provide: EndpointsDataService, useFactory: makeEndpointsStub },
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
        .overrideComponent(InstanceUsageChartComponent, {
          set: { template: '' },
        })
        .compileComponents();

      appSig.set({ entity: { instances: 3 } });
      const localFixture = TestBed.createComponent(InstancesAccordionComponent);
      const localComponent = localFixture.componentInstance;
      localComponent.toggle();          // expand so the three charts render
      await localFixture.whenStable();
      return { localFixture, localComponent };
    };

    const queriedCharts = (component: InstancesAccordionComponent): InstanceUsageChartComponent[] =>
      ((component as any).charts as { toArray(): InstanceUsageChartComponent[] }).toArray();

    it('activating seeds the shared set with the AND of the per-metric sets', async () => {
      const { localFixture, localComponent } = await buildWithChartStub();
      const charts = queriedCharts(localComponent);
      expect(charts.length).toBe(3);

      // CPU={1,2}, Mem={1}, Disk={1} → intersection {1}.
      charts[0].hiddenInstances.set(new Set([1, 2]));
      charts[1].hiddenInstances.set(new Set([1]));
      charts[2].hiddenInstances.set(new Set([1]));

      localComponent.toggleAllMetrics();
      expect(localComponent.allActive()).toBe(true);
      expect([...localComponent.unifiedHidden()].sort()).toEqual([1]);

      localFixture.destroy();
    });

    it('onToggleLinked adds then removes an instance in the shared set', async () => {
      const { localFixture, localComponent } = await buildWithChartStub();
      const charts = queriedCharts(localComponent);
      charts.forEach(c => c.hiddenInstances.set(new Set([1])));

      localComponent.toggleAllMetrics();
      expect([...localComponent.unifiedHidden()].sort()).toEqual([1]);

      localComponent.onToggleLinked(2);
      expect([...localComponent.unifiedHidden()].sort()).toEqual([1, 2]);

      localComponent.onToggleLinked(2);
      expect([...localComponent.unifiedHidden()].sort()).toEqual([1]);

      localFixture.destroy();
    });

    it('deactivating leaves each chart per-metric set untouched (auto-revert)', async () => {
      const { localFixture, localComponent } = await buildWithChartStub();
      const charts = queriedCharts(localComponent);
      const cpu = new Set([1, 2]);
      const mem = new Set([1]);
      const disk = new Set([0, 1]);
      charts[0].hiddenInstances.set(cpu);
      charts[1].hiddenInstances.set(mem);
      charts[2].hiddenInstances.set(disk);

      localComponent.toggleAllMetrics();       // activate
      localComponent.onToggleLinked(2);        // mutate the shared set only
      localComponent.toggleAllMetrics();       // deactivate

      expect(localComponent.allActive()).toBe(false);
      // Per-metric sets are exactly what they were pre-activation.
      expect([...charts[0].hiddenInstances()].sort()).toEqual([1, 2]);
      expect([...charts[1].hiddenInstances()].sort()).toEqual([1]);
      expect([...charts[2].hiddenInstances()].sort()).toEqual([0, 1]);

      localFixture.destroy();
    });
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
    await fixture.whenStable();
    const actionsCol = component.listConfig().columns.find(c => c.key === 'actions');
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
      const col = component.listConfig().columns.find(c => c.key === 'actions');
      return col!.actions!(row);
    };

    it('elides SSH when sshEnabled is false', async () => {
      await fixture.whenStable();
      appDetailSig.set({ sshEnabled: false });
      spaceSig.set({ allowSsh: true });
      const actions = rowActionsAt({ index: 0, state: 'RUNNING' });
      expect(actions.find(a => a.label === 'SSH')).toBeUndefined();
    });

    it('shows SSH enabled when both flags on and row is RUNNING', async () => {
      await fixture.whenStable();
      appDetailSig.set({ sshEnabled: true });
      spaceSig.set({ allowSsh: true });
      const actions = rowActionsAt({ index: 0, state: 'RUNNING' });
      const ssh = actions.find(a => a.label === 'SSH');
      expect(ssh).toBeTruthy();
      expect(ssh!.disabled).toBeFalsy();
    });

    it('SSH invoke navigates to the legacy ssh route with cfGuid/appGuid/index', async () => {
      await fixture.whenStable();
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
  describe('Cell column', () => {
    const CELL_HEALTH = 'firehose_value_metric_rep_garden_health_check_failed';
    const CELL_HEALTH_DEP = 'firehose_value_metric_rep_unhealthy_cell';
    const APP_CPU_URL = '/pp/v1/metrics/cf/app/app-1/query?query=firehose_container_metric_cpu_percentage';

    const vector = (result: unknown[]) => ({ 'cnsi-1': { status: 'success', data: { resultType: 'vector', result } } });
    const cellsProbe = (metric: string) => (r: { url: string }) =>
      r.url === `/pp/v1/metrics/cf/cells/query?query=${metric}`;
    const columnKeys = () => component.listConfig().columns.map(c => c.key);
    const cellColumn = () => component.listConfig().columns.find(c => c.key === 'cell');

    // The component checks for cell metrics when it is created, so build
    // a fresh one after setting the endpoint up.
    const recreate = async () => {
      fixture.destroy();
      fixture = TestBed.createComponent(InstancesAccordionComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    };

    it('is absent when the CF has no metrics endpoint', async () => {
      const http = TestBed.inject(HttpTestingController);
      await recreate();
      expect(columnKeys()).not.toContain('cell');
      http.expectNone(r => r.url.startsWith('/pp/v1/metrics/'));
    });

    it('is absent when the cells report no health metric', async () => {
      endpointMetricsSig.set('metrics-1');
      const http = TestBed.inject(HttpTestingController);
      await recreate();
      (await vi.waitFor(() => http.expectOne(cellsProbe(CELL_HEALTH)))).flush(vector([]));
      (await vi.waitFor(() => http.expectOne(cellsProbe(CELL_HEALTH_DEP)))).flush(vector([]));
      await fixture.whenStable();
      expect(columnKeys()).not.toContain('cell');
    });

    it('is inserted after Index when cell metrics exist and links each instance to its cell', async () => {
      endpointMetricsSig.set('metrics-1');
      statsSig.set([{ index: 0, state: 'RUNNING' }, { index: 1, state: 'RUNNING' }]);
      const http = TestBed.inject(HttpTestingController);
      await recreate();
      (await vi.waitFor(() => http.expectOne(cellsProbe(CELL_HEALTH))))
        .flush(vector([{ metric: { bosh_job_id: 'cell-a' }, value: [1, '0'] }]));

      // Placement is read from the app-scoped route, for this app's CF.
      const placement = await vi.waitFor(() => http.expectOne(APP_CPU_URL));
      expect(placement.request.headers.get('x-cap-cnsi-list')).toBe('cnsi-1');
      placement.flush(vector([
        { metric: { instance_index: '0', bosh_job_id: 'cell-a' }, value: [1, '0.1'] },
        { metric: { instance_index: '1', bosh_job_id: 'cell-b' }, value: [1, '0.2'] },
      ]));
      await vi.waitFor(() => expect(cellColumn()?.render({ index: 1 } as any)).toBe('cell-b'));
      await fixture.whenStable();

      expect(columnKeys()).toEqual(['index', 'cell', 'actions']);
      expect(cellColumn()!.header).toBe('Cell');
      expect(cellColumn()!.link!({ index: 0 } as any)).toEqual(['/cloud-foundry', 'cnsi-1', 'cells', 'cell-a', 'summary']);
      expect(cellColumn()!.render({ index: 0 } as any)).toBe('cell-a');
    });

    it('reads placement again when an instance has no cell yet', async () => {
      endpointMetricsSig.set('metrics-1');
      statsSig.set([{ index: 0, state: 'RUNNING' }]);
      const http = TestBed.inject(HttpTestingController);
      await recreate();
      (await vi.waitFor(() => http.expectOne(cellsProbe(CELL_HEALTH))))
        .flush(vector([{ metric: { bosh_job_id: 'cell-a' }, value: [1, '0'] }]));
      (await vi.waitFor(() => http.expectOne(APP_CPU_URL)))
        .flush(vector([{ metric: { instance_index: '0', bosh_job_id: 'cell-a' }, value: [1, '0.1'] }]));
      await vi.waitFor(() => expect(cellColumn()?.render({ index: 0 } as any)).toBe('cell-a'));

      // A new instance appears in the stats before it reports metrics.
      statsSig.set([{ index: 0, state: 'RUNNING' }, { index: 1, state: 'STARTING' }]);
      await fixture.whenStable();
      (await vi.waitFor(() => http.expectOne(APP_CPU_URL)))
        .flush(vector([
          { metric: { instance_index: '0', bosh_job_id: 'cell-a' }, value: [1, '0.1'] },
          { metric: { instance_index: '1', bosh_job_id: 'cell-c' }, value: [1, '0.1'] },
        ]));
      await vi.waitFor(() => expect(cellColumn()!.render({ index: 1 } as any)).toBe('cell-c'));
      expect(cellColumn()!.link!({ index: 1 } as any)).toEqual(['/cloud-foundry', 'cnsi-1', 'cells', 'cell-c', 'summary']);

      // Every instance has a cell now: a stats update does not refetch.
      statsSig.set([{ index: 0, state: 'RUNNING' }, { index: 1, state: 'RUNNING' }]);
      await fixture.whenStable();
      http.expectNone(APP_CPU_URL);
    });
  });
});
