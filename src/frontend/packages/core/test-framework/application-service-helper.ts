import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';

import { CFAppState } from '../../cloud-foundry/src/cf-app-state';
import { ApplicationData, ApplicationService } from '../../cloud-foundry/src/features/applications/application.service';
import {
  ApplicationEnvVarsHelper,
  EnvVarStratosProject,
} from '../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { AppStat } from '../../cloud-foundry/src/store/types/app-metadata.types';
import { RequestInfoState } from '../../store/src/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../../store/src/types/api.types';
import { IApp, IAppSummary, IDomain, ISpace } from '../src/core/cf-api.types';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../src/shared/components/application-state/application-state.service';

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
  static cfGuid = 'mockCfGuid';
  static appGuid = 'mockAppGuid';
  cfGuid = ApplicationServiceMock.cfGuid;
  appGuid = ApplicationServiceMock.appGuid;
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
  appSummary$: Observable<EntityInfo<IAppSummary>> = observableOf({
    entityRequestInfo: { fetching: false }
  } as EntityInfo<IAppSummary>);
  appStats$: Observable<AppStat[]> = observableOf(new Array<AppStat>());
  applicationStratProject$: Observable<EnvVarStratosProject> =
    observableOf({ deploySource: { type: 'github', timestamp: 0, commit: '' }, deployOverrides: null });
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
  orgDomains$: Observable<APIResource<IDomain>[]> = observableOf([]);
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


