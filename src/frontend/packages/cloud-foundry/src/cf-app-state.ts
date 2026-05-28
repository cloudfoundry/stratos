import { AppState } from '../../store/src/app-state';
import { CFRequestDataState } from './cf-entity-types';
import { CreateNewApplicationState } from './store/types/create-application.types';

// Care about CF entities? Use this one. CF version of app-state.ts equivalents
export abstract class CFAppState extends AppState<CFRequestDataState> {
  createApplication!: CreateNewApplicationState;
}
