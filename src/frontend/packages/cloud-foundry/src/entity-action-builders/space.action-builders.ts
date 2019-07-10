import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';
import { GetSpace, GetAllSpaces, DeleteSpace, CreateSpace, UpdateSpace } from '../actions/space.actions';
import { IUpdateSpace } from '../../../core/src/core/cf-api.types';

export const spaceActionBuilders = {
  get: (
    guid: string,
    endpointGuid: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetSpace(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  remove: (
    guid,
    endpointGuid,
    orgGuid
  ) => new DeleteSpace(
    guid,
    orgGuid,
    endpointGuid
  ),
  create: (
    id: string,
    endpointGuid: string,
    orgGuid: string,
    createSpace: IUpdateSpace
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
  getAll: (
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean
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
    includeRelations?: any[],
    populateMissing?: boolean
  ) => new GetAllOrganizationSpaces(paginationKey, orgGuid, endpointGuid, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
