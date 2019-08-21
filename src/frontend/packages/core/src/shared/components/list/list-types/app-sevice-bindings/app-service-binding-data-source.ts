import { Store } from '@ngrx/store';

import {
  applicationEntityType,
  cfEntityFactory,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAppServiceBindings } from '../../../../../../../cloud-foundry/src/actions/application-service-routes.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../../core/cf-api-svc.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';

export class AppServiceBindingDataSource extends ListDataSource<APIResource<IServiceBinding>> {
  static createGetAllServiceBindings(appGuid: string, cfGuid: string) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, appGuid);
    const serviceBindingEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceBindingEntityType);
    const actionBuilder = serviceBindingEntity.actionOrchestrator.getActionBuilder('getAllForApplication');
    const getAppServiceBindingsAction = actionBuilder(
      appGuid, cfGuid, paginationKey, [
        createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
        createEntityRelationKey(serviceInstancesEntityType, serviceEntityType),
        createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
        createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
      ]) as PaginatedAction;
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
