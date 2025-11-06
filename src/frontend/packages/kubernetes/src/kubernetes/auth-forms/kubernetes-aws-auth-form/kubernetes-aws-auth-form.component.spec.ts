import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { UntypedFormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MDAppModule, SharedModule } from '../../../../../core/src/public-api';
import { KubernetesAWSAuthFormComponent } from './kubernetes-aws-auth-form.component';

describe('KubernetesAWSAuthFormComponent', () => {
  let component: KubernetesAWSAuthFormComponent;
  let fixture: ComponentFixture<KubernetesAWSAuthFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],imports: [
        MDAppModule,
        SharedModule,
        NoopAnimationsModule
      ,
        KubernetesAWSAuthFormComponent
      ]
    })
      .compileComponents();
  });

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
