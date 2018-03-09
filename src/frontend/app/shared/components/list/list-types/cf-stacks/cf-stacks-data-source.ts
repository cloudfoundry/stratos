import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../store/types/api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { IListConfig } from '../../list.component.types';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { getRowUniqueId } from '../../../../../features/cloud-foundry/cf.helpers';
import { StackSchema, GetAllStacks } from '../../../../../store/actions/stack.action';
export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('stacks', cfGuid);
    const action = new GetAllStacks(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: StackSchema,
      getRowUniqueId: getRowUniqueId,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
