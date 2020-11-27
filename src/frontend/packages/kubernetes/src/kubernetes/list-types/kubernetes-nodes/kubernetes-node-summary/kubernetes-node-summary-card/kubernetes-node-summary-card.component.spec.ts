import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseKubeGuid } from '../../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card.component';

describe('KubernetesNodeSummaryCardComponent', () => {
  let component: KubernetesNodeSummaryCardComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeSummaryCardComponent],
      imports: KubernetesBaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService, KubernetesNodeService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
