import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAppServiceBindings } from '../actions/application-service-routes.actions';
import { CreateServiceBinding, DeleteServiceBinding, FetchAllServiceBindings } from '../actions/service-bindings.actions';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';
import { ListServiceBindingsForInstance } from '../actions/service-instances.actions';

export const serviceBindingActionBuilders = {
  create: (
    id,
    endpointGuid,
    applicationGuid: string,
    serviceInstanceGuid: string,
    params: object
  ) => new CreateServiceBinding(
    endpointGuid,
    id,
    applicationGuid,
    serviceInstanceGuid,
    params
  ),
  remove: (
    guid,
    endpointGuid,
    serviceInstanceGuid: string
  ) => new DeleteServiceBinding(endpointGuid, guid, serviceInstanceGuid),
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations?,
    populateMissing?
  ) => new FetchAllServiceBindings(
    endpointGuid,
    paginationKey,
    includeRelations,
    populateMissing
  ),
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetAppServiceBindings(applicationGuid, endpointGuid, paginationKey, includeRelations, populateMissing),
  getAllForServiceInstance: (
    serviceInstanceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[]
  ) => new ListServiceBindingsForInstance(
    endpointGuid,
    serviceInstanceGuid,
    paginationKey,
    includeRelations
  )
} as CFOrchestratedActionBuilders;


