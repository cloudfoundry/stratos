import { AppState } from '../../store/src/app-state';
import type { CFRequestDataState } from './cf-entity-types';
import type { CreateNewApplicationState } from './store/types/create-application.types';
import type { DeployApplicationState } from './store/types/deploy-application.types';
import type { CreateServiceInstanceState } from './store/types/create-service-instance.types';
import type { UsersRolesState } from './store/types/users-roles.types';

// Care about CF entities? Use this one. CF version of app-state.ts equivalents
export abstract class CFAppState extends AppState<CFRequestDataState> {
  createApplication!: CreateNewApplicationState;
  deployApplication!: DeployApplicationState;
  createServiceInstance!: CreateServiceInstanceState;
  manageUsersRoles!: UsersRolesState;
}
