import { AsyncPipe, DatePipe } from '@angular/common';
import {Component, inject} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MetadataItemComponent } from '@stratosui/core';
import { CaaspNodeData, KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-summary-card',
  templateUrl: './kubernetes-node-summary-card.component.html',
  styleUrls: ['./kubernetes-node-summary-card.component.scss'],
  imports: [
    AsyncPipe,
    DatePipe,
    MetadataItemComponent
  ],
  standalone: true
})
export class KubernetesNodeSummaryCardComponent {
  public caaspVersion$: Observable<string>;
  public caaspNode$: Observable<CaaspNodeData>;
  public caaspNodeUpdates$: Observable<boolean>;
  public caaspNodeDisruptive$: Observable<boolean>;
  public caaspNodeSecurity$: Observable<boolean>;  public kubeEndpointService = inject(KubernetesEndpointService);
  public kubeNodeService = inject(KubernetesNodeService);



  constructor() {


    this.caaspNode$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => {
        const nodeData = this.kubeEndpointService.getCaaspNodeData(node);
        return !!nodeData.version ? nodeData : null;
      }),
    );

    this.caaspNodeUpdates$ = this.caaspNode$.pipe(
      map(node => node.updates)
    );

    this.caaspNodeDisruptive$ = this.caaspNode$.pipe(
      map(node => node.disruptiveUpdates)
    );

    this.caaspNodeSecurity$ = this.caaspNode$.pipe(
      map(node => node.securityUpdates)
    );


  }
}
