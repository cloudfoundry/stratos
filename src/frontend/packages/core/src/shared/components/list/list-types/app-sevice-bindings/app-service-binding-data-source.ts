import { Store } from '@ngrx/store';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import {
  createEntityRelationPaginationKey,
  createEntityRelationKey
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import {
  applicationSchemaKey,
  entityFactory,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  serviceSchemaKey,
  servicePlanSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetAppServiceBindings } from '../../../../../../../store/src/actions/application-service-routes.actions';
import { AppState } from '../../../../../../../store/src/app-state';

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
