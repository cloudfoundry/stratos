import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthDataService, observeSignal } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { CurrentUserPermissionsService } from './permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from './permissions/stratos-user-permissions.checker';

export const apiKeyAuthGuard: CanActivateFn = (): Observable<boolean> => {
  const router = inject(Router);
  const canUseKeys = inject(CurrentUserPermissionsService).can(StratosCurrentUserPermissions.API_KEYS);

  // The check reads false until the session is verified, so answer only
  // once it is. The user's roles are applied before the session is set.
  return observeSignal(inject(AuthDataService).sessionData, inject(Injector)).pipe(
    filter(sessionData => !!sessionData),
    take(1),
    map(() => {
      const can = canUseKeys();
      if (!can) {
        router.navigate(['/']);
      }
      return can;
    })
  );
};

// Legacy class-based guard for backward compatibility during migration
// @deprecated Use apiKeyAuthGuard functional guard instead
export const APIKeyAuthGuardService = apiKeyAuthGuard;
