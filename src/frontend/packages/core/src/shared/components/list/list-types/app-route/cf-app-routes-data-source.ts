import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { IRoute } from '../../../../../core/cf-api.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';
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
