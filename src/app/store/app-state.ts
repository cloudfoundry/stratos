import { AuthState } from './reducers/auth.reducer';
import { CNSISState } from './reducers/cnsis.reducer';
import { CreateNewApplicationState } from './reducers/create-application.reducer';
import { DashboardState } from './reducers/dashboard-reducer';
import { EntitiesState } from './reducers/entity.reducer';
import { UAASetupState } from './reducers/uaa-setup.reducers';
import { PaginationState } from './types/pagination.types';
import { MetadataState } from './types/app-metadata.types';


export interface AppState {
  entities: EntitiesState;
  auth: AuthState;
  uaaSetup: UAASetupState;
  cnsis: CNSISState;
  pagination: PaginationState;
  apiRequest: EntitiesState;
  dashboard: DashboardState;
  appMetadata: MetadataState;
  createApplication: CreateNewApplicationState;
}
