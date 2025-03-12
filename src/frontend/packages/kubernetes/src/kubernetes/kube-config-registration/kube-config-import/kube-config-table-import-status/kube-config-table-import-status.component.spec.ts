import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigTableImportStatusComponent } from './kube-config-table-import-status.component';

describe('KubeConfigTableImportStatusComponent', () => {
  let component: KubeConfigTableImportStatusComponent;
  let fixture: ComponentFixture<KubeConfigTableImportStatusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [KubeConfigTableImportStatusComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableImportStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
