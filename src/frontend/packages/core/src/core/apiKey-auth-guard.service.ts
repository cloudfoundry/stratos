import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from './permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from './permissions/stratos-user-permissions.checker';

export const apiKeyAuthGuard: CanActivateFn = (): Observable<boolean> => {
  const router = inject(Router);
  const cups = inject(CurrentUserPermissionsService);

  return cups.can(StratosCurrentUserPermissions.API_KEYS).pipe(
    map(can => {
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
