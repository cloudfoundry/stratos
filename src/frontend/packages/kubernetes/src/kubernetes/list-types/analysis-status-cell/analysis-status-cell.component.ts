import { Component } from '@angular/core';
import { TableCellCustomComponent } from 'frontend/packages/core/src/shared/components/list/list.types';

@Component({
  selector: 'app-analysis-status-cell',
  templateUrl: './analysis-status-cell.component.html',
  styleUrls: ['./analysis-status-cell.component.scss']
})
export class AnalysisStatusCellComponent extends TableCellCustomComponent<any> {

  constructor() {
    super();
    this.row = {};
  }

}
