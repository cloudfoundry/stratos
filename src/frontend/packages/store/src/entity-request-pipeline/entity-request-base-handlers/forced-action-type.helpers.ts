import { entityCatalog } from '../../entity-catalog/entity-catalog';
import type { PaginatedAction } from '../../types/pagination.types';
import type { EntityRequestAction } from '../../types/request.types';

export function patchActionWithForcedConfig(action: EntityRequestAction) {
  const pagAction = action as PaginatedAction;
  if (pagAction.__forcedPageEntityConfig__) {
    const forced = pagAction.__forcedPageEntityConfig__;
    const catalogEntity = entityCatalog.getEntity(forced);
    if (!catalogEntity) {
      throw new Error(
        `Cannot find catalog entity for endpoint '${forced.endpointType}' and entity '${forced.entityType}'`
      );
    }
    return {
      ...pagAction,
      // See https://github.com/cloudfoundry/stratos/commit/7c94858
      // Need a better way of doing this (when this isn't set multi action lists breaks)
      entity: catalogEntity.getSchema(forced.schemaKey),
      entityType: forced.entityType,
      endpointType: forced.endpointType,
      schemaKey: forced.schemaKey,
      subType: forced.subType,
    } as EntityRequestAction;
  }
  return action;
}
