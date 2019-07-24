import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { ActionHistoryActions, ActionHistoryDump } from '../actions/action-history.actions';



@Injectable()
export class ActionHistoryEffect {

  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
  ) { }

  @Effect({ dispatch: false }) dumpActionHistory$ = this.actions$.pipe(
    ofType<ActionHistoryDump>(ActionHistoryActions.DUMP),
    map(() => {
      this.store.select('actionHistory').pipe(
        take(1))
        .subscribe();
    }));
}

