import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '../../../../shared/shared.module';
import { KubernetesGKEAuthFormComponent } from './kubernetes-gke-auth-form.component';

describe('KubernetesGKEAuthFormComponent', () => {
  let component: KubernetesGKEAuthFormComponent;
  let fixture: ComponentFixture<KubernetesGKEAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesGKEAuthFormComponent],
      imports: [
        SharedModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesGKEAuthFormComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    const form = fb.group({
      authValues: fb.group({
        gkeconfig: ''
      }),
    });
    component.formGroup = form;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
