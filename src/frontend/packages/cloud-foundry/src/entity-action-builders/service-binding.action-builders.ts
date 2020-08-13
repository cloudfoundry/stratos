import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppServiceBindings } from '../actions/application-service-routes.actions';
import { CreateServiceBinding, DeleteServiceBinding, FetchAllServiceBindings } from '../actions/service-bindings.actions';
import { ListServiceBindingsForInstance } from '../actions/service-instances.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ServiceBindingActionBuilders extends OrchestratedActionBuilders {
  create: (
    id: string,
    endpointGuid: string,
    { applicationGuid, serviceInstanceGuid, params }: { applicationGuid: string, serviceInstanceGuid: string, params: object }
  ) => CreateServiceBinding;
  remove: (
    guid: string,
    endpointGuid: string,
    { serviceInstanceGuid }: { serviceInstanceGuid: string }
  ) => DeleteServiceBinding;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => FetchAllServiceBindings;
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAppServiceBindings;
  getAllForServiceInstance: (
    serviceInstanceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }: CFBasePipelineRequestActionMeta
  ) => ListServiceBindingsForInstance;
}

export const serviceBindingActionBuilders: ServiceBindingActionBuilders = {
  create: (
    id,
    endpointGuid,
    { applicationGuid, serviceInstanceGuid, params }: { applicationGuid: string, serviceInstanceGuid: string, params: object }
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
    { serviceInstanceGuid }: { serviceInstanceGuid: string }
  ) => new DeleteServiceBinding(endpointGuid, guid, serviceInstanceGuid),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {},
  ) => new FetchAllServiceBindings(
    endpointGuid,
    paginationKey,
    includeRelations,
    populateMissing
  ),
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAppServiceBindings(applicationGuid, endpointGuid, paginationKey, includeRelations, populateMissing),
  getAllForServiceInstance: (
    serviceInstanceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }: CFBasePipelineRequestActionMeta = {}
  ) => new ListServiceBindingsForInstance(
    endpointGuid,
    serviceInstanceGuid,
    paginationKey,
    includeRelations
  )
};


