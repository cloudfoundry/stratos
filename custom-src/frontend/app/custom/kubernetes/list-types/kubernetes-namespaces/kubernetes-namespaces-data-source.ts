import { Store } from '@ngrx/store';

import { getPaginationKey } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { kubernetesNamespacesSchemaKey } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { getKubeAPIResourceGuid } from '../../store/kube.selectors';
import { KubernetesNamespace } from '../../store/kube.types';
import { GetKubernetesNamespaces } from '../../store/kubernetes.actions';


export class KubernetesNamespacesDataSource extends ListDataSource<KubernetesNamespace> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNamespace>
  ) {
    super({
      store,
      action: new GetKubernetesNamespaces(kubeGuid.guid),
      schema: entityFactory(kubernetesNamespacesSchemaKey),
      getRowUniqueId: getKubeAPIResourceGuid,
      paginationKey: getPaginationKey(kubernetesNamespacesSchemaKey, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
