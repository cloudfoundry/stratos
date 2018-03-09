import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { AppState } from '../../../../../store/app-state';
import {
  entityFactory,
  organisationWithSpaceKey,
  quotaDefinitionSchemaKey,
  spaceSchemaKey,
  applicationSchemaKey,
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
    const paginationKey = createEntityRelationPaginationKey(organisationWithSpaceKey, cfGuid);
    return new GetAllOrganisations(
      paginationKey,
      cfGuid, [
        createEntityRelationKey(organisationWithSpaceKey, spaceSchemaKey),
        createEntityRelationKey(organisationWithSpaceKey, quotaDefinitionSchemaKey),
        createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
        createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
        // createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
      ]);
  }

  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const action = CfOrgsDataSourceService.createGetAllOrganisations(cfGuid);
    super({
      store,
      action,
      schema: entityFactory(organisationWithSpaceKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
