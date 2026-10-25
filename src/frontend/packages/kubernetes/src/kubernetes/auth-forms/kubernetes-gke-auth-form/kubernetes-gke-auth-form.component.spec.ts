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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        NoopAnimationsModule,

        KubernetesGKEAuthFormComponent,
      ],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
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

  it('names the credentials file picker after its caption', () => {
    const root: HTMLElement = fixture.nativeElement;
    const path = root.querySelector('app-file-input input[type="text"]');
    const caption = root.querySelector(`#${path?.getAttribute('aria-labelledby')}`);
    expect(caption?.textContent?.trim()).toBe("Select an `Application Default Credentials' file:");
  });
});
