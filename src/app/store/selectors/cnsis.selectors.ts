import { createSelector } from '@ngrx/store';
import { AppState } from '../app-state';
import { CNSISState } from '../types/cnsis.types';


export const cnsisSelector = (state: AppState): CNSISState => state.cnsis;

export const cnsisEntitySelector = createSelector<AppState, CNSISState, CNSISState['entities']>(
  cnsisSelector,
  state => state.entities
);

export const registeredCnsisEntitySelector = createSelector<AppState, CNSISState['entities'], CNSISState['entities']>(
  cnsisEntitySelector,
  entities => entities ? entities.filter(cnis => cnis.registered) : []
);


