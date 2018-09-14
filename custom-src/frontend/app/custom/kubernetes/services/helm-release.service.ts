import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, share, tap, first } from 'rxjs/operators';
import { combineLatest, Observable, of as observableOf } from 'rxjs';

import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import {
  entityFactory,
  kubernetesAppsSchemaKey,
  kubernetesDeploymentsSchemaKey,
  kubernetesStatefulSetsSchemaKey,
} from '../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { KubernetesApp, KubernetesDeployment, KubernetesStatefuleSet, KubernetesPod } from '../store/kube.types';
import { GeKubernetesDeployments, GetKubernetesApps, GetKubernetesStatefulSets } from '../store/kubernetes.actions';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

@Injectable()
export class HelmReleaseService {
  kubeGuid: string;
  helmReleaseName: string;
  helmRelease$: Observable<KubernetesApp>;
  deployments$: Observable<KubernetesDeployment[]>;
  statefulSets$: Observable<KubernetesStatefuleSet[]>;

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
      action: action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(kubernetesAppsSchemaKey)
      )
    }, true).entities$.pipe(
      filter(p => !!p),
      map(p => p.filter(r => r.name === this.helmReleaseName)[0]),
      share()
    );

    const statefulSetsAction = new GetKubernetesStatefulSets(this.kubeGuid);

    this.statefulSets$ = getPaginationObservables<KubernetesStatefuleSet>({
      store: this.store,
      action: statefulSetsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        statefulSetsAction.paginationKey,
        entityFactory(kubernetesStatefulSetsSchemaKey)
      )
    }, true).entities$.pipe(
      filter(p => !!p),
      map(p => p.filter(r => r.metadata.labels['release'] === this.helmReleaseName)),
      first(),
    );

    const deploymentsAction = new GeKubernetesDeployments(this.kubeGuid);

    this.deployments$ = getPaginationObservables<KubernetesDeployment>({
      store: this.store,
      action: deploymentsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        deploymentsAction.paginationKey,
        entityFactory(kubernetesDeploymentsSchemaKey)
      )
    }, true).entities$.pipe(
      filter(p => !!p),
      map(p => {
        return p.filter(r => {
          return r.metadata.labels['release'] === this.helmReleaseName;
        });

      }),
      first()
    );
  }

  public getReleasePods(pods: Observable<KubernetesPod[]>): Observable<KubernetesPod[]> {
    return combineLatest(this.deployments$, this.statefulSets$, pods).pipe(
      tap(o => console.log('In Combine!')),
      map(([deployments, statefulSets, allPods]) => {
        console.log(allPods);
        return allPods.filter(p => {
          const podName = p.metadata.name;
          const filteredDeployments = deployments.filter(d => podName.startsWith(d.metadata.name));
          const filteredStatefulSets = statefulSets.filter(d => podName.startsWith(d.metadata.name));
          console.log('Filtering pod: ' + podName);
          return filteredDeployments.length !== 0 || filteredStatefulSets.length !== 0;
        });
      })
    );
  }

}
