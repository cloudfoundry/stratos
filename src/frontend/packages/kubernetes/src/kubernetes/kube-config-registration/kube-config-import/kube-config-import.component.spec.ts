import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import.component';

describe('KubeConfigImportComponent', () => {
  let component: KubeConfigImportComponent;
  let fixture: ComponentFixture<KubeConfigImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [KubeConfigImportComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
