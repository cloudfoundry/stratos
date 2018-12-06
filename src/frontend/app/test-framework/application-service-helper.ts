
import { of as observableOf, Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../core/entity-service-factory.service';
import { ApplicationData, ApplicationService } from '../features/applications/application.service';
import {
  ApplicationEnvVarsHelper,
  EnvVarStratosProject,
} from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService, ApplicationStateData } from '../shared/components/application-state/application-state.service';
import { AppState } from '../store/app-state';
import { RequestInfoState } from '../store/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../store/types/api.types';
import { AppStat, AppSummary } from '../store/types/app-metadata.types';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../shared/monitors/pagination-monitor.factory';
import { ISpace } from '../core/cf-api.types';

function createEntity<T>(entity: T): APIResource<T> {
  return {
    metadata: {
      created_at: '',
      guid: '',
      updated_at: '',
      url: ''
    },
    entity
  };
}

export class ApplicationServiceMock {
  cfGuid = 'mockCfGuid';
  appGuid = 'mockAppGuid';
  application$: Observable<ApplicationData> = observableOf(({
    cf: {
      guid: 'mockCfGuid'
    },
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
    fetching: false
  } as ApplicationData));
  appSummary$: Observable<EntityInfo<AppSummary>> = observableOf(({ entityRequestInfo: { fetching: false } } as EntityInfo<AppSummary>));
  appStats$: Observable<APIResource<AppStat>[]> = observableOf(new Array<APIResource<AppStat>>());
  applicationStratProject$: Observable<EnvVarStratosProject> =
    observableOf({ deploySource: { type: '', timestamp: 0, commit: '' }, deployOverrides: null });
  isFetchingApp$: Observable<boolean> = observableOf(false);
  isFetchingEnvVars$: Observable<boolean> = observableOf(false);
  isUpdatingEnvVars$: Observable<boolean> = observableOf(false);
  waitForAppEntity$: Observable<EntityInfo> = observableOf({
    entity: createEntity({
      space: {
        metadata: {},
        entity: {
          domains: []
        }
      }
    })
  } as EntityInfo);
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
}

export function generateTestApplicationServiceProvider(appGuid, cfGuid) {
  return {
    provide: ApplicationService,
    useFactory: (
      store: Store<AppState>,
      entityServiceFactory: EntityServiceFactory,
      applicationStateService: ApplicationStateService,
      applicationEnvVarsService: ApplicationEnvVarsHelper,
      paginationMonitorFactory: PaginationMonitorFactory
    ) => {
      const appService = new ApplicationService(
        cfGuid,
        appGuid,
        store,
        entityServiceFactory,
        applicationStateService,
        applicationEnvVarsService,
        paginationMonitorFactory
      );
      return appService;
    },
    deps: [
      Store,
      EntityServiceFactory,
      ApplicationStateService,
      ApplicationEnvVarsHelper,
      PaginationMonitorFactory
    ]
  };
}


