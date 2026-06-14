import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  DeleteOrganization,
  GetAllOrganizations,
  GetOrganization,
  UpdateOrganization,
} from '../actions/organization.actions';
import { IUpdateOrganization } from '../cf-api.types';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface OrganizationActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetOrganization;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetAllOrganizations;
  remove: (guid: string, endpointGuid: string) => DeleteOrganization;
  // updatedOrg optional only to stay assignable to the loose core builder
  // floor (extraArgs?); real dispatch always supplies it.
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
  update: (guid: string, endpointGuid: string, updatedOrg?: IUpdateOrganization) => new UpdateOrganization(
    guid,
    endpointGuid,
    // strict: updatedOrg optional only for floor-compatibility; the update
    // action is never dispatched without an organization payload.
    updatedOrg!
  )
};
