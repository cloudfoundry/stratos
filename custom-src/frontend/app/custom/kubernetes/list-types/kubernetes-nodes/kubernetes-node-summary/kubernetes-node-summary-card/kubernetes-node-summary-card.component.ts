import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { KubernetesNode } from '../../../../store/kube.types';
import { AppChip } from '../../../../../../shared/components/chips/chips.component';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-summary-card',
  templateUrl: './kubernetes-node-summary-card.component.html',
  styleUrls: ['./kubernetes-node-summary-card.component.scss']
})
export class KubernetesNodeSummaryCardComponent {
  node$: Observable<KubernetesNode>;
  labels$: Observable<AppChip[]>;
  annotations$: Observable<AppChip[]>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public kubeNodeService: KubernetesNodeService
  ) { }
}
