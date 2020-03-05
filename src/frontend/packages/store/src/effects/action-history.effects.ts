import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { ActionHistoryActions, ActionHistoryDump } from '../actions/action-history.actions';
import { InternalAppState } from '../app-state';


@Injectable()
export class ActionHistoryEffect {

  constructor(
    private actions$: Actions,
    private store: Store<InternalAppState>,
  ) { }

  @Effect({ dispatch: false }) dumpActionHistory$ = this.actions$.pipe(
    ofType<ActionHistoryDump>(ActionHistoryActions.DUMP),
    map(() => {
      this.store.select('actionHistory').pipe(
        take(1))
        .subscribe();
    }));
}

