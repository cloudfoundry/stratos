import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { HYDRATE_DASHBOARD_STATE, HydrateDashboardStateAction } from '../actions/dashboard-actions';
import { ThemeService } from '../theme.service';


@Injectable()
export class DashboardEffect {

  constructor(
    private actions$: Actions,
    private themeService: ThemeService
  ) { }

   hydrate$ = createEffect(() => this.actions$.pipe(
    ofType<HydrateDashboardStateAction>(HYDRATE_DASHBOARD_STATE),
    map(() => {
      // Ensure the previous theme is applied after dashboard is hydrated
      this.themeService.initialize();
    })
  ), { dispatch: false });
}
