import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-condition-cell',
  templateUrl: './condition-cell.component.html',
  styleUrls: ['./condition-cell.component.scss']
})
export class ConditionCellComponent extends TableCellCustom<KubernetesNode> implements OnInit {
  condition: string;

  inverse = false;

  constructor() {
    super();
  }

  ngOnInit() {

    const condition = this.row.status.conditions.filter(c => c.type === this.config.conditionType);
    if (condition && condition.length === 1) {
      this.condition = condition[0].status;
    }
  }

}


export class InverseConditionCellComponent extends ConditionCellComponent {

  constructor() {
    super();
    this.inverse = true;
  }
}
