import { ActionReducer, Store } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';

import { ConfirmationDialogConfig } from '../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../core/src/shared/components/confirmation-dialog.service';
import { DashboardDataService } from '../../../core/src/core/dashboard-data.service';
import { BUILD_INFO } from '../../../core/src/environments/build-info';
import { HydrateListsStateAction } from '../actions/list.actions';
import { HydratePaginationStateAction } from '../actions/pagination.actions';
import { DispatchOnlyAppState } from '../app-state';
import { SessionData } from '../types/auth.types';
import { PaginationState } from '../types/pagination.types';


export enum LocalStorageSyncTypes {
  DASHBOARD = 'dashboard',
  PAGINATION = 'pagination',
  LISTS = 'lists',
}

export class LocalStorageService {

  /**
   * Convenience for dev
   */
  private static Encrypt = true;

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
   * Normally used on app init, move local storage data into the console's store.
   *
   * `dashboardData` is optional purely so the legacy callsite signature
   * doesn't break specs that don't bother instantiating the service.
   * Real callers pass it so the dashboard slice (signal-native, no
   * longer ngrx) can hydrate from its user-keyed localStorage entry.
   */
  public static localStorageToStore(
    store: Store<DispatchOnlyAppState>,
    sessionData: SessionData,
    dashboardData?: DashboardDataService,
  ) {
    const storage = LocalStorageService.getStorage();
    // We use the username to key the session storage. We could replace this with the users id?
    if (storage && sessionData.user) {
      const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user.name);
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
        LocalStorageService.localStorageToStoreSection(
          LocalStorageSyncTypes.PAGINATION,
          dataForStore => store.dispatch(new HydratePaginationStateAction(dataForStore)),
          storage,
          sessionId,
          true
        );
        LocalStorageService.localStorageToStoreSection(
          LocalStorageSyncTypes.LISTS,
          dataForStore => store.dispatch(new HydrateListsStateAction(dataForStore)),
          storage,
          sessionId
        );
      }
    }
  }

  /**
   * For a given storage type fetch it's data for the given user from local storage and dispatch an action that will
   * be handled by the reducers for that storage type (dashboard, pagination, etc)
   */
  private static localStorageToStoreSection(
    type: LocalStorageSyncTypes,
    dispatch: (dataForStore: any) => void,
    storage: Storage,
    sessionId: string,
    encrypted = false,
  ) {
    const key = LocalStorageService.makeKey(sessionId, type);
    try {
      const fromStorage = storage.getItem(key);
      if (!fromStorage) {
        // Could be first load using the new local storage process... or content has been cleared
        return;
      }
      const strValue = encrypted ? LocalStorageService.decrypt(fromStorage) : fromStorage;
      dispatch(JSON.parse(strValue));
    } catch (e) {
      console.warn(`Failed to parse user settings with key '${key}' from session storage, consider clearing manually`, e);
    }
  }

  /**
   * This will ensure changes in the store are selectively pushed to local storage
   */
  public static storeToLocalStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
    // This is done to ensure we don't accidentally apply state from session storage from another user.
    let globalUserId: string | null = null;
    return localStorageSync({
      // Decide the key to store each section by
      storageKeySerializer: (storeKey: LocalStorageSyncTypes) => LocalStorageService.makeKey(globalUserId, storeKey),
      syncCondition: () => {
        if (globalUserId) {
          return true;
        }
        const userId = LocalStorageService.getLocalStorageSessionId();
        if (userId) {
          globalUserId = userId;
          return true;
        }
        return false;
      },
      keys: [
        // DASHBOARD is signal-native (DashboardDataService) — it owns its
        // own write path; the metaReducer no longer mirrors it.
        LocalStorageSyncTypes.LISTS,
        {
          [LocalStorageSyncTypes.PAGINATION]: {
            serialize: (pagination: PaginationState) => LocalStorageService.parseStorePartForLocalStorage<PaginationState>(
              pagination,
              LocalStorageSyncTypes.PAGINATION
            ),
          },
        },
      ],
      // Don't push local storage state into store on start up... we need the logged in user's id before we can do that
      rehydrate: false,

    })(reducer);
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

  /**
   *  Allow for selective persistence of data. For pagination we only store params and clientPagination
   */
  private static parseStorePartForLocalStorage<T = any>(storePart: T, type: LocalStorageSyncTypes): object {
    switch (type) {
      case LocalStorageSyncTypes.PAGINATION: {
        const pagination: PaginationState = storePart as unknown as PaginationState;
        const paginationWithIndex = pagination as Record<string, any>;
        // Convert each pagination section that we care about into an object with only the properties we care about
        // For each entity type....
        const abs = Object.keys(paginationWithIndex).reduce((res, entityTypes) => {
          // For each pagination section of the entity type...
          const perEntity = Object.keys(paginationWithIndex[entityTypes]).reduce((res2, paginationKeysOfEntityType) => {
            const paginationSection = paginationWithIndex[entityTypes][paginationKeysOfEntityType];
            // Only store pagination section for lists
            if (!paginationSection.isListPagination) {
              return res2;
            }
            res2[paginationKeysOfEntityType] = {
              params: paginationSection.params,
              clientPagination: paginationSection.clientPagination,
              isListPagination: paginationSection.isListPagination, // We do not persist any that are false
              forcedLocalPage: paginationSection.forcedLocalPage // Value of the multi-entity filter
            };
            return res2;
          }, {} as Record<string, any>);

          // If this entity type has pagination section that we've cared about store it, else ignore
          if (Object.keys(perEntity).length > 0) {
            res[entityTypes] = perEntity;
          }
          return res;
        }, {} as Record<string, any>);
        return LocalStorageService.encrypt(abs);
      }
    }
    return LocalStorageService.encrypt(storePart);
  }

  public static localStorageSize(sessionData: SessionData): number {
    const storage = LocalStorageService.getStorage();
    const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user.name);
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
      const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user.name);
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
    const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user.name);
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

  private static encrypt(obj: {}) {
    if (LocalStorageService.Encrypt) {
      const strObj = JSON.stringify(obj);
      return btoa(strObj);
    }
    return obj;
  }

  private static decrypt(strObj: string): string {
    if (LocalStorageService.Encrypt) {
      return atob(strObj);
    }
    return strObj;
  }
}
