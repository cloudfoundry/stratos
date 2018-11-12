import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PodNameLinkComponent } from './pod-name-link.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../../kubernetes-page.types';
import { HelmReleaseService } from '../../../services/helm-release.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesStatus } from '../../../store/kube.types';

describe('PodNameLinkComponent', () => {
  let component: PodNameLinkComponent;
  let fixture: ComponentFixture<PodNameLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PodNameLinkComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, HelmReleaseService, KubernetesEndpointService]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PodNameLinkComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        namespace: 'test',
        name: 'test',
        uid: 'test'
      },
      status: {
        phase: KubernetesStatus.ACTIVE
      },
      spec: {
        containers: [],
        nodeName: 'test',
        schedulerName: 'test',
        initContainers: [],
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
