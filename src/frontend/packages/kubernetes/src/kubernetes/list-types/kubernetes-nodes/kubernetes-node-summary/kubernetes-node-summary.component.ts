import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { TileGridComponent } from '@stratosui/core';
import { TileGroupComponent } from '@stratosui/core';
import { TileComponent } from '@stratosui/core';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card/kubernetes-node-summary-card.component';
import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card/kubernetes-node-info-card.component';
import { KubernetesNodeConditionCardComponent } from './kubernetes-node-condition-card/kubernetes-node-condition-card.component';
import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card/kubernetes-node-tags-card.component';

@Component({
  selector: 'app-kubernetes-node-summary',
  templateUrl: './kubernetes-node-summary.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    KubernetesNodeSummaryCardComponent,
    KubernetesNodeInfoCardComponent,
    KubernetesNodeConditionCardComponent,
    KubernetesNodeTagsCardComponent
  ]
})
export class KubernetesNodeSummaryComponent {  public kubeNodeService = inject(KubernetesNodeService);
}
