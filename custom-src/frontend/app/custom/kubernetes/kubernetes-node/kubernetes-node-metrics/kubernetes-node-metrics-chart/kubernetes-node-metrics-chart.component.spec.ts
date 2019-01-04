import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricsChartComponent } from './kubernetes-node-metrics-chart.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
