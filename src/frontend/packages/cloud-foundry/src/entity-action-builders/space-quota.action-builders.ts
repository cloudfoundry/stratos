import {
  QuotaFormValues,
} from '../../../core/src/features/cloud-foundry/quota-definition-form/quota-definition-form.component';
import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  AssociateSpaceQuota,
  CreateSpaceQuotaDefinition,
  DisassociateSpaceQuota,
  GetOrganizationSpaceQuotaDefinitions,
  UpdateSpaceQuotaDefinition,
} from '../actions/quota-definitions.actions';

export interface SpaceQuotaDefinitionActionBuilders extends OrchestratedActionBuilders {
  create: (
    id: string,
    endpointGuid: string,
    args: {
      orgGuid: string
      createQuota: QuotaFormValues
    },
  ) => CreateSpaceQuotaDefinition;
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota: QuotaFormValues
  ) => UpdateSpaceQuotaDefinition;
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => GetOrganizationSpaceQuotaDefinitions;
  associateWithSpace: (
    spaceGuid: string,
    endpointGuid: string,
    spaceQuotaGuid: string
  ) => AssociateSpaceQuota;
  disassociateFromSpace: (
    spaceGuid: string,
    endpointGuid: string,
    spaceQuotaGuid: string
  ) => DisassociateSpaceQuota;
}

export const spaceQuotaDefinitionActionBuilders: SpaceQuotaDefinitionActionBuilders = {
  create: (
    id: string,
    endpointGuid: string,
    args: {
      orgGuid: string
      createQuota: QuotaFormValues
    }
  ) => new CreateSpaceQuotaDefinition(id, endpointGuid, args.orgGuid, args.createQuota),
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota: QuotaFormValues
  ) => new UpdateSpaceQuotaDefinition(guid, endpointGuid, updateQuota),
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
};
