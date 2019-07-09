import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrgUsers } from '../actions/organization.actions';
import { GetAllSpaceUsers } from '../actions/space.actions';
import { GetAllUsersAsAdmin, GetUser } from '../actions/users.actions';

export const userActionBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new GetUser(guid, endpointGuid),
  // Must be admin user for this to succeed.
  getAll: (
    paginationKey: string,
    endpointGuid: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetAllUsersAsAdmin(endpointGuid, includeRelations, populateMissing, paginationKey),
  getAllInOrganization: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => new GetAllOrgUsers(guid, paginationKey, endpointGuid, isAdmin, includeRelations),
  getAllInSpace: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => new GetAllSpaceUsers(guid, paginationKey, endpointGuid, isAdmin, includeRelations),

} as OrchestratedActionBuilders;
