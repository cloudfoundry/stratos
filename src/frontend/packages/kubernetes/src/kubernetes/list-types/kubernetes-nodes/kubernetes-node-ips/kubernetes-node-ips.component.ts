import { ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import { CustomTooltipDirective } from '@stratosui/core';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubernetesAddressExternal, KubernetesAddressInternal, KubernetesNode } from '../../../store/kube.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-ips',
  templateUrl: './kubernetes-node-ips.component.html',
  standalone: true,
  imports: [
    CustomTooltipDirective,
  ]
})
export class KubernetesNodeIpsComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  tooltip: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.tooltip = this.row.status.addresses
      .filter(address => address.type === KubernetesAddressInternal || address.type === KubernetesAddressExternal)
      .map(address => address.address)
      .join(', ');
  }

}
