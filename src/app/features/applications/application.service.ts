import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { getEntityObservable } from '../../store/actions/api.actions';
import { StackSchema, GetStack } from '../../store/actions/stack.action';
import { cnsisEntitySelector } from '../../store/actions/cnsis.actions';

@Injectable()
export class ApplicationService {

  constructor(private store: Store<AppState>) {
    // TODO: RC OnDestroy sub.unsubscribe();?
    console.log('INIT SERVICE, MORE THAN ONE OF THESE? TROUBLE!');
  }

  public isFetching$: Observable<boolean>;
  public application$: Observable<any>;
  public stack$: Observable<any> = Observable.of({});
  public cnsi$: Observable<any>;

  SetApplication(cfId, id) {
    this.application$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplication(id, cfId)
    );
    // .withLatestFrom(this.store.select(cnsisEntitySelector));//FIXME:

    // this.stack$ = Observable.create((subscriber: 

    //   someRequest.subscribe(val => {
    //       console.log("correct one");
    //       subscriber.next("push something");
    //   }, (err) => {
    //       console.log("error handling");
    //       subscriber.next("push some error");
    //   });
    // });

    // this.cnsi$ = getEntityObservable(
    //   this.store,
    //   CnsiSchema.key,
    //   CnsiSchema,
    //   cfId
    //   new GetCnsi(cfId)
    // );




    // this.application$.subscribe(({ entity, entityRequestInfo }) => {
    //   const application = entity;
    //   if (application.stack_guid) {
    //     console.log('1SETTING');
    //     this.stack$ = getEntityObservable(
    //       this.store,
    //       StackSchema.key,
    //       StackSchema,
    //       application.stack_guid,
    //       new GetStack(application.stack_guid, cfId)
    //     );
    //   }
    // });

    this.isFetching$ = this.application$.mergeMap(({ entityRequestInfo }) => {
      return Observable.of(entityRequestInfo.fetching);
    });
  }

  UpdateApplication() {
    // TODO: RC Force an update to catch remote changes
    console.log('NOT IMPLEMENTED');
  }

}
