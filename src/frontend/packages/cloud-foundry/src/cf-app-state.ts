import { AppState } from '../../store/src/app-state';
import { CFRequestDataState } from './cf-entity-types';
import { CreateNewApplicationState } from './store/types/create-application.types';
import { DeployApplicationState } from './store/types/deploy-application.types';
import { CreateServiceInstanceState } from './store/types/create-service-instance.types';
import { UsersRolesState } from './store/types/users-roles.types';

// Care about CF entities? Use this one. CF version of app-state.ts equivalents
export abstract class CFAppState extends AppState<CFRequestDataState> {
  createApplication: CreateNewApplicationState;
  deployApplication: DeployApplicationState;
  createServiceInstance: CreateServiceInstanceState;
  manageUsersRoles: UsersRolesState;
}
