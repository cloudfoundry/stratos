import { Store } from '@ngrx/store';
import { type Observable, of as observableOf, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import type { EntityService, RequestInfoState, APIResource, EntityInfo, GeneralEntityAppState } from '@stratosui/store';
import { ApplicationService } from '@stratosui/cloud-foundry';
import type { IApp, IAppSummary, IDomain, IOrganization, ISpace } from '../src/cf-api.types';
import type { CFAppState } from '../src/cf-app-state';
import type { ApplicationData } from '../src/features/applications/application.service';
import { ApplicationEnvVarsHelper, type EnvVarStratosProject } from '../src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { type ApplicationStateData, ApplicationStateService } from '../src/shared/services/application-state.service';
import type { AppStat } from '../src/store/types/app-metadata.types';

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

  private entityObsSubject = new BehaviorSubject({} as any);

  // Use BehaviorSubjects instead of observableOf() to prevent immediate completion
  // This fixes issues with withLatestFrom() and first() operators in components
  private appSubject = new BehaviorSubject<ApplicationData>({
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
  } as ApplicationData);

  private appOrgSubject = new BehaviorSubject<APIResource<IOrganization>>(createEntity<IOrganization>({
    name: 'mockOrg',
    guid: 'mockOrgGuid'
  } as IOrganization));

  private appSpaceSubject = new BehaviorSubject<APIResource<ISpace>>(createEntity<ISpace>({
    name: 'mockSpace',
    guid: 'mockSpaceGuid'
  } as ISpace));

  application$: Observable<ApplicationData> = this.appSubject.asObservable();
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
  appStats$: Observable<AppStat[]> = observableOf([] as AppStat[]);
  applicationStratProject$: Observable<EnvVarStratosProject> =
    observableOf({ deploySource: { type: 'github', timestamp: 0, commit: '', endpointGuid: ''  }, deployOverrides: null});
  isFetchingApp$: Observable<boolean> = observableOf(false);
  isFetchingEnvVars$: Observable<boolean> = observableOf(false);
  isUpdatingEnvVars$: Observable<boolean> = observableOf(false);
  waitForAppEntity$: Observable<EntityInfo<APIResource<IApp>>> = this.app$;
  appEnvVars = {
    entities$: observableOf([] as APIResource<any>[])
  };
  applicationState$: Observable<ApplicationStateData> = observableOf({
    label: '',
    indicator: null,
    actions: {}
  });
  appOrg$: Observable<APIResource<IOrganization>> = this.appOrgSubject.asObservable();
  appSpace$: Observable<APIResource<ISpace>> = this.appSpaceSubject.asObservable();
  applicationRunning$: Observable<boolean> = observableOf(false);
  orgDomains$: Observable<APIResource<IDomain>[]> = observableOf([]);
  entityService: EntityService<APIResource<IApp<unknown>>> = {
    waitForEntity$: of({}),
    updatingSection$: of({}),
    entityObs$: this.entityObsSubject.asObservable(),
    poll: () => of({})
  } as EntityService<APIResource<IApp<unknown>>>
}

export function generateTestApplicationServiceProvider(appGuid: string, cfGuid: string) {
  return {
    provide: ApplicationService,
    useFactory: (
      store: Store<GeneralEntityAppState>,
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


