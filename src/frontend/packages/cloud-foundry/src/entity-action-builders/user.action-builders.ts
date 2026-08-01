import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllOrgUsers } from '../actions/organization.actions';

export interface UserActionBuilders extends OrchestratedActionBuilders {
  getAllInOrganization: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => GetAllOrgUsers;
}

export const userActionBuilders: UserActionBuilders = {
  getAllInOrganization: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => new GetAllOrgUsers(guid, paginationKey, endpointGuid, isAdmin, includeRelations),
};
