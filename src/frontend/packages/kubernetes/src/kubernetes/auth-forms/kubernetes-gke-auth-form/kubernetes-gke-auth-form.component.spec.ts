import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { UntypedFormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from './../../../../../core/src/shared/shared.module';
import { KubernetesGKEAuthFormComponent } from './kubernetes-gke-auth-form.component';

describe('KubernetesGKEAuthFormComponent', () => {
  let component: KubernetesGKEAuthFormComponent;
  let fixture: ComponentFixture<KubernetesGKEAuthFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],imports: [
        SharedModule,
        NoopAnimationsModule
      ,
        KubernetesGKEAuthFormComponent
      ]
    })
      .compileComponents();
  });

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
