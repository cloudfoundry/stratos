import { Store } from '@ngrx/store';
import type { IListDataSource, IListConfig } from '@stratosui/core';
import type { APIResource, GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../cf-app-state';
import {
  applicationEntityType,
  domainEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../entity-relations/entity-relations.types';
import type { IRoute } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { CfRoutesDataSourceBase, type ListCfRoute } from '../cf-routes/cf-routes-data-source-base';


export class CfSpaceRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig: IListConfig<APIResource<ListCfRoute>>,
    spaceGuid: string,
    cfGuid: string
  ) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const action = cfEntityCatalog.route.actions.getAllInSpace(
      spaceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(routeEntityType, applicationEntityType),
      createEntityRelationKey(routeEntityType, domainEntityType),
    ], true, false
    );
    action.initialParams['order-direction-field'] = 'creation';
    super(store, listConfig, cfGuid, action, false);
  }

}

