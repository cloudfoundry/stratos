import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CreateAppStateService } from '../../../../shared/data-services/create-app-state.service';
import { CreateApplicationStep2Component } from './create-application-step2.component';
describe('CreateApplicationStep2Component', () => {
  let component: CreateApplicationStep2Component;
  let fixture: ComponentFixture<CreateApplicationStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateApplicationStep2Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...STORE_TEST_PROVIDERS,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says a taken name has been taken', async () => {
    TestBed.inject(CreateAppStateService).setCFDetails({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[formcontrolname="appName"]')!;
    input.value = 'my-app';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    // The check asks CF once typing pauses for 500ms.
    await new Promise(resolve => setTimeout(resolve, 550));
    TestBed.inject(HttpTestingController)
      .expectOne(r => r.url === '/pp/v1/cf/apps/cf-1' && r.params.get('names') === 'my-app')
      .flush({ resources: [], totalResults: 1 });
    await fixture.whenStable();

    const id = input.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe('This name has been taken, please try another.');
  });
});
