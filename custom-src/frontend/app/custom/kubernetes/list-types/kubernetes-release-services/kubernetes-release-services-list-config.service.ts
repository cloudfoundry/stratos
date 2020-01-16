import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { BaseKubernetesServicesListConfig } from '../kubernetes-services/kubernetes-service-list-config.service';
import { KubernetesHelmReleaseServicesDataSource } from './kubernetes-release-services-data-source';

@Injectable()
export class KubernetesReleaseServicesListConfig extends BaseKubernetesServicesListConfig {
  podsDataSource: KubernetesHelmReleaseServicesDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    helmReleaseService: HelmReleaseService
  ) {
    super();
    this.podsDataSource = new KubernetesHelmReleaseServicesDataSource(store, kubeId, this, helmReleaseService);
  }
  getDataSource = () => this.podsDataSource;


}
