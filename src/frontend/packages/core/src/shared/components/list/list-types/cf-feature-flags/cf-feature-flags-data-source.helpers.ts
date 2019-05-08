import { GetAllFeatureFlags } from '../../../../../../../store/src/actions/feature-flags.actions';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';

export function createCfFeatureFlagFetchAction(cfGuid: string) {
  const paginationKey = createCFFeatureFlagPaginationKey(cfGuid);
  return new GetAllFeatureFlags(cfGuid, paginationKey);
}

export function createCFFeatureFlagPaginationKey(cfGuid: string) {
  return createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
}
