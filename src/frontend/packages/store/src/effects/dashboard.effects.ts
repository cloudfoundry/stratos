import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { HYDRATE_DASHBOARD_STATE, type HydrateDashboardStateAction } from '../actions/dashboard-actions';
import { ThemeService } from '../theme.service';


@Injectable({
  providedIn: 'root'
})
export class DashboardEffect {

  constructor(
    private actions$: Actions,
    private themeService: ThemeService,
    private appRef: ApplicationRef,
  ) { }

   hydrate$ = createEffect(() => this.actions$.pipe(
    ofType<HydrateDashboardStateAction>(HYDRATE_DASHBOARD_STATE),
    map(() => {
      // Ensure the previous theme is applied after dashboard is hydrated
      this.themeService.initialize();
      this.appRef.tick();
    })
  ), { dispatch: false });
}
