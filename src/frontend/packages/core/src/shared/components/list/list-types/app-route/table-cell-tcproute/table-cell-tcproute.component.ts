import { TableCellCustom } from '../../../list.types';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-cell-tcp-route',
  templateUrl: './table-cell-tcproute.component.html',
  styleUrls: ['./table-cell-tcproute.component.scss']
})
export class TableCellTCPRouteComponent<T> extends TableCellCustom<T> {

  @Input() row;
  constructor() {
    super();
  }
}
