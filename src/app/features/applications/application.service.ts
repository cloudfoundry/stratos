import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityInfo, getEntityObservable } from '../../store/actions/api.actions';
import { GetAppMetadataAction, getAppMetadataObservable } from '../../store/actions/app-metadata.actions';
import { ApplicationSchema, ApplicationSummarySchema } from '../../store/actions/application.actions';
import { GetApplication, GetApplicationSummary } from '../../store/actions/application.actions';
import { cnsisEntitySelector } from '../../store/actions/cnsis.actions';
import { AppState } from '../../store/app-state';
import { ApplicationStateService } from './application-state.service';

export interface AppData {
  fetching: boolean;
  app: EntityInfo;
  space: EntityInfo;
  organisation: EntityInfo;
  appSummary: any;
  stack: EntityInfo;
  cf: any;
}

@Injectable()
export class ApplicationService {

  constructor(private store: Store<AppState>, private appStateService: ApplicationStateService) {
    // TODO: RC OnDestroy sub.unsubscribe();?
    console.log('INIT SERVICE, MORE THAN ONE OF THESE? TROUBLE!');
  }

  public isFetching$: Observable<boolean>;
  public application$: Observable<AppData>;
  private appStats$;

  SetApplication(cfId, id) {
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
          this.appStats$ = getAppMetadataObservable(
            this.store,
            id,
            // TODO: RC 'instances' ok but AppMetadataProperties.INSTANCES not
            new GetAppMetadataAction(id, cfId, 'instances')
          ).filter(({ metadata, metadataRequestState }) => {
            return metadata && !metadataRequestState.fetching;
          })
            .flatMap(({ metadata, metadataRequestState }) => {
              return Observable.of(metadata);
            });
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
      this.store.select(cnsisEntitySelector),
    ).map(([appDetails, appSummary, cnsis]: [any, any, any]) => {
      // [app, appStats]
      const app = appDetails[0];
      const appStats = appDetails[1];
      return {
        fetching: app.entityRequestInfo.fetching && appSummary.entityRequestInfo.fetching,
        appState: this.appStateService.Get(app.entity.entity, appStats),
        app: app,
        space: app.entity.entity.space,
        stack: app.entity.entity.stack,
        organisation: app.entity.entity.space.entity.organization,
        appSummary: appSummary,
        cf: cnsis.find((CNSIModel) => {
          return CNSIModel.guid === app.entity.entity.cfGuid;
        })
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
