import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay } from 'rxjs/operators';

import { getIdFromRoute } from '../../../core/utils.service';
import { kubeEntityCatalog } from '../kubernetes-entity-catalog';
import { KubernetesNamespace } from '../store/kube.types';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

@Injectable()
export class KubernetesNamespaceService {
  namespaceName: string;
  kubeGuid: string;
  namespace$: Observable<KubernetesNamespace>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute,
  ) {

    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    const namespaceEntity = kubeEntityCatalog.namespace.store.getEntityService(this.namespaceName, this.kubeGuid);

    this.namespace$ = namespaceEntity.entityObs$.pipe(
      filter(p => !!p),
      map(p => p.entity),
      publishReplay(1),
      first()
    );

  }
}
