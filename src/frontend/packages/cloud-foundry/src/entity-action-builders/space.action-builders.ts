import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';

export const spaceActionBuilders = {
  getAllFromOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: any[],
    populateMissing?: boolean
  ) => new GetAllOrganizationSpaces(paginationKey, orgGuid, endpointGuid, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
