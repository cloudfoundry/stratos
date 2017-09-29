import { AuthState } from './reducers/auth.reducer';
import { CNSISState } from './reducers/cnsis.reducer';
import { CreateNewApplicationState } from './reducers/create-application.reducer';
import { DashboardState } from './reducers/dashboard-reducer';
import { EntitiesState } from './reducers/entity.reducer';
import { PaginationState } from './reducers/pagination.reducer';
import { UAASetupState } from './reducers/uaa-setup.reducers';


export interface AppState {
  entities: EntitiesState;
  auth: AuthState;
  uaaSetup: UAASetupState;
  cnsis: CNSISState;
  pagination: PaginationState;
  apiRequest: EntitiesState;
  dashboard: DashboardState;
  createApplication: CreateNewApplicationState;
}
