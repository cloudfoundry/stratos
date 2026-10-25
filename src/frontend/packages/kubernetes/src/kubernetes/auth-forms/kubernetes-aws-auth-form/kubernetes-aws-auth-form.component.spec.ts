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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        SharedModule,
        NoopAnimationsModule,

        KubernetesAWSAuthFormComponent,
      ],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
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

  // The secret key is a password-type field, so the browser would fill in
  // the console login it saved for this site.
  it('keeps the browser from filling in the console login', () => {
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.map(i => i.getAttribute('autocomplete'))).toEqual(['off', 'off', 'new-password']);
  });
});
