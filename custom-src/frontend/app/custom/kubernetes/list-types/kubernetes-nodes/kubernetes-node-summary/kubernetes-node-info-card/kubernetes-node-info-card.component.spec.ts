import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card.component';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../../../../kubernetes-page.types';

describe('KubernetesNodeInfoCardComponent', () => {
  let component: KubernetesNodeInfoCardComponent;
  let fixture: ComponentFixture<KubernetesNodeInfoCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeInfoCardComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, KubernetesNodeService, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
