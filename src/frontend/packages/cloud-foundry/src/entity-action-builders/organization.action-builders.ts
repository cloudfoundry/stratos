import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetOrganization } from '../actions/organization.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface OrganizationActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetOrganization;
}

export const organizationActionBuilders: OrganizationActionBuilders = {
  get: (
    guid,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetOrganization(guid, endpointGuid, includeRelations, populateMissing)
};
