import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src//app-state';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubeService } from '../../store/kube.types';
import { GetKubernetesServices } from '../../store/kubernetes.actions';
import { BaseKubernetesServicesDataSource } from '../kubernetes-services-data-source';


export class KubernetesHelmReleaseServicesDataSource extends BaseKubernetesServicesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubeService>,
    helmReleaseService: HelmReleaseService,
  ) {
    const action = new GetKubernetesServices(kubeGuid.guid);
    super(
      store,
      action,
      listConfig,
      map((services: KubeService[]) => services.filter(svc =>
        svc.metadata.labels &&
        svc.metadata.labels['app.kubernetes.io/instance'] === helmReleaseService.helmReleaseName
      ))
    );
  }

}
