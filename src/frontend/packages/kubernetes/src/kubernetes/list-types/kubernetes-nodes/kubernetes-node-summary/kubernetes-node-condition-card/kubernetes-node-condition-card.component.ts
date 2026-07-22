import {Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';

import { CaaspNodeData, KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeConditionComponent } from './kubernetes-node-condition/kubernetes-node-condition.component';

@Component({
  selector: 'app-kubernetes-node-condition-card',
  templateUrl: './kubernetes-node-condition-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    KubernetesNodeConditionComponent
]
})
export class KubernetesNodeConditionCardComponent {
  public caaspNode$: Observable<CaaspNodeData | undefined>;
  public caaspNodeDisruptive$: Observable<boolean>;
  public caaspNodSecurity$: Observable<boolean>;  public kubeEndpointService = inject(KubernetesEndpointService);
  public kubeNodeService = inject(KubernetesNodeService);



  constructor() {


    this.caaspNode$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => this.kubeEndpointService.getCaaspNodeData(node)),
    );

    this.caaspNodeDisruptive$ = this.caaspNode$.pipe(
      // A node without CaaSP annotations has no pending disruptive updates
      map(node => node?.disruptiveUpdates ?? false)
    );

    this.caaspNodSecurity$ = this.caaspNode$.pipe(
      // A node without CaaSP annotations has no pending security updates
      map(node => node?.securityUpdates ?? false)
    );


  }
}
