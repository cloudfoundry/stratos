import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RouterNav } from '../../../store/src/actions/router.actions';
import { AppState } from '../../../store/src/app-state';
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