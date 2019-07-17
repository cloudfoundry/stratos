import { GetAllFeatureFlags } from '../../../../../../../cloud-foundry/src/actions/feature-flags.actions';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';

export function createCfFeatureFlagFetchAction(cfGuid: string) {
  const paginationKey = createCFFeatureFlagPaginationKey(cfGuid);
  return new GetAllFeatureFlags(cfGuid, paginationKey);
}

export function createCFFeatureFlagPaginationKey(cfGuid: string) {
  return createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
}
