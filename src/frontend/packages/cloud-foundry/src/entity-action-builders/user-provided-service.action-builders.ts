import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import type { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import {
  CreateUserProvidedServiceInstance,
  DeleteUserProvidedInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  type IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../actions/user-provided-service.actions';
import type { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';


export interface UserProvidedServiceActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => GetUserProvidedService;
  create: (
    createTrackingId: string,
    endpointGuid: string,
    extraArgs?: {
      data?: IUserProvidedServiceInstanceData;
      proxyPaginationEntityConfig?: EntityCatalogEntityConfig;
    }
  ) => CreateUserProvidedServiceInstance;
  remove: (
    guid: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => DeleteUserProvidedInstance;
  update: (
    guid: string,
    endpointGuid: string,
    existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => UpdateUserProvidedServiceInstance;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    extraArgs?: Record<string, unknown>
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
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig | Record<string, unknown>
  ) => new DeleteUserProvidedInstance(endpointGuid, guid, proxyPaginationEntityConfig as EntityCatalogEntityConfig),
  create: (
    createTrackingId: string,
    endpointGuid: string,
    extraArgs?: {
      data?: IUserProvidedServiceInstanceData;
      proxyPaginationEntityConfig?: EntityCatalogEntityConfig;
    }
  ) => new CreateUserProvidedServiceInstance(
    endpointGuid,
    createTrackingId,
    extraArgs?.data,
    extraArgs?.proxyPaginationEntityConfig
  ),
  update: (
    guid: string,
    endpointGuid: string,
    existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => new UpdateUserProvidedServiceInstance(
    endpointGuid,
    guid,
    existingUserProvidedServiceInstance,
    proxyPaginationEntityConfig
  ),
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
