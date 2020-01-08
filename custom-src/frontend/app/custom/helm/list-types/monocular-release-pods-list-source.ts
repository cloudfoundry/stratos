import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { getHelmReleasePodId, helmEntityFactory } from '../helm-entity-factory';
import { GetHelmReleasePods, GetHelmReleaseServices } from '../store/helm.actions';
import { HelmReleasePod } from '../store/helm.types';

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
