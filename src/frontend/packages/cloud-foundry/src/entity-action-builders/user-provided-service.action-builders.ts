import {
  DeleteApplication,
  UpdateApplication,
  RestageApplication,
} from '../actions/application.actions';
import { AppMetadataTypes } from '../actions/app-metadata.actions';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';
import { AssignRouteToApplication } from '../actions/application-service-routes.actions';
import {
  GetAllUserProvidedServices,
  GetUserProvidedService,
  CreateUserProvidedServiceInstance,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance
} from '../actions/user-provided-service.actions';

export const userProvidedServiceActionBuilder = {
  get: (
    guid,
    endpointGuid,
    includeRelations = [],
    populateMissing = true
  ) => new GetUserProvidedService(guid, endpointGuid, includeRelations, populateMissing),
  remove: (guid: string, endpointGuid: string) => new DeleteApplication(guid, endpointGuid),
  update: (
    guid: string,
    endpointGuid: string,
    existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
    proxyPaginationEntityKey?: string
  ) => new UpdateUserProvidedServiceInstance(
    endpointGuid,
    guid,
    existingUserProvidedServiceInstance,
    proxyPaginationEntityKey
  ),
  getAll: (
    endpointGuid: string,
    paginationKey: string,
    includeRelations = [],
    populateMissing = false,
  ) => new GetAllUserProvidedServices(paginationKey, endpointGuid, includeRelations, populateMissing),
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetAllUserProvidedServices(paginationKey, endpointGuid, includeRelations, populateMissing, spaceGuid)
} as CFOrchestratedActionBuilders;


