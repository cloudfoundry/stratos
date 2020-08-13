import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  CreateServiceInstance,
  DeleteServiceInstance,
  GetServiceInstance,
  GetServiceInstances,
  UpdateServiceInstance,
} from '../actions/service-instances.actions';
import { GetServicePlanServiceInstances } from '../actions/service-plan.actions';
import { GetServiceInstancesForSpace } from '../actions/space.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface CreateUpdateActionMeta {
  name: string;
  servicePlanGuid: string;
  spaceGuid: string;
  params: object;
  tags: string[];
}

export interface ServiceInstanceActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetServiceInstance;
  remove: (
    guid: string,
    endpointGuid: string,
  ) => DeleteServiceInstance;
  create: (
    createId: string,
    endpointGuid: string,
    meta: CreateUpdateActionMeta
  ) => CreateServiceInstance;
  update: (
    guid: string,
    endpointGuid: string,
    meta: CreateUpdateActionMeta
  ) => UpdateServiceInstance;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetServiceInstances;
  getAllInServicePlan: (
    servicePlanGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }?: CFBasePipelineRequestActionMeta
  ) => GetServicePlanServiceInstances;
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    qParams: string[],
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetServiceInstancesForSpace;
}


export const serviceInstanceActionBuilders: ServiceInstanceActionBuilders = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceInstance(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  remove: (
    guid,
    endpointGuid
  ) => new DeleteServiceInstance(endpointGuid, guid),
  create: (
    createId,
    endpointGuid,
    meta: CreateUpdateActionMeta
  ) => new CreateServiceInstance(
    createId,
    endpointGuid,
    meta.name,
    meta.servicePlanGuid,
    meta.spaceGuid,
    meta.params,
    meta.tags
  ),
  update: (
    guid,
    endpointGuid,
    meta: CreateUpdateActionMeta
  ) => new UpdateServiceInstance(
    guid,
    endpointGuid,
    meta.name,
    meta.servicePlanGuid,
    meta.spaceGuid,
    meta.params,
    meta.tags
  ),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceInstances(endpointGuid, paginationKey, includeRelations, populateMissing),
  getAllInServicePlan: (
    servicePlanGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServicePlanServiceInstances(
    servicePlanGuid,
    endpointGuid,
    paginationKey,
    includeRelations
  ),
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    qParams: string[],
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceInstancesForSpace(spaceGuid, endpointGuid, paginationKey, qParams, includeRelations, populateMissing)
};
