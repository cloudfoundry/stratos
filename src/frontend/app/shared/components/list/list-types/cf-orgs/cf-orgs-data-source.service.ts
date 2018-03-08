import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, spaceSchemaKey, routeSchemaKey } from '../../../../../store/helpers/entity-factory';
import { organisationWithSpaceKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';

export class CfOrgsDataSourceService extends ListDataSource<APIResource> {
  public static paginationKey = 'cf-organizations';

  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const { paginationKey } = CfOrgsDataSourceService;
    const action = new GetAllOrganisations(
      paginationKey, cfGuid, [
        createEntityRelationKey(organisationWithSpaceKey, spaceSchemaKey),
        createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
      ]);
    super({
      store,
      action,
      schema: entityFactory(organisationWithSpaceKey),
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
