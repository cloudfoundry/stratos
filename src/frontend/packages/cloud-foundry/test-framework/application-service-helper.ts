import { Store } from '@ngrx/store';
import { Observable, of as observableOf, of } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';

import { EntityService } from '../../store/src/entity-service';
import { RequestInfoState } from '../../store/src/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../../store/src/types/api.types';
import { IApp, IAppSummary, IDomain, ISpace } from '../src/cf-api.types';
import { CFAppState } from '../src/cf-app-state';
import { ApplicationData, ApplicationService } from '../src/features/applications/application.service';
import {
  ApplicationEnvVarsHelper,
  EnvVarStratosProject,
} from '../src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateData, ApplicationStateService } from '../src/shared/services/application-state.service';
import { AppStat } from '../src/store/types/app-metadata.types';

function createEntity<T>(entity: T): APIResource<T> {
  return {
    metadata: {
      created_at: '',
      guid: 'mockEntityGuid',
      updated_at: '',
      url: ''
    },
    entity
  };
}

export class ApplicationServiceMock {
  static cfGuid = 'mockCfGuid';
  static appGuid = 'mockAppGuid';
  cfGuid = ApplicationServiceMock.cfGuid;
  appGuid = ApplicationServiceMock.appGuid;
  application$: Observable<ApplicationData> = observableOf(({
    cf: {
      guid: this.cfGuid
    },
    app: {
      metadata: {
        guid: this.appGuid
      },
      entity: {
        space_guid: 'mockSpaceGuid',
        cfGuid: this.cfGuid
      } as IApp,
    } as APIResource<IApp>,
    stack: {
      entity: {
      },
    },
    fetching: false
  } as ApplicationData));
  app$: Observable<EntityInfo<APIResource<IApp>>> = this.application$.pipe(
    map(appData => {
      return {
        entity: appData.app,
        entityRequestInfo: {

        } as RequestInfoState
      }
    })
  );
  appSummary$: Observable<EntityInfo<APIResource<IAppSummary>>> = observableOf({
    entityRequestInfo: { fetching: false }
  } as EntityInfo<APIResource<IAppSummary>>);
  appStats$: Observable<AppStat[]> = observableOf(new Array<AppStat>());
  applicationStratProject$: Observable<EnvVarStratosProject> =
    observableOf({ deploySource: { type: 'github', timestamp: 0, commit: '' }, deployOverrides: null });
  isFetchingApp$: Observable<boolean> = observableOf(false);
  isFetchingEnvVars$: Observable<boolean> = observableOf(false);
  isUpdatingEnvVars$: Observable<boolean> = observableOf(false);
  waitForAppEntity$: Observable<EntityInfo<APIResource<IApp>>> = this.app$;
  appEnvVars = {
    entities$: observableOf(new Array<APIResource<any>>())
  };
  applicationState$: Observable<ApplicationStateData> = observableOf({
    label: '',
    indicator: null,
    actions: {}
  });
  appSpace$: Observable<APIResource<ISpace>> = observableOf(createEntity<ISpace>({} as ISpace));
  applicationRunning$: Observable<boolean> = observableOf(false);
  orgDomains$: Observable<APIResource<IDomain>[]> = observableOf([]);
  entityService: EntityService<APIResource<IApp<unknown>>> = {
    waitForEntity$: of({}),
    updatingSection$: of({})
  } as EntityService<APIResource<IApp<unknown>>>
}

export function generateTestApplicationServiceProvider(appGuid: string, cfGuid: string) {
  return {
    provide: ApplicationService,
    useFactory: (
      store: Store<CFAppState>,
      applicationStateService: ApplicationStateService,
      applicationEnvVarsService: ApplicationEnvVarsHelper,
    ) => {
      const appService = new ApplicationService(
        cfGuid,
        appGuid,
        store,
        applicationStateService,
        applicationEnvVarsService,
      );
      return appService;
    },
    deps: [
      Store,
      ApplicationStateService,
      ApplicationEnvVarsHelper,
    ]
  };
}


