import { Component, ChangeDetectionStrategy } from '@angular/core';

import { CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';

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
export class KubernetesNodeConditionCardComponent {}
