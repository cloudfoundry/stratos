import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class ServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceGuid: string, store: Store<GeneralEntityAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, cfGuid);
    const action = cfEntityCatalog.serviceInstance.actions.getMultiple(cfGuid, paginationKey);

    super({
      store,
      action,
      schema: cfEntityFactory(serviceInstancesWithSpaceEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [
        { type: 'filter', field: 'entity.name' },
        (entities: APIResource[], _paginationState: PaginationEntityState) => {
          return entities.filter(e => (e.entity as any).service_guid === serviceGuid);
        }
      ],
      listConfig
    });
  }
}
