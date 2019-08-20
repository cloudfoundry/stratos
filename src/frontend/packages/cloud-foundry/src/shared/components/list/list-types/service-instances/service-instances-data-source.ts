import { Store } from '@ngrx/store';

import { GetServiceInstances } from '../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  cfEntityFactory,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

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
