import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrganizations, DeleteOrganization, UpdateOrganization, GetOrganization } from '../actions/organization.actions';
import { IUpdateOrganization } from '../../../core/src/core/cf-api.types';

export const organizationActionBuilders = {
  get: (
    guid,
    endpointGuid,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetOrganization(guid, endpointGuid, includeRelations, populateMissing),
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetAllOrganizations(paginationKey, endpointGuid, includeRelations, populateMissing),
  remove: (guid, endpointGuid) => new DeleteOrganization(guid, endpointGuid),
  update: (guid, endpointGuid, updatedOrg: IUpdateOrganization) => new UpdateOrganization(
    guid,
    endpointGuid,
    updatedOrg
  )
} as OrchestratedActionBuilders;
