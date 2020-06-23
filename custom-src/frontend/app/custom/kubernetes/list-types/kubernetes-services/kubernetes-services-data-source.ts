import { Store } from '@ngrx/store';
import { OperatorFunction } from 'rxjs';

import { AppState } from '../../../../../../store/src/app-state';
import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { KubeService } from '../../store/kube.types';

export class BaseKubernetesServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    action: PaginatedAction,
    listConfig: IListConfig<KubeService>,
    transformEntity: OperatorFunction<KubeService[], any> = null
  ) {
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      transformEntity,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
