import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllOrganizations, DeleteOrganization, UpdateOrganization, GetOrganization } from '../actions/organization.actions';
import { IUpdateOrganization } from '../../../core/src/core/cf-api.types';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export const organizationActionBuilders = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetOrganization(guid, endpointGuid, includeRelations, populateMissing),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllOrganizations(paginationKey, endpointGuid, includeRelations, populateMissing),
  remove: (guid, endpointGuid) => new DeleteOrganization(guid, endpointGuid),
  update: (guid, endpointGuid, updatedOrg: IUpdateOrganization) => new UpdateOrganization(
    guid,
    endpointGuid,
    updatedOrg
  )
} as OrchestratedActionBuilders;
