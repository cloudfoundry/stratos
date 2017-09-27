import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { getEntityObservable } from '../../store/actions/api.actions';
import { ApplicationSchema, GetApplicationSummary } from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';

@Injectable()
export class ApplicationService {

  // TODO: RC OnDestroy sub.unsubscribe();?

  constructor(private store: Store<AppState>) { }

  public isFetching$: Observable<boolean>;
  public application$: Observable<any>;

  SetApplication(cfId, id) {
    this.application$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      id,
      new GetApplicationSummary(id, cfId)
    );

    this.isFetching$ = this.application$.mergeMap(({ entityRequestInfo }) => {
      return Observable.of(entityRequestInfo.fetching);
    });
  }

  UpdateApplication() {
    // TODO: RC Force an update to catch remote changes
    console.log('NOT IMPLEMENTED');
  }

}
