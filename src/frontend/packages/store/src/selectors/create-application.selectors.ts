import { compose } from '@ngrx/store';
import { CreateNewApplicationState } from '../types/create-application.types';
import { AppState } from '../app-state';
export const selectNewAppDetails = (state: AppState) => state.createApplication;

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


