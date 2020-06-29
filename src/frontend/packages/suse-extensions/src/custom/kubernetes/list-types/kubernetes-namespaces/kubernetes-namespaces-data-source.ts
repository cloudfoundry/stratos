import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { kubernetesNamespacesEntityType } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespace } from '../../store/kube.types';


export class KubernetesNamespacesDataSource extends ListDataSource<KubernetesNamespace> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNamespace>
  ) {
    const action = kubeEntityCatalog.namespace.actions.getMultiple(kubeGuid.guid);
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: getPaginationKey(kubernetesNamespacesEntityType, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
