import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { KubernetesApp, KubeService } from '../store/kube.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { GetKubernetesApps, GetKubernetesServices } from '../store/kubernetes.actions';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { entityFactory, kubernetesAppsSchemaKey, kubernetesServicesSchemaKey } from '../../../store/helpers/entity-factory';
import { filter, map, share, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { KubernetesService } from './kubernetes.service';

@Injectable()
export class HelmReleaseService {
  kubeGuid: string;
  helmReleaseName: string;
  helmRelease$: Observable<KubernetesApp>;
  // helmReleaseServices$: Observable<KubeService[]>;

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
    // const servicesAction = new GetKubernetesServices(this.kubeGuid);

    // this.helmReleaseServices$ = getPaginationObservables<KubeService>({
    //   store: this.store,
    //   action: servicesAction,
    //   paginationMonitor: this.paginationMonitorFactory.create(
    //     servicesAction.paginationKey,
    //     entityFactory(kubernetesServicesSchemaKey)
    //   )
    // }, true).entities$.pipe(
    //   filter(p => !!p),
    //   map(svcs => {
    //     svcs.filter(s => s.metadata.labels &&
    //       s.metadata.labels['release'] &&
    //       s.metadata.labels['release'] === this.helmReleaseName);
    //   })

    // )
  }
}
