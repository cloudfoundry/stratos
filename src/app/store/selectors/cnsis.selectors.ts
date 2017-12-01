import { createSelector } from '@ngrx/store';
import { AppState } from '../app-state';
import { CNSISModel, CNSISState, cnsisStoreNames } from '../types/cnsis.types';
import { selectEntities, selectRequestInfo, selectEntity } from './api.selectors';

// The custom status section
export const cnsisStatusSelector = (state: AppState): CNSISState => state.cnsis;

// All CNSI request data
export const cnsisEntitiesSelector = selectEntities(cnsisStoreNames.type, cnsisStoreNames.section);
// All Registered  CNSI request data
export const cnsisRegisteredEntitiesSelector = createSelector<AppState, CNSISModel[], CNSISModel[]>(
  cnsisEntitiesSelector,
  entities => entities ? entities.filter(cnis => cnis.registered) : []
);

// Single CNSI request information
export const cnsisEntityRequestSelector = (guid) => selectRequestInfo(cnsisStoreNames.type, guid, cnsisStoreNames.section);
// Single CNSI request data
export const cnsisEntityRequestDataSelector = (guid) => selectEntity(cnsisStoreNames.type, guid, cnsisStoreNames.section);
