import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';
import { DeleteSpace, GetAllSpaces } from '../actions/space.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface SpaceActionBuilders extends OrchestratedActionBuilders {
  remove: (
    guid: string,
    endpointGuid: string,
    { orgGuid }: { orgGuid: string, }
  ) => DeleteSpace;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetAllSpaces;
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetAllOrganizationSpaces;
}

export const spaceActionBuilders: SpaceActionBuilders = {
  remove: (
    guid,
    endpointGuid: string,
    { orgGuid }: { orgGuid: string, }
  ) => new DeleteSpace(
    guid,
    orgGuid,
    endpointGuid
  ),
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllSpaces(
    paginationKey,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllOrganizationSpaces(paginationKey, orgGuid, endpointGuid, includeRelations, populateMissing)
};
