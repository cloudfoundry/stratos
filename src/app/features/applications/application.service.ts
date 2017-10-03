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
import {
  ApplicationEnvVars,
  ApplicationEnvVarsService,
  EnvVarStratosProject,
} from './application/summary-tab/application-env-vars.service';
import { ApplicationStateService } from './application/summary-tab/application-state/application-state.service';

export interface AppData {
  fetching: boolean;
  app: EntityInfo;
  space: EntityInfo;
  organisation: EntityInfo;
  appSummary: any;
  stack: EntityInfo;
  cf: any;
  appState: any;
  appEnvVars: ApplicationEnvVars;
  appEnvVarsStratosProject?: EnvVarStratosProject;
}

// export interface AppMetadataRequestState {
//   fetching: boolean;
//   updating: boolean;
//   creating: boolean;
//   error: boolean;
//   response: any;
//   message: string;
// }



@Injectable()
export class ApplicationService {

  constructor(private store: Store<AppState>, private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsService) {
    // TODO: RC OnDestroy sub.unsubscribe();?
    console.log('INIT SERVICE, MORE THAN ONE OF THESE? TROUBLE!');
  }

  public isFetching$: Observable<boolean>;
  public application$: Observable<AppData>;
  private appStats$;

  SetApplication(cfId, id) {

    //FIXME: THIS DOES NOT SPAM
    const applicationStats$ = getAppMetadataObservable(
      this.store,
      id,
      new GetAppMetadataAction(id, cfId, AppMetadataProperties.INSTANCES as AppMetadataType)
    ).filter(({ metadata, metadataRequestState }) => {
      return metadata && !metadataRequestState.fetching;
    }).flatMap(({ metadata, metadataRequestState }) => {
      return Observable.of(metadata);
    });
    // .subscribe(something => {
    //   console.log(something);
    // });

    const applicationEnvVars$ = getAppMetadataObservable(
      this.store,
      id,
      new GetAppMetadataAction(id, cfId, AppMetadataProperties.ENV_VARS as AppMetadataType)
    ).filter(({ metadata, metadataRequestState }) => {
      return metadata && !metadataRequestState.fetching;
    }).flatMap(({ metadata, metadataRequestState }) => {
      return Observable.of(metadata);
    });


    const application$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplication(id, cfId)
    )
      .filter(({ entity, entityRequestInfo }) => {
        return entity && entity.entity && !entityRequestInfo.fetching;
      })
      .flatMap(app => {
        if (app.entity.entity.state === 'STARTED' && !this.appStats$) {
          //FIXME: THIS SPAMS
          // this.appStats$ = getAppMetadataObservable(
          //   this.store,
          //   id,
          //   // TODO: RC 'instances' ok but AppMetadataProperties.INSTANCES not
          //   new GetAppMetadataAction(id, cfId, 'instances')
          // ).filter(({ metadata, metadataRequestState }) => {
          //   return metadata && !metadataRequestState.fetching;
          // })
          //   .flatMap(({ metadata, metadataRequestState }) => {
          //     return Observable.of(metadata);
          //   });
        }

        return Observable.combineLatest(Observable.of(app), this.appStats$ || Observable.of({}));
      });

    const applicationSummary$ = getEntityObservable(
      this.store,
      ApplicationSummarySchema.key,
      ApplicationSummarySchema,
      id,
      new GetApplicationSummary(id, cfId)
    ).filter(({ entity, entityRequestInfo }) => {
      return entity && entity.entity && !entityRequestInfo.fetching;
    });

    this.application$ = application$
      .combineLatest(
      applicationSummary$,
      applicationStats$,
      applicationEnvVars$,
      this.store.select(cnsisEntitySelector),
    ).map(([appDetails, appSummary, applicationStats, applicationEnvVars, cnsis]: [any, any, any, any, any]) => {
      // AppInstanceStats
      // [app, appStats]
      const app = appDetails[0];
      const appStats = applicationStats || appDetails[1];
      return {
        fetching: app.entityRequestInfo.fetching && appSummary.entityRequestInfo.fetching,
        app: app,
        space: app.entity.entity.space,
        organisation: app.entity.entity.space.entity.organization,
        appSummary: appSummary,
        stack: app.entity.entity.stack,
        cf: cnsis.find((CNSIModel) => {
          return CNSIModel.guid === app.entity.entity.cfGuid;
        }),
        appState: this.appStateService.Get(app.entity.entity, appStats),
        appEnvVars: applicationEnvVars,
        appEnvVarsStratosProject: this.appEnvVarsService.FetchStratosProject(applicationEnvVars),
      };
    });

    this.isFetching$ = this.application$.mergeMap(({ fetching }) => {
      return Observable.of(fetching);
    });

  }

  UpdateApplication() {
    // TODO: RC Force an update to catch remote changes
    console.log('NOT IMPLEMENTED');
  }

}
