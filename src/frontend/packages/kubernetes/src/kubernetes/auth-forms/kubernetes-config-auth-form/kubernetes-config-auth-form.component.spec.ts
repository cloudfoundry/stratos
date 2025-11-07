import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { UntypedFormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from './../../../../../core/src/shared/shared.module';
import { KubernetesConfigAuthFormComponent } from './kubernetes-config-auth-form.component';

describe('KubernetesConfigAuthFormComponent', () => {
  let component: KubernetesConfigAuthFormComponent;
  let fixture: ComponentFixture<KubernetesConfigAuthFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],imports: [
        SharedModule,
        NoopAnimationsModule,

        KubernetesConfigAuthFormComponent,
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesConfigAuthFormComponent);
    component = fixture.componentInstance;
    const fb = new UntypedFormBuilder();
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
