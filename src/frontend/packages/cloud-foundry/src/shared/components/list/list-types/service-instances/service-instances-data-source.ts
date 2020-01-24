import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class ServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, cfGuid);
    const serviceInstanceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(cfGuid, paginationKey);

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
