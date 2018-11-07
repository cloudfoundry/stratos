import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { SpaceRouteDataSourceHelper } from './cf-space-route-row-state.helper';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey,
  createEntityRelationKey
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import {
  applicationSchemaKey,
  domainSchemaKey,
  entityFactory,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetSpaceRoutes } from '../../../../../../../store/src/actions/space.actions';

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
