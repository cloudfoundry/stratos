import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
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
    const conditions = this.row.status.conditions.filter(c => c.type === this.config.conditionType);
    if (conditions && conditions.length) {
      const condition = conditions[0];
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
