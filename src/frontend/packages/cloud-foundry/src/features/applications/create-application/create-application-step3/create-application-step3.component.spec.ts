import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { generateCfStoreModules } from '@test-framework/cf';
import { CreateApplicationStep3Component } from './create-application-step3.component';
describe('CreateApplicationStep3Component', () => {
  let component: CreateApplicationStep3Component;
  let fixture: ComponentFixture<CreateApplicationStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateApplicationStep3Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        importProvidersFrom(...generateCfStoreModules(), HttpClientTestingModule),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says a host cannot exceed 63 characters', async () => {
    // The host is enabled once a domain is chosen.
    component.setDomainHost.controls.host.enable();
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[formcontrolname="host"]')!;
    input.value = 'h'.repeat(64);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const id = input.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe('Host cannot exceed 63 characters');
  });
});
