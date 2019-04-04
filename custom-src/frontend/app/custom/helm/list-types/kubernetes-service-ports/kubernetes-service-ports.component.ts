import { Component, Input } from '@angular/core';
import { Observable, of } from 'rxjs';

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
  public kubeService$: Observable<KubeService>;
  public endpointId: string;

  @Input() set row(row: HelmReleaseService | KubeService) {
    if (!row) {
      return;
    }
    this.pRow = row;
    // TODO: RC update with proper typing & somehow pipe in endpointId for `KubeService` world
    /* tslint:disable-next-line:no-string-literal */
    if (row['kubeService$']) {
      this.kubeService$ = (row as HelmReleaseService).kubeService$;
      const helmReleaseService: HelmReleaseService = row as HelmReleaseService;
      this.endpointId = helmReleaseService.endpointId;
    } else {
      this.kubeService$ = of(row as KubeService);
    }
  }
  get row(): HelmReleaseService | KubeService {
    return this.pRow;
  }


  getServiceLink(service: KubeService, port: { name: string }): string {
    return `/kubernetes/${this.endpointId}/svcproxy/${service.metadata.namespace}/${service.metadata.name}/${port.name}`;
  }
}
