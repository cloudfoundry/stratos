import { Component, Input } from '@angular/core';

import {
  KubernetesServicePortsComponent,
} from '../../../kubernetes/list-types/kubernetes-service-ports/kubernetes-service-ports.component';
import { HelmReleaseService } from '../../store/helm.types';

@Component({
  selector: 'app-helm-service-ports',
  templateUrl: '../../../kubernetes/list-types/kubernetes-service-ports/kubernetes-service-ports.component.html',
  styleUrls: ['../../../kubernetes/list-types/kubernetes-service-ports/kubernetes-service-ports.component.scss']
})
export class HelmServicePortsComponent extends KubernetesServicePortsComponent {

  @Input() set row(row: any) {
    if (!row) {
      return;
    }
    const helmReleaseService = (row as HelmReleaseService);
    this.kubeService$ = helmReleaseService.kubeService$;
    this.endpointId = helmReleaseService.endpointId;
  }
}
