import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { AppState } from '../../../../../store/app-state';
import {
  entityFactory,
  quotaDefinitionSchemaKey,
  spaceSchemaKey,
  applicationSchemaKey,
  endpointSchemaKey,
  organisationSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { serviceInstancesSchemaKey } from '../../../../../store/helpers/entity-factory';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfOrgsDataSourceService extends ListDataSource<APIResource> {

  // TODO: RC MOVE
  static createGetAllOrganisations(cfGuid) {
    const paginationKey = cfGuid ?
      createEntityRelationPaginationKey(endpointSchemaKey, cfGuid)
      : createEntityRelationPaginationKey(endpointSchemaKey, 'all');
    return new GetAllOrganisations(
      paginationKey,
      cfGuid, [
        createEntityRelationKey(organisationSchemaKey, spaceSchemaKey),
        createEntityRelationKey(organisationSchemaKey, quotaDefinitionSchemaKey),
        createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
        createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
      ]);
  }

  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const action = CfOrgsDataSourceService.createGetAllOrganisations(cfGuid);
    super({
      store,
      action,
      schema: entityFactory(organisationSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
