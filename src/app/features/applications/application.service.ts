import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityInfo, getEntityObservable } from '../../store/actions/api.actions';
import {
  AppMetadataProperties,
  AppMetadataType,
  GetAppMetadataAction,
  getAppMetadataObservable,
} from '../../store/actions/app-metadata.actions';
import { ApplicationSchema, ApplicationSummarySchema } from '../../store/actions/application.actions';
import { GetApplication, GetApplicationSummary } from '../../store/actions/application.actions';
import { cnsisEntitySelector } from '../../store/actions/cnsis.actions';
import { AppState } from '../../store/app-state';
import { ApplicationEnvVarsService } from './application/summary-tab/application-env-vars.service';
import { ApplicationStateService } from './application/summary-tab/application-state/application-state.service';

export interface AppData {
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
    // TODO: RC OnDestroy sub.unsubscribe();?
    console.log('INIT SERVICE, MORE THAN ONE OF THESE? TROUBLE!');
  }

  public isFetchingApp$: Observable<boolean>;
  public isFetchingAll$: Observable<boolean>;

  public application$: Observable<AppData>;
  public applicationEnvVars$: Observable<any>;
  public applicationStats$: Observable<any>;
  public applicationSummary$: Observable<any>;

  private completeRequest(value, requestInfo: { fetching: boolean }) {
    return requestInfo && !requestInfo.fetching && value;
  }

  SetApplication(cfId, id) {

    // First set up all the base observables
    const app$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplication(id, cfId)
    );

    const appSummary$ = getEntityObservable(
      this.store,
      ApplicationSummarySchema.key,
      ApplicationSummarySchema,
      id,
      new GetApplicationSummary(id, cfId)
    );

    const appStats$ = getAppMetadataObservable(
      this.store,
      id,
      new GetAppMetadataAction(id, cfId, AppMetadataProperties.INSTANCES as AppMetadataType)
    );

    const appEnvVars$ = getAppMetadataObservable(
      this.store,
      id,
      new GetAppMetadataAction(id, cfId, AppMetadataProperties.ENV_VARS as AppMetadataType)
    );

    const appStatsGated$ = app$
      .first(app => {
        return app && app.entity && app.entity.entity && app.entity.entity.state === 'STARTED';
      })
      // See: https://github.com/ReactiveX/rxjs/issues/1759 for why we have this delay
      .delay(1)
      .mergeMap(app => {
        return appStats$;
      });

    // Assign/Amalgamate them to public properties (with mangling if required)

    this.application$ = app$
      .combineLatest(
      this.store.select(cnsisEntitySelector),
    ).filter(([{ entity, entityRequestInfo }, cnsis]: [any, any]) => {
      return this.completeRequest(entity, entityRequestInfo) && cnsis;
    }).map(([{ entity, entityRequestInfo }, cnsis]: [any, any]) => {
      return {
        app: entity,
        space: entity.entity.space,
        organisation: entity.entity.space.entity.organization,
        stack: entity.entity.stack,
        cf: cnsis.find((CNSIModel) => {
          return CNSIModel.guid === entity.entity.cfGuid;
        }),
      };
    });

    this.applicationStats$ = app$.combineLatest(appStatsGated$)
      .filter(([{ entity, entityRequestInfo }, { metadata, metadataRequestState }]) => {
        return this.completeRequest(entity, entityRequestInfo) &&
          this.completeRequest(metadata, metadataRequestState);
      })
      .map(([{ entity, entityRequestInfo }, { metadata, metadataRequestState }]) => {
        return this.appStateService.Get(entity.entity, metadata);
      });

    this.applicationEnvVars$ = appEnvVars$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars.metadata);
    });

    this.applicationSummary$ = appSummary$
      .filter(appSummary => {
        return this.completeRequest(appSummary.entity, appSummary.entityRequestInfo);
      })
      .map(appSummary => appSummary.entity);

    this.isFetchingApp$ = app$.map(({ entity, entityRequestInfo }) => {
      return !this.completeRequest(entity, entityRequestInfo);
    });
    // this.isFetchingAll$ = app$.combineLatest(app$, appSummary$, appEnvVars$)  => {
    //   return !entityRequestInfo || entityRequestInfo.fetching;
    // });

  }

  UpdateApplication() {
    // TODO: RC Force an update to catch remote changes
    console.log('NOT IMPLEMENTED');
  }

}
