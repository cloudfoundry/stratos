import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { FetchAllDomains, FetchDomain } from '../actions/domains.actions';

export const domainActionBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  // FIXME: Remove pagination key from get all requests. This might need some investigation regarding places where we use different keys
  // for lists of same type - #STRAT-149
  getAll: (
    endpointGuid,
    paginationKey?,
    flatten?: boolean,
  ) => new FetchAllDomains(endpointGuid, paginationKey, flatten)
} as OrchestratedActionBuilders;


