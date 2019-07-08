import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrgUsers, DeleteOrganization, UpdateOrganization } from '../actions/organization.actions';
import { IUpdateOrganization } from '../../../core/src/core/cf-api.types';

export const userActionBuilders = {
  getAllFromOrg: (
    guid: string,
    endpointGuid: string,
    paginationKey: string,
    isAdmin: boolean,
    includeRelations?: string[]
  ) => new GetAllOrgUsers(guid, paginationKey, endpointGuid, isAdmin, includeRelations),
} as OrchestratedActionBuilders;
