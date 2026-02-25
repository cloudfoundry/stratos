import { Store } from '@ngrx/store';

import { IListConfig, IListDataSource } from '@stratosui/core';
import { APIResource, PaginatedAction } from '@stratosui/store';
import { IRoute } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfAppRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {
  /**
   * Creates an instance of CfAppRoutesDataSource.
   * @param [genericRouteState]
   * Use the generic route state which enables the route busy ux
   */
  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    action: PaginatedAction,
    listConfig: IListConfig<APIResource>,
    genericRouteState?: boolean
  ) {
    super(store, listConfig, appService.cfGuid, action, true, appService.appGuid, genericRouteState);
  }

}
