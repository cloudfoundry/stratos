import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../../store/src/app-state';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPod } from '../../store/kube.types';

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
