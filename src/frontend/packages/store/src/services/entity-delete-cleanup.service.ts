import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { RemoveUserFavoriteAction } from '../actions/user-favourites.actions';
import { UserFavorite } from '../types/user-favorites.types';
import { RecentlyVisitedDataService } from './recently-visited-data.service';

// Shared favorites/recents cleanup for entity deletes. When any entity is
// deleted its favorite star and recently-visited entry must be dropped, or the
// Home page strands a favorite and recents keep dead deep-links.
//
// Encapsulating that cleanup HERE — in the store package, alongside the stores
// it touches — lets signal-native delete callers (CF's delete controller hook,
// the kube resource delete) invoke a plain method and stay @ngrx-free
// themselves. As each island wave migrates, only this method changes:
//   - recents are signal-native (RecentlyVisitedDataService) — done.
//   - favorites are still ngrx (RemoveUserFavoriteAction) until the favorites
//     island wave migrates them.
@Injectable({ providedIn: 'root' })
export class EntityDeleteCleanupService {
  private readonly store = inject(Store);
  private readonly recents = inject(RecentlyVisitedDataService);

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
    this.recents.removeForDeletedEntity(favorite.guid);
  }
}
