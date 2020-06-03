import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  domainEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  IListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
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
    )
    action.initialParams['order-direction-field'] = 'creation';
    super(store, listConfig, cfGuid, action, false);
  }

}

