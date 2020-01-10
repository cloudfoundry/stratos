import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { ThemeService } from '../../../core/src/core/theme.service';
import { HYDRATE_DASHBOARD_STATE, HydrateDashboardStateAction } from '../actions/dashboard-actions';


@Injectable()
export class DashboardEffect {

  constructor(
    private actions$: Actions,
    private themeService: ThemeService
  ) { }

  @Effect({ dispatch: false }) hydrate$ = this.actions$.pipe(
    ofType<HydrateDashboardStateAction>(HYDRATE_DASHBOARD_STATE),
    map(() => {
      // Ensure the previous theme is applied after dashboard is hydrated
      this.themeService.initialize();
    })
  );
}
