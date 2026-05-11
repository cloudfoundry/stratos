import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs/operators';

import {
  CurrentUserPermissions,
  PermissionConfigType,
} from '../permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../permissions/current-user-permissions.service';

/**
 * Signal-native facade over `CurrentUserPermissionsService.can(...)`.
 *
 * Returns `Signal<boolean>` instead of `Observable<boolean>` so consumers
 * (template bindings, `computed(...)` chains) can read permission state
 * synchronously without subscribing.
 *
 * The underlying permission-check pipeline (StratosUserPermissionsChecker
 * + custom checkers) is unchanged — this service only adapts the output
 * shape.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsSignalService {
  private permissions = inject(CurrentUserPermissionsService);

  /**
   * Permission check as a signal.
   *
   * @param action Permission key or full `PermissionConfigType`.
   * @param endpointGuid Optional endpoint scope for the check.
   * @param args Forwarded to the underlying checker (org/space guids etc.).
   * @returns Signal that emits `false` until the first check resolves, then
   *   tracks the permission as the underlying state changes.
   */
  can(
    action: CurrentUserPermissions | PermissionConfigType,
    endpointGuid?: string,
    ...args: any[]
  ): Signal<boolean> {
    const obs$ = this.permissions
      .can(action, endpointGuid, ...args)
      .pipe(distinctUntilChanged());
    return toSignal(obs$, { initialValue: false });
  }
}
