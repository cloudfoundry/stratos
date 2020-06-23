import { Store } from '@ngrx/store';
import { ListDataSource } from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';

import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { KubernetesPod } from '../../store/kube.types';


export class HelmReleasePodsDataSource extends ListDataSource<KubernetesPod> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubernetesPod>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = kubeEntityCatalog.pod.actions.getInWorkload(endpointGuid, releaseTitle);
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row: KubernetesPod) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
