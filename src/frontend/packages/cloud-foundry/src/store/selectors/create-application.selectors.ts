import { compose } from '@ngrx/store';

import { CFAppState } from '../../cf-app-state';
import { CreateNewApplicationState } from '../types/create-application.types';

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


