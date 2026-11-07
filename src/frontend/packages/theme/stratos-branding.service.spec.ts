import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BUILD_INFO } from '../core/src/environments/build-info';
import { CompanyConfig } from './company-config.interface';
import { StratosBrandingService } from './stratos-branding.service';
import { darkTheme } from './theme.config';

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

    it('says which config it applied', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      http.expectOne('/assets/company-config.json').flush(withName('Acme'));
      await settle();
      expect(info).toHaveBeenCalledWith('[StratosBrandingService] Company config loaded from /assets/company-config.json');
      info.mockRestore();
    });

    it('says when it fell back to the built-in config', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      http.expectOne('/assets/company-config.json').flush(null, notFound);
      await settle();
      http.expectOne('/assets/config/company.json').flush(null, notFound);
      await settle();
      expect(info).toHaveBeenCalledWith('[StratosBrandingService] Company config: using the built-in defaults');
      info.mockRestore();
    });
  });

  describe('configured colors across theme modes (#6138)', () => {
    const settle = () => new Promise(resolve => setTimeout(resolve));
    const notFound = { status: 404, statusText: 'Not Found' };
    // The operator's file: brand colors, a navigation color and a header
    // color, all different from the defaults.
    const branded = {
      theme: { primary: '#ff00ff' },
      navigation: { background: '#800080' },
      layout: { headerBackground: '#ffe0ff' },
    } as Partial<CompanyConfig>;
    const cssVar = (name: string) => document.documentElement.style.getPropertyValue(name);

    let service: StratosBrandingService;
    let http: HttpTestingController;

    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('stratos-app-version', BUILD_INFO.version);
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      service = TestBed.inject(StratosBrandingService);
      http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      http.verify();
      localStorage.clear();
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
    });

    it('keeps the configured colors through a light, dark, light switch', async () => {
      http.expectOne('/assets/company-config.json').flush(branded);
      await settle();
      service.activateUserPreferences();

      service.setThemeMode('dark');
      service.setThemeMode('light');

      expect(cssVar('--color-primary')).toBe('#ff00ff');
      expect(cssVar('--nav-bg')).toBe('#800080');
      expect(cssVar('--header-bg')).toBe('#ffe0ff');
    });

    it('keeps the configured colors when the preferences activate after the config has loaded', async () => {
      http.expectOne('/assets/company-config.json').flush(branded);
      await settle();

      service.activateUserPreferences();

      expect(cssVar('--color-primary')).toBe('#ff00ff');
      expect(cssVar('--nav-bg')).toBe('#800080');
      expect(cssVar('--header-bg')).toBe('#ffe0ff');
    });

    it('carries the brand colors into dark mode and leaves its surfaces to the dark theme', async () => {
      http.expectOne('/assets/company-config.json').flush(branded);
      await settle();
      service.activateUserPreferences();

      service.setThemeMode('dark');

      expect(cssVar('--color-primary')).toBe('#ff00ff');
      expect(cssVar('--nav-bg')).toBe(darkTheme.navigation.background);
      expect(cssVar('--header-bg')).toBe(darkTheme.layout.headerBackground);
    });

    it('does not log a mode change to the console unless debug.logThemeChanges is set', async () => {
      http.expectOne('/assets/company-config.json').flush(branded);
      await settle();
      service.activateUserPreferences();
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      service.setThemeMode('dark');
      service.setThemeMode('light');
      expect(log).not.toHaveBeenCalled();

      service.setCompanyConfig({ debug: { logThemeChanges: true } });
      log.mockClear();
      service.setThemeMode('dark');
      expect(log).toHaveBeenCalledWith('[StratosBrandingService] Setting theme mode to:', 'dark');
      expect(log).toHaveBeenCalledWith('[StratosBrandingService] Applying theme:', service.theme());
      log.mockRestore();
    });

    it('leaves dark mode untouched when the config has the default colors', async () => {
      http.expectOne('/assets/company-config.json').flush(null, notFound);
      await settle();
      http.expectOne('/assets/config/company.json').flush(null, notFound);
      await settle();
      service.activateUserPreferences();

      service.setThemeMode('dark');

      expect(cssVar('--color-primary')).toBe(darkTheme.colors.primary);
      expect(cssVar('--color-secondary')).toBe(darkTheme.colors.secondary);
      expect(cssVar('--nav-text')).toBe(darkTheme.navigation.text);
      expect(cssVar('--header-bg')).toBe(darkTheme.layout.headerBackground);
    });
  });
});
