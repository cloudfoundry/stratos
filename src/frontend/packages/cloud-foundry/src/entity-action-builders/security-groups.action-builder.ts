import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllSecurityGroups } from '../actions/security-groups-actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface SecurityGroupBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, flatten }: CFBasePipelineRequestActionMeta
  ) => GetAllSecurityGroups;
}

export const securityGroupBuilders: SecurityGroupBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, flatten }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllSecurityGroups(endpointGuid, paginationKey, includeRelations, flatten)
};
