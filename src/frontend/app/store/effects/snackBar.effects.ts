
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Actions, Effect } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { ShowSnackBar, SHOW_SNACK_BAR } from '../actions/snackBar.actions';
import { MatSnackBar } from '@angular/material';
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
