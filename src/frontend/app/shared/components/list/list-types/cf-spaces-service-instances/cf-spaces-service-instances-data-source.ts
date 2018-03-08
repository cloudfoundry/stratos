import { Store } from '@ngrx/store';

import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { GetServicesInstancesInSpace } from '../../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, serviceInstancesSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { CfServiceInstance } from '../../../../../store/types/service.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSpacesServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('cf-spaces-service-instances', cfGuid, spaceGuid);
    const action = new GetServicesInstancesInSpace(cfGuid, spaceGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(serviceInstancesSchemaKey),
      getRowUniqueId: (entity: APIResource<CfServiceInstance>) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
