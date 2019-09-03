import { Store } from '@ngrx/store';

import {
  cfEntityFactory,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
  serviceEntityType,
  applicationEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { ListServiceBindingsForInstance } from '../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationPaginationKey, createEntityRelationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';

export class DetachAppsDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, serviceInstanceGuid);
    const serviceBindingEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceBindingEntityType);
    const actionBuilder = serviceBindingEntity.actionOrchestrator.getActionBuilder('getAllForServiceInstance');
    const getAppServiceBindingsAction = actionBuilder(cfGuid, serviceInstanceGuid, paginationKey) as ListServiceBindingsForInstance;
    const action = new ListServiceBindingsForInstance(cfGuid, serviceInstanceGuid, paginationKey);
    //TODO Kate - outstanding
    super({
      store,
      getAppServiceBindingsAction,
      schema: cfEntityFactory(serviceBindingNoBindingsEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig
    });
  }
}
