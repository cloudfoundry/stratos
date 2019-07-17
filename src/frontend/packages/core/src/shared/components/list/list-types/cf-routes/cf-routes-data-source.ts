import { Store } from '@ngrx/store';

import { IRoute } from '../../../../../core/cf-api.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { GetAllRoutes } from '../../../../../../../cloud-foundry/src/actions/route.actions';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string
  ) {
    super(store, listConfig, cfGuid, new GetAllRoutes(cfGuid), true);
  }

}

