import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { Condition, KubernetesNode } from '../../../store/kube.types';
import { ConditionalExpr } from '@angular/compiler';

@Component({
  selector: 'app-condition-cell',
  templateUrl: './condition-cell.component.html',
  styleUrls: ['./condition-cell.component.scss']
})
export class ConditionCellComponent extends TableCellCustom<KubernetesNode> implements OnInit {
  condition: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.condition = this.row.status.conditions.filter(c => c.type === this.config.conditionType)[0].status;
    console.log(this.condition);
  }

}
