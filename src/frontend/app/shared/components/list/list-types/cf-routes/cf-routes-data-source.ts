import { Store } from '@ngrx/store';

import { IRoute } from '../../../../../core/cf-api.types';
import { GetAllRoutes } from '../../../../../store/actions/route.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string
  ) {
    super(store, listConfig, cfGuid, new GetAllRoutes(cfGuid), true);
  }

}

