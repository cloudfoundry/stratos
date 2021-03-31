import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { SessionService } from '../../../shared/services/session.service';

type EndpointObservable = Observable<{
  names: string[],
  urls: string[],
}>;

export class CreateEndpointHelperComponent {

  userEndpointsAndIsAdmin: Observable<boolean>;
  customEndpoints: EndpointObservable;

  constructor(
    public sessionService: SessionService,
    public currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    const currentPage$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$;
    const existingAdminEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => ep.creator.admin).map(ep => ep.name),
        urls: endpoints.filter(ep => ep.creator.admin).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    const existingUserEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => !ep.creator.admin).map(ep => ep.name),
        urls: endpoints.filter(ep => !ep.creator.admin).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    const existingEndpoints = currentPage$.pipe(
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
      existingEndpoints,
      existingAdminEndpoints,
      existingUserEndpoints
    ]).pipe(
      map(([userEndpointsEnabled, admin, endpoints, adminEndpoints, userEndpoints]) => {
        if (userEndpointsEnabled){
          if (admin){
            return adminEndpoints;
          }else{
            return userEndpoints;
          }
        }
        return endpoints;
      })
    );

  }
}
