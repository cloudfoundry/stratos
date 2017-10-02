import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { EntityInfo, getEntityObservable } from '../../store/actions/api.actions';
import {
  ApplicationSchema,
  ApplicationStatsSchema,
  ApplicationSummarySchema,
} from '../../store/actions/application.actions';
import { GetApplication, GetApplicationStats, GetApplicationSummary } from '../../store/actions/application.actions';
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
          this.appStats$ = getEntityObservable(
            this.store,
            ApplicationStatsSchema.key,
            ApplicationStatsSchema,
            id,
            new GetApplicationStats(id, cfId)
          ).filter(({ entity, entityRequestInfo }) => {
            return entity && entity.entity && !entityRequestInfo.fetching;
          });
          // this.appStats$ = this.appStats$ || ;
        }

        // Observable.of({ entity: { entity: [] } })
        return Observable.combineLatest(Observable.of(app), this.appStats$ || Observable.of({ entity: { entity: [] } }));
      });

    const applicationSummary$ = getEntityObservable(
      this.store,
      ApplicationSummarySchema.key,
      ApplicationSummarySchema,
      id,
      new GetApplicationSummary(id, cfId)
    ).filter(({ entity, entityRequestInfo }) => {
      return entityRequestInfo.fetching === false;
    });

    this.application$ = application$
      .combineLatest(
      applicationSummary$,
      this.store.select(cnsisEntitySelector),
    ).map(([appDetails, appSummary, cnsis]) => {
      // [app, appStats]
      const app = appDetails[0];
      const appStats = appDetails[1];
      return {
        fetching: app.entityRequestInfo.fetching && appSummary.entityRequestInfo.fetching,
        appState: this.appStateService.Get(app.entity.entity, []),
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
