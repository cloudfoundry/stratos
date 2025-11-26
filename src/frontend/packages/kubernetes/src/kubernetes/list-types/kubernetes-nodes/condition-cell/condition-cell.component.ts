import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

import { BooleanIndicatorComponent } from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import type { ConditionType, KubernetesNode } from '../../../store/kube.types';

interface ConditionCellConfig {
  conditionType: ConditionType;
}

@Component({
  selector: 'app-condition-cell',
  templateUrl: './condition-cell.component.html',
  styleUrls: ['./condition-cell.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BooleanIndicatorComponent]
})
export class ConditionCellComponent extends TableCellCustom<KubernetesNode> implements OnInit {
  public isTrue: boolean = null;

  public subtle = false;

  public inverse = false;

  ngOnInit() {
    const config = this.config as ConditionCellConfig;
    const conditions = this.row.status.conditions.filter(c => c.type === config.conditionType);
    if (conditions?.length) {
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
