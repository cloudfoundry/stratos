import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { GetServiceInstancesForSpace } from '../../../../../store/actions/space.actions';

export class CfSpacesServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
    const action = new GetServiceInstancesForSpace(spaceGuid, cfGuid, paginationKey, null, [
      createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, serviceSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, servicePlanSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, spaceSchemaKey),
      createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey),
    ], true, false);
    action.entity = [entityFactory(serviceInstancesWithSpaceSchemaKey)];
    super({
      store,
      action,
      schema: entityFactory(serviceInstancesWithSpaceSchemaKey),
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
