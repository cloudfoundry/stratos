import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { GetKubernetesPods, GetKubernetesServices } from '../../store/kubernetes.actions';

import { map } from 'rxjs/operators';
import { entityFactory, kubernetesPodsSchemaKey, kubernetesServicesSchemaKey } from '../../../../store/helpers/entity-factory';
import { KubernetesPod, KubeService } from '../../store/kube.types';
import { HelmReleaseService } from '../../services/helm-release.service';

export class HelmReleaseServicesDataSource extends ListDataSource<KubeService, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubeService>,
    helmReleaseService: HelmReleaseService,
  ) {
    super({
      store,
      action: new GetKubernetesServices(kubeGuid.guid),
      schema: entityFactory(kubernetesServicesSchemaKey),
      getRowUniqueId: object => object.name,
      paginationKey: getPaginationKey(kubernetesServicesSchemaKey, kubeGuid.guid),
      transformEntity: map((pods: KubeService[]) =>
        pods.filter(p => p.metadata.labels['release'] === helmReleaseService.helmReleaseName)),
      isLocal: true,
      listConfig
    });
  }

}
