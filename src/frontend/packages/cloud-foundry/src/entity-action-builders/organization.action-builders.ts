import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  DeleteOrganization,
  GetAllOrganizations,
  GetOrganization,
  UpdateOrganization,
} from '../actions/organization.actions';
import type { IUpdateOrganization } from '../cf-api.types';
import type { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface OrganizationActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetOrganization;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAllOrganizations;
  remove: (guid: string, endpointGuid: string) => DeleteOrganization;
  update: (guid: string, endpointGuid: string, updatedOrg?: IUpdateOrganization) => UpdateOrganization;
}

export const organizationActionBuilders: OrganizationActionBuilders = {
  get: (
    guid,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetOrganization(guid, endpointGuid, includeRelations, populateMissing),
  getMultiple: (
    endpointGuid: string,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllOrganizations(paginationKey, endpointGuid, includeRelations, populateMissing),
  remove: (guid: string, endpointGuid: string) => new DeleteOrganization(guid, endpointGuid),
  update: (guid: string, endpointGuid: string, updatedOrg: IUpdateOrganization) => new UpdateOrganization(
    guid,
    endpointGuid,
    updatedOrg
  )
};
