import { Store } from '@ngrx/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type {
  IListDataSource,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { GeneralEntityAppState } from '@stratosui/store';
import type { IRoute } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { CfRoutesDataSourceBase, type ListCfRoute } from '../cf-routes/cf-routes-data-source-base';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig: IListConfig<APIResource<ListCfRoute>>,
    cfGuid: string
  ) {
    super(store, listConfig, cfGuid, cfEntityCatalog.route.actions.getMultiple(cfGuid, null, {}), true);
  }
}

