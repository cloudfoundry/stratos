import { Store } from '@ngrx/store';
import type { OperatorFunction } from 'rxjs';

import { type IListConfig, ListDataSource } from '@stratosui/core';
import type { AppState } from '../../../../../store/src/public-api';
import type { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import type { KubeService } from '../../store/kube.types';

export class BaseKubernetesServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    action: PaginatedAction,
    listConfig: IListConfig<KubeService>,
    transformEntity: OperatorFunction<KubeService[], KubeService[]> | null = null
  ) {
    super({
      store,
      action,
      schema: (action.entity as any)[0],
      getRowUniqueId: (row) => (action.entity as any)[0].getId(row),
      paginationKey: action.paginationKey,
      transformEntity,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
