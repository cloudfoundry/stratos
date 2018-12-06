import { Store } from '@ngrx/store';

import { IServiceBinding } from '../../../../../core/cf-api-svc.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAppServiceBindings } from '../../../../../store/actions/application-service-routes.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  serviceSchemaKey,
  servicePlanSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class AppServiceBindingDataSource extends ListDataSource<APIResource> {
  static createGetAllServiceBindings(appGuid: string, cfGuid: string) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingSchemaKey, appGuid);
    return new GetAppServiceBindings(
      appGuid, cfGuid, paginationKey, [
        createEntityRelationKey(serviceInstancesSchemaKey, servicePlanSchemaKey),
        createEntityRelationKey(serviceInstancesSchemaKey, serviceSchemaKey),
        createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey),
        createEntityRelationKey(serviceBindingSchemaKey, serviceInstancesSchemaKey),
      ]);
  }

  constructor(store: Store<AppState>, appService: ApplicationService, listConfig?: IListConfig<APIResource>) {
    const action = AppServiceBindingDataSource.createGetAllServiceBindings(appService.appGuid, appService.cfGuid);
    super({
      store,
      action,
      schema: entityFactory(serviceBindingSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }



}
