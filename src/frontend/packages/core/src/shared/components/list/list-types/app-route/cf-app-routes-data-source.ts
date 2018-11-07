import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getMappedApps, isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { entityFactory, routeSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';

export class CfAppRoutesDataSource extends ListDataSource<APIResource> {
  public cfGuid: string;
  public appGuid: string;

  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    action: PaginatedAction,
    listConfig: IListConfig<APIResource>
  ) {
    super({
      store,
      action,
      schema: entityFactory(routeSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntity: map((routes) => {
        routes = routes.map(route => {
          let newRoute = route;
          if (!route.entity.isTCPRoute || !route.entity.mappedAppsCount) {
            const apps = route.entity.apps;
            const foundApp = !!apps && (apps.findIndex(a => a.metadata.guid === appService.appGuid) >= 0);
            const mappedAppsCount = foundApp ? Number.MAX_SAFE_INTEGER : getMappedApps(route).length;
            const mappedAppsCountLabel = foundApp ? `Already attached` : mappedAppsCount;
            newRoute = {
              ...route,
              entity: {
                ...route.entity,
                isTCPRoute: isTCPRoute(route),
                mappedAppsCount,
                mappedAppsCountLabel
              }
            };
          }
          return newRoute;
        });
        return routes;
      })
    });

    this.cfGuid = appService.cfGuid;
    this.appGuid = appService.appGuid;
  }

}
