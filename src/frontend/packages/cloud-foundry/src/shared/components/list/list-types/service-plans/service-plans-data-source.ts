import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getRowMetadata } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import {
  populateServicePlanExtraTyped,
} from '../../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { IServicePlan } from '../../../../../../../core/src/core/cf-api-svc.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class ServicePlansDataSource extends ListDataSource<APIResource<IServicePlan>> {
  constructor(
    cfGuid: string,
    serviceGuid: string,
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>
  ) {

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, serviceGuid);
    const servicePlanEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, servicePlanEntityType);
    const actionBuilder = servicePlanEntity.actionOrchestrator.getActionBuilder('getAllForServiceInstance');
    const action = actionBuilder(serviceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(servicePlanEntityType, serviceEntityType),
    ]) as PaginatedAction;

    super({
      store,
      action,
      schema: cfEntityFactory(servicePlanEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: APIResource<IServicePlan>[]) => {
          return entities.map(e => populateServicePlanExtraTyped(e));
        },
        { type: 'filter', field: 'entity.name' }
      ],
      listConfig
    });
  }
}
