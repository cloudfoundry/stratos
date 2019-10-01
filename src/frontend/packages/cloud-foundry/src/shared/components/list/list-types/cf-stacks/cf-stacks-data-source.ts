import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { stackEntityType } from '../../../../../cf-entity-types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const stackEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, stackEntityType);
    const getAllStacksActionBuilder = stackEntity.actionOrchestrator.getActionBuilder('getMultiple');
    // TODO no pagination key
    const action = getAllStacksActionBuilder(cfGuid, null);
    super({
      store,
      action,
      schema: cfEntityFactory(stackEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
