import { PaginationState } from './reducers/pagination.reducer';
import { CNSISState } from './reducers/cnsis.reducer';
import { UAASetupState } from './reducers/uaa-setup.reducers';
import { EntitiesState } from './reducers/entity.reducer';
import { AuthState } from './reducers/auth.reducer';
export interface AppState {
  entities: EntitiesState;
  auth: AuthState;
  uaaSetup: UAASetupState;
  cnsis: CNSISState;
  pagination: PaginationState;
  apiRequest: EntitiesState;
}
