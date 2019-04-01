import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { HelmReleaseService } from '../../store/helm.types';

@Component({
  selector: 'app-kubernetes-service-ports',
  templateUrl: './kubernetes-service-ports.component.html',
  styleUrls: ['./kubernetes-service-ports.component.scss']
})
export class KubernetesServicePortsComponent extends TableCellCustom<HelmReleaseService> {
  @Input() row: HelmReleaseService;
}
