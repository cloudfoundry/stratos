import { Component, OnInit } from '@angular/core';

import { AppChip } from '../../../../shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { KubeAPIResource } from '../../store/kube.types';


@Component({
  selector: 'app-kubernetes-labels-cell',
  templateUrl: './kubernetes-labels-cell.component.html',
  styleUrls: ['./kubernetes-labels-cell.component.scss']
})
export class KubernetesLabelsCellComponent extends TableCellCustom<KubeAPIResource> implements OnInit {

  chipsConfig: AppChip<KubeAPIResource>[];

  constructor() {
    super();
  }

  ngOnInit() {
    this.chipsConfig = Object.entries(this.row.metadata.labels).map(([key, value]) => ({
      value: `${key}:${value}`
    }));
  }
}
