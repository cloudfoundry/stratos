import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityServiceFactory, MetricQueryConfig, MetricQueryType } from '@stratosui/store';
import { MetricsConfig, MetricsChartTypes, MetricsLineChartConfig, MetricsChartHelpers } from '@stratosui/core';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryTestingModule } from '../../../../../../cloud-foundry-test.module';
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellChartsComponent } from './cloud-foundry-cell-charts.component';

class MockCloudFoundryCellService {
  cfGuid = 'cfGuid';
  cellId = 'cellId';

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

describe('CloudFoundryCellChartsComponent', () => {
  let component: CloudFoundryCellChartsComponent;
  let fixture: ComponentFixture<CloudFoundryCellChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryCellChartsComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          createBasicStoreModule(),
          CloudFoundryTestingModule
        ),
        EntityServiceFactory,
        {
          provide: CloudFoundryCellService,
          useValue: new MockCloudFoundryCellService(),
        },
        ActiveRouteCfCell,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryCellChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
