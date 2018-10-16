import { Component, OnInit } from '@angular/core';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { Observable } from 'rxjs';
import { AppChip } from '../../../../../shared/components/chips/chips.component';
import { KubernetesNode } from '../../../store/kube.types';
import { map } from 'rxjs/operators';

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
