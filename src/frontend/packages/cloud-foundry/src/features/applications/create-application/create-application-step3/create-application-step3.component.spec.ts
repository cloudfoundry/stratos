import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';

import { generateCfStoreModules } from '@test-framework/cf';
import { CreateAppStateService, type NewAppCFDetails } from '../../../../shared/data-services/create-app-state.service';
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
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('says why the application could not be created in Cloud Foundry\'s words', async () => {
    component.newAppData = {
      cloudFoundryDetails: { cloudFoundry: 'cf1', org: 'org-1', space: 'space-1' } as NewAppCFDetails,
      name: 'my-app',
    };
    const result = component.onNext();
    const http = TestBed.inject(HttpTestingController);
    let post: TestRequest | undefined;
    await vi.waitFor(() => {
      post = http.match(r => r.method === 'POST')[0] ?? post;
      expect(post).toBeDefined();
    });
    post!.flush(
      { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: 'App with the name \'my-app\' already exists.' }] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(await result).toEqual({
      success: false,
      message: 'Could not create application: App with the name \'my-app\' already exists.',
    });
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

  // Going back to pick another org while the first org's domains are still
  // loading: the late answer must not replace the new org's domains.
  it('lists the domains of the org picked last when an earlier answer comes in late', async () => {
    const http = TestBed.inject(HttpTestingController);
    const state = TestBed.inject(CreateAppStateService);
    const domainsUrl = (org: string) => `/pp/v1/cf/org/cf1/${org}/private_domains`;
    const optionTexts = () => Array.from(fixture.nativeElement.querySelectorAll('app-option') as NodeListOf<HTMLElement>)
      .map(o => o.textContent?.trim());

    state.setName('my-app');
    state.setCFDetails({ cloudFoundry: 'cf1', org: 'org-a', space: 'space-a' } as NewAppCFDetails);
    await fixture.whenStable();
    const first = http.expectOne(domainsUrl('org-a'));

    state.setCFDetails({ cloudFoundry: 'cf1', org: 'org-b', space: 'space-b' } as NewAppCFDetails);
    await fixture.whenStable();
    const second = http.expectOne(domainsUrl('org-b'));

    second.flush({ resources: [{ guid: 'd-b', name: 'b.example.com' }] });
    await fixture.whenStable();
    // A cancelled request can no longer be answered
    if (!first.cancelled) {
      first.flush({ resources: [{ guid: 'd-a', name: 'a.example.com' }] });
    }
    await fixture.whenStable();

    expect(optionTexts()).toEqual(['b.example.com']);
  });
});
