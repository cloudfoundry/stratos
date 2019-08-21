import { Store } from '@ngrx/store';

import {
  applicationEntityType,
  domainEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetSpaceRoutes } from '../../../../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IRoute } from '../../../../../core/cf-api.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';


export class CfSpaceRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
    spaceGuid: string,
    cfGuid: string
  ) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const routeEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, routeEntityType);
    const actionBuilder = routeEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(spaceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(routeEntityType, applicationEntityType),
      createEntityRelationKey(routeEntityType, domainEntityType),
    ], true, false) as PaginatedAction;
    
    action.initialParams['order-direction-field'] = 'creation';
    super(store, listConfig, cfGuid, action, false);
  }

}

