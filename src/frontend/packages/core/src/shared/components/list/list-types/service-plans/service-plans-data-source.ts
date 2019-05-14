import { Store } from '@ngrx/store';

import { IServicePlan } from '../../../../../core/cf-api-svc.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { populateServicePlanExtraTyped } from '../../../../../features/service-catalog/services-helper';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey, createEntityRelationKey
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import {
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
  entityFactory
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetServicePlansForService } from '../../../../../../../store/src/actions/service.actions';
import { EntityCatalogueService } from '../../../../../core/entity-catalogue/entity-catalogue.service';

export class ServicePlansDataSource extends ListDataSource<APIResource<IServicePlan>> {
  constructor(
    cfGuid: string,
    serviceGuid: string,
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>
  ) {

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
