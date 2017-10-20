import { CNSISState } from './types/cnsis.types';
import { AuthState } from './reducers/auth.reducer';
import { DashboardState } from './reducers/dashboard-reducer';
import { PaginationState } from './types/pagination.types';
import { MetadataState } from './types/app-metadata.types';
import { CreateNewApplicationState } from './types/create-application.types';
import { EntitiesState } from './types/entity.types';
import { UAASetupState } from './types/uaa-setup.types';


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
