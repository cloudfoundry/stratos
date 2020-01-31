import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from 'frontend/packages/core/src/core/core.module';

import { SharedModule } from '../../../../shared/shared.module';
import { KubernetesCertsAuthFormComponent } from './kubernetes-certs-auth-form.component';

describe('KubernetesCertsAuthFormComponent', () => {
  let component: KubernetesCertsAuthFormComponent;
  let fixture: ComponentFixture<KubernetesCertsAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesCertsAuthFormComponent],
      imports: [
        CoreModule,
        SharedModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesCertsAuthFormComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    const form = fb.group({
      authValues: fb.group({
        cert: '',
        certKey: ''
      }),
    });
    component.formGroup = form;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
