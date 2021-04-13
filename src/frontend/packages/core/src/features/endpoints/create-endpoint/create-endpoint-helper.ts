import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { SessionService } from '../../../shared/services/session.service';

type EndpointObservable = Observable<{
  names: string[],
  urls: string[],
}>;

export class CreateEndpointHelperComponent {

  userEndpointsAndIsAdmin: Observable<boolean>;
  customEndpoints: EndpointObservable;
  existingSystemEndpoints: EndpointObservable;
  existingPersonalEndpoints: EndpointObservable;
  existingEndpoints: EndpointObservable;

  constructor(
    public sessionService: SessionService,
    public currentUserPermissionsService: CurrentUserPermissionsService,
    public userProfileService: UserProfileService
  ) {
    const currentPage$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$;
    this.existingSystemEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => ep.creator.system).map(ep => ep.name),
        urls: endpoints.filter(ep => ep.creator.system).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    this.existingPersonalEndpoints = combineLatest([
      currentPage$,
      this.userProfileService.userProfile$
    ]).pipe(
      map(([endpoints, profile]) => ({
        names: endpoints.filter(ep => !ep.creator.system && ep.creator.name === profile.userName).map(ep => ep.name),
        urls: endpoints.filter(ep => !ep.creator.system && ep.creator.name === profile.userName).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    this.existingEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.map(ep => ep.name),
        urls: endpoints.map(ep => getFullEndpointApiUrl(ep)),
      }))
    );

    const isAdmin = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT);
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
