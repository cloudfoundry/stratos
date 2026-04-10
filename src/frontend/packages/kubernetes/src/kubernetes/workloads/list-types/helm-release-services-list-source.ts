import { Store } from '@ngrx/store';
import { ListDataSource } from '@stratosui/core';
import { IListConfig } from '@stratosui/core';
import { AppState } from '@stratosui/store';

import { KubeService } from '../../store/kube.types';
import { GetHelmReleases } from '../store/workloads.actions';

export class HelmReleaseServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubeService>,
    _endpointGuid: string,
    _releaseTitle: string
  ) {
    const action = new GetHelmReleases() as any;
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row: KubeService) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
