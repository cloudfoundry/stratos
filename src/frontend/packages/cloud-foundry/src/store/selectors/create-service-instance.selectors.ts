import { compose } from '@ngrx/store';

import { CFAppState } from '../../cf-app-state';
import { CreateServiceInstanceState } from '../types/create-service-instance.types';

export const selectCreateServiceInstance = (state: CFAppState) => state.createServiceInstance;

const getOrgGuid = (state: CreateServiceInstanceState) => state.orgGuid;
const getSpaceGuid = (state: CreateServiceInstanceState) => state.spaceGuid;
const getServicePlanGuid = (state: CreateServiceInstanceState) => state.servicePlanGuid;
const getCfGuid = (state: CreateServiceInstanceState) => state.cfGuid;
const getServiceGuid = (state: CreateServiceInstanceState) => state.serviceGuid;


export const selectCreateServiceInstanceOrgGuid = compose(
  getOrgGuid,
  selectCreateServiceInstance
);
export const selectCreateServiceInstanceSpaceGuid = compose(
  getSpaceGuid,
  selectCreateServiceInstance
);
export const selectCreateServiceInstanceServicePlan = compose(
  getServicePlanGuid,
  selectCreateServiceInstance
);
export const selectCreateServiceInstanceCfGuid = compose(
  getCfGuid,
  selectCreateServiceInstance
);
export const selectCreateServiceInstanceServiceGuid = compose(
  getServiceGuid,
  selectCreateServiceInstance
);
