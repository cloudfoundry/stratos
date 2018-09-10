import { Injectable } from '@angular/core';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';

@Injectable()
export class HelmReleaseService {
  kubeGuid: string;
  helmReleaseName: string;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute
  ) {

    this.kubeGuid = kubeEndpointService.kubeGuid;
    this.helmReleaseName = getIdFromRoute(activatedRoute, 'releaseName');
  }
}
