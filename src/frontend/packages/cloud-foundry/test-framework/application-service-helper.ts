import { Observable, of as observableOf, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { signal, computed } from '@angular/core';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { EntityService, RequestInfoState, APIResource, EntityInfo } from '@stratosui/store';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { IApp, IAppSummary } from '../src/cf-api.types';
import { StDomain, StOrg, StSpace } from '../src/services/endpoint-data/stratos-types';
import { ApplicationData } from '../src/features/applications/application.service';
import { EnvVarStratosProject } from '../src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateData } from '../src/shared/services/application-state.service';
import { AppStat } from '../src/store/types/app-metadata.types';
import { AppDetailDataService } from '../src/features/applications/app-detail-data.service';

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
  // This fixes issues with withLatestFrom() and take(1) operators in components
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

  private appOrgSubject = new BehaviorSubject<StOrg | undefined>({
    guid: 'mockOrgGuid',
    name: 'mockOrg',
    status: 'active',
    quotaGuid: '',
    labels: {},
    annotations: {},
    createdAt: '',
    updatedAt: '',
    cnsiGuid: this.cfGuid,
  });

  private appSpaceSubject = new BehaviorSubject<StSpace | undefined>({
    guid: 'mockSpaceGuid',
    name: 'mockSpace',
    orgGuid: 'mockOrgGuid',
    createdAt: '',
    updatedAt: '',
    cnsiGuid: this.cfGuid,
    appCount: 0,
    routeCount: 0,
    allowSsh: false,
  });

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
  appStats$: Observable<AppStat[]> = observableOf(new Array<AppStat>());
  applicationStratProject$: Observable<EnvVarStratosProject> =
    observableOf({ deploySource: { type: 'github', timestamp: 0, commit: '', endpointGuid: ''  }, deployOverrides: null});
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
  appOrg$: Observable<StOrg | undefined> = this.appOrgSubject.asObservable();
  appSpace$: Observable<StSpace | undefined> = this.appSpaceSubject.asObservable();
  applicationRunning$: Observable<boolean> = observableOf(false);
  orgDomains$: Observable<StDomain[]> = observableOf([]);
  entityService: EntityService<APIResource<IApp<unknown>>> = {
    waitForEntity$: of({}),
    updatingSection$: of({}),
    entityObs$: this.entityObsSubject.asObservable(),
    poll: () => of({})
  } as EntityService<APIResource<IApp<unknown>>>
}

/**
 * Minimal AppDetailDataService stub for use in tests that instantiate the
 * real ApplicationService (via generateTestApplicationServiceProvider).
 * ApplicationService now requires AppDetailDataService via inject(), so
 * the stub must be provided whenever the real ApplicationService is used.
 */
function makeAppDetailDataServiceStub() {
  const _loading = signal<Record<string, boolean>>({
    app: false, summary: false, stats: false, envVars: false,
    space: false, org: false, domains: false,
  });
  const _errors = signal<Record<string, any>>({
    app: null, summary: null, stats: null, envVars: null,
    space: null, org: null, domains: null,
  });
  return {
    app: signal<any>(undefined).asReadonly(),
    summary: signal<any>(undefined).asReadonly(),
    stats: signal<any[]>([]).asReadonly(),
    envVars: signal<any>(undefined).asReadonly(),
    space: signal<any>(undefined).asReadonly(),
    org: signal<any>(undefined).asReadonly(),
    domains: signal<any[]>([]).asReadonly(),
    loading: _loading.asReadonly(),
    errors: _errors.asReadonly(),
    running: computed(() => false),
    url: computed(() => null as string | null),
    // null means env vars not loaded — ApplicationService.applicationStratProject$
    // filters null values out, so components that do take(1) won't receive null.
    stratosProject: computed(() => null),
    state: computed(() => ({ label: '', indicator: null, actions: {} })),
    fetching: computed(() => false),
    lastPolledAt: signal<Date | null>(null).asReadonly(),
  };
}

export function generateTestApplicationServiceProvider(appGuid: string, cfGuid: string) {
  return [
    { provide: CF_GUID, useValue: cfGuid },
    { provide: APP_GUID, useValue: appGuid },
    {
      provide: AppDetailDataService,
      useFactory: makeAppDetailDataServiceStub,
    },
    {
      provide: ApplicationService,
      useFactory: () => new ApplicationService(),
    },
  ];
}


