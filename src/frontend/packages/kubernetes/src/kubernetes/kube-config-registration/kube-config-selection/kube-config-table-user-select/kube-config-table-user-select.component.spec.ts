import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableUserSelectComponent } from './kube-config-table-user-select.component';

describe('KubeConfigTableUserSelectComponent', () => {
  let component: KubeConfigTableUserSelectComponent;
  let fixture: ComponentFixture<KubeConfigTableUserSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [
        KubeConfigTableUserSelectComponent,
      ],
      providers: [
        KubeConfigHelper
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableUserSelectComponent);
    component = fixture.componentInstance;
    component.row = {
      _users: []
    } as KubeConfigFileCluster;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
