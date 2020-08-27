import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CaaspNodeData, KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-summary-card',
  templateUrl: './kubernetes-node-summary-card.component.html',
  styleUrls: ['./kubernetes-node-summary-card.component.scss']
})
export class KubernetesNodeSummaryCardComponent {
  public caaspVersion$: Observable<string>;
  public caaspNode$: Observable<CaaspNodeData>;
  public caaspNodeUpdates$: Observable<boolean>;
  public caaspNodeDisruptive$: Observable<boolean>;
  public caaspNodeSecurity$: Observable<boolean>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public kubeNodeService: KubernetesNodeService
  ) {
    this.caaspNode$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => kubeEndpointService.getCaaspNodeData(node)),
    );

    this.caaspNodeUpdates$ = this.caaspNode$.pipe(
      map(node => node.updates)
    )

    this.caaspNodeDisruptive$ = this.caaspNode$.pipe(
      map(node => node.disruptiveUpdates)
    )

    this.caaspNodeSecurity$ = this.caaspNode$.pipe(
      map(node => node.securityUpdates)
    )
  }
}
