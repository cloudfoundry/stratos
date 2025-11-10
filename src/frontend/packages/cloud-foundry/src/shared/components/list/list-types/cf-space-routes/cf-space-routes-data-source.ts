import { Store } from '@ngrx/store';
import { IListDataSource, IListConfig } from '@stratosui/core';
import { APIResource } from '@stratosui/store';

import { CFAppState } from '../../../../../cf-app-state';
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
import { IRoute } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfSpaceRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
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

