import { Store } from '@ngrx/store';

import {
  cfEntityFactory,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetServicePlansForService } from '../../../../../../../cloud-foundry/src/actions/service.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../../core/cf-api-svc.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { populateServicePlanExtraTyped } from '../../../../../features/service-catalog/services-helper';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ServicePlansDataSource extends ListDataSource<APIResource<IServicePlan>> {
  constructor(
    cfGuid: string,
    serviceGuid: string,
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>
  ) {

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, serviceGuid);
    const action = new GetServicePlansForService(serviceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(servicePlanEntityType, serviceEntityType),
    ]);

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
