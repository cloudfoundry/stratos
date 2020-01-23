import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesPod, KubernetesStatus } from '../../../store/kube.types';
import { KubernetesPodReadinessComponent } from './kubernetes-pod-readiness.component';

describe('KubernetesPodReadinessComponent', () => {
  let component: KubernetesPodReadinessComponent;
  let fixture: ComponentFixture<KubernetesPodReadinessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
      ],
      declarations: [KubernetesPodReadinessComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodReadinessComponent);
    component = fixture.componentInstance;
    component.row = {
      status: {
        phase: KubernetesStatus.FAILED,
      },
      spec: {
        containers: []
      }
    } as KubernetesPod;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
