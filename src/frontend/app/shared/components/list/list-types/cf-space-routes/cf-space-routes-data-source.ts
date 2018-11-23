import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetSpaceRoutes } from '../../../../../store/actions/space.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  domainSchemaKey,
  entityFactory,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { SpaceRouteDataSourceHelper } from './cf-space-route-row-state.helper';

export class CfSpaceRoutesDataSource extends ListDataSource<APIResource> {

  cfGuid: string;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>,
    spaceGuid: string,
    cfGuid: string
  ) {
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
    const action = new GetSpaceRoutes(spaceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(routeSchemaKey, applicationSchemaKey),
      createEntityRelationKey(routeSchemaKey, domainSchemaKey),
    ], true, false);
    action.initialParams['order-direction-field'] = 'creation';
    const { rowStateManager, sub } = SpaceRouteDataSourceHelper.getRowStateManager(
      store,
      paginationKey
    );
    super({
      store,
      action: action,
      schema: entityFactory(routeSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: false,
      listConfig,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
    this.cfGuid = cfGuid;
  }
}
