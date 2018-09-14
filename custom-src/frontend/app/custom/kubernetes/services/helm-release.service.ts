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
  deployments: KubernetesDeployment[];
  statefulSets: KubernetesStatefuleSet[];

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


    console.log('Executing contructor!!!!!');
    const statefulSetsAction = new GetKubernetesStatefulSets(this.kubeGuid);

    const statefulSets$ = getPaginationObservables<KubernetesStatefuleSet>({
      store: this.store,
      action: statefulSetsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(kubernetesStatefulSetsSchemaKey)
      )
    }, true).entities$.pipe(
      filter(p => !!p),
      tap(statefuleSets => {
        console.log(statefuleSets);
      }),
      map(p => p.filter(r => r.metadata.labels['release'] === this.helmReleaseName)),
      tap(statefuleSets => this.statefulSets = statefuleSets),
      first(),
    );

    statefulSets$.subscribe();

    const deploymentsAction = new GeKubernetesDeployments(this.kubeGuid);

    const deployments$ = getPaginationObservables<KubernetesDeployment>({
      store: this.store,
      action: deploymentsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(kubernetesDeploymentsSchemaKey)
      )
    }, true).entities$.pipe(
      tap(deployments => {
        console.log(deployments);

      }),
      filter(p => !!p),
      tap(deployments => {
        console.log(deployments);

      }),
      map(p => {
        console.log(p);
        return p.filter(r => {
          return r.metadata.labels['release'] === this.helmReleaseName;
        });

      }),
      tap(deployments => {
        this.deployments = deployments;
        console.log(deployments);

      }),
      first()
    );

    deployments$.subscribe(() => {
      console.log('Subscribed!');
    }
    );
  }

  public isReleasePod(pod: KubernetesPod): boolean {

    // console.log(this.statefulSets);
    // console.log(this.deployments);
    return true;


  }


}
