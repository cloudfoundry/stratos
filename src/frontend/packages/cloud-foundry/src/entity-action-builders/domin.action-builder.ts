import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllAppEvents } from '../actions/app-event.actions';
import { FetchDomain, FetchAllDomains } from '../actions/domains.actions';

export const domainActionBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  // TODO: This is good reason to remove pagination key
  getAll: (
    endpointGuid,
    paginationKey?,
    flatten?: boolean,
  ) => new FetchAllDomains(endpointGuid, flatten)
} as OrchestratedActionBuilders;


