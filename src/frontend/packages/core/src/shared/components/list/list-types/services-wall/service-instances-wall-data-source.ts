import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { createEntityRelationPaginationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import {
  entityFactory,
  serviceInstancesSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetServiceInstances } from '../../../../../../../store/src/actions/service-instances.actions';

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
