import { Store } from '@ngrx/store';

import { type IListConfig, ListDataSource } from '@stratosui/core';
import type { AppState } from '../../../../../store/src/public-api';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import type { KubernetesPod } from '../../store/kube.types';

export class KubernetesPodsDataSource extends ListDataSource<KubernetesPod> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPod>
  ) {
    const action = kubeEntityCatalog.pod.actions.getMultiple(kubeGuid.guid);
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
