import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetServiceInstances } from '../actions/service-instances.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ServiceInstanceActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetServiceInstances;
}

export const serviceInstanceActionBuilders: ServiceInstanceActionBuilders = {
  getMultiple: (
    endpointGuid: string,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceInstances(endpointGuid, paginationKey, includeRelations, populateMissing)
};
