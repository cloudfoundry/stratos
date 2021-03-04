import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { SessionService } from '../../../shared/services/session.service';

type EndpointObservable = Observable<{
  names: string[],
  urls: string[],
}>;

export class CreateEndpointHelperComponent {

  overwritePermission: Observable<StratosCurrentUserPermissions[]>;
  existingEndpoints: EndpointObservable;
  existingAdminEndpoints: EndpointObservable;

  constructor(
    public sessionService: SessionService
  ) {
    const currentPage$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$;
    this.existingAdminEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => ep.creator.admin).map(ep => ep.name),
        urls: endpoints.filter(ep => ep.creator.admin).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    this.existingEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.map(ep => ep.name),
        urls: endpoints.map(ep => getFullEndpointApiUrl(ep)),
      }))
    );

    this.overwritePermission = this.sessionService.userEndpointsNotDisabled().pipe(
      map(enabled => enabled ? [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT] : [])
    );
  }
}
