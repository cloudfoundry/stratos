import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubeNamespacePodCountComponent } from './kube-namespace-pod-count.component';

describe('KubeNamespacePodCountComponent', () => {
  let component: KubeNamespacePodCountComponent;
  let fixture: ComponentFixture<KubeNamespacePodCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubeNamespacePodCountComponent],
      imports: KubernetesBaseTestModules,
      providers: [KubeBaseGuidMock, KubernetesEndpointService]
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
