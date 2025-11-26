import { ChangeDetectionStrategy, Component, type OnInit} from '@angular/core';
import { CustomTooltipDirective, TableCellCustom } from '@stratosui/core';
import { KubernetesAddressExternal, KubernetesAddressInternal, type KubernetesNode } from '../../../store/kube.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-ips',
  templateUrl: './kubernetes-node-ips.component.html',
  styleUrls: ['./kubernetes-node-ips.component.scss'],
  standalone: true,
  imports: [
    CustomTooltipDirective,
  ]
})
export class KubernetesNodeIpsComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  tooltip: string;

  ngOnInit() {
    this.tooltip = this.row.status.addresses
      .filter(address => address.type === KubernetesAddressInternal || address.type === KubernetesAddressExternal)
      .map(address => address.address)
      .join(', ');
  }

}
