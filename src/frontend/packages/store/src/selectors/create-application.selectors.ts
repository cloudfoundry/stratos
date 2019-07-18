import { compose } from '@ngrx/store';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { CreateNewApplicationState } from '../types/create-application.types';

export const selectNewAppDetails = (state: CFAppState) => state.createApplication;

export const getNewAppCFDetails = (state: CreateNewApplicationState) => state.cloudFoundryDetails;

export const getNewAppCFName = (state: CreateNewApplicationState) => state.name;

export const selectNewAppCFDetails = compose(
  getNewAppCFDetails,
  selectNewAppDetails
);

export const selectNewAppCFName = compose(
  getNewAppCFName,
  selectNewAppDetails
);


