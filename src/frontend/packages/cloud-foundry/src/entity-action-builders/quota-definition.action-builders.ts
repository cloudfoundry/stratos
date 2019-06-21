import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import {
  GetOrganizationSpaceQuotaDefinitions,
  GetQuotaDefinitions,
  AssociateSpaceQuota,
  DisassociateSpaceQuota
} from '../actions/quota-definitions.actions';

export class QuotaDefinitionActionBuilder extends OrchestratedActionBuilders {
  getAll = (
    paginationKey: string,
    endpointGuid: string,
    includeRelations = [],
    populateMissing = false
  ) => new GetQuotaDefinitions(paginationKey, endpointGuid, includeRelations, populateMissing);
  associateSpaceQuota = (
    spaceGuid: string,
    endpointGuid: string,
    spaceQuotaGuid: string
  ) => new AssociateSpaceQuota(spaceGuid, endpointGuid, spaceQuotaGuid);
  disassociateSpaceQuota = (
    spaceGuid: string,
    endpointGuid: string,
    spaceQuotaGuid: string
  ) => new DisassociateSpaceQuota(spaceGuid, endpointGuid, spaceQuotaGuid),
  getOrganizationSpaceQuotaDefinitions = (
    paginationKey: string,
    orgGuid: string,
    endpointGuid: string,
    includeRelations: string[] = [],
    populateMissing = true
  ) => new GetOrganizationSpaceQuotaDefinitions(paginationKey, orgGuid, endpointGuid, includeRelations, populateMissing)
}
export const quotaDefinitionActionBuilder = new QuotaDefinitionActionBuilder();


