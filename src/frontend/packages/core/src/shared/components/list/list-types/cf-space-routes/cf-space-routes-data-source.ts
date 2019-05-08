import { Store } from '@ngrx/store';

import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey,
  createEntityRelationKey
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import {
  applicationSchemaKey,
  domainSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetSpaceRoutes } from '../../../../../../../store/src/actions/space.actions';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { IRoute } from '../../../../../core/cf-api.types';
import { CfRoutesDataSourceBase } from '../cf-routes/cf-routes-data-source-base';


export class CfSpaceRoutesDataSource extends CfRoutesDataSourceBase implements IListDataSource<APIResource<IRoute>> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>,
    spaceGuid: string,
    cfGuid: string
  ) {
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
    const action = new GetSpaceRoutes(spaceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(routeSchemaKey, applicationSchemaKey),
      createEntityRelationKey(routeSchemaKey, domainSchemaKey),
    ], true, false);
    action.initialParams['order-direction-field'] = 'creation';
    super(store, listConfig, cfGuid, action, false);
  }

}

