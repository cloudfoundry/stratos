import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { DeleteApplication, GetAllApplications } from '../actions/application.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ApplicationActionBuilders extends OrchestratedActionBuilders {
  remove: (guid: string, endpointGuid: string) => DeleteApplication;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetAllApplications;
}

export const applicationActionBuilder: ApplicationActionBuilders = {
  remove: (guid: string, endpointGuid: string) => new DeleteApplication(guid, endpointGuid),
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllApplications(paginationKey, endpointGuid, includeRelations, populateMissing)
};
