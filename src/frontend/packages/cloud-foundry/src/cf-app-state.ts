import { AppState } from '../../store/src/app-state';
import { CFRequestDataState } from './cf-entity-types';

// Care about CF entities? Use this one. CF version of app-state.ts equivalents
export abstract class CFAppState extends AppState<CFRequestDataState> { }
