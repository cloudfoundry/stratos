import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { featureFlagEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';

export function createCfFeatureFlagFetchAction(cfGuid: string) {
  const paginationKey = createCFFeatureFlagPaginationKey(cfGuid);
  const featureFlagEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, featureFlagEntityType);
  const actionBuilder = featureFlagEntity.actionOrchestrator.getActionBuilder('getMultiple');
  const action = actionBuilder(cfGuid, paginationKey) as PaginatedAction;
  return action;
}

export function createCFFeatureFlagPaginationKey(cfGuid: string) {
  return createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
}
