import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomTooltipDirective, ProgressSpinnerComponent, TableCellCustom } from '@stratosui/core';

@Component({
  selector: 'app-analysis-status-cell',
  templateUrl: './analysis-status-cell.component.html',
  styleUrls: ['./analysis-status-cell.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomTooltipDirective, ProgressSpinnerComponent]
})
export class AnalysisStatusCellComponent extends TableCellCustom<any> {
  // row property is inherited from TableCellCustom base class
  // No constructor needed - base class handles initialization
}
