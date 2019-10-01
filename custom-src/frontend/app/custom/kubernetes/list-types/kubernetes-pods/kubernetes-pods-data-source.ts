import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { kubernetesPodsSchemaKey } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { getKubeAPIResourceGuid } from '../../store/kube.selectors';
import { KubernetesPod } from '../../store/kube.types';
import { GetKubernetesPods } from '../../store/kubernetes.actions';

export class KubernetesPodsDataSource extends ListDataSource<KubernetesPod> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPod>
  ) {
    const action = new GetKubernetesPods(kubeGuid.guid);
    super({
      store,
      action,
      schema: entityFactory(kubernetesPodsSchemaKey),
      getRowUniqueId: getKubeAPIResourceGuid,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
