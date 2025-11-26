import { Store } from '@ngrx/store';
import { ListDataSource } from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { AppState } from '@stratosui/store';
import type { PaginatedAction } from '@stratosui/store';

import type { KubeService } from '../../store/kube.types';
import { GetHelmReleases } from '../store/workloads.actions';

export class HelmReleaseServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubeService>,
    _endpointGuid: string,
    _releaseTitle: string
  ) {
    const action = new GetHelmReleases() as unknown as PaginatedAction;
    super({
      store,
      action,
      schema: (action.entity as any)[0],
      getRowUniqueId: (row: KubeService) => (action.entity as any)[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
