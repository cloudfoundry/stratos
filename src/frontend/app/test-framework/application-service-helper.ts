import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityServiceFactory } from '../core/entity-service-factory.service';
import { ApplicationData, ApplicationService } from '../features/applications/application.service';
import {
  ApplicationEnvVarsService,
  EnvVarStratosProject,
} from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService, ApplicationStateData } from '../shared/components/application-state/application-state.service';
import { AppState } from '../store/app-state';
import { RequestInfoState } from '../store/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../store/types/api.types';
import { AppStat, AppSummary } from '../store/types/app-metadata.types';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../shared/monitors/pagination-monitor.factory';

export class ApplicationServiceMock {
  cfGuid = 'mockCfGuid';
  appGuid = 'mockAppGuid';
  application$: Observable<ApplicationData> = Observable.of(({
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
  appSummary$: Observable<EntityInfo<AppSummary>> = Observable.of(({ entityRequestInfo: { fetching: false } } as EntityInfo<AppSummary>));
  appStats$: Observable<APIResource<AppStat>[]> = Observable.of(new Array<APIResource<AppStat>>());
  applicationStratProject$: Observable<EnvVarStratosProject> = Observable.of({ deploySource: { type: '', timestamp: 0, commit: '' } });
  isFetchingApp$: Observable<boolean> = Observable.of(false);
  isFetchingEnvVars$: Observable<boolean> = Observable.of(false);
  isUpdatingEnvVars$: Observable<boolean> = Observable.of(false);
  waitForAppEntity$: Observable<EntityInfo> = Observable.of({
    entity: {
      metadata: {},
      entity: {
        space: {
          metadata: {},
          entity: {
            domains: []
          }
        }
      },
    }
  } as EntityInfo);
  appEnvVars = {
    entities$: Observable.of(new Array<APIResource<any>>())
  };
  applicationState$: Observable<ApplicationStateData> = Observable.of({
    label: '',
    indicator: null,
    actions: {}
  });
}

export function generateTestApplicationServiceProvider(appGuid, cfGuid) {
  return {
    provide: ApplicationService,
    useFactory: (
      store: Store<AppState>,
      entityServiceFactory: EntityServiceFactory,
      applicationStateService: ApplicationStateService,
      applicationEnvVarsService: ApplicationEnvVarsService,
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
      ApplicationEnvVarsService,
      PaginationMonitorFactory
    ]
  };
}


