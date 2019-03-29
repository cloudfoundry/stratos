import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { getPaginationKey } from '../../../../../../store/src//actions/pagination.actions';
import { AppState } from '../../../../../../store/src//app-state';
import { entityFactory } from '../../../../../../store/src//helpers/entity-factory';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubeService } from '../../store/kube.types';
import { GetKubernetesServices } from '../../store/kubernetes.actions';
import { kubernetesServicesSchemaKey } from '../../store/kubernetes.entities';


// TODO: RC Rename... Should be Kubernetes not Helm
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
      transformEntity: map((services: KubeService[]) => services.filter(svc =>
        svc.metadata.labels &&
        svc.metadata.labels['app.kubernetes.io/instance'] === helmReleaseService.helmReleaseName
      )),
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
