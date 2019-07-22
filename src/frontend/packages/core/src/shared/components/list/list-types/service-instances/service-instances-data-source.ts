import { Store } from '@ngrx/store';

import { cfEntityFactory, serviceInstancesEntityType, serviceInstancesWithSpaceEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetServiceInstances } from '../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { CFAppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, cfGuid);
    const action = new GetServiceInstances(cfGuid, paginationKey);

    super({
      store,
      action,
      schema: cfEntityFactory(serviceInstancesWithSpaceEntityType),
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
