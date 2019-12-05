import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import {
  KubernetesNodeConditionCardComponent,
} from './kubernetes-node-condition-card/kubernetes-node-condition-card.component';
import {
  KubernetesNodeConditionComponent,
} from './kubernetes-node-condition-card/kubernetes-node-condition/kubernetes-node-condition.component';
import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card/kubernetes-node-info-card.component';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card/kubernetes-node-summary-card.component';
import { KubernetesNodeSummaryComponent } from './kubernetes-node-summary.component';
import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card/kubernetes-node-tags-card.component';

describe('KubernetesNodeSummaryComponent', () => {
  let component: KubernetesNodeSummaryComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeSummaryComponent,
        KubernetesNodeConditionComponent,
        KubernetesNodeConditionCardComponent,
        KubernetesNodeSummaryCardComponent,
        KubernetesNodeInfoCardComponent,
        KubernetesNodeTagsCardComponent,
      ],
      imports: KubernetesBaseTestModules,
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
