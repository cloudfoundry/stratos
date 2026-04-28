import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import {
  DeleteUserProvidedInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
} from '../actions/user-provided-service.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';


export interface UserProvidedServiceActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetUserProvidedService;
  remove: (
    guid: string,
    endpointGuid: string,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => DeleteUserProvidedInstance;
  getMultiple: (
    paginationKey?: string,
    endpointGuid?: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAllUserProvidedServices;
  getAllInSpace: (
    endpointGuid: string,
    spaceGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => GetAllUserProvidedServices;
}

export const userProvidedServiceActionBuilder: UserProvidedServiceActionBuilder = {
  get: (
    guid,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetUserProvidedService(guid, endpointGuid, includeRelations, populateMissing),
  remove: (
    guid: string,
    endpointGuid: string,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => new DeleteUserProvidedInstance(endpointGuid, guid, proxyPaginationEntityConfig),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllUserProvidedServices(paginationKey, endpointGuid, includeRelations, populateMissing),
  getAllInSpace: (
    endpointGuid: string,
    spaceGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetAllUserProvidedServices(paginationKey, endpointGuid, includeRelations, populateMissing, spaceGuid)
};
