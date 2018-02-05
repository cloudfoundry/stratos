import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { Component, OnInit, Input } from '@angular/core';
import { isTCPRoute } from '../../../../../../features/applications/routes/routes.helper';

@Component({
  selector: 'app-table-cell-tcp-route',
  templateUrl: './table-cell-tcproute.component.html',
  styleUrls: ['./table-cell-tcproute.component.scss']
})
export class TableCellTCPRouteComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('row') row;
  isRouteTCP: boolean;
  constructor() {
    super();
  }

  ngOnInit() {
    this.isRouteTCP = isTCPRoute(this.row);
  }

}
