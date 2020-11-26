import { Component, Input } from '@angular/core';

import { CardCell } from '../../../../../core/src/shared/components/list/list.types';
import { KubeService } from '../../store/kube.types';

@Component({
  selector: 'app-kubernetes-service-ports',
  templateUrl: './kubernetes-service-ports.component.html',
  styleUrls: ['./kubernetes-service-ports.component.scss']
})
export class KubernetesServicePortsComponent extends CardCell<KubeService> {
  @Input()
  get row(): KubeService {
    return super.row;
  }
  set row(row: KubeService) {
    super.row = row;
  }
}
