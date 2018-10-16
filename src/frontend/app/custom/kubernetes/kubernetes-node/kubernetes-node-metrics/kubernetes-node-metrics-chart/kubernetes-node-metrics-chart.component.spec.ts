import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricsChartComponent } from './kubernetes-node-metrics-chart.component';

describe('KubernetesNodeMetricsChartComponent', () => {
  let component: KubernetesNodeMetricsChartComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeMetricsChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
