import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesPod } from '../../store/kube.types';
import { GetKubernetesPodsInNamespace } from '../../store/kubernetes.actions';
import { kubernetesPodsSchemaKey } from '../../store/kubernetes.entities';

export class KubernetesNamespacePodsDataSource extends ListDataSource<KubernetesPod, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPod>,
    kubeNamespaceService: KubernetesNamespaceService,
  ) {
    super({
      store,
      action: new GetKubernetesPodsInNamespace(kubeGuid.guid, kubeNamespaceService.namespaceName),
      schema: entityFactory(kubernetesPodsSchemaKey),
      getRowUniqueId: object => object.name,
      paginationKey: getPaginationKey(kubernetesPodsSchemaKey, kubeNamespaceService.namespaceName, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
