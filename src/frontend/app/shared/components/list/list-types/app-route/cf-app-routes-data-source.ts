import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { GetRoutes } from '../../../../../store/actions/route.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export const RouteSchema = new schema.Entity('route');

export class CfAppRoutesDataSource extends ListDataSource<APIResource> {
  public cfGuid: string;
  public appGuid: string;

  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    action: PaginatedAction,
    paginationKey: string,
    mapRoute = false
  ) {
    const action = new GetRoutes(appService.appGuid, appService.cfGuid);
    const paginationKey = getPaginationKey('route', appService.cfGuid, appService.appGuid);

    super({
      store,
      action,
      schema: RouteSchema,
      getRowUniqueId: (object: EntityInfo) =>
        object.entity ? object.entity.guid : null,
      paginationKey
    });

    this.cfGuid = appService.cfGuid;
    this.appGuid = appService.appGuid;
    if (mapRoute) {
      this.selectedRowToggle = (row: APIResource) => {
        this.selectedRows.clear();
        this.selectedRows.set(this.getRowUniqueId(row), row);
        this.isSelecting$.next(this.selectedRows.size > 0);
      };
      this.selectAllFilteredRows = () => {};
    }
  }

}
