import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-link',
  templateUrl: './kubernetes-node-link.component.html',
  styleUrls: ['./kubernetes-node-link.component.scss']
})
export class KubernetesNodeLinkComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  public nodeLink;
  constructor(
    private kubeEndpointService: KubernetesEndpointService
  ) {
    super();
  }

  ngOnInit() {
    this.nodeLink = `/kubernetes/${this.kubeEndpointService.kubeGuid}/nodes/${this.row.metadata.name}`;
  }

}
