import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
  entityFactory,
  serviceBindingSchemaKey,
  serviceBindingNoBindingsSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAllOrganizationSpaces } from '../../../../../store/actions/organization.actions';
import { ListServiceBindingsForInstance } from '../../../../../store/actions/service-instances.actions';

export class DetachAppsDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, serviceInstanceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceBindingSchemaKey, serviceInstanceGuid);
    const action = new ListServiceBindingsForInstance(cfGuid, serviceInstanceGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(serviceBindingNoBindingsSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig
    });
  }
}
