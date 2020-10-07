import { Component } from '@angular/core';
import { TableCellCustom } from 'frontend/packages/core/src/shared/components/list/list.types';

@Component({
  selector: 'app-analysis-status-cell',
  templateUrl: './analysis-status-cell.component.html',
  styleUrls: ['./analysis-status-cell.component.scss']
})
export class AnalysisStatusCellComponent extends TableCellCustom<any> {

  constructor() {
    super();
    this.row = {};
  }

 }
