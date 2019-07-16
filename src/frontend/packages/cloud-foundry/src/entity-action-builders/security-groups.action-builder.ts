import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { FetchDomain } from '../actions/domains.actions';
import { GetAllSecurityGroups } from '../actions/security-groups-actions';

export const securityGroupBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations?: string[],
    flatten?: boolean,
  ) => new GetAllSecurityGroups(endpointGuid, paginationKey, includeRelations, flatten)
} as OrchestratedActionBuilders;


