import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { RemoveRecentEntityAction } from '../actions/recently-visited.actions';
import { RemoveUserFavoriteAction } from '../actions/user-favourites.actions';
import { UserFavorite } from '../types/user-favorites.types';

// Shared favorites/recents cleanup for entity deletes. When any entity is
// deleted its favorite star and recently-visited entry must be dropped, or the
// Home page strands a favorite and recents keep dead deep-links.
//
// The favorites/recents stores are still ngrx (the favorites/roles island has
// not migrated to signals yet — see island-currentuserroles-favorites-design),
// so removal still goes through RemoveUserFavoriteAction / RemoveRecentEntityAction.
// Encapsulating that dispatch HERE — in the store package, alongside the stores
// it touches — lets signal-native delete callers (CF's delete controller hook,
// the kube resource delete) invoke a plain method and stay @ngrx-free
// themselves. When the favorites island migrates, only this method changes.
@Injectable({ providedIn: 'root' })
export class EntityDeleteCleanupService {
  private readonly store = inject(Store);

  // Rebuild the UserFavorite identity the favorite/recent were stored under
  // (guid = entityId + endpointId + entityType + endpointType) and remove both.
  // Non-favoritable entity types simply have no matching favorite/recent, so
  // the removes no-op.
  removeFavoriteAndRecent(
    endpointGuid: string,
    endpointType: string,
    entityType: string,
    entityGuid: string,
  ): void {
    const favorite = new UserFavorite(endpointGuid, endpointType, entityType, entityGuid);
    this.store.dispatch(new RemoveUserFavoriteAction(favorite));
    this.store.dispatch(new RemoveRecentEntityAction(favorite.guid));
  }
}
