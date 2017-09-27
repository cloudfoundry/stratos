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
    )
      .filter(({ entity, entityRequestInfo }) => {// TODO: RC replace with skipWhile?
        // return entityRequestInfo.fetching === false;
        return entity && entity.entity;
      })
      .flatMap(app => {
        return Observable.combineLatest(
          Observable.of(app),
          getEntityObservable(
            this.store,
            SpaceSchema.key,
            SpaceSchema,
            app.entity.entity.space,
            new GetSpace(app.entity.entity.space, cfId)
          )
        );
      }).flatMap(([app, space]) => {
        return Observable.combineLatest(
          Observable.of(app),
          Observable.of(space),
          getEntityObservable(
            this.store,
            StackSchema.key,
            StackSchema,
            app.entity.entity.stack_guid,
            new GetStack(app.entity.entity.stack_guid, cfId)
          ),
          getEntityObservable(
            this.store,
            OrganisationSchema.key,
            OrganisationSchema,
            space.entity.entity.organization_guid,
            new GetSpace(space.entity.entity.organization_guid, cfId)
          )
        );
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

    // getEntityObservable(
    //   this.store,
    //   OrganisationSchema.key,
    //   OrganisationSchema,
    //   id,
    //   new GetOrganisation(id, cfId)
    // );



    // this.application$ = application$.withLatestFrom(applicationSummary$)
    // .flatMap(result => {

    // })

    // , spaces, organisations
    this.application$ = application$
      .combineLatest(
      applicationSummary$,
      this.store.select(cnsisEntitySelector),
    ).map(([[app, space, stack, organisation], appSummary, cnsis]) => {
      return {
        fetching: app.entityRequestInfo.fetching && appSummary.entityRequestInfo.fetching,
        app: app,
        space: space,
        stack: stack,
        organisation: organisation,
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
