import { Injectable, inject } from '@angular/core';

import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { CfCurrentUserRolesDataService } from '../cf-current-user-roles-data.service';
import type { DeleteCleanupHook, DeleteRequest } from './delete-event.types';

/**
 * Restores the connected user's role-cache cleanup that the ngrx→signal delete
 * migration silently dropped. The legacy ngrx delete pipeline dispatched
 * DELETE_ORGANIZATION_SUCCESS / DELETE_SPACE_SUCCESS, which
 * `currentCfUserRolesReducer` consumed to drop the deleted org/space from the
 * current user's role cache. The signal-native delete path never dispatched
 * them, so that cleanup went dead — restored here as a delete-cleanup hook
 * (favorites/roles island, Wave 2), mirroring {@link FavoritesRecentsDeleteCleanup}.
 */
@Injectable({ providedIn: 'root' })
export class CfRolesDeleteCleanup {
  private readonly cfRoles = inject(CfCurrentUserRolesDataService);

  /** Bound so it can be registered directly as a DeleteCleanupHook. */
  readonly hook: DeleteCleanupHook = (req: DeleteRequest): void => {
    if (req.entityKind === organizationEntityType) {
      this.cfRoles.removeOrg(req.cnsiGuid, req.deleteGuid);
    } else if (req.entityKind === spaceEntityType) {
      this.cfRoles.removeSpace(req.cnsiGuid, req.deleteGuid);
    }
  };
}
