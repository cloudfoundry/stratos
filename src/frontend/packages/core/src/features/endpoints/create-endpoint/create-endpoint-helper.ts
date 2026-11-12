import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Injector } from '@angular/core';

import { EndpointsDataService, endpointUrlKey, getFullEndpointApiUrl, UserProfileInfo } from '@stratosui/store';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { SessionService } from '../../../shared/services/session.service';

type EndpointObservable = Observable<{
  names: string[],
  /** Address keys (endpointUrlKey): compare a typed address through urlKey. */
  urls: string[],
}>;

export class CreateEndpointHelperComponent {

  userEndpointsAndIsAdmin: Observable<boolean>;
  customEndpoints: EndpointObservable;
  existingSystemEndpoints: EndpointObservable;
  existingPersonalEndpoints: EndpointObservable;
  existingEndpoints: EndpointObservable;
  readonly urlKey = endpointUrlKey;

  constructor(
    public sessionService: SessionService,
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
    const currentPage$ = toObservable(endpointsData.endpointsList, { injector });
    this.existingSystemEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => ep.creator.system).map(ep => ep.name),
        urls: endpoints.filter(ep => ep.creator.system).map(ep => endpointUrlKey(getFullEndpointApiUrl(ep))),
      }))
    );
    // The personal endpoints are matched on the user's name, so they wait for
    // the profile.
    this.userProfileService.loadUserProfile();
    const userProfile$ = toObservable(this.userProfileService.userProfile, { injector }).pipe(
      filter((profile): profile is UserProfileInfo => !!profile)
    );
    this.existingPersonalEndpoints = combineLatest([
      currentPage$,
      userProfile$
    ]).pipe(
      map(([endpoints, profile]) => ({
        names: endpoints.filter(ep => !ep.creator.system && ep.creator.name === profile.userName).map(ep => ep.name),
        urls: endpoints.filter(ep => !ep.creator.system && ep.creator.name === profile.userName).map(ep => endpointUrlKey(getFullEndpointApiUrl(ep))),
      }))
    );
    this.existingEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.map(ep => ep.name),
        urls: endpoints.map(ep => endpointUrlKey(getFullEndpointApiUrl(ep))),
      }))
    );

    const isAdmin = toObservable(
      this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT),
      { injector },
    );
    const userEndpointsNotDisabled = this.sessionService.userEndpointsNotDisabled();

    this.userEndpointsAndIsAdmin = combineLatest([
      isAdmin,
      userEndpointsNotDisabled
    ]).pipe(
      map(([admin, userEndpoints]) => admin && userEndpoints)
    );

    this.customEndpoints = combineLatest([
      userEndpointsNotDisabled,
      isAdmin,
      this.existingEndpoints,
      this.existingSystemEndpoints,
      this.existingPersonalEndpoints
    ]).pipe(
      map(([userEndpointsEnabled, admin, endpoints, systemEndpoints, personalEndpoints]) => {
        if (userEndpointsEnabled){
          if (admin){
            return systemEndpoints;
          }else{
            return personalEndpoints;
          }
        }
        return endpoints;
      })
    );

  }
}
