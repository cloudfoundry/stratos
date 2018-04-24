import { compose } from '@ngrx/store';

import { AppState } from '../app-state';
import { CreateServiceInstanceState } from '../types/create-service-instance.types';

export const selectCreateServiceInstance = (state: AppState) => state.createServiceInstance;

export const getOrgGuid = (state: CreateServiceInstanceState) => state.orgGuid;


export const selectOrgGuid = compose(
  getOrgGuid,
  selectCreateServiceInstance
);
