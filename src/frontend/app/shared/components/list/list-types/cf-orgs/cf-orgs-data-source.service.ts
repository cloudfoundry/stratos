import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { GetAllOrganisations } from '../../../../../store/actions/organisation.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory } from '../../../../../store/helpers/entity-factory';
import { orgSpaceRelationKey, spaceRouteRelationKey } from '../../../../../store/helpers/entity-relations';
import { organisationWithSpaceKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfOrgsDataSourceService extends ListDataSource<APIResource> {
  public static paginationKey = 'cf-organizations';

  constructor(store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const { paginationKey } = CfOrgsDataSourceService;
    const action = new GetAllOrganisations(paginationKey, [orgSpaceRelationKey, spaceRouteRelationKey]);
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
