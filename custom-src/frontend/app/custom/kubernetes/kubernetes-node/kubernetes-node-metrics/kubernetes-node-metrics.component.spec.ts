import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricsComponent } from './kubernetes-node-metrics.component';
import { KubernetesNodeMetricStatsCardComponent } from './kubernetes-node-metric-stats-card/kubernetes-node-metric-stats-card.component';
import { KubernetesNodeSimpleMetricComponent } from './kubernetes-node-simple-metric/kubernetes-node-simple-metric.component';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('KubernetesNodeMetricsComponent', () => {
  let component: KubernetesNodeMetricsComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeMetricsComponent, KubernetesNodeMetricStatsCardComponent, KubernetesNodeSimpleMetricComponent],
      imports: KubernetesBaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService, KubernetesNodeService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
