import { Store } from '@ngrx/store';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState, PaginatedAction, selectSessionData } from '@stratosui/store';

const ENTITY_TYPE_DEFAULT_MAX = 600;

export const cfMaxedStateHandlers = {
  canIgnoreMaxedState: (store: Store<AppState>) =>
    store.select(selectSessionData()).pipe(
      map(sessionData => !!sessionData.config.listAllowLoadMaxed),
    ),

  maxedStateStartAt: (store: Store<AppState>, action: PaginatedAction) => {
    if (!action.flattenPaginationMax) {
      return of(null);
    }
    const beValue$ = store.select(selectSessionData()).pipe(
      map(sessionData => sessionData.config.listMaxSize),
    );
    const userOverride$ = of(null);
    return combineLatest([beValue$, userOverride$]).pipe(
      map(([beValue, userOverride]) => userOverride || beValue || ENTITY_TYPE_DEFAULT_MAX),
    );
  },
};
