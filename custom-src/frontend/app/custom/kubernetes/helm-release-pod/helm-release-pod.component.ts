import { Component, OnInit } from '@angular/core';
import { HelmReleaseService } from '../services/helm-release.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { kubernetesPodsSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { KubernetesPod } from '../store/kube.types';
import { GetKubernetesPod } from '../store/kubernetes.actions';
import { Observable } from 'rxjs';
import { EntityInfo } from '../../../store/types/api.types';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesService } from '../services/kubernetes.service';

@Component({
  selector: 'app-helm-release-pod',
  templateUrl: './helm-release-pod.component.html',
  styleUrls: ['./helm-release-pod.component.scss'],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.kubeId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    HelmReleaseService,
    KubernetesEndpointService
  ]
})
export class HelmReleasePodComponent implements OnInit {
  podName: string;
  podEntity$: Observable<EntityInfo<KubernetesPod>>;
  namespaceName: any;

  constructor(
    public helmReleaseService: HelmReleaseService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public entityServiceFactory: EntityServiceFactory,
    public kubeEndpointService: KubernetesEndpointService
  ) {
    this.podName = activatedRoute.snapshot.params['podName'];
    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');

    this.podEntity$ = this.entityServiceFactory.create<KubernetesPod>(
      kubernetesPodsSchemaKey,
      entityFactory(kubernetesPodsSchemaKey),
      this.podName,
      new GetKubernetesPod(this.podName, this.namespaceName, this.helmReleaseService.kubeGuid),
      false
    ).entityObs$;
  }

  ngOnInit() {
  }

}
