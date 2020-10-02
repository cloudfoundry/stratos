import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricStatsCardComponent } from './kubernetes-node-metric-stats-card.component';
import { KubernetesNodeSimpleMetricComponent } from '../kubernetes-node-simple-metric/kubernetes-node-simple-metric.component';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';

describe('KubernetesNodeMetricStatsCardComponent', () => {
  let component: KubernetesNodeMetricStatsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricStatsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeMetricStatsCardComponent, KubernetesNodeSimpleMetricComponent],
      imports: KubernetesBaseTestModules,
      providers: [KubernetesNodeService, KubernetesEndpointService, BaseKubeGuid]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricStatsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Ensure we destroy the component and clean up the polling subscription
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
