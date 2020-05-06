import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { serviceBindingEntityType, serviceBindingNoBindingsEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';

export class DetachAppsDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, serviceInstanceGuid);
    const serviceBindingEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceBindingEntityType);
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
