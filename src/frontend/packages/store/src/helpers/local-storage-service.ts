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

  // TODO: RC cleaning sessions storage (entities that don't exist, etc, can be done by storeagesync??)
  // TODO: RC backward compatible (load 'user-dashboard' into 'user')
  // TODO: RC todos!
  // TODO: RC load junk settings
  // TODO: RC encode/decode username in storage key
  // TODO: RC test deploy app

  /**
   * Normally used on app init, move local storage data into the console's store
   */
  public static storageToStore(store: Store<DispatchOnlyAppState>, sessionData: SessionData) {
    return LocalStorageService.rehydrateDashboardState(store, sessionData);
  }

  /**
   * For the current user dispatch actions that will populate the store with the contents of local storage
   */
  private static rehydrateDashboardState(store: Store<DispatchOnlyAppState>, sessionData: SessionData) {
    const storage = LocalStorageService.getStorage();
    // We use the username to key the session storage. We could replace this with the users id?
    if (storage && sessionData.user) {
      const sessionId = LocalStorageService.getDashboardStateSessionId(sessionData.user.name);
      if (sessionId) {
        LocalStorageService.handleHydrate(
          LocalStorageSyncTypes.DASHBOARD,
          dataForStore => store.dispatch(new HydrateDashboardStateAction(dataForStore)),
          storage,
          sessionId
        );
        LocalStorageService.handleHydrate(
          LocalStorageSyncTypes.PAGINATION,
          dataForStore => store.dispatch(new HydratePaginationStateAction(dataForStore)),
          storage,
          sessionId
        );
        LocalStorageService.handleHydrate(
          LocalStorageSyncTypes.LISTS,
          dataForStore => store.dispatch(new HydrateListsStateAction(dataForStore)),
          storage,
          sessionId
        );
      }
    }
  }

  private static getStorage(): Storage {
    return localStorage || window.localStorage;
  }

  /**
   * For a given storage type fetch it's data for the given user from local storage and dispatch an action that will
   * be handled by the reducers for that storage type (dashboard, pagination, etc)
   */
  private static handleHydrate(
    type: LocalStorageSyncTypes,
    dispatch: (dataForStore: any) => void,
    storage: Storage,
    sessionId: string
  ) {
    const key = LocalStorageService.makeKey(sessionId, type);
    try {
      dispatch(JSON.parse(storage.getItem(key)));
    } catch (e) {
      console.warn(`Failed to parse user settings with key '${key}' from session storage, consider clearing manually`, e);
    }
  }

  private static makeKey(userId: string, storeKey: string) {
    return userId + '-' + storeKey;
  }

  /**
   * This will ensure changes in the store are selectively pushed to local storage
   */
  public static localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
    // This is done to ensure we don't accidentally apply state from session storage from another user.
    let globalUserId = null;
    return localStorageSync({
      // Decide the key to store each section by
      storageKeySerializer: (storeKey: LocalStorageSyncTypes) => LocalStorageService.makeKey(globalUserId, storeKey),
      syncCondition: () => {
        if (globalUserId) {
          return true;
        }
        const userId = LocalStorageService.getDashboardStateSessionId();
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
            serialize: (pagination: PaginationState) => LocalStorageService.parseForStorage<PaginationState>(
              pagination,
              LocalStorageSyncTypes.PAGINATION
            ),
          }
        },
        // encrypt: // TODO: RC only store guids, so shouldn't need
        // decrypt: // TODO: RC
      ],
      // Don't push local storage state into store on start up... we need the logged in user's id before we can do that
      rehydrate: false,

    })(reducer);
  }

  private static getDashboardStateSessionId(username?: string) {
    // TODO: RC name should be encoded
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
  private static parseForStorage<T = any>(storePart: T, type: LocalStorageSyncTypes): Object {
    // TODO: RC Tidy
    switch (type) {
      case LocalStorageSyncTypes.PAGINATION:
        const pagination: PaginationState = storePart as unknown as PaginationState;
        const abs = Object.keys(pagination).reduce((res, entityTypes) => {
          const perEntity = Object.keys(pagination[entityTypes]).reduce((res2, paginationKeysOfEntityType) => {
            const paginationSection = pagination[entityTypes][paginationKeysOfEntityType];
            if (!paginationSection.isListPagination) {
              return res2;
            }
            res2[paginationKeysOfEntityType] = {
              params: paginationSection.params,
              clientPagination: paginationSection.clientPagination,
              isListPagination: paginationSection.isListPagination
            };
            return res2;
          }, {});
          if (Object.keys(perEntity).length > 0) {
            res[entityTypes] = perEntity;
          }
          return res;
        }, {});
        return abs;
    }
    return storePart;
  }

  public static localStorageSize(sessionData: SessionData): number {
    const storage = LocalStorageService.getStorage();
    const sessionId = LocalStorageService.getDashboardStateSessionId(sessionData.user.name);
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
  public static clear(sessionData: SessionData, confirmationService: ConfirmationDialogService, reloadTo = '/user-profile') {
    const config: ConfirmationDialogConfig = {
      message: 'This will clear your settings in local storage for this address and reload this window',
      confirm: 'Clear',
      critical: true,
      title: 'Are you sure?'
    };

    const successAction = res => {
      if (!res) {
        return;
      }

      const storage = LocalStorageService.getStorage();
      const sessionId = LocalStorageService.getDashboardStateSessionId(sessionData.user.name);
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
}
