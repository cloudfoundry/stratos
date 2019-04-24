import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricsChartComponent } from './kubernetes-node-metrics-chart.component';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';

describe('KubernetesNodeMetricsChartComponent', () => {
  let component: KubernetesNodeMetricsChartComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeMetricsChartComponent],
      imports: KubernetesBaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
