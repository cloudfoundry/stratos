import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesAddressExternal, KubernetesAddressInternal, KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-ips',
  templateUrl: './kubernetes-node-ips.component.html',
  styleUrls: ['./kubernetes-node-ips.component.scss']
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
