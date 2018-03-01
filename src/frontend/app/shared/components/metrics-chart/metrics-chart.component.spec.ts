import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsChartComponent } from './metrics-chart.component';

describe('MetricsChartComponent', () => {
  let component: MetricsChartComponent;
  let fixture: ComponentFixture<MetricsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetricsChartComponent ]
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
