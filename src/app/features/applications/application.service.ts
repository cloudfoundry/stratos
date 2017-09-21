import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { getEntityObservable } from '../../store/actions/api.actions';

@Injectable()
export class ApplicationService {

  //TODO: RC OnDestroy sub.unsubscribe();

  constructor(private store: Store<AppState>) { }

  public isFetching$: Observable<boolean>;
  public application$: Observable<any>;

  SetApplication(cfId, id) {
    this.application$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplication(id, cfId)
    );

    this.isFetching$ = this.application$.mergeMap(({ entityRequestInfo }) => {
      return Observable.of(entityRequestInfo.fetching);
    });
  }

  UpdateApplication() {
    //TODO: RC Force an update to catch remote changes
    console.log('NOT IMPLEMENTED');
  }

}
