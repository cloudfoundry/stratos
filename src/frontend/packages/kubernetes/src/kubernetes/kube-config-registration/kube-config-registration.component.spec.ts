import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration.component';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';

describe('KubeConfigRegistrationComponent', () => {
  let component: KubeConfigRegistrationComponent;
  let fixture: ComponentFixture<KubeConfigRegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [
        KubeConfigRegistrationComponent,
        KubeConfigSelectionComponent,
        KubeConfigImportComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
