import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { kubernetesEntityFactory, kubernetesPodsEntityType } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesPod } from '../../store/kube.types';

export class KubernetesNamespacePodsDataSource extends ListDataSource<KubernetesPod, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPod>,
    kubeNamespaceService: KubernetesNamespaceService,
  ) {
    const action = kubeEntityCatalog.pod.actions.getInNamespace(kubeGuid.guid, kubeNamespaceService.namespaceName);
    super({
      store,
      action,
      schema: kubernetesEntityFactory(kubernetesPodsEntityType),
      getRowUniqueId: (object: KubernetesPod) => object.metadata.name,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
