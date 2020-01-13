import { Store } from '@ngrx/store';
import { ListDataSource } from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';

import { getHelmReleasePodId } from '../store/workloads-entity-factory';
import { GetHelmReleasePods } from '../store/workloads.actions';
import { HelmReleasePod } from '../workload.types';


export class HelmReleasePodsDataSource extends ListDataSource<HelmReleasePod> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmReleasePod>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleasePods(endpointGuid, releaseTitle);

    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: getHelmReleasePodId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
