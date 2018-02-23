import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { map } from 'rxjs/operators';
import { isTCPRoute, getMappedApps } from '../../../../../features/applications/routes/routes.helper';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { GetRoutesInSpace } from '../../../../../store/actions/space.actions';
import { CfRoute } from '../../../../../store/types/route.types';

export const RouteSchema = new schema.Entity('route');

export class CfSpaceRoutesDataSource extends ListDataSource<APIResource> {
  cfGuid: string;
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>,
    spaceGuid: string,
    cfGuid: string
  ) {
    super({
      store,
      action: new GetRoutesInSpace(spaceGuid, cfGuid,
        getPaginationKey('cf-space-routes', cfGuid, spaceGuid)),
      schema: RouteSchema,
      getRowUniqueId: (object: EntityInfo) =>
        object.entity ? object.entity.guid : null,
      paginationKey: getPaginationKey('cf-space-routes', cfGuid, spaceGuid),
      isLocal: true,
      listConfig,
    });

  }

  getAttachedAppGuids = (route: APIResource<CfRoute>): string[] => {
    return route.entity.apps.map(a => a.metadata.guid);
  }
}
