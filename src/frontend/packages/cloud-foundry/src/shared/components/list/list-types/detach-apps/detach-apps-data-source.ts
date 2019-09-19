import { Store } from '@ngrx/store';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  createEntityRelationPaginationKey, createEntityRelationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ListServiceBindingsForInstance } from '../../../../../actions/service-instances.actions';
import { CFAppState } from '../../../../../cf-app-state';
import {
  cfEntityFactory,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
} from '../../../../../cf-entity-factory';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';

export class DetachAppsDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, serviceInstanceGuid);
    const serviceBindingEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceBindingEntityType);
    const actionBuilder = serviceBindingEntity.actionOrchestrator.getActionBuilder('getAllForServiceInstance');
    const getAppServiceBindingsAction = actionBuilder(serviceInstanceGuid, cfGuid, paginationKey) as PaginatedAction;
    super({
      store,
      action: getAppServiceBindingsAction,
      schema: cfEntityFactory(serviceBindingNoBindingsEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: getAppServiceBindingsAction.paginationKey,
      isLocal: true,
      listConfig
    });
  }
}
