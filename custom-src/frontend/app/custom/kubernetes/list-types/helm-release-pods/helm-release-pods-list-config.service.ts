import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { HelmReleasePodsDataSource } from './helm-release-pods-data-source';
import { HelmReleaseService } from '../../services/helm-release.service';
import { HelmReleasePodNameLinkComponent } from './helm-release-pod-name-link/helm-release-pod-name-link.component';
@Injectable()
export class HelmReleasePodsListConfigService extends KubernetesPodsListConfigService {
  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
    kubeId: BaseKubeGuid,
    public helmReleaseService: HelmReleaseService,
  ) {
    super(store, activatedRoute, kubeId);
    this.podsDataSource = new HelmReleasePodsDataSource(store, kubeId, this, helmReleaseService);
    this.columns[0] = {
      columnId: 'name', headerCell: () => 'Pod Name',
      cellComponent: HelmReleasePodNameLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '5',
    };
  }

}
