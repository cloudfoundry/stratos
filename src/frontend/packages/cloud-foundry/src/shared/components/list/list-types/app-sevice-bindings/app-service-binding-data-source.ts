import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { getRowMetadata } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { IServiceBinding } from '../../../../../../../core/src/core/cf-api-svc.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ServiceBindingActionBuilders } from '../../../../../entity-action-builders/service-binding.action-builders';

export class AppServiceBindingDataSource extends ListDataSource<APIResource<IServiceBinding>> {
  static createGetAllServiceBindings(appGuid: string, cfGuid: string) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, appGuid);
    const serviceBindingEntity = entityCatalog
      .getEntity<IEntityMetadata, null, ServiceBindingActionBuilders>(CF_ENDPOINT_TYPE, serviceBindingEntityType);
    const actionBuilder = serviceBindingEntity.actionOrchestrator.getActionBuilder('getAllForApplication');
    const getAppServiceBindingsAction = actionBuilder(
      appGuid, cfGuid, paginationKey, {
        includeRelations: [
          createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
          createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
          createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
          createEntityRelationKey(servicePlanEntityType, serviceEntityType),
        ],
        populateMissing: true
      });
    return getAppServiceBindingsAction;
  }

  constructor(store: Store<CFAppState>, appService: ApplicationService, listConfig?: IListConfig<APIResource<IServiceBinding>>) {
    const action = AppServiceBindingDataSource.createGetAllServiceBindings(appService.appGuid, appService.cfGuid);
    super({
      store,
      action,
      schema: cfEntityFactory(serviceBindingEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }



}
