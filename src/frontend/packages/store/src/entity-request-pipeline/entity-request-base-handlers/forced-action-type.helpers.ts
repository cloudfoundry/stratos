import { PaginatedAction } from '../../types/pagination.types';
import { EntityRequestAction } from '../../types/request.types';

export function patchActionWithForcedConfig(action: EntityRequestAction) {
  const pagAction = action as PaginatedAction;
  if (pagAction.__forcedPageEntityConfig__) {
    const forced = pagAction.__forcedPageEntityConfig__;
    return {
      ...pagAction,
      entity: null,
      entityType: forced.entityType,
      endpointType: forced.endpointType,
      schemaKey: forced.schemaKey,
      subType: forced.subType,
    } as EntityRequestAction;
  }
  return action;
}
