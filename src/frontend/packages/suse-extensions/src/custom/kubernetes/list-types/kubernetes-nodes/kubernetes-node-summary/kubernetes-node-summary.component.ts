import { Component } from '@angular/core';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-summary',
  templateUrl: './kubernetes-node-summary.component.html',
  styleUrls: ['./kubernetes-node-summary.component.scss']
})
export class KubernetesNodeSummaryComponent {
  constructor(
    public kubeNodeService: KubernetesNodeService
  ) { }
}
