import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card.component';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

describe('KubernetesNodeTagsCardComponent', () => {
  let component: KubernetesNodeTagsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeTagsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeTagsCardComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService, KubernetesNodeService],

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeTagsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
