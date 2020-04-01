import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ServiceInstanceActionBuilders } from '../../../../../entity-action-builders/service-instance.action.builders';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfSpacesServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const serviceInstanceEntity =
      entityCatalog.getEntity<IEntityMetadata, null, ServiceInstanceActionBuilders>(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(spaceGuid, cfGuid, paginationKey, null, {
      includeRelations: [
        createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
        createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
        createEntityRelationKey(servicePlanEntityType, serviceEntityType),
        createEntityRelationKey(serviceInstancesEntityType, spaceEntityType),
        createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
      ],
      populateMissing: true
    });
    super({
      store,
      action,
      schema: cfEntityFactory(serviceInstancesWithSpaceEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      // This would normally be fetched inline, however some of the SI's children will be missing if the SI was fetched by the org
      // request. This can lead to a new request per row and can grind the console to a halt
      isLocal: false,
      transformEntities: [],
      listConfig
    });
  }
}
