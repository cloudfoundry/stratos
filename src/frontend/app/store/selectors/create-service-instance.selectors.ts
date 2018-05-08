import { compose } from '@ngrx/store';

import { AppState } from '../app-state';
import { CreateServiceInstanceState } from '../types/create-service-instance.types';

export const selectCreateServiceInstance = (state: AppState) => state.createServiceInstance;

const getOrgGuid = (state: CreateServiceInstanceState) => state.orgGuid;
const getSpaceGuid = (state: CreateServiceInstanceState) => state.spaceGuid;
const getServicePlanGuid = (state: CreateServiceInstanceState) => state.servicePlanGuid;


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

