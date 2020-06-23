import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

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
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class AppServiceBindingDataSource extends ListDataSource<APIResource<IServiceBinding>> {
  static createGetAllServiceBindings(appGuid: string, cfGuid: string) {

    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, appGuid);
    return cfEntityCatalog.serviceBinding.actions.getAllForApplication(
      appGuid, cfGuid, paginationKey, {
        includeRelations: [
          createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
          createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
          createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
          createEntityRelationKey(servicePlanEntityType, serviceEntityType),
        ],
        populateMissing: true
      });
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
