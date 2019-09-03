import { Store } from '@ngrx/store';

import { IRoute } from '../../../../../core/cf-api.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { GetAllRoutes } from '../../../../../../../cloud-foundry/src/actions/route.actions';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { routeEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string
  ) {
    const routeEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, routeEntityType);
    const actionBuilder = routeEntity.actionOrchestrator.getActionBuilder('getMultiple');
    //TODO Kate
    const createRouteAction = actionBuilder(cfGuid, null);
    super(store, listConfig, cfGuid, createRouteAction, true);
  }

}

