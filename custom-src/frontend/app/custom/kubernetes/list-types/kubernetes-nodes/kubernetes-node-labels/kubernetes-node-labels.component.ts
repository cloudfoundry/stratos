import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-labels',
  templateUrl: './kubernetes-node-labels.component.html',
  styleUrls: ['./kubernetes-node-labels.component.scss']
})
export class KubernetesNodeLabelsComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  labels: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.labels = Object.entries(this.row.metadata.labels)
      .map(([key, value]) => `${key}:${value}`)
      .join(', ');
  }

}
