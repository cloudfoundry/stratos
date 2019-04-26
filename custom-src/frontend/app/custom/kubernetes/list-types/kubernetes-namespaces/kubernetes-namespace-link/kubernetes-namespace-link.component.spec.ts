import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesStatus } from '../../../store/kube.types';
import { KubernetesNamespaceLinkComponent } from './kubernetes-namespace-link.component';

describe('KubernetesNamespaceLinkComponent', () => {
  let component: KubernetesNamespaceLinkComponent;
  let fixture: ComponentFixture<KubernetesNamespaceLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNamespaceLinkComponent],
      imports: KubernetesBaseTestModules,
      providers: [KubernetesEndpointService, BaseKubeGuid]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceLinkComponent);
    component = fixture.componentInstance;
    component.row = {
      spec: {
        finalizers: []
      },
      status: {
        phase: KubernetesStatus.RUNNING
      },
      metadata: {
        namespace: 'test',
        name: 'test',
        uid: 'test',
        labels: {}
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
