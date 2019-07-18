import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { FetchAllDomains, FetchDomain } from '../actions/domains.actions';

export const domainActionBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  getAll: (
    endpointGuid,
    paginationKey?,
    flatten?: boolean,
  ) => new FetchAllDomains(endpointGuid, paginationKey, flatten)
} as OrchestratedActionBuilders;


