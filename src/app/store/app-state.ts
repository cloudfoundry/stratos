import { CNSISState } from './reducers/cnsis.reducer';
import { UAASetupState } from './reducers/uaa-setup.reducers';
import { EntitiesState } from './reducers/api.reducer';
import { AuthState } from './reducers/auth.reducer';
export interface AppState {
  entities: EntitiesState;
  auth: AuthState;
  uaaSetup: UAASetupState;
  cnsis: CNSISState;
}
