import { ChangeDetectionStrategy, Component, type OnInit} from '@angular/core';

import { type AppChip, AppChipsComponent, TableCellCustom } from '@stratosui/core';
import type { KubeAPIResource, PodLabel } from '../../../store/kube.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-pod-tags',
  templateUrl: './kubernetes-pod-tags.component.html',
  styleUrls: ['./kubernetes-pod-tags.component.scss'],
  standalone: true,
  imports: [AppChipsComponent]
})
export class KubernetesPodTagsComponent<_T> extends TableCellCustom<KubeAPIResource> implements OnInit {

  tags: AppChip<PodLabel>[] = [];

  ngOnInit() {
    const labels = this.row.metadata.labels;
    for (const label in labels) {
      if (Object.hasOwn(labels, label)) {
        this.tags.push({
          value: `${label}:${labels[label]}`,
          key: {
            key: label,
            value: labels[label]
          }
        });
      }
    }
  }
}
