import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { HIDE_SNACK_BAR, HideSnackBar, SHOW_SNACK_BAR, ShowSnackBar } from '../actions/snackBar.actions';


@Injectable()
export class SnackBarEffects {
  constructor(
    private actions$: Actions,
    public snackBar: MatSnackBar
  ) { }

  private snackBars: MatSnackBarRef<SimpleSnackBar>[] = [];

  @Effect({ dispatch: false }) showSnackBar$ = this.actions$.pipe(
    ofType<ShowSnackBar>(SHOW_SNACK_BAR),
    map(action => this.snackBars.push(this.snackBar.open(action.message, action.closeMessage, {
      duration: action.closeMessage ? null : 5000
    }))));

  @Effect({ dispatch: false }) hideSnackBar$ = this.actions$.pipe(
    ofType<HideSnackBar>(HIDE_SNACK_BAR),
    map(() => this.snackBars.forEach(snackBar => snackBar.dismiss()))
  );
}
