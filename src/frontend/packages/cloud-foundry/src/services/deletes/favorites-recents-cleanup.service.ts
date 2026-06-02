import { inject, Injectable } from '@angular/core';
import { EntityDeleteCleanupService } from '@stratosui/store';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import type { DeleteCleanupHook, DeleteRequest } from './delete-event.types';

// Restores the favorites + recents cleanup the ngrx→signal delete migration
// silently dropped. When a CF entity is deleted, the legacy ngrx delete
// pipeline dispatched EntityDeleteCompleteAction, which the favorites and
// recents reducers consumed to drop references to the gone entity. The
// signal-native delete path never dispatched it, so favorites stranded on the
// Home page (the reproduced bug) and recents kept dead deep-links.
//
// Delegates to the shared EntityDeleteCleanupService (store package), which
// owns the now signal-native favorites/recents removal — so this CF hook and
// the kube resource delete share one cleanup path.
@Injectable({ providedIn: 'root' })
export class FavoritesRecentsDeleteCleanup {
  private readonly cleanup = inject(EntityDeleteCleanupService);

  /** Bound so it can be registered directly as a DeleteCleanupHook. */
  readonly hook: DeleteCleanupHook = (req: DeleteRequest): void => {
    // entityKind matches the favorite entityType for favoritable CF entities
    // (organization/space/application); non-favoritable kinds (route, binding…)
    // simply have no matching favorite/recent and the removes no-op.
    this.cleanup.removeFavoriteAndRecent(req.cnsiGuid, CF_ENDPOINT_TYPE, req.entityKind, req.deleteGuid);
  };
}
