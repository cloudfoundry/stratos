import { Store } from '@ngrx/store';
import { ListDataSource } from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { AppState } from '@stratosui/store';

import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import type { KubernetesPod } from '../../store/kube.types';


export class HelmReleasePodsDataSource extends ListDataSource<KubernetesPod> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<KubernetesPod>,
    endpointGuid: string,
    releaseTitle: string,
    namespace?: string
  ) {
    const action = kubeEntityCatalog.pod.actions.getInWorkload(endpointGuid, namespace || '*', releaseTitle);
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
