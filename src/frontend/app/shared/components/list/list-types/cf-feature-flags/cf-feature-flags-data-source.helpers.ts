import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { GetAllFeatureFlags } from '../../../../../store/actions/feature-flags.actions';
import { endpointSchemaKey } from '../../../../../store/helpers/entity-factory';

export function createCfFeatureFlagFetchAction(cfGuid: string) {
  const paginationKey = createCFFeatureFlagPaginationKey(cfGuid);
  return new GetAllFeatureFlags(cfGuid, paginationKey);
}

export function createCFFeatureFlagPaginationKey(cfGuid: string) {
  return createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
}
