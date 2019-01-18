import { Store } from '@ngrx/store';

import { IRoute } from '../../../../../core/cf-api.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';

export class CfAppRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {
  /**
   * Creates an instance of CfAppRoutesDataSource.
   * @param {boolean} [genericRouteState]
   * Use the generic route state which enables the route busy ux
   * @memberof CfAppRoutesDataSource
   */
  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    action: PaginatedAction,
    listConfig: IListConfig<APIResource>,
    genericRouteState?: boolean
  ) {
    super(store, listConfig, appService.cfGuid, action, true, appService.appGuid, genericRouteState);
  }

}
