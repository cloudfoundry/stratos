import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodePodsComponent } from './kubernetes-node-pods.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

describe('KubernetesNodePodsComponent', () => {
  let component: KubernetesNodePodsComponent;
  let fixture: ComponentFixture<KubernetesNodePodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodePodsComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService, KubernetesNodeService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
