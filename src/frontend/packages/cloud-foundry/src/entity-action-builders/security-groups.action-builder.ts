import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { FetchDomain } from '../actions/domains.actions';
import { GetAllSecurityGroups } from '../actions/security-groups-actions';

export const securityGroupBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  // TODO: This is good reason to remove pagination key
  getAll: (
    endpointGuid,
    paginationKey?,
    includeRelations?: string[]
  ) => new GetAllSecurityGroups(endpointGuid, paginationKey, includeRelations)
} as OrchestratedActionBuilders;


