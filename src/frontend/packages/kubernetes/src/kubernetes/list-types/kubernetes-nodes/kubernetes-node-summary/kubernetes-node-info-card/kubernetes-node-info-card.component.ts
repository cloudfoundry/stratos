import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { MetadataItemComponent, CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-info-card',
  templateUrl: './kubernetes-node-info-card.component.html',
  host: { class: 'h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    MetadataItemComponent
  ]
})
export class KubernetesNodeInfoCardComponent {
  public kubeNodeService = inject(KubernetesNodeService);
}
