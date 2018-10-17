import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesPodTagsComponent } from './kubernetes-pod-tags.component';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { KubernetesStatus } from '../../../store/kube.types';

describe('KubernetesPodTagsComponent', () => {
  let component: KubernetesPodTagsComponent<any>;
  let fixture: ComponentFixture<KubernetesPodTagsComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesPodTagsComponent],
      imports: BaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodTagsComponent);
    component = fixture.componentInstance;
    component.row = {
      spec: {},
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
