import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';
import { CreateSpace, DeleteSpace, GetAllSpaces, GetSpace, UpdateSpace } from '../actions/space.actions';
import { IUpdateSpace } from '../cf-api.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';
import { organizationEntityType, spaceEntityType, spaceWithOrgEntityType } from '../cf-entity-types';
import { createEntityRelationKey } from '../entity-relations/entity-relations.types';

export interface SpaceActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetSpace;
  getWithOrganization: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetSpace;
  remove: (
    guid: string,
    endpointGuid: string,
    { orgGuid }: { orgGuid: string }
  ) => DeleteSpace;
  create: (
    id: string,
    endpointGuid: string,
    { orgGuid, createSpace }: { orgGuid: string, createSpace: IUpdateSpace }
  ) => CreateSpace;
  update: (
    guid: string,
    endpointGuid: string,
    updatedSpace: IUpdateSpace
  ) => UpdateSpace;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetAllSpaces;
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetAllOrganizationSpaces;
}

export const spaceActionBuilders: SpaceActionBuilders = {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetSpace(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  getWithOrganization: (
    guid: string,
    endpointGuid: string,
    {
      includeRelations = [createEntityRelationKey(spaceEntityType, organizationEntityType)],
      populateMissing
    }: CFBasePipelineRequestActionMeta = {}
  ) => {
    const action = new GetSpace(
      guid,
      endpointGuid,
      includeRelations || [],
      populateMissing
    )
    action.entity = [cfEntityFactory(spaceWithOrgEntityType)];
    action.schemaKey = spaceWithOrgEntityType
    return action;
  },
  remove: (
    guid,
    endpointGuid,
    { orgGuid }: { orgGuid: string }
  ) => new DeleteSpace(
    guid,
    orgGuid,
    endpointGuid
  ),
  create: (
    id: string,
    endpointGuid: string,
    { orgGuid, createSpace }: { orgGuid: string, createSpace: IUpdateSpace }
  ) => new CreateSpace(
    endpointGuid,
    orgGuid,
    createSpace,
    id
  ),
  update: (
    guid: string,
    endpointGuid: string,
    updatedSpace: IUpdateSpace
  ) => new UpdateSpace(
    guid,
    endpointGuid,
    updatedSpace
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
