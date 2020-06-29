import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesPod, KubernetesStatus } from '../../../store/kube.types';
import { KubernetesPodStatusComponent } from './kubernetes-pod-status.component';

describe('KubernetesPodStatusComponent', () => {
  let component: KubernetesPodStatusComponent;
  let fixture: ComponentFixture<KubernetesPodStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KubernetesPodStatusComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodStatusComponent);
    component = fixture.componentInstance;
    component.row = {
      status: {
        phase: KubernetesStatus.FAILED,
      },
      spec: {
        containers: []
      },
      expandedStatus: {}
    } as KubernetesPod;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
