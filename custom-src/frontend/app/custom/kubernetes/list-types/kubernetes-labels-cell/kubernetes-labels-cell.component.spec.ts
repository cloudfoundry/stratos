import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesStatus } from '../../../../../../../../../custom-src/frontend/app/custom/kubernetes/store/kube.types';
import { BaseTestModules } from '../../../../../test-framework/core-test.helper';
import { KubernetesLabelsCellComponent } from './kubernetes-labels-cell.component';

describe('KubernetesLabelsCellComponent', () => {
  let component: KubernetesLabelsCellComponent;
  let fixture: ComponentFixture<KubernetesLabelsCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesLabelsCellComponent],
      imports: BaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesLabelsCellComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        labels: {},
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
        initContainers: []
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
