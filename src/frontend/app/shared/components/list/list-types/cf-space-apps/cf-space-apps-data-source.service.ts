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
import { GetAllAppsInSpace } from '../../../../../store/actions/space.actions';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { entityFactory, applicationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations.types';

export class CfSpaceAppsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, cfSpaceService.spaceGuid);
    const action = new GetAllAppsInSpace(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(applicationSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }

}
