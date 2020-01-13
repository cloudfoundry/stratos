import { Store } from '@ngrx/store';
import { ListDataSource } from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';

import { kubernetesEntityFactory } from '../../kubernetes-entity-factory';
import { getHelmReleaseId, helmReleaseEntityKey } from '../store/workloads-entity-factory';
import { GetHelmReleases } from '../store/workloads.actions';
import { HelmRelease } from '../workload.types';

export class HelmReleasesDataSource extends ListDataSource<HelmRelease> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmRelease>
  ) {
    const action = new GetHelmReleases();
    super({
      store,
      action,
      schema: kubernetesEntityFactory(helmReleaseEntityKey),
      getRowUniqueId: getHelmReleaseId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig
    });
  }
}
