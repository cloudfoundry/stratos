import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState, RouterNav } from '@stratosui/store';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from './permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from './permissions/stratos-user-permissions.checker';

export const apiKeyAuthGuard: CanActivateFn = (): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const cups = inject(CurrentUserPermissionsService);

  return cups.can(StratosCurrentUserPermissions.API_KEYS).pipe(
    map(can => {
      if (!can) {
        store.dispatch(new RouterNav({ path: ['/'] }));
      }
      return can;
    })
  );
};

// Legacy class-based guard for backward compatibility during migration
// @deprecated Use apiKeyAuthGuard functional guard instead
export const APIKeyAuthGuardService = apiKeyAuthGuard;
