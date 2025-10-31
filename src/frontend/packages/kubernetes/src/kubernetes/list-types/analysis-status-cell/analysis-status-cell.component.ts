import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomTooltipDirective } from '@stratosui/core';
import { TableCellCustom } from 'frontend/packages/core/src/shared/components/list/list.types';

@Component({
  selector: 'app-analysis-status-cell',
  templateUrl: './analysis-status-cell.component.html',
  styleUrls: ['./analysis-status-cell.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomTooltipDirective]
})
export class AnalysisStatusCellComponent extends TableCellCustom<any> {

  constructor() {
    super();
    this.row = {};
  }

}
