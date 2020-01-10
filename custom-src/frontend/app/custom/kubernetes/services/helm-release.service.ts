import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, share } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { getIdFromRoute } from '../../../core/utils.service';
import { KubernetesApp, KubernetesDeployment, KubernetesPod, KubernetesStatefulSet, KubeService } from '../store/kube.types';
import { GetKubernetesApps, GetKubernetesServices } from '../store/kubernetes.actions';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

@Injectable()
export class HelmReleaseService {
  kubeGuid: string;
  helmReleaseName: string;
  helmRelease$: Observable<KubernetesApp>;
  deployments$: Observable<KubernetesDeployment[]>;
  statefulSets$: Observable<KubernetesStatefulSet[]>;
  services$: Observable<KubeService[]>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory
  ) {

    this.kubeGuid = kubeEndpointService.kubeGuid;
    this.helmReleaseName = getIdFromRoute(activatedRoute, 'releaseName');

    const action = new GetKubernetesApps(this.kubeGuid);

    this.helmRelease$ = getPaginationObservables<KubernetesApp>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        action
      )
    }, true).entities$.pipe(
      filter(p => !!p),
      map(p => p.filter(r => r.name === this.helmReleaseName)[0]),
      share()
    );

    this.statefulSets$ = kubeEndpointService.statefulSets$.pipe(
      map(p => p.filter(r => r.metadata.labels['app.kubernetes.io/instance'] === this.helmReleaseName)),
      first(),
    );

    this.deployments$ = kubeEndpointService.deployments$.pipe(
      map(p => p.filter(r => r.metadata.labels['app.kubernetes.io/instance'] === this.helmReleaseName)),
      first()
    );

    const servicesAction = new GetKubernetesServices(this.kubeGuid);

    this.services$ = getPaginationObservables<KubeService>({
      store: this.store,
      action: servicesAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        servicesAction.paginationKey,
        servicesAction
      )
    }, true).entities$.pipe(
      filter(p => !!p),
      map(p => {
        return p.filter(r => {
          return r.metadata.labels.release === this.helmReleaseName;
        });

      }),
      first()
    );
  }

  public getReleasePods(pods: Observable<KubernetesPod[]>): Observable<KubernetesPod[]> {
    return combineLatest(this.deployments$, this.statefulSets$, pods).pipe(
      map(([deployments, statefulSets, allPods]) => {
        return allPods.filter(p => {
          const podName = p.metadata.name;
          const filteredDeployments = deployments.filter(d => podName.startsWith(d.metadata.name));
          const filteredStatefulSets = statefulSets.filter(d => podName.startsWith(d.metadata.name));
          return filteredDeployments.length !== 0 || filteredStatefulSets.length !== 0;
        });
      })
    );
  }

}
