import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { ConditionType, ConditionTypeLabels, KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-pressure',
  templateUrl: './kubernetes-node-pressure.component.html',
  styleUrls: ['./kubernetes-node-pressure.component.scss']
})
export class KubernetesNodePressureComponent extends TableCellCustom<KubernetesNode> implements OnInit {

  errors: string[] = [];

  constructor() {
    super();
  }

  ngOnInit() {
    const conditions = this.row.status.conditions;
    this.errors = conditions
      .filter(c => c.type !== ConditionType.Ready)
      .filter(c => c.status === 'True')
      .map(condition => ConditionTypeLabels[condition.type] || condition.type);
  }
}
