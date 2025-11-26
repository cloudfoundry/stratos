import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  CreateServiceInstance,
  DeleteServiceInstance,
  GetServiceInstance,
  GetServiceInstances,
  UpdateServiceInstance,
} from '../actions/service-instances.actions';
import { GetServicePlanServiceInstances } from '../actions/service-plan.actions';
import { GetServiceInstancesForSpace } from '../actions/space.actions';
import type { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

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
    extraArgs?: Record<string, unknown>
  ) => GetServiceInstance;
  remove: (
    guid: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => DeleteServiceInstance;
  create: (
    createId: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => CreateServiceInstance;
  update: (
    guid: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => UpdateServiceInstance;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    extraArgs?: Record<string, unknown>
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
    endpointGuid: string,
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
    endpointGuid: string,
    meta?: CreateUpdateActionMeta | Record<string, unknown>
  ) => {
    const typedMeta = meta as CreateUpdateActionMeta;
    return new CreateServiceInstance(
      createId,
      endpointGuid,
      typedMeta.name,
      typedMeta.servicePlanGuid,
      typedMeta.spaceGuid,
      typedMeta.params,
      typedMeta.tags
    );
  },
  update: (
    guid,
    endpointGuid: string,
    meta?: CreateUpdateActionMeta | Record<string, unknown>
  ) => {
    const typedMeta = meta as CreateUpdateActionMeta;
    return new UpdateServiceInstance(
      guid,
      endpointGuid,
      typedMeta.name,
      typedMeta.servicePlanGuid,
      typedMeta.spaceGuid,
      typedMeta.params,
      typedMeta.tags
    );
  },
  getMultiple: (
    endpointGuid: string,
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
