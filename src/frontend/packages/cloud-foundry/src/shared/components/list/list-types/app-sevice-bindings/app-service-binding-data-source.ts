import { Store } from '@ngrx/store';

import { GetAppServiceBindings } from '../../../../../../../cloud-foundry/src/actions/application-service-routes.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  cfEntityFactory,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { getRowMetadata } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { IServiceBinding } from '../../../../../../../core/src/core/cf-api-svc.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';

export class AppServiceBindingDataSource extends ListDataSource<APIResource<IServiceBinding>> {
  static createGetAllServiceBindings(appGuid: string, cfGuid: string) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, appGuid);
    return new GetAppServiceBindings(
      appGuid, cfGuid, paginationKey, [
        createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
        createEntityRelationKey(serviceInstancesEntityType, serviceEntityType),
        createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
        createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
      ]);
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
