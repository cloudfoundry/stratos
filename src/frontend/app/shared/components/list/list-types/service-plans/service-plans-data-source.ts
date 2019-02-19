import { Store } from '@ngrx/store';

import { IServicePlan } from '../../../../../core/cf-api-svc.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { populateServicePlanExtraTyped } from '../../../../../features/service-catalog/services-helper';
import { GetServicePlansForService } from '../../../../../store/actions/service.actions';
import { AppState } from '../../../../../store/app-state';
import {
  entityFactory,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ServicePlansDataSource extends ListDataSource<APIResource<IServicePlan>> {
  constructor(cfGuid: string, serviceGuid: string, store: Store<AppState>, listConfig: IListConfig<APIResource>) {

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, serviceGuid);
    const action = new GetServicePlansForService(serviceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(servicePlanSchemaKey, serviceSchemaKey),
    ]);

    super({
      store,
      action,
      schema: entityFactory(servicePlanSchemaKey),
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
