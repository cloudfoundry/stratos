import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityInfo, getEntityObservable, selectEntityUpdateInfo } from '../../store/actions/api.actions';
import {
  AppMetadataInfo,
  AppMetadataProperties,
  AppMetadataType,
  GetAppMetadataAction,
  getAppMetadataObservable,
} from '../../store/actions/app-metadata.actions';
import { ApplicationSchema, ApplicationSummarySchema } from '../../store/actions/application.actions';
import {
  GetApplication,
  GetApplicationSummary,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../store/actions/application.actions';
import { cnsisEntitySelector } from '../../store/actions/cnsis.actions';
import { AppState } from '../../store/app-state';
import { UpdateState } from '../../store/reducers/api-request-reducer';
import { ApplicationEnvVarsService, EnvVarStratosProject } from './application/summary-tab/application-env-vars.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from './application/summary-tab/application-state/application-state.service';

export interface ApplicationData {
  fetching: boolean;
  app: EntityInfo;
  space: EntityInfo;
  organisation: EntityInfo;
  stack: EntityInfo;
  cf: any;
}

@Injectable()
export class ApplicationService {

  constructor(private store: Store<AppState>, private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsService) {
  }

  isFetchingApp$: Observable<boolean>;
  isUpdatingApp$: Observable<boolean>;

  app$: Observable<EntityInfo>;
  appSummary$: Observable<EntityInfo>;
  appStatsGated$: Observable<null | AppMetadataInfo>;
  appEnvVars$: Observable<AppMetadataInfo>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;

  appGuid: string;
  cfGuid: string;

  IsEntityComplete(value, requestInfo: { fetching: boolean }): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  SetApplication(cfGuid, appGuid) {
    this.appGuid = appGuid;
    this.cfGuid = cfGuid;

    // First set up all the base observables
    this.app$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      appGuid,
      new GetApplication(appGuid, cfGuid)
    ).debounceTime(250);

    this.appSummary$ = getEntityObservable(
      this.store,
      ApplicationSummarySchema.key,
      ApplicationSummarySchema,
      appGuid,
      new GetApplicationSummary(appGuid, cfGuid)
    );

    // Subscribing to this will make the stats call. It's better to subscrbibe to appStatsGated$
    const appStats$ = getAppMetadataObservable(
      this.store,
      appGuid,
      new GetAppMetadataAction(appGuid, cfGuid, AppMetadataProperties.INSTANCES as AppMetadataType)
    );

    this.appEnvVars$ = getAppMetadataObservable(
      this.store,
      appGuid,
      new GetAppMetadataAction(appGuid, cfGuid, AppMetadataProperties.ENV_VARS as AppMetadataType)
    );

    // Assign/Amalgamate them to public properties (with mangling if required)

    this.appStatsGated$ = this.app$
      .filter((appInfo: EntityInfo) => {
        // console.log('appStatsGated$: filter: ', this.IsEntityComplete(appInfo.entity, appInfo.entityRequestInfo));
        return this.IsEntityComplete(appInfo.entity, appInfo.entityRequestInfo);
      })
      .delay(1)
      .mergeMap((appInfo: EntityInfo) => {
        // console.log('appStatsGated$: mergeMap: ', appInfo);
        if (appInfo && appInfo.entity && appInfo.entity.entity && appInfo.entity.entity.state === 'STARTED') {
          // console.log('appStatsGated$: mergeMap: appStats');
          return appStats$;
        }
        // console.log('appStatsGated$: mergeMap: app');
        return this.app$.map((app: EntityInfo) => {
          return null;
        });
      });

    this.application$ = this.app$
      .combineLatest(
      this.store.select(cnsisEntitySelector),
    )
      .filter(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]) => {
        return this.IsEntityComplete(entity, entityRequestInfo) && cnsis;
      })
      .filter(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]) => {
        const hasSpace = entity.entity.space;
        const hasOrg = hasSpace ? entity.entity.space.entity.organization : false;
        const hasCfGuid = entity.entity.cfGuid;
        return hasSpace && hasOrg && hasCfGuid;
      })
      .map(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]): ApplicationData => {
        return {
          fetching: entityRequestInfo.fetching,
          app: entity,
          space: entity.entity.space,
          organisation: entity.entity.space.entity.organization,
          stack: entity.entity.stack,
          cf: cnsis.find((CNSIModel) => {
            return CNSIModel.guid === entity.entity.cfGuid;
          }),
        };
      });

    this.applicationState$ = this.app$
      .combineLatest(this.appStatsGated$)
      .filter(([appInfo, appStats]: [EntityInfo, AppMetadataInfo]) => {
        const appStatsFetched = appStats ? this.IsEntityComplete(appStats.metadata, appStats.metadataRequestState) : true;
        return this.IsEntityComplete(appInfo.entity, appInfo.entityRequestInfo) && appStatsFetched;
      })
      .mergeMap(([appInfo, appStats]: [EntityInfo, AppMetadataInfo]) => {
        return Observable.of(this.appStateService.Get(appInfo.entity.entity, appStats ? appStats.metadata : null));
      });

    this.applicationStratProject$ = this.appEnvVars$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars.metadata);
    });


    /**
     * An observable based on the core application entity
    */
    this.isFetchingApp$ = this.app$.map(({ entity, entityRequestInfo }) => {
      return !this.IsEntityComplete(entity, entityRequestInfo);
    });

    this.isUpdatingApp$ =
      this.store.select(selectEntityUpdateInfo(ApplicationSchema.key, appGuid, UpdateExistingApplication.updateKey))
        .map((updateState: UpdateState) => {
          return updateState ? updateState.busy : false;
        });
  }

  UpdateApplication(updatedApplication: UpdateApplication) {
    this.store.dispatch(new UpdateExistingApplication(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication }
    ));
  }

}
