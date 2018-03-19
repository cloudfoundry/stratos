import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { GetAllSecurityGroups } from '../../../../../store/actions/security-groups-actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityFactory, securityGroupSchemaKey, endpointSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations.types';

export class CfSecurityGroupsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const action = new GetAllSecurityGroups(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(securityGroupSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
