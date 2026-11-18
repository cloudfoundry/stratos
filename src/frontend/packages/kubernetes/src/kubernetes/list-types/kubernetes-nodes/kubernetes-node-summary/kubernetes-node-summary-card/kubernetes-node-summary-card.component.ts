import { DatePipe } from "@angular/common";
import { Component, computed, inject, ChangeDetectionStrategy } from "@angular/core";

import { MetadataItemComponent } from "@stratosui/core";
import {
  CaaspNodeData,
  KubernetesEndpointService,
} from "../../../../services/kubernetes-endpoint.service";
import { KubernetesNodeService } from "../../../../services/kubernetes-node.service";
import {
  KubernetesNodeConditionComponent,
} from "../kubernetes-node-condition-card/kubernetes-node-condition/kubernetes-node-condition.component";

@Component({
  selector: "app-kubernetes-node-summary-card",
  templateUrl: "./kubernetes-node-summary-card.component.html",
  imports: [DatePipe, MetadataItemComponent, KubernetesNodeConditionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class KubernetesNodeSummaryCardComponent {
  public kubeEndpointService = inject(KubernetesEndpointService);
  public kubeNodeService = inject(KubernetesNodeService);

  // The node's CaaSP data, null for a node that is not a CaaSP node.
  readonly caaspNode = computed((): CaaspNodeData | null => {
    const node = this.kubeNodeService.node();
    const nodeData = node ? this.kubeEndpointService.getCaaspNodeData(node) : undefined;
    return nodeData?.version ? nodeData : null;
  });
}
