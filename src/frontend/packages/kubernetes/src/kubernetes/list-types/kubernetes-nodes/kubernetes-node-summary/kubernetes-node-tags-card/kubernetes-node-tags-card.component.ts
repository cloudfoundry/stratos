import { Component, computed, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';

import { AppChip, AppChipsComponent } from '../../../../../../../core/src/shared/components/chips/chips.component';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-tags-card',
  templateUrl: './kubernetes-node-tags-card.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    AppChipsComponent
  ]
})
export class KubernetesNodeTagsCardComponent {


  // Both hosts bind mode (the metadata key to list) and title.
  readonly mode = input.required<string>();

  readonly title = input.required<string>();

  public kubeNodeService = inject(KubernetesNodeService);

  readonly chipTags = computed((): AppChip[] => {
    const node = this.kubeNodeService.node();
    return node ? this.getTags((node.metadata as any)[this.mode()] ?? {}) : [];
  });

  private getTags(tags: Record<string, any>): AppChip[] {
    const labelEntries = Object.entries(tags);
    return labelEntries.map(t => ({
      value: `${t[0]}:${t[1]}`
    }));
  }
}
