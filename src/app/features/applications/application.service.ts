import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityInfo, getEntityObservable } from '../../store/actions/api.actions';
import {
  AppMetadataInfo,
  AppMetadataProperties,
  AppMetadataType,
  GetAppMetadataAction,
  getAppMetadataObservable,
} from '../../store/actions/app-metadata.actions';
import { ApplicationSchema, ApplicationSummarySchema } from '../../store/actions/application.actions';
import { GetApplication, GetApplicationSummary } from '../../store/actions/application.actions';
import { cnsisEntitySelector } from '../../store/actions/cnsis.actions';
import { AppState } from '../../store/app-state';
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

  app$: Observable<EntityInfo>;
  appSummary$: Observable<EntityInfo>;
  appStatsGated$: Observable<null | AppMetadataInfo>;
  appEnvVars$: Observable<AppMetadataInfo>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;

  private completeRequest(value, requestInfo: { fetching: boolean }) {
    return requestInfo && !requestInfo.fetching && value;
  }

  SetApplication(cfId, id) {

    // First set up all the base observables
    this.app$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplication(id, cfId)
    );

    this.appSummary$ = getEntityObservable(
      this.store,
      ApplicationSummarySchema.key,
      ApplicationSummarySchema,
      id,
      new GetApplicationSummary(id, cfId)
    );

    // Subscribing to this will make the stats call. It's better to subscrbibe to appStatsGated$
    const appStats$ = getAppMetadataObservable(
      this.store,
      id,
      new GetAppMetadataAction(id, cfId, AppMetadataProperties.INSTANCES as AppMetadataType)
    );

    this.appEnvVars$ = getAppMetadataObservable(
      this.store,
      id,
      new GetAppMetadataAction(id, cfId, AppMetadataProperties.ENV_VARS as AppMetadataType)
    );

    this.appStatsGated$ = this.app$
      .filter((appInfo: EntityInfo) => {
        return this.completeRequest(appInfo.entity, appInfo.entityRequestInfo);
      })
      .mergeMap((appInfo: EntityInfo) => {
        if (appInfo && appInfo.entity && appInfo.entity.entity && appInfo.entity.entity.state === 'STARTED') {
          return appStats$;
        }
        return this.app$.map((app: EntityInfo) => {
          return null;
        });
      });

    // Assign/Amalgamate them to public properties (with mangling if required)

    this.application$ = this.app$
      .combineLatest(
      this.store.select(cnsisEntitySelector),
    ).filter(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]) => {
      return this.completeRequest(entity, entityRequestInfo) && cnsis;
    }).map(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]): ApplicationData => {
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
        const appStatsFetched = appStats ? this.completeRequest(appStats.metadata, appStats.metadataRequestState) : true;
        return this.completeRequest(appInfo.entity, appInfo.entityRequestInfo) && appStatsFetched;
      })
      .mergeMap(([appInfo, appStats]: [EntityInfo, AppMetadataInfo]) => {
        return Observable.of(this.appStateService.Get(appInfo.entity.entity, appStats ? appStats.metadata : null));
      });

    this.applicationStratProject$ = this.appEnvVars$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars.metadata);
    });


    this.isFetchingApp$ = this.app$.map(({ entity, entityRequestInfo }) => {
      return !this.completeRequest(entity, entityRequestInfo);
    });

  }

  UpdateApplication() {
    // TODO: RC Force an update to catch remote changes?
    console.log('NOT IMPLEMENTED');
  }

  SaveApplication(application) {
    console.log('SAVING: ', application);
  }

}
