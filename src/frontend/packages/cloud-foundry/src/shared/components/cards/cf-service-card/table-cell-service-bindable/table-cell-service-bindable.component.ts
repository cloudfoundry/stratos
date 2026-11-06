import { Component , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent, TableCellCustom } from '@stratosui/core';
import { StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-table-cell-service-bindable',
  templateUrl: './table-cell-service-bindable.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellServiceBindableComponent extends TableCellCustom<StServiceOffering>  { }
