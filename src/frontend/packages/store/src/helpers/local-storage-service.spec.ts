import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService, LocalStorageSyncTypes } from './local-storage-service';
import { BUILD_INFO } from '../../../core/src/environments/build-info';

const CURRENT_VERSION = BUILD_INFO.version;

describe('LocalStorageService', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  describe('version check on hydration', () => {
    it('should skip hydration and clear keys when version mismatches', () => {
      // Simulate stored preferences from an older version
      localStorage.setItem('stratos-testuser', JSON.stringify({ sidenavOpen: true }));
      localStorage.setItem('stratos-testuser-pagination', 'old-data');
      localStorage.setItem('stratos-testuser-lists', JSON.stringify({ view: 'cards' }));
      localStorage.setItem('stratos-testuser-version', 'v4.9.0');

      const store = { dispatch: vi.fn() } as any;
      const dashboardData = { hydrateFromStorage: vi.fn() } as any;
      const sessionData = { user: { name: 'testuser', guid: 'test-guid', admin: false, scopes: [] } } as any;

      LocalStorageService.localStorageToStore(store, sessionData, dashboardData);

      // Should NOT dispatch any hydrate actions
      expect(store.dispatch).not.toHaveBeenCalled();
      // DashboardDataService is told the storage key (with null value)
      // so subsequent mutations write through to the cleared slot.
      expect(dashboardData.hydrateFromStorage).toHaveBeenCalledWith('stratos-testuser', null);

      // Should clear all user-scoped keys
      expect(localStorage.getItem('stratos-testuser')).toBeNull();
      expect(localStorage.getItem('stratos-testuser-pagination')).toBeNull();
      expect(localStorage.getItem('stratos-testuser-lists')).toBeNull();

      // Should write current version
      expect(localStorage.getItem('stratos-testuser-version')).toBe(CURRENT_VERSION);
    });

    it('should hydrate dashboard via DashboardDataService and pagination/lists via store dispatch', () => {
      localStorage.setItem('stratos-testuser', JSON.stringify({ sidenavOpen: true }));
      localStorage.setItem('stratos-testuser-lists', JSON.stringify({ view: 'cards' }));
      localStorage.setItem('stratos-testuser-version', CURRENT_VERSION);

      const store = { dispatch: vi.fn() } as any;
      const dashboardData = { hydrateFromStorage: vi.fn() } as any;
      const sessionData = { user: { name: 'testuser', guid: 'test-guid', admin: false, scopes: [] } } as any;

      LocalStorageService.localStorageToStore(store, sessionData, dashboardData);

      // Dashboard slice now hydrates through the data service, NOT
      // through a store dispatch. List/pagination slices still dispatch.
      expect(dashboardData.hydrateFromStorage).toHaveBeenCalledWith(
        'stratos-testuser',
        JSON.stringify({ sidenavOpen: true })
      );
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should hydrate on first login with no stored version', () => {
      // No version key, no stored data — first login
      const store = { dispatch: vi.fn() } as any;
      const sessionData = { user: { name: 'newuser', guid: 'new-guid', admin: false, scopes: [] } } as any;

      LocalStorageService.localStorageToStore(store, sessionData);

      // Should write version even on first login
      expect(localStorage.getItem('stratos-newuser-version')).toBe(CURRENT_VERSION);
    });
  });

  describe('clearLocalStorage', () => {
    it('should clear version key along with preference keys', () => {
      localStorage.setItem('stratos-testuser', 'dashboard');
      localStorage.setItem('stratos-testuser-pagination', 'pagination');
      localStorage.setItem('stratos-testuser-lists', 'lists');
      localStorage.setItem('stratos-testuser-version', CURRENT_VERSION);

      const sessionData = { user: { name: 'testuser', guid: 'test-guid', admin: false, scopes: [] } } as any;
      const mockConfirmation = {
        openWithCancel: vi.fn((config, success) => success(true))
      } as any;

      // Mock window.location.assign to prevent navigation
      const assignMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { assign: assignMock },
        writable: true
      });

      LocalStorageService.clearLocalStorage(sessionData, mockConfirmation);

      expect(localStorage.getItem('stratos-testuser')).toBeNull();
      expect(localStorage.getItem('stratos-testuser-pagination')).toBeNull();
      expect(localStorage.getItem('stratos-testuser-lists')).toBeNull();
      expect(localStorage.getItem('stratos-testuser-version')).toBeNull();
    });
  });

  describe('clearSections', () => {
    it('should clear only specified sections', () => {
      localStorage.setItem('stratos-testuser', 'dashboard');
      localStorage.setItem('stratos-testuser-pagination', 'pagination');
      localStorage.setItem('stratos-testuser-lists', 'lists');

      const sessionData = { user: { name: 'testuser', guid: 'test-guid', admin: false, scopes: [] } } as any;

      LocalStorageService.clearSections(sessionData, [LocalStorageSyncTypes.PAGINATION, LocalStorageSyncTypes.LISTS]);

      expect(localStorage.getItem('stratos-testuser')).toBe('dashboard'); // Untouched
      expect(localStorage.getItem('stratos-testuser-pagination')).toBeNull();
      expect(localStorage.getItem('stratos-testuser-lists')).toBeNull();
    });
  });

  describe('clearThemePreferences', () => {
    it('should clear all non-user-scoped theme keys', () => {
      localStorage.setItem('stratos-theme-mode', 'dark');
      localStorage.setItem('stratos-branding', '{}');
      localStorage.setItem('stratos-company-config', '{}');
      localStorage.setItem('stratos-show-all-menu-items', 'true');
      localStorage.setItem('stratos-testuser', 'should-not-touch');

      LocalStorageService.clearThemePreferences();

      expect(localStorage.getItem('stratos-theme-mode')).toBeNull();
      expect(localStorage.getItem('stratos-branding')).toBeNull();
      expect(localStorage.getItem('stratos-company-config')).toBeNull();
      expect(localStorage.getItem('stratos-show-all-menu-items')).toBeNull();
      expect(localStorage.getItem('stratos-testuser')).toBe('should-not-touch');
    });
  });
});
