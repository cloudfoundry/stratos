import { TableCellCustom } from '../../table-cell/table-cell-custom';
import { Component, OnInit, Input } from '@angular/core';
import { isTCPRoute, getRoute } from '../../../../../features/applications/routes/routes.helper';
@Component({
  selector: 'app-table-cell-route',
  templateUrl: './table-cell-route.component.html',
  styleUrls: ['./table-cell-route.component.scss']
})
export class TableCellRouteComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('row') row;
  routeUrl: string;
  isRouteTCP: boolean;
  constructor() {
    super();
   }

  ngOnInit() {
    this.routeUrl = getRoute(this.row);
    this.isRouteTCP = isTCPRoute(this.row);
  }
}
