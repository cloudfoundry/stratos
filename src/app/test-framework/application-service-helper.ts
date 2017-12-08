import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { EntityService } from '../core/entity-service';
import { cnsisStoreNames } from '../store/types/cnsis.types';
import { RequestInfoState } from '../store/reducers/api-request-reducer/types';
import { ApplicationService, ApplicationData } from '../features/applications/application.service';
import { Observable } from 'rxjs/Observable';
import { EntityInfo } from '../store/types/api.types';
import { AppMetadataInfo } from '../store/types/app-metadata.types';
import { ApplicationStateService } from '../features/applications/application/build-tab/application-state/application-state.service';
import { ApplicationEnvVarsService } from '../features/applications/application/build-tab/application-env-vars.service';

export class ApplicationServiceMock {
  cfGuid = 'mockCfGuid';
  appGuid = 'mockAppGuid';
  application$: Observable<ApplicationData> = Observable.of(({
    app: {
      metadata: {},
      entity: {
      },
      entityRequestInfo: {} as RequestInfoState
    } as EntityInfo,
    stack: {
      entity: {
      },
    },
    organisation: {
      entity: {
      },
    },
    space: {
      entity: {

      }
    },
    fetching: false
  } as ApplicationData));
  appSummary$: Observable<AppMetadataInfo> = Observable.of(({ metadataRequestState: { fetching: {} } } as AppMetadataInfo));
  isFetchingApp$: Observable<boolean> = Observable.of(false);
  isFetchingEnvVars$: Observable<boolean> = Observable.of(false);
  isUpdatingEnvVars$: Observable<boolean> = Observable.of(false);
  waitForAppEntity$: Observable<EntityInfo> = Observable.of({
    entity: {
      entity: {

      }
    }
  } as EntityInfo);
  setApplication() { }
}

export function generateTestApplicationServiceProvider(appGuid, cfGuid) {
  const applicationServiceFactory = (
    store: Store<AppState>,
    entityService: EntityService,
    applicationStateService: ApplicationStateService,
    applicationEnvVarsService: ApplicationEnvVarsService
  ) => {
    const appService = new ApplicationService(
      store,
      entityService,
      applicationStateService,
      applicationEnvVarsService
    );
    appService.setApplication(cfGuid, appGuid);
    return appService;
  };
  return {
    provide: ApplicationService,
    useFactory: applicationServiceFactory,
    deps: [
      Store,
      EntityService,
      ApplicationStateService,
      ApplicationEnvVarsService
    ]
  };
}


