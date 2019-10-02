import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { kubernetesEntityFactory, kubernetesPodsSchemaKey } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { getKubeAPIResourceGuid } from '../../store/kube.selectors';
import { KubernetesPod } from '../../store/kube.types';
import { GetKubernetesPodsOnNode } from '../../store/kubernetes.actions';

export class KubernetesNodePodsDataSource extends ListDataSource<KubernetesPod> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPod>,
    kubeNodeService: KubernetesNodeService,
  ) {
    const action = new GetKubernetesPodsOnNode(kubeGuid.guid, kubeNodeService.nodeName);
    super({
      store,
      action,
      schema: kubernetesEntityFactory(kubernetesPodsSchemaKey),
      getRowUniqueId: getKubeAPIResourceGuid,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
