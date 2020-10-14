import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MDAppModule, SharedModule } from '../../../../../core/src/public-api';
import { KubernetesSATokenAuthFormComponent } from './kubernetes-serviceaccount-auth-form.component';

describe('KubernetesSATokenAuthFormComponent', () => {
  let component: KubernetesSATokenAuthFormComponent;
  let fixture: ComponentFixture<KubernetesSATokenAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesSATokenAuthFormComponent],
      imports: [
        MDAppModule,
        SharedModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesSATokenAuthFormComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    const form = fb.group({
      authValues: fb.group({
        token: '',
      }),
    });
    component.formGroup = form;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
