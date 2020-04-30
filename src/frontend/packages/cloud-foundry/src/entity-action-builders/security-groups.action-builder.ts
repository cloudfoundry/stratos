import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchDomain } from '../actions/domains.actions';
import { GetAllSecurityGroups } from '../actions/security-groups-actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface SecurityGroupBuilders extends OrchestratedActionBuilders {
  get: (
    guid,
    endpointGuid
  ) => FetchDomain;
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, flatten }: CFBasePipelineRequestActionMeta
  ) => GetAllSecurityGroups;
}

export const securityGroupBuilders: SecurityGroupBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, flatten }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllSecurityGroups(endpointGuid, paginationKey, includeRelations, flatten)
};
