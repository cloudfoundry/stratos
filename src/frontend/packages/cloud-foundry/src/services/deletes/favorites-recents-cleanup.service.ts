import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { RemoveRecentEntityAction, RemoveUserFavoriteAction, UserFavorite } from '@stratosui/store';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import type { DeleteCleanupHook, DeleteRequest } from './delete-event.types';

// Restores the favorites + recents cleanup the ngrx→signal delete migration
// silently dropped. When a CF entity is deleted, the legacy ngrx delete
// pipeline dispatched EntityDeleteCompleteAction, which the favorites and
// recents reducers consumed to drop references to the gone entity. The
// signal-native delete path never dispatched it, so favorites stranded on the
// Home page (the reproduced bug) and recents kept dead deep-links.
//
// This hook rebuilds the same UserFavorite identity (guid = entityId +
// endpointId + entityType + endpointType) the favorite/recent were stored
// under and dispatches the existing remove actions. Favorites are still ngrx
// today; when the favorites/roles island migrates to signals this becomes a
// direct signal call (see island-currentuserroles-favorites-design).
@Injectable({ providedIn: 'root' })
export class FavoritesRecentsDeleteCleanup {
  private readonly store = inject(Store);

  /** Bound so it can be registered directly as a DeleteCleanupHook. */
  readonly hook: DeleteCleanupHook = (req: DeleteRequest): void => {
    // entityKind matches the favorite entityType for favoritable CF entities
    // (organization/space/application); non-favoritable kinds (route, binding…)
    // simply have no matching favorite/recent and the removes no-op.
    const favorite = new UserFavorite(req.cnsiGuid, CF_ENDPOINT_TYPE, req.entityKind, req.deleteGuid);
    this.store.dispatch(new RemoveUserFavoriteAction(favorite));
    this.store.dispatch(new RemoveRecentEntityAction(favorite.guid));
  };
}
