import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeNamespacePodCountComponent } from './kube-namespace-pod-count.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { HelmReleaseService } from '../../../services/helm-release.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';

describe('KubeNamespacePodCountComponent', () => {
  let component: KubeNamespacePodCountComponent;
  let fixture: ComponentFixture<KubeNamespacePodCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubeNamespacePodCountComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, HelmReleaseService, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeNamespacePodCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
