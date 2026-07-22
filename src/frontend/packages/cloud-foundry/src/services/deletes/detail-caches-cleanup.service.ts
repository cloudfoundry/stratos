import { Injectable, inject } from '@angular/core';

import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { OrgDataRegistry } from '../endpoint-data/org-data.registry';
import { SpaceDataRegistry } from '../endpoint-data/space-data.registry';
import type { DeleteCleanupHook, DeleteRequest } from './delete-event.types';

/**
 * Keeps the sticky org/space *detail* caches consistent with deletes. The
 * delete controller's invalidation covers the per-CNSI EndpointDataService
 * slices only; OrgDataService/SpaceDataService instances are registry-cached
 * warm across navigation with no staleness mechanism, so without this hook
 * the org summary "Spaces" tile kept counting a deleted space (and a deleted
 * org/space's own detail cache lingered) until a hard reload. This restores
 * the parent-collection sync the legacy `updateOrganizationSpaceReducer`
 * applied on DELETE_SPACE_SUCCESS, as a delete-cleanup hook mirroring
 * {@link CfRolesDeleteCleanup}. The DeleteRequest doesn't carry the deleted
 * space's parent org, so the hook walks the endpoint's cached org details and
 * lets the per-instance patch no-op where the space isn't held.
 */
@Injectable({ providedIn: 'root' })
export class DetailCachesDeleteCleanup {
  private readonly orgRegistry = inject(OrgDataRegistry);
  private readonly spaceRegistry = inject(SpaceDataRegistry);

  /** Bound so it can be registered directly as a DeleteCleanupHook. */
  readonly hook: DeleteCleanupHook = (req: DeleteRequest): void => {
    if (req.entityKind === spaceEntityType) {
      for (const org of this.orgRegistry.peekByCnsi(req.cnsiGuid)) {
        org.applySpaceDeleted(req.deleteGuid);
      }
      this.spaceRegistry.evict(req.cnsiGuid, req.deleteGuid);
    } else if (req.entityKind === organizationEntityType) {
      this.orgRegistry.evict(req.cnsiGuid, req.deleteGuid);
    }
  };
}
