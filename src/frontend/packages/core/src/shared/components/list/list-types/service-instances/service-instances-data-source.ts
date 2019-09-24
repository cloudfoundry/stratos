import { Store } from '@ngrx/store';

import { GetServiceInstances } from '../../../../../../../store/src/actions/service-instances.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  entityFactory,
  serviceInstancesSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, cfGuid);
    const action = new GetServiceInstances(cfGuid, paginationKey);

    super({
      store,
      action,
      schema: entityFactory(serviceInstancesWithSpaceSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          return entities.filter(e => e.entity.service_guid === serviceGuid);
        }
      ],
      listConfig
    });
  }
}
