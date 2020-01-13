import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

import { CardCell } from '../../../../../shared/components/list/list.types';
import { HelmReleaseService } from '../../workload.types';

@Component({
  selector: 'app-helm-service-ports',
  templateUrl: './helm-service-ports.component.html',
  styleUrls: ['./helm-service-ports.component.scss']
})
export class HelmServicePortsComponent extends CardCell<HelmReleaseService> {

  private pRow: HelmReleaseService;
  public kubeService$: Observable<HelmReleaseService>;
  // Used when extending this class
  public endpointId: string;

  @Input() set row(row: HelmReleaseService) {
    if (!row) {
      return;
    }
    this.pRow = row;
    // this.kubeService$ = of(row as KubeService);
    // this.kubeService$ = helmReleaseService.kubeService$;
    this.endpointId = row.endpointId;
  }
  get row(): HelmReleaseService {
    return this.pRow;
  }

  getServiceLink(service: HelmReleaseService, port: { name: string }): string {
    return `/kubernetes/svcproxy/${this.endpointId}/${service.metadata.namespace}/${service.metadata.name}/${port.name}`;
  }
}
