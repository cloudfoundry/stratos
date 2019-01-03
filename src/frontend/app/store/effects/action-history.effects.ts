
import { take, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { ActionHistoryDump, ActionHistoryActions } from '../actions/action-history.actions';


@Injectable()
export class ActionHistoryEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect({ dispatch: false }) dumpActionHistory$ = this.actions$.ofType<ActionHistoryDump>(ActionHistoryActions.DUMP).pipe(
    map(() => {
      this.store.select('actionHistory').pipe(
        take(1))
        .subscribe();
    }));
}

