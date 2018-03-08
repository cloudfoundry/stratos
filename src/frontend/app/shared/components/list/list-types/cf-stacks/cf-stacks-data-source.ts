import { Store } from '@ngrx/store';

import { getRowUniqueId } from '../../../../../features/cloud-foundry/cf.helpers';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, stackSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { GetAllStacks } from '../../../../../store/actions/stack.action';

export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('stacks', cfGuid);
    const action = new GetAllStacks(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(stackSchemaKey),
      getRowUniqueId: getRowUniqueId,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
