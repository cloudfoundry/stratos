import {Component, inject} from '@angular/core';
import { KubernetesNodeService } from '../../../services/kubernetes-node.service';
import { TileGridComponent } from 'frontend/packages/core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from 'frontend/packages/core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from 'frontend/packages/core/src/shared/components/tile/tile/tile.component';
import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card/kubernetes-node-summary-card.component';
import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card/kubernetes-node-info-card.component';
import { KubernetesNodeConditionCardComponent } from './kubernetes-node-condition-card/kubernetes-node-condition-card.component';
import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card/kubernetes-node-tags-card.component';

@Component({
  selector: 'app-kubernetes-node-summary',
  templateUrl: './kubernetes-node-summary.component.html',
  styleUrls: ['./kubernetes-node-summary.component.scss'],
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
