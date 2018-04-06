import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsChartComponent } from './metrics-chart.component';
import { MDAppModule } from '../../../core/md.module';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';

fdescribe('MetricsChartComponent', () => {
  let component: MetricsChartComponent;
  let fixture: ComponentFixture<MetricsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
