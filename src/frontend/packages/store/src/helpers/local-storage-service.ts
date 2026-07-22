import { ConfirmationDialogConfig } from '../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../core/src/shared/components/confirmation-dialog.service';
import { DashboardDataService } from '../../../core/src/core/dashboard-data.service';
import { BUILD_INFO } from '../../../core/src/environments/build-info';
import { SessionData } from '../types/auth.types';


export enum LocalStorageSyncTypes {
  DASHBOARD = 'dashboard',
  PAGINATION = 'pagination',
  LISTS = 'lists',
}

export class LocalStorageService {

  /**
   * Object used to access/update local storage
   */
  private static getStorage(): Storage {
    return localStorage || window.localStorage;
  }

  /**
   * Make a key used by local storage that relates to a section of the user's settings in the console's store
   */
  private static makeKey(userId: string | null, storeKey: LocalStorageSyncTypes): string {
    if (!userId) {
      return '';
    }
    if (storeKey === LocalStorageSyncTypes.DASHBOARD) {
      // Legacy support for when we only stored dashboard
      return userId;
    }
    return userId + '-' + storeKey;
  }

  private static VERSION_SUFFIX = '-version';

  /**
   * Check if stored preferences match the current app version.
   * If not, clear all user-scoped preferences and start fresh.
   */
  private static checkVersionAndClear(storage: Storage, sessionId: string): boolean {
    const versionKey = sessionId + LocalStorageService.VERSION_SUFFIX;
    const storedVersion = storage.getItem(versionKey);
    const currentVersion = BUILD_INFO.version;

    if (storedVersion === currentVersion) {
      return true; // Version matches, proceed with hydration
    }

    if (storedVersion) {
      console.log(`Stratos version changed (${storedVersion} → ${currentVersion}), clearing stored preferences`);
    }

    // Clear all user-scoped keys
    Object.values(LocalStorageSyncTypes).forEach(type => {
      const key = LocalStorageService.makeKey(sessionId, type);
      storage.removeItem(key);
    });

    // Write current version
    storage.setItem(versionKey, currentVersion);
    return false; // Preferences cleared, skip hydration
  }

  /**
   * Normally used on app init, move local storage data into signal-native
   * services.
   *
   * `dashboardData` is optional purely so the legacy callsite signature
   * doesn't break specs that don't bother instantiating the service.
   * Real callers pass it so the dashboard slice (signal-native, no
   * longer ngrx) can hydrate from its user-keyed localStorage entry.
   *
   * The legacy `pagination` hydration was retired with the ngrx pagination
   * engine (#5413); list/page/sort state is now owned by the signal-native
   * ListStateStore (its own `stratos.list-state.v1.*` keys).
   */
  public static localStorageToStore(
    sessionData: SessionData,
    dashboardData?: DashboardDataService,
  ) {
    const storage = LocalStorageService.getStorage();
    // We use the username to key the session storage. We could replace this with the users id?
    if (storage && sessionData.user) {
      const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user?.name);
      if (sessionId) {
        // Check version — clear stale preferences if version changed
        if (!LocalStorageService.checkVersionAndClear(storage, sessionId)) {
          // Preferences cleared, use defaults — but still tell the
          // dashboard data service the storage key so subsequent
          // mutations write through to localStorage.
          dashboardData?.hydrateFromStorage(LocalStorageService.makeKey(sessionId, LocalStorageSyncTypes.DASHBOARD), null);
          return;
        }

        if (dashboardData) {
          const dashboardKey = LocalStorageService.makeKey(sessionId, LocalStorageSyncTypes.DASHBOARD);
          dashboardData.hydrateFromStorage(dashboardKey, storage.getItem(dashboardKey));
        }
      }
    }
  }

  /**
   * Get a unique identifier for the user
   */
  private static getLocalStorageSessionId(username?: string) {
    const prefix = 'stratos-';
    if (username) {
      return prefix + username;
    }
    const idElement = document.getElementById('__stratos-userid__');
    if (idElement) {
      return prefix + idElement.innerText;
    }
    return null;
  }

  public static localStorageSize(sessionData: SessionData): number {
    const storage = LocalStorageService.getStorage();
    const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user?.name);
    if (storage && sessionId) {
      return Object.values(LocalStorageSyncTypes).reduce((total, type) => {
        const key = LocalStorageService.makeKey(sessionId, type);
        const content = storage.getItem(key);
        // We're getting an approximate size in bytes, so just assume a character is one byte
        // content can be null if the item doesn't exist in localStorage
        return total + (content ? content.length : 0);
      }, 0);
    }
    return -1;
  }

  /**
   * Clear local storage and the store
   */
  public static clearLocalStorage(sessionData: SessionData, confirmationService: ConfirmationDialogService, reloadTo = '/user-profile') {
    const config: ConfirmationDialogConfig = {
      message: 'This will clear your stored settings and reload the application',
      confirm: 'Clear',
      critical: true,
      title: 'Are you sure?'
    };

    const successAction = (res: boolean) => {
      if (!res) {
        return;
      }

      const storage = LocalStorageService.getStorage();
      const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user?.name);
      if (storage && sessionId) {
        Object.values(LocalStorageSyncTypes).forEach(type => {
          const key = LocalStorageService.makeKey(sessionId, type);
          storage.removeItem(key);
        });
        storage.removeItem(sessionId + LocalStorageService.VERSION_SUFFIX);

        // This is a brutal approach but is a lot easier than reverting all user changes in the store
        window.location.assign(reloadTo);
      } else {
        console.warn('Unable to clear local storage, either storage or session id is missing');
      }
    };

    confirmationService.openWithCancel(config, successAction, () => { });
  }

  /**
   * Clear specific localStorage sections for the user
   */
  public static clearSections(sessionData: SessionData, sections: LocalStorageSyncTypes[]) {
    const storage = LocalStorageService.getStorage();
    const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user?.name);
    if (storage && sessionId) {
      sections.forEach(type => {
        const key = LocalStorageService.makeKey(sessionId, type);
        storage.removeItem(key);
      });
    }
  }

  /**
   * Clear non-user-scoped theme preferences
   */
  public static clearThemePreferences() {
    const storage = LocalStorageService.getStorage();
    if (storage) {
      storage.removeItem('stratos-theme-mode');
      storage.removeItem('stratos-branding');
      storage.removeItem('stratos-company-config');
      storage.removeItem('stratos-show-all-menu-items');
    }
  }
}
