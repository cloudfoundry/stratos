import { Component , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent, TableCellCustom } from '@stratosui/core';
import { StServiceOffering } from '../../../../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-table-cell-service-active',
  templateUrl: './table-cell-service-active.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellServiceActiveComponent extends TableCellCustom<StServiceOffering>  { }
