import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MDAppModule, SharedModule } from '../../../../../core/src/public-api';
import { KubernetesAWSAuthFormComponent } from './kubernetes-aws-auth-form.component';

describe('KubernetesAWSAuthFormComponent', () => {
  let component: KubernetesAWSAuthFormComponent;
  let fixture: ComponentFixture<KubernetesAWSAuthFormComponent>;

  beforeEach(waitForAsync(() => {
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
    const fb = new UntypedFormBuilder();
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
