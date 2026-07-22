import { inject, Injectable } from '@angular/core';

import { UserFavorite } from '../types/user-favorites.types';
import { RecentlyVisitedDataService } from './recently-visited-data.service';
import { UserFavoritesDataService } from './user-favorites-data.service';

// Shared favorites/recents cleanup for entity deletes. When any entity is
// deleted its favorite star and recently-visited entry must be dropped, or the
// Home page strands a favorite and recents keep dead deep-links.
//
// Encapsulating that cleanup HERE — in the store package, alongside the stores
// it touches — lets signal-native delete callers (CF's delete controller hook,
// the kube resource delete) invoke a plain method and stay @ngrx-free
// themselves. Both halves are now signal-native:
//   - recents  → RecentlyVisitedDataService (favorites/roles island Wave 1)
//   - favorites → UserFavoritesDataService    (favorites/roles island Wave 3)
@Injectable({ providedIn: 'root' })
export class EntityDeleteCleanupService {
  private readonly recents = inject(RecentlyVisitedDataService);
  private readonly favorites = inject(UserFavoritesDataService);

  // Rebuild the UserFavorite identity the favorite/recent were stored under
  // (guid = entityId + endpointId + entityType + endpointType) and remove both.
  // Non-favoritable entity types simply have no matching favorite/recent, so
  // the removes no-op (and the favorite remove issues no HTTP when absent).
  removeFavoriteAndRecent(
    endpointGuid: string,
    endpointType: string,
    entityType: string,
    entityGuid: string,
  ): void {
    const favorite = new UserFavorite(endpointGuid, endpointType, entityType, entityGuid);
    this.favorites.removeForDeletedEntity(favorite.guid);
    this.recents.removeForDeletedEntity(favorite.guid);
  }
}
