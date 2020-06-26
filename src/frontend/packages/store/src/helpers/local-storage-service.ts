import { Store } from '@ngrx/store';

import { HydrateDashboardStateAction } from '../actions/dashboard-actions';
import { HydrateListsStateAction } from '../actions/list.actions';
import { HydratePaginationStateAction } from '../actions/pagination.actions';
import { DispatchOnlyAppState } from '../app-state';
import { SessionData } from '../types/auth.types';
import { PaginationState } from '../types/pagination.types';
import { getDashboardStateSessionId } from './store-helpers';

export enum LocalStorageSyncTypes {
  DASHBOARD = 'dashboard',
  PAGINATION = 'pagination',
  LISTS = 'lists',
}
export class LocalStorageService {

  // TODO: RC applying filters that aren't in lists
  // TODO: RC applying cf filter works, but not org/space
  // TODO: RC cleaning sessions storage (entities that don't exist, etc, can be done by storeagesync??)
  // TODO: RC backward compatible (load 'user-dashboard' into 'user')
  // TODO: RC todos!
  /**
   *  Allow for selective persistence of data
   */
  public static parseForStorage<T = any>(storePart: T, type: LocalStorageSyncTypes): Object {
    // TODO: RC Tidy
    switch (type) {
      case LocalStorageSyncTypes.PAGINATION:
        const pagination: PaginationState = storePart as unknown as PaginationState;
        const abs = Object.keys(pagination).reduce((res, entityTypes) => {
          const perEntity = Object.keys(pagination[entityTypes]).reduce((res2, paginationKeysOfEntityType) => {
            const paginationSection = pagination[entityTypes][paginationKeysOfEntityType]
            res2[paginationKeysOfEntityType] = {
              params: paginationSection.params,
              clientPagination: paginationSection.clientPagination
            }
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
  public static storageToStore(store: Store<DispatchOnlyAppState>, sessionData: SessionData) {
    return LocalStorageService.rehydrateDashboardState(store, sessionData);
  }

  private static rehydrateDashboardState(store: Store<DispatchOnlyAppState>, sessionData: SessionData) {
    const storage = localStorage || window.localStorage;
    // We use the username to key the session storage. We could replace this with the users id?
    if (storage && sessionData.user) {
      const sessionId = getDashboardStateSessionId(sessionData.user.name);
      if (sessionId) {
        LocalStorageService.handleHydrate(
          LocalStorageSyncTypes.DASHBOARD,
          data => store.dispatch(new HydrateDashboardStateAction(data)),
          storage,
          sessionId
        )
        LocalStorageService.handleHydrate(
          LocalStorageSyncTypes.PAGINATION,
          data => store.dispatch(new HydratePaginationStateAction(data)),
          storage,
          sessionId
        )
        LocalStorageService.handleHydrate(
          LocalStorageSyncTypes.LISTS,
          data => store.dispatch(new HydrateListsStateAction(data)),
          storage,
          sessionId
        )
      }
    }
  }

  private static handleHydrate(
    type: LocalStorageSyncTypes,
    dispatch: (data: any) => void,
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

  public static makeKey(userId: string, storeKey: string) {
    return userId + '-' + storeKey
  }
}