import { Store } from '@ngrx/store';

import { IListConfig, ListDataSource } from '@stratosui/core';
import { APIResource, getRowMetadata, PaginatedAction } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import {
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../entity-relations/entity-relations.types';
import {
  populateServicePlanExtraTyped,
} from '../../../../../features/service-catalog/services-helper';
import { IServicePlan } from '../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class ServicePlansDataSource extends ListDataSource<APIResource<IServicePlan>> {
  constructor(
    cfGuid: string,
    serviceGuid: string,
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>
  ) {

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, serviceGuid);
    const action = cfEntityCatalog.servicePlan.actions.getAllForServiceInstance(serviceGuid, cfGuid, paginationKey, [
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
