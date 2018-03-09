import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { GetRoutesInSpace } from '../../../../../store/actions/space.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, routeSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { SpaceRouteDataSourceHelper } from './cf-space-route-row-state.helper';
import { createEntityRelationPaginationKey, createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';
import { spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { applicationSchemaKey } from '../../../../../store/helpers/entity-factory';

export class CfSpaceRoutesDataSource extends ListDataSource<APIResource> {

  cfGuid: string;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>,
    spaceGuid: string,
    cfGuid: string
  ) {
    // const paginationKey = getPaginationKey('cf-space-routes', cfGuid, spaceGuid);
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
    const action = new GetRoutesInSpace(spaceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
      createEntityRelationKey(routeSchemaKey, applicationSchemaKey),
    ]);
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
      isLocal: true,
      listConfig,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
    this.cfGuid = cfGuid;
  }
}
