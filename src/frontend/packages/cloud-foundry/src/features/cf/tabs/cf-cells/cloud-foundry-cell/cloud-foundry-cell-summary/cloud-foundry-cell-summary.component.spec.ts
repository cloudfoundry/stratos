import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';
import { of as observableOf } from 'rxjs';

import { MetricsConfig } from '@stratosui/core';
import {
  MetricsChartTypes,
  MetricsLineChartConfig,
} from '@stratosui/core';
import {
  MetricsChartHelpers,
} from '@stratosui/core';
import { MetricQueryConfig, MetricQueryType, appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellSummaryComponent } from './cloud-foundry-cell-summary.component';

class MockCloudFoundryCellService {
  cfGuid = 'cfGuid';
  cellId = 'cellId';
  cellMetric$ = observableOf(null);

  healthy$ = observableOf(null);
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudFoundryCellSummaryComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
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
          useValue: new MockCloudFoundryCellService(),
        },
        {
          provide: ActiveRouteCfCell,
          useValue: { cfGuid: testSCFEndpointGuid, cellId: 'testCellId' }
        },
        DatePipe,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
