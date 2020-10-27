import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableSelectComponent } from './kube-config-table-select.component';

describe('KubeConfigTableSelectComponent', () => {
  let component: KubeConfigTableSelectComponent;
  let fixture: ComponentFixture<KubeConfigTableSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [KubeConfigTableSelectComponent],
      providers: [
        KubeConfigHelper
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableSelectComponent);
    component = fixture.componentInstance;
    component.row = {} as KubeConfigFileCluster;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
