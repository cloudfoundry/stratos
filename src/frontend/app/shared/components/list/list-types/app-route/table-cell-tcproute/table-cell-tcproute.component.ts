import { TableCellCustom } from '../../../list.types';
import { Component, OnInit, Input } from '@angular/core';
import { isTCPRoute } from '../../../../../../features/applications/routes/routes.helper';

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
