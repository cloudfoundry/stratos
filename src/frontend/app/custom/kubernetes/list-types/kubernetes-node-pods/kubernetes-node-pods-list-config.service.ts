import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { HelmReleaseService } from '../../services/helm-release.service';
import { KubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNodePodsDataSource } from './kubernetes-node-pods-data-source';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { KubernetesNodePodsLinkComponent } from './kubernetes-node-pods-link/kubernetes-node-pods-link.component';

@Injectable()
export class KubernetesNodePodsListConfigService extends KubernetesPodsListConfigService {
  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    public kubeNodeService: KubernetesNodeService,
  ) {
    super(store, kubeId);
    this.podsDataSource = new KubernetesNodePodsDataSource(store, kubeId, this, kubeNodeService);
    this.columns[0] = {
      columnId: 'name', headerCell: () => 'Pod Name',
      cellComponent: KubernetesNodePodsLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '5',
    };
  }

}
