import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CompanyConfig } from './company-config.interface';
import { StratosBrandingService } from './stratos-branding.service';

describe('StratosBrandingService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('leaves no timer behind when its injector is destroyed', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(StratosBrandingService);
    // The constructor arms the FOUC-guard timeout that removes the
    // `theme-initializing` class from document.body.
    expect(vi.getTimerCount()).toBe(1);

    // Destroying the injector (what TestBed does between spec files, and what
    // the app does on teardown) must take the timer with it: otherwise it
    // fires into a document that no longer exists.
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });

  describe('company config loading', () => {
    // loadCompanyConfig() awaits each request, so the next request (or the
    // config update) happens on a later microtask than the flush.
    const settle = () => new Promise(resolve => setTimeout(resolve));
    const notFound = { status: 404, statusText: 'Not Found' };
    const withName = (name: string) => ({ company: { name } }) as Partial<CompanyConfig>;

    let service: StratosBrandingService;
    let http: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      service = TestBed.inject(StratosBrandingService);
      http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      http.verify();
      localStorage.removeItem('stratos-company-config');
    });

    it('applies /assets/company-config.json when it loads', async () => {
      http.expectOne('/assets/company-config.json').flush(withName('Acme'));
      await settle();

      expect(service.getCompanyName()).toBe('Acme');
      http.expectNone('/assets/config/company.json');
    });

    it('falls back to /assets/config/company.json when the first file fails', async () => {
      http.expectOne('/assets/company-config.json').flush(null, notFound);
      await settle();
      http.expectOne('/assets/config/company.json').flush(withName('Env Co'));
      await settle();

      expect(service.getCompanyName()).toBe('Env Co');
    });

    it('keeps the default config when neither file loads', async () => {
      http.expectOne('/assets/company-config.json').flush(null, notFound);
      await settle();
      http.expectOne('/assets/config/company.json').flush(null, notFound);
      await settle();

      expect(service.getCompanyName()).toBe('Stratos');
    });
  });
});
