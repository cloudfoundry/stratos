import { Component, OnInit } from '@angular/core';

import { AppChip } from '../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { KubeAPIResource, PodLabel } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-pod-tags',
  templateUrl: './kubernetes-pod-tags.component.html',
  styleUrls: ['./kubernetes-pod-tags.component.scss']
})
export class KubernetesPodTagsComponent<T> extends TableCellCustom<KubeAPIResource> implements OnInit {

  tags: AppChip<PodLabel>[] = [];

  constructor() {
    super();
  }

  ngOnInit() {
    const labels = this.row.metadata.labels;
    for (const label in labels) {
      if (labels.hasOwnProperty(label)) {
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
