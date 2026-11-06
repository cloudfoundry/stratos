import { Injectable, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../core/src/core/utils.service';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesNamespace } from '../store/kube.types';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespaceService {
  kubeEndpointService = inject(KubernetesEndpointService);
  activatedRoute = inject(ActivatedRoute);
  private namespaceData = inject(KubeNamespaceDataService);
  private injector = inject(Injector);

  namespaceName: string;
  kubeGuid: string;
  namespace$: Observable<KubernetesNamespace>;

  constructor() {
    const kubeEndpointService = this.kubeEndpointService;
    const activatedRoute = this.activatedRoute;


    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    // Prime the per-endpoint namespace cache, then project the one by name.
    void this.namespaceData.refresh({ kubeGuid: this.kubeGuid });
    const ns = this.namespaceData.namespaceByName(this.kubeGuid, this.namespaceName);
    this.namespace$ = toObservable(ns, { injector: this.injector }).pipe(
      filter((n): n is NonNullable<typeof n> => !!n),
      take(1),
      map(n => n as unknown as KubernetesNamespace),
    );
  }
}
