import { Store } from '@ngrx/store';
import { APIResource, EntityInfo } from '../../store/src/types/api.types';
import { ApplicationData, ApplicationService } from '../src/features/applications/application.service';
import { RequestInfoState } from '../../store/src/reducers/api-request-reducer/types';
import { AppStat } from '../../store/src/types/app-metadata.types';
import {
  EnvVarStratosProject,
  ApplicationEnvVarsHelper
} from '../src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateData, ApplicationStateService } from '../src/shared/components/application-state/application-state.service';
import { ISpace, IApp, IAppSummary } from '../src/core/cf-api.types';
import { AppState } from '../../store/src/app-state';
import { EntityServiceFactory } from '../src/core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../src/shared/monitors/pagination-monitor.factory';
import { Observable, of as observableOf } from 'rxjs';
import { AppAutoscalerPolicy, AppAutoscalerHealth } from '../../store/src/types/app-autoscaler.types'

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
  app$: Observable<EntityInfo<APIResource<IApp>>> = observableOf({
    entity: { entity: {} }
  } as EntityInfo<APIResource<IApp>>);
  appSummary$: Observable<EntityInfo<APIResource<IAppSummary>>> = observableOf({
    entityRequestInfo: { fetching: false }
  } as EntityInfo<APIResource<IAppSummary>>);
  appAutoscalerPolicy$: Observable<EntityInfo<AppAutoscalerPolicy>> = observableOf(({
    entityRequestInfo: { fetching: false }
  } as EntityInfo<AppAutoscalerPolicy>));
  appAutoscalerHealth$: Observable<EntityInfo<AppAutoscalerHealth>> = observableOf(({
    entityRequestInfo: { fetching: false }
  } as EntityInfo<AppAutoscalerHealth>));
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


