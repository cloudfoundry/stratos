import { Store } from '@ngrx/store';

import { GetAllSpacesInOrg } from '../../../../../store/actions/organisation.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { entityFactory, spaceWithOrgKey } from '../../../../../store/helpers/entity-factory';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('cf-org-space', cfGuid, orgGuid);
    const action = new GetAllSpacesInOrg(cfGuid, orgGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(spaceWithOrgKey),
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
