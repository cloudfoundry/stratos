import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CaaspNodeData, KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-condition-card',
  templateUrl: './kubernetes-node-condition-card.component.html',
  styleUrls: ['./kubernetes-node-condition-card.component.scss']
})
export class KubernetesNodeConditionCardComponent {
  public caaspNode$: Observable<CaaspNodeData>;
  public caaspNodeDisruptive$: Observable<boolean>;
  public caaspNodSecurity$: Observable<boolean>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public kubeNodeService: KubernetesNodeService
  ) {

    this.caaspNode$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => kubeEndpointService.getCaaspNodeData(node)),
    );

    this.caaspNodeDisruptive$ = this.caaspNode$.pipe(
      map(node => node.disruptiveUpdates)
    )

    this.caaspNodSecurity$ = this.caaspNode$.pipe(
      map(node => node.securityUpdates)
    )
  }
}
