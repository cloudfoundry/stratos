import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MDAppModule } from '../../../../core/md.module';
import { SharedModule } from '../../../../shared/shared.module';
import { KubernetesAWSAuthFormComponent } from './kubernetes-aws-auth-form.component';

describe('KubernetesAWSAuthFormComponent', () => {
  let component: KubernetesAWSAuthFormComponent;
  let fixture: ComponentFixture<KubernetesAWSAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesAWSAuthFormComponent],
      imports: [
        MDAppModule,
        SharedModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAWSAuthFormComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    const form = fb.group({
      authValues: fb.group({
        cluster: '',
        access_key: '',
        secret_key: ''
      }),
    });
    component.formGroup = form;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
