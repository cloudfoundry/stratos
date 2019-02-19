import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { SHOW_SNACK_BAR, ShowSnackBar } from '../actions/snackBar.actions';


@Injectable()
export class SnackBarEffects {
  constructor(
    private actions$: Actions,
    public snackBar: MatSnackBar
  ) { }
  @Effect({ dispatch: false }) getInfo$ = this.actions$.ofType<ShowSnackBar>(SHOW_SNACK_BAR).pipe(
    map(action => {
      const snackBarRef = this.snackBar.open(action.message, null, {
        duration: 5000
      });
    }));
}
