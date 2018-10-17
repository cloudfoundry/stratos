import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricStatsCardComponent } from './kubernetes-node-metric-stats-card.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { KubernetesNodeSimpleMetricComponent } from '../kubernetes-node-simple-metric/kubernetes-node-simple-metric.component';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';

describe('KubernetesNodeMetricStatsCardComponent', () => {
  let component: KubernetesNodeMetricStatsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricStatsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeMetricStatsCardComponent, KubernetesNodeSimpleMetricComponent],
      imports: BaseTestModules,
      providers: [KubernetesNodeService, KubernetesEndpointService, BaseKubeGuid]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricStatsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
