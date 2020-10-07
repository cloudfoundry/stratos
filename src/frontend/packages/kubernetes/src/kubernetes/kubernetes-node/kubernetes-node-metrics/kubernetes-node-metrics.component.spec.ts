import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import {
  KubernetesNodeMetricStatsCardComponent,
} from './kubernetes-node-metric-stats-card/kubernetes-node-metric-stats-card.component';
import { KubernetesNodeMetricsComponent } from './kubernetes-node-metrics.component';
import {
  KubernetesNodeSimpleMetricComponent,
} from './kubernetes-node-simple-metric/kubernetes-node-simple-metric.component';

describe('KubernetesNodeMetricsComponent', () => {
  let component: KubernetesNodeMetricsComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KubernetesNodeMetricsComponent,
        KubernetesNodeMetricStatsCardComponent,
        KubernetesNodeSimpleMetricComponent
      ],
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
