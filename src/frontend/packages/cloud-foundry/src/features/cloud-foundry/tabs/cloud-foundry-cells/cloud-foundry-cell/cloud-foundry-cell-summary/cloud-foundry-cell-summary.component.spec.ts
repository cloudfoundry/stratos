import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import { MetricsConfig } from '../../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import {
  MetricsChartTypes,
  MetricsLineChartConfig,
} from '../../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  MetricsChartHelpers,
} from '../../../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { MetricQueryConfig } from '../../../../../../../../store/src/actions/metrics.actions';
import { MetricQueryType } from '../../../../../../../../store/src/types/metric.types';
import { generateCfBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { FetchCFCellMetricsAction } from '../../../../../../actions/cf-metrics.actions';
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CloudFoundryCellSummaryComponent } from './cloud-foundry-cell-summary.component';

class MockCloudFoundryCellService {
  cfGuid = 'cfGuid';
  cellId = 'cellId';
  cellMetric$ = observableOf(null);

  healthy$ = observableOf(null);
  healthyMetricId = null;
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
    metricsAction: new FetchCFCellMetricsAction(
      'guid',
      'cellId',
      new MetricQueryConfig(queryString, {}),
      queryRange
    ),
  })
  buildChartConfig = (yAxisLabel: string): MetricsLineChartConfig => ({
    chartType: MetricsChartTypes.LINE,
    xAxisLabel: 'Time',
    yAxisLabel,
    autoScale: true
  })

}

describe('CloudFoundryCellSummaryComponent', () => {
  let component: CloudFoundryCellSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryCellSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryCellSummaryComponent
      ],
      imports: generateCfBaseTestModules(),
      providers: [
        {
          provide: CloudFoundryCellService,
          useValue: new MockCloudFoundryCellService()
        },
        ActiveRouteCfCell,
        DatePipe
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
