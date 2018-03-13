import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getMappedApps, isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, routeSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfAppRoutesDataSource extends ListDataSource<APIResource> {
  public cfGuid: string;
  public appGuid: string;

  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    action: PaginatedAction,
    paginationKey: string,
    mapRoute = false,
    listConfig: IListConfig<APIResource>
  ) {
    super({
      store,
      action,
      schema: entityFactory(routeSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      listConfig,
      transformEntity: map((routes) => {
        routes = routes.map(route => {
          let newRoute = route;
          if (!route.entity.isTCPRoute || !route.entity.mappedAppsCount) {
            newRoute = {
              ...route,
              entity: {
                ...route.entity,
                isTCPRoute: isTCPRoute(route),
                mappedAppsCount: getMappedApps(route).length
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
    if (mapRoute) {
      this.selectedRowToggle = (row: APIResource) => {
        this.selectedRows.clear();
        this.selectedRows.set(this.getRowUniqueId(row), row);
        this.isSelecting$.next(this.selectedRows.size > 0);
      };
      this.selectAllFilteredRows = () => { };
    }
  }

}
