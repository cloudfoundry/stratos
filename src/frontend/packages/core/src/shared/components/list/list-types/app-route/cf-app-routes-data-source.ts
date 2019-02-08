import { Store } from '@ngrx/store';

import { IRoute } from '../../../../../core/cf-api.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { CfRoutesDataSourceBase } from '../../../../../../../../app/shared/components/list/list-types/cf-routes/cf-routes-data-source-base';


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
