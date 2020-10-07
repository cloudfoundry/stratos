import { Store } from '@ngrx/store';
import { ListDataSource } from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';

import { KubeService } from '../../store/kube.types';
import { GetHelmReleaseServices } from '../store/workloads.actions';

export class HelmReleaseServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubeService>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleaseServices(endpointGuid, releaseTitle);
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
