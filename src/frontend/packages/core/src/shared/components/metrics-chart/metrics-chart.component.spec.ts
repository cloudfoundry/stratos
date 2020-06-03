import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '@stratos/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { SharedModule } from '../../shared.module';
import { MetricsChartComponent } from './metrics-chart.component';
import { MetricsLineChartConfig } from './metrics-chart.types';

// TODO: Fix after metrics has been sorted - STRAT-152
xdescribe('MetricsChartComponent', () => {
  let component: MetricsChartComponent;
  let fixture: ComponentFixture<MetricsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        CoreModule,
        SharedModule,
        CoreTestingModule,
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
    // TODO: Don't use action in another package
    // component.metricsConfig = {
    //   metricsAction: new FetchApplicationMetricsAction(
    //     '1',
    //     '2',
    //     new MetricQueryConfig('test'),
    //   ),
    //   getSeriesName: () => 'test'
    // };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
