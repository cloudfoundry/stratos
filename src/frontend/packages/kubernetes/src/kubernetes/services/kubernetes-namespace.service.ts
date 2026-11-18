import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { getIdFromRoute } from '../../../../core/src/core/utils.service';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespaceService {
  kubeEndpointService = inject(KubernetesEndpointService);
  activatedRoute = inject(ActivatedRoute);
  private namespaceData = inject(KubeNamespaceDataService);

  namespaceName: string;
  kubeGuid: string;

  constructor() {
    const kubeEndpointService = this.kubeEndpointService;
    const activatedRoute = this.activatedRoute;


    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    // Prime the per-endpoint namespace cache.
    void this.namespaceData.refresh({ kubeGuid: this.kubeGuid });
  }
}
