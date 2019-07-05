import { CFOrchestratedActionBuilders } from './cf.action-builder.types';
import {
  GetServiceInstances,
  GetServiceInstance,
  DeleteServiceInstance,
  CreateServiceInstance,
  UpdateServiceInstance
} from '../actions/service-instances.actions';
import { getAPIRequestDataState } from '../../../store/src/selectors/api.selectors';
import { GetServicePlanServiceInstances } from '../actions/service-plan.actions';

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
    includeRelations?,
    populateMissing?
  ) => new GetServiceInstances(endpointGuid, paginationKey, includeRelations, populateMissing),
  getAllFromServicePlan: (
    servicePlanGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[]
  ) => new GetServicePlanServiceInstances(
    servicePlanGuid,
    endpointGuid,
    paginationKey,
    includeRelations
  )
} as CFOrchestratedActionBuilders;
