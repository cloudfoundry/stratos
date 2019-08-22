import { Store } from '@ngrx/store';

import {
  applicationEntityType,
  cfEntityFactory,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetServiceInstancesForSpace } from '../../../../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import q = require('q');
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';

export class CfSpacesServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const serviceInstanceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(spaceGuid, cfGuid, paginationKey, null, [
      createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
      createEntityRelationKey(serviceInstancesEntityType, serviceEntityType),
      createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
      createEntityRelationKey(serviceInstancesEntityType, spaceEntityType),
      createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
    ], true, false) as PaginatedAction;
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
