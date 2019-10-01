import { Store } from '@ngrx/store';

import { getPaginationKey } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getKubeAppId, kubernetesAppsSchemaKey } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesApp } from '../../store/kube.types';
import { GetKubernetesApps } from '../../store/kubernetes.actions';


export class KubernetesAppsDataSource extends ListDataSource<KubernetesApp> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesApp>
  ) {
    super({
      store,
      action: new GetKubernetesApps(kubeGuid.guid),
      schema: entityFactory(kubernetesAppsSchemaKey),
      getRowUniqueId: getKubeAppId,
      paginationKey: getPaginationKey(kubernetesAppsSchemaKey, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'name' }]
    });
  }

}
