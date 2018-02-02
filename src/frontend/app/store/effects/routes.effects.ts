import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { AppState } from './../app-state';

@Injectable()
export class RoutesEffects {
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {}
}
