import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from './../../../../../core/src/shared/shared.module';
import { KubernetesGKEAuthFormComponent } from './kubernetes-gke-auth-form.component';

describe('KubernetesGKEAuthFormComponent', () => {
  let component: KubernetesGKEAuthFormComponent;
  let fixture: ComponentFixture<KubernetesGKEAuthFormComponent>;

  beforeEach(waitForAsync(() => {
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
    const fb = new UntypedFormBuilder();
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
