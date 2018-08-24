import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetServiceInstances } from '../../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../../store/app-state';
import {
  entityFactory,
  serviceInstancesSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ServiceInstancesWallDataSource extends ListDataSource<APIResource> {

  constructor(store: Store<AppState>, transformEntities: any[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey);
    const action = new GetServiceInstances(null, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(serviceInstancesWithSpaceSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: transformEntities,
      listConfig
    });
  }
}
