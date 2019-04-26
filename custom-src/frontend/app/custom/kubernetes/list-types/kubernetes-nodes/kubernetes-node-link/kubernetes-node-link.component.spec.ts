import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeLinkComponent } from './kubernetes-node-link.component';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';

describe('KubernetesNodeLinkComponent', () => {
  let component: KubernetesNodeLinkComponent<any>;
  let fixture: ComponentFixture<KubernetesNodeLinkComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeLinkComponent],
      imports: KubernetesBaseTestModules,
      providers: [KubernetesEndpointService, BaseKubeGuid]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeLinkComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        namespace: 'test',
        name: 'test',
        uid: 'test'
      },
      status: {
        conditions: [],
        addresses: [],
        images: []
      },
      spec: {
        containers: [],
        nodeName: 'test',
        schedulerName: 'test',
        initContainers: []
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
