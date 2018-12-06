import { Component } from '@angular/core';

import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-app-route',
  templateUrl: './table-cell-app-route.component.html',
  styleUrls: ['./table-cell-app-route.component.scss']
})
export class TableCellAppRouteComponent<T> extends TableCellCustom<T> { }
