import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationSchema, ApplicationSummarySchema } from '../../store/actions/application.actions';
import { GetApplication, GetApplicationSummary } from '../../store/actions/application.actions';
import { getEntityObservable, EntityInfo } from '../../store/actions/api.actions';
import { StackSchema, GetStack } from '../../store/actions/stack.action';
import { cnsisEntitySelector } from '../../store/actions/cnsis.actions';
import { OrganisationSchema, GetOrganisation } from '../../store/actions/organisation.action';
import { SpaceSchema, GetSpace } from '../../store/actions/space.action';

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

  constructor(private store: Store<AppState>) {
    // TODO: RC OnDestroy sub.unsubscribe();?
    console.log('INIT SERVICE, MORE THAN ONE OF THESE? TROUBLE!');
  }

  public isFetching$: Observable<boolean>;
  public application$: Observable<AppData>;

  SetApplication(cfId, id) {
    const application$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplication(id, cfId)
    ).filter(({ entity, entityRequestInfo }) => {
      return entity && entity.entity;
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
    ).map(([app, appSummary, cnsis]) => {
      return {
        fetching: app.entityRequestInfo.fetching && appSummary.entityRequestInfo.fetching,
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
