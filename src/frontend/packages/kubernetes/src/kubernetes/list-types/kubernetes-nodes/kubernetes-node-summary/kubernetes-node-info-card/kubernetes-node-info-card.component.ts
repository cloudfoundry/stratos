import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { MetadataItemComponent } from '@stratosui/core';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-info-card',
  templateUrl: './kubernetes-node-info-card.component.html',
  styleUrls: ['./kubernetes-node-info-card.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    MatCardModule,
    MetadataItemComponent
  ]
})
export class KubernetesNodeInfoCardComponent {
  constructor( public kubeNodeService: KubernetesNodeService ) {}
}
