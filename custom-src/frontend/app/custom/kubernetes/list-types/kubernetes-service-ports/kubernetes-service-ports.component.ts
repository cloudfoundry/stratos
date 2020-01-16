import { Component, Input } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CardCell } from '../../../../shared/components/list/list.types';
import { KubeService } from '../../../kubernetes/store/kube.types';

@Component({
  selector: 'app-kubernetes-service-ports',
  templateUrl: './kubernetes-service-ports.component.html',
  styleUrls: ['./kubernetes-service-ports.component.scss']
})
export class KubernetesServicePortsComponent extends CardCell<KubeService> {
  private pRow: KubeService;
  public kubeService$: Observable<KubeService>;
  // Used when extending this class
  public endpointId: string;

  @Input() set row(row: KubeService) {
    if (!row) {
      return;
    }
    this.pRow = row;
    this.kubeService$ = of(row as KubeService);
    /* tslint:disable-next-line:no-string-literal  */
    this.endpointId = row['endpointId'];
  }
  get row(): KubeService {
    return this.pRow;
  }


  getServiceLink(service: KubeService, port: { name: string }): string {
    return `/kubernetes/svcproxy/${this.endpointId}/${service.metadata.namespace}/${service.metadata.name}/${port.name}`;
  }
}
