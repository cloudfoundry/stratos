import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { HYDRATE_DASHBOARD_STATE, HydrateDashboardStateAction } from '../actions/dashboard-actions';


@Injectable({
  providedIn: 'root'
})
export class DashboardEffect {
  private actions$ = inject(Actions);
  private appRef = inject(ApplicationRef);


   hydrate$ = createEffect(() => this.actions$.pipe(
    ofType<HydrateDashboardStateAction>(HYDRATE_DASHBOARD_STATE),
    map(() => {
      this.appRef.tick();
    })
  ), { dispatch: false });
}
