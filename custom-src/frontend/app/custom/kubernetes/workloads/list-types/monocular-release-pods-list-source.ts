import { Store } from '@ngrx/store';
import { ListDataSource } from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';

import { getKubeAPIResourceGuid } from '../../store/kube.selectors';
import { KubernetesPod } from '../../store/kube.types';
import { GetHelmReleasePods } from '../store/workloads.actions';


export class HelmReleasePodsDataSource extends ListDataSource<KubernetesPod> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubernetesPod>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleasePods(endpointGuid, releaseTitle);

    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: getKubeAPIResourceGuid,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
