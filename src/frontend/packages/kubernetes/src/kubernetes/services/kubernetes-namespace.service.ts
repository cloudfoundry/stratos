import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../core/src/core/utils.service';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';
import { KubernetesNamespace } from '../store/kube.types';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespaceService {
  kubeEndpointService = inject(KubernetesEndpointService);
  activatedRoute = inject(ActivatedRoute);

  namespaceName: string;
  kubeGuid: string;
  namespace$: Observable<KubernetesNamespace>;

  constructor() {
    const kubeEndpointService = this.kubeEndpointService;
    const activatedRoute = this.activatedRoute;


    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    const namespaceEntity = kubeEntityCatalog.namespace.store.getEntityService(this.namespaceName, this.kubeGuid);
    this.namespace$ = namespaceEntity.waitForEntity$.pipe(map(e => e.entity));
  }
}
