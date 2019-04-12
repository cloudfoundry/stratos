import { Store } from '@ngrx/store';

import { entityFactory } from '../../../../../../store/src//helpers/entity-factory';
import { AppState } from '../../../../../../store/src/app-state';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getHelmReleaseServiceId } from '../../../helm/store/helm.entities';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubernetesPod } from '../../store/kube.types';
import { GetKubernetesReleasePods } from '../../store/kubernetes.actions';
import { kubernetesPodsSchemaKey } from '../../store/kubernetes.entities';



export class KubernetesReleasePodsDataSource extends ListDataSource<KubernetesPod, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPod>,
    helmReleaseService: HelmReleaseService,
  ) {
    const action = new GetKubernetesReleasePods(kubeGuid.guid, helmReleaseService.helmReleaseName);
    super({
      store,
      action,
      schema: entityFactory(kubernetesPodsSchemaKey),
      getRowUniqueId: getHelmReleaseServiceId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
