import { Store } from '@ngrx/store';

import { KubernetesNode } from '../../../../../../../src/frontend/app/custom/kubernetes/store/kube.types';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { GetKubernetesNodes } from '../../store/kubernetes.actions';
import { kubernetesNodesSchemaKey } from '../../store/kubernetes.entities';

export class KubernetesNodesDataSource extends ListDataSource<KubernetesNode, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>
  ) {
    super({
      store,
      action: new GetKubernetesNodes(kubeGuid.guid),
      schema: entityFactory(kubernetesNodesSchemaKey),
      getRowUniqueId: object => object.name,
      paginationKey: getPaginationKey(kubernetesNodesSchemaKey, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
