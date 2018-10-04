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
import { KubernetesApp, KubernetesDeployment, KubernetesStatefuleSet, KubernetesPod, KubeService } from '../store/kube.types';
import { GeKubernetesDeployments, GetKubernetesApps, GetKubernetesStatefulSets, GetKubernetesServices } from '../store/kubernetes.actions';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { kubernetesServicesSchemaKey } from '../../../../../../src/frontend/app/store/helpers/entity-factory';

@Injectable()
export class HelmReleaseService {
  kubeGuid: string;
  helmReleaseName: string;
  helmRelease$: Observable<KubernetesApp>;
  deployments$: Observable<KubernetesDeployment[]>;
  statefulSets$: Observable<KubernetesStatefuleSet[]>;
  services$:  Observable<KubeService[]>;

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

    this.statefulSets$ = kubeEndpointService.statefulSets$.pipe(
      map(p => p.filter(r => r.metadata.labels['release'] === this.helmReleaseName)),
      first(),
    );

    this.deployments$ = kubeEndpointService.deployments$.pipe(
      map(p => {
        return p.filter(r => {
          return r.metadata.labels['release'] === this.helmReleaseName;
        });

      }),
      first()
    );

    const servicesAction = new GetKubernetesServices(this.kubeGuid);

    this.services$ = getPaginationObservables<KubeService>({
      store: this.store,
      action: servicesAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        servicesAction.paginationKey,
        entityFactory(kubernetesServicesSchemaKey)
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
