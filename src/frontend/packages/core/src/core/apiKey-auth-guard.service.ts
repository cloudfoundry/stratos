import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Store } from '@ngrx/store';
import { RouterNav, AppState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from './permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from './permissions/stratos-user-permissions.checker';

@Injectable()
export class APIKeyAuthGuardService implements CanActivate {

  constructor(
    private store: Store<AppState>,
    private cups: CurrentUserPermissionsService,
  ) { }

  canActivate(): Observable<boolean> {
    return this.cups.can(StratosCurrentUserPermissions.API_KEYS).pipe(
      map(can => {
        if (!can) {
          this.store.dispatch(new RouterNav({ path: ['/'] }));
        }
        return can;
      })
    );
  }
}
