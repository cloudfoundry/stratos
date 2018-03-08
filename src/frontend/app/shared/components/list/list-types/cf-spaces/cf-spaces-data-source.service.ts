import { Store } from '@ngrx/store';

import { GetAllSpacesInOrg } from '../../../../../store/actions/organisation.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  organisationSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(organisationSchemaKey, orgGuid);
    const action = new GetAllSpacesInOrg(cfGuid, orgGuid, paginationKey, [
      createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
      createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
      createEntityRelationKey(spaceSchemaKey, spaceQuotaSchemaKey),
    ]);
    super({
      store,
      action,
      schema: entityFactory(spaceWithOrgKey),
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
