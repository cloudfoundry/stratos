import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { SHOW_SNACK_BAR, ShowSnackBar } from '../actions/snackBar.actions';


@Injectable()
export class SnackBarEffects {
  constructor(
    private actions$: Actions,
    public snackBar: MatSnackBar
  ) { }
  @Effect({ dispatch: false }) getInfo$ = this.actions$.pipe(
    ofType<ShowSnackBar>(SHOW_SNACK_BAR),
    map(action => {
      const snackBarRef = this.snackBar.open(action.message, null, {
        duration: 5000
      });
    }));
}
