import { Store } from '@ngrx/store';

import { GetAllRoutes } from '../../../../../../../cloud-foundry/src/actions/route.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { IRoute } from '../../../../../../../core/src/core/cf-api.types';
import {
  IListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string
  ) {
    super(store, listConfig, cfGuid, new GetAllRoutes(cfGuid), true);
  }

}

