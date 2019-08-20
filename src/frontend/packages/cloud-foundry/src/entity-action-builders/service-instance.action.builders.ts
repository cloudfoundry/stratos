import { CFOrchestratedActionBuilders } from './cf.action-builder.types';
import {
  GetServiceInstances,
  GetServiceInstance,
  DeleteServiceInstance,
  CreateServiceInstance,
  UpdateServiceInstance
} from '../actions/service-instances.actions';
import { GetServicePlanServiceInstances } from '../actions/service-plan.actions';
import { GetServiceInstancesForSpace } from '../actions/space.actions';

export const serviceInstanceActionBuilders = {
  get: (
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
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
    name: string,
    servicePlanGuid: string,
    spaceGuid: string,
    params: object,
    tags: string[],
  ) => new CreateServiceInstance(
    createId,
    endpointGuid,
    name,
    servicePlanGuid,
    spaceGuid,
    params,
    tags
  ),
  update: (
    guid,
    endpointGuid,
    name: string,
    servicePlanGuid: string,
    spaceGuid: string,
    params: object,
    tags: string[]
  ) => new UpdateServiceInstance(
    guid,
    endpointGuid,
    name,
    servicePlanGuid,
    spaceGuid,
    params,
    tags
  ),
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetServiceInstances(endpointGuid, paginationKey, includeRelations, populateMissing),
  getAllInServicePlan: (
    servicePlanGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[]
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
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetServiceInstancesForSpace(spaceGuid, endpointGuid, paginationKey, qParams, includeRelations, populateMissing)
} as CFOrchestratedActionBuilders;
