import { Injectable, Signal, inject } from '@angular/core';

import {
  CurrentUserPermissions,
  PermissionConfigType,
} from '../permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../permissions/current-user-permissions.service';

/**
 * Permission checks as signals. `CurrentUserPermissionsService.can()` now
 * returns a signal itself; this service passes through to it.
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
   */
  can(
    action: CurrentUserPermissions | PermissionConfigType,
    endpointGuid?: string,
    ...args: any[]
  ): Signal<boolean> {
    return this.permissions.can(action, endpointGuid, ...args);
  }
}
