import { compose } from '@ngrx/store';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { CreateNewApplicationState } from '../../../cloud-foundry/src/store/types/create-application.types';

const selectNewAppDetails = (state: CFAppState) => state.createApplication;

const getNewAppCFDetails = (state: CreateNewApplicationState) => state.cloudFoundryDetails;

const getNewAppCFName = (state: CreateNewApplicationState) => state.name;

export const selectNewAppCFDetails = compose(
  getNewAppCFDetails,
  selectNewAppDetails
);

export const selectNewAppCFName = compose(
  getNewAppCFName,
  selectNewAppDetails
);


