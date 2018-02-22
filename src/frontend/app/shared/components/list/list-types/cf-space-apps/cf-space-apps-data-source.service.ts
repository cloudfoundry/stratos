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
import { ApplicationSchema } from '../../../../../store/actions/application.actions';
import { GetAllAppsInSpace } from '../../../../../store/actions/space.actions';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
export const RouteSchema = new schema.Entity('route');

export class CfSpaceAppsDataSource extends ListDataSource<APIResource> {
  public static paginationKey = 'cf-space-apps';

  constructor(store: Store<AppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource>) {
    let { paginationKey } = CfSpaceAppsDataSource;
    paginationKey = `${paginationKey}-${cfSpaceService.spaceGuid}`;
    const action = new GetAllAppsInSpace(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, paginationKey);
    super({
      store,
      action,
      schema: ApplicationSchema,
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
