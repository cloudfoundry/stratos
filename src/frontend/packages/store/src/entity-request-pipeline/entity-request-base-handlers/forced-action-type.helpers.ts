import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginatedAction } from '../../types/pagination.types';
import { EntityRequestAction } from '../../types/request.types';

export function patchActionWithForcedConfig(action: EntityRequestAction) {
  const pagAction = action as PaginatedAction;
  if (pagAction.__forcedPageEntityConfig__) {
    const forced = pagAction.__forcedPageEntityConfig__;
    return {
      ...pagAction,
      // See https://github.com/cloudfoundry/stratos/commit/7c94858
      // Need a better way of doing this (when this isn't set multi action lists breaks)
      entity: entityCatalog.getEntity(forced).getSchema(forced.schemaKey),
      entityType: forced.entityType,
      endpointType: forced.endpointType,
      schemaKey: forced.schemaKey,
      subType: forced.subType,
    } as EntityRequestAction;
  }
  return action;
}
