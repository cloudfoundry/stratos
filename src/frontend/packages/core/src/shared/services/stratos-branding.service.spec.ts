import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { StratosBrandingService, defaultTheme } from '@stratosui/theme';
import { BUILD_INFO } from '../../environments/build-info';

describe('StratosBrandingService', () => {
  let service: StratosBrandingService;
  let httpTestingController: HttpTestingController;

  /** Drain all pending HTTP requests (constructor fires async config loads) */
  function drainHttpRequests() {
    const pending = httpTestingController.match(() => true);
    for (const req of pending) {
      req.flush(null, { status: 404, statusText: 'Not Found' });
    }
  }

  beforeEach(() => {
    // Clear localStorage and set current app version so checkAppVersion is a no-op
    localStorage.clear();
    localStorage.setItem('stratos-app-version', BUILD_INFO.version);

    // Reset TestBed so we get a fresh service instance per test
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        StratosBrandingService,
      ],
    });

    service = TestBed.inject(StratosBrandingService);
    httpTestingController = TestBed.inject(HttpTestingController);

    // Drain constructor HTTP requests (company-config loads)
    drainHttpRequests();
  });

  afterEach(() => {
    // Drain any remaining async requests from the constructor's fallback chain
    drainHttpRequests();
    localStorage.clear();
  });

  // ===========================================================================
  // Layer 1+2: Initialization (constructor)
  // ===========================================================================

  describe('Layer 1+2: Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should apply defaultTheme CSS vars to document root', () => {
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary')).toBe(defaultTheme.colors.primary);
      expect(root.style.getPropertyValue('--color-secondary')).toBe(defaultTheme.colors.secondary);
      expect(root.style.getPropertyValue('--nav-bg')).toBe(defaultTheme.navigation.background);
      expect(root.style.getPropertyValue('--app-bg')).toBe(defaultTheme.layout.background);
    });

    it('should start in light mode', () => {
      expect(service.themeMode()).toBe('light');
    });

    it('should have isDarkMode false', () => {
      expect(service.isDarkMode()).toBe(false);
    });

    it('should have userPrefsActive false', () => {
      expect(service.userPrefsActive()).toBe(false);
    });

    it('should return "Stratos" from getCompanyName()', () => {
      expect(service.getCompanyName()).toBe('Stratos');
    });

    it('should return "Stratos" from getCopyrightText()', () => {
      expect(service.getCopyrightText()).toBe('Stratos');
    });
  });

  // ===========================================================================
  // Layer 3: activateUserPreferences()
  // ===========================================================================

  describe('Layer 3: activateUserPreferences', () => {
    it('should use config defaults when no saved mode in localStorage', () => {
      service.activateUserPreferences();
      expect(service.themeMode()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    });

    it('should apply dark mode when localStorage has "dark"', () => {
      localStorage.setItem('stratos-theme-mode', 'dark');
      service.activateUserPreferences();
      expect(service.themeMode()).toBe('dark');
      expect(service.isDarkMode()).toBe(true);
    });

    it('should resolve system mode from media query', () => {
      localStorage.setItem('stratos-theme-mode', 'system');
      service.activateUserPreferences();
      expect(service.themeMode()).toBe('system');
      // happy-dom matchMedia defaults to not matching (light)
      expect(service.isDarkMode()).toBe(false);
    });

    it('should only activate once (second call is no-op)', () => {
      localStorage.setItem('stratos-theme-mode', 'dark');
      service.activateUserPreferences();
      expect(service.isDarkMode()).toBe(true);

      service.setThemeMode('light');
      service.activateUserPreferences(); // no-op
      expect(service.isDarkMode()).toBe(false);
      expect(service.themeMode()).toBe('light');
    });

    it('should set userPrefsActive to true after activation', () => {
      expect(service.userPrefsActive()).toBe(false);
      service.activateUserPreferences();
      expect(service.userPrefsActive()).toBe(true);
    });
  });

  // ===========================================================================
  // Theme mode switching
  // ===========================================================================

  describe('Theme mode switching', () => {
    it('setThemeMode("dark") should set isDarkMode to true', () => {
      service.setThemeMode('dark');
      expect(service.isDarkMode()).toBe(true);
    });

    it('setThemeMode("light") should set isDarkMode to false', () => {
      service.setThemeMode('dark');
      service.setThemeMode('light');
      expect(service.isDarkMode()).toBe(false);
    });

    it('toggleTheme() should flip between light and dark', () => {
      expect(service.isDarkMode()).toBe(false);
      service.toggleTheme();
      expect(service.isDarkMode()).toBe(true);
      service.toggleTheme();
      expect(service.isDarkMode()).toBe(false);
    });

    it('setThemeMode should persist to localStorage', () => {
      service.setThemeMode('dark');
      expect(localStorage.getItem('stratos-theme-mode')).toBe('dark');
    });

    it('setThemeMode("dark") should add dark class to body', () => {
      service.setThemeMode('dark');
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('setThemeMode("light") should remove dark class from body', () => {
      service.setThemeMode('dark');
      service.setThemeMode('light');
      expect(document.body.classList.contains('dark-theme')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  // ===========================================================================
  // Layer 4: Page Preference Defaults
  // ===========================================================================

  describe('Layer 4: Page preference defaults', () => {
    it('getDefaultPageSize() should return 9', () => {
      expect(service.getDefaultPageSize()).toBe(9);
    });

    it('getDefaultViewMode() should return "cards"', () => {
      expect(service.getDefaultViewMode()).toBe('cards');
    });

    it('getDefaultSortDirection() should return "asc"', () => {
      expect(service.getDefaultSortDirection()).toBe('asc');
    });

    it('getDefaultSidebarOpen() should return true', () => {
      expect(service.getDefaultSidebarOpen()).toBe(true);
    });

    it('getDefaultPollingEnabled() should return true', () => {
      expect(service.getDefaultPollingEnabled()).toBe(true);
    });
  });

  // ===========================================================================
  // Company branding
  // ===========================================================================

  describe('Company branding', () => {
    it('setCompanyBranding() should update theme branding signal', () => {
      service.setCompanyBranding({ companyName: 'Acme Corp' });
      expect(service.theme().branding.companyName).toBe('Acme Corp');
    });

    it('setCompanyBranding() should persist to localStorage', () => {
      service.setCompanyBranding({ companyName: 'Acme Corp' });
      const stored = localStorage.getItem('stratos-branding');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.branding.companyName).toBe('Acme Corp');
    });

    it('custom branding should survive dark/light mode switches', () => {
      service.setCompanyBranding({ companyName: 'Acme Corp' });
      expect(service.theme().branding.companyName).toBe('Acme Corp');

      service.setThemeMode('dark');
      expect(service.theme().branding.companyName).toBe('Acme Corp');

      service.setThemeMode('light');
      expect(service.theme().branding.companyName).toBe('Acme Corp');
    });

    it('resetTheme() should clear custom branding', () => {
      service.setCompanyBranding({ companyName: 'Acme Corp' });
      expect(service.theme().branding.companyName).toBe('Acme Corp');

      service.resetTheme();
      expect(service.theme().branding.companyName).toBe(defaultTheme.branding.companyName);
      expect(localStorage.getItem('stratos-branding')).toBeNull();
    });
  });

  // ===========================================================================
  // Theme utility methods
  // ===========================================================================

  describe('Theme utility methods', () => {
    it('getPrimaryColor() should return the current primary color', () => {
      expect(service.getPrimaryColor()).toBe(defaultTheme.colors.primary);
    });

    it('getNavBackground() should return navigation background', () => {
      expect(service.getNavBackground()).toBe(defaultTheme.navigation.background);
    });

    it('getBrandingInfo() should return branding from current theme', () => {
      const branding = service.getBrandingInfo();
      expect(branding.companyName).toBe('Stratos');
      expect(branding.loginTitle).toBe('Stratos Console');
    });

    it('exportTheme() should return valid JSON', () => {
      const json = service.exportTheme();
      const parsed = JSON.parse(json);
      expect(parsed.colors.primary).toBe(defaultTheme.colors.primary);
    });

    it('importTheme() should apply a valid theme', () => {
      const customTheme = { ...defaultTheme, colors: { ...defaultTheme.colors, primary: '#ff0000' } };
      const result = service.importTheme(JSON.stringify(customTheme));
      expect(result).toBe(true);
      expect(service.getPrimaryColor()).toBe('#ff0000');
    });

    it('importTheme() should return false for invalid JSON', () => {
      const result = service.importTheme('not valid json');
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // App version check
  // ===========================================================================

  describe('App version check', () => {
    it('should store current app version', () => {
      expect(localStorage.getItem('stratos-app-version')).toBe(BUILD_INFO.version);
    });
  });
});
