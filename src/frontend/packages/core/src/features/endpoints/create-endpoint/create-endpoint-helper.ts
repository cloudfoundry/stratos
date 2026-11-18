import { Injector, Signal, computed } from '@angular/core';

import { EndpointModel, EndpointsDataService, endpointUrlKey, getFullEndpointApiUrl } from '@stratosui/store';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { SessionSignalService } from '../../../core/signals/session-signal.service';
import { UserProfileService } from '../../../core/user-profile.service';

/** Endpoint names and address keys (endpointUrlKey: compare a typed address through urlKey). */
export interface ExistingEndpoints {
  names: string[];
  urls: string[];
}

const summarize = (endpoints: EndpointModel[]): ExistingEndpoints => ({
  names: endpoints.map(ep => ep.name),
  urls: endpoints.map(ep => endpointUrlKey(getFullEndpointApiUrl(ep))),
});

export class CreateEndpointHelperComponent {

  existingEndpointsSignal: Signal<ExistingEndpoints>;
  existingSystemEndpointsSignal: Signal<ExistingEndpoints>;
  /** Null until the user's profile is known. */
  existingPersonalEndpointsSignal: Signal<ExistingEndpoints | null>;
  /** Null until the user's profile is known, as it needs the personal list. */
  customEndpointsSignal: Signal<ExistingEndpoints | null>;
  userEndpointsAndIsAdminSignal: Signal<boolean>;

  readonly urlKey = endpointUrlKey;

  constructor(
    public currentUserPermissionsService: CurrentUserPermissionsService,
    public userProfileService: UserProfileService,
    // W36-B Wave 3: optional EndpointsDataService + Injector params.
    // When supplied, the existing-endpoints projection comes from the
    // signal-native service; when omitted (legacy callers not yet
    // threaded), the helper would have failed before this wave too —
    // there's no fallback path because the catalog read is gone.
    endpointsData?: EndpointsDataService,
    injector?: Injector,
  ) {
    if (!endpointsData || !injector) {
      throw new Error('CreateEndpointHelperComponent requires EndpointsDataService + Injector — supply them via the subclass super() call.');
    }
    const endpoints = endpointsData.endpointsList;
    this.existingEndpointsSignal = computed(() => summarize(endpoints()));
    this.existingSystemEndpointsSignal = computed(() => summarize(endpoints().filter(ep => ep.creator.system)));
    // The personal endpoints are matched on the user's name, so they wait for
    // the profile.
    this.userProfileService.loadUserProfile();
    const userProfile = this.userProfileService.userProfile;
    this.existingPersonalEndpointsSignal = computed(() => {
      const profile = userProfile();
      return profile
        ? summarize(endpoints().filter(ep => !ep.creator.system && ep.creator.name === profile.userName))
        : null;
    });

    const isAdmin = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT);
    const userEndpointsNotDisabled = injector.get(SessionSignalService).userEndpointsNotDisabled;
    this.userEndpointsAndIsAdminSignal = computed(() => isAdmin() && userEndpointsNotDisabled());
    this.customEndpointsSignal = computed(() => {
      const personal = this.existingPersonalEndpointsSignal();
      if (!personal) {
        return null;
      }
      if (!userEndpointsNotDisabled()) {
        return this.existingEndpointsSignal();
      }
      return isAdmin() ? this.existingSystemEndpointsSignal() : personal;
    });
  }
}
