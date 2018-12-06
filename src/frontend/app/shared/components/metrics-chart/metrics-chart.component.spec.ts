import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsChartComponent } from './metrics-chart.component';
import { MDAppModule } from '../../../core/md.module';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { MetricsLineChartConfig } from './metrics-chart.types';
import { FetchApplicationMetricsAction, MetricQueryConfig } from '../../../store/actions/metrics.actions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MetricsChartComponent', () => {
  let component: MetricsChartComponent;
  let fixture: ComponentFixture<MetricsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsChartComponent);
    component = fixture.componentInstance;
    component.chartConfig = new MetricsLineChartConfig();
    component.chartConfig.xAxisLabel = 'Time';
    component.chartConfig.yAxisLabel = this.yAxisLabel;
    component.metricsConfig = {
      metricsAction: new FetchApplicationMetricsAction(
        '1',
        '2',
        new MetricQueryConfig('test'),
      ),
      getSeriesName: () => 'test'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
