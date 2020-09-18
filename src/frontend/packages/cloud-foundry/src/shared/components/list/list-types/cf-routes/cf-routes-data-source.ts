import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  IListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IRoute } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string
  ) {
    super(store, listConfig, cfGuid, cfEntityCatalog.route.actions.getMultiple(cfGuid, null, {}), true);
  }
}

