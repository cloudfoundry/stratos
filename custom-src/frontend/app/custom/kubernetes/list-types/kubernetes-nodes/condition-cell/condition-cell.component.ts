import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { KubernetesNode } from '../../../store/kube.types';

@Component({
  selector: 'app-condition-cell',
  templateUrl: './condition-cell.component.html',
  styleUrls: ['./condition-cell.component.scss']
})
export class ConditionCellComponent extends TableCellCustom<KubernetesNode> implements OnInit {
  public isTrue: boolean = null;

  public subtle = false;

  public inverse = false;

  constructor() {
    super();
  }

  ngOnInit() {
    const condition = this.row.status.conditions.filter(c => c.type === this.config.conditionType)[0];
    if (condition) {
      switch (condition.status) {
        case 'True':
          this.isTrue = true;
          break;
        case 'False':
          this.isTrue = false;
          break;
      }
    }
  }

}

export class SubtleConditionCellComponent extends ConditionCellComponent {

  constructor() {
    super();
    this.subtle = true;
  }
}


export class InverseConditionCellComponent extends ConditionCellComponent {

  constructor() {
    super();
    this.inverse = true;
  }
}
