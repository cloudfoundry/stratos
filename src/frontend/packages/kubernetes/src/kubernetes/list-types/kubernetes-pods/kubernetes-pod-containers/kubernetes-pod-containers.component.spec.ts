import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesPod } from '../../../store/kube.types';
import { KubernetesPodContainersComponent } from './kubernetes-pod-containers.component';

describe('KubernetesPodContainersComponent', () => {
  let component: KubernetesPodContainersComponent;
  let fixture: ComponentFixture<KubernetesPodContainersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesPodContainersComponent],
      imports: KubernetesBaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodContainersComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        uid: ''
      },
      status: {

      }
    } as KubernetesPod;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
