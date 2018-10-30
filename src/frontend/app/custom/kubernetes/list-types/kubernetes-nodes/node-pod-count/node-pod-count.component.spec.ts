import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodePodCountComponent } from './node-pod-count.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../../../kubernetes-page.types';

describe('NodePodCountComponent', () => {
  let component: NodePodCountComponent;
  let fixture: ComponentFixture<NodePodCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NodePodCountComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService]
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
