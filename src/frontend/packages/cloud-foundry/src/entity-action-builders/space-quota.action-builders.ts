import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetOrganizationSpaceQuotaDefinitions, AssociateSpaceQuota, DisassociateSpaceQuota } from '../actions/quota-definitions.actions';

export const spaceQuotaDefinitionActionBuilders = {
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations: string[] = [],
    populateMissing = false,
  ) => new GetOrganizationSpaceQuotaDefinitions(
    paginationKey,
    orgGuid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  associateWithSpace: (
    spaceGuid: string,
    endpointGuid: string,
    spaceQuotaGuid: string
  ) => new AssociateSpaceQuota(
    spaceGuid,
    endpointGuid,
    spaceQuotaGuid
  ),
  disassociateFromSpace: (
    spaceGuid: string,
    endpointGuid: string,
    spaceQuotaGuid: string
  ) => new DisassociateSpaceQuota(
    spaceGuid,
    endpointGuid,
    spaceQuotaGuid
  )
} as OrchestratedActionBuilders;
