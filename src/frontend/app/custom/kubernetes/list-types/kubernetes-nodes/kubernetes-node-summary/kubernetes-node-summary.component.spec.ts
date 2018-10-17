import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeSummaryComponent } from './kubernetes-node-summary.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card/kubernetes-node-summary-card.component';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card/kubernetes-node-info-card.component';

describe('KubernetesNodeSummaryComponent', () => {
  let component: KubernetesNodeSummaryComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeSummaryComponent, KubernetesNodeSummaryCardComponent, KubernetesNodeInfoCardComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService, KubernetesNodeService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
