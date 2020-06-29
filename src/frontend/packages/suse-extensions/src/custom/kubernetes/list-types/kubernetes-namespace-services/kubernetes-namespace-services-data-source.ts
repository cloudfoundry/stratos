import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../../store/src/app-state';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubeService } from '../../store/kube.types';
import { BaseKubernetesServicesDataSource } from '../kubernetes-services/kubernetes-services-data-source';


export class KubernetesNamespaceServicesDataSource extends BaseKubernetesServicesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubeService>,
    namespace: string,
  ) {
    super(
      store,
      kubeEntityCatalog.service.actions.getInNamespace(namespace, kubeGuid.guid),
      listConfig
    );
  }

}
