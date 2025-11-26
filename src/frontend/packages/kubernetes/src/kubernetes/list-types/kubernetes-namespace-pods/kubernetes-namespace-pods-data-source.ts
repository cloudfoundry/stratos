import { Store } from '@ngrx/store';

import { type IListConfig, ListDataSource } from '@stratosui/core';
import type { AppState } from '../../../../../store/src/public-api';
import { kubernetesEntityFactory, kubernetesPodsEntityType } from '../../kubernetes-entity-factory';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import type { KubernetesPod } from '../../store/kube.types';

export class KubernetesNamespacePodsDataSource extends ListDataSource<KubernetesPod> {

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
