import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { SetListStateAction } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';

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
    store.dispatch(new SetListStateAction(paginationKey, 'table'));

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
