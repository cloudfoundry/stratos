import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { NodePodCountComponent } from './node-pod-count.component';

describe('NodePodCountComponent', () => {
  let component: NodePodCountComponent;
  let fixture: ComponentFixture<NodePodCountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NodePodCountComponent],
      imports: KubernetesBaseTestModules,
      providers: [KubeBaseGuidMock, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodePodCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
