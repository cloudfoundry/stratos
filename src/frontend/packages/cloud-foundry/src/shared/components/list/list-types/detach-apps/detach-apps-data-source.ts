import { Store } from '@ngrx/store';

import { ListDataSource, type IListConfig } from '@stratosui/core';
import { getRowMetadata, type APIResource } from '@stratosui/store';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../entity-relations/entity-relations.types';
import type { CFAppState } from '../../../../../cf-app-state';
import type { IServiceBinding } from '../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
} from '../../../../../cf-entity-types';

export class DetachAppsDataSource extends ListDataSource<APIResource<IServiceBinding>> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource<IServiceBinding>>) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, serviceInstanceGuid);
    const getAppServiceBindingsAction = cfEntityCatalog.serviceBinding.actions.getAllForServiceInstance(
      serviceInstanceGuid, cfGuid, paginationKey, {
        includeRelations: [
          createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
        ]
      }
    );
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
