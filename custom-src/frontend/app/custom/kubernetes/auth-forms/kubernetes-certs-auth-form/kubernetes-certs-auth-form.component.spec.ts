import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesCertsAuthFormComponent } from './kubernetes-certs-auth-form.component';
import { FormBuilder } from '@angular/forms';
import { SharedModule } from '../../../../../../../src/frontend/app/shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('KubernetesCertsAuthFormComponent', () => {
  let component: KubernetesCertsAuthFormComponent;
  let fixture: ComponentFixture<KubernetesCertsAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesCertsAuthFormComponent ],
      imports: [
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
