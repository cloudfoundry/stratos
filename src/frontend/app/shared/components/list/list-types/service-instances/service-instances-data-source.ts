import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetServiceInstances } from '../../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../../store/app-state';
import { endpointSchemaKey, entityFactory, serviceInstancesSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, cfGuid);
    const action = new GetServiceInstances(cfGuid, paginationKey);

    super({
      store,
      action,
      schema: entityFactory(serviceInstancesSchemaKey),
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
