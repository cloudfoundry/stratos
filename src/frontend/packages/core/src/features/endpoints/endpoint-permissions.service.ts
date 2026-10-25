import { Injectable, computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserRolesDataService, EndpointModel, EndpointsDataService } from '@stratosui/store';

import { StratosPermissionStrings, StratosScopeStrings } from '../../core/permissions/stratos-user-permissions.checker';
import { SessionSignalService } from '../../core/signals/session-signal.service';

/**
 * Who may manage or connect an endpoint, mirroring the rules jetstream
 * enforces so the UI offers only what the backend accepts.
 *
 * jetstream compares the creator's user id; the endpoint list carries only
 * the creator's name, so "created by me" compares names.
 */
@Injectable({ providedIn: 'root' })
export class EndpointPermissionsService {
  private session = inject(SessionSignalService);
  private roles = inject(CurrentUserRolesDataService);

  private readonly isAdmin = this.roles.stratosRole(StratosPermissionStrings.STRATOS_ADMIN);
  private readonly isEndpointAdmin = this.roles.stratosHasScope(StratosScopeStrings.STRATOS_ENDPOINTADMIN);
  private readonly userName = computed(() => this.session.sessionData()?.user?.name ?? '');

  /**
   * Edit, update TLS or unregister (POST and DELETE /api/v1/endpoints/:id).
   * A Stratos admin always. With user endpoints enabled, also an endpoint
   * admin for an endpoint they created (jetstream main.go,
   * endpointUpdateDeleteMiddleware); otherwise jetstream requires an admin.
   */
  canManage(ep: EndpointModel): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return this.session.userEndpointsEnabled() && this.isEndpointAdmin() && this.createdByMe(ep);
  }

  /**
   * Connect (POST /api/v1/tokens). Unless user endpoints are disabled, nobody,
   * admins included, may connect to a personal endpoint another user created
   * (jetstream authcnsi.go DoLoginToCNSI).
   */
  canConnect(ep: EndpointModel): boolean {
    return !this.session.userEndpointsNotDisabled() || this.isSystemEndpoint(ep) || this.createdByMe(ep);
  }

  /**
   * Connect with a token shared with every user (system_shared on POST
   * /api/v1/tokens). A Stratos admin only (jetstream authcnsi.go
   * DoLoginToCNSI).
   */
  canShareConnection(): boolean {
    return this.isAdmin();
  }

  /**
   * Disconnect (DELETE /api/v1/tokens/:id). A shared connection belongs to
   * every user, so only a Stratos admin may drop it (jetstream authcnsi.go
   * logoutOfCNSI).
   */
  canDisconnect(ep: EndpointModel): boolean {
    return !ep.system_shared_token || this.isAdmin();
  }

  private isSystemEndpoint(ep: EndpointModel): boolean {
    return !ep.creator || ep.creator.system;
  }

  private createdByMe(ep: EndpointModel): boolean {
    return !this.isSystemEndpoint(ep) && !!this.userName() && ep.creator.name === this.userName();
  }
}

/**
 * Keeps /endpoints/edit/:id to the users who may save it; others go back to
 * the endpoints list instead of filling in a form the backend refuses.
 */
export const canEditEndpointGuard: CanActivateFn = async route => {
  const endpointsData = inject(EndpointsDataService);
  const permissions = inject(EndpointPermissionsService);
  const router = inject(Router);
  await endpointsData.whenReady();
  const endpoint = endpointsData.endpoints().get(route.paramMap.get('id') ?? '');
  return endpoint && permissions.canManage(endpoint) ? true : router.createUrlTree(['/endpoints']);
};
