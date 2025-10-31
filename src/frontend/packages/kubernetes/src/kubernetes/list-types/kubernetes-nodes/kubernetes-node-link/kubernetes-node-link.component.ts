import {Component, OnInit, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomTooltipDirective } from '@stratosui/core';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-link',
  templateUrl: './kubernetes-node-link.component.html',
  styleUrls: ['./kubernetes-node-link.component.scss'],
  standalone: true,
  imports: [RouterLink, CustomTooltipDirective]
})
export class KubernetesNodeLinkComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  public nodeLink: string;

  public icon: {
    icon: string,
    class: string,
    message: string,
  };
  private kubeEndpointService = inject(KubernetesEndpointService);

  ngOnInit() {
    this.nodeLink = `/kubernetes/${this.kubeEndpointService.kubeGuid}/nodes/${this.row.metadata.name}`;
    const caaspNodeData = this.kubeEndpointService.getCaaspNodeData(this.row);
    if (caaspNodeData) {
      if (caaspNodeData.securityUpdates) {
        this.icon = {
          icon: 'error',
          class: 'error',
          message: 'Node has security updates'
        };
      } else if (caaspNodeData.disruptiveUpdates) {
        this.icon = {
          icon: 'warning',
          class: 'warning',
          message: 'Node has disruptive updates'
        };
      }
    }
  }

}
