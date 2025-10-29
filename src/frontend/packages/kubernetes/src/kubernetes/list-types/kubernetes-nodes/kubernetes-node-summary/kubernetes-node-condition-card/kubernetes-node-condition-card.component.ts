import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';

import { CaaspNodeData, KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeConditionComponent } from './kubernetes-node-condition/kubernetes-node-condition.component';

@Component({
  selector: 'app-kubernetes-node-condition-card',
  templateUrl: './kubernetes-node-condition-card.component.html',
  styleUrls: ['./kubernetes-node-condition-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    KubernetesNodeConditionComponent
  ]
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
    );

    this.caaspNodSecurity$ = this.caaspNode$.pipe(
      map(node => node.securityUpdates)
    );
  }
}
