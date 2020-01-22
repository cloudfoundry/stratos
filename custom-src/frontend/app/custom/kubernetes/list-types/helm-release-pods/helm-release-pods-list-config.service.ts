import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src//app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { BaseKubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesReleasePodsDataSource } from './helm-release-pods-data-source';


@Injectable()
export class KubernetesReleasePodsListConfigService extends BaseKubernetesPodsListConfigService {

  private podsDataSource: KubernetesReleasePodsDataSource;

  getDataSource = () => this.podsDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    public helmReleaseService: HelmReleaseService,
  ) {
    super(kubeId.guid);
    this.podsDataSource = new KubernetesReleasePodsDataSource(store, kubeId, this, helmReleaseService);
  }

}
