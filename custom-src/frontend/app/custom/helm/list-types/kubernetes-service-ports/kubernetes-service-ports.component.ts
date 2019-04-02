import { Component, Input } from '@angular/core';

import { CardCell } from '../../../../shared/components/list/list.types';
import { KubeService } from '../../../kubernetes/store/kube.types';
import { HelmReleaseService } from '../../store/helm.types';

@Component({
  selector: 'app-kubernetes-service-ports',
  templateUrl: './kubernetes-service-ports.component.html',
  styleUrls: ['./kubernetes-service-ports.component.scss']
})
export class KubernetesServicePortsComponent extends CardCell<HelmReleaseService | KubeService> {
  private pRow: HelmReleaseService | KubeService;
  public endpointId: string;

  @Input() set row(row: HelmReleaseService | KubeService) {
    if (!row) {
      return;
    }
    this.pRow = row;
    // TODO: RC update with proper typing & somehow pipe in endpointId for `KubeService` world
    /* tslint:disable-next-line:no-string-literal */
    if (row['kubeService$']) {
      const helmReleaseService: HelmReleaseService = row as HelmReleaseService;
      this.endpointId = helmReleaseService.endpointId;
    }
  }
  get row(): HelmReleaseService | KubeService {
    return this.pRow;
  }


  getServiceLink(service: KubeService, port: { name: string }): string {
    return `/kubernetes/svcproxy/${this.endpointId}/${service.metadata.namespace}/${service.metadata.name}/${port.name}`;
  }
}
