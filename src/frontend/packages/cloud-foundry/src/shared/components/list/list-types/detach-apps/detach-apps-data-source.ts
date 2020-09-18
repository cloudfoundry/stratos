import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
} from '../../../../../cf-entity-types';

export class DetachAppsDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
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
