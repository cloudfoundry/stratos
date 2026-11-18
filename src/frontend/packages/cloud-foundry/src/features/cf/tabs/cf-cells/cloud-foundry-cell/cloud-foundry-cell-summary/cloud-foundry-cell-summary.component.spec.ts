import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of as observableOf } from 'rxjs';

import { MetricsConfig } from '@stratosui/core';
import {
  MetricsChartTypes,
  MetricsLineChartConfig,
} from '@stratosui/core';
import {
  MetricsChartHelpers,
} from '@stratosui/core';
import { MetricQueryConfig, MetricQueryType, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellSummaryComponent } from './cloud-foundry-cell-summary.component';

class MockCloudFoundryCellService {
  cfGuid = 'cfGuid';
  cellId = 'cellId';
  cellMetric$ = observableOf(null);

  healthy$: Observable<string | null> = observableOf(null);
  cpus$ = observableOf(null);

  usageContainers$ = observableOf(null);
  remainingContainers$ = observableOf(null);
  totalContainers$ = observableOf(null);

  usageDisk$ = observableOf(null);
  remainingDisk$ = observableOf(null);
  totalDisk$ = observableOf(null);

  usageMemory$ = observableOf(null);
  remainingMemory$ = observableOf(null);
  totalMemory$ = observableOf(null);

  buildMetricConfig = (queryString: string, queryRange: MetricQueryType): MetricsConfig<any> => ({
    getSeriesName: (result: any) => `${result}`,
    mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
    request: {
      endpointGuid: 'cfGuid',
      url: '/pp/v1/metrics/cf/cells',
      query: new MetricQueryConfig(queryString, {}),
      queryType: queryRange,
      windowValue: null,
    },
  })
  buildChartConfig = (yAxisLabel: string): MetricsLineChartConfig => ({
    chartType: MetricsChartTypes.LINE,
    xAxisLabel: 'Time',
    yAxisLabel,
    autoScale: true,
  })

}

describe('CloudFoundryCellSummaryComponent', () => {
  let component: CloudFoundryCellSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryCellSummaryComponent>;
  let http: HttpTestingController;
  let cellService: MockCloudFoundryCellService;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const isHealthRequest = (r: { url: string }) => r.url.startsWith('/pp/v1/metrics/cf/cells/');
  const healthyText = (): string =>
    el().querySelector('app-boolean-indicator span.text-sm')?.textContent?.trim() ?? '';
  const statusBar = (): Element | null => el().querySelector('app-card-status > div');

  beforeEach(async () => {
    cellService = new MockCloudFoundryCellService();
    await TestBed.configureTestingModule({
      imports: [CloudFoundryCellSummaryComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: CloudFoundryCellService,
          useFactory: () => cellService,
        },
        {
          provide: ActiveRouteCfCell,
          useValue: { cfGuid: testSCFEndpointGuid, cellId: 'testCellId' }
        },
      ]
    }).compileComponents();
  });

  const create = async () => {
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CloudFoundryCellSummaryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  it('should create', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('shows an error with Retry, not "no health history", when the health request fails', async () => {
    await create();
    const fail = { status: 500, statusText: 'Internal Server Error' };
    // Current metric first, then the pre-v2.31 fallback.
    (await vi.waitFor(() => http.expectOne(isHealthRequest))).flush('boom', fail);
    (await vi.waitFor(() => http.expectOne(isHealthRequest))).flush('boom', fail);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el().querySelector('[data-test="empty-error"]')).not.toBeNull();
    });
    expect(el().querySelector('[data-test="empty-error"]')?.textContent).toContain('Failed to load the cell health history');
    expect(el().querySelector('[data-test="empty-error-retry"]')).not.toBeNull();
    expect(el().querySelector('[data-test="empty"]')).toBeNull();
  });

  it('reads no health sample as unknown, not unhealthy', async () => {
    cellService.healthy$ = observableOf(null);
    await create();
    expect(healthyText()).toBe('Unknown');
    expect(statusBar()?.className ?? '').not.toContain('bg-danger');
  });

  it('reads a 0 sample as healthy', async () => {
    cellService.healthy$ = observableOf('0');
    await create();
    expect(healthyText()).toBe('Yes');
    expect(statusBar()?.className).toContain('bg-success');
  });

  it('reads a 1 sample as unhealthy', async () => {
    cellService.healthy$ = observableOf('1');
    await create();
    expect(healthyText()).toBe('No');
    expect(statusBar()?.className).toContain('bg-danger');
  });
});
