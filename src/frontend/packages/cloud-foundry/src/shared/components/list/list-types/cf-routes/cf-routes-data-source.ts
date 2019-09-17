import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { IRoute } from '../../../../../../../core/src/core/cf-api.types';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  IListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { routeEntityType } from '../../../../../cf-entity-factory';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string
  ) {
    const routeEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, routeEntityType);
    const actionBuilder = routeEntity.actionOrchestrator.getActionBuilder('getMultiple');
    // TODO kate verify OK
    const createRouteAction = actionBuilder(cfGuid, null);
    super(store, listConfig, cfGuid, createRouteAction, true);
  }

}

