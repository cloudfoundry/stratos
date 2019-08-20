import { Store } from '@ngrx/store';

import { ListServiceBindingsForInstance } from '../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  cfEntityFactory,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { getRowMetadata } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

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
