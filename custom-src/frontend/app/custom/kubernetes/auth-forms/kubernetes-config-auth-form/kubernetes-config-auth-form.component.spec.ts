import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from './../../../../../../../src/frontend/app/shared/shared.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesConfigAuthFormComponent } from './kubernetes-config-auth-form.component';
import { FormBuilder } from '@angular/forms';

describe('KubernetesConfigAuthFormComponent', () => {
  let component: KubernetesConfigAuthFormComponent;
  let fixture: ComponentFixture<KubernetesConfigAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesConfigAuthFormComponent ],
      imports: [
        SharedModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesConfigAuthFormComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    const form = fb.group({
      authValues: fb.group({
        kubeconfig: ''
      }),
    });
    component.formGroup = form;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
