import { Store } from '@ngrx/store';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  createEntityRelationPaginationKey,
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

export class DetachAppsDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, serviceInstanceGuid);
    const action = new ListServiceBindingsForInstance(cfGuid, serviceInstanceGuid, paginationKey);
    super({
      store,
      action,
      schema: cfEntityFactory(serviceBindingNoBindingsEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig
    });
  }
}
