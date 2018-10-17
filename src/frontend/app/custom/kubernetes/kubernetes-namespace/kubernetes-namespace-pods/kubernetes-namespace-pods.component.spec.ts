import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNamespacePodsComponent } from './kubernetes-namespace-pods.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

describe('KubernetesNamespacePodsComponent', () => {
  let component: KubernetesNamespacePodsComponent;
  let fixture: ComponentFixture<KubernetesNamespacePodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNamespacePodsComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService, KubernetesNamespaceService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespacePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
