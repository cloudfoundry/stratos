import { Store } from '@ngrx/store';

import type { IListConfig, IListDataSource } from '@stratosui/core';
import type { APIResource, GeneralEntityAppState, PaginatedAction } from '@stratosui/store';
import type { IRoute } from '../../../../../cf-api.types';
import type { CFAppState } from '../../../../../cf-app-state';
import type { ApplicationService } from '../../../../../features/applications/application.service';
import { CfRoutesDataSourceBase, type ListCfRoute } from '../cf-routes/cf-routes-data-source-base';


export class CfAppRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<ListCfRoute>> {
  /**
   * Creates an instance of CfAppRoutesDataSource.
   * @param [genericRouteState]
   * Use the generic route state which enables the route busy ux
   */
  constructor(
    store: Store<GeneralEntityAppState>,
    appService: ApplicationService,
    action: PaginatedAction,
    listConfig: IListConfig<APIResource<ListCfRoute>>,
    genericRouteState?: boolean
  ) {
    super(store, listConfig, appService.cfGuid, action, true, appService.appGuid, genericRouteState);
  }

}
