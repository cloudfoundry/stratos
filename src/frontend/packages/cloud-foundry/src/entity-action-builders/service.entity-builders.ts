import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllServices, GetService } from '../actions/service.actions';
import { GetAllServicesForSpace } from '../actions/space.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ServiceActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetService;
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetAllServices;
  getAllInSpace: (
    endpointGuid: string,
    paginationKey: string,
    spaceGuid: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => GetAllServicesForSpace;
}

export const serviceActionBuilders: ServiceActionBuilders = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetService(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllServices(paginationKey, endpointGuid, includeRelations, populateMissing),
  getAllInSpace: (
    endpointGuid: string,
    paginationKey: string,
    spaceGuid: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetAllServicesForSpace(paginationKey, endpointGuid, spaceGuid, includeRelations, populateMissing)
};
