import { ActionReducer, Store } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';

import { ConfirmationDialogConfig } from '../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../core/src/shared/components/confirmation-dialog.service';
import { HydrateDashboardStateAction } from '../actions/dashboard-actions';
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
  private static makeKey(userId: string, storeKey: LocalStorageSyncTypes) {
    if (storeKey === LocalStorageSyncTypes.DASHBOARD) {
      // Legacy support for when we only stored dashboard
      return userId;
    }
    return userId + '-' + storeKey;
  }

  /**
   * Normally used on app init, move local storage data into the console's store
   */
  public static localStorageToStore(store: Store<DispatchOnlyAppState>, sessionData: SessionData) {
    const storage = LocalStorageService.getStorage();
    // We use the username to key the session storage. We could replace this with the users id?
    if (storage && sessionData.user) {
      const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user.name);
      if (sessionId) {
        LocalStorageService.localStorageToStoreSection(
          LocalStorageSyncTypes.DASHBOARD,
          dataForStore => store.dispatch(new HydrateDashboardStateAction(dataForStore)),
          storage,
          sessionId
        );
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
    let globalUserId = null;
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
        LocalStorageSyncTypes.DASHBOARD,
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
      case LocalStorageSyncTypes.PAGINATION:
        const pagination: PaginationState = storePart as unknown as PaginationState;
        // Convert each pagination section that we care about into an object with only the properties we care about
        // For each entity type....
        const abs = Object.keys(pagination).reduce((res, entityTypes) => {
          // For each pagination section of the entity type...
          const perEntity = Object.keys(pagination[entityTypes]).reduce((res2, paginationKeysOfEntityType) => {
            const paginationSection = pagination[entityTypes][paginationKeysOfEntityType];
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
          }, {});

          // If this entity type has pagination section that we've cared about store it, else ignore
          if (Object.keys(perEntity).length > 0) {
            res[entityTypes] = perEntity;
          }
          return res;
        }, {});
        return LocalStorageService.encrypt(abs);
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
        return total + content.length;
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

    const successAction = res => {
      if (!res) {
        return;
      }

      const storage = LocalStorageService.getStorage();
      const sessionId = LocalStorageService.getLocalStorageSessionId(sessionData.user.name);
      if (storage && sessionId) {
        Object.values(LocalStorageSyncTypes).forEach(type => {
          const key = LocalStorageService.makeKey(sessionId, type);
          storage.removeItem(key);
        }, 0);

        // This is a brutal approach but is a lot easier than reverting all user changes in the store
        window.location.assign(reloadTo);
      } else {
        console.warn('Unable to clear local storage, either storage or session id is missing');
      }
    };

    confirmationService.openWithCancel(config, successAction, () => { });
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
